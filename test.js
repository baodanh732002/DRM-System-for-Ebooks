const crypto = require('crypto');
const fs = require('fs');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem' 
    },
    privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem' 
    }
});

fs.writeFileSync('public_key.pem', publicKey);

fs.writeFileSync('private_key.pem', privateKey);

console.log('RSA keys have been generated and saved as public_key.pem and private_key.pem');
