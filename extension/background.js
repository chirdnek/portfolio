importScripts("config.js");

const ALARM_NAME = "time-stone-poll";
const STORAGE_KEY = "lastUpdated";
const LATEST_KEY = "latestUpdate";

const MYSTICAL_TITLES = [
  "The Time Stone Stirs",
  "A Ripple in the Timestream",
  "The Eye of Agamotto Opens",
  "Reality Has Shifted",
  "The Sanctum Sends Word"
];

const MYSTICAL_BODIES = [
  "The portfolio has been rewoven across the threads of time.",
  "New work emerges from the multiverse. Witness it.",
  "Dormammu... I've come to bargain. The portfolio is updated.",
  "By the Vishanti, fresh creations have been bound to reality.",
  "The mystic arts have shaped something new. Step into the Sanctum."
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function checkForUpdate() {
  const url = `${CONFIG.PORTFOLIO_URL}${CONFIG.UPDATES_PATH}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.lastUpdated) return;

    const stored = await chrome.storage.local.get([STORAGE_KEY]);
    const previous = stored[STORAGE_KEY];

    await chrome.storage.local.set({ [LATEST_KEY]: data });

    if (!previous) {
      await chrome.storage.local.set({ [STORAGE_KEY]: data.lastUpdated });
      return;
    }

    if (previous !== data.lastUpdated) {
      await chrome.storage.local.set({ [STORAGE_KEY]: data.lastUpdated });
      fireNotification(data);
    }
  } catch (err) {
    console.warn("[Time Stone] Failed to read the timestream:", err);
  }
}

function fireNotification(data) {
  const title = data.title || pick(MYSTICAL_TITLES);
  const message = data.message || pick(MYSTICAL_BODIES);
  chrome.notifications.create("time-stone-update", {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message,
    priority: 2
  });
}

chrome.notifications.onClicked.addListener((id) => {
  if (id === "time-stone-update") {
    chrome.tabs.create({ url: CONFIG.PORTFOLIO_URL });
    chrome.notifications.clear(id);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 1,
    periodInMinutes: CONFIG.POLL_INTERVAL_MINUTES
  });
  checkForUpdate();
});

chrome.runtime.onStartup.addListener(() => {
  checkForUpdate();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) checkForUpdate();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "FORCE_CHECK") {
    checkForUpdate().then(() => sendResponse({ ok: true }));
    return true;
  }
});
