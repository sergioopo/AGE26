import { calculateCutoffScenarios } from "./scenarioEngine.js";

const normalizeHeader = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");

const headerAliases = {
  rawP1: ["notabrutap1", "p1bruta", "p1bruto", "p1"],
  transformedP1: ["notatransp1", "notatransformadap1", "p1trans", "p1transformada"],
  rawP2: ["notabrutap2", "p2bruta", "p2bruto", "p2"],
  transformedP2: ["notatransp2", "notatransformadap2", "p2trans", "p2transformada"],
  total: ["notatotal", "total"],
  status: ["estado"],
  drd: ["codigo", "drd", "identificador"],
  province: ["provincia"],
};

const asNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const percentile = (values, percentage) => {
  if (!values.length) return null;
  const index = (values.length - 1) * percentage;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return values[lower] + (values[upper] - values[lower]) * (index - lower);
};

function findColumns(headers) {
  const normalized = headers.map(normalizeHeader);
  return Object.fromEntries(Object.entries(headerAliases).map(([key, aliases]) => [
    key,
    normalized.findIndex((header) => aliases.includes(header)),
  ]));
}

export function analyseWorkbookRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("El archivo no contiene filas de datos.");
  }

  const [headers, ...dataRows] = rows;
  const columns = findColumns(headers);
  const requiredColumns = ["rawP1", "transformedP1", "rawP2", "transformedP2"];
  const missing = requiredColumns.filter((key) => columns[key] === -1);

  if (missing.length) {
    throw new Error("Faltan columnas obligatorias: Nota Bruta P1, Nota Trans. P1, Nota Bruta P2 y Nota Trans. P2.");
  }

  const candidates = dataRows.map((row) => ({
    rawP1: asNumber(row[columns.rawP1]),
    transformedP1: asNumber(row[columns.transformedP1]),
    rawP2: asNumber(row[columns.rawP2]),
    transformedP2: asNumber(row[columns.transformedP2]),
    total: columns.total === -1 ? null : asNumber(row[columns.total]),
    status: columns.status === -1 ? "" : String(row[columns.status] ?? ""),
    drd: columns.drd === -1 ? "" : String(row[columns.drd] ?? "").trim(),
    province: columns.province === -1 ? "" : String(row[columns.province] ?? "").trim(),
  })).filter((candidate) => Object.values(candidate).slice(0, 4).every((value) => value !== null));

  if (!candidates.length) throw new Error("No se han encontrado notas numéricas válidas.");

  const qualified = candidates.filter(({ rawP1, rawP2 }) => rawP1 >= 35 && rawP2 >= 15);
  const qualifiedP2Values = qualified.map(({ rawP2 }) => rawP2);
  const p2Values = candidates.map(({ rawP2 }) => rawP2);
  const histogram = Array.from({ length: 21 }, (_, score) => ({
    nota: String(score),
    valor: p2Values.filter((value) => value >= score && value < score + 1).length,
  }));
  const totals = candidates.map(({ transformedP1, transformedP2, total }) => total ?? transformedP1 + transformedP2);
  const p2Breakdown = [...new Set(p2Values.map((value) => Math.round(value * 3) / 3))]
    .sort((a, b) => b - a)
    .map((score) => ({ score, count: p2Values.filter((value) => Math.round(value * 3) / 3 === score).length }));
  const population = Math.max(0, ...candidates.map(({ status }) => {
    const match = status.match(/#\d+\s*\/\s*(\d+)/);
    return match ? Number(match[1]) : 0;
  }));
  const representativity = population ? Math.min(100, (candidates.length / population) * 100) : null;

  return {
    totalScores: candidates.length,
    qualified: qualified.length,
    averageRawP1: average(candidates.map(({ rawP1 }) => rawP1)),
    averageRawP2: average(p2Values),
    averageTotal: average(totals),
    p1Median: percentile(candidates.map(({ rawP1 }) => rawP1).sort((a, b) => a - b), 0.5),
    p2Median: percentile([...p2Values].sort((a, b) => a - b), 0.5),
    p1AtMinimum: candidates.filter(({ rawP1 }) => rawP1 >= 35).length,
    histogram,
    validRows: candidates.length,
    importedRows: dataRows.filter((row) => row.some((value) => value !== null && value !== "")).length,
    population,
    representativity,
    scenarios: calculateCutoffScenarios(qualifiedP2Values),
    p2Breakdown,
    p2Candidates: candidates.map(({ rawP1, rawP2 }) => ({ rawP1, rawP2 })),
    candidates: candidates.map(({ rawP1, rawP2, transformedP1, transformedP2, total, drd, province }) => ({
      drd, province, rawP1, rawP2, total: total ?? transformedP1 + transformedP2,
    })).filter(({ drd }) => drd),
  };
}

export function analyseSimulatorParticipants(participants) {
  const transform = (score, cutoff, maximum) => score < cutoff
    ? (25 * score) / cutoff
    : 25 * (1 + (score - cutoff) / (maximum - cutoff));
  const rows = [["Nota Bruta P1", "Nota Trans. P1", "Nota Bruta P2", "Nota Trans. P2", "Código", "Provincia"], ...participants.map((participant) => [
    participant.rawP1, transform(participant.rawP1, 35, 70), participant.rawP2, transform(participant.rawP2, 15, 20), participant.drd, participant.province,
  ])];
  return analyseWorkbookRows(rows);
}
