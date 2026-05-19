import React from 'react';

export const SparkLine = ({ data = [], keyName, color }) => {
    const vals = data.map(d => d[keyName]);
    const max = Math.max(...vals, 1);
    const w = 100 / Math.max(data.length - 1, 1);
    const pts = vals.map((v, i) => `${i * w},${40 - (v / max) * 38}`).join(' ');
    const area = `0,40 ${pts} ${(data.length - 1) * w},40`;
    return (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-10">
            <defs>
                <linearGradient id={`sp-${keyName}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#sp-${keyName})`} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
};

export const BarChart = ({ data = [], height = 160 }) => {
    const maxVal = Math.max(...data.flatMap(d => [d.users, d.meetings]), 1);
    const bw = 100 / data.length;
    const gap = bw * 0.18;
    const labelStep = Math.ceil(data.length / 6);
    return (
        <div>
            <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
                {data.map((d, i) => {
                    const uh = (d.users / maxVal) * (height - 4);
                    const mh = (d.meetings / maxVal) * (height - 4);
                    const x = i * bw + gap;
                    const hw = (bw - gap * 2) / 2;
                    return (
                        <g key={i}>
                            <rect x={x} y={height - uh} width={hw} height={uh} fill="#3b82f6" opacity="0.85" rx="0.8" />
                            <rect x={x + hw + 0.4} y={height - mh} width={hw} height={mh} fill="#8b5cf6" opacity="0.85" rx="0.8" />
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-between mt-1 px-0.5">
                {data.map((d, i) => i % labelStep === 0 && (
                    <span key={i} className="text-[9px] text-gray-400 dark:text-gray-600">{d.date?.slice(5)}</span>
                ))}
            </div>
        </div>
    );
};

export const DonutChart = ({ segments = [], size = 84 }) => {
    const total = segments.reduce((s, g) => s + g.value, 0) || 1;
    const r = 15.9, c = 2 * Math.PI * r;
    let off = 0;
    return (
        <svg width={size} height={size} viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
            {segments.map((seg, i) => {
                const pct = seg.value / total;
                const dash = pct * c, gap = c - dash;
                const el = <circle key={i} cx="18" cy="18" r={r} fill="none" stroke={seg.color}
                    strokeWidth="4" strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-(off * c)} transform="rotate(-90 18 18)" />;
                off += pct;
                return el;
            })}
            <circle cx="18" cy="18" r="10" fill="currentColor" className="text-white dark:text-[#161B22]" />
        </svg>
    );
};
