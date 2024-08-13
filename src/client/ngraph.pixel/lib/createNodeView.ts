import THREE from "three";
import createMaterial from "./createMaterial.js";
import type { NodeModel } from "../index.js";

export default function createNodeView(
  scene: THREE.Scene,
  nodes: NodeModel[],
) {
  const particleMaterial = createMaterial();
  const total = nodes.length;
  const colors = new Float32Array(total * 3);
  const points = new Float32Array(total * 3);
  const sizes = new Float32Array(total * 3);
  let colorDirty: boolean, sizeDirty: boolean, positionDirty: boolean;
  const geometry = new THREE.BufferGeometry();

  geometry.addAttribute("position", new THREE.BufferAttribute(points, 3));
  geometry.addAttribute("customColor", new THREE.BufferAttribute(colors, 3));
  geometry.addAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const particleSystem = new THREE.Points(geometry, particleMaterial);
  particleSystem.name = "nodes";
  particleSystem.frustumCulled = false;

  scene.add(particleSystem);

  refresh();

  return {
    update,
    needsUpdate,
    getBoundingSphere,
    setNodePosition,
    setNodeColor,
    setNodeSize,
    refresh,
  };

  function needsUpdate() {
    return colorDirty || sizeDirty || positionDirty;
  }

  function setNodeColor(node: NodeModel) {
    const idx3 = node.idx * 3;
    const hexColor = node.color;
    colors[idx3] = (hexColor >> 16) & 0xff;
    colors[idx3 + 1] = (hexColor >> 8) & 0xff;
    colors[idx3 + 2] = hexColor & 0xff;
    colorDirty = true;
  }

  function setNodeSize(node: NodeModel) {
    sizes[node.idx] = node.size;
    sizeDirty = true;
  }

  function setNodePosition(node: NodeModel) {
    const idx3 = node.idx * 3;
    const pos = node.position;

    points[idx3 + 0] = pos.x;
    points[idx3 + 1] = pos.y;
    points[idx3 + 2] = pos.z;

    positionDirty = true;
  }

  function update() {
    if (positionDirty) {
      geometry.getAttribute("position").needsUpdate = true;
      positionDirty = false;
    }
    if (colorDirty) {
      geometry.getAttribute("customColor").needsUpdate = true;
      colorDirty = false;
    }
    if (sizeDirty) {
      geometry.getAttribute("size").needsUpdate = true;
      sizeDirty = false;
    }
  }

  function getBoundingSphere() {
    if (!geometry) return;
    geometry.computeBoundingSphere();
    return geometry.boundingSphere;
  }

  /**
   * Forces renderer to refresh positions/colors/sizes for each model.
   */
  function refresh() {
    for (let i = 0; i < total; ++i) {
      const node = nodes[i];
      setNodePosition(node);
      setNodeColor(node);
      setNodeSize(node);
    }
  }
}
