import React from 'react';

const WaitingToasts = ({ toasts, onAdmit, onDeny }) => {
    if (!toasts.length) return null;
    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-[280px]">
            {toasts.map(item => (
                <div key={item.socketId}
                    className="animate-in slide-in-from-right-4 fade-in duration-300 rounded-2xl p-3 shadow-2xl border border-amber-500/30 bg-white dark:bg-[#1e222d]">
                    <div className="flex items-start gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm">✋</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{item.userName || 'Foydalanuvchi'}</p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Kirishni so'ramoqda</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onAdmit(item.socketId)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors">
                            Qabul
                        </button>
                        <button onClick={() => onDeny(item.socketId)}
                            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors bg-gray-100 text-gray-600 hover:bg-red-500/15 hover:text-red-500 dark:bg-white/8 dark:text-gray-300 dark:hover:bg-red-500/20 dark:hover:text-red-400">
                            Rad
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WaitingToasts;
