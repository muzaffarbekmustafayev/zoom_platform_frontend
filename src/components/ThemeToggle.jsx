import React, { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const ThemeToggle = ({ compact = false }) => {
    const { theme, toggleTheme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';

    // ── Compact: bitta yumaloq tugma, ikona "almashinadi" (silliq fade+rotate) ──
    if (compact) {
        return (
            <button
                onClick={toggleTheme}
                title={isDark ? 'Light modega o\'tish' : 'Dark modega o\'tish'}
                aria-label="Toggle theme"
                className={`group relative flex items-center justify-center w-9 h-9 rounded-xl border overflow-hidden transition-all duration-200 active:scale-90
                    ${isDark
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300'}`}
            >
                {/* Aksent nur — hoverda yoritadi */}
                <span className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    ${isDark ? 'bg-blue-500/10' : 'bg-amber-400/10'}`} />
                <Sun  size={15} className={`absolute text-amber-500 transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                <Moon size={15} className={`absolute text-blue-300 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
            </button>
        );
    }

    // ── To'liq: segmented control + siljiydigan indikator ──
    return (
        <div
            className={`relative flex items-center p-1 rounded-xl border transition-colors duration-200 select-none
                ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}
            role="group"
            aria-label="Tema tanlash"
        >
            {/* Siljiydigan indikator — Light/Dark orasida sirpanadi */}
            <span
                aria-hidden="true"
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isDark ? 'bg-[#1e2430] border border-white/10' : 'bg-white border border-gray-200'}`}
                style={{ transform: isDark ? 'translateX(100%)' : 'translateX(0)' }}
            />

            <button
                onClick={() => isDark && toggleTheme()}
                title="Light mode"
                aria-pressed={!isDark}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200
                    ${!isDark ? 'text-amber-600' : 'text-gray-400 hover:text-gray-300'}`}
            >
                <Sun size={13} /> <span>Light</span>
            </button>

            <button
                onClick={() => !isDark && toggleTheme()}
                title="Dark mode"
                aria-pressed={isDark}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200
                    ${isDark ? 'text-blue-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Moon size={13} /> <span>Dark</span>
            </button>
        </div>
    );
};

export default ThemeToggle;
