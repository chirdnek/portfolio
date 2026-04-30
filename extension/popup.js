const lastUpdatedEl = document.getElementById("lastUpdated");
const updateTitleEl = document.getElementById("updateTitle");
const visitBtn = document.getElementById("visitBtn");
const refreshBtn = document.getElementById("refreshBtn");

function formatTimestamp(iso) {
  if (!iso) return "The threads are silent.";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

async function render() {
  const { latestUpdate, lastUpdated } = await chrome.storage.local.get([
    "latestUpdate",
    "lastUpdated"
  ]);
  const data = latestUpdate || {};
  const ts = data.lastUpdated || lastUpdated;
  lastUpdatedEl.textContent = formatTimestamp(ts);
  updateTitleEl.textContent = data.title ? `“${data.title}”` : "";
}

visitBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: CONFIG.PORTFOLIO_URL });
});

refreshBtn.addEventListener("click", async () => {
  refreshBtn.textContent = "Consulting…";
  refreshBtn.disabled = true;
  try {
    await chrome.runtime.sendMessage({ type: "FORCE_CHECK" });
    await render();
  } finally {
    refreshBtn.textContent = "Consult the Eye";
    refreshBtn.disabled = false;
  }
});

render();
