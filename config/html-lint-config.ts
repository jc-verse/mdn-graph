import plugin from "./html-rules/index.ts";

export default {
  plugins: [plugin],
  elements: [
    "html5",
    {
      // LEGACY
      acronym: {
        phrasing: true,
      },
      big: {
        phrasing: true,
      },
      tt: {
        phrasing: true,
      },
    },
  ],
  rules: {
    "attr-delimiter": "error",
    "attr-spacing": "error",
    "close-attr": "error",
    "close-order": "error",
    "element-name": "off", // TODO
    "form-dup-name": [
      "error",
      { shared: ["radio", "submit", "checkbox", "button", "reset"] },
    ],
    "map-dup-name": "error",
    "map-id-name": "error",
    "no-dup-attr": "error",
    "no-dup-class": "error",
    "no-raw-characters": ["off", { relaxed: true }], // TODO
    "no-redundant-for": "off", // Style guide says to use both
    "script-type": "error",
    "unrecognized-char-ref": "error",
    "valid-autocomplete": "error",
    "valid-id": "error",

    "attribute-misuse": "error",
    "element-permitted-content": "error",
    "element-permitted-occurrences": "error",
    "element-permitted-order": "error",
    "element-permitted-parent": "error",
    "element-required-ancestor": "error",
    "element-required-attributes": "error",
    "element-required-content": "error",
    "input-attributes": "error",
    "no-multiple-main": "error",
    "script-element": "error",
    "void-content": "error",

    deprecated: "error",
    "deprecated-rule": "error",
    "no-conditional-comment": "error",
    "no-deprecated-attr": "error",

    "area-alt": "error",
    "aria-hidden-body": "error",
    "aria-label-misuse": "error",
    "empty-heading": "off", // TODO
    "empty-title": "error",
    "hidden-focusable": "error",
    "input-missing-label": "off", // TODO
    "meta-refresh": "error",
    "multiple-labeled-controls": "error",
    "no-abstract-role": "error",
    "no-autoplay": "off",
    "no-implicit-button-type": "off", // TODO
    "no-redundant-aria-label": "error",
    "no-redundant-role": "error",
    "prefer-native-element": "error",
    "svg-focusable": "off", // Just for IE
    "tel-non-breaking": "off", // TODO
    "text-content": "error",
    "unique-landmark": "off", // TODO
    "wcag/h30": "error",
    "wcag/h32": "off", // TODO: Form must have submit button
    "wcag/h36": "error",
    "wcag/h37": "off", // TODO: img must have alt
    "wcag/h63": "off", // TODO: th must have scope
    "wcag/h67": "error",
    "wcag/h71": "error",

    "require-csp-nonce": "off",
    "require-sri": "off",

    "long-title": "off",

    "attr-case": ["error", { style: "camelcase" }],
    "attr-pattern": "off",
    "attr-quotes": "error",
    "attribute-boolean-style": "error",
    "attribute-empty-style": ["error", { style: "omit" }],
    "class-pattern": ["off", { pattern: "kebabcase" }], // TODO
    "doctype-style": ["error", { style: "lowercase" }],
    "element-case": ["error", { style: "camelcase" }],
    "id-pattern": ["off", { pattern: "kebabcase" }], // TODO
    "name-pattern": ["off", { pattern: "kebabcase" }], // TODO
    "no-implicit-close": "error",
    "no-implicit-input-type": "off", // TODO
    "no-inline-style": "error",
    "no-self-closing": ["off", { ignoreXML: true, ignoreForeign: true }], // TODO
    "no-trailing-whitespace": "error",
    "prefer-button": "off", // TODO
    "prefer-tbody": "error",
    "void-style": ["error", { style: "selfclosing" }],

    "mdn-graph/no-style-tag": "error",
  },
};

