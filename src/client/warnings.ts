import warnings from "../../data/warnings-processed.json" with { type: "json" };
import lastUpdate from "../../data/last-update.json" with { type: "json" };

type Message = { message: string; data: (string | null)[] };

type Warning = {
  messages?: Message[];
  children: Record<string, Warning>;
  slug?: string;
};

type IncludeExcludeConfig = {
  type: "include" | "exclude";
  pattern: RegExp;
};

const messagesFilter = document.getElementById(
  "messages-filter",
) as HTMLSelectElement;
const viewToggle = document.getElementById("view-toggle") as HTMLSelectElement;
const includeExcludeToggle = document.getElementById(
  "include-exclude-toggle",
) as HTMLButtonElement;
const includeExcludeDialog = document.getElementById(
  "include-exclude-dialog",
) as HTMLDialogElement;
const includeExcludeDialogClose = document.getElementById(
  "include-exclude-dialog-close",
) as HTMLButtonElement;
const includeExcludeInput = document.getElementById(
  "include-exclude-input",
) as HTMLInputElement;
const includeExcludeList = document.getElementById(
  "include-exclude-list",
) as HTMLUListElement;
const includeExcludeSelect = document.getElementById(
  "include-exclude-select",
) as HTMLSelectElement;
const treeRoot = document.getElementById("tree-root") as HTMLDivElement;
const noteBox = document.getElementById("note") as HTMLDivElement;

const messageCounts = new Map<string, number>();
const includeExclude: IncludeExcludeConfig[] = [];
const stored = localStorage.getItem("includeExclude");
if (stored) {
  includeExclude.push(
    ...JSON.parse(stored).map((x: IncludeExcludeConfig) => ({
      ...x,
      pattern: new RegExp(x.pattern.source, x.pattern.flags),
    })),
  );
}

displayIncludeExclude();
displayWarnings();

const buildTime = new Date(lastUpdate.buildTimestamp);
const commitTime = new Date(lastUpdate.commitTimestamp);
noteBox.innerHTML = `
Last updated: <time datetime="${buildTime.toISOString()}" title="${buildTime.toISOString()}">${buildTime.toLocaleString()}</time><br>
Based on commit <a href="https://github.com/mdn/content/tree/${
  lastUpdate.commitHash
}"><code>${lastUpdate.commitHash.slice(
  0,
  7,
)}</code></a> (<time datetime="${commitTime.toISOString()}" title="${commitTime.toISOString()}">${commitTime.toLocaleString()}</time>)
`;

messagesFilter.addEventListener("change", () => {
  displayWarnings();
});
viewToggle.addEventListener("change", () => {
  displayWarnings();
});
includeExcludeToggle.addEventListener("click", () => {
  includeExcludeDialog.showModal();
});
includeExcludeDialogClose.addEventListener("click", () => {
  includeExcludeDialog.close();
});
includeExcludeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    includeExclude.push({
      type: includeExcludeSelect.value,
      pattern: new RegExp(includeExcludeInput.value),
    });
    includeExcludeInput.value = "";
    displayIncludeExclude();
    displayWarnings();
  }
});

function inc<K>(map: Map<K, number>, key: K) {
  if (map.has(key)) {
    map.set(key, map.get(key)! + 1);
  } else {
    map.set(key, 1);
  }
}

