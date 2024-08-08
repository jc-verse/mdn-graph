import warnings from "../../data/warnings-processed.json" with { type: "json" };
import lastUpdate from "../../data/last-update.json" with { type: "json" };

type Message = { message: string; data: string[] };

type Warning = {
  messages?: Message[];
  children: Record<string, Warning>;
  slug: string;
};

const messages = new Map<string, number>();

function inc<K>(map: Map<K, number>, key: K) {
  if (map.has(key)) {
    map.set(key, map.get(key)! + 1);
  } else {
    map.set(key, 1);
  }
}

function collectMessages(node: Warning) {
  if (node.messages) {
    node.messages.forEach((m) => inc(messages, m.message));
  }
  for (const child of Object.values(node.children)) {
    collectMessages(child);
  }
}

collectMessages(warnings);

function createTree(
  root: HTMLElement,
  data: Warning,
  rootPath: string,
  predicate: (m: Message, key: string) => boolean,
  showMessage: boolean
): number {
  const ul = document.createElement("ul");
  let count = 0;
  for (const [key, value] of Object.entries(data.children)) {
    const li = document.createElement("li");
    const details = document.createElement("details");
    li.append(details);
    const summary = document.createElement("summary");
    details.append(summary);
    const messages = (value.messages ?? []).filter((m) =>
      predicate(m, `${rootPath}/${key}`)
    );
    if (messages.length) {
      summary.append(
        Object.assign(document.createElement("a"), {
          textContent: key,
          href: `https://developer.mozilla.org${value.slug}`,
          target: "_blank",
          rel: "noopener noreferrer",
        })
      );
      details.append(
        Object.assign(document.createElement("pre"), {
          textContent: messages
            .map((message) =>
              showMessage
                ? `${message.message} ${message.data.join(" ")}`
                : message.data.join(" ")
            )
            .join("\n"),
        })
      );
    } else {
      summary.textContent = key;
    }
    const subCount =
      createTree(details, value, `${rootPath}/${key}`, predicate, showMessage) +
      messages.length;
    if (subCount === 0) continue;
    if (rootPath === "" || (rootPath === "/en-us" && key === "web"))
      details.open = true;
    summary.append(` (${subCount})`);
    count += subCount;
    ul.append(li);
  }
  if (count <= 10) {
    for (const li of ul.children as HTMLCollectionOf<HTMLLIElement>)
      (li.children[0] as HTMLDetailsElement).open = true;
  }
  if (ul.childElementCount > 0) {
    root.append(ul);
  }
  return count;
}

function createTable(
  root: HTMLElement,
  data: Warning,
  predicate: (m: Message, key: string) => boolean,
  showMessage: boolean
) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.append(thead, tbody);
  let maxDataLen = 0;
  function createRow(data: Warning, parentPath: string) {
    if (data.messages) {
      for (const message of data.messages.filter((m) =>
        predicate(m, parentPath)
      )) {
        const tr = document.createElement("tr");
        tbody.append(tr);
        tr.appendChild(document.createElement("td")).append(
          Object.assign(document.createElement("a"), {
            textContent: parentPath,
            href: `https://developer.mozilla.org${data.slug}`,
            target: "_blank",
            rel: "noopener noreferrer",
          })
        );
        if (showMessage) {
          tr.appendChild(document.createElement("td")).textContent =
            message.message;
        }
        for (const value of message.data) {
          tr.appendChild(document.createElement("td")).textContent = value;
        }
        maxDataLen = Math.max(maxDataLen, message.data.length);
      }
    }
    for (const [key, value] of Object.entries(data.children)) {
      createRow(value, `${parentPath}/${key}`);
    }
  }
  createRow(data, "");
  const tr = document.createElement("tr");
  for (const header of showMessage
    ? ["Path", "Message", "Data"]
    : ["Path", "Data"]) {
    const th = document.createElement("th");
    th.textContent = header;
    if (header === "Data") {
      th.colSpan = maxDataLen;
    }
    tr.append(th);
  }
  thead.append(tr);
  root.append(table);
}

