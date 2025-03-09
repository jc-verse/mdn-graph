import nodes from "../../data/nodes.json" with { type: "json" };
import links from "../../data/links.json" with { type: "json" };
import lastUpdate from "../../data/last-update.json" with { type: "json" };
import createGraph from "ngraph.graph";
import renderGraph from "./ngraph.pixel";

const graph = createGraph();
for (const node of nodes) {
  graph.addNode(node.id, node.data);
}
for (const link of links) {
  graph.addLink(link.fromId, link.toId);
}

const layoutSettings = {
  dimensions: 3,
};

const pathToLabel = [
  ["files/en-us/web/accessibility/", "Content:Accessibility"],
  ["files/en-us/web/css/", "Content:CSS"],
  ["files/en-us/web/events/", "Content:Events"],
  ["files/en-us/mozilla/add-ons/webextensions/", "Content:WebExt"],
  ["files/en-us/mozilla/firefox/", "Content:Firefox"],
  ["files/en-us/games/", "Content:Games"],
  ["files/en-us/glossary/", "Content:Glossary"],
  ["files/en-us/web/html/", "Content:HTML"],
  ["files/en-us/web/http/", "Content:HTTP"],
  ["files/en-us/web/javascript/", "Content:JS"],
  [
    "files/en-us/learn_web_development/core/accessibility/",
    "Content:Learn:Accessibility",
  ],
  [
    "files/en-us/learn_web_development/core/frameworks_libraries/",
    "Content:Learn:Client-side",
  ],
  [
    "files/en-us/learn_web_development/extensions/client-side_apis/",
    "Content:Learn:Client-side",
  ],
  [
    "files/en-us/learn_web_development/extensions/client-side_tools/",
    "Content:Learn:Client-side",
  ],
  [
    "files/en-us/learn_web_development/extensions/testing/",
    "Content:Learn:Cross-Browser-Testing",
  ],
  [
    "files/en-us/learn_web_development/core/styling_basics/",
    "Content:Learn:CSS",
  ],
  ["files/en-us/learn_web_development/core/text_styling/", "Content:Learn:CSS"],
  ["files/en-us/learn_web_development/core/css_layout/", "Content:Learn:CSS"],
  [
    "files/en-us/learn_web_development/extensions/server-side/django/",
    "Content:Learn:Django",
  ],
  [
    "files/en-us/learn_web_development/extensions/server-side/express_nodejs/",
    "Content:Learn:Express",
  ],
  [
    "files/en-us/learn_web_development/extensions/forms/",
    "Content:Learn:Forms",
  ],
  [
    "files/en-us/learn_web_development/core/structuring_content/",
    "Content:Learn:HTML",
  ],
  [
    "files/en-us/learn_web_development/core/scripting/",
    "Content:Learn:JavaScript",
  ],
  [
    "files/en-us/learn_web_development/extensions/advanced_javascript_objects/",
    "Content:Learn:JavaScript",
  ],
  [
    "files/en-us/learn_web_development/extensions/async_js/",
    "Content:Learn:JavaScript",
  ],
  ["files/en-us/learn_web_development/", "Content:Learn"],
  ["files/en-us/web/mathml/", "Content:MathML"],
  ["files/en-us/web/media/", "Content:Media"],
  ["files/en-us/mdn/", "Content:Meta"],
  ["files/en-us/web/performance/", "Content:Performance"],
  ["files/en-us/web/progressive_web_apps/", "Content:PWA"],
  ["files/en-us/web/security/", "Content:Security"],
  ["files/en-us/web/svg/", "Content:SVG"],
  ["files/en-us/webassembly/", "Content:wasm"],
  ["files/en-us/web/api/", "Content:WebAPI"],
  ["files/en-us/web/webdriver/", "Content:WebDriver"],
];

const colorMap = {
  "Content:Accessibility": "65AFC3",
  "Content:CSS": "0069c2",
  "Content:DevTools": "000000",
  "Content:Events": "67366C",
  "Content:Firefox": "8A6948",
  "Content:Games": "A3AFA3",
  "Content:Glossary": "C2E0C6",
  "Content:HTML": "d30038",
  "Content:HTTP": "AAE890",
  "Content:JS": "cfc100",
  "Content:Learn:Accessibility": "ededed",
  "Content:Learn:Client-side": "306B93",
  "Content:Learn:Cross-Browser-Testing": "ededed",
  "Content:Learn:CSS": "92C2C1",
  "Content:Learn:Django": "BFDADC",
  "Content:Learn:Express": "5C3B16",
  "Content:Learn:Forms": "ededed",
  "Content:Learn:HTML": "ededed",
  "Content:Learn:JavaScript": "F299BF",
  "Content:Learn": "F26F8C",
  "Content:MathML": "BEDBB2",
  "Content:Media": "592477",
  "Content:Meta": "c5def5",
  "Content:Other": "9adaf9",
  "Content:Performance": "F04AD9",
  "Content:PWA": "41AEE3",
  "Content:Security": "0052cc",
  "Content:SVG": "0052CC",
  "Content:wasm": "29ED02",
  "Content:WebAPI": "f204a7",
  "Content:WebDriver": "d93f0b",
  "Content:WebExt": "442be5",
};

renderGraph(graph, {
  node(n) {
    const label =
      pathToLabel.find(([path]) =>
        `files/${n.data.metadata.source.folder}`.startsWith(path),
      )?.[1] ?? "Content:Other";
    return {
      color: parseInt(colorMap[label] ?? colorMap["Content:Other"], 16),
      size: 5,
      label,
    };
  },
  link(l) {
    const fromNode = graph.getNode(l.fromId)!;
    const toNode = graph.getNode(l.toId)!;
    const sourceLabel =
      pathToLabel.find(([path]) =>
        `files/${fromNode.data.metadata.source.folder}/index.md`.startsWith(
          path,
        ),
      )?.[1] ?? "Content:Other";
    const targetLabel =
      pathToLabel.find(([path]) =>
        `files/${toNode.data.metadata.source.folder}/index.md`.startsWith(path),
      )?.[1] ?? "Content:Other";
    return {
      fromColor: parseInt(
        colorMap[sourceLabel] ?? colorMap["Content:Other"],
        16,
      ),
      toColor: parseInt(colorMap[targetLabel] ?? colorMap["Content:Other"], 16),
    };
  },
  ...layoutSettings,
});

const note = document.getElementById("note");
const buildTime = new Date(lastUpdate.buildTimestamp);
const commitTime = new Date(lastUpdate.commitTimestamp);
note.innerHTML = `
Last updated: <time datetime="${buildTime.toISOString()}" title="${commitTime.toISOString()}">${buildTime.toLocaleString()}</time><br>
Based on commit <a href="https://github.com/mdn/content/tree/${lastUpdate.commitHash}"><code>${lastUpdate.commitHash.slice(0, 7)}</code></a> (<time datetime="${commitTime.toISOString()}" title="${commitTime.toISOString()}">${commitTime.toLocaleString()}</time>)
`;
