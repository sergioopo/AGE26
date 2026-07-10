import {

ResponsiveContainer,

BarChart,

Bar,

XAxis,

YAxis,

Tooltip,

CartesianGrid

} from "recharts";

const data=[];

export default function DistributionChart({ distribution = data }){

return(

<ResponsiveContainer
width="100%"
height={350}
>

<BarChart
data={distribution}
>

<CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>

<XAxis dataKey="nota" stroke="var(--text-soft)" tick={{ fill: "var(--text-soft)" }} label={{ value: "Nota bruta P2", position: "insideBottom", offset: -2, fill: "var(--text-soft)" }}/>

<YAxis stroke="var(--text-soft)" tick={{ fill: "var(--text-soft)" }}/>

<Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} labelStyle={{ color: "var(--text)" }}/>

<Bar

dataKey="valor"

name="Candidatos"

fill="#2563eb"

radius={[6,6,0,0]}

/>

</BarChart>

</ResponsiveContainer>

)

}
