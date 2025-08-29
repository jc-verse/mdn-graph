import cssSyntax from "@webref/css";

const parsedFiles = await cssSyntax.listAll();

function toPropertiesSyntax(spec) {
  const res = {};
  for (const prop of spec.properties) {
    if (prop.value) {
      res[prop.name] = prop.value;
    } else if (prop.newValues) {
      res[prop.name] = `| ${prop.newValues}`;
    }
  }
  return res;
}

function toTypesSyntax(spec, res = {}) {
  for (const prop of spec.values) {
    if (prop.value) {
      res[prop.name.replace(/^<|>$/g, "")] = prop.value;
    } else if (prop.values) {
      res[prop.name.replace(/^<|>$/g, "")] = prop.values
        .map((x) => {
          if (!x.value) throw new Error(`No value for ${prop.name} ${x.name}`);
          if (x.values) toTypesSyntax(x, res);
          return x.value;
        })
        .join(" | ");
    }
  }
  return res;
}

function mergeSyntaxes(...entries) {
  const res = {};
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry)) {
      if (res[key]) {
        if (value.startsWith("| ")) {
          res[key] += value;
        } else if (res[key].startsWith("| ")) {
          res[key] = value + res[key];
        } else if (res[key] !== value) {
          if (Bun.argv.includes("lint")) {
            console.warn(
              `Duplicate syntax for ${key}:\n- ${res[key]}\n- ${value}`,
            );
          }
          // Later one is newer
          res[key] = value;
        }
      } else {
        res[key] = value;
      }
    }
  }
  return res;
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
    properties: mergeSyntaxes(
      toPropertiesSyntax(parsedFiles["css-anchor-position"]),
      toPropertiesSyntax(parsedFiles["css-backgrounds-4"]),
      toPropertiesSyntax(parsedFiles["css-borders"]),
      toPropertiesSyntax(parsedFiles["css-box"]),
      toPropertiesSyntax(parsedFiles["css-conditional-5"]),
      toPropertiesSyntax(parsedFiles["css-fonts"]),
      toPropertiesSyntax(parsedFiles["css-fonts-5"]),
      toPropertiesSyntax(parsedFiles["css-grid-3"]),
      toPropertiesSyntax(parsedFiles["css-images"]),
      toPropertiesSyntax(parsedFiles["css-inline"]),
      toPropertiesSyntax(parsedFiles["css-text-4"]),
      toPropertiesSyntax(parsedFiles["compositing"]),
      {
        // LEGACY
        "alignment-baseline": "| hanging",
        appearance: "| slider-vertical | base-select", // NEW: base-select
        display: "| box | -moz-box",
        "box-align": "start | center | end | baseline | stretch",
        "box-direction": "normal | reverse",
        "box-lines": "single | multiple",
        "box-ordinal-group": "<integer>",
        "box-orient": "horizontal | vertical | inline-axis | block-axis",
        "box-pack": "start | center | end | stretch",
        "text-justify": "| distribute", // TODO: remove
        "fill-opacity": "<'opacity'>", // csstree incorrect
        // horizontal & vertical are FF-only
        "scroll-timeline-axis":
          "[ block | inline | x | y | horizontal | vertical ]#",
        // NEW: calc-size
        // https://github.com/stylelint/stylelint/issues/8320
        // I can't extend the length type, only each property
        height: "| <calc-size()>",
        width: "| <calc-size()>",
        // TODO: No way to say that every property accepts <attr()>
        "background-color": "| <attr()>",
        rotate: "| <attr()>",
        "view-transition-name": "| <attr()>",
        // csstree bugs?
        "-webkit-mask-repeat-x": "[ repeat | no-repeat | space | round ]#",
        "-webkit-mask-repeat-y": "[ repeat | no-repeat | space | round ]#",
        "-webkit-text-stroke-width": "| thin | medium | thick",
      },
    ),
    types: mergeSyntaxes(
      toTypesSyntax(parsedFiles["css-anchor-position"]),
      toTypesSyntax(parsedFiles["css-backgrounds-4"]),
      toTypesSyntax(parsedFiles["css-borders"]),
      toTypesSyntax(parsedFiles["css-color"]),
      toTypesSyntax(parsedFiles["css-color-5"]),
      toTypesSyntax(parsedFiles["css-counter-styles"]),
      {
        // <counter-style-name> is defined as a <custom-ident>
        // but there are some pre-defined values. webref is confusing in this case
        "counter-style-name": "<custom-ident>",
      },
      toTypesSyntax(parsedFiles["css-easing"]),
      toTypesSyntax(parsedFiles["css-fonts"]),
      toTypesSyntax(parsedFiles["css-images"]),
      toTypesSyntax(parsedFiles["css-images-4"]),
      {
        // LEGACY
        "cross-fade()": "| cross-fade( <image> , <image> , <percentage> )",
        "-webkit-cross-fade()":
          "-webkit-cross-fade( <image> , <image> , <percentage> )",
        // TODO: paint() should be added to <image> in webref
        image: "| <paint()> | <-webkit-cross-fade()>",
        // TODO: currently there's a webref warning: "Missing definition"
        // Remove when fixed
        "radial-size": "<radial-extent>{1,2} | <length-percentage [0,∞]>{1,2}",
      },
      toTypesSyntax(parsedFiles["css-shapes"]),
      toTypesSyntax(parsedFiles["css-shapes-2"]),
      toTypesSyntax(parsedFiles["css-text-4"]),
      toTypesSyntax(parsedFiles["css-values-5"]),
      {
        // should suffice to accept all valid values
        "size-keyword":
          "auto | fit-content | min-content | max-content | fill-available | stretch",
        // TODO: verify
        "attr-unit":
          "string | color | url | integer | number | length | angle | time | frequency | cap | ch | em | ex | ic | lh | rlh | rem | vb | vi | vw | vh | vmin | vmax | mm | Q | cm | in | pt | pc | px | deg | grad | rad | turn | ms | s | Hz | kHz | %",
      },
      toTypesSyntax(parsedFiles["compositing"]),
      {
        // I think this is a bug with the compositing spec:
        // <background-blend-mode> refers to <mix-blend-mode>
        // without declaring the latter as a type
        "mix-blend-mode": "<blend-mode> | plus-darker | plus-lighter",
      },
      // TODO There's some incompatibility between fill-stroke and SVG.
      // Namely SVG defines fill = <paint> but fill-stroke considers it a shorthand
      // For now we manually patch the part we need
      // toTypesSyntax(parsedFiles["fill-stroke"]),
      {
        paint: "| <image>",
      },
      {
        // LEGACY
        image: "| <-moz-element()> | <-moz-image-rect()>",
        "-moz-element()": "-moz-element( <id-selector> )",
        "-moz-image-rect()":
          "-moz-image-rect( <url> , [ <integer> | <percentage> ]#{4} )",
      },
    ),
  },
};

// console.log(Object.keys(parsedFiles).sort().join("\n"));
// console.log(toTypesSyntax(parsedFiles["css-images-4"]));
// console.log(languageOptions);

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
            "if",
            "media",
            "style",
            "supports",
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
      "media-feature-range-notation": "context",
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
