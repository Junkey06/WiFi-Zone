(function () {
  "use strict";

  const API_BASE = "http://192.168.10.8:7071/api/wifi";
  const REGISTER_URL = API_BASE + "/visitors-register";
  const COUNT_URL = API_BASE + "/visitors-count";

  const VISITOR_ID_KEY = "visitorId";
  const LAST_CONNECTION_KEY = "lastconnection";
  const LAST_COUNT_KEY = "lastVisitorsCount";

  function todayKey() {
    // YYYY-MM-DD used to avoid duplicate register calls during same day.
    return new Date().toISOString().slice(0, 10);
  }

  function generateVisitorId() {
    // Keep visitorId as a positive integer.
    return Math.floor(Math.random() * 1000000000);
  }

  function getOrCreateVisitorId() {
    try {
      const existing = localStorage.getItem(VISITOR_ID_KEY);
      const existingNum = Number(existing);
      if (Number.isInteger(existingNum) && existingNum >= 0) return existingNum;
      const created = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, String(created));
      return created;
    } catch (err) {
      return generateVisitorId();
    }
  }

  function getCounterNodes() {
    return document.querySelectorAll("[data-online-visitors], #onlineVisitorsCount");
  }

  function setCountInUi(value) {
    const nodes = getCounterNodes();
    const text = String(value);
    nodes.forEach(function (node) {
      node.textContent = text;
    });
  }

  function setUiUnavailable() {
    const nodes = getCounterNodes();
    nodes.forEach(function (node) {
      if (!node.textContent || node.textContent === "…") node.textContent = "--";
    });
  }

  function saveLastCount(value) {
    try {
      localStorage.setItem(LAST_COUNT_KEY, String(value));
    } catch (err) {}
  }

  function readLastCount() {
    try {
      const raw = localStorage.getItem(LAST_COUNT_KEY);
      if (!raw) return null;
      const num = Number(raw);
      return Number.isFinite(num) ? num : null;
    } catch (err) {
      return null;
    }
  }

  function normalizeCount(payload) {
    if (!payload || typeof payload !== "object") return null;
    const candidates = [
      payload.totalVisitors,
      payload.visitorsCount,
      payload.count,
      payload.total
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const num = Number(candidates[i]);
      if (Number.isFinite(num) && num >= 0) return num;
    }
    return null;
  }

  async function registerVisitorIfNeeded(visitorId) {
    const currentDay = todayKey();
    try {
      const lastDay = localStorage.getItem(LAST_CONNECTION_KEY);
      if (lastDay === currentDay) return;
    } catch (err) {}

    try {
      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: visitorId
        })
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      try {
        localStorage.setItem(LAST_CONNECTION_KEY, currentDay);
      } catch (err) {}
    } catch (err) {
      console.warn("[visitors] register failed:", err);
    }
  }

  async function refreshVisitorsCount() {
    try {
      const res = await fetch(COUNT_URL, { method: "GET" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const count = normalizeCount(data);
      if (count === null) throw new Error("Invalid count payload");
      setCountInUi(count);
      saveLastCount(count);
    } catch (err) {
      const fallback = readLastCount();
      if (fallback !== null) setCountInUi(fallback);
      else setUiUnavailable();
      console.warn("[visitors] count fetch failed:", err);
    }
  }

  async function startVisitorsTracking() {
    const visitorId = getOrCreateVisitorId();
    await registerVisitorIfNeeded(visitorId);
    await refreshVisitorsCount();
  }

  document.addEventListener("DOMContentLoaded", function () {
    startVisitorsTracking();
  });

  window.visitorsTracker = {
    start: startVisitorsTracking,
    refresh: refreshVisitorsCount
  };
})();
