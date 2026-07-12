import { FiCheckCircle, FiClock, FiHash, FiTrendingUp } from "react-icons/fi";

const format = (value, decimals = 2) => new Intl.NumberFormat("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
const average = (scores, key) => scores.length ? scores.reduce((sum, score) => sum + score[key], 0) / scores.length : null;

function RecentStat({ icon: Icon, label, value, detail, tone = "violet" }) {
  return <article className={`recent-stat recent-stat-${tone}`}><span><Icon aria-hidden="true"/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

const groupLabel = (groupName) => groupName === "cupo" ? "Cupo" : "Turno general";
const isSimulatorApt = ({ groupName, rawP1, rawP2 }) => groupName === "cupo"
  ? rawP1 >= 32.3333 && rawP2 >= 10
  : rawP1 >= 35 && rawP2 >= 15;

function ScoresTable({ scores, showDetectedAt = false }) {
  return <div className="recent-table"><table><thead><tr><th>DRD</th><th>Turno</th><th>Provincia</th><th>P1 bruta</th><th>P2 bruta</th>{showDetectedAt && <th>Detectada</th>}<th>Estado</th></tr></thead><tbody>{scores.map((score) => { const isApt = isSimulatorApt(score); return <tr key={score.drd}><td><strong>{score.drd}</strong></td><td><span className={`score-group score-group-${score.groupName === "cupo" ? "reserved" : "general"}`}>{groupLabel(score.groupName)}</span></td><td>{score.province || "—"}</td><td>{format(score.rawP1)}</td><td>{format(score.rawP2)}</td>{showDetectedAt && <td>{score.firstSeenAt ? new Date(score.firstSeenAt).toLocaleString("es-ES") : "—"}</td>}<td><div className="score-statuses"><span className={isApt ? "passed" : "below"}>{isApt ? "Apto" : "No apto"}</span></div></td></tr>; })}</tbody></table></div>;
}

export default function NewScoresDashboard({ newScores, recentScores, previousVersion }) {
  const averageP1 = average(recentScores, "rawP1");
  const averageP2 = average(recentScores, "rawP2");
  const recentApt = recentScores.filter(isSimulatorApt).length;
  const recentNotApt = recentScores.length - recentApt;
  const previousDate = previousVersion ? new Date(previousVersion.completed_at).toLocaleString("es-ES") : null;

  return <section className="new-scores-dashboard simple-recent">
    <div className="recent-heading"><div><span>Seguimiento · turno general y cupo</span><h2>Notas nuevas</h2><p>Cambios detectados frente a la sincronización anterior.</p></div><div className="recent-sync-badge"><FiClock aria-hidden="true"/><div><small>Referencia anterior</small><strong>{previousDate || "Sin línea base"}</strong></div></div></div>
    <div className="recent-stats simple-recent-stats">
      <RecentStat icon={FiHash} label="Última sincronización" value={format(newScores.length, 0)} detail="Nuevos DRD desde la versión anterior" tone="pink"/>
      <RecentStat icon={FiClock} label="Altas · 7 días" value={format(recentScores.length, 0)} detail="Sin contar la carga inicial de la base"/>
      <RecentStat icon={FiTrendingUp} label="Media P1 / P2 · 7 días" value={averageP1 === null ? "—" : `${format(averageP1)} / ${format(averageP2)}`} detail="Notas brutas de las altas recientes" tone="green"/>
      <RecentStat icon={FiCheckCircle} label="Estado · 7 días" value={`${format(recentApt, 0)} / ${format(recentNotApt, 0)}`} detail="Aptos / No aptos según su turno" tone="amber"/>
    </div>
    <article className="recent-panel recent-table-panel"><div className="recent-panel-heading"><div><span>Comparación por DRD</span><h3>Nuevas desde la sincronización anterior</h3></div><strong className="recent-count">{format(newScores.length, 0)} registros</strong></div>{newScores.length ? <ScoresTable scores={newScores}/> : <div className="recent-empty compact"><FiCheckCircle aria-hidden="true"/><strong>Sin diferencias en la última sincronización</strong><span>No se han detectado DRD nuevos frente a la versión anterior.</span></div>}</article>
    <article className="recent-panel recent-table-panel"><div className="recent-panel-heading"><div><span>Historial reciente</span><h3>Notas nuevas detectadas durante los últimos 7 días</h3></div><strong className="recent-count">{format(recentScores.length, 0)} registros</strong></div>{recentScores.length ? <ScoresTable scores={recentScores} showDetectedAt/> : <div className="recent-empty compact"><FiCheckCircle aria-hidden="true"/><strong>Sin altas en los últimos 7 días</strong><span>Las notas que detecten las próximas sincronizaciones permanecerán aquí durante 7 días.</span></div>}</article>
    <p className="simple-recent-note">Las altas recientes reflejan cambios dentro del simulador y no una muestra independiente del conjunto de aspirantes.</p>
  </section>;
}
