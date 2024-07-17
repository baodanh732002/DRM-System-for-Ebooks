const mongoose = require('mongoose');

const { Schema } = mongoose;
const tokenSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    expiryDate: { type: Date, required: true }
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
