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

const FRONTEND_URL = "https://shrth.netlify.app"; // your frontend

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
});

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("Mongo error:", err));

app.use("/", subscriptionRoutes);

// ====== Real-Time News Fetch Function ======
async function fetchNews(category) {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${process.env.NEWS_API_KEY}`
    );
    return res.data.articles.slice(0, 3).map((a) => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
    }));
  } catch (err) {
    console.error(`Error fetching ${category} news:`, err.message);
    return [];
  }
}

// ====== Socket Connection ======
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);
  socket.on("disconnect", () => console.log("🔴 User disconnected:", socket.id));
});

// ====== Email Transporter ======
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ====== Broadcast News to Sockets and Email ======
async function broadcastNews() {
  const subs = await Subscription.find();
  const categories = ["politics", "sports", "technology", "business", "health"];

  for (const category of categories) {
    const articles = await fetchNews(category);
    if (!articles.length) continue;

    io.emit("news", { category, articles }); // Real-time update via socket

    // Email each subscriber who selected this category
    subs
      .filter((s) => s.categories.includes(category))
      .forEach((sub) => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: sub.email,
          subject: `Breaking ${category.toUpperCase()} News`,
          html: `
            <h2>Latest ${category} Updates</h2>
            <ul>
              ${articles
                .map(
                  (a) =>
                    `<li><a href="${a.url}" target="_blank">${a.title}</a> - <i>${a.source}</i></li>`
                )
                .join("")}
            </ul>
          `,
        };
        transporter.sendMail(mailOptions, (err) => {
          if (err) console.log("Email error:", err.message);
        });
      });
  }
}

// ====== CRON SCHEDULING ======
// immediate → every 5 mins, hourly → every hour, daily → every day
cron.schedule("*/5 * * * *", broadcastNews); // every 5 mins

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
