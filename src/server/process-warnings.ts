import warnings from "./warnings.json" with { type: "json" };

const warningList = Object.entries(warnings);
warningList.sort(([a], [b]) => a.replaceAll("/", "").localeCompare(b.replaceAll("/", "")));

for (const [nodeId, messages] of warningList) {
  for (const { message, data } of messages) {
    if (message === "Broken anchor") {
      console.log(
        `files/${nodeId}/index.md\t${
          data.length === 1
            ? [nodeId.replace(/^en-us/, "/en-us/docs"), ...data].join("")
            : data.join("")
        }`
      );
    }
  }
}
