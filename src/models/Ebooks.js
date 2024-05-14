const { default: mongoose } = require("mongoose");

const { Schema } = mongoose;
const ebookSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true, unique: true },
  ebookFile: { type: String, require: true},
  imageFile: { type: String, required: true },
});

const Ebook = mongoose.model("Ebook", ebookSchema);

module.exports = Ebook;
