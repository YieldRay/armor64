import { test } from "node:test";
import * as assert from "node:assert";
import {
  encode,
  decode,
  encodeString,
  decodeToString,
  isValid,
} from "./armor64.ts";

const VECTORS: Array<[string, string]> = [
  ["", ""],
  ["JP", "H_-"],
  ["Hello, World!", "H5KgQ5wg74SjRalZ7F"],
  [
    "armor64 is safe, strict, and stable. It is specified and easy to test. Do not settle for lesser encodings.",
    "NM8hQr7qC10dRm0nNLO_A10nS68dNrFg754iO10nS54XQ5Ji73_o75_n76CkOLCdOa__O10WQaFVOL4nTH0oQm0oOMCoAX03Qm0iQrFVRqKoS5l_75OjRX0gOMCnOM7VOLtYQqGdQaSnAV",
  ],
];

test("encode vectors", () => {
  for (const [plain, armored] of VECTORS) {
    assert.strictEqual(encodeString(plain), armored);
  }
});

test("decode vectors", () => {
  for (const [plain, armored] of VECTORS) {
    assert.strictEqual(decodeToString(armored), plain);
  }
});

test("invalid characters are rejected", () => {
  const bad = [" ", "\r", "\n", "__=="]; // space, CR, LF, '=' not allowed
  for (const s of bad) {
    assert.throws(() => decode(s));
    assert.equal(isValid(s), false);
  }
});

test("roundtrip bytes", () => {
  const bytes = new Uint8Array([0, 1, 2, 3, 254, 255]);
  const enc = encode(bytes);
  const dec = decode(enc);
  assert.deepEqual(dec, bytes);
});
