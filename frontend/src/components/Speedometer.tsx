import { gaugeColor } from '../lib/format'

interface SpeedometerProps {
  percentage: number
  value: string
  label?: string
  sublabel?: string
}

export function Speedometer({ percentage, value, label = 'Índice de Gestão', sublabel }: SpeedometerProps) {
  const clamped = Math.max(0, Math.min(100, percentage))
  const r = 90
  const cx = 110
  const cy = 105
  const angle = Math.PI * (1 - clamped / 100)
  const x = cx + r * Math.cos(angle)
  const y = cy - r * Math.sin(angle)
  const color = gaugeColor(clamped)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 120" className="w-full max-w-60">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={x}
          y2={y}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="8" fill={color} />
      </svg>
      <div className="-mt-6 text-center">
        <div className="text-4xl font-black text-slate-900">{value}</div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        {sublabel && <div className="mt-0.5 text-xs text-slate-400">{sublabel}</div>}
      </div>
    </div>
  )
}