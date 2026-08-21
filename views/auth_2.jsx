return function AuthView() {
    const {
        React, authMode, setAuthMode, email, setEmail, password, setPassword,
        regName, setRegName, regPhone, setRegPhone, authLoading, resetCooldown,
        Icons, globalConfig, handleAuth, handleGoogleLogin
    } = React.useContext(AppContext);

    const { IconZap, IconMail, IconLock, IconUser, IconPhone, IconLoader } = Icons;

    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden bg-main text-main">
            <div className="w-full max-w-md p-6 relative z-10 animate-slide-down">
                <div className="clean-card p-8 md:p-10 relative bg-card backdrop-blur-xl border border-theme shadow-2xl">
                    <div className="flex flex-col items-center justify-center mb-8 text-center">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg mb-5">
                            <IconZap className="w-8 h-8 text-white"/>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-widest text-main flex items-center gap-2 mb-2">
                            {(globalConfig?.appName || 'VIPERCELL').substring(0, Math.floor((globalConfig?.appName || 'VIPERCELL').length/2))}
                            <span className="text-primary">{(globalConfig?.appName || 'VIPERCELL').substring(Math.floor((globalConfig?.appName || 'VIPERCELL').length/2))}</span>
                        </h2>
                        <p className="text-xs text-sub-theme font-medium px-4">Akses layanan top up premium.</p>
                    </div>
                    <div className="flex mb-6 bg-gray-100 dark:bg-navy-900 p-1 rounded-xl border border-theme">
                        <button onClick={()=>setAuthMode('login')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition ${authMode==='login' ? 'bg-white dark:bg-navy-800 shadow-sm text-primary' : 'text-sub-theme'}`}>Masuk</button>
                        <button onClick={()=>setAuthMode('register')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition ${authMode==='register' ? 'bg-white dark:bg-navy-800 shadow-sm text-primary' : 'text-sub-theme'}`}>Daftar</button>
                    </div>
                    
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="relative group">
                            <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme transition-colors" />
                            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm" placeholder="Alamat Email" />
                        </div>
                        
                        {authMode !== 'forgot' && (
                            <div className="relative group">
                                <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme transition-colors" />
                                <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} minLength="6" className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm" placeholder="Kata Sandi Akun" />
                            </div>
                        )}
                        
                        {authMode === 'register' && (
                            <>
                                <div className="relative group animate-slide-down">
                                    <IconUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme transition-colors" />
                                    <input type="text" required value={regName} onChange={(e)=>setRegName(e.target.value)} className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm" placeholder="Nama Lengkap" />
                                </div>
                                <div className="relative group animate-slide-down">
                                    <IconPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme transition-colors" />
                                    <input type="tel" required value={regPhone} onChange={(e)=>setRegPhone(e.target.value)} className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm" placeholder="Nomor Handphone (08...)" />
                                </div>
                            </>
                        )}
                        
                        <button type="submit" disabled={authLoading || (authMode === 'forgot' && resetCooldown > 0)} className={`w-full py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-2 text-sm uppercase tracking-widest mt-6 ${authMode === 'forgot' && resetCooldown > 0 ? 'bg-gray-300 dark:bg-gray-800 text-gray-500' : 'bg-primary text-white shadow-lg disabled:opacity-50 hover:scale-[1.02]'}`}>
                            {authLoading ? <IconLoader className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Masuk Sesi' : authMode === 'register' ? 'Buat Akun' : resetCooldown > 0 ? `Tunggu ${resetCooldown}s` : 'Kirim Link Reset')}
                        </button>
                    </form>

                    {(authMode === 'login' || authMode === 'register') && (
                        <>
                            <div className="relative my-6 flex items-center">
                                <div className="flex-grow border-t border-theme"></div>
                                <span className="flex-shrink-0 mx-4 text-sub-theme text-[9px] font-black uppercase tracking-widest">ATAU</span>
                                <div className="flex-grow border-t border-theme"></div>
                            </div>
                            <button onClick={handleGoogleLogin} disabled={authLoading} className="w-full py-4 rounded-2xl font-bold bg-white text-black hover:bg-gray-100 border border-gray-200 transition flex items-center justify-center gap-3 text-sm mb-4 shadow-sm hover:scale-[1.02]">
                                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                Lanjutkan dengan Google
                            </button>
                        </>
                    )}
                    <div className="mt-8 pt-6 border-t border-theme text-center text-xs font-bold text-sub-theme flex flex-col gap-3">
                        {authMode === 'login' ? (<button onClick={() => setAuthMode('forgot')} className="hover:text-primary transition">Lupa kata sandi?</button>) : (<button onClick={() => setAuthMode('login')} className="hover:text-primary transition">Kembali Login</button>)}
                    </div>
                </div>
            </div>
        </div>
    );
}