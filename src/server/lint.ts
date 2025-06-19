import { ESLint } from "eslint";
import stylelint from "stylelint";
import { parse as htmlParse } from "angular-html-parser";
import eslintConfig from "../../config/eslint-config.ts";
import stylelintConfig from "../../config/stylelint-config.ts";
import htmlLintConfig from "../../config/html-lint-config.ts";
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

const htmlVisitor: Visitor = {
  visitAttribute(attr, ctx) {
    if (attr.name.startsWith("on")) {
      ctx.messages.push({
        ruleId: "no-inline-event-handlers",
        message: `Do not use inline event handler "${attr.name}".`,
        content: ctx.content,
        span: attr.sourceSpan,
      });
    } else if (attr.name === "style") {
      if (
        // Not worth fixing
        (ctx.path === "/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths" &&
          attr.value === "display:none") ||
        (ctx.path.startsWith("/en-US/docs/Web/API/SVG") &&
          attr.value.match(/^fill:\w+;$/))
      )
        return;
      ctx.messages.push({
        ruleId: "no-style-attr",
        message: `Do not use the style attribute.`,
        content: ctx.content,
        span: attr.sourceSpan,
      });
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
      if (
        !(
          el.children.length === 1 &&
          el.children[0]!.type === "text" &&
          (el.children[0]!.value.trim().match(
            /^\/\* (?:…|Add styles here|Insert your CSS here|CSS goes here) \*\/$/,
          ) ||
            // Used by a few game articles
            el.children[0]!.value.replace(/\s/g, "") ===
              "html,body,canvas{margin:0;padding:0;width:100%;height:100%;font-size:0;}")
        ) &&
        !ctx.isTemplate &&
        // If the style has an id, it is probably used by a script
        !el.attrs.some((attr) => attr.name === "id")
      ) {
        ctx.messages.push({
          ruleId: "no-style-elem",
          message:
            "Do not use the <style> element; use separate CSS blocks instead.",
          content: ctx.content,
          span: el.sourceSpan,
        });
      }
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
    if (el.name === "template") {
      ctx.isTemplate++;
    }
    el.attrs.forEach((attr) => attr.visit(this, ctx));
    el.children.forEach((child) => child.visit(this, ctx));
    if (el.name === "template") {
      ctx.isTemplate--;
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
  report(
    path,
    `${language.toUpperCase()} code issue`,
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
      reportIfUnexpected(
        path,
        "css",
        msg.rule,
        msg.text,
        fullContent,
        msg.endLine
          ? `${msg.line}:${msg.column} - ${msg.endLine}:${msg.endColumn}`
          : `${msg.line}:${msg.column}`,
        content
          .split("\n")
          .slice(msg.line - 1, msg.endLine ? msg.endLine : msg.line)
          .join("\n"),
        report,
      );
    });
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
    if (
      htmlLintConfig.ignore.some(
        (ignore) =>
          ignore.files.some((file) => {
            if (file.endsWith("/**")) {
              return filePath.startsWith(file.slice(0, -3).replace(/\/$/, ""));
            }
            return filePath === file;
          }) && ignore.rules[msg.ruleId] === "off",
      )
    ) {
      continue;
    }
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
