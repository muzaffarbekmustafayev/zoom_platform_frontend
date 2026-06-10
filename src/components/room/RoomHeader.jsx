import React, { useContext } from 'react';
import {
    Clock, Users, Copy, Check, ShieldCheck, Wifi,
    ChevronDown, Presentation, LayoutGrid,
} from 'lucide-react';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const RoomHeader = ({
    isDark, meeting, roomID, copyRoomID, copied,
    meetingElapsed, myRole, totalParticipantCount, networkInfo,
    viewMode, setViewMode, viewMenuOpen, setViewMenuOpen, viewMenuRef,
    gridSize, setGridSize,
}) => {
    const { t } = useContext(ThemeLanguageContext);

    return (
        <header className={`h-12 sm:h-14 flex items-center justify-between px-3 sm:px-5 z-40 shrink-0 ${isDark ? 'bg-[#13151c] border-b border-white/[0.06]' : 'bg-white border-b border-gray-200'}`}>

            {/* Left */}
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
                {/* Live dot */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <span className="hidden xs:block text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Live</span>
                </div>

                <div className={`w-px h-4 shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                {/* Room title + ID */}
                <div className="flex flex-col min-w-0">
                    <h1 className={`text-xs sm:text-sm font-semibold tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none ${isDark ? 'text-white/90' : 'text-gray-900'}`}>
                        {meeting?.title || 'Tayyorlanmoqda...'}
                    </h1>
                    <button onClick={copyRoomID} className="flex items-center gap-1 group cursor-pointer w-fit" title={t('copy_id') || 'Copy ID'}>
                        <span className="text-[9px] font-mono text-gray-600 group-hover:text-blue-400 transition-colors truncate max-w-[80px] sm:max-w-none">
                            {roomID}
                        </span>
                        {copied
                            ? <Check size={9} className="text-emerald-500 shrink-0" />
                            : <Copy size={8} className="text-gray-600 group-hover:text-blue-400 transition-colors shrink-0" />}
                    </button>
                </div>

                {/* Timer */}
                <div className={`hidden xs:flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg ${isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-100 border border-gray-200'}`}>
                    <Clock size={10} className="text-gray-500" />
                    <span className="text-[10px] font-mono font-semibold text-gray-400 tabular-nums">{meetingElapsed}</span>
                </div>

                {/* Role badge */}
                {myRole && (
                    <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0
                        ${myRole === 'host' ? 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                        : myRole === 'cohost' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                        : isDark ? 'bg-white/5 border-white/10 text-gray-400'
                        : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                        {myRole}
                    </span>
                )}

                {/* Participant count */}
                <div className={`hidden sm:flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <Users size={10} className="text-gray-500" />
                    <span className="text-[10px] font-semibold text-gray-500">{totalParticipantCount}</span>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Network */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <ShieldCheck size={11} className="text-emerald-500" />
                        <span className="text-[10px] font-semibold text-emerald-500/80">Encrypted</span>
                    </div>
                    <div className={`flex items-center gap-1 ${networkInfo.tone}`}>
                        <Wifi size={11} />
                        <span className="text-[10px] font-semibold">{networkInfo.ping}ms</span>
                    </div>
                </div>

                {/* View mode dropdown */}
                <div className="relative" ref={viewMenuRef}>
                    <button
                        onClick={() => setViewMenuOpen(v => !v)}
                        className={`flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-3 rounded-xl transition-all ${isDark ? 'bg-white/5 border border-white/8 text-gray-300 hover:bg-white/10' : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'}`}>
                        {viewMode === 'speaker'
                            ? <Presentation size={13} className="text-blue-400" />
                            : <LayoutGrid size={13} className="text-blue-400" />}
                        <span className="hidden xs:inline text-[11px] font-bold">{viewMode === 'speaker' ? 'Speaker' : 'Gallery'}</span>
                        <ChevronDown size={12} className={`text-gray-500 transition-transform ${viewMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {viewMenuOpen && (
                        <div className={`absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-[#1e222d] border border-white/10' : 'bg-white border border-gray-200'}`}>
                            <div className="px-3 py-1 mb-1 text-[10px] font-black text-gray-500 uppercase tracking-widest">Layout</div>
                            {[
                                { id: 'speaker', icon: <Presentation size={14} />, label: 'Speaker View' },
                                { id: 'grid',    icon: <LayoutGrid size={14} />,  label: 'Gallery View' },
                            ].map(v => (
                                <button key={v.id} onClick={() => { setViewMode(v.id); setViewMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${viewMode === v.id ? 'bg-blue-600/10 text-blue-500' : isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}>
                                    {v.icon} {v.label}
                                </button>
                            ))}

                            {viewMode === 'grid' && (
                                <>
                                    <div className="mx-2 my-2 border-t border-white/5" />
                                    <div className="px-3 py-1 mb-1 text-[10px] font-black text-gray-500 uppercase tracking-widest">Grid Size</div>
                                    <div className="px-2 grid grid-cols-2 gap-1">
                                        {['auto', '1x1', '2x2', '3x3'].map(sz => (
                                            <button key={sz} onClick={() => { setGridSize(sz); setViewMenuOpen(false); }}
                                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-center border transition-all
                                                    ${gridSize === sz ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/8 hover:text-white'}`}>
                                                {sz.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <ThemeToggle compact />
                <LanguageToggle compact />
            </div>
        </header>
    );
};

export default RoomHeader;
