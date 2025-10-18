import cssSyntax from "@webref/css";

const features = await cssSyntax.index();

function gatherProperties(...properties: string[]) {
  const result: Record<string, string> = {};
  for (const prop of properties) {
    if (!features.properties[prop]) throw new Error(`Unknown property ${prop}`);
    result[prop] = features.properties[prop].syntax;
  }
  return result;
}

function gatherTypes(...types: string[]) {
  const result: Record<string, string> = {};
  for (const type of types) {
    if (!features.types[type] && !features.functions[type])
      throw new Error(`Unknown type ${type}`);
    result[type] =
      features.types[type]?.syntax || features.functions[type]?.syntax;
  }
  return result;
}

const languageOptions = {
  syntax: {
    atRules: {
      // csstree has nearly everything except position-anchor & position-area
      "position-try": {
        prelude: "<dashed-ident>",
        descriptors: {
          "position-anchor": "auto | <anchor-name>",
          "position-area": "none | <position-area>",
          top: "auto | <length-percentage> | <anchor()> | <anchor-size()> | inherit | initial | revert | revert-layer | unset",
          left: "auto | <length-percentage> | <anchor()> | <anchor-size()> | inherit | initial | revert | revert-layer | unset",
          right:
            "auto | <length-percentage> | <anchor()> | <anchor-size()> | inherit | initial | revert | revert-layer | unset",
          bottom:
            "auto | <length-percentage> | <anchor()> | <anchor-size()> | inherit | initial | revert | revert-layer | unset",
        },
      },
    },
    properties: {
      ...gatherProperties(
        ...Object.keys(features.properties).filter((p) =>
          p.startsWith("corner"),
        ),
        "appearance",
        "caret",
        "caret-animation",
        "alignment-baseline",
        "dominant-baseline",
        "text-transform",
        "word-break",
        "font-synthesis-style",
        "font-variant",
        "margin-trim",
        "image-rendering",
        "image-orientation",
        "container-type",
        "fill-opacity",
        // Anchor sizing/positioning
        "justify-self",
        "align-self",
        "left",
        "right",
        "top",
        "bottom",
        "min-width",
        "width",
        "height",
        "margin-block-start",
        "margin-top",
        // Why does csstree say <length> instead of <length>{1,2}?
        "border-inline-width",
        // Another csstree bug
        "mix-blend-mode",
      ),
      // LEGACY
      display: "| box | -moz-box",
      "box-align": "start | center | end | baseline | stretch",
      "box-direction": "normal | reverse",
      "box-lines": "single | multiple",
      "box-ordinal-group": "<integer>",
      "box-orient": "horizontal | vertical | inline-axis | block-axis",
      "box-pack": "start | center | end | stretch",
      // csstree bugs?
      "-webkit-mask-repeat-x": "[ repeat | no-repeat | space | round ]#",
      "-webkit-mask-repeat-y": "[ repeat | no-repeat | space | round ]#",
      "-webkit-text-stroke-width": "| thin | medium | thick",
      "text-justify": "| distribute", // TODO: remove
      // horizontal & vertical are FF-only
      "scroll-timeline-axis":
        "[ block | inline | x | y | horizontal | vertical ]#",
    },
    types: {
      ...gatherTypes(
        // attr()
        "attr()",
        "attr-type",
        "syntax",
        "syntax-component",
        "syntax-combinator",
        "syntax-single-component",
        "syntax-multiplier",
        "syntax-string",
        // corner-shape
        "corner-shape-value",
        "superellipse()",
        // hsl()
        "hsl()",
        "hsla()",
        "legacy-hsl-syntax",
        "modern-hsl-syntax",
        "legacy-hsla-syntax",
        "modern-hsla-syntax",
        // Color interpolation
        "repeating-linear-gradient()",
        "linear-gradient-syntax",
        "repeating-conic-gradient()",
        "conic-gradient()",
        "conic-gradient-syntax",
        "repeating-radial-gradient()",
        "radial-gradient()",
        "radial-gradient-syntax",
        "radial-shape",
        "radial-size",
        "radial-extent",
        "color-stop-angle",
        // appearance
        "compat-special",
        // easing functions
        "easing-function",
        "linear-easing-function",
        "cubic-bezier-easing-function",
        "step-easing-function",
        "linear()",
        "cubic-bezier()",
        "steps()",
        // background-clip
        "bg-clip",
        // calc-size()
        "calc-size()",
        "calc-size-basis",
        // list-style-type
        "counter-style",
        "symbols()",
        "symbols-type",
        // stroke
        "svg-paint",
        // shape()
        "shape()",
        "shape-command",
      ),
      "basic-shape": " | <shape()>",
      // TODO why are these missing from webref?
      "coordinate-pair": "<length-percentage>{2}",
      "command-end-point": "[ to <position> | by <coordinate-pair> ]",
      "move-command": "move <command-end-point>",
      "line-command": "line <command-end-point>",
      "horizontal-line-command":
        "hline [ to [ <length-percentage> | left | center | right | x-start | x-end ] | by <length-percentage> ]",
      "vertical-line-command":
        "vline [ to [ <length-percentage> | top | center | bottom | y-start | y-end ] | by <length-percentage> ]",
      "curve-command":
        "curve [ [ to <position> with <control-point> [ / <control-point> ]? ] | [ by <coordinate-pair> with <relative-control-point> [ / <relative-control-point> ]? ] ]",
      "smooth-command":
        "smooth [ [ to <position> [ with <control-point> ]? ] | [ by <coordinate-pair> [ with <relative-control-point> ]? ] ]",
      "control-point": "[ <position> | <relative-control-point> ]",
      "relative-control-point":
        "<coordinate-pair> [ from [ start | end | origin ] ]?",
      "arc-command":
        "arc <command-end-point> [ [ of <length-percentage>{1,2} ] && <arc-sweep>? && <arc-size>? && [rotate <angle>]? ]",
      "arc-sweep": "cw | ccw",
      "arc-size": "large | small",
      // TODO: https://github.com/w3c/webref/issues/625
      paint: " | <image> | <svg-paint>",
      // should suffice to accept all valid values
      "size-keyword":
        "auto | fit-content | min-content | max-content | fill-available | stretch",
      // TODO: verify
      "attr-unit":
        "string | color | url | integer | number | length | angle | time | frequency | cap | ch | em | ex | ic | lh | rlh | rem | vb | vi | vw | vh | vmin | vmax | mm | Q | cm | in | pt | pc | px | deg | grad | rad | turn | ms | s | Hz | kHz | %",
      // LEGACY
      image:
        "| <-moz-element()> | <-moz-image-rect()> | <-webkit-cross-fade()>",
      "-moz-element()": "-moz-element( <id-selector> )",
      "-moz-image-rect()":
        "-moz-image-rect( <url> , [ <integer> | <percentage> ]#{4} )",
      "cross-fade()": "| cross-fade( <image> , <image> , <percentage> )",
      "-webkit-cross-fade()":
        "-webkit-cross-fade( <image> , <image> , <percentage> )",
      "generic-family": "| caption | status-bar",
    },
  },
};

