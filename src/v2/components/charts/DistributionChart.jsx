import { useEffect, useState } from "react";
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
const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 700px)").matches);

useEffect(() => {
  const media = window.matchMedia("(max-width: 700px)");
  const update = () => setIsMobile(media.matches);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}, []);

return(

<ResponsiveContainer
width="100%"
height={isMobile ? Math.max(330, distribution.length * 25) : 350}
>

<BarChart
data={distribution}
layout={isMobile ? "vertical" : "horizontal"}
margin={isMobile ? { top: 4, right: 16, bottom: 4, left: 4 } : undefined}
>

<CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>

<XAxis type={isMobile ? "number" : "category"} dataKey={isMobile ? "valor" : "nota"} stroke="var(--text-soft)" tick={{ fill: "var(--text-soft)" }} label={isMobile ? undefined : { value: "Nota bruta P2", position: "insideBottom", offset: -2, fill: "var(--text-soft)" }}/>

<YAxis type={isMobile ? "category" : "number"} dataKey={isMobile ? "nota" : undefined} width={isMobile ? 62 : undefined} stroke="var(--text-soft)" tick={{ fill: "var(--text-soft)", fontSize: 11 }}/>

<Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} labelStyle={{ color: "var(--text)" }}/>

<Bar

dataKey="valor"

name="Candidatos"

fill="#2563eb"

radius={isMobile ? [0,6,6,0] : [6,6,0,0]}

/>

</BarChart>

</ResponsiveContainer>

)

}
