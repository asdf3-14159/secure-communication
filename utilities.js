"use strict";

export function integerToDigits(n, b) {
  n = BigInt(n);
  b = BigInt(b);
  const a = [];
  while (n) {
    a.unshift(n % b);
    n /= b;
  }
  return a;
}

export function digitsToInteger(a, b) {
  b = BigInt(b);
  var n = 0n;
  const max = BigInt(a.length);
  for (let i = 0n; i < max; ++i) n += BigInt(a[i]) * (b ** (max - i - 1n));
  return n;
}

export function digitsToDigits(a, b1, b2) {
  const n = digitsToInteger(a, b1);
  return integerToDigits(n, b2);
}

export function encodeBase58(buffer) {
  const STRING = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const array256 = new Uint8Array(buffer);
  const array58 = digitsToDigits(array256, 256n, 58n);
  return array58.map(d => STRING[d]).join("");
}

export function decodeBase58(string) {
  const STRING = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const array58 = string.split("").map(c => STRING.indexOf(c));
  if (array58.includes(-1)) throw TypeError("String is not a valid Base58 encoded string.");
  const array256 = digitsToDigits(array58, 58n, 256n);
  return (new Uint8Array(array256.map(Number))).buffer;
}

export function concatBuffers(buffer1, buffer2) {
  const array1 = new Uint8Array(buffer1);
  const array2 = new Uint8Array(buffer2);
  const resultArray = new Uint8Array(array1.byteLength + array2.byteLength);
  resultArray.set(array1);
  resultArray.set(array2, array1.byteLength);
  return resultArray.buffer;
}
