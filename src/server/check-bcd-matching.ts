import nodes from "../../data/nodes.json" with { type: "json" };
import bcdData from "@mdn/browser-compat-data" with { type: "json" };
import { readConfig, configHas } from "./config.js";

const dictionaries = new Map(
  (await readConfig("dictionaries.txt")).map((x) => [x, false]),
);

function htmlAttrToBCD(attrName: string, elemName: string) {
  if (attrName === "data-*") {
    attrName = "data_attributes";
  }
  if (elemName === "Global_attributes") {
    return [`html.global_attributes.${attrName}`];
  } else if (elemName === "Attributes") {
    const allKeys: string[] = [];
    for (const elemName in bcdData.html.elements) {
      if (attrName in bcdData.html.elements[elemName]) {
        allKeys.push(`html.elements.${elemName}.${attrName}`);
      }
    }
    return allKeys;
  }
  return [`html.elements.${elemName}.${attrName}`];
}

function dictionaryToBCD(path: string) {
  return path
    .replace(
      /^(?:MediaTrackSettings|MediaTrackConstraints|MediaTrackSupportedConstraints).(.+)$/,
      "MediaStreamTrack.applyConstraints.$1_constraint",
    )
    .replace(
      /^RTCIceCandidatePairStats\b/,
      "RTCStatsReport.type_candidate-pair",
    )
    .replace(/^RTCCertificateStats\b/, "RTCStatsReport.type_certificate")
    .replace(/^RTCCodecStats\b/, "RTCStatsReport.type_codec")
    .replace(/^RTCDataChannelStats\b/, "RTCStatsReport.type_data-channel")
    .replace(/^RTCInboundRtpStreamStats\b/, "RTCStatsReport.type_inbound-rtp")
    .replace(/^RTCIceCandidateStats\b/, "RTCStatsReport.type_local-candidate")
    .replace(/^RTCAudioSourceStats\b/, "RTCStatsReport.type_media-source")
    .replace(/^RTCVideoSourceStats\b/, "RTCStatsReport.type_media-source")
    .replace(/^RTCOutboundRtpStreamStats\b/, "RTCStatsReport.type_outbound-rtp")
    .replace(/^RTCPeerConnectionStats\b/, "RTCStatsReport.type_peer-connection")
    .replace(/^RTCIceCandidateStats\b/, "RTCStatsReport.type_remote-candidate")
    .replace(
      /^RTCRemoteInboundRtpStreamStats\b/,
      "RTCStatsReport.type_remote-inbound-rtp",
    )
    .replace(
      /^RTCRemoteOutboundRtpStreamStats\b/,
      "RTCStatsReport.type_remote-outbound-rtp",
    )
    .replace(/^RTCTransportStats\b/, "RTCStatsReport.type_transport");
}

function getBCD(data: any, key: string) {
  const keys = key.split(".");
  for (const key of keys) {
    if (!(key in data)) return undefined;
    data = data[key];
  }
  return data;
}

