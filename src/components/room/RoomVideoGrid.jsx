import React, { useContext } from 'react';
import { MicOff, MonitorUp, MonitorOff, Pin } from 'lucide-react';
import Video from '../Video';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const RoomVideoGrid = ({
    isDark, viewMode, gridClassMap, gridSize,
    effectiveStageUser, socketRef, stream,
    userInfo, myRole, isHost, isCoHost, isMuted, isVideoOff,
    activeSharingUser, screenShareStream, stopScreenShare,
    remoteStreams, uniquePeers, roomUsers,
    activeSpeakers, handRaisedUsers, currentTurnUserId,
    pinnedSocketId, setPinnedSocketId,
    totalParticipantCount,
}) => {
    const { lang } = useContext(ThemeLanguageContext);

    const showScreen = !!activeSharingUser && !pinnedSocketId;

    const isSidebar = viewMode === 'sidebar';

    if (effectiveStageUser && (viewMode === 'speaker' || viewMode === 'sidebar')) {
        return (
            <div className={`flex-1 flex ${isSidebar ? 'flex-col sm:flex-row' : 'flex-col'} overflow-hidden relative min-h-0`}>

                {/* ── Main Stage ── */}
                <div className={`flex-1 relative rounded-xl overflow-hidden shadow-2xl flex items-center justify-center min-h-0
                    ${isDark ? 'bg-[#0b0d13] border border-white/6' : 'bg-[#1a1d26] border border-gray-500/30'}`}>

                    {(() => {
                        if (showScreen) {
                            return screenShareStream ? (
                                <Video key={`screen-${activeSharingUser.socketId}`}
                                    stream={screenShareStream} userName={activeSharingUser.userName}
                                    role={activeSharingUser.role}
                                    isStage isScreen isLocal={activeSharingUser.socketId === socketRef.current?.id}
                                    userVideoStatus={true} />
                            ) : (
                                <div className="flex flex-col items-center gap-3 animate-pulse">
                                    <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-medium text-gray-500 tracking-wide">Syncing stream…</p>
                                </div>
                            );
                        }
                        if (effectiveStageUser.socketId === socketRef.current?.id) {
                            return <Video stream={stream} userName={userInfo.name} role={myRole}
                                isStage isLocal userVideoStatus={!isVideoOff} />;
                        }
                        const s = remoteStreams[effectiveStageUser.socketId];
                        return s ? (
                            <Video key={`${effectiveStageUser.socketId}-normal`}
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

                    {/* Back to presentation button */}
                    {activeSharingUser && !showScreen && (
                        <button onClick={() => setPinnedSocketId(null)}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[10px] sm:text-xs font-bold transition-all shadow-lg border border-blue-400/30">
                            <MonitorUp size={11} />
                            <span className="hidden xs:inline">{lang === 'uz' ? 'Demonstratsiyaga qaytish' : lang === 'ru' ? 'Вернуться к демонстрации' : 'Back to screen'}</span>
                        </button>
                    )}

                    {/* Screen share banner */}
                    {activeSharingUser && showScreen && (
                        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-2 sm:px-4 py-2 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                            <div className="flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-blue-400/30 shadow-lg">
                                <MonitorUp size={11} className="text-blue-200 shrink-0" />
                                <span className="text-[10px] font-bold text-white tracking-wide truncate max-w-[100px] xs:max-w-[160px] sm:max-w-[260px]">
                                    {effectiveStageUser.userName}'s screen
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse shrink-0" />
                            </div>
                            {activeSharingUser.socketId === socketRef.current?.id && (
                                <button onClick={stopScreenShare}
                                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white text-[10px] sm:text-xs font-bold transition-all shadow-lg border border-red-400/30">
                                    <MonitorOff size={11} />
                                    <span className="hidden xs:inline">Stop</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Stage user label */}
                    {!showScreen && (
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10 z-20 pointer-events-none">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-semibold text-white/90 truncate max-w-[120px] xs:max-w-[200px]">{effectiveStageUser.userName}</span>
                            {(effectiveStageUser.role === 'host' || effectiveStageUser.role === 'cohost') && (
                                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">
                                    {effectiveStageUser.role === 'host' ? 'Host' : 'Co-Host'}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Thumbnail strip / Sidebar ── */}
                <div className={`${isSidebar ? 'flex flex-row sm:flex-col overflow-x-auto sm:overflow-y-auto sm:overflow-x-hidden w-full sm:w-[140px] lg:w-[180px] sm:h-full px-1 py-2 sm:px-0 sm:pl-2 gap-2 shrink-0 snap-x sm:snap-y thumb-scroll-x sm:thumb-scroll-y mt-2 sm:mt-0' : 'flex flex-row gap-2 overflow-x-auto w-full px-1 py-2 shrink-0 snap-x thumb-scroll-x'}
                    ${isDark ? 'bg-black/20' : 'bg-gray-800/10'}`}
                    style={!isSidebar ? { maxHeight: '120px', minHeight: '72px' } : {}}>

                    {/* Local tile */}
                    {(showScreen || effectiveStageUser.socketId !== socketRef.current?.id) && (
                        <div onClick={() => setPinnedSocketId(pinnedSocketId === socketRef.current?.id ? null : socketRef.current?.id)}
                            className={`relative shrink-0 snap-center rounded-xl overflow-hidden cursor-pointer transition-all duration-200 bg-[#0e1016]
                            ${activeSpeakers.has('__local__') ? 'ring-2 ring-emerald-400/70' : 'ring-1 ring-white/10 hover:ring-blue-400/50'}`}
                            style={isSidebar ? { width: '100%', minWidth: '96px', aspectRatio: '16/9' } : { width: '96px', aspectRatio: '16/9' }}>
                            <Video stream={stream} userName="You" role={myRole} isLocal isSpeaking={activeSpeakers.has('__local__')} userVideoStatus={!isVideoOff} />
                            {pinnedSocketId === socketRef.current?.id && (
                                <div className="absolute top-1 left-1 bg-blue-600/80 backdrop-blur-sm rounded p-0.5">
                                    <Pin size={8} className="text-white" />
                                </div>
                            )}
                            {handRaisedUsers.includes(userInfo._id) && <div className="absolute top-0.5 right-0.5 text-[9px]">✋</div>}
                        </div>
                    )}

                    {/* Remote tiles */}
                    {uniquePeers.filter(p => showScreen ? true : p.peerID !== effectiveStageUser.socketId).map((peerObj, idx) => {
                        const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                        const spk = activeSpeakers.has(peerObj.peerID);
                        return (
                            <div key={idx} onClick={() => setPinnedSocketId(pinnedSocketId === peerObj.peerID ? null : peerObj.peerID)}
                                className={`relative shrink-0 snap-center rounded-xl overflow-hidden cursor-pointer transition-all duration-200 bg-[#0e1016]
                                    ${spk ? 'ring-2 ring-emerald-400/70' : pinnedSocketId === peerObj.peerID ? 'ring-2 ring-blue-500/70' : 'ring-1 ring-white/10 hover:ring-blue-400/50'}`}
                                style={isSidebar ? { width: '100%', minWidth: '96px', aspectRatio: '16/9' } : { width: '96px', aspectRatio: '16/9' }}>
                                <Video stream={remoteStreams[peerObj.peerID]} userName={user?.userName || 'Participant'}
                                    role={user?.role} isSpeaking={spk} isLocal={false} userVideoStatus={user?.videoStatus !== false} />
                                {pinnedSocketId === peerObj.peerID && (
                                    <div className="absolute top-1 left-1 bg-blue-600/80 backdrop-blur-sm rounded p-0.5">
                                        <Pin size={8} className="text-white" />
                                    </div>
                                )}
                                {handRaisedUsers.includes(peerObj.userId) && <div className="absolute top-0.5 right-0.5 text-[9px]">✋</div>}
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
                <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none z-20">
                    <div className={`flex items-center gap-2.5 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl ${isDark ? 'bg-black/55 border border-white/10' : 'bg-gray-900/80 border border-gray-600/40'}`}>
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

            <div className={`flex-1 min-h-0 grid gap-1.5 xs:gap-2 sm:gap-2.5 auto-rows-fr p-1.5 xs:p-2 sm:p-3
                ${gridClassMap[gridSize] || gridClassMap.auto}
                animate-in fade-in zoom-in-95 duration-400`}>

                {/* Local tile */}
                <div className={`relative min-h-[120px] xs:min-h-[150px] sm:min-h-0 rounded-2xl overflow-hidden transition-all duration-300 group bg-black/40 backdrop-blur-sm
                    ${activeSpeakers.has('__local__') ? 'speaker-glow ring-1 ring-blue-500/50'
                    : isHost ? 'ring-1 ring-blue-500/30 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                    : isCoHost ? 'ring-1 ring-emerald-500/30 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                    : isDark ? 'ring-1 ring-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                    : 'ring-1 ring-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.05)]'}`}>
                    <Video stream={stream} userName={`${userInfo.name} (You)`} role={myRole}
                        isLocal isSpeaking={activeSpeakers.has('__local__')} userVideoStatus={!isVideoOff} />
                    <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
                        {isHost && <span className="flex items-center gap-1 bg-blue-600/85 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[8px] xs:text-[9px] font-bold uppercase tracking-widest text-white border border-blue-400/25 shadow">Host</span>}
                        {isCoHost && <span className="flex items-center gap-1 bg-emerald-600/85 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[8px] xs:text-[9px] font-bold uppercase tracking-widest text-white border border-emerald-400/25 shadow">Co</span>}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
                        {isMuted && (
                            <div className="flex items-center gap-1 bg-red-600/80 backdrop-blur-sm px-1 py-1 rounded-lg border border-red-400/25 shadow-lg">
                                <MicOff size={9} className="text-white" />
                            </div>
                        )}
                        {handRaisedUsers.includes(userInfo._id) && (
                            <div className="bg-amber-500/85 backdrop-blur-sm rounded-lg px-1.5 py-1 border border-amber-400/30 shadow-lg animate-in zoom-in">
                                <span className="text-xs leading-none">✋</span>
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
                            className={`relative min-h-[120px] xs:min-h-[150px] sm:min-h-0 rounded-2xl overflow-hidden transition-all duration-300 group animate-in fade-in zoom-in-95 duration-400 bg-black/40 backdrop-blur-sm
                                ${spk ? 'speaker-glow ring-1 ring-blue-500/50'
                                : isUserHost ? 'ring-1 ring-blue-500/30 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                                : isUserCoHost ? 'ring-1 ring-emerald-500/30 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                                : hasTurn ? 'ring-1 ring-amber-500/40 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                                : isDark ? 'ring-1 ring-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.15)]'
                                : 'ring-1 ring-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.05)]'}`}>
                            <Video stream={remoteStreams[peerObj.peerID]} userName={user?.userName || 'Participant'}
                                role={user?.role} hasTurn={hasTurn} isSpeaking={spk}
                                isLocal={false} userVideoStatus={user?.videoStatus !== false} />
                            <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
                                {isUserHost && <span className="bg-blue-600/85 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[8px] xs:text-[9px] font-bold uppercase tracking-widest text-white border border-blue-400/25 shadow">Host</span>}
                                {isUserCoHost && <span className="bg-emerald-600/85 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[8px] xs:text-[9px] font-bold uppercase tracking-widest text-white border border-emerald-400/25 shadow">Co</span>}
                                {hasTurn && <span className="bg-amber-500/85 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest text-amber-100 border border-amber-400/30 shadow">🎙</span>}
                            </div>
                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
                                {user?.micStatus === false && (
                                    <div className="flex items-center gap-1 bg-red-600/80 backdrop-blur-sm px-1 py-1 rounded-lg border border-red-400/25 shadow-lg">
                                        <MicOff size={9} className="text-white" />
                                    </div>
                                )}
                                {handRaisedUsers.includes(peerObj.userId) && (
                                    <div className="bg-amber-500/85 backdrop-blur-sm rounded-lg px-1.5 py-1 border border-amber-400/30 shadow-lg animate-in zoom-in">
                                        <span className="text-xs leading-none">✋</span>
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