export default function stylelintConfig(isPropertyOnly: boolean) {
  return {
    fix: false,
    validate: false,
    languageOptions,
    rules: {
      "at-rule-no-deprecated": true,
      "declaration-property-value-keyword-no-deprecated": true,
      "no-descending-specificity": null,
      "declaration-block-no-duplicate-custom-properties": isPropertyOnly
        ? null
        : true,
      "declaration-block-no-duplicate-properties": isPropertyOnly ? null : true,
      "font-family-no-duplicate-names": true,
      "keyframe-block-no-duplicate-selectors": true,
      "no-duplicate-at-import-rules": true,
      "no-duplicate-selectors": null,
      "block-no-empty": null,
      "comment-no-empty": true,
      "no-empty-source": null,
      "at-rule-prelude-no-invalid": true,
      "color-no-invalid-hex": true,
      "function-calc-no-unspaced-operator": true,
      "keyframe-declaration-no-important": true,
      "media-query-no-invalid": true,
      "named-grid-areas-no-invalid": true,
      "no-invalid-double-slash-comments": true,
      "no-invalid-position-at-import-rule": true,
      "string-no-newline": true,
      "syntax-string-no-invalid": true,
      "no-irregular-whitespace": true,
      "custom-property-no-missing-var-function": true,
      "font-family-no-missing-generic-family-keyword": [
        true,
        {
          ignoreFontFamilies: [
            // Web-safe fonts
            "Arial",
            "Courier",
            "Courier New",
            "Georgia",
            "Times New Roman",
            "Verdana",
            // Throwaway examples
            "PLACEHOLDER",
            "some-non-variable-font-family",
            "some-variable-font-family",
            "HeydingsControlsRegular", // An icon font; there's no fallback
          ],
        },
      ],
      "function-linear-gradient-no-nonstandard-direction": true,
      "declaration-block-no-shorthand-property-overrides": true,
      "selector-anb-no-unmatchable": true,
      "annotation-no-unknown": true,
      "at-rule-descriptor-no-unknown": true,
      "at-rule-descriptor-value-no-unknown": true,
      "at-rule-no-unknown": [
        true,
        {
          ignoreAtRules: [
            // NEW
            "color-profile",
            "function",
          ],
        },
      ],
      "declaration-property-value-no-unknown": true,
      "function-no-unknown": [
        true,
        {
          ignoreFunctions: [
            // NEW
            "contrast-color",
            "dynamic-range-limit-mix",
            "if",
            "media",
            "progress",
            "style",
            "supports",
            "superellipse",
            "sibling-count",
            "sibling-index",
          ],
        },
      ],
      "media-feature-name-no-unknown": [
        true,
        { ignoreMediaFeatureNames: ["media-feature-rule"] },
      ],
      "media-feature-name-value-no-unknown": true,
      // Not possible to check for undeclared vars because vars can be
      // declared in other blocks, just like in JS
      "no-unknown-animations": null,
      "no-unknown-custom-media": true,
      "no-unknown-custom-properties": null,
      "property-no-unknown": [
        true,
        {
          ignoreProperties: [
            "property",
            // NEW
            "scroll-marker-group",
            "reading-flow",
            "reading-order",
          ],
        },
      ],
      "selector-pseudo-class-no-unknown": [
        true,
        {
          ignorePseudoClasses: [
            "unsupported-pseudo",
            "invalid-pseudo",
            "invalid-pseudo-class",
            "maybe-unsupported",
            "bad-pseudoclass",
            "target-current",
            "unsupported",
            // NEW
            "target-within",
            "target-current",
          ],
        },
      ],
      "selector-pseudo-element-no-unknown": [
        true,
        {
          ignorePseudoElements: [
            // NEW: customizable select
            "picker",
            "picker-icon",
            "checkmark",
            // NEW: CSS carousel
            "column",
            "scroll-button",
            "scroll-marker",
          ],
        },
      ],
      "selector-type-no-unknown": [
        true,
        {
          ignoreTypes: [
            "some-element",
            /(\w+-)?custom-element/,
            // NEW
            "selectedcontent",
          ],
        },
      ],
      "unit-no-unknown": true,
      "color-named": "always-where-possible",
      "function-name-case": "lower",
      "selector-type-case": "lower",
      "value-keyword-case": [
        "lower",
        {
          camelCaseSvgKeywords: true,
          ignoreKeywords: [
            // I want to require color-mix(in srgb, var(--base) 100%, transparent)
            // but also color-interpolation-filter: sRGB
            "srgb",
          ],
          ignoreFunctions: ["tech"],
          ignoreProperties: [
            "size", // "A4" etc.
            "symbols",
            "additive-symbols",
            // TODO: the spec consistently uses uppercase `--Alternate`, but not sure if we should follow
            "font-palette",
            "voice-family",
          ],
        },
      ],
      "alpha-value-notation": "number",
      "color-function-alias-notation": "without-alpha",
      "color-function-notation": "modern",
      "color-hex-length": "long",
      "font-weight-notation": "named-where-possible",
      "hue-degree-notation": "number",
      "import-notation": "string",
      "keyframe-selector-notation":
        "percentage-unless-within-keyword-only-block",
      "lightness-notation": "number",
      "media-feature-range-notation": ["context", { except: ["exact-value"] }],
      "selector-not-notation": "complex",
      "selector-pseudo-element-colon-notation": "double",
      "font-family-name-quotes": "always-unless-keyword",
      "function-url-quotes": "always",
      "selector-attribute-quotes": "always",
      "declaration-block-no-redundant-longhand-properties": true,
      "shorthand-property-no-redundant-values": [
        true,
        { ignore: ["four-into-three-edge-values"] },
      ],
      "comment-whitespace-inside": "always",
    },
    overrides: [
      {
        files: [
          "Mozilla/Add-ons/WebExtensions/user_interface/Browser_styles/*",
        ],
        rules: {
          "font-family-no-missing-generic-family-keyword": [
            true,
            {
              // Seems to be non-standard
              ignoreFontFamilies: ["caption"],
            },
          ],
        },
      },
      {
        files: ["Web/API/CustomStateSet/*", "Web/CSS/:state/*"],
        rules: {
          "selector-type-no-unknown": [
            true,
            {
              ignoreTypes: [
                "compatible-state-element",
                "labeled-checkbox",
                "question-box",
                "many-state-element",
              ],
            },
          ],
        },
      },
      {
        files: ["Web/API/Document/mozSetImageElement/*"],
        // TODO it reports on -moz-element(#canvas-bg)
        rules: { "color-no-invalid-hex": null },
      },
      {
        files: [
          "Web/API/WebVTT_API/**",
          "Web/Media/Guides/Audio_and_video_delivery/Adding_captions_and_subtitles_to_HTML5_video/*",
        ],
        rules: {
          "selector-type-no-unknown": [true, { ignoreTypes: ["c", "v"] }],
        },
      },
      {
        files: [
          "Web/CSS/@container/*",
          "Web/CSS/CSS_containment/Container_size_and_style_queries/*",
        ],
        rules: { "at-rule-prelude-no-invalid": null },
      },
      {
        files: ["Web/CSS/@document/*"],
        rules: { "at-rule-no-deprecated": null },
      },
      {
        files: [
          "Web/CSS/@font-face/font-stretch/*",
          "Web/CSS/@font-face/src/*",
          "Web/CSS/@supports/*",
        ],
        rules: {
          "at-rule-descriptor-value-no-unknown": null,
          "function-no-unknown": null,
        },
      },
      {
        files: ["Web/CSS/@keyframes/*"],
        rules: { "keyframe-declaration-no-important": null },
      },
      {
        files: ["Web/CSS/@media/**"],
        rules: { "media-feature-range-notation": null },
      },
      {
        files: ["Web/CSS/@media/-moz-device-pixel-ratio/*"],
        rules: {
          "media-feature-name-no-unknown": [
            true,
            { ignoreMediaFeatureNames: ["min--moz-device-pixel-ratio"] },
          ],
        },
      },
      {
        files: ["Web/CSS/@media/device-posture/*"],
        rules: {
          "media-feature-name-no-unknown": [
            true,
            { ignoreMediaFeatureNames: ["device-posture"] },
          ],
        },
      },
      {
        files: ["Web/CSS/@media/scan/*"],
        rules: { "media-feature-name-value-no-unknown": null },
      },
      {
        files: ["Web/CSS/@media/shape/*"],
        rules: {
          "media-feature-name-no-unknown": [
            true,
            { ignoreMediaFeatureNames: ["shape"] },
          ],
        },
      },
      {
        files: ["Web/CSS/:local-link/*"],
        rules: {
          "selector-pseudo-class-no-unknown": [
            true,
            { ignorePseudoClasses: ["local-link"] },
          ],
        },
      },
      {
        files: [
          "Web/CSS/::scroll-button/*",
          "Web/CSS/CSS_overflow/CSS_carousels/*",
        ],
        rules: {
          "selector-type-no-unknown": [
            true,
            // NEW: CSS carousel
            // These are parameters of ::scroll-button; is there no better way to configure this??
            { ignoreTypes: ["left", "right"] },
          ],
        },
      },
      {
        files: [
          "Web/CSS/box-align/*",
          "Web/CSS/box-flex/*",
          "Web/CSS/box-orient/*",
          "Web/CSS/box-pack/*",
        ],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "display" },
          ],
        },
      },
      {
        files: [
          "Web/CSS/color_value/**",
          "Web/CSS/hue/*",
          "Web/CSS/hue-interpolation-method/*",
        ],
        rules: { "color-named": null },
      },
      {
        files: [
          "Web/CSS/cross-fade/*",
          "Web/CSS/gradient/repeating-linear-gradient/*",
        ],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "background-image" },
          ],
        },
      },
      {
        files: [
          "Web/CSS/CSS_images/Using_CSS_gradients/*",
          "Web/CSS/gradient/repeating-radial-gradient/*",
        ],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "background" },
          ],
        },
      },
      {
        files: ["Web/CSS/CSS_syntax/At-rule/*"],
        rules: {
          "at-rule-no-unknown": [true, { ignoreAtRules: ["identifier"] }],
        },
      },
      {
        files: ["Web/CSS/CSS_syntax/Error_handling/*"],
        rules: { "declaration-block-no-duplicate-properties": null },
      },
      {
        files: ["Web/CSS/CSS_Values_and_Units/CSS_Value_Functions/*"],
        rules: {
          "function-no-unknown": [true, { ignoreFunctions: ["function"] }],
        },
      },
      {
        files: ["Web/CSS/scroll-timeline/*"],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "scroll-timeline" },
          ],
          "declaration-property-value-no-unknown": [
            true,
            { ignoreProperties: { "scroll-timeline": ["horizontal"] } },
          ],
        },
      },
      {
        files: ["Web/CSS/scroll-timeline-axis/*"],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "scroll-timeline-axis" },
          ],
          "declaration-property-value-no-unknown": [
            true,
            { ignoreProperties: { "scroll-timeline-axis": ["horizontal"] } },
          ],
        },
      },
      {
        files: ["Web/CSS/view-timeline-axis/*"],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "view-timeline-axis" },
          ],
          "declaration-property-value-no-unknown": [
            true,
            { ignoreProperties: { "view-timeline-axis": ["horizontal"] } },
          ],
        },
      },
      {
        files: [
          "Web/CSS/CSS_overflow/*",
          "Web/CSS/overflow/*",
          "Web/CSS/overflow_value/*",
        ],
        rules: {
          "declaration-property-value-keyword-no-deprecated": [
            true,
            { ignoreKeywords: ["overlay"] },
          ],
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: ["overflow"] },
          ],
        },
      },
      {
        files: ["Web/CSS/CSS_text_decoration/*", "Web/CSS/text-decoration/*"],
        rules: {
          "declaration-property-value-keyword-no-deprecated": [
            true,
            { ignoreKeywords: ["blink"] },
          ],
        },
      },
      {
        files: ["Web/CSS/scroll-behavior/*"],
        rules: {
          "selector-type-no-unknown": [
            true,
            { ignoreTypes: ["scroll-container", "scroll-page"] },
          ],
        },
      },
      {
        files: ["Web/CSS/text-justify/*"],
        rules: {
          "declaration-property-value-keyword-no-deprecated": [
            true,
            { ignoreKeywords: ["distribute"] },
          ],
        },
      },
      {
        files: ["Web/CSS/position/*"],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "position" },
          ],
        },
      },
      {
        files: ["Web/CSS/word-break/*"],
        rules: {
          "declaration-property-value-keyword-no-deprecated": [
            true,
            { ignoreKeywords: ["break-word"] },
          ],
        },
      },
      {
        files: ["Web/CSS/transition-behavior/*"],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: ["transition"] },
          ],
        },
      },
      {
        files: ["Web/HTML/Reference/Global_attributes/exportparts/*"],
        rules: {
          "selector-type-no-unknown": [
            true,
            { ignoreTypes: ["card-wrapper", "card-component"] },
          ],
        },
      },
    ],
  };
}
