import { callData, getHistoricalAnalysis } from "../analysis/scenarioEngine.js";
import KpiCard from "./components/cards/KpiCard";
import ExecutiveCard from "./components/cards/ExecutiveCard";
import ProbabilityBadge from "./components/cards/ProbabilityBadge";
import ChartCard from "./components/charts/ChartCard";
import DistributionChart from "./components/charts/DistributionChart";
import P2DistributionPieChart from "./components/charts/P2DistributionPieChart";

const number = (value, decimals = 2) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

const p2CutoffGroups = (analysis) => {
  if (!analysis) return [];
  const countFor = (predicate) => analysis.p2Breakdown.reduce((sum, { score, count }) => sum + (predicate(score) ? count : 0), 0);
  const oneThirdScores = Array.from({ length: 11 }, (_, index) => (37 + index) / 3);
  const groups = [
    { label: "≤ 12,00", count: countFor((score) => score <= 12) },
    ...oneThirdScores.map((score) => ({
      label: Math.abs(score - 14) < 0.02 ? "= 14,00" : number(score),
      count: countFor((value) => Math.abs(value - score) < 0.02),
    })),
    { label: "≥ 16,00", count: countFor((score) => score >= 16) },
  ];
  return groups.map((group) => ({ ...group, percentage: (group.count / analysis.totalScores) * 100 }));
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
  return <>
    <div className="kpi-grid">
      <KpiCard title="Notas registradas" value={analysis ? number(analysis.totalScores, 0) : "—"} subtitle={analysis ? "Registros válidos importados" : "Carga un Excel para comenzar"}/>
      <KpiCard title="Aptos" value={analysis ? number(analysis.qualified, 0) : "—"} subtitle="Tras cribado 35 / 15"/>
      <KpiCard title="Media P1" value={analysis ? number(analysis.averageRawP1) : "—"} subtitle="Ejercicio 1 · nota bruta"/>
      <KpiCard title="Media P2" value={analysis ? number(analysis.averageRawP2) : "—"} subtitle="Supuesto práctico · nota bruta"/>
    </div>
    <div className="dashboard-grid">
      <div>
        <ChartCard title="Distribución de notas" subtitle="P2 bruta agrupada: ≤12,00 y tramos de 0,33 hasta 20,00"><DistributionChart distribution={dashboardP2Distribution(analysis)}/></ChartCard>
        <section className="scenario-section">
          <h2>Escenarios de corte P2</h2>
          <p>Reglas de escenario definidas en el análisis de convocatoria; el simulador indica el volumen de aptos en cada umbral.</p>
          <div className="scenario-grid">
            {analysis ? analysis.scenarios.map((scenario) => <article className={`scenario-card scenario-${scenario.name.toLowerCase()}`} key={scenario.name}>
              <div className="scenario-name">{scenario.name}</div><div className="scenario-cutoff">{scenario.label}</div>
              <div className="scenario-detail">{scenario.description}</div>
              <div className="scenario-probability">{number(scenario.simulatorCount, 0)} aptos ({number(scenario.simulatorRate, 0)}%)</div>
            </article>) : <div className="scenario-placeholder">Carga un Excel para calcular el recuento del simulador.</div>}
          </div>
        </section>
      </div>
      <div>
        <ExecutiveCard title="Resumen ejecutivo"><div className="executive-summary">{analysis ? <>Se han analizado {number(analysis.totalScores, 0)} registros válidos. {number(analysis.qualified, 0)} superan el cribado de P1 ≥ 35 y P2 ≥ 15.<br/><br/>La convocatoria reduce las plazas a 2.282 y la regla de corrección fija P1 en 35,00. El escenario central de P2 se mantiene entre 15,33 y 15,66.<br/><br/>La media total transformada de la muestra es {number(analysis.averageTotal)}.</> : "Carga un Excel con las notas brutas y transformadas para generar el análisis estadístico."}</div><br/>{analysis?.representativity && <ProbabilityBadge probability={Math.round(analysis.representativity)} label="Cobertura"/>}</ExecutiveCard>
        <br/>
        <ExecutiveCard title="Estado del modelo"><div className="score-box">
          <Metric label="Representatividad" value={analysis?.representativity ? `${number(analysis.representativity, 0)} %` : "—"}/>
          <Metric label="Filas válidas" value={analysis ? `${number((analysis.validRows / analysis.importedRows) * 100, 0)} %` : "—"}/>
          <Metric label="Corte P1 previsto" value="35,00"/><Metric label="Corte P2 central" value="15,33 – 15,66"/>
        </div></ExecutiveCard>
      </div>
    </div>
  </>;
}

const Metric = ({ label, value }) => <div className="score-item"><span className="score-label">{label}</span><span className="score-value">{value}</span></div>;

