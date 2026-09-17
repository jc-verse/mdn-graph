import createContentGraph from "./src/server/create-graph.ts";
import processWarnings from "./src/server/process-warnings.ts";
import checkCode from "./src/server/lint.ts";
import buildWarningDocs from "./src/server/build-warning-docs.ts";
import buildGraphData from "./src/server/build-graph-data.ts";

const dataOnly = Bun.argv.includes("--data-only");
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

if (!dataOnly) {
  if (buildGraph || buildExternalLinks) await buildGraphData();
  await buildWarningDocs();
  const result = await Bun.build({
    entrypoints: [
      buildGraph && "./src/client/index.ts",
      (buildWarnings || buildWarningsFast) && "./src/client/warnings.ts",
      buildExternalLinks && "./src/client/external-links.ts",
    ].filter(Boolean) as string[],
    outdir: "./docs",
    splitting: true,
  });
  if (!result.success) {
    throw new AggregateError(result.logs, "Site build failed");
  }
}

// TODO: not sure why I need this
process.exit(0);
