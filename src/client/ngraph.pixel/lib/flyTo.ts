
import THREE from "three";
import intersect from "./intersect.js";
import type { Coord } from "..";

/**
 * Moves camera to given point, and stops it and given radius
 */
export default function flyTo(camera: THREE.PerspectiveCamera, to: Coord, radius: number) {
  const cameraOffset = radius / Math.tan((Math.PI / 180.0) * camera.fov * 0.5);

  const from = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };

  camera.lookAt(new THREE.Vector3(to.x, to.y, to.z));
  const cameraEndPos = intersect(from, to, cameraOffset);
  camera.position.x = cameraEndPos.x;
  camera.position.y = cameraEndPos.y;
  camera.position.z = cameraEndPos.z;
}
