const expectedErrors = (
  await Bun.file(
    Bun.fileURLToPath(import.meta.resolve(`./expected-lint-errors.txt`)),
  ).text()
).matchAll(
  /(?<file>\/en-US\/docs\/[^\n]+)\n(?<reports>(?:\[[^\]]+\] .*\n)+)~~~\n(?<code>(?:.|\n)+?)~~~\n/g,
);

const newExpectedErrors = [...expectedErrors]
  .map(({ groups }) => ({
    ...groups,
    reports: `${groups.reports
      .trimEnd()
      .split("\n")
      .sort((a, b) => {
        const aRuleEnd = a.indexOf("]");
        const bRuleEnd = b.indexOf("]");
        return (
          a.slice(1, aRuleEnd).localeCompare(b.slice(1, bRuleEnd)) ||
          a.slice(aRuleEnd + 2).localeCompare(b.slice(bRuleEnd + 2))
        );
      })
      .join("\n")}\n`,
  }))
  .sort(
    (a, b) =>
      a.file.localeCompare(b.file) || a.reports.localeCompare(b.reports),
  );
await Bun.write(
  Bun.fileURLToPath(import.meta.resolve(`./expected-lint-errors.txt`)),
  newExpectedErrors
    .map(
      (match) =>
        `${match.file}\n${match.reports}~~~\n${match.code}~~~\n`,
    )
    .join("\n"),
);
