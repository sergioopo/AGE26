export default function ExecutiveCard({

    title,

    children

}){

    return(

        <section className="card">

            <div className="card-title">

                {title}

            </div>

            {children}

        </section>

    )

}