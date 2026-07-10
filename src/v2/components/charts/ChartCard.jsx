export default function ChartCard({

title,

subtitle,

children

}){

return(

<section className="chart-card">

<div className="chart-title">

{title}

</div>

<div className="chart-subtitle">

{subtitle}

</div>

<div className="chart-container">

{children}

</div>

</section>

)

}
