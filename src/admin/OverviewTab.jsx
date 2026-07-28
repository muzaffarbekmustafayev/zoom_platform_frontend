import React from 'react';
import StatCard from './StatCard';
import { BarChart, SparkLine, DonutChart } from './Charts';
import { Icon } from './icons';

const Panel = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 p-5 ${className}`}>
        {children}
    </div>
);

/* Status badge for HTTP status codes */
const StatusBadge = ({ code }) => {
    const n = Number(code);
    const cls = n >= 500 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
        : n >= 400 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
        : n >= 300 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    return (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${cls}`}>{code}</span>
    );
};

/* Avatar circle */
const Avatar = ({ name, avatar, size = 8 }) => {
    const initials = (name || '?')[0].toUpperCase();
    return avatar
        ? <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-white/10`} />
        : (
            <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                {initials}
            </div>
        );
};

/* Horizontal bar with label and count */
const BarRow = ({ label, sub, value, max, accent = '#3b82f6', rank, badge }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3 group">
            {rank !== undefined && (
                <span className="w-5 text-[10px] font-bold text-gray-400 dark:text-gray-600 text-center tabular-nums shrink-0">
                    {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                </span>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{label}</p>
                        {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{sub}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {badge}
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 tabular-nums">{value}</span>
                    </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/6 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: accent }}
                    />
                </div>
            </div>
        </div>
    );
};

/* Format milliseconds to h:mm or m:ss */
const fmtDuration = (ms) => {
    if (!ms || ms <= 0) return '—';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}s ${m}d`;
    if (m > 0) return `${m}d ${s}s`;
    return `${s}s`;
};