const messagesFilter = document.getElementById(
  "messages-filter"
) as HTMLSelectElement;
for (const message of [...messages].sort()) {
  const option = document.createElement("option");
  option.textContent = `${message[0]} (${message[1]})`;
  option.value = message[0];
  option.selected = true;
  messagesFilter.append(option);
}

messagesFilter.addEventListener("change", () => {
  displayWarnings();
});

const viewToggle = document.getElementById("view-toggle") as HTMLSelectElement;
viewToggle.addEventListener("change", () => {
  displayWarnings();
});

type IncludeExcludeConfig = {
  type: "include" | "exclude";
  pattern: RegExp;
};
const includeExclude: IncludeExcludeConfig[] = [];
const stored = localStorage.getItem("includeExclude");
if (stored) {
  includeExclude.push(
    ...JSON.parse(stored).map((x: IncludeExcludeConfig) => ({
      ...x,
      pattern: new RegExp(x.pattern.source, x.pattern.flags),
    }))
  );
}

const includeExcludeToggle = document.getElementById(
  "include-exclude-toggle"
) as HTMLButtonElement;
const includeExcludeDialog = document.getElementById(
  "include-exclude-dialog"
) as HTMLDialogElement;
const includeExcludeDialogClose = document.getElementById(
  "include-exclude-dialog-close"
) as HTMLButtonElement;
const includeExcludeInput = document.getElementById(
  "include-exclude-input"
) as HTMLInputElement;
const includeExcludeList = document.getElementById(
  "include-exclude-list"
) as HTMLUListElement;
function displayIncludeExclude() {
  localStorage.setItem(
    "includeExclude",
    JSON.stringify(includeExclude.map((x) => ({
      ...x,
      pattern: { source: x.pattern.source, flags: x.pattern.flags}
    })))
  );
  includeExcludeList.textContent = "";
  for (const item of includeExclude) {
    const li = document.createElement("li");
    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      includeExclude.splice(includeExclude.indexOf(item), 1);
      displayIncludeExclude();
      displayWarnings();
    });
    li.appendChild(remove);
    li.appendChild(document.createElement("code")).textContent = `${item.type === "include" ? "[+]" : "[-]"} ${item.pattern.source.replaceAll("\\/", "/")}`;
    includeExcludeList.append(li);
  }
}
includeExcludeToggle.addEventListener("click", () => {
  includeExcludeDialog.showModal();
});
includeExcludeDialogClose.addEventListener("click", () => {
  includeExcludeDialog.close();
});
includeExcludeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    includeExclude.push({
      type: document.getElementById("include-exclude-select")!.value,
      pattern: new RegExp(includeExcludeInput.value),
    });
    includeExcludeInput.value = "";
    displayIncludeExclude();
    displayWarnings();
  }
});

function displayWarnings() {
  const root = document.getElementById("tree-root")!;
  root.textContent = "";
  const selected = new Set(
    [...messagesFilter.selectedOptions].map((o) => o.value)
  );
  root.textContent = "";
  const predicate = (m: Message, key: string) => {
    if (!selected.has(m.message)) return false;
    for (const { type, pattern } of includeExclude) {
      if (type === "include" && !pattern.test(key)) return false;
      if (type === "exclude" && pattern.test(key)) return false;
    }
    return true;
  };
  const showMessage = selected.size > 1;
  if (document.getElementById("view-toggle")!.value === "tree") {
    createTree(root, warnings, "", predicate, showMessage);
  } else {
    createTable(root, warnings, predicate, showMessage);
  }
}

displayIncludeExclude();
displayWarnings();

const note = document.createElement("div");
const buildTime = new Date(lastUpdate.buildTimestamp);
const commitTime = new Date(lastUpdate.commitTimestamp);
note.innerHTML = `
Last updated: <time datetime="${buildTime.toISOString()}" title="${commitTime.toISOString()}">${buildTime.toLocaleString()}</time><br>
Based on commit <a href="https://github.com/mdn/content/tree/${
  lastUpdate.commitHash
}"><code>${lastUpdate.commitHash.slice(
  0,
  7
)}</code></a> (<time datetime="${commitTime.toISOString()}" title="${commitTime.toISOString()}">${commitTime.toLocaleString()}</time>)
`;
note.id = "note";
document.body.appendChild(note);
