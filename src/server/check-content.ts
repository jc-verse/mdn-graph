import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import { readConfig, configHas } from "./config.js";

const allowedCodeLinkTextRec = new Map(
  (await readConfig("allowed-code-link-text.txt")).map((x) => [x, false]),
);

const allowedSpacedCodeLink = [
  // HTML tags
  /^<(a|area|font|iframe|input|link|meta|object|ol|script|th|tr)( [a-z-]+="[\w .…-]+"| ping| defer| sandbox| nomodule)+>$/,
  /^<\?xml[^>]+\?>$/,
  /^<xsl:[^>]+>$/,
  /^[a-z-]+="[\w .…-]+"$/,
  // JS code
  /^(async function\*?|"use strict"|typeof [a-z]+( === "[a-z]+")?|extends null|export default|import (\* as )?\w+ from "\w+";?|(if|catch) \(\w*\)|for await\.\.\.of|\w+: "\w+"|(await|delete|void|yield\*?) \w+|\w+ (instanceof|in) \w+|\( \)|\(\w+ \? \w+ : \w+\))$/,
  // Method calls with parameters. Lots of false positives but we actually
  // want to check that methods in interface DLs don't have params
  /^[\w.]+\([\w.]+(, [\w.]+)*\)$/,
  // CSS code
  /^([a-z-]+: ([a-z-]+|\d+(px|em|vh|vw|%)|0);?|@(container|import|media|namespace|supports) [()a-z\d: -]+|transform: [\w-]+\(\);?|transform-style: [\w-]+;?)$/,
  // Shell commands
  /^(ng|npm) [a-z\d]+$/,
  // HTTP status
  /^\d+ [\w '-]+$/,
  // HTTP header
  /^(Cache-Control|Clear-Site-Data|Connection|Content-Length|Content-Security-Policy|Cross-Origin-Opener-Policy|Cross-Origin-Resource-Policy|Expect|Feature-Policy|Permissions-Policy|Sec-Purpose|Transfer-Encoding): ([\w-]+|"[\w-]+")$/,
  // MIME
  /^[a-z]+\/[\w+-]+; [a-z]+=("[\w ,.-]+"|\w+);?$/,
  // Macro calls
  /^\{\{[^}]+\}\}$/,
  // PAC stuff
  /^(HTTP|HTTPS|PROXY|SOCKS|SOCKS4)/,
  // TODO: this is probably bad (CSS reference uses this syntax)
  /^[a-z-]+(?:\(\))? \(@[a-z-]+\)$|^::([a-z-]+) \(:\1\)$/,
];

const allowedUnderscoreCodeLink = [
  // Constants (uppercase)
  /^(\w+\.)*[A-Z_\d]+$/,
  // Non-JS properties (lowercase)
  /^((dns|tcp|webgl|AppConfig|http(\.[a-z]+)?)\.)?[a-z\d_]+(\(\))?$/,
  // WebGL prefixes
  /^(WEBGL|OES|EXT|ANGLE|OCULUS|OVR|KHR|gl)_\w+(\.[A-Za-z]+\(\))?$/,
  // Object methods
  /^(Object\.prototype\.)?__((define|lookup)(Getter|Setter)|proto)__(\(\))?$/,
  // Link targets
  /^_(blank|parent|replace|self|top)$/,
  // File names
  /\.(js|html|json|py)$/,
  // String constants
  /^"\w+"$/,
  // Macro calls
  /^\{\{[\w-]+\}\}$/,
  // URLs
  /^https?:\/\//,
];

const inlineLevelElements = new Set([
  "a",
  "abbr",
  "acronym",
  "b",
  "bdi",
  "bdo",
  "big",
  "button",
  "cite",
  "code",
  "data",
  "datalist",
  "del",
  "dfn",
  "em",
  "font",
  "i",
  "img",
  "ins",
  "kbd",
  "label",
  "map",
  "mark",
  "meter",
  "output",
  "progress",
  "q",
  "ruby",
  "s",
  "samp",
  "small",
  "span",
  "strike",
  "strong",
  "time",
  "tt",
  "u",
  "var",
]);

// Allow a<sup><code>b</code></sup> or <code>a</code><sup>b</sup>
function getSurroundingText(
  node: Element,
  $: CheerioAPI,
  direction: "previous" | "next",
) {
  while (!node[`${direction}Sibling`]) {
    if (!node.parentNode || node.parentNode.type !== "tag") return "";
    if (
      node[`${direction}Sibling`]?.type === "tag" &&
      node[`${direction}Sibling`].tagName === "br"
    )
      return "";
    node = node.parentNode;
    if (!inlineLevelElements.has(node.tagName.toLowerCase())) return "";
  }
  const siblingNode = node[`${direction}Sibling`]!;
  const siblingText =
    siblingNode.nodeType === 3
      ? siblingNode.nodeValue
      : inlineLevelElements.has((siblingNode as Element).tagName?.toLowerCase())
        ? $(siblingNode as Element).text()
        : "";
  return siblingText;
}

export function checkContent(
  rawContent: string,
  $: CheerioAPI,
  report: (message: string, ...data: unknown[]) => void,
  context: { slug: string },
) {
  $("ul li").each((i, li) => {
    const children = $(li).contents();
    if (
      children.length === 0 ||
      (children[0].type === "text" && children[0].data.startsWith(":"))
    ) {
      report("Bad DL", $(li).text().slice(0, 50));
    }
  });
  $(":not(code, code *, pre, pre *, math, math *)").each((i, el) => {
    const texts = $(el)
      .contents()
      .filter((i, el) => el.type === "text");
    for (const text of texts) {
      if (/`[^`]+`|```|\*[^*]+\*|\[.+\]\(.+\)|\b_[^_]+_\b/.test(text.data)) {
        report("Possibly unrendered Markdown", text.data);
      }
    }
  });
  $("a").each((i, a) => {
    const childNodes = $(a).contents();
    if (
      childNodes.length === 1 &&
      childNodes[0].type === "tag" &&
      childNodes[0].name === "code"
    ) {
      const code = $(childNodes[0]).text();
      if (
        code.includes(" ") &&
        !allowedSpacedCodeLink.some((re) => re.test(code)) &&
        !configHas(allowedCodeLinkTextRec, code) &&
        // Canvas tutorial uses example code in DL, not worth fixing
        !context.slug.includes("Canvas_API/Tutorial")
      ) {
        report("Code with space", code);
      } else if (
        code.includes("_") &&
        !allowedUnderscoreCodeLink.some((re) => re.test(code)) &&
        !configHas(allowedCodeLinkTextRec, code)
      ) {
        report("Code with underscore", code);
      }
    }
  });
  $("code").each((i, code) => {
    const textBefore = getSurroundingText(code, $, "previous");
    const textAfter = getSurroundingText(code, $, "next");
    if (/^(?!'s)['"]/.test(textAfter) || /['"]$/.test(textBefore)) {
      report("Quoted code", $(code).text());
    } else if (
      textAfter &&
      !/^([\s.,?!:;…—–\-"')/]|e?s\b|th\b|⚠️)/.test(textAfter)
    ) {
      report(
        "Text stuck to code",
        $(code).text(),
        "Text after:",
        textAfter.slice(0, 50),
      );
    } else if (textBefore && !/[\s—–\-"'(/±]$/.test(textBefore)) {
      report(
        "Text stuck to code",
        $(code).text(),
        "Text before:",
        textBefore.slice(-50),
      );
    }
  });
  if (rawContent.includes("-: "))
    report("Bad DL", rawContent.match(/-: .*$/m)?.[0].slice(0, 50));
  if (rawContent.includes("could not find syntax for this item"))
    report("Missing data", "CSS formal syntax");
  if (rawContent.includes("Value not found in DB"))
    report("Missing data", "CSS info");
}

export function postCheckContent() {
  for (const [code, used] of allowedCodeLinkTextRec) {
    if (!used) console.warn("Unused code link text", code);
  }
}