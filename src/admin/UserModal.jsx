import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck, X, UserPlus, Save } from 'lucide-react';

const ROLE_CONFIG = {
    user:  { label: 'User',  color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',   ring: 'ring-blue-500/30' },
    admin: { label: 'Admin', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30', ring: 'ring-purple-500/30' },
};

const Field = ({ icon: Icon, label, hint, children }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <Icon size={12} className="opacity-70" />
                {label}
            </label>
            {hint && <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">{hint}</span>}
        </div>
        {children}
    </div>
);

const UserModal = ({ editMode, user, saving, onChange, onSubmit, onClose, t }) => {
    const [showPw, setShowPw] = useState(false);

    const initials = user.name
        ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-md bg-white dark:bg-[#161B22] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/8 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-6 pt-6 pb-5">
                    {/* Gradient accent */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            {/* Avatar preview */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-blue-500/20 shrink-0">
                                {initials}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {editMode ? t('edit_user') : t('add_user')}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {editMode
                                        ? `${user.name || '—'} · ${user.email || '—'}`
                                        : "Yangi foydalanuvchi ma'lumotlarini kiriting"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-white/6 mx-6" />

                {/* Form */}
                <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">

                    {/* Name */}
                    <Field icon={User} label={t('full_name')}>
                        <input
                            type="text"
                            required
                            value={user.name}
                            placeholder={t('name_placeholder')}
                            onChange={e => onChange({ ...user, name: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all"
                        />
                    </Field>

                    {/* Email */}
                    <Field icon={Mail} label="Email">
                        <input
                            type="email"
                            required
                            value={user.email}
                            placeholder="email@example.com"
                            onChange={e => onChange({ ...user, email: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all"
                        />
                    </Field>

                    {/* Password */}
                    <Field
                        icon={Lock}
                        label={t('password_label')}
                        hint={editMode ? t('password_edit_hint') : null}
                    >
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                required={!editMode}
                                value={user.password}
                                placeholder={editMode ? '••••••••' : t('password_label')}
                                onChange={e => onChange({ ...user, password: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-white/8 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </Field>

                    {/* Role selector */}
                    <Field icon={ShieldCheck} label={t('role')}>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(ROLE_CONFIG).map(([val, cfg]) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => onChange({ ...user, role: val })}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                        user.role === val
                                            ? `${cfg.color} ring-2 ${cfg.ring}`
                                            : 'bg-gray-50 dark:bg-white/4 border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/8'
                                    }`}
                                >
                                    {user.role === val && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    )}
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </Field>

                    {/* Registration info — edit mode only */}
                    {editMode && (user.registrationIp || user.registrationAt || user.createdAt) && (
                        <div className="rounded-xl border border-orange-200/60 dark:border-orange-500/20 bg-orange-50/60 dark:bg-orange-500/5 p-4 space-y-3">
                            <p className="text-[10px] font-bold text-orange-600/80 dark:text-orange-400/70 uppercase tracking-widest flex items-center gap-1.5">
                                <span>🌐</span> Ro'yxatdan o'tish ma'lumotlari
                            </p>

                            {/* Exact datetime */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-0.5">Aniq vaqt</p>
                                    <p className="text-[11px] font-mono font-semibold text-gray-800 dark:text-gray-200">
                                        {user.registrationAt
                                            ? new Date(user.registrationAt).toLocaleString('uz-UZ', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                                              })
                                            : new Date(user.createdAt).toLocaleString('uz-UZ', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                                              })
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-0.5">Usul</p>
                                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        {user.registrationMethod === 'google'
                                            ? <><span>🔵</span> Google</>
                                            : <><span>📧</span> Email</>}
                                    </p>
                                </div>
                            </div>

                            {/* IP address */}
                            {user.registrationIp && (
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-0.5">IP manzil</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[12px] font-mono font-bold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 rounded">
                                            {user.registrationIp}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => navigator.clipboard.writeText(user.registrationIp)}
                                            className="text-gray-400 hover:text-orange-500 transition-colors"
                                            title="Nusxa olish"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Device */}
                            {user.registrationDevice && (
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-0.5">Qurilma</p>
                                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 capitalize flex items-center gap-1">
                                        {user.registrationDevice === 'mobile'  && <><span>📱</span> Mobil</>}
                                        {user.registrationDevice === 'tablet'  && <><span>📟</span> Planshet</>}
                                        {user.registrationDevice === 'desktop' && <><span>🖥️</span> Kompyuter</>}
                                        {user.registrationDevice === 'bot'     && <><span>🤖</span> Bot</>}
                                        {user.registrationDevice === 'unknown' && <><span>❓</span> Noma'lum</>}
                                    </p>
                                </div>
                            )}

                            {/* User Agent */}
                            {user.registrationUserAgent && (
                                <div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mb-0.5">Brauzer / User-Agent</p>
                                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-500 break-all leading-relaxed line-clamp-3" title={user.registrationUserAgent}>
                                        {user.registrationUserAgent}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Footer */}
                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/8 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/6 transition-colors disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving
                                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                : editMode
                                    ? <><Save size={14} /> {t('save_btn')}</>
                                    : <><UserPlus size={14} /> {t('create_btn')}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
