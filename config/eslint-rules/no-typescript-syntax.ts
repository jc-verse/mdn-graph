import type { Rule } from "eslint";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow TypeScript syntax in JavaScript examples",
    },
    schema: [],
    messages: {
      typescript: "TypeScript syntax is not allowed in JavaScript examples.",
    },
  },
  create(context) {
    let reportedNode: Rule.Node | null = null;
    return {
      "*"(node) {
        if (reportedNode) return;

        const isParameter =
          node.parent &&
          "params" in node.parent &&
          Array.isArray(node.parent.params) &&
          node.parent.params.includes(node);

        if (
          node.type.startsWith("TS") ||
          // TypeScript's explicit this parameter and legacy parameter decorators
          // are represented using ordinary JavaScript node types.
          (isParameter &&
            ((node.type === "Identifier" && node.name === "this") ||
              ("decorators" in node &&
                Array.isArray(node.decorators) &&
                node.decorators.length > 0))) ||
          ("accessibility" in node && node.accessibility !== undefined) ||
          ("abstract" in node && node.abstract === true) ||
          ("declare" in node && node.declare === true) ||
          ("readonly" in node && node.readonly === true) ||
          ("override" in node && node.override === true) ||
          ("definite" in node && node.definite === true) ||
          ("importKind" in node && node.importKind === "type") ||
          ("exportKind" in node && node.exportKind === "type") ||
          // Optional calls and member accesses are JavaScript optional chaining.
          ("optional" in node &&
            node.optional === true &&
            node.type !== "CallExpression" &&
            node.type !== "MemberExpression")
        ) {
          context.report({ node, messageId: "typescript" });
          reportedNode = node;
        }
      },
      "*:exit"(node) {
        if (node === reportedNode) reportedNode = null;
      },
    };
  },
} satisfies Rule.RuleModule;
