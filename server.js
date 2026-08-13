const path = require("node:path");
const { statSync } = require("node:fs");

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const PUBLIC_DIR = process.env.PUBLIC_DIR;
const links = new Map();

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function resolveBaseUrl() {
  if (process.env.BASE_URL) {
    try {
      return new URL(process.env.BASE_URL).origin;
    } catch {
      console.warn("Invalid BASE_URL, falling back to defaults.");
    }
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  return `http://localhost:${PORT}`;
}

const BASE_URL = resolveBaseUrl();

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function randomCode() {
  let value = "";
  for (let i = 0; i < 6; i += 1) {
    value += BASE62[Math.floor(Math.random() * BASE62.length)];
  }
  return value;
}

function generateUniqueCode() {
  let code = randomCode();
  while (links.has(code)) {
    code = randomCode();
  }
  return code;
}

function isHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function safeStaticPath(urlPathname) {
  if (!PUBLIC_DIR) {
    return null;
  }

  const relPath = urlPathname === "/" ? "index.html" : decodeURIComponent(urlPathname.slice(1));
  const absPublicDir = path.resolve(PUBLIC_DIR);
  const filePath = path.resolve(absPublicDir, relPath);

  if (!filePath.startsWith(absPublicDir)) {
    return null;
  }

  try {
    if (statSync(filePath).isFile()) {
      return filePath;
    }
  } catch {
    return null;
  }

  return null;
}

async function handler(req) {
  const url = new URL(req.url);
  const { pathname } = url;

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (PUBLIC_DIR) {
    const staticPath = safeStaticPath(pathname);
    if (staticPath) {
      const file = Bun.file(staticPath);
      return new Response(file, {
        status: 200,
        headers: {
          ...corsHeaders(),
          ...(file.type ? { "Content-Type": file.type } : {}),
        },
      });
    }
  }

  if (req.method === "POST" && pathname === "/api/links") {
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, { error: "Invalid JSON" });
    }

    const incomingUrl = body && typeof body.url === "string" ? body.url.trim() : "";
    if (!isHttpUrl(incomingUrl)) {
      return jsonResponse(400, { error: "URL must start with http:// or https://" });
    }

    const code = generateUniqueCode();
    const record = {
      code,
      url: incomingUrl,
      shortUrl: `${BASE_URL}/${code}`,
      hits: 0,
      createdAt: new Date().toISOString(),
    };

    links.set(code, record);
    return jsonResponse(201, record);
  }

  if (req.method === "GET" && pathname === "/api/links") {
    return jsonResponse(200, Array.from(links.values()));
  }

  if (req.method === "GET" && pathname !== "/") {
    const code = decodeURIComponent(pathname.slice(1));
    if (code && links.has(code)) {
      const record = links.get(code);
      record.hits += 1;
      return new Response(null, {
        status: 302,
        headers: {
          Location: record.url,
          ...corsHeaders(),
        },
      });
    }
  }

  return jsonResponse(404, { error: "Not found" });
}

Bun.serve({
  port: PORT,
  fetch: handler,
});

console.log(`Snip backend listening on ${PORT}`);
