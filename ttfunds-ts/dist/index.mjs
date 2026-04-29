// src/types.ts
var DEFAULT_CONFIG = {
  timeout: 1e4,
  retries: 3,
  maxWorkersRealtime: 5,
  maxWorkersHistory: 3
};

// src/config.ts
var config = { ...DEFAULT_CONFIG };
function configure(options) {
  config = { ...config, ...options };
  return config;
}
function getConfig() {
  return config;
}
function resetConfig() {
  config = { ...DEFAULT_CONFIG };
  return config;
}

// src/fetcher.ts
var BASE_URL = "https://fund.eastmoney.com/pingzhongdata/{}.js";
var REALTIME_URL = "https://fundgz.1234567.com.cn/js/{}.js";
var FUND_LIST_URL = "https://fund.eastmoney.com/js/fundcode_search.js";
function extractJsValue(text, key) {
  const start = text.indexOf(key);
  if (start === -1) return null;
  let idx = text.indexOf("=", start);
  if (idx === -1) return null;
  idx += 1;
  while (idx < text.length && text[idx].trim() === "") {
    idx += 1;
  }
  if (idx >= text.length) return null;
  const opening = text[idx];
  const pairs = { "[": "]", "{": "}", "(": ")" };
  if (!(opening in pairs)) {
    let end = text.indexOf(";", idx);
    if (end === -1) end = text.length;
    return text.slice(idx, end).trim();
  }
  const closing = pairs[opening];
  let depth = 0;
  let inString = false;
  let stringQuote = "";
  let escape = false;
  for (let i = idx; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === stringQuote) {
        inString = false;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      inString = true;
      stringQuote = ch;
      continue;
    }
    if (ch === opening) {
      depth += 1;
    } else if (ch === closing) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(idx, i + 1);
      }
    }
  }
  return null;
}
async function fetchWithRetry(url) {
  const { timeout, retries } = getConfig();
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "*/*"
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Fetch failed for ${url}:`, error);
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    }
  }
  return null;
}
async function getFundRealtime(code) {
  const url = REALTIME_URL.replace("{}", code);
  const text = await fetchWithRetry(url);
  if (!text) return null;
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const dataStr = text.slice(start, end + 1);
    const data = JSON.parse(dataStr);
    return data;
  } catch (error) {
    console.error(`Error parsing realtime data for ${code}:`, error);
    return null;
  }
}
async function getFundHistory(code) {
  const url = BASE_URL.replace("{}", code);
  const text = await fetchWithRetry(url);
  if (!text) return null;
  try {
    const networthRaw = extractJsValue(text, "Data_netWorthTrend");
    if (!networthRaw) {
      throw new Error("Data_netWorthTrend not found");
    }
    const networthData = JSON.parse(networthRaw);
    const cumRaw = extractJsValue(text, "Data_ACWorthTrend");
    if (!cumRaw) {
      throw new Error("Data_ACWorthTrend not found");
    }
    const cumData = JSON.parse(cumRaw.replace(/'/g, '"'));
    const cumulativeMap = /* @__PURE__ */ new Map();
    cumData.forEach((item) => {
      cumulativeMap.set(item[0], item[1]);
    });
    const result = networthData.map((item) => ({
      x: item.x,
      y: item.y,
      equityReturn: item.equityReturn ?? null,
      unitMoney: item.unitMoney ?? null,
      cumulative: cumulativeMap.get(item.x) ?? null
    }));
    return result;
  } catch (error) {
    console.error(`Error processing history data for ${code}:`, error);
    return null;
  }
}
async function getFundList() {
  const text = await fetchWithRetry(FUND_LIST_URL);
  if (!text) return null;
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return null;
    const jsonStr = text.slice(start, end + 1);
    const rawData = JSON.parse(jsonStr);
    const data = rawData.map((item) => ({
      fund_code: item[0],
      abbr: item[1],
      name: item[2],
      type: item[3],
      pinyin: item[4]
    }));
    return data;
  } catch (error) {
    console.error("Error processing fund list:", error);
    return null;
  }
}
async function batchGetFundRealtime(codes, concurrency) {
  const { maxWorkersRealtime } = getConfig();
  const limit = concurrency ?? maxWorkersRealtime;
  const results = {};
  for (let i = 0; i < codes.length; i += limit) {
    const batch = codes.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(async (code) => ({
        code,
        data: await getFundRealtime(code)
      }))
    );
    batchResults.forEach(({ code, data }) => {
      results[code] = data;
    });
  }
  return results;
}
async function batchGetFundHistory(codes, concurrency) {
  const { maxWorkersHistory } = getConfig();
  const limit = concurrency ?? maxWorkersHistory;
  const results = {};
  for (let i = 0; i < codes.length; i += limit) {
    const batch = codes.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(async (code) => ({
        code,
        data: await getFundHistory(code)
      }))
    );
    batchResults.forEach(({ code, data }) => {
      results[code] = data;
    });
  }
  return results;
}
export {
  DEFAULT_CONFIG,
  batchGetFundHistory,
  batchGetFundRealtime,
  configure,
  getConfig,
  getFundHistory,
  getFundList,
  getFundRealtime,
  resetConfig
};
