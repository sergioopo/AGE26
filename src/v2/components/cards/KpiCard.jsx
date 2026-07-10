export default function KpiCard({

    title,

    value,

    subtitle

}){

    return(

        <article className="card">

            <div className="card-title">

                {title}

            </div>

            <div className="card-value">

                {value}

            </div>

            <div className="card-subtitle">

                {subtitle}

            </div>

        </article>

    )

}