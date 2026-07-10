import Card from "./Card";

export default function InsightCard({

    title,

    children

}) {

    return (

        <Card className="insight-card">

            <h3>

                {title}

            </h3>

            <div>

                {children}

            </div>

        </Card>

    );

}
