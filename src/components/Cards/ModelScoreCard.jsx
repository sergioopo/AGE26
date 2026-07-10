import Card from "./Card";

export default function ModelScoreCard({

score,

rating

}){

    return(

        <Card>

            <span className="stat-title">

                Calidad del modelo

            </span>

            <h1 className="model-score">

                {score}

            </h1>

            <span className={`badge badge-${rating.color}`}>

                {rating.label}

            </span>

        </Card>

    )

}