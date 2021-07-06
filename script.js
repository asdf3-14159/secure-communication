"use strict";

import {concatBuffer, encodeBase58, decodeBase58} from "./utilities.js";


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



publicKeyInputButton.addEventListener("click", async function (e) {
  publicKeyError.textContent = "";
  try {
    await getAesKey(publicKeyInput.value);
    publicKeyInputArea.disabled = true;
    encryptArea.disabled = decryptArea.disabled = false;
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



// Starting:
await generateKeyPair();
publicKeyOutput.textContent = publicKeyString;
publicKeyInputArea.disabled = false;





