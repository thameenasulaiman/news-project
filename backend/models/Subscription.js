const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  email: String,
  categories: [String],
  frequency: String,
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
