import THREE from "three";
import FlyControls from "three.fly";
import type { Graph } from "ngraph.graph";
import eventify from "ngraph.events";
import createHitTest from "./hitTest.js";

export default function createInput(
  camera: THREE.Camera,
  graph: Graph,
  domElement: HTMLElement,
  layout,
) {
  const controls = new FlyControls(camera, domElement, THREE);
  const hitTest = createHitTest(domElement);
  let speedFactor = 1;
  controls.movementSpeed = 0;
  controls.rollSpeed = 0.2;

  const api = { update, reset, setSpeed };

  eventify(api);

  hitTest.on("nodeover", passthrough("nodeover"));
  hitTest.on("nodeclick", passthrough("nodeclick"));
  hitTest.on("nodedblclick", passthrough("nodedblclick"));

  controls.on("move", inputChanged);
  return api;

  function update() {
    const rect = layout.getGraphRect();
    controls.movementSpeed =
      Math.max(200, (rect.max_x - rect.min_x) * 0.03) * speedFactor;
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

  function setSpeed(newSpeed: number) {
    const rect = layout.getGraphRect();
    speedFactor = newSpeed;
    controls.movementSpeed =
      Math.max(200, (rect.max_x - rect.min_x) * 0.03) * speedFactor;
  }
}
