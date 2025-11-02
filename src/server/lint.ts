import { ESLint } from "eslint";
import stylelint from "stylelint";
import { parse as htmlParse } from "angular-html-parser";
import { HtmlValidate } from "html-validate";
import eslintConfig from "../../config/eslint-config.ts";
import stylelintConfig from "../../config/stylelint-config.ts";
import htmlLintConfig, {
  ignore as htmlIgnore,
} from "../../config/html-lint-config.ts";
import type { Visitor } from "angular-html-parser/lib/compiler/src/ml_parser/ast.js";

const sanctionedLanguages = [
  "apacheconf",
  "bash",
  "batch",
  "c",
  "cpp",
  "cs",
  "css",
  "diff",
  "django",
  "glsl",
  "hbs",
  "html",
  "http",
  "ini",
  "java",
  "js",
  "json",
  "jsx",
  "latex",
  "md",
  "nginx",
  "php",
  "plain",
  "powershell",
  "pug",
  "python",
  "regex",
  "rust",
  "scss",
  "sh",
  "sql",
  "svelte",
  "svg",
  "toml",
  "ts",
  "url",
  "vue",
  "wat",
  "webidl",
  "xml",
  "yaml",
];

const expectedErrors = (
  await Bun.file(
    Bun.fileURLToPath(
      import.meta.resolve(`../../config/expected-lint-errors.txt`),
    ),
  ).text()
).matchAll(
  /(?<file>\/en-US\/docs\/[^\n]+)\n(?<reports>(?:\[[^\]]+\] .*\n)+)~~~\n(?<code>(?:.|\n)+?)~~~\n/g,
);
const expectedErrorsMap = new Map<string, Map<string, Map<string, boolean>>>();
for (const match of expectedErrors) {
  const { file, reports, code } = match.groups!;
  if (!expectedErrorsMap.has(file)) {
    expectedErrorsMap.set(file, new Map());
  }
  if (!expectedErrorsMap.get(file)!.has(code)) {
    expectedErrorsMap.get(file)!.set(code, new Map());
  }
  for (const report of reports.trim().split("\n")) {
    expectedErrorsMap.get(file)!.get(code)!.set(report, false);
  }
}

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: eslintConfig,
  fix: false,
});

const htmlvalidate = new HtmlValidate(htmlLintConfig);

