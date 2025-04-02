import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import stylelint from "stylelint";

const eslintConfig = [
	{
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
  }
}

export async function checkCode(nodes: any[], report: (node: any, message: string, ...data: string[]) => void,) {
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
    // TODO: there's something wrong with this code
    if (file === "/en-US/docs/Web/CSS/@font-face/src") continue;
    const blocks = codes[file];
    if (!blocks) continue;
    for (const block of blocks) {
      const { language, content } = block;
      if (["js", "ts"].includes(language)) {
        const results = await eslint.lintText(content, { filePath: `test.${language}` });
        for (const result of results) {
          result.messages.forEach((msg) => {
            report(node, "ESLint error", msg.message, content.split("\n")[msg.line - 1], `${msg.line}:${msg.column} - ${msg.endLine}:${msg.endColumn}`);
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
            report(node, "Stylelint error", msg.text, content.split("\n")[msg.line - 1], `${msg.line}:${msg.column}`);
          });
        }
      }
    }
  }
}
