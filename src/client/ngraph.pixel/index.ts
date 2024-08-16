import THREE from "three";
import type { Graph, Node, Link } from "ngraph.graph";
import createLayout, { type PhysicsSettings} from "ngraph.forcelayout";

import createNodeView from "./lib/createNodeView.js";
import createEdgeView from "./lib/createEdgeView.js";
import createTooltipView from "./lib/tooltip.js";
import createInput from "./lib/input.js";
import type { MouseLocation } from "./lib/hitTest.js";
import validateOptions from "./options.js";

export type Coord = { x: number; y: number; z: number };

export type Options = PhysicsSettings & {
  /**
   * Where to render the graph? Assume `document.body` by default.
   */
  container: HTMLElement;
  /**
   * Background of the scene in hexadecimal form. Default value is 0x000000 (black);
   */
  clearColor: number;
  /**
   * Clear color opacity from 0 (transparent) to 1 (opaque); Default value is 1;
   */
  clearAlpha: number;
  /**
   * Experimental API: How link should be rendered?
   */
  node: (node: Node) => Partial<NodeModel>;
  /**
   * Experimental API: How node should be rendered?
   */
  link: (link: Link) => Partial<EdgeModel>;
};

export type NodeModel = {
  idx: number;
  id: string | number;
  position: Coord;
  size: number;
  color: number;
};

export type EdgeModel = {
  idx: number;
  from: NodeModel;
  to: NodeModel;
  fromColor: number;
  toColor: number;
};

export default function pixel(graph: Graph, inputOptions: Partial<Options>) {
  const options = validateOptions(inputOptions);

  const container = options.container;
  verifyContainerDimensions(container);

  const layout = createLayout(graph, options);
  let isStable = false;
  let shouldStep = true;
  const nodeIdToIdx = new Map<string | number, number>();
  const edgeIdToIndex = new Map<string | number, number>();
  const edges: EdgeModel[] = [];
  const nodes: NodeModel[] = [];
  const tooltipView = createTooltipView(container);

  const scene = new THREE.Scene();
  scene.sortObjects = false;

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    20000,
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 200;

  scene.add(camera);

  const glOptions: THREE.WebGLRendererParameters = {
    antialias: false,
  };
  if (options.clearAlpha !== 1) {
    glOptions.alpha = true;
  }

  const renderer = new THREE.WebGLRenderer(glOptions);

  renderer.setClearColor(options.clearColor, options.clearAlpha);
  if (window && window.devicePixelRatio)
    renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const input = createInput(camera, graph, renderer.domElement, layout);
  input.on("move", () => {});
  input.on("nodeover", (e: MouseLocation) => {
    const nodeUI = nodes[e.nodeIndex!];
    const node = nodeUI ? graph.getNode(nodeUI.id) : undefined;
    if (node !== undefined) {
      tooltipView.show(e, node);
    } else {
      tooltipView.hide(e);
    }
  });
  // input.on("nodeclick", passthrough("nodeclick"));
  // input.on("nodedblclick", passthrough("nodedblclick"));

  window.addEventListener(
    "resize",
    () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    },
    false,
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === " " && !isStable) {
      shouldStep = !shouldStep;
    }
  });

  document.getElementById("speed")!.addEventListener("input", (e) => {
    const speed = (e.target as HTMLInputElement).value;
    input.setSpeed(parseFloat(speed));
  });

  graph.forEachNode((node) => {
    const nodeModelConfig = options.node(node);
    if (!nodeModelConfig) return;
    const idx = nodes.length;
    const position = layout.getNodePosition(node.id);
    if (typeof position.z !== "number") position.z = 0;
    const nodeModel = {
      ...nodeModelConfig,
      id: node.id,
      position,
      idx,
    };

    nodes.push(nodeModel);
    nodeIdToIdx.set(node.id, idx);
  });
  graph.forEachLink((edge) => {
    const edgeModelConfig = options.link(edge);
    if (!edgeModelConfig) return;

    const fromNode = nodes[nodeIdToIdx.get(edge.fromId)!];
    if (!fromNode) return; // cant have an edge that doesn't have a node

    const toNode = nodes[nodeIdToIdx.get(edge.toId)!];
    if (!toNode) return;

    const edgeModel: EdgeModel = {
      ...edgeModelConfig,
      idx: edges.length,
      from: fromNode,
      to: toNode,
    };

    edgeIdToIndex.set(edge.id, edgeModel.idx);
    edges.push(edgeModel);
  });

  const nodeView = createNodeView(scene, nodes);
  const edgeView = createEdgeView(scene, edges);

  if (input) input.reset();

  run();

  const sceneElement = renderer.domElement;
  if (sceneElement && typeof sceneElement.focus === "function")
    sceneElement.focus();

  function run() {
    requestAnimationFrame(run);

    if (!isStable && shouldStep) {
      isStable = layout.step();
      if (isStable) {
        shouldStep = false;
      }

      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        node.position = layout.getNodePosition(node.id) as Coord;
      }

      nodeView.refresh();
      nodeView.update();
      edgeView.refresh();
      edgeView.update();
    } else {
      // we may not want to change positions, but colors/size could be changed
      // at this moment, so let's take care of that:
      if (nodeView.needsUpdate()) nodeView.update();
      if (edgeView.needsUpdate()) edgeView.update();
    }

    input.update();
    renderer.render(scene, camera);
  }
}

function verifyContainerDimensions(container: HTMLElement) {
  if (!container) {
    throw new Error("container is required for the renderer");
  }

  if (container.clientWidth <= 0 || container.clientHeight <= 0) {
    console.warn(
      "Container is not visible. Make sure to set width/height to see the graph",
    );
  }
}
