import React from 'react';
import StatCard from './StatCard';
import { BarChart, SparkLine, DonutChart } from './Charts';
import { Icon } from './icons';

const Panel = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 p-5 ${className}`}>
        {children}
    </div>
);

const OverviewTab = ({ stats, chart, chartDays, setChartDays, t }) => (
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
                            { value: stats?.guests ?? 0, color: '#f59e0b' },
                        ]} />
                        <div className="space-y-2 flex-1">
                            {[
                                { label: t('users'),  val: stats?.users,  color: 'bg-blue-500' },
                                { label: t('admins'), val: stats?.admins, color: 'bg-purple-500' },
                                { label: t('guests'), val: stats?.guests, color: 'bg-amber-400' },
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
                { label: t('guests'),         val: stats?.guests,       color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
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

export default OverviewTab;
