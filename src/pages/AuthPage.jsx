import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Video, Shield, Zap, Users } from 'lucide-react';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'SamMeet';

const txt = {
    uz: {
        loginTitle: 'Xush kelibsiz',
        loginSub: 'Hisobingizga kiring va davom eting',
        registerTitle: 'Hisob yarating',
        registerSub: 'Bir necha soniyada boshlang',
        heroTitle: 'Uchrashuvlar — oson va tez',
        heroSub: 'HD video, ekran ulashish va xavfsiz xonalar bilan hamkorlik qiling.',
        toLogin: 'Allaqachon hisobingiz bormi?',
        toLoginLink: 'Kirish',
        toRegister: 'Yangi foydalanuvchimisiz?',
        toRegisterLink: 'Hisob yarating',
        emailLabel: 'Email manzil',
        passwordLabel: 'Parol',
        nameLabel: "To'liq ism",
        remember: 'Eslab qol',
        forgot: 'Parolni unutdingizmi?',
        signIn: 'Kirish',
        signUp: "Ro'yxatdan o'tish",
        or: 'yoki',
        terms: "Foydalanish shartlariga roziman",
        termsLink: 'foydalanish shartlari',
        termsTitle: 'Foydalanish shartlari',
        termsClose: 'Yopish',
        termsAccept: 'Qabul qilaman',
        back: 'Bosh sahifa',
        f1: 'HD video', f2: 'Xavfsiz', f3: 'Tezkor',
        stat1: '10K+', stat1l: 'Foydalanuvchi',
        stat2: '99.9%', stat2l: 'Ishonchlilik',
        cancel: 'Bekor',
        forgotTitle: 'Parolni tiklash',
        forgotSub: 'Email kiriting, sizga havola yuboramiz.',
        sending: 'Yuborilmoqda...',
        sendLink: 'Havola yuborish',
        sentOk: 'Havola emailingizga yuborildi.',
        loginTab: 'Kirish',
        registerTab: "Ro'yxat",
    },
    ru: {
        loginTitle: 'С возвращением',
        loginSub: 'Войдите в свой аккаунт',
        registerTitle: 'Создайте аккаунт',
        registerSub: 'Начните за пару секунд',
        heroTitle: 'Встречи — просто и быстро',
        heroSub: 'HD видео, показ экрана и защищённые комнаты для совместной работы.',
        toLogin: 'Уже есть аккаунт?',
        toLoginLink: 'Войти',
        toRegister: 'Новый пользователь?',
        toRegisterLink: 'Создать аккаунт',
        emailLabel: 'Email',
        passwordLabel: 'Пароль',
        nameLabel: 'Полное имя',
        remember: 'Запомнить меня',
        forgot: 'Забыли пароль?',
        signIn: 'Войти',
        signUp: 'Зарегистрироваться',
        or: 'или',
        terms: 'Принимаю условия использования',
        termsLink: 'условия использования',
        termsTitle: 'Условия использования',
        termsClose: 'Закрыть',
        termsAccept: 'Принимаю',
        back: 'На главную',
        f1: 'HD видео', f2: 'Безопасно', f3: 'Быстро',
        stat1: '10K+', stat1l: 'Пользователей',
        stat2: '99.9%', stat2l: 'Надёжность',
        cancel: 'Отмена',
        forgotTitle: 'Сброс пароля',
        forgotSub: 'Введите email — пришлём ссылку.',
        sending: 'Отправка...',
        sendLink: 'Отправить ссылку',
        sentOk: 'Ссылка отправлена на ваш email.',
        loginTab: 'Войти',
        registerTab: 'Регистрация',
    },
    en: {
        loginTitle: 'Welcome back',
        loginSub: 'Sign in to your account to continue',
        registerTitle: 'Create your account',
        registerSub: 'Get started for free in seconds',
        heroTitle: 'Meetings made simple',
        heroSub: 'HD video, screen sharing and secure rooms for seamless collaboration.',
        toLogin: 'Already have an account?',
        toLoginLink: 'Sign in',
        toRegister: "Don't have an account?",
        toRegisterLink: 'Create one',
        emailLabel: 'Email address',
        passwordLabel: 'Password',
        nameLabel: 'Full name',
        remember: 'Remember me',
        forgot: 'Forgot password?',
        signIn: 'Sign in',
        signUp: 'Create account',
        or: 'or continue with',
        terms: 'I agree to the terms of service',
        termsLink: 'terms of service',
        termsTitle: 'Terms of Service',
        termsClose: 'Close',
        termsAccept: 'I Accept',
        back: 'Back to home',
        f1: 'HD Video', f2: 'Secure', f3: 'Fast',
        stat1: '10K+', stat1l: 'Users',
        stat2: '99.9%', stat2l: 'Uptime',
        cancel: 'Cancel',
        forgotTitle: 'Reset password',
        forgotSub: "Enter your email and we'll send a reset link.",
        sending: 'Sending...',
        sendLink: 'Send reset link',
        sentOk: 'Reset link sent to your inbox.',
        loginTab: 'Sign in',
        registerTab: 'Register',
    },
};

