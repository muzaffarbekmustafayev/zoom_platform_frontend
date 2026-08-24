import React, { useContext, useEffect, useRef, useState } from 'react';
import { Languages, ChevronDown, X, Subtitles, Loader2 } from 'lucide-react';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';
import { TRANSLATE_LANGS } from '../../hooks/useGeminiTranslate';

/**
 * TranslateButton — Room uchun tarjima tugmasi + til tanlash dropdown
 *
 * Props:
 *   isTranslating, isConnecting, targetLang, setTargetLang,
 *   showSubtitles, setShowSubtitles, error,
 *   onStart, onStop
 */
const TranslateButton = ({
    isTranslating,
    isConnecting,
    targetLang,
    setTargetLang,
    showSubtitles,
    setShowSubtitles,
    error,
    onStart,
    onStop,
}) => {
    const { t, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const wrapRef = useRef(null);

    // Tashqi click — yopish
    useEffect(() => {
        if (!dropdownOpen) return;
        const onDoc = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropdownOpen(false);
        };
        const onEsc = (e) => { if (e.key === 'Escape') setDropdownOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
    }, [dropdownOpen]);

    const currentLang = TRANSLATE_LANGS.find(l => l.code === targetLang) || TRANSLATE_LANGS[0];

    const handleToggleTranslation = () => {
        if (isTranslating || isConnecting) {
            onStop();
        } else {
            onStart();
        }
    };

    const handleLangSelect = (langCode) => {
        setTargetLang(langCode);
        // Agar tarjima faol bo'lsa — qayta boshlash
        if (isTranslating) {
            onStop();
            // Kichik kutish kerak cleanup uchun, keyin yangi til bilan boshlash
            setTimeout(() => onStart(), 300);
        }
    };
    return (
        <div className="relative shrink-0" ref={wrapRef}>
            <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
                {/* Asosiy tugma */}
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    title={isTranslating ? (t('ctl_translate_stop') || 'Stop translation') : (t('ctl_translate_start') || 'Start translation')}
                    aria-label={t('ctl_translate') || 'Translate'}
                    aria-pressed={isTranslating}
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center
                        transition-colors transition-transform duration-300 active:scale-90
                        ${isTranslating
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.4)] border border-emerald-500/50'
                            : isConnecting
                                ? 'bg-amber-500/20 border border-amber-500/30 animate-pulse'
                                : error
                                    ? 'bg-red-500/15 hover:bg-red-500/25 border border-red-500/30'
                                    : isDark
                                        ? 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.05] shadow-inner backdrop-blur-md'
                                        : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                        }`}
                >
                    {isConnecting ? (
                        <Loader2 size={19} className="text-amber-400 animate-spin" />
                    ) : (
                        <Languages size={19} className={`transition-colors duration-300 ${
                            isTranslating ? 'text-white'
                            : error ? 'text-red-400'
                            : isDark ? 'text-gray-200 group-hover:text-white'
                            : 'text-gray-700 group-hover:text-gray-900'
                        }`} />
                    )}
                    {/* Pulse animatsiya — tarjima faol bo'lganda */}
                    {isTranslating && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-75" />
                    )}
                </button>
                {/* Label */}
                <span className={`text-[10px] font-medium whitespace-nowrap select-none leading-none transition-colors duration-300 ${
                    isTranslating ? 'text-emerald-400'
                    : isConnecting ? 'text-amber-400'
                    : error ? 'text-red-400'
                    : isDark ? 'text-gray-400 group-hover:text-gray-300'
                    : 'text-gray-500 group-hover:text-gray-700'
                }`}>
                    {isConnecting
                        ? (t('ctl_translate_connecting') || 'Connecting...')
                        : isTranslating
                            ? `${currentLang.flag} ${t('ctl_translate') || 'Translate'}`
                            : (t('ctl_translate') || 'Translate')
                    }
                </span>
            </div>

            {/* ── Dropdown panel ── */}
            {dropdownOpen && (
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 rounded-2xl shadow-2xl z-[60]
                    animate-in fade-in slide-in-from-bottom-2 duration-200
                    ${isDark ? 'bg-[#1e2028] border border-white/10' : 'bg-white border border-gray-200'}`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                            <Languages size={16} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {t('ctl_translate') || 'Translate'}
                            </span>
                        </div>
                        <button
                            onClick={() => setDropdownOpen(false)}
                            className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mx-3 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-[11px] font-medium text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Til tanlash */}
                    <div className="px-3 pt-3 pb-1">
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t('ctl_translate_lang') || 'Translation language'}
                        </p>
                        <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto scrollbar-thin">
                            {TRANSLATE_LANGS.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLangSelect(lang.code)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors transition-transform ${
                                        targetLang === lang.code
                                            ? isDark
                                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : isDark
                                                ? 'text-gray-300 hover:bg-white/8 border border-transparent'
                                                : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                                    }`}
                                >
                                    <span className="text-base leading-none">{lang.flag}</span>
                                    <span className="truncate">{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subtitr toggle */}
                    <div className={`mx-3 my-2 px-3 py-2.5 rounded-xl flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                            <Subtitles size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                            <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('ctl_subtitles') || 'Subtitles'}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowSubtitles(!showSubtitles)}
                            className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${
                                showSubtitles
                                    ? 'bg-emerald-500'
                                    : isDark ? 'bg-white/15' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
                                showSubtitles ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                        </button>
                    </div>

                    {/* Start/Stop tugmasi */}
                    <div className="px-3 pb-3">
                        <button
                            onClick={() => { handleToggleTranslation(); setDropdownOpen(false); }}
                            disabled={isConnecting}
                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors transition-transform active:scale-[0.98] disabled:opacity-50 ${
                                isTranslating
                                    ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
                            }`}
                        >
                            {isConnecting
                                ? (t('ctl_translate_connecting') || 'Connecting...')
                                : isTranslating
                                    ? (t('ctl_translate_stop') || 'Stop translation')
                                    : (t('ctl_translate_start') || 'Start translation')
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * TranslateButtonMobile — Mobile "More" sheet uchun qator elementi
 */
export const TranslateButtonMobile = ({
    isTranslating,
    isConnecting,
    targetLang,
    error,
    onToggle,
    onOpenDropdown,
}) => {
    const { t, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';
    const currentLang = TRANSLATE_LANGS.find(l => l.code === targetLang) || TRANSLATE_LANGS[0];

    return (
        <button
            onClick={onOpenDropdown || onToggle}
            className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${
                isTranslating
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : isDark
                        ? 'text-gray-200 hover:bg-white/8 active:bg-white/12'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isTranslating ? 'bg-emerald-500/20' : isDark ? 'bg-white/8' : 'bg-gray-100'
            }`}>
                {isConnecting ? (
                    <Loader2 size={18} className="text-amber-400 animate-spin" />
                ) : (
                    <Languages size={18} className={isTranslating ? 'text-emerald-400' : isDark ? 'text-gray-300' : 'text-gray-600'} />
                )}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    {isTranslating && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                    {isConnecting
                        ? (t('ctl_translate_connecting') || 'Connecting...')
                        : isTranslating
                            ? `${currentLang.flag} ${t('ctl_translate_stop') || 'Stop translation'}`
                            : (t('ctl_translate_start') || 'Start translation')
                    }
                </div>
                {error && (
                    <div className="text-[10px] text-red-400 font-normal mt-0.5">{error}</div>
                )}
                {!error && !isTranslating && (
                    <div className="text-[10px] text-gray-500 font-normal">
                        {currentLang.flag} {currentLang.label}
                    </div>
                )}
            </div>
        </button>
    );
};

export default TranslateButton;
