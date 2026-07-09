// ============================================================
// Stock Signal — 뉴스 + 가격 추이 기반 매수/매도/홀드 판단 앱
// ============================================================

const $ = (id) => document.getElementById(id);
const els = {
  ticker: $("ticker"),
  range: $("range"),
  fetchBtn: $("fetch-btn"),
  priceStatus: $("price-status"),
  pricePreview: $("price-preview"),
  priceSummary: $("price-summary"),
  chartContainer: $("chart-container"),
  priceChart: $("price-chart"),
  autoNews: $("auto-news"),
  newsList: $("news-list"),
  newsAutoStatus: $("news-auto-status"),
  statsCard: $("stats-card"),
  statsGrid: $("stats-grid"),
  statsStatus: $("stats-status"),
  news: $("news"),
  apiKey: $("api-key"),
  model: $("model"),
  saveKeyBtn: $("save-key-btn"),
  clearKeyBtn: $("clear-key-btn"),
  keyStatus: $("key-status"),
  avKey: $("av-key"),
  saveAvBtn: $("save-av-btn"),
  clearAvBtn: $("clear-av-btn"),
  avKeyStatus: $("av-key-status"),
  analyzeBtn: $("analyze-btn"),
  resultCard: $("result-card"),
  finalVerdict: $("final-verdict"),
  ruleSignal: $("rule-signal"),
  ruleReasons: $("rule-reasons"),
  claudeBlock: $("claude-block"),
  claudeSignal: $("claude-signal"),
  claudeReasons: $("claude-reasons"),
  rawIndicators: $("raw-indicators"),
};

const STORAGE_KEYS = { apiKey: "stocksignal.apiKey", model: "stocksignal.model" };

// State (var so headless tests can seed via window.*)
var priceData = null;
var newsData = null;
var statsData = null;

// ---------- API key handling ----------
function loadKey() {
  const key = localStorage.getItem(STORAGE_KEYS.apiKey);
  const model = localStorage.getItem(STORAGE_KEYS.model);
  if (key) {
    els.apiKey.value = key;
    els.keyStatus.textContent = "저장된 키 사용 중.";
  }
  if (model) els.model.value = model;
}
els.saveKeyBtn.addEventListener("click", () => {
  const k = els.apiKey.value.trim();
  if (!k) { els.keyStatus.textContent = "키를 먼저 입력하세요."; return; }
  localStorage.setItem(STORAGE_KEYS.apiKey, k);
  localStorage.setItem(STORAGE_KEYS.model, els.model.value);
  els.keyStatus.textContent = "저장 완료. 이 브라우저에만 남습니다.";
});
els.clearKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.apiKey);
  localStorage.removeItem(STORAGE_KEYS.model);
  els.apiKey.value = "";
  els.keyStatus.textContent = "저장된 키를 삭제했습니다.";
});

// Alpha Vantage key handlers
function loadAvKey() {
  const k = localStorage.getItem("stocksignal.avKey");
  if (k) { els.avKey.value = k; els.avKeyStatus.textContent = "저장된 키 사용 중."; }
}
els.saveAvBtn.addEventListener("click", () => {
  const k = els.avKey.value.trim();
  if (!k) { els.avKeyStatus.textContent = "키를 먼저 입력하세요."; return; }
  localStorage.setItem("stocksignal.avKey", k);
  els.avKeyStatus.textContent = "저장 완료. 이 브라우저에만 남습니다.";
});
els.clearAvBtn.addEventListener("click", () => {
  localStorage.removeItem("stocksignal.avKey");
  els.avKey.value = "";
  els.avKeyStatus.textContent = "저장된 키를 삭제했습니다.";
});

// ---------- Data source: Alpha Vantage (CORS-enabled, no proxy needed) ----------
const AV_KEY_STORAGE = "stocksignal.avKey";

function getAvKey() {
  const k = localStorage.getItem(AV_KEY_STORAGE);
  if (!k) throw new Error("Alpha Vantage API 키가 필요합니다. 아래 '데이터 소스 API 키' 섹션에서 무료 발급 후 저장하세요.");
  return k;
}

function checkAvError(json) {
  if (json?.Note) throw new Error("Alpha Vantage 일일 한도 초과 (25/day 무료). 내일 다시 시도하세요.");
  if (json?.Information) throw new Error("AV: " + String(json.Information).slice(0, 200));
  if (json?.["Error Message"]) throw new Error("AV: " + String(json["Error Message"]).slice(0, 200));
}

async function fetchYahoo(ticker, range) {
  const apiKey = getAvKey();
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=compact&apikey=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Alpha Vantage HTTP ${resp.status}`);
  const json = await resp.json();
  checkAvError(json);
  const series = json?.["Time Series (Daily)"];
  if (!series) throw new Error("가격 시계열이 비어있습니다. 티커를 확인하세요.");

  const days = { "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365 }[range] || 90;
  const entries = Object.entries(series)
    .sort((a, b) => a[0].localeCompare(b[0])) // ascending by date
    .slice(-days);
  const prices = entries.map(([date, v]) => ({
    date: new Date(date),
    open: parseFloat(v["1. open"]),
    high: parseFloat(v["2. high"]),
    low: parseFloat(v["3. low"]),
    close: parseFloat(v["4. close"]),
    volume: parseFloat(v["5. volume"]),
  })).filter((p) => ["open", "high", "low", "close"].every((k) => !isNaN(p[k])));

  if (prices.length < 5) throw new Error("가격 데이터가 부족합니다.");
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  return {
    ticker: json?.["Meta Data"]?.["2. Symbol"] || ticker.toUpperCase(),
    currency: "USD",
    exchange: "",
    prices,
    meta: {
      regularMarketPrice: last.close,
      previousClose: prev?.close,
      dayHigh: last.high,
      dayLow: last.low,
      dayVolume: last.volume,
      // fiftyTwoWeekHigh/Low populated later from OVERVIEW fetch
    },
  };
}

async function fetchStats(ticker) {
  const apiKey = getAvKey();
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`AV OVERVIEW HTTP ${resp.status}`);
  const j = await resp.json();
  checkAvError(j);
  if (!j?.Symbol) throw new Error("OVERVIEW 데이터가 없습니다 (해외 상장 티커일 경우 지원 안 될 수 있음).");
  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? undefined : n; };

  const sb = num(j.AnalystRatingStrongBuy) || 0;
  const b = num(j.AnalystRatingBuy) || 0;
  const h = num(j.AnalystRatingHold) || 0;
  const s = num(j.AnalystRatingSell) || 0;
  const ss = num(j.AnalystRatingStrongSell) || 0;
  const total = sb + b + h + s + ss;
  let recKey;
  const recMean = total > 0 ? (sb * 1 + b * 2 + h * 3 + s * 4 + ss * 5) / total : undefined;
  if (recMean != null) {
    if (recMean <= 1.5) recKey = "strong_buy";
    else if (recMean <= 2.5) recKey = "buy";
    else if (recMean <= 3.5) recKey = "hold";
    else if (recMean <= 4.5) recKey = "sell";
    else recKey = "strong_sell";
  }

  return {
    marketCap: num(j.MarketCapitalization),
    trailingPE: num(j.TrailingPE) ?? num(j.PERatio),
    forwardPE: num(j.ForwardPE),
    trailingEPS: num(j.EPS) ?? num(j.DilutedEPSTTM),
    dividendYield: num(j.DividendYield),
    beta: num(j.Beta),
    targetMean: num(j.AnalystTargetPrice),
    recommendationMean: recMean,
    recommendationKey: recKey,
    numAnalysts: total || undefined,
    analystBuy: sb + b,
    analystHold: h,
    analystSell: s + ss,
    fiftyTwoWeekHigh: num(j["52WeekHigh"]),
    fiftyTwoWeekLow: num(j["52WeekLow"]),
  };
}

function parseAVTime(s) {
  if (!s || s.length < 15) return null;
  return new Date(
    parseInt(s.slice(0, 4)),
    parseInt(s.slice(4, 6)) - 1,
    parseInt(s.slice(6, 8)),
    parseInt(s.slice(9, 11)),
    parseInt(s.slice(11, 13)),
    parseInt(s.slice(13, 15))
  );
}

async function fetchNews(ticker) {
  const apiKey = getAvKey();
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(ticker)}&limit=15&apikey=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`AV NEWS HTTP ${resp.status}`);
  const j = await resp.json();
  checkAvError(j);
  const feed = j?.feed || [];
  return feed.map((f) => ({
    title: String(f.title || "").trim(),
    publisher: String(f.source || "").trim(),
    link: String(f.url || "").trim(),
    time: parseAVTime(f.time_published),
    summary: String(f.summary || "").slice(0, 300).trim(),
  })).filter((n) => n.title);
}

function formatPriceSummary(data) {
  const closes = data.prices.map((p) => p.close);
  const last = closes[closes.length - 1];
  const first = closes[0];
  const highest = Math.max(...closes);
  const lowest = Math.min(...closes);
  const pctChange = ((last - first) / first) * 100;
  const startDate = data.prices[0].date.toISOString().slice(0, 10);
  const endDate = data.prices[data.prices.length - 1].date.toISOString().slice(0, 10);
  return [
    `종목: ${data.ticker}${data.exchange ? " (" + data.exchange + ")" : ""}`,
    `기간: ${startDate} ~ ${endDate} (${closes.length} 거래일)`,
    `시작 → 종료: ${first.toFixed(2)} → ${last.toFixed(2)} ${data.currency}`,
    `기간 수익률: ${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)}%`,
    `최고 / 최저: ${highest.toFixed(2)} / ${lowest.toFixed(2)}`,
  ].join("\n");
}

els.fetchBtn.addEventListener("click", async () => {
  const t = els.ticker.value.trim().toUpperCase();
  if (!t) { els.priceStatus.textContent = "티커를 입력하세요."; return; }
  els.fetchBtn.disabled = true;
  els.priceStatus.textContent = "가격 조회 중…";
  try {
    priceData = await fetchYahoo(t, els.range.value);
    els.priceStatus.textContent = `조회 성공 (${priceData.prices.length}일)`;
    els.priceSummary.textContent = formatPriceSummary(priceData);
    els.pricePreview.hidden = false;
    renderPriceChart(priceData);
    els.chartContainer.hidden = false;

    // Sequential fetch: Alpha Vantage throttles to ~1 req/sec
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    newsData = null;
    statsData = null;
    els.statsCard.hidden = false;
    els.statsStatus.textContent = "핵심 지표 조회 중… (약 2초)";
    els.statsGrid.innerHTML = "";
    els.autoNews.hidden = false;
    els.newsAutoStatus.textContent = "뉴스 대기 중…";
    els.newsList.innerHTML = "";

    await sleep(1400);
    const statsResult = await Promise.allSettled([fetchStats(t)]).then((r) => r[0]);
    if (statsResult.status === "fulfilled") {
      statsData = statsResult.value;
      if (statsData?.fiftyTwoWeekHigh) priceData.meta.fiftyTwoWeekHigh = statsData.fiftyTwoWeekHigh;
      if (statsData?.fiftyTwoWeekLow) priceData.meta.fiftyTwoWeekLow = statsData.fiftyTwoWeekLow;
    }
    renderStats(priceData, statsData, statsResult.status === "rejected" ? statsResult.reason?.message : null);

    els.newsAutoStatus.textContent = "뉴스 조회 중… (약 2초)";
    await sleep(1400);
    const newsResult = await Promise.allSettled([fetchNews(t)]).then((r) => r[0]);
    if (newsResult.status === "fulfilled") {
      newsData = newsResult.value;
      renderNewsList(newsData);
    } else {
      els.newsAutoStatus.innerHTML = `<span class="error">뉴스 자동 조회 실패: ${escapeHtml(newsResult.reason?.message || "")}. 아래 텍스트 박스에 수동 입력 가능.</span>`;
    }
  } catch (e) {
    priceData = null;
    const attemptsHtml = e.attempts && e.attempts.length
      ? `<details style="margin-top:6px"><summary>진단 상세 (${e.attempts.length}건)</summary><pre style="white-space:pre-wrap;font-size:11px;color:var(--muted);margin:4px 0">${escapeHtml(e.attempts.join("\n"))}</pre></details>`
      : "";
    els.priceStatus.innerHTML = `<span class="error">가격 조회 실패: ${escapeHtml(e.message)}. 티커를 확인하거나 잠시 후 다시 시도하세요.</span>${attemptsHtml}`;
    els.pricePreview.hidden = true;
    els.chartContainer.hidden = true;
    els.autoNews.hidden = true;
    els.statsCard.hidden = true;
  } finally {
    els.fetchBtn.disabled = false;
  }
});

// ---------- Stats rendering ----------
function fmtNum(v, digits = 2) {
  if (v == null || isNaN(v)) return "N/A";
  if (Math.abs(v) >= 1e12) return (v / 1e12).toFixed(digits) + "T";
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(digits) + "B";
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(digits) + "M";
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(digits) + "K";
  return Number(v).toFixed(digits);
}
function fmtPct(v, digits = 2) {
  return v == null || isNaN(v) ? "N/A" : (v * 100).toFixed(digits) + "%";
}
function fmtPrice(v) { return v == null || isNaN(v) ? "N/A" : Number(v).toFixed(2); }

function recLabel(key) {
  return { strong_buy: "적극 매수", buy: "매수", hold: "홀드", sell: "매도", strong_sell: "적극 매도" }[key] || key || "N/A";
}

function renderStats(price, stats, errMsg) {
  const meta = price?.meta || {};
  const last = price?.prices?.[price.prices.length - 1]?.close;
  const cells = [];
  const push = (label, value, hint = "") =>
    cells.push(`<div class="stat"><div class="stat-label">${escapeHtml(label)}</div><div class="stat-value">${value}</div>${hint ? `<div class="stat-hint">${escapeHtml(hint)}</div>` : ""}</div>`);

  // From price meta (always available)
  push("현재가", fmtPrice(meta.regularMarketPrice ?? last), price?.currency || "");
  push("전일 종가", fmtPrice(meta.previousClose));
  if (meta.regularMarketPrice != null && meta.previousClose) {
    const d = meta.regularMarketPrice - meta.previousClose;
    const pct = (d / meta.previousClose) * 100;
    const cls = d >= 0 ? "up" : "down";
    push("전일 대비", `<span class="${cls}">${d >= 0 ? "+" : ""}${d.toFixed(2)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)</span>`);
  }
  push("당일 고/저", `${fmtPrice(meta.dayHigh)} / ${fmtPrice(meta.dayLow)}`);
  push("당일 거래량", fmtNum(meta.dayVolume, 1));
  if (meta.fiftyTwoWeekHigh && meta.fiftyTwoWeekLow) {
    push("52주 고/저", `${fmtPrice(meta.fiftyTwoWeekHigh)} / ${fmtPrice(meta.fiftyTwoWeekLow)}`);
    const cur = meta.regularMarketPrice ?? last;
    if (cur != null) {
      const range = meta.fiftyTwoWeekHigh - meta.fiftyTwoWeekLow;
      const pos = range > 0 ? ((cur - meta.fiftyTwoWeekLow) / range) * 100 : 50;
      push("52주 위치", `${pos.toFixed(0)}%`, pos > 80 ? "고점 근접" : pos < 20 ? "저점 근접" : "중립");
    }
  }

  // From quoteSummary if available
  if (stats) {
    if (stats.marketCap != null) push("시가총액", "$" + fmtNum(stats.marketCap, 2));
    if (stats.trailingPE != null) push("PER (TTM)", stats.trailingPE.toFixed(2), "주가수익비율");
    if (stats.forwardPE != null) push("PER (Fwd)", stats.forwardPE.toFixed(2));
    if (stats.trailingEPS != null) push("EPS (TTM)", stats.trailingEPS.toFixed(2));
    if (stats.dividendYield != null) push("배당수익률", fmtPct(stats.dividendYield));
    if (stats.beta != null) push("베타", stats.beta.toFixed(2));
    if (stats.targetMean != null) {
      const cur = meta.regularMarketPrice ?? last;
      let hint = "";
      if (cur) {
        const gap = ((stats.targetMean - cur) / cur) * 100;
        hint = `현재가 대비 ${gap >= 0 ? "+" : ""}${gap.toFixed(1)}%`;
      }
      push("목표주가 (평균)", fmtPrice(stats.targetMean), hint);
    }
    if (stats.recommendationKey) {
      push("애널리스트 의견", recLabel(stats.recommendationKey), stats.numAnalysts ? `${stats.numAnalysts}명` : "");
    }
  }

  els.statsGrid.innerHTML = cells.join("");
  if (stats) {
    els.statsStatus.textContent = "가격 메타 + 펀더멘털 지표";
  } else if (errMsg) {
    els.statsStatus.innerHTML = `가격 메타만 표시 <span class="hint">(펀더멘털 조회 실패: ${escapeHtml(errMsg.slice(0, 80))})</span>`;
  } else {
    els.statsStatus.textContent = "가격 메타 지표";
  }
}

// ---------- News list rendering ----------
function renderNewsList(items) {
  if (!items || !items.length) {
    els.newsAutoStatus.textContent = "관련 뉴스가 없습니다.";
    els.newsList.innerHTML = "";
    return;
  }
  els.newsAutoStatus.textContent = `${items.length}개의 헤드라인 (감성 분석에 자동 반영됨)`;
  els.newsList.innerHTML = items.slice(0, 12).map((n) => {
    const dateStr = n.time ? n.time.toISOString().slice(0, 10) : "";
    const meta = [n.publisher, dateStr].filter(Boolean).join(" · ");
    const linkOpen = n.link ? `<a href="${escapeHtml(n.link)}" target="_blank" rel="noopener">` : "<span>";
    const linkClose = n.link ? "</a>" : "</span>";
    return `<li>${linkOpen}${escapeHtml(n.title)}${linkClose}${meta ? `<span class="news-meta">${escapeHtml(meta)}</span>` : ""}</li>`;
  }).join("");
}

function combineNewsText(autoNews, manualText) {
  const auto = (autoNews || [])
    .map((n) => n.summary ? `${n.title} — ${n.summary}` : n.title)
    .join("\n");
  const manual = (manualText || "").trim();
  return [auto, manual].filter(Boolean).join("\n\n");
}

// ---------- Chart rendering (inline SVG, no dependency) ----------
function renderPriceChart(data) {
  const closes = data.prices.map((p) => p.close);
  const dates = data.prices.map((p) => p.date);
  const n = closes.length;
  if (n < 2) { els.priceChart.innerHTML = ""; return; }

  // Layout (matches viewBox="0 0 800 360" in index.html)
  const W = 800, H = 360;
  const padL = 48, padR = 12;
  const priceTop = 16, priceBottom = 246;
  const rsiTop = 268, rsiBottom = 336;
  const innerW = W - padL - padR;
  const priceInnerH = priceBottom - priceTop;
  const rsiInnerH = rsiBottom - rsiTop;

  // Price scale (with 5% padding)
  const rawMin = Math.min(...closes);
  const rawMax = Math.max(...closes);
  const rawSpan = rawMax - rawMin || Math.abs(rawMax) * 0.02 || 1;
  const pad = rawSpan * 0.05;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  const xAt = (i) => padL + (i / (n - 1)) * innerW;
  const yAt = (v) => priceTop + (1 - (v - yMin) / (yMax - yMin)) * priceInnerH;
  const rsiY = (v) => rsiTop + (1 - v / 100) * rsiInnerH;

  // Rolling SMA
  const rollingSMA = (period) => {
    const out = [];
    if (n < period) return out;
    let sum = 0;
    for (let i = 0; i < period; i++) sum += closes[i];
    out.push({ i: period - 1, v: sum / period });
    for (let i = period; i < n; i++) {
      sum += closes[i] - closes[i - period];
      out.push({ i, v: sum / period });
    }
    return out;
  };
  const sma20Pts = rollingSMA(20);
  const sma50Pts = rollingSMA(50);

  // Rolling RSI(14) using Wilder-lite: same window each step
  const rsiPts = [];
  const rsiPeriod = 14;
  if (n > rsiPeriod) {
    for (let i = rsiPeriod; i < n; i++) {
      let gains = 0, losses = 0;
      for (let j = i - rsiPeriod + 1; j <= i; j++) {
        const d = closes[j] - closes[j - 1];
        if (d >= 0) gains += d; else losses -= d;
      }
      const rsi = losses === 0 ? 100 : 100 - 100 / (1 + (gains / rsiPeriod) / (losses / rsiPeriod));
      rsiPts.push({ i, v: rsi });
    }
  }

  const toPath = (pts, yFn) => pts
    .map((p, k) => `${k === 0 ? "M" : "L"} ${xAt(p.i).toFixed(1)} ${yFn(p.v).toFixed(1)}`)
    .join(" ");
  const priceLine = closes
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`)
    .join(" ");
  const sma20Path = toPath(sma20Pts, yAt);
  const sma50Path = toPath(sma50Pts, yAt);
  const rsiPath = toPath(rsiPts, rsiY);

  // Price grid + Y labels (5 rows)
  let priceGrid = "";
  for (let k = 0; k <= 4; k++) {
    const v = yMin + ((yMax - yMin) * (4 - k)) / 4;
    const y = yAt(v).toFixed(1);
    priceGrid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" class="grid" />`;
    priceGrid += `<text x="${padL - 6}" y="${y}" class="y-label" text-anchor="end" dominant-baseline="middle">${v.toFixed(2)}</text>`;
  }

  // RSI reference lines (30 / 50 dashed / 70)
  let rsiRefs = "";
  for (const [v, cls] of [[30, "ref"], [50, "ref"], [70, "ref"]]) {
    rsiRefs += `<line x1="${padL}" y1="${rsiY(v).toFixed(1)}" x2="${W - padR}" y2="${rsiY(v).toFixed(1)}" class="grid ${cls}" />`;
  }
  let rsiLabels = "";
  for (const v of [30, 70]) {
    rsiLabels += `<text x="${padL - 6}" y="${rsiY(v).toFixed(1)}" class="y-label" text-anchor="end" dominant-baseline="middle">${v}</text>`;
  }

  // X labels (5 evenly spaced dates)
  let xLabels = "";
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  for (let k = 0; k <= 4; k++) {
    const i = Math.round(((n - 1) * k) / 4);
    const x = xAt(i).toFixed(1);
    xLabels += `<text x="${x}" y="${rsiBottom + 14}" class="x-label" text-anchor="middle">${fmt(dates[i])}</text>`;
  }

  // Last-point marker
  const lastX = xAt(n - 1).toFixed(1);
  const lastY = yAt(closes[n - 1]).toFixed(1);

  // Candlesticks
  const candleGap = 1.5;
  const candleAvail = innerW / n;
  const candleW = Math.max(1.5, Math.min(candleAvail - candleGap, 10));
  let candles = "";
  for (let i = 0; i < n; i++) {
    const p = data.prices[i];
    const cx = xAt(i);
    const bull = p.close >= p.open;
    const cls = bull ? "candle-bull" : "candle-bear";
    const bodyTop = yAt(Math.max(p.open, p.close));
    const bodyBot = yAt(Math.min(p.open, p.close));
    const bodyH = Math.max(1, bodyBot - bodyTop);
    const wickTop = yAt(p.high);
    const wickBot = yAt(p.low);
    candles +=
      `<line x1="${cx.toFixed(1)}" y1="${wickTop.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${wickBot.toFixed(1)}" class="wick ${cls}" />` +
      `<rect x="${(cx - candleW / 2).toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${candleW.toFixed(1)}" height="${bodyH.toFixed(1)}" class="body ${cls}" />`;
  }

  // (priceLine kept for reference but not rendered — candles replace it)
  void priceLine;

  els.priceChart.innerHTML =
    priceGrid +
    candles +
    (sma50Pts.length ? `<path d="${sma50Path}" class="line sma50" />` : "") +
    (sma20Pts.length ? `<path d="${sma20Path}" class="line sma20" />` : "") +
    `<circle cx="${lastX}" cy="${lastY}" r="3.5" class="last-point" />` +
    `<line x1="${padL}" y1="${(rsiTop - 8).toFixed(1)}" x2="${W - padR}" y2="${(rsiTop - 8).toFixed(1)}" class="axis-divider" />` +
    rsiRefs +
    (rsiPts.length ? `<path d="${rsiPath}" class="line rsi" />` : "") +
    rsiLabels +
    `<text x="${padL - 6}" y="${(rsiTop + 4).toFixed(1)}" class="section-label" text-anchor="end">RSI</text>` +
    xLabels;
}

// ---------- Technical indicators ----------
function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(values, period = 14) {
  if (values.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change; else losses -= change;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - 100 / (1 + rs);
}

// ---------- Sentiment (simple keyword) ----------
const POS_WORDS = [
  // English
  "beat", "beats", "surge", "surged", "record", "profit", "growth", "outperform",
  "upgrade", "upgraded", "buy", "bullish", "rally", "rallied", "strong", "gains",
  "expansion", "breakthrough", "partnership", "acquisition", "raised guidance",
  "exceeds", "exceeded", "positive", "boost", "soar", "soared", "jumped",
  // Korean
  "상승", "호실적", "매수", "강세", "돌파", "성장", "확대", "긍정", "개선",
  "실적개선", "신고가", "급등", "호재", "낙관", "증가", "인수", "협력", "수주",
];
const NEG_WORDS = [
  "miss", "missed", "loss", "plunge", "plunged", "downgrade", "downgraded", "sell",
  "bearish", "decline", "declined", "weak", "cut guidance", "lawsuit", "probe",
  "investigation", "warns", "warning", "negative", "drop", "fall", "fell",
  "concern", "recall", "layoff", "layoffs", "delay", "delayed",
  "하락", "부진", "매도", "약세", "급락", "손실", "적자", "부정", "악화",
  "우려", "리스크", "감소", "충격", "쇼크", "하향", "지연", "리콜", "소송",
];

function analyzeSentiment(text) {
  if (!text || !text.trim()) return { score: 0, positive: 0, negative: 0, hits: [] };
  const lower = text.toLowerCase();
  const hits = [];
  let positive = 0, negative = 0;
  for (const w of POS_WORDS) {
    const matches = countOccurrences(lower, w.toLowerCase());
    if (matches) { positive += matches; hits.push({ word: w, count: matches, kind: "pos" }); }
  }
  for (const w of NEG_WORDS) {
    const matches = countOccurrences(lower, w.toLowerCase());
    if (matches) { negative += matches; hits.push({ word: w, count: matches, kind: "neg" }); }
  }
  const total = positive + negative;
  const score = total === 0 ? 0 : (positive - negative) / total; // -1..+1
  return { score, positive, negative, hits };
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0, idx = 0;
  while ((idx = haystack.indexOf(needle, idx)) !== -1) { count++; idx += needle.length; }
  return count;
}

// ---------- Rule-based signal ----------
function ruleBasedSignal(priceData, newsText, stats = null) {
  const closes = priceData ? priceData.prices.map((p) => p.close) : [];
  const last = closes[closes.length - 1];
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rsi14 = rsi(closes, 14);
  const sentiment = analyzeSentiment(newsText);

  let score = 0;
  const reasons = [];

  // Trend: SMA20 vs SMA50
  if (sma20 != null && sma50 != null) {
    if (sma20 > sma50 * 1.01) {
      score += 1;
      reasons.push(`추세: SMA20(${sma20.toFixed(2)}) > SMA50(${sma50.toFixed(2)}) — 단기 상승 추세 (+1)`);
    } else if (sma20 < sma50 * 0.99) {
      score -= 1;
      reasons.push(`추세: SMA20(${sma20.toFixed(2)}) < SMA50(${sma50.toFixed(2)}) — 단기 하락 추세 (-1)`);
    } else {
      reasons.push(`추세: SMA20 ≈ SMA50 — 방향성 불명확 (0)`);
    }
  } else if (sma20 != null) {
    if (last > sma20 * 1.02) { score += 0.5; reasons.push(`가격이 SMA20보다 위 — 단기 강세 (+0.5)`); }
    else if (last < sma20 * 0.98) { score -= 0.5; reasons.push(`가격이 SMA20보다 아래 — 단기 약세 (-0.5)`); }
  } else {
    reasons.push(`추세: 데이터 부족으로 판단 보류`);
  }

  // RSI
  if (rsi14 != null) {
    if (rsi14 < 30) {
      score += 1;
      reasons.push(`RSI(14) = ${rsi14.toFixed(1)} — 과매도 구간 (+1)`);
    } else if (rsi14 > 70) {
      score -= 1;
      reasons.push(`RSI(14) = ${rsi14.toFixed(1)} — 과매수 구간 (-1)`);
    } else {
      reasons.push(`RSI(14) = ${rsi14.toFixed(1)} — 중립 구간 (0)`);
    }
  }

  // Momentum: last vs 5-day and 20-day
  if (closes.length >= 6) {
    const fiveAgo = closes[closes.length - 6];
    const mom5 = ((last - fiveAgo) / fiveAgo) * 100;
    if (mom5 > 3) { score += 0.5; reasons.push(`5일 모멘텀 +${mom5.toFixed(1)}% — 단기 강한 상승 (+0.5)`); }
    else if (mom5 < -3) { score -= 0.5; reasons.push(`5일 모멘텀 ${mom5.toFixed(1)}% — 단기 강한 하락 (-0.5)`); }
  }

  // 52-week band position
  const meta = priceData?.meta || {};
  const currentPx = meta.regularMarketPrice ?? last;
  if (meta.fiftyTwoWeekHigh && meta.fiftyTwoWeekLow && currentPx != null) {
    const range = meta.fiftyTwoWeekHigh - meta.fiftyTwoWeekLow;
    const pos = range > 0 ? (currentPx - meta.fiftyTwoWeekLow) / range : 0.5;
    if (pos < 0.2) { score += 0.5; reasons.push(`52주 위치 ${(pos*100).toFixed(0)}% — 저점 근접, 평균 회귀 기대 (+0.5)`); }
    else if (pos > 0.85) { score -= 0.5; reasons.push(`52주 위치 ${(pos*100).toFixed(0)}% — 고점 근접, 조정 리스크 (-0.5)`); }
    else { reasons.push(`52주 위치 ${(pos*100).toFixed(0)}% — 중간 대역 (0)`); }
  }

  // Analyst target vs current price
  if (stats?.targetMean && currentPx != null) {
    const gap = (stats.targetMean - currentPx) / currentPx;
    if (gap > 0.15) { score += 0.75; reasons.push(`애널리스트 평균 목표주가 ${stats.targetMean.toFixed(2)} — 현재가 대비 +${(gap*100).toFixed(1)}% 상향여력 (+0.75)`); }
    else if (gap < -0.05) { score -= 0.75; reasons.push(`애널리스트 평균 목표주가 ${stats.targetMean.toFixed(2)} — 현재가 대비 ${(gap*100).toFixed(1)}% 하향 (-0.75)`); }
    else { reasons.push(`애널리스트 평균 목표주가 ${stats.targetMean.toFixed(2)} — 현재가 근접 (0)`); }
  }

  // Analyst consensus
  if (stats?.recommendationMean != null) {
    const r = stats.recommendationMean; // 1=strong buy, 5=strong sell
    if (r <= 2.0) { score += 0.5; reasons.push(`애널리스트 컨센서스 ${r.toFixed(1)}/5 — 매수 우세 (+0.5)`); }
    else if (r >= 3.5) { score -= 0.5; reasons.push(`애널리스트 컨센서스 ${r.toFixed(1)}/5 — 매도 우세 (-0.5)`); }
    else { reasons.push(`애널리스트 컨센서스 ${r.toFixed(1)}/5 — 중립 (0)`); }
  }

  // Sentiment
  if (sentiment.positive + sentiment.negative > 0) {
    const sScore = sentiment.score; // -1..+1
    const contrib = Math.round(sScore * 100) / 100 * 1.5; // weight 1.5
    score += contrib;
    const label = sScore > 0.2 ? "긍정" : sScore < -0.2 ? "부정" : "혼재";
    reasons.push(`뉴스 감성: ${label} (긍정 ${sentiment.positive} / 부정 ${sentiment.negative}, 기여 ${contrib >= 0 ? "+" : ""}${contrib.toFixed(2)})`);
  } else {
    reasons.push(`뉴스 감성: 키워드 매칭 없음 (0)`);
  }

  // Map score → signal (thresholds slightly higher due to more inputs)
  let signal;
  if (score >= 1.5) signal = "BUY";
  else if (score <= -1.5) signal = "SELL";
  else signal = "HOLD";

  // Confidence: |score| normalized to 0..1 (cap at 5.0 given more inputs)
  const confidence = Math.min(1, Math.abs(score) / 5.0);

  return {
    signal,
    score: Math.round(score * 100) / 100,
    confidence,
    reasons,
    indicators: { last, sma20, sma50, rsi14, sentiment },
  };
}

// ---------- Stats prompt formatter ----------
function formatStatsForPrompt(price, stats) {
  const m = price?.meta || {};
  const lines = [];
  if (m.regularMarketPrice != null) lines.push(`현재가: ${m.regularMarketPrice}`);
  if (m.previousClose != null) lines.push(`전일 종가: ${m.previousClose}`);
  if (m.fiftyTwoWeekHigh && m.fiftyTwoWeekLow) {
    lines.push(`52주 범위: ${m.fiftyTwoWeekLow} ~ ${m.fiftyTwoWeekHigh}`);
    const cur = m.regularMarketPrice;
    if (cur) {
      const range = m.fiftyTwoWeekHigh - m.fiftyTwoWeekLow;
      const pos = range > 0 ? ((cur - m.fiftyTwoWeekLow) / range) * 100 : 50;
      lines.push(`52주 위치: ${pos.toFixed(0)}%`);
    }
  }
  if (m.dayVolume) lines.push(`당일 거래량: ${m.dayVolume}`);
  if (stats) {
    if (stats.marketCap) lines.push(`시가총액: ${stats.marketCap}`);
    if (stats.trailingPE) lines.push(`PER(TTM): ${stats.trailingPE.toFixed(2)}`);
    if (stats.forwardPE) lines.push(`PER(Fwd): ${stats.forwardPE.toFixed(2)}`);
    if (stats.trailingEPS) lines.push(`EPS(TTM): ${stats.trailingEPS.toFixed(2)}`);
    if (stats.dividendYield) lines.push(`배당수익률: ${(stats.dividendYield * 100).toFixed(2)}%`);
    if (stats.beta) lines.push(`베타: ${stats.beta.toFixed(2)}`);
    if (stats.targetMean) lines.push(`애널리스트 평균 목표주가: ${stats.targetMean.toFixed(2)}`);
    if (stats.recommendationKey) lines.push(`애널리스트 컨센서스: ${stats.recommendationKey}${stats.numAnalysts ? " ("+stats.numAnalysts+"명)" : ""}`);
  }
  return lines.join("\n") || "(스탯 정보 없음)";
}

// ---------- Claude API ----------
async function askClaude(apiKey, model, { ticker, priceSummaryText, statsSummaryText, newsText, ruleResult }) {
  const systemPrompt = `You are a cautious equity analyst assistant. Given price history summary, news text, and rule-based technical signals, provide an independent Buy/Sell/Hold recommendation with brief reasoning.

Respond ONLY with valid JSON matching this exact schema:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <number between 0 and 1>,
  "reasoning": "<2-4 sentences in Korean explaining the recommendation, citing specific data points from the input>",
  "risks": ["<risk factor 1>", "<risk factor 2>"]
}

Do not include markdown code fences or any text outside the JSON object.`;

  const userMessage = `종목: ${ticker}

--- 가격 요약 ---
${priceSummaryText || "(없음)"}

--- 핵심 스탯 지표 ---
${statsSummaryText || "(없음)"}

--- 뉴스 헤드라인 / 컨텍스트 ---
${newsText || "(뉴스 텍스트가 제공되지 않음)"}

--- 규칙 기반 사전 신호 (참고용) ---
signal: ${ruleResult.signal}
score: ${ruleResult.score}
reasons:
${ruleResult.reasons.map((r) => "- " + r).join("\n")}

위 정보(가격 추이 + 스탯 + 뉴스)를 종합해 독립적인 매수/매도/홀드 판단을 내려주세요.
- 52주 위치, PER, 애널리스트 목표주가/컨센서스가 있으면 반드시 언급
- 뉴스에서 실제로 신호가 되는 이벤트 (실적, 가이던스, 규제, 인수합병 등)에 가중치
- 규칙 신호에 무조건 동조할 필요는 없음 — 반대 결론도 가능`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${errText.slice(0, 300)}`);
  }
  const json = await resp.json();
  const text = json?.content?.[0]?.text || "";
  const parsed = tryParseJson(text);
  if (!parsed || !parsed.signal) throw new Error("Claude 응답을 파싱할 수 없습니다.");
  parsed.signal = String(parsed.signal).toUpperCase();
  parsed.confidence = clampNumber(parsed.confidence, 0, 1) ?? 0.5;
  parsed.risks = Array.isArray(parsed.risks) ? parsed.risks : [];
  return parsed;
}

function tryParseJson(text) {
  try { return JSON.parse(text); } catch (_) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) {}
  }
  return null;
}

function clampNumber(v, min, max) {
  const n = typeof v === "number" ? v : parseFloat(v);
  if (isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

// ---------- Ensemble ----------
function ensemble(ruleResult, claudeResult) {
  if (!claudeResult) {
    return {
      signal: ruleResult.signal,
      confidence: ruleResult.confidence,
      summary: "규칙 기반 신호만으로 결정 (Claude API 미사용).",
    };
  }
  const agree = ruleResult.signal === claudeResult.signal;
  if (agree) {
    const conf = Math.min(1, ruleResult.confidence * 0.5 + claudeResult.confidence * 0.6 + 0.1);
    return {
      signal: ruleResult.signal,
      confidence: conf,
      summary: `두 엔진 모두 ${ruleResult.signal} — 합의 신호로 신뢰도 상향.`,
    };
  }
  // Disagreement: default to HOLD if either is HOLD, otherwise weight by confidence
  if (ruleResult.signal === "HOLD" || claudeResult.signal === "HOLD") {
    return {
      signal: "HOLD",
      confidence: Math.max(0.35, (ruleResult.confidence + claudeResult.confidence) / 2 - 0.1),
      summary: `엔진 간 불일치 (규칙: ${ruleResult.signal}, Claude: ${claudeResult.signal}) — 안전하게 HOLD.`,
    };
  }
  // Direct conflict (BUY vs SELL): pick higher confidence but lower final confidence
  const rConf = ruleResult.confidence, cConf = claudeResult.confidence;
  const winner = cConf >= rConf ? claudeResult : ruleResult;
  const winnerName = cConf >= rConf ? "Claude" : "규칙";
  return {
    signal: winner.signal,
    confidence: Math.max(0.3, Math.abs(rConf - cConf) * 0.6 + 0.2),
    summary: `방향 충돌 (규칙: ${ruleResult.signal}, Claude: ${claudeResult.signal}). 더 높은 신뢰도(${winnerName})를 채택하되 최종 신뢰도는 낮음.`,
  };
}

// ---------- Rendering ----------
function signalLabelKo(sig) {
  return { BUY: "매수", SELL: "매도", HOLD: "홀드" }[sig] || sig;
}

function renderResults(ruleResult, claudeResult, finalResult) {
  els.resultCard.hidden = false;

  // Final verdict
  const sigClass = finalResult.signal.toLowerCase();
  els.finalVerdict.innerHTML = `
    <div class="label">최종 판단</div>
    <div class="signal ${sigClass}">${signalLabelKo(finalResult.signal)} (${finalResult.signal})</div>
    <div class="confidence">신뢰도 ${(finalResult.confidence * 100).toFixed(0)}%</div>
    <div class="summary-line">${escapeHtml(finalResult.summary)}</div>
  `;

  // Rule block
  els.ruleSignal.className = "engine-signal " + ruleResult.signal.toLowerCase();
  els.ruleSignal.textContent = `${signalLabelKo(ruleResult.signal)} · score ${ruleResult.score} · 신뢰도 ${(ruleResult.confidence * 100).toFixed(0)}%`;
  els.ruleReasons.innerHTML = ruleResult.reasons
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join("");

  // Claude block
  if (claudeResult) {
    els.claudeBlock.hidden = false;
    els.claudeSignal.className = "engine-signal " + claudeResult.signal.toLowerCase();
    els.claudeSignal.textContent = `${signalLabelKo(claudeResult.signal)} · 신뢰도 ${(claudeResult.confidence * 100).toFixed(0)}%`;
    const risksHtml = claudeResult.risks && claudeResult.risks.length
      ? `<ul class="reasons" style="margin-top:8px">${claudeResult.risks.map((r) => `<li>⚠️ ${escapeHtml(r)}</li>`).join("")}</ul>`
      : "";
    els.claudeReasons.innerHTML = `<p style="margin:6px 0 0">${escapeHtml(claudeResult.reasoning || "")}</p>${risksHtml}`;
  } else if (claudeResult === false) {
    els.claudeBlock.hidden = false;
    els.claudeSignal.className = "engine-signal hold";
    els.claudeSignal.textContent = "호출 실패";
    els.claudeReasons.innerHTML = `<p class="error">${escapeHtml(claudeError || "알 수 없는 오류")}</p>`;
  } else {
    els.claudeBlock.hidden = false;
    els.claudeSignal.textContent = "미사용";
    els.claudeReasons.innerHTML = `<p class="hint">API 키를 저장하면 Claude 판단을 앙상블합니다.</p>`;
  }

  // Raw indicators
  const ind = ruleResult.indicators;
  const rawText = [
    `마지막 종가:  ${ind.last?.toFixed(2) ?? "N/A"}`,
    `SMA(20):     ${ind.sma20?.toFixed(2) ?? "N/A"}`,
    `SMA(50):     ${ind.sma50?.toFixed(2) ?? "N/A"}`,
    `RSI(14):     ${ind.rsi14?.toFixed(1) ?? "N/A"}`,
    `뉴스 긍정:   ${ind.sentiment.positive}`,
    `뉴스 부정:   ${ind.sentiment.negative}`,
    `감성 점수:   ${ind.sentiment.score.toFixed(2)} (-1..+1)`,
    ind.sentiment.hits.length ? `감성 매칭:   ${ind.sentiment.hits.map((h) => `${h.word}${h.count > 1 ? "×" + h.count : ""}(${h.kind})`).join(", ")}` : "",
  ].filter(Boolean).join("\n");
  els.rawIndicators.textContent = rawText;

  els.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Analyze flow ----------
let claudeError = null;

els.analyzeBtn.addEventListener("click", async () => {
  if (!priceData) {
    els.priceStatus.innerHTML = `<span class="error">먼저 가격을 조회하세요.</span>`;
    return;
  }
  const combinedNews = combineNewsText(newsData, els.news.value);
  const priceSummaryText = formatPriceSummary(priceData);
  const statsSummaryText = formatStatsForPrompt(priceData, statsData);

  const ruleResult = ruleBasedSignal(priceData, combinedNews, statsData);

  const apiKey = els.apiKey.value.trim();
  const model = els.model.value;
  let claudeResult = null;
  claudeError = null;

  if (apiKey) {
    els.analyzeBtn.disabled = true;
    els.analyzeBtn.textContent = "Claude 호출 중…";
    try {
      claudeResult = await askClaude(apiKey, model, {
        ticker: priceData.ticker,
        priceSummaryText,
        statsSummaryText,
        newsText: combinedNews,
        ruleResult,
      });
    } catch (e) {
      claudeError = e.message;
      claudeResult = false; // signals failure vs. not used
    } finally {
      els.analyzeBtn.disabled = false;
      els.analyzeBtn.textContent = "분석하기";
    }
  }

  const finalResult = ensemble(ruleResult, claudeResult && claudeResult !== false ? claudeResult : null);
  renderResults(ruleResult, claudeResult, finalResult);
});

// ---------- Init ----------
loadKey();
loadAvKey();
els.ticker.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); els.fetchBtn.click(); }
});
