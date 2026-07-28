import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../components/ConfirmModal';

import AdminSidebar  from '../admin/AdminSidebar';
import AdminHeader   from '../admin/AdminHeader';
import OverviewTab   from '../admin/OverviewTab';
import UsersTab      from '../admin/UsersTab';
import MeetingsTab   from '../admin/MeetingsTab';
import IpLogsTab from '../admin/IpLogsTab';
import RolesTab from '../admin/RolesTab';
import SettingsTab from '../admin/SettingsTab';
import ReportsTab from '../admin/ReportsTab';
import UserModal from '../admin/UserModal';

const EMPTY_USER = { name: '', email: '', password: '', role: 'user' };
const PAGE_SIZE = 20;
const EMPTY_PAGE = { items: [], total: 0, page: 1, pages: 1 };

// Build a query string, dropping empty / "all" values.
const qs = (obj) => {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'all') p.set(k, v);
    });
    const s = p.toString();
    return s ? `?${s}` : '';
};

// Trigger a browser download from an authenticated blob response.
const downloadBlob = (data, filename) => {
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

const AdminPage = () => {
    const [stats, setStats]         = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [users, setUsers]         = useState(EMPTY_PAGE);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError]     = useState(false);

    const [meetings, setMeetings]   = useState(EMPTY_PAGE);
    const [mtgLoading, setMtgLoading]     = useState(true);
    const [mtgError, setMtgError]         = useState(false);

    const [activeTab, setActiveTab] = useState('overview');
    const [chartDays, setChartDays] = useState(30);
    const [sidebarOpen, setSidebar] = useState(false);

    const [showModal, setShowModal]     = useState(false);
    const [editMode, setEditMode]       = useState(false);
    const [currentUser, setCurrentUser] = useState(EMPTY_USER);
    const [saving, setSaving]           = useState(false);

    // Users query state
    const [userSearch, setUserSearch] = useState('');
    const [userRole,   setUserRole]   = useState('all');
    const [userStatus, setUserStatus] = useState('all');
    const [userSort,   setUserSort]   = useState({ field: 'createdAt', order: 'desc' });
    const [userPage,   setUserPage]   = useState(1);
    const [userPageSize, setUserPageSize] = useState(PAGE_SIZE);
    const [selected,   setSelected]   = useState([]);

    // Meetings query state
    const [mtgSearch, setMtgSearch] = useState('');
    const [mtgStatus, setMtgStatus] = useState('all');
    const [mtgType,   setMtgType]   = useState('all');
    const [mtgSort,   setMtgSort]   = useState({ field: 'createdAt', order: 'desc' });
    const [mtgPage,   setMtgPage]   = useState(1);
    const [mtgPageSize, setMtgPageSize] = useState(PAGE_SIZE);

    // IP Logs state
    const [ipLogs,      setIpLogs]      = useState(EMPTY_PAGE);
    const [ipLoading,   setIpLoading]   = useState(false);
    const [ipError,     setIpError]     = useState(false);
    const [ipPage,      setIpPage]      = useState(1);
    const [ipPageSize,  setIpPageSize]  = useState(50);
    const [ipFilter,    setIpFilter]    = useState('');
    const [ipFilterQ,   setIpFilterQ]   = useState('');
    const [methodFilter, setMethodFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Debounced search terms
    const [userSearchQ, setUserSearchQ] = useState('');
    const [mtgSearchQ,  setMtgSearchQ]  = useState('');

    const navigate = useNavigate();
    const { t }    = useContext(ThemeLanguageContext);
    const { user: me, logout } = useAuth();
    const toast    = useToast();
    const { confirm, modal: confirmModal } = useConfirm();

    /* ---------- debounce search inputs ---------- */
    useEffect(() => {
        const id = setTimeout(() => { setUserSearchQ(userSearch); setUserPage(1); }, 350);
        return () => clearTimeout(id);
    }, [userSearch]);
    useEffect(() => {
        const id = setTimeout(() => { setMtgSearchQ(mtgSearch); setMtgPage(1); }, 350);
        return () => clearTimeout(id);
    }, [mtgSearch]);
    useEffect(() => {
        const id = setTimeout(() => { setIpFilterQ(ipFilter); setIpPage(1); }, 400);
        return () => clearTimeout(id);
    }, [ipFilter]);

    /* ---------- reset page when filters change ---------- */
    useEffect(() => { setUserPage(1); setSelected([]); }, [userRole, userStatus, userSort]);
    useEffect(() => { setMtgPage(1); }, [mtgStatus, mtgType, mtgSort]);
    useEffect(() => { setIpPage(1); }, [methodFilter, statusFilter]);

    /* ---------- fetchers ---------- */
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const { data } = await API.get(`/api/admin/stats${qs({ days: chartDays })}`);
            setStats(data);
        } catch { /* overview shows zeros */ }
        finally { setStatsLoading(false); }
    }, [chartDays]);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true); setUsersError(false);
        try {
            const { data } = await API.get(`/api/admin/users${qs({
                page: userPage, limit: userPageSize, search: userSearchQ,
                role: userRole, status: userStatus,
                sort: userSort.field, order: userSort.order
            })}`);
            setUsers(data);
        } catch { setUsersError(true); }
        finally { setUsersLoading(false); }
    }, [userPage, userPageSize, userSearchQ, userRole, userStatus, userSort]);

    const fetchMeetings = useCallback(async () => {
        setMtgLoading(true); setMtgError(false);
        try {
            const { data } = await API.get(`/api/admin/meetings${qs({
                page: mtgPage, limit: mtgPageSize, search: mtgSearchQ,
                status: mtgStatus, type: mtgType,
                sort: mtgSort.field, order: mtgSort.order
            })}`);
            setMeetings(data);
        } catch { setMtgError(true); }
        finally { setMtgLoading(false); }
    }, [mtgPage, mtgPageSize, mtgSearchQ, mtgStatus, mtgType, mtgSort]);

    const fetchIpLogs = useCallback(async () => {
        setIpLoading(true); setIpError(false);
        try {
            const { data } = await API.get(`/api/admin/logs/ips${qs({
                page: ipPage, limit: ipPageSize,
                ip: ipFilterQ, method: methodFilter, status: statusFilter
            })}`);
            setIpLogs(data);
        } catch { setIpError(true); }
        finally { setIpLoading(false); }
    }, [ipPage, ipPageSize, ipFilterQ, methodFilter, statusFilter]);

    useEffect(() => { fetchStats();    }, [fetchStats]);
    useEffect(() => { fetchUsers();    }, [fetchUsers]);
    useEffect(() => { fetchMeetings(); }, [fetchMeetings]);
    useEffect(() => { if (activeTab === 'iplogs') fetchIpLogs(); }, [fetchIpLogs, activeTab]);

    const refreshAll = () => { fetchStats(); fetchUsers(); fetchMeetings(); if (activeTab === 'iplogs') fetchIpLogs(); };

    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    /* ---------- user actions ---------- */
    const toggleBlock = async (id) => {
        try {
            await API.put(`/api/admin/users/${id}/block`);
            fetchUsers(); fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleDeleteUser = async (id, name) => {
        if (!await confirm(`${t('confirm_delete_user')} "${name}"?`)) return;
        try {
            await API.delete(`/api/admin/users/${id}`);
            toast.success(t('user_deleted'));
            setSelected(prev => prev.filter(x => x !== id));
            fetchUsers(); fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleRoleChange = async (id, newRole) => {
        const prev = users.items;
        setUsers(u => ({ ...u, items: u.items.map(x => x._id === id ? { ...x, role: newRole } : x) }));
        try {
            await API.put(`/api/admin/users/${id}/role`, { role: newRole });
            toast.success(t('role_updated'));
            fetchStats();
        } catch (err) {
            setUsers(u => ({ ...u, items: prev }));
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editMode) {
                await API.put(`/api/admin/users/${currentUser._id}`, currentUser);
                toast.success(t('user_updated'));
            } else {
                await API.post('/api/admin/users', currentUser);
                toast.success(t('user_created'));
            }
            setShowModal(false);
            setCurrentUser(EMPTY_USER);
            fetchUsers(); fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        } finally { setSaving(false); }
    };

    /* ---------- bulk actions ---------- */
    const runBulk = async (action) => {
        if (!selected.length) return;
        const confirmKey = action === 'delete' ? 'confirm_bulk_delete'
            : action === 'block' ? 'confirm_bulk_block' : 'confirm_bulk_unblock';
        if (!await confirm(`${t(confirmKey)} (${selected.length})`)) return;
        try {
            const { data } = await API.post('/api/admin/users/bulk', { action, ids: selected });
            toast.success(data.message || t('action_done'));
            setSelected([]);
            fetchUsers(); fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    /* ---------- export ---------- */
    const exportCsv = async (kind) => {
        const params = kind === 'users'
            ? qs({ search: userSearchQ, role: userRole, status: userStatus })
            : qs({ search: mtgSearchQ, status: mtgStatus, type: mtgType });
        try {
            const { data } = await API.get(`/api/admin/${kind}/export${params}`, { responseType: 'blob' });
            downloadBlob(data, `${kind}-${new Date().toISOString().slice(0, 10)}.csv`);
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    /* ---------- meeting actions ---------- */
    const handleDeleteMeeting = async (id) => {
        if (!await confirm(t('confirm_delete_meeting'))) return;
        try {
            await API.delete(`/api/admin/meetings/${id}`);
            toast.success(t('meeting_deleted'));
            fetchMeetings(); fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const openEdit = (u) => { setCurrentUser({ ...u, password: '' }); setEditMode(true);  setShowModal(true); };
    const openAdd  = ()  => { setCurrentUser(EMPTY_USER);             setEditMode(false); setShowModal(true); };

    const toggleSort = (setter) => (field) =>
        setter(s => ({ field, order: s.field === field && s.order === 'asc' ? 'desc' : 'asc' }));

    const chart = stats?.chartData || [];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-[#0b0e14] font-sans overflow-hidden">

            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sidebarOpen={sidebarOpen}
                setSidebar={setSidebar}
                me={me}
                onLogout={handleLogout}
                t={t}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader
                    activeTab={activeTab}
                    loading={statsLoading || usersLoading || mtgLoading}
                    onRefresh={refreshAll}
                    onAdd={openAdd}
                    onExport={() => exportCsv(activeTab === 'meetings' ? 'meetings' : 'users')}
                    onMenuOpen={() => setSidebar(true)}
                    t={t}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {activeTab === 'overview' && (
                        statsLoading && !stats ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <OverviewTab
                                stats={stats} chart={chart}
                                chartDays={chartDays} setChartDays={setChartDays}
                                t={t}
                            />
                        )
                    )}

                    {activeTab === 'users' && (
                        <UsersTab
                            data={users}
                            loading={usersLoading}
                            error={usersError}
                            page={userPage}
                            onPage={setUserPage}
                            pageSize={userPageSize}
                            onPageSize={setUserPageSize}
                            search={userSearch}
                            role={userRole}
                            status={userStatus}
                            sort={userSort}
                            onSort={toggleSort(setUserSort)}
                            onSearch={setUserSearch}
                            onRole={setUserRole}
                            onStatus={setUserStatus}
                            onEdit={openEdit}
                            onBlock={toggleBlock}
                            onDelete={handleDeleteUser}
                            onRoleChange={handleRoleChange}
                            onRetry={fetchUsers}
                            selected={selected}
                            setSelected={setSelected}
                            onBulk={runBulk}
                            meId={me?._id}
                            t={t}
                        />
                    )}

                    {activeTab === 'meetings' && (
                        <MeetingsTab
                            data={meetings}
                            loading={mtgLoading}
                            error={mtgError}
                            page={mtgPage}
                            onPage={setMtgPage}
                            pageSize={mtgPageSize}
                            onPageSize={setMtgPageSize}
                            search={mtgSearch}
                            status={mtgStatus}
                            type={mtgType}
                            sort={mtgSort}
                            onSort={toggleSort(setMtgSort)}
                            onSearch={setMtgSearch}
                            onStatus={setMtgStatus}
                            onType={setMtgType}
                            onDelete={handleDeleteMeeting}
                            onRetry={fetchMeetings}
                            t={t}
                        />
                    )}

                    {activeTab === 'iplogs' && (
                        <IpLogsTab
                            data={ipLogs}
                            loading={ipLoading}
                            error={ipError}
                            page={ipPage}
                            onPage={setIpPage}
                            pageSize={ipPageSize}
                            onPageSize={setIpPageSize}
                            ipFilter={ipFilter}
                            setIpFilter={setIpFilter}
                            methodFilter={methodFilter}
                            setMethodFilter={setMethodFilter}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                        />
                    )}

                    {activeTab === 'roles' && (
                        <RolesTab t={t} />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab t={t} />
                    )}

                    {activeTab === 'reports' && (
                        <ReportsTab stats={stats} chart={chart} t={t} />
                    )}
                </main>
            </div>

            {showModal && (
                <UserModal
                    editMode={editMode}
                    user={currentUser}
                    saving={saving}
                    onChange={setCurrentUser}
                    onSubmit={handleSaveUser}
                    onClose={() => { setShowModal(false); setCurrentUser(EMPTY_USER); }}
                    t={t}
                />
            )}

            {confirmModal}
        </div>
    );
};

export default AdminPage;
