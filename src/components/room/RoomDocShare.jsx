import React, { useRef, useState, useEffect, useContext, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Play, Square, Upload } from 'lucide-react';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Canvas o'lchami — 16:9, taqdimot uchun yetarli aniqlik
const CW = 1600;
const CH = 900;
const ACCEPT = '.pdf,.txt,.docx,.pptx';

// Matnni canvas kengligiga sig'adigan qatorlarga bo'lish
function wrapText(ctx, text, maxWidth) {
    const out = [];
    for (const rawLine of String(text).split(/\r?\n/)) {
        if (!rawLine.trim()) { out.push(''); continue; }
        let line = '';
        for (const word of rawLine.split(/\s+/)) {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = word; }
            else line = test;
        }
        if (line) out.push(line);
    }
    return out;
}

const RoomDocShare = ({ open, onClose, isSharingScreen, onStart, onStop }) => {
    const { lang, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';
    const canvasRef = useRef(null);
    const pdfDocRef = useRef(null);

    const [doc, setDoc] = useState(null);       // { type: 'pdf'|'text'|'slides', pageCount, textPages?, slides? }
    const [pageNum, setPageNum] = useState(1);
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [presenting, setPresenting] = useState(false); // shu komponent boshlagan demonstratsiya

    const L = (uz, ru, en) => (lang === 'uz' ? uz : lang === 'ru' ? ru : en);

    // Tashqaridan to'xtatilsa (force-stop, leave) holatni tozalaymiz
    useEffect(() => {
        if (!isSharingScreen && presenting) setPresenting(false);
    }, [isSharingScreen, presenting]);

    // ── Sahifani canvas'ga chizish ─────────────────────────────────────────────
    const renderPage = useCallback(async (n) => {
        const canvas = canvasRef.current;
        if (!canvas || !doc) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1d26';
        ctx.fillRect(0, 0, CW, CH);

        if (doc.type === 'pdf') {
            try {
                const page = await pdfDocRef.current.getPage(n);
                const vp1 = page.getViewport({ scale: 1 });
                const scale = Math.min(CW / vp1.width, CH / vp1.height);
                const vp = page.getViewport({ scale });
                const off = document.createElement('canvas');
                off.width = vp.width; off.height = vp.height;
                await page.render({ canvasContext: off.getContext('2d'), viewport: vp }).promise;
                ctx.drawImage(off, (CW - vp.width) / 2, (CH - vp.height) / 2);
            } catch (e) { console.error('PDF render:', e); }
        } else if (doc.type === 'text') {
            // Oq sahifa + matn
            const m = 100;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(m / 2, 20, CW - m, CH - 40);
            ctx.fillStyle = '#111827';
            ctx.font = '26px Inter, Arial, sans-serif';
            ctx.textBaseline = 'top';
            const lines = doc.textPages[n - 1] || [];
            let y = 60;
            for (const line of lines) { ctx.fillText(line, m, y, CW - 2 * m); y += 38; }
        } else if (doc.type === 'slides') {
            const slide = doc.slides[n - 1] || [];
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(40, 30, CW - 80, CH - 60);
            ctx.textBaseline = 'top';
            let y = 90;
            slide.forEach((text, i) => {
                if (i === 0) {
                    ctx.fillStyle = '#0E71EB';
                    ctx.font = 'bold 48px Inter, Arial, sans-serif';
                    for (const l of wrapText(ctx, text, CW - 280)) { ctx.fillText(l, 140, y); y += 62; }
                    y += 30;
                } else {
                    ctx.fillStyle = '#1f2937';
                    ctx.font = '32px Inter, Arial, sans-serif';
                    for (const l of wrapText(ctx, text, CW - 360)) {
                        ctx.fillText(l === '' ? '' : '•  ' + l, 180, y); y += 46;
                    }
                }
            });
        }

        // Pastda sahifa raqami
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(CW - 170, CH - 56, 150, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${n} / ${doc.pageCount}`, CW - 150, CH - 38);
    }, [doc]);

    useEffect(() => { if (doc) renderPage(pageNum); }, [doc, pageNum, renderPage]);

    // ── Fayl o'qish ────────────────────────────────────────────────────────────
    const paginateText = (text) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.font = '26px Inter, Arial, sans-serif';
        const lines = wrapText(ctx, text, CW - 200);
        const perPage = 20;
        const pages = [];
        for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
        return pages.length ? pages : [['(bo\'sh hujjat)']];
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError(null); setLoading(true); setDoc(null); setPageNum(1); setFileName(file.name);
        const ext = file.name.split('.').pop().toLowerCase();
        try {
            const buf = await file.arrayBuffer();
            if (ext === 'pdf') {
                const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
                pdfDocRef.current = pdf;
                setDoc({ type: 'pdf', pageCount: pdf.numPages });
            } else if (ext === 'txt') {
                const text = new TextDecoder('utf-8').decode(buf);
                const pages = paginateText(text);
                setDoc({ type: 'text', pageCount: pages.length, textPages: pages });
            } else if (ext === 'docx') {
                const result = await mammoth.extractRawText({ arrayBuffer: buf });
                const pages = paginateText(result.value || '');
                setDoc({ type: 'text', pageCount: pages.length, textPages: pages });
            } else if (ext === 'pptx') {
                const zip = await JSZip.loadAsync(buf);
                const slideFiles = Object.keys(zip.files)
                    .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
                    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
                const slides = [];
                for (const f of slideFiles) {
                    const xml = await zip.files[f].async('string');
                    // Har bir matn bloki (<a:p>) alohida qator bo'lsin
                    const paras = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map(p =>
                        [...p[1].matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]).join('')
                    ).filter(s => s.trim());
                    slides.push(paras.length ? paras : ['(matn yo\'q)']);
                }
                if (!slides.length) throw new Error('no slides');
                setDoc({ type: 'slides', pageCount: slides.length, slides });
            } else {
                throw new Error('unsupported');
            }
        } catch (err) {
            console.error('Doc parse:', err);
            setError(L("Faylni o'qib bo'lmadi. PDF, TXT, DOCX yoki PPTX yuklang.",
                'Не удалось прочитать файл. Загрузите PDF, TXT, DOCX или PPTX.',
                'Could not read the file. Upload PDF, TXT, DOCX or PPTX.'));
        } finally {
            setLoading(false);
        }
    };

    // ── Boshlash / to'xtatish ──────────────────────────────────────────────────
    const startPresenting = () => {
        if (!doc || !canvasRef.current) return;
        const stream = canvasRef.current.captureStream(10); // 10fps — hujjat uchun yetarli
        const ok = onStart(stream);
        if (ok) { setPresenting(true); onClose(); }
        else stream.getTracks().forEach(t => t.stop());
    };

    const stopPresenting = () => { setPresenting(false); onStop(); };

    const prev = () => setPageNum(p => Math.max(1, p - 1));
    const next = () => setPageNum(p => Math.min(doc?.pageCount || 1, p + 1));

    // Taqdimot paytida ←/→ tugmalari bilan varaqlash
    useEffect(() => {
        if (!presenting) return;
        const onKey = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [presenting, doc]);

    return (
        <>
            {/* Canvas doim DOM'da turadi — captureStream undan o'qiydi */}
            <canvas ref={canvasRef} width={CW} height={CH} className="hidden" />

            {/* ── Fayl tanlash / preview modal ── */}
            {open && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-5 ${isDark ? 'bg-[#161b26] border border-white/10' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <FileText size={16} className="text-blue-500" />
                                {L('Fayl taqdimoti', 'Презентация файла', 'Present a file')}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
                        </div>

                        <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer transition-colors
                            ${isDark ? 'border-white/15 hover:border-blue-500/50 text-gray-400' : 'border-gray-300 hover:border-blue-400 text-gray-500'}`}>
                            <Upload size={22} />
                            <span className="text-xs font-semibold">
                                {fileName || L('PDF, Word, TXT yoki PPTX tanlang', 'Выберите PDF, Word, TXT или PPTX', 'Choose PDF, Word, TXT or PPTX')}
                            </span>
                            <input type="file" accept={ACCEPT} onChange={handleFile} className="hidden" />
                        </label>

                        {loading && <p className="mt-3 text-xs text-blue-400 animate-pulse">{L('Yuklanmoqda…', 'Загрузка…', 'Loading…')}</p>}
                        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

                        {doc && !loading && (
                            <>
                                {/* Jonli preview — canvas'dan nusxa */}
                                <DocPreview canvasRef={canvasRef} pageNum={pageNum} doc={doc} />
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button onClick={prev} disabled={pageNum <= 1}
                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"><ChevronLeft size={15} /></button>
                                        <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{pageNum} / {doc.pageCount}</span>
                                        <button onClick={next} disabled={pageNum >= doc.pageCount}
                                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"><ChevronRight size={15} /></button>
                                    </div>
                                    <button onClick={startPresenting}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg">
                                        <Play size={14} />
                                        {L('Taqdimotni boshlash', 'Начать презентацию', 'Start presenting')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Taqdimot paytidagi suzuvchi boshqaruv paneli ── */}
            {presenting && isSharingScreen && (
                <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[65] flex items-center gap-2 px-3 py-2 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-3 duration-300
                    ${isDark ? 'bg-[#161b26]/95 border border-white/10' : 'bg-white/95 border border-gray-200'} backdrop-blur-md`}>
                    <FileText size={14} className="text-blue-500 shrink-0" />
                    <span className={`text-[11px] font-semibold max-w-[140px] truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{fileName}</span>
                    <button onClick={prev} disabled={pageNum <= 1}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"><ChevronLeft size={14} /></button>
                    <span className={`text-xs font-bold min-w-[52px] text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{pageNum} / {doc?.pageCount}</span>
                    <button onClick={next} disabled={pageNum >= (doc?.pageCount || 1)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"><ChevronRight size={14} /></button>
                    <button onClick={stopPresenting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-all">
                        <Square size={12} />
                        {L("To'xtatish", 'Стоп', 'Stop')}
                    </button>
                </div>
            )}
        </>
    );
};

// Modal ichida jonli preview — asosiy canvas'dan kichik nusxa
const DocPreview = ({ canvasRef, pageNum, doc }) => {
    const ref = useRef(null);
    useEffect(() => {
        let raf;
        const copy = () => {
            if (ref.current && canvasRef.current) {
                const ctx = ref.current.getContext('2d');
                ctx.drawImage(canvasRef.current, 0, 0, ref.current.width, ref.current.height);
            }
            raf = requestAnimationFrame(copy);
        };
        raf = requestAnimationFrame(copy);
        return () => cancelAnimationFrame(raf);
    }, [canvasRef, pageNum, doc]);
    return <canvas ref={ref} width={640} height={360} className="mt-4 w-full rounded-xl border border-white/10" />;
};

export default RoomDocShare;
