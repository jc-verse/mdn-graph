# mdn-graph

Visualize the MDN Web Docs link structure! [Live website](https://jc-verse.github.io/mdn-graph/)

## Building

First, install dependencies.

```sh
bun install
```

For the data source, you need to have the [mdn/content](https://github.com/mdn/content) repository cloned in the same directory as this repository. Then, build the content:

```sh
cd content
yarn build
```

Then, build the graph:

```sh
cd ../mdn-graph
bun build.ts graph warnings external-links
```

Now you can open `docs/index.html` in your browser.

## Aggregating reports

We want to filter out some known broken links. Go to https://openwebdocs.github.io/web-docs-backlog/all/ and run:

```js
console.log(
  [...document.querySelectorAll(".features a")]
    .map((x) => x.innerText)
    .join("\n"),
);
```

Copy the output into `config/missing-features.txt`.

## Attribution

- [anvaka/ngragph](https://github.com/anvaka/ngraph) and its lots of subpackages for actually rendering the graph