export function HistoricalView({ analysis }) {
  const historical = getHistoricalAnalysis();
  return <section className="analysis-page"><h2>Análisis de convocatorias anteriores</h2><p className="page-intro">Comparativa de los dos últimos procesos y extrapolación a la convocatoria actual a partir de los criterios de la CPS, plazas, asistencia y señales del simulador.</p>
    <div className="table-card"><table><thead><tr><th>Convocatoria</th><th>Plazas</th><th>Presentados</th><th>Mín. P1 corregidos</th><th>Corte P1</th><th>Corte P2</th></tr></thead><tbody>
      {[2023, 2024].map((year) => <tr key={year}><td>{year}</td><td>{number(callData[year].places, 0)}</td><td>{callData[year].attended ? number(callData[year].attended, 0) : "—"}</td><td>{number(callData[year].correctedP1, 0)}</td><td>{number(callData[year].p1Cutoff)}</td><td>{number(callData[year].p2Cutoff)}</td></tr>)}
      <tr className="current-row"><td>2025 / actual</td><td>{number(callData[2025].places, 0)}</td><td>{number(callData[2025].attended, 0)}</td><td>{number(callData[2025].correctedP1, 0)}</td><td>35,00 previsto</td><td>15,33 – 15,66 central</td></tr>
    </tbody></table></div>
    <div className="insight-grid"><article className="insight-card"><h3>Regla de P1</h3><p>{historical.p1Rule}</p></article><article className="insight-card"><h3>Presión de plazas</h3><p>Las plazas bajan un {number(Math.abs(historical.placesChange), 1)}% respecto a 2024; los presentados, un {number(Math.abs(historical.attendanceChange), 1)}%.</p></article><article className="insight-card"><h3>Extrapolación P2</h3><p>{historical.extrapolation}</p></article></div>
    <section className="detail-card"><h3>Lectura del simulador</h3>{analysis ? <p>La muestra actual aporta {number(analysis.totalScores, 0)} notas, con media P1 de {number(analysis.averageRawP1)} y media P2 de {number(analysis.averageRawP2)}. De sus aptos, {number(analysis.scenarios[1].simulatorCount, 0)} alcanzan 15,33, el inicio del escenario central. El histórico debe leerse junto a la muestra: no sustituye la decisión final de la CPS.</p> : <p>Carga un Excel para incorporar las métricas vivas del simulador a esta extrapolación.</p>}</section>
  </section>;
}

export function SimulatorView({ analysis }) {
  return <section className="analysis-page"><h2>Simulador</h2><p className="page-intro">Cortes de referencia y distribución exacta de P2. Las notas se agrupan en intervalos de un tercio (0,33).</p>
    <div className="simulator-kpis"><KpiCard title="Corte P1 previsto" value="35,00" subtitle="Mínimo de corrección CPS"/><KpiCard title="P2 media" value={analysis ? number(analysis.averageRawP2) : "—"} subtitle="Nota bruta"/><KpiCard title="P2 mediana" value={analysis ? number(analysis.p2Median) : "—"} subtitle="Nota bruta"/><KpiCard title="P1 mediana" value={analysis ? number(analysis.p1Median) : "—"} subtitle={`${analysis ? number(analysis.p1AtMinimum, 0) : "—"} con P1 ≥ 35`}/></div>
    <ChartCard title="Distribución circular de P2" subtitle="Agrupación en los umbrales competitivos de P2; la leyenda muestra recuento y porcentaje."><P2DistributionPieChart data={p2CutoffGroups(analysis)}/></ChartCard>
    <div className="table-card"><table><thead><tr><th>Nota P2</th><th>Recuento</th><th>% de muestra</th></tr></thead><tbody>{analysis ? analysis.p2Breakdown.map(({ score, count }) => <tr key={score}><td>{number(score)}</td><td>{number(count, 0)}</td><td>{number((count / analysis.totalScores) * 100, 1)}%</td></tr>) : <tr><td colSpan="3">Carga un Excel para ver el recuento.</td></tr>}</tbody></table></div>
  </section>;
}

export function NewScoresView({ newScores, previousVersion, history, onClearHistory, onRemoveVersion }) {
  const currentVersion = history.at(-1);
  const priorVersion = history.at(-2);
  return <section className="analysis-page"><div className="section-heading"><div><h2>Notas nuevas</h2><p className="page-intro">Comparación por DRD entre la última carga y la versión inmediatamente anterior.</p></div></div>
    {history.length > 0 && <div className="version-manager"><div className="version-manager-title">Excel utilizados para la comparación</div><div className="version-list">
      {priorVersion && <VersionItem label="Versión anterior" version={priorVersion} onRemove={() => onRemoveVersion(history.length - 2)}/>} 
      {currentVersion && <VersionItem label="Versión actual" version={currentVersion} onRemove={() => onRemoveVersion(history.length - 1)}/>} 
    </div><button className="clear-button" type="button" onClick={onClearHistory}>Borrar histórico de notas nuevas</button></div>}
    <div className="new-score-summary">{previousVersion ? <><strong>{number(newScores.length, 0)}</strong> DRD nuevos frente a <strong>{previousVersion.fileName}</strong>.</> : "Carga una segunda versión del Excel para identificar los DRD nuevos."}</div>
    {newScores.length > 0 && <div className="table-card"><table><thead><tr><th>DRD</th><th>Provincia</th><th>P1 bruta</th><th>P2 bruta</th><th>Total transformada</th></tr></thead><tbody>{newScores.map((score) => <tr key={score.drd}><td>{score.drd}</td><td>{score.province || "—"}</td><td>{number(score.rawP1)}</td><td>{number(score.rawP2)}</td><td>{number(score.total)}</td></tr>)}</tbody></table></div>}
  </section>;
}

const VersionItem = ({ label, version, onRemove }) => <div className="version-item"><div><span>{label}</span><strong>{version.fileName}</strong></div><button className="inline-clear-button" type="button" onClick={onRemove}>Quitar</button></div>;
