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
import UserModal     from '../admin/UserModal';

const EMPTY_USER = { name: '', email: '', password: '', role: 'user' };

const AdminPage = () => {
    const [stats, setStats]       = useState(null);
    const [users, setUsers]       = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartDays, setChartDays] = useState(30);
    const [sidebarOpen, setSidebar] = useState(false);

    const [showModal, setShowModal]   = useState(false);
    const [editMode, setEditMode]     = useState(false);
    const [currentUser, setCurrentUser] = useState(EMPTY_USER);

    const [userSearch, setUserSearch] = useState('');
    const [userRole,   setUserRole]   = useState('all');
    const [userStatus, setUserStatus] = useState('all');
    const [mtgStatus,  setMtgStatus]  = useState('all');
    const [mtgType,    setMtgType]    = useState('all');

    const navigate = useNavigate();
    const { t }    = useContext(ThemeLanguageContext);
    const { user: me, logout } = useAuth();
    const toast    = useToast();
    const { confirm, modal: confirmModal } = useConfirm();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [s, u, m] = await Promise.all([
                API.get(`/api/admin/stats?days=${chartDays}`),
                API.get('/api/admin/users'),
                API.get('/api/admin/meetings'),
            ]);
            setStats(s.data);
            setUsers(u.data || []);
            setMeetings(m.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [chartDays]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    const toggleBlock = async (id) => {
        try {
            await API.put(`/api/admin/users/${id}/block`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleDeleteUser = async (id, name) => {
        if (!await confirm(`${t('confirm_delete_meeting')} "${name}"?`)) return;
        try {
            await API.delete(`/api/admin/users/${id}`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleDeleteMeeting = async (id) => {
        if (!await confirm(t('confirm_delete_meeting'))) return;
        try {
            await API.delete(`/api/admin/meetings/${id}`);
            toast.success(t('meeting_deleted'));
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await API.put(`/api/admin/users/${currentUser._id}`, currentUser);
            } else {
                await API.post('/api/admin/users', currentUser);
            }
            setShowModal(false);
            setCurrentUser(EMPTY_USER);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const openEdit = (u) => { setCurrentUser({ ...u, password: '' }); setEditMode(true);  setShowModal(true); };
    const openAdd  = ()  => { setCurrentUser(EMPTY_USER);             setEditMode(false); setShowModal(true); };

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
                    loading={loading}
                    onRefresh={fetchData}
                    onAdd={openAdd}
                    onMenuOpen={() => setSidebar(true)}
                    t={t}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {loading && !stats ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <OverviewTab
                                    stats={stats}
                                    chart={chart}
                                    chartDays={chartDays}
                                    setChartDays={setChartDays}
                                    t={t}
                                />
                            )}
                            {activeTab === 'users' && (
                                <UsersTab
                                    users={users}
                                    search={userSearch}
                                    role={userRole}
                                    status={userStatus}
                                    onSearch={setUserSearch}
                                    onRole={setUserRole}
                                    onStatus={setUserStatus}
                                    onEdit={openEdit}
                                    onBlock={toggleBlock}
                                    onDelete={handleDeleteUser}
                                    t={t}
                                />
                            )}
                            {activeTab === 'meetings' && (
                                <MeetingsTab
                                    meetings={meetings}
                                    status={mtgStatus}
                                    type={mtgType}
                                    onStatus={setMtgStatus}
                                    onType={setMtgType}
                                    onDelete={handleDeleteMeeting}
                                    t={t}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>

            {showModal && (
                <UserModal
                    editMode={editMode}
                    user={currentUser}
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
