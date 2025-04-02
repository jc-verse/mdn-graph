import { ESLint } from "eslint";
import tseslint from "typescript-eslint";

const eslintConfig = [
	{
    languageOptions: {
      parser: tseslint.parser,
    },
    // No rules for now
	},
];

export async function checkCode(nodes: any[], report: (node: any, message: string, ...data: string[]) => void,) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: eslintConfig,
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
      if (!["js", "ts"].includes(language)) continue;
      const results = await eslint.lintText(content, { filePath: `test.${language}` });
      for (const result of results) {
        result.messages.forEach((msg) => {
          report(node, "ESLint error", msg.message, content.split("\n")[msg.line - 1], `${msg.line}:${msg.column} - ${msg.endLine}:${msg.endColumn}`);
        });
      }
    }
  }
}
