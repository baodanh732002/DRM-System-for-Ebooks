const { default: mongoose } = require("mongoose");

const { Schema } = mongoose;
const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  date: { type: Date, require: true }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
