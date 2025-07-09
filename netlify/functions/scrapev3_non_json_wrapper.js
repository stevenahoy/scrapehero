const { fetch } = require('undici');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

exports.handler = async function(event) {
  const url = new URLSearchParams(event.queryStringParameters).get("url");
  if (!url) return { statusCode: 400, body: "Missing URL" };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                      "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
                  "image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Referer": "https://www.google.com/"
      }
    });

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const output = `📰 ${article?.title || "Untitled"}\n\n🧾 ${article?.textContent || "No main content found."}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: output
    };

  } catch (e) {
    console.error("FETCH ERROR:", e.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "Failed to fetch: " + e.message
    };
  }
};
