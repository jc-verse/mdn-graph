export default async function buildWarningDocs() {
  const markdown = await Bun.file("./docs/warning-info.md").text();
  const content = Bun.markdown.html(markdown, { headings: { ids: true } });
  await Bun.write(
    "./docs/warning-info.html",
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MDN graph warnings</title>
    <style>
      body { max-width: 960px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; line-height: 1.6; }
      pre { overflow-x: auto; padding: 1rem; background: #f6f8fa; }
      code { overflow-wrap: anywhere; }
      blockquote { margin-left: 0; padding-left: 1rem; border-left: 4px solid #d0d7de; }
    </style>
  </head>
  <body>
    <main>${content}</main>
  </body>
</html>
`,
  );
}
