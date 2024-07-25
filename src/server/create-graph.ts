import createGraph, { type Node } from "ngraph.graph";
import FS from "node:fs/promises";
import { load } from "cheerio";

const graph = createGraph();

async function* listdir(dir: string): AsyncGenerator<string> {
  for await (const dirent of await FS.readdir(dir, { withFileTypes: true })) {
    if (dirent.isDirectory()) {
      yield* listdir(`${dir}/${dirent.name}`);
    } else {
      yield `${dir}/${dirent.name}`;
    }
  }
}

for await (const file of listdir("../content/build/en-us/docs")) {
  if (!file.endsWith(".json")) continue;
  const content = await Bun.file(file).json();
  if (file.endsWith("metadata.json")) {
    const existingNode = graph.getNode(content.mdn_url);
    if (existingNode) {
      existingNode.data.metadata = content;
    } else {
      graph.addNode(content.mdn_url, { metadata: content });
    }
  } else {
    const existingNode = graph.getNode(content.url);
    if (existingNode) {
      existingNode.data.content = content.doc.body;
    } else {
      graph.addNode(content.url, { content: content.doc.body });
    }
  }
}

const warnings: { [nodeId: string]: { message: string; data: any }[] } = {};

function report(node: Node, message: string, ...args: any[]) {
  (warnings[node.data.metadata.source.folder] ??= []).push({
    message,
    data: args,
  });
}

graph.forEachNode((node) => {
  if (!node.data || !node.data.content) {
    report(node, "Missing content");
    return;
  }
  const content = node.data.content;
  const linkTargets: string[] = [];
  const ids: string[] = [];
  for (const part of content) {
    if (part.value.id) ids.push(part.value.id);
    switch (part.type) {
      case "specifications":
        if (node.data.specifications) {
          report(node, "Duplicate specifications");
        }
        node.data.specifications = part.specifications;
        continue;
      case "browser_compatibility":
        if (node.data.browser_compatibility) {
          report(node, "Duplicate browser_compatibility");
        }
        node.data.browser_compatibility = part.query;
        continue;
      case "prose":
        break;
      default:
        report(node, "Unknown part type", part.type);
        continue;
    }
    const partContent = part.value.content;
    const $ = load(partContent);
    $("[id]").each((i, el) => {
      const id = $(el).attr("id")!;
      if (ids.includes(id)) {
        report(node, "Duplicate ID", id);
      }
      ids.push(id);
    });
    $("a:not(svg a)").each((i, a) => {
      const href = $(a).attr("href");
      if (!href) {
        report(node, "Missing href", $(a).text());
        return;
      }
      linkTargets.push(href);
    });
  }
  node.data.links = linkTargets;
  node.data.ids = ids;
  delete node.data.content;
});

graph.forEachNode((node) => {
  for (const linkTarget of node.data.links) {
    if (/\.(?:jpe?g|png|svg|gif)$/.test(linkTarget)) {
      report(node, "Image link", linkTarget);
    } else if (linkTarget.startsWith("/en-US/")) {
      if (
        ["/en-US/", "/en-US/curriculum/", "/en-US/observatory", "/en-US/play", "/en-US/plus"].includes(
          linkTarget
        ) ||
        linkTarget.startsWith("/en-US/blog/")
      )
        continue;
      const url = new URL(linkTarget, "https://developer.mozilla.org");
      const targetNode = graph.getNode(url.pathname);
      if (!targetNode) {
        report(node, "Broken link to", url.pathname);
        continue;
      }
      if (
        url.hash &&
        !url.hash.startsWith("#:~:") &&
        !targetNode.data.ids.includes(decodeURIComponent(url.hash.slice(1)))
      ) {
        report(node, "Broken anchor", url.pathname, url.hash);
      }
      if (node.id === url.pathname && !linkTarget.startsWith("#")) {
        report(node, "Self link", url.pathname);
        continue;
      }
      graph.addLink(node.id, url.pathname);
    } else if (linkTarget.startsWith("#")) {
      if (!node.data.ids.includes(decodeURIComponent(linkTarget.slice(1)))) {
        report(node, "Broken anchor", linkTarget);
      }
    } else if (!linkTarget.startsWith("https:")) {
      if (
        linkTarget.startsWith("mailto:") ||
        (linkTarget.startsWith("http://localhost:5042") &&
          linkTarget.includes("_sample_.")) ||
        ["/", "/discord"].includes(linkTarget)
      ) {
        continue;
      } else if (linkTarget.startsWith("http:")) {
        report(node, "HTTP link", linkTarget);
      } else {
        report(node, "Bad href", linkTarget);
      }
    }
  }
});

await FS.writeFile("data/warnings.json", JSON.stringify(warnings, null, 2));

const nodes = [];

graph.forEachNode((node) => {
  nodes.push(node);
});

const links = [];

graph.forEachLink((link) => {
  links.push(link);
});

await FS.writeFile("data/nodes.json", JSON.stringify(nodes, null, 2));
await FS.writeFile("data/links.json", JSON.stringify(links, null, 2));
