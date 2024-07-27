import warnings from "../../data/warnings-processed.json" with { type: "json" };

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
    node.messages.forEach((m) =>
      m.message === "Flaw"
        ? inc(messages, `${m.message} ${m.data[0]}`)
        : inc(messages, m.message)
    );
  }
  for (const child of Object.values(node.children)) {
    collectMessages(child);
  }
}

collectMessages(warnings);

function createTree(
  root: HTMLElement,
  data: Warning,
  depth: number,
  predicate: (m: Message) => boolean
): number {
  const ul = document.createElement("ul");
  let count = 0;
  for (const [key, value] of Object.entries(data.children)) {
    const li = document.createElement("li");
    const details = document.createElement("details");
    li.append(details);
    const summary = document.createElement("summary");
    details.append(summary);
    const messages = (value.messages ?? []).filter(predicate);
    if (messages.length) {
      summary.append(
        Object.assign(document.createElement("a"), {
          textContent: key,
          href: `https://developer.mozilla.org/${value.slug.replace(/^en-us/, "en-us/docs")}`,
          target: "_blank",
          rel: "noopener noreferrer",
        })
      );
      details.append(
        Object.assign(document.createElement("pre"), {
          textContent: messages
            .map((message) => `${message.message} ${message.data.join(" ")}`)
            .join("\n"),
        })
      );
    } else {
      summary.textContent = key;
    }
    const subCount = createTree(details, value, depth + 1, predicate) + messages.length;
    if (subCount === 0) continue;
    if (depth === 0 || (depth === 1 && key === "web"))
      details.open = true;
    summary.append(` (${subCount})`);
    count += subCount;
    ul.append(li);
  }
  if (count <= 10) {
    for (const li of ul.children as HTMLCollectionOf<HTMLLIElement>)
      (li.children[0] as HTMLDetailsElement).open = true;
  }
  root.append(ul);
  return count;
}

const root = document.getElementById("tree-root")!;
createTree(root, warnings, 0, () => true);

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
  const selected = new Set(
    [...messagesFilter.selectedOptions].map((o) => o.value)
  );
  root.textContent = "";
  createTree(root, warnings, 0, (m) => selected.has(m.message === "Flaw" ? `${m.message} ${m.data[0]}` : 
m.message));
});
