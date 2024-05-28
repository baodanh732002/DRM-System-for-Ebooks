const { default: mongoose } = require("mongoose");

const { Schema } = mongoose;
const adminSchema = new Schema({
    adname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    date: { type: Date, require: true }
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
