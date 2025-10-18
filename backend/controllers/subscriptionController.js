const Subscription = require("../models/Subscription");

// Create or update subscription
exports.createSubscription = async (req, res) => {
  const { email, categories, frequency } = req.body;

  if (!email || !categories?.length) {
    return res.status(400).json({ message: "Email and categories required." });
  }

  try {
    let sub = await Subscription.findOne({ email });

    if (sub) {
      // Merge new categories with existing ones
      sub.categories = Array.from(new Set([...sub.categories, ...categories]));
      sub.frequency = frequency; 
      await sub.save();
      return res.json({ message: "Subscription updated successfully!", subscription: sub });
    }

    const newSub = new Subscription({ email, categories, frequency });
    await newSub.save();
    res.json({ message: "Subscribed successfully!", subscription: newSub });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Subscription failed." });
  }
};

// Unsubscribe from specific categories
exports.unsubscribe = async (req, res) => {
  const { email, categories } = req.body;
  if (!email || !categories?.length) return res.status(400).json({ message: "Email and categories required." });

  try {
    const sub = await Subscription.findOne({ email });
    if (!sub) return res.status(404).json({ message: "Subscription not found." });

    sub.categories = sub.categories.filter(cat => !categories.includes(cat));
    await sub.save();
    res.json({ message: "Unsubscribed successfully!", subscription: sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unsubscribe failed." });
  }
};