const Spinner = ({ size = 16 }) => (
    <svg style={{ width: size, height: size }} className="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

const termsData = {
    uz: [
        {
            title: '1. Umumiy qoidalar',
            body: `${APP_NAME} platformasidan foydalanish orqali siz ushbu shartlarni to'liq qabul qilasiz. Agar shartlar bilan rozi bo'lmasangiz, platformadan foydalanmang.`,
        },
        {
            title: '2. Hisob xavfsizligi',
            body: "Siz o'z hisobingiz xavfsizligini ta'minlash va parolingizni maxfiy saqlash uchun javobgarsiz. Hisobingiz orqali amalga oshirilgan barcha harakatlar uchun javobgarlik sizga yuklatiladi.",
        },
        {
            title: '3. Uchrashuvlar va kontent',
            body: "Platformada bo'g'inli, tahqirlovchi, noqonuniy yoki zararli kontent tarqatish taqiqlanadi. Uchrashuvlarda qatnashuvchilarning roziligisiz yozib olish ta'qiqlanadi.",
        },
        {
            title: '4. Maxfiylik',
            body: "Biz foydalanuvchilarning shaxsiy ma'lumotlarini uchinchi shaxslarga sotmaymiz. Ma'lumotlar faqat platformani yaxshilash va xizmat ko'rsatish maqsadida ishlatiladi.",
        },
        {
            title: '5. Taqiqlangan harakatlar',
            body: "Quyidagilar qat'iyan taqiqlanadi: spam yuborish, boshqa foydalanuvchilarga tahdid solish, platformani buzish yoki ruxsatsiz kirish, noqonuniy materiallar tarqatish.",
        },
        {
            title: '6. Hisobni bloklash',
            body: "Ushbu shartlarni buzgan foydalanuvchilarning hisobi ogohlantirishsiz bloklanishi mumkin. Biz xizmat shartlarini istalgan vaqtda o'zgartirish huquqini saqlaymiz.",
        },
        {
            title: '7. Aloqa',
            body: `Savollar yoki shikoyatlar bo'lsa, ${APP_NAME} administrator bilan bog'laning.`,
        },
    ],
    ru: [
        {
            title: '1. Общие положения',
            body: `Используя платформу ${APP_NAME}, вы полностью принимаете настоящие условия. Если вы не согласны с условиями, прекратите использование платформы.`,
        },
        {
            title: '2. Безопасность аккаунта',
            body: 'Вы несёте ответственность за безопасность своего аккаунта и конфиденциальность пароля. Все действия, выполненные через ваш аккаунт, являются вашей ответственностью.',
        },
        {
            title: '3. Встречи и контент',
            body: 'Запрещается распространение оскорбительного, незаконного или вредоносного контента. Запись встреч без согласия участников строго запрещена.',
        },
        {
            title: '4. Конфиденциальность',
            body: 'Мы не продаём личные данные пользователей третьим лицам. Данные используются исключительно для улучшения платформы и предоставления услуг.',
        },
        {
            title: '5. Запрещённые действия',
            body: 'Строго запрещено: рассылка спама, угрозы другим пользователям, попытки взлома или несанкционированного доступа, распространение незаконных материалов.',
        },
        {
            title: '6. Блокировка аккаунта',
            body: 'Аккаунт пользователя, нарушившего правила, может быть заблокирован без предупреждения. Мы оставляем за собой право изменять условия в любое время.',
        },
        {
            title: '7. Связь',
            body: `По вопросам и жалобам обращайтесь к администратору ${APP_NAME}.`,
        },
    ],
    en: [
        {
            title: '1. General Terms',
            body: `By using the ${APP_NAME} platform, you fully accept these terms. If you do not agree with the terms, please stop using the platform.`,
        },
        {
            title: '2. Account Security',
            body: 'You are responsible for maintaining the security of your account and keeping your password confidential. You are liable for all actions performed through your account.',
        },
        {
            title: '3. Meetings & Content',
            body: 'Distributing offensive, illegal, or harmful content is prohibited. Recording meetings without the consent of all participants is strictly forbidden.',
        },
        {
            title: '4. Privacy',
            body: "We do not sell users' personal data to third parties. Data is used solely to improve the platform and provide services.",
        },
        {
            title: '5. Prohibited Actions',
            body: 'Strictly prohibited: sending spam, threatening other users, attempting to hack or gain unauthorized access to the platform, distributing illegal materials.',
        },
        {
            title: '6. Account Suspension',
            body: "A user's account may be blocked without warning for violating these terms. We reserve the right to modify the terms at any time.",
        },
        {
            title: '7. Contact',
            body: `For questions or complaints, please contact the ${APP_NAME} administrator.`,
        },
    ],
};

const TermsContent = ({ lang, appName }) => {
    const sections = termsData[lang] || termsData.en;
    return (
        <>
            <p className="text-xs text-gray-400 dark:text-gray-500 pb-1">
                {lang === 'uz' ? `Oxirgi yangilanish: 2026 yil` : lang === 'ru' ? 'Последнее обновление: 2026' : 'Last updated: 2026'} · {appName}
            </p>
            {sections.map((s, i) => (
                <div key={i}>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1.5">{s.title}</h4>
                    <p className="text-gray-500 dark:text-gray-400">{s.body}</p>
                </div>
            ))}
        </>
    );
};

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { lang, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';
    const { login } = useAuth();
    const l = txt[lang] || txt.en;

    const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState('');

    useEffect(() => {
        const nextIsLogin = location.pathname !== '/register';
        setIsLogin(nextIsLogin);
        setError('');
    }, [location.pathname]);

    const toggle = () => {
        setError('');
        navigate(isLogin ? '/register' : '/login');
    };

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const { data } = await API.post('/api/users/login', { email, password });
                login(data);
                navigate(data.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
            } else {
                const { data } = await API.post('/api/users/register', { name, email, password });
                login(data);
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            const msg = err.response?.data?.details?.[0]?.message
                || err.response?.data?.message
                || (isLogin ? 'Login failed' : 'Registration failed');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const forgotSubmit = async (e) => {
        e.preventDefault();
        setForgotStatus('sending');
        try {
            await API.post('/api/users/forgot-password', { email: forgotEmail });
            setForgotStatus('success');
        } catch (err) {
            setForgotStatus(err.response?.data?.message || 'Failed');
        }
    };

    const handleGoogleLogin = async (token) => {
        setGoogleLoading(true);
        setError('');
        try {
            const { data } = await API.post('/api/users/google-auth', { token });
            login(data);
            navigate(data.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleLoginRef = useRef(handleGoogleLogin);
    useEffect(() => { handleGoogleLoginRef.current = handleGoogleLogin; });

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const hasGoogleAuth = googleClientId && googleClientId !== 'your_google_client_id_here';
    const gsiInitialized = useRef(false);

    const renderGsiButton = () => {
        if (!window.google) return;
        if (!gsiInitialized.current) {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: (response) => {
                    if (response.credential) handleGoogleLoginRef.current(response.credential);
                },
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            gsiInitialized.current = true;
        }
        const el = document.getElementById('google-signin-button');
        if (!el) return;
        el.innerHTML = '';
        const width = Math.round(el.getBoundingClientRect().width) || 320;
        window.google.accounts.id.renderButton(el, {
            type: 'standard',
            size: 'large',
            theme: isDark ? 'outline' : 'filled_blue',
            width: String(width),
            locale: lang === 'uz' ? 'en' : lang,
            text: isLogin ? 'signin_with' : 'signup_with',
        });
    };

    useEffect(() => {
        if (!hasGoogleAuth) return;
        if (window.google) { renderGsiButton(); return; }
        if (document.getElementById('gsi-script')) {
            document.getElementById('gsi-script').addEventListener('load', renderGsiButton, { once: true });
            return;
        }
        const script = document.createElement('script');
        script.id = 'gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGsiButton;
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (!hasGoogleAuth || !gsiInitialized.current) return;
        renderGsiButton();
    }, [lang, isDark, isLogin]);

    // Input field style — consistent light + dark
    const inp = [
        'w-full rounded-xl px-4 py-2.5 text-sm transition-all',
        'bg-gray-50 dark:bg-[#0d1117]',
        'border border-gray-200 dark:border-white/8',
        'text-gray-900 dark:text-white',
        'placeholder-gray-400 dark:placeholder-gray-600',
        'focus:outline-none focus:border-blue-500 dark:focus:border-blue-500',
        'focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/15',
    ].join(' ');

    const features = [
        { icon: <Video size={16} />, label: l.f1 },
        { icon: <Shield size={16} />, label: l.f2 },
        { icon: <Zap size={16} />, label: l.f3 },
    ];

    return (
        <div className="h-screen flex bg-white dark:bg-[#0b0e14] overflow-hidden">

            {/* ── Left panel ── */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-700 to-violet-800" />
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl" />
                <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-violet-400/15 rounded-full blur-2xl" />
                <div className="absolute inset-0 opacity-[0.035]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="inline-flex items-center gap-2 text-blue-100/75 hover:text-white transition-colors group">
                            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-sm font-medium">{l.back}</span>
                        </Link>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                            <div className="w-5 h-5 bg-white/25 rounded-md flex items-center justify-center">
                                <span className="text-white font-black text-[10px]">{APP_NAME[0]}</span>
                            </div>
                            <span className="text-sm font-bold text-white/90">{APP_NAME}</span>
                        </div>
                    </div>

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-8">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-xs font-semibold text-white/90 tracking-wide">Live & Secure</span>
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">{l.heroTitle}</h1>
                        <p className="text-base text-blue-100/70 leading-relaxed max-w-sm mb-10">{l.heroSub}</p>

                        <div className="flex flex-wrap gap-2.5 mb-12">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-full border border-white/10 transition-colors">
                                    <span className="text-blue-200">{f.icon}</span>
                                    <span className="text-sm font-semibold">{f.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-8">
                            {[
                                { val: l.stat1, label: l.stat1l, icon: <Users size={12} /> },
                                { val: l.stat2, label: l.stat2l, icon: <Zap size={12} /> },
                            ].map((s, i) => (
                                <div key={i}>
                                    <div className="text-2xl font-extrabold tracking-tight">{s.val}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-blue-300/60">{s.icon}</span>
                                        <span className="text-xs text-blue-200/60 font-medium">{s.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs text-blue-200/35 font-medium">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
                </div>
            </div>

            {/* ── Right panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-6 relative bg-gray-50 dark:bg-[#0b0e14] overflow-y-auto">

                {/* Mobile back */}
                <Link to="/" className="lg:hidden absolute top-5 left-5 inline-flex items-center gap-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <ArrowLeft size={15} />
                    <span className="text-xs font-semibold">{l.back}</span>
                </Link>

                {/* Card */}
                <div className="w-full max-w-[400px] bg-white dark:bg-[#111318] rounded-2xl shadow-xl shadow-gray-200/80 dark:shadow-black/40 border border-gray-100 dark:border-white/6 p-6">

                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="text-white font-black text-base">{APP_NAME[0]}</span>
                        </div>
                        <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{APP_NAME}</span>
                    </div>

                    {/* Heading */}
                    <div className="mb-5">
                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {isLogin ? l.loginTitle : l.registerTitle}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isLogin ? l.loginSub : l.registerSub}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-3.5">

                        {/* Name field — animated in/out, does NOT shift layout */}
                        <div
                            style={{ maxHeight: isLogin ? '0px' : '90px' }}
                            className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                        >
                            <div className="space-y-1.5 pb-0.5">
                                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{l.nameLabel}</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className={`${inp} pl-10`}
                                        required={!isLogin}
                                        tabIndex={isLogin ? -1 : 0}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{l.emailLabel}</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={`${inp} pl-10`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{l.passwordLabel}</label>
                                {isLogin && (
                                    <button type="button" onClick={() => setForgotOpen(true)}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 transition-colors">
                                        {l.forgot}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`${inp} pl-10 pr-11`}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded-md">
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember / Terms */}
                        {isLogin ? (
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-blue-600 flex-shrink-0" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">{l.remember}</span>
                            </label>
                        ) : (
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded accent-blue-600 flex-shrink-0" required />
                                <span className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
                                    {l.terms.split(l.termsLink)[0]}
                                    <button
                                        type="button"
                                        onClick={e => { e.preventDefault(); setTermsOpen(true); }}
                                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline underline-offset-2 transition-colors"
                                    >
                                        {l.termsLink}
                                    </button>
                                    {l.terms.split(l.termsLink)[1]}
                                </span>
                            </label>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-3.5 py-3 rounded-xl text-sm">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 hover:shadow-blue-600/35 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2">
                            {loading ? <><Spinner size={15} />{isLogin ? l.signIn : l.signUp}...</> : (isLogin ? l.signIn : l.signUp)}
                        </button>

                        {/* Google divider */}
                        {hasGoogleAuth && (
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">{l.or}</span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-white/8" />
                            </div>
                        )}

                        {/* Google button */}
                        {hasGoogleAuth && (
                            <div className="relative rounded-xl overflow-hidden bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/8" style={{ minHeight: '44px' }}>
                                <div id="google-signin-button" className="flex items-center justify-center w-full" />
                                {googleLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-[#161B22]/90">
                                        <Spinner size={18} />
                                    </div>
                                )}
                            </div>
                        )}
                    </form>

                    {/* Bottom toggle */}
                    <p className="text-center mt-5 text-sm text-gray-500 dark:text-gray-400">
                        {isLogin ? l.toRegister : l.toLogin}{' '}
                        <button type="button" onClick={toggle}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 transition-colors">
                            {isLogin ? l.toRegisterLink : l.toLoginLink}
                        </button>
                    </p>
                </div>
            </div>

            {/* ── Forgot password modal ── */}
            {forgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#161B22] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/12 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Mail size={18} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">{l.forgotTitle}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{l.forgotSub}</p>
                            </div>
                        </div>

                        {forgotStatus === 'success' ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20 p-3.5 rounded-xl">
                                    <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{l.sentOk}</p>
                                </div>
                                <button onClick={() => { setForgotOpen(false); setForgotStatus(''); }}
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                    {l.cancel}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={forgotSubmit} className="space-y-3">
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input type="email" placeholder="you@example.com" value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)} className={`${inp} pl-10`} required />
                                </div>
                                {forgotStatus && forgotStatus !== 'sending' && (
                                    <p className="text-red-500 dark:text-red-400 text-xs font-medium">{forgotStatus}</p>
                                )}
                                <div className="flex gap-2.5 pt-1">
                                    <button type="button" onClick={() => { setForgotOpen(false); setForgotStatus(''); }}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                        {l.cancel}
                                    </button>
                                    <button type="submit" disabled={forgotStatus === 'sending'}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                                        {forgotStatus === 'sending' ? <><Spinner size={13} />{l.sending}</> : l.sendLink}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
            {/* ── Terms of Service modal ── */}
            {termsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#161B22] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col max-h-[85vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/15 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">{l.termsTitle}</h3>
                            </div>
                            <button onClick={() => setTermsOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            <TermsContent lang={lang} appName={APP_NAME} />
                        </div>

                        {/* Footer */}
                        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-white/8 shrink-0">
                            <button onClick={() => setTermsOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                {l.termsClose}
                            </button>
                            <button onClick={() => setTermsOpen(false)}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
                                {l.termsAccept}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
