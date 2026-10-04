import { useState, useMemo } from 'react';
import { Activity, Flame, Thermometer, Wind } from 'lucide-react';

export default function SensorTelemetryChart({ readings = [] }) {
  const [activeMetric, setActiveMetric] = useState('smoke');

  // Chart data sorted oldest-first for left-to-right time progression
  const chartData = useMemo(() => {
    return [...readings].reverse().slice(-20);
  }, [readings]);

  const metricsConfig = {
    smoke: {
      label: 'Smoke Density',
      icon: Wind,
      unit: 'raw',
      color: '#9A5B00',
      bgColor: 'rgba(154, 91, 0, 0.1)',
      threshold: 1050,
      thresholdLabel: 'Critical Smoke (1050)',
      getValue: (r) => r.smoke.filtered,
      format: (v) => `${v.toFixed(1)} raw`,
    },
    temperature: {
      label: 'Temperature',
      icon: Thermometer,
      unit: '°C',
      color: '#1F5CC4',
      bgColor: 'rgba(31, 92, 196, 0.1)',
      threshold: 35,
      thresholdLabel: 'High Temp Alert (35°C)',
      getValue: (r) => r.temperature.filtered,
      format: (v) => `${v.toFixed(2)} °C`,
    },
    vibration: {
      label: 'Vibration',
      icon: Activity,
      unit: 'g',
      color: '#7C3AED',
      bgColor: 'rgba(124, 58, 237, 0.1)',
      threshold: 1.0,
      thresholdLabel: 'Excessive Shock (1.0)',
      getValue: (r) => r.vibration.filtered,
      format: (v) => `${v.toFixed(2)}`,
    },
    fire: {
      label: 'Fire Status',
      icon: Flame,
      unit: 'status',
      color: '#BB2D28',
      bgColor: 'rgba(187, 45, 40, 0.1)',
      threshold: 0.5,
      thresholdLabel: 'Hazard Triggered',
      getValue: (r) => (r.fire.isFire ? 1 : 0),
      format: (v) => (v === 1 ? 'Hazard Active' : 'Normal / Clear'),
    },
  };

  const currentCfg = metricsConfig[activeMetric];

  // Calculate scales
  const values = chartData.map((d) => currentCfg.getValue(d));
  const rawMin = Math.min(...(values.length ? values : [0]));
  const rawMax = Math.max(...(values.length ? values : [100]));
  const padding = (rawMax - rawMin) * 0.15 || 1;
  const minVal = Math.max(0, rawMin - padding);
  const maxVal = Math.max(rawMax + padding, currentCfg.threshold ? currentCfg.threshold * 1.05 : rawMax + padding);

  const width = 760;
  const height = 220;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 35;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = chartData.map((d, idx) => {
    const val = currentCfg.getValue(d);
    const x = chartData.length > 1 ? padLeft + (idx / (chartData.length - 1)) * chartW : padLeft + chartW / 2;
    const y = padTop + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
    return { x, y, val, time: d.timeFormatted.time, isFire: d.fire.isFire, raw: d };
  });

  const pathD = points.length > 0 ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '') : '';
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x},${padTop + chartH} L ${points[0].x},${padTop + chartH} Z`
      : '';

  const thresholdY =
    currentCfg.threshold && currentCfg.threshold >= minVal && currentCfg.threshold <= maxVal
      ? padTop + chartH - ((currentCfg.threshold - minVal) / (maxVal - minVal || 1)) * chartH
      : null;

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="space-y-4">
      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(metricsConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const isActive = activeMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'border border-line bg-surface text-ink-soft hover:bg-canvas hover:text-ink'
                }`}
              >
                <Icon size={14} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-xs text-ink-mute">
          Showing latest {chartData.length} telemetry samples
        </span>
      </div>

      {/* SVG Chart Container */}
      <div className="relative overflow-x-auto rounded-lg border border-line bg-surface p-3">
        {chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-ink-mute">
            Waiting for telemetry data stream...
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" style={{ minWidth: '480px' }}>
            <defs>
              <linearGradient id={`grad-${activeMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={currentCfg.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={currentCfg.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padTop + chartH * pct;
              const val = maxVal - pct * (maxVal - minVal);
              return (
                <g key={pct}>
                  <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#C3D6EC" strokeDasharray="3 3" opacity="0.6" />
                  <text x={padLeft - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#516279" fontFamily="monospace">
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Critical Threshold Line */}
            {thresholdY !== null && (
              <g>
                <line
                  x1={padLeft}
                  y1={thresholdY}
                  x2={padLeft + chartW}
                  y2={thresholdY}
                  stroke="#BB2D28"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <text x={padLeft + chartW - 5} y={thresholdY - 4} textAnchor="end" fontSize="9.5" fill="#BB2D28" fontWeight="600">
                  {currentCfg.thresholdLabel}
                </text>
              </g>
            )}

            {/* Area Fill & Line */}
            <path d={areaD} fill={`url(#grad-${activeMetric})`} />
            <path d={pathD} fill="none" stroke={currentCfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data Points */}
            {points.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.isFire ? 6 : hoveredPoint === i ? 5 : 3.5}
                  fill={pt.isFire ? '#BB2D28' : currentCfg.color}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all hover:scale-125"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Highlight fire point */}
                {pt.isFire && (
                  <circle cx={pt.x} cy={pt.y} r="9" fill="none" stroke="#BB2D28" strokeWidth="1.5" opacity="0.75" className="animate-ping" />
                )}
              </g>
            ))}

            {/* Time labels on X Axis */}
            {points.map((pt, i) => {
              if (points.length > 8 && i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) return null;
              return (
                <text
                  key={`t-${i}`}
                  x={pt.x}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill="#516279"
                  fontFamily="monospace"
                >
                  {pt.time}
                </text>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip overlay */}
        {hoveredPoint !== null && points[hoveredPoint] && (
          <div
            className="absolute pointer-events-none rounded-md border border-line bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{
              left: `${(points[hoveredPoint].x / width) * 100}%`,
              top: `${Math.max(10, (points[hoveredPoint].y / height) * 100 - 35)}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="font-semibold">{currentCfg.format(points[hoveredPoint].val)}</p>
            <p className="text-[11px] text-gray-300">{points[hoveredPoint].time}</p>
            {points[hoveredPoint].isFire && <p className="font-bold text-red-300">🔥 Fire Alert Node</p>}
          </div>
        )}
      </div>
    </div>
  );
}
