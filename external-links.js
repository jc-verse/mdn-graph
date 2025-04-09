import {
  nodes_default
} from "./chunk-c3ctcqpr.js";
import {
  last_update_default
} from "./chunk-5j0jk2r1.js";

// src/client/external-links.ts
var noteBox = document.getElementById("note");
var treeRoot = document.getElementById("tree-root");
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
    if (linkURL.pathname !== "/" && (["github.com", "www.w3.org"].includes(domain) || domain.endsWith(".github.io")))
      domain += `/${linkURL.pathname.split("/")[1]}`;
    const tldp1 = linkURL.host.split(".").slice(-2).join(".");
    if (!linksByTLDp1.has(tldp1)) {
      linksByTLDp1.set(tldp1, new Map);
    }
    if (!linksByTLDp1.get(tldp1).has(domain)) {
      linksByTLDp1.get(tldp1).set(domain, []);
    }
    linksByTLDp1.get(tldp1).get(domain).push({ page: node.id, link });
  }
}
loopTLDp1:
  for (const [tldp1, allLinks] of [...linksByTLDp1].sort((a, b) => a[0].localeCompare(b[0], "en-US", { numeric: true }))) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    let totalLinks = 0;
    for (const [domain, links] of [...allLinks].sort((a, b) => a[0].localeCompare(b[0], "en-US", { numeric: true }))) {
      const subDetails = document.createElement("details");
      subDetails.classList.add("sub-details");
      const subSummary = document.createElement("summary");
      subSummary.textContent = `${domain} (${links.length})`;
      subDetails.appendChild(subSummary);
      totalLinks += links.length;
      const linkTbl = document.createElement("table");
      linkTbl.innerHTML = `<thead><tr><th>Page</th><th>Link</th></tr></thead>`;
      const linkTbody = document.createElement("tbody");
      for (const { page, link } of links) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${page}</td><td><a href="${link}">${link}</a></td>`;
        linkTbody.appendChild(row);
      }
      linkTbl.appendChild(linkTbody);
      subDetails.appendChild(linkTbl);
      if (allLinks.size === 1) {
        summary.textContent = `${tldp1} (${totalLinks})`;
        details.appendChild(summary);
        details.appendChild(linkTbl);
        treeRoot.appendChild(details);
        continue loopTLDp1;
      } else {
        details.open = true;
      }
      details.appendChild(subDetails);
    }
    summary.textContent = `${tldp1} (${totalLinks})`;
    details.insertBefore(summary, details.firstChild);
    treeRoot.appendChild(details);
  }
