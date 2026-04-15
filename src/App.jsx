import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const fmt = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M €`
    : `${Math.round(n).toLocaleString("bg-BG")} €`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0d0d0d",
      border: "1px solid #333",
      padding: "10px 14px",
      borderRadius: 6,
      fontFamily: "'Times New Roman', serif",
      fontSize: 12,
    }}>
      <div style={{ color: "#888", marginBottom: 4 }}>Година {label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function App() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("sp500-settings") || "{}"); } catch {}
  const [years, setYears] = useState(saved.years ?? 20);
  const [monthly, setMonthly] = useState(saved.monthly ?? 200);
  const [initial, setInitial] = useState(saved.initial ?? 1000);
  const [rate, setRate] = useState(saved.rate ?? 10.5);
  const [profitYear, setProfitYear] = useState(saved.years ?? 20);

  const persist = (patch) =>
    localStorage.setItem("sp500-settings", JSON.stringify({ years, monthly, initial, rate, ...patch }));

  const data = useMemo(() => {
    const r = rate / 100 / 12;
    let balance = initial;
    let contributed = initial;
    const rows = [{ year: 0, total: Math.round(balance), invested: Math.round(contributed), gains: 0 }];
    for (let m = 1; m <= years * 12; m++) {
      balance = balance * (1 + r) + monthly;
      contributed = initial + monthly * m;
      if (m % 12 === 0) {
        rows.push({
          year: m / 12,
          total: Math.round(balance),
          invested: Math.round(contributed),
          gains: Math.round(balance - contributed),
        });
      }
    }
    return rows;
  }, [years, monthly, initial, rate]);

  const final = data[data.length - 1];
  const totalInvested = final.invested;
  const totalValue = final.total;
  const gainsPct = totalInvested > 0 ? Math.round(((totalValue - totalInvested) / totalInvested) * 100) : 0;

  // Clamp profitYear to the current investment period
  const clampedYear = Math.min(profitYear, years);
  const monthlyProfit = clampedYear === 0
    ? 0
    : Math.round((data[clampedYear].gains - data[clampedYear - 1].gains) / 12);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#f0f0f0",
      fontFamily: "'Times New Roman', serif",
      zoom: 1.3,
      padding: "32px 20px",
      boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #080808; }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 2px;
          background: #2a2a2a;
          outline: none;
          border-radius: 2px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: #e8ff5a;
          border-radius: 50%;
          cursor: pointer;
        }
        input[type=number] {
          background: #111;
          border: 1px solid #2a2a2a;
          color: #f0f0f0;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Times New Roman', serif;
          font-size: 13px;
          line-height: 1.5;
          width: 100%;
          outline: none;
        }
        input[type=number]:focus { border-color: #e8ff5a; }
        .stat-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 16px 20px;
          flex: 1;
          min-width: 140px;
        }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 4, color: "#555", fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>
          Калкулатор за индексен фонд
        </div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(20px, 4.2vw, 38px)",
          fontWeight: 800,
          margin: "0 0 4px 0",
          lineHeight: 1.1,
          letterSpacing: -1,
          whiteSpace: "nowrap",
        }}>
          S&P 500 <span style={{ color: "#e8ff5a" }}>Лихва върху лихва</span>
        </h1>
        <p style={{ color: "#555", fontSize: 12, margin: "0 0 32px 0" }}>
          Историческа средна доходност ~10.5% / година (номинална)
        </p>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <div className="stat-card">
            <div style={{ color: "#555", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Крайна стойност</div>
            <div style={{ fontFamily: "'Times New Roman', serif", fontSize: 22, fontWeight: 700, color: "#e8ff5a" }}>{fmt(totalValue)}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: "#555", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Общо вложено</div>
            <div style={{ fontFamily: "'Times New Roman', serif", fontSize: 22, fontWeight: 700 }}>{fmt(totalInvested)}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: "#555", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Печалба</div>
            <div style={{ fontFamily: "'Times New Roman', serif", fontSize: 22, fontWeight: 700, color: "#4ade80" }}>
              {fmt(final.gains)} <span style={{ fontSize: 13, color: "#555" }}>{gainsPct >= 0 ? "+" : ""}{gainsPct}%</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ marginBottom: 36, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px 10px 10px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8ff5a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e8ff5a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fill: "#444", fontSize: 10, fontFamily: "Times New Roman" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "#444", fontSize: 10, fontFamily: "Times New Roman" }} tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="invested" name="Вложено" stroke="#3b82f6" strokeWidth={1.5} fill="url(#investedGrad)" dot={false} />
              <Area type="monotone" dataKey="total" name="Портфолио" stroke="#e8ff5a" strokeWidth={2} fill="url(#totalGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Години</span>
              <span style={{ color: "#e8ff5a", fontWeight: 500, fontSize: 14 }}>{years} г.</span>
            </div>
            <input type="range" min={1} max={50} value={years} onChange={(e) => { setYears(+e.target.value); persist({ years: +e.target.value }); }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "#333", fontSize: 10 }}>
              <span>1</span><span>50</span>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Годишна доходност</span>
              <span style={{ color: "#e8ff5a", fontWeight: 500, fontSize: 14 }}>{rate}%</span>
            </div>
            <input type="range" min={1} max={20} step={0.5} value={rate} onChange={(e) => { setRate(+e.target.value); persist({ rate: +e.target.value }); }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "#333", fontSize: 10 }}>
              <span>1%</span><span style={{ color: "#555" }}>S&P ср. ~10.5%</span><span>20%</span>
            </div>
          </div>

          <div>
            <div style={{ color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Месечно (€)</div>
            <input type="number" min={0} value={monthly} onChange={(e) => { const v = Math.max(0, +e.target.value); setMonthly(v); persist({ monthly: v }); }} />
          </div>

          <div>
            <div style={{ color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Начална сума (€)</div>
            <input type="number" min={0} value={initial} onChange={(e) => { const v = Math.max(0, +e.target.value); setInitial(v); persist({ initial: v }); }} />
          </div>
        </div>

        {/* Monthly profit section */}
        <div style={{ marginTop: 32, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ color: "#555", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                Средна месечна печалба
              </div>
              <div style={{ fontFamily: "'Times New Roman', serif", fontSize: 28, fontWeight: 700, color: "#4ade80" }}>
                {fmt(monthlyProfit)}
              </div>
            </div>
            <div style={{ color: "#444", fontSize: 11, paddingBottom: 4 }}>
              за година {clampedYear === 0 ? "0 (начален момент)" : clampedYear}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Година</span>
              <span style={{ color: "#e8ff5a", fontWeight: 500, fontSize: 14 }}>{clampedYear} г.</span>
            </div>
            <input
              type="range"
              min={0}
              max={years}
              value={clampedYear}
              onChange={(e) => setProfitYear(+e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "#333", fontSize: 10 }}>
              <span>0</span><span>{years}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32, borderTop: "1px solid #1a1a1a", paddingTop: 16, color: "#333", fontSize: 10, lineHeight: 1.6 }}>
          Миналите резултати не гарантират бъдещи. Историческа номинална доходност на S&P 500 ~10.5%/год. Реална (след инфлация) ~7%.
        </div>
      </div>
    </div>
  );
}
