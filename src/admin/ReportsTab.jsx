import React, { useState } from 'react';
import { BarChart, DonutChart } from './Charts';

const ReportsTab = ({ stats, chart, t }) => {
    const [period, setPeriod] = useState('30');
    if (!stats) return null;

    const publicCount = stats.publicMeetings || 0;
    const privateCount = stats.privateMeetings || 0;
    const totalMeetings = stats.totalMeetings || (publicCount + privateCount) || 1;
    const publicPct = Math.round((publicCount / totalMeetings) * 100);
    const privatePct = Math.round((privateCount / totalMeetings) * 100);

    const handleExport = (type) => {
        alert(`${type.toUpperCase()} hisoboti tayyorlanmoqda...`);
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-xl shadow-indigo-500/10">
                <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-1/3 -top-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90 mb-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Tizim Tahlili va Hisobotlar
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Analitika Boshqaruv Markazi</h2>
                        <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
                            Platformadagi barcha faolliklar, muloqotlar va uchrashuvlar davomiyligi bo'yicha real vaqtdagi vizual hisobotlar.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF Yuklab olish
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel Yuklash
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Jami Foydalanuvchilar</span>
                        <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            👥
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalUsers || 0}</div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>↑ Bugun +{stats.newUsersToday || 0} ta yangi</span>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Jami Uchrashuvlar</span>
                        <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            📹
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalMeetings || 0}</div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                        <span>{stats.activeMeetings || 0} ta ayni vaqtda faol</span>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Yozishmalar Soni</span>
                        <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                            💬
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalMessages || 0}</div>
                    <div className="mt-2 text-[11px] text-gray-400">Chat xabarlari umumiy statistikasi</div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">IP Jurnallari</span>
                        <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                            🌐
                        </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalLogs || 0}</div>
                    <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">30 kunlik API loglar</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Foydalanuvchilar va Xonalar Faolligi</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Kunlik ro'yxatdan o'tishlar va xona ochilish tendensiyasi</p>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl text-xs">
                            {['7', '30', '90'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setPeriod(d)}
                                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                                        period === d 
                                            ? 'bg-white dark:bg-blue-600 text-gray-900 dark:text-white shadow-sm' 
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
                                    }`}
                                >
                                    {d} Kun
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-72">
                        <BarChart data={chart} xKey="date" yKey="users" color="#6366f1" />
                    </div>
                </div>

                {/* Donut & Distribution */}
                <div className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Xonalar Nisbati</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Ommaviy va Maxfiy xonalar taqsimoti</p>
                        
                        <div className="h-48 flex justify-center items-center">
                            <DonutChart 
                                data={[
                                    { name: 'Ommaviy', value: publicCount || 1, color: '#3b82f6' },
                                    { name: 'Maxfiy', value: privateCount || 1, color: '#8b5cf6' }
                                ]} 
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">Ommaviy Xonalar</span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{publicCount} ({publicPct}%)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-purple-500" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">Maxfiy Xonalar</span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{privateCount} ({privatePct}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Longest Meetings Table */}
            <div className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Eng Davomli Uchrashuvlar</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Eng ko'p vaqt davom etgan 10 ta seans</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                        Top 10 Seans
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                            <tr>
                                <th className="px-6 py-3.5 font-semibold">#</th>
                                <th className="px-6 py-3.5 font-semibold">Uchrashuv Nomi / Kodi</th>
                                <th className="px-6 py-3.5 font-semibold">Tashkilotchi</th>
                                <th className="px-6 py-3.5 font-semibold">Xona Turi</th>
                                <th className="px-6 py-3.5 font-semibold text-right">Davomiyligi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {stats.longestMeetings?.slice(0, 10).map((m, idx) => {
                                const durationMin = Math.round(m.durationMs / 60000);
                                const hours = Math.floor(durationMin / 60);
                                const mins = durationMin % 60;
                                const durationText = hours > 0 ? `${hours} soat ${mins} daq` : `${mins} daq`;

                                return (
                                    <tr key={m._id || idx} className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400 font-bold">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white">{m.title || 'Nomsiz Uchrashuv'}</div>
                                            <div className="text-xs font-mono text-gray-400">{m.meetingCode}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{m.hostName || 'Noma\'lum'}</div>
                                            <div className="text-[11px] text-gray-400">{m.hostEmail || ''}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                m.roomType === 'public' 
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' 
                                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
                                            }`}>
                                                {m.roomType === 'public' ? 'Ommaviy' : 'Maxfiy'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-xs">
                                                ⏱️ {durationText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}

                            {(!stats.longestMeetings || stats.longestMeetings.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <div className="text-3xl mb-2">📊</div>
                                        Hali tugallangan davomli uchrashuvlar mavjud emas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsTab;
