import React from 'react';
import Select from '../components/Select';
import { Icon, Ico } from './icons';
import { SortTh, SkeletonRows, MessageRow, Pagination } from './TableKit';

const COLS = 6;

const MeetingsTab = ({
    data, loading, error, page, onPage,
    search, status, type, sort, onSort,
    onSearch, onStatus, onType, onDelete, onRetry, t
}) => {
    const items = data?.items || [];

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 p-4 flex flex-wrap gap-3 items-center">
                <input
                    value={search}
                    onChange={e => onSearch(e.target.value)}
                    placeholder={t('search_meeting')}
                    className="flex-1 min-w-[180px] border border-gray-200 dark:border-white/8 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#0d1117] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition"
                />
                <div className="w-44">
                    <Select size="sm" value={status} onChange={onStatus} options={[
                        { value: 'all',       label: t('all_status') },
                        { value: 'active',    label: t('active_status') },
                        { value: 'completed', label: t('completed_status') },
                        { value: 'scheduled', label: t('scheduled_status') },
                    ]} />
                </div>
                <div className="w-36">
                    <Select size="sm" value={type} onChange={onType} options={[
                        { value: 'all',     label: t('all_types') },
                        { value: 'public',  label: t('public_label') },
                        { value: 'private', label: t('private_label') },
                    ]} />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{data?.total ?? 0} {t('n_results')}</span>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1e2430] border-b border-gray-200 dark:border-white/8">
                                <SortTh label={t('meetings')} field="title" sort={sort} onSort={onSort} />
                                <SortTh label={t('host')} field="host" sort={null} />
                                <SortTh label={t('type_col')} field="roomType" sort={sort} onSort={onSort} />
                                <SortTh label={t('status')} field="status" sort={sort} onSort={onSort} />
                                <SortTh label={t('date')} field="createdAt" sort={sort} onSort={onSort} />
                                <SortTh label={t('actions')} field="actions" sort={null} align="right" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                            {loading ? (
                                <SkeletonRows rows={6} cols={COLS} />
                            ) : error ? (
                                <MessageRow cols={COLS} action={
                                    <button onClick={onRetry} className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">{t('retry')}</button>
                                }>{t('error_load')}</MessageRow>
                            ) : items.length > 0 ? items.map(m => (
                                <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{m.title}</p>
                                        <p className="text-[11px] font-mono text-blue-500 mt-0.5">{m.meetingCode}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{m.hostId?.name || '—'}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{m.hostId?.email || ''}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                            m.roomType === 'public'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                        }`}>
                                            {m.roomType === 'public' ? t('public_label') : t('private_label')}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                m.status === 'active'    ? 'bg-blue-500 animate-pulse' :
                                                m.status === 'completed' ? 'bg-gray-400' : 'bg-amber-400'
                                            }`} />
                                            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{m.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                        {new Date(m.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => onDelete(m._id)}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                        >
                                            <Ico d={Icon.trash} size={13} /> {t('delete_action')}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <MessageRow cols={COLS}>{t('no_meetings_found')}</MessageRow>
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && !error && items.length > 0 && (
                    <Pagination page={page} pages={data.pages} total={data.total} onPage={onPage} t={t} unit={t('meetings').toLowerCase()} />
                )}
            </div>
        </div>
    );
};

export default MeetingsTab;
