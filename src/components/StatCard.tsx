interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: 'white' | 'green' | 'red' | 'yellow' | 'blue';
}

const colorMap = {
  white:  'text-tj-text',
  green:  'text-tj-teal',
  red:    'text-tj-red',
  yellow: 'text-tj-yellow',
  blue:   'text-tj-blue',
};

export default function StatCard({ label, value, sub, color = 'white' }: Props) {
  return (
    <div className="bg-tj-card border border-tj-border rounded-xl p-4">
      <p className="text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-2">
        {label}
      </p>
      <p className={`text-[22px] font-bold font-mono leading-none ${colorMap[color]}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-tj-muted2 font-mono mt-1.5">{sub}</p>}
    </div>
  );
}
