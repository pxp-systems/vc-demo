const express = require('express');
const { SignJWT, jwtVerify } = require('jose');
const QRCode = require('qrcode');
const fs = require('fs/promises');
const crypto = require('crypto');
const zlib = require('zlib');

const app = express();
const PORT = process.env.PORT || 3020;

// Example NZBN credential payload
const credential = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["Verifiable2dCredential"],
  issuer: "did:example:issuer:nzbn",
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    nzbn: "1234567890123",
    bankAccountNumber: "03-1234-1234567-123",
  },
};

// Function to sign a credential using ECC (ES256)
async function signCredential(credential) {
  const privateKeyPem = await fs.readFile("private_ec.pem", "utf8");
  const privateKey = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem',
    type: 'pkcs8',
  });

  return new SignJWT(credential)
  .setProtectedHeader({ alg: 'ES256' }) // Use ECC
  .setIssuedAt(Math.floor(Date.now() / 1000)) // Convert milliseconds to seconds
  .setExpirationTime(Math.floor(Date.now() / 1000) + 120) // Add 120 seconds (2 minutes)
  .sign(privateKey);
}

// Function to generate a compressed QR code
async function generateQRCode(data) {
  const compressedData = zlib.deflateSync(data).toString('base64'); // Compress JWT
  return await QRCode.toDataURL(compressedData, {
    width: 300,  // Smaller QR code size
    margin: 2,   // Reduced margin
  });
}

// Endpoint to generate and return the QR code
app.get('/qr', async (req, res) => {
  try {
    const signedCredential = await signCredential(credential);
    const qrCode = await generateQRCode(signedCredential);
    res.send(`<img src="${qrCode}" alt="QR Code"/>`);
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint to decode and decompress a QR code payload
app.post('/decode', express.json(), async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    const decompressedToken = zlib.inflateSync(Buffer.from(token, 'base64')).toString(); // Decompress token
    const publicKeyPem = await fs.readFile("public_ec.pem", "utf8"); // ECC public key
    const publicKey = crypto.createPublicKey({
      key: publicKeyPem,
      format: 'pem',
      type: 'spki',
    });

    // Verify the decompressed token
    const { payload } = await jwtVerify(decompressedToken, publicKey, { algorithms: ['ES256'] });

    res.json({ payload });
  } catch (err) {
    console.error("Error decoding token:", err.message);
    res.status(400).json({ error: 'Invalid token', details: err.message });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`App running at http://localhost:${PORT}`);
});
