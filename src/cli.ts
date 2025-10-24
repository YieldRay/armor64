#!/usr/bin/env -S node --experimental-transform-types --disable-warning=ExperimentalWarning
import { parseArgs, styleText, debuglog } from "node:util";
import process from "node:process";
import pkg from "../package.json" with { type: "json" };
import { encode, encodeString, decode, isValid } from "./armor64.ts";

const log = debuglog(pkg.name);

const { values, positionals } = parseArgs({
  options: {
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
  allowPositionals: true,
});

if (values.help || positionals.length < 1) help();

const [command, arg] = positionals as [string, string?];
log("cmd", command, arg);

function readAllStdin(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("error", reject);
    process.stdin.on("data", (c) =>
      chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
    );
    process.stdin.on("end", () => resolve(Buffer.concat(chunks)));
    process.stdin.resume();
  });
}

function wantsStdin(a?: string): boolean {
  return a === undefined || a === "-" || !process.stdin.isTTY;
}

switch (command) {
  case "help":
    help();
    break;
  case "encode": {
    if (wantsStdin(arg)) {
      const buf = await readAllStdin();
      process.stdout.write(encode(new Uint8Array(buf)) + "\n");
    } else {
      process.stdout.write(encodeString(arg!) + "\n");
    }
    break;
  }
  case "decode": {
    const text = wantsStdin(arg)
      ? (await readAllStdin()).toString("utf8")
      : arg!;
    if (!isValid(text)) {
      process.stderr.write("Invalid armor64 input\n");
      process.exit(1);
    }
    const bytes = decode(text);
    process.stdout.write(Buffer.from(bytes));
    break;
  }
  case "validate": {
    const text = wantsStdin(arg)
      ? (await readAllStdin()).toString("utf8")
      : arg!;
    process.stdout.write(String(isValid(text)) + "\n");
    break;
  }
  default:
    process.stderr.write(`Unknown command ${command}\n`);
    process.exit(1);
}

function help() {
  process.stdout.write(`${styleText("green", pkg.name)} v${pkg.version}

  ${styleText("bold", "Usage:")}
    armor64 encode [text|-]        # encodes UTF-8 text or bytes from stdin (if piped)
    armor64 decode [armor|-]       # decodes to raw bytes on stdout; use --help for tips
    armor64 validate [armor|-]     # prints true/false

  Notes:
    - Use '-' or pipe data to read from stdin.
    - Newlines are not allowed in armor64 input; ensure your piped text doesn't add one.
`);
  process.exit(1);
}
