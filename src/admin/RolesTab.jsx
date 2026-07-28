import React, { useState, useEffect } from 'react';
import API from '../api';

const roleGradients = {
    admin: 'from-rose-500 to-red-600',
    user: 'from-emerald-500 to-teal-600',
    moderator: 'from-amber-500 to-orange-600',
    default: 'from-blue-600 to-indigo-600'
};

const roleIcons = {
    admin: '⚡',
    user: '👤',
    moderator: '🛡️',
    default: '✨'
};

const RolesTab = ({ t }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const availablePermissions = [
        { id: 'manage_users', label: 'Foydalanuvchilarni Boshqarish', desc: 'Foydalanuvchilar ro\'yxatini ko\'rish, bloklash, rolni o\'zgartirish' },
        { id: 'manage_meetings', label: 'Uchrashuvlarni Boshqarish', desc: 'Faol va yakunlangan uchrashuvlarni monitoring qilish va o\'chirish' },
        { id: 'manage_settings', label: 'Tizim Sozlamalari', desc: 'Platforma sozlamalarini va texnik rejimni o\'zgartirish' },
        { id: 'view_reports', label: 'Hisobotlarni Ko\'rish', desc: 'Tizim statistikasi, tahlillar va hisobotlarni ko\'rish va yuklash' }
    ];

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/api/admin/roles');
            setRoles(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing && currentRole) {
                await API.put(`/api/admin/roles/${currentRole._id}`, { displayName, description, permissions });
            } else {
                await API.post('/api/admin/roles', { name, displayName, description, permissions });
            }
            fetchRoles();
            setIsEditing(false);
            setCurrentRole(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving role');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Haqiqatdan ham ushbu rolni o\'chirmoqchimisiz? Ushbu roldagi foydalanuvchilar "user" roliga o\'tkaziladi.')) return;
        try {
            await API.delete(`/api/admin/roles/${id}`);
            fetchRoles();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting role');
        }
    };

    const openEdit = (role) => {
        setCurrentRole(role);
        setName(role.name);
        setDisplayName(role.displayName || '');
        setDescription(role.description || '');
        setPermissions(role.permissions || []);
        setIsEditing(true);
    };

    const openCreate = () => {
        setCurrentRole(null);
        setName('');
        setDisplayName('');
        setDescription('');
        setPermissions([]);
        setIsEditing(true);
    };

    const togglePermission = (permId) => {
        setPermissions(prev => 
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    const filteredRoles = roles.filter(r => 
        (r.displayName || r.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !roles.length) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔑</span>
                        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Rollar va Ruxsatnomalar (RBAC)</h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Foydalanuvchi darajalari va bo'limlarga kirish huquqlarini moslashuvchan shakllantirish.
                    </p>
                </div>
                {!isEditing && (
                    <button
                        onClick={openCreate}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 text-xs transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span className="text-base">+</span> Yangi Rol Yaratish
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            )}

            {isEditing ? (
                /* Edit/Create Form Drawer */
                <div className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5 mb-6">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg">
                                {currentRole ? '✏️' : '✨'}
                            </span>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {currentRole ? 'Rol Ruxsatlarini Tahrirlash' : 'Yangi Rol Yaratish'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Kerakli ruxsatnomalar va parametrlarni belgilang</p>
                            </div>
                        </div>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 text-xl">
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rol Identifikatori (System ID)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={!!currentRole}
                                    className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                                    placeholder="masalan: moderator"
                                    required
                                />
                                <p className="text-[11px] text-gray-400 mt-1">Nomi unikal va bo'sh joylarsiz bo'lishi kerak.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rol Nomi (Ko'rinishi)</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="masalan: Tizim Moderatori"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Qisqacha Ta'rif</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Ushbu rol foydalanuvchilariga berilgan imkoniyatlar sharhi..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Tizim Ruxsatnomalari (Permissions)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {availablePermissions.map(perm => {
                                    const checked = permissions.includes(perm.id);
                                    return (
                                        <div
                                            key={perm.id}
                                            onClick={() => togglePermission(perm.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                checked 
                                                    ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500/40 shadow-sm' 
                                                    : 'bg-gray-50/50 dark:bg-[#0d1117]/50 border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {}}
                                                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <div>
                                                <div className="text-xs font-bold text-gray-900 dark:text-white">{perm.label}</div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{perm.desc}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100 dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Saqlash va Qo'llash
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* Roles Grid View */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Rollar bo'yicha qidirish..."
                            className="max-w-xs bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/8 rounded-xl px-4 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                        />
                        <span className="text-xs text-gray-400">Jami {roles.length} ta rol</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoles.map(role => {
                            const grad = roleGradients[role.name] || roleGradients.default;
                            const icon = roleIcons[role.name] || roleIcons.default;
                            const isBuiltin = role.name === 'admin' || role.name === 'user';

                            return (
                                <div
                                    key={role._id}
                                    className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/8 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-gray-300 dark:hover:border-white/20"
                                >
                                    <div>
                                        {/* Card Header Banner */}
                                        <div className={`bg-gradient-to-r ${grad} p-4 text-white flex items-center justify-between`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{icon}</span>
                                                <h3 className="font-bold text-sm tracking-wide">{role.displayName || role.name}</h3>
                                            </div>
                                            <span className="px-2.5 py-0.5 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-mono tracking-wider">
                                                {role.name}
                                            </span>
                                        </div>

                                        <div className="p-5 space-y-4">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 min-h-[36px]">
                                                {role.description || 'Ushbu rol uchun qo\'shimcha tavsif kiritilmagan.'}
                                            </p>

                                            <div className="space-y-2">
                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Berilgan Ruxsatlar ({role.permissions?.length || 0})
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {role.permissions?.map(p => (
                                                        <span
                                                            key={p}
                                                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-lg border border-blue-100 dark:border-blue-800/30"
                                                        >
                                                            ✓ {p}
                                                        </span>
                                                    ))}
                                                    {(!role.permissions || role.permissions.length === 0) && (
                                                        <span className="text-xs text-gray-400 italic">Cheklovlar yo'q / Oddiy ruxsat</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-gray-400 text-[11px]">
                                            {isBuiltin ? '🔒 Tizim Tizimiy Roli' : '⚙️ Moslashuvchan Rol'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEdit(role)}
                                                className="px-3 py-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            >
                                                Tahrirlash
                                            </button>
                                            {!isBuiltin && (
                                                <button
                                                    onClick={() => handleDelete(role._id)}
                                                    className="px-3 py-1.5 font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    O'chirish
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesTab;
