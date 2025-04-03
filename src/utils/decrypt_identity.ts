import { keccak256, toUtf8Bytes } from "ethers";

// Not in use as the 'encrypted_private_key'
//  from the api is not encrypted...
// its a ill issue, I KNOW..I  couldnt
// come up with an encryption algorithm
// tried to use one, but was shit
// as I could not decrypt it lol

export async function decryptPrivateKey(encryptedData: string, address: string, salt: string): Promise<string> {
    // Generate encryption key using keccak256
    const encryptionKeyHex = keccak256(toUtf8Bytes(address + salt)).slice(2);

    // Convert hex key to Uint8Array (Web Crypto API requires ArrayBuffer)
    const encryptionKey = new Uint8Array(encryptionKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Extract IV (first 16 bytes) and encrypted data (rest)
    const iv = new Uint8Array(encryptedData.slice(0, 32).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const encryptedBuffer = new Uint8Array(encryptedData.slice(32).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // Import key into Web Crypto API
    const key = await crypto.subtle.importKey(
        "raw",
        encryptionKey,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
    );

    // Decrypt the data
    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv },
            key,
            encryptedBuffer
        );
        return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Decryption failed: Invalid key or corrupted data");
    }
}
