const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  categories: [String],
  frequency: { type: String, default: "immediate" },
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
