const zlib = require('zlib');
const express = require('express');
const { jwtVerify, decodeJwt } = require('jose'); // Add `decodeJwt` for parsing without verifying
const crypto = require('crypto');

const PORT = 3030;
const app = express();

// Public key for verifying the JWT signature
const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE2GTV7JGPBvt9kDx9fFt69404WLY7
WYjO5VkUjCMYJITj0oKNFk4eLH46p4LPYOPle3VTqIFXBUST8jbwPnSCWg==
-----END PUBLIC KEY-----`;

const publicKey = crypto.createPublicKey({
  key: publicKeyPem,
  format: 'pem',
  type: 'spki', // Specify Subject Public Key Info (SPKI) format
});

app.use(express.json());

app.post('/decode', express.json(), async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    const decompressedToken = zlib.inflateSync(Buffer.from(token, 'base64')).toString();

    // Decode the token without verifying
    const payload = decodeJwt(decompressedToken);

    // Add a note if the token has expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      payload.verificationError = 'Token expired';
    }

    res.json({ payload });
  } catch (err) {
    console.error('Error decoding token:', err.message);
    res.status(400).json({ error: 'Invalid token', details: err.message });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Resolver app running at http://192.168.3.48:${PORT}`);
});
