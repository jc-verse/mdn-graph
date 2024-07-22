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
yarn build --nohtml
```

Then, build the graph:

```sh
cd ../mdn-graph
bun src/server/create-graph.ts
```

This creates the JSON files in `data/`. You need to redo the building steps every time the content changes.

Finally, build the website script:

```sh
bun build src/client/index.ts --outdir docs --minify
```

Now you can open `docs/index.html` in your browser.
