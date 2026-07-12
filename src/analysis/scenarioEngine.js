export const callData = {
  2019: { places: 787, attended: 18481, correctedP1: 1968, p1Cutoff: 46.33, p2Cutoff: 15.67 },
  2022: { places: 4333, attended: 35765, correctedP1: 12999, p1Cutoff: 31.33, p2Cutoff: 14.33 },
  2024: { places: 5080, correctedP1: 15240, p1Cutoff: 33.70, p2Cutoff: 14.00, registered: 70708, attended: 36671 },
  2025: { places: 2282, correctedP1: 6846, p1Cutoff: 35, registered: 57884, attended: 32188, socialSecurityOverlap: 15800 },
};

export const historicalP2References = [
  { year: 2019, cutoff: 15.67 },
  { year: 2022, cutoff: 14.33 },
  { year: 2024, cutoff: 14.00 },
];

// Las notas llegan de la fuente con cuatro decimales (p. ej. 14,3333), mientras
// los umbrales se expresan como tercios exactos (43 / 3). Normalizar ambos lados
// evita excluir una nota por una diferencia residual de coma flotante.
const normalizeThird = (value) => Math.round(value * 3) / 3;
const countAtOrAbove = (values, threshold) => {
  const normalizedThreshold = normalizeThird(threshold);
  return values.filter((value) => normalizeThird(value) >= normalizedThreshold).length;
};
const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const roundThird = normalizeThird;
const format = (value) => value.toFixed(2).replace(".", ",");
const geometricMean = (values) => values.reduce((product, value) => product * value, 1) ** (1 / values.length);

const evidenceQuality = ({ sample, factors }) => ({
  sample,
  factors,
  qualityScore: geometricMean(Object.values(factors)),
});

export function calculateEvidenceScenarioModel(p2Candidates = []) {
  const correctedRatio = callData[2025].places / callData[2025].correctedP1;
  const simulatorP2 = p2Candidates.filter(({ rawP1, rawP2 }) => rawP1 >= 35 && Number.isFinite(rawP2)).map(({ rawP2 }) => normalizeThird(rawP2));
  const minimumEvidenceCoverage = 0.35;
  const thresholds = [...new Set(simulatorP2)].sort((a, b) => a - b);
  const supportedCutoffs = thresholds.filter((threshold) => countAtOrAbove(simulatorP2, threshold) >= callData[2025].places * minimumEvidenceCoverage);
  const simulatorCutoff = supportedCutoffs.length ? supportedCutoffs.at(-1) : null;
  const sourceCandidates = [
    ...(simulatorCutoff === null ? [] : [{
      name: "Simulador actual", value: simulatorCutoff,
      ...evidenceQuality({
        sample: simulatorP2.length,
        factors: { sample: Math.min(1, Math.sqrt(simulatorP2.length / callData[2025].places)), granularity: 1, recency: 1, comparability: 1, selectionControl: 0.35 },
      }),
      rationale: "Datos individuales y actuales; penalizados por autoselección y por la cobertura real de plazas.",
    }]),
    {
      name: "Excel MV 2024", value: 15,
      ...evidenceQuality({ sample: 3999, factors: { sample: 1, granularity: 1, recency: 0.8, comparability: 0.7, selectionControl: 0.5 } }),
      rationale: "3.999 notas individuales; mediana 15,00, desviación 2,46 y asimetría −1,34. Se usa la mediana por su cola baja.",
    },
    {
      name: "Histórico oficial", value: average(historicalP2References.map(({ cutoff }) => cutoff)),
      ...evidenceQuality({ sample: 3, factors: { sample: 0.55, granularity: 0.65, recency: 0.6, comparability: 0.6, selectionControl: 1 } }),
      rationale: "Cortes oficiales de 2019, 2022 y 2024; máxima verificabilidad, pero solo tres procesos con plazas y dificultad distintas.",
    },
    {
      name: "Encuestas de academias", value: 15,
      ...evidenceQuality({ sample: 1447, factors: { sample: 0.8, granularity: 0.45, recency: 1, comparability: 0.8, selectionControl: 0.25 } }),
      rationale: "1.447 respuestas P2 agregadas; actuales, pero con posible solapamiento, intervalos y fuerte autoselección.",
    },
  ];
  const qualityTotal = sourceCandidates.reduce((sum, source) => sum + source.qualityScore, 0);
  const sources = sourceCandidates.map((source) => ({ ...source, weight: source.qualityScore / qualityTotal }));
  const centralRaw = sources.reduce((sum, source) => sum + source.value * source.weight, 0);
  const central = roundThird(centralRaw);
  const spread = Math.max(0.33, Math.sqrt(sources.reduce((sum, source) => sum + source.weight * (source.value - centralRaw) ** 2, 0)));
  const optimistic = roundThird(Math.max(14, central - Math.max(0.33, spread * 0.7)));
  const pessimistic = roundThird(central + Math.max(0.33, spread * 0.7));
  const centralSimulatorCount = countAtOrAbove(simulatorP2, central);
  const simulatorCoverage = centralSimulatorCount / callData[2025].places;
  const externalSeats = Math.max(0, callData[2025].places - centralSimulatorCount);
  const likelihoods = [optimistic, central, pessimistic].map((cutoff) => Math.exp(-0.5 * ((cutoff - central) / spread) ** 2));
  const likelihoodTotal = likelihoods.reduce((sum, value) => sum + value, 0);
  const optimisticProbability = Math.round(likelihoods[0] / likelihoodTotal * 100);
  const pessimisticProbability = optimisticProbability;
  const centralProbability = 100 - optimisticProbability - pessimisticProbability;
  const makeScenario = (name, cutoff, probability, description) => ({
    name, cutoffMin: cutoff, cutoffMax: cutoff, label: format(cutoff), probability, description,
    simulatorCount: countAtOrAbove(simulatorP2, cutoff), simulatorRate: simulatorP2.length ? countAtOrAbove(simulatorP2, cutoff) / simulatorP2.length * 100 : 0,
  });
  return {
    correctedRatio, minimumEvidenceCoverage, simulatorCoverage, externalSeats, sources, central, centralRaw, spread,
    weightMethod: "Media geométrica de cinco criterios con igual importancia: tamaño suficiente, granularidad, actualidad, comparabilidad y control de selección. Los resultados se normalizan para sumar 100%.",
    scenarios: [
      makeScenario("Optimista", optimistic, optimisticProbability, "Límite inferior simétrico obtenido de la dispersión entre fuentes."),
      makeScenario("Central", central, centralProbability, "Consenso ponderado por la calidad observable de cada evidencia."),
      makeScenario("Pesimista", pessimistic, pessimisticProbability, "Límite superior simétrico obtenido de la misma dispersión."),
    ],
  };
}

export function calculateCutoffScenarios(qualifiedP2Values = []) {
  return calculateEvidenceScenarioModel(qualifiedP2Values.map((rawP2) => ({ rawP1: 35, rawP2 }))).scenarios;
}

export function getHistoricalAnalysis() {
  const current = callData[2025];
  const previous = callData[2024];
  return {
    current,
    previous,
    p1Rule: "Con 6.846 supuestos corregidos previstos (3 × 2.282 plazas), P1 se mantiene en 35,00.",
    attendanceChange: ((current.attended - previous.attended) / previous.attended) * 100,
    placesChange: ((current.places - previous.places) / previous.places) * 100,
    extrapolation: "Las referencias P2 históricas son 15,67 (2019), 14,33 (2022) y 14,00 (2024). La reducción de plazas eleva la presión competitiva, mientras que la dificultad percibida de P1 y la coincidencia con Seguridad Social moderan ese efecto; el motor de escenarios actualiza el intervalo central con las muestras disponibles.",
  };
}
