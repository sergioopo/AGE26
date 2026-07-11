import "./main.css";
import { useCallback, useEffect, useState } from "react";
import { analyseSimulatorParticipants } from "../analysis/liveAnalysis.js";
import MainLayout from "./components/layout/MainLayout";
import { AnalysisView, DashboardView, HistoricalView, NewScoresView, SimulatorView } from "./views";

const THEME_KEY = "age-theme-v1";

async function api(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "No se ha podido conectar con la base de datos.");
  return body;
}

export default function AppV2() {
  const [page, setPage] = useState("dashboard");
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) !== "light");
  const [analysis, setAnalysis] = useState(null);
  const [sync, setSync] = useState(null);
  const [newScores, setNewScores] = useState([]);
  const [recentScores, setRecentScores] = useState([]);
  const [previousVersion, setPreviousVersion] = useState(null);
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDatabase = useCallback(async () => {
    const [status, participants, scores] = await Promise.all([
      api("/api/simulator/status"), api("/api/simulator/participants"), api("/api/simulator/new-scores"),
    ]);
    setSync(status.sync);
    setAnalysis(participants.participants.length ? analyseSimulatorParticipants(participants.participants) : null);
    setNewScores(scores.scores);
    setRecentScores(scores.recentScores || []);
    setPreviousVersion(scores.previousSync);
  }, []);

  useEffect(() => { void Promise.resolve().then(loadDatabase).catch((loadError) => setError(loadError.message)); }, [loadDatabase]);

  const synchronize = async () => {
    setIsSyncing(true); setError("");
    try { await api("/api/simulator/sync", { method: "POST" }); await loadDatabase(); }
    catch (syncError) { setError(syncError.message); }
    finally { setIsSyncing(false); }
  };

  const toggleTheme = () => setIsDark((currentTheme) => {
    const nextTheme = !currentTheme;
    localStorage.setItem(THEME_KEY, nextTheme ? "dark" : "light");
    return nextTheme;
  });

  const titles = { dashboard: "Dashboard del Simulador de cortes", historical: "Histórico", simulator: "Distribución de la muestra del simulador", analysis: "Análisis", newScores: "Notas nuevas" };
  return <div className={`app-v2 ${isDark ? "theme-dark" : ""}`}><MainLayout activePage={page} onNavigate={setPage} isDark={isDark} onToggleTheme={toggleTheme}>
    <h1>{titles[page]}</h1>
    <div className="upload-row"><p className="dashboard-description" style={{ marginTop: 12, marginBottom: 0 }}>Esta herramienta tiene como objetivo permitir una visualización y análisis de los datos del Simulador de <a href="https://plataformafuncionarios.es" target="_blank" rel="noreferrer">plataformafuncionarios.es</a>. No es una herramienta oficial ni representa los cortes finales de la convocatoria AGE C1 2025.</p><div className="upload-actions"><button className="upload-button" type="button" onClick={synchronize} disabled={isSyncing}>{isSyncing ? "Actualizando…" : "Actualizar ranking"}</button></div></div>
    {sync && <div className="import-status"><span>Base de datos sincronizada: <strong>{new Date(sync.completed_at).toLocaleString("es-ES")}</strong> · {sync.participant_count} participantes · {sync.new_count} nuevos</span></div>}
    {!sync && !error && <div className="import-status"><span>Aún no hay datos. Pulsa “Actualizar ranking” para realizar la primera sincronización.</span></div>}
    {error && <div className="import-error">{error}</div>}
    {page === "dashboard" && <DashboardView analysis={analysis}/>} {page === "historical" && <HistoricalView analysis={analysis}/>} {page === "simulator" && <SimulatorView analysis={analysis}/>} {page === "analysis" && <AnalysisView analysis={analysis}/>} {page === "newScores" && <NewScoresView newScores={newScores} recentScores={recentScores} previousVersion={previousVersion}/>}
  </MainLayout></div>;
}
