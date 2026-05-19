import React, { useState, useContext } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';

const RoomPasswordModal = ({ roomID, joinStartedRef, initMediaRef, onSuccess }) => {
    const { t, lang } = useContext(ThemeLanguageContext);
    const toast = useToast();
    const navigate = useNavigate();

    const [input, setInput]           = useState('');
    const [error, setError]           = useState('');
    const [loading, setLoading]       = useState(false);
    const [attempts, setAttempts]     = useState(0);
    const [showText, setShowText]     = useState(false);

    const uz = lang === 'uz', ru = lang === 'ru';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await API.get(`/api/meetings/${roomID}`, { params: { password: input } });
            sessionStorage.setItem(`room-pw-${roomID}`, input);
            setAttempts(0);
            if (!joinStartedRef.current) {
                joinStartedRef.current = true;
                initMediaRef.current?.(input);
            }
            onSuccess(data);
        } catch (err) {
            const next = attempts + 1;
            setAttempts(next);
            if (err.response?.status === 429) {
                const secs = err.response?.data?.retryAfter || 300;
                setError(uz ? `Juda ko'p urinish. ${Math.ceil(secs / 60)} daqiqadan so'ng qayta urinib ko'ring.`
                    : ru ? `Слишком много попыток. Попробуйте через ${Math.ceil(secs / 60)} мин.`
                    : `Too many attempts. Try again in ${Math.ceil(secs / 60)} minutes.`);
            } else if (err.response?.status === 403 && err.response?.data?.requiresPassword) {
                setError(uz ? 'Parol kiritilishi shart.' : ru ? 'Требуется пароль.' : 'Password required.');
            } else if (err.response?.status === 403) {
                const rem = Math.max(0, 5 - next);
                setError(
                    (uz ? "Parol noto'g'ri." : ru ? 'Неверный пароль.' : 'Incorrect password.')
                    + (rem > 0 ? ` (${rem} ${uz ? 'urinish qoldi' : ru ? 'попытки осталось' : 'attempts left'})` : '')
                );
            } else {
                toast.error(t('meeting_not_found'));
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        {uz ? 'Himoyalangan xona' : ru ? 'Защищённая комната' : 'Private Room'}
                    </h2>
                    <p className="text-purple-200 text-sm mt-1">
                        {uz ? 'Kirish uchun parol talab qilinadi' : ru ? 'Требуется пароль для входа' : 'Password required to join'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="relative">
                        <input
                            type={showText ? 'text' : 'password'}
                            placeholder={uz ? '6 xonali raqam' : ru ? '6-значный код' : '6-digit code'}
                            value={input}
                            onChange={e => { setInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                            autoFocus
                            autoComplete="current-password"
                            inputMode="numeric"
                            maxLength={6}
                            className={`w-full px-4 py-3.5 pr-12 rounded-xl border text-base font-mono tracking-widest bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all
                                ${error ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500/30 focus:border-purple-500'}`}
                        />
                        <button type="button" onClick={() => setShowText(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                            {showText
                                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            }
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    )}

                    <button type="submit" disabled={!input.trim() || loading}
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                        {loading
                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {uz ? 'Tekshirilmoqda...' : ru ? 'Проверка...' : 'Checking...'}</>
                            : uz ? 'Kirish' : ru ? 'Войти' : 'Join Room'}
                    </button>

                    <button type="button" onClick={() => navigate('/')}
                        className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        {uz ? '← Orqaga' : ru ? '← Назад' : '← Go back'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RoomPasswordModal;
