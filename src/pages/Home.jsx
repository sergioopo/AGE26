import PageHeader from "../components/Common/PageHeader";

import StatCard from "../components/Cards/StatCard";
import InsightCard from "../components/Cards/InsightCard";
import ProbabilityBadge from "../components/Cards/ProbabilityBadge";
import ChartCard from "../components/Cards/ChartCard";
import ModelScoreCard from "../components/Cards/ModelScoreCard";
import ScenarioCard from "../components/Cards/ScenarioCard";

import DistributionChart from "../components/Charts/DistributionChart";

import { dashboard } from "../data/dashboard";
import { scenarios } from "../data/scenarios";

import {
    calculateModelScore,
    getModelRating
} from "../analysis/scoreEngine";

export default function Home() {

    const modelScore = calculateModelScore();
    const rating = getModelRating(modelScore);

    return (

        <>

            <PageHeader
                title="Executive Dashboard"
                subtitle="Sistema de Inteligencia Estadística · AGE 2025"
            />

            {/* ================= KPIs ================= */}

            <div className="stats-grid">

                <StatCard
                    title="Notas registradas"
                    value={dashboard.sample.totalScores}
                    subtitle="Última actualización"
                />

                <StatCard
                    title="Aptos"
                    value={dashboard.sample.qualified}
                    subtitle="P1 ≥ 35 · P2 ≥ 15"
                />

                <StatCard
                    title="Media P1"
                    value={dashboard.averages.p1}
                    subtitle="Primera prueba"
                />

                <StatCard
                    title="Media P2"
                    value={dashboard.averages.p2}
                    subtitle="Supuesto práctico"
                />

            </div>

            {/* ================= DASHBOARD ================= */}

            <div className="dashboard-grid">

                {/* ================= IZQUIERDA ================= */}

                <div>

                    <ChartCard
                        title="Distribución de notas competitivas"
                    >

                        <DistributionChart />

                    </ChartCard>

                    <div className="scenario-grid">

                        {scenarios.map((scenario) => (

                            <ScenarioCard

                                key={scenario.name}

                                title={scenario.name}

                                cutoff={scenario.cutoff}

                                probability={scenario.probability}

                                color={scenario.color}

                            />

                        ))}

                    </div>

                </div>

                {/* ================= DERECHA ================= */}

                <div>

                    <ModelScoreCard

                        score={modelScore}

                        rating={rating}

                    />

                    <br />

                    <InsightCard
                        title="Executive Summary"
                    >

                        <p>

                            El descenso observado en las medias de la
                            primera prueba y del supuesto práctico
                            continúa respaldando un escenario de corte
                            inferior al de la convocatoria 2024.

                        </p>

                        <br />

                        <ProbabilityBadge

                            probability={dashboard.model.confidence}

                        />

                    </InsightCard>

                    <br />

                    <InsightCard
                        title="Estado del modelo"
                    >

                        <p>

                            <strong>Representatividad:</strong>{" "}
                            {dashboard.model.representativity}%

                        </p>

                        <br />

                        <p>

                            <strong>Convergencia:</strong>{" "}
                            {dashboard.model.convergence}%

                        </p>

                        <br />

                        <p>

                            <strong>Riesgo residual:</strong>{" "}
                            {dashboard.model.residualRisk}%

                        </p>

                    </InsightCard>

                </div>

            </div>

        </>

    );

}