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
    const [targetLang, setTargetLang] = useState('uz');
    const [subtitleText, setSubtitleText] = useState('');
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [error, setError] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

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
    const buildSystemInstruction = useCallback((lang) => {
        const fullName = langFullName[lang] || lang;
        return `You are a real-time speech-to-speech interpreter.
Your task:
1. Listen to the incoming continuous speech. The source language will mostly be Uzbek, Russian, or English, but could be other languages.
2. Instantly translate it into natural, fluent ${fullName}.
3. Output the translated response ONLY as synthesized ${fullName} speech.
4. Do not add any greetings, confirmations, or conversational filler of your own. Translate directly what is being said.
5. If the speaker pauses, wait silently until they continue. Do not hallucinate translations from background noise.
6. Maintain the tone and style of the original speech as closely as possible.`;
    }, []);

    // ── Audio playback (chiqish) ──
    const schedulePlayback = useCallback(() => {
        const ctx = playbackCtxRef.current;
        if (!ctx || ctx.state === 'closed') return;

        while (playbackQueueRef.current.length > 0) {
            const pcmData = playbackQueueRef.current.shift();
            const audioBuffer = ctx.createBuffer(1, pcmData.length, OUTPUT_SAMPLE_RATE);
            audioBuffer.getChannelData(0).set(pcmData);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            
            // Vaqt orqada qolib ketsa to'g'rilash (50ms buffer qo'shamiz)
            if (nextPlayTimeRef.current < ctx.currentTime) {
                nextPlayTimeRef.current = ctx.currentTime + 0.05;
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
    const startTranslation = useCallback((remoteStreams) => {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
            setError('VITE_GEMINI_API_KEY sozlanmagan. .env faylga API kalitini qo\'shing.');
            return;
        }

        if (!remoteStreams || Object.keys(remoteStreams).length === 0) {
            setError('Tarjima qilish uchun boshqa ishtirokchilar kerak.');
            return;
        }

        setIsConnecting(true);
        setError(null);
        setSubtitleText('');
        setupDoneRef.current = false;

        try {
            // 1. Playback AudioContext
            const PlayCtx = window.AudioContext || window.webkitAudioContext;
            playbackCtxRef.current = new PlayCtx({ sampleRate: OUTPUT_SAMPLE_RATE });
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
                                text: buildSystemInstruction(targetLang)
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
                if (isTranslating) {
                    setIsTranslating(false);
                }
                setIsConnecting(false);
            };

            // 3. Remote audio streams ni mix qilish va Gemini ga yuborish
            const RecordCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new RecordCtx({ sampleRate: INPUT_SAMPLE_RATE });
            audioCtxRef.current = audioCtx;

            // Barcha remote tracklarni bitta mono qilib birlashtirish (GainNode yordamida)
            const mixer = audioCtx.createGain();
            const sources = [];

            Object.values(remoteStreams).forEach(stream => {
                if (!stream || !stream.getAudioTracks || stream.getAudioTracks().length === 0) return;
                try {
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(mixer);
                    sources.push(source);
                } catch (err) {
                    console.warn('[Translate] Skipping stream:', err);
                }
            });

            sourceNodesRef.current = sources;

            if (sources.length === 0) {
                setError('Audio oqim topilmadi.');
                setIsConnecting(false);
                ws.close();
                audioCtx.close();
                return;
            }

            // ScriptProcessor — PCM chunklash (AudioWorklet o'rniga — keng qo'llab-quvvatlash uchun)
            const bufferSize = 4096;
            const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
            processorRef.current = processor;

            mixer.connect(processor);
            processor.connect(audioCtx.destination); // ScriptProcessor connect bo'lishi shart

            processor.onaudioprocess = (e) => {
                if (!setupDoneRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const inputData = e.inputBuffer.getChannelData(0);
                // Downsample qilish kerak emas — audioCtx allaqachon 16kHz da
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
            };

        } catch (err) {
            console.error('[Translate] Start error:', err);
            setError(`Tarjima boshlanmadi: ${err.message}`);
            setIsTranslating(false);
            setIsConnecting(false);
        }
    }, [targetLang, buildSystemInstruction, handleWsMessage]);

    // ── Tarjimani to'xtatish ──
    const stopTranslation = useCallback(() => {
        cleanupRef.current?.();
        cleanupRef.current = null;
        setIsTranslating(false);
        setIsConnecting(false);
        setSubtitleText('');
    }, []);

    // ── Til o'zgarganda qayta ulanish ──
    const changeTargetLang = useCallback((newLang) => {
        setTargetLang(newLang);
        // Agar tarjima faol bo'lsa — qayta ulanish kerak emas,
        // chunki keyingi startTranslation da yangi til ishlatiladi
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
        targetLang,
        setTargetLang: changeTargetLang,
        subtitleText,
        showSubtitles,
        setShowSubtitles,
        startTranslation,
        stopTranslation,
        error,
    };
}
