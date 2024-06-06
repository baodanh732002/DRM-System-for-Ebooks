const { default: mongoose } = require("mongoose");

const { Schema } = mongoose;
const downloadSchema = new Schema({
    username: { type: String, required: true },
    doi: { type: String, require: true},
    isbn: { type: String, require: true}
});

const Download = mongoose.model("Download", downloadSchema);

module.exports = Download;