const fmtDurationFull = (ms) => {
    if (!ms || ms <= 0) return '—';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h} soat ${m} daqiqa`;
    if (m > 0) return `${m} daqiqa`;
    return `${totalSec} soniya`;
};

const OverviewTab = ({ stats, chart, chartDays, setChartDays, t }) => {
    const topIps     = stats?.topIps || [];
    const topHosts   = stats?.topHosts || [];
    const topUsers   = stats?.topActiveUsers || [];
    const topChatMeetings = stats?.topChatMeetings || [];
    const topChatUsers    = stats?.topChatUsers || [];
    const longestMeetings = stats?.longestMeetings || [];
    const maxIp      = topIps[0]?.count || 1;
    const maxHost    = topHosts[0]?.meetingCount || 1;
    const maxUser    = topUsers[0]?.requestCount || 1;
    const maxChatMsg = topChatMeetings[0]?.messageCount || 1;
    const maxChatUsr = topChatUsers[0]?.messageCount || 1;
    const maxDurMs   = longestMeetings[0]?.durationMs || 1;

    return (
        <div className="space-y-5">
            {/* Top 4 stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label={t('total_users')} value={stats?.totalUsers}
                    sub={`+${stats?.newUsersToday ?? 0} ${t('today_suffix')}`}
                    accent="text-blue-600 dark:text-blue-400" icon={Icon.users}
                    spark={chart} sparkKey="users"
                />
                <StatCard
                    label={t('active_meetings')} value={stats?.activeMeetings}
                    sub={`+${stats?.newMeetingsToday ?? 0} ${t('today_suffix')}`}
                    accent="text-purple-600 dark:text-purple-400" icon={Icon.meetings}
                    spark={chart} sparkKey="meetings"
                />
                <StatCard
                    label={t('total_meetings')} value={stats?.totalMeetings}
                    sub={`${stats?.publicMeetings ?? 0} ${t('public_label').toLowerCase()} · ${stats?.privateMeetings ?? 0} ${t('private_label').toLowerCase()}`}
                    accent="text-emerald-600 dark:text-emerald-400" icon={Icon.chart}
                />
                <StatCard
                    label={t('total_messages')} value={stats?.totalMessages}
                    accent="text-amber-600 dark:text-amber-400" icon={Icon.msg}
                />
            </div>

            {/* Bar chart + side panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Panel className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">{t('activity_chart')}</h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('chart_subtitle')}</p>
                        </div>
                        <div className="flex gap-1 border border-gray-200 dark:border-white/8 rounded-lg overflow-hidden">
                            {[7, 14, 30].map(d => (
                                <button key={d} onClick={() => setChartDays(d)}
                                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${chartDays === d ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6'}`}>
                                    {d}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-5 mb-4">
                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 rounded-sm bg-blue-500" /> {t('users')}
                        </span>
                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 rounded-sm bg-purple-500" /> {t('meetings')}
                        </span>
                    </div>
                    <BarChart data={chart} height={160} />
                </Panel>

                <div className="space-y-4">
                    <Panel>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">{t('user_roles')}</h3>
                        <div className="flex items-center gap-5">
                            <DonutChart size={84} segments={[
                                { value: stats?.users  ?? 0, color: '#3b82f6' },
                                { value: stats?.admins ?? 0, color: '#8b5cf6' },
                            ]} />
                            <div className="space-y-2 flex-1">
                                {[
                                    { label: t('users'),  val: stats?.users,  color: 'bg-blue-500' },
                                    { label: t('admins'), val: stats?.admins, color: 'bg-purple-500' },
                                ].map(r => (
                                    <div key={r.label} className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.color}`} />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{r.label}</span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{r.val ?? 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Panel>

                    <Panel>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">{t('meeting_types')}</h3>
                        <div className="flex items-center gap-5">
                            <DonutChart size={84} segments={[
                                { value: stats?.publicMeetings  ?? 0, color: '#10b981' },
                                { value: stats?.privateMeetings ?? 0, color: '#f43f5e' },
                            ]} />
                            <div className="space-y-2 flex-1">
                                {[
                                    { label: t('public_label'),  val: stats?.publicMeetings,  color: 'bg-emerald-500' },
                                    { label: t('private_label'), val: stats?.privateMeetings, color: 'bg-rose-500' },
                                ].map(r => (
                                    <div key={r.label} className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.color}`} />
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{r.label}</span>
                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{r.val ?? 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* Mini stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: t('admins'),         val: stats?.admins,       color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                    { label: t('total_users'),    val: stats?.totalUsers,   color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { label: t('blocked'),        val: stats?.blockedUsers, color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-500/10' },
                    { label: t('today_activity'), val: (stats?.newUsersToday ?? 0) + (stats?.newMeetingsToday ?? 0),
                      color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-500/10',
                      sub: `${stats?.newUsersToday ?? 0}u · ${stats?.newMeetingsToday ?? 0}m` },
                ].map(c => (
                    <div key={c.label} className={`rounded-xl border border-gray-200 dark:border-white/8 p-4 ${c.bg}`}>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
                        <p className={`text-2xl font-bold ${c.color}`}>{c.val ?? 0}</p>
                        {c.sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{c.sub}</p>}
                    </div>
                ))}
            </div>

            {/* ── NEW: Top 3 leaderboard panels ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Top IPs */}
                <Panel>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <span className="inline-flex w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-500/15 items-center justify-center text-base">🌐</span>
                                Eng ko'p so'rov IP
                            </h3>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">So'nggi 7 kun</p>
                        </div>
                        {stats?.totalLogs > 0 && (
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/6 px-2 py-0.5 rounded-full">
                                Jami: {stats.totalLogs}
                            </span>
                        )}
                    </div>
                    {topIps.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-gray-400 dark:text-gray-600">Hali ma'lumot yo'q</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">So'rovlar kelganidan keyin to'ladi</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topIps.slice(0, 8).map((ip, i) => (
                                <BarRow
                                    key={ip.ip}
                                    rank={i}
                                    label={ip.ip}
                                    sub={ip.lastSeen ? new Date(ip.lastSeen).toLocaleString() : ''}
                                    value={ip.count}
                                    max={maxIp}
                                    accent={i === 0 ? '#f97316' : i === 1 ? '#fb923c' : '#fdba74'}
                                />
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Top Active Users */}
                <Panel>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/15 items-center justify-center text-base">👑</span>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Eng faol foydalanuvchilar</h3>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">So'nggi 30 kun · API so'rovlar soni</p>
                        </div>
                    </div>
                    {topUsers.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-gray-400 dark:text-gray-600">Hali ma'lumot yo'q</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">Foydalanuvchilar kirganidan keyin ko'rinadi</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topUsers.map((u, i) => (
                                <div key={u.userId || i} className="flex items-center gap-2.5">
                                    <span className="w-5 text-[10px] font-bold text-gray-400 dark:text-gray-600 text-center tabular-nums shrink-0">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <Avatar name={u.name} avatar={u.avatar} size={7} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{u.name || '—'}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{u.email || ''}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">{u.requestCount}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-600">so'rov</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Top Meeting Hosts */}
                <Panel>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 items-center justify-center text-base">🏆</span>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Ko'p uchrashuv ochganlar</h3>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Barcha vaqt ichida</p>
                        </div>
                    </div>
                    {topHosts.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-gray-400 dark:text-gray-600">Hali uchrashuvlar yo'q</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topHosts.map((h, i) => (
                                <BarRow
                                    key={h.userId || i}
                                    rank={i}
                                    label={h.name || 'Noma\'lum'}
                                    sub={h.email || ''}
                                    value={h.meetingCount}
                                    max={maxHost}
                                    accent={i === 0 ? '#10b981' : i === 1 ? '#34d399' : '#6ee7b7'}
                                    badge={
                                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                            {h.meetingCount} ta
                                        </span>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            {/* ── NEW: Chat & Duration leaderboards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Top Chat Meetings */}
                <Panel>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/15 items-center justify-center text-base">💬</span>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Top Chat Uchrashuvlar</h3>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Eng ko'p xabar yozilgan</p>
                        </div>
                    </div>
                    {topChatMeetings.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-gray-400 dark:text-gray-600">Hali xabarlar yo'q</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">Chat xabarlari kelganidan keyin ko'rinadi</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {topChatMeetings.slice(0, 7).map((m, i) => (
                                <div key={m.meetingId || i} className="flex items-center gap-2.5">
                                    <span className="w-5 text-[10px] font-bold text-gray-400 dark:text-gray-600 text-center shrink-0">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5 gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{m.title}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {m.meetingCode && (
                                                        <span className="font-mono text-[9px] text-gray-400 dark:text-gray-600">{m.meetingCode}</span>
                                                    )}
                                                    {m.roomType && (
                                                        <span className={`text-[9px] font-semibold px-1 rounded ${m.roomType === 'public' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'}`}>
                                                            {m.roomType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums shrink-0">{m.messageCount}</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-gray-100 dark:bg-white/6 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-400 to-blue-600"
                                                style={{ width: `${Math.round((m.messageCount / maxChatMsg) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Top Chat Users */}
                <Panel>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/15 items-center justify-center text-base">✍️</span>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Top Chat Foydalanuvchilar</h3>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Eng ko'p xabar yozganlar</p>
                        </div>
                    </div>
                    {topChatUsers.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-gray-400 dark:text-gray-600">Hali xabarlar yo'q</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">Foydalanuvchilar xabar yozganidan keyin ko'rinadi</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {topChatUsers.slice(0, 7).map((u, i) => (
                                <div key={u.senderId || i} className="flex items-center gap-2">
                                    <span className="w-5 text-[10px] font-bold text-gray-400 dark:text-gray-600 text-center shrink-0">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <Avatar name={u.name} avatar={u.avatar} size={7} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{u.name || '—'}</p>
                                                {u.email && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>}
                                            </div>
                                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 tabular-nums shrink-0">{u.messageCount}</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-gray-100 dark:bg-white/6 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-violet-400 to-violet-600"
                                                style={{ width: `${Math.round((u.messageCount / maxChatUsr) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>

                {/* Longest Meetings */}
                <Panel>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/15 items-center justify-center text-base">⏱️</span>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Eng Uzoq Uchrashuvlar</h3>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Davom etgan muddat bo'yicha</p>
                        </div>
                    </div>
                    {longestMeetings.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-gray-400 dark:text-gray-600">Hali tugallangan uchrashuvlar yo'q</p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">Uchrashuvlar tugallanganidan keyin ko'rinadi</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {longestMeetings.slice(0, 7).map((m, i) => (
                                <div key={m._id || i} className="flex items-center gap-2.5">
                                    <span className="w-5 text-[10px] font-bold text-gray-400 dark:text-gray-600 text-center shrink-0">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5 gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{m.title}</p>
                                                {m.hostName && (
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{m.hostName}</p>
                                                )}
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">{fmtDuration(m.durationMs)}</p>
                                                <p className="text-[9px] text-gray-400 dark:text-gray-600">{fmtDurationFull(m.durationMs)}</p>
                                            </div>
                                        </div>
                                        <div className="h-1 rounded-full bg-gray-100 dark:bg-white/6 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-400 to-amber-600"
                                                style={{ width: `${Math.round((m.durationMs / maxDurMs) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            {/* Trend sparklines */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { title: t('users_growth'),    val: stats?.totalUsers,    key: 'users',    color: '#3b82f6', accent: 'text-blue-600 dark:text-blue-400' },
                    { title: t('meetings_growth'), val: stats?.totalMeetings, key: 'meetings', color: '#8b5cf6', accent: 'text-purple-600 dark:text-purple-400' },
                ].map(c => (
                    <Panel key={c.key}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{c.title}</h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{t('last_days_prefix')} {chartDays} {t('last_days_suffix')}</p>
                            </div>
                            <span className={`text-2xl font-bold ${c.accent}`}>{c.val ?? 0}</span>
                        </div>
                        <SparkLine data={chart} keyName={c.key} color={c.color} />
                    </Panel>
                ))}
            </div>
        </div>
    );
};

export default OverviewTab;
