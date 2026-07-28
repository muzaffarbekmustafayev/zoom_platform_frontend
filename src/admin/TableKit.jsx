import React, { useState } from 'react';
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

/* Helper: generate visible page numbers with ellipsis */
const buildPages = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    const delta = 2;
    const left  = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push('...');
    pages.push(total);
    return pages;
};

/* ── Rich Pagination footer ── */
export const Pagination = ({ page, pages, total, onPage, t, unit, pageSize, onPageSize }) => {
    const [jumpVal, setJumpVal] = useState('');
    const pageNums = buildPages(page, pages);

    const handleJump = (e) => {
        e.preventDefault();
        const n = parseInt(jumpVal, 10);
        if (!isNaN(n) && n >= 1 && n <= pages) { onPage(n); setJumpVal(''); }
    };

    const rangeStart = Math.min((page - 1) * pageSize + 1, total);
    const rangeEnd   = Math.min(page * pageSize, total);

    return (
        <div className="border-t border-gray-100 dark:border-white/[0.06] px-5 py-3.5 bg-gray-50/50 dark:bg-[#0d1117]/40">
            {/* Top row: info + page size */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                {/* Range display */}
                <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{rangeStart}–{rangeEnd}</span>
                        {' '}/ {total} {unit}
                    </span>
                    {pages > 1 && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-white/5 rounded-full px-2 py-0.5 font-medium">
                            {page}/{pages} sahifa
                        </span>
                    )}
                </div>

                {/* Page size selector */}
                {onPageSize && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">Sahifada:</span>
                        <div className="flex gap-1">
                            {[10, 20, 50, 100].map(n => (
                                <button
                                    key={n}
                                    onClick={() => { onPageSize(n); onPage(1); }}
                                    className={`min-w-[32px] h-7 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                                        pageSize === n
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 scale-105'
                                            : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-blue-300 dark:hover:border-blue-500/40'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom row: navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Page buttons */}
                <div className="flex items-center gap-1">
                    {/* First page */}
                    <button
                        onClick={() => onPage(1)}
                        disabled={page <= 1}
                        title="Birinchi sahifa"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/8 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Prev */}
                    <button
                        onClick={() => onPage(page - 1)}
                        disabled={page <= 1}
                        title="Oldingi"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                        <Ico d={Icon.chevronL} size={14} />
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-0.5">
                        {pageNums.map((p, i) =>
                            p === '...' ? (
                                <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-gray-300 dark:text-gray-600 select-none">…</span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => onPage(p)}
                                    className={`h-8 min-w-[32px] px-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                                        p === page
                                            ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-500/20'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/30'
                                    }`}
                                >
                                    {p}
                                </button>
                            )
                        )}
                    </div>

                    {/* Next */}
                    <button
                        onClick={() => onPage(page + 1)}
                        disabled={page >= pages}
                        title="Keyingi"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                        <Ico d={Icon.chevronR} size={14} />
                    </button>

                    {/* Last page */}
                    <button
                        onClick={() => onPage(pages)}
                        disabled={page >= pages}
                        title="Oxirgi sahifa"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/8 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Jump to page */}
                {pages > 5 && (
                    <form onSubmit={handleJump} className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden md:inline">O'tish:</span>
                        <input
                            type="number"
                            min={1}
                            max={pages}
                            value={jumpVal}
                            onChange={e => setJumpVal(e.target.value)}
                            placeholder={String(page)}
                            className="w-14 h-8 text-xs border border-gray-200 dark:border-white/10 rounded-lg px-2 text-center bg-white dark:bg-[#1e2430] text-gray-600 dark:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all [appearance:textfield]"
                        />
                        <button
                            type="submit"
                            className="h-8 px-3 text-xs font-semibold rounded-lg bg-gradient-to-b from-blue-500 to-blue-700 text-white hover:from-blue-400 hover:to-blue-600 shadow-sm shadow-blue-500/20 transition-all duration-150 active:scale-95"
                        >
                            →
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
