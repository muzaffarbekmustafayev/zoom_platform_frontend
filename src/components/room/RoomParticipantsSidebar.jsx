import React, { useContext } from 'react';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, Crown, Shield, User, Hand, VolumeX, Mic2 } from 'lucide-react';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const avatarColors = [
    'from-blue-600 to-indigo-800', 'from-violet-600 to-purple-800',
    'from-emerald-600 to-teal-800', 'from-amber-500 to-orange-700',
    'from-rose-600 to-pink-800', 'from-cyan-600 to-blue-800',
    'from-indigo-600 to-violet-800', 'from-fuchsia-600 to-pink-800',
];

const getGrad = name => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return avatarColors[Math.abs(h) % avatarColors.length];
};

const getInitials = name =>
    name.split(' ').filter(w => /^[a-zA-Z\u0400-\u04FF\u0100-\u024F]/.test(w)).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

const RoomParticipantsSidebar = ({
    isDark, roomUsers, handRaisedUsers, currentTurnUserId,
    userInfo, canModerate, isHost, shareRequests, respondToShareRequest,
    searchQuery, setSearchQuery, giveTurn, kickUser, blockUser,
    promoteCoHost, demoteCoHost, muteAll, onClose, t,
}) => {
    const { lang } = useContext(ThemeLanguageContext);
    const filtered = [...roomUsers]
        .sort((a, b) => Number(handRaisedUsers.includes(b.userId)) - Number(handRaisedUsers.includes(a.userId)))
        .filter(u => u.userName.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex-1 flex flex-col min-h-0 px-4 pt-4 pb-2">
            {/* Share requests */}
            {canModerate && shareRequests.length > 0 && (
                <div className="space-y-3 mb-6">
                    <h3 className="text-[10px] font-black text-amber-500/90 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {lang === 'uz' ? "Ulashish so'rovlari" : lang === 'ru' ? 'Запросы показа' : 'Share Requests'}
                    </h3>
                    {shareRequests.map((req, idx) => (
                        <div key={idx} className="p-3.5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 backdrop-blur-md border border-amber-500/30 rounded-2xl flex items-center justify-between shadow-[0_4px_24px_rgba(245,158,11,0.15)] animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="min-w-0 flex-1 pr-3">
                                <p className="text-[12px] font-bold text-amber-600 dark:text-amber-300 truncate">{req.userName}</p>
                                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-0.5">
                                    {lang === 'uz' ? `${req.type} ulashmoqchi` : lang === 'ru' ? `Хочет показать ${req.type}` : `Wants to share ${req.type}`}
                                </p>
                            </div>
                            <div className="flex space-x-2 shrink-0">
                                <button onClick={() => respondToShareRequest(req.userId, true, req.type)}
                                    className="w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <button onClick={() => respondToShareRequest(req.userId, false, req.type)}
                                    className="w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-rose-500 to-rose-400 text-white rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-105 active:scale-95 transition-all duration-200">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="mb-4 relative group">
                <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors duration-300 ${isDark ? 'text-white/40 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder={t('find_participant')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full rounded-2xl py-3 pl-10 pr-4 text-[12px] font-medium focus:outline-none transition-all duration-300
                        ${isDark 
                            ? 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                            : 'bg-gray-100/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500/40 focus:shadow-[0_4px_20px_rgba(59,130,246,0.1)]'}`}
                />
            </div>

            {/* Participant list */}
            <div className="flex-1 overflow-y-auto space-y-2 pb-4 pr-1 custom-scrollbar">
                {filtered.map((user, idx) => {
                    const isMe = String(user.userId) === String(userInfo._id);
                    const isSpotlit = user.userId === currentTurnUserId;
                    const isRaised = handRaisedUsers.includes(user.userId);
                    
                    return (
                        <div key={idx} className={`group flex items-center gap-3.5 px-3 py-3 rounded-2xl border transition-all duration-300 cursor-default
                            ${isSpotlit 
                                ? (isDark ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-blue-50 border-blue-200 shadow-[0_4px_20px_rgba(59,130,246,0.08)]')
                            : isDark 
                                ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                                : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm'}`}>

                            {/* Avatar + presence/mic indikator */}
                            <div className="relative shrink-0">
                                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getGrad(user.userName)} flex items-center justify-center text-[13px] font-black text-white shadow-lg select-none ring-2 ring-offset-1 transition-all duration-300 ${isSpotlit ? 'ring-blue-400 ring-offset-transparent' : 'ring-transparent ring-offset-transparent group-hover:scale-105'}`}>
                                    {getInitials(user.userName)}
                                </div>
                                {user.micStatus && (
                                    <span className={`absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 border-[2px] ${isDark ? 'border-[#12141d]' : 'border-white'} shadow-sm`}>
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2 min-w-0 mb-1">
                                    <span className={`text-[13px] font-bold truncate ${isDark ? 'text-white/95' : 'text-gray-900'}`}>{user.userName}</span>
                                    {isMe && <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'bg-white/10 text-white/70' : 'bg-gray-200 text-gray-600'}`}>{t('you_label')}</span>}
                                    {isRaised && (
                                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 animate-bounce">
                                            <Hand size={11} className="fill-current" />
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {user.role === 'host'   ? (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                            <Crown size={9} /> {t('role_host')}
                                        </span>
                                    ) : user.role === 'cohost' ? (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            <Shield size={9} /> {t('role_cohost')}
                                        </span>
                                    ) : (
                                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium uppercase tracking-wider border ${isDark ? 'bg-white/5 text-gray-400 border-white/10' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            <User size={9} /> {t('role_participant')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Media + actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                                    {user.micStatus
                                        ? <div className="p-1.5 rounded-lg bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"><Mic2 size={12} className="text-emerald-500 dark:text-emerald-400" /></div>
                                        : <div className="p-1.5 rounded-lg bg-red-500/10"><MicOff size={12} className="text-red-500/70 dark:text-red-400/70" /></div>}
                                    {user.videoStatus
                                        ? <div className="p-1.5 rounded-lg bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]"><VideoIcon size={12} className="text-blue-500 dark:text-blue-400" /></div>
                                        : <div className="p-1.5 rounded-lg bg-gray-500/10"><VideoOff size={12} className="text-gray-500/70 dark:text-gray-400/70" /></div>}
                                </div>

                                {canModerate && !isMe && (
                                    <div className="flex items-center gap-1 ml-1 overflow-hidden max-w-0 opacity-0 group-hover:max-w-[150px] group-hover:opacity-100 transition-all duration-300 ease-out">
                                        <button onClick={() => giveTurn(user.userId)} title={isSpotlit ? 'Remove Spotlight' : 'Spotlight'}
                                            className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-110 ${isSpotlit ? 'bg-blue-500/20 text-blue-500' : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-500/10'}`}>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" strokeWidth="2.5" strokeLinejoin="round" /></svg>
                                        </button>
                                        {isHost && (
                                            user.role === 'cohost'
                                                ? <button onClick={() => demoteCoHost(user.userId, user.socketId)} title="Demote"
                                                    className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 hover:scale-110 transition-all duration-200">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                                : user.role === 'participant' && <button onClick={() => promoteCoHost(user.userId, user.socketId)} title="Promote Co-host"
                                                    className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 hover:scale-110 transition-all duration-200">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                        )}
                                        <button onClick={() => kickUser(user.socketId)} title="Kick"
                                            className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 hover:scale-110 transition-all duration-200">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                        <button onClick={() => blockUser(user.userId, user.socketId)} title="Block"
                                            className="p-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 hover:scale-110 transition-all duration-200">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeWidth="2" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mute all */}
            {canModerate && (
                <div className={`pb-2 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200/60'}`}>
                    <button onClick={muteAll}
                        className={`group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 overflow-hidden rounded-2xl font-bold text-[13px] transition-all duration-300
                            ${isDark 
                                ? 'bg-white/5 hover:bg-rose-500/15 text-white/80 hover:text-rose-400 border border-white/10 hover:border-rose-500/30' 
                                : 'bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200 hover:border-rose-200'}`}>
                        <VolumeX size={15} className="transition-transform group-hover:scale-110 group-active:scale-95" />
                        <span className="relative z-10">{t('mute_everyone')}</span>
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomParticipantsSidebar;

