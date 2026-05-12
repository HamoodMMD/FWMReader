import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { defaultParserRegistry } from "../src/server/parsers/registry";

async function main() {
  const fixturePath = path.join(process.cwd(), "tests", "fixtures", "sample-generic-chat.json");
  const content = await fs.readFile(fixturePath, "utf8");
  const payload = JSON.parse(content) as unknown;
  const detected = defaultParserRegistry.detect(payload);

  if (!detected) {
    throw new Error("No parser detected for synthetic fixture.");
  }

  const bundle = detected.parser.parse(payload, {
    absolutePath: fixturePath,
    originalName: path.basename(fixturePath),
    contentHash: crypto.createHash("sha256").update(content).digest("hex"),
    sizeBytes: Buffer.byteLength(content),
    filesystemCreatedAt: "2026-05-12T08:00:00.000Z",
    filesystemModifiedAt: "2026-05-12T08:00:10.000Z"
  });

  if (bundle.messages.length !== 2) {
    throw new Error(`Expected 2 messages, got ${bundle.messages.length}.`);
  }

  if (bundle.codeBlocks.length !== 1) {
    throw new Error(`Expected 1 code block, got ${bundle.codeBlocks.length}.`);
  }

  console.log(`Parsed fixture with ${detected.parser.type}; ${bundle.messages.length} messages, ${bundle.codeBlocks.length} code block.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
