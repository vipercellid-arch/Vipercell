return function ProfileView() {
    const {
        React, currentUserData, authUser, profileAvatar, profileName, setProfileName,
        profilePhone, setProfilePhone, activeProfileTab, setActiveProfileTab,
        showPasswordForm, setShowPasswordForm, currentPassword, setCurrentPassword,
        newPassword, setNewPassword, confirmNewPassword, setConfirmNewPassword,
        setChangePinModalOpen, setPinModalState, resellerStoreName, setResellerStoreName,
        resellerPhone, setResellerPhone, formatRupiah, Icons, isAdmin, userOrders,
        availablePayments, generateOrderID, db, safeAppId, addToast, sysLoading,
        handleUpdateProfile, handleChangePassword, handleAvatarUpload, handleApplyReseller, setDoc
    } = React.useContext(AppContext);

    const { IconUser, IconCamera, IconCheckCircle, IconTrendingUp, IconLock, IconEdit, IconWallet, IconBanknote, IconCheck, IconHistory, IconLoader, IconChevronLeft } = Icons;

    const calculateVIPLevel = (txCount) => { 
        if (txCount >= 100) return { level: 'Platinum', badge: '💎', color: 'text-cyan-400 border-cyan-500 bg-cyan-500/10', cashback: 0.05 }; 
        if (txCount >= 30) return { level: 'Gold', badge: '🥇', color: 'text-yellow-400 border-yellow-500 bg-yellow-500/10', cashback: 0.03 }; 
        if (txCount >= 10) return { level: 'Silver', badge: '🥈', color: 'text-gray-300 border-gray-400 bg-gray-500/20', cashback: 0.015 }; 
        return { level: 'Bronze', badge: '🥉', color: 'text-primary border-primary bg-primary-light', cashback: 0 }; 
    }
    const userTotalTx = (userOrders||[]).filter(o => o.status === 'Sukses' && o.gameId !== 'TOPUP_SALDO').length || 0; 
    const userVipData = calculateVIPLevel(userTotalTx);

    // Filter availablePayments yang id-nya bukan 'saldo'
    const topupPayments = (availablePayments||[]).filter(p => p.id !== 'saldo');

    const handleSetPin = async (newPin) => { 
        try { 
            await setDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'members', authUser.uid), { pin: window.btoa(newPin) }, { merge: true }); 
            addToast('PIN diatur.', 'success'); 
            setPinModalState({ isOpen: false, mode: 'setup', expectedPin: '', onSuccess: null }); 
            setChangePinModalOpen(false); 
        } catch(e) { addToast('Gagal', 'error'); } 
    };

    const submitTopUpSaldo = () => {
        const amt = document.getElementById('topupAmountInput').value;
        const method = document.getElementById('topupPaymentMethod').value;
        if(!amt || amt < 10000) return addToast('Minimal pengisian Rp 10.000', 'warning');
        
        const orderId = generateOrderID();
        setDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'global_orders', orderId), { 
            id: orderId, gameId: 'TOPUP_SALDO', gameName: 'Isi Saldo E-Wallet', nominalName: 'Top Up Saldo', targetUserId: authUser.email, priceTotal: Number(amt), paymentMethod: method, status: 'Pending', userEmail: authUser.email, createdAt: new Date().toISOString(), itemId: 'topup_saldo' 
        }).then(()=>{ 
            addToast('Tagihan berhasil dibuat! Silakan lihat dan selesaikan di tabel bawah.', 'success'); 
            document.getElementById('topupAmountInput').value = ''; 
        });
    }

    return (
        <div className="animate-slide-down pb-10 max-w-5xl mx-auto pt-4 w-full relative z-10">
            <div className="clean-card rounded-[3rem] p-6 md:p-10 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10 border-b border-theme pb-8">
                    <div className="relative group shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-navy-700 dark:to-navy-950 p-1 shadow-xl">
                        <div className="w-full h-full bg-card rounded-full flex items-center justify-center overflow-hidden relative border border-theme">
                            {profileAvatar ? <img src={profileAvatar} className="w-full h-full object-cover" /> : <span className="text-5xl font-black text-sub-theme">{currentUserData?.name?.charAt(0).toUpperCase() || (authUser.email || '').charAt(0).toUpperCase() || 'U'}</span>}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-sm"><IconCamera className="w-8 h-8 text-white"/></div>
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        </div>
                    </div>
                    </div>
                    <div className="text-center md:text-left flex-1 min-w-0">
                    <h2 className="text-3xl md:text-4xl font-black leading-tight text-main drop-shadow-sm flex items-center justify-center md:justify-start gap-3 flex-wrap">
                        <span className="truncate">{currentUserData?.name || 'Member VIP'}</span>
                        {isAdmin && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-md font-bold uppercase shadow-sm border border-red-400 shrink-0">Admin</span>}
                        {currentUserData?.isReseller && <span className="text-xs bg-primary text-white px-2 py-1 rounded-md font-bold uppercase shadow-sm border border-primary/50 shrink-0">Reseller Aktif</span>}
                    </h2>
                    <p className="text-sm text-sub-theme font-mono mt-2 drop-shadow-sm truncate">{authUser.email}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
                        <span className={`text-[10px] px-3 py-1.5 rounded-lg border font-black uppercase flex items-center gap-1.5 shadow-sm ${currentUserData?.isPhoneVerified ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}><IconCheckCircle className="w-3 h-3"/> {currentUserData?.isPhoneVerified ? 'WA Terverifikasi' : 'WA Belum Verifikasi'}</span>
                        <span className={`text-[10px] px-3 py-1.5 rounded-lg border font-black uppercase flex items-center gap-1.5 shadow-sm ${userVipData.color}`}>{userVipData.badge} {userVipData.level} Member Rank</span>
                    </div>
                    </div>
                </div>

                <div className="flex border-b border-theme bg-gray-50 dark:bg-navy-900/50 rounded-2xl p-1.5 mb-8 shadow-inner overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveProfileTab('security')} className={`flex-1 min-w-[120px] py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeProfileTab === 'security' ? 'bg-card shadow-sm text-primary' : 'text-sub-theme hover:bg-gray-200 dark:hover:bg-navy-800'}`}>Keamanan Akun</button>
                    <button onClick={() => setActiveProfileTab('wallet')} className={`flex-1 min-w-[120px] py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeProfileTab === 'wallet' ? 'bg-card shadow-sm text-blue-600 dark:text-blue-500' : 'text-sub-theme hover:bg-gray-200 dark:hover:bg-navy-800'}`}>Dompet Saldo</button>
                    <button onClick={() => setActiveProfileTab('reseller')} className={`flex-1 min-w-[120px] py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeProfileTab === 'reseller' ? 'bg-card shadow-sm text-orange-600 dark:text-orange-500' : 'text-sub-theme hover:bg-gray-200 dark:hover:bg-navy-800'}`}>Reseller</button>
                </div>

                <div className="animate-slide-down">
                    {/* TAB 1: KEAMANAN AKUN */}
                    {activeProfileTab === 'security' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-gray-50 dark:bg-navy-900/30 p-8 rounded-[2.5rem] border border-theme shadow-inner flex flex-col h-full">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-main"><div className="bg-primary-light p-2 rounded-xl text-primary shadow-sm border border-primary/20"><IconUser className="w-5 h-5"/></div> Data Personal Utama</h3>
                            <form onSubmit={(e)=>{e.preventDefault(); handleUpdateProfile(e);}} className="space-y-5 flex-1 flex flex-col">
                                <div className="relative group"><IconUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme" /><input type="text" required value={profileName} onChange={(e)=>setProfileName(e.target.value)} className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary text-sm shadow-sm transition" placeholder="Nama Lengkap" /></div>
                                <div className="relative group">
                                    <IconPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme" />
                                    <input type="tel" required value={profilePhone} onChange={(e)=> { const val = e.target.value; if(val && !/^\d*$/.test(val)) return; setProfilePhone(val); }} className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary text-sm shadow-sm transition" placeholder="Nomor Handphone Unik" />
                                    <p className="text-[9px] mt-2 text-sub-theme">*(Perubahan Nomor HP akan membutuhkan verifikasi OTP WhatsApp).</p>
                                </div>
                                <div className="mt-auto pt-4">
                                    <button type="submit" disabled={!profilePhone || profilePhone.length < 10} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100">Simpan Perubahan Data</button>
                                </div>
                            </form>
                            </div>

                            <div className="bg-gray-50 dark:bg-navy-900/30 p-8 rounded-[2.5rem] border border-theme shadow-inner flex flex-col h-full">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-main"><div className="bg-primary-light p-2 rounded-xl text-primary shadow-sm border border-primary/20"><IconLock className="w-5 h-5"/></div> Kunci Keamanan</h3>

                            <div className="mb-6 pb-6 border-b border-theme flex items-center justify-between">
                                <div><h4 className="text-sm font-black text-main mb-1">PIN Transaksi</h4><p className="text-[10px] text-sub-theme font-medium">Lindungi proses checkout.</p></div>
                                {currentUserData?.pin ? ( <button onClick={()=>setChangePinModalOpen(true)} className="bg-primary-light text-primary px-5 py-2.5 rounded-xl text-xs font-black border border-primary/30 hover:bg-primary hover:text-white transition shadow-sm">Ganti PIN</button> ) : ( <button onClick={()=>setPinModalState({isOpen:true, mode:'setup', expectedPin: '', onSuccess: handleSetPin})} className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-primary-hover transition">Buat PIN</button> )}
                            </div>

                            {!showPasswordForm ? (
                                <div className="flex flex-col justify-center mt-auto">
                                    <h4 className="text-sm font-black text-main mb-2">Ubah Kata Sandi Akun</h4>
                                    <button onClick={()=>setShowPasswordForm(true)} className="bg-white dark:bg-navy-800 border border-theme text-main py-3.5 px-5 rounded-2xl font-black text-xs uppercase w-full flex items-center justify-center gap-2 shadow-sm hover:bg-gray-100 dark:hover:bg-navy-700 transition"><IconEdit className="w-4 h-4"/> Buka Form Sandi</button>
                                </div>
                                ) : (
                                <form onSubmit={(e)=>{e.preventDefault(); handleChangePassword(e);}} className="space-y-4 animate-slide-down mt-auto">
                                    <div className="relative"><IconLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sub-theme" /><input type="password" required value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} className="w-full input-theme rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary transition shadow-sm" placeholder="Kata Sandi Saat Ini" /></div>
                                    <div className="relative"><IconLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sub-theme" /><input type="password" required value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} minLength="6" className="w-full input-theme rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary transition shadow-sm" placeholder="Kata Sandi Baru (Min. 6)" /></div>
                                    <div className="relative"><IconCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sub-theme" /><input type="password" required value={confirmNewPassword} onChange={(e)=>setConfirmNewPassword(e.target.value)} minLength="6" className="w-full input-theme rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary transition shadow-sm" placeholder="Ulangi Kata Sandi Baru" /></div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={()=>{setShowPasswordForm(false);}} className="flex-1 bg-gray-200 dark:bg-navy-800 text-main border border-theme py-3.5 rounded-xl font-bold text-[10px] uppercase hover:bg-gray-300 dark:hover:bg-navy-700 transition">Batal</button>
                                        <button type="submit" className="flex-[2] bg-primary text-white py-3.5 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-primary-hover transition">Simpan Sandi Baru</button>
                                    </div>
                                </form>
                            )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DOMPET SALDO E-WALLET */}
                    {activeProfileTab === 'wallet' && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-6 md:p-10 rounded-[2.5rem] border border-blue-500/30 shadow-inner max-w-2xl mx-auto text-center">
                            <div className="w-20 h-20 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-sm"><IconWallet className="w-10 h-10"/></div>
                            <h3 className="text-2xl font-black mb-6 text-blue-700 dark:text-blue-400">Dompet Saldo E-Wallet</h3>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                                <div className="bg-white dark:bg-navy-900/50 p-4 rounded-2xl border border-blue-500/20 shadow-sm flex-1">
                                    <p className="text-[10px] text-sub-theme font-bold uppercase mb-1">Saldo Utama Akun</p>
                                    <p className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono truncate">{formatRupiah(currentUserData?.saldoAkun || 0)}</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 shadow-sm flex-1">
                                    <p className="text-[10px] text-emerald-600/80 font-bold uppercase mb-1">Saldo Cashback</p>
                                    <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">{formatRupiah(currentUserData?.saldoCashback || 0)}</p>
                                    <p className="text-[8px] text-emerald-500 mt-1 uppercase tracking-widest bg-emerald-500/10 rounded px-1 py-0.5 inline-block">Cair Otomatis Tiap Bulan</p>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-navy-900/80 p-6 rounded-3xl border border-blue-500/20 shadow-sm text-left mb-8">
                                <h4 className="text-sm font-black text-main mb-4 flex items-center gap-2"><IconTrendingUp className="w-4 h-4 text-blue-500"/> Formulir Isi Saldo (Top Up)</h4>
                                <div className="flex flex-col gap-3">
                                    <input type="number" id="topupAmountInput" placeholder="Ketik Nominal (Minimal Rp 10.000)" className="w-full input-theme rounded-xl py-3.5 px-4 text-sm font-mono focus:border-blue-500 shadow-inner"/>
                                    <select id="topupPaymentMethod" className="w-full input-theme rounded-xl py-3.5 px-4 text-sm font-bold focus:border-blue-500 shadow-inner cursor-pointer appearance-none">
                                        {topupPayments.map(pay => (
                                            <option key={pay.id} value={pay.name}>{pay.badge} - {pay.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={submitTopUpSaldo} disabled={sysLoading.active} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl shadow-md transition uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] w-full"><IconWallet className="w-4 h-4"/> Buat Tagihan Top Up</button>
                                </div>
                            </div>

                            <div className="text-left border-t border-blue-500/20 pt-8">
                                <h4 className="text-sm font-black text-main mb-4 flex items-center gap-2"><IconHistory className="w-5 h-5 text-blue-500"/> Riwayat Tagihan Isi Saldo</h4>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 render-optimized">
                                    {(userOrders||[]).filter(o => o.gameId === 'TOPUP_SALDO').map(order => (
                                        <div key={order.id} className="bg-white dark:bg-navy-900/50 p-5 rounded-2xl border border-theme shadow-sm flex flex-col gap-3">
                                            <div className="flex justify-between items-center border-b border-theme pb-2">
                                                <span className="text-[10px] font-bold text-sub-theme font-mono">TRX: {order.id}</span>
                                                <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm ${order.status==='Sukses' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : order.status==='Pending' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'}`}>{order.status}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs font-black text-main">{order.paymentMethod}</p>
                                                    <p className="text-[9px] text-sub-theme mt-0.5">{new Date(order.createdAt).toLocaleDateString('id-ID')} {new Date(order.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                                                </div>
                                                <div className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                                                    {formatRupiah(order.priceTotal)}
                                                </div>
                                            </div>
                                            {/* Tampilkan QR atau Instruksi Cash Jika Pending */}
                                            {order.status === 'Pending' && order.paymentMethod.includes('QRIS') && (
                                                <div className="mt-3 pt-4 border-t border-theme flex flex-col items-center">
                                                    <p className="text-[10px] font-bold uppercase mb-3 text-main">Scan QRIS ini untuk bayar:</p>
                                                    <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-inner"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://dummy.qris.com/'+order.priceTotal)}&margin=10`} className="w-32 h-32 object-contain" /></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(userOrders||[]).filter(o => o.gameId === 'TOPUP_SALDO').length === 0 && (
                                        <div className="text-center py-8 text-sub-theme text-xs font-bold border border-dashed border-theme rounded-2xl bg-white/50 dark:bg-navy-900/50">Belum ada riwayat pengisian saldo.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: KEMITRAAN RESELLER */}
                    {activeProfileTab === 'reseller' && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 p-8 md:p-12 rounded-[2.5rem] border border-orange-500/30 shadow-inner max-w-2xl mx-auto">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-20 h-20 bg-orange-500/20 text-orange-600 dark:text-orange-500 rounded-full flex items-center justify-center mb-4 border border-orange-500/30 shadow-sm"><IconTrendingUp className="w-10 h-10"/></div>
                                <h3 className="text-2xl font-black mb-2 text-orange-700 dark:text-orange-500">Kemitraan Reseller VIP</h3>
                                <p className="text-sm font-medium text-sub-theme px-4">Dapatkan akses harga super murah (Harga Modal) khusus untuk konter, toko kelontong, atau pelaku usaha digital. Tingkatkan margin keuntungan Anda bersama Vipercell.</p>
                            </div>
                            
                            {currentUserData?.isReseller ? (
                                <div className="text-center bg-white dark:bg-navy-900/80 border border-orange-500/40 p-8 rounded-[2rem] shadow-lg">
                                    <IconCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
                                    <h4 className="text-xl font-black text-main mb-2">Selamat! Anda Reseller VIP</h4>
                                    <p className="text-xs font-medium text-sub-theme leading-relaxed mb-6">Toko <b className="text-orange-500">{currentUserData.resellerStore}</b> sudah terverifikasi. Seluruh harga di katalog saat ini otomatis menampilkan harga khusus Reseller yang lebih murah dari harga normal.</p>
                                    <div className="bg-orange-500/10 text-orange-600 dark:text-orange-400 p-4 rounded-xl text-xs font-black uppercase border border-orange-500/30 shadow-sm">Status Kemitraan: Aktif</div>
                                </div>
                            ) : currentUserData?.resellerStatus === 'pending' ? (
                                <div className="text-center bg-white dark:bg-navy-900/80 border border-orange-500/40 p-8 rounded-[2rem] shadow-lg">
                                    <IconLoader className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin"/>
                                    <h4 className="text-xl font-black text-main mb-2">Pengajuan Sedang Diproses</h4>
                                    <p className="text-xs font-medium text-sub-theme leading-relaxed mb-6">Tim Administrator Vipercell sedang meninjau pengajuan toko <b>{currentUserData.resellerStore}</b>. Mohon ditunggu 1x24 jam untuk proses validasi.</p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-navy-900/80 p-6 md:p-8 rounded-[2rem] border border-orange-500/30 shadow-lg">
                                    <h4 className="text-sm font-black text-main mb-6 text-center uppercase tracking-widest border-b border-theme pb-4">Formulir Pengajuan Kemitraan</h4>
                                    <form onSubmit={(e)=>{e.preventDefault(); handleApplyReseller(e);}} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest ml-1">Nama Toko / Konter</label>
                                            <input type="text" required value={resellerStoreName} onChange={(e)=>setResellerStoreName(e.target.value)} className="w-full input-theme rounded-xl py-4 px-5 focus:border-orange-500 text-sm font-bold shadow-inner transition" placeholder="Contoh: Teves Cell" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest ml-1">Nomor WhatsApp Aktif</label>
                                            <input type="tel" required value={resellerPhone} onChange={(e)=>setResellerPhone(e.target.value)} className="w-full input-theme rounded-xl py-4 px-5 focus:border-orange-500 text-sm font-bold shadow-inner transition" placeholder="08xx (Untuk Validasi Tim CS)" />
                                        </div>
                                        <button type="submit" disabled={sysLoading.active} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 mt-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-orange-500/30 transition hover:scale-[1.02]">Kirim Pengajuan Kemitraan</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}