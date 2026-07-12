import { useState } from "react";
import { calculateEvidenceScenarioModel } from "../analysis/scenarioEngine.js";
import ChartCard from "./components/charts/ChartCard";
import GaussianCurveChart from "./components/charts/GaussianCurveChart";
import CutoffControlCenter from "./components/control/CutoffControlCenter";
import DistributionDashboard from "./components/distribution/DistributionDashboard";
import HistoricalDashboard from "./components/historical/HistoricalDashboard";
import NewScoresDashboard from "./components/newScores/NewScoresDashboard";
import { mv2024, mv2024P2Values } from "../data/mv2024.js";

const number = (value, decimals = 2) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

export function DashboardView({ analysis }) {
  return <CutoffControlCenter analysis={analysis}/>;
}

const Metric = ({ label, value }) => <div className="score-item"><span className="score-label">{label}</span><span className="score-value">{value}</span></div>;

export function HistoricalView({ analysis }) {
  return <HistoricalDashboard analysis={analysis}/>;
}

export function SimulatorView({ analysis }) {
  return <DistributionDashboard analysis={analysis}/>;
}

export function NewScoresView({ newScores, recentScores, previousVersion }) {
  return <NewScoresDashboard newScores={newScores} recentScores={recentScores} previousVersion={previousVersion}/>;
}

const getGaussianDiagnostics = (values = []) => {
  if (!values.length) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2;
  const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) || 1;
  const skewness = values.reduce((sum, value) => sum + ((value - mean) / deviation) ** 3, 0) / values.length;
  const direction = skewness > 0.25 ? "una cola hacia notas altas" : skewness < -0.25 ? "una cola hacia notas bajas" : "una forma aproximadamente simétrica";
  return { mean, median, deviation, skewness, direction };
};
export function AnalysisView({ analysis }) {
  const [tab, setTab] = useState("summary");
  const current = analysis ? { averageP1: analysis.averageRawP1, medianP1: analysis.p1Median, averageP2: analysis.averageRawP2, medianP2: analysis.p2Median, qualified: analysis.qualified, sample: analysis.totalScores } : null;
  const model = calculateEvidenceScenarioModel(analysis?.p2Candidates || []);
  const tabs = [["summary", "Resumen"], ["simulator", "Simulador"], ["excel", "Excel MV 2024"], ["surveys", "Encuestas Academias"]];
  return <section className="analysis-page analysis-hub">
    <p className="page-intro">Triangulación de histórico, simulador, Excel MV 2024 y encuestas nacionales. Los escenarios son estimaciones, no cortes oficiales.</p>
    <div className="analysis-chips" role="tablist">{tabs.map(([id, label]) => <button type="button" role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>{label}</button>)}</div>
    {tab === "summary" && <><div className="scenario-grid analysis-scenarios">{model.scenarios.map((scenario) => <article className={`scenario-card scenario-${scenario.name.toLowerCase()}`} key={scenario.name}><div className="scenario-name">{scenario.name}</div><div className="scenario-cutoff">P2 {scenario.label}</div><div className="scenario-probability">Probabilidad relativa: {scenario.probability}%</div><p>{scenario.description}</p>{analysis && <small>{number(scenario.simulatorCount, 0)} del simulador alcanzan este P2</small>}</article>)}</div><section className="detail-card"><h3>Conclusión imparcial del análisis</h3><p>El escenario central es {number(model.central)} y procede de un consenso sin pesos fijados a mano: {model.weightMethod} El valor anterior al redondeo a tercios es {number(model.centralRaw)}.</p><p>El Excel MV 2024 aporta 3.999 notas: media P2 14,76, mediana 15,00, desviación 2,46 y asimetría −1,34. Por esa cola hacia notas bajas, el motor utiliza su mediana (15,00), más resistente que la media. El histórico oficial aporta 15,67, 14,33 y 14,00 (promedio {number(model.sources.find(({ name }) => name === "Histórico oficial")?.value)}). Las encuestas aportan 1.447 respuestas P2 agregadas, pero reciben penalización por autoselección y falta de dato individual.</p><p>{analysis ? <>El simulador solo entra si puede respaldar al menos el {number(model.minimumEvidenceCoverage * 100, 0)}% de las 2.282 plazas. En el escenario central hay {number(2282 - model.externalSeats, 0)} registros de la muestra por encima del umbral ({number(model.simulatorCoverage * 100, 1)}% de cobertura); quedan {number(model.externalSeats, 0)} plazas no observadas directamente.</> : <>Sin una muestra sincronizada, el simulador recibe peso 0% y los pesos restantes se renormalizan automáticamente.</>}</p><p>Los extremos optimista y pesimista se separan del centro con la misma regla y la misma dispersión ({number(model.spread)} puntos), sin favorecer una dirección. Sus porcentajes son verosimilitudes relativas según la distancia al consenso; no frecuencias observadas ni probabilidades oficiales.</p></section><div className="table-card evidence-table"><table><thead><tr><th>Fuente</th><th>Dato usado</th><th>Muestra</th><th>Peso calculado</th><th>Justificación</th></tr></thead><tbody>{model.sources.map((source) => <tr key={source.name}><td>{source.name}</td><td>{number(source.value)}</td><td>{number(source.sample, 0)}</td><td>{number(source.weight * 100, 1)}%</td><td>{source.rationale}</td></tr>)}</tbody></table></div><div className="analysis-comparison"><Metric label="Plazas 2019 / 2022 / 2024 / 2025" value="787 / 4.333 / 5.080 / 2.282"/><Metric label="P2 histórico 2019 / 2022 / 2024" value="15,67 / 14,33 / 14,00"/><Metric label="Supuestos corregidos 2022 / 2024 / 2025" value="12.999 / 15.240 / 6.846"/></div></>}
    {tab === "simulator" && <SimulatorAnalysis current={current} analysis={analysis}/>}
    {tab === "excel" && <ExcelAnalysis current={current}/>}
    {tab === "surveys" && <SurveyAnalysis/>}
  </section>;
}

function SimulatorAnalysis({ current, analysis }) {
  const values = analysis?.p2Candidates?.map(({ rawP2 }) => rawP2) || [];
  const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const median = values.length ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : null;
  const deviation = values.length ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) : null;
  const skewness = values.length && deviation ? values.reduce((sum, value) => sum + ((value - mean) / deviation) ** 3, 0) / values.length : null;
  const bias = skewness === null ? "Sin muestra" : skewness > 0.25 ? "Asimetría positiva: cola hacia notas P2 altas" : skewness < -0.25 ? "Asimetría negativa: cola hacia notas P2 bajas" : "Distribución aproximadamente simétrica";
  const biasInterpretation = skewness === null ? [] : skewness > 0.25 ? ["La mayor parte de las notas se concentra por debajo de la media, mientras una minoría de P2 muy altas alarga la cola derecha.", "La media queda por encima de la mediana; el corte depende especialmente de cuán poblada esté esa cola alta.", "Para los escenarios, una cola alta fina favorece el central/optimista; si se ensancha en futuras sincronizaciones, aumenta el riesgo del pesimista."] : skewness < -0.25 ? ["La mayor concentración de la muestra se sitúa en notas P2 altas y la cola se extiende hacia resultados más bajos.", "La media queda por debajo de la mediana; hay una mayor densidad competitiva en la parte alta de la distribución.", "Para los escenarios, este patrón justifica elevar la cautela: puede empujar el último puesto hacia el escenario pesimista."] : ["Media y mediana están próximas y no domina ninguna de las dos colas.", "La muestra se aproxima a una distribución equilibrada; el centro de la campana es una referencia más estable.", "Para los escenarios, este patrón da mayor peso al escenario central, siempre contrastado con histórico y encuestas."];
  return <><div className="analysis-comparison">{current ? <><Metric label="Muestra sincronizada" value={number(current.sample, 0)}/><Metric label="Media / mediana P2" value={`${number(current.averageP2)} / ${number(current.medianP2)}`}/><Metric label="Desviación / asimetría" value={`${number(deviation)} / ${number(skewness)}`}/></> : <p>Actualiza el ranking para cargar la muestra actual.</p>}</div>{analysis && <ChartCard title="Campana de Gauss ajustada a P2" subtitle="Curva de referencia calculada con la media y desviación típica; no presupone que la muestra sea perfectamente normal."><GaussianCurveChart values={values}/></ChartCard>}<section className="detail-card gaussian-interpretation"><h3>Cómo interpretar la campana y el sesgo</h3><p>La campana de Gauss resume dónde se concentra la muestra P2: su centro corresponde a la media y su anchura a la dispersión. Una campana más ancha implica resultados más heterogéneos y, por tanto, mayor incertidumbre alrededor del corte; una más estrecha implica mayor concentración de notas.</p><p><strong>{bias}.</strong> {mean !== null && `La media es ${number(mean)}, la mediana ${number(median)} y la desviación típica ${number(deviation)}.`}</p><ul>{biasInterpretation.map((item) => <li key={item}>{item}</li>)}</ul><p>La curva describe el simulador, no el total de opositores corregidos. Al ser una muestra autoseleccionada, se contrasta con MV 2024, cortes históricos y encuestas antes de asignar probabilidades a los escenarios.</p></section></>;
}

function ExcelAnalysis({ current }) {
  const gaussian = getGaussianDiagnostics(mv2024P2Values);
  return <>
    <div className="analysis-comparison"><Metric label="Muestra MV 2024" value={number(mv2024.sample, 0)}/><Metric label="P1 media / mediana" value={`${number(mv2024.averageP1)} / ${number(mv2024.medianP1)}`}/><Metric label="P2 media / mediana" value={`${number(gaussian.mean)} / ${number(gaussian.median)}`}/><Metric label="Desviación / asimetría P2" value={`${number(gaussian.deviation)} / ${number(gaussian.skewness)}`}/><Metric label="Aptos 35/15" value={`${number(mv2024.qualified, 0)} (${number(mv2024.qualified / mv2024.sample * 100, 1)}%)`}/></div>
    <ChartCard title="Campana de Gauss ajustada a P2 · MV 2024" subtitle="Curva de referencia calculada sobre las 3.999 notas P2 del Excel, con su media y desviación típica."><GaussianCurveChart values={mv2024P2Values}/></ChartCard>
    <section className="detail-card gaussian-interpretation"><h3>Lectura de la campana de MV 2024</h3><p><strong>Asimetría negativa: cola hacia notas P2 bajas.</strong> La media es {number(gaussian.mean)}, la mediana {number(gaussian.median)} y la desviación típica {number(gaussian.deviation)}. La asimetría de {number(gaussian.skewness)} confirma que la distribución no es perfectamente normal.</p><ul><li>La mayor concentración de la muestra se sitúa en notas P2 altas, mientras la cola se prolonga hacia los resultados bajos.</li><li>Que la media quede por debajo de la mediana refleja el peso de esas notas bajas sobre el promedio.</li><li>La curva normal es una referencia visual de centro y dispersión; la asimetría debe tenerse en cuenta al comparar MV 2024 con el simulador actual.</li></ul></section>
    <section className="detail-card"><h3>Comparación con la convocatoria actual</h3><p>{current ? `La muestra actual presenta P2 ${number(current.averageP2)} de media frente a ${number(gaussian.mean)} en MV 2024, y mediana ${number(current.medianP2)} frente a ${number(gaussian.median)}. ` : "Al sincronizar el ranking se mostrará aquí la diferencia exacta con la muestra actual. "}El Excel registra 3.493 personas con P1 ≥ 35 y 2.118 con P2 ≥ 15; 2.006 superan ambos mínimos.</p></section>
  </>;
}

function SurveyAnalysis() { return <><div className="survey-grid"><article className="insight-card"><h3>Las Cortes</h3><p>Muestra: 546 notas P2.</p><ul><li>16–20: 49 (9,0%)</li><li>11–15: 230 (42,1%)</li><li>Por debajo de 10: 267 (48,9%)</li></ul></article><article className="insight-card"><h3>AHA · P1</h3><p>Muestra: 901 notas.</p><ul><li>P1 ≥ 35: 615 (68%)</li><li>P1 &lt; 35: 286 (32%)</li></ul></article><article className="insight-card"><h3>AHA · P2</h3><p>Muestra: 901 notas.</p><ul><li>≥16: 293 (29%)</li><li>14,66–15,66: 196 (20%)</li><li>13,66–14,33: 129 (13%)</li><li>≤13,33: 373 (38%)</li></ul></article></div><section className="detail-card"><h3>Uso de las encuestas</h3><p>Sirven para contrastar la estructura de P2, no para sumar muestras ni extrapolar plazas de forma literal: cada academia tiene composición y método de captación propios.</p></section></> }