export const ignore = [
  {
    files: ["Mozilla/Firefox/Releases/1.5/Using_Firefox_1.5_caching"],
    rules: { "element-required-attributes": "off" },
  },
  {
    files: [
      "Mozilla/Add-ons/WebExtensions/Content_Security_Policy",
      "Mozilla/Firefox/Releases/1.5/Using_Firefox_1.5_caching",
      "Web/HTTP/Guides/CSP",
      "Web/HTTP/Reference/Headers/Content-Security-Policy/**",
      "Web/HTTP/Reference/Headers/X-XSS-Protection",
      "Web/Security/Attacks/XS-Leaks",
    ],
    rules: {
      "no-inline-event-handlers": "off",
      "no-inline-script": "off",
      "no-inline-style": "off",
      "mdn-graph/no-style-tag": "off",
    },
  },
  {
    files: ["Web/API/CSPViolationReportBody/**"],
    rules: { "no-inline-script": "off" },
  },
  {
    files: ["Web/API/HTMLScriptElement/**"],
    rules: { "empty-script": "off" },
  },
  {
    files: [
      "Web/API/HTMLElement/style",
      "Web/API/MathMLElement/style",
      "Web/API/SVGElement/style",
      "Web/API/HTMLElement/attributeStyleMap",
      "Web/API/MathMLElement/attributeStyleMap",
      "Web/API/SVGElement/attributeStyleMap",
      "Web/HTML/Reference/Global_attributes/style",
      "Web/SVG/Reference/Attribute/style",
    ],
    rules: { "no-inline-style": "off" },
  },
  {
    files: ["Web/CSS/CSS_syntax/Error_handling"],
    rules: {
      "no-inline-style": "off",
      "mdn-graph/no-style-tag": "off",
    },
  },
  {
    files: ["Web/HTML/Guides/Cheatsheet"],
    rules: { "no-inline-style": "off" },
  },
  {
    files: ["Web/HTML/Reference/Attributes"],
    rules: { "no-inline-event-handlers": "off" },
  },
  {
    files: [
      "Web/HTML/How_to/Add_JavaScript_to_your_web_page",
      "Web/HTML/Reference/Elements/script/**",
      "Web/HTML/Reference/Global_attributes/nonce",
    ],
    rules: { "no-inline-script": "off" },
  },
  {
    files: ["Web/HTML/Reference/Elements/style"],
    rules: { "no-inline-style": "off", "mdn-graph/no-style-tag": "off" },
  },
  {
    files: ["Web/JavaScript/Guide/Modules"],
    rules: { "no-inline-script": "off" },
  },
  {
    files: ["Web/URI/Reference/Schemes/javascript"],
    rules: { "no-inline-script": "off" },
  },
  {
    files: [
      "Web/HTML/Reference/Elements/acronym",
      "Web/HTML/Reference/Elements/big",
      "Web/HTML/Reference/Elements/center",
      "Web/HTML/Reference/Elements/marquee",
      "Web/HTML/Reference/Elements/noembed",
      "Web/HTML/Reference/Elements/strike",
      "Web/HTML/Reference/Elements/tt",
      "Web/JavaScript/Reference/Global_Objects/String/big",
      "Web/JavaScript/Reference/Global_Objects/String/blink",
      "Web/JavaScript/Reference/Global_Objects/String/fixed",
      "Web/JavaScript/Reference/Global_Objects/String/fontcolor",
      "Web/JavaScript/Reference/Global_Objects/String/fontsize",
      "Web/JavaScript/Reference/Global_Objects/String/strike",
    ],
    rules: { deprecated: "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Global_Objects/String/anchor"],
    rules: { "no-deprecated-attr": "off" },
  },
  {
    files: ["Web/Accessibility/ARIA/**", "Web/API/Element/aria*"],
    rules: { "prefer-native-element": "off", "no-redundant-role": "off" },
  },
  {
    files: [
      "Learn_web_development/Extensions/Forms/How_to_build_custom_form_controls/*",
    ],
    rules: { "prefer-native-element": "off" },
  },
  // TODO: https://gitlab.com/html-validate/html-validate/-/issues/330
  {
    files: [
      "Web/API/HTMLLinkElement/imageSrcset",
      "Web/API/HTMLLinkElement/imageSizes",
    ],
    rules: { "element-required-attributes": "off" },
  },
  {
    files: [
      "Web/HTML/Reference/Elements/meta",
      "Web/HTML/Reference/Elements/meta/http-equiv",
    ],
    rules: { "meta-refresh": "off" },
  },
  {
    files: [
      "Learn_web_development/Core/Structuring_content/HTML_table_basics",
      "Learn_web_development/Core/Structuring_content/Table_accessibility",
      "Web/HTML/Reference/Elements/table",
      "Web/HTML/Reference/Elements/tbody",
      "Web/HTML/Reference/Elements/td",
      "Web/HTML/Reference/Elements/th",
      "Web/HTML/Reference/Elements/tr",
    ],
    rules: { "prefer-tbody": "off" },
  },
];
