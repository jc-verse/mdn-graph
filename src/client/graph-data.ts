import type { Node, Link } from "ngraph.graph";

type GraphData = {
  nodes: Pick<Node, "id" | "data">;
  links: Pick<Link, "fromId" | "toId">;
};

const manifestURL = new URL("./graph-data/manifest.json", import.meta.url);

async function loadJSON<T>(url: URL): Promise<T> {
  const { default: data } = await import(url.href, {
    with: { type: "json" },
  });
  return data;
}

let manifest: Promise<Record<keyof GraphData, string[]>> | undefined;

export async function* loadGraphData<K extends keyof GraphData>(kind: K) {
  manifest ??= loadJSON<Record<keyof GraphData, string[]>>(manifestURL);
  for (const filename of (await manifest)[kind]) {
    yield* await loadJSON<GraphData[K][]>(new URL(filename, manifestURL));
  }
}
