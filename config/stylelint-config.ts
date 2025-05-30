export default function stylelintConfig(isPropertyOnly: boolean) {
  return {
    fix: false,
    validate: false,
    languageOptions: {
      // NEW
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
      "at-rule-no-unknown": [
        true,
        {
          ignoreAtRules: [
            // NEW
            "color-profile",
          ],
        },
      ],
      "declaration-property-value-no-unknown": [
        true,
        {
          ignoreProperties: {
            "text-justify": ["distribute"], // TODO: remove
            // NEW
            "/^(align-self|justify-self)$": ["anchor-center"],
            appearance: ["base-select"],
            "/^(left|top|right|bottom)$/": ["<anchor()>"],
            "/^(width|height)$/": ["<calc-size()>"],
            "alignment-baseline": ["text-bottom", "text-top"],
            "background-clip": ["border-area"],
            "container-type": ["scroll-state"],
            "grid-template-rows": ["masonry"],
            "grid-template-columns": ["masonry"],
            "margin-trim": ["inline-end", "inline-start"],
            "mix-blend-mode": ["plus-darker"],
            "text-transform": ["math-auto"],
            "word-break": ["manual"],
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
            // NEW
            "picker",
            "picker-icon",
            "checkmark",
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
        files: [
          "Web/API/WebVTT_API/**",
          "Media/Guides/Audio_and_video_delivery/Adding_captions_and_subtitles_to_HTML5_video/*",
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
        files: [
          "Web/CSS/@media/scan/*",
          "Web/CSS/@media/-moz-device-pixel-ratio/*",
          "Web/CSS/@media/device-posture/*",
          "Web/CSS/@media/shape/*",
        ],
        rules: { "media-feature-name-value-no-unknown": null },
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
        files: ["Web/CSS/::scroll-button/*"],
        rules: {
          "selector-type-no-unknown": [
            true,
            // NEW
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
