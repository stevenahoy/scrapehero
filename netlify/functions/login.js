const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET;
const headers = { "Content-Type": "application/json" };

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  const { username, password } = JSON.parse(event.body);
  const usersFile = path.join(__dirname, "users.json");
  const users = JSON.parse(fs.readFileSync(usersFile));

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, error: "Invalid credentials" })
    };
  }

  const token = jwt.sign(
    { username: user.username, plan: user.plan },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, token })
  };
};
