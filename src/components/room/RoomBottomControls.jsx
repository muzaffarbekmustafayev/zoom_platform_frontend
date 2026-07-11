import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorOff,
    Circle, StopCircle, Hand, Settings, MessageSquare,
    Users, PhoneOff, MoreHorizontal, Copy, Check, FileText,
} from 'lucide-react';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const HOLD_TO_TALK_MS = 250;

const RoomBottomControls = ({
    roomID, copied, setCopied,
    myRole,
    isMuted, toggleMute,
    isVideoOff, toggleVideo,
    isSharingScreen, stopScreenShare, toggleScreenShare,
    openDocShare,
    showShareMenu, setShowShareMenu,
    canRecord, isRecording, startRecording, stopRecording,
    raiseHand,
    showSettings, setShowSettings,
    showChat, setShowChat,
    showParticipants, setShowParticipants,
    unreadMessages,
    waitingBadge = 0,
    roomUsers,
    leaveRoom,
    endMeetingForAll,
    isHost,
    onHoldToTalkStart,
    onHoldToTalkEnd,
    mobileMenuOpen,
    setMobileMenuOpen,
}) => {
    const { t, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';

    // ── Mic hold-to-talk ──
    const holdTimerRef = useRef(null);
    const heldRef = useRef(false);

    const onMicPressStart = () => {
        heldRef.current = false;
        holdTimerRef.current = setTimeout(() => {
            heldRef.current = true;
            onHoldToTalkStart?.();
        }, HOLD_TO_TALK_MS);
    };

    const onMicPressEnd = () => {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        if (heldRef.current) {
            heldRef.current = false;
            onHoldToTalkEnd?.();
        }
    };

    const onMicClick = (e) => {
        if (heldRef.current) { e.preventDefault?.(); return; }
        toggleMute();
    };

    // ── Screen-share debounce ──
    const sharePendingRef = useRef(false);
    const handleShareClick = () => {
        if (sharePendingRef.current) return;
        sharePendingRef.current = true;
        try {
            if (isSharingScreen) stopScreenShare();
            else toggleScreenShare();
        } finally {
            setTimeout(() => { sharePendingRef.current = false; }, 400);
        }
    };

    // ── Leave dropdown ──
    const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);
    const leaveWrapRef = useRef(null);

    useEffect(() => {
        if (!leaveMenuOpen) return;
        const onDoc = (e) => {
            if (leaveWrapRef.current && !leaveWrapRef.current.contains(e.target)) setLeaveMenuOpen(false);
        };
        const onEsc = (e) => { if (e.key === 'Escape') setLeaveMenuOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
    }, [leaveMenuOpen]);

    const handleLeaveClick = () => {
        if (isHost) { setLeaveMenuOpen(v => !v); return; }
        if (window.confirm(t('leave_confirm'))) leaveRoom();
    };

    const isGuest = myRole === 'guest';

    // ── Unified button component ──
    const Btn = ({
        icon,
        label,
        onClick,
        onStart,
        onEnd,
        active = false,
        danger = false,
        red = false,
        badge = 0,
        disabled = false,
        pulse = false,
        title: titleProp,
        size = 'md', // 'sm' | 'md'
    }) => {
        const btnSize = size === 'sm'
            ? 'w-10 h-10 rounded-xl'
            : 'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl';

        const bgClass = red
            ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30'
            : danger
                ? 'bg-red-500/90 hover:bg-red-400 shadow-lg shadow-red-900/30 ring-2 ring-red-500/25'
                : active
                    ? 'bg-blue-600/25 hover:bg-blue-600/35 ring-1 ring-blue-500/40'
                    : isDark ? 'bg-white/10 hover:bg-white/16' : 'bg-gray-100 hover:bg-gray-200';

        const iconColor = red || danger ? 'text-white' : active ? 'text-blue-400' : isDark ? 'text-gray-300' : 'text-gray-600';
        const labelColor = red ? 'text-red-400' : danger ? 'text-red-400' : active ? 'text-blue-400' : isDark ? 'text-gray-500' : 'text-gray-500';

        return (
            <div className="flex flex-col items-center gap-1">
                <button
                    onClick={onClick}
                    onMouseDown={onStart}
                    onMouseUp={onEnd}
                    onMouseLeave={onEnd}
                    onTouchStart={onStart}
                    onTouchEnd={onEnd}
                    disabled={disabled}
                    title={titleProp}
                    aria-label={titleProp}
                    aria-pressed={active}
                    className={`relative ${btnSize} flex items-center justify-center
                        transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                        ${bgClass}`}
                >
                    <span className={`${iconColor} transition-colors`}>{icon}</span>
                    {pulse && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
                    )}
                    {badge > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-[9px] font-black rounded-full flex items-center justify-center text-white leading-none shadow">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                </button>
                {label && (
                    <span className={`text-[9px] xs:text-[10px] font-semibold whitespace-nowrap select-none leading-none ${labelColor}`}>
                        {label}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className={`relative z-50 shrink-0 ${isDark ? 'bg-[#13151c] border-t border-white/[0.06]' : 'bg-white border-t border-gray-200'}`}>

            {/* ── Desktop / Tablet bar ── */}
            <div className="hidden sm:flex items-center justify-between px-4 lg:px-6 py-3">

                {/* Left: Meeting ID */}
                <div className="w-[160px] lg:w-[200px] flex items-center">
                    <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${isDark ? 'bg-white/5 hover:bg-white/8 border border-white/8' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'}`}
                    >
                        {copied
                            ? <Check size={13} className="text-emerald-400 shrink-0" />
                            : <Copy size={13} className="text-gray-500 group-hover:text-gray-300 shrink-0 transition-colors" />
                        }
                        <div className="flex flex-col items-start min-w-0">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">{t('ctl_meeting_id') || 'Meeting ID'}</span>
                            <span className={`text-[11px] font-mono font-bold tracking-wider truncate transition-colors max-w-[100px] ${copied ? 'text-emerald-400' : isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                {copied ? (t('ctl_copied') || 'Copied!') : roomID}
                            </span>
                        </div>
                    </button>
                </div>

                {/* Center: Media controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {!isGuest && (
                        <>
                            <Btn
                                icon={isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                                label={isMuted ? (t('ctl_unmute') || 'Unmute') : (t('ctl_mute') || 'Mute')}
                                onClick={onMicClick}
                                onStart={onMicPressStart}
                                onEnd={onMicPressEnd}
                                danger={isMuted}
                                active={!isMuted}
                                title={isMuted ? (t('ctl_unmute_hold') || 'Click to unmute · Hold for push-to-talk') : (t('ctl_mute') || 'Mute mic')}
                            />
                            <Btn
                                icon={isVideoOff ? <VideoOff size={19} /> : <VideoIcon size={19} />}
                                label={isVideoOff ? (t('ctl_start_video') || 'Start Video') : (t('ctl_stop_video') || 'Stop Video')}
                                onClick={toggleVideo}
                                danger={isVideoOff}
                                active={!isVideoOff}
                                title={isVideoOff ? (t('ctl_start_video') || 'Start camera') : (t('ctl_stop_video') || 'Stop camera')}
                            />
                            <div className={`w-px h-8 mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                            <Btn
                                icon={isSharingScreen ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
                                label={isSharingScreen ? (t('ctl_stop_share') || 'Stop Share') : (t('ctl_share') || 'Share')}
                                onClick={handleShareClick}
                                active={isSharingScreen}
                                title={isSharingScreen ? (t('ctl_stop_share') || 'Stop screen share') : (t('ctl_share') || 'Share screen')}
                            />
                            <Btn
                                icon={<FileText size={18} />}
                                label={t('ctl_present_file') || 'Fayl'}
                                onClick={openDocShare}
                                title={t('ctl_present_file_full') || 'Fayl taqdimoti (PDF, Word, TXT, PPTX)'}
                            />
                            {canRecord && (
                                <Btn
                                    icon={isRecording ? <StopCircle size={18} /> : <Circle size={18} />}
                                    label={isRecording ? '● REC' : (t('ctl_record') || 'Record')}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    active={isRecording}
                                    pulse={isRecording}
                                    title={isRecording ? (t('ctl_stop_record') || 'Stop recording') : (t('ctl_record') || 'Start recording')}
                                />
                            )}
                            <Btn
                                icon={<Hand size={18} />}
                                label={t('ctl_raise') || 'Raise Hand'}
                                onClick={raiseHand}
                                title={t('ctl_raise_hand') || 'Raise hand'}
                            />
                        </>
                    )}
                    {isGuest && (
                        <Btn
                            icon={<Hand size={18} />}
                            label={t('ctl_raise') || 'Raise Hand'}
                            onClick={raiseHand}
                        />
                    )}
                </div>

                {/* Right: Panel + Leave */}
                <div className="w-[160px] lg:w-[200px] flex items-center justify-end gap-1.5">
                    <Btn
                        icon={<Settings size={16} />}
                        label={t('ctl_settings') || 'Settings'}
                        active={showSettings}
                        onClick={() => setShowSettings(!showSettings)}
                        title={t('ctl_settings') || 'Device settings'}
                    />
                    <Btn
                        icon={<MessageSquare size={16} />}
                        label={t('ctl_chat') || 'Chat'}
                        active={showChat}
                        badge={unreadMessages}
                        onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                        title={t('ctl_chat') || 'Open chat'}
                    />
                    <Btn
                        icon={<Users size={16} />}
                        label={roomUsers.length > 0 ? `${t('ctl_people') || 'People'} (${roomUsers.length})` : (t('ctl_people') || 'People')}
                        active={showParticipants}
                        badge={waitingBadge}
                        onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                        title={t('ctl_people') || 'Participants'}
                    />
                    <div className={`w-px h-8 mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                    <div className="relative" ref={leaveWrapRef}>
                        <button
                            onClick={handleLeaveClick}
                            className="flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/30"
                        >
                            <PhoneOff size={16} />
                            <span className="hidden lg:inline">{t('ctl_leave') || 'Leave'}</span>
                        </button>
                        {isHost && leaveMenuOpen && (
                            <div className={`absolute bottom-full right-0 mb-3 w-64 rounded-2xl p-2 shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isDark ? 'bg-[#1e2028] border border-white/10' : 'bg-white border border-gray-200'}`}>
                                <button
                                    onClick={() => { setLeaveMenuOpen(false); endMeetingForAll?.(); }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    {t('leave_end_all') || 'End meeting for all'}
                                    <span className="block text-[10px] font-medium text-gray-400 mt-0.5">
                                        {t('leave_end_all_sub') || 'Removes everyone from the meeting'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => { setLeaveMenuOpen(false); leaveRoom(); }}
                                    className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-xl transition-colors mt-1 ${isDark ? 'text-gray-200 hover:text-white hover:bg-white/8' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {t('leave_only_me') || 'Leave meeting'}
                                    <span className="block text-[10px] font-medium text-gray-500 mt-0.5">
                                        {t('leave_only_me_sub') || 'Others will remain in the meeting'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile bar ── */}
            <div className="sm:hidden safe-bottom">
                {/* Primary controls row */}
                <div className={`flex items-center justify-around px-1 pt-2 pb-1 ${isDark ? '' : ''}`}>
                    {!isGuest ? (
                        <>
                            {/* Mic */}
                            <Btn
                                icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                label={isMuted ? (t('ctl_unmute') || 'Unmute') : (t('ctl_mute') || 'Mute')}
                                onClick={onMicClick}
                                onStart={onMicPressStart}
                                onEnd={onMicPressEnd}
                                danger={isMuted}
                                active={!isMuted}
                                title={isMuted ? 'Tap to unmute' : 'Mute mic'}
                            />
                            {/* Camera */}
                            <Btn
                                icon={isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                                label={isVideoOff ? 'Camera' : 'Stop Cam'}
                                onClick={toggleVideo}
                                danger={isVideoOff}
                                active={!isVideoOff}
                                title={isVideoOff ? 'Start camera' : 'Stop camera'}
                            />
                            {/* Chat */}
                            <Btn
                                icon={<MessageSquare size={20} />}
                                label={t('ctl_chat') || 'Chat'}
                                active={showChat}
                                badge={unreadMessages}
                                onClick={() => { setShowChat(!showChat); setShowParticipants(false); setMobileMenuOpen(false); }}
                                title={t('ctl_chat') || 'Open chat'}
                            />
                            {/* People */}
                            <Btn
                                icon={<Users size={20} />}
                                label={roomUsers.length > 0 ? `People (${roomUsers.length})` : 'People'}
                                active={showParticipants}
                                badge={waitingBadge}
                                onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); setMobileMenuOpen(false); }}
                                title="Participants"
                            />
                            {/* More */}
                            <Btn
                                icon={<MoreHorizontal size={20} />}
                                label={t('ctl_more') || 'More'}
                                active={mobileMenuOpen}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                title="More options"
                            />
                        </>
                    ) : (
                        <>
                            <Btn
                                icon={<MessageSquare size={20} />}
                                label="Chat"
                                active={showChat}
                                badge={unreadMessages}
                                onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                            />
                            <Btn
                                icon={<Users size={20} />}
                                label={roomUsers.length > 0 ? `People (${roomUsers.length})` : 'People'}
                                active={showParticipants}
                                badge={waitingBadge}
                                onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                            />
                            <Btn
                                icon={<Hand size={20} />}
                                label="Raise"
                                onClick={raiseHand}
                            />
                        </>
                    )}

                    {/* Leave — always visible */}
                    <div className="relative" ref={!isGuest ? undefined : leaveWrapRef}>
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={handleLeaveClick}
                                className="w-11 h-11 rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-900/30"
                                aria-label="Leave meeting"
                            >
                                <PhoneOff size={20} className="text-white" />
                            </button>
                            <span className="text-[9px] xs:text-[10px] font-semibold text-red-400 leading-none">
                                {t('ctl_leave') || 'Leave'}
                            </span>
                        </div>
                        {isHost && leaveMenuOpen && (
                            <div className={`absolute bottom-full right-0 mb-3 w-64 rounded-2xl p-2 shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isDark ? 'bg-[#1e2028] border border-white/10' : 'bg-white border border-gray-200'}`}>
                                <button
                                    onClick={() => { setLeaveMenuOpen(false); endMeetingForAll?.(); }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    {t('leave_end_all') || 'End meeting for all'}
                                    <span className="block text-[10px] font-medium text-gray-400 mt-0.5">
                                        {t('leave_end_all_sub') || 'Removes everyone from the meeting'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => { setLeaveMenuOpen(false); leaveRoom(); }}
                                    className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-xl transition-colors mt-1 ${isDark ? 'text-gray-200 hover:text-white hover:bg-white/8' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {t('leave_only_me') || 'Leave meeting'}
                                    <span className="block text-[10px] font-medium text-gray-500 mt-0.5">
                                        {t('leave_only_me_sub') || 'Others will remain in the meeting'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Safe area spacer */}
                <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
            </div>

            {/* ── Mobile "More" bottom sheet ── */}
            {mobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 sm:hidden bg-black/40 backdrop-blur-[2px]"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Sheet */}
                    <div
                        role="menu"
                        className={`fixed bottom-0 left-0 right-0 sm:hidden z-50 rounded-t-3xl shadow-2xl
                            animate-in slide-in-from-bottom-3 fade-in duration-250
                            ${isDark ? 'border-t border-white/10 bg-[#1a1d27]' : 'border-t border-gray-200 bg-white'}`}
                    >
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
                        </div>

                        <div className="px-4 pb-4 space-y-1">
                            {/* Title */}
                            <p className={`text-[10px] font-black uppercase tracking-widest px-1 pb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('ctl_more') || 'More Options'}
                            </p>

                            <button
                                onClick={() => { raiseHand(); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${isDark ? 'text-gray-200 hover:bg-white/8 active:bg-white/12' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                            >
                                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                                    <Hand size={18} className="text-amber-400" />
                                </div>
                                <div>
                                    <div>{t('ctl_raise_hand') || 'Raise Hand'}</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { setMobileMenuOpen(false); handleShareClick(); }}
                                className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${isSharingScreen ? 'bg-blue-500/10 text-blue-400' : isDark ? 'text-gray-200 hover:bg-white/8 active:bg-white/12' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSharingScreen ? 'bg-blue-500/20' : isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                                    {isSharingScreen
                                        ? <MonitorOff size={18} className="text-blue-400" />
                                        : <MonitorUp size={18} className={isDark ? 'text-gray-300' : 'text-gray-600'} />}
                                </div>
                                <div>
                                    <div>{isSharingScreen ? (t('ctl_stop_sharing') || 'Stop Sharing') : (t('ctl_share_screen') || 'Share Screen')}</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { setMobileMenuOpen(false); openDocShare?.(); }}
                                className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${isDark ? 'text-gray-200 hover:bg-white/8 active:bg-white/12' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                                    <FileText size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <div>{t('ctl_present_file_full') || 'Present File'}</div>
                                    <div className="text-[10px] text-gray-500 font-normal">PDF, Word, PPTX…</div>
                                </div>
                            </button>

                            {canRecord && (
                                <button
                                    onClick={() => { isRecording ? stopRecording() : startRecording(); setMobileMenuOpen(false); }}
                                    className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${isRecording ? 'bg-red-500/10 text-red-400' : isDark ? 'text-gray-200 hover:bg-white/8 active:bg-white/12' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isRecording ? 'bg-red-500/20' : isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                                        {isRecording
                                            ? <StopCircle size={18} className="text-red-400" />
                                            : <Circle size={18} className={isDark ? 'text-gray-300' : 'text-gray-600'} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {isRecording && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                            {isRecording ? (t('ctl_stop_recording') || 'Stop Recording') : (t('ctl_start_recording') || 'Start Recording')}
                                        </div>
                                    </div>
                                </button>
                            )}

                            <button
                                onClick={() => { setShowSettings(!showSettings); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${showSettings ? 'bg-blue-500/10 text-blue-400' : isDark ? 'text-gray-200 hover:bg-white/8 active:bg-white/12' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${showSettings ? 'bg-blue-500/20' : isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                                    <Settings size={18} className={showSettings ? 'text-blue-400' : isDark ? 'text-gray-300' : 'text-gray-600'} />
                                </div>
                                <div>{t('ctl_settings') || 'Device Settings'}</div>
                            </button>

                            {/* Room ID copy */}
                            <button
                                onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-colors ${isDark ? 'text-gray-200 hover:bg-white/8 active:bg-white/12' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/8' : 'bg-gray-100'}`}>
                                    {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} className={isDark ? 'text-gray-300' : 'text-gray-600'} />}
                                </div>
                                <div>
                                    <div>{copied ? (t('ctl_copied') || 'Copied!') : (t('ctl_meeting_id') || 'Copy Meeting ID')}</div>
                                    <div className="text-[10px] text-gray-500 font-mono font-normal truncate max-w-[180px]">{roomID}</div>
                                </div>
                            </button>
                        </div>

                        {/* Safe area spacing */}
                        <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
                    </div>
                </>
            )}
        </div>
    );
};

export default RoomBottomControls;
