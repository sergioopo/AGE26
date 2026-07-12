import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiActivity, FiAlertCircle, FiCheckCircle, FiTarget, FiUsers } from "react-icons/fi";
import { mv2024P2Values } from "../../../data/mv2024.js";

const GENERAL_SEATS = 2282;
const CUTS = [44 / 3, 15, 46 / 3, 47 / 3];
const HISTORICAL = [
  { year: "2019", cutoff: 15.67, seats: 787 },
  { year: "2022", cutoff: 43 / 3, seats: 4333 },
  { year: "2024", cutoff: 14, seats: 5080 },
];

const format = (value, decimals = 2) => new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
}).format(value);

const normalized = (value) => Math.round(value * 3) / 3;
const atOrAbove = (candidates, cutoff) => candidates.filter(({ rawP1, rawP2 }) => rawP1 >= 35 && normalized(rawP2) >= normalized(cutoff)).length;

function statusForCoverage(coverage) {
  if (coverage >= 100) return { label: "La muestra cubre las plazas", tone: "positive", icon: FiCheckCircle };
  if (coverage >= 75) return { label: "Cobertura alta de plazas", tone: "warning", icon: FiActivity };
  return { label: "Faltan candidatos fuera de muestra", tone: "critical", icon: FiAlertCircle };
}

function Kpi({ icon: Icon, label, value, detail, tone = "neutral" }) {
  return <article className={`control-kpi control-kpi-${tone}`}>
    <div className="control-kpi-heading"><span className="control-kpi-icon"><Icon aria-hidden="true" /></span><span>{label}</span></div>
    <strong>{value}</strong>
    <small>{detail}</small>
  </article>;
}

function GaussianWithCutoff({ values, cutoff }) {
  const data = useMemo(() => {
    const gaussian = (sample, score) => {
      const mean = sample.reduce((sum, value) => sum + value, 0) / sample.length;
      const variance = sample.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sample.length;
      const deviation = Math.sqrt(variance) || 1;
      return Math.exp(-0.5 * ((score - mean) / deviation) ** 2) / (deviation * Math.sqrt(2 * Math.PI));
    };
    return Array.from({ length: 145 }, (_, index) => {
      const score = 8 + index / 12;
      return { score, current: values.length ? gaussian(values, score) : null, mv2024: gaussian(mv2024P2Values, score) };
    });
  }, [values]);

  return <ResponsiveContainer width="100%" height={280}>
    <ComposedChart data={data} margin={{ top: 22, right: 18, bottom: 0, left: -24 }}>
      <defs><linearGradient id="controlGaussian" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#36c5a1" stopOpacity=".5"/><stop offset="100%" stopColor="#36c5a1" stopOpacity=".03"/></linearGradient></defs>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 5" />
      <XAxis dataKey="score" type="number" domain={[8, 20]} ticks={[8, 10, 12, 14, 16, 18, 20]} tickFormatter={(value) => format(value, 0)} stroke="var(--text-soft)" />
      <YAxis hide />
      <Tooltip formatter={(value, name) => [format(value, 3), name]} labelFormatter={(value) => `P2 ${format(value)}`} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }} />
      <Area type="monotone" dataKey="mv2024" stroke="#7d76fa" strokeWidth={2} strokeDasharray="6 4" fill="transparent" connectNulls name="Excel MV 2024" />
      <Area type="monotone" dataKey="current" stroke="#36c5a1" strokeWidth={2.5} fill="url(#controlGaussian)" connectNulls name="Simulador actual" />
      <ReferenceLine x={cutoff} stroke="#ff4f87" strokeWidth={2} strokeDasharray="5 4" label={{ value: format(cutoff), fill: "#ff4f87", fontWeight: 800, position: "top" }} />
    </ComposedChart>
  </ResponsiveContainer>;
}

