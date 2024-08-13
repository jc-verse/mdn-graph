import THREE from "three";
import FlyControls from "three.fly";
import type { Graph } from "ngraph.graph";
import eventify from "ngraph.events";
import createHitTest from "./hitTest.js";

export default function createInput(camera: THREE.Camera, graph: Graph, domElement: HTMLElement, layout) {
  const controls = new FlyControls(camera, domElement, THREE);
  const hitTest = createHitTest(domElement);
  controls.movementSpeed = 1;
  controls.rollSpeed = 0.2;

  const api = { update, reset };

  eventify(api);

  hitTest.on("nodeover", passthrough("nodeover"));
  hitTest.on("nodeclick", passthrough("nodeclick"));
  hitTest.on("nodedblclick", passthrough("nodedblclick"));

  controls.on("move", inputChanged);
  return api;

  function update() {
    const rect = layout.getGraphRect();
    controls.movementSpeed = Math.max(200, (rect.max_x - rect.min_x) * 0.05);
    controls.update(0.1);
  }

  function passthrough(name) {
    return (e) => {
      api.fire(name, e);
    };
  }

  function inputChanged(moveArg) {
    api.fire("move", moveArg);
    updateHitTest();
  }

  function updateHitTest() {
    const scene = camera.parent;
    hitTest.update(scene, camera);
  }

  function reset() {
    hitTest.reset();
  }
}
