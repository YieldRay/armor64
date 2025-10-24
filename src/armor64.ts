/**
 * armor64: safe, strict, stable textual encoding of byte streams.
 *
 * Alphabet (index -> char):
 * 0-63: - 0 1 2 3 4 5 6 7 8 9 A B C D E F G H I J K L M N O P Q R S T U V W X Y Z _ a b c d e f g h i j k l m n o p q r s t u v w x y z
 */

export const ARMOR64_ALPHABET =
  "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz" as const;

// Reverse lookup: char code -> 6-bit value (or -1 if invalid)
const REVERSE: Int16Array = (() => {
  const arr = new Int16Array(128).fill(-1);
  for (let i = 0; i < ARMOR64_ALPHABET.length; i++) {
    arr[ARMOR64_ALPHABET.charCodeAt(i)] = i;
  }
  return arr;
})();

export class Armor64Error extends Error {}

/**
 * Encode a byte stream to armor64 string.
 */
export function encode(input: Uint8Array): string {
  let out = "";
  let buf = 0; // bit buffer
  let bits = 0; // number of bits in buffer

  for (let i = 0; i < input.length; i++) {
    buf = (buf << 8) | input[i];
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      const val = (buf >> bits) & 0x3f;
      out += ARMOR64_ALPHABET[val];
    }
    // keep only remaining bits
    buf &= (1 << bits) - 1;
  }

  if (bits > 0) {
    // right-pad remaining bits with zeros to 6 bits (canonical)
    const val = (buf << (6 - bits)) & 0x3f;
    out += ARMOR64_ALPHABET[val];
  }

  return out;
}

/**
 * Decode an armor64 string into bytes.
 * Enforces strictness: rejects invalid characters, non-canonical trailing bits, and length % 4 == 1.
 */
export function decode(text: string): Uint8Array {
  if (text.length === 0) return new Uint8Array(0);

  // Reject any char outside ASCII printable set or not in alphabet
  let m = text.length;
  // Uniqueness: an encoded stream must not have length % 4 == 1 (would imply 6 leftover bits)
  if ((m & 3) === 1) {
    throw new Armor64Error("Invalid armor64 length: mod 4 == 1 is not allowed");
  }

  let buf = 0; // bit buffer
  let bits = 0; // number of bits currently in buffer (0,2,4,6)
  const out: number[] = [];

  for (let i = 0; i < m; i++) {
    const code = text.charCodeAt(i);
    if (code > 0x7f) throw new Armor64Error(`Invalid character at ${i}`);
    const val = REVERSE[code];
    if (val < 0) throw new Armor64Error(`Invalid character at ${i}`);

    buf = (buf << 6) | val;
    bits += 6;

    while (bits >= 8) {
      bits -= 8;
      const byte = (buf >> bits) & 0xff;
      out.push(byte);
      // keep only remaining bits
      buf &= (1 << bits) - 1;
    }
  }

  // At end, any remaining bits must be zero, and not 6 bits (non-canonical)
  if (bits === 6) {
    throw new Armor64Error("Non-canonical encoding: surplus 6 trailing bits");
  }
  if (bits !== 0) {
    const mask = (1 << bits) - 1;
    if ((buf & mask) !== 0) {
      throw new Armor64Error("Invalid trailing bits");
    }
  }

  return Uint8Array.from(out);
}

/** Convenience: encode a UTF-8 string */
export function encodeString(s: string): string {
  return encode(new TextEncoder().encode(s));
}

/** Convenience: decode to a UTF-8 string */
export function decodeToString(t: string): string {
  return new TextDecoder().decode(decode(t));
}

/** Validate armor64 string without materializing bytes */
export function isValid(text: string): boolean {
  try {
    // We still decode to enforce strictness but discard result
    decode(text);
    return true;
  } catch {
    return false;
  }
}
