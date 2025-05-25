import { ESLint } from "eslint";
import stylelint from "stylelint";
import { parse as htmlParse } from "angular-html-parser";
import eslintConfig from "../../config/eslint-config.ts";

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

const stylelintConfig = {
  fix: false,
  rules: {
    // No rules for now
  },
};

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

export async function checkCode(
  nodes: any[],
  report: (node: any, message: string, ...data: string[]) => void,
) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: eslintConfig,
    fix: false,
  });
  const { default: codes } = await import("../../data/codes.json", {
    with: { type: "json" },
  });
  for (const node of nodes) {
    const file = node.id;
    const blocks = codes[file];
    if (!blocks) continue;
    for (const block of blocks) {
      const { language, content } = block;
      if (["js", "ts", "jsx", "tsx"].includes(language)) {
        if (content.includes("// SyntaxError: ")) continue;
        const scripts = content
          .split(/\/\/ -- ([^ ]*) --\n/)
          .reduce((acc, part, i, arr) => {
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
              filePath: `${node.id.replace("/en-US/docs/", "")}/${fileName}`,
            },
          );
          for (const result of results) {
            result.messages.forEach((msg) => {
              if (
                expectedErrorsMap.has(file) &&
                expectedErrorsMap.get(file)!.has(content)
              ) {
                const expectedMessages = expectedErrorsMap
                  .get(file)!
                  .get(content)!;
                const fullMessage = `[${msg.ruleId ?? "syntax"}] ${msg.message}`;
                if (expectedMessages.has(fullMessage)) {
                  expectedMessages.set(fullMessage, true);
                  return;
                }
              }
              // No better way to disable this error :(
              if (
                msg.ruleId === "no-unused-labels" &&
                msg.message === "'$:' is defined but never used." &&
                node.id.startsWith(
                  "/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Svelte_",
                )
              )
                return;
              report(
                node,
                "JS code issue",
                msg.ruleId ?? "syntax",
                msg.message,
                content.split("\n")[msg.line - 1],
                msg.endLine
                  ? `${msg.line}:${msg.column} - ${msg.endLine}:${msg.endColumn}`
                  : `${msg.line}:${msg.column}`,
                `${node.id}\n[${msg.ruleId ?? "syntax"}] ${msg.message}\n~~~\n${content}~~~\n`,
              );
            });
          }
        }
      } else if (["css"].includes(language)) {
        const results = await stylelint.lint({
          code: content,
          codeFilename: `${node.id.replace("/en-US/docs/", "")}/test.css`,
          config: stylelintConfig,
          cache: false,
        });
        for (const result of results.results) {
          result.warnings.forEach((msg) => {
            if (
              expectedErrorsMap.has(file) &&
              expectedErrorsMap.get(file)!.has(content)
            ) {
              const expectedMessages = expectedErrorsMap
                .get(file)!
                .get(content)!;
              const fullMessage = `[${msg.rule}] ${msg.text}`;
              if (expectedMessages.has(fullMessage)) {
                expectedMessages.set(fullMessage, true);
                return;
              }
            }
            report(
              node,
              "CSS code issue",
              msg.rule,
              msg.text,
              content.split("\n")[msg.line - 1] || content,
              `${msg.line}:${msg.column}`,
                `${node.id}\n[${msg.rule}] ${msg.text}\n~~~\n${content}~~~\n`,
            );
          });
        }
      } else if (["html"].includes(language)) {
        const { errors } = htmlParse(content);
        errors.forEach((error) => {
          if (
            expectedErrorsMap.has(file) &&
            expectedErrorsMap.get(file)!.has(content)
          ) {
            const expectedMessages = expectedErrorsMap.get(file)!.get(content)!;
            const fullMessage = `[syntax] ${error.msg}`;
            if (expectedMessages.has(fullMessage)) {
              expectedMessages.set(fullMessage, true);
              return;
            }
          }
          report(
            node,
            "HTML code issue",
            "syntax",
            error.msg,
            content.split("\n")[error.span.start.line] || content,
            `${error.span.start.line}:${error.span.start.col}`,
            `${node.id}\n[syntax] ${error.msg}\n~~~\n${content}~~~\n`,
          );
        });
      } else if (!sanctionedLanguages.includes(language)) {
        report(node, "Invalid code block language", language);
      }
    }
  }
}

export function postCheckCode() {
  for (const [file, blocks] of expectedErrorsMap) {
    for (const [code, messages] of blocks) {
      for (const [message, status] of messages) {
        if (!status) {
          console.warn(
            `${file}\n${message}\n~~~\n${code}~~~\nIs no longer referenced`,
          );
        }
      }
    }
  }
}
