import warnings from "../../data/warnings.json" with { type: "json" };
import nodes from "../../data/nodes.json" with { type: "json" };

for (const node of nodes) {
  if (Object.keys(node.data.metadata.flaws).length === 0) continue;
  const nodeWarnings = (warnings[node.data.metadata.source.folder] ??= []);
  Object.entries(node.data.metadata.flaws).forEach(([id, data]) => {
    data.forEach((d) => {
      if (id === "broken_links") {
        const correspondingWarning = nodeWarnings.find(
          (w) =>
            w.message === "Broken link to" &&
            w.data[0] === d.href.replace(/#.+/, "") &&
            w.data.at(-1) !== "(and flaw)"
        );
        if (correspondingWarning) {
          correspondingWarning.data.push("(and flaw)");
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

for (const [nodeId, messages] of warningList) {
  if (nodeId.includes("/mozilla/")) continue;
  console.log(`../content/files/${nodeId}/index.md`);
  for (const { message, data } of messages) {
    // Caused by broken macros which are reported
    if (message === "Missing href") continue;
    // if (message === "Broken anchor") {
    //   console.log(
    //     `files/${nodeId}/index.md\t${
    //       data.length === 1
    //         ? [nodeId.replace(/^en-us/, "/en-us/docs"), ...data].join("")
    //         : data.join("")
    //     }`
    //   );
    // }
    console.log(`  ${message} ${data.join(" ")}`);
  }
}
