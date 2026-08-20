const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "server-data.json");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function emptyData() {
  return {
    updatedAt: null,
    data: {
      schedules: [],
      messages: [],
      logs: [],
      settings: {},
      tombstones: {
        schedules: [],
        messages: []
      }
    }
  };
}

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...emptyData(),
      ...parsed,
      data: { ...emptyData().data, ...(parsed.data || {}) }
    };
  } catch {
    return emptyData();
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const urlPath = decodeURIComponent(requestUrl.pathname);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  if (urlPath === "/api/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (urlPath === "/api/state" && req.method === "GET") {
    return sendJson(res, 200, readData());
  }

  if (urlPath === "/api/state" && req.method === "POST") {
    try {
      const incoming = await readBody(req);
      const next = {
        updatedAt: new Date().toISOString(),
        data: {
          schedules: Array.isArray(incoming.data?.schedules) ? incoming.data.schedules : [],
          messages: Array.isArray(incoming.data?.messages) ? incoming.data.messages : [],
          logs: Array.isArray(incoming.data?.logs) ? incoming.data.logs : [],
          settings: incoming.data?.settings && typeof incoming.data.settings === "object" ? incoming.data.settings : {},
          tombstones: {
            schedules: Array.isArray(incoming.data?.tombstones?.schedules) ? incoming.data.tombstones.schedules : [],
            messages: Array.isArray(incoming.data?.tombstones?.messages) ? incoming.data.tombstones.messages : []
          }
        }
      };
      writeData(next);
      return sendJson(res, 200, next);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relative);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`老板日程同步后端已启动：http://localhost:${PORT}`);
  console.log(`手机请访问：http://<电脑局域网IP>:${PORT}`);
});
