import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiActivity, FiCalendar, FiTarget, FiTrendingDown, FiUsers } from "react-icons/fi";
import { calculateEvidenceScenarioModel, callData, getHistoricalAnalysis } from "../../../analysis/scenarioEngine.js";

const format = (value, decimals = 2) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
const COLORS = ["#72809a", "#7d76fa", "#36c5a1", "#ff4f87"];

function HistoricalStat({ icon: Icon, label, value, detail, tone = "violet" }) {
  return <article className={`historical-stat historical-stat-${tone}`}><span><Icon aria-hidden="true"/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function PlacesChart({ data }) {
  return <ResponsiveContainer width="100%" height={310}><BarChart data={data} margin={{ top: 18, right: 6, left: -8, bottom: 2 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5"/><XAxis dataKey="year" stroke="var(--text-soft)" tick={{ fontSize: 12 }}/><YAxis tickFormatter={(value) => `${format(value / 1000, 1)}k`} stroke="var(--text-soft)" tick={{ fontSize: 12 }}/><Tooltip cursor={{ fill: "color-mix(in srgb, var(--text-soft) 7%, transparent)" }} formatter={(value) => [format(value, 0), "Plazas"]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }} labelStyle={{ color: "var(--text)" }} itemStyle={{ color: "var(--text)" }}/><Bar dataKey="places" radius={[5, 5, 0, 0]}>{data.map((item, index) => <Cell key={item.year} fill={COLORS[index]}/>)}</Bar></BarChart></ResponsiveContainer>;
}

function CutoffsChart({ data }) {
  return <ResponsiveContainer width="100%" height={310}><LineChart data={data} margin={{ top: 20, right: 18, left: -8, bottom: 2 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5"/><XAxis dataKey="year" stroke="var(--text-soft)" tick={{ fontSize: 12 }}/><YAxis domain={[13.5, 16]} ticks={[14, 14.5, 15, 15.5, 16]} tickFormatter={(value) => format(value, 1)} stroke="var(--text-soft)" tick={{ fontSize: 12 }}/><Tooltip formatter={(value, name) => [format(value), name]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}/><ReferenceLine y={15} stroke="#ffbf47" strokeDasharray="4 4"/><Line type="linear" dataKey="p2Cutoff" name="Corte P2 oficial" stroke="#7d76fa" strokeWidth={3} dot={{ r: 5, fill: "#7d76fa", strokeWidth: 2, stroke: "var(--surface)" }}/><Line type="linear" dataKey="scenario" name="Escenario central 2025" stroke="#ff4f87" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 5, fill: "#ff4f87", strokeWidth: 2, stroke: "var(--surface)" }}/></LineChart></ResponsiveContainer>;
}

export default function HistoricalDashboard({ analysis }) {
  const historical = getHistoricalAnalysis();
  const central = calculateEvidenceScenarioModel(analysis?.p2Candidates || []).scenarios.find(({ name }) => name === "Central");
  const rows = [
    { year: "2019", ...callData[2019], status: "Oficial" },
    { year: "2022", ...callData[2022], status: "Oficial" },
    { year: "2024", ...callData[2024], status: "Oficial" },
    { year: "2025", ...callData[2025], p2Cutoff: null, scenario: central?.cutoffMin ?? null, status: "En curso" },
  ];
  const pressure2024 = callData[2024].attended / callData[2024].places;
  const pressure2025 = callData[2025].attended / callData[2025].places;
  const p2Mean = [2019, 2022, 2024].reduce((sum, year) => sum + callData[year].p2Cutoff, 0) / 3;

  return <section className="historical-dashboard">
    <div className="historical-heading"><div><span>Serie comparativa · turno general</span><h2>Histórico de convocatorias</h2><p>Plazas, participación y cortes oficiales de referencia frente al escenario actual.</p></div><div className="historical-badge"><FiCalendar aria-hidden="true"/><div><small>Periodo analizado</small><strong>2019–2025</strong></div></div></div>
    <div className="historical-stats">
      <HistoricalStat icon={FiUsers} label="Plazas actuales" value={format(callData[2025].places, 0)} detail={`${format(Math.abs(historical.placesChange), 1)}% menos que en 2024`} tone="pink"/>
      <HistoricalStat icon={FiActivity} label="Presentados 2025" value={format(callData[2025].attended, 0)} detail={`${format(Math.abs(historical.attendanceChange), 1)}% menos que en 2024`} tone="green"/>
      <HistoricalStat icon={FiTrendingDown} label="Aspirantes por plaza" value={format(pressure2025, 1)} detail={`2024: ${format(pressure2024, 1)} por plaza`} tone="amber"/>
      <HistoricalStat icon={FiTarget} label="Media P2 histórica" value={format(p2Mean)} detail="Cortes oficiales 2019, 2022 y 2024"/>
      <HistoricalStat icon={FiTarget} label="Escenario central" value={central?.label || "—"} detail="Modelo actual; no es un corte oficial" tone="pink"/>
    </div>
    <div className="historical-chart-grid">
      <article className="historical-panel"><div className="historical-panel-heading"><div><span>Volumen de oferta</span><h3>Evolución de plazas</h3></div><small>Turno general</small></div><PlacesChart data={rows}/><div className="historical-callout"><FiTrendingDown aria-hidden="true"/><p>La oferta actual es un <strong>{format(Math.abs(historical.placesChange), 1)}% inferior</strong> a 2024, mientras la asistencia cae un {format(Math.abs(historical.attendanceChange), 1)}%.</p></div></article>
      <article className="historical-panel"><div className="historical-panel-heading"><div><span>Referencia de P2</span><h3>Cortes oficiales y escenario</h3></div><div className="historical-legend"><span><i/>Oficial</span><span><i className="scenario"/>Escenario</span></div></div><CutoffsChart data={rows}/><p className="historical-note">La discontinuidad entre 2024 y 2025 separa los cortes publicados del escenario calculado con la evidencia actual.</p></article>
    </div>
    <div className="historical-insights">
      <article><span>01</span><div><h3>Regla de corrección P1</h3><p>{historical.p1Rule}</p></div></article>
      <article><span>02</span><div><h3>Presión competitiva</h3><p>En 2025 hay {format(pressure2025, 1)} presentados por plaza frente a {format(pressure2024, 1)} en 2024. Esta relación describe presión, no dificultad.</p></div></article>
      <article><span>03</span><div><h3>Lectura de P2</h3><p>Los cortes oficiales recorren 15,67, 14,33 y 14,00. El escenario {central?.label || "—"} debe contrastarse con ese rango y las muestras.</p></div></article>
    </div>
    <article className="historical-panel historical-table-panel"><div className="historical-panel-heading"><div><span>Datos de respaldo</span><h3>Detalle por convocatoria</h3></div><small>— indica dato no disponible</small></div><div className="historical-table"><table><thead><tr><th>Año</th><th>Estado</th><th>Plazas</th><th>Presentados</th><th>P1 corregidos</th><th>Corte P1</th><th>Corte P2</th></tr></thead><tbody>{rows.map((row) => <tr key={row.year} className={row.year === "2025" ? "active" : ""}><td><strong>{row.year}</strong></td><td><span className={`historical-status ${row.year === "2025" ? "current" : ""}`}>{row.status}</span></td><td>{format(row.places, 0)}</td><td>{row.attended ? format(row.attended, 0) : "—"}</td><td>{row.correctedP1 ? format(row.correctedP1, 0) : "—"}</td><td>{row.p1Cutoff ? format(row.p1Cutoff) : "—"}</td><td>{row.p2Cutoff ? format(row.p2Cutoff) : <span className="scenario-value">{central?.label || "—"} escenario</span>}</td></tr>)}</tbody></table></div></article>
    <div className="historical-method"><FiActivity aria-hidden="true"/><p><strong>Lectura metodológica.</strong> Las convocatorias no son directamente equivalentes: cambian plazas, asistencia y dificultad. El histórico acota precedentes, pero no determina por sí solo el corte actual.</p></div>
  </section>;
}
