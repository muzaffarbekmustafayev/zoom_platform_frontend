import React from 'react';
import Select from '../components/Select';
import { Icon, Ico } from './icons';

const UserModal = ({ editMode, user, onChange, onSubmit, onClose, t }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#161B22] w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/8">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {editMode ? t('edit_user') : t('add_user')}
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/6 transition-colors"
                >
                    <Ico d={Icon.close} size={18} />
                </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
                {[
                    { label: t('full_name'),                                            key: 'name',     type: 'text',     required: true,       ph: t('name_placeholder') },
                    { label: 'Email',                                                   key: 'email',    type: 'email',    required: true,       ph: 'email@example.com' },
                    { label: editMode ? t('password_edit_hint') : t('password_label'), key: 'password', type: 'password', required: !editMode,  ph: '••••••••' },
                ].map(f => (
                    <div key={f.key}>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{f.label}</label>
                        <input
                            type={f.type}
                            required={f.required}
                            value={user[f.key]}
                            placeholder={f.ph}
                            onChange={e => onChange({ ...user, [f.key]: e.target.value })}
                            className="w-full border border-gray-200 dark:border-white/8 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-[#0d1117] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition"
                        />
                    </div>
                ))}
                <Select
                    label={t('role')}
                    value={user.role}
                    onChange={v => onChange({ ...user, role: v })}
                    options={[
                        { value: 'user',  label: 'User' },
                        { value: 'admin', label: 'Admin' },
                    ]}
                />
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 border border-gray-200 dark:border-white/8 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/6 transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                        {editMode ? t('save_btn') : t('create_btn')}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

export default UserModal;
