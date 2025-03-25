import { readConfig } from "./config.js";

function strToRegex(str: string) {
  return new RegExp(
    `^${str
      .split(/(\{.*?\})/)
      .map((part, i) =>
        i % 2 === 0
          ? part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          : part.slice(1, -1),
      )
      .join("")}$`,
  );
}

const knownInaccessibleLinks = new Map(
  (await readConfig("inaccessible-links.txt")).map((x) => [
    strToRegex(x),
    false,
  ]),
);

const knownRedirects = new Map(
  (await readConfig("allowed-redirects.txt")).map((x) => {
    const [from, to] = x.split("\t");
    return [[strToRegex(from), to] as const, false];
  }),
);

async function checkLink(href: string) {
  // TODO: Bun hangs if the server can't be connected
  // if (href.startsWith("http:")) {
  //   try {
  //     const res = await fetch(href.replace("http:", "https:"), {
  //       signal: AbortSignal.timeout(3000),
  //     });
  //     if (res.ok) {
  //       return {
  //         type: "HTTP link",
  //         data: "has HTTPS alternative",
  //       };
  //     }
  //   } catch {}
  // }
  try {
    const res = await fetch(href, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "Accept-Language": "en-US",
      },
    });
    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After"));
        if (!Number.isNaN(retryAfter)) {
          // Tolerate up to 5min of waiting
          if (retryAfter < 300) {
            await Bun.sleep((retryAfter + 5) * 1000);
            return checkLink(href);
          } else {
            return {
              type: "error status",
              data: `429 Retry-After: ${retryAfter}`,
            };
          }
        }
      } else if (res.status === 403) {
        const text = await res.text();
        // Cloudflare firewall & similar
        if (
          text.includes("<title>Just a moment...</title>") ||
          text.includes("Verify you are human") ||
          text.includes("complete a security check")
        ) {
          return {
            type: "ok",
          };
        }
      }
      return {
        type: "error status",
        data: res.status,
      };
    }
    if (res.url !== href) {
      const hrefURL = new URL(href);
      if (
        // Allow root URLs even if the root URL goes elsewhere
        (hrefURL.pathname === "/" && res.url.startsWith(href)) ||
        // Allow if the only change is addition of queries
        hrefURL.href === res.url.split("?")[0] ||
        // Allow redirection to login
        /\/(login|signin|sign_in)\b/.test(res.url)
      ) {
        return {
          type: "ok",
        };
      }
      const allowedRedirect = [...knownRedirects.keys()].find(
        ([source, target]) => {
          const m = source.exec(href);
          if (!m) return false;
          const targetRegex = strToRegex(
            target.replace(/\$([0-9]+)/g, (_, p1) => m[p1]),
          );
          return targetRegex.test(res.url);
        },
      );
      if (allowedRedirect) {
        knownRedirects.set(allowedRedirect, true);
        return {
          type: "ok",
        };
      }
      return {
        type: "redirected",
        data: res.url,
      };
    } else if (href.startsWith("http:")) {
      return {
        type: "HTTP link",
        data: "",
      };
    } else {
      return {
        type: "ok",
      };
    }
  } catch (e) {
    return {
      type: "request error",
      data: (e as Error).message,
    };
  }
}

// Copied from BCD
const bugLinkShorteners: [RegExp, string][] = [
  [
    /^https?:\/\/bugzilla\.mozilla\.org\/show_bug\.cgi\?id=(\d+)/g,
    "https://bugzil.la/$1",
  ],
  [
    /^https?:\/\/(issues\.chromium\.org)\/issues\/(\d+)/g,
    "https://crbug.com/$2",
  ],
  [
    /^https?:\/\/(bugs\.chromium\.org|code\.google\.com)\/p\/chromium\/issues\/detail\?id=(\d+)/g,
    "https://crbug.com/$2",
  ],
  [
    /^https?:\/\/(bugs\.chromium\.org|code\.google\.com)\/p\/((?!chromium)\w+)\/issues\/detail\?id=(\d+)/g,
    "https://crbug.com/$2/$3",
  ],
  // I don't think it works
  // [
  //   /^https?:\/\/chromium\.googlesource\.com\/chromium\/src\/\+\/([\w\d]+)/g,
  //   "https://crrev.com/$1",
  // ],
  [
    /^https?:\/\/bugs\.webkit\.org\/show_bug\.cgi\?id=(\d+)/g,
    "https://webkit.org/b/$1",
  ],
];

export function createLinkRequests(
  nodes: any[],
  report: (node: any, message: string, ...data: string[]) => void,
) {
  const linkRequests: [string, () => Promise<void>][] = [];
  const checkedLinks = new Map<
    string,
    { type: string; data?: any } | undefined
  >();
  for (const node of nodes) {
    visitLinks: for (const link of node.data.links) {
      if (/^https:\/\/(jsfiddle\.net|codepen\.io|jsbin\.com)\/./.test(link)) {
        report(node, "External sandbox link", link);
        continue;
      }
      const bugLinkShortener = bugLinkShorteners.find(([prefix]) =>
        prefix.test(link),
      );
      if (bugLinkShortener) {
        report(
          node,
          "Unshortened bug link",
          link,
          "replace with",
          link.replace(...bugLinkShortener),
        );
        continue;
      }
      if (
        [
          // Sites that don't do redirects or break links, should save us some time
          "https://stackoverflow.com",
          "https://tc39.es",
          "https://drafts.csswg.org",
          "https://unicode.org",
          "https://www.unicode.org",
          "https://datatracker.ietf.org",
          "https://github.com/tc39",
          "https://github.com/w3c",
          "https://github.com/whatwg",
          "https://bugzil.la",
          "https://webkit.org/b/",
          "https://crbug.com",
          "https://crrev.com",
          "https://caniuse.com",
          "https://chromestatus.com",
          "https://chromium.googlesource.com",
          "https://web.archive.org",
          // Youtube uses queries, so there's no real 404
          "https://www.youtube.com",
          "https://youtu.be",
          "https://www.wolframalpha.com/input",
          // URL shorteners
          "https://mzl.la",
          // Is this safe?
          "https://www.w3.org",
          "https://www.npmjs.com",
        ].some((domain) => link.startsWith(domain)) ||
        link.includes(".spec.whatwg.org")
      ) {
        continue;
      }
      for (const [regex, _] of knownInaccessibleLinks) {
        if (regex.test(link)) {
          knownInaccessibleLinks.set(regex, true);
          continue visitLinks;
        }
      }
      if (link.startsWith("http")) {
        const url = new URL(link);
        url.hash = "";
        const href = url.href;
        if (!checkedLinks.has(href)) {
          checkedLinks.set(href, undefined);
          linkRequests.push([
            href,
            () =>
              checkLink(href).then((res) => {
                checkedLinks.set(href, res);
              }),
          ]);
        }
      }
    }
  }
  return { checkedLinks, linkRequests };
}

// Every time, parallel at most 25 requests, wait until any of them settles,
// remove it from the queue and pull in the next one
export async function depleteQueue(
  linkRequests: [string, () => Promise<void>][],
) {
  const queueLen = 25;
  if (linkRequests.length <= queueLen) {
    await Promise.all(linkRequests.map((req) => req[1]()));
    return;
  }
  let curReq = queueLen;
  const linksInPool: string[] = [];
  const promisePool: Promise<number>[] = [];
  for (let i = 0; i < queueLen; i++) {
    linksInPool.push(linkRequests[i][0]);
    promisePool.push(linkRequests[i][1]().then(() => i));
  }
  while (curReq < linkRequests.length) {
    const completedSlot = await Promise.race(promisePool);
    linksInPool[completedSlot] = linkRequests[curReq][0];
    promisePool[completedSlot] = linkRequests[curReq][1]().then(
      () => completedSlot,
    );
    curReq++;
    if (
      curReq % 100 === queueLen ||
      linkRequests.length - curReq < 100 - queueLen
    ) {
      console.log(
        `Processed ${curReq - queueLen}/${linkRequests.length} links`,
      );
    }
  }
  for (let i = 1; i <= queueLen; i++) {
    const completedSlot = await Promise.race(promisePool);
    console.log(
      `Processed ${curReq - queueLen + i}/${linkRequests.length} links`,
    );
  }
}

export function reportBrokenLinks(
  nodes: any[],
  report: (node: any, message: string, ...data: string[]) => void,
  checkedLinks: Map<string, { type: string; data?: any } | undefined>,
) {
  for (const node of nodes) {
    for (const link of node.data.links) {
      if (!link.startsWith("http")) continue;
      const url = new URL(link);
      url.hash = "";
      const checked = checkedLinks.get(url.href);
      if (!checked) continue;
      if (checked.type === "ok") continue;
      switch (checked.type) {
        case "HTTP link":
          report(node, "HTTP link", url.href, checked.data);
          break;
        case "error status":
          report(node, "Broken external link", url.href, checked.data);
          break;
        case "redirected":
          report(node, "Redirected external link", url.href, checked.data);
          break;
        case "request error":
          report(node, "Broken external link", url.href, checked.data);
          break;
        default:
          console.error("Unexpected checked link type:", checked);
          break;
      }
    }
  }
}

export function postExternalLinkCheck() {
  for (const [link, used] of knownInaccessibleLinks) {
    if (!used) console.warn(link, "is no longer used in content");
  }
  for (const [link, used] of knownRedirects) {
    if (!used) console.warn(link, "is no longer used in content");
  }
}
