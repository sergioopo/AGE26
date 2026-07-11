export default function ChartCard({

title,

subtitle,

children,

className = ""

}){

return(

<section className={`chart-card ${className}`}>

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
