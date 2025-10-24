# armor64

[![npm version][npm-version-src]][npm-version-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

[armor64](https://armor64.org/): Safe, strict and stable textual encoding of byte streams.

- Canonical: one encoding per byte stream; no padding, no variants.
- Safe: ASCII printable alphabet, URL/JSON-friendly, unique, newline-free.
- Stable: preserves natural byte order; the spec will not change.

## Install

```sh
npm i armor64
```

## API

```ts
import { encode, decode, encodeString, decodeToString, isValid } from "armor64";

const a = encode(new Uint8Array([1, 2, 3]));
const b = decode(a); // Uint8Array

const t = encodeString("Hello, World!");
const s = decodeToString(t); // "Hello, World!"

isValid(t); // true
```

## CLI

Installed via npm, the `armor64` CLI can encode/decode and validate.

```
armor64 encode <text|->      # encode UTF-8 text or bytes from stdin
armor64 decode <armor|- >    # decode armor64 to raw bytes on stdout
armor64 validate <armor|- >  # print true/false
```

Examples:

```sh
# text to armor
armor64 encode "JP"            # -> H_-

# armor to bytes (printed raw). To view as UTF-8 text:
armor64 decode H_- | node -e "process.stdin.on('data',b=>process.stdout.write(b))"

# validate
armor64 validate H5KgQ5wg74SjRalZ7F  # -> true

# piping bytes through encode (no newline)
node -e "process.stdout.write(Buffer.from([0,1,2,255]))" | armor64 encode
```

Notes:

- Use '-' or pipe data to read from stdin.
- Newlines are forbidden in armor64; ensure your piped text does not add one.

## Specification

Encoding consumes 6-bit blocks from the input (left to right). If fewer than 6 bits remain, they are right-padded with zeros for the final symbol. Alphabet (value -> char):

```
0..63: -0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz
```

Decoding maps each character back to 6 bits. Bytes are emitted every 8 bits. If any remaining bits at the end are non-zero, or a character is outside the alphabet, the input is rejected.

## Test vectors

- "" -> ""
- "JP" -> "H\_-"
- "Hello, World!" -> "H5KgQ5wg74SjRalZ7F"
- "armor64 is safe, strict, and stable. It is specified and easy to test. Do not settle for lesser encodings." ->
  "NM8hQr7qC10dRm0nNLO_A10nS68dNrFg754iO10nS54XQ5Ji73_o75_n76CkOLCdOa\_\_O10WQaFVOL4nTH0oQm0oOMCoAX03Qm0iQrFVRqKoS5l_75OjRX0gOMCnOM7VOLtYQqGdQaSnAV"

Invalid inputs (must fail): space, carriage return, newline, any '=' characters (e.g. "\_\_==").

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/armor64?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/armor64
[bundle-src]: https://img.shields.io/bundlephobia/minzip/armor64?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=armor64
[license-src]: https://img.shields.io/github/license/YieldRay/armor64.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/YieldRay/armor64/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/armor64
