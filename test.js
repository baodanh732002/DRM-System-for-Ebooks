const crypto = require('crypto');
const fs = require('fs');

// Tạo cặp khóa RSA
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // Độ dài của khóa (2048 bit là đủ an toàn)
    publicKeyEncoding: {
        type: 'pkcs1', // Cấu trúc khóa công khai
        format: 'pem'  // Định dạng khóa công khai
    },
    privateKeyEncoding: {
        type: 'pkcs1', // Cấu trúc khóa riêng tư
        format: 'pem'  // Định dạng khóa riêng tư
    }
});

// Lưu khóa công khai vào file
fs.writeFileSync('public_key.pem', publicKey);

// Lưu khóa riêng tư vào file
fs.writeFileSync('private_key.pem', privateKey);

console.log('RSA keys have been generated and saved as public_key.pem and private_key.pem');
