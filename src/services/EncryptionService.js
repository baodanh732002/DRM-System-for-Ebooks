const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const algorithm = 'aes-256-cbc';
const ivLength = 16;
const masterKey = Buffer.from(process.env.MASTER_KEY, 'base64');

const privateKey = fs.readFileSync(path.resolve(__dirname, '../../private_key.pem'), 'utf8');
const publicKey = fs.readFileSync(path.resolve(__dirname, '../../public_key.pem'), 'utf8');


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
                const encryptedKey = this.encryptKeyRSA(key);
                resolve({ encryptedKey, iv: iv.toString('base64') });
            });

            output.on('error', (err) => {
                reject(err);
            });
        });
    },

    decryptFile: async function(inputPath, outputPath, keyData) {
        return new Promise((resolve, reject) => {
            const { encryptedKey, iv } = keyData;
            if (!encryptedKey || !iv) {
                return reject(new Error('Invalid keyData: encryptedKey or iv is missing'));
            }

            const key = this.decryptKeyRSA(encryptedKey);
            const decryptedKey = this.decryptKeyRSA(encryptedKey);
            console.log("Decrypted Key:", decryptedKey);

            const testKey = Buffer.from('test-key-32byteslength', 'utf8');
            const encryptedTestKey = crypto.publicEncrypt(publicKey, testKey);
            const decryptedTestKey = crypto.privateDecrypt(privateKey, encryptedTestKey);
            console.log("Original Test Key:", testKey);
            console.log("Decrypted Test Key:", decryptedTestKey);



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
    },

    encryptKeyRSA: function(key) {
        return crypto.publicEncrypt(publicKey, key).toString('base64');
    },

    decryptKeyRSA: function(encryptedKey) {
        return crypto.privateDecrypt(privateKey, Buffer.from(encryptedKey, 'base64'));
    },

    generateUserSpecificKey: function(baseKey, userId) {
        return crypto.createHash('sha256').update(`${baseKey}-${userId}`).digest('base64');
    },

    encryptUserSpecificKey: function(baseKey, userId) {
        const userSpecificKey = this.generateUserSpecificKey(baseKey, userId);
        const iv = crypto.randomBytes(ivLength);
        const encryptedKey = this.encryptKey(Buffer.from(userSpecificKey, 'base64'));
        return { encryptedKey, iv: iv.toString('base64') };
    },

    decryptUserSpecificKey: function(encryptedUserKey) {
        const decryptedKey = this.decryptKey(encryptedUserKey);
        return decryptedKey.toString('base64');
    }
};

module.exports = EncryptionService;