const htmlVisitor: Visitor = {
  visitAttribute(attr, ctx) {
    if (attr.name.startsWith("on")) {
      ctx.messages.push({
        ruleId: "no-inline-event-handlers",
        message: `Do not use inline event handler "${attr.name}".`,
        content: ctx.content,
        span: attr.sourceSpan,
      });
    }
    if (attr.name === "class") {
      if (!attr.value.match(/^(?:\S+)(?: \S+)*$/)) {
        ctx.messages.push({
          ruleId: "unformatted-class",
          message:
            "Element class should be a list of tokens separated by single spaces.",
          content: ctx.content,
          span: attr.sourceSpan,
        });
      }
    }
  },
  visitElement(el, ctx) {
    if (
      el.name === "script" &&
      !el.attrs.some((attr) => attr.name === "src") &&
      !el.attrs.some(
        (attr) =>
          attr.name === "type" &&
          [
            "application/json",
            "text/js-worker",
            "x-shader/x-vertex",
            "x-shader/x-fragment",
            "speculationrules",
            "importmap",
          ].includes(attr.value),
      )
    ) {
      if (
        !(
          el.children.length === 1 &&
          el.children[0]!.type === "text" &&
          el.children[0]!.value.trim().match(
            /^\/\/ (?:…|Code goes below this line|Your JavaScript goes here|JavaScript goes here|JavaScript code goes here|scene setup goes here|Inline JavaScript code)$|\/\* (?:All of our JavaScript code goes here|all our JavaScript code goes here) \*\/$/,
          )
        ) &&
        // If the element has an id, it is probably used by a script
        !el.attrs.some((attr) => attr.name === "id")
      ) {
        ctx.messages.push({
          ruleId: "no-inline-script",
          message:
            "Do not write JS within the <script> element; use separate JS blocks instead.",
          content: ctx.content,
          span: el.sourceSpan,
        });
      }
      if (el.children.length === 1 && el.children[0]!.type === "text") {
        ctx.otherPromises.push(
          checkJS(
            el.children[0]!.value,
            "js",
            ctx.path,
            ctx.report,
            ctx.content,
          ),
        );
      } else {
        ctx.messages.push({
          ruleId: "empty-script",
          message: "Script element should have non-empty text.",
          content: ctx.content,
          span: el.sourceSpan,
        });
      }
    } else if (el.name === "style") {
      if (el.children.length === 1 && el.children[0]!.type === "text") {
        ctx.otherPromises.push(
          checkCSS(
            el.children[0]!.value,
            "css",
            ctx.path,
            ctx.report,
            ctx.content,
          ),
        );
      } else {
        ctx.messages.push({
          ruleId: "empty-style",
          message: "Style element should have non-empty text.",
          content: ctx.content,
          span: el.sourceSpan,
        });
      }
    }
    if (
      el.children.length > 0 &&
      el.children[0].type === "text" &&
      el.children[0].value.match(/\s*<\!\[CDATA\[/) &&
      !ctx.isSVG &&
      !ctx.isMathML
    ) {
      ctx.messages.push({
        ruleId: "no-cdata",
        message: "CDATA is not a thing in HTML.",
        content: ctx.content,
        span: el.children[0].sourceSpan,
      });
    }
    if (el.name === "template") {
      ctx.isTemplate++;
    } else if (el.name === ":svg:svg") {
      ctx.isSVG++;
    } else if (el.name === ":math:math") {
      ctx.isMathML++;
    }
    el.attrs.forEach((attr) => attr.visit(this, ctx));
    el.children.forEach((child) => child.visit(this, ctx));
    if (el.name === "template") {
      ctx.isTemplate--;
    } else if (el.name === ":svg:svg") {
      ctx.isSVG--;
    } else if (el.name === ":math:math") {
      ctx.isMathML--;
    }
  },
  visitText() {},
  visitComment() {},
  visitCdata() {},
  visitDocType() {},
  visitBlock() {},
  visitExpansion() {},
  visitExpansionCase() {},
  visitLetDeclaration() {},
  visitBlockParameter() {},
};

function reportIfUnexpected(
  path: string,
  language: string,
  ruleId: string,
  message: string,
  content: string,
  range: string,
  region: string,
  report: (path: string, message: string, ...data: string[]) => void,
) {
  if (
    expectedErrorsMap.has(path) &&
    expectedErrorsMap.get(path)!.has(content)
  ) {
    const expectedMessages = expectedErrorsMap.get(path)!.get(content)!;
    if (expectedMessages.has(`[${ruleId}] ${message}`)) {
      expectedMessages.set(`[${ruleId}] ${message}`, true);
      return;
    }
  }
  if (language === "json") {
    if (
      path.startsWith("/en-US/docs/Mozilla/Add-ons/WebExtensions") &&
      language === "json" &&
      ruleId === "syntax"
    )
      return;
  } else if (language === "js") {
    if (
      ruleId === "no-useless-escape" &&
      message === "Unnecessary escape character: \\/." &&
      content.includes("<\\/script>")
    )
      return;
  } else if (language === "html") {
    const filePath = path.replace("/en-US/docs/", "");
    if (
      htmlIgnore.some(
        (ignore) =>
          ignore.files.some((pattern) => {
            if (pattern.endsWith("/**")) {
              return filePath.startsWith(
                pattern.slice(0, -3).replace(/\/$/, ""),
              );
            } else if (pattern.endsWith("*")) {
              return (
                filePath.startsWith(pattern.slice(0, -1).replace(/\/$/, "")) &&
                !filePath.includes("/", pattern.slice(0, -1).length)
              );
            }
            return filePath === pattern;
          }) && ignore.rules[ruleId] === "off",
      )
    ) {
      return;
    }
    // TODO
    if (
      ruleId === "element-required-attributes" &&
      [
        '<iframe> is missing required "title" attribute',
        '<embed> is missing required "title" attribute',
      ].includes(message)
    )
      return;
    if (
      ruleId === "element-required-content" &&
      [
        "<head> element must have <title> as content",
        "<html> element must have <head> as content",
        "<html> element must have <body> as content",
      ].includes(message)
    )
      return;
    if (
      ruleId === "element-required-content" &&
      [
        "<head> element must have <title> as content",
        "<html> element must have <head> as content",
        "<html> element must have <body> as content",
      ].includes(message)
    )
      return;
    if (
      ruleId === "attr-case" &&
      message === 'Attribute "..." should be camelCase'
    )
      return;
    // TODO: https://gitlab.com/html-validate/html-validate/-/issues/328
    if (
      ruleId === "no-redundant-role" &&
      message === 'Redundant role "list" on <ul>'
    )
      return;
    // TODO: Ember docs are retiring
    if (
      path ===
        "/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Ember_structure_componentization" &&
      ruleId === "element-case" &&
      message === 'Element "Todo" should be camelCase'
    )
      return;
  } else if (language === "css") {
    if (
      ruleId === "font-family-name-quotes" &&
      [
        'Expected quotes around "caption" (font-family-name-quotes)',
        'Expected quotes around "status-bar" (font-family-name-quotes)',
        'Expected quotes around "some-non-variable-font-family" (font-family-name-quotes)',
        'Expected quotes around "some-variable-font-family" (font-family-name-quotes)',
        'Expected quotes around "PLACEHOLDER" (font-family-name-quotes)',
      ].includes(message)
    )
      return;
  }
  report(
    path,
    [
      "alpha-value-notation",
      "hue-degree-notation",
      "lightness-notation",
      "declaration-block-no-redundant-longhand-properties",

      // Remaining ones are't valid issues; ignore for now
      "CssSyntaxError",
      // "declaration-property-value-no-unknown",
      // "declaration-property-value-keyword-no-deprecated",
      // "custom-property-no-missing-var-function",
    ].includes(ruleId)
      ? "Stylelint backlog"
      : `${language.toUpperCase()} code issue`,
    ruleId,
    message,
    region,
    range,
    `${path}\n[${ruleId}] ${message}\n~~~\n${content}~~~\n`,
  );
}

async function checkJS(
  content: string,
  language: string,
  path: string,
  report: (path: string, message: string, ...data: string[]) => void,
  fullContent: string = content,
) {
  if (content.includes("// SyntaxError: ")) return;
  const scripts = content
    .split(/\/\/ -- ([^ ]*) --\n/)
    .reduce<{ fileName: string; content: string }[]>((acc, part, i, arr) => {
      if (i % 2 !== 0) {
        acc.push({ fileName: part, content: arr[i + 1] });
      } else if (i === 0) {
        acc.push({ fileName: `test.${language}`, content: part });
      }
      return acc;
    }, []);
  for (const { fileName, content } of scripts) {
    try {
      const results = await eslint.lintText(
        content
          // Avoid spaced-comment report
          .replaceAll("/*,", "/* ,")
          .replaceAll("//@", "// @")
          .replaceAll("//#", "// #"),
        {
          filePath: `${path.replace("/en-US/docs/", "")}/${fileName}`,
        },
      );
      for (const result of results) {
        result.messages.forEach((msg) => {
          // No better way to disable this error :(
          if (
            msg.ruleId === "no-unused-labels" &&
            msg.message === "'$:' is defined but never used." &&
            path.startsWith(
              "/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Svelte_",
            )
          )
            return;
          const reportingLine = content
            .split("\n")
            .slice(msg.line - 1, msg.endLine ? msg.endLine : msg.line)
            .join("\n");
          if (
            msg.ruleId === "no-useless-concat" &&
            reportingLine.match(/<[`"'] \+ [`"']\/script/)
          )
            return;
          reportIfUnexpected(
            path,
            "js",
            msg.ruleId ?? "syntax",
            msg.message,
            fullContent,
            msg.endLine
              ? `${msg.line}:${msg.column} - ${msg.endLine}:${msg.endColumn}`
              : `${msg.line}:${msg.column}`,
            reportingLine,
            report,
          );
        });
      }
    } catch (e) {
      console.error(content, e);
    }
  }
}

async function checkCSS(
  content: string,
  language: string,
  path: string,
  report: (path: string, message: string, ...data: string[]) => void,
  fullContent: string = content,
) {
  const isPropertyOnly = !content.includes("{");
  const origConsoleWarn = console.warn;
  console.warn = (msg: string) => {
    if (msg === "[csstree-match] BREAK after 15000 iterations") {
      origConsoleWarn(
        "[csstree-match] BREAK after 15000 iterations",
        path,
        content,
      );
    } else {
      origConsoleWarn(msg);
    }
  };
  try {
    const results = await stylelint.lint({
      code: content,
      codeFilename: `${path.replace("/en-US/docs/", "")}/test.${language}`,
      config: stylelintConfig(isPropertyOnly),
      cache: false,
      fix: false,
      validate: false,
    });
    console.warn = origConsoleWarn;
    for (const result of results.results) {
      result.warnings.forEach((msg) => {
        const reportRegion = content
          .split("\n")
          .slice(msg.line - 1, msg.endLine ? msg.endLine : msg.line)
          .join("\n");
        // TODO: csstree does not recognize trig functions
        if (
          msg.rule === "declaration-property-value-no-unknown" &&
          msg.text.match(
            /Unexpected unknown value "rotate\((?:asin|acos|atan|atan2)\([^)]+\)\)" for property "transform" \(declaration-property-value-no-unknown\)/,
          ) &&
          reportRegion.match(
            /^\s*transform: rotate\((?:asin|acos|atan|atan2)\([^)]+\)\);$/,
          )
        ) {
          return;
        }
        if (
          msg.rule === "declaration-property-value-no-unknown" &&
          msg.text.match(
            /Unexpected unknown value "round\([^)]+\)" for property "height" \(declaration-property-value-no-unknown\)/,
          ) &&
          reportRegion.match(/^\s*height: round\([^)]+\);$/)
        ) {
          return;
        }
        if (
          msg.rule === "declaration-property-value-no-unknown" &&
          msg.text.match(
            /Unexpected unknown value "sign\([^)]+\)" for property "background-position" \(declaration-property-value-no-unknown\)/,
          ) &&
          reportRegion.match(/^\s*background-position: sign\([^)]+\);$/)
        ) {
          return;
        }
        // TODO: csstree does not recognize size in calc-size or relative color functions
        if (
          msg.rule === "declaration-property-value-no-unknown" &&
          msg.text.match(
            /Unexpected unknown value "calc-size\(.*\)" for property "(?:width|height)" \(declaration-property-value-no-unknown\)/,
          ) &&
          reportRegion.match(/^\s*(?:width|height): calc-size\(.*\);$/)
        ) {
          return;
        }
        if (
          msg.rule === "declaration-property-value-no-unknown" &&
          msg.text.match(
            /Unexpected unknown value "(?:rgb|lch)\(from .*\)" for property "(?:background-color|color)" \(declaration-property-value-no-unknown\)/,
          ) &&
          reportRegion.match(
            /^\s*(?:background-color|color): (?:rgb|lch)\(from .*\);$/,
          )
        ) {
          return;
        }
        reportIfUnexpected(
          path,
          "css",
          msg.rule,
          msg.text,
          fullContent,
          msg.endLine
            ? `${msg.line}:${msg.column} - ${msg.endLine}:${msg.endColumn}`
            : `${msg.line}:${msg.column}`,
          reportRegion,
          report,
        );
      });
    }
  } catch (e) {
    console.error(content, e);
  }
}

async function checkHTML(
  content: string,
  language: string,
  path: string,
  report: (path: string, message: string, ...data: string[]) => void,
) {
  const { rootNodes, errors } = htmlParse(content);
  if (errors.length) {
    errors.forEach((error) => {
      reportIfUnexpected(
        path,
        "html",
        "syntax",
        error.msg,
        content,
        `${error.span.start.line}:${error.span.start.col} - ${error.span.end.line}:${error.span.end.col}`,
        content
          .split("\n")
          .slice(error.span.start.line - 1, error.span.end.line)
          .join("\n"),
        report,
      );
    });
    return;
  }
  const messages: {
    ruleId: string;
    message: string;
    content: string;
    span: any;
  }[] = [];
  const otherPromises: Promise<void>[] = [];
  for (const rootNode of rootNodes) {
    rootNode.visit(htmlVisitor, {
      isTemplate: 0,
      isSVG: 0,
      isMathML: 0,
      path,
      content,
      messages,
      report,
      otherPromises,
    });
  }
  await Promise.all(otherPromises);
  const filePath = path.replace("/en-US/docs/", "");
  for (const msg of messages) {
    reportIfUnexpected(
      path,
      "html",
      msg.ruleId,
      msg.message,
      content,
      `${msg.span.start.line}:${msg.span.start.col} - ${msg.span.end.line}:${msg.span.end.col}`,
      content
        .split("\n")
        .slice(msg.span.start.line, msg.span.end.line + 1)
        .join("\n"),
      report,
    );
  }
  const htmlValidateRes = await htmlvalidate.validateString(content, filePath);
  for (const result of htmlValidateRes.results) {
    for (const msg of result.messages) {
      reportIfUnexpected(
        path,
        "html",
        msg.ruleId,
        msg.message,
        content,
        `${msg.line}:${msg.column}`,
        content.substr(msg.offset, msg.size),
        report,
      );
    }
  }
}

function checkJSON(
  content: string,
  language: string,
  path: string,
  report: (path: string, message: string, ...data: string[]) => void,
) {
  let cleanContent = content.replaceAll("// …\n", "");
  try {
    JSON.parse(cleanContent);
  } catch (e) {
    reportIfUnexpected(
      path,
      "json",
      "syntax",
      e.message,
      cleanContent,
      null,
      content,
      report,
    );
  }
}

export default async function checkCode() {
  const { default: codes } = await import("../../data/codes.json", {
    with: { type: "json" },
  });
  const allReports: { [path: string]: { message: string; data: string[] }[] } =
    {};
  function report(path: string, message: string, ...args: any[]) {
    (allReports[path] ??= []).push({
      message,
      data: args,
    });
  }

  // const allChecks = Object.entries(codes).flatMap(
  //   ([path, blocks]) =>
  //     blocks.map((block) => {
  //       if (["js", "ts", "jsx", "tsx"].includes(block.language)) {
  //         return checkJS(block.content, block.language, path, report);
  //       } else if (["css"].includes(block.language)) {
  //         return checkCSS(block.content, block.language, path, report);
  //       } else if (["html"].includes(block.language)) {
  //         return checkHTML(block.content, block.language, path, report);
  //       } else if (!sanctionedLanguages.includes(block.language)) {
  //         report(path, "Invalid code block language", block.language);
  //       }
  //       return undefined;
  //     }) ?? [],
  // );
  // await Promise.all(allChecks);
  // Can't be parallel, otherwise stylelint OOMs
  for (const [path, blocks] of Object.entries(codes)) {
    for (const block of blocks) {
      if (["js", "ts", "jsx", "tsx"].includes(block.language)) {
        await checkJS(block.content, block.language, path, report, block.full);
      } else if (["css"].includes(block.language)) {
        await checkCSS(block.content, block.language, path, report, block.full);
      } else if (["html"].includes(block.language)) {
        await checkHTML(block.content, block.language, path, report);
      } else if (["json"].includes(block.language)) {
        checkJSON(block.content, block.language, path, report);
      } else if (!sanctionedLanguages.includes(block.language)) {
        report(path, "Invalid code block language", block.language);
      }
    }
  }
  for (const [file, blocks] of expectedErrorsMap) {
    for (const [code, messages] of blocks) {
      for (const [message, status] of messages) {
        if (!status) {
          console.warn(`${file}\n${message}\n~~~\n${code}~~~\n`);
        }
      }
    }
  }
  await Bun.write("./data/lint.json", JSON.stringify(allReports, null, 2));
  console.log("Lint results written to data/lint.json");
}
