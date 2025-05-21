import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import stylelint from "stylelint";
import { parse as htmlParse } from "angular-html-parser";

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

const eslintConfig = [
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
    },
    // No rules for now
  },
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
  /(?<file>\/en-US\/docs\/[^ ]+): (?<message>.*)\n~~~\n(?<code>(?:.|\n)+?)~~~\n/g,
);
const expectedErrorsMap = new Map<string, Map<string, Map<string, boolean>>>();
for (const match of expectedErrors) {
  const { file, message, code } = match.groups!;
  if (!expectedErrorsMap.has(file)) {
    expectedErrorsMap.set(file, new Map());
  }
  if (!expectedErrorsMap.get(file)!.has(code)) {
    expectedErrorsMap.get(file)!.set(code, new Map());
  }
  expectedErrorsMap.get(file)!.get(code)!.set(message, false);
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
        const results = await eslint.lintText(content, {
          filePath: `test.${language}`,
        });
        for (const result of results) {
          result.messages.forEach((msg) => {
            if (
              expectedErrorsMap.has(file) &&
              expectedErrorsMap.get(file)!.has(content)
            ) {
              const expectedMessages = expectedErrorsMap
                .get(file)!
                .get(content)!;
              if (expectedMessages.has(msg.message)) {
                expectedMessages.set(msg.message, true);
                return;
              }
            }
            report(
              node,
              language === "html" ? "HTML code issue" : "JS code issue",
              msg.message,
              content.split("\n")[msg.line - 1] || content,
              msg.endLine
                ? `${msg.line}:${msg.column} - ${msg.endLine}:${msg.endColumn}`
                : `${msg.line}:${msg.column}`,
            );
          });
        }
      } else if (["css"].includes(language)) {
        const results = await stylelint.lint({
          code: content,
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
              if (expectedMessages.has(msg.text)) {
                expectedMessages.set(msg.text, true);
                return;
              }
            }
            report(
              node,
              "CSS code issue",
              msg.text,
              content.split("\n")[msg.line - 1] || content,
              `${msg.line}:${msg.column}`,
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
            if (expectedMessages.has(error.msg)) {
              expectedMessages.set(error.msg, true);
              return;
            }
          }
          report(
            node,
            "HTML code issue",
            error.msg,
            content.split("\n")[error.span.start.line] || content,
            `${error.span.start.line}:${error.span.start.col}`,
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
            `${file}: ${message}\n~~~\n${code}~~~\nIs no longer referenced`,
          );
        }
      }
    }
  }
}
