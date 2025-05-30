import createContentGraph from "./src/server/create-graph.ts";
import processWarnings from "./src/server/process-warnings.ts";
import checkCode from "./src/server/lint.ts";

const bundleOnly = Bun.argv.includes("--bundle-only");
const buildGraph = Bun.argv.includes("graph");
const buildLint = Bun.argv.includes("lint");
const buildWarnings = Bun.argv.includes("warnings");
const buildWarningsFast = Bun.argv.includes("warnings-fast");
const buildExternalLinks = Bun.argv.includes("external-links");

if (!bundleOnly) {
  if (buildGraph) {
    await createContentGraph();
  }
  if (buildLint) {
    await checkCode();
  }
  if (buildWarnings) {
    await processWarnings();
  } else if (buildWarningsFast) {
    await processWarnings(true);
  }
}

await Bun.build({
  entrypoints: [
    buildGraph && "./src/client/index.ts",
    (buildWarnings || buildWarningsFast) && "./src/client/warnings.ts",
    buildExternalLinks && "./src/client/external-links.ts",
  ].filter(Boolean) as string[],
  outdir: "./docs",
  splitting: true,
});

// TODO: not sure why I need this
process.exit(0);
