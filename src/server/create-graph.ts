import createGraph, { type Node, type Link } from "ngraph.graph";
import FS from "node:fs/promises";
import Path from "node:path";
import { $ } from "bun";
import { load } from "cheerio";
import { CONTENT_ROOT, readConfig, configHas } from "./config.js";

const allowedCodeLinkTextRec = new Map(
  (await readConfig("allowed-code-link-text.txt")).map((x) => [x, false])
);

const allowedSpacedCodeLink = [
  // HTML tags
  /^<(a|area|font|iframe|input|link|meta|object|ol|script|th|tr)( [a-z-]+="[\w .…-]+"| ping| defer)+>$/,
  /^<\?xml[^>]+\?>$/,
  /^<xsl:[^>]+>$/,
  /^[a-z-]+="[\w .…-]+"$/,
  // JS code
  /^(async function\*?|"use strict"|typeof [a-z]+( === "[a-z]+")?|extends null|export default|import (\* as )?\w+ from "\w+";?|(if|catch) \(\w*\)|for await\.\.\.of|\w+: "\w+"|(await|delete|void|yield\*?) \w+|\w+ (instanceof|in) \w+|\( \)|\(\w+ \? \w+ : \w+\))$/,
  // Method calls with parameters. Lots of false positives but we actually
  // want to check that methods in interface DLs don't have params
  /^[\w.]+\([\w.]+(, [\w.]+)*\)$/,
  // CSS code
  /^([a-z-]+: ([a-z-]+|\d+(px|em|vh|vw|%)|0);?|@(container|import|media|namespace|supports) [()a-z: -]+|transform: [\w-]+\(\);?|transform-style: [\w-]+;?)$/,
  // Shell commands
  /^(ng|npm) [a-z\d]+$/,
  // HTTP status
  /^\d+ [\w '-]+$/,
  // HTTP header
  /^(Cache-Control|Clear-Site-Data|Connection|Content-Length|Content-Security-Policy|Cross-Origin-Opener-Policy|Cross-Origin-Resource-Policy|Permissions-Policy|Sec-Purpose|Transfer-Encoding): ([\w-]+|"[\w-]+")$/,
  // MIME
  /^[a-z]+\/[\w+-]+; [a-z]+=("[\w ,.-]+"|\w+);?$/,
  // Macro calls
  /^\{\{[^}]+\}\}$/,
  // PAC stuff
  /^(HTTP|HTTPS|PROXY|SOCKS|SOCKS4)/,
  // TODO: this is probably bad (CSS reference uses this syntax)
  /^[a-z-]+ \(@[a-z-]+\)$|^::([a-z-]+) \(:\1\)$/,
];

const allowedUnderscoreCodeLink = [
  // Constants (uppercase)
  /^(\w+\.)*[A-Z_\d]+$/,
  // Non-JS properties (lowercase)
  /^((dns|tcp|webgl|AppConfig|http(\.[a-z]+)?)\.)?[a-z\d_]+(\(\))?$/,
  // WebGL prefixes
  /^(WEBGL|OES|EXT|ANGLE|OCULUS|OVR|KHR)_\w+(\.[A-Za-z]+\(\))?$/,
  // Object methods
  /^(Object\.prototype\.)?__((define|lookup)(Getter|Setter)|proto)__(\(\))?$/,
  // Link targets
  /^_(blank|parent|replace|self|top)$/,
  // File names
  /\.(js|html)$/,
  // String constants
  /^"\w+"$/,
  // Macro calls
  /^\{\{[\w-]+\}\}$/,
];

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

for await (const file of listdir(Path.join(CONTENT_ROOT, "build/en-us/docs"))) {
  if (!file.endsWith(".json")) continue;
  const content = await Bun.file(file).json();
  if (file.endsWith("metadata.json")) {
    const existingNode = graph.getNode(content.mdn_url);
    if (existingNode) {
      existingNode.data.metadata = content;
    } else {
      graph.addNode(content.mdn_url, { metadata: content });
    }
  } else if (file.endsWith("index.json")) {
    const existingNode = graph.getNode(content.url);
    if (existingNode) {
      existingNode.data.content = content.doc.body;
      existingNode.data.sidebarHTML = content.doc.sidebarHTML;
      existingNode.data.sidebarMacro = content.doc.sidebarMacro;
    } else {
      graph.addNode(content.url, {
        content: content.doc.body,
        sidebarHTML: content.doc.sidebarHTML,
        sidebarMacro: content.doc.sidebarMacro,
      });
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
    console.error(node.id, "has no content");
    return;
  }
  const content = node.data.content;
  const linkTargets: string[] = [];
  const ids: string[] = [];
  for (const part of content) {
    // TODO Yari does this case folding but it should just output lowercase IDs
    // in the build output
    if (part.value.id) ids.push(part.value.id.toLowerCase());
    switch (part.type) {
      case "specifications":
        if (node.data.specifications)
          report(node, "Duplicate specifications");
        node.data.specifications = part.value.specifications;
        continue;
      case "browser_compatibility":
        // We use metadata.browserCompat
        if (!node.data.metadata.browserCompat?.includes(part.value.query))
          report(node, "Bad browser compat query", part.value.query);
        continue;
      case "prose":
        break;
      default:
        console.error(node.id, "Unknown part type", part.type);
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
    $("ul li").each((i, li) => {
      const children = $(li).contents();
      if (
        children.length === 0 ||
        (children[0].type === "text" && children[0].data.startsWith(":"))
      ) {
        report(node, "Bad DL", $(li).text().slice(0, 50));
      }
    });
    if (part.value.content.includes("-: ")) {
      report(
        node,
        "Bad DL",
        part.value.content.match(/-: .*$/m)?.[0].slice(0, 50)
      );
    }
    if (part.value.content.includes("could not find syntax for this item"))
      report(node, "Missing data", "CSS formal syntax");
    if (part.value.content.includes("Value not found in DB"))
      report(node, "Missing data", "CSS info");
    $(":not(code, code *, pre, pre *, math, math *)").each((i, el) => {
      const texts = $(el)
        .contents()
        .filter((i, el) => el.type === "text");
      for (const text of texts) {
        if (/`.*`|\*.*\*|\[.*\]\(.*\)|\b_.*_\b/.test(text.data)) {
          report(node, "Possibly unrendered Markdown", text.data);
        }
      }
    });
    $("a:not(svg a)").each((i, a) => {
      const href = $(a).attr("href");
      if (!href) {
        report(node, "Missing href", $(a).text());
        return;
      }
      const childNodes = $(a).contents();
      if (
        childNodes.length === 1 &&
        childNodes[0].type === "tag" &&
        childNodes[0].name === "code"
      ) {
        const code = $(childNodes[0]).text();
        if (
          code.includes(" ") &&
          !allowedSpacedCodeLink.some((re) => re.test(code)) &&
          !configHas(allowedCodeLinkTextRec, code) &&
          // Canvas tutorial uses example code in DL, not worth fixing
          !node.id.includes("Canvas_API/Tutorial")
        ) {
          report(node, "Code with space", code);
        } else if (
          code.includes("_") &&
          !allowedUnderscoreCodeLink.some((re) => re.test(code)) &&
          !configHas(allowedCodeLinkTextRec, code)
        ) {
          report(node, "Code with underscore", code);
        }
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
    // Internal image links cannot be resolved by the graph so report them separately
    if (
      /\.(?:jpe?g|png|svg|gif)$/.test(linkTarget) &&
      !linkTarget.startsWith("https:")
    ) {
      report(node, "Image link", linkTarget);
    } else if (linkTarget.startsWith("/en-US/")) {
      if (
        [
          "/en-US/",
          "/en-US/curriculum/",
          "/en-US/observatory",
          "/en-US/play",
          "/en-US/plus",
        ].includes(linkTarget) ||
        linkTarget.startsWith("/en-US/blog/")
      )
        continue;
      const url = new URL(linkTarget, "https://developer.mozilla.org");
      const targetNode = graph.getNode(url.pathname);
      if (!targetNode) {
        report(node, "Broken link", url.pathname);
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
        report(node, "Self link", linkTarget);
        continue;
      }
      graph.addLink(node.id, url.pathname);
    } else if (linkTarget.startsWith("#")) {
      if (!node.data.ids.includes(decodeURIComponent(linkTarget.slice(1)))) {
        if (linkTarget === "#browser_compatibility") {
          report(node, "Broken browser compat anchor");
        } else {
          report(node, "Broken anchor", linkTarget);
        }
      }
    } else if (
      !linkTarget.startsWith("http") ||
      (linkTarget.includes("//localhost") && !linkTarget.includes("_sample_."))
    ) {
      if (
        linkTarget.startsWith("mailto:") ||
        ["/", "/discord"].includes(linkTarget)
      ) {
        continue;
      } else {
        report(node, "Bad href", linkTarget);
      }
    }
  }
});

const nodes: Node[] = [];

graph.forEachNode((node) => {
  nodes.push(node);
});

const links: Link[] = [];

graph.forEachLink((link) => {
  links.push(link);
});

const unreachableViaPage = new Set<Node>(nodes);
const unreachableViaSidebar = new Set<Node>(nodes);
const visited = new Set<Node>();

const queue = [graph.getNode("/en-US/docs/Web")];
while (queue.length) {
  const node = queue.shift()!;
  graph.forEachLinkedNode(
    node.id,
    (linkedNode) => {
      if (!visited.has(linkedNode)) {
        visited.add(linkedNode);
        unreachableViaPage.delete(linkedNode);
        queue.push(linkedNode);
      }
    },
    true
  );
}

await FS.rmdir("sidebars", { recursive: true });
await FS.mkdir("sidebars");
const processedSidebars = new Map<string, string>();

for (const node of nodes) {
  const { sidebarHTML, sidebarMacro } = node.data;
  delete node.data.sidebarHTML;
  delete node.data.sidebarMacro;
  if (!sidebarHTML) {
    report(node, "Missing sidebar");
    continue;
  }
  const normalizedHTML = sidebarHTML
    .replace(/ open(="[^"]*")?| aria-current="page"|<\/?em>/g, "")
    .replace(
      `<code>${node.data.metadata.short_title}</code> `,
      () =>
        `<a href="${node.id}"><code>${node.data.metadata.short_title}</code></a>`
    );
  if (processedSidebars.has(normalizedHTML)) continue;
  const $ = load(normalizedHTML);
  $("a").each((i, a) => {
    const href = $(a).attr("href")?.replace(/\/$/, "");
    if (href && href.startsWith("/en-US/")) {
      const targetNode = graph.getNode(href);
      if (targetNode) {
        unreachableViaSidebar.delete(targetNode);
      } else {
        report(node, "Broken sidebar link", $(a).text(), href);
      }
    } else {
      report(node, "Bad sidebar link", $(a).text(), href);
    }
  });
  processedSidebars.set(normalizedHTML, sidebarMacro);
}

const counter = new Map<string, number>();
for (const [html, macro] of processedSidebars) {
  const number = counter.get(macro) ?? 0;
  counter.set(macro, number + 1);
  await Bun.write(`sidebars/${macro}-${number}.html`, html);
}

for (const node of unreachableViaPage)
  report(node, "Unreachable via page");
for (const node of unreachableViaSidebar)
  report(node, "Unreachable via sidebar");

for (const node of nodes) {
  node.data.metadata = Object.fromEntries(
    [
      "flaws",
      "title",
      "browserCompat",
      "summary",
      "popularity",
      "modified",
      "source",
      "short_title",
    ].map((key) => [key, node.data.metadata[key]])
  );
  node.data.metadata.source = {
    folder: node.data.metadata.source.folder,
    last_commit_url: node.data.metadata.source.last_commit_url,
  };
  node.data.links = node.data.links.filter(
    (link) =>
      !link.startsWith("/en-US/") &&
      !link.startsWith("#") &&
      !link.includes("//localhost")
  );
}

for (const [text, used] of allowedCodeLinkTextRec) {
  if (!used) {
    console.error(`${text} is no longer used in content`);
  }
}

const commit = await $`git log -1 --format="%H %ct"`
  .cwd(Bun.fileURLToPath(import.meta.resolve("../../../content")))
  .text();

await FS.writeFile("data/warnings.json", JSON.stringify(warnings, null, 2));
await FS.writeFile("data/nodes.json", JSON.stringify(nodes, null, 2));
await FS.writeFile("data/links.json", JSON.stringify(links, null, 2));
await FS.writeFile(
  "data/last-update.json",
  JSON.stringify(
    {
      commitHash: commit.split(" ")[0],
      commitTimestamp: parseInt(commit.split(" ")[1]) * 1000,
      buildTimestamp: Date.now(),
    },
    null,
    2
  )
);
