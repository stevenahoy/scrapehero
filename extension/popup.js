document.getElementById("scrapeBtn").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const response = await fetch(`https://your-app.netlify.app/.netlify/functions/scrape?url=${encodeURIComponent(tab.url)}`);
  const text = await response.text();
  document.getElementById("output").textContent = text;
};
