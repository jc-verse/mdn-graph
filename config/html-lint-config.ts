export default {
  ignore: [
    {
      // TODO: remove ad-hoc play editors
      files: [
        "Learn_web_development/Core/Scripting/Arrays",
        "Learn_web_development/Core/Scripting/Conditionals",
        "Learn_web_development/Core/Scripting/Loops",
        "Learn_web_development/Core/Scripting/Useful_string_methods",
        "Learn_web_development/Core/Structuring_content/Advanced_text_features",
        "Learn_web_development/Core/Structuring_content/Basic_HTML_syntax",
        "Learn_web_development/Core/Structuring_content/Emphasis_and_importance",
        "Learn_web_development/Core/Structuring_content/General_embedding_technologies",
        "Learn_web_development/Core/Structuring_content/Headings_and_paragraphs",
        "Learn_web_development/Core/Structuring_content/HTML_images",
        "Learn_web_development/Core/Structuring_content/Including_vector_graphics_in_HTML",
        "Learn_web_development/Core/Structuring_content/Lists",
        "Learn_web_development/Core/Text_styling/Fundamentals",
        "Learn_web_development/Core/Text_styling/Styling_links",
        "Learn_web_development/Core/Text_styling/Styling_lists",
      ],
      rules: { "no-style-attr": "off" },
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
