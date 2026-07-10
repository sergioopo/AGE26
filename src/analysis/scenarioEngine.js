export const callData = {
  2023: { places: 4333, correctedP1: 12999, p1Cutoff: 31.33, p2Cutoff: 14.33 },
  2024: { places: 5080, correctedP1: 15240, p1Cutoff: 33.70, p2Cutoff: 14.00, registered: 70708, attended: 36671, referenceP2: 15.67 },
  2025: { places: 2282, correctedP1: 6846, p1Cutoff: 35, registered: 57884, attended: 32188, socialSecurityOverlap: 15800 },
};

const countAtOrAbove = (values, threshold) => values.filter((value) => value >= threshold).length;

export function calculateCutoffScenarios(qualifiedP2Values = []) {
  const scenarios = [
    { name: "Optimista", cutoffMin: 15, cutoffMax: 15, label: "15,00", probability: 25, description: "Escenario favorable con cautela" },
    { name: "Central", cutoffMin: 15.33, cutoffMax: 15.66, label: "15,33 – 15,66", probability: 50, description: "Escenario muy favorable" },
    { name: "Pesimista", cutoffMin: 16, cutoffMax: null, label: "≥ 16,00", probability: 25, description: "Zona de seguridad" },
  ];

  return scenarios.map((scenario) => ({
    ...scenario,
    simulatorCount: countAtOrAbove(qualifiedP2Values, scenario.cutoffMin),
    simulatorRate: qualifiedP2Values.length ? (countAtOrAbove(qualifiedP2Values, scenario.cutoffMin) / qualifiedP2Values.length) * 100 : 0,
  }));
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
    extrapolation: "La reducción de plazas eleva la presión competitiva, mientras que la percepción de una P1 más difícil y la coincidencia con Seguridad Social moderan ese efecto. Por ello, el intervalo central de P2 se sitúa entre 15,33 y 15,66.",
  };
}
