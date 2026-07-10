import Card from "./Card";

export default function ScenarioCard({

title,

cutoff,

probability,

color

}){

return(

<Card>

<span className="stat-title">

{title}

</span>

<h2
style={{color}}
className="scenario-cutoff"
>

{cutoff}

</h2>

<div className="scenario-bar">

<div

style={{

width:`${probability}%`,
background:color

}}

className="scenario-fill"

/>

</div>

<p>

{probability}% de probabilidad

</p>

</Card>

)

}