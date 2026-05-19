import React from 'react';
import Select from '../components/Select';
import { Icon, Ico } from './icons';

const roleBadge = (role) => {
    if (role === 'admin') return 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300';
    if (role === 'guest') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
};

const UsersTab = ({ users, search, role, status, onSearch, onRole, onStatus, onEdit, onBlock, onDelete, t }) => {
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
            && (role   === 'all' || u.role === role)
            && (status === 'all' || (status === 'blocked' ? u.isBlocked : !u.isBlocked));
    });

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 p-4 flex flex-wrap gap-3 items-center">
                <input
                    value={search}
                    onChange={e => onSearch(e.target.value)}
                    placeholder={t('search_user')}
                    className="flex-1 min-w-[180px] border border-gray-200 dark:border-white/8 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#0d1117] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition"
                />
                <div className="w-40">
                    <Select size="sm" value={role} onChange={onRole} options={[
                        { value: 'all',   label: t('all_roles') },
                        { value: 'user',  label: t('users') },
                        { value: 'admin', label: t('admins') },
                        { value: 'guest', label: t('role_guest') },
                    ]} />
                </div>
                <div className="w-40">
                    <Select size="sm" value={status} onChange={onStatus} options={[
                        { value: 'all',     label: t('all_status') },
                        { value: 'active',  label: t('active_status') },
                        { value: 'blocked', label: t('blocked') },
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
                                {[t('user_col'), t('role'), t('status'), t('date'), t('actions')].map((h, i) => (
                                    <th key={h} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                            {filtered.length > 0 ? filtered.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {u.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${roleBadge(u.role)}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">{u.isBlocked ? t('blocked') : t('unblocked')}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4 text-right space-x-2">
                                        <button onClick={() => onEdit(u)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                                            <Ico d={Icon.edit} size={13} /> {t('edit_action')}
                                        </button>
                                        <button onClick={() => onBlock(u._id)} className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${u.isBlocked ? 'text-green-600 dark:text-green-400 hover:text-green-800' : 'text-orange-600 dark:text-orange-400 hover:text-orange-800'}`}>
                                            <Ico d={Icon.block} size={13} /> {u.isBlocked ? t('unblock_action') : t('block_action')}
                                        </button>
                                        <button onClick={() => onDelete(u._id, u.name)} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors">
                                            <Ico d={Icon.trash} size={13} /> {t('delete_action')}
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                                        {t('no_users_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filtered.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-white/8 px-5 py-3 flex items-center text-xs text-gray-400 dark:text-gray-500">
                        {t('total_n')}: <span className="font-semibold text-gray-600 dark:text-gray-300 ml-1">{filtered.length}</span> {t('users').toLowerCase()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsersTab;
