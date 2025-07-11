export default {
  ignore: [
    {
      files: ["Mozilla/Firefox/Releases/1.5/Using_Firefox_1.5_caching"],
      rules: { "html-has-lang": "off" },
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
        "no-style-attr": "off",
        "no-style-elem": "off",
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
        "Web/API/SVGElement/style",
        "Web/HTML/Reference/Global_attributes/style",
        "Web/SVG/Reference/Attribute/style",
      ],
      rules: { "no-style-attr": "off" },
    },
    {
      files: ["Web/CSS/CSS_syntax/Error_handling"],
      rules: {
        "no-style-attr": "off",
        "no-style-elem": "off",
      },
    },
    {
      files: ["Web/HTML/Guides/Cheatsheet"],
      rules: { "no-style-attr": "off" },
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
      rules: { "no-style-attr": "off", "no-style-elem": "off" },
    },
    {
      files: ["Web/JavaScript/Guide/Modules"],
      rules: { "no-inline-script": "off" },
    },
    {
      files: ["Web/URI/Reference/Schemes/javascript"],
      rules: { "no-inline-script": "off" },
    },
  ],
};
