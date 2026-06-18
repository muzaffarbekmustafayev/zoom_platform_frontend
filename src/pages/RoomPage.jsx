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
import RoomDocShare             from '../components/room/RoomDocShare';
import { AccessDenied, WaitingRoom } from '../components/room/RoomScreens';
import WaitingToasts from '../components/room/WaitingToasts';

// ── ICE configuration ──────────────────────────────────────────────────────────
// STUN topadi, TURN esa NAT/firewall ortidagi foydalanuvchilar uchun relay —
// TURN'siz ko'p tarmoqlarda media umuman ulanmaydi.
const ICE_CONFIG = {
    iceServers: [
        { urls: import.meta.env.VITE_STUN_URL || 'stun:stun.l.google.com:19302' },
        ...(import.meta.env.VITE_TURN_URL ? [{
            urls: import.meta.env.VITE_TURN_URL,
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
        }] : []),
    ],
};

// Opus kodek sozlamalari (SDP orqali):
// useinbandfec=1 — paket yo'qolganda ovozni tiklash (FEC), zaif tarmoqda uzilishlar kamayadi
// usedtx=1       — jimlikda deyarli trafik yubormaslik (bandwidth tejaladi)
// maxaveragebitrate=48000 — nutq uchun yuqori sifat
const tuneOpusSdp = (sdp) =>
    sdp.replace(/(a=fmtp:\d+ minptime=10;useinbandfec=1)/g,
        '$1;usedtx=1;maxaveragebitrate=48000;cbr=0');

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
    const [screenStream, setScreenStream]     = useState(null); // sahnada ko'rsatiladigan ekran oqimi (lokal yoki remote)
    const [docShareOpen, setDocShareOpen]     = useState(false); // fayl taqdimoti modali
    const [audioDevices, setAudioDevices]     = useState([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
    const [showSettings, setShowSettings]     = useState(false);
    const [shareRequests, setShareRequests]   = useState([]);
    const [isShareApproved, setIsShareApproved] = useState(false);
    const [isWaitingForPermission, setIsWaitingForPermission] = useState(false);
    const [requestPending, setRequestPending] = useState(false);
    const [toastMessage, setToastMessage]     = useState(null);
    const [myRole, setMyRole]                 = useState(null);
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [accessDenied, setAccessDenied]     = useState(false);
    const [inWaitingRoom, setInWaitingRoom]   = useState(false); // men kutish xonasidaman (host tasdig'ini kutyapman)
    const [waitingToasts, setWaitingToasts]   = useState([]);    // host/cohost ko'radigan kutayotganlar ro'yxati
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
    // Xona sozlamalari — serverdan keladi (room-settings / room-settings-updated)
    const [roomSettings, setRoomSettings] = useState({
        isChatEnabled: true, isWaitingRoomEnabled: false, muteAllOnEntry: false, allowScreenSharing: true,
    });

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
    const sharedVadCtxRef     = useRef(null);
    const speakingRafRef      = useRef(null);
    const activeSpeakersRef   = useRef(new Set());
    const socketRef           = useRef(null);
    const joinStartedRef      = useRef(false);
    const initMediaRef        = useRef(null);
    const isSharingScreenRef  = useRef(false);
    const activeSharingRef    = useRef(null);   // { socketId, streamId } — ekran oqimini kameradan ajratish uchun
    const streamsByPeerRef    = useRef({});     // peerID → Map<streamId, MediaStream>
    const holdToTalkRef       = useRef(false);
    const viewMenuRef         = useRef(null);
    const messagesEndRef      = useRef(null);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const formatDuration = useCallback((ms) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
            .map(n => String(n).padStart(2, '0')).join(':');
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

    // Bitta umumiy AudioContext — brauzerlar kontekst sonini cheklaydi (~6),
    // har stream uchun alohida kontekst 7+ ishtirokchida VAD'ni buzadi.
    useEffect(() => {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!sharedVadCtxRef.current) {
            try { sharedVadCtxRef.current = new Ctx(); } catch (_) { return; }
        }
        const ctx = sharedVadCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const cur = remoteAnalysersRef.current;
        for (const sid of Object.keys(cur)) {
            if (!remoteStreams[sid]) {
                try { cur[sid].source.disconnect(); } catch (_) {}
                delete cur[sid];
            }
        }
        for (const [sid, s] of Object.entries(remoteStreams)) {
            if (cur[sid] || !s.getAudioTracks().length) continue;
            try {
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.4;
                const source = ctx.createMediaStreamSource(s);
                source.connect(analyser);
                cur[sid] = { source, analyser };
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

    // Lokal preview doim kamerani ko'rsatadi — demonstratsiya paytida ham
    // (ekran alohida oqim bo'lib sahnada ko'rsatiladi)
    useEffect(() => {
        if (stream && userVideo.current) {
            userVideo.current.srcObject = stream;
        }
    }, [stream, isSharingScreen]);

    useEffect(() => { isSharingScreenRef.current = isSharingScreen; }, [isSharingScreen]);

    // Autoplay siyosati tufayli to'xtab qolgan AudioContext'larni birinchi
    // foydalanuvchi harakatida (klik/klaviatura) uyg'otamiz — aks holda
    // mikrofon zanjiri va VAD jim ishlaydi.
    useEffect(() => {
        const resumeAll = () => {
            [micAudioCtxRef.current, sharedVadCtxRef.current, audioContextRef.current].forEach(ctx => {
                if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
            });
        };
        document.addEventListener('click', resumeAll);
        document.addEventListener('keydown', resumeAll);
        document.addEventListener('touchstart', resumeAll);
        return () => {
            document.removeEventListener('click', resumeAll);
            document.removeEventListener('keydown', resumeAll);
            document.removeEventListener('touchstart', resumeAll);
        };
    }, []);

    useEffect(() => {
        if (activeSharingUser && activeSharingUser.userId !== userInfo._id) {
            setToastMessage(`${activeSharingUser.userName} is sharing their screen`);
            setTimeout(() => setToastMessage(null), 5000);
        }
    }, [activeSharingUser, userInfo._id]);

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

    // ── Lokal VAD analyser ────────────────────────────────────────────────────
    // MUHIM: mikrofon ovozi endi AudioContext orqali O'TKAZILMAYDI — xom trek
    // to'g'ridan-to'g'ri uzatiladi (brauzerning EC/NS/AGC dsp'si yetarli).
    // Kontekst uxlab qolganda ovoz jim ketish xavfi shu bilan butunlay yo'qoladi.
    // AudioContext faqat "gapiryapti" indikatori (VAD) uchun tahlilga ulanadi.
    function buildLocalAnalyser(track) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx || !track) return null;
        try {
            const ctx = new Ctx();
            if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.4;
            ctx.createMediaStreamSource(new MediaStream([track])).connect(analyser);
            return { ctx, analyser };
        } catch (e) { console.error('VAD analyser failed:', e); return null; }
    }

    // ── WebRTC peer helpers ───────────────────────────────────────────────────
    // ── Remote stream'larni tasniflash: kamera yoki ekran? ────────────────────
    // Har peer'dan bir nechta stream kelishi mumkin (kamera + demonstratsiya).
    // Ekran oqimi screenStreamId (socket orqali e'lon qilinadi) bo'yicha ajratiladi.
    function reclassifyStreams(peerID) {
        const map = streamsByPeerRef.current[peerID];
        if (!map) return;
        const share = activeSharingRef.current;
        let camera = null;
        for (const s of map.values()) {
            if (share && share.socketId === peerID && share.streamId && s.id === share.streamId) {
                setScreenStream(s);
            } else {
                camera = s;
            }
        }
        setRemoteStreams(prev => {
            if (camera) return prev[peerID] === camera ? prev : { ...prev, [peerID]: camera };
            // Kamera yo'q, lekin eski yozuv ekran oqimi bo'lib qolgan bo'lsa — olib tashlaymiz
            if (share && share.socketId === peerID && prev[peerID]?.id === share.streamId) {
                const next = { ...prev };
                delete next[peerID];
                return next;
            }
            return prev;
        });
    }

    function registerRemoteStream(peerID, s) {
        if (!streamsByPeerRef.current[peerID]) streamsByPeerRef.current[peerID] = new Map();
        streamsByPeerRef.current[peerID].set(s.id, s);
        reclassifyStreams(peerID);
    }

    // Yangi ulangan peer'ga, agar men demonstratsiya qilayotgan bo'lsam, ekranni ham yuboramiz
    function attachScreenOnConnect(peer) {
        peer.on('connect', () => {
            if (isSharingScreenRef.current && screenStreamRef.current) {
                try { peer.addStream(screenStreamRef.current); } catch (_) {}
            }
        });
    }

    // trickle: true — ICE kandidatlar tayyor bo'lishi bilan yuboriladi,
    // ulanish bir necha soniyaga tezlashadi va muvaffaqiyat darajasi oshadi.
    function createPeer(userToSignal, callerID, stream, callerUserId, socket) {
        const peer = new Peer({ initiator: true, trickle: true, stream, config: ICE_CONFIG, sdpTransform: tuneOpusSdp });
        peer.on('signal', signal => socket.emit('sending-signal', { userToSignal, callerID, signal, callerUserId }));
        peer.on('stream', s => registerRemoteStream(userToSignal, s));
        peer.on('error', () => toast.error(lang === 'uz' ? 'Ulanishda xatolik.' : lang === 'ru' ? 'Ошибка подключения.' : 'Connection error.'));
        attachScreenOnConnect(peer);
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream, socket) {
        const peer = new Peer({ initiator: false, trickle: true, stream, config: ICE_CONFIG, sdpTransform: tuneOpusSdp });
        peer.on('signal', signal => socket.emit('returning-signal', { signal, callerID }));
        peer.on('stream', s => registerRemoteStream(callerID, s));
        peer.on('error', () => toast.error(lang === 'uz' ? 'Ulanishda xatolik.' : lang === 'ru' ? 'Ошибка подключения.' : 'Connection error.'));
        attachScreenOnConnect(peer);
        peer.signal(incomingSignal);
        return peer;
    }

    // ── Socket + media init ───────────────────────────────────────────────────
    useEffect(() => {
        joinStartedRef.current = false;
        const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005', {
            auth: { token: userInfo?.token || null },
            // FAQAT polling. Apache reverse-proxy websocket upgrade'ni 101 qiladi-yu,
            // keyin uzib, ishlayotgan polling ulanishini ham buzyapti. upgrade'ni
            // o'chirsak ulanish barqaror bo'ladi (media baribir P2P/WebRTC ketadi).
            transports: ['polling'],
            upgrade: false,
            reconnectionDelay: 500,
            reconnectionDelayMax: 3000,
            timeout: 8000,
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
        socket.on('update-user-list', users => {
            if (!Array.isArray(users)) return;
            setRoomUsers(users);
            // myRole'ni serverning rasmiy ro'yxati bilan sinxron tutamiz — badge va
            // ruxsatlar (fayl taqdimoti, moderatsiya) har doim to'g'ri rol bilan ishlaydi.
            // AVVAL socket.id bo'yicha (joriy ulanish uchun aniq identifikator),
            // keyin userId bo'yicha (String moslashtirish bilan) o'zimizni topamiz.
            const myId = userInfo?._id != null ? String(userInfo._id) : null;
            const me = users.find(u => u.socketId === socket.id)
                || (myId && users.find(u => String(u.userId) === myId));
            if (me?.role) setMyRole(me.role);
        });
        // ── Kutish xonasi (private xona ruxsat oqimi) ──
        // Men kutish xonasiga tushdim — host qabul qilguncha kutaman
        socket.on('in-waiting-room', () => setInWaitingRoom(true));
        // Host/cohost: kutayotganlar ro'yxati yangilandi
        socket.on('waiting-room-update', list => setWaitingToasts(Array.isArray(list) ? list : []));
        // Host meni rad etdi
        socket.on('waiting-room-denied', () => { setInWaitingRoom(false); setAccessDenied(true); });
        // Delta sinxronlashuv: mic/video holati o'zgarganda to'liq ro'yxat emas,
        // faqat o'zgargan foydalanuvchi yangilanadi (katta xonada O(N²) → O(N))
        socket.on('user-media-updated', ({ socketId, micStatus, videoStatus }) =>
            setRoomUsers(prev => prev.map(u => u.socketId === socketId ? { ...u, micStatus, videoStatus } : u)));
        socket.on('share-request-received', ({ userId, userName, type, requesterSocketId }) =>
            setShareRequests(p => [...p, { userId: requesterSocketId || userId, userName, type }]));
        socket.on('share-request-result', ({ approved }) => {
            setRequestPending(false);
            if (approved) {
                setIsShareApproved(true);
                // getDisplayMedia foydalanuvchi bosishini talab qiladi — avtomatik ochib bo'lmaydi
                toast.success(lang === 'uz' ? 'Ruxsat berildi — Demonstratsiya tugmasini bosing' : lang === 'ru' ? 'Разрешено — нажмите кнопку демонстрации' : 'Approved — click the share button');
            } else toast.warning(t('host_denied_share'));
        });
        socket.on('force-stop-share', () => {
            if (isSharingScreenRef.current) {
                stopScreenShare();
                toast.warning(t('host_stopped_share'));
            }
        });
        socket.on('user-disconnected', id => {
            const p = peersRef.current.find(p => p.peerID === id);
            if (p) p.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerID !== id);
            setPeers(peersRef.current);
            delete streamsByPeerRef.current[id];
            if (activeSharingRef.current?.socketId === id) {
                activeSharingRef.current = null;
                setActiveSharingUser(null);
                setScreenStream(null);
            }
        });
        socket.on('kicked',        () => { toast.error(t('kicked_msg'));  navigate('/'); });
        socket.on('blocked',       () => { toast.error(t('blocked_msg')); navigate('/'); });
        socket.on('error-message', msg => { toast.error(msg); navigate('/'); });
        socket.on('error',         ({ message } = {}) => { if (message) toast.error(message); });
        socket.on('socket-error',  ({ event, message } = {}) => {
            // Server demonstratsiyani rad etgan bo'lsa, lokal share holatini ham to'xtatamiz
            if (event === 'start-screen-share' && isSharingScreenRef.current) stopScreenShare();
            if (message) toast.warning(message);
        });
        socket.on('turn-updated',         data => setCurrentTurnUserId(data.userId));
        socket.on('screen-sharing-started', data => {
            activeSharingRef.current = { socketId: data.socketId, streamId: data.screenStreamId || null };
            setActiveSharingUser(data);
            setPinnedSocketId(null); // yangi demonstratsiya — sahna default ekranga o'tadi
            // Ekran oqimi e'londan oldin kelib, kamera sifatida saqlanib qolgan bo'lishi mumkin — qayta tasniflaymiz
            if (data.socketId !== socket.id) reclassifyStreams(data.socketId);
        });
        socket.on('screen-sharing-stopped', () => {
            const share = activeSharingRef.current;
            if (share?.streamId && streamsByPeerRef.current[share.socketId]) {
                streamsByPeerRef.current[share.socketId].delete(share.streamId);
            }
            activeSharingRef.current = null;
            setActiveSharingUser(null);
            setScreenStream(null);
        });
        // Xona sozlamalari: kirishda to'liq holat, host o'zgartirsa yangilanish keladi
        const applySettings = (s) => { if (s && typeof s === 'object') setRoomSettings(prev => ({ ...prev, ...s })); };
        socket.on('room-settings', applySettings);
        socket.on('room-settings-updated', s => {
            applySettings(s);
            if (s && typeof s === 'object') {
                toast.info(lang === 'uz' ? 'Xona sozlamalari yangilandi' : lang === 'ru' ? 'Настройки комнаты обновлены' : 'Room settings updated');
            }
        });
        // your-role faqat xonaga qabul qilingach keladi — kutish ekranini yopamiz
        socket.on('your-role',    ({ role }) => { setMyRole(role); setInWaitingRoom(false); });
        socket.on('role-updated', ({ role }) => setMyRole(role));
        socket.on('host-changed', ({ newHostUserId, newHostName }) => {
            if (newHostUserId === userInfo._id) { setMyRole('host'); toast.success(lang === 'uz' ? "Siz xona yetakchisi bo'ldingiz" : 'You are now the host'); }
            else toast.info(`${newHostName} ${lang === 'uz' ? 'yangi xona yetakchisi' : 'is now the host'}`);
        });
        socket.on('room-muted-all', () => {
            if (streamRef.current?.getAudioTracks()[0]?.enabled) {
                streamRef.current.getAudioTracks()[0].enabled = false;
                setIsMuted(true);
                sessionStorage.setItem(`mic-${roomID}`, 'false');
                socket.emit('update-media-status', { roomId: roomID, micStatus: false });
            }
        });
        // Mute-on-entry: host muteAllOnEntry yoqqan — kirishda mikrofon majburan o'chadi
        socket.on('mute-on-entry', () => {
            const track = streamRef.current?.getAudioTracks()[0];
            if (track) track.enabled = false;
            setIsMuted(true);
            sessionStorage.setItem(`mic-${roomID}`, 'false');
            socket.emit('update-media-status', { roomId: roomID, micStatus: false });
            toast.info(lang === 'ru' ? 'Вы вошли с выключенным микрофоном' : lang === 'en' ? 'You joined with your mic off' : 'Mikrofon o\'chiq holda qo\'shildingiz');
        });
        socket.on('meeting-ended', () => { toast.info(t('meeting_ended_msg')); navigate('/'); });
        socket.on('all-users', users => {
            // Diff: hammasini buzib qayta yaratmaymiz — faqat ketganlarni o'chirib,
            // yangilariga ulanamiz. Reconnect'da video uzilib qolmaydi.
            const valid = new Set(users.map(u => u.socketId));
            peersRef.current.forEach(p => { if (!valid.has(p.peerID)) p.peer?.destroy(); });
            peersRef.current = peersRef.current.filter(p => valid.has(p.peerID));
            for (const sid of Object.keys(streamsByPeerRef.current)) {
                if (!valid.has(sid)) delete streamsByPeerRef.current[sid];
            }
            setRemoteStreams(prev => {
                const next = {};
                for (const sid of Object.keys(prev)) if (valid.has(sid)) next[sid] = prev[sid];
                return next;
            });
            users.forEach(u => {
                if (peersRef.current.some(p => p.peerID === u.socketId)) return;
                const peer = createPeer(u.socketId, socket.id, streamRef.current, userInfo._id, socket);
                peersRef.current.push({ peerID: u.socketId, userId: u.userId, peer });
            });
            setPeers([...peersRef.current]);
        });
        socket.io.on('reconnect', () => socket.emit('reconnect-room', roomID, userInfo._id, userInfo.name));
        socket.on('user-joined', payload => {
            // trickle rejimida bitta peer'dan bir nechta signal keladi —
            // mavjud peer'ga forward qilamiz, tashlab yubormaymiz (aks holda ICE kandidatlar yo'qoladi)
            const existing = peersRef.current.find(p => p.peerID === payload.callerID);
            if (existing) { try { existing.peer.signal(payload.signal); } catch (_) {} return; }
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
                    // 'speech' — kodek nutq uchun optimallashadi
                    try { rawAudio.contentHint = 'speech'; } catch (_) {}
                    const res = buildLocalAnalyser(rawAudio);
                    if (res) {
                        micAudioCtxRef.current = res.ctx;
                        localAnalyserRef.current = res.analyser;
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
            Object.values(remoteAnalysersRef.current).forEach(({ source }) => { try { source.disconnect(); } catch (_) {} });
            remoteAnalysersRef.current = {};
            if (sharedVadCtxRef.current) { sharedVadCtxRef.current.close().catch(() => {}); sharedVadCtxRef.current = null; }
            localAnalyserRef.current = null;
            if (micAudioCtxRef.current) { micAudioCtxRef.current.close().catch(() => {}); micAudioCtxRef.current = null; }
            if (rawMicTrackRef.current) { rawMicTrackRef.current.stop(); rawMicTrackRef.current = null; }
            if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
            if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
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
            const newTrack = ns.getAudioTracks()[0];
            if (!newTrack) return;
            try { newTrack.contentHint = 'speech'; } catch (_) {}
            const oldTrack = streamRef.current?.getAudioTracks()[0];
            newTrack.enabled = oldTrack ? oldTrack.enabled : true;

            // VAD analyser'ni yangi trekka qayta ulaymiz
            if (micAudioCtxRef.current) { micAudioCtxRef.current.close().catch(() => {}); micAudioCtxRef.current = null; }
            localAnalyserRef.current = null;
            const res = buildLocalAnalyser(newTrack);
            if (res) { micAudioCtxRef.current = res.ctx; localAnalyserRef.current = res.analyser; }

            // Avval peer'larda almashtiramiz, keyin eski trekni to'xtatamiz
            peersRef.current.forEach(({ peer }) => {
                try { if (oldTrack) peer.replaceTrack(oldTrack, newTrack, streamRef.current); } catch (e) { console.error('replaceTrack(audio):', e); }
            });
            if (oldTrack) { oldTrack.stop(); streamRef.current.removeTrack(oldTrack); }
            streamRef.current.addTrack(newTrack);
            setSelectedAudioDevice(deviceId);
        } catch (e) { console.error('Audio switch failed:', e); }
    };

    // ── Screen share ──────────────────────────────────────────────────────────
    // Demonstratsiya ALOHIDA oqim sifatida yuboriladi (addStream) — kamera va
    // mikrofon o'z holicha qoladi: prezenter gapira oladi, yuzi ham ko'rinadi.
    const stopScreenShare = () => {
        if (!isSharingScreenRef.current) return;
        const screen = screenStreamRef.current;
        peersRef.current.forEach(({ peer }) => {
            try { if (screen && peer.connected) peer.removeStream(screen); } catch (e) { console.error('removeStream:', e); }
        });
        if (screen) screen.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        socketRef.current?.emit('stop-screen-share', { roomId: roomID });
        activeSharingRef.current = null;
        setActiveSharingUser(null);
        setScreenStream(null);
        isSharingScreenRef.current = false;
        setIsSharingScreen(false); setIsShareApproved(false); setIsWaitingForPermission(false);
    };

    // Ruxsat darvozasi — ekran va fayl taqdimoti uchun umumiy
    const ensureSharePermission = () => {
        const isModeratorRole = myRole === 'host' || myRole === 'cohost';

        // Host demonstratsiyani umuman o'chirgan bo'lsa — oddiy ishtirokchi share qila olmaydi
        if (!isModeratorRole && roomSettings.allowScreenSharing === false) {
            toast.warning(lang === 'uz' ? 'Bu xonada demonstratsiya o\'chirilgan' : lang === 'ru' ? 'Демонстрация экрана отключена' : 'Screen sharing is disabled in this room');
            return false;
        }

        // Oddiy ishtirokchi — avval moderator ruxsatini olishi shart
        if (!isModeratorRole && !isShareApproved) {
            if (requestPending) {
                toast.info(lang === 'uz' ? "So'rov yuborilgan — host javobini kuting" : lang === 'ru' ? 'Запрос отправлен — дождитесь ответа' : 'Request sent — waiting for host');
                return false;
            }
            setRequestPending(true);
            socketRef.current?.emit('request-to-share', { roomId: roomID, userId: userInfo._id, userName: userInfo.name, type: 'screen' });
            toast.info(lang === 'uz' ? "Demonstratsiya uchun hostdan ruxsat so'raldi" : lang === 'ru' ? 'Запрошено разрешение у организатора' : 'Asked the host for permission to share');
            return false;
        }

        // Boshqa odam demonstratsiya qilayotgan bo'lsa: moderator uni siqib chiqaradi,
        // oddiy ishtirokchi esa kutadi
        if (activeSharingUser && activeSharingUser.socketId !== socketRef.current?.id && !isModeratorRole) {
            toast.info(t('share_busy').replace('{name}', activeSharingUser.userName));
            return false;
        }
        return true;
    };

    // Istalgan MediaStream'ni (ekran yoki hujjat-canvas) demonstratsiya sifatida uzatish
    const startStreamShare = (mediaStream) => {
        const socket = socketRef.current;
        if (!socket || isSharingScreenRef.current) return false;
        const sv = mediaStream.getVideoTracks()[0];
        if (!sv) return false;
        try { sv.contentHint = 'detail'; } catch (_) {}
        screenStreamRef.current = mediaStream;

        // Oqim ALOHIDA stream sifatida qo'shiladi — kamera/mikrofon tegilmaydi
        peersRef.current.forEach(({ peer }) => {
            const add = () => { try { peer.addStream(mediaStream); } catch (e) { console.error('addStream:', e); } };
            if (!peer.connected) peer.once('connect', add); else add();
        });
        sv.onended = () => stopScreenShare();
        socket.emit('start-screen-share', { roomId: roomID, userId: userInfo._id, userName: userInfo.name, screenStreamId: mediaStream.id });
        activeSharingRef.current = { socketId: socket.id, streamId: mediaStream.id };
        setActiveSharingUser({ socketId: socket.id, userId: userInfo._id, userName: userInfo.name });
        setScreenStream(mediaStream);
        setPinnedSocketId(null);
        isSharingScreenRef.current = true;
        setIsSharingScreen(true);
        return true;
    };

    // Fayl taqdimoti (RoomDocShare canvas oqimi bilan chaqiradi)
    const startDocShare = (canvasStream) => {
        if (!ensureSharePermission()) return false;
        return startStreamShare(canvasStream);
    };

    const openDocShare = () => {
        if (isSharingScreen) { toast.info(lang === 'uz' ? "Avval joriy demonstratsiyani to'xtating" : lang === 'ru' ? 'Сначала остановите текущую демонстрацию' : 'Stop the current share first'); return; }
        if (!ensureSharePermission()) return;
        setDocShareOpen(true);
    };

    const toggleScreenShare = () => {
        if (isSharingScreen) { stopScreenShare(); return; }
        if (!navigator.mediaDevices?.getDisplayMedia) { toast.error(t('share_unsupported')); return; }
        if (!ensureSharePermission()) return;
        if (isSharingScreenRef.current) return;
        const socket = socketRef.current;
        if (!socket) return;
        navigator.mediaDevices.getDisplayMedia({
            // Demonstratsiya uchun 15fps yetarli, 1080p cheklov — bandwidth tejaladi,
            // sifat barqarorlashadi (slayd/matn uchun aniqlik harakatdan muhim)
            video: { cursor: 'always', frameRate: { ideal: 15, max: 30 }, width: { max: 1920 }, height: { max: 1080 } },
            audio: true // tizim/tab ovozi ekran oqimi ichida ketadi — video ko'rsatishda zarur
        })
            .then(screen => {
                if (!startStreamShare(screen)) screen.getTracks().forEach(tr => tr.stop());
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
    const MAX_FILE_MB = 5;
    const ALLOWED_FILE_RE = /\.(pdf|docx?|pptx?|xlsx?|txt|csv|png|jpe?g|gif|webp|zip)$/i;
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        // Hajm tekshiruvi — katta faylni base64'ga o'girmasdan oldin to'xtatamiz
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            toast.warning(lang === 'ru' ? `Файл слишком большой (макс. ${MAX_FILE_MB} МБ)` : lang === 'en' ? `File too large (max ${MAX_FILE_MB} MB)` : `Fayl juda katta (maks. ${MAX_FILE_MB} MB)`);
            return;
        }
        // Tur tekshiruvi
        if (!ALLOWED_FILE_RE.test(file.name)) {
            toast.warning(lang === 'ru' ? 'Неподдерживаемый тип файла' : lang === 'en' ? 'Unsupported file type' : 'Fayl turi qo\'llab-quvvatlanmaydi');
            return;
        }
        if (!await confirm(`${t('confirm_send_file')} "${file.name}"`)) return;
        const reader = new FileReader();
        reader.onload = ev => {
            socketRef.current?.emit('file-message', { roomId: roomID, userId: userInfo._id, userName: userInfo.name, file: { name: file.name, type: file.type, size: file.size, data: ev.target.result } });
        };
        reader.onerror = () => toast.error(lang === 'ru' ? 'Не удалось прочитать файл' : lang === 'en' ? 'Could not read the file' : 'Faylni o\'qib bo\'lmadi');
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

    // ── Kutish xonasi: host qabul/rad qiladi ──
    const admitWaiting = (sid) => { setWaitingToasts(p => p.filter(u => u.socketId !== sid)); socketRef.current?.emit('admit-user', { roomId: roomID, targetSocketId: sid }); };
    const denyWaiting  = (sid) => { setWaitingToasts(p => p.filter(u => u.socketId !== sid)); socketRef.current?.emit('deny-user',  { roomId: roomID, targetSocketId: sid }); };

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
    // Server-authoritative: socket hodisasining o'zi DB'ni (coHosts) yangilaydi va
    // rollarni qayta tarqatadi. Frontend faqat so'rovni yuboradi — alohida API
    // chaqiruvi shart emas (double-write/race oldini oladi).
    const promoteCoHost = (uid, sid) => socketRef.current?.emit('promote-cohost', { roomId: roomID, targetUserId: uid, targetSocketId: sid });
    const demoteCoHost  = (uid, sid) => socketRef.current?.emit('demote-cohost',  { roomId: roomID, targetUserId: uid, targetSocketId: sid });
    const respondToShareRequest = (uid, approved, type) => { setShareRequests(p => p.filter(r => r.userId !== uid)); socketRef.current?.emit('share-permission-response', { userId: uid, approved, type }); };
    const endMeetingForAll = async () => {
        if (!await confirm(t('confirm_end_meeting'))) return;
        sessionStorage.removeItem(`room-pw-${roomID}`);
        socketRef.current?.emit('end-meeting', { roomId: roomID });
    };
    const leaveRoom = () => {
        sessionStorage.removeItem(`room-pw-${roomID}`);
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
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
    // Chat o'chirilgan bo'lsa faqat moderator yoza oladi
    const canChat     = !!myRole && (canModerate || roomSettings.isChatEnabled !== false);
    // Demonstratsiya o'chirilgan bo'lsa faqat moderator share qila oladi
    const canShareScreen = canModerate || roomSettings.allowScreenSharing !== false;

    // Host jonli sozlamani o'zgartiradi (server-authoritative, butun xonaga tarqaladi)
    const updateRoomSettings = useCallback((patch) => {
        socketRef.current?.emit('update-room-settings', { roomId: roomID, settings: patch });
    }, [roomID]);

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
    const autoGrid = totalParticipantCount <= 1 ? 'grid-cols-1' : totalParticipantCount === 2 ? 'grid-cols-2' : totalParticipantCount <= 4 ? 'grid-cols-2' : totalParticipantCount <= 9 ? 'grid-cols-2 tablet:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
    const gridClassMap = { auto: autoGrid, '1x1': 'grid-cols-1', '2x2': 'grid-cols-2', '3x3': 'grid-cols-2 sm:grid-cols-3' };

    // ── Early returns ─────────────────────────────────────────────────────────
    if (accessDenied) return <AccessDenied />;
    if (inWaitingRoom) return <WaitingRoom />;
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

            {/* Kutish xonasi — host/cohost uchun qabul/rad toast'lari */}
            {canModerate && (
                <WaitingToasts toasts={waitingToasts} onAdmit={admitWaiting} onDeny={denyWaiting} />
            )}

            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="bg-[#1e222d] border border-white/10 text-gray-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 w-[calc(100vw-2rem)] max-w-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                        <span className="text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}

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
                        screenShareStream={screenStream}
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
                    <div className="tablet:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => { setShowChat(false); setShowParticipants(false); }} />
                )}

                {/* Sidebar */}
                {(showChat || showParticipants) && (
                    <aside className={`absolute inset-y-0 right-0 w-full xs:w-[320px] z-50 tablet:static tablet:w-[300px] lg:w-[360px] shrink-0 h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in slide-in-from-right duration-300
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
                openDocShare={openDocShare}
                showShareMenu={showShareMenu} setShowShareMenu={setShowShareMenu}
                canRecord={canRecord} isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording}
                raiseHand={raiseHand}
                showSettings={showSettings} setShowSettings={setShowSettings}
                showChat={showChat} setShowChat={setShowChat}
                showParticipants={showParticipants} setShowParticipants={setShowParticipants}
                unreadMessages={unreadMessages} waitingBadge={canModerate ? waitingToasts.length : 0}
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
                    roomSettings={roomSettings} updateRoomSettings={updateRoomSettings}
                />
            )}

            <RoomDocShare
                open={docShareOpen}
                onClose={() => setDocShareOpen(false)}
                isSharingScreen={isSharingScreen}
                onStart={startDocShare}
                onStop={stopScreenShare}
            />

            {confirmModal}
        </div>
    );
};

export default RoomPage;
