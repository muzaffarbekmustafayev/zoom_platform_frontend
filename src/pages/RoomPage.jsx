import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import API from '../api';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../components/ConfirmModal';

import ChatPanel                from '../components/ChatPanel';
import RoomBottomControls       from '../components/room/RoomBottomControls';
import RoomSettingsModal        from '../components/room/RoomSettingsModal';
import RoomHeader               from '../components/room/RoomHeader';
import RoomVideoGrid            from '../components/room/RoomVideoGrid';
import RoomParticipantsSidebar  from '../components/room/RoomParticipantsSidebar';
import RoomPasswordModal        from '../components/room/RoomPasswordModal';
import WaitingToasts            from '../components/room/WaitingToasts';
import { WaitingRoom, AccessDenied } from '../components/room/RoomScreens';

const RoomPage = () => {
    const { id: roomID } = useParams();
    const navigate = useNavigate();
    const { t, lang, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';
    const { user: authUser } = useAuth();
    const toast   = useToast();
    const { confirm, modal: confirmModal } = useConfirm();
    const userInfo = authUser;

    // ── State ──────────────────────────────────────────────────────────────────
    const [meeting, setMeeting]               = useState(null);
    const [peers, setPeers]                   = useState([]);
    const [stream, setStream]                 = useState(null);
    const [isMuted, setIsMuted]               = useState(true);
    const [isVideoOff, setIsVideoOff]         = useState(true);
    const [remoteStreams, setRemoteStreams]    = useState({});
    const [messages, setMessages]             = useState([]);
    const [newMessage, setNewMessage]         = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [showChat, setShowChat]             = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [roomUsers, setRoomUsers]           = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [copied, setCopied]                 = useState(false);
    const [handRaisedUsers, setHandRaisedUsers] = useState([]);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [videoDevices, setVideoDevices]     = useState([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    const [isRecording, setIsRecording]       = useState(false);
    const [activeSharingUser, setActiveSharingUser] = useState(null);
    const [audioDevices, setAudioDevices]     = useState([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
    const [showSettings, setShowSettings]     = useState(false);
    const [shareRequests, setShareRequests]   = useState([]);
    const [isShareApproved, setIsShareApproved] = useState(false);
    const [isWaitingForPermission, setIsWaitingForPermission] = useState(false);
    const [requestPending, setRequestPending] = useState(false);
    const [toastMessage, setToastMessage]     = useState(null);
    const [myRole, setMyRole]                 = useState(null);
    const [waitingRoomUsers, setWaitingRoomUsers] = useState([]);
    const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
    const [waitingRoomDenied, setWaitingRoomDenied] = useState(false);
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [accessDenied, setAccessDenied]     = useState(false);
    const [waitingBadge, setWaitingBadge]     = useState(0);
    const [waitingToasts, setWaitingToasts]   = useState([]);
    const [meetingElapsed, setMeetingElapsed] = useState('00:00:00');
    const [networkInfo, setNetworkInfo]       = useState({ label: 'Stable', ping: 32, tone: 'text-emerald-500' });
    const [viewMode, setViewMode]             = useState('speaker');
    const [gridSize, setGridSize]             = useState('auto');
    const [pinnedSocketId, setPinnedSocketId] = useState(null);
    const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
    const [viewMenuOpen, setViewMenuOpen]     = useState(false);
    const [activeSpeakers, setActiveSpeakers] = useState(new Set());
    const [showShareMenu, setShowShareMenu]   = useState(false);
    const [searchQuery, setSearchQuery]       = useState('');
    const [currentTurnUserId, setCurrentTurnUserId] = useState(null);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const mediaRecorderRef    = useRef(null);
    const recordedChunksRef   = useRef([]);
    const screenStreamRef     = useRef(null);
    const userVideo           = useRef();
    const peersRef            = useRef([]);
    const streamRef           = useRef(null);
    const audioContextRef     = useRef(null);
    const audioDestinationRef = useRef(null);
    const micAudioCtxRef      = useRef(null);
    const rawMicTrackRef      = useRef(null);
    const localAnalyserRef    = useRef(null);
    const remoteAnalysersRef  = useRef({});
    const speakingRafRef      = useRef(null);
    const activeSpeakersRef   = useRef(new Set());
    const socketRef           = useRef(null);
    const joinStartedRef      = useRef(false);
    const initMediaRef        = useRef(null);
    const isSharingScreenRef  = useRef(false);
    const holdToTalkRef       = useRef(false);
    const waitingRoomUsersRef = useRef([]);
    const waitingToastRef     = useRef([]);
    const viewMenuRef         = useRef(null);
    const messagesEndRef      = useRef(null);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatDuration = useCallback((ms) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
            .map(n => String(n).padStart(2, '0')).join(':');
    }, []);

    const playNotificationSound = useCallback(() => {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1);
            osc.onended = () => ctx.close().catch(() => {});
        } catch (_) {}
    }, []);

    const copyRoomID = useCallback(() => {
        if (!roomID) return;
        navigator.clipboard.writeText(roomID);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.info(lang === 'uz' ? 'Xona ID-si nusxalandi!' : lang === 'ru' ? 'ID комнаты скопировано!' : 'Room ID copied!');
    }, [roomID, lang, toast]);

    // ── Effects ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const h = (e) => { if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) setViewMenuOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (showChat) setUnreadMessages(0);
    }, [messages, showChat]);

    useEffect(() => {
        if (!meeting?.startTime) return;
        const start = new Date(meeting.startTime).getTime();
        const tick = () => setMeetingElapsed(formatDuration(Date.now() - start));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [meeting?.startTime, formatDuration]);

    useEffect(() => {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const cur = remoteAnalysersRef.current;
        for (const sid of Object.keys(cur)) {
            if (!remoteStreams[sid]) { cur[sid].ctx.close().catch(() => {}); delete cur[sid]; }
        }
        for (const [sid, s] of Object.entries(remoteStreams)) {
            if (cur[sid] || !s.getAudioTracks().length) continue;
            try {
                const ctx = new Ctx();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.4;
                ctx.createMediaStreamSource(s).connect(analyser);
                cur[sid] = { ctx, analyser };
            } catch (_) {}
        }
    }, [remoteStreams]);

    // VAD loop
    useEffect(() => {
        const buf = new Uint8Array(512);
        const rms = (d) => { let s = 0; for (let i = 0; i < d.length; i++) s += (d[i] - 128) ** 2; return Math.sqrt(s / d.length); };
        const poll = () => {
            const next = new Set();
            if (localAnalyserRef.current && streamRef.current?.getAudioTracks()[0]?.enabled) {
                localAnalyserRef.current.getByteTimeDomainData(buf);
                if (rms(buf) > 15) next.add('__local__');
            }
            for (const [sid, { analyser }] of Object.entries(remoteAnalysersRef.current)) {
                try { analyser.getByteTimeDomainData(buf); if (rms(buf) > 8) next.add(sid); } catch (_) {}
            }
            const prev = activeSpeakersRef.current;
            if (next.size !== prev.size || [...next].some(s => !prev.has(s)) || [...prev].some(s => !next.has(s))) {
                activeSpeakersRef.current = next;
                setActiveSpeakers(new Set(next));
            }
            speakingRafRef.current = requestAnimationFrame(poll);
        };
        speakingRafRef.current = requestAnimationFrame(poll);
        return () => { if (speakingRafRef.current) cancelAnimationFrame(speakingRafRef.current); };
    }, []);

    useEffect(() => { if (activeSharingUser) setViewMode('speaker'); }, [activeSharingUser]);

    useEffect(() => {
        const update = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            const rtt = typeof conn?.rtt === 'number' ? conn.rtt : 32;
            if (rtt < 80 && conn?.effectiveType !== '2g') setNetworkInfo({ label: 'Excellent', ping: rtt, tone: 'text-emerald-500' });
            else if (rtt < 160) setNetworkInfo({ label: 'Good', ping: rtt, tone: 'text-blue-500' });
            else if (rtt < 260) setNetworkInfo({ label: 'Fair', ping: rtt, tone: 'text-amber-500' });
            else setNetworkInfo({ label: 'Weak', ping: rtt, tone: 'text-red-500' });
        };
        update();
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        conn?.addEventListener?.('change', update);
        return () => conn?.removeEventListener?.('change', update);
    }, []);

    useEffect(() => {
        if ((myRole === 'host' || myRole === 'cohost') && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, [myRole]);

    useEffect(() => {
        if (!waitingToasts.length) return;
        const timers = waitingToasts.map(item => setTimeout(() => {
            setWaitingToasts(prev => prev.filter(i => i.socketId !== item.socketId));
        }, 30000));
        return () => timers.forEach(clearTimeout);
    }, [waitingToasts]);

    useEffect(() => { setWaitingBadge(waitingRoomUsers.length); }, [waitingRoomUsers.length]);

    useEffect(() => {
        if (!isInWaitingRoom && stream && userVideo.current && !isSharingScreen) {
            userVideo.current.srcObject = stream;
        }
    }, [isInWaitingRoom, stream, isSharingScreen]);

    useEffect(() => { isSharingScreenRef.current = isSharingScreen; }, [isSharingScreen]);

    useEffect(() => {
        if (activeSharingUser && activeSharingUser.userId !== userInfo._id) {
            setToastMessage(`${activeSharingUser.userName} is sharing their screen`);
            setTimeout(() => setToastMessage(null), 5000);
        }
    }, [activeSharingUser, userInfo._id]);

    useEffect(() => {
        if (!(myRole === 'host' || myRole === 'cohost')) return;
        const prev = waitingToastRef.current || [];
        const newUsers = waitingRoomUsers.filter(u => !prev.find(p => p.socketId === u.socketId));
        waitingToastRef.current = waitingRoomUsers;
        if (!newUsers.length) return;
        newUsers.forEach(u => {
            playNotificationSound();
            setWaitingToasts(cur => cur.find(i => i.socketId === u.socketId) ? cur : [...cur, u]);
        });
    }, [myRole, playNotificationSound, waitingRoomUsers]);

    // Space-bar hold-to-talk
    useEffect(() => {
        if (!myRole) return;
        const onDown = (e) => {
            const tag = document.activeElement?.tagName;
            if (e.code === 'Space' && !e.repeat && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
                e.preventDefault(); handleHoldToTalkStart();
            }
        };
        const onUp = (e) => { if (e.code === 'Space') handleHoldToTalkEnd(); };
        document.addEventListener('keydown', onDown);
        document.addEventListener('keyup', onUp);
        return () => { document.removeEventListener('keydown', onDown); document.removeEventListener('keyup', onUp); };
    }, [myRole, isMuted]);

    // ── Audio processing chain ────────────────────────────────────────────────
    function buildAudioProcessingChain(rawTrack) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx || !rawTrack) return null;
        try {
            const ctx = new Ctx({ sampleRate: 48000 });
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass'; hp.frequency.value = 80; hp.Q.value = 0.7;
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -24; comp.knee.value = 30; comp.ratio.value = 4;
            comp.attack.value = 0.003; comp.release.value = 0.25;
            const gain = ctx.createGain(); gain.gain.value = 1.3;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.4;
            const dest = ctx.createMediaStreamDestination();
            const src = ctx.createMediaStreamSource(new MediaStream([rawTrack]));
            src.connect(hp); hp.connect(comp); comp.connect(gain); gain.connect(analyser); analyser.connect(dest);
            return { ctx, processedTrack: dest.stream.getAudioTracks()[0], analyser };
        } catch (e) { console.error('Audio processing failed:', e); return null; }
    }

    // ── WebRTC peer helpers ───────────────────────────────────────────────────
    function createPeer(userToSignal, callerID, stream, callerUserId, socket) {
        const peer = new Peer({ initiator: true, trickle: false, stream });
        peer.on('signal', signal => socket.emit('sending-signal', { userToSignal, callerID, signal, callerUserId }));
        peer.on('stream', s => setRemoteStreams(prev => ({ ...prev, [userToSignal]: s })));
        peer.on('error', () => toast.error(lang === 'uz' ? 'Ulanishda xatolik.' : lang === 'ru' ? 'Ошибка подключения.' : 'Connection error.'));
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream, socket) {
        const peer = new Peer({ initiator: false, trickle: false, stream });
        peer.on('signal', signal => socket.emit('returning-signal', { signal, callerID }));
        peer.on('stream', s => setRemoteStreams(prev => ({ ...prev, [callerID]: s })));
        peer.on('error', () => toast.error(lang === 'uz' ? 'Ulanishda xatolik.' : lang === 'ru' ? 'Ошибка подключения.' : 'Connection error.'));
        peer.signal(incomingSignal);
        return peer;
    }

    // ── Socket + media init ───────────────────────────────────────────────────
    useEffect(() => {
        joinStartedRef.current = false;
        const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005', {
            auth: { token: userInfo?.token || null }
        });
        socketRef.current = socket;
        setMessages([]); setPeers([]); setShareRequests([]); setIsShareApproved(false); setRequestPending(false);

        const fetchMeeting = async (pw = null) => {
            try {
                const { data } = await API.get(`/api/meetings/${roomID}`, pw ? { params: { password: pw } } : {});
                setMeeting(data);
                setPasswordRequired(false);
                if (!joinStartedRef.current) { joinStartedRef.current = true; initMediaRef.current?.(pw || ''); }
            } catch (err) {
                if (err.response?.status === 403 && err.response?.data?.requiresPassword) setPasswordRequired(true);
                else if (err.response?.status === 403) setAccessDenied(true);
                else { toast.error(t('meeting_not_found')); navigate('/'); }
            }
        };
        fetchMeeting(sessionStorage.getItem(`room-pw-${roomID}`) || null);

        // ── Socket events ──
        socket.on('chat-message', msg => { setMessages(p => [...p, msg]); if (!showChat) setUnreadMessages(p => p + 1); });
        socket.on('chat-message-edited', ({ _id, newText }) => setMessages(p => p.map(m => m._id === _id ? { ...m, text: newText } : m)));
        socket.on('chat-message-deleted', ({ _id }) => setMessages(p => p.filter(m => m._id !== _id)));
        socket.on('previous-messages', msgs => setMessages(msgs.map(m => ({
            _id: m._id, userName: m.senderName, text: m.text, file: m.file,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))));
        socket.on('user-hand-raised', ({ userId, userName }) => {
            setHandRaisedUsers(p => [...p, userId]);
            setToastMessage(`✋ ${userName || 'Someone'} raised their hand`);
            setTimeout(() => setToastMessage(null), 3000);
            setTimeout(() => setHandRaisedUsers(p => p.filter(id => id !== userId)), 10000);
        });
        socket.on('update-user-list', users => setRoomUsers(users));
        socket.on('share-request-received', ({ userId, userName, type, requesterSocketId }) =>
            setShareRequests(p => [...p, { userId: requesterSocketId || userId, userName, type }]));
        socket.on('share-request-result', ({ approved }) => {
            setRequestPending(false);
            if (approved) setIsShareApproved(true);
            else toast.warning(t('host_denied_share'));
        });
        socket.on('force-stop-share', () => {
            if (isSharingScreenRef.current) {
                stopScreenShareFn(screenStreamRef, audioContextRef, audioDestinationRef, peersRef, streamRef,
                    socket, roomID, setActiveSharingUser, setIsSharingScreen, setIsShareApproved, setIsWaitingForPermission, isSharingScreenRef);
                toast.warning(t('host_stopped_share'));
            }
        });
        socket.on('user-disconnected', id => {
            const p = peersRef.current.find(p => p.peerID === id);
            if (p) p.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerID !== id);
            setPeers(peersRef.current);
        });
        socket.on('kicked',        () => { toast.error(t('kicked_msg'));  navigate('/'); });
        socket.on('blocked',       () => { toast.error(t('blocked_msg')); navigate('/'); });
        socket.on('error-message', msg => { toast.error(msg); navigate('/'); });
        socket.on('error',         ({ message } = {}) => { if (message) toast.error(message); });
        socket.on('turn-updated',         data => setCurrentTurnUserId(data.userId));
        socket.on('screen-sharing-started', data => setActiveSharingUser(data));
        socket.on('screen-sharing-stopped', () => setActiveSharingUser(null));
        socket.on('your-role',    ({ role }) => { setMyRole(role); setIsInWaitingRoom(false); });
        socket.on('role-updated', ({ role }) => setMyRole(role));
        socket.on('host-changed', ({ newHostUserId, newHostName }) => {
            if (newHostUserId === userInfo._id) { setMyRole('host'); toast.success(lang === 'uz' ? "Siz xona yetakchisi bo'ldingiz" : 'You are now the host'); }
            else toast.info(`${newHostName} ${lang === 'uz' ? 'yangi xona yetakchisi' : 'is now the host'}`);
        });
        socket.on('waiting-room',       () => setIsInWaitingRoom(true));
        socket.on('waiting-room-denied', () => { setIsInWaitingRoom(false); setWaitingRoomDenied(true); });
        socket.on('waiting-room-update', list => {
            const incoming = list || [];
            const prev = waitingRoomUsersRef.current;
            if (incoming.length > prev.length) {
                const nu = incoming.find(u => !prev.find(p => p.socketId === u.socketId));
                if (nu) {
                    toast.info(`✋ ${nu.userName || 'Foydalanuvchi'} kirishni so'ramoqda`);
                    if (Notification.permission === 'granted') new Notification('Meetra', { body: `${nu.userName} kirishni so'ramoqda`, icon: '/vite.svg' });
                }
            }
            waitingRoomUsersRef.current = incoming;
            setWaitingRoomUsers(incoming);
        });
        socket.on('room-muted-all', () => {
            if (streamRef.current?.getAudioTracks()[0]?.enabled) {
                streamRef.current.getAudioTracks()[0].enabled = false;
                setIsMuted(true);
                sessionStorage.setItem(`mic-${roomID}`, 'false');
                socket.emit('update-media-status', { roomId: roomID, micStatus: false });
            }
        });
        socket.on('meeting-ended', () => { toast.info(t('meeting_ended_msg')); navigate('/'); });
        socket.on('all-users', users => {
            peersRef.current.forEach(p => p.peer?.destroy());
            peersRef.current = [];
            setRemoteStreams({});
            const newPeers = users.map(u => {
                const peer = createPeer(u.socketId, socket.id, streamRef.current, userInfo._id, socket);
                peersRef.current.push({ peerID: u.socketId, userId: u.userId, peer });
                return { peerID: u.socketId, userId: u.userId, peer };
            });
            setPeers(newPeers);
        });
        socket.io.on('reconnect', () => socket.emit('reconnect-room', roomID, userInfo._id, userInfo.name));
        socket.on('user-joined', payload => {
            if (peersRef.current.find(p => p.peerID === payload.callerID)) return;
            const peer = addPeer(payload.signal, payload.callerID, streamRef.current, socket);
            const obj = { peerID: payload.callerID, userId: payload.callerUserId, peer };
            peersRef.current.push(obj);
            setPeers(prev => [...prev, obj]);
        });
        socket.on('receiving-returned-signal', payload => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            if (item) item.peer.signal(payload.signal);
        });

        // ── initMedia ──
        const initMedia = async (pw = '') => {
            try {
                const cur = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000, sampleSize: 16 }
                });
                const micOn   = sessionStorage.getItem(`mic-${roomID}`)   === 'true';
                const videoOn = sessionStorage.getItem(`video-${roomID}`) === 'true';
                cur.getAudioTracks().forEach(t => { t.enabled = micOn; });
                cur.getVideoTracks().forEach(t => { t.enabled = videoOn; });
                const rawAudio = cur.getAudioTracks()[0];
                if (rawAudio) {
                    const res = buildAudioProcessingChain(rawAudio);
                    if (res) {
                        micAudioCtxRef.current = res.ctx;
                        rawMicTrackRef.current = rawAudio;
                        localAnalyserRef.current = res.analyser;
                        res.processedTrack.enabled = micOn;
                        cur.removeTrack(rawAudio);
                        cur.addTrack(res.processedTrack);
                    }
                }
                setIsMuted(!micOn); setIsVideoOff(!videoOn);
                setStream(cur); streamRef.current = cur;
                if (userVideo.current) userVideo.current.srcObject = cur;
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, pw);
                socket.emit('update-media-status', { roomId: roomID, micStatus: micOn, videoStatus: videoOn });
                const devs = await navigator.mediaDevices.enumerateDevices();
                const vid = devs.filter(d => d.kind === 'videoinput');
                const aud = devs.filter(d => d.kind === 'audioinput');
                setVideoDevices(vid); setAudioDevices(aud);
                if (vid.length && !selectedVideoDevice) setSelectedVideoDevice(vid[0].deviceId);
                if (aud.length && !selectedAudioDevice) setSelectedAudioDevice(aud[0].deviceId);
            } catch (_) {
                const canvas = document.createElement('canvas');
                canvas.width = 1; canvas.height = 1;
                const dv = canvas.captureStream().getVideoTracks()[0];
                if (dv) dv.enabled = false;
                const Ctx = window.AudioContext || window.webkitAudioContext;
                const ctx = new Ctx();
                const da = ctx.createMediaStreamDestination().stream.getAudioTracks()[0];
                if (da) da.enabled = false;
                const empty = new MediaStream([dv, da].filter(Boolean));
                setStream(empty); streamRef.current = empty; setIsMuted(true); setIsVideoOff(true);
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, pw);
            }
        };
        initMediaRef.current = initMedia;

        return () => {
            if (socketRef.current) { socket.emit('leave-room'); socket.disconnect(); socketRef.current = null; }
            if (speakingRafRef.current) cancelAnimationFrame(speakingRafRef.current);
            Object.values(remoteAnalysersRef.current).forEach(({ ctx }) => ctx.close().catch(() => {}));
            remoteAnalysersRef.current = {};
            localAnalyserRef.current = null;
            if (micAudioCtxRef.current) { micAudioCtxRef.current.close().catch(() => {}); micAudioCtxRef.current = null; }
            if (rawMicTrackRef.current) { rawMicTrackRef.current.stop(); rawMicTrackRef.current = null; }
            if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
            sessionStorage.removeItem(`mic-${roomID}`);
            sessionStorage.removeItem(`video-${roomID}`);
        };
    }, [roomID, navigate]);

    // ── Media controls ────────────────────────────────────────────────────────
    const toggleMute = () => {
        const track = streamRef.current?.getAudioTracks()[0];
        if (track) {
            const on = !track.enabled;
            track.enabled = on;
            setIsMuted(!on);
            sessionStorage.setItem(`mic-${roomID}`, String(on));
            socketRef.current?.emit('update-media-status', { roomId: roomID, micStatus: on });
        } else { setIsMuted(true); sessionStorage.setItem(`mic-${roomID}`, 'false'); }
    };

    const toggleVideo = () => {
        const track = streamRef.current?.getVideoTracks()[0];
        if (track) {
            const on = !track.enabled;
            track.enabled = on;
            setIsVideoOff(!on);
            sessionStorage.setItem(`video-${roomID}`, String(on));
            socketRef.current?.emit('update-media-status', { roomId: roomID, videoStatus: on });
        } else { setIsVideoOff(true); sessionStorage.setItem(`video-${roomID}`, 'false'); }
    };

    const switchCamera = async (deviceId) => {
        try {
            const base = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 };
            const ns = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice }, ...base } : base,
            });
            const nv = ns.getVideoTracks()[0];
            const ov = streamRef.current?.getVideoTracks()[0];
            if (nv && ov) nv.enabled = ov.enabled;
            peersRef.current.forEach(({ peer }) => { if (ov && nv) peer.replaceTrack(ov, nv, streamRef.current); });
            if (ov) ov.stop();
            streamRef.current.removeTrack(ov);
            streamRef.current.addTrack(nv);
            if (userVideo.current) userVideo.current.srcObject = streamRef.current;
            setSelectedVideoDevice(deviceId);
        } catch (e) { console.error('Camera switch failed:', e); }
    };

    const switchAudio = async (deviceId) => {
        try {
            const base = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 };
            const ns = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId }, ...base } });
            const rawNew = ns.getAudioTracks()[0];
            const oldPr = streamRef.current?.getAudioTracks()[0];
            const prevOn = oldPr ? oldPr.enabled : true;
            if (micAudioCtxRef.current) { micAudioCtxRef.current.close().catch(() => {}); micAudioCtxRef.current = null; }
            if (rawMicTrackRef.current) { rawMicTrackRef.current.stop(); rawMicTrackRef.current = null; }
            localAnalyserRef.current = null;
            let useTrack = rawNew;
            if (rawNew) {
                const res = buildAudioProcessingChain(rawNew);
                if (res) { micAudioCtxRef.current = res.ctx; rawMicTrackRef.current = rawNew; localAnalyserRef.current = res.analyser; res.processedTrack.enabled = prevOn; useTrack = res.processedTrack; }
            }
            if (useTrack) useTrack.enabled = prevOn;
            peersRef.current.forEach(({ peer }) => { if (oldPr && useTrack) peer.replaceTrack(oldPr, useTrack, streamRef.current); });
            if (oldPr) streamRef.current.removeTrack(oldPr);
            if (useTrack) streamRef.current.addTrack(useTrack);
            setSelectedAudioDevice(deviceId);
        } catch (e) { console.error('Audio switch failed:', e); }
    };

    // ── Screen share ──────────────────────────────────────────────────────────
    const stopScreenShareFn = (sRef, aCtxRef, aDestRef, pRef, stRef, socket, roomId, setAsh, setSh, setAppr, setWait, shRef) => {
        const camTrack = stRef.current?.getVideoTracks()[0];
        const micTrack = stRef.current?.getAudioTracks()[0];
        const screenVid = sRef.current?.getVideoTracks()[0];
        const mixedAud = aDestRef.current?.stream.getAudioTracks()[0];
        pRef.current.forEach(({ peer }) => {
            try {
                if (peer.connected) {
                    if (screenVid && camTrack) peer.replaceTrack(screenVid, camTrack, stRef.current);
                    if (mixedAud && micTrack) peer.replaceTrack(mixedAud, micTrack, stRef.current);
                    else if (!mixedAud && sRef.current?.getAudioTracks()[0] && micTrack) peer.replaceTrack(sRef.current.getAudioTracks()[0], micTrack, stRef.current);
                }
            } catch (e) { console.error('restoreTrack:', e); }
        });
        if (sRef.current) { sRef.current.getTracks().forEach(t => t.stop()); sRef.current = null; }
        if (aCtxRef.current) { aCtxRef.current.close().catch(() => {}); aCtxRef.current = null; aDestRef.current = null; }
        socket?.emit('stop-screen-share', { roomId });
        setAsh(null);
        if (userVideo.current) userVideo.current.srcObject = stRef.current;
        if (shRef) shRef.current = false;
        setSh(false); setAppr(false); setWait(false);
    };

    const stopScreenShare = () => {
        if (!isSharingScreenRef.current) return;
        stopScreenShareFn(screenStreamRef, audioContextRef, audioDestinationRef, peersRef, streamRef,
            socketRef.current, roomID, setActiveSharingUser, setIsSharingScreen, setIsShareApproved, setIsWaitingForPermission, isSharingScreenRef);
    };

    const toggleScreenShare = () => {
        if (isSharingScreen) { stopScreenShare(); return; }
        if (!navigator.mediaDevices?.getDisplayMedia) { toast.error(t('share_unsupported')); return; }
        if (activeSharingUser && activeSharingUser.socketId !== socketRef.current?.id) {
            toast.info(t('share_busy').replace('{name}', activeSharingUser.userName)); return;
        }
        if (isSharingScreenRef.current) return;
        const socket = socketRef.current;
        if (!socket) return;
        navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always', frameRate: { ideal: 30, max: 60 } }, audio: false })
            .then(screen => {
                const sv = screen.getVideoTracks()[0];
                const mic = streamRef.current?.getAudioTracks()[0];
                screenStreamRef.current = screen;
                const final = new MediaStream([sv, mic].filter(Boolean));
                peersRef.current.forEach(({ peer }) => {
                    const rep = () => {
                        try {
                            const ov = streamRef.current?.getVideoTracks()[0];
                            const oa = streamRef.current?.getAudioTracks()[0];
                            if (sv && ov) peer.replaceTrack(ov, sv, streamRef.current);
                            if (final.getAudioTracks()[0] && oa) peer.replaceTrack(oa, final.getAudioTracks()[0], streamRef.current);
                        } catch (e) { console.error('replaceTrack:', e); }
                    };
                    if (!peer.connected) peer.once('connect', rep); else rep();
                });
                sv.onended = () => stopScreenShare();
                socket.emit('start-screen-share', { roomId: roomID, userId: userInfo._id, userName: userInfo.name });
                setActiveSharingUser({ socketId: socket.id, userId: userInfo._id, userName: userInfo.name });
                if (userVideo.current) userVideo.current.srcObject = final;
                isSharingScreenRef.current = true;
                setIsSharingScreen(true);
            })
            .catch(err => {
                if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') return;
                toast.error(t('share_failed'));
            });
    };

    // ── Recording ─────────────────────────────────────────────────────────────
    const startRecording = async () => {
        if (!canRecord) { toast.warning(t('record_host_only')); return; }
        try {
            const ds = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            recordedChunksRef.current = [];
            const opts = { mimeType: 'video/webm;codecs=vp9,opus' };
            const mr = new MediaRecorder(ds, MediaRecorder.isTypeSupported(opts.mimeType) ? opts : undefined);
            mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            mr.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `Meeting_${roomID}_${new Date().toISOString().slice(0, 10)}.webm`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
                ds.getTracks().forEach(t => t.stop());
            };
            ds.getVideoTracks()[0].onended = stopRecording;
            mr.start(); mediaRecorderRef.current = mr; setIsRecording(true);
        } catch (_) {}
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    // ── Chat ──────────────────────────────────────────────────────────────────
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!await confirm(`${t('confirm_send_file')} "${file.name}"`)) { e.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = ev => {
            socketRef.current?.emit('file-message', { roomId: roomID, userId: userInfo._id, userName: userInfo.name, file: { name: file.name, type: file.type, size: file.size, data: ev.target.result } });
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!canChat) { toast.warning(t('chat_disabled')); return; }
        if (editingMessageId) {
            if (newMessage.trim()) socketRef.current?.emit('edit-chat-message', { roomId: roomID, messageId: editingMessageId, newText: newMessage, userId: userInfo._id });
            setEditingMessageId(null); setNewMessage(''); return;
        }
        if (newMessage.trim()) { socketRef.current?.emit('chat-message', { roomId: roomID, userId: userInfo._id, userName: userInfo.name, message: newMessage }); setNewMessage(''); }
    };

    const deleteChatMessage = async (msgId) => {
        if (await confirm(t('confirm_delete_msg'))) socketRef.current?.emit('delete-chat-message', { roomId: roomID, messageId: msgId, userId: userInfo._id });
    };

    const startEditingMessage = (msgId, text) => {
        setEditingMessageId(msgId); setNewMessage(text);
        if (!showChat) setShowChat(true);
    };

    // ── Moderation ────────────────────────────────────────────────────────────
    const kickUser  = async (sid) => { if (await confirm(t('confirm_kick')))  socketRef.current?.emit('kick-user',  { roomId: roomID, targetSocketId: sid }); };
    const blockUser = async (uid, sid) => { if (await confirm(t('confirm_block'))) socketRef.current?.emit('block-user', { roomId: roomID, targetUserId: uid, targetSocketId: sid }); };
    const giveTurn  = (uid) => {
        if (!canModerate) return;
        socketRef.current?.emit('give-turn', { roomId: roomID, targetUserId: currentTurnUserId === uid ? null : uid });
    };
    const raiseHand = () => {
        socketRef.current?.emit('hand-raise', { roomId: roomID, userId: userInfo._id, userName: userInfo.name });
        setHandRaisedUsers(p => [...p, userInfo._id]);
        setTimeout(() => setHandRaisedUsers(p => p.filter(id => id !== userInfo._id)), 10000);
    };
    const muteAll = () => { if (canModerate) socketRef.current?.emit('mute-all', { roomId: roomID }); };
    const admitUser = (sid) => { socketRef.current?.emit('admit-user', { roomId: roomID, targetSocketId: sid }); setWaitingToasts(p => p.filter(i => i.socketId !== sid)); };
    const denyUser  = (sid) => { socketRef.current?.emit('deny-user',  { roomId: roomID, targetSocketId: sid }); setWaitingToasts(p => p.filter(i => i.socketId !== sid)); };
    const promoteCoHost = async (uid, sid) => { try { await API.post(`/api/meetings/${meeting._id}/cohost`, { userId: uid }); socketRef.current?.emit('promote-cohost', { roomId: roomID, targetUserId: uid, targetSocketId: sid }); } catch { toast.error('Failed to promote'); } };
    const demoteCoHost  = async (uid, sid) => { try { await API.delete(`/api/meetings/${meeting._id}/cohost`, { data: { userId: uid } }); socketRef.current?.emit('demote-cohost',  { roomId: roomID, targetUserId: uid, targetSocketId: sid }); } catch { toast.error('Failed to demote');  } };
    const respondToShareRequest = (uid, approved, type) => { setShareRequests(p => p.filter(r => r.userId !== uid)); socketRef.current?.emit('share-permission-response', { userId: uid, approved, type }); };
    const endMeetingForAll = async () => {
        if (!await confirm(t('confirm_end_meeting'))) return;
        sessionStorage.removeItem(`room-pw-${roomID}`);
        socketRef.current?.emit('end-meeting', { roomId: roomID });
    };
    const leaveRoom = () => {
        sessionStorage.removeItem(`room-pw-${roomID}`);
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        socketRef.current?.emit('leave-room'); socketRef.current?.disconnect(); socketRef.current = null;
        navigate('/');
    };

    const handleHoldToTalkStart = () => {
        if (!isMuted || holdToTalkRef.current) return;
        const track = streamRef.current?.getAudioTracks?.()[0];
        if (!track) return;
        holdToTalkRef.current = true; track.enabled = true; setIsMuted(false);
        socketRef.current?.emit('update-media-status', { roomId: roomID, micStatus: true });
    };
    const handleHoldToTalkEnd = () => {
        if (!holdToTalkRef.current) return;
        const track = streamRef.current?.getAudioTracks?.()[0];
        holdToTalkRef.current = false; if (!track) return;
        track.enabled = false; setIsMuted(true);
        socketRef.current?.emit('update-media-status', { roomId: roomID, micStatus: false });
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const isHost      = myRole === 'host';
    const isCoHost    = myRole === 'cohost';
    const canModerate = isHost || isCoHost;
    const canRecord   = !!myRole;
    const canChat     = !!myRole;

    const getStageUser = () => {
        if (!meeting) return null;
        if (activeSharingUser) return activeSharingUser;
        if (currentTurnUserId) {
            const u = roomUsers.find(u => String(u.userId) === String(currentTurnUserId));
            if (u) return { socketId: u.socketId, userId: u.userId, userName: u.userName, role: u.role };
        }
        const hostId = meeting.hostId?._id || meeting.hostId;
        const host = roomUsers.find(u => String(u.userId) === String(hostId));
        if (host) return { socketId: host.socketId, userId: host.userId, userName: host.userName, role: 'host', isHost: true };
        const cohost = roomUsers.find(u => u.role === 'cohost');
        if (cohost) return { socketId: cohost.socketId, userId: cohost.userId, userName: cohost.userName, role: 'cohost' };
        return null;
    };

    const pinnedUser = pinnedSocketId ? roomUsers.find(u => u.socketId === pinnedSocketId) : null;
    const stageUser  = pinnedUser
        ? { socketId: pinnedUser.socketId, userId: pinnedUser.userId, userName: pinnedUser.userName, role: pinnedUser.role, videoStatus: pinnedUser.videoStatus }
        : getStageUser();
    const effectiveStageUser     = (stageUser && roomUsers.length > 1) ? stageUser : null;
    const uniquePeers             = peers.filter((p, i, arr) => arr.findIndex(x => x.peerID === p.peerID) === i);
    const totalParticipantCount   = roomUsers.length || uniquePeers.length + 1;
    const autoGrid = totalParticipantCount <= 1 ? 'grid-cols-1' : totalParticipantCount === 2 ? 'grid-cols-2' : totalParticipantCount <= 4 ? 'grid-cols-2' : totalParticipantCount <= 9 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';
    const gridClassMap = { auto: autoGrid, '1x1': 'grid-cols-1', '2x2': 'grid-cols-2', '3x3': 'grid-cols-2 sm:grid-cols-3' };

    // ── Early returns ─────────────────────────────────────────────────────────
    if (isInWaitingRoom)  return <WaitingRoom />;
    if (waitingRoomDenied || accessDenied) return <AccessDenied />;
    if (passwordRequired) return (
        <RoomPasswordModal
            roomID={roomID}
            joinStartedRef={joinStartedRef}
            initMediaRef={initMediaRef}
            onSuccess={data => { setMeeting(data); setPasswordRequired(false); }}
        />
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={`flex flex-col room-fullheight font-sans overflow-hidden ${isDark ? 'bg-[#0c0e14] text-white' : 'bg-gray-100 text-gray-900'}`}>

            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="bg-[#1e222d] border border-white/10 text-gray-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 w-[calc(100vw-2rem)] max-w-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                        <span className="text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* Waiting room admit toasts */}
            {canModerate && <WaitingToasts toasts={waitingToasts} onAdmit={admitUser} onDeny={denyUser} />}

            <RoomHeader
                isDark={isDark} meeting={meeting} roomID={roomID}
                copyRoomID={copyRoomID} copied={copied}
                meetingElapsed={meetingElapsed} myRole={myRole}
                totalParticipantCount={totalParticipantCount}
                networkInfo={networkInfo}
                viewMode={viewMode} setViewMode={setViewMode}
                viewMenuOpen={viewMenuOpen} setViewMenuOpen={setViewMenuOpen}
                viewMenuRef={viewMenuRef}
                gridSize={gridSize} setGridSize={setGridSize}
            />

            {/* Main area */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col p-1 xs:p-1.5 sm:p-2 relative z-10 min-w-0">
                    <RoomVideoGrid
                        isDark={isDark} viewMode={viewMode}
                        gridClassMap={gridClassMap} gridSize={gridSize}
                        effectiveStageUser={effectiveStageUser}
                        socketRef={socketRef} stream={stream}
                        userInfo={userInfo} myRole={myRole}
                        isHost={isHost} isCoHost={isCoHost}
                        isMuted={isMuted} isVideoOff={isVideoOff}
                        activeSharingUser={activeSharingUser}
                        stopScreenShare={stopScreenShare}
                        remoteStreams={remoteStreams}
                        uniquePeers={uniquePeers}
                        roomUsers={roomUsers}
                        activeSpeakers={activeSpeakers}
                        handRaisedUsers={handRaisedUsers}
                        currentTurnUserId={currentTurnUserId}
                        pinnedSocketId={pinnedSocketId}
                        setPinnedSocketId={setPinnedSocketId}
                        totalParticipantCount={totalParticipantCount}
                    />
                </div>

                {/* Sidebar overlay (mobile) */}
                {(showChat || showParticipants) && (
                    <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => { setShowChat(false); setShowParticipants(false); }} />
                )}

                {/* Sidebar */}
                {(showChat || showParticipants) && (
                    <aside className={`absolute inset-y-0 right-0 w-full sm:w-[320px] z-50 md:static md:w-[280px] lg:w-[320px] shrink-0 h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in slide-in-from-right duration-300
                        ${isDark ? 'bg-[#0d0f15] border-l border-white/6' : 'bg-white border-l border-gray-200'}`}>

                        {showParticipants && (
                            <>
                                <div className={`shrink-0 flex items-center justify-between px-4 h-14 border-b ${isDark ? 'border-white/6' : 'border-gray-200'}`}>
                                    <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {t('ctl_people')} <span className="text-gray-500 font-medium">({roomUsers.length})</span>
                                    </h2>
                                    <button onClick={() => setShowParticipants(false)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/8' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <RoomParticipantsSidebar
                                    isDark={isDark}
                                    roomUsers={roomUsers}
                                    handRaisedUsers={handRaisedUsers}
                                    currentTurnUserId={currentTurnUserId}
                                    userInfo={userInfo}
                                    canModerate={canModerate}
                                    isHost={isHost}
                                    shareRequests={shareRequests}
                                    respondToShareRequest={respondToShareRequest}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    giveTurn={giveTurn}
                                    kickUser={kickUser}
                                    blockUser={blockUser}
                                    promoteCoHost={promoteCoHost}
                                    demoteCoHost={demoteCoHost}
                                    muteAll={muteAll}
                                    onClose={() => setShowParticipants(false)}
                                    t={t}
                                />
                            </>
                        )}

                        {showChat && (
                            <ChatPanel
                                messages={messages}
                                newMessage={newMessage}
                                setNewMessage={setNewMessage}
                                sendMessage={sendMessage}
                                editingMessageId={editingMessageId}
                                setEditingMessageId={setEditingMessageId}
                                handleFileUpload={handleFileUpload}
                                deleteChatMessage={deleteChatMessage}
                                startEditingMessage={startEditingMessage}
                                onClose={() => setShowChat(false)}
                                roomUsers={roomUsers}
                                currentUserName={userInfo.name}
                                canChat={canChat}
                            />
                        )}
                    </aside>
                )}
            </div>

            <RoomBottomControls
                roomID={roomID} copied={copied} setCopied={setCopied}
                myRole={myRole} isMuted={isMuted} toggleMute={toggleMute}
                isVideoOff={isVideoOff} toggleVideo={toggleVideo}
                isSharingScreen={isSharingScreen} stopScreenShare={stopScreenShare} toggleScreenShare={toggleScreenShare}
                showShareMenu={showShareMenu} setShowShareMenu={setShowShareMenu}
                canRecord={canRecord} isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording}
                raiseHand={raiseHand}
                showSettings={showSettings} setShowSettings={setShowSettings}
                showChat={showChat} setShowChat={setShowChat}
                showParticipants={showParticipants} setShowParticipants={setShowParticipants}
                unreadMessages={unreadMessages} waitingBadge={waitingBadge}
                roomUsers={roomUsers} leaveRoom={leaveRoom} endMeetingForAll={endMeetingForAll}
                isHost={isHost} onHoldToTalkStart={handleHoldToTalkStart} onHoldToTalkEnd={handleHoldToTalkEnd}
                mobileMenuOpen={mobileToolsOpen} setMobileMenuOpen={setMobileToolsOpen}
            />

            {showSettings && (
                <RoomSettingsModal
                    onClose={() => setShowSettings(false)}
                    videoDevices={videoDevices} selectedVideoDevice={selectedVideoDevice} switchCamera={switchCamera}
                    audioDevices={audioDevices} selectedAudioDevice={selectedAudioDevice} switchAudio={switchAudio}
                    isHost={isHost} meeting={meeting} roomID={roomID}
                />
            )}

            {confirmModal}
        </div>
    );
};

export default RoomPage;
