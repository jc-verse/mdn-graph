import warnings from "../../data/warnings.json" with { type: "json" };
import nodes from "../../data/nodes.json" with { type: "json" };

const missingFeatures = new Set(
  (
    await Bun.file(
      Bun.fileURLToPath(
        import.meta.resolve("../../config/missing-features.txt")
      )
    ).text()
  )
    .split("\n")
    .filter((x) => x && !x.startsWith("  "))
    .map((x) => {
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
          if (interfac === "commands") {
            return `/en-US/docs/Web/WebDriver/Commands/${member}`;
          }
          break;
        case "webassembly":
          // Not structured enough
          return;
      }
      console.error("Unexpected data:", x);
    })
);

const noPageRec = new Map(
  (
    await Bun.file(
      Bun.fileURLToPath(import.meta.resolve("../../config/no-page.txt"))
    ).text()
  )
    .split("\n")
    .filter((x) => x && !x.startsWith("  "))
    .map((x) => [x, false])
);

const allowedHTTPSitesRec = new Map(
  (
    await Bun.file(
      Bun.fileURLToPath(import.meta.resolve("../../config/http-sites.txt"))
    ).text()
  )
    .split("\n")
    .filter((x) => x && !x.startsWith("  "))
    .map((x) => [x, false])
);

for (const node of nodes) {
  if (Object.keys(node.data.metadata.flaws).length === 0) continue;
  const nodeWarnings = (warnings[node.data.metadata.source.folder] ??= []);
  Object.entries(node.data.metadata.flaws).forEach(([id, data]) => {
    data.forEach((d) => {
      if (id === "broken_links") {
        const correspondingWarning = nodeWarnings.find(
          (w) =>
            w.message === "Broken link" &&
            w.data[0] === d.href.replace(/#.+/, "") &&
            w.data.at(-1) !== "(and flaw)"
        );
        if (correspondingWarning) {
          correspondingWarning.data.push("(and flaw)");
          return;
        }
        if (d.explanation !== "Link points to the page it's already on") {
          console.error("Broken link not caught by warnings:", d.href);
        }
      } else if (id === "macros") {
        if (d.explanation.endsWith("does not exist")) {
          const url = d.explanation.replace(" does not exist", "");
          if (missingFeatures.has(url)) return;
          else if (noPageRec.has(url)) {
            noPageRec.set(url, true);
            return;
          }
        }
      } else if (id === "images") {
        if (
          d.explanation === "External image URL" &&
          d.src.startsWith("https://mdn.github.io/shared-assets")
        ) {
          return;
        }
      }
      nodeWarnings.push({
        message: "Flaw",
        data: [id, d.macroName, d.explanation],
      });
    });
  });
}

const warningList = Object.entries(warnings);
warningList.sort(([a], [b]) =>
  a.replaceAll("/", "").localeCompare(b.replaceAll("/", ""))
);

const brokenAnchors = Bun.file("broken-anchors.txt");
Bun.write(brokenAnchors, "");
const brokenAnchorsWriter = brokenAnchors.writer();

for (const [nodeId, messages] of warningList) {
  if (nodeId.includes("/mozilla/") || messages.length === 0) continue;
  for (const { message, data } of messages) {
    if (message === "Broken anchor") {
      brokenAnchorsWriter.write(
        `files/${nodeId}/index.md\t${
          data.length === 1
            ? [nodeId.replace(/^en-us/, "/en-us/docs"), ...data].join("")
            : data.join("")
        }\n`
      );
    }
  }
}

const tree = { children: {}, slug: "" };

for (const [nodeId, baseMessages] of warningList) {
  const messages = baseMessages.filter(
    (x) =>
      !(
        // Caused by broken macros which are reported
        (
          x.message === "Missing href" ||
          (x.message === "Broken link" &&
            (missingFeatures.has(x.data[0]) ||
              (noPageRec.has(x.data[0]) &&
                (noPageRec.set(x.data[0], true), true)))) ||
          (x.message === "HTTP link" &&
            allowedHTTPSitesRec.has(new URL(x.data[0]).origin) &&
            (allowedHTTPSitesRec.set(new URL(x.data[0]).origin, true), true))
        )
      )
  );
  if (nodeId.includes("/mozilla/") || messages.length === 0) continue;
  const parts = nodeId.split("/");
  let current = tree;
  for (const part of parts) {
    current = current.children[part] ??= { children: {} };
  }
  current.slug = nodeId;
  current.messages = messages;
}

Bun.write("data/warnings-processed.json", JSON.stringify(tree, null, 2));

brokenAnchorsWriter.end();

for (const [url, used] of noPageRec) {
  if (!used) {
    console.error(`${url} is no longer referenced`);
  }
}

for (const [site, used] of allowedHTTPSitesRec) {
  if (!used) {
    console.error(`${site} is no longer referenced in content`);
  }
}
