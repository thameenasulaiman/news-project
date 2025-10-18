  import { useState, useEffect } from "react";
  import io from "socket.io-client";
  import axios from "axios";

  const socket = io("https://news-project-5.onrender.com");

  export default function App() {
    const [email, setEmail] = useState("");
    const [categories, setCategories] = useState([]);
    const [frequency, setFrequency] = useState("immediate");

    // To hold the real-time alerts coming from the server
    const [alerts, setAlerts] = useState([]);

    // To hold news fetched periodically for dashboard view
    const [newsByCategory, setNewsByCategory] = useState({});

    const availableCategories = [
      "politics",
      "sports",
      "technology",
      "business",
      "health",
    ];

    // Fetch news once when component mounts (you can set interval if needed)
    useEffect(() => {
      const fetchNews = async () => {
        try {
          const newsData = {};
          for (const cat of availableCategories) {
            const res = await axios.get(
              `https://newsapi.org/v2/top-headlines?category=${cat}&language=en&apiKey=${process.env.NEWS_API_KEY}`
            );
            newsData[cat] = res.data.articles.slice(0, 5);
          }
          setNewsByCategory(newsData);
        } catch (error) {
          console.error("Error fetching news:", error);
        }
      };
      fetchNews();
    }, []);

    // Listen for real-time alerts via sockets
    useEffect(() => {
      socket.on("news", (data) => {
        setAlerts((prev) => [data, ...prev].slice(0, 20)); // keep max 20 alerts
      });

      return () => {
        socket.off("news");
      };
    }, []);

    // Handle category checkbox toggle
    const toggleCategory = (cat) => {
      setCategories((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
      );
    };

    // Handle subscription submission
    const handleSubscribe = async () => {
      if (!email || categories.length === 0) {
        alert("Please enter your email and select at least one category.");
        return;
      }
      try {
        const res = await axios.post(
          "https://news-project-5.onrender.com/subscribe",
          { email, categories, frequency }
        );
        alert(res.data.message);
      } catch (error) {
        console.error(error);
        alert("Subscription failed. Please try again.");
      }
    };

    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
        {/* Sidebar: Subscription Form */}
        <aside className="bg-gray-800 p-6 md:w-80 w-full">
          <h1 className="text-3xl font-bold mb-6">Subscribe to News Alerts</h1>

          <input
            type="email"
            placeholder="Your email"
            className="w-full p-3 mb-4 rounded bg-gray-700 text-white placeholder-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <h2 className="text-xl mb-2 font-semibold">Select Categories:</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableCategories.map((cat) => (
              <label
                key={cat}
                className="bg-gray-700 px-3 py-1 rounded cursor-pointer flex items-center"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </label>
            ))}
          </div>

          <h2 className="text-xl mb-2 font-semibold">Alert Frequency:</h2>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full p-3 mb-6 rounded bg-gray-700 text-white"
          >
            <option value="immediate">Immediate</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>

          <button
            onClick={handleSubscribe}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold"
          >
            Subscribe
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Live Alerts Section */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-yellow-400">Live Alerts</h2>
            {alerts.length === 0 ? (
              <p className="text-gray-400">No live alerts yet.</p>
            ) : (
              alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="mb-4 bg-gray-800 p-4 rounded shadow border-l-4 border-yellow-400"
                >
                  <h3 className="text-xl font-semibold mb-2">
                    {alert.category.toUpperCase()}
                  </h3>
                  <ul className="list-disc list-inside">
                    {alert.articles.map((art, i) => (
                      <li key={i}>
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {art.title}
                        </a>{" "}
                        <span className="text-gray-400 text-sm">({art.source})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          {/* News Dashboard Section */}
          <section>
            <h2 className="text-3xl font-bold mb-6">News by Category</h2>
            {Object.entries(newsByCategory).length === 0 ? (
              <p className="text-gray-400">Loading news...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(newsByCategory).map(([category, articles]) => (
                  <div
                    key={category}
                    className="bg-gray-800 p-4 rounded shadow hover:shadow-lg transition"
                  >
                    <h3 className="text-2xl font-semibold mb-3 capitalize text-yellow-400">
                      {category}
                    </h3>
                    {articles.map((art, idx) => (
                      <div key={idx} className="mb-3">
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline font-medium"
                        >
                          {art.title}
                        </a>
                        <p className="text-gray-400 text-sm">{art.source.name || art.source}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }
