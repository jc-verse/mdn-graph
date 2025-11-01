import { definePlugin } from "html-validate";
import NoStyleTagRule from "./no-style-tag.ts";

export default definePlugin({
  rules: {
    "mdn-graph/no-style-tag": NoStyleTagRule,
  },
});
