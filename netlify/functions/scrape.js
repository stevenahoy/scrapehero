// Required dependencies
const { fetch } = require('undici');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const jwt = require('jsonwebtoken');
const rateLimitMap = new Map();

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "https://webahoy.org",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

async function sendTelegramLog(message) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    });
  } catch (err) {
    console.error("Telegram log failed:", err.message);
  }
}

exports.handler = async function(event, context) {
  const ip = event.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // JWT Verification
  const token = event.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    await sendTelegramLog(`🚫 401 Unauthorized (Missing Token) | IP: ${ip}`);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: { code: 401, message: "Missing or invalid token" }
      })
    };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    await sendTelegramLog(`🚫 401 Invalid JWT | IP: ${ip}`);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: { code: 401, message: "Unauthorized: Invalid token" }
      })
    };
  }

  const username = decoded.username;
  const userPlan = decoded.plan || "free";

  // Rate Limiting - Global (by IP)
  const globalKey = `ip:${ip}`;
  const requestInfo = rateLimitMap.get(globalKey) || { count: 0, startTime: now };
  if (now - requestInfo.startTime < 5 * 60 * 1000) {
    if (requestInfo.count >= 100) {
      await sendTelegramLog(`🚫 429 IP Rate Limit | IP: ${ip}`);
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: 429, message: "Rate limit exceeded. Try again in 5 minutes." }
        })
      };
    }
    requestInfo.count++;
  } else {
    requestInfo.count = 1;
    requestInfo.startTime = now;
  }
  rateLimitMap.set(globalKey, requestInfo);

  // Rate Limiting - User (for free plan)
  if (userPlan === "free") {
    const userKey = `user:${username}`;
    const userInfo = rateLimitMap.get(userKey) || { count: 0, startTime: now };
    if (now - userInfo.startTime < 5 * 60 * 1000) {
      if (userInfo.count >= 3) {
        await sendTelegramLog(`🚫 429 Free Plan Limit | IP: ${ip} | User: ${username}`);
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            success: false,
            error: { code: 429, message: "Free plan limit: max 3 scrapes per 5 minutes." }
          })
        };
      }
      userInfo.count++;
    } else {
      userInfo.count = 1;
      userInfo.startTime = now;
    }
    rateLimitMap.set(userKey, userInfo);
  }

  const url = new URLSearchParams(event.queryStringParameters).get("url");
  if (!url) {
    await sendTelegramLog(`⚠️ 400 Missing URL | IP: ${ip}`);
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
      await sendTelegramLog(`⚠️ ${res.status} Upstream error: ${url} | IP: ${ip}`);
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
      await sendTelegramLog(`⚠️ 422 Failed to extract content | ${url} | IP: ${ip}`);
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({
          success: false,
          error: { code: 422, message: "Failed to extract article content" }
        })
      };
    }

    await sendTelegramLog(`✅ 200 Success | ${url} | IP: ${ip} | User: ${username}`);
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
    await sendTelegramLog(`🔥 500 Internal Error | ${url} | IP: ${ip}`);
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
