export default {
  ignore: [
    {
      files: ["Web/CSS/CSS_syntax/Error_handling"],
      rules: {
        "no-style-attr": "off",
        "no-style-elem": "off",
      },
    },
    {
      files: [
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
      files: ["Web/HTML/Guides/Cheatsheet"],
      rules: { "no-style-attr": "off" },
    },
    {
      files: ["Web/HTML/Reference/Attributes"],
      rules: { "no-inline-event-handlers": "off" },
    },
    {
      files: [
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
      files: ["Web/HTML/Reference/Global_attributes/style"],
      rules: { "no-style-attr": "off" },
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
