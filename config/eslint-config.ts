import jcRules from "eslint-config-jc";
import pluginRegexp from "eslint-plugin-regexp";

export default [
  ...jcRules(),
  {
    rules: {
      "accessor-pairs": "off",
      "block-scoped-var": "off",
      curly: "off",
      "dot-notation": "off", // Need a heuristic similar to noPropertyAccessFromIndexSignature
      "func-names": "off",
      "new-cap": [
        "error",
        {
          capIsNew: false,
          newIsCap: true,
          properties: true,
          newIsCapExceptions: ["webkitSpeechRecognition", "xArray", "xError"],
        },
      ],
      "no-constant-condition": ["error", { checkLoops: "allExceptWhileTrue" }],
      "no-empty": "off",
      "no-implicit-coercion": ["error", { allow: ["!!", "*"] }],
      "no-import-assign": "off",
      "no-lone-blocks": "off",
      "no-multi-assign": "off",
      "no-multi-str": "off",
      "no-promise-executor-return": "off",
      "no-undef": "off",
      "no-unused-private-class-members": "off",
      "no-use-before-define": ["error", "nofunc"],
      "no-useless-assignment": "off",
      "require-atomic-updates": "off",
      "require-await": "off",
      strict: "off",
      "vars-on-top": "off",
      yoda: "off",
      "@typescript-eslint/adjacent-overload-signatures": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/init-declarations": "off",
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-useless-constructor": "off",
      "import/export": "off",
      "import/newline-after-import": ["error", { considerComments: false }],
      "import/no-absolute-path": "off",
      "import/no-extraneous-dependencies": "off",
      "regexp/no-control-character": "off",
      "regexp/no-super-linear-move": "off",
      "regexp/unicode-property": "off",

      // TODO
      "capitalized-comments": "off", // 6039
      "prefer-const": "off", // 1888
      "@typescript-eslint/no-unused-expressions": "off", // 1569
      "prefer-destructuring": "off", // 769
      "no-restricted-globals": "off", // 642
      "max-len": "off", // 576
      "regexp/require-unicode-regexp": "off", // 404
      camelcase: "off", // 322
      "no-restricted-syntax": "off", // 321
      "no-alert": "off", // 185
      "multiline-comment-style": "off", // 173
      "@typescript-eslint/no-use-before-define": "off", // 145
      "regexp/prefer-named-capture-group": "off", // 122
      "@typescript-eslint/no-redeclare": "off", // 105
      "consistent-return": "off", // 85
      "no-return-assign": "off", // TODO
    },
  },
  {
    files: [
      "Glossary/Falsy/*",
      "Glossary/Truthy/*",
      "Web/JavaScript/Reference/Global_Objects/Boolean/*",
    ],
    rules: { "no-constant-condition": "off" },
  },
  {
    files: [
      "Glossary/Falsy/*",
      "Glossary/Truthy/*",
      "Web/JavaScript/Guide/Equality_comparisons_and_sameness/*",
      "Web/JavaScript/Guide/Expressions_and_operators/*",
      "Web/JavaScript/Guide/Language_overview/*",
      "Web/JavaScript/Reference/Global_Objects/BigInt/*",
      "Web/JavaScript/Reference/Global_Objects/Boolean/*",
      "Web/JavaScript/Reference/Operators/Equality/*",
      "Web/JavaScript/Reference/Operators/Inequality/*",
      "Web/JavaScript/Reference/Operators/Logical_AND/*",
      "Web/JavaScript/Reference/Operators/Logical_OR/*",
      "Web/JavaScript/Reference/Operators/null/*",
      "Web/JavaScript/Reference/Operators/Nullish_coalescing/*",
      "Web/JavaScript/Reference/Operators/Strict_equality/*",
      "Web/JavaScript/Reference/Operators/Strict_inequality/*",
      "Web/JavaScript/Reference/Operators/void/*",
    ],
    rules: { "no-constant-binary-expression": "off" },
  },
  {
    files: [
      "Glossary/Hoisting/*",
      "Glossary/Scope/*",
      "Learn_web_development/Core/Scripting/Variables/*",
      "Web/JavaScript/Guide/Closures/*",
      "Web/JavaScript/Guide/Control_flow_and_error_handling/*",
      "Web/JavaScript/Guide/Grammar_and_types/*",
      "Web/JavaScript/Reference/Deprecated_and_obsolete_features/*",
      "Web/JavaScript/Reference/Errors/Delete_in_strict_mode/*",
      "Web/JavaScript/Reference/Operators/delete/*",
      "Web/JavaScript/Reference/Operators/function/*",
      "Web/JavaScript/Reference/Operators/this/*",
      "Web/JavaScript/Reference/Statements/*",
      "Web/JavaScript/Reference/Statements/Expression_statement/*",
      "Web/JavaScript/Reference/Statements/block/*",
      "Web/JavaScript/Reference/Statements/function/*",
      "Web/JavaScript/Reference/Statements/let/*",
      "Web/JavaScript/Reference/Statements/var/*",
      "Web/JavaScript/Reference/Strict_mode/*",
      "Web/JavaScript/Reference/Statements/for/*",
    ],
    rules: { "no-var": "off" },
  },
  {
    files: [
      "Mozilla/Add-ons/WebExtensions/Content_scripts/*",
      "Mozilla/Add-ons/WebExtensions/Content_Security_Policy/*",
      "Web/API/TrustedTypePolicyFactory/emptyScript/*",
      "Web/HTTP/Guides/CSP/*",
      "Web/JavaScript/Reference/Global_Objects/eval/*",
    ],
    rules: { "no-eval": "off" },
  },
  {
    files: [
      "Learn_web_development/Core/Scripting/Functions/*",
      "Web/JavaScript/Guide/Closures/*",
      "Web/JavaScript/Guide/Functions/*",
      "Web/JavaScript/Guide/Using_promises/*",
      "Web/JavaScript/Reference/Errors/Unnamed_function_statement/*",
      "Web/JavaScript/Reference/Functions/*",
      "Web/JavaScript/Reference/Functions/arguments/callee/*",
      "Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/apply/*",
      "Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/construct/*",
      "Web/JavaScript/Reference/Operators/function/*",
    ],
    rules: { "prefer-arrow-callback": "off" },
  },
  {
    files: [
      "Learn_web_development/Core/Scripting/Object_basics/*",
      "Learn_web_development/Core/Scripting/Test_your_skills/Object_basics/*",
      "Web/JavaScript/Guide/Working_with_objects/*",
      "Web/JavaScript/Reference/Functions/Method_definitions/*",
      "Web/JavaScript/Reference/Global_Objects/Function/name/*",
      "Web/JavaScript/Reference/Operators/Object_initializer/*",
    ],
    rules: { "object-shorthand": "off" },
  },
  {
    files: [
      "Mozilla/Add-ons/WebExtensions/Content_Security_Policy/*",
      "Web/API/Window/setTimeout/*",
      "Web/HTTP/Guides/CSP/*",
    ],
    rules: { "no-implied-eval": "off" },
  },
  {
    files: [
      "Mozilla/Add-ons/WebExtensions/Content_Security_Policy/*",
      "Web/HTTP/Guides/CSP/*",
      "Web/JavaScript/Reference/Functions/*",
      "Web/JavaScript/Reference/Global_Objects/Function/*",
      "Web/JavaScript/Reference/Global_Objects/Function/Function/*",
      "Web/JavaScript/Reference/Global_Objects/Function/name/*",
      "Web/JavaScript/Reference/Global_Objects/Function/toString/*",
    ],
    rules: { "no-new-func": "off" },
  },
  {
    files: [
      "Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts/*",
      "Web/JavaScript/Reference/Global_Objects/Object/*",
      "Web/JavaScript/Reference/Global_Objects/Object/Object/*",
    ],
    rules: { "no-object-constructor": "off" },
  },
  {
    files: [
      "Mozilla/Firefox/Releases/3/**",
      "Mozilla/Firefox/Releases/4/**",
      "Mozilla/Firefox/Releases/5/**",
      "Mozilla/Firefox/Releases/11/**",
      "Mozilla/Firefox/Releases/36/**",
      "Mozilla/Firefox/Releases/1.5/**",
      "Mozilla/Firefox/Releases/3.5/**",
    ],
    rules: {
      "no-var": "off",
      "prefer-arrow-callback": "off",
      "prefer-template": "off",
    },
  },
  {
    files: [
      "Web/API/**/length/*",
      "Web/JavaScript/Guide/Closures/*",
      "Web/JavaScript/Guide/Loops_and_iteration/*",
    ],
    rules: { "@typescript-eslint/prefer-for-of": "off" },
  },
  {
    files: ["Web/API/Document/domain/*"],
    rules: { "no-self-assign": "off" },
  },
  {
    files: [
      "Web/API/Element/append/*",
      "Web/API/Element/prepend/*",
      "Web/API/Element/remove/*",
      "Web/API/Element/replaceWith/*",
      "Web/JavaScript/Reference/Global_Objects/Array/Symbol.unscopables/*",
      "Web/JavaScript/Reference/Global_Objects/Symbol/unscopables/*",
      "Web/JavaScript/Reference/Statements/with/*",
      "Web/JavaScript/Reference/Strict_mode/*",
    ],
    rules: { "no-with": "off" },
  },
  {
    files: ["Web/JavaScript/Guide/Control_flow_and_error_handling/*"],
    rules: {
      "no-throw-literal": "off",
      "no-unreachable": "off",
      "no-unsafe-finally": "off",
    },
  },
  {
    files: [
      "Web/JavaScript/Guide/Control_flow_and_error_handling/*",
      "Web/JavaScript/Guide/Equality_comparisons_and_sameness/*",
      "Web/JavaScript/Guide/Expressions_and_operators/*",
      "Web/JavaScript/Reference/Errors/Cant_assign_to_property/*",
      "Web/JavaScript/Reference/Global_Objects/Boolean/*",
      "Web/JavaScript/Reference/Global_Objects/Boolean/Boolean/*",
      "Web/JavaScript/Reference/Global_Objects/Boolean/toString/*",
      "Web/JavaScript/Reference/Global_Objects/Boolean/valueOf/*",
      "Web/JavaScript/Reference/Global_Objects/eval/*",
      "Web/JavaScript/Reference/Global_Objects/JSON/stringify/*",
      "Web/JavaScript/Reference/Global_Objects/Number/Number/*",
      "Web/JavaScript/Reference/Global_Objects/Number/toString/*",
      "Web/JavaScript/Reference/Global_Objects/Number/valueOf/*",
      "Web/JavaScript/Reference/Global_Objects/Object/Object/*",
      "Web/JavaScript/Reference/Global_Objects/Object/toString/*",
      "Web/JavaScript/Reference/Global_Objects/String/*",
      "Web/JavaScript/Reference/Global_Objects/String/String/*",
      "Web/JavaScript/Reference/Global_Objects/String/toString/*",
      "Web/JavaScript/Reference/Global_Objects/String/valueOf/*",
      "Web/JavaScript/Reference/Iteration_protocols/*",
      "Web/JavaScript/Reference/Operators/Equality/*",
      "Web/JavaScript/Reference/Operators/in/*",
      "Web/JavaScript/Reference/Operators/Inequality/*",
      "Web/JavaScript/Reference/Operators/instanceof/*",
      "Web/JavaScript/Reference/Operators/Logical_NOT/*",
      "Web/JavaScript/Reference/Operators/Strict_equality/*",
      "Web/JavaScript/Reference/Operators/typeof/*",
      "Web/JavaScript/Reference/Statements/if...else/*",
    ],
    rules: { "no-new-wrappers": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Data_structures/*",
      "Web/JavaScript/Guide/Numbers_and_strings/*",
      "Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive/*",
      "Web/JavaScript/Reference/Operators/Addition/*",
      "Web/JavaScript/Reference/Template_literals/*",
    ],
    rules: { "prefer-template": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Equality_comparisons_and_sameness/*",
      "Web/JavaScript/Reference/Global_Objects/Array/indexOf/*",
      "Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf/*",
      "Web/JavaScript/Reference/Global_Objects/NaN/*",
      "Web/JavaScript/Reference/Global_Objects/Number/NaN/*",
      "Web/JavaScript/Reference/Operators/Greater_than/*",
      "Web/JavaScript/Reference/Operators/Greater_than_or_equal/*",
      "Web/JavaScript/Reference/Operators/Less_than/*",
      "Web/JavaScript/Reference/Operators/Less_than_or_equal/*",
    ],
    rules: { "use-isnan": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Equality_comparisons_and_sameness/*",
      "Web/JavaScript/Reference/Global_Objects/BigInt/*",
      "Web/JavaScript/Reference/Global_Objects/NaN/*",
      "Web/JavaScript/Reference/Global_Objects/Symbol/*",
      "Web/JavaScript/Reference/Global_Objects/Symbol/for/*",
      "Web/JavaScript/Reference/Global_Objects/Symbol/Symbol/*",
      "Web/JavaScript/Reference/Operators/Equality/*",
      "Web/JavaScript/Reference/Operators/Greater_than/*",
      "Web/JavaScript/Reference/Operators/Greater_than_or_equal/*",
      "Web/JavaScript/Reference/Operators/Inequality/*",
      "Web/JavaScript/Reference/Operators/Less_than/*",
      "Web/JavaScript/Reference/Operators/Less_than_or_equal/*",
      "Web/JavaScript/Reference/Operators/null/*",
      "Web/JavaScript/Reference/Operators/Strict_equality/*",
      "Web/JavaScript/Reference/Operators/Strict_inequality/*",
    ],
    rules: { "no-self-compare": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Expressions_and_operators/*",
      "Web/JavaScript/Reference/Operators/Addition/*",
    ],
    rules: { "no-useless-concat": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Functions/*",
      "Web/JavaScript/Guide/Language_overview/*",
      "Web/JavaScript/Reference/Errors/Unnamed_function_statement/*",
      "Web/JavaScript/Reference/Functions/*",
      "Web/JavaScript/Reference/Global_Objects/Function/name/*",
      "Web/JavaScript/Reference/Operators/async_function/*",
      "Web/JavaScript/Reference/Operators/async_function*/*",
      "Web/JavaScript/Reference/Operators/function/*",
      "Web/JavaScript/Reference/Operators/function*/*",
    ],
    rules: { "func-style": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Functions/*",
      "Web/JavaScript/Reference/Functions/*",
      "Web/JavaScript/Reference/Global_Objects/Function/name/*",
    ],
    rules: { "func-name-matching": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Functions/*",
      "Web/JavaScript/Reference/Errors/Arguments_not_allowed/*",
      "Web/JavaScript/Reference/Functions/arguments/**",
      "Web/JavaScript/Reference/Functions/Arrow_functions/*",
      "Web/JavaScript/Reference/Functions/Default_parameters/*",
      "Web/JavaScript/Reference/Functions/rest_parameters/*",
      "Web/JavaScript/Reference/Global_Objects/Proxy/**",
      "Web/JavaScript/Reference/Strict_mode/*",
    ],
    rules: { "prefer-rest-params": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Grammar_and_types/*",
      "Web/JavaScript/Guide/Language_overview/*",
    ],
    rules: {
      "no-useless-concat": "off",
      "operator-assignment": "off",
      "prefer-numeric-literals": "off",
      "prefer-template": "off",
    },
  },
  {
    files: [
      "Web/JavaScript/Guide/Grammar_and_types/*",
      "Web/JavaScript/Reference/Global_Objects/Object/valueOf/*",
      "Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive/*",
      "Web/JavaScript/Reference/Operators/Addition/*",
      "Web/JavaScript/Reference/Operators/Unary_plus/*",
    ],
    rules: { "no-implicit-coercion": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Grammar_and_types/*",
      "Web/JavaScript/Guide/Indexed_collections/*",
      "Web/JavaScript/Reference/Global_Objects/Array/**",
      "Web/JavaScript/Reference/Trailing_commas/*",
    ],
    rules: { "no-sparse-arrays": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Indexed_collections/*",
      "Web/JavaScript/Reference/Global_Objects/Array/*",
      "Web/JavaScript/Reference/Global_Objects/Array/Array/*",
      "Web/JavaScript/Reference/Global_Objects/Array/isArray/*",
      "Web/JavaScript/Reference/Global_Objects/Array/of/*",
    ],
    rules: { "no-array-constructor": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Inheritance_and_the_prototype_chain/*",
      "Web/JavaScript/Reference/Global_Objects/Object/freeze/*",
      "Web/JavaScript/Reference/Global_Objects/Object/preventExtensions/*",
      "Web/JavaScript/Reference/Global_Objects/Object/proto/*",
      "Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/getPrototypeOf/*",
    ],
    rules: { "no-proto": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Inheritance_and_the_prototype_chain/*",
      "Web/JavaScript/Reference/Global_Objects/Object/*",
      "Web/JavaScript/Reference/Global_Objects/Object/defineProperty/*",
      "Web/JavaScript/Reference/Global_Objects/Object/hasOwn/*",
      "Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty/*",
      "Web/JavaScript/Reference/Global_Objects/Object/isPrototypeOf/*",
      "Web/JavaScript/Reference/Global_Objects/Object/propertyIsEnumerable/*",
      "Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/getPrototypeOf/*",
    ],
    rules: { "no-prototype-builtins": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Loops_and_iteration/*",
      "Web/JavaScript/Reference/Statements/break/*",
      "Web/JavaScript/Reference/Statements/break/*",
      "Web/JavaScript/Reference/Statements/label/*",
      "Web/JavaScript/Reference/Statements/return/*",
      "Web/JavaScript/Reference/Statements/throw/*",
    ],
    rules: { "no-unreachable": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Loops_and_iteration/*",
      "Web/JavaScript/Reference/Errors/Label_not_found/*",
      "Web/JavaScript/Reference/Statements/break/*",
      "Web/JavaScript/Reference/Statements/continue/*",
      "Web/JavaScript/Reference/Statements/label/*",
    ],
    rules: { "no-unused-labels": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Using_classes/*",
      "Web/JavaScript/Reference/Classes/extends/*",
      "Web/JavaScript/Reference/Classes/Private_elements/*",
      "Web/JavaScript/Reference/Errors/Invalid_derived_return/*",
      "Web/JavaScript/Reference/Errors/Private_double_initialization/*",
      "Web/JavaScript/Reference/Operators/this/*",
    ],
    rules: { "no-constructor-return": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Errors/Bad_optional_template/*",
      "Web/JavaScript/Reference/Errors/Bad_new_optional/*",
      "Web/JavaScript/Reference/Operators/Optional_chaining/*",
    ],
    rules: { "no-unsafe-optional-chaining": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Errors/Bad_regexp_flag/*"],
    rules: {
      "regexp/no-non-standard-flag": "off",
      "regexp/no-useless-flag": "off",
      "regexp/sort-flags": "off",
    },
  },
  {
    files: [
      "Web/JavaScript/Reference/Errors/Bad_strict_arguments_eval/*",
      "Web/JavaScript/Reference/Global_Objects/undefined/*",
      "Web/JavaScript/Reference/Strict_mode/*",
    ],
    rules: { "no-shadow-restricted-names": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Errors/BigInt_not_serializable/*",
      "Web/Security/Attacks/Prototype_pollution/*",
    ],
    rules: { "no-extend-native": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Errors/Duplicate_proto/*",
      "Web/JavaScript/Reference/Operators/Object_initializer/*",
    ],
    rules: { "no-dupe-keys": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Errors/Invalid_const_assignment/*"],
    rules: { "no-const-assign": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Errors/Not_a_constructor/*"],
    rules: {
      "new-cap": "off",
      "no-obj-calls": "off",
      "no-new-native-nonconstructor": "off",
    },
  },
  {
    files: ["Web/JavaScript/Reference/Errors/Regex_*/*"],
    rules: { "regexp/no-invalid-regexp": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Errors/Regex_duplicate_capture_group_name/*",
    ],
    rules: { "regexp/strict": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Errors/Requires_global_RegExp/*",
      "Web/JavaScript/Reference/Global_Objects/String/replaceAll/*",
    ],
    rules: { "regexp/no-missing-g-flag": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Errors/Stmt_after_return/*"],
    rules: { "no-unreachable": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Classes/extends/*",
      "Web/JavaScript/Reference/Errors/Bad_super_call/*",
      "Web/JavaScript/Reference/Errors/Super_called_twice/*",
      "Web/JavaScript/Reference/Errors/Super_not_called/*",
    ],
    rules: { "constructor-super": "off", "no-this-before-super": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Functions/Arrow_functions/*"],
    rules: { "arrow-body-style": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Global_Objects/Function/apply/*",
      "Web/JavaScript/Reference/Operators/Spread_syntax/*",
    ],
    rules: { "prefer-spread": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Global_Objects/Math/pow/*"],
    rules: { "prefer-exponentiation-operator": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Global_Objects/RegExp/RegExp/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/toString/*",
    ],
    rules: { "prefer-regex-literals": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Global_Objects/RegExp/input/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/lastMatch/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/lastParen/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/leftContext/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/n/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/rightContext/*",
    ],
    rules: {
      "regexp/no-legacy-features": "off",
      "regexp/no-useless-flag": "off",
    },
  },
  {
    files: ["Web/JavaScript/Reference/Global_Objects/RegExp/lastIndex/*"],
    rules: { "regexp/no-useless-flag": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Functions/arguments/callee/*"],
    rules: { "no-caller": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Global_Objects/Object/assign/*"],
    rules: { "prefer-object-spread": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty/*"],
    rules: { "prefer-object-has-own": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/construct/*",
      "Web/JavaScript/Reference/Global_Objects/Reflect/construct/*",
    ],
    rules: { "new-cap": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Global_Objects/RegExp/Symbol.match/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/Symbol.matchAll/*",
      "Web/JavaScript/Reference/Global_Objects/RegExp/Symbol.replace/*",
      "Web/JavaScript/Reference/Global_Objects/String/split/*",
    ],
    rules: { "regexp/no-empty-group": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Global_Objects/Symbol/**",
      "Web/JavaScript/Reference/Operators/typeof/*",
    ],
    rules: {
      "symbol-description": "off",
      "no-new-native-nonconstructor": "off",
    },
  },
  {
    files: ["Web/JavaScript/Reference/Global_Objects/parseInt/*"],
    rules: { "prefer-numeric-literals": "off", radix: "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Global_Objects/undefined/*"],
    rules: { "no-void": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Operators/Assignment/*"],
    rules: { "operator-assignment": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Operators/Comma_operator/*"],
    rules: { "no-sequences": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Operators/delete/*",
      "Web/JavaScript/Reference/Statements/var/*",
    ],
    rules: { "no-delete-var": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Operators/Destructuring/*",
      "Web/JavaScript/Reference/Errors/is_not_iterable/*",
    ],
    rules: { "no-empty-pattern": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Equality_comparisons_and_sameness/*",
      "Web/JavaScript/Guide/Language_overview/*",
      "Web/JavaScript/Reference/Global_Objects/BigInt/*",
      "Web/JavaScript/Reference/Global_Objects/Boolean/*",
      "Web/JavaScript/Reference/Operators/Equality/*",
      "Web/JavaScript/Reference/Operators/Inequality/*",
      "Web/JavaScript/Reference/Operators/null/*",
    ],
    rules: { eqeqeq: "off", "no-eq-null": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Operators/void/*"],
    rules: { "no-void": "off" },
  },
  {
    files: [
      "Web/JavaScript/Guide/Regular_expressions/**",
      "Web/JavaScript/Reference/Regular_expressions/**",
    ],
    rules: Object.fromEntries(
      Object.keys(pluginRegexp.rules).map((x) => [`regexp/${x}`, "off"]),
    ),
  },
  {
    files: ["Web/JavaScript/Reference/Statements/const/*"],
    rules: { "no-const-assign": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Statements/debugger/*"],
    rules: { "no-debugger": "off" },
  },
  {
    files: [
      "Web/JavaScript/Reference/Statements/export/*",
      "Web/JavaScript/Reference/Statements/import/*",
    ],
    rules: { "import/no-named-default": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Statements/switch/*"],
    rules: {
      "default-case-last": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
    },
  },
  {
    files: ["Web/JavaScript/Reference/Statements/try...catch/*"],
    rules: { "no-ex-assign": "off", "no-unsafe-finally": "off" },
  },
  {
    files: ["Web/JavaScript/Reference/Strict_mode/*"],
    rules: {
      "no-delete-var": "off",
      "no-dupe-args": "off",
      "no-dupe-keys": "off",
      "no-func-assign": "off",
      "func-name-matching": "off",
      "no-useless-call": "off",
      "no-caller": "off",
    },
  },
  {
    files: ["Web/URI/Reference/Schemes/javascript/*"],
    rules: { "no-script-url": "off" },
  },
];
