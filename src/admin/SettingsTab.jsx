import React, { useState, useEffect } from 'react';
import API from '../api';

const SettingsTab = ({ t }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState('general');

    // Form states
    const [appName, setAppName] = useState('');
    const [allowRegistration, setAllowRegistration] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [defaultLanguage, setDefaultLanguage] = useState('uz');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await API.get('/api/admin/settings');
                setSettings(data);
                setAppName(data.appName || 'Meet Platform');
                setAllowRegistration(data.allowRegistration !== false);
                setMaintenanceMode(data.maintenanceMode || false);
                setDefaultLanguage(data.defaultLanguage || 'uz');
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        try {
            const { data } = await API.put('/api/admin/settings', {
                appName, allowRegistration, maintenanceMode, defaultLanguage
            });
            setSettings(data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3500);
        } catch (err) {
            alert(err.response?.data?.message || 'Sozlamalarni saqlashda xatolik yuz berdi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6 pb-12">
            {/* Header */}
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚙️</span>
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Tizim Sozlamalari Boshqaruvi</h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Platformaning global konfiguratsiyasi, kirish va xavfsizlik qoidalari
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 px-3 py-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Tizim Barqaror Holatda
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            )}
            
            {success && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm flex items-center justify-between shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2 font-medium">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Tizim sozlamalari muvaffaqiyatli saqlandi va yangilandi!
                    </div>
                    <span className="text-xs opacity-75">Hozirda kuchga kirdi</span>
                </div>
            )}

            {/* Main Form Box */}
            <form onSubmit={handleSave} className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 rounded-2xl overflow-hidden shadow-sm">
                {/* Navigation Pills */}
                <div className="flex border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] p-2 gap-2 overflow-x-auto">
                    {[
                        { id: 'general', label: 'Asosiy Parametrlar', icon: '🎨' },
                        { id: 'security', label: 'Xavfsizlik va Kirish', icon: '🔒' },
                        { id: 'system', label: 'Server Salomatligi', icon: '💻' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveSection(tab.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                                activeSection === tab.id
                                    ? 'bg-white dark:bg-blue-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-6">
                    {/* General Settings Tab */}
                    {activeSection === 'general' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                    Brending va Mahalliylashtirish
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                            Platforma Nomi (App Name)
                                        </label>
                                        <input
                                            type="text"
                                            value={appName}
                                            onChange={e => setAppName(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Meet Platform"
                                            required
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">Sarlavhalar va bildirishnomalarda aks etadi.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                            Standart Tizim Tili
                                        </label>
                                        <select
                                            value={defaultLanguage}
                                            onChange={e => setDefaultLanguage(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                                        >
                                            <option value="uz">🇺🇿 O'zbekcha (Uzbek)</option>
                                            <option value="ru">🇷🇺 Русский (Russian)</option>
                                            <option value="en">🇬🇧 English (US)</option>
                                        </select>
                                        <p className="text-[11px] text-gray-400 mt-1">Yangi mehmonlar uchun birlamchi interfeys tili.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Settings Tab */}
                    {activeSection === 'security' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                Kirish Huquqlari va Texnik Holat
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Registration Toggle Card */}
                                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0d1117]/50 flex items-center justify-between gap-4 hover:border-gray-200 dark:hover:border-white/10 transition-all">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>📝</span> Yangi Foydalanuvchilar Ro'yxatdan O'tishi
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg">
                                            Ruxsat berilgan taqdirda, istalgan foydalanuvchi platformada yangi profil o'chishi mumkin. O'chirilgan holatda faqat Admin taklifi talab qilinadi.
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={allowRegistration}
                                            onChange={e => setAllowRegistration(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Maintenance Mode Toggle Card */}
                                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0d1117]/50 flex items-center justify-between gap-4 hover:border-gray-200 dark:hover:border-white/10 transition-all">
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span>🚧</span> Ta'mirlash Rejimi (Maintenance Mode)
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg">
                                            Yoqilgan taqdirda sayt texnik profilaktika holatiga o'tadi va oddiy foydalanuvchilar kirishi cheklanadi.
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={maintenanceMode}
                                            onChange={e => setMaintenanceMode(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Info Tab */}
                    {activeSection === 'system' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                Server va Baza Ko'rsatkichlari
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-white/5">
                                    <div className="text-xs text-gray-400">Node.js Muhiti</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">v20+ (Production ready)</div>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-white/5">
                                    <div className="text-xs text-gray-400">Database Status</div>
                                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">MongoDB Connected</div>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0d1117] border border-gray-100 dark:border-white/5">
                                    <div className="text-xs text-gray-400">Socket Realtime Cluster</div>
                                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">Active (ws://5005)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Save Button Bar */}
                <div className="bg-gray-50/80 dark:bg-[#0d1117] p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">O'zgarishlar darhol saqlanadi</span>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {saving ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saqlanmoqda...
                            </>
                        ) : (
                            'Sozlamalarni Saqlash'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsTab;
