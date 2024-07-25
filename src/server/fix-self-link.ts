import selfLinks from "../../self-links.txt" with { type: "text" };

function urlToMacro(url: string) {
  if (/Web\/API\/\w+$/.test(url)) {
    const target = /Web\/API\/(\w+)$/.exec(url)![1];
    return [
      new RegExp(String.raw`\{\{\s*domxref\(\s*["']${target}["']\s*\)\s*\}\}`, "ig"), () => `\`${target}\``
    ]
  } else if (/Web\/API\/\w+\/\w+$/.test(url)) {
    const [_, target, member] = /Web\/API\/(\w+)\/(\w+)$/.exec(url)!;
    return [
      new RegExp(String.raw`\{\{\s*domxref\(\s*(?:["'](?<nameAndUrl>${target}\.${member}(?:\(\))?)["']|["']${target}.${member}(?:\(\))?["'],\s*["'](?<name>[^"']+)["']|)\s*\)\s*\}\}`, "ig"), (_, nameAndUrl, name) => `\`${nameAndUrl ?? name}\``
    ]
  } else if (/Web\/HTTP\/Headers\/\w+$/.test(url)) {
    const target = /Web\/HTTP\/Headers\/(\w+)$/.exec(url)![1];
    return [
      new RegExp(String.raw`\{\{\s*httpheader\(\s*["']${target}["']\s*\)\s*\}\}`, "ig"), () => `\`${target}\``
    ]
  } else if (/Web\/HTML\/Element\/\w+$/.test(url)) {
    const target = /Web\/HTML\/Element\/(\w+)$/.exec(url)![1];
    return [
      new RegExp(String.raw`\{\{\s*htmlelement\(\s*["']${target}["']\s*\)\s*\}\}`, "ig"), () => `\`<${target}>\``
    ]
  } else if (/Web\/CSS\/[\w-]+$/.test(url)) {
    const target = /Web\/CSS\/([\w-]+)$/.exec(url)![1];
    return [
      new RegExp(String.raw`\{\{\s*cssxref\(\s*["']${target}["']\s*\)\s*\}\}`, "ig"), () => `\`${target}\``
    ]
  }
}

for (const [location, target] of selfLinks.split("\n").map((x) => x.split("\t"))) {
  if (!location) continue;
  const file = Bun.file(`../content/${location}`);
  const content = await file.text();
  const args = urlToMacro(target);
  if (args) {
    console.log(location, ...args);
    const newContent = content.replace(...urlToMacro(target));
    await Bun.write(file, newContent);
  }
}
