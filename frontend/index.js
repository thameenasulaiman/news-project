const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("Email sent:", to);
  } catch (err) {
    console.error("Email error:", err.message);
  }
}

const subscriptionSchema = new mongoose.Schema({
  email: String,
  categories: [String],
  frequency: String,
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);


app.post("/subscribe", async (req, res) => {
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
});


async function fetchNews(category) {
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/top-headlines?category=${category}&country=us&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data.articles.map(a => ({
    title: a.title,
    url: a.url,
    source: a.source.name
  }));
}


setInterval(async () => {
  const subscriptions = await Subscription.find();
  for (let sub of subscriptions) {
    for (let cat of sub.categories) {
      const articles = await fetchNews(cat);
      if (articles.length > 0) {
        io.emit("news", { category: cat, articles });
      }
    }
  }
}, 10000);


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
