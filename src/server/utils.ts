export function getBCD(data: any, key: string) {
  const keys = key.split(".");
  for (const key of keys) {
    if (!(key in data)) return undefined;
    data = data[key];
  }
  return data;
}
