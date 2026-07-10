import "./main.css";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { analyseWorkbookRows } from "../analysis/liveAnalysis.js";
import MainLayout from "./components/layout/MainLayout";
import { DashboardView, HistoricalView, NewScoresView, SimulatorView } from "./views";

const HISTORY_KEY = "age-simulator-history-v1";
const THEME_KEY = "age-theme-v1";

const getSavedHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};

const compareVersions = (current, previous) => {
  if (!current || !previous) return [];
  const previousDrds = new Set(previous.candidates?.map(({ drd }) => drd) || []);
  return (current.candidates || []).filter(({ drd }) => !previousDrds.has(drd));
};

export default function AppV2() {
  const [page, setPage] = useState("dashboard");
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_KEY) === "dark");
  const [analysis, setAnalysis] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(getSavedHistory);
  const [newScores, setNewScores] = useState(() => {
    const saved = getSavedHistory();
    return compareVersions(saved.at(-1), saved.at(-2));
  });
  const [previousVersion, setPreviousVersion] = useState(() => getSavedHistory().at(-2) || null);
  const inputRef = useRef(null);

  const saveHistory = (nextHistory) => {
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = analyseWorkbookRows(XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null }));
      const previous = history.at(-1) || null;
      setNewScores(previous ? compareVersions({ candidates: parsed.candidates }, previous) : []);
      setPreviousVersion(previous);
      const nextHistory = [...history, { fileName: file.name, uploadedAt: new Date().toISOString(), candidates: parsed.candidates }].slice(-6);
      saveHistory(nextHistory);
      setAnalysis(parsed);
      setFileName(file.name);
      setError("");
    } catch (uploadError) {
      setError(uploadError.message || "No se ha podido leer el archivo Excel.");
    } finally { event.target.value = ""; }
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]); setNewScores([]); setPreviousVersion(null);
  };

  const clearCurrentExcel = () => {
    setAnalysis(null);
    setFileName("");
    setError("");
  };

  const removeHistoryVersion = (index) => {
    const nextHistory = history.filter((_, versionIndex) => versionIndex !== index);
    saveHistory(nextHistory);
    const latest = nextHistory.at(-1);
    const previous = nextHistory.at(-2) || null;
    setPreviousVersion(previous);
    setNewScores(compareVersions(latest, previous));
    if (index === history.length - 1) clearCurrentExcel();
  };

  const toggleTheme = () => {
    setIsDark((currentTheme) => {
      const nextTheme = !currentTheme;
      localStorage.setItem(THEME_KEY, nextTheme ? "dark" : "light");
      return nextTheme;
    });
  };

  const titles = { dashboard: "Análisis del Simulador de cortes", historical: "Histórico", simulator: "Simulador", newScores: "Notas nuevas" };
  return <div className={`app-v2 ${isDark ? "theme-dark" : ""}`}><MainLayout activePage={page} onNavigate={setPage} isDark={isDark} onToggleTheme={toggleTheme}>
    <h1>{titles[page]}</h1>
    <div className="upload-row"><p style={{ marginTop: 12, marginBottom: 0 }}>Sistema de Inteligencia Estadística · AGE 2025</p><div className="upload-actions"><input ref={inputRef} className="file-input" id="excel-upload" type="file" accept=".xlsx,.xls" onChange={onFileChange}/><label className="upload-button" htmlFor="excel-upload">Cargar Excel</label></div></div>
    {fileName && <div className="import-status"><span>Excel general: <strong>{fileName}</strong> · {analysis.importedRows} filas leídas</span><button className="inline-clear-button" type="button" onClick={clearCurrentExcel}>Quitar Excel</button></div>}
    {error && <div className="import-error">{error}</div>}
    {page === "dashboard" && <DashboardView analysis={analysis}/>} {page === "historical" && <HistoricalView analysis={analysis}/>} {page === "simulator" && <SimulatorView analysis={analysis}/>} {page === "newScores" && <NewScoresView newScores={newScores} previousVersion={previousVersion} history={history} onClearHistory={clearHistory} onRemoveVersion={removeHistoryVersion}/>} 
  </MainLayout></div>;
}
