import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function GaussianCurveChart({ values = [] }) {
  if (!values.length) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const deviation = Math.sqrt(variance) || 1;
  const data = Array.from({ length: 81 }, (_, index) => {
    const score = index / 4;
    const density = Math.exp(-0.5 * ((score - mean) / deviation) ** 2) / (deviation * Math.sqrt(2 * Math.PI));
    return { score, density };
  });
  return <ResponsiveContainer width="100%" height={340}><AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
    <defs><linearGradient id="gaussianFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.45}/><stop offset="100%" stopColor="#2563eb" stopOpacity={0.03}/></linearGradient></defs>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
    <XAxis type="number" dataKey="score" domain={[0, 20]} tickCount={11} tickFormatter={(value) => value.toFixed(0)} stroke="var(--text-soft)" tick={{ fill: "var(--text-soft)" }}/>
    <YAxis hide/>
    <Tooltip formatter={(value) => [Number(value).toFixed(3), "Densidad"]} labelFormatter={(value) => `P2: ${Number(value).toFixed(2)}`} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}/>
    <Area type="monotone" dataKey="density" stroke="#2563eb" strokeWidth={3} fill="url(#gaussianFill)" name="Curva normal"/>
  </AreaChart></ResponsiveContainer>;
}
