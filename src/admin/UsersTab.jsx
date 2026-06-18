import React from 'react';
import Select from '../components/Select';
import { Icon, Ico } from './icons';
import { SortTh, SkeletonRows, MessageRow, Pagination } from './TableKit';

const roleOptions = ['user', 'admin'];

const roleBgMap = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
    user:  'bg-blue-100   text-blue-700   dark:bg-blue-500/20   dark:text-blue-300   border-blue-200   dark:border-blue-500/30',
};

const COLS = 6;

const UsersTab = ({
    data, loading, error, page, onPage,
    search, role, status, sort, onSort,
    onSearch, onRole, onStatus,
    onEdit, onBlock, onDelete, onRoleChange, onRetry,
    selected, setSelected, onBulk, meId, t
}) => {
    const items = data?.items || [];
    const selectable = items.filter(u => u._id !== meId).map(u => u._id);
    const allSelected = selectable.length > 0 && selectable.every(id => selected.includes(id));

    const toggleAll = () => setSelected(allSelected ? [] : selectable);
    const toggleOne = (id) =>
        setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

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
                    ]} />
                </div>
                <div className="w-40">
                    <Select size="sm" value={status} onChange={onStatus} options={[
                        { value: 'all',     label: t('all_status') },
                        { value: 'active',  label: t('active_status') },
                        { value: 'blocked', label: t('blocked') },
                    ]} />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{data?.total ?? 0} {t('n_results')}</span>
            </div>

            {/* Bulk action bar */}
            {selected.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selected.length} {t('selected')}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={() => onBulk('block')} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-white/8 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                            {t('block_action')}
                        </button>
                        <button onClick={() => onBulk('unblock')} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-white/8 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors">
                            {t('unblock_action')}
                        </button>
                        <button onClick={() => onBulk('delete')} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-white/8 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            {t('delete_action')}
                        </button>
                        <button onClick={() => setSelected([])} className="px-2.5 py-1 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/8 transition-colors">
                            {t('clear')}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-[#161B22] rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1e2430] border-b border-gray-200 dark:border-white/8">
                                <th className="px-5 py-3.5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        disabled={selectable.length === 0}
                                        className="rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500/30 cursor-pointer disabled:opacity-30"
                                    />
                                </th>
                                <SortTh label={t('user_col')} field="name" sort={sort} onSort={onSort} />
                                <SortTh label={t('role')} field="role" sort={sort} onSort={onSort} />
                                <SortTh label={t('status')} field="status" sort={null} />
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
                            ) : items.length > 0 ? items.map(u => (
                                <tr key={u._id} className={`hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${selected.includes(u._id) ? 'bg-blue-50/50 dark:bg-blue-500/[0.06]' : ''}`}>
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(u._id)}
                                            onChange={() => toggleOne(u._id)}
                                            disabled={u._id === meId}
                                            className="rounded border-gray-300 dark:border-white/20 text-blue-600 focus:ring-blue-500/30 cursor-pointer disabled:opacity-30"
                                        />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {u.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {u.name}
                                                    {u._id === meId && <span className="ml-1.5 text-[10px] text-blue-500">({t('you_label')})</span>}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <select
                                            value={u.role}
                                            onChange={e => onRoleChange(u._id, e.target.value)}
                                            className={`appearance-none cursor-pointer px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${roleBgMap[u.role] || roleBgMap.user}`}
                                        >
                                            {roleOptions.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
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
                                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
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
                                <MessageRow cols={COLS}>{t('no_users_found')}</MessageRow>
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && !error && items.length > 0 && (
                    <Pagination page={page} pages={data.pages} total={data.total} onPage={onPage} t={t} unit={t('users').toLowerCase()} />
                )}
            </div>
        </div>
    );
};

export default UsersTab;
