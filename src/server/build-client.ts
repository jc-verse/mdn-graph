await Bun.build({
  entrypoints: [import.meta.resolve("../client/index.ts")],
  outdir: import.meta.resolve("../../build"),
  minify: true,
});