function createTree(
  root: HTMLElement,
  data: Warning,
  rootPath: string,
  displayedMessages: Set<string> | undefined,
  fileIncluded: (key: string) => boolean,
  showMessage: boolean,
): number {
  const ul = document.createElement("ul");
  let count = 0;
  for (const [key, value] of Object.entries(data.children)) {
    const li = document.createElement("li");
    const details = document.createElement("details");
    li.append(details);
    const summary = document.createElement("summary");
    details.append(summary);
    let messages = fileIncluded(`${rootPath}/${key}`)
      ? (value.messages ?? [])
      : [];
    for (const message of messages) inc(messageCounts, message.message);
    if (displayedMessages)
      messages = messages.filter((m) => displayedMessages.has(m.message));
    if (messages.length) {
      summary.append(
        Object.assign(document.createElement("a"), {
          textContent: key,
          href: `https://developer.mozilla.org${value.slug}`,
          target: "_blank",
          rel: "noopener noreferrer",
        }),
      );
      details.append(
        Object.assign(document.createElement("pre"), {
          textContent: messages
            .map((message) =>
              showMessage
                ? `${message.message} ${message.data.join(" ")}`
                : message.data.join(" "),
            )
            .join("\n"),
        }),
      );
    } else {
      summary.textContent = key;
    }
    const subCount =
      createTree(
        details,
        value,
        `${rootPath}/${key}`,
        displayedMessages,
        fileIncluded,
        showMessage,
      ) + messages.length;
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
  displayedMessages: Set<string> | undefined,
  fileIncluded: (key: string) => boolean,
  showMessage: boolean,
) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.append(thead, tbody);
  let maxDataLen = 0;
  function createRow(data: Warning, parentPath: string) {
    let messages = fileIncluded(parentPath) ? (data.messages ?? []) : [];
    for (const message of messages) inc(messageCounts, message.message);
    if (displayedMessages)
      messages = messages.filter((m) => displayedMessages.has(m.message));
    for (const message of messages) {
      const tr = document.createElement("tr");
      tbody.append(tr);
      tr.appendChild(document.createElement("td")).append(
        Object.assign(document.createElement("a"), {
          textContent: parentPath,
          href: `https://developer.mozilla.org${data.slug}`,
          target: "_blank",
          rel: "noopener noreferrer",
        }),
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

function displayIncludeExclude() {
  localStorage.setItem(
    "includeExclude",
    JSON.stringify(
      includeExclude.map((x) => ({
        ...x,
        pattern: { source: x.pattern.source, flags: x.pattern.flags },
      })),
    ),
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
    li.appendChild(document.createElement("code")).textContent = `${
      item.type === "include" ? "[+]" : "[-]"
    } ${item.pattern.source.replaceAll("\\/", "/")}`;
    includeExcludeList.append(li);
  }
}

function displayWarnings() {
  treeRoot.textContent = "";
  // On initial render there's no options yet, which are only available after a
  // tree traversal
  const selected = messagesFilter.hasChildNodes()
    ? new Set([...messagesFilter.selectedOptions].map((o) => o.value))
    : undefined;
  treeRoot.textContent = "";
  const fileIncluded = (path: string) => {
    for (const { type, pattern } of includeExclude) {
      if (type === "include" && !pattern.test(path)) return false;
      if (type === "exclude" && pattern.test(path)) return false;
    }
    return true;
  };
  const showMessage = !selected || selected.size > 1;
  messageCounts.clear();
  if (viewToggle.value === "tree") {
    createTree(treeRoot, warnings, "", selected, fileIncluded, showMessage);
  } else {
    createTable(treeRoot, warnings, selected, fileIncluded, showMessage);
  }
  messagesFilter.textContent = "";
  const internalLinkIssues = document.createElement("optgroup");
  internalLinkIssues.label = "Internal link issues";
  const externalLinkIssues = document.createElement("optgroup");
  externalLinkIssues.label = "External link issues";
  const badContent = document.createElement("optgroup");
  badContent.label = "Bad content";
  const yariFlaws = document.createElement("optgroup");
  yariFlaws.label = "Yari flaws";
  const graphStructure = document.createElement("optgroup");
  graphStructure.label = "Graph structure issues";
  const metadataIssues = document.createElement("optgroup");
  metadataIssues.label = "Metadata issues";
  const codeIssues = document.createElement("optgroup");
  codeIssues.label = "Code issues";
  const other = document.createElement("optgroup");
  other.label = "Other";
  for (const message of [...messageCounts].sort()) {
    const option = document.createElement("option");
    option.textContent = `${message[0]} (${message[1]})`;
    option.value = message[0];
    option.selected = selected ? selected.has(message[0]) : true;
    if (
      [
        "Broken anchor",
        "Broken link",
        "Broken sidebar link",
        "Image link",
        "Self link",
        "Replace DT link with real target",
      ].includes(message[0])
    ) {
      internalLinkIssues.append(option);
    } else if (
      [
        "Broken external link",
        "External sandbox link",
        "HTTP link",
        "Redirected external link",
        "Unshortened bug link",
      ].includes(message[0])
    ) {
      externalLinkIssues.append(option);
    } else if (
      [
        "Bad DL",
        "Bad href",
        "Bad sidebar link",
        "Code with space",
        "Code with underscore",
        "Duplicate specifications",
        "Missing BCD table",
        "Missing data",
        "Missing sidebar",
        "Missing specifications",
        "Possibly unrendered Markdown",
        "Quoted code",
        "Text stuck to code/link",
      ].includes(message[0])
    ) {
      badContent.append(option);
    } else if (message[0].startsWith("Flaw")) {
      yariFlaws.append(option);
    } else if (
      [
        "Unreachable via page",
        "Unreachable via sidebar",
        "Not linked from parent page",
      ].includes(message[0])
    ) {
      graphStructure.append(option);
    } else if (
      ["Not in BCD", "Unexpected BCD keys", "Unexpected page type"].includes(
        message[0],
      )
    ) {
      metadataIssues.append(option);
    } else if (
      ["Invalid code block language", "ESLint error"].includes(
        message[0],
      )
    ) {
      codeIssues.append(option);
    } else {
      other.append(option);
    }
  }
  for (const optgroup of [
    internalLinkIssues,
    externalLinkIssues,
    badContent,
    yariFlaws,
    graphStructure,
    metadataIssues,
    codeIssues,
    other,
  ]) {
    if (optgroup.hasChildNodes()) {
      messagesFilter.append(document.createElement("hr"));
      messagesFilter.append(optgroup);
    }
  }
}
