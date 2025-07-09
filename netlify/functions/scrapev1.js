const { fetch } = require('undici');
const { JSDOM } = require('jsdom');

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
    const dom = new JSDOM(html);
    const cleanText = dom.window.document.body.textContent.replace(/\s+/g, ' ').trim();

    return {
      statusCode: 200,
      body: cleanText
    };

  } catch (e) {
    console.error("FETCH ERROR:", e.message);
    return {
      statusCode: 500,
      body: "Failed to fetch: " + e.message
    };
  }
};
