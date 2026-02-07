import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { LINE_GUIDES, NUMBER_GUIDES } from "./data/guides";
import { calculateNumerology, isLineActive, normalizeInputValue } from "./lib/numerology";

function ShapeCell({ number, result }) {
  const circleCount = result ? result.circles.get(number) : 0;
  const triangleCount = result ? result.triangles.get(number) : 0;
  const hasSquare = result ? result.squareAt === number : false;
  const muted = !circleCount && !triangleCount && !hasSquare;

  const circles = Array.from({ length: circleCount }).map((_, i) => {
    const size = 60 + (circleCount - i - 1) * 24;
    return <div key={`c-${size}-${i}`} className="shape circle" style={{ width: size, height: size }} />;
  });

  const triangles = Array.from({ length: triangleCount }).map((_, i) => {
    let baseSize = 44;
    let step = 0;

    if (triangleCount === 2) {
      baseSize = 38;
      step = 14;
    } else if (triangleCount >= 3) {
      baseSize = 34;
      step = 12;
    }

    const size = baseSize + (triangleCount - i - 1) * step;
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
  const defaultDate = normalizeInputValue(params.get("d") || "1981/12/07");

  const [value, setValue] = useState(defaultDate);
  const result = useMemo(() => calculateNumerology(value), [value]);

  const bornDigits = useMemo(() => {
    if (!result) return [];
    const output = [];
    for (let number = 1; number <= 9; number += 1) {
      if (result.circles.get(number) > 0) output.push(number);
    }
    return output;
  }, [result]);

  const lifeGuide = result ? NUMBER_GUIDES[result.life] : null;

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

  function onBlur() {
    const normalized = normalizeInputValue(value);
    setValue(normalized);
    syncQuery(normalized);
  }

  function onClear() {
    setValue("");
    syncQuery("");
  }

  return (
    <main className="app">
      <header className="hero">
        <h1 className="page-title">Life Number Calculator</h1>
        <p className="page-subtitle">請輸入自己的西元生日（YYYY/MM/DD）</p>
      </header>

      <section className="dob-input">
        <input
          id="dob"
          type="text"
          inputMode="numeric"
          placeholder="請輸入西元生日 YYYY/MM/DD"
          aria-label="輸入生日"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={onBlur}
        />
        <button className="clear-btn" type="button" aria-label="清除" onClick={onClear}>
          <X size={28} strokeWidth={3} />
        </button>
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

      <p className="helper">輸入生日（例如 1981/12/07 或 1981-12-07）後會自動計算。</p>

      <section className="results-guide">
        <h3 className="guide-title">結果說明</h3>
        <p className="guide-subtitle">以下內容依你提供的兩張圖卡整理，作為本計算結果的解讀參考。</p>

        <div className="guide-panels">
          <article className="guide-panel">
            <h4>主命數與符號說明</h4>
            <div className="shape-legend">
              <div className="shape-item"><span className="shape-dot circle" />圓圈：先天數（生日原始數字）</div>
              <div className="shape-item"><span className="shape-dot triangle" />三角形：後天數與卓越數</div>
              <div className="shape-item"><span className="shape-dot square" />正方形：主命數</div>
            </div>

            {result && lifeGuide ? (
              <>
                <div className="life-head">
                  {result.life} 號｜{lifeGuide.short}（{lifeGuide.type}）
                </div>
                <div className="life-meta">
                  先天數：{bornDigits.join("、") || "無"} ｜ 後天數：{result.postnatal} ｜ 卓越數：{result.master}
                </div>
                <div className="pm-block"><strong>(+)</strong>{lifeGuide.plus}</div>
                <div className="pm-block"><strong>(-)</strong>{lifeGuide.minus}</div>
              </>
            ) : (
              <>
                <div className="life-head">請先輸入生日</div>
                <div className="life-meta">輸入後會顯示你對應的說明。</div>
              </>
            )}
          </article>

          <article className="guide-panel">
            <h4>九宮格線組合</h4>
            <ul className="line-list">
              {LINE_GUIDES.map((line) => {
                const active = result ? isLineActive(line.code, result.presentDigits) : false;
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
