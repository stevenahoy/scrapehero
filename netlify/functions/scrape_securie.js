const { fetch } = require('undici');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://webahoy.org", // Ganti dengan domain kamu
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Token Auth
  const token = event.headers['authorization'];
  const expectedToken = `Bearer ${process.env.API_KEY}`;
  if (token !== expectedToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: { code: 401, message: "Unauthorized" }
      })
    };
  }

  const url = new URLSearchParams(event.queryStringParameters).get("url");
  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: { code: 400, message: "Missing URL parameter (?url=...)" }
      })
    };
  }

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

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: res.status, message: `Upstream error: ${res.statusText}` }
        })
      };
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.title || !article.textContent) {
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: 422, message: "Failed to extract article content" }
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          title: article.title.trim(),
          content: article.textContent.trim()
        }
      })
    };

  } catch (e) {
    console.error("FETCH ERROR:", e.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: { code: 500, message: "Internal error occurred" }
      })
    };
  }
};
