import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiActivity, FiBarChart2, FiCheckCircle, FiHash, FiTarget, FiTrendingUp } from "react-icons/fi";

const COLORS = { low: "#72809a", developing: "#7d76fa", competitive: "#ffbf47", high: "#ff4f87", top: "#36c5a1" };
const THRESHOLDS = [44 / 3, 15, 46 / 3, 47 / 3];
const format = (value, decimals = 2) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
const third = (value) => Math.round(value * 3) / 3;

const percentile = (sorted, ratio) => {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const colorFor = (score) => score < 12 ? COLORS.low : score < 14 ? COLORS.developing : score < 15 ? COLORS.competitive : score < 16 ? COLORS.high : COLORS.top;

function Stat({ icon: Icon, label, value, detail, tone = "violet" }) {
  return <article className={`distribution-stat stat-${tone}`}><span className="distribution-stat-icon"><Icon aria-hidden="true"/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function ExactHistogram({ data }) {
  if (!data.length) return <div className="distribution-empty">Sin datos sincronizados.</div>;
  return <ResponsiveContainer width="100%" height={350}><BarChart data={data} margin={{ top: 22, right: 10, left: -18, bottom: 5 }}>
    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5"/>
    <XAxis dataKey="score" tickFormatter={(value) => format(value, value % 1 ? 1 : 0)} interval="preserveStartEnd" minTickGap={22} stroke="var(--text-soft)" tick={{ fontSize: 12 }}/>
    <YAxis stroke="var(--text-soft)" tick={{ fontSize: 12 }}/>
    <Tooltip cursor={{ fill: "color-mix(in srgb, var(--text-soft) 7%, transparent)" }} formatter={(value, _name, item) => [`${format(value, 0)} · ${format(item.payload.percentage, 1)}%`, "Personas"]} labelFormatter={(value) => `P2 ${format(value)}`} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }} labelStyle={{ color: "var(--text)" }} itemStyle={{ color: "var(--text)" }}/>
    {THRESHOLDS.map((value) => <ReferenceLine key={value} x={third(value)} stroke="#ff4f87" strokeWidth={1.25} strokeDasharray="4 4"/>) }
    <Bar dataKey="count" radius={[3, 3, 0, 0]}>{data.map(({ score }) => <Cell key={score} fill={colorFor(score)}/>)}</Bar>
  </BarChart></ResponsiveContainer>;
}

function RangeDonut({ data, total }) {
  return <div className="range-donut"><div className="range-donut-visual"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data} dataKey="count" nameKey="label" innerRadius="58%" outerRadius="84%" paddingAngle={2}>{data.map((item) => <Cell key={item.label} fill={item.color}/>)}</Pie><Tooltip formatter={(value, _name, item) => [`${format(value, 0)} · ${format(value / total * 100, 1)}%`, item.payload.label]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{format(total, 0)}</strong><span>registros</span></div></div><div className="range-legend">{data.map((item) => <div key={item.label}><i style={{ background: item.color }}/><span>{item.label}</span><strong>{format(item.count, 0)}</strong><small>{format(item.count / total * 100, 1)}%</small></div>)}</div></div>;
}

export default function DistributionDashboard({ analysis }) {
  const [p1Filter, setP1Filter] = useState("passed");
  const [visibleRows, setVisibleRows] = useState(14);
  const candidates = useMemo(() => analysis?.p2Candidates?.filter(({ rawP1 }) => p1Filter === "all" || rawP1 >= 35) || [], [analysis, p1Filter]);
  const values = candidates.map(({ rawP2 }) => rawP2);
  const sorted = [...values].sort((a, b) => a - b);
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const median = percentile(sorted, .5);
  const q1 = percentile(sorted, .25);
  const q3 = percentile(sorted, .75);
  const deviation = values.length ? Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length) : null;
  const counts = values.reduce((map, value) => map.set(third(value), (map.get(third(value)) || 0) + 1), new Map());
  const maximum = counts.size ? Math.max(...counts.values()) : 0;
  const modes = [...counts.entries()].filter(([, count]) => count === maximum).map(([score]) => score).sort((a, b) => a - b);
  const histogram = [...counts.entries()].sort(([a], [b]) => a - b).map(([score, count]) => ({ score, count, percentage: count / values.length * 100 }));
  const ranges = [
    { label: "Menos de 12", count: values.filter((value) => value < 12).length, color: COLORS.low },
    { label: "12 a 13,99", count: values.filter((value) => value >= 12 && value < 14).length, color: COLORS.developing },
    { label: "14 a 14,99", count: values.filter((value) => value >= 14 && value < 15).length, color: COLORS.competitive },
    { label: "15 a 15,99", count: values.filter((value) => value >= 15 && value < 16).length, color: COLORS.high },
    { label: "16 o más", count: values.filter((value) => value >= 16).length, color: COLORS.top },
  ];
  const apt = values.filter((value) => third(value) >= 15).length;
  const filterLabel = p1Filter === "passed" ? "P1 ≥ 35" : "sin filtro de P1";

  return <section className="distribution-dashboard">
    <div className="distribution-heading"><div><span>Turno general · muestra en directo</span><h2>Distribución de notas P2</h2><p>Forma, concentración y tramos competitivos de las notas registradas en el simulador.</p></div><div className="distribution-filter" role="group" aria-label="Filtro de P1"><button className={p1Filter === "passed" ? "active" : ""} onClick={() => { setP1Filter("passed"); setVisibleRows(14); }} type="button">P1 ≥ 35</button><button className={p1Filter === "all" ? "active" : ""} onClick={() => { setP1Filter("all"); setVisibleRows(14); }} type="button">Toda la muestra</button></div></div>

    <div className="distribution-stats">
      <Stat icon={FiHash} label="Muestra analizada" value={analysis ? format(values.length, 0) : "—"} detail={filterLabel} tone="violet"/>
      <Stat icon={FiTrendingUp} label="Media P2" value={average === null ? "—" : format(average)} detail="Nota bruta observada" tone="green"/>
      <Stat icon={FiTarget} label="Mediana P2" value={median === null ? "—" : format(median)} detail="50% por encima y debajo" tone="pink"/>
      <Stat icon={FiBarChart2} label="Moda P2" value={modes.length ? modes.map((value) => format(value)).join(" / ") : "—"} detail={`${format(maximum, 0)} registros en el valor modal`} tone="amber"/>
      <Stat icon={FiActivity} label="Desviación típica" value={deviation === null ? "—" : format(deviation)} detail={q1 === null ? "Sin datos" : `Q1 ${format(q1)} · Q3 ${format(q3)}`} tone="violet"/>
      <Stat icon={FiCheckCircle} label="P2 ≥ 15" value={values.length ? `${format(apt, 0)} · ${format(apt / values.length * 100, 1)}%` : "—"} detail={`Sobre la muestra ${filterLabel}`} tone="green"/>
    </div>

    <div className="distribution-visual-grid">
      <article className="distribution-panel histogram-panel"><div className="distribution-panel-heading"><div><span>Frecuencia exacta</span><h3>Histograma por tercios</h3></div><div className="threshold-key"><i/>Umbrales analizados 14,66–15,66</div></div><ExactHistogram data={histogram}/><div className="color-scale"><span><i style={{ background: COLORS.low }}/>Baja</span><span><i style={{ background: COLORS.developing }}/>Intermedia</span><span><i style={{ background: COLORS.competitive }}/>14–15</span><span><i style={{ background: COLORS.high }}/>15–16</span><span><i style={{ background: COLORS.top }}/>≥16</span></div></article>
      <article className="distribution-panel"><div className="distribution-panel-heading"><div><span>Composición</span><h3>Peso de cada tramo</h3></div></div>{values.length ? <RangeDonut data={ranges} total={values.length}/> : <div className="distribution-empty">Sin datos sincronizados.</div>}</article>
    </div>

    <article className="distribution-panel frequency-panel"><div className="distribution-panel-heading"><div><span>Detalle de la muestra</span><h3>Frecuencias por nota</h3></div><span className="distribution-record-count">{format(histogram.length, 0)} valores distintos</span></div><div className="frequency-table"><table><thead><tr><th>Nota P2</th><th>Personas</th><th>% muestra</th><th>Acumulado ≥ nota</th></tr></thead><tbody>{histogram.slice().reverse().slice(0, visibleRows).map(({ score, count, percentage }, index, descending) => { const cumulative = descending.slice(0, index + 1).reduce((sum, item) => sum + item.count, 0); return <tr key={score}><td><strong>{format(score)}</strong></td><td>{format(count, 0)}</td><td>{format(percentage, 1)}%</td><td><span className="cumulative-value">{format(cumulative, 0)}</span><div className="cumulative-track"><i style={{ width: `${cumulative / values.length * 100}%` }}/></div></td></tr>; })}</tbody></table></div>{visibleRows < histogram.length && <button className="show-more-button" type="button" onClick={() => setVisibleRows((current) => current + 14)}>Mostrar más notas ({histogram.length - visibleRows})</button>}</article>
  </section>;
}
