import Path from "node:path";

export const BUILT_CONTENT_ROOT = Path.resolve(
  process.env.BUILT_CONTENT_ROOT ?? "../content/build",
);

export const CONTENT_SOURCE_ROOT = Path.resolve(
  process.env.CONTENT_SOURCE_ROOT ?? "../content/files",
);

export async function readConfig(path: string) {
  return (
    await Bun.file(
      Bun.fileURLToPath(import.meta.resolve(`../../config/${path}`)),
    ).text()
  )
    .split("\n")
    .filter((x) => x && !x.startsWith("  "));
}

export function configHas<T>(config: Map<T, boolean>, key: T) {
  if (config.has(key)) {
    config.set(key, true);
    return true;
  }
  return false;
}