function expectedBCD(node: any): "Unexpected page type" | "ignore" | string[] {
  switch (node.data.metadata.pageType) {
    // The page types are copied from front-matter-config.json
    case "guide":
    case "landing-page":
      // Generic pages may or may not actually be a reference
      return "ignore";
    case "how-to":
    case "tutorial":
    case "tutorial-chapter":
    // Glossary/
    case "glossary-definition":
    case "glossary-disambiguation":
    // Learn/
    case "learn-topic":
    case "learn-module":
    case "learn-module-chapter":
    case "learn-module-assessment":
    case "learn-faq":
    // MDN/
    case "mdn-community-guide":
    case "mdn-writing-guide":
    // Mozilla/Firefox
    case "firefox-release-notes":
    // Web/Accessibility/ARIA/Attributes/
    case "aria-attribute":
    // Web/Accessibility/ARIA/Roles/
    case "aria-role":
    // Web/EXSLT
    case "exslt-function":
    // Web/XPath
    case "xpath-function":
    // Web/XSLT
    case "xslt-element":
    case "xslt-axis":
    // Web/HTTP/CORS/Errors/
    case "http-cors-error":
    // Random stuff without BCD
    case "css-module":
    case "javascript-error":
    case "webdriver-error":
      return [];
    // Web/SVG/
    case "svg-attribute": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/SVG\/Attribute\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      let attrName = match[1].replace(":", "_");
      if (attrName === "data-*") {
        attrName = "data";
      }
      if (attrName in bcdData.svg.global_attributes) {
        return [`svg.global_attributes.${attrName}`];
      } else {
        const allKeys: string[] = [];
        for (const elemName in bcdData.svg.elements) {
          if (attrName in bcdData.svg.elements[elemName]) {
            allKeys.push(`svg.elements.${elemName}.${attrName}`);
          }
        }
        return allKeys;
      }
    }
    case "svg-element": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/SVG\/Element\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const elemName = match[1];
      return [`svg.elements.${elemName}`];
    }
    // Web/HTML/
    case "html-attribute": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTML\/(?:Element\/([^/]+)|(Attributes)|(Global_attributes))\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const elemName = match[1] || match[2] || match[3];
      const attrName = match[4];
      return htmlAttrToBCD(attrName, elemName);
    }
    case "html-attribute-value": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTML\/(?:Element\/([^/]+)|(Attributes)|(Global_attributes))\/([^/]+)\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const elemName = match[1] || match[2] || match[3];
      const attrName = match[4];
      const attrValue = match[5];
      const attrBCD = htmlAttrToBCD(attrName, elemName);
      return attrBCD
        .filter((k) => attrValue in getBCD(bcdData, k))
        .map((k) => `${k}.${attrValue}`);
    }
    case "html-element": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTML\/Element\/(?:([^/]+)|input\/([^/]+))$/,
      );
      if (!match) return "Unexpected page type";
      if (match[2]) {
        return [`html.elements.input.type_${match[2]}`];
      }
      if (match[1] === "Heading_Elements") {
        return [1, 2, 3, 4, 5, 6].map((n) => `html.elements.h${n}`);
      }
      const elemName = match[1];
      return [`html.elements.${elemName}`];
    }
    // Mozilla/Add-ons/WebExtensions/
    case "webextension-api-function":
    case "webextension-api-event":
    case "webextension-api-property":
    case "webextension-api-type": {
      const match = node.id.match(
        /^\/en-US\/docs\/Mozilla\/Add-ons\/WebExtensions\/API\/(.+)$/,
      );
      if (!match) return "Unexpected page type";
      const path = match[1].replaceAll("/", ".");
      return [`webextensions.api.${path}`];
    }
    case "webextension-api": {
      const match = node.id.match(
        /^\/en-US\/docs\/Mozilla\/Add-ons\/WebExtensions\/API\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const apiName = match[1];
      return [`webextensions.api.${apiName}`];
    }
    case "webextension-manifest-key": {
      const match = node.id.match(
        /^\/en-US\/docs\/Mozilla\/Add-ons\/WebExtensions\/manifest.json\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const memberName = match[1];
      return [`webextensions.manifest.${memberName}`];
    }
    // Web/API/
    case "web-api-overview":
      return "ignore";
    case "web-api-global-function": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/API\/([^/]+)$/);
      if (!match) return "Unexpected page type";
      const memberName = match[1];
      return [`api.${memberName}`];
    }
    case "web-api-global-property":
      return "Unexpected page type";
    case "web-api-interface":
    case "webgl-extension": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/API\/([^/]+)$/);
      if (!match) return "Unexpected page type";
      const apiName = dictionaryToBCD(match[1]);
      if (configHas(dictionaries, apiName)) return [];
      return [`api.${apiName}`];
    }
    case "web-api-constructor":
    case "web-api-instance-method":
    case "web-api-instance-property":
    case "web-api-static-method":
    case "web-api-static-property":
    case "web-api-event":
    case "webgl-extension-method": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/API\/(.+)$/);
      if (!match) return "Unexpected page type";
      const path = dictionaryToBCD(
        match[1]
          .replaceAll("/", ".")
          .replace(/^CSS\.factory_functions_static$/, "CSS"),
      );
      if (configHas(dictionaries, path.split(".")[0])) return [];
      return [`api.${path}`];
    }
    // Web/CSS/
    case "css-at-rule": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/CSS\/@([^/]+)$/);
      if (!match) return "Unexpected page type";
      const ruleName = match[1];
      return [`css.at-rules.${ruleName}`];
    }
    case "css-at-rule-descriptor": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/CSS\/@([^/]+)\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const ruleName = match[1];
      const descriptorName = match[2];
      return [`css.at-rules.${ruleName}.${descriptorName}`];
    }
    case "css-combinator":
    case "css-selector": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/CSS\/([^/]+)$/);
      if (!match) return "Unexpected page type";
      const combinatorName = match[1]
        .replace(/_combinator$/, "")
        .replace(/_separator$/, "")
        .replace(/_selectors?$/, "")
        .replace(/\bSelector_/, "");
      return [`css.selectors.${combinatorName.toLowerCase()}`];
    }
    case "css-function": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/CSS\/(.+)$/);
      if (!match) return "Unexpected page type";
      const functionName = match[1]
        .replace("/", ".")
        .replace(/_function$/, "")
        .replace(/_value\b/, "");
      if (["cross-fade", "element"].includes(functionName)) {
        return [`css.types.image.${functionName}`];
      } else if (functionName.startsWith("gradient.")) {
        return [`css.types.image.${functionName}`];
      } else if (getBCD(bcdData, `css.types.${functionName}`)) {
        return [`css.types.${functionName}`];
      } else if (functionName.includes(".")) {
        const subtree = getBCD(
          bcdData,
          `css.properties.${functionName.split(".")[0]}`,
        );
        if (subtree) {
          if (`${functionName.split(".")[1]}_function` in subtree) {
            return [`css.properties.${functionName}_function`];
          } else if (functionName.split(".")[1] in subtree) {
            return [`css.properties.${functionName}`];
          }
        }
      } else {
        const keys: string[] = [];
        for (const prop in bcdData.css.properties) {
          if (`${functionName}_function` in bcdData.css.properties[prop]) {
            keys.push(`css.properties.${prop}.${functionName}_function`);
          } else if (functionName in bcdData.css.properties[prop]) {
            keys.push(`css.properties.${prop}.${functionName}`);
          }
        }
        if (keys.length) return keys;
      }
      return [`css.types.${functionName}`];
    }
    case "css-keyword":
      return "ignore";
    case "css-media-feature": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/CSS\/@media\/([^/]+)$/);
      if (!match) return "Unexpected page type";
      const featureName = match[1];
      return [`css.at-rules.media.${featureName}`];
    }
    case "css-shorthand-property":
    case "css-property": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/CSS\/([^/]+)$/);
      if (!match) return "Unexpected page type";
      const propertyName = match[1];
      return [`css.properties.${propertyName}`];
    }
    case "css-pseudo-class":
    case "css-pseudo-element": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/CSS\/::?([^/]+)$/);
      if (!match) return "Unexpected page type";
      const pseudoName = match[1].replaceAll(":", "").replace(/_function$/, "");
      if (node.id.endsWith("host_function")) {
        return [`css.selectors.hostfunction`];
      }
      return [`css.selectors.${pseudoName}`];
    }
    case "css-type": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/CSS\/([^/]+)$/);
      if (!match) return "Unexpected page type";
      const typeName = match[1].replace(/_type$/, "").replace(/_value$/, "");
      if (typeName === "gradient") {
        return [`css.types.image.${typeName}`];
      } else if (["custom-ident", "dashed-ident", "ident"].includes(typeName)) {
        return [];
      }
      return [`css.types.${typeName}`];
    }
    // Web/JavaScript/
    case "javascript-class":
    case "javascript-namespace":
    case "javascript-function":
    case "javascript-global-property": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/JavaScript\/Reference\/Global_Objects\/([^/]+|Intl\/(?:[^/]+)|Intl\/Segmenter\/segment\/Segments)$/,
      );
      if (!match) return "Unexpected page type";
      const className = match[1]
        .replaceAll("/", ".")
        .replace(/^Intl\.Segmenter\.segment\.Segments/, "Intl.Segments");
      return [`javascript.builtins.${className}`];
    }
    case "javascript-constructor":
    case "javascript-instance-accessor-property":
    case "javascript-instance-data-property":
    case "javascript-instance-method":
    case "javascript-static-accessor-property":
    case "javascript-static-data-property":
    case "javascript-static-method": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/JavaScript\/Reference\/(?:Global_Objects\/(.+)|Functions\/arguments\/([^/]+))$/,
      );
      if (!match) return "Unexpected page type";
      if (match[2]) {
        return [
          `javascript.functions.arguments.${match[2].replace("Symbol.", "@@")}`,
        ];
      }
      const path = match[1]
        .replaceAll("Symbol.", "@@")
        .replaceAll("/", ".")
        .replace(/^Intl\.Segmenter\.segment\.Segments/, "Intl.Segments")
        .replace(/^Proxy\.Proxy\./, "Proxy.handler.")
        .replace(/^Object\.__(define|lookup)(Getter|Setter)__/, "Object.$1$2");
      return [`javascript.builtins.${path}`];
    }
    case "javascript-language-feature":
      return "ignore";
    case "javascript-operator": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/JavaScript\/Reference\/Operators\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const operator = match[1]
        .replaceAll("function*", "generator_function")
        .replaceAll("_operator", "")
        .replaceAll("_syntax", "")
        .replace(/^yield\*$/, "yield_star");
      return [`javascript.operators.${operator.toLowerCase()}`];
    }
    case "javascript-statement": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/JavaScript\/Reference\/Statements\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const stmt = match[1]
        .replaceAll("function*", "generator_function")
        .replaceAll("...", "_")
        .replaceAll("for-await", "for_await");
      return [`javascript.statements.${stmt.toLowerCase()}`];
    }
    // Web/Manifest/
    case "web-manifest-member": {
      const match = node.id.match(/^\/en-US\/docs\/Web\/Manifest\/([^/]+)$/);
      if (!match) return "Unexpected page type";
      const memberName = match[1];
      return [`html.manifest.${memberName}`];
    }
    // WebAssembly/
    case "webassembly-function":
    case "webassembly-interface": {
      if (node.id === "/en-US/docs/WebAssembly/JavaScript_interface") {
        // This page is not a "webassembly-interface" per se but it works
        return ["webassembly.api"];
      }
      const match = node.id.match(
        /^\/en-US\/docs\/WebAssembly\/JavaScript_interface\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const memberName = match[1];
      return [`webassembly.api.${memberName}`];
    }
    case "webassembly-constructor":
    case "webassembly-instance-property":
    case "webassembly-instance-method":
    case "webassembly-static-method": {
      const match = node.id.match(
        /^\/en-US\/docs\/WebAssembly\/JavaScript_interface\/(.+)$/,
      );
      if (!match) return "Unexpected page type";
      const path = match[1].replaceAll("/", ".");
      return [`webassembly.api.${path}`];
    }
    case "webassembly-instruction":
      return "ignore";
    // Web/WebDriver/
    case "webdriver-command": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/WebDriver\/Commands\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const commandName = match[1];
      return [`webdriver.commands.${commandName}`];
    }
    case "webdriver-capability": {
      return [];
    }
    // Web/HTTP/Headers/Content-Security-Policy/
    case "http-csp-directive": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTTP\/Headers\/Content-Security-Policy\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const directiveName = match[1];
      if (directiveName === "Sources") return [];
      return [`http.headers.Content-Security-Policy.${directiveName}`];
    }
    // Web/HTTP/Headers/Permissions-Policy/
    case "http-permissions-policy-directive": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTTP\/Headers\/Permissions-Policy\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const directiveName = match[1];
      return [`http.headers.Permissions-Policy.${directiveName}`];
    }
    // Web/HTTP/Headers/
    case "http-header": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTTP\/Headers\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const headerName = match[1];
      return [`http.headers.${headerName}`];
    }
    // Web/HTTP/Methods/
    case "http-method": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTTP\/Methods\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const methodName = match[1];
      return [`http.methods.${methodName}`];
    }
    // Web/HTTP/Status/
    case "http-status-code": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/HTTP\/Status\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const statusCode = match[1];
      return [`http.status.${statusCode}`];
    }
    // Web/MathML/Element/
    case "mathml-element": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/MathML\/Element\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const elemName = match[1];
      return [`mathml.elements.${elemName}`];
    }
    // Web/MathML/Global_attributes/
    case "mathml-attribute": {
      const match = node.id.match(
        /^\/en-US\/docs\/Web\/MathML\/Global_attributes\/([^/]+)$/,
      );
      if (!match) return "Unexpected page type";
      const attrName = match[1];
      return [`mathml.global_attributes.${attrName}`];
    }
    default:
      return "Unexpected page type";
  }
}

export function checkBCDMatching(
  report: (node: any, message: string, ...data: string[]) => void,
) {
  for (const node of nodes) {
    const expected = expectedBCD(node);
    if (expected === "Unexpected page type") {
      report(node, "Unexpected page type", node.data.metadata.pageType);
      continue;
    } else if (expected === "ignore") {
      continue;
    }
    const expectedExisting = expected.filter((x) => getBCD(bcdData, x));
    if (!expectedExisting.length && expected.length) {
      report(node, "Not in BCD", expected.join("\n"));
      continue;
    }
    const actual = new Set(node.data.metadata.browserCompat);
    if (actual.symmetricDifference(new Set(expected)).size) {
      report(
        node,
        "Unexpected BCD keys",
        "Actual:",
        Array.from(actual).join("\n") || "[None]",
        "Expected:",
        expected.join("\n") || "[None]",
      );
    }
  }
}

export function postCheckBCDMatching() {
  for (const [name, used] of dictionaries) {
    if (!used) console.warn(name, "is no longer documented");
  }
}
