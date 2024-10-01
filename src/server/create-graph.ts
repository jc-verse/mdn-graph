import createGraph, { type Node, type Link } from "ngraph.graph";
import FS from "node:fs/promises";
import Path from "node:path";
import { $ } from "bun";
import { load } from "cheerio";
import matter from "gray-matter";
import bcdData from "@mdn/browser-compat-data" with { type: "json" };
import { getBCD } from "./utils.js";
import { CONTENT_SOURCE_ROOT, BUILT_CONTENT_ROOT } from "./config.js";
import { checkContent, postCheckContent } from "./check-content.js";

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

for await (const file of listdir(Path.join(BUILT_CONTENT_ROOT, "en-us/docs"))) {
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

const promises: Promise<void>[] = [];

graph.forEachNode((node) => {
  const sourcePath = Path.join(
    CONTENT_SOURCE_ROOT,
    node.data.metadata.source.folder,
    "index.md",
  );
  promises.push(
    FS.readFile(sourcePath, "utf8")
      .then((source) => {
        const { data } = matter(source);
        node.data.metadata.pageType = data["page-type"];
        if (!node.data.metadata.pageType) {
          report(node, "Missing page type");
        }
        node.data.metadata.frontMatter = data;
        if (data["browser-compat"]) {
          data["browser-compat"] = Array.isArray(data["browser-compat"])
            ? data["browser-compat"]
            : [data["browser-compat"]];
        }
        if (data["spec-urls"]) {
          data["spec-urls"] = Array.isArray(data["spec-urls"])
            ? data["spec-urls"]
            : [data["spec-urls"]];
        }
        if (
          (data["browser-compat"] && !node.data.metadata.browserCompat) ||
          (!data["browser-compat"] && node.data.metadata.browserCompat)
        ) {
          console.warn(
            "Mismatched browser compat",
            node.id,
            data["browser-compat"],
            node.data.metadata.browserCompat,
          );
        } else if (data["browser-compat"]) {
          for (let i = 0; i < data["browser-compat"].length; i++) {
            if (
              data["browser-compat"][i] !== node.data.metadata.browserCompat[i]
            ) {
              console.warn(
                "Mismatched browser compat",
                node.id,
                data["browser-compat"],
                node.data.metadata.browserCompat,
              );
              break;
            }
          }
        }
      })
      .catch((e) => {
        console.error("Error reading file", sourcePath, e);
      }),
  );
});

await Promise.all(promises);

const warnings: { [nodeId: string]: { message: string; data: any }[] } = {};

function report(node: Node, message: string, ...args: any[]) {
  (warnings[node.data.metadata.source.folder] ??= []).push({
    message,
    data: args,
  });
}

const dtIdToLink = new Map<
  string,
  Map<string, { href: string; pageExists: boolean }>
>();

graph.forEachNode((node) => {
  if (!node.data || !node.data.content) {
    console.error(node.id, "has no content");
    return;
  }
  const content = node.data.content;
  const linkTargets: string[] = [];
  const ids: string[] = [];
  let hasBCDTable = false;
  for (const part of content) {
    // TODO Yari does this case folding but it should just output lowercase IDs
    // in the build output
    if (part.value.id) ids.push(part.value.id.toLowerCase());
    switch (part.type) {
      case "specifications":
        if (node.data.specifications) report(node, "Duplicate specifications");
        node.data.specifications = part.value.specifications;
        continue;
      case "browser_compatibility":
        // We use metadata.browserCompat instead of part.value.query.
        // The only way for part.value.query to not be included in
        // metadata.browserCompat is by using the argument of the {{Compat}}
        // macro, but that is reported as a flaw.
        hasBCDTable = true;
        continue;
      case "prose":
        break;
      default:
        console.error(node.id, "Unknown part type", part.type);
        continue;
    }
    const partContent = part.value.content;
    const $ = load(partContent);
    checkContent(partContent, $, report.bind(null, node), { slug: node.id });
    $("[id]").each((i, el) => {
      const id = $(el).attr("id")!;
      if (ids.includes(id)) report(node, "Duplicate ID", id);
      ids.push(id);
    });
    $("a:not(svg a)").each((i, a) => {
      const href = $(a).attr("href");
      if (!href) {
        report(node, "Missing href", $(a).text());
        return;
      }
      if ($(a).parent().attr("id") === href.slice(1)) {
        // This link is autogenerated; we should still do the check above but
        // don't treat it as a real link target
        return;
      }
      linkTargets.push(href);
    });
    $("dt").each((i, dt) => {
      // The ID is injected by Yari
      const id = $(dt).attr("id")!;
      const link = $(dt)
        .find("a")
        .filter((i, a) => !!a.attribs.href && a.attribs.href !== `#${id}`);
      if (link.length === 1) {
        const href = link[0].attribs.href;
        // Missing href is already reported above
        if (!dtIdToLink.has(node.id)) dtIdToLink.set(node.id, new Map());
        const pageExists =
          graph.getNode(
            new URL(href, "https://developer.mozilla.org").pathname,
          ) !== undefined;
        dtIdToLink.get(node.id)!.set(id, { href, pageExists });
      }
    });
  }
  const specURLs =
    node.data.metadata.frontMatter["spec-urls"] ??
    node.data.metadata.browserCompat
      ?.map((k: string) => getBCD(bcdData, k)?.__compat?.spec_url)
      .filter(Boolean);
  if (specURLs?.length && !node.data.specifications) {
    report(node, "Missing specifications");
  }
  if (node.data.metadata.browserCompat && !hasBCDTable) {
    const notExist = node.data.metadata.browserCompat.some(
      (k: string) => !getBCD(bcdData, k),
    );
    report(node, "Missing BCD table", ...(notExist ? ["(key invalid)"] : []));
  }
  node.data.links = linkTargets;
  node.data.ids = ids;
  delete node.data.content;
});

postCheckContent();

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
      if (url.hash && !url.hash.startsWith("#:~:")) {
        if (
          !targetNode.data.ids.includes(decodeURIComponent(url.hash.slice(1)))
        ) {
          report(node, "Broken anchor", url.pathname, url.hash);
        } else {
          // The target may have no DT links
          const targetDtLink = dtIdToLink
            .get(url.pathname)
            ?.get(url.hash.slice(1));
          // Only report if the link to be replaced with is a subpage
          if (targetDtLink && targetDtLink.href.startsWith(url.pathname)) {
            report(
              node,
              "Replace DT link with real target",
              linkTarget,
              targetDtLink.href,
              ...[targetDtLink.pageExists ? [] : ["(page does not exist)"]],
            );
          }
        }
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
        } else if (!linkTarget.startsWith("#:~:")) {
          report(node, "Broken anchor", linkTarget);
        }
      } else {
        const targetDtLink = dtIdToLink.get(node.id)?.get(linkTarget.slice(1));
        if (targetDtLink && targetDtLink.href.startsWith(node.id)) {
          report(
            node,
            "Replace DT link with real target",
            linkTarget,
            targetDtLink.href,
            ...[targetDtLink.pageExists ? [] : ["(page does not exist)"]],
          );
        }
      }
    } else if (
      !linkTarget.startsWith("http") ||
      (linkTarget.includes("//localhost") && !linkTarget.includes("_sample_."))
    ) {
      if (
        linkTarget.startsWith("mailto:") ||
        linkTarget.startsWith("news:") ||
        linkTarget.startsWith("irc:") ||
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
    true,
  );
}

graph.forEachNode((node) => {
  const id = node.id;
  let parentId = node.id.replace(/\/[^/]+$/, "");
  const parentOverride = {
    "/en-US/docs/Glossary": null,
    "/en-US/docs/Web/CSS": null,
    "/en-US/docs": "/en-US/docs/Web",
  };
  parentId = parentId in parentOverride ? parentOverride[parentId] : parentId;
  if (
    parentId === "/en-US/docs/Web/API" &&
    node.data.metadata.pageType === "webgl-extension"
  ) {
    return;
  }
  if (parentId && parentId !== id && !graph.hasLink(parentId, id)) {
    report(node, "Not linked from parent page", parentId);
  }
});

const processedSidebars = new Map<
  string,
  {
    id: number;
    macro: string;
    links: { href: string | undefined; text: string }[];
    includedPages: string[];
  }
>();
const pageToSidebarId = new Map<string, number>();
let sidebarId = 0;

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
        `<a href="${node.id}"><code>${node.data.metadata.short_title}</code></a>`,
    );
  if (processedSidebars.has(normalizedHTML)) {
    processedSidebars.get(normalizedHTML)!.includedPages.push(node.id);
    pageToSidebarId.set(node.id, processedSidebars.get(normalizedHTML)!.id);
    continue;
  }
  const $ = load(normalizedHTML);
  const links = $("a")
    .map((i, a) => ({
      href: $(a).attr("href")?.replace(/\/$/, ""),
      text: $(a).text(),
    }))
    .get();
  processedSidebars.set(normalizedHTML, {
    id: sidebarId++,
    macro: sidebarMacro,
    links,
    includedPages: [node.id],
  });
  pageToSidebarId.set(node.id, processedSidebars.get(normalizedHTML)!.id);
}

const sidebarIds = new Map<
  number,
  {
    macro: string;
    links: { href: string | undefined; text: string }[];
    includedPages: string[];
  }
>();
for (const { id, macro, links, includedPages } of processedSidebars.values()) {
  sidebarIds.set(id, { macro, links, includedPages });
}

for (const { macro, links, includedPages } of sidebarIds.values()) {
  for (const { href, text } of links) {
    if (
      href &&
      macro === "AddonSidebar" &&
      [
        "#",
        "https://blog.mozilla.org/addons",
        "https://discourse.mozilla.org/c/add-ons",
        "https://chat.mozilla.org/#/room/%23addons:mozilla.org",
        "https://extensionworkshop.com/documentation/develop",
        "https://extensionworkshop.com/documentation/publish",
        "https://extensionworkshop.com/documentation/manage",
        "https://extensionworkshop.com/documentation/enterprise",
      ].includes(href)
    ) {
      continue;
    }
    if (href && href.startsWith("/en-US/")) {
      const targetNode = graph.getNode(href);
      if (
        !targetNode &&
        ![
          "/en-US/",
          "/en-US/curriculum/",
          "/en-US/observatory",
          "/en-US/play",
          "/en-US/plus",
        ].includes(href) &&
        !href.startsWith("/en-US/blog/")
      ) {
        report(
          graph.getNode(includedPages[0]!)!,
          "Broken sidebar link",
          text,
          href,
        );
      }
    } else {
      report(graph.getNode(includedPages[0]!)!, "Bad sidebar link", text, href);
    }
  }
}

for (const node of nodes) {
  const sidebar = sidebarIds.get(pageToSidebarId.get(node.id)!);
  if (!sidebar) continue;
  if (!sidebar.links.some(({ href }) => href === node.id)) {
    report(node, "Unreachable via sidebar");
  }
}
for (const node of unreachableViaPage) report(node, "Unreachable via page");

for (const node of nodes) {
  node.data.metadata = Object.fromEntries(
    [
      "flaws",
      "title",
      "pageType",
      "browserCompat",
      "summary",
      "popularity",
      "modified",
      "source",
      "short_title",
    ].map((key) => [key, node.data.metadata[key]]),
  );
  node.data.metadata.source = {
    folder: node.data.metadata.source.folder,
    last_commit_url: node.data.metadata.source.last_commit_url,
  };
  node.data.links = node.data.links.filter(
    (link) =>
      !link.startsWith("/en-US/") &&
      !link.startsWith("#") &&
      !link.includes("//localhost"),
  );
}

const commit = await $`git log -1 --format="%H %ct"`
  .cwd(Bun.fileURLToPath(import.meta.resolve(CONTENT_SOURCE_ROOT)))
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
    2,
  ),
);
