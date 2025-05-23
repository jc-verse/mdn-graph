const expectedErrors = (
  await Bun.file(
    Bun.fileURLToPath(import.meta.resolve(`./expected-lint-errors.txt`)),
  ).text()
).matchAll(
  /(?<file>\/en-US\/docs\/[^\n]+)\n(?<reports>(?:\[[^\]]+\] .*\n)+)~~~\n(?<code>(?:.|\n)+?)~~~\n/g,
);

const newExpectedErrors = [...expectedErrors].sort(
  (a, b) =>
    a.groups.file.localeCompare(b.groups.file) ||
    a.groups.reports.localeCompare(b.groups.reports),
);
await Bun.write(
  Bun.fileURLToPath(import.meta.resolve(`./expected-lint-errors.txt`)),
  newExpectedErrors
    .map(
      (match) =>
        `${match.groups.file}\n${match.groups.reports}~~~\n${match.groups.code}~~~\n`,
    )
    .join("\n"),
);
