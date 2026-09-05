const TARGET = process.env.PING_URL || "https://ticket-pilot-mn25.onrender.com";
const INTERVAL_MS = Number(process.env.PING_INTERVAL || 240000); // default 4 min
const ONCE = process.argv.includes("--once");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:119.0) Gecko/20100101 Firefox/119.0",
  "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/5.0 Chrome/85.0 Safari/537.36",
];

const PATHS = ["/api/ping", "/", "/login", "/register"];

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function randomIp() {
  const ranges = [
    [16777216, 184549375], // 1.0.0.0 - 10.255.255.255
    [2130706432, 2147483647], // 127.0.0.0 - 127.255.255.255 (loopback)
    [2886729728, 2886729983], // 172.16.0.0 - 172.31.255.255
    [3232235520, 3232301055], // 192.168.0.0 - 192.168.255.255
  ];
  const [min, max] = ranges[randInt(ranges.length)];
  const n = min + randInt(max - min);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

async function ping() {
  const path = PATHS[randInt(PATHS.length)];
  const url = `${TARGET}${path}`;
  const headers = {
    "User-Agent": USER_AGENTS[randInt(USER_AGENTS.length)],
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    "X-Forwarded-For": randomIp(),
    "X-Real-IP": randomIp(),
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
  };
  const ts = Date.now();
  try {
    const res = await fetch(url, {
      headers,
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    console.log(
      `[${new Date(ts).toISOString()}] ${res.status} ${path} (${res.headers.get("x-render-origin-server") || "?"})`
    );
  } catch (e) {
    console.error(`[${new Date(ts).toISOString()}] FAIL ${path}: ${e.message}`);
  }
}

async function run() {
  await ping();
  if (ONCE) return;
  setTimeout(run, INTERVAL_MS + randInt(30000)); // kleine Varianz
}

run();