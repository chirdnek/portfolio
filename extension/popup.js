const lastUpdatedEl = document.getElementById("lastUpdated");
const updateTitleEl = document.getElementById("updateTitle");
const changelogEl = document.getElementById("changelog");
const cardEl = document.getElementById("updateCard");
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

function renderChangelog(changes) {
  changelogEl.innerHTML = "";
  if (!Array.isArray(changes) || changes.length === 0) {
    changelogEl.hidden = true;
    return;
  }
  for (const change of changes.slice(0, 6)) {
    const li = document.createElement("li");
    li.textContent = change;
    changelogEl.appendChild(li);
  }
  changelogEl.hidden = false;
}

async function render() {
  const { latestUpdate, lastUpdated, pendingUrl } =
    await chrome.storage.local.get(["latestUpdate", "lastUpdated", "pendingUrl"]);
  const data = latestUpdate || {};
  const ts = data.lastUpdated || lastUpdated;

  lastUpdatedEl.textContent = formatTimestamp(ts);
  updateTitleEl.textContent = data.title ? `“${data.title}”` : "";
  renderChangelog(data.changes);

  cardEl.classList.toggle("is-unseen", Boolean(pendingUrl));
}

visitBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_PORTFOLIO" });
  window.close();
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

(async () => {
  await render();
  // Opening the popup counts as "seen" — clear the badge but keep pendingUrl
  // intact only if the user hasn't visited yet. We mark seen on next interaction.
  chrome.action.setBadgeText({ text: "" });
})();
