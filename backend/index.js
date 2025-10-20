const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
require("dotenv").config();

const Subscription = require("./models/Subscription");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

const app = express();
const server = http.createServer(app);

// ✅ Update this to your live frontend
const FRONTEND_URL = "https://shrth.netlify.app";

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

app.use(cors({ origin: FRONTEND_URL, methods: ["GET", "POST"], credentials: true }));
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.log("❌ Mongo error:", err.message));

app.use("/", subscriptionRoutes);

// ✅ Fetch news by category (needed for frontend)
app.get("/news/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${process.env.NEWS_API_KEY}`
    );
    res.json(response.data.articles.slice(0, 6));
  } catch (err) {
    res.status(500).json({ message: "Error fetching news" });
  }
});

// ✅ Socket.io connection
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);
  socket.on("disconnect", () => console.log("🔴 User disconnected:", socket.id));
});

// ✅ Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ✅ Fetch and broadcast news
async function fetchNews(category) {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${process.env.NEWS_API_KEY}`
    );
    const articles = res.data.articles.slice(0, 3).map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
    }));
    return articles;
  } catch {
    return [];
  }
}

async function broadcastNews() {
  const subs = await Subscription.find();
  const categories = ["politics", "sports", "technology", "business", "health"];

  for (const category of categories) {
    const articles = await fetchNews(category);
    if (!articles.length) continue;

    // Real-time updates
    io.emit("news", { category, articles });

    // Send emails
    subs
      .filter(sub => sub.categories.includes(category))
      .forEach(sub => {
        const now = new Date();
        const sendNow =
          sub.frequency === "immediate" ||
          (sub.frequency === "hourly" && now.getMinutes() === 0) ||
          (sub.frequency === "daily" && now.getHours() === 9);

        if (!sendNow) return;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: sub.email,
          subject: `Breaking ${category.toUpperCase()} News`,
          html: `<h2>Latest ${category} Updates</h2><ul>${articles
            .map(a => `<li><a href="${a.url}" target="_blank">${a.title}</a> - <i>${a.source}</i></li>`)
            .join("")}</ul>`,
        };

        transporter.sendMail(mailOptions, (err) => {
          if (err) console.log("Email error:", err.message);
        });
      });
  }
}

// Run every 5 minutes
cron.schedule("*/5 * * * *", broadcastNews);
broadcastNews();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
