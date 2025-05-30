import { ESLint } from "eslint";
import stylelint from "stylelint";
import { parse as htmlParse } from "angular-html-parser";
import eslintConfig from "../../config/eslint-config.ts";
import stylelintConfig from "../../config/stylelint-config.ts";
import htmlLintConfig from "../../config/html-lint-config.ts";

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
        reportIfUnexpected(
          path,
          "js",
          msg.ruleId ?? "syntax",
          msg.message,
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
}

async function checkCSS(
  content: string,
  language: string,
  path: string,
  report: (path: string, message: string, ...data: string[]) => void,
  fullContent: string = content,
) {
  const isPropertyOnly = !content.includes("{");
  const results = await stylelint.lint({
    code: content,
    codeFilename: `${path.replace("/en-US/docs/", "")}/test.${language}`,
    config: stylelintConfig(isPropertyOnly),
    cache: false,
    fix: false,
    validate: false,
  });
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
    rootNode.visit(
      {
        visitAttribute(attr, ctx) {
          if (attr.name.startsWith("on")) {
            messages.push({
              ruleId: "no-inline-event-handlers",
              message: `Do not use inline event handler "${attr.name}".`,
              content,
              span: attr.sourceSpan,
            });
          } else if (attr.name === "style") {
            messages.push({
              ruleId: "no-style-attr",
              message: `Do not use the style attribute.`,
              content,
              span: attr.sourceSpan,
            });
          }
        },
        visitElement(el, ctx) {
          if (
            el.name === "script" &&
            !el.attrs.some((attr) => attr.name === "src") &&
            !el.attrs.some(
              (attr) => attr.name === "type" && attr.value !== "module",
            )
          ) {
            messages.push({
              ruleId: "no-inline-script",
              message:
                "Do not write JS within the <script> element; use separate JS blocks instead.",
              content,
              span: el.sourceSpan,
            });
            if (el.children.length === 1 && el.children[0]!.type === "text") {
              otherPromises.push(
                checkJS(el.children[0]!.value, "js", path, report, content),
              );
            } else {
              messages.push({
                ruleId: "empty-script",
                message: "Script element should have non-empty text.",
                content,
                span: el.sourceSpan,
              });
            }
          } else if (el.name === "style" && !ctx.isTemplate) {
            messages.push({
              ruleId: "no-style-elem",
              message:
                "Do not use the <style> element; use separate CSS blocks instead.",
              content,
              span: el.sourceSpan,
            });
            if (el.children.length === 1 && el.children[0]!.type === "text") {
              otherPromises.push(
                checkCSS(el.children[0]!.value, "css", path, report, content),
              );
            } else {
              messages.push({
                ruleId: "empty-style",
                message: "Style element should have non-empty text.",
                content,
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
      },
      { isTemplate: 0 },
    );
  }
  await Promise.all(otherPromises);
  const filePath = path.replace("/en-US/docs/", "");
  for (const msg of messages) {
    continue; // Don't report anything for now
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

  const allChecks = Object.entries(codes).flatMap(
    ([path, blocks]) =>
      blocks.map(async (block) => {
        if (["js", "ts", "jsx", "tsx"].includes(block.language)) {
          await checkJS(block.content, block.language, path, report);
        } else if (["css"].includes(block.language)) {
          await checkCSS(block.content, block.language, path, report);
        } else if (["html"].includes(block.language)) {
          checkHTML(block.content, block.language, path, report);
        } else if (!sanctionedLanguages.includes(block.language)) {
          report(path, "Invalid code block language", block.language);
        }
      }) ?? [],
  );
  await Promise.all(allChecks);
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
