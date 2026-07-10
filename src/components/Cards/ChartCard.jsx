import Card from "./Card";

export default function ChartCard({

title,

children

}){

return(

<Card>

<h3 className="chart-title">

{title}

</h3>

{children}

</Card>

)

}