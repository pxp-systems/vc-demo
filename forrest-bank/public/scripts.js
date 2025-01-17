function processPayment() {
    const fileInput = document.getElementById('qrReader');
    const amount = document.getElementById('amount').value;

    if (fileInput.files.length === 0) {
        alert('Please select a QR code image.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const image = new Image();
        image.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code) {
                // Process the QR code data
                fetch('/make-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ qrCredential: code.data, amount: amount }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.message === 'Payment successful') {
                            document.getElementById('paymentResult').innerText = `Payment of ${amount} processed successfully.`;
                        } else {
                            alert(data.message);
                        }
                    })
                    .catch((err) => {
                        alert(`Error processing payment: ${err.message}`);
                    });
            } else {
                alert('No QR code detected in the image.');
            }
        };

        image.src = e.target.result; // Load the image from the file
    };

    reader.readAsDataURL(fileInput.files[0]);
}
