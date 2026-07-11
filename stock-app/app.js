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
  watchlistField: $("watchlist-field"),
  watchlistChips: $("watchlist-chips"),
  hasPosition: $("has-position"),
  positionInputs: $("position-inputs"),
  entryPrice: $("entry-price"),
  quantity: $("quantity"),
  entryDate: $("entry-date"),
  savePositionBtn: $("save-position-btn"),
  positionStatus: $("position-status"),
  pnlCard: $("pnl-card"),
  pnlContent: $("pnl-content"),
  portCash: $("port-cash"),
  portHoldingsValue: $("port-holdings-value"),
  portTotal: $("port-total"),
  portPnl: $("port-pnl"),
  portHoldingsTable: $("port-holdings-table"),
  monitorTickers: $("monitor-tickers"),
  monitorInterval: $("monitor-interval"),
  monitorPositionSize: $("monitor-position-size"),
  monitorInitialCash: $("monitor-initial-cash"),
  monitorStartBtn: $("monitor-start-btn"),
  monitorStopBtn: $("monitor-stop-btn"),
  monitorRunOnceBtn: $("monitor-run-once-btn"),
  monitorResetBtn: $("monitor-reset-btn"),
  monitorStatus: $("monitor-status"),
  monitorLog: $("monitor-log"),
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
var positionData = null; // { entryPrice, quantity, entryDate }

// ---------- Position tracking ----------
const POS_STORAGE = "stocksignal.positions";
function loadAllPositions() {
  try { return JSON.parse(localStorage.getItem(POS_STORAGE)) || {}; } catch (_) { return {}; }
}
function loadPositionFor(ticker) {
  const all = loadAllPositions();
  const p = all[ticker?.toUpperCase()];
  if (p) {
    els.hasPosition.checked = true;
    els.positionInputs.hidden = false;
    els.entryPrice.value = p.entryPrice ?? "";
    els.quantity.value = p.quantity ?? "";
    els.entryDate.value = p.entryDate ?? "";
    els.positionStatus.textContent = "저장된 포지션 자동 로드됨.";
    positionData = { ...p };
  } else {
    els.hasPosition.checked = false;
    els.positionInputs.hidden = true;
    els.entryPrice.value = "";
    els.quantity.value = "";
    els.entryDate.value = "";
    els.positionStatus.textContent = "";
    positionData = null;
  }
}
function savePositionFor(ticker) {
  const t = (ticker || "").toUpperCase();
  if (!t) { els.positionStatus.textContent = "먼저 티커를 입력하세요."; return; }
  const entryPrice = parseFloat(els.entryPrice.value);
  if (isNaN(entryPrice) || entryPrice <= 0) { els.positionStatus.textContent = "유효한 매수가를 입력하세요."; return; }
  const p = {
    entryPrice,
    quantity: els.quantity.value ? parseFloat(els.quantity.value) : undefined,
    entryDate: els.entryDate.value || undefined,
  };
  const all = loadAllPositions();
  all[t] = p;
  localStorage.setItem(POS_STORAGE, JSON.stringify(all));
  positionData = p;
  els.positionStatus.textContent = `${t} 포지션 저장 완료.`;
  if (priceData) renderPnL(priceData, statsData);
}
els.hasPosition.addEventListener("change", () => {
  els.positionInputs.hidden = !els.hasPosition.checked;
  if (!els.hasPosition.checked) {
    // Delete saved position
    const t = els.ticker.value.trim().toUpperCase();
    if (t) {
      const all = loadAllPositions();
      delete all[t];
      localStorage.setItem(POS_STORAGE, JSON.stringify(all));
    }
    positionData = null;
    els.pnlCard.hidden = true;
  }
});
els.savePositionBtn.addEventListener("click", () => savePositionFor(els.ticker.value.trim()));
els.ticker.addEventListener("input", () => {
  loadPositionFor(els.ticker.value.trim());
});

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
    pushWatchlist(t);
    loadPositionFor(t);
    renderPnL(priceData, statsData);
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
      renderPnL(priceData, statsData);
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
    // Analyst rating stacked bar (if breakdown available)
    const totalAn = (stats.analystBuy || 0) + (stats.analystHold || 0) + (stats.analystSell || 0);
    if (totalAn > 0) {
      const buyPct = ((stats.analystBuy || 0) / totalAn) * 100;
      const holdPct = ((stats.analystHold || 0) / totalAn) * 100;
      const sellPct = ((stats.analystSell || 0) / totalAn) * 100;
      const bar = `
        <div class="analyst-bar-row">
          <div class="stat-label">애널리스트 등급 분포 (${totalAn}명)</div>
          <div class="analyst-bar">
            <div class="ab-seg ab-buy" style="width:${buyPct}%" title="매수 ${stats.analystBuy}">${stats.analystBuy || 0}</div>
            <div class="ab-seg ab-hold" style="width:${holdPct}%" title="홀드 ${stats.analystHold}">${stats.analystHold || 0}</div>
            <div class="ab-seg ab-sell" style="width:${sellPct}%" title="매도 ${stats.analystSell}">${stats.analystSell || 0}</div>
          </div>
          <div class="analyst-bar-legend">
            <span><span class="dot" style="background:var(--buy)"></span>매수 ${stats.analystBuy || 0}</span>
            <span><span class="dot" style="background:var(--hold)"></span>홀드 ${stats.analystHold || 0}</span>
            <span><span class="dot" style="background:var(--sell)"></span>매도 ${stats.analystSell || 0}</span>
          </div>
        </div>`;
      cells.push(bar);
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

// ---------- P&L rendering ----------
function computePnL(priceData, position, statsData) {
  if (!position || !position.entryPrice) return null;
  const current = priceData?.meta?.regularMarketPrice ?? priceData?.prices?.[priceData.prices.length - 1]?.close;
  if (!current) return null;
  const entry = position.entryPrice;
  const pnlPct = ((current - entry) / entry) * 100;
  const pnlAbs = current - entry;
  const totalPnl = position.quantity ? pnlAbs * position.quantity : null;
  const target = statsData?.targetMean;
  const remainingToTarget = target ? ((target - current) / current) * 100 : null;
  let daysHeld = null;
  if (position.entryDate) {
    const ms = Date.now() - new Date(position.entryDate).getTime();
    daysHeld = Math.floor(ms / 86400000);
  }
  return { current, entry, pnlPct, pnlAbs, totalPnl, target, remainingToTarget, daysHeld };
}

function renderPnL(priceData, statsData) {
  if (!positionData || !positionData.entryPrice) { els.pnlCard.hidden = true; return; }
  const pnl = computePnL(priceData, positionData, statsData);
  if (!pnl) { els.pnlCard.hidden = true; return; }
  els.pnlCard.hidden = false;
  const cls = pnl.pnlPct >= 0 ? "up" : "down";
  const arrow = pnl.pnlPct >= 0 ? "▲" : "▼";
  const totalLine = pnl.totalPnl != null
    ? `<div class="pnl-row"><span>총 손익</span><span class="${cls}">${pnl.totalPnl >= 0 ? "+" : ""}${pnl.totalPnl.toFixed(2)} ${priceData.currency || "USD"} (${positionData.quantity}주)</span></div>`
    : "";
  const daysLine = pnl.daysHeld != null
    ? `<div class="pnl-row"><span>보유 기간</span><span>${pnl.daysHeld}일</span></div>`
    : "";
  const targetLine = pnl.remainingToTarget != null
    ? `<div class="pnl-row"><span>목표주가 여력</span><span class="${pnl.remainingToTarget >= 0 ? "up" : "down"}">${pnl.remainingToTarget >= 0 ? "+" : ""}${pnl.remainingToTarget.toFixed(1)}% (목표: ${pnl.target.toFixed(2)})</span></div>`
    : "";

  // Stop-loss / take-profit hints
  let hintLine = "";
  if (pnl.pnlPct <= -10) {
    hintLine = `<div class="pnl-hint danger">⚠️ 손실 -${Math.abs(pnl.pnlPct).toFixed(1)}% — 손절선(-10 ~ -15%) 근처. 매도 신호 지속 시 손절 검토 권장.</div>`;
  } else if (pnl.pnlPct >= 20) {
    hintLine = `<div class="pnl-hint success">💰 수익 +${pnl.pnlPct.toFixed(1)}% — 익절선 근접. 매도 신호 발생 시 부분 익절 고려.</div>`;
  }

  els.pnlContent.innerHTML = `
    <div class="pnl-big ${cls}">
      <span class="pnl-arrow">${arrow}</span>
      <span class="pnl-pct">${pnl.pnlPct >= 0 ? "+" : ""}${pnl.pnlPct.toFixed(2)}%</span>
      <span class="pnl-abs">${pnl.pnlAbs >= 0 ? "+" : ""}${pnl.pnlAbs.toFixed(2)}</span>
    </div>
    <div class="pnl-rows">
      <div class="pnl-row"><span>매수가 → 현재가</span><span>${pnl.entry.toFixed(2)} → ${pnl.current.toFixed(2)}</span></div>
      ${totalLine}
      ${daysLine}
      ${targetLine}
    </div>
    ${hintLine}
  `;
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

  // Layout (viewBox="0 0 800 420" — expanded to fit volume subpanel)
  const W = 800, H = 420;
  const padL = 48, padR = 12;
  const priceTop = 16, priceBottom = 226;
  const volTop = 236, volBottom = 288;
  const rsiTop = 302, rsiBottom = 396;
  const innerW = W - padL - padR;
  const priceInnerH = priceBottom - priceTop;
  const volInnerH = volBottom - volTop;
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

  // Volume subpanel — bull/bear colored bars
  const volumes = data.prices.map((p) => p.volume ?? 0);
  const maxVol = Math.max(1, ...volumes);
  const volY = (v) => volTop + (1 - v / maxVol) * volInnerH;
  const volBarW = Math.max(1, candleW * 0.85);
  let volBars = "";
  for (let i = 0; i < n; i++) {
    const v = volumes[i];
    if (!v) continue;
    const p = data.prices[i];
    const bull = p.close >= p.open;
    const cls = bull ? "vol-bull" : "vol-bear";
    const cx = xAt(i);
    const y = volY(v);
    const h = volBottom - y;
    volBars += `<rect x="${(cx - volBarW / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${volBarW.toFixed(1)}" height="${h.toFixed(1)}" class="vol-bar ${cls}" />`;
  }

  els.priceChart.innerHTML =
    priceGrid +
    candles +
    (sma50Pts.length ? `<path d="${sma50Path}" class="line sma50" />` : "") +
    (sma20Pts.length ? `<path d="${sma20Path}" class="line sma20" />` : "") +
    `<circle cx="${lastX}" cy="${lastY}" r="3.5" class="last-point" />` +
    `<line x1="${padL}" y1="${(volTop - 6).toFixed(1)}" x2="${W - padR}" y2="${(volTop - 6).toFixed(1)}" class="axis-divider" />` +
    volBars +
    `<text x="${padL - 6}" y="${(volTop + 4).toFixed(1)}" class="section-label" text-anchor="end">거래량</text>` +
    `<line x1="${padL}" y1="${(rsiTop - 6).toFixed(1)}" x2="${W - padR}" y2="${(rsiTop - 6).toFixed(1)}" class="axis-divider" />` +
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

function positionAction(signal, pnl) {
  if (!pnl) {
    if (signal === "BUY") return { label: "진입 검토", kind: "buy", desc: "미보유 상태에서 매수 신호가 우세하니 진입을 검토하세요." };
    if (signal === "SELL") return { label: "관망 / 매수 회피", kind: "hold", desc: "미보유 상태이므로 '매도'라기보단 진입 회피가 적절합니다." };
    return { label: "관망", kind: "hold", desc: "방향성이 뚜렷하지 않으니 진입 없이 관망하세요." };
  }
  const pct = pnl.pnlPct;
  if (signal === "SELL") {
    if (pct >= 20) return { label: "익절 강력 권장", kind: "sell", desc: `수익 +${pct.toFixed(1)}% 상태에서 매도 신호가 발생. 부분 or 전량 익절 강력 권고.` };
    if (pct >= 5) return { label: "익절", kind: "sell", desc: `수익 +${pct.toFixed(1)}% 확보 중이며 매도 신호가 발생. 익절 권장.` };
    if (pct >= -3) return { label: "매도 검토", kind: "sell", desc: `현재 손익 ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%이나 매도 신호가 우세. 손실 확대 방지 차원에서 매도 검토.` };
    if (pct >= -10) return { label: "매도 or 손절 검토", kind: "sell", desc: `-${Math.abs(pct).toFixed(1)}% 손실 중이며 매도 신호까지 나옴. 추가 하락 가능성 대비해 손절 검토.` };
    return { label: "손절 검토", kind: "sell", desc: `-${Math.abs(pct).toFixed(1)}%의 큰 손실이며 매도 신호 지속. 손절선 설정 후 실행 검토 권장.` };
  }
  if (signal === "BUY") {
    if (pct >= 25) return { label: "익절 후 재진입", kind: "hold", desc: `수익 +${pct.toFixed(1)}% 확보 중이며 매수 신호 지속. 부분 익절 후 조정 시 재진입 전략도 고려 가능.` };
    if (pct >= 0) return { label: "보유 (추가매수 조건부)", kind: "buy", desc: `수익 +${pct.toFixed(1)}% 상태에서 매수 신호 유지. 신뢰도 매우 높을 때만 추가매수, 그 외엔 보유.` };
    return { label: "보유 (반등 대기)", kind: "buy", desc: `${pct.toFixed(1)}% 손실 중이지만 매수 신호가 강해 반등 여지 있음. 손절보다 보유 유지 or 추가매수(평단 낮추기) 검토.` };
  }
  // HOLD
  if (pct >= 20) return { label: "보유 (익절 시점 관망)", kind: "hold", desc: `수익 +${pct.toFixed(1)}% 확보 중, 신호는 홀드. 매도 신호 전환 시 부분 익절 준비.` };
  if (pct <= -10) return { label: "보유 (손절선 관찰)", kind: "hold", desc: `-${Math.abs(pct).toFixed(1)}% 손실 중, 신호 홀드. 손절선 설정하고 매도 신호 전환 시 대응.` };
  return { label: "보유", kind: "hold", desc: `현재 손익 ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%, 신호 홀드. 유의미한 신호 변화 시까지 보유 유지.` };
}

function generateRuleSummary(tickerLabel, ruleResult, positive, negative) {
  const signal = ruleResult.signal;
  const conf = ruleResult.confidence;
  const posTags = positive.slice(0, 3).map((c) => c.tag);
  const negTags = negative.slice(0, 2).map((c) => c.tag);
  const parts = [];

  if (signal === "BUY") {
    parts.push(`${tickerLabel}는 현재 매수 신호가 우세합니다.`);
    if (posTags.length) {
      parts.push(`주요 지지 요인은 ${posTags.join(", ")} 등이며, 상방 여지를 뒷받침합니다.`);
    }
    if (negTags.length) {
      parts.push(`다만 ${negTags.join(", ")}는 단기 조정 리스크로 작용할 수 있어, 성급한 진입보다 확인 후 진입이 안전합니다.`);
    }
  } else if (signal === "SELL") {
    parts.push(`${tickerLabel}는 현재 매도 신호가 우세합니다.`);
    if (negTags.length) {
      parts.push(`주된 하방 요인은 ${negTags.join(", ")} 등입니다.`);
    }
    if (posTags.length) {
      parts.push(`반면 ${posTags.join(", ")}가 반등 지지 요인으로 존재하므로 완전 청산보다 부분 축소가 합리적일 수 있습니다.`);
    }
  } else {
    parts.push(`${tickerLabel}는 방향성이 뚜렷하지 않아 홀드가 적절합니다.`);
    if (posTags.length && negTags.length) {
      parts.push(`상방 요인(${posTags.slice(0, 2).join(", ")})과 하방 리스크(${negTags.join(", ")})가 상쇄되어 있어, 추가 신호 확인 후 판단이 안전합니다.`);
    } else if (posTags.length) {
      parts.push(`상방 요인(${posTags.slice(0, 2).join(", ")})이 있으나 결정적인 매수 신호까진 부족한 상황입니다.`);
    } else if (negTags.length) {
      parts.push(`하방 리스크(${negTags.join(", ")})가 존재하나 확정적 매도 신호는 아니어서 관망이 유리합니다.`);
    }
  }

  if (conf < 0.3) {
    parts.push(`신호 강도는 약한 편이라 큰 포지션 결정 전에 재확인을 권장합니다.`);
  } else if (conf > 0.75) {
    parts.push(`신호 강도가 강해 결정 근거가 상대적으로 견고합니다.`);
  }

  return parts.join(" ");
}

function renderResults(ruleResult, claudeResult, finalResult) {
  els.resultCard.hidden = false;

  // Final verdict — parse contributions
  const sigClass = finalResult.signal.toLowerCase();
  const shortLabel = (text) => {
    const m = String(text).match(/—\s*(.+?)\s*\([+\-]?[0-9.]+\)\s*$/);
    if (m) return m[1].trim();
    const m2 = String(text).match(/^(.+?)\s*\([+\-]?[0-9.]+\)\s*$/);
    return m2 ? m2[1].trim() : String(text);
  };
  const contribs = (ruleResult.reasons || []).map((r) => {
    const m = String(r).match(/\(([+\-]?[0-9.]+)\)\s*$/);
    return { text: String(r), tag: shortLabel(r), score: m ? parseFloat(m[1]) : 0 };
  });
  const positive = contribs.filter((c) => c.score > 0.01).sort((a, b) => b.score - a.score);
  const negative = contribs.filter((c) => c.score < -0.01).sort((a, b) => a.score - b.score);
  const posList = positive.slice(0, 3).map((c) => `<li>${escapeHtml(c.text)}</li>`).join("");
  const negList = negative.slice(0, 3).map((c) => `<li>${escapeHtml(c.text)}</li>`).join("");
  const confPct = (finalResult.confidence * 100).toFixed(0);

  // Natural-language reasoning summary
  const tickerLabel = priceData?.ticker || "이 종목";
  const pnl = computePnL(priceData, positionData, statsData);
  const posAction = positionAction(finalResult.signal, pnl);
  const narrativeSummary = claudeResult?.reasoning
    ? claudeResult.reasoning
    : generateRuleSummary(tickerLabel, ruleResult, positive, negative);
  const summarySource = claudeResult?.reasoning ? "Claude AI" : "규칙 엔진";
  const positionBlock = `
    <div class="position-action ${posAction.kind}">
      <div class="pa-label">내 액션 (${pnl ? "보유 중" : "미보유"})</div>
      <div class="pa-title">${escapeHtml(posAction.label)}</div>
      <div class="pa-desc">${escapeHtml(posAction.desc)}</div>
    </div>`;

  els.finalVerdict.innerHTML = `
    <div class="label">최종 판단</div>
    <div class="signal ${sigClass}">${signalLabelKo(finalResult.signal)} <span class="signal-en">(${finalResult.signal})</span></div>
    <div class="conf-row">
      <span class="conf-label">신뢰도 ${confPct}%</span>
      <div class="conf-bar"><div class="conf-bar-fill ${sigClass}" style="width:${confPct}%"></div></div>
    </div>
    ${positionBlock}
    <div class="verdict-narrative">
      <h4>📝 판단 근거 요약 <span class="narrative-source">${escapeHtml(summarySource)}</span></h4>
      <p>${escapeHtml(narrativeSummary)}</p>
    </div>
    <div class="drivers-grid">
      ${positive.length ? `<div class="drivers-block support"><h4>✅ 지지 요인 (상위 ${Math.min(3, positive.length)})</h4><ul>${posList}</ul></div>` : ""}
      ${negative.length ? `<div class="drivers-block risk"><h4>⚠️ 리스크 (상위 ${Math.min(3, negative.length)})</h4><ul>${negList}</ul></div>` : ""}
    </div>
    <div class="summary-line">${escapeHtml(finalResult.summary)}</div>
    <div class="recheck-hint">🔄 재확인 권장: <strong>3~5 거래일 후</strong> 또는 실적 발표 / 주요 뉴스 발생 시</div>
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
loadWatchlist();

// ---------- Watchlist (recent tickers) ----------
const WATCHLIST_KEY = "stocksignal.watchlist";
function loadWatchlist() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []; } catch (_) {}
  renderWatchlist(list);
}
function pushWatchlist(ticker) {
  const t = ticker.toUpperCase();
  let list = [];
  try { list = JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || []; } catch (_) {}
  list = [t, ...list.filter((x) => x !== t)].slice(0, 5);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  renderWatchlist(list);
}
function renderWatchlist(list) {
  if (!list || !list.length) { els.watchlistField.hidden = true; return; }
  els.watchlistField.hidden = false;
  els.watchlistChips.innerHTML = list.map((t) => `<button type="button" class="chip" data-ticker="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("");
  els.watchlistChips.querySelectorAll(".chip").forEach((el) => {
    el.addEventListener("click", () => {
      els.ticker.value = el.dataset.ticker;
      els.fetchBtn.click();
    });
  });
}
els.ticker.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); els.fetchBtn.click(); }
});

// ============================================================
// Auto Monitor — Paper Trading System
// ============================================================
const MON_STORAGE = "stocksignal.monitor";
let monitorTimer = null;
let monitorCycleRunning = false;

function defaultMonitorState() {
  return {
    running: false,
    initialCash: 10000,
    cash: 10000,
    holdings: {}, // {AAPL: {qty, avgPrice, lastPrice}}
    tickers: [],
    intervalMin: 60,
    positionSize: 1000,
    log: [],
    lastRun: null,
  };
}

function loadMonitorState() {
  try {
    const s = JSON.parse(localStorage.getItem(MON_STORAGE));
    if (!s || typeof s !== "object") return defaultMonitorState();
    return { ...defaultMonitorState(), ...s };
  } catch (_) { return defaultMonitorState(); }
}

function saveMonitorState(s) {
  localStorage.setItem(MON_STORAGE, JSON.stringify(s));
}

function fmtUSD(v) {
  return "$" + (v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderMonitor() {
  const s = loadMonitorState();
  const holdingsValue = Object.values(s.holdings).reduce(
    (sum, h) => sum + (h.qty || 0) * (h.lastPrice || h.avgPrice || 0),
    0
  );
  const total = (s.cash || 0) + holdingsValue;
  const pnlPct = ((total - s.initialCash) / s.initialCash) * 100;

  els.portCash.textContent = fmtUSD(s.cash);
  els.portHoldingsValue.textContent = fmtUSD(holdingsValue);
  els.portTotal.textContent = fmtUSD(total);
  els.portPnl.textContent = (pnlPct >= 0 ? "+" : "") + pnlPct.toFixed(2) + "%";
  els.portPnl.className = "port-value " + (pnlPct >= 0 ? "up" : "down");

  // Holdings table
  const holdingEntries = Object.entries(s.holdings);
  if (!holdingEntries.length) {
    els.portHoldingsTable.innerHTML = `<p class="hint" style="margin:6px 0">아직 보유 종목이 없습니다.</p>`;
  } else {
    els.portHoldingsTable.innerHTML = `
      <table class="holdings-table-inner">
        <thead><tr><th>티커</th><th>수량</th><th>평단</th><th>현재가</th><th>손익</th><th>가치</th></tr></thead>
        <tbody>
          ${holdingEntries.map(([t, h]) => {
            const cur = h.lastPrice || h.avgPrice;
            const pnlP = ((cur - h.avgPrice) / h.avgPrice) * 100;
            const val = cur * h.qty;
            const cls = pnlP >= 0 ? "up" : "down";
            return `<tr>
              <td><strong>${escapeHtml(t)}</strong></td>
              <td>${h.qty.toFixed(4)}</td>
              <td>${fmtUSD(h.avgPrice)}</td>
              <td>${fmtUSD(cur)}</td>
              <td class="${cls}">${pnlP >= 0 ? "+" : ""}${pnlP.toFixed(2)}%</td>
              <td>${fmtUSD(val)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  // Log
  const log = s.log || [];
  if (!log.length) {
    els.monitorLog.innerHTML = `<p class="hint" style="margin:8px 0">아직 결정 이력이 없습니다.</p>`;
  } else {
    els.monitorLog.innerHTML = `
      <table class="log-table">
        <thead><tr><th>시간</th><th>티커</th><th>신호</th><th>액션</th><th>가격</th><th>수량</th><th>근거</th></tr></thead>
        <tbody>
          ${log.slice(0, 50).map((r) => {
            const dt = new Date(r.ts);
            const time = `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
            const actClass = r.action === "BUY" ? "up" : (r.action === "SELL" ? "down" : (r.action === "ERROR" ? "err" : "muted"));
            return `<tr>
              <td class="log-time">${escapeHtml(time)}</td>
              <td><strong>${escapeHtml(r.ticker)}</strong></td>
              <td class="log-sig-${(r.signal||"").toLowerCase()}">${escapeHtml(r.signal || "-")}</td>
              <td class="log-act ${actClass}">${escapeHtml(r.action)}</td>
              <td>${r.price ? fmtUSD(r.price) : "-"}</td>
              <td>${r.qty ? r.qty.toFixed(4) : "-"}</td>
              <td class="log-reason">${escapeHtml((r.reason || "").slice(0, 120))}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  // Status
  if (s.running) {
    const nextRun = s.lastRun ? new Date(new Date(s.lastRun).getTime() + s.intervalMin * 60000) : null;
    els.monitorStatus.innerHTML = `🟢 감시 중 · 간격: ${s.intervalMin}분 · 다음 실행: ${nextRun ? nextRun.toLocaleTimeString("ko-KR") : "잠시 후"}`;
    els.monitorStartBtn.hidden = true;
    els.monitorStopBtn.hidden = false;
  } else {
    els.monitorStatus.innerHTML = `⚪ 감시 중지됨.${s.lastRun ? " 마지막 실행: " + new Date(s.lastRun).toLocaleString("ko-KR") : ""}`;
    els.monitorStartBtn.hidden = false;
    els.monitorStopBtn.hidden = true;
  }

  // Sync form values
  els.monitorTickers.value = (s.tickers || []).join(", ");
  els.monitorInterval.value = String(s.intervalMin);
  els.monitorPositionSize.value = s.positionSize;
  els.monitorInitialCash.value = s.initialCash;
}

function parseTickers(str) {
  return String(str || "")
    .split(/[,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
}

function readMonitorFormIntoState() {
  const s = loadMonitorState();
  s.tickers = parseTickers(els.monitorTickers.value);
  s.intervalMin = parseInt(els.monitorInterval.value) || 60;
  s.positionSize = parseFloat(els.monitorPositionSize.value) || 1000;
  const newInitial = parseFloat(els.monitorInitialCash.value) || 10000;
  // Only reset cash if initial changed AND no trades yet
  if (newInitial !== s.initialCash && !(s.log || []).length) {
    s.initialCash = newInitial;
    s.cash = newInitial;
  } else {
    s.initialCash = newInitial;
  }
  saveMonitorState(s);
  return s;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runMonitorCycle() {
  if (monitorCycleRunning) return;
  monitorCycleRunning = true;
  const s = readMonitorFormIntoState();
  if (!s.tickers.length) {
    els.monitorStatus.innerHTML = `<span class="error">감시할 티커가 없습니다.</span>`;
    monitorCycleRunning = false;
    return;
  }

  els.monitorStatus.innerHTML = `⏳ 사이클 실행 중… (${s.tickers.length}개 티커 순차 조회)`;

  for (const t of s.tickers) {
    try {
      const pData = await fetchYahoo(t, "3mo");
      await sleep(1400);
      let stData = null;
      try { stData = await fetchStats(t); } catch (_) {}
      await sleep(1400);

      const ruleResult = ruleBasedSignal(pData, "", stData);
      const currentPrice = pData.meta.regularMarketPrice ?? pData.prices[pData.prices.length - 1].close;

      // Update lastPrice on holdings
      if (s.holdings[t]) s.holdings[t].lastPrice = currentPrice;

      const holding = s.holdings[t];
      const reasonShort = ruleResult.reasons.slice(0, 2).map((r) => String(r).replace(/\s*\([+\-]?[0-9.]+\)\s*$/, "")).join(" | ");

      let action = "HOLD", qty = 0;
      if (ruleResult.signal === "BUY" && !holding && s.cash >= 10) {
        const budget = Math.min(s.positionSize, s.cash);
        qty = Math.floor((budget / currentPrice) * 10000) / 10000;
        if (qty > 0) {
          const cost = qty * currentPrice;
          s.cash -= cost;
          s.holdings[t] = { qty, avgPrice: currentPrice, lastPrice: currentPrice };
          action = "BUY";
        }
      } else if (ruleResult.signal === "SELL" && holding) {
        const proceeds = holding.qty * currentPrice;
        s.cash += proceeds;
        qty = holding.qty;
        delete s.holdings[t];
        action = "SELL";
      }

      s.log.unshift({
        ts: new Date().toISOString(),
        ticker: t,
        signal: ruleResult.signal,
        action,
        price: currentPrice,
        qty,
        reason: reasonShort,
      });
    } catch (err) {
      s.log.unshift({
        ts: new Date().toISOString(),
        ticker: t,
        signal: "",
        action: "ERROR",
        price: 0,
        qty: 0,
        reason: (err.message || "unknown").slice(0, 200),
      });
    }
    await sleep(500);
  }

  s.log = s.log.slice(0, 200);
  s.lastRun = new Date().toISOString();
  saveMonitorState(s);
  renderMonitor();
  monitorCycleRunning = false;
}

function startMonitor() {
  const s = readMonitorFormIntoState();
  if (!s.tickers.length) {
    els.monitorStatus.innerHTML = `<span class="error">감시할 티커를 먼저 입력하세요.</span>`;
    return;
  }
  if (!localStorage.getItem("stocksignal.avKey")) {
    els.monitorStatus.innerHTML = `<span class="error">Alpha Vantage API 키가 필요합니다.</span>`;
    return;
  }
  s.running = true;
  saveMonitorState(s);
  renderMonitor();
  runMonitorCycle();
  if (monitorTimer) clearInterval(monitorTimer);
  monitorTimer = setInterval(runMonitorCycle, s.intervalMin * 60 * 1000);
}

function stopMonitor() {
  const s = loadMonitorState();
  s.running = false;
  saveMonitorState(s);
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
  renderMonitor();
}

function resetMonitor() {
  if (!confirm("포트폴리오, 결정 로그 전체를 초기화합니다. 진행할까요?")) return;
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
  const fresh = defaultMonitorState();
  fresh.initialCash = parseFloat(els.monitorInitialCash.value) || 10000;
  fresh.cash = fresh.initialCash;
  fresh.positionSize = parseFloat(els.monitorPositionSize.value) || 1000;
  fresh.intervalMin = parseInt(els.monitorInterval.value) || 60;
  fresh.tickers = parseTickers(els.monitorTickers.value);
  saveMonitorState(fresh);
  renderMonitor();
}

els.monitorStartBtn.addEventListener("click", startMonitor);
els.monitorStopBtn.addEventListener("click", stopMonitor);
els.monitorRunOnceBtn.addEventListener("click", () => { readMonitorFormIntoState(); runMonitorCycle(); });
els.monitorResetBtn.addEventListener("click", resetMonitor);
[els.monitorTickers, els.monitorInterval, els.monitorPositionSize, els.monitorInitialCash].forEach((el) => {
  el.addEventListener("change", readMonitorFormIntoState);
});

// Resume monitor on page load if it was running
(function initMonitor() {
  renderMonitor();
  const s = loadMonitorState();
  if (s.running) {
    // Restart timer (page reload lost the interval)
    if (monitorTimer) clearInterval(monitorTimer);
    monitorTimer = setInterval(runMonitorCycle, s.intervalMin * 60 * 1000);
    els.monitorStatus.innerHTML = `🟢 감시 재개 (페이지 재접속). 다음 실행까지 최대 ${s.intervalMin}분.`;
  }
})();
