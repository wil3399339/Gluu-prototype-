// Save as App.js or index.js (React)

import React, { useState, useEffect } from "react";

const fakeVideos = [
  { id: 1, uploader: "bot_1", url: "https://random.video/1234", description: "Bot video #1" },
  { id: 2, uploader: "bot_2", url: "https://random.video/5678", description: "Bot video #2" },
];

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [coins, setCoins] = useState(user?.coins || 0);
  const [followers, setFollowers] = useState(user?.followers || 0);
  const [botFollowsEnabled, setBotFollowsEnabled] = useState(user?.botFollowsEnabled ?? true);
  const [videos, setVideos] = useState(fakeVideos);
  const [messages, setMessages] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  useEffect(() => {
    if (user) {
      // Simulate coins & followers increasing every minute
      const interval = setInterval(() => {
        if (botFollowsEnabled) setFollowers((f) => f + 10);
        setCoins((c) => c + 5);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [user, botFollowsEnabled]);

  useEffect(() => {
    // Save user updates to localStorage
    if (user) {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, coins, followers, botFollowsEnabled })
      );
    }
  }, [coins, followers, botFollowsEnabled, user]);

  function handleLogin(e) {
    e.preventDefault();
    // Fake login: any username/password accepted
    const loggedInUser = {
      username: loginForm.username,
      coins: 0,
      followers: 0,
      botFollowsEnabled: true,
    };
    setUser(loggedInUser);
    setCoins(0);
    setFollowers(0);
    setBotFollowsEnabled(true);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  function toggleBotFollows() {
    setBotFollowsEnabled((enabled) => !enabled);
  }

  if (!user) {
    return (
      <div>
        <h1>Login to Gluu (Static Demo)</h1>
        <form onSubmit={handleLogin}>
          <input
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {user.username}</h1>
      <button onClick={handleLogout}>Logout</button>

      <h2>Stats</h2>
      <p>Coins: {coins}</p>
      <p>Followers: {followers}</p>
      <label>
        <input
          type="checkbox"
          checked={botFollowsEnabled}
          onChange={toggleBotFollows}
        />
        Bot Followers Enabled
      </label>

      <h2>Videos</h2>
      <ul>
        {videos.map((v) => (
          <li key={v.id}>
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              {v.description}
            </a>{" "}
            by <b>{v.uploader}</b>
          </li>
        ))}
      </ul>

      <h2>Messages (Local)</h2>
      {messages.length === 0 && <p>No messages yet.</p>}
    </div>
  );
}

export default App;
