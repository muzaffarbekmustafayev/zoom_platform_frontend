import React, { useContext } from 'react';
import { MicOff, MonitorUp, MonitorOff, Pin } from 'lucide-react';
import Video from '../Video';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const RoomVideoGrid = ({
    isDark, viewMode, gridClassMap, gridSize,
    effectiveStageUser, socketRef, stream,
    userInfo, myRole, isHost, isCoHost, isMuted, isVideoOff,
    activeSharingUser, stopScreenShare,
    remoteStreams, uniquePeers, roomUsers,
    activeSpeakers, handRaisedUsers, currentTurnUserId,
    pinnedSocketId, setPinnedSocketId,
    totalParticipantCount,
}) => {
    const { lang } = useContext(ThemeLanguageContext);

    if (effectiveStageUser && viewMode === 'speaker') {
        return (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500 relative gap-2">

                {/* ── Main Stage ── */}
                <div className={`w-full flex-1 md:flex-initial md:flex-1 min-h-[40vh] md:min-h-0 relative rounded-xl overflow-hidden shadow-2xl flex items-center justify-center
                    ${isDark ? 'bg-[#0b0d13] border border-white/6' : 'bg-[#1a1d26] border border-gray-500/30'}`}>

                    {effectiveStageUser.socketId === socketRef.current?.id ? (
                        <Video stream={stream} userName={userInfo.name} role={myRole}
                            isStage isLocal userVideoStatus={!isVideoOff} />
                    ) : (() => {
                        const s = remoteStreams[effectiveStageUser.socketId];
                        return s ? (
                            <Video key={`${effectiveStageUser.socketId}-${activeSharingUser ? 'sharing' : 'normal'}`}
                                stream={s} userName={effectiveStageUser.userName}
                                role={effectiveStageUser.role || (effectiveStageUser.isHost ? 'host' : 'participant')}
                                isStage isLocal={false} userVideoStatus={effectiveStageUser.videoStatus !== false} />
                        ) : (
                            <div className="flex flex-col items-center gap-3 animate-pulse">
                                <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-medium text-gray-500 tracking-wide">Syncing stream…</p>
                            </div>
                        );
                    })()}

                    {/* Screen share banner */}
                    {activeSharingUser && (
                        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                            <div className="flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-blue-400/30 shadow-lg">
                                <MonitorUp size={12} className="text-blue-200 shrink-0" />
                                <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[160px] sm:max-w-[260px]">
                                    {effectiveStageUser.userName}'s screen
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse shrink-0" />
                            </div>
                            {activeSharingUser.socketId === socketRef.current?.id && (
                                <button onClick={stopScreenShare}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg border border-red-400/30">
                                    <MonitorOff size={12} />
                                    <span className="hidden sm:inline">Stop Sharing</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Stage user label */}
                    {!activeSharingUser && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/8 z-20 pointer-events-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-semibold text-white/80 tracking-wide">{effectiveStageUser.userName}</span>
                            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">
                                {effectiveStageUser.role === 'host' ? 'Host' : effectiveStageUser.role === 'cohost' ? 'Co-Host' : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Mobile thumbnail strip ── */}
                <div className={`md:hidden flex flex-row gap-1.5 overflow-x-auto w-full px-1 py-1.5 shrink-0 snap-x custom-scrollbar backdrop-blur-sm rounded-xl mt-auto
                    ${isDark ? 'bg-black/30 border border-white/[0.06]' : 'bg-gray-800/30 border border-gray-500/30'}`}>
                    {effectiveStageUser.socketId !== socketRef.current?.id && (
                        <div className={`w-[88px] xs:w-[100px] sm:w-[110px] aspect-video shrink-0 snap-center bg-[#0e1016] rounded-lg overflow-hidden shadow-lg
                            ${activeSpeakers.has('__local__') ? 'ring-2 ring-emerald-400/70' : 'ring-1 ring-white/10'}`}>
                            <Video stream={stream} userName="You" role={myRole} isLocal isSpeaking={activeSpeakers.has('__local__')} userVideoStatus={!isVideoOff} />
                        </div>
                    )}
                    {uniquePeers.filter(p => p.peerID !== effectiveStageUser.socketId).map((peerObj, idx) => {
                        const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                        const spk = activeSpeakers.has(peerObj.peerID);
                        return (
                            <div key={idx} className={`relative w-[88px] xs:w-[100px] sm:w-[110px] aspect-video shrink-0 snap-center bg-[#0e1016] rounded-lg overflow-hidden shadow-lg
                                ${spk ? 'ring-2 ring-emerald-400/70' : 'ring-1 ring-white/10'}`}>
                                <Video stream={remoteStreams[peerObj.peerID]} userName={user?.userName || 'Participant'}
                                    role={user?.role} isSpeaking={spk} isLocal={false} userVideoStatus={user?.videoStatus !== false} />
                                {handRaisedUsers.includes(peerObj.userId) && <div className="absolute top-0.5 right-0.5 text-[9px] leading-none">✋</div>}
                            </div>
                        );
                    })}
                </div>

                {/* ── Desktop thumbnail strip ── */}
                <div className="hidden md:flex flex-col w-[188px] lg:w-[210px] xl:w-[230px] shrink-0 gap-2 overflow-y-auto scroll-smooth pr-0.5">
                    {effectiveStageUser.socketId !== socketRef.current?.id && (
                        <div className={`relative shrink-0 aspect-video bg-[#0e1016] rounded-xl overflow-hidden shadow-md transition-all duration-200 cursor-pointer group
                            ${activeSpeakers.has('__local__') ? 'border-2 border-emerald-400/70' : isDark ? 'border border-white/8 hover:border-blue-500/40' : 'border border-gray-500/40 hover:border-blue-500/60'}`}>
                            <Video stream={stream} userName="You" role={myRole} isLocal isSpeaking={activeSpeakers.has('__local__')} userVideoStatus={!isVideoOff} />
                            {handRaisedUsers.includes(userInfo._id) && (
                                <div className="absolute top-1.5 right-1.5 bg-amber-500/80 backdrop-blur-sm rounded-md p-0.5 animate-in zoom-in text-[10px]">✋</div>
                            )}
                        </div>
                    )}
                    {uniquePeers.filter(p => p.peerID !== effectiveStageUser.socketId).map((peerObj, idx) => {
                        const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                        const spk = activeSpeakers.has(peerObj.peerID);
                        return (
                            <div key={idx} onClick={() => setPinnedSocketId(pinnedSocketId === peerObj.peerID ? null : peerObj.peerID)}
                                className={`relative shrink-0 aspect-video bg-[#0e1016] rounded-xl overflow-hidden shadow-md transition-all duration-200 cursor-pointer group
                                    ${spk ? 'border-2 border-emerald-400/70' : isDark ? 'border border-white/8 hover:border-blue-500/40' : 'border border-gray-500/40 hover:border-blue-500/60'}`}>
                                <Video stream={remoteStreams[peerObj.peerID]} userName={user?.userName || 'Participant'}
                                    role={user?.role} hasTurn={peerObj.userId === currentTurnUserId}
                                    isSpeaking={spk} isLocal={false} userVideoStatus={user?.videoStatus !== false} />
                                {handRaisedUsers.includes(peerObj.userId) && (
                                    <div className="absolute top-1.5 right-1.5 bg-amber-500/80 backdrop-blur-sm rounded-md p-0.5 animate-in zoom-in text-[10px]">✋</div>
                                )}
                                {pinnedSocketId === peerObj.peerID && (
                                    <div className="absolute top-1.5 left-1.5 bg-blue-600/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                                        <Pin size={9} className="text-white" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Grid / Gallery view ──
    return (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
            {totalParticipantCount === 1 && (
                <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none z-20">
                    <div className={`flex items-center gap-2.5 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl ${isDark ? 'bg-black/55 border border-white/10' : 'bg-gray-900/80 border border-gray-600/40'}`}>
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                        </span>
                        <p className="text-sm font-medium text-gray-300">
                            {lang === 'uz' ? "Boshqalar qo'shilishi kutilmoqda..." : lang === 'ru' ? 'Ожидание участников...' : 'Waiting for others to join…'}
                        </p>
                    </div>
                </div>
            )}

            <div className={`flex-1 min-h-0 grid gap-1 xs:gap-1.5 sm:gap-2 md:gap-2.5 auto-rows-fr p-1 xs:p-1.5 sm:p-3 md:p-5
                ${gridClassMap[gridSize] || gridClassMap.auto}
                animate-in fade-in zoom-in-95 duration-400`}>

                {/* Local tile */}
                <div className={`relative min-h-[140px] xs:min-h-[160px] sm:min-h-0 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 group bg-[#0d1018]
                    ${activeSpeakers.has('__local__') ? 'ring-2 ring-emerald-400/70 shadow-[0_0_16px_rgba(52,211,153,0.2)]'
                    : isHost ? 'ring-2 ring-blue-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    : isCoHost ? 'ring-2 ring-emerald-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    : isDark ? 'ring-1 ring-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:ring-blue-500/30'
                    : 'ring-1 ring-gray-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:ring-blue-500/40'}`}>
                    <Video stream={stream} userName={`${userInfo.name} (You)`} role={myRole}
                        isLocal isSpeaking={activeSpeakers.has('__local__')} userVideoStatus={!isVideoOff} />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                        {isHost && <span className="flex items-center gap-1 bg-blue-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-blue-400/25 shadow">Host</span>}
                        {isCoHost && <span className="flex items-center gap-1 bg-emerald-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-emerald-400/25 shadow">Co-Host</span>}
                    </div>
                    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-20">
                        {isMuted && (
                            <div className="flex items-center gap-1 bg-red-600/80 backdrop-blur-sm px-1.5 py-1 rounded-lg border border-red-400/25 shadow-lg">
                                <MicOff size={10} className="text-white" />
                            </div>
                        )}
                        {handRaisedUsers.includes(userInfo._id) && (
                            <div className="bg-amber-500/85 backdrop-blur-sm rounded-lg px-2 py-1 border border-amber-400/30 shadow-lg animate-in zoom-in">
                                <span className="text-sm leading-none">✋</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Remote tiles */}
                {uniquePeers.map((peerObj, idx) => {
                    const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                    const isUserHost = user?.role === 'host';
                    const isUserCoHost = user?.role === 'cohost';
                    const hasTurn = peerObj.userId === currentTurnUserId;
                    const spk = activeSpeakers.has(peerObj.peerID);
                    return (
                        <div key={peerObj.peerID || idx}
                            className={`relative min-h-[140px] xs:min-h-[160px] sm:min-h-0 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 group animate-in fade-in zoom-in-95 duration-400 bg-[#0d1018]
                                ${spk ? 'ring-2 ring-emerald-400/70 shadow-[0_0_16px_rgba(52,211,153,0.2)]'
                                : isUserHost ? 'ring-2 ring-blue-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                                : isUserCoHost ? 'ring-2 ring-emerald-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                                : hasTurn ? 'ring-2 ring-amber-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                                : isDark ? 'ring-1 ring-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:ring-blue-500/30'
                                : 'ring-1 ring-gray-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:ring-blue-500/40'}`}>
                            <Video stream={remoteStreams[peerObj.peerID]} userName={user?.userName || 'Participant'}
                                role={user?.role} hasTurn={hasTurn} isSpeaking={spk}
                                isLocal={false} userVideoStatus={user?.videoStatus !== false} />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                                {isUserHost && <span className="bg-blue-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-blue-400/25 shadow">Host</span>}
                                {isUserCoHost && <span className="bg-emerald-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-emerald-400/25 shadow">Co-Host</span>}
                                {hasTurn && <span className="bg-amber-500/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-amber-100 border border-amber-400/30 shadow">Speaking</span>}
                            </div>
                            <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-20">
                                {user?.micStatus === false && (
                                    <div className="flex items-center gap-1 bg-red-600/80 backdrop-blur-sm px-1.5 py-1 rounded-lg border border-red-400/25 shadow-lg">
                                        <MicOff size={10} className="text-white" />
                                    </div>
                                )}
                                {handRaisedUsers.includes(peerObj.userId) && (
                                    <div className="bg-amber-500/85 backdrop-blur-sm rounded-lg px-2 py-1 border border-amber-400/30 shadow-lg animate-in zoom-in">
                                        <span className="text-sm leading-none">✋</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RoomVideoGrid;
