const { default: mongoose } = require("mongoose");

const { Schema } = mongoose;
const ebookSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, required: true},
  language: { type: String, required: true},
  description: { type: String, required: true, unique: true },
  ebookFile: { type: String, require: true},
  imageFile: { type: String, required: true },
  state: { type: String, require: true},
  author: { type: String, require: true},
  date: { type: Date, require: true}
});

const Ebook = mongoose.model("Ebook", ebookSchema);

module.exports = Ebook;
