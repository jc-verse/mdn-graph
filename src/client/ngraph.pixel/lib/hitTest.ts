import THREE from "three";
import eventify from "ngraph.events";
import type { Coord } from "..";

export type MouseLocation = {
  x: number;
  y: number;
  down: boolean;
  nodeIndex?: number;
};

export default function createHitTest(domElement: HTMLElement) {
  let particleSystem: THREE.Points | null = null;
  let lastIntersected: number | undefined = undefined;
  let postponed = true;

  const raycaster = new THREE.Raycaster();

  // This defines sensitivity of raycaster. TODO: Should it depend on node size?
  raycaster.params.Points.threshold = 10;

  // we will store mouse coordinates here to process on next RAF event (`update()` method)
  const mouse = {
    x: 0,
    y: 0,
  };

  // store DOM coordinates as well, to let clients know where mouse is
  const domMouse: MouseLocation = {
    down: false,
    x: 0,
    y: 0,
    nodeIndex: undefined,
  };
  let singleClickHandler: ReturnType<typeof setTimeout> | undefined = undefined;

  domElement.addEventListener("mousemove", onMouseMove, false);
  domElement.addEventListener("mousedown", onMouseDown, false);
  domElement.addEventListener("mouseup", onMouseUp, false);
  domElement.addEventListener("touchstart", onTouchStart, false);
  domElement.addEventListener("touchend", onTouchEnd, false);

  const api = {
    /**
     * This should be called from RAF. Initiates process of hit test detection
     */
    update,

    /**
     * Reset all caches. Most likely underlying scene changed
     * too much.
     */
    reset,

    /**
     * Hit tester should not emit events until mouse moved
     */
    postpone,
  };

  // let us publish events
  eventify(api);
  return api;

  function postpone() {
    // postpone processing of hit testing until next mouse movement
    // this gives opportunity to avoid race conditions.
    postponed = true;
  }

  function reset() {
    particleSystem = null;
  }

  function onMouseUp() {
    domMouse.down = false;
    postponed = true;
  }

  function onMouseDown() {
    postponed = false;
    domMouse.down = true;
    domMouse.nodeIndex = lastIntersected;

    if (singleClickHandler) {
      // If we were able to get here without clearing single click handler,
      // then we are dealing with double click.

      // No need to fire single click event anymore:
      clearTimeout(singleClickHandler);
      singleClickHandler = undefined;

      // fire double click instead:
      api.fire("nodedblclick", domMouse);
    } else {
      // Wait some time before firing event. It can be a double click...
      singleClickHandler = setTimeout(() => {
        api.fire("nodeclick", domMouse);
        singleClickHandler = undefined;
      }, 300);
    }
  }

  function onTouchStart(e: TouchEvent) {
    if (!e.touches || e.touches.length !== 1) {
      postponed = true;
      return;
    }

    postponed = false;
    setMouseCoordinates(e.touches[0]);
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches && e.touches.length === 1) {
      setMouseCoordinates(e.touches[0]);
    }
    setTimeout(() => {
      postponed = false;
      api.fire("nodeclick", domMouse);
    }, 0);
  }

  function onMouseMove(e: MouseEvent) {
    setMouseCoordinates(e);
    postponed = false; // mouse moved, we are free.
  }

  function setMouseCoordinates(e: MouseEvent | Touch) {
    const boundingRect = domElement.getBoundingClientRect();
    mouse.x = ((e.pageX - boundingRect.left) / boundingRect.width) * 2 - 1;
    mouse.y = -((e.pageY - boundingRect.top) / boundingRect.height) * 2 + 1;

    domMouse.x = e.clientX;
    domMouse.y = e.clientY;
  }

  function update(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    // We need to stop processing any events until user moves mouse.
    // this is to avoid race conditions between search field and scene
    if (postponed) return;

    if (!particleSystem) {
      scene.children.forEach((child) => {
        if (child.name === "nodes") {
          particleSystem = child;
        }
      });
      if (!particleSystem) return;
    }

    raycaster.setFromCamera(mouse, camera);
    const newIntersected = getIntersects(camera);

    if (newIntersected !== undefined) {
      if (lastIntersected !== newIntersected) {
        lastIntersected = newIntersected;
        notifySelected(lastIntersected);
      }
    } else if (typeof lastIntersected === "number") {
      // there is no node under mouse cursor. Let it know to UI:
      lastIntersected = undefined;
      notifySelected(undefined);
    }
  }

  function getIntersects() {
    if (!particleSystem) return undefined;
    const geometry = particleSystem.geometry;
    const attributes = geometry.attributes;
    const positions = attributes.position.array;
    return raycast(
      positions,
      raycaster.ray,
      particleSystem.matrixWorld.elements,
    );
  }

  function raycast(
    positions: THREE.TypedArray,
    ray: THREE.Ray,
    worldMatrix: number[],
  ) {
    const pointCount = positions.length / 3;
    let minDistance = Number.POSITIVE_INFINITY;
    let minIndex = -1;

    const ox = ray.origin.x;
    const oy = ray.origin.y;
    const oz = ray.origin.z;

    const dx = ray.direction.x;
    const dy = ray.direction.y;
    const dz = ray.direction.z;
    const pt = {
      x: 0,
      y: 0,
      z: 0,
    };

    for (let i = 0; i < pointCount; i++) {
      testPoint(
        positions[3 * i],
        positions[3 * i + 1],
        positions[3 * i + 2],
        i,
      );
    }

    if (minIndex !== -1) {
      return minIndex;
    }

    function testPoint(x: number, y: number, z: number, idx: number) {
      let distance = distanceTo(x, y, z);
      if (distance < 10) {
        const ip = nearestTo(x, y, z); // intersect point
        applyMatrix(ip, worldMatrix);
        distance = Math.sqrt(
          (ox - ip.x) * (ox - ip.x) +
            (oy - ip.y) * (oy - ip.y) +
            (oz - ip.z) * (oz - ip.z),
        );
        if (distance < minDistance) {
          minDistance = distance;
          minIndex = idx;
        }
      }
    }

    function applyMatrix(pt: Coord, e: number[]) {
      const x = pt.x;
      const y = pt.y;
      const z = pt.z;
      pt.x = e[0] * x + e[4] * y + e[8] * z + e[12];
      pt.y = e[1] * x + e[5] * y + e[9] * z + e[13];
      pt.z = e[2] * x + e[6] * y + e[10] * z + e[14];
    }

    function nearestTo(x: number, y: number, z: number) {
      const directionDistance = (x - ox) * dx + (y - oy) * dy + (z - oz) * dz;
      if (directionDistance < 0) {
        pt.x = ox;
        pt.y = oy;
        pt.z = oz;
      } else {
        pt.x = dx * directionDistance + ox;
        pt.y = dy * directionDistance + oy;
        pt.z = dz * directionDistance + oz;
      }
      return pt;
    }

    function distanceTo(x: number, y: number, z: number) {
      const directionDistance = (x - ox) * dx + (y - oy) * dy + (z - oz) * dz;
      if (directionDistance < 0) {
        // point behind ray
        return Math.sqrt(
          (ox - x) * (ox - x) + (oy - y) * (oy - y) + (oz - z) * (oz - z),
        );
      }
      const vx = dx * directionDistance + ox;
      const vy = dy * directionDistance + oy;
      const vz = dz * directionDistance + oz;

      return Math.sqrt(
        (vx - x) * (vx - x) + (vy - y) * (vy - y) + (vz - z) * (vz - z),
      );
    }
  }

  function notifySelected(index: number | undefined) {
    domMouse.nodeIndex = index;
    api.fire("nodeover", domMouse);
  }
}
