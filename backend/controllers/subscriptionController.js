const Subscription = require("../models/Subscription");

exports.createSubscription = async (req, res) => {
  const { email, categories, frequency } = req.body;
  if (!email || !categories?.length) {
    return res.status(400).json({ message: "Email and categories required." });
  }
  try {
    let sub = await Subscription.findOne({ email });
    if (sub) {
      sub.categories = categories;
      sub.frequency = frequency;
      await sub.save();
      return res.json({ message: "Subscription updated successfully!" });
    }
    const newSub = new Subscription({ email, categories, frequency });
    await newSub.save();
    res.json({ message: "Subscribed successfully!" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Subscription failed." });
  }
};