export default function CutoffControlCenter({ analysis }) {
  const [activeCut, setActiveCut] = useState(15);
  const candidates = analysis?.p2Candidates || [];
  const p1Passed = candidates.filter(({ rawP1 }) => rawP1 >= 35);
  const values = p1Passed.map(({ rawP2 }) => rawP2);
  const scenarios = CUTS.map((cutoff) => {
    const qualified = atOrAbove(candidates, cutoff);
    return {
      cutoff, qualified,
      sampleRate: p1Passed.length ? qualified / p1Passed.length * 100 : 0,
      generalCoverage: qualified / GENERAL_SEATS * 100,
    };
  });
  const selected = scenarios.find(({ cutoff }) => cutoff === activeCut);
  const coverageStatus = analysis ? statusForCoverage(selected.generalCoverage) : { label: "Esperando datos del simulador", tone: "warning", icon: FiActivity };
  const StatusIcon = coverageStatus.icon;
  const missingGeneral = Math.max(0, GENERAL_SEATS - selected.qualified);
  const outsideSimulatorRate = missingGeneral / GENERAL_SEATS * 100;

  return <section className="control-center">
    <div className="control-heading">
      <div><span className="control-eyebrow">Escenarios de P2</span><h2>Centro de control de cortes</h2><p>Selecciona un umbral para contrastar la muestra, las plazas y la evidencia disponible. Cada pantalla describe posibilidades; no estima un corte final.</p></div>
      <div className="seat-legend" aria-label="Plazas de la convocatoria"><span><i className="seat-dot seat-dot-general"/>Turno general <strong>{format(GENERAL_SEATS, 0)} plazas</strong></span></div>
    </div>

    <div className="cut-selector" role="tablist" aria-label="Corte P2 analizado">
      {scenarios.map((scenario) => <button key={scenario.cutoff} type="button" role="tab" aria-selected={activeCut === scenario.cutoff} className={activeCut === scenario.cutoff ? "active" : ""} onClick={() => setActiveCut(scenario.cutoff)}><span>Corte</span><strong>{format(scenario.cutoff)}</strong><small>{analysis ? `${format(scenario.qualified, 0)} aptos observados` : "Pendiente de datos"}</small></button>)}
    </div>

    <div className={`coverage-banner coverage-${coverageStatus.tone}`}><StatusIcon aria-hidden="true"/><div><strong>{coverageStatus.label}</strong><span>{analysis ? `${format(selected.qualified, 0)} aptos observados del turno general con P1 ≥ 35 y P2 ≥ ${format(activeCut)}.` : "Actualiza el ranking para calcular la cobertura de cada escenario."}</span></div><b>{analysis ? `${format(selected.generalCoverage, 1)}%` : "—"}</b></div>

    <div className="control-kpi-grid">
      <Kpi icon={FiUsers} label="Aptos observados" value={analysis ? format(selected.qualified, 0) : "—"} detail={`${format(selected.sampleRate, 1)}% de quienes superan P1 en la muestra general`} />
      <Kpi icon={FiTarget} label="Cobertura de plazas" value={analysis ? `${format(selected.generalCoverage, 1)}%` : "—"} detail={`${format(missingGeneral, 0)} de 2.282 plazas sin candidato observado`} tone="accent" />
      <Kpi icon={FiActivity} label="Aptos fuera del simulador" value={analysis ? `${format(outsideSimulatorRate, 1)}%` : "—"} detail={`${format(missingGeneral, 0)} aptos adicionales para completar las plazas`} tone="pink" />
    </div>

    <div className="control-main-grid">
      <article className="control-panel gaussian-panel"><div className="panel-heading"><div><span>Comparativa de distribuciones</span><h3>Campanas P2 y umbral activo</h3></div><span className="panel-chip">Actual · P1 ≥ 35 · n={format(p1Passed.length, 0)}</span></div><div className="gaussian-legend"><span><i className="current"/>Simulador actual</span><span><i className="mv"/>Excel MV 2024 · n=3.999</span><span><i className="cut"/>Umbral {format(activeCut)}</span></div><GaussianWithCutoff values={values} cutoff={activeCut}/><p className="panel-note">Densidades normalizadas: verde, muestra actual tras superar P1; violeta discontinua, 3.999 P2 del Excel MV 2024. La línea rosa sitúa el escenario, no una predicción.</p></article>
      <article className="control-panel"><div className="panel-heading"><div><span>Presión de plazas</span><h3>Qué tendría que ocurrir</h3></div></div><div className="seat-bars">
        <div><div className="bar-label"><span>Turno general</span><strong>{analysis ? format(selected.qualified, 0) : "—"} / {format(GENERAL_SEATS, 0)}</strong></div><div className="seat-track"><i style={{ width: `${analysis ? Math.min(100, selected.generalCoverage) : 0}%` }}/></div><small>{analysis ? (selected.generalCoverage >= 100 ? `${format(selected.qualified - GENERAL_SEATS, 0)} personas por encima de las plazas` : `${format(missingGeneral, 0)} plazas dependerían de personas fuera de la muestra`) : "Pendiente de sincronización"}</small></div>
      </div><div className="interpretation-box"><FiAlertCircle aria-hidden="true"/><p>La cobertura no equivale a probabilidad. El simulador es una muestra autoseleccionada y no contiene a todos los aspirantes.</p></div></article>
    </div>

    <div className="control-evidence-grid">
      <article className="control-panel historical-panel"><div className="panel-heading"><div><span>Convocatorias anteriores</span><h3>El escenario en contexto</h3></div></div><div className="history-scale"><div className="history-axis"/>{HISTORICAL.map((item) => <div className="history-mark" key={item.year} style={{ left: `${((item.cutoff - 13.7) / 2.3) * 100}%` }}><i/><strong>{item.year}</strong><span>{format(item.cutoff)}</span></div>)}<div className="history-mark active" style={{ left: `${((activeCut - 13.7) / 2.3) * 100}%` }}><i/><strong>Escenario</strong><span>{format(activeCut)}</span></div></div><div className="history-list">{HISTORICAL.map((item) => <div key={item.year}><span>{item.year} · {format(item.seats, 0)} plazas</span><strong>P2 {format(item.cutoff)}</strong><small>{activeCut > item.cutoff ? `${format(activeCut - item.cutoff)} por encima` : activeCut < item.cutoff ? `${format(item.cutoff - activeCut)} por debajo` : "Mismo umbral"}</small></div>)}</div></article>
      <article className="control-panel survey-panel"><div className="panel-heading"><div><span>Encuestas de academias</span><h3>Señales compatibles</h3></div><span className="panel-chip">1.447 respuestas</span></div><div className="survey-signal"><strong>AHA · P2</strong><span>196 respuestas (20%) entre 14,66 y 15,66</span><div className="survey-range"><i/><b style={{ left: `${((activeCut - 14.66) / 1) * 100}%` }}/></div><small>El corte activo está dentro del intervalo medido; la encuesta no permite aislar cada tercio.</small></div><div className="survey-signal"><strong>Las Cortes · P2</strong><span>49 respuestas (9%) entre 16 y 20</span><small>546 respuestas agregadas. Sirve para medir cola alta, no cobertura de plazas.</small></div><div className="evidence-verdict"><FiCheckCircle aria-hidden="true"/><p><strong>Lectura conjunta:</strong> {activeCut === 47 / 3 ? "coincide con el máximo histórico (2019) y el extremo superior del intervalo AHA." : activeCut === 15 ? "queda en el centro del intervalo AHA y entre las referencias oficiales de 2022 y 2019." : activeCut < 15 ? "queda próximo al histórico de 2022 y en el tramo inferior del intervalo AHA." : "queda en la mitad alta del intervalo AHA, todavía por debajo del máximo de 2019."}</p></div></article>
    </div>
  </section>;
}
