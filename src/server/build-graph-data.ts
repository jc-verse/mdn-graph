import { mkdir, readdir, unlink } from "node:fs/promises";

const outputDirectory = "docs/graph-data";
const maxChunkBytes = 8 * 1024 * 1024;

async function writeChunks(name: string, records: unknown[]) {
  const files: string[] = [];
  let entries: string[] = [];
  let bytes = 2; // Array brackets.

  async function flush() {
    const content = `[${entries.join(",")}]`;
    const hash = new Bun.CryptoHasher("sha256").update(content).digest("hex");
    const filename = `${name}-${hash}.json`;
    await Bun.write(`${outputDirectory}/${filename}`, content);
    files.push(filename);
    entries = [];
    bytes = 2;
  }

  for (const record of records) {
    const entry = JSON.stringify(record);
    const entryBytes = Buffer.byteLength(entry);
    if (entryBytes + 2 > maxChunkBytes) {
      throw new Error(`A ${name} record exceeds the graph data chunk limit`);
    }
    if (bytes + entryBytes + (entries.length ? 1 : 0) > maxChunkBytes) {
      await flush();
    }
    bytes += entryBytes + (entries.length ? 1 : 0);
    entries.push(entry);
  }
  if (entries.length) await flush();
  return files;
}

export default async function buildGraphData() {
  await mkdir(outputDirectory, { recursive: true });
  const nodes = await Bun.file("data/nodes.json").json();
  const links = await Bun.file("data/links.json").json();
  const manifest = {
    nodes: await writeChunks("nodes", nodes),
    links: await writeChunks(
      "links",
      links.map(({ fromId, toId }: { fromId: string; toId: string }) => ({
        fromId,
        toId,
      })),
    ),
  };
  await Bun.write(`${outputDirectory}/manifest.json`, JSON.stringify(manifest));
  const currentFiles = new Set([...manifest.nodes, ...manifest.links]);
  for (const filename of await readdir(outputDirectory)) {
    if (
      /^(nodes|links)-[a-f0-9]+\.json$/.test(filename) &&
      !currentFiles.has(filename)
    ) {
      await unlink(`${outputDirectory}/${filename}`);
    }
  }
}
