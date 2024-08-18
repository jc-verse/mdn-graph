import THREE from "three";
import type { EdgeModel } from "..";

export default function createEdgeView(scene: THREE.Scene, edges: EdgeModel[]) {
  const total = edges.length;
  const colors = new Float32Array(total * 6);
  const points = new Float32Array(total * 6);
  let colorDirty: boolean, positionDirty: boolean;
  for (let i = 0; i < total; ++i) {
    const edge = edges[i];

    fromPosition(edge);
    toPosition(edge);

    fromColor(edge);
    toColor(edge);
  }

  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({
    vertexColors: THREE.VertexColors,
  });

  geometry.addAttribute("position", new THREE.BufferAttribute(points, 3));
  geometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));

  const edgeMesh = new THREE.LineSegments(geometry, material);
  edgeMesh.frustumCulled = false;
  scene.add(edgeMesh);

  return {
    update,
    needsUpdate,
    setFromColor: fromColor,
    setToColor: toColor,
    setFromPosition: fromPosition,
    setToPosition: toPosition,
    refresh,
  };

  function needsUpdate() {
    return colorDirty || positionDirty;
  }

  function update() {
    if (positionDirty) {
      geometry.getAttribute("position").needsUpdate = true;
      positionDirty = false;
    }

    if (colorDirty) {
      geometry.getAttribute("color").needsUpdate = true;
      colorDirty = false;
    }
  }

  function refresh() {
    for (let i = 0; i < total; ++i) {
      const edge = edges[i];

      fromPosition(edge);
      toPosition(edge);

      fromColor(edge);
      toColor(edge);
    }
  }

  function fromColor(edge: EdgeModel) {
    const fromColorHex = edge.fromColor;
    const i6 = edge.idx * 6;

    colors[i6] = ((fromColorHex >> 16) & 0xff) / 0xff;
    colors[i6 + 1] = ((fromColorHex >> 8) & 0xff) / 0xff;
    colors[i6 + 2] = (fromColorHex & 0xff) / 0xff;

    colorDirty = true;
  }

  function toColor(edge: EdgeModel) {
    const toColorHex = edge.toColor;
    const i6 = edge.idx * 6;

    colors[i6 + 3] = ((toColorHex >> 16) & 0xff) / 0xff;
    colors[i6 + 4] = ((toColorHex >> 8) & 0xff) / 0xff;
    colors[i6 + 5] = (toColorHex & 0xff) / 0xff;

    colorDirty = true;
  }

  function fromPosition(edge: EdgeModel) {
    const from = edge.from.position;
    const i6 = edge.idx * 6;

    points[i6] = from.x;
    points[i6 + 1] = from.y;
    points[i6 + 2] = from.z;

    positionDirty = true;
  }

  function toPosition(edge: EdgeModel) {
    const to = edge.to.position;
    const i6 = edge.idx * 6;

    points[i6 + 3] = to.x;
    points[i6 + 4] = to.y;
    points[i6 + 5] = to.z;

    positionDirty = true;
  }
}
