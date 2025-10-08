import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./index.css";

const socket = io("https://news-project-5.onrender.com");

export default function App() {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState([]);
  const [frequency, setFrequency] = useState("immediate");
  const [news, setNews] = useState([]);

  useEffect(() => {
    socket.on("news", (data) => {
      console.log(" New News:", data);
      setNews((prev) => [data, ...prev]);
    });
    return () => socket.off("news");
  }, []);

  const handleSubscribe = async () => {
    if (!email || categories.length === 0) {
      alert("Please enter email and select at least one category!");
      return;
    }
    try {
      const res = await axios.post("https://news-project-5.onrender.com/subscribe", {
        email,
        categories,
        frequency,
      });
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Subscription failed.");
    }
  };

  const toggleCategory = (cat) =>
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">:) Real-Time News Alerts</h1>

      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-lg">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <h3 className="text-xl font-serif mb-2">Select Categories:</h3>
        <div className="flex font-mono flex-wrap gap-2 mb-4">
          {["politics", "sports", "technology", "business", "health"].map((cat) => (
            <label key={cat} className="bg-gray-700 px-3 py-1 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="mr-1"
              />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </label>
          ))}
        </div>

        <h3 className="text-xl font-serif mb-2">Alert Frequency:</h3>
        <select
          className="w-full font-mono p-3 rounded bg-gray-700 text-white mb-4"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          <div className="font-mono">
          <option value="immediate">Immediate</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option></div>
        </select>

        <button
          onClick={handleSubscribe}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-serif  "
        >
          Subscribe
        </button>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">$ Latest Alerts</h2>
      <div className="w-full max-w-3xl space-y-4">
        {news.length === 0 ? (
          <p className="text-gray-400 text-center">No news yet...</p>
        ) : (
          news.map((n, i) => (
            <div key={i} className="bg-gray-800 p-4 rounded-xl shadow-md">
              <h3 className="text-yellow-400 text-lg font-semibold">
                {n.category.toUpperCase()}
              </h3>
              {n.articles?.map((a, idx) => (
                <div key={idx} className="mt-2">
                  <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-400">
                    {a.title}
                  </a>{" "}
                  <span className="text-gray-400 text-sm">({a.source})</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
