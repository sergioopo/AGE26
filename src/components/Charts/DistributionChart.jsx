import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip
} from "recharts";

const data = [
  { nota: "13", candidatos: 12 },
  { nota: "13.5", candidatos: 18 },
  { nota: "14", candidatos: 31 },
  { nota: "14.5", candidatos: 52 },
  { nota: "15", candidatos: 48 },
  { nota: "15.5", candidatos: 36 },
  { nota: "16", candidatos: 24 },
  { nota: "16.5", candidatos: 13 }
];

export default function DistributionChart() {

  return (

    <ResponsiveContainer
      width="100%"
      height={320}
    >

      <AreaChart data={data}>

        <XAxis dataKey="nota"/>

        <Tooltip/>

        <Area
          dataKey="candidatos"
          stroke="#1E3A8A"
          fill="#3B82F6"
          fillOpacity={0.25}
        />

      </AreaChart>

    </ResponsiveContainer>

  );

}