import React from 'react';
import { SparkLine } from './Charts';
import { Ico } from './icons';

const accentColor = (accent) => {
    if (accent.includes('blue'))    return '#3b82f6';
    if (accent.includes('purple'))  return '#8b5cf6';
    if (accent.includes('emerald')) return '#10b981';
    return '#f59e0b';
};

const iconBg = (accent) => {
    const cls = accent.split(' ')[0]; // e.g. "text-blue-600"
    return cls
        .replace('text-', 'bg-')
        .replace('-600', '-50')
        .replace('-500', '-50')
        .replace('-400', '-50')
        + ' dark:' + cls.replace('text-', 'bg-').replace('-600', '-500/12').replace('-400', '-400/12');
};

const StatCard = ({ label, value, sub, accent, icon, spark, sparkKey }) => (
    <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-3xl font-bold ${accent}`}>{value ?? 0}</p>
                {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg(accent)}`}>
                <Ico d={icon} size={20} className={accent.split(' ')[0]} />
            </div>
        </div>
        {spark && <SparkLine data={spark} keyName={sparkKey} color={accentColor(accent)} />}
    </div>
);

export default StatCard;
