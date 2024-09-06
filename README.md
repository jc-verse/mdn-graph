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

We recommend adding a `build/last-commit` file, containing the HEAD commit hash of the repository. You can create one with `git rev-parse HEAD > build/last-commit`. Then, you can build again with

```sh
yarn build $(git diff --name-only $(cat build/last-commit) HEAD) --nohtml && git rev-parse HEAD > build/last-commit
```

Which only builds the changed files since the last commit.

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

Generate warning reports any time with

```sh
bun src/server/process-warnings.ts
```

Deploy to the website:

```sh
bun build src/client/warnings.ts --outdir docs --minify
```

## Attribution

- [anvaka/ngragph](https://github.com/anvaka/ngraph) and its lots of subpackages for actually rendering the graph
