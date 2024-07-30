const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const algorithm = 'aes-256-cbc';
const ivLength = 16;
const masterKey = Buffer.from(process.env.MASTER_KEY, 'base64');

const EncryptionService = {
    encryptFile: async function(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            const iv = crypto.randomBytes(ivLength);
            const key = crypto.randomBytes(32);

            const cipher = crypto.createCipheriv(algorithm, key, iv);
            const input = fs.createReadStream(inputPath);
            const output = fs.createWriteStream(outputPath);

            input.pipe(cipher).pipe(output);

            output.on('finish', () => {
                const encryptedKey = this.encryptKey(key);
                resolve({ encryptedKey, iv });
            });

            output.on('error', (err) => {
                reject(err);
            });
        });
    },

    decryptFile: async function(inputPath, outputPath, keyData) {
        return new Promise((resolve, reject) => {
            const { encryptedKey, iv } = keyData;
            const key = this.decryptKey(encryptedKey);

            const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'base64'));
            const input = fs.createReadStream(inputPath);
            const output = fs.createWriteStream(outputPath);

            input.pipe(decipher).pipe(output);

            output.on('finish', () => {
                resolve();
            });

            output.on('error', (err) => {
                reject(err);
            });
        });
    },

    encryptKey: function(key) {
        const cipher = crypto.createCipheriv('aes-256-cbc', masterKey, Buffer.alloc(16, 0));
        let encrypted = cipher.update(key);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('base64');
    },

    decryptKey: function(encryptedKey) {
        const decipher = crypto.createDecipheriv('aes-256-cbc', masterKey, Buffer.alloc(16, 0));
        let decrypted = decipher.update(Buffer.from(encryptedKey, 'base64'));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    }
};

module.exports = EncryptionService;
