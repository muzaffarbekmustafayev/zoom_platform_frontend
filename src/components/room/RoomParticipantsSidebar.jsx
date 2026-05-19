import React, { useContext } from 'react';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const avatarColors = [
    'from-blue-500 to-blue-700', 'from-violet-500 to-purple-700',
    'from-emerald-500 to-teal-700', 'from-amber-500 to-orange-700',
    'from-rose-500 to-pink-700', 'from-cyan-500 to-blue-700',
    'from-indigo-500 to-violet-700', 'from-fuchsia-500 to-pink-700',
];
const getGrad = name => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return avatarColors[Math.abs(h) % avatarColors.length];
};
const getInitials = name =>
    name.split(' ').filter(w => /^[a-zA-ZЀ-ӿ]/.test(w)).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

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
        <div className="flex-1 flex flex-col min-h-0 px-4 pt-3">
            {/* Share requests */}
            {canModerate && shareRequests.length > 0 && (
                <div className="space-y-2 mb-6">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2">Share Requests</h3>
                    {shareRequests.map((req, idx) => (
                        <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-[11px] font-black text-amber-200 truncate">{req.userName}</p>
                                <p className="text-[9px] text-amber-500 font-bold uppercase">Wants to share {req.type}</p>
                            </div>
                            <div className="flex space-x-1 ml-2">
                                <button onClick={() => respondToShareRequest(req.userId, true, req.type)}
                                    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" /></svg>
                                </button>
                                <button onClick={() => respondToShareRequest(req.userId, false, req.type)}
                                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="mb-3 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder={t('find_participant')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full rounded-xl py-2.5 pl-9 pr-3 text-[11px] font-bold focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all
                        ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
                />
            </div>

            {/* Participant list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pb-4 pr-0.5 custom-scrollbar">
                {filtered.map((user, idx) => {
                    const isMe = String(user.userId) === String(userInfo._id);
                    const isSpotlit = user.userId === currentTurnUserId;
                    return (
                        <div key={idx} className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all duration-200 cursor-default
                            ${isSpotlit ? 'bg-blue-500/10 border-blue-500/25'
                            : isDark ? 'bg-white/4 border-white/5 hover:bg-white/8 hover:border-white/10'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>

                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGrad(user.userName)} flex items-center justify-center text-[11px] font-black text-white shadow-md shrink-0 select-none`}>
                                {getInitials(user.userName)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-[12px] font-semibold truncate ${isDark ? 'text-white/90' : 'text-gray-900'}`}>{user.userName}</span>
                                    {isMe && <span className="shrink-0 text-[9px] text-gray-500 font-medium">{t('you_label')}</span>}
                                    {handRaisedUsers.includes(user.userId) && <span className="shrink-0 text-[11px]">✋</span>}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {user.role === 'host'   ? <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">{t('role_host')}</span>
                                    : user.role === 'cohost' ? <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">{t('role_cohost')}</span>
                                    :                          <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wide">{t('role_participant')}</span>}
                                </div>
                            </div>

                            {/* Media + actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                {user.micStatus
                                    ? <div className="p-1 rounded-lg bg-emerald-500/10"><Mic size={11} className="text-emerald-400" /></div>
                                    : <div className="p-1 rounded-lg bg-red-500/10"><MicOff size={11} className="text-red-400" /></div>}
                                {user.videoStatus
                                    ? <div className="p-1 rounded-lg bg-emerald-500/10"><VideoIcon size={11} className="text-emerald-400" /></div>
                                    : <div className="p-1 rounded-lg bg-gray-500/10"><VideoOff size={11} className="text-gray-500" /></div>}

                                {canModerate && !isMe && (
                                    <div className="flex items-center gap-0.5 ml-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150">
                                        <button onClick={() => giveTurn(user.userId)} title={isSpotlit ? 'Remove Spotlight' : 'Spotlight'}
                                            className={`p-1.5 rounded-lg transition-all ${isSpotlit ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-gray-500 hover:text-white'}`}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" strokeWidth="2.5" strokeLinejoin="round" /></svg>
                                        </button>
                                        {isHost && (
                                            user.role === 'cohost'
                                                ? <button onClick={() => demoteCoHost(user.userId, user.socketId)} title="Demote"
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-blue-400 transition-all">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                                : user.role === 'participant' && <button onClick={() => promoteCoHost(user.userId, user.socketId)} title="Promote Co-host"
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-emerald-400 transition-all">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                        )}
                                        <button onClick={() => kickUser(user.socketId)} title="Kick"
                                            className="p-1.5 hover:bg-amber-500/10 rounded-lg text-gray-500 hover:text-amber-400 transition-all">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                        <button onClick={() => blockUser(user.userId, user.socketId)} title="Block"
                                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeWidth="2" /></svg>
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
                <div className={`pb-4 pt-3 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    <button onClick={muteAll}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 hover:bg-red-500/15 hover:text-red-400 text-xs font-bold rounded-xl transition-colors duration-200 ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        <MicOff size={13} />
                        {t('mute_everyone')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomParticipantsSidebar;
