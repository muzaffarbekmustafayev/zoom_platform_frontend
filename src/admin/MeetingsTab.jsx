import React from 'react';
import Select from '../components/Select';
import { Icon, Ico } from './icons';

const MeetingsTab = ({ meetings, status, type, onStatus, onType, onDelete, t }) => {
    const filtered = meetings.filter(m =>
        (status === 'all' || m.status   === status) &&
        (type   === 'all' || m.roomType === type)
    );

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 p-4 flex flex-wrap gap-3 items-center">
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
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{filtered.length} {t('n_results')}</span>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1e2430] border-b border-gray-200 dark:border-white/8">
                                {[t('meetings'), t('host'), t('type_col'), t('status'), t('date'), t('actions')].map((h, i) => (
                                    <th key={h} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                            {filtered.length > 0 ? filtered.map(m => (
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
                                <tr>
                                    <td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                                        {t('no_meetings_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filtered.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-white/8 px-5 py-3 text-xs text-gray-400 dark:text-gray-500">
                        {t('total_n')}: <span className="font-semibold text-gray-600 dark:text-gray-300 ml-1">{filtered.length}</span> {t('meetings').toLowerCase()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingsTab;
