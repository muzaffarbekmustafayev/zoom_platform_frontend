import React from 'react';
import { Icon, Ico } from './icons';

/* Sortable table header cell */
export const SortTh = ({ label, field, sort, onSort, align = 'left', className = '' }) => {
    const active = sort?.field === field;
    return (
        <th className={`px-5 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
            {onSort ? (
                <button
                    onClick={() => onSort(field)}
                    className={`inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${active ? 'text-blue-600 dark:text-blue-400' : ''}`}
                >
                    {label}
                    <Ico
                        d={Icon.sort}
                        size={12}
                        className={`transition-transform ${active ? 'opacity-100' : 'opacity-30'} ${active && sort.order === 'asc' ? 'rotate-180' : ''}`}
                    />
                </button>
            ) : label}
        </th>
    );
};

/* Loading skeleton rows */
export const SkeletonRows = ({ rows = 6, cols = 5 }) => (
    <>
        {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-gray-100 dark:border-white/[0.04]">
                {Array.from({ length: cols }).map((_, c) => (
                    <td key={c} className="px-5 py-4">
                        <div className="h-3.5 rounded bg-gray-200 dark:bg-white/8 animate-pulse" style={{ width: `${40 + ((r + c) % 4) * 15}%` }} />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

/* Full-width message row (empty / error) */
export const MessageRow = ({ cols, children, action }) => (
    <tr>
        <td colSpan={cols} className="px-5 py-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">{children}</p>
            {action}
        </td>
    </tr>
);

/* Pagination footer */
export const Pagination = ({ page, pages, total, onPage, t, unit }) => (
    <div className="border-t border-gray-100 dark:border-white/8 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-gray-400 dark:text-gray-500">
            {t('total_n')}: <span className="font-semibold text-gray-600 dark:text-gray-300">{total}</span> {unit}
        </span>
        <div className="flex items-center gap-2">
            <button
                onClick={() => onPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <Ico d={Icon.chevronL} size={15} />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {page} / {pages}
            </span>
            <button
                onClick={() => onPage(page + 1)}
                disabled={page >= pages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <Ico d={Icon.chevronR} size={15} />
            </button>
        </div>
    </div>
);
