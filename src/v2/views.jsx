import { useState } from "react";
import { calculateEvidenceScenarioModel, callData, getHistoricalAnalysis } from "../analysis/scenarioEngine.js";
import KpiCard from "./components/cards/KpiCard";
import ExecutiveCard from "./components/cards/ExecutiveCard";
import ProbabilityBadge from "./components/cards/ProbabilityBadge";
import ChartCard from "./components/charts/ChartCard";
import DistributionChart from "./components/charts/DistributionChart";
import P2DistributionPieChart from "./components/charts/P2DistributionPieChart";
import GaussianCurveChart from "./components/charts/GaussianCurveChart";

const number = (value, decimals = 2) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

const p2CutoffGroups = (breakdown = [], totalScores = 0) => {
  if (!totalScores) return [];
  const countFor = (predicate) => breakdown.reduce((sum, { score, count }) => sum + (predicate(score) ? count : 0), 0);
  const oneThirdScores = Array.from({ length: 11 }, (_, index) => (37 + index) / 3);
  const groups = [
    { label: "≤ 12,00", count: countFor((score) => score <= 12) },
    ...oneThirdScores.map((score) => ({
      label: Math.abs(score - 14) < 0.02 ? "= 14,00" : number(score),
      count: countFor((value) => Math.abs(value - score) < 0.02),
    })),
    { label: "≥ 16,00", count: countFor((score) => score >= 16) },
  ];
  return groups.map((group) => ({ ...group, percentage: (group.count / totalScores) * 100 }));
};

const dashboardP2Distribution = (analysis) => {
  if (!analysis) return [];
  const countFor = (predicate) => analysis.p2Breakdown.reduce((sum, { score, count }) => sum + (predicate(score) ? count : 0), 0);
  const oneThirdScores = Array.from({ length: 24 }, (_, index) => (37 + index) / 3);
  return [
    { nota: "≤12,00", valor: countFor((score) => score <= 12) },
    ...oneThirdScores.map((score) => ({
      nota: Math.abs(score - 14) < 0.02 ? "=14,00" : number(score),
      valor: countFor((value) => Math.abs(value - score) < 0.02),
    })),
  ];
};

export function DashboardView({ analysis }) {
  const placeCoverage = analysis ? (analysis.qualified / callData[2025].places) * 100 : null;
  const centralScenario = calculateEvidenceScenarioModel(analysis?.p2Candidates || []).scenarios.find(({ name }) => name === "Central");
  const p2WithP1Passed = analysis?.p2Candidates?.filter(({ rawP1 }) => rawP1 >= 35).map(({ rawP2 }) => rawP2) || [];
  const averageP2WithP1Passed = p2WithP1Passed.length ? p2WithP1Passed.reduce((sum, value) => sum + value, 0) / p2WithP1Passed.length : null;
  return <>
    <div className="kpi-grid">
      <KpiCard title="Notas registradas" value={analysis ? number(analysis.totalScores, 0) : "—"} subtitle={analysis ? "Registros válidos sincronizados" : "Actualiza el ranking para comenzar"}/>
      <KpiCard title="Aptos" value={analysis ? number(analysis.qualified, 0) : "—"} subtitle="Tras cribado 35 / 15"/>
      <KpiCard title="Media P1" value={analysis ? number(analysis.averageRawP1) : "—"} subtitle="Ejercicio 1 · nota bruta"/>
      <KpiCard title="Media P2 · total" value={analysis ? number(analysis.averageRawP2) : "—"} subtitle="Sin aplicar corte de P1"/>
      <KpiCard title="Media P2 · P1 ≥ 35" value={averageP2WithP1Passed === null ? "—" : number(averageP2WithP1Passed)} subtitle={`${number(p2WithP1Passed.length, 0)} registros tras corte P1`}/>
    </div>
    <div className="dashboard-grid">
      <div>
        <ChartCard title="Distribución de notas" subtitle="P2 bruta agrupada: ≤12,00 y tramos de 0,33 hasta 20,00"><DistributionChart distribution={dashboardP2Distribution(analysis)}/></ChartCard>
        <p className="dashboard-disclaimer">Esta herramienta está orientada a la visualización de los datos del simulador de corte de <a href="https://plataformafuncionarios.es" target="_blank" rel="noreferrer">plataformafuncionarios.es</a>; el simulador de cortes es propiedad de su administrador.</p>
      </div>
      <div>
        <ExecutiveCard title="Resumen ejecutivo"><div className="executive-summary">{analysis ? <>Se han analizado {number(analysis.totalScores, 0)} registros válidos. {number(analysis.qualified, 0)} superan el cribado de P1 ≥ 35 y P2 ≥ 15.<br/><br/>La convocatoria reduce las plazas a 2.282 y la regla de corrección fija P1 en 35,00. El escenario central calculado de P2 es {centralScenario?.label || "—"}.<br/><br/>La media total transformada de la muestra es {number(analysis.averageTotal)}.</> : "Actualiza el ranking para generar el análisis estadístico."}</div><br/>{placeCoverage !== null && <ProbabilityBadge probability={Math.round(placeCoverage)} label="Cobertura de plazas"/>}</ExecutiveCard>
        <br/>
        <ExecutiveCard title="Estado del modelo"><div className="score-box">
          <Metric label="Cobertura de plazas" value={placeCoverage !== null ? `${number(placeCoverage, 0)} %` : "—"}/>
          <Metric label="Registros válidos" value={analysis ? `${number((analysis.validRows / analysis.importedRows) * 100, 0)} %` : "—"}/>
          <Metric label="Corte P1 previsto" value="35,00"/><Metric label="Corte P2 central" value={centralScenario?.label || "—"}/>
        </div></ExecutiveCard>
      </div>
    </div>
  </>;
}

const Metric = ({ label, value }) => <div className="score-item"><span className="score-label">{label}</span><span className="score-value">{value}</span></div>;

export function HistoricalView({ analysis }) {
  const historical = getHistoricalAnalysis();
  const centralScenario = calculateEvidenceScenarioModel(analysis?.p2Candidates || []).scenarios.find(({ name }) => name === "Central");
  return <section className="analysis-page"><h2>Análisis de convocatorias anteriores</h2><p className="page-intro">Comparativa de las convocatorias de referencia de 2019, 2022 y 2024, y extrapolación a la convocatoria actual a partir de los criterios de la CPS, plazas, asistencia y señales del simulador.</p>
    <div className="table-card"><table><thead><tr><th>Convocatoria</th><th>Plazas</th><th>Presentados</th><th>Mín. P1 corregidos</th><th>Corte P1</th><th>Corte P2</th></tr></thead><tbody>
      {[2019, 2022, 2024].map((year) => <tr key={year}><td>{year}</td><td>{number(callData[year].places, 0)}</td><td>{callData[year].attended ? number(callData[year].attended, 0) : "—"}</td><td>{callData[year].correctedP1 === null ? "—" : number(callData[year].correctedP1, 0)}</td><td>{callData[year].p1Cutoff === null ? "—" : number(callData[year].p1Cutoff)}</td><td>{number(callData[year].p2Cutoff)}</td></tr>)}
      <tr className="current-row"><td>2025 / actual</td><td>{number(callData[2025].places, 0)}</td><td>{number(callData[2025].attended, 0)}</td><td>{number(callData[2025].correctedP1, 0)}</td><td>35,00 previsto</td><td>{centralScenario?.label || "—"} central</td></tr>
    </tbody></table></div>
    <div className="insight-grid"><article className="insight-card"><h3>Regla de P1</h3><p>{historical.p1Rule}</p></article><article className="insight-card"><h3>Presión de plazas</h3><p>Las plazas bajan un {number(Math.abs(historical.placesChange), 1)}% respecto a 2024; los presentados, un {number(Math.abs(historical.attendanceChange), 1)}%.</p></article><article className="insight-card"><h3>Extrapolación P2</h3><p>{historical.extrapolation}</p></article></div>
    <section className="detail-card"><h3>Lectura del simulador</h3>{analysis ? <p>La muestra actual aporta {number(analysis.totalScores, 0)} notas, con media P1 de {number(analysis.averageRawP1)} y media P2 de {number(analysis.averageRawP2)}. Entre los registros con P1 ≥ 35, {number(centralScenario?.simulatorCount || 0, 0)} alcanzan el P2 {centralScenario?.label || "—"} del escenario central calculado actualmente. El histórico debe leerse junto a la muestra: no sustituye la decisión final de la CPS.</p> : <p>Actualiza el ranking para incorporar las métricas vivas del simulador a esta extrapolación.</p>}</section>
  </section>;
}

export function SimulatorView({ analysis }) {
  const [p1Filter, setP1Filter] = useState("all");
  const [visibleRows, setVisibleRows] = useState(12);
  const filteredCandidates = analysis?.p2Candidates?.filter(({ rawP1 }) => p1Filter === "all" || rawP1 >= 35) || [];
  const filteredP2 = filteredCandidates.map(({ rawP2 }) => rawP2);
  const filteredBreakdown = [...new Set(filteredP2.map((value) => Math.round(value * 3) / 3))].sort((a, b) => b - a).map((score) => ({ score, count: filteredP2.filter((value) => Math.round(value * 3) / 3 === score).length }));
  const filteredAverage = filteredP2.length ? filteredP2.reduce((sum, value) => sum + value, 0) / filteredP2.length : null;
  const sortedP2 = [...filteredP2].sort((a, b) => a - b);
  const filteredMedian = sortedP2.length ? (sortedP2[(sortedP2.length - 1) >> 1] + sortedP2[sortedP2.length >> 1]) / 2 : null;
  const filterSubtitle = p1Filter === "p1Passed" ? "Solo P1 ≥ 35" : "Todas las notas";
  return <section className="analysis-page"><h2>Simulador</h2><p className="page-intro">Cortes de referencia y distribución exacta de P2. Las notas se agrupan en intervalos de un tercio (0,33).</p>
    <div className="simulator-filter"><div><strong>Filtro para P2</strong><span>{analysis ? `${number(filteredCandidates.length, 0)} registros incluidos` : "Actualiza el ranking para aplicar el filtro"}</span></div><label htmlFor="p1-filter">Condición P1<select id="p1-filter" value={p1Filter} onChange={(event) => { setP1Filter(event.target.value); setVisibleRows(12); }} disabled={!analysis}><option value="all">Sin filtro de P1</option><option value="p1Passed">Solo P1 ≥ 35</option></select></label></div>
    <div className="simulator-kpis"><KpiCard title="Corte P1 previsto" value="35,00" subtitle="Mínimo de corrección CPS"/><KpiCard title="P2 media" value={filteredAverage === null ? "—" : number(filteredAverage)} subtitle={filterSubtitle}/><KpiCard title="P2 mediana" value={filteredMedian === null ? "—" : number(filteredMedian)} subtitle={filterSubtitle}/><KpiCard title="P1 mediana" value={analysis ? number(analysis.p1Median) : "—"} subtitle={`${analysis ? number(analysis.p1AtMinimum, 0) : "—"} con P1 ≥ 35`}/></div>
    <ChartCard className="p2-distribution-card" title="Distribución circular de P2" subtitle={`Agrupación en los umbrales competitivos de P2 · ${filterSubtitle.toLowerCase()}`}><P2DistributionPieChart data={p2CutoffGroups(filteredBreakdown, filteredCandidates.length)}/></ChartCard>
    <div className="table-card distribution-table"><table><thead><tr><th>Nota P2</th><th>Recuento</th><th>% de muestra</th></tr></thead><tbody>{analysis ? filteredBreakdown.slice(0, visibleRows).map(({ score, count }) => <tr key={score}><td>{number(score)}</td><td>{number(count, 0)}</td><td>{number((count / filteredCandidates.length) * 100, 1)}%</td></tr>) : <tr><td colSpan="3">Actualiza el ranking para ver el recuento.</td></tr>}</tbody></table>{analysis && visibleRows < filteredBreakdown.length && <button className="show-more-button" type="button" onClick={() => setVisibleRows((current) => current + 12)}>Ver más notas ({filteredBreakdown.length - visibleRows} restantes)</button>}</div>
  </section>;
}

const scoreAverage = (scores, key) => scores.length ? scores.reduce((sum, score) => sum + score[key], 0) / scores.length : null;
const scoreMode = (scores, key) => {
  if (!scores.length) return null;
  const counts = scores.reduce((result, score) => {
    const normalized = Math.round(score[key] * 3) / 3;
    result.set(normalized, (result.get(normalized) || 0) + 1);
    return result;
  }, new Map());
  const maximum = Math.max(...counts.values());
  return [...counts.entries()].filter(([, count]) => count === maximum).sort(([a], [b]) => a - b).map(([score]) => number(score)).join(" / ");
};

export function NewScoresView({ newScores, recentScores, previousVersion }) {
  const averageP1 = scoreAverage(recentScores, "rawP1");
  const averageP2 = scoreAverage(recentScores, "rawP2");
  const modeP1 = scoreMode(recentScores, "rawP1");
  const modeP2 = scoreMode(recentScores, "rawP2");
  return <section className="analysis-page"><div className="section-heading"><div><h2>Notas nuevas</h2><p className="page-intro">Comparación automática por DRD entre la última sincronización y la anterior.</p></div></div>
    <div className="simulator-kpis new-score-kpis"><KpiCard title="Nuevas · 7 días" value={number(recentScores.length, 0)} subtitle="Excluye la carga inicial usada como base"/><KpiCard title="Media P1 / P2 · 7 días" value={averageP1 === null ? "—" : `${number(averageP1)} / ${number(averageP2)}`} subtitle="Notas brutas de las nuevas altas"/><KpiCard title="Moda P1 · 7 días" value={modeP1 || "—"} subtitle="Nota o notas más repetidas"/><KpiCard title="Moda P2 · 7 días" value={modeP2 || "—"} subtitle="Nota o notas más repetidas"/></div>
    <div className="new-score-summary">{previousVersion ? <><strong>{number(newScores.length, 0)}</strong> DRD nuevos frente a la sincronización de <strong>{new Date(previousVersion.completed_at).toLocaleString("es-ES")}</strong>.</> : "La primera sincronización crea la línea base para detectar notas nuevas."}</div>
    {newScores.length > 0 && <div className="table-card"><table><thead><tr><th>DRD</th><th>Provincia</th><th>P1 bruta</th><th>P2 bruta</th><th>Total transformada</th></tr></thead><tbody>{newScores.map((score) => <tr key={score.drd}><td>{score.drd}</td><td>{score.province || "—"}</td><td>{number(score.rawP1)}</td><td>{number(score.rawP2)}</td><td>{number(score.total)}</td></tr>)}</tbody></table></div>}
  </section>;
}

const mv2024 = { sample: 3999, averageP1: 42.63, medianP1: 42.67, averageP2: 14.76, medianP2: 15, qualified: 2006, p1Passed: 3493, p2Passed: 2118 };

// Distribución P2 extraída de los 3.999 registros de "EXCEL MV 2024.xlsx".
const mv2024P2Distribution = [
  [0, 4], [1, 1], [1.33, 2], [1.67, 1], [2, 1], [2.67, 1], [3, 1], [3.33, 2], [3.67, 1],
  [4, 7], [4.33, 5], [4.67, 2], [5, 1], [5.33, 4], [5.67, 4], [6, 6], [6.33, 5], [6.67, 4],
  [7, 6], [7.33, 2], [7.67, 9], [8, 18], [8.33, 6], [8.67, 9], [9, 10], [9.33, 17], [9.67, 14],
  [10, 27], [10.33, 20], [10.67, 27], [11, 56], [11.33, 38], [11.67, 39], [12, 91], [12.33, 85],
  [12.67, 106], [13, 142], [13.33, 207], [13.67, 185], [14, 241], [14.33, 223], [14.67, 251],
  [15, 232], [15.33, 273], [15.67, 242], [16, 221], [16.33, 202], [16.67, 241], [17, 142],
  [17.33, 113], [17.67, 195], [18, 111], [18.67, 70], [19, 63], [20, 13],
];
const mv2024P2Values = mv2024P2Distribution.flatMap(([score, count]) => Array(count).fill(score));

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
    {tab === "summary" && <><div className="scenario-grid analysis-scenarios">{model.scenarios.map((scenario) => <article className={`scenario-card scenario-${scenario.name.toLowerCase()}`} key={scenario.name}><div className="scenario-name">{scenario.name}</div><div className="scenario-cutoff">P2 {scenario.label}</div><div className="scenario-probability">Probabilidad relativa: {scenario.probability}%</div><p>{scenario.description}</p>{analysis && <small>{number(scenario.simulatorCount, 0)} del simulador alcanzan este P2</small>}</article>)}</div><section className="detail-card"><h3>Conclusión imparcial del análisis</h3><p>El escenario central es {number(model.central)} y procede de un consenso sin pesos fijados a mano: {model.weightMethod} El valor anterior al redondeo a tercios es {number(model.centralRaw)}.</p><p>El Excel MV 2024 aporta 3.999 notas: media P2 14,76, mediana 15,00, desviación 2,46 y asimetría −1,34. Por esa cola hacia notas bajas, el motor utiliza su mediana (15,00), más resistente que la media. El histórico oficial aporta 15,66, 14,33 y 14,00 (promedio {number(model.sources.find(({ name }) => name === "Histórico oficial")?.value)}). Las encuestas aportan 1.447 respuestas P2 agregadas, pero reciben penalización por autoselección y falta de dato individual.</p><p>{analysis ? <>El simulador solo entra si puede respaldar al menos el {number(model.minimumEvidenceCoverage * 100, 0)}% de las 2.282 plazas. En el escenario central hay {number(2282 - model.externalSeats, 0)} registros de la muestra por encima del umbral ({number(model.simulatorCoverage * 100, 1)}% de cobertura); quedan {number(model.externalSeats, 0)} plazas no observadas directamente.</> : <>Sin una muestra sincronizada, el simulador recibe peso 0% y los pesos restantes se renormalizan automáticamente.</>}</p><p>Los extremos optimista y pesimista se separan del centro con la misma regla y la misma dispersión ({number(model.spread)} puntos), sin favorecer una dirección. Sus porcentajes son verosimilitudes relativas según la distancia al consenso; no frecuencias observadas ni probabilidades oficiales.</p></section><div className="table-card evidence-table"><table><thead><tr><th>Fuente</th><th>Dato usado</th><th>Muestra</th><th>Peso calculado</th><th>Justificación</th></tr></thead><tbody>{model.sources.map((source) => <tr key={source.name}><td>{source.name}</td><td>{number(source.value)}</td><td>{number(source.sample, 0)}</td><td>{number(source.weight * 100, 1)}%</td><td>{source.rationale}</td></tr>)}</tbody></table></div><div className="analysis-comparison"><Metric label="Plazas 2019 / 2022 / 2024 / 2025" value="850 / 4.333 / 5.080 / 2.282"/><Metric label="P2 histórico 2019 / 2022 / 2024" value="15,66 / 14,33 / 14,00"/><Metric label="Supuestos corregidos 2022 / 2024 / 2025" value="12.999 / 15.240 / 6.846"/></div></>}
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
