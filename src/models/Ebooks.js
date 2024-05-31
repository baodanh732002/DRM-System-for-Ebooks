const { default: mongoose } = require("mongoose");

const { Schema } = mongoose;
const ebookSchema = new Schema({
  title: { type: String, required: true, unique: true},
  type: { type: String, required: true},
  pub_year: {type: Number, require: true},
  publisher: {type: String, require: true},
  doi: {type: String, require: true},
  isbn: {type: String, require: true},
  language: { type: String, required: true},
  description: { type: String, required: true},
  ebookFile: { type: String, require: true},
  ebookFileOriginalName: { type: String, require: true},
  imageFile: { type: String, required: true },
  imageFileOriginalName: { type: String, require: true},
  state: { type: String, require: true},
  author: { type: String, require: true},
  date: { type: Date, require: true},
  note: { type: String, require: true}
});

const Ebook = mongoose.model("Ebook", ebookSchema);

module.exports = Ebook;
