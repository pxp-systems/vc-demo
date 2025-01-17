const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3010;

// Load SSL certificate and key
const sslOptions = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
};

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/payments.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payments.html'));
});

// Payments Data (in-memory for the demo)
let payments = [
  { payeeName: 'John Doe', payeeAccount: '12345678', amount: 100, dateTime: '2024-12-06T12:00:00' },
  { payeeName: 'Jane Smith', payeeAccount: '87654321', amount: 250, dateTime: '2024-12-06T14:30:00' },
];

app.get('/payments', (req, res) => {
  res.json(payments);
});



app.post('/make-payment', async (req, res) => {
  try {
    const { qrCredential } = req.body;

    // Ensure qrCredential exists
    if (!qrCredential) {
      return res.status(400).json({ message: 'QR Credential is required' });
    }

    // Debug log to verify qrCredential content
    console.log('QR Credential received:', qrCredential);

    // Wrap qrCredential in an object with the key "token" as expected by the resolver
    const payeeInfo = await axios.post('http://localhost:3030/decode', {
      token: qrCredential,
    });
    // check expiry
    if (payeeInfo.data.payload.exp && payeeInfo.data.payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(200).json({
        message: 'Credential is expired, but payment details retrieved.',
        payload: payeeInfo.data.payload,
        expired: true,
      });
    }
    // Check if the resolver returned a valid payload
    if (payeeInfo.data && payeeInfo.data.payload) {
      const { credentialSubject } = payeeInfo.data.payload;

      if (!credentialSubject) {
        return res.status(400).json({ message: 'Invalid credential structure' });
      }

      const { entityName, bankAccountNumber } = credentialSubject;
      const payment = {
        payeeName: entityName || 'Unknown Payee',
        payeeAccount: bankAccountNumber || 'Unknown Account',
        amount: 100, // Example fixed amount for now
        dateTime: new Date().toISOString(),
      };

      // Add payment to in-memory list
      payments.push(payment);

      // Respond with payment success and include payload for frontend
      res.status(200).json({
        message: 'Payment successful',
        payment,
        payload: payeeInfo.data.payload, // Include the full payload for the frontend
      });
    } else {
      res.status(400).json({ message: 'Invalid credential' });
    }
  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});


// Create HTTPS server
https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server running at https://localhost:${PORT}`);
});
