import nodes from "../../data/nodes.json" with { type: "json" };
import links from "../../data/links.json" with { type: "json" };
import lastUpdate from "../../data/last-update.json" with { type: "json" };
import createGraph from "ngraph.graph";
import renderGraph from "ngraph.pixel";
import createLayout from "ngraph.forcelayout";

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
    "files/en-us/learn/tools_and_testing/client-side_javascript_frameworks/",
    "Content:Learn:Client-side",
  ],
  [
    "files/en-us/learn/tools_and_testing/understanding_client-side_tools/",
    "Content:Learn:Client-side",
  ],
  [
    "files/en-us/learn/tools_and_testing/cross_browser_testing/",
    "Content:Learn:Cross-Browser-Testing",
  ],
  ["files/en-us/learn/css", "Content:Learn:CSS"],
  ["files/en-us/learn/server-side/django", "Content:Learn:Django"],
  ["files/en-us/learn/server-side/express_nodejs/", "Content:Learn:Express"],
  ["files/en-us/learn/forms/", "Content:Learn:Forms"],
  ["files/en-us/learn/tools_and_testing/github/", "Content:Learn:GitHub"],
  ["files/en-us/learn/html/", "Content:Learn:HTML"],
  ["files/en-us/learn/javascript/", "Content:Learn:JavaScript"],
  ["files/en-us/learn/", "Content:Learn"],
  ["files/en-us/tutorials/", "Content:Learn"],
  ["files/en-us/web/manifest/", "Content:Manifest"],
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
  "Content:CSS": "0069c2",
  "Content:HTML": "d30038",
  "Content:WebExt": "442be5",
  "Content:WebAPI": "f204a7",
  "Content:JS": "cfc100",
  "Content:Learn": "5846ba",
  "Content:Other": "9adaf9",
  "Content:HTTP": "AAE890",
  "Content:DevTools": "000000",
  "Content:Accessibility": "65AFC3",
  "Content:SVG": "0052CC",
  "Content:Media": "592477",
  "Content:Learn:Django": "BFDADC",
  "Content:Learn:Express": "5C3B16",
  "Content:wasm": "29ED02",
  "Content:MathML": "BEDBB2",
  "Content:Glossary": "C2E0C6",
  "Content:WebDriver": "d93f0b",
  "Content:Games": "A3AFA3",
  "Content:Performance": "F04AD9",
  "Content:Guide": "bfd4f2",
  "Content:Events": "67366C",
  "Content:Security": "0052cc",
  "Content:Learn:Client-side": "306B93",
  "Content:Learn:JavaScript": "F299BF",
  "Content:Firefox": "8A6948",
  "Content:Meta": "c5def5",
  "Content:Learn:CSS": "92C2C1",
  "Content:Learn:HTML": "ededed",
  "Content:Learn:Accessibility": "ededed",
  "Content:Learn:Forms": "ededed",
  "Content:Manifest": "ededed",
  "Content:Learn:Cross-Browser-Testing": "ededed",
  "Content:PWA": "41AEE3",
  "Content:Learn:GitHub": "ededed",
};

renderGraph(graph, {
  createLayout,
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
    const fromNode = graph.getNode(l.fromId);
    const toNode = graph.getNode(l.toId);
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

const note = document.createElement("div");
const buildTime = new Date(lastUpdate.buildTimestamp);
const commitTime = new Date(lastUpdate.commitTimestamp);
note.innerHTML = `
Last updated: <time datetime="${buildTime.toISOString()}" title="${commitTime.toISOString()}">${buildTime.toLocaleString()}</time><br>
Based on commit <a href="https://github.com/mdn/content/tree/${lastUpdate.commitHash}"><code>${lastUpdate.commitHash.slice(0, 7)}</code></a> (<time datetime="${commitTime.toISOString()}" title="${commitTime.toISOString()}">${commitTime.toLocaleString()}</time>)
`;
note.id = "note";
document.body.appendChild(note);
