export default function stylelintConfig(isPropertyOnly: boolean) {
  return {
    languageOptions: {
      syntax: {
        atRules: {
          "position-try": {
            prelude: "<dashed-ident>",
            descriptors: {
              "position-anchor": "auto | <anchor-name>",
              "position-area": "none | <position-area>",
              top: "auto | <length-percentage> | <anchor()> | <anchor-size()>",
              left: "auto | <length-percentage> | <anchor()> | <anchor-size()>",
              right:
                "auto | <length-percentage> | <anchor()> | <anchor-size()>",
              bottom:
                "auto | <length-percentage> | <anchor()> | <anchor-size()>",
            },
          },
        },
      },
    },
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
      "font-family-no-missing-generic-family-keyword": null, // TODO
      "function-linear-gradient-no-nonstandard-direction": true,
      "declaration-block-no-shorthand-property-overrides": true,
      "selector-anb-no-unmatchable": true,
      "annotation-no-unknown": true,
      "at-rule-descriptor-no-unknown": true,
      "at-rule-descriptor-value-no-unknown": true,
      "at-rule-no-unknown": true,
      "declaration-property-value-no-unknown": [
        true,
        {
          ignoreProperties: {
            appearance: "base-select",
            "/^(left|top|right|bottom)$/": "<anchor()>",
          },
        },
      ],
      "function-no-unknown": true,
      "media-feature-name-no-unknown": [
        true,
        { ignoreMediaFeatureNames: ["media-feature-rule"] },
      ],
      "media-feature-name-value-no-unknown": true,
      "no-unknown-animations": null, // TODO
      "no-unknown-custom-media": true,
      "no-unknown-custom-properties": null, // TODO
      "property-no-unknown": [
        true,
        { ignoreProperties: ["scroll-marker-group"] },
      ],
      "selector-pseudo-class-no-unknown": [
        true,
        { ignorePseudoClasses: ["unsupported-pseudo"] },
      ],
      "selector-pseudo-element-no-unknown": [
        true,
        { ignorePseudoElements: ["picker", "picker-icon", "checkmark"] },
      ],
      "selector-type-no-unknown": [
        true,
        {
          ignoreTypes: [
            "selectedcontent",
            "some-element",
            /(\w+-)?custom-element/,
          ],
        },
      ],
      "unit-no-unknown": true,
    },
    overrides: [
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
        files: ["Web/API/WebVTT_API/**"],
        rules: {
          "selector-type-no-unknown": [true, { ignoreTypes: ["c", "v"] }],
        },
      },
      {
        files: ["Web/CSS/@color-profile/*", "Web/CSS/dashed-ident/*"],
        rules: {
          "at-rule-no-unknown": [true, { ignoreAtRules: ["color-profile"] }],
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
        files: ["Web/CSS/@media/scan/*"],
        rules: { "media-feature-name-value-no-unknown": null },
      },
      {
        files: ["Web/CSS/::scroll-button/*"],
        rules: {
          "selector-type-no-unknown": [
            true,
            { ignoreTypes: ["left", "right"] },
          ],
        },
      },
      {
        files: ["Web/CSS/box-orient/*", "Web/CSS/box-pack/*"],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "display" },
          ],
        },
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
        },
      },
      {
        files: ["Web/CSS/scroll-timeline-axis/*"],
        rules: {
          "declaration-block-no-duplicate-properties": [
            true,
            { ignoreProperties: "scroll-timeline-axis" },
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
    ],
  };
}
