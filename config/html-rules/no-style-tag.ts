// Extends the base no-style-tag rule to allow empty style

import {
  DOMReadyEvent,
  Rule,
  RuleDocumentation,
  NodeType,
} from "html-validate";

export default class NoStyleTagRule extends Rule {
  public setup(): void {
    this.on("dom:ready", (event: DOMReadyEvent) => {
      const { document } = event;
      const styleTags = document.getElementsByTagName("style");

      for (const el of styleTags) {
        if (el.parent?.nodeName === "template") continue;
        if (el.attributes.some((x) => x.key === "id")) continue;
        if (
          el.childNodes.length === 1 &&
          el.childNodes[0]!.nodeType === NodeType.TEXT_NODE &&
          el.childNodes[0]!.textContent.trim().match(
            /^\/\* (?:…|Add styles here|Insert your CSS here|CSS goes here) \*\/$/,
          )
        )
          continue;
        // Used by a few game articles
        if (
          el.textContent.replace(/\s/g, "") ===
          "html,body,canvas{margin:0;padding:0;width:100%;height:100%;font-size:0;}"
        )
          continue;
        this.report({
          node: el,
          message: "Use external stylesheet with <link> instead of <style> tag",
        });
      }
    });
  }
}
