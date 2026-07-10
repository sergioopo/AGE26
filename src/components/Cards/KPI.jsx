import Card from "./Card";

export default function KPI({ title, value, subtitle }) {

    return (

        <Card className="kpi-card">

            <span className="kpi-title">
                {title}
            </span>

            <h2 className="kpi-value">
                {value}
            </h2>

            <span className="kpi-subtitle">
                {subtitle}
            </span>

        </Card>

    );

}