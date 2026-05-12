import fs from "node:fs/promises";

export interface JsonReadOptions {
  maxInMemoryBytes?: number;
}

const defaultMaxInMemoryBytes = 100 * 1024 * 1024;

export async function readJsonPayload(filePath: string, options: JsonReadOptions = {}) {
  const maxInMemoryBytes = options.maxInMemoryBytes ?? defaultMaxInMemoryBytes;
  const stat = await fs.stat(filePath);

  if (stat.size > maxInMemoryBytes) {
    throw new Error(
      `JSON file is ${(stat.size / 1024 / 1024).toFixed(1)}MB. Large-file streaming adapters are enabled at the parser boundary, but this parser still needs a bounded root payload.`
    );
  }

  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as unknown;
}

