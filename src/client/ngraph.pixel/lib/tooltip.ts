import type { Node } from "ngraph.graph";
import type { MouseLocation } from "./hitTest.js";

export default function createTooltipView(container: HTMLElement) {
  const tooltipDom = document.createElement("div");
  tooltipDom.className = "ngraph-tooltip";
  container.appendChild(tooltipDom);
  let tooltipVisible: boolean;

  return { show, hide };

  function show(e: MouseLocation, node: Node) {
    tooltipDom.style.left = e.x + "px";
    tooltipDom.style.top = e.y + "px";
    tooltipDom.innerHTML = String(node.id);
    tooltipVisible = true;
  }

  function hide() {
    if (tooltipVisible) {
      tooltipDom.style.left = "-10000px";
      tooltipDom.style.top = "-10000px";
      tooltipVisible = false;
    }
  }
}
