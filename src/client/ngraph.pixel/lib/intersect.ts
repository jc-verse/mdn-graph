import type { Coord } from "..";

/**
 * Find intersection point on a sphere surface with radius `r` and center in the `to`
 * with a ray [to, from)
 */
export default function intersect(from: Coord, to: Coord, r: number) {
  // we are using Cartesian to Spherical coordinates transformation to find
  // theta and phi:
  // https://en.wikipedia.org/wiki/Spherical_coordinate_system#Coordinate_system_conversions
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  const dz = from.z - to.z;
  const r1 = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const teta = Math.acos(dz / r1);
  const phi = Math.atan2(dy, dx);

  // And then based on sphere radius we transform back to Cartesian:
  return {
    x: r * Math.sin(teta) * Math.cos(phi) + to.x,
    y: r * Math.sin(teta) * Math.sin(phi) + to.y,
    z: r * Math.cos(teta) + to.z,
  };
}
