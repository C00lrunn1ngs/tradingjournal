'use client';
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  data: { month: string; pl: number }[];
}

export default function MonthlyPnlChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-24 text-tj-muted2 text-sm">Geen data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#3a5a6a', fontFamily: 'Inter, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={0} stroke="#1a2e40" />
        <Bar dataKey="pl" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pl >= 0 ? '#00d4aa' : '#ff6b6b'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
