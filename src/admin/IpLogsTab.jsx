import React, { useState } from 'react';
import { SortTh, SkeletonRows, MessageRow, Pagination } from './TableKit';

const COLS = 6;

const methodColor = {
    GET:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    POST:   'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    PUT:    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    PATCH:  'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
};

const StatusBadge = ({ code }) => {
    const n = Number(code);
    const cls = n >= 500 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
        : n >= 400  ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
        : n >= 300  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    return (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${cls}`}>{code}</span>
    );
};

const IpLogsTab = ({
    data, loading, error, page, onPage, pageSize, onPageSize,
    ipFilter, setIpFilter, methodFilter, setMethodFilter,
    statusFilter, setStatusFilter, onRetry, t
}) => {
    const items = data?.items || [];
    const [copiedIp, setCopiedIp] = useState(null);

    const copyIp = (ip) => {
        navigator.clipboard.writeText(ip).then(() => {
            setCopiedIp(ip);
            setTimeout(() => setCopiedIp(null), 1500);
        });
    };

    return (
        <div className="space-y-4">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-200/60 dark:border-orange-500/20 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <div>
                    <h2 className="text-sm font-bold text-gray-800 dark:text-white">IP Monitoring Jurnali</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Barcha API so'rovlar IP manzillari bilan · So'rovlar 30 kundan keyin avtomatik o'chadi</p>
                </div>
                <div className="ml-auto text-right shrink-0">
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{data?.total ?? 0}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">jami yozuv</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 p-4 flex flex-wrap gap-3 items-center">
                <input
                    value={ipFilter}
                    onChange={e => setIpFilter(e.target.value)}
                    placeholder="IP bo'yicha qidirish... (masalan: 192.168)"
                    className="flex-1 min-w-[200px] border border-gray-200 dark:border-white/8 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#0d1117] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition font-mono"
                />
                <select
                    value={methodFilter}
                    onChange={e => setMethodFilter(e.target.value)}
                    className="border border-gray-200 dark:border-white/8 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] focus:outline-none focus:border-blue-400 cursor-pointer"
                >
                    <option value="all">Barcha metodlar</option>
                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="border border-gray-200 dark:border-white/8 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0d1117] focus:outline-none focus:border-blue-400 cursor-pointer"
                >
                    <option value="all">Barcha statuslar</option>
                    <option value="200">2xx — Muvaffaqiyat</option>
                    <option value="300">3xx — Yo'naltirish</option>
                    <option value="400">4xx — Client xatosi</option>
                    <option value="500">5xx — Server xatosi</option>
                </select>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto tabular-nums">
                    {data?.total ?? 0} ta yozuv
                </span>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1e2430] border-b border-gray-200 dark:border-white/8">
                                <SortTh label="IP Manzil" field="ip" sort={null} />
                                <SortTh label="Metod" field="method" sort={null} />
                                <SortTh label="Yo'l" field="path" sort={null} />
                                <SortTh label="Status" field="status" sort={null} />
                                <SortTh label="Foydalanuvchi" field="user" sort={null} />
                                <SortTh label="Vaqt" field="createdAt" sort={null} align="right" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                            {loading ? (
                                <SkeletonRows rows={10} cols={COLS} />
                            ) : error ? (
                                <MessageRow cols={COLS} action={
                                    <button onClick={onRetry} className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                        Qayta urinish
                                    </button>
                                }>
                                    Yuklab bo'lmadi
                                </MessageRow>
                            ) : items.length === 0 ? (
                                <MessageRow cols={COLS}>
                                    <span className="block text-3xl mb-2">🔍</span>
                                    Hali yozuvlar yo'q. Backend ishga tushirilganidan keyin so'rovlar bu yerda ko'rinadi.
                                </MessageRow>
                            ) : items.map((log, idx) => (
                                <tr key={log._id || idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                                    {/* IP */}
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">{log.ip}</span>
                                            <button
                                                onClick={() => copyIp(log.ip)}
                                                title="Nusxa olish"
                                                className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all"
                                            >
                                                {copiedIp === log.ip ? (
                                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                title="IP ni bloklash"
                                                className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-gray-400 hover:text-red-500 transition-all ml-1"
                                                onClick={() => alert('IP ni bloklash tizimi ustida ishlanmoqda')}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    {/* Method */}
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${methodColor[log.method] || 'bg-gray-100 text-gray-600 dark:bg-white/8 dark:text-gray-400'}`}>
                                            {log.method}
                                        </span>
                                    </td>
                                    {/* Path */}
                                    <td className="px-5 py-3 max-w-[200px]">
                                        <p className="font-mono text-xs text-gray-600 dark:text-gray-400 truncate" title={log.path}>{log.path}</p>
                                    </td>
                                    {/* Status */}
                                    <td className="px-5 py-3">
                                        <StatusBadge code={log.status} />
                                    </td>
                                    {/* User */}
                                    <td className="px-5 py-3">
                                        {log.userId ? (
                                            <div>
                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{log.userId.name || '—'}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{log.userId.email || ''}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
                                        )}
                                    </td>
                                    {/* Time */}
                                    <td className="px-5 py-3 text-right whitespace-nowrap">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                        </p>
                                        <p className="text-[10px] text-gray-300 dark:text-gray-600">
                                            {new Date(log.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && !error && items.length > 0 && (
                    <Pagination
                        page={page} pages={data.pages} total={data.total}
                        onPage={onPage} t={t} unit="yozuv"
                        pageSize={pageSize} onPageSize={onPageSize}
                    />
                )}
            </div>
        </div>
    );
};

export default IpLogsTab;
