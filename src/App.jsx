import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { LINE_GUIDES, NUMBER_GUIDES } from "./data/guides";
import { calculateNumerology, isLineActive, normalizeInputValue, parseBirthday } from "./lib/numerology";

function ShapeCell({ number, result }) {
  const circleCount = result ? result.circles.get(number) : 0;
  const triangleCount = result ? result.triangles.get(number) : 0;
  const hasSquare = result ? result.squareAt === number : false;
  const muted = !circleCount && !triangleCount && !hasSquare;

  const DIGIT_BASE = 76;
  const CIRCLE_FIRST_DELTA = 28;
  const CIRCLE_STEP = 22;
  const TRIANGLE_FROM_CIRCLE_DELTA = 18;
  const TRIANGLE_FROM_DIGIT_DELTA = 26;
  const TRIANGLE_STEP = 24;

  function getCircleDiameter(index) {
    return DIGIT_BASE + CIRCLE_FIRST_DELTA + (index * CIRCLE_STEP);
  }

  function getLastCircleDiameter(count) {
    if (count <= 0) return null;
    return getCircleDiameter(count - 1);
  }

  function getFirstTriangleWidth(count) {
    const lastCircleDiameter = getLastCircleDiameter(count);
    if (lastCircleDiameter) return lastCircleDiameter + TRIANGLE_FROM_CIRCLE_DELTA;
    return DIGIT_BASE + TRIANGLE_FROM_DIGIT_DELTA;
  }

  function getTriangleWidth(index, count) {
    return getFirstTriangleWidth(count) + (index * TRIANGLE_STEP);
  }

  const circles = Array.from({ length: circleCount }).map((_, i) => {
    const size = getCircleDiameter(i);
    return <div key={`c-${size}-${i}`} className="shape circle" style={{ width: size, height: size }} />;
  });

  const triangles = Array.from({ length: triangleCount }).map((_, i) => {
    const triangleWidth = getTriangleWidth(i, circleCount);
    const size = triangleWidth / 2;
    const width = size * 2;
    const height = size * 1.72;

    return (
      <svg
        key={`t-${size}-${i}`}
        className="shape triangle"
        viewBox="0 0 100 86"
        aria-hidden="true"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <polygon points="50,7 8,79 92,79" />
      </svg>
    );
  });

  return (
    <article className="cell">
      <div className="shape-layer">
        {circles}
        {triangles}
        {hasSquare ? <div className="shape square" /> : null}
      </div>
      <div className={`digit ${muted ? "muted" : ""}`}>{number}</div>
    </article>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const queryDate = normalizeInputValue(params.get("d") || "");
  const parsedQueryDate = parseBirthday(queryDate);
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(parsedQueryDate ? String(parsedQueryDate.year) : "");
  const [selectedMonth, setSelectedMonth] = useState(parsedQueryDate ? String(parsedQueryDate.month) : "");
  const [selectedDay, setSelectedDay] = useState(parsedQueryDate ? String(parsedQueryDate.day) : "");

  const yearOptions = useMemo(
    () => Array.from({ length: currentYear - 1912 + 1 }, (_, index) => currentYear - index),
    [currentYear],
  );
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const maxDay = useMemo(() => {
    if (!selectedMonth) return 31;
    const safeYear = selectedYear ? Number(selectedYear) : 2000;
    return new Date(safeYear, Number(selectedMonth), 0).getDate();
  }, [selectedMonth, selectedYear]);
  const dayOptions = useMemo(() => Array.from({ length: maxDay }, (_, index) => index + 1), [maxDay]);

  useEffect(() => {
    if (selectedDay && Number(selectedDay) > maxDay) {
      setSelectedDay("");
    }
  }, [maxDay, selectedDay]);

  const value = useMemo(() => {
    if (!selectedYear || !selectedMonth || !selectedDay) return "";
    return `${selectedYear}/${String(selectedMonth).padStart(2, "0")}/${String(selectedDay).padStart(2, "0")}`;
  }, [selectedDay, selectedMonth, selectedYear]);

  const result = useMemo(() => calculateNumerology(value), [value]);

  function calculateShapeScores(currentResult) {
    const scores = new Map();
    const riskItems = [];

    for (let number = 1; number <= 9; number += 1) {
      if (!currentResult) {
        scores.set(number, 0);
        continue;
      }

      const circleScore = currentResult.circles.get(number) * 1;
      const triangleScore = currentResult.triangles.get(number) * 2;
      const squareScore = currentResult.squareAt === number ? 4 : 0;
      const totalScore = circleScore + triangleScore + squareScore;

      scores.set(number, totalScore);

      if (totalScore > 2) {
        riskItems.push({ number, score: totalScore });
      }
    }

    riskItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.number - b.number;
    });

    return { scores, riskItems };
  }

  const scoreResult = useMemo(() => calculateShapeScores(result), [result]);

  const bornDigits = useMemo(() => {
    if (!result) return [];
    const output = [];
    for (let number = 1; number <= 9; number += 1) {
      if (result.circles.get(number) > 0) output.push(number);
    }
    return output;
  }, [result]);

  const lifeGuide = result ? NUMBER_GUIDES[result.life] : null;
  const riskNumbersText = scoreResult.riskItems.map((item) => item.number).join("、");
  const riskGuides = useMemo(
    () => scoreResult.riskItems.map((item) => ({ ...item, guide: NUMBER_GUIDES[item.number] })),
    [scoreResult.riskItems],
  );

  function syncQuery(nextValue) {
    const normalized = normalizeInputValue(nextValue);
    const url = new URL(window.location.href);
    if (normalized) {
      url.searchParams.set("d", normalized);
    } else {
      url.searchParams.delete("d");
    }
    window.history.replaceState({}, "", url);
  }

  useEffect(() => {
    syncQuery(value);
  }, [value]);

  function onClear() {
    setSelectedYear("");
    setSelectedMonth("");
    setSelectedDay("");
  }

  return (
    <main className="app">
      <section className="hero-card">
        <header className="hero">
          <h1 className="page-title">生命靈數計算機</h1>
          <p className="page-subtitle">請選擇自己的西元生日（年／月／日）</p>
        </header>

        <section className="dob-input">
          <div className="dob-select-group">
            <select
              id="dob-year"
              value={selectedYear}
              aria-label="選擇年份"
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              <option value="">年</option>
              {yearOptions.map((year) => (
                <option key={`y-${year}`} value={year}>
                  西元 {year}（民國 {year - 1911}）
                </option>
              ))}
            </select>

            <select
              id="dob-month"
              value={selectedMonth}
              aria-label="選擇月份"
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <option value="">月</option>
              {monthOptions.map((month) => (
                <option key={`m-${month}`} value={month}>
                  {String(month).padStart(2, "0")} 月
                </option>
              ))}
            </select>

            <select
              id="dob-day"
              value={selectedDay}
              aria-label="選擇日期"
              onChange={(event) => setSelectedDay(event.target.value)}
            >
              <option value="">日</option>
              {dayOptions.map((day) => (
                <option key={`d-${day}`} value={day}>
                  {String(day).padStart(2, "0")} 日
                </option>
              ))}
            </select>
          </div>
          <button className="clear-btn" type="button" aria-label="清除" onClick={onClear}>
            <X size={28} strokeWidth={3} />
          </button>
        </section>
      </section>

      <section className="summary">
        <article className="metric">
          <h2 className="metric-label">後天數</h2>
          <div className="metric-value green">{result ? result.postnatal : "-"}</div>
        </article>
        <article className="metric">
          <h2 className="metric-label">卓越數</h2>
          <div className="metric-value black">{result ? result.master : "-"}</div>
        </article>
        <article className="metric">
          <h2 className="metric-label">主命數</h2>
          <div className="metric-value red">{result ? result.life : "-"}</div>
        </article>
      </section>

      <section className="grid">
        {Array.from({ length: 9 }).map((_, idx) => (
          <ShapeCell key={idx + 1} number={idx + 1} result={result} />
        ))}
      </section>

      <section className="results-guide">
        <div className="results-intro-card">
          <h3 className="guide-title">結果說明</h3>
          <p className="guide-subtitle">以下內容依你提供的兩張圖卡整理，作為本計算結果的解讀參考。</p>
        </div>

        <div className="guide-panels">
          <div className="guide-column">
            <article className="guide-panel">
              <h4>主命數與符號說明</h4>
              <div className="shape-legend">
                <div className="legend-item legend-circle">
                  <span className="legend-icon"><span className="shape-dot circle" /></span>
                  <span className="legend-name">圓圈</span>
                  <span className="legend-desc">先天數（生日原始數字）</span>
                </div>
                <div className="legend-item legend-triangle">
                  <span className="legend-icon"><span className="shape-dot triangle" /></span>
                  <span className="legend-name">三角形</span>
                  <span className="legend-desc">後天數與卓越數</span>
                </div>
                <div className="legend-item legend-square">
                  <span className="legend-icon"><span className="shape-dot square" /></span>
                  <span className="legend-name">正方形</span>
                  <span className="legend-desc">主命數</span>
                </div>
              </div>
            </article>

            <article className="guide-panel life-panel">
              <h4>主命數解讀</h4>
              {result && lifeGuide ? (
                <>
                  <div className="life-summary">
                    <span>{result.life}號｜{lifeGuide.short}</span>
                    <span className="life-type-inline">{lifeGuide.type}</span>
                  </div>
                  <div className="life-meta-chips">
                    <span className="meta-chip">先天數：{bornDigits.join("、") || "無"}</span>
                    <span className="meta-chip">後天數：{result.postnatal}</span>
                    <span className="meta-chip">卓越數：{result.master}</span>
                  </div>
                  <div className="pm-block plus"><strong>(+)</strong><span>{lifeGuide.plus}</span></div>
                  <div className="pm-block minus"><strong>(-)</strong><span>{lifeGuide.minus}</span></div>
                </>
              ) : (
                <>
                  <div className="life-summary">請先輸入生日</div>
                  <div className="life-meta-empty">輸入後會顯示你對應的主命數重點解讀。</div>
                </>
              )}
            </article>

            <article className="guide-panel risk-focus-panel">
              <h4>負向特質提醒</h4>
              {!result ? (
                <p className="risk-focus-empty">請先輸入有效生日。</p>
              ) : (
                <>
                  <div className="risk-focus-summary">
                    <strong>需留意負向特質：</strong>
                    {scoreResult.riskItems.length > 0
                      ? `超過兩分的生命靈數為 ${riskNumbersText}。`
                      : "目前沒有需特別留意的數字。"}
                  </div>
                  {riskGuides.length > 0 ? (
                    <div className="risk-focus-list">
                      {riskGuides.map((item) => (
                        <article key={`risk-${item.number}`} className="risk-focus-item">
                          <div className="risk-focus-top">
                            <div className="risk-focus-head">{item.number}號｜{item.guide.short}</div>
                            <span className="risk-score-badge">{item.score}分</span>
                          </div>
                          <div className="risk-focus-meta">{item.guide.type}</div>
                          <div className="risk-focus-minus"><strong>(-)</strong> {item.guide.minus}</div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </article>
          </div>

          <article className="guide-panel">
            <h4>九宮格線組合</h4>
            <ul className="line-list">
              {LINE_GUIDES.map((line) => {
                const active = result ? isLineActive(line.code, result.lineDigits) : false;
                return (
                  <li key={line.code} className={`line-item ${active ? "active" : ""}`}>
                    <span className="line-name">{line.code} {line.name}</span>
                    <span className="line-state">{active ? "已形成" : "未形成"}</span>
                  </li>
                );
              })}
            </ul>
          </article>
        </div>

        <article className="score-note-card">
          <h4>隱藏計算式備註</h4>
          <p className="score-note-desc">系統已套用圖形權重評分，僅顯示分數超過 2 分的數字。</p>
          {!result ? (
            <p className="score-note-empty">請先輸入有效生日。</p>
          ) : scoreResult.riskItems.length === 0 ? (
            <p className="score-note-empty">目前沒有分數超過 2 分的數字。</p>
          ) : (
            <ul className="score-note-list">
              {scoreResult.riskItems.map((item) => (
                <li key={`score-${item.number}`} className="score-note-item">
                  <span>數字 {item.number}（負面特質較容易顯現）</span>
                  <span className="score-note-badge">{item.score} 分</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <details className="full-guide">
          <summary>查看 1-9 全部正負向解讀</summary>
          <div className="number-meaning-list">
            {Object.entries(NUMBER_GUIDES).map(([number, guide]) => (
              <article className="meaning-item" key={number}>
                <div className="meaning-head">{number} {guide.short}</div>
                <div className="meaning-type">{guide.type}</div>
                <div className="meaning-plus">(+ ) {guide.plus}</div>
                <div className="meaning-minus">(- ) {guide.minus}</div>
              </article>
            ))}
          </div>
        </details>
      </section>
    </main>
  );
}
