import React from 'react';
import { Icon, Ico } from './icons';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'SamMeet';

const AdminSidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebar, me, onLogout, t }) => {
    const navItems = [
        { id: 'overview', label: t('overview'),  d: Icon.dashboard },
        { id: 'users',    label: t('users'),     d: Icon.users },
        { id: 'meetings', label: t('meetings'),  d: Icon.meetings },
    ];

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebar(false)}
                />
            )}

            <aside className={[
                'fixed inset-y-0 left-0 z-40 w-60',
                'bg-white dark:bg-[#0f1117]',
                'border-r border-gray-200 dark:border-white/8',
                'flex flex-col transition-transform duration-200',
                'md:relative md:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            ].join(' ')}>

                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-white/8 shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
                        <Ico d={Icon.shield} size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{APP_NAME}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Admin Panel</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 pb-2 pt-1">
                        {t('admin_nav_section')}
                    </p>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setSidebar(false); }}
                            className={[
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                activeTab === item.id
                                    ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/6 hover:text-gray-900 dark:hover:text-white',
                            ].join(' ')}
                        >
                            <Ico d={item.d} size={17} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* User block */}
                <div className="border-t border-gray-200 dark:border-white/8 p-4 shrink-0">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {me?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{me?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{me?.role || 'admin'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 dark:border-white/8 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-colors"
                    >
                        <Ico d={Icon.logout} size={15} />
                        {t('sign_out')}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
