import React, { useRef, useState, useEffect, useContext } from 'react';
import { Paperclip, Send, X, Pencil, Trash2, CheckCheck, MessageSquare, FileText } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

// ── Avatar color from username hash ────────────────────────────────────────────
const PALETTE = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
    '#ef4444', '#06b6d4', '#6366f1', '#ec4899',
];
const getColor = (name = '') => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return PALETTE[Math.abs(h) % PALETTE.length];
};

const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

// ── Avatar ─────────────────────────────────────────────────────────────────────
const Avatar = ({ name }) => {
    const color = getColor(name);
    return (
        <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0 select-none shadow-sm"
            style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}
        >
            {getInitials(name)}
        </div>
    );
};

// ── Date separator ─────────────────────────────────────────────────────────────
const DateBadge = ({ label }) => (
    <div className="flex items-center gap-2 my-5 px-2 select-none">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest bg-white dark:bg-transparent px-1">
            {label}
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.06]" />
    </div>
);

// ── Message Bubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn, prevMsg, onEdit, onDelete, canAct }) => {
    const { t } = useContext(ThemeLanguageContext);
    const [hovered, setHovered] = useState(false);
    const senderChanged = !prevMsg || prevMsg.userName !== msg.userName || prevMsg.type === 'date';

    return (
        <div
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${senderChanged ? 'mt-4' : 'mt-1'}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Sender name */}
            {!isOwn && senderChanged && (
                <div className="flex items-center gap-2 mb-1 ml-9">
                    <span className="text-[11px] font-bold select-none" style={{ color: getColor(msg.userName) }}>
                        {msg.userName}
                    </span>
                </div>
            )}

            <div className={`flex items-end gap-2 max-w-[82%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className="w-7 shrink-0 mb-0.5">
                    {!isOwn && senderChanged && <Avatar name={msg.userName} />}
                </div>

                {/* Actions */}
                {isOwn && canAct && !msg.file && (
                    <div className={`flex items-center gap-0.5 self-end mb-1 transition-all duration-150
                        ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <button
                            onClick={() => onEdit(msg._id, msg.text)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title={t('chat_edit')}
                        >
                            <Pencil size={11} />
                        </button>
                        <button
                            onClick={() => onDelete(msg._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title={t('chat_delete')}
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                )}

                {/* Bubble */}
                {isOwn ? (
                    <div className="relative px-3.5 py-2 text-sm leading-relaxed rounded-[18px] rounded-tr-[5px] shadow-md"
                        style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff' }}>
                        {msg.file ? <FileMsgContent msg={msg} isOwn /> : (
                            <span className="break-words whitespace-pre-wrap">{msg.text}</span>
                        )}
                        <TimeRow isOwn time={msg.time} />
                    </div>
                ) : (
                    <div className="relative px-3.5 py-2 text-sm leading-relaxed rounded-[18px] rounded-tl-[5px] shadow-sm
                        bg-white dark:bg-[#1e2836] border border-gray-200 dark:border-white/[0.07]
                        text-gray-800 dark:text-gray-100">
                        {msg.file ? <FileMsgContent msg={msg} isOwn={false} /> : (
                            <span className="break-words whitespace-pre-wrap">{msg.text}</span>
                        )}
                        <TimeRow isOwn={false} time={msg.time} />
                    </div>
                )}
            </div>
        </div>
    );
};

const TimeRow = ({ isOwn, time }) => (
    <div className={`flex items-center justify-end gap-1 mt-1 select-none`}>
        <span className="text-[9px] font-medium" style={{ opacity: 0.6 }}>{time}</span>
        {isOwn && <CheckCheck size={10} style={{ opacity: 0.7 }} />}
    </div>
);

const FileMsgContent = ({ msg, isOwn }) => {
    const { t } = useContext(ThemeLanguageContext);
    return (
        <div className="flex items-center gap-3 py-0.5 min-w-[160px]">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-500/15'}`}>
                <FileText size={16} className={isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate mb-1">{msg.file.name}</p>
                <a
                    href={msg.file.data}
                    download={msg.file.name}
                    className={`text-[10px] font-medium underline underline-offset-2 transition-colors
                        ${isOwn ? 'text-blue-200 hover:text-white' : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'}`}
                >
                    {t('chat_download')}
                </a>
            </div>
        </div>
    );
};

// ── ChatPanel ─────────────────────────────────────────────────────────────────
const ChatPanel = ({
    messages, newMessage, setNewMessage, sendMessage,
    editingMessageId, setEditingMessageId, handleFileUpload,
    deleteChatMessage, startEditingMessage, onClose,
    roomUsers, currentUserName, canChat,
}) => {
    const { t } = useContext(ThemeLanguageContext);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const bodyRef = useRef(null);
    const [atBottom, setAtBottom] = useState(true);

    const grouped = messages.reduce((acc, msg, idx) => {
        if (idx === 0) acc.push({ type: 'date', label: t('chat_today') });
        acc.push({ type: 'msg', ...msg });
        return acc;
    }, []);

    useEffect(() => {
        if (atBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, atBottom]);

    const handleScroll = (e) => {
        const el = e.currentTarget;
        setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setNewMessage('');
        inputRef.current?.focus();
    };

    const onlineCount = roomUsers?.length ?? 0;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0b0f17] text-gray-800 dark:text-gray-100 select-text">

            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-white dark:bg-[#0f1420] border-b border-gray-200 dark:border-white/[0.07] shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 flex items-center justify-center">
                        <MessageSquare size={15} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{t('ctl_chat')}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{onlineCount} {t('online') || 'online'}</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* ── Messages body ── */}
            <div
                ref={bodyRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-3 flex flex-col custom-scrollbar"
            >
                {grouped.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 select-none">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/15 flex items-center justify-center mb-4 shadow-sm">
                            <MessageSquare size={24} className="text-blue-400 dark:text-blue-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm font-bold">{t('chat_empty_title')}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1.5 leading-relaxed max-w-[180px]">{t('chat_empty_sub')}</p>
                    </div>
                ) : (
                    grouped.map((item, idx) => {
                        if (item.type === 'date') return <DateBadge key={`d-${idx}`} label={item.label} />;
                        const prevItem = grouped.slice(0, idx).reverse().find(i => i.type === 'msg');
                        return (
                            <MessageBubble
                                key={item._id || idx}
                                msg={item}
                                prevMsg={prevItem}
                                isOwn={item.userName === currentUserName}
                                canAct={item.userName === currentUserName}
                                onEdit={startEditingMessage}
                                onDelete={deleteChatMessage}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* ── Edit banner ── */}
            {editingMessageId && (
                <div className="mx-3 mb-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-2.5 shrink-0">
                    <div className="w-0.5 h-6 bg-amber-500 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            {t('chat_edit') || 'Tahrirlash'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{newMessage}</p>
                    </div>
                    <button
                        onClick={handleCancelEdit}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                    >
                        <X size={13} />
                    </button>
                </div>
            )}

            {/* ── Input footer ── */}
            <div className="shrink-0 bg-white dark:bg-[#0f1420] border-t border-gray-200 dark:border-white/[0.07] px-3 py-3">
                {canChat ? (
                    <>
                        <form onSubmit={sendMessage} className="flex items-center gap-2">
                            {/* Attach */}
                            <label className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer shrink-0"
                                title={t('chat_attach')}>
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                                <Paperclip size={16} />
                            </label>

                            {/* Input pill */}
                            <div className="flex-1 flex items-center bg-gray-100 dark:bg-[#1a2235] border border-gray-200 dark:border-white/[0.07] rounded-2xl px-4 py-2.5 gap-2 transition-all focus-within:border-blue-400 dark:focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder={editingMessageId ? t('chat_input_edit_placeholder') : t('chat_input_placeholder')}
                                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none"
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
                                />
                            </div>

                            {/* Send */}
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                title={t('chat_send')}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all duration-150 active:scale-90
                                    ${newMessage.trim()
                                        ? editingMessageId
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={15} />
                            </button>
                        </form>

                        {/* Hint */}
                        {!editingMessageId && (
                            <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-2 select-none">
                                {t('chat_send_hint')}
                            </p>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            {t('guest_readonly') || "Mehmonlar faqat o'qishi mumkin"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
