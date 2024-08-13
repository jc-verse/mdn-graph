import type { Options } from ".";

export default function validateOptions(
  options: Partial<Options> = {},
): Options {
  options.container = options.container || document.body;
  options.clearColor =
    typeof options.clearColor === "number" ? options.clearColor : 0x000000;
  options.clearAlpha =
    typeof options.clearAlpha === "number" ? options.clearAlpha : 1;
  options.link =
    typeof options.link === "function" ? options.link : defaultLink;
  options.node =
    typeof options.node === "function" ? options.node : defaultNode;
  return options as Options;
}

function defaultNode(/* node */) {
  return { size: 20, color: 0xff0894 };
}

function defaultLink(/* link */) {
  return { fromColor: 0xffffff, toColor: 0xffffff };
}
