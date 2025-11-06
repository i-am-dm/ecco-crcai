// Minimal monotonic ULID implementation (Crockford base32)
// ULID: 26 chars: 10 timestamp chars (ms since epoch), 16 randomness chars

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32

let lastTime = -1;
let lastRandomPart = "";

function encodeBase32(value: bigint, len: number): string {
  let str = "";
  for (let i = 0; i < len; i++) {
    const mod = Number(value % 32n);
    str = ENCODING[mod] + str;
    value = value / 32n;
  }
  return str;
}

function encodeTime(time: number, len = 10): string {
  const time48 = BigInt(time);
  return encodeBase32(time48, len);
}

function randomPart(len = 16): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ENCODING[Math.floor(Math.random() * 32) & 0x1f];
  }
  return out;
}

function incrementBase32(str: string): string {
  const chars = str.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    const idx = ENCODING.indexOf(chars[i]);
    if (idx === -1) throw new Error("Invalid base32 char in ULID randomness");
    if (idx === 31) {
      chars[i] = ENCODING[0];
      continue;
    }
    chars[i] = ENCODING[idx + 1];
    return chars.join("");
  }
  // overflow wraps around
  return ENCODING[0].repeat(chars.length);
}

export function ulid(time = Date.now()): string {
  let rand: string;
  if (time === lastTime) {
    rand = lastRandomPart = incrementBase32(lastRandomPart);
  } else {
    rand = lastRandomPart = randomPart(16);
    lastTime = time;
  }
  const ts = encodeTime(time, 10);
  return ts + rand;
}
