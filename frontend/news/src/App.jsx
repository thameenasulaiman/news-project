import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

const BACKEND_URL = "https://news-project-5.onrender.com";
const socket = io(BACKEND_URL);

export default function App() {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState([]);
  const [frequency, setFrequency] = useState("immediate");
  const [alerts, setAlerts] = useState([]);
  const [newsByCategory, setNewsByCategory] = useState({});

  const availableCategories = ["politics", "sports", "technology", "business", "health"];

  // Fetch initial news
  useEffect(() => {
    (async () => {
      try {
        const newsData = {};
        for (const cat of availableCategories) {
          const res = await axios.get(`${BACKEND_URL}/news/${cat}`);
          newsData[cat] = res.data;
        }
        setNewsByCategory(newsData);
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    })();
  }, []);

  // Socket listener
  useEffect(() => {
    socket.on("news", (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 20));
    });
    return () => socket.off("news");
  }, []);

  const toggleCategory = (cat) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubscribe = async () => {
    if (!email || categories.length === 0) {
      alert("Enter email and select at least one category!");
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/subscribe`, { email, categories, frequency });
      alert(res.data.message);
    } catch (err) {
      alert("Subscription failed!");
    }
  };

  const handleUnsubscribe = async () => {
    if (!email || categories.length === 0) {
      alert("Enter email and select categories to unsubscribe!");
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/unsubscribe`, { email, categories });
      alert(res.data.message);
    } catch (err) {
      alert("Unsubscribe failed!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-gray-800 p-6 md:w-80 w-full">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">News Alerts</h1>

        <input
          type="email"
          placeholder="Your email"
          className="w-full p-3 mb-4 rounded bg-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <h2 className="text-xl mb-2">Select Categories:</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {availableCategories.map((cat) => (
            <label key={cat} className="bg-gray-700 px-3 py-1 rounded cursor-pointer">
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

        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700"
        >
          <option value="immediate">Immediate</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
        </select>

        <div className="flex gap-2">
          <button onClick={handleSubscribe} className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold">
            Subscribe
          </button>
          <button onClick={handleUnsubscribe} className="flex-1 bg-red-600 hover:bg-red-700 p-3 rounded font-bold">
            Unsubscribe
          </button>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="flex-1 p-6 overflow-auto">
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-yellow-400">Live Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-400">No live alerts yet.</p>
          ) : (
            alerts.map((alert, idx) => (
              <div key={idx} className="mb-4 bg-gray-800 p-4 rounded border-l-4 border-yellow-400">
                <h3 className="text-xl font-semibold mb-2">{alert.category.toUpperCase()}</h3>
                <ul className="list-disc list-inside">
                  {alert.articles.map((a, i) => (
                    <li key={i}>
                      <a href={a.url} target="_blank" className="text-blue-400 hover:underline">
                        {a.title}
                      </a>{" "}
                      <span className="text-gray-400 text-sm">({a.source})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">News by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(newsByCategory).map(([category, articles]) => (
              <div key={category} className="bg-gray-800 p-4 rounded shadow">
                <h3 className="text-2xl font-semibold mb-3 capitalize text-yellow-400">{category}</h3>
                {articles.map((a, idx) => (
                  <div key={idx} className="mb-3">
                    <a href={a.url} target="_blank" className="text-blue-400 hover:underline font-medium">
                      {a.title}
                    </a>
                    <p className="text-gray-400 text-sm">{a.source.name || a.source}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
