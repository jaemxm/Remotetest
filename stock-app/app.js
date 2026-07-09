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
  news: $("news"),
  apiKey: $("api-key"),
  model: $("model"),
  saveKeyBtn: $("save-key-btn"),
  clearKeyBtn: $("clear-key-btn"),
  keyStatus: $("key-status"),
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

// State
let priceData = null;

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

// ---------- Price fetching ----------
async function fetchYahoo(ticker, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=${range}`;
  const tryUrls = [
    url,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];
  let lastErr = null;
  for (const u of tryUrls) {
    try {
      const resp = await fetch(u);
      if (!resp.ok) { lastErr = new Error(`HTTP ${resp.status}`); continue; }
      const json = await resp.json();
      const result = json?.chart?.result?.[0];
      if (!result) throw new Error("응답에 데이터가 없습니다.");
      const closes = result.indicators?.quote?.[0]?.close;
      const timestamps = result.timestamp;
      if (!closes || !timestamps) throw new Error("가격 시계열이 비어 있습니다.");
      const pairs = timestamps
        .map((t, i) => ({ date: new Date(t * 1000), close: closes[i] }))
        .filter((p) => typeof p.close === "number" && !isNaN(p.close));
      if (pairs.length < 5) throw new Error("가격 데이터가 부족합니다.");
      return {
        ticker: result.meta?.symbol || ticker,
        currency: result.meta?.currency || "",
        exchange: result.meta?.exchangeName || "",
        prices: pairs,
      };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("가격 조회 실패");
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
  } catch (e) {
    priceData = null;
    els.priceStatus.innerHTML = `<span class="error">가격 조회 실패: ${escapeHtml(e.message)}. 티커를 확인하거나 잠시 후 다시 시도하세요.</span>`;
    els.pricePreview.hidden = true;
  } finally {
    els.fetchBtn.disabled = false;
  }
});

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
function ruleBasedSignal(priceData, newsText) {
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

  // Map score → signal
  let signal;
  if (score >= 1.2) signal = "BUY";
  else if (score <= -1.2) signal = "SELL";
  else signal = "HOLD";

  // Confidence: |score| normalized to 0..1 (cap at 3.5)
  const confidence = Math.min(1, Math.abs(score) / 3.5);

  return {
    signal,
    score: Math.round(score * 100) / 100,
    confidence,
    reasons,
    indicators: { last, sma20, sma50, rsi14, sentiment },
  };
}

// ---------- Claude API ----------
async function askClaude(apiKey, model, { ticker, priceSummaryText, newsText, ruleResult }) {
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

--- 뉴스 텍스트 ---
${newsText || "(뉴스 텍스트가 제공되지 않음)"}

--- 규칙 기반 사전 신호 (참고용) ---
signal: ${ruleResult.signal}
score: ${ruleResult.score}
reasons:
${ruleResult.reasons.map((r) => "- " + r).join("\n")}

위 정보를 종합해 독립적인 판단을 내려주세요. 규칙 기반 신호에 무조건 동조할 필요는 없습니다.`;

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
  const newsText = els.news.value;
  const priceSummaryText = formatPriceSummary(priceData);

  const ruleResult = ruleBasedSignal(priceData, newsText);

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
        newsText,
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
els.ticker.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); els.fetchBtn.click(); }
});
