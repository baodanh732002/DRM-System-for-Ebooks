const { default: mongoose } = require("mongoose");

const { Schema } = mongoose;
const accessRequestSchema = new Schema({
    requestBy: { type: String, required: true },
    handleBy: { type: String, required: true },
    ebookId: { type: mongoose.Schema.Types.ObjectId, required: true },
    requestAt: { type: Date, required: true },
    handleAt: { type: Date },
    key: { type: String },
    state: { type: String, required: true}
});

const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);

module.exports = AccessRequest;
