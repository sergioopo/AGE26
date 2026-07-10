import Card from "./Card";

export default function StatCard({

    title,

    value,

    subtitle,

    trend,

    color = "primary"

}){

    return(

        <Card className="stat-card">

            <span className="stat-title">

                {title}

            </span>

            <h2 className={`stat-value ${color}`}>

                {value}

            </h2>

            <span className="stat-subtitle">

                {subtitle}

            </span>

            {trend && (

                <div className="trend">

                    {trend}

                </div>

            )}

        </Card>

    )

}