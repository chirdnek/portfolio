// Edit PORTFOLIO_URL to match your deployed portfolio.
// The extension will poll `${PORTFOLIO_URL}/updates.json`.
const CONFIG = {
  PORTFOLIO_URL: "https://portfolio-chirdneks-projects.vercel.app",
  UPDATES_PATH: "/updates.json",
  POLL_INTERVAL_MINUTES: 240 // 4 hours
};

if (typeof self !== "undefined") self.CONFIG = CONFIG;
