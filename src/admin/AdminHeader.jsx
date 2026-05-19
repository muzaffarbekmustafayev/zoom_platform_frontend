import React from 'react';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { Icon, Ico } from './icons';

const AdminHeader = ({ activeTab, loading, onRefresh, onAdd, onMenuOpen, t }) => (
    <header className="h-16 bg-white dark:bg-[#0f1117] border-b border-gray-200 dark:border-white/8 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3">
            <button
                onClick={onMenuOpen}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/6 transition-colors"
            >
                <Ico d={Icon.menu} size={20} />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
                <span className="text-gray-400 dark:text-gray-500">Admin</span>
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <span className="font-semibold text-gray-800 dark:text-white capitalize">{activeTab}</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <LanguageToggle compact={false} />
            <ThemeToggle />
            <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/6 transition-colors disabled:opacity-40"
            >
                <Ico d={Icon.refresh} size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {activeTab === 'users' && (
                <button
                    onClick={onAdd}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    <Ico d={Icon.plus} size={15} className="text-white" />
                    {t('add_user')}
                </button>
            )}
        </div>
    </header>
);

export default AdminHeader;
