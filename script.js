"use strict";

function integerToDigits(n, b) {
  n = BigInt(n);
  b = BigInt(b);
  const a = [];
  while (n) {
    a.unshift(n % b);
    n /= b;
  }
  return a;
}

function digitsToInteger(a, b) {
  b = BigInt(b);
  var n = 0n;
  const max = BigInt(a.length);
  for (let i = 0n; i < max; ++i) n += BigInt(a[i]) * (b ** (max - i - 1n));
  return n;
}

function digitsToDigits(a, b1, b2) {
  const n = digitsToInteger(a, b1);
  return integerToDigits(n, b2);
}

function encodeBase58(buffer) {
  const STRING = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const array256 = new Uint8Array(buffer);
  const array58 = digitsToDigits(array256, 256n, 58n);
  return array58.map(d => STRING[d]).join("");
}

function decodeBase58(string) {
  const STRING = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const array58 = string.split("").map(c => STRING.indexOf(c));
  if (array58.includes(-1)) throw TypeError("String is not a valid Base58 encoded string.");
  const array256 = digitsToDigits(array58, 58n, 256n);
  return (new Uint8Array(array256.map(Number))).buffer;
}

function concatBuffers(buffer1, buffer2) {
  const array1 = new Uint8Array(buffer1);
  const array2 = new Uint8Array(buffer2);
  const resultArray = new Uint8Array(array1.byteLength + array2.byteLength);
  resultArray.set(array1);
  resultArray.set(array2, array1.byteLength);
  return resultArray.buffer;
}






async function generateKeyPair() {
  let publicKey;
  ({privateKey, publicKey} = await crypto.subtle.generateKey({name: "ECDH", namedCurve: "P-521"}, true, ["deriveKey", "deriveBits"]));
  const buffer = await crypto.subtle.exportKey("raw", publicKey);
  publicKeyString = encodeBase58(buffer);
}

async function getAesKey(publicKey) {
  const strangerPublicKey = await crypto.subtle.importKey("raw", decodeBase58(publicKey),  {name: "ECDH", namedCurve: "P-521"}, false, []);
  aesKey = await crypto.subtle.deriveKey({name: "ECDH", public: strangerPublicKey}, privateKey, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
}

async function encrypt(text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainText = encoder.encode(text);
  const cipherText = await crypto.subtle.encrypt({name: "AES-GCM", iv}, aesKey, plainText);
  const resultBuffer = concatBuffers(iv, cipherText);
  return encodeBase58(resultBuffer);
}

async function decrypt(text) {
  const buffer = decodeBase58(text);
  const iv = buffer.slice(0, 12);
  const cipherText = buffer.slice(12);
  const plainText = await crypto.subtle.decrypt({name: "AES-GCM", iv}, aesKey, cipherText);
  return decoder.decode(plainText);
}






let privateKey = null;
let publicKeyString = null;
let aesKey = null;

const encoder = new TextEncoder();
const decoder = new TextDecoder();


const $ = s => document.querySelector(s);

const publicKeyInputArea = $("#publicKeyInputArea");
const publicKeyInput = $("#publicKeyInput");
const publicKeyInputButton = $("#publicKeyInputButton");
const publicKeyError = $("#publicKeyError");
const publicKeyOutput = $("#publicKeyOutput");
const plainTextInput = $("#plainTextInput");
const cipherTextInput = $("#cipherTextInput");
const plainTextOutput = $("#plainTextOutput");
const cipherTextOutput = $("#cipherTextOutput");
const encryptArea = $("#encryptArea");
const encryptError = $("#encryptError");
const decryptArea = $("#decryptArea");
const decryptError = $("#decryptError");

publicKeyInputButton.addEventListener("click", async function (e) {
  publicKeyError.textContent = "";
  try {
    await getAesKey(publicKeyInput.value);
    publicKeyInputArea.disabled = true;
    encryptArea.disabled = encryptArea.disabled = false;
  }
  catch (error) {
    publicKeyError.textContent = error;
  }
});

plainTextInput.addEventListener("input", async function (e) {
  encryptError.textContent = "";
  try {
    cipherTextOutput.value = await encrypt(plainTextInput.value);
  }
  catch (error) {
    encryptError.textContent = error;
  }
});

cipherTextInput.addEventListener("input", async function (e) {
  decryptError.textContent = "";
  try {
    plainTextOutput.value = await decrypt(cipherTextInput.value);
  }
  catch (error) {
    decryptError.textContent = error;
  }
});

async function start() {
  await generateKeyPair();
  publicKeyOutput.textContent = publicKeyString;
  publicKeyInputArea.disabled = false;
}






















