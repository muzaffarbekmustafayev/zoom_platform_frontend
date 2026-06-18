import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { ChevronDown, Globe, Check } from 'lucide-react';

const LANGUAGES = [
    { code: 'uz', label: "O'zbek",  short: 'UZ' },
    { code: 'ru', label: 'Русский', short: 'RU' },
    { code: 'en', label: 'English', short: 'EN' },
];

const LanguageToggle = ({ compact = false }) => {
    const { lang, changeLanguage, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Esc bilan yopish
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const handleSelect = (code) => {
        changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={`flex items-center gap-2 rounded-xl transition-all duration-200 active:scale-[0.97]
                    ${compact ? 'h-9 px-2.5' : 'px-4 py-2'}
                    ${isDark
                        ? 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'}
                    ${isOpen ? 'ring-2 ring-blue-500/40 border-blue-500/40' : ''}`}
            >
                <Globe size={compact ? 14 : 16} className="text-blue-500 shrink-0" />
                <span className={`font-bold tracking-wide ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {compact ? currentLang.short : currentLang.label}
                </span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform duration-200 ${isDark ? 'text-gray-500' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    className={`absolute z-[100] mt-2 rounded-2xl border shadow-2xl overflow-hidden p-1.5 min-w-[150px] animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-150
                        ${compact ? 'right-0' : 'left-0'}
                        ${isDark ? 'bg-[#161b27] border-white/10' : 'bg-white border-gray-200'}`}
                >
                    {LANGUAGES.map((l) => {
                        const active = lang === l.code;
                        return (
                            <button
                                key={l.code}
                                role="option"
                                aria-selected={active}
                                onClick={() => handleSelect(l.code)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150
                                    ${active
                                        ? 'bg-blue-500/15 text-blue-500 dark:text-blue-300'
                                        : isDark
                                            ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                            >
                                <span className={`w-7 h-5 rounded-md flex items-center justify-center text-[9px] font-black tracking-wider shrink-0
                                    ${active
                                        ? 'bg-blue-500 text-white'
                                        : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                                    {l.short}
                                </span>
                                <span className="flex-1 text-left">{l.label}</span>
                                {active && <Check size={14} className="shrink-0 text-blue-500 dark:text-blue-300" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LanguageToggle;
