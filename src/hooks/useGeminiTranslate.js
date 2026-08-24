import { useRef, useState, useCallback, useEffect } from 'react';

// ── Gemini Live Translate constants ──────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'models/gemini-3.5-live-translate-preview';
const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const INPUT_SAMPLE_RATE = 16000;   // kirish: 16 kHz PCM 16-bit mono
const OUTPUT_SAMPLE_RATE = 24000;  // chiqish: 24 kHz PCM

// Qo'llab-quvvatlanadigan tillar
export const TRANSLATE_LANGS = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

// Til kodidan to'liq nom olish
const langFullName = {
    uz: "Uzbek (O'zbek tili)", en: 'English', ru: 'Russian (Русский)',
    tr: 'Turkish (Türkçe)', zh: 'Chinese (中文)', ko: 'Korean (한국어)',
    ja: 'Japanese (日本語)', ar: 'Arabic (العربية)', fr: 'French (Français)',
    de: 'German (Deutsch)', es: 'Spanish (Español)',
};

/**
 * Float32 PCM → 16-bit PCM → base64 string
 */
function float32ToBase64Pcm16(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

/**
 * Base64 PCM 16-bit → Float32Array
 */
function base64Pcm16ToFloat32(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return float32;
}

/**
 * Downsample audio buffer to target sample rate
 */
function downsample(buffer, fromRate, toRate) {
    if (fromRate === toRate) return buffer;
    const ratio = fromRate / toRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
        const idx = Math.floor(i * ratio);
        result[i] = buffer[idx];
    }
    return result;
}

/**
 * useGeminiTranslate — Gemini Live API orqali real-vaqt audio tarjima hook
 *
 * Foydalanish:
 *   const translate = useGeminiTranslate();
 *   translate.startTranslation(remoteStreams);
 *   translate.stopTranslation();
 */
export default function useGeminiTranslate() {
    const [isTranslating, setIsTranslating] = useState(false);
    const [sourceLang, setSourceLang] = useState('ru'); // Qaysi tilda gapirilmoqda
    const [targetLang, setTargetLang] = useState('uz'); // Qaysi tilga tarjima qilinmoqda
    const [subtitleText, setSubtitleText] = useState('');
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [error, setError] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [translatedStream, setTranslatedStream] = useState(null); // Tarjima qilingan WebRTC audio oqimi

    const wsRef = useRef(null);
    const audioCtxRef = useRef(null);
    const processorRef = useRef(null);
    const sourceNodesRef = useRef([]);
    const playbackCtxRef = useRef(null);
    const playbackQueueRef = useRef([]);
    const isPlayingRef = useRef(false);
    const nextPlayTimeRef = useRef(0);
    const cleanupRef = useRef(null);
    const setupDoneRef = useRef(false);

    // ── System instruction yaratish ──
    const buildSystemInstruction = useCallback((src, tgt) => {
        const srcName = langFullName[src] || src;
        const tgtName = langFullName[tgt] || tgt;
        return `You are a professional real-time interpreter.
Your ONLY task is to immediately translate incoming speech from ${srcName} into ${tgtName}.
Follow these strict rules:
1. Translate the spoken audio into fluent, natural ${tgtName}.
2. Output ONLY the translated audio and text. Do not add any conversational filler, greetings, or explanations.
3. If the audio is silent or contains only background noise, you MUST remain completely silent and DO NOT hallucinate words.
4. Maintain the tone and urgency of the original speaker.
5. Translate fragment by fragment as immediately as possible.`;
    }, []);

    // ── Audio playback (chiqish) ──
    const schedulePlayback = useCallback(() => {
        const ctx = playbackCtxRef.current;
        if (!ctx || ctx.state === 'closed') return;

        // Xavfsizlik: agar vaqt juda orqada qolgan bo'lsa (masalan 1 sekund),
        // audio navbatini tozalab tashlaymiz yoki nextPlayTime ni to'g'rilaymiz
        if (nextPlayTimeRef.current < ctx.currentTime - 0.5) {
            nextPlayTimeRef.current = ctx.currentTime;
        }

        while (playbackQueueRef.current.length > 0) {
            const pcmData = playbackQueueRef.current.shift();
            const audioBuffer = ctx.createBuffer(1, pcmData.length, OUTPUT_SAMPLE_RATE);
            audioBuffer.getChannelData(0).set(pcmData);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            // Eshitish o'rniga, tarjimani WebRTC oqimiga (destination node) yuboramiz
            // playbackCtxRef.current.destinationNode ni ishlatamiz
            if (ctx.streamDestination) {
                source.connect(ctx.streamDestination);
            } else {
                source.connect(ctx.destination);
            }
            
            // Vaqt orqada qolib ketsa to'g'rilash (kichik bufer bilan)
            if (nextPlayTimeRef.current < ctx.currentTime) {
                nextPlayTimeRef.current = ctx.currentTime + 0.03;
            }
            
            source.start(nextPlayTimeRef.current);
            nextPlayTimeRef.current += audioBuffer.duration;
        }
    }, []);

    // ── WebSocket xabarlarini qayta ishlash ──
    const handleWsMessage = useCallback(async (event) => {
        try {
            let rawData = event.data;
            if (rawData instanceof Blob) {
                rawData = await rawData.text();
            }
            const data = JSON.parse(rawData);

            // Setup tugallandi javobini tekshirish
            if (data.setupComplete) {
                setupDoneRef.current = true;
                setIsConnecting(false);
                setIsTranslating(true);
                setError(null);
                return;
            }

            // Server audio javob berdi
            if (data.serverContent) {
                const parts = data.serverContent.modelTurn?.parts;
                if (!parts) return;

                for (const part of parts) {
                    // Audio data
                    if (part.inlineData?.mimeType?.startsWith('audio/pcm')) {
                        const pcmFloat = base64Pcm16ToFloat32(part.inlineData.data);
                        playbackQueueRef.current.push(pcmFloat);
                        schedulePlayback();
                    }
                    // Matn (subtitr)
                    if (part.text) {
                        setSubtitleText(prev => {
                            // Yangi matnni qo'shish — oxirgi 500 ta belgidan keyin qirqish
                            const combined = prev ? prev + ' ' + part.text : part.text;
                            return combined.length > 500 ? combined.slice(-500) : combined;
                        });
                    }
                }
            }
        } catch (err) {
            console.warn('[Translate] WS message parse error:', err);
        }
    }, [schedulePlayback]);

    // ── Tarjimani boshlash ──
    const startTranslation = useCallback((localStream) => {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
            setError('VITE_GEMINI_API_KEY sozlanmagan. .env faylga API kalitini qo\'shing.');
            return;
        }

        if (!localStream || localStream.getAudioTracks().length === 0) {
            setError('Mikrofon oqimi topilmadi.');
            return;
        }

        setIsConnecting(true);
        setError(null);
        setSubtitleText('');
        setupDoneRef.current = false;

        try {
            // 1. Playback AudioContext (WebRTC uchun)
            const PlayCtx = window.AudioContext || window.webkitAudioContext;
            playbackCtxRef.current = new PlayCtx({ sampleRate: OUTPUT_SAMPLE_RATE });
            playbackCtxRef.current.streamDestination = playbackCtxRef.current.createMediaStreamDestination();
            setTranslatedStream(playbackCtxRef.current.streamDestination.stream);
            playbackQueueRef.current = [];
            isPlayingRef.current = false;
            nextPlayTimeRef.current = 0;

            // 2. WebSocket ulanish
            const wsUrl = `${WS_BASE}?key=${GEMINI_API_KEY}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                // Setup message yuborish
                const setupMsg = {
                    setup: {
                        model: GEMINI_MODEL,
                        generationConfig: {
                            responseModalities: ['AUDIO', 'TEXT'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: 'Puck'
                                    }
                                }
                            }
                        },
                        systemInstruction: {
                            parts: [{
                                text: buildSystemInstruction(sourceLang, targetLang)
                            }]
                        }
                    }
                };
                ws.send(JSON.stringify(setupMsg));
            };

            ws.onmessage = handleWsMessage;

            ws.onerror = (e) => {
                console.error('[Translate] WebSocket error:', e);
                setError('WebSocket ulanish xatosi');
                setIsTranslating(false);
                setIsConnecting(false);
            };

            ws.onclose = (e) => {
                console.log('[Translate] WebSocket closed:', e.code, e.reason);
                setIsConnecting(false);
                if (e.code !== 1000 && isTranslating) {
                    console.warn('[Translate] Kutilmagan uzilish, 1 soniyadan so\'ng qayta ulanadi...');
                    setTimeout(() => {
                        if (isTranslating && !wsRef.current) {
                            startTranslation(localStream);
                        }
                    }, 1000);
                } else {
                    setIsTranslating(false);
                }
            };

            // 3. Local audio stream ni Gemini ga yuborish
            const RecordCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new RecordCtx({ sampleRate: INPUT_SAMPLE_RATE });
            audioCtxRef.current = audioCtx;

            const mixer = audioCtx.createGain();
            let source = null;

            try {
                source = audioCtx.createMediaStreamSource(localStream);
                source.connect(mixer);
            } catch (err) {
                console.warn('[Translate] Local stream connect error:', err);
            }

            sourceNodesRef.current = source ? [source] : [];

            if (!source) {
                setError('Mikrofon oqimiga ulanib bo\'lmadi.');
                setIsConnecting(false);
                ws.close();
                audioCtx.close();
                return;
            }

            // ScriptProcessor — PCM chunklash (AudioWorklet o'rniga — keng qo'llab-quvvatlash uchun)
            const bufferSize = 1024; // Oldin 4096 edi (256ms kechikish). 1024 = 64ms tezlik
            const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;

            mixer.connect(processor);
            processor.connect(audioCtx.destination); // ScriptProcessor connect bo'lishi shart

            let silenceTimeout = null;

            processor.onaudioprocess = (e) => {
                if (!setupDoneRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);
                
                // VAD (Voice Activity Detection) - Shovqinni filtr qilish
                let sumSquare = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sumSquare += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sumSquare / inputData.length);
                const VAD_THRESHOLD = 0.005; // RMS chegarasi
                
                if (rms < VAD_THRESHOLD) {
                    // Jimjitlik
                    return;
                }

                // Agar ovoz bo'lsa
                const pcm16Base64 = float32ToBase64Pcm16(inputData);

                // Real-time audio yuborish
                const msg = {
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                            data: pcm16Base64
                        }]
                    }
                };

                try {
                    wsRef.current.send(JSON.stringify(msg));
                } catch (sendErr) {
                    console.warn('[Translate] Send error:', sendErr);
                }
            };

            // 4. Cleanup funksiyasini saqlash
            cleanupRef.current = () => {
                try { processor.disconnect(); } catch (_) {}
                try { mixer.disconnect(); } catch (_) {}
                sources.forEach(s => { try { s.disconnect(); } catch (_) {} });
                try { audioCtx.close(); } catch (_) {}
                try { ws.close(); } catch (_) {}
                try { playbackCtxRef.current?.close(); } catch (_) {}

                audioCtxRef.current = null;
                processorRef.current = null;
                sourceNodesRef.current = [];
                wsRef.current = null;
                playbackCtxRef.current = null;
                playbackQueueRef.current = [];
                isPlayingRef.current = false;
                setupDoneRef.current = false;
                setTranslatedStream(null);
            };

        } catch (err) {
            console.error('[Translate] Start error:', err);
            setError(`Tarjima boshlanmadi: ${err.message}`);
            setIsTranslating(false);
            setIsConnecting(false);
        }
    }, [sourceLang, targetLang, buildSystemInstruction, handleWsMessage]);

    // ── Tarjimani to'xtatish ──
    const stopTranslation = useCallback(() => {
        cleanupRef.current?.();
        cleanupRef.current = null;
        setIsTranslating(false);
        setIsConnecting(false);
        setSubtitleText('');
        setTranslatedStream(null);
    }, []);

    // ── Component unmount bo'lganda cleanup ──
    useEffect(() => {
        return () => {
            cleanupRef.current?.();
        };
    }, []);

    return {
        isTranslating,
        isConnecting,
        sourceLang,
        setSourceLang,
        targetLang,
        setTargetLang,
        subtitleText,
        showSubtitles,
        setShowSubtitles,
        startTranslation,
        stopTranslation,
        error,
        translatedStream,
    };
}
