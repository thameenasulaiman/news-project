import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./index.css";
const socket = io("https://news-project-3.onrender.com"); 

function App() {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState([]);
  const [frequency, setFrequency] = useState("immediate");
  const [news, setNews] = useState([]);

  useEffect(() => {
    socket.on("news", (data) => {
      console.log("Received news:", data);
      setNews((prev) => [data, ...prev]);
    });
    return () => socket.off("news");
  }, []);

  const handleSubscribe = async () => {
    if (!email || categories.length === 0) {
      alert("Please enter your email and select at least one category.");
      return;
    }
    try {
      const response = await axios.post("https://news-project-3.onrender.com/subscribe", {
        email,
        categories,
        frequency,
      });
      alert(response.data.message);
    } catch (err) {
      console.error(err);
      alert(
        `Subscription failed: ${err.response ? err.response.data.message : err.message}`
      );
    }
  };

  const handleCategoryChange = (cat) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="container">
      <h1>:) Real-Time News Alerts</h1>

      <div className="subscribe-form">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <h3>Select Categories:</h3>
        <div className="categories">
          {["politics",
           "sports", 
           "technology",
            "business", 
            "health",
             "science", 
             "entertainment"].map(
            (cat) => (
              <label key={cat}>
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                />{" "}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </label>
            )
          )}
        </div>

        <h3>Alert Frequency:</h3>
        <div className="custom-select">
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="immediate">Immediate</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
        </select>
        </div>

        <button onClick={handleSubscribe}>Subscribe</button>
      </div>

      <h2>^-^ Latest News Alerts</h2>
      <div className="news-list">
        {news.length === 0 && <p>No real-time news yet. Subscribe to categories above!</p>}
        {news.map((n, index) => (
          <div key={index} className="news-card">
            <h3>{n.category.toUpperCase()}</h3>
            {n.articles && n.articles.length > 0 ? (
              <>
                <p>
                  <strong>{n.articles[0].title}</strong> (Source: {n.articles[0].source})
                </p>
                <a href={n.articles[0].url} target="_blank" rel="noreferrer">
                  Read more
                </a>
              </>
            ) : (
              <p>No articles found for this category.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
