import {
  nodes_default
} from "./chunk-3w13g30h.js";
import {
  last_update_default
} from "./chunk-2d6fq13x.js";

// src/client/external-links.ts
var noteBox = document.getElementById("note");
var treeRoot = document.getElementById("tree-root");
var viewToggle = document.getElementById("view-toggle");
var sortToggle = document.getElementById("sort-toggle");
var buildTime = new Date(last_update_default.buildTimestamp);
var commitTime = new Date(last_update_default.commitTimestamp);
noteBox.innerHTML = `
Last updated: <time datetime="${buildTime.toISOString()}" title="${buildTime.toISOString()}">${buildTime.toLocaleString()}</time><br>
Based on commit <a href="https://github.com/mdn/content/tree/${last_update_default.commitHash}"><code>${last_update_default.commitHash.slice(0, 7)}</code></a> (<time datetime="${commitTime.toISOString()}" title="${commitTime.toISOString()}">${commitTime.toLocaleString()}</time>)
`;
var linksByTLDp1 = new Map;
for (const node of nodes_default) {
  for (const link of node.data.links) {
    if (!link.startsWith("http"))
      continue;
    const linkURL = new URL(link);
    let domain = linkURL.host;
    if (linkURL.pathname !== "/" && (["github.com", "www.w3.org", "drafts.csswg.org"].includes(domain) || domain.endsWith(".github.io")))
      domain += `/${linkURL.pathname.split("/")[1]}`;
    if (domain === "www.w3.org/TR")
      domain += `/${linkURL.pathname.split("/")[2]}`;
    const tldp1 = linkURL.host.split(".").slice(-2).join(".");
    if (!linksByTLDp1.has(tldp1)) {
      linksByTLDp1.set(tldp1, { links: new Map, total: 0 });
    }
    if (!linksByTLDp1.get(tldp1).links.has(domain)) {
      linksByTLDp1.get(tldp1).links.set(domain, []);
    }
    linksByTLDp1.get(tldp1).links.get(domain).push({ page: node.id, link });
    linksByTLDp1.get(tldp1).total++;
  }
}
var linksByPage = new Map;
for (const node of nodes_default) {
  for (const link of node.data.links) {
    if (!link.startsWith("http"))
      continue;
    if (!linksByPage.has(node.id)) {
      linksByPage.set(node.id, []);
    }
    linksByPage.get(node.id).push(link);
  }
}
function compare(a, b, by) {
  const contentCompare = a[0].localeCompare(b[0], "en-US", { numeric: true });
  if (by === "alpha") {
    return contentCompare;
  }
  return b[1] - a[1] || contentCompare;
}
function showLinksByTLDp1(by) {
  loopTLDp1:
    for (const [tldp1, { links: allLinks, total }] of [
      ...linksByTLDp1
    ].sort((a, b) => compare([a[0], a[1].total], [b[0], b[1].total], by))) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      for (const [domain, links] of [...allLinks].sort((a, b) => compare([a[0], a[1].length], [b[0], b[1].length], by))) {
        const subDetails = document.createElement("details");
        subDetails.classList.add("sub-details");
        const subSummary = document.createElement("summary");
        subSummary.textContent = `${domain} (${links.length})`;
        subDetails.appendChild(subSummary);
        const linkTbl = document.createElement("table");
        linkTbl.innerHTML = `<thead><tr><th>Page</th><th>Link</th></tr></thead>`;
        const linkTbody = document.createElement("tbody");
        for (const { page, link } of links.sort((a, b) => a.page.localeCompare(b.page, "en-US", { numeric: true }))) {
          const row = document.createElement("tr");
          row.innerHTML = `<td>${page}</td><td><a href="${link}">${link}</a></td>`;
          linkTbody.appendChild(row);
        }
        linkTbl.appendChild(linkTbody);
        subDetails.appendChild(linkTbl);
        if (allLinks.size === 1) {
          summary.textContent = `${tldp1} (${total})`;
          details.appendChild(summary);
          details.appendChild(linkTbl);
          treeRoot.appendChild(details);
          continue loopTLDp1;
        } else {
          details.open = true;
        }
        details.appendChild(subDetails);
      }
      summary.textContent = `${tldp1} (${total})`;
      details.insertBefore(summary, details.firstChild);
      treeRoot.appendChild(details);
    }
}
function showLinksByPage(by) {
  for (const [url, links] of [...linksByPage].sort((a, b) => compare([a[0], a[1].length], [b[0], b[1].length], by))) {
    const details = document.createElement("details");
    const summary = details.appendChild(document.createElement("summary"));
    summary.textContent = `${url} (${links.length})`;
    const ul = details.appendChild(document.createElement("ul"));
    for (const link of links.sort((a, b) => a.localeCompare(b, "en-US", { numeric: true }))) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${link}">${link}</a>`;
      ul.appendChild(li);
    }
    treeRoot.appendChild(details);
  }
}
showLinksByTLDp1("alpha");
viewToggle.addEventListener("change", () => {
  treeRoot.innerHTML = "";
  if (viewToggle.value === "tldp1") {
    showLinksByTLDp1(sortToggle.value);
  } else if (viewToggle.value === "page") {
    showLinksByPage(sortToggle.value);
  }
});
sortToggle.addEventListener("change", () => {
  treeRoot.innerHTML = "";
  if (viewToggle.value === "tldp1") {
    showLinksByTLDp1(sortToggle.value);
  } else if (viewToggle.value === "page") {
    showLinksByPage(sortToggle.value);
  }
});
