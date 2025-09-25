const Subscription = require("../models/Subscription");

exports.createSubscription = async (req, res) => {
  const { email, categories, frequency } = req.body;
  if (!email || !categories?.length) {
    return res.status(400).json({ message: "Email and categories are required" });
  }
  try {
    const sub = new Subscription({ email, categories, frequency });
    await sub.save();
    res.json({ message: "Subscribed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Subscription failed" });
  }
};
