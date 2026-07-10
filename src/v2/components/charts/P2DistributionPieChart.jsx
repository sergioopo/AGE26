import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#1d4ed8", "#93c5fd", "#1e40af", "#bfdbfe"];

export default function P2DistributionPieChart({ data = [] }) {
  return <div className="p2-pie-chart">
    <div className="p2-pie-visual"><ResponsiveContainer width="100%" height={360}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius="52%" outerRadius="82%" paddingAngle={1}>
          {data.map((entry, index) => <Cell key={`${entry.label}-${index}`} fill={colors[index % colors.length]}/>)}
        </Pie>
        <Tooltip formatter={(value, _name, item) => [`${value} (${item.payload.percentage.toFixed(1)}%)`, "Candidatos"]} labelFormatter={(_, payload) => payload?.[0] ? `P2: ${payload[0].payload.label}` : ""} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} labelStyle={{ color: "var(--text)" }}/>
      </PieChart>
    </ResponsiveContainer></div>
    <ul className="p2-pie-legend">
      {data.map((entry, index) => <li key={entry.label}><span className="p2-pie-swatch" style={{ background: colors[index % colors.length] }}/><span>{entry.label}</span><strong>{entry.count}</strong><small>{entry.percentage.toFixed(1)}%</small></li>)}
    </ul>
  </div>;
}
