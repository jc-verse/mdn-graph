import type { Node } from "ngraph.graph";
import warnings from "../../data/warnings.json" with { type: "json" };
import nodes from "../../data/nodes.json" with { type: "json" };
import { checkBCDMatching } from "./check-bcd-matching.js";
import {
  createLinkRequests,
  depleteQueue,
  reportBrokenLinks,
  postExternalLinkCheck,
} from "./check-external-link.js";
import { readConfig, configHas } from "./config.js";

function report(node: Node, message: string, ...data: string[]) {
  const nodeWarnings = (warnings[node.data.metadata.source.folder] ??= []);
  nodeWarnings.push({
    message,
    data,
  });
}

const missingFeatures = new Set(
  (await readConfig("missing-features.txt")).map((x) => {
    // JS has no undocumented things
    if (x.startsWith("javascript.")) return;
    const [scope, interfac, member, ...rest] = x.split(".");
    if (rest.length) {
      console.error("Unexpected data:", x);
      return;
    }
    if (!member && scope !== "api" && scope !== "webassembly") {
      console.error("Unexpected data:", x);
      return;
    }
    switch (scope) {
      case "api":
        if (!member) return `/en-US/docs/Web/API/${interfac}`;
        return `/en-US/docs/Web/API/${interfac}/${member}`;
      case "css":
        return `/en-US/docs/Web/CSS/${member}`;
      case "http":
        if (interfac === "headers") {
          return `/en-US/docs/Web/HTTP/Headers/${member}`;
        }
        break;
      case "webdriver":
        if (interfac === "bidi" || interfac === "classic") {
          return `/en-US/docs/Web/WebDriver/Commands/${member}`;
        }
        break;
      case "webassembly":
        // Not structured enough
        return;
    }
    console.error("Unexpected data:", x);
  }),
);

const noPage = new Map(
  (await readConfig("no-page.txt")).map((x) => [x, false]),
);

const { checkedLinks, linkRequests } = createLinkRequests(report);
if (!Bun.argv.includes("--no-external-link-check")) {
  await depleteQueue(linkRequests);
} else {
  console.warn("Skipping external link check");
}
reportBrokenLinks(report, checkedLinks);
postExternalLinkCheck();

checkBCDMatching(report);

for (const node of nodes) {
  if (
    !node.data.metadata.flaws ||
    Object.keys(node.data.metadata.flaws).length === 0
  )
    continue;
  const nodeWarnings = (warnings[node.data.metadata.source.folder] ??= []);
  Object.entries(node.data.metadata.flaws).forEach(([id, data]) => {
    data.forEach((d) => {
      if (id === "broken_links") {
        // TODO: Yari bug
        if (["/en-US/play", "/en-US/plus"].includes(d.href)) return;
        const correspondingWarning = nodeWarnings.find(
          (w) =>
            w.message === "Broken link" &&
            w.data[0] === d.href.replace(/#.+/, "") &&
            w.data.at(-1) !== "(and flaw)",
        );
        if (correspondingWarning) {
          correspondingWarning.data.push("(and flaw)");
          return;
        }
        if (d.explanation !== "Link points to the page it's already on") {
          // After https://github.com/mdn/yari/pull/12045, Yari no longer
          // emits broken links with hrefs. This means that our broken link
          // check is essentially useless. However we do want to keep the
          // config-based exclusion mechanism, so we restore to the former
          // state by migrating flaws to warnings.
          nodeWarnings.push({
            message: "Broken link",
            data: [d.href, d.explanation.replace(d.href, "").trim()],
          });
          return;
        }
      } else if (id === "macros") {
        if (d.explanation.endsWith("does not exist")) {
          const url = d.explanation.replace(" does not exist", "");
          if (missingFeatures.has(url) || configHas(noPage, url)) return;
        }
      } else if (id === "images") {
        if (
          d.explanation === "External image URL" &&
          d.src.startsWith("https://mdn.github.io/shared-assets")
        ) {
          return;
        }
      } else if (id === "bad_bcd_queries") {
        const correspondingWarning = nodeWarnings.find(
          (w) =>
            w.message === "Not in BCD" ||
            (w.message === "Unexpected BCD keys" && w.data.at(-1) === "[None]"),
        );
        if (correspondingWarning) {
          correspondingWarning.data.push("(and flaw)");
          return;
        }
      }
      nodeWarnings.push({
        message: `Flaw ${id}`,
        data: [d.macroName, d.explanation],
      });
    });
  });
}

const warningList = Object.entries(warnings);
warningList.sort(([a], [b]) =>
  a.replaceAll("/", "").localeCompare(b.replaceAll("/", "")),
);

const tree = { children: {}, slug: "" };

const nodeToSlug = new Map(
  nodes.map((x) => [x.data.metadata.source.folder, x.id]),
);

for (const [nodeId, baseMessages] of warningList) {
  const messages = baseMessages.filter(
    (x) =>
      !(
        // Caused by broken macros which are reported
        (
          x.message === "Missing href" ||
          (x.message === "Broken link" &&
            (missingFeatures.has(x.data[0]) || configHas(noPage, x.data[0]))) ||
          (x.message === "Broken sidebar link" &&
            (missingFeatures.has(x.data[1]) || configHas(noPage, x.data[1])))
        )
      ),
  );
  if (messages.length === 0) continue;
  const parts = nodeId.split("/");
  let current = tree;
  for (const part of parts) {
    current = current.children[part] ??= { children: {} };
  }
  current.slug = nodeToSlug.get(nodeId);
  current.messages = messages;
}

await Bun.write("data/warnings-processed.json", JSON.stringify(tree, null, 2));

for (const [url, used] of noPage) {
  if (!used) {
    console.error(`${url} is no longer referenced`);
  }
}

// TODO why do I need to do this?
// Otherwise CI is stuck for 10min
process.exit(0);
