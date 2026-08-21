return function AdminView() {
    const {
        React, db, safeAppId, authUser,
        isAdmin, isSuperAdmin, activeAdminTab, setActiveAdminTab,
        allGlobalOrders, adminChats, adminFeedbacks, memberList,
        games, items, promos, banners, galleryData, runningTexts, setRunningTexts, blogs,
        globalConfig, setGlobalConfig, adminSelectedGame, setAdminSelectedGame,
        editingItemId, setEditingItemId, newItemName, setNewItemName, newItemPrice, setNewItemPrice, newResellerPrice, setNewResellerPrice,
        editingGameId, setEditingGameId, newGameId, setNewGameId, newGameName, setNewGameName, newGameDev, setNewGameDev, newGameImg, setNewGameImg, newGameInput, setNewGameInput, newGameCategory, setNewGameCategory, uploadingGameImg, setUploadingGameImg, newGameInquirySku, setNewGameInquirySku,
        adminGasUrl, setAdminGasUrl, adminWaEndpoint, setAdminWaEndpoint, newAdminWa, setNewAdminWa, isSyncingDigiflazz, markupForm, setMarkupForm, bulkMarkupForm, setBulkMarkupForm, dbLogs,
        adminBannerUrl, setAdminBannerUrl, adminBannerType, setAdminBannerType, adminBannerTitle, setAdminBannerTitle, adminBannerDesc, setAdminBannerDesc, adminBannerLink, setAdminBannerLink,
        adminSettingsForm, setAdminSettingsForm, adminApiKey, setAdminApiKey,
        promoModalType, setPromoModalType, promoForm, setPromoForm, promoTargetItem, setPromoTargetItem, promoTargetGame, setPromoTargetGame,
        adminOrderSearch, setAdminOrderSearch, adminMemberSearch, setAdminMemberSearch, adminChatSearch, setAdminChatSearch, adminMemberTab, setAdminMemberTab,
        isScannerOpen, setIsScannerOpen, selectedOrdersForDelete, setSelectedOrdersForDelete,
        supportTab, setSupportTab, activeChatEmail, setActiveChatEmail, adminReplyText, setAdminReplyText, adminChatEndRef, chatTemplates,
        broadcastMsg, setBroadcastMsg, selectedBroadcastUsers, setSelectedBroadcastUsers, broadcastTarget, setBroadcastTarget,
        newMemberEmail, setNewMemberEmail, newMemberName, setNewMemberName, newMemberPhone, setNewMemberPhone, newMemberPassword, setNewMemberPassword,
        adminBlogForm, setAdminBlogForm, activeBlog, setActiveBlog,
        cinemaMovies, cinemaPolls, cinemaBookings, adminCinemaTab, setAdminCinemaTab, adminCinemaForm, setAdminCinemaForm, adminPollForm, setAdminPollForm, adminPosForm, setAdminPosForm, uploadingPoster, setUploadingPoster, activeCinemaMovie, setActiveCinemaMovie, selectedSeats, setSelectedSeats,
        financeForm, setFinanceForm, depositForm, setDepositForm, depositResult, setDepositResult,
        isStoreOpen, setIsStoreOpen, isCinemaOpen, setIsCinemaOpen,
        isStandbyMode, setIsStandbyMode, loadingAdminChats, currentUserData,
        formatRupiah, formatDateTimeWIT, generateDynamicQRIS, compressImage,
        Icons, triggerSysLoad, closeSysLoad, addToast, requestConfirm, setPinModalState, setAdminTrxModal,
        
        // FUNGSI HANDLER DARI CONTEXT
        checkDigiflazzBalance, handleCleanupDatabase, handleAddBanner, handleBannerUpload, saveSettings, handleAddAdminWa, handleDeleteAdminWa, handleFaviconUpload, handleDeleteFavicon, handleGalleryUpload, handleRemoveGallery, toggleStore, handleAddSaldoAdmin, handleReqDeposit, triggerSyncAll, executeBluetoothPrint, handleSelectOrder, handleBulkDeleteOrders, updateOrderStatus, handleAdminAddMember, handleBlockMember, handleDeleteMember, handleResellerAction, toggleBroadcastUser, handleAdminSendChat, handleCloseTicket, handleDeleteChat, handleBroadcast, handleMarkFeedbackRead, handleDeleteFeedback, handleSaveGame, handleEditGameClick, handleDeleteGame, toggleGameVisibility, handleSaveItem, handleBulkMarkup, handleEditItemClick, handleDeleteItem, toggleItemVisibility, handleSavePromo, handleDeletePromo, togglePromoStatus, handleAddBlog, handleDeleteBlog, printCinemaTicket,
        
        // FIREBASE DARI CONTEXT
        writeBatch, doc, deleteDoc, setDoc, updateDoc, arrayUnion
    } = React.useContext(AppContext);

    const { IconTrendingUp, IconCreditCard, IconList, IconGamepad, IconFilm, IconPercent, IconFileText, IconUsers, IconMessageSquare, IconSettings, IconShieldAlert, IconCheckCircle, IconTrash, IconCamera, IconQrcode, IconBanknote, IconCheck, IconRefresh, IconUpload, IconChevronLeft, IconEye, IconEyeOff, IconEdit, IconWallet, IconBluetooth, IconPrinter, IconSearch, IconBox, IconTag, IconClock, IconZap, IconImage, IconDatabase, IconWhatsapp } = Icons;

    const pendingOrdersCount = (allGlobalOrders || []).filter(o => o.status === 'Pending').length || 0;
    const openChatsCount = ((adminChats || []).filter(c => c.status === 'Open').length || 0);
    const unreadFeedbacksCount = ((adminFeedbacks || []).filter(f => f.status === 'Unread').length || 0);

    const toggleCinemaSeat = (seat) => {
        if (selectedSeats.includes(seat)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seat));
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="animate-slide-down pb-10 pt-4 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)] w-full relative z-10">
            {/* SIDEBAR MENU ADMIN */}
            <div className="w-full lg:w-72 clean-card p-5 shadow-2xl flex flex-col shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-140px)] z-30">
                <div className="flex items-center gap-3 mb-8 px-2 pt-2">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg"><IconShieldAlert className="w-6 h-6 text-white" /></div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-black text-main truncate drop-shadow-sm">Admin Panel</h1>
                        <span className="text-[8px] bg-gray-200 dark:bg-navy-800 text-sub-theme px-2 py-0.5 rounded uppercase font-bold mt-1 inline-block border border-theme shadow-inner">System v16.9.5 Enterprise</span>
                    </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 custom-scrollbar flex-1">
                    {[ 
                        { id: 'dashboard', label: 'Statistik Sistem', icon: IconTrendingUp }, 
                        { id: 'finance', label: 'Pusat Kasir & Otorisasi', icon: IconCreditCard }, 
                        { id: 'orders', label: 'Daftar Pesanan', icon: IconList, notif: pendingOrdersCount }, 
                        { id: 'katalog', label: 'Katalog & Harga', icon: IconGamepad }, 
                        { id: 'cinema', label: 'Kelola Bioskop', icon: IconFilm }, 
                        { id: 'promo', label: 'Pusat Promosi', icon: IconPercent }, 
                        { id: 'blog', label: 'Kelola Berita', icon: IconFileText }, 
                        { id: 'members', label: 'Data Member & Reseller', icon: IconUsers, notif: (memberList||[]).filter(m=>m.resellerStatus==='pending').length }, 
                        { id: 'support', label: 'Pusat Bantuan', icon: IconMessageSquare, notif: openChatsCount + unreadFeedbacksCount }, 
                        { id: 'settings', label: 'Pengaturan Web', icon: IconSettings } 
                    ].map(tab => {
                        const TabIcon = tab.icon;
                        return (
                        <button key={tab.id} onClick={() => setActiveAdminTab(tab.id)} className={`w-auto lg:w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all whitespace-nowrap shrink-0 border ${activeAdminTab === tab.id ? 'bg-primary text-white border-primary shadow-lg' : 'bg-transparent text-sub-theme border-transparent hover:bg-gray-100 dark:hover:bg-navy-800 hover:border-theme'}`}>
                            <TabIcon className={`w-5 h-5 ${activeAdminTab === tab.id ? 'text-white' : ''}`} />
                            <span className="text-sm tracking-wide">{tab.label}</span>
                            {tab.notif > 0 && <span className="ml-2 lg:ml-auto bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">{tab.notif}</span>}
                        </button>
                    )})}
                </div>
            </div>

            {/* KONTEN UTAMA ADMIN */}
            <div className="flex-1 clean-card shadow-2xl overflow-hidden flex flex-col relative w-full h-[75vh] lg:h-[calc(100vh-140px)] z-20">
                <div className={`flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar relative z-10 w-full ${activeAdminTab === 'support' || activeAdminTab === 'members' || activeAdminTab === 'finance' ? 'p-0 md:p-0 flex flex-col' : ''}`}>
                    
                    {/* TAB: DASHBOARD */}
                    {activeAdminTab === 'dashboard' && (
                        <div className="animate-slide-down">
                            <h2 className="text-2xl font-black mb-6 text-main px-2 flex items-center gap-2 drop-shadow-sm"><IconTrendingUp className="w-6 h-6 text-primary"/> Ringkasan Sistem Server</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                <div className="bg-gradient-to-br from-primary to-primary-hover dark:from-gray-800 dark:to-gray-900 rounded-[2rem] p-6 text-white shadow-xl border border-primary/30 relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                    <IconList className="w-8 h-8 mb-4 text-white opacity-90 relative z-10" />
                                    <p className="text-[10px] font-black uppercase opacity-80 mb-1 relative z-10">Total Pesanan Masuk</p>
                                    <p className="text-4xl font-black font-mono relative z-10 drop-shadow-md">{(allGlobalOrders||[]).length}</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-gray-800 dark:to-gray-900 rounded-[2rem] p-6 text-white shadow-xl border border-emerald-400/30 relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                    <IconCheckCircle className="w-8 h-8 mb-4 text-white opacity-90 relative z-10" />
                                    <p className="text-[10px] font-black uppercase opacity-80 mb-1 relative z-10">Pesanan Berhasil (Sukses)</p>
                                    <p className="text-4xl font-black font-mono relative z-10 drop-shadow-md">{(allGlobalOrders||[]).filter(o => o.status === 'Sukses').length}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-gray-800 dark:to-gray-900 rounded-[2rem] p-6 text-white shadow-xl border border-purple-400/30 relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                    <IconUsers className="w-8 h-8 mb-4 text-white opacity-90 relative z-10" />
                                    <p className="text-[10px] font-black uppercase opacity-80 mb-1 relative z-10">Member Terdaftar</p>
                                    <p className="text-4xl font-black font-mono relative z-10 drop-shadow-md">{(memberList||[]).length}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                                <div className="bg-white dark:bg-navy-900/50 p-6 rounded-[2rem] border border-theme shadow-inner flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-sub-theme mb-1">Total Laba Bersih API</p>
                                        <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah((allGlobalOrders||[]).filter(o => o.status === 'Sukses').reduce((acc, curr) => acc + (curr.profit || 0), 0))}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600"><IconTrendingUp className="w-6 h-6"/></div>
                                </div>
                                <div className="bg-white dark:bg-navy-900/50 p-6 rounded-[2rem] border border-theme shadow-inner flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-sub-theme mb-1">Saldo Tertahan (Pending)</p>
                                        <p className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">{formatRupiah((allGlobalOrders||[]).filter(o => o.status === 'Pending').reduce((acc, curr) => acc + (curr.priceTotal || 0), 0))}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600"><IconBanknote className="w-6 h-6"/></div>
                                </div>
                            </div>

                            <div className="mt-8 bg-gray-50 dark:bg-navy-900/50 rounded-[2rem] p-5 md:p-6 border border-theme shadow-inner">
                                <h3 className="text-sm font-black uppercase tracking-widest text-sub-theme mb-5 flex items-center gap-2"><IconHistory className="w-4 h-4"/> Aktivitas Transaksi Terkini</h3>
                                <div className="space-y-3 render-optimized">
                                    {(allGlobalOrders||[]).slice(0,5).map(o => (
                                        <div key={o.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white dark:bg-navy-800 p-4 rounded-2xl border border-theme shadow-sm gap-3 hover:border-primary/30 transition">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-3 h-3 rounded-full shrink-0 shadow-sm ${o.status==='Pending'?'bg-orange-500 animate-pulse':o.status==='Sukses'?'bg-emerald-500':'bg-red-500'}`}></div>
                                                <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-main truncate">{(o.userEmail || '').split('@')[0]} <span className="text-xs text-sub-theme font-medium">membeli</span> {o.gameName}</div>
                                                <div className="text-[10px] font-mono text-sub-theme mt-1 truncate">{o.id}</div>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right pl-7 sm:pl-0 border-t sm:border-t-0 border-theme pt-3 sm:pt-0 shrink-0">
                                                <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(o.priceTotal)}</div>
                                                <div className="text-[9px] text-sub-theme uppercase tracking-widest mt-1 font-bold">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('id-ID') : '-'}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!allGlobalOrders || allGlobalOrders.length === 0) && <p className="text-sm text-sub-theme text-center py-8 font-bold border border-dashed border-theme rounded-2xl bg-white/50 dark:bg-navy-800/50">Belum ada aktivitas transaksi.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PUSAT KASIR & OTORISASI */}
                    {activeAdminTab === 'finance' && (
                        <div className="animate-slide-down flex flex-col h-full w-full bg-gray-50 dark:bg-navy-900/30 p-4 md:p-6 rounded-[2.5rem] border border-theme shadow-inner overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-main flex items-center gap-2 drop-shadow-sm"><IconCreditCard className="w-6 h-6 text-primary"/> Pusat Kasir & Otorisasi</h2>
                                    <p className="text-xs text-sub-theme font-medium mt-1">Sistem keamanan PIN di setiap otorisasi aliran dana dan pencairan antrean QRIS.</p>
                                </div>
                                <button onClick={handleReqDeposit} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-md transition hover:scale-105"><IconBanknote className="w-4 h-4"/> Tiket Deposit Digiflazz</button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                                {/* KIRI: SCANNER FISIK & LIST MEMBER */}
                                <div className="lg:col-span-5 flex flex-col gap-6">
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 rounded-[2rem] border border-emerald-500/30 shadow-sm flex items-center justify-between group hover:border-emerald-500/60 transition-colors">
                                        <div>
                                            <h3 className="text-base font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><IconCamera className="w-5 h-5"/> Kasir Top Up Fisik</h3>
                                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 mt-1 font-bold">Scan barcode ID dari aplikasi pelanggan.</p>
                                        </div>
                                        <button onClick={() => setIsScannerOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl shadow-lg transition hover:scale-110 flex items-center justify-center shrink-0">
                                            <IconCamera className="w-6 h-6"/>
                                        </button>
                                    </div>

                                    <div className="bg-white dark:bg-card p-6 rounded-[2rem] border border-theme shadow-sm flex flex-col flex-1">
                                        <h3 className="text-sm font-black text-main flex items-center gap-2 mb-4"><IconUsers className="w-4 h-4 text-primary"/> Direktori Member & Injek Manual</h3>
                                        <div className="space-y-3 mb-6">
                                            <input type="email" value={financeForm.userEmail} onChange={(e)=>setFinanceForm({...financeForm, userEmail: e.target.value})} placeholder="Email / ID Member" className="w-full input-theme rounded-xl py-3 px-4 focus:border-primary text-sm shadow-inner transition font-mono" />
                                            <input type="number" value={financeForm.amount} onChange={(e)=>setFinanceForm({...financeForm, amount: e.target.value})} placeholder="Nominal Top Up (Rp)" className="w-full input-theme rounded-xl py-3 px-4 focus:border-primary text-sm shadow-inner transition font-mono" />
                                            <button onClick={handleAddSaldoAdmin} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 rounded-xl shadow-md transition text-[10px] uppercase tracking-widest hover:scale-[1.02] flex items-center justify-center gap-2">
                                                <IconShield className="w-4 h-4"/> Konfirmasi & Injek Saldo
                                            </button>
                                        </div>

                                        <div className="relative mb-4">
                                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sub-theme w-4 h-4" />
                                            <input type="text" placeholder="Cari member cepat..." value={adminMemberSearch} onChange={(e) => setAdminMemberSearch(e.target.value)} className="w-full input-theme rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-primary transition shadow-sm" />
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                            {(memberList||[]).filter(m => (m?.email||'').toLowerCase().includes((adminMemberSearch||'').toLowerCase()) || (m?.name||'').toLowerCase().includes((adminMemberSearch||'').toLowerCase())).map(m => (
                                                <div key={m.id} className="p-3 bg-gray-50 dark:bg-navy-900/50 border border-theme rounded-xl flex justify-between items-center hover:border-primary/40 transition-colors">
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-black text-main truncate">{m.name}</div>
                                                        <div className="text-[9px] text-sub-theme font-mono truncate">{m.email}</div>
                                                        <div className="text-[10px] font-black text-primary mt-1 font-mono">{formatRupiah(m.saldoAkun)}</div>
                                                    </div>
                                                    <button onClick={() => setFinanceForm({userEmail: m.email, amount: ''})} className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition" title="Isi Saldo Member Ini"><IconCheckCircle className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                            {(!memberList || memberList.length === 0) && <p className="text-[10px] text-center text-sub-theme py-4">Belum ada member terdaftar.</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* KANAN: ANTREAN QRIS */}
                                <div className="lg:col-span-7 flex flex-col h-full">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 md:p-8 rounded-[2rem] border border-blue-500/30 shadow-sm flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-6 border-b border-blue-500/20 pb-4">
                                            <div>
                                                <h3 className="text-lg font-black text-blue-700 dark:text-blue-400 flex items-center gap-2"><IconQrcode className="w-5 h-5"/> Validasi QRIS (Top Up Saldo)</h3>
                                                <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-bold mt-1">Hanya untuk antrean pengisian Dompet E-Wallet pengguna.</p>
                                            </div>
                                            <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">{(adminOrders||[]).filter(o => o.status === 'Pending' && o.paymentMethod.includes('QRIS') && o.gameId === 'TOPUP_SALDO').length} Pending</span>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 render-optimized">
                                            {(adminOrders||[]).filter(o => o.status === 'Pending' && o.paymentMethod.includes('QRIS') && o.gameId === 'TOPUP_SALDO').map(order => (
                                                <div key={order.id} className="bg-white dark:bg-card p-5 rounded-2xl border border-blue-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-orange-500/20 shrink-0">Menunggu</span>
                                                            <span className="text-[10px] font-mono text-sub-theme font-bold truncate">Trx: {order.id}</span>
                                                        </div>
                                                        <h4 className="font-black text-main text-sm truncate">{order.gameName} - {order.nominalName}</h4>
                                                        <p className="text-[10px] text-sub-theme font-bold truncate">User: {order.targetUserId} | {order.userEmail}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0 border-t sm:border-t-0 border-theme pt-3 sm:pt-0">
                                                        <div className="text-right">
                                                            <p className="text-[8px] uppercase font-black text-sub-theme">Nominal Mutasi</p>
                                                            <p className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">{formatRupiah(order.priceTotal)}</p>
                                                        </div>
                                                        <button onClick={() => {
                                                            requestConfirm('Validasi QRIS', `Validasi isi saldo ${order.id} sebesar ${formatRupiah(order.priceTotal)}? Pastikan dana sudah masuk ke rekening Anda.`, () => {
                                                                if (!currentUserData?.pin) return addToast('Admin wajib set PIN di Profil!', 'error');
                                                                setPinModalState({ isOpen: true, mode: 'verify', expectedPin: currentUserData.pin, onSuccess: () => {
                                                                    setPinModalState({isOpen:false, mode:'setup', expectedPin:'', onSuccess:null});
                                                                    updateOrderStatus(order, 'Sukses');
                                                                }});
                                                            }, 'success', 'Validasi Lunas');
                                                        }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md transition flex items-center gap-1.5 hover:scale-105"><IconCheck className="w-3.5 h-3.5"/> Validasi Saldo</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(adminOrders||[]).filter(o => o.status === 'Pending' && o.paymentMethod.includes('QRIS') && o.gameId === 'TOPUP_SALDO').length === 0 && (
                                                <div className="text-center py-16 text-blue-500/60 dark:text-blue-400/60 font-bold text-xs border border-dashed border-blue-500/30 rounded-2xl bg-white/50 dark:bg-white/5 flex flex-col items-center">
                                                    <IconCheckCircle className="w-8 h-8 mb-2 opacity-50"/>
                                                    Tidak ada antrean top up saldo QRIS saat ini.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: DAFTAR PESANAN */}
                    {activeAdminTab === 'orders' && (
                        <div className="animate-slide-down flex flex-col h-full w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-2xl font-black text-main flex items-center gap-2 drop-shadow-sm"><IconList className="w-6 h-6 text-primary"/> Manajemen Pesanan</h2>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-navy-900 px-4 py-2.5 rounded-xl border border-theme shadow-sm">
                                        <span className="text-[10px] font-bold text-main uppercase tracking-widest">Auto Print BT</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={isStandbyMode} onChange={(e) => setIsStandbyMode(e.target.checked)} />
                                            <div className="w-9 h-5 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 transition-all"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mb-6 flex gap-3">
                                <div className="relative flex-1">
                                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sub-theme w-5 h-5" />
                                    <input type="text" placeholder="Cari ID Transaksi / Email..." value={adminOrderSearch} onChange={(e) => setAdminOrderSearch(e.target.value)} className="w-full input-theme rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary shadow-sm transition" />
                                </div>
                                {selectedOrdersForDelete.length > 0 && (
                                    <button onClick={handleBulkDeleteOrders} className="bg-red-600 hover:bg-red-500 text-white px-4 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 whitespace-nowrap shadow-md transition hover:scale-105">
                                        <IconTrash className="w-4 h-4"/> Hapus ({selectedOrdersForDelete.length})
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 w-full max-w-full overflow-x-auto custom-scrollbar bg-gray-50 dark:bg-navy-900/50 rounded-[2rem] border border-theme shadow-inner render-optimized">
                                <table className="w-full text-left text-sm text-main min-w-[1000px]">
                                    <thead className="text-[10px] text-sub-theme uppercase bg-gray-100 dark:bg-navy-900 sticky top-0 z-10 border-b border-theme shadow-sm">
                                        <tr>
                                            <th className="px-5 py-4 w-10 text-center"><IconCheckCircle className="w-4 h-4 mx-auto opacity-50"/></th>
                                            <th className="px-5 py-4 font-black">Pelanggan & ID</th>
                                            <th className="px-5 py-4 font-black">Layanan & Produk</th>
                                            <th className="px-5 py-4 font-black">Data Tujuan</th>
                                            <th className="px-5 py-4 font-black text-emerald-600">Finansial</th>
                                            <th className="px-5 py-4 font-black">Status</th>
                                            <th className="px-5 py-4 text-center font-black">Aksi Tindakan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-theme">
                                    {(adminOrders || []).filter(o => ((o?.id || '').toLowerCase().includes((adminOrderSearch||'').toLowerCase()) || (o?.userEmail || '').toLowerCase().includes((adminOrderSearch||'').toLowerCase()))).map(order => (
                                        <tr key={order.id} className={`transition-colors ${selectedOrdersForDelete.includes(order.id) ? 'bg-red-500/10' : 'hover:bg-white dark:hover:bg-white/[0.03]'}`}>
                                            <td className="px-5 py-4 text-center">
                                                <input type="checkbox" checked={selectedOrdersForDelete.includes(order.id)} onChange={() => handleSelectOrder(order.id)} className="w-4 h-4 text-primary rounded border-gray-300" />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-main truncate max-w-[150px]">{(order?.userEmail || 'Guest').split('@')[0]}</div>
                                                <div className="text-[9px] text-sub-theme font-mono mt-1 truncate max-w-[150px] bg-gray-200 dark:bg-black px-2 py-0.5 rounded border border-theme inline-block shadow-inner">{order?.id}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="text-primary font-bold truncate max-w-[180px]">{order?.gameName || '-'}</div>
                                                <div className="text-xs text-sub-theme mt-1 truncate max-w-[180px]">{order?.nominalName || '-'}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-mono font-bold bg-white dark:bg-white/5 rounded-lg inline-flex flex-col gap-1 px-3 py-2 border border-theme shadow-sm text-main max-w-[220px] overflow-hidden overflow-ellipsis text-xs">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="truncate">{order?.targetUserId} {order?.targetZoneId ? `(${order.targetZoneId})` : ''}</span>
                                                        <button onClick={()=>{navigator.clipboard.writeText(order?.targetUserId); addToast('ID disalin', 'success');}} className="p-1 text-sub-theme hover:text-main transition shrink-0 tooltip" title="Salin ID Game/Pelanggan"><IconCopy className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                    {order?.targetNickname && <div className="text-[10px] text-emerald-500 font-bold border-t border-theme pt-1 mt-1 truncate">{order.targetNickname}</div>}
                                                    {order?.sn && <div className="text-[10px] text-primary font-bold border-t border-theme pt-1 mt-1 truncate">SN: {order.sn}</div>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-black text-main text-sm">{formatRupiah(order?.priceTotal)}</div>
                                                {order?.status === 'Sukses' && <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase">Laba: {formatRupiah(order.profit || 0)}</div>}
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    <span className="text-[8px] bg-gray-200 dark:bg-white/10 text-sub-theme px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-theme">{order?.paymentMethod}</span>
                                                    {order?.promoUsed && <span className="text-[8px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center border border-emerald-500/20"><IconTag className="w-2.5 h-2.5 mr-0.5"/> {order.promoUsed}</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-widest shadow-sm inline-block ${order?.status === 'Sukses' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : order?.status === 'Batal' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' : order?.status === 'Diproses Server' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'}`}>{order?.status}</span>
                                                <div className="text-[8px] text-sub-theme mt-2 font-bold">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-'}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => executeBluetoothPrint(order)} className="p-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 hover:text-white transition tooltip shadow-sm hover:scale-105" title="Cetak Struk BT"><IconPrinter className="w-4 h-4" /></button>
                                                    {order?.status === 'Pending' && (
                                                        <>
                                                            {order?.paymentMethod?.toLowerCase().includes('cash') && order?.gameId !== 'TOPUP_SALDO' ? (
                                                                <button onClick={() => setIsScannerOpen(true)} className="p-2.5 bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-500 hover:text-white transition tooltip shadow-sm hover:scale-105" title="Scan QR Pembeli untuk Validasi Kasir"><IconCamera className="w-4 h-4" strokeWidth={3} /></button>
                                                            ) : (
                                                                <button onClick={() => {
                                                                    requestConfirm('Validasi Manual', `Tandai pesanan ${order.id} lunas dan proses API?`, () => {
                                                                        if (!currentUserData?.pin) return addToast('Admin wajib set PIN di Profil!', 'error');
                                                                        setPinModalState({ isOpen: true, mode: 'verify', expectedPin: currentUserData.pin, onSuccess: () => {
                                                                            setPinModalState({isOpen:false, mode:'setup', expectedPin:'', onSuccess:null}); updateOrderStatus(order, 'Sukses');
                                                                        }});
                                                                    }, 'success', 'Validasi Lunas');
                                                                }} className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 hover:text-white transition tooltip shadow-sm hover:scale-105" title="Tandai Lunas & Proses API"><IconCheck className="w-4 h-4" strokeWidth={3} /></button>
                                                            )}
                                                            <button onClick={() => requestConfirm('Batalkan Pesanan', `Batalkan pesanan ${order.id}?`, () => updateOrderStatus(order, 'Batal'), 'warning', 'Batalkan')} className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition tooltip shadow-sm hover:scale-105" title="Batalkan Pesanan"><IconX className="w-4 h-4" strokeWidth={3} /></button>
                                                        </>
                                                    )}
                                                    {order?.status === 'Diproses Server' && (
                                                        <button onClick={() => { addToast('Mengecek Status API...', 'process'); updateOrderStatus(order, 'SuksesManual'); }} className="p-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-500 hover:text-white transition tooltip shadow-sm hover:scale-105" title="Cek Status API (Manual)"><IconRefresh className="w-4 h-4" strokeWidth={3} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!adminOrders || adminOrders.filter(o => o.status !== 'Dihapus').length === 0) && (<tr><td colSpan="7" className="text-center py-20 text-sub-theme font-bold border border-dashed border-theme rounded-2xl bg-white/50 dark:bg-white/5">Tidak ada pesanan yang sesuai dalam database.</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: DATA MEMBER & KELOLA RESELLER */}
                    {activeAdminTab === 'members' && (
                        <div className="animate-slide-down flex flex-col h-full w-full p-2 md:p-6 bg-gray-50 dark:bg-navy-900/30 rounded-[2.5rem] border border-theme shadow-inner">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h2 className="text-2xl font-black text-main flex items-center gap-2 drop-shadow-sm"><IconUsers className="w-6 h-6 text-primary"/> Manajemen Pengguna</h2>
                                <div className="flex bg-card border border-theme p-1 rounded-xl shadow-sm">
                                    <button onClick={()=>setAdminMemberTab('all')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${adminMemberTab==='all' ? 'bg-primary text-white' : 'text-sub-theme hover:bg-gray-100 dark:hover:bg-navy-800'}`}>Daftar Member</button>
                                    <button onClick={()=>setAdminMemberTab('reseller')} className={`px-4 py-2 text-xs font-bold rounded-lg transition relative ${adminMemberTab==='reseller' ? 'bg-orange-500 text-white' : 'text-sub-theme hover:bg-gray-100 dark:hover:bg-navy-800'}`}>
                                        Kelola Reseller
                                        {(memberList||[]).filter(m=>m.resellerStatus==='pending').length > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                                    </button>
                                </div>
                            </div>

                            {adminMemberTab === 'all' && (
                                <>
                                    <form onSubmit={handleAdminAddMember} className="bg-card p-5 rounded-2xl border border-theme shadow-sm mb-6 flex flex-wrap gap-3 items-end">
                                        <div className="flex-1 min-w-[180px]"><label className="text-[10px] font-black text-sub-theme uppercase mb-1 block">Email Baru</label><input type="email" required value={newMemberEmail} onChange={(e)=>setNewMemberEmail(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="email@gmail.com"/></div>
                                        <div className="flex-1 min-w-[180px]"><label className="text-[10px] font-black text-sub-theme uppercase mb-1 block">Sandi Akun</label><input type="text" required minLength="6" value={newMemberPassword} onChange={(e)=>setNewMemberPassword(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="Min. 6 Karakter"/></div>
                                        <div className="flex-1 min-w-[180px]"><label className="text-[10px] font-black text-sub-theme uppercase mb-1 block">Nama Lengkap</label><input type="text" required value={newMemberName} onChange={(e)=>setNewMemberName(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="Nama Member"/></div>
                                        <div className="flex-1 min-w-[180px]"><label className="text-[10px] font-black text-sub-theme uppercase mb-1 block">No Handphone</label><input type="tel" required value={newMemberPhone} onChange={(e)=>setNewMemberPhone(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="08xx"/></div>
                                        <button type="submit" disabled={!adminApiKey} className="bg-primary hover:bg-primary-hover text-white font-black px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50">Daftarkan</button>
                                        {!adminApiKey && <p className="text-[10px] text-red-500 w-full mt-1">⚠️ Fitur ini butuh 'API Key Web' Firebase (Simpan di Pengaturan Web).</p>}
                                    </form>

                                    <div className="relative mb-6">
                                        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sub-theme w-5 h-5" />
                                        <input type="text" placeholder="Cari Nama atau Email Member..." value={adminMemberSearch} onChange={(e) => setAdminMemberSearch(e.target.value)} className="w-full input-theme rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary font-medium transition shadow-sm" />
                                    </div>

                                    <div className="flex-1 w-full max-w-full overflow-x-auto custom-scrollbar bg-white dark:bg-navy-900/50 rounded-[2rem] border border-theme shadow-inner render-optimized">
                                        <table className="w-full text-left text-sm text-main min-w-[900px]">
                                            <thead className="text-[10px] text-sub-theme uppercase tracking-widest bg-gray-100 dark:bg-navy-900 sticky top-0 z-10 border-b border-theme shadow-sm">
                                                <tr>
                                                    <th className="px-5 py-4 font-black">Informasi Pengguna</th>
                                                    <th className="px-5 py-4 font-black">Kontak Akun</th>
                                                    <th className="px-5 py-4 font-black text-primary">Saldo Cashback</th>
                                                    <th className="px-5 py-4 font-black">Keamanan & Tipe</th>
                                                    <th className="px-5 py-4 font-black">Bergabung Pada</th>
                                                    <th className="px-5 py-4 text-center font-black">Aksi Cepat</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-theme">
                                            {(memberList||[]).filter(m => (m?.email||'').toLowerCase().includes((adminMemberSearch||'').toLowerCase()) || (m?.name||'').toLowerCase().includes((adminMemberSearch||'').toLowerCase())).map(m => (
                                                <tr key={m.id} className={`transition-colors ${m.isBlocked ? 'opacity-50 bg-red-500/5' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-black text-xs text-main overflow-hidden border border-theme shrink-0 shadow-sm">
                                                                {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover"/> : (m.name||'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-main truncate max-w-[150px]">{m.name}</div>
                                                                <div className="text-[9px] text-sub-theme font-mono mt-0.5 truncate max-w-[150px]">{m.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 font-mono text-sub-theme text-xs bg-gray-100 dark:bg-black/50 px-2 py-1 rounded inline-block mt-3 border border-theme shadow-sm">{m.phone || 'Belum diisi'}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(m.saldoCashback || 0)}</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col gap-1.5 items-start">
                                                            {m.isBlocked ? <span className="px-2 py-1 rounded-md text-[8px] font-black bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 uppercase tracking-widest shadow-sm">Diblokir</span> : <span className="px-2 py-1 rounded-md text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-widest shadow-sm">Aktif</span>}
                                                            {m.isReseller && <span className="px-2 py-1 rounded-md text-[8px] font-black bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 uppercase tracking-widest shadow-sm flex items-center gap-1"><IconTrendingUp className="w-2.5 h-2.5"/> Reseller</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs font-bold text-sub-theme">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {m.phone && (
                                                                <button onClick={()=>window.open(`https://wa.me/${m.phone.replace(/^0/,'62')}?text=Halo%20${m.name},%20kami%20dari%20Vipercell.%20Kami%20ingin%20menginformasikan%20sesuatu%20tentang%20akun%20Anda.`, '_blank')} className="p-2 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-500 rounded-xl hover:bg-green-50 hover:text-white transition tooltip shadow-sm hover:scale-105" title="Chat WhatsApp">
                                                                    <IconWhatsapp className="w-4 h-4"/>
                                                                </button>
                                                            )}
                                                            <button onClick={() => requestConfirm(m.isBlocked ? 'Buka Blokir' : 'Blokir Akun', `Ubah status blokir pengguna ini?`, () => handleBlockMember(m.id, m.isBlocked), m.isBlocked ? 'success' : 'warning')} className={`p-2 rounded-xl transition tooltip shadow-sm border hover:scale-105 ${m.isBlocked ? 'bg-gray-200 dark:bg-white/10 text-main border-theme hover:bg-gray-300 dark:hover:bg-white/20' : 'bg-primary-light text-primary border-primary/30 hover:bg-primary hover:text-white'}`} title={m.isBlocked ? 'Buka Blokir Akun' : 'Blokir Akun'}>
                                                                <IconBlock className="w-4 h-4"/>
                                                            </button>
                                                            <button onClick={()=>handleDeleteMember(m.id)} className="p-2 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition tooltip shadow-sm hover:scale-105" title="Hapus Permanen">
                                                                <IconTrash className="w-4 h-4"/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!memberList || memberList.length === 0) && (<tr><td colSpan="6" className="text-center py-20 text-sub-theme font-bold border border-dashed border-theme rounded-2xl bg-white/50 dark:bg-white/5">Belum ada member terdaftar.</td></tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {adminMemberTab === 'reseller' && (
                                <div className="grid grid-cols-1 gap-6 h-full pb-4 render-optimized overflow-y-auto custom-scrollbar">
                                    <div className="bg-orange-50 dark:bg-orange-950/10 p-6 rounded-[2rem] border border-orange-500/30 shadow-inner">
                                        <h3 className="text-lg font-black text-orange-600 dark:text-orange-500 mb-2 flex items-center gap-2"><IconTrendingUp className="w-5 h-5"/> Pengajuan Menunggu Persetujuan</h3>
                                        <p className="text-xs text-sub-theme mb-4">Validasi toko atau counter yang ingin bergabung menjadi Reseller VIP.</p>
                                        
                                        <div className="space-y-3">
                                            {(memberList||[]).filter(m => m.resellerStatus === 'pending').map(m => (
                                                <div key={m.id} className="bg-white dark:bg-card p-4 rounded-2xl border border-theme shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-transform hover:scale-[1.01]">
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 shrink-0"><IconBox className="w-6 h-6"/></div>
                                                        <div>
                                                            <div className="font-black text-main text-base">{m.resellerStore || 'Nama Toko Tidak Diisi'}</div>
                                                            <div className="text-[10px] text-sub-theme font-mono mt-0.5">Pemilik: {m.name} | {m.email}</div>
                                                            <div className="text-xs font-bold text-primary mt-1">WA: {m.resellerWa || m.phone || '-'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                                        <button onClick={() => requestConfirm('Tolak Pengajuan', 'Tolak pengajuan Reseller VIP ini?', () => handleResellerAction(m.id, 'reject'), 'warning', 'Tolak')} className="flex-1 md:flex-none px-4 py-2.5 bg-red-500/10 text-red-600 border border-red-500/30 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition shadow-sm">Tolak</button>
                                                        <button onClick={() => requestConfirm('Terima Pengajuan', 'Terima dan aktifkan status Reseller VIP ini?', () => handleResellerAction(m.id, 'approve'), 'success', 'Terima')} className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase shadow-md transition transform hover:scale-105 flex items-center justify-center gap-1"><IconCheckCircle className="w-3.5 h-3.5"/> Terima Reseller</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(memberList||[]).filter(m => m.resellerStatus === 'pending').length === 0 && (
                                                <div className="text-center py-8 text-sub-theme text-sm font-bold border border-dashed border-orange-500/30 rounded-2xl bg-white/50 dark:bg-black/20">Tidak ada pengajuan reseller baru.</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-card p-6 rounded-[2rem] border border-theme shadow-sm">
                                        <h3 className="text-lg font-black text-main mb-2 flex items-center gap-2"><IconCheckCircle className="w-5 h-5 text-emerald-500"/> Reseller VIP Aktif</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                            {(memberList||[]).filter(m => m.isReseller === true).map(m => (
                                                <div key={m.id} className="p-4 rounded-2xl border border-primary/30 bg-primary-light shadow-sm flex flex-col justify-between">
                                                    <div className="mb-3">
                                                        <div className="font-black text-primary text-lg mb-1 truncate">{m.resellerStore || 'Toko Reseller'}</div>
                                                        <div className="text-xs font-bold text-main">{m.name}</div>
                                                        <div className="text-[10px] text-sub-theme font-mono">{m.email}</div>
                                                    </div>
                                                    <div className="flex justify-between items-end border-t border-primary/20 pt-3">
                                                        <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded shadow-sm">Aktif</span>
                                                        <button onClick={() => requestConfirm('Cabut Status', 'Cabut status reseller dari pengguna ini? Harga akan kembali normal.', () => handleResellerAction(m.id, 'revoke'), 'warning', 'Cabut Status')} className="text-[9px] text-red-600 bg-red-500/10 px-2 py-1 rounded font-bold hover:bg-red-500 hover:text-white transition">Berhentikan</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(memberList||[]).filter(m => m.isReseller === true).length === 0 && (
                                                <div className="col-span-full text-center py-8 text-sub-theme text-sm font-bold border border-dashed border-theme rounded-2xl bg-gray-50 dark:bg-white/5">Belum ada reseller yang aktif.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: PUSAT BANTUAN */}
                    {activeAdminTab === 'support' && (
                        <div className="animate-slide-down flex flex-col lg:flex-row h-full border border-theme rounded-[2.5rem] overflow-hidden bg-card shadow-inner relative">
                            
                            <div className={`w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-theme flex flex-col h-[50vh] lg:h-full bg-gray-50 dark:bg-navy-900/30 ${activeChatEmail ? 'hidden lg:flex' : 'flex'}`}>
                                
                                <div className="flex bg-gray-100 dark:bg-navy-900 p-2 border-b border-theme shrink-0 overflow-x-auto custom-scrollbar">
                                    <button onClick={()=>setSupportTab('member')} className={`flex-1 min-w-fit px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition border border-transparent ${supportTab==='member' ? 'bg-primary text-white shadow-sm' : 'text-sub-theme hover:text-main'}`}>Live Chat</button>
                                    <button onClick={()=>setSupportTab('broadcast')} className={`flex-1 min-w-fit px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition border border-transparent ${supportTab==='broadcast' ? 'bg-primary text-white shadow-sm' : 'text-sub-theme hover:text-main'}`}>Siaran</button>
                                    <button onClick={()=>setSupportTab('feedback')} className={`flex-1 min-w-fit px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition border border-transparent ${supportTab==='feedback' ? 'bg-emerald-500 text-white shadow-sm' : 'text-sub-theme hover:text-main'}`}>Saran {unreadFeedbacksCount > 0 && <span className="bg-white text-emerald-500 px-1.5 py-0.5 rounded-full ml-1">{unreadFeedbacksCount}</span>}</button>
                                </div>

                                {supportTab === 'member' && (
                                    <div className="flex-1 flex flex-col overflow-hidden relative">
                                        <div className="p-3 bg-primary-light font-bold text-xs text-primary flex items-center justify-between shrink-0 border-b border-primary/20 shadow-sm">
                                            <span><IconMessageSquare className="w-4 h-4 inline mr-1"/> Tiket Masuk</span>
                                            <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[9px] shadow-sm">{(adminChats||[]).filter(c=>c.status==='Open').length} Baru</span>
                                        </div>
                                        <div className="p-2 border-b border-theme bg-white dark:bg-card shrink-0">
                                            <div className="relative">
                                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sub-theme"/>
                                                <input type="text" placeholder="Cari email member..." value={adminChatSearch} onChange={(e)=>setAdminChatSearch(e.target.value)} className="w-full input-theme rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-primary transition shadow-sm" />
                                            </div>
                                        </div>

                                        <div className="overflow-y-auto flex-1 custom-scrollbar render-optimized">
                                            {(adminChats||[]).filter(c=>c.messages?.length>0 && (c.id||'').toLowerCase().includes((adminChatSearch||'').toLowerCase())).sort((a,b)=>(a.status==='Open'?-1:1)).map(c => {
                                                const memberData = (memberList||[]).find(m => m.email === c.id);
                                                return (
                                                <div key={c.id} onClick={()=>setActiveChatEmail(c.id)} className={`p-4 border-b border-theme cursor-pointer transition flex items-center justify-between group ${activeChatEmail===c.id?'bg-primary-light border-l-4 border-l-primary shadow-inner':'hover:bg-gray-100 dark:hover:bg-white/5 border-l-4 border-l-transparent'}`}>
                                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-black text-[10px] text-main overflow-hidden border border-theme shrink-0 shadow-sm">
                                                            {memberData?.avatar ? <img src={memberData.avatar} className="w-full h-full object-cover"/> : (memberData?.name||c.id||'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-black text-main truncate">{memberData?.name || c.id}</div>
                                                            <div className="text-[10px] text-sub-theme truncate mt-1">{c.messages[c.messages.length-1].text}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {c.status==='Open' && <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse"></span>}
                                                        <button onClick={(e) => handleDeleteChat(c.id, e)} className="p-1.5 text-sub-theme hover:text-red-500 hover:bg-red-500/10 rounded-md transition opacity-0 group-hover:opacity-100" title="Hapus Riwayat"><IconTrash className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                </div>
                                            )})}
                                            {(!adminChats || adminChats.filter(c=>c.messages?.length>0 && (c.id||'').toLowerCase().includes((adminChatSearch||'').toLowerCase())).length===0) && !loadingAdminChats && <div className="text-xs text-center text-sub-theme p-8 font-bold">Tidak ada riwayat chat.</div>}
                                        </div>
                                    </div>
                                )}

                                {supportTab === 'broadcast' && (
                                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                                        <h3 className="font-black text-sm text-main mb-2 flex items-center gap-2"><IconSend className="w-4 h-4 text-primary"/> Kirim Pesan Siaran</h3>
                                        <p className="text-[10px] text-sub-theme mb-6">Pesan akan masuk ke Pusat Bantuan Member.</p>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-sub-theme mb-1 block">Tujuan Pengiriman</label>
                                                <select value={broadcastTarget} onChange={(e)=>{setBroadcastTarget(e.target.value); setSelectedBroadcastUsers([]);}} className="w-full input-theme rounded-xl p-3 text-xs shadow-sm">
                                                    <option value="all">Ke Semua Member ({(memberList||[]).length})</option>
                                                    <option value="specific">Pilih Member Tertentu ({(selectedBroadcastUsers||[]).length})</option>
                                                </select>
                                            </div>
                                            
                                            {broadcastTarget === 'specific' && (
                                                <div className="border border-theme rounded-xl overflow-hidden flex flex-col h-48 bg-white dark:bg-black/50 shadow-inner">
                                                    <div className="p-2 border-b border-theme bg-gray-100 dark:bg-white/5 flex justify-between items-center shrink-0">
                                                        <span className="text-[10px] font-bold text-main">Pilih Member:</span>
                                                        <button type="button" onClick={() => setSelectedBroadcastUsers((memberList||[]).map(m=>m.email))} className="text-[9px] bg-primary-light text-primary px-2 py-1 rounded font-bold hover:bg-primary hover:text-white transition shadow-sm">Pilih Semua</button>
                                                    </div>
                                                    <div className="overflow-y-auto flex-1 custom-scrollbar p-2 space-y-1 render-optimized">
                                                        {(memberList||[]).map(m => (
                                                            <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition border border-transparent hover:border-theme">
                                                                <input type="checkbox" checked={selectedBroadcastUsers.includes(m.email)} onChange={() => toggleBroadcastUser(m.email)} className="w-4 h-4 text-primary rounded border-gray-300" />
                                                                <div className="min-w-0">
                                                                    <div className="text-xs font-bold text-main truncate">{m.name}</div>
                                                                    <div className="text-[9px] text-sub-theme font-mono truncate">{m.email}</div>
                                                                </div>
                                                            </label>
                                                        ))}
                                                        {(!memberList || memberList.length === 0) && <p className="text-[10px] text-center text-sub-theme py-4">Belum ada member terdaftar.</p>}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-[10px] font-bold text-sub-theme mb-1 block">Template Cepat (Opsional)</label>
                                                <select onChange={(e)=>{if(e.target.value) setBroadcastMsg(e.target.value); e.target.value="";}} className="w-full input-theme rounded-xl p-3 text-xs shadow-sm">
                                                    <option value="">-- Isi otomatis dengan template --</option>
                                                    {(chatTemplates||[]).map((t,i)=><option key={i} value={t}>{t.substring(0,40)}...</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-sub-theme mb-1 block">Isi Pesan Broadcast</label>
                                                <textarea required value={broadcastMsg} onChange={(e)=>setBroadcastMsg(e.target.value)} placeholder="Tulis isi pesan pengumuman..." className="w-full h-32 input-theme rounded-xl p-4 text-xs resize-none shadow-sm"></textarea>
                                            </div>
                                            <button onClick={handleBroadcast} disabled={!(broadcastMsg||'').trim() || (broadcastTarget === 'specific' && selectedBroadcastUsers.length === 0)} className="w-full bg-primary hover:bg-primary-hover text-white font-black py-3 rounded-xl shadow-lg transition text-xs uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02]">Kirim Sekarang</button>
                                        </div>
                                    </div>
                                )}

                                {supportTab === 'feedback' && (
                                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-4 bg-emerald-50 dark:bg-emerald-950/10 render-optimized">
                                        <h3 className="font-black text-sm text-emerald-600 dark:text-emerald-500 mb-2 flex items-center gap-2"><IconMessageSquare className="w-4 h-4"/> Kotak Saran Pelanggan</h3>
                                        <p className="text-[10px] text-sub-theme mb-4">Daftar masukan dan ide dari pengguna.</p>
                                        
                                        {(adminFeedbacks||[]).map(f => (
                                            <div key={f.id} className={`p-4 rounded-2xl border transition-all shadow-md ${f.status === 'Unread' ? 'bg-white dark:bg-emerald-900/30 border-emerald-500/50 ring-1 ring-emerald-500/30' : 'bg-gray-100 dark:bg-white/5 border-theme'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="min-w-0 pr-2">
                                                        <div className="text-xs font-black text-main truncate">{f.senderName}</div>
                                                        <div className="text-[9px] text-sub-theme font-mono truncate">{f.senderEmail}</div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-[8px] font-bold text-sub-theme">{new Date(f.createdAt).toLocaleDateString('id-ID')}</div>
                                                        {f.status === 'Unread' && <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase mt-1 inline-block shadow-sm">Baru</span>}
                                                    </div>
                                                </div>
                                                <p className="text-xs font-medium text-main bg-gray-50 dark:bg-black/50 p-3 rounded-xl border border-theme mb-3 leading-relaxed shadow-inner">{f.text}</p>
                                                <div className="flex justify-end gap-2 border-t border-theme pt-3">
                                                    {f.status === 'Unread' && <button onClick={()=>handleMarkFeedbackRead(f.id)} className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded hover:bg-emerald-50 hover:text-white transition shadow-sm border border-emerald-500/20">Tandai Dibaca</button>}
                                                    <button onClick={()=>handleDeleteFeedback(f.id)} className="text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-3 py-1.5 rounded hover:bg-red-50 hover:text-white transition shadow-sm border border-red-500/20">Hapus</button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!adminFeedbacks || adminFeedbacks.length === 0) && (
                                            <div className="text-center py-12 border border-dashed border-theme rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                                <IconCheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2"/>
                                                <p className="text-xs font-bold text-sub-theme">Belum ada saran yang masuk.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>

                            <div className={`w-full lg:w-2/3 flex flex-col h-[70vh] lg:h-full relative overflow-hidden transition-colors duration-500 ${(supportTab !== 'member' || !activeChatEmail) ? 'hidden lg:flex' : 'flex'}`}>
                                {supportTab === 'member' && activeChatEmail ? (
                                    <>
                                        <div className="p-3 md:p-4 bg-card font-black text-sm border-b border-theme flex justify-between items-center shadow-sm z-10 shrink-0">
                                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                                <button onClick={()=>setActiveChatEmail(null)} className="lg:hidden p-2 text-sub-theme bg-gray-100 dark:bg-white/5 rounded-xl hover:text-main shrink-0 transition"><IconChevronLeft className="w-4 h-4"/></button>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-black text-[10px] text-main overflow-hidden border border-theme shrink-0 shadow-sm">
                                                    {(() => {
                                                        const mData = (memberList||[]).find(m => m.email === activeChatEmail);
                                                        return mData?.avatar ? <img src={mData.avatar} className="w-full h-full object-cover"/> : (mData?.name||activeChatEmail||'U').charAt(0).toUpperCase();
                                                    })()}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-main block truncate">{(memberList||[]).find(m => m.email === activeChatEmail)?.name || activeChatEmail}</span>
                                                    <span className="text-[9px] text-sub-theme font-bold uppercase tracking-widest font-mono">{activeChatEmail}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {(adminChats||[]).find(c=>c.id===activeChatEmail)?.status !== 'Selesai' && (
                                                    <button onClick={()=>handleCloseTicket(activeChatEmail)} className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition tooltip border border-emerald-500/30 flex items-center gap-1 shadow-sm hover:scale-105" title="Tandai Selesai">
                                                        <IconCheckCircle className="w-4 h-4"/> <span className="hidden sm:inline text-[9px] uppercase tracking-widest font-black">Selesai</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 custom-scrollbar relative z-10 render-optimized bg-gray-50/50 dark:bg-[#0a0a0a]/50">
                                            <div className="text-center text-[9px] uppercase tracking-widest text-sub-theme font-black bg-card py-1.5 px-4 rounded-full w-fit mx-auto border border-theme mb-4 shadow-sm">Riwayat Obrolan</div>
                                            
                                            {((adminChats||[]).find(c=>c.id===activeChatEmail)?.messages||[]).map((m,i) => {
                                                const trxMatch = m.text.match(/(?:ID|TRX|Pesanan ID):\s*([a-zA-Z0-9_-]+)/i);
                                                const orderIdFromText = trxMatch ? trxMatch[1] : null;
                                                let matchedOrder = null;
                                                if (orderIdFromText) { matchedOrder = (allGlobalOrders||[]).find(o => o.id === orderIdFromText); }

                                                return (
                                                <div key={i} className={`flex w-full ${m.sender==='admin'?'justify-end':'justify-start'} animate-slide-down`}>
                                                    <div className={`flex flex-col ${m.sender==='admin'?'items-end':'items-start'} max-w-[85%] md:max-w-[70%]`}>
                                                        {m.role && m.sender === 'user' && <span className="text-[9px] font-bold uppercase tracking-widest mb-1.5 ml-1 text-primary drop-shadow-sm">{m.role}</span>}
                                                        {m.role && m.sender === 'admin' && <span className="text-[9px] font-bold uppercase tracking-widest mb-1.5 mr-1 text-primary drop-shadow-sm">{m.role}</span>}
                                                        
                                                        <div className="px-4 py-2 text-sm shadow-md font-medium leading-relaxed" 
                                                            style={{ 
                                                                backgroundColor: m.sender === 'admin' ? 'var(--chat-user)' : 'var(--chat-admin)', 
                                                                color: m.sender === 'admin' ? 'var(--chat-text)' : 'var(--chat-text)',
                                                                borderRadius: m.sender === 'admin' ? '1.5rem 1.5rem 0 1.5rem' : '1.5rem 1.5rem 1.5rem 0' 
                                                        }}>
                                                            {m.text}
                                                            <div className={`text-[9px] font-bold mt-1 text-right opacity-70`}>{m.time ? new Date(m.time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                                                        </div>

                                                        {m.sender === 'user' && matchedOrder && (
                                                            <button onClick={() => setAdminTrxModal({isOpen:true, order: matchedOrder})} className="mt-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition flex items-center gap-1 shadow-sm hover:scale-105">
                                                                <IconSearch className="w-3 h-3"/> Cek Validasi Transaksi Ini
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )})}

                                            <div ref={adminChatEndRef} className="h-2"/>
                                        </div>

                                        <div className="p-3 md:p-4 border-t border-theme bg-card z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] shrink-0 pb-safe">
                                            {(adminChats||[]).find(c=>c.id===activeChatEmail)?.status === 'Selesai' && (
                                                <div className="text-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 py-2 rounded-xl mb-3 border border-emerald-500/20 shadow-sm">Tiket ini telah diselesaikan. Pesan baru akan membuka ulang tiket.</div>
                                            )}

                                            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                                                <button onClick={()=>setAdminReplyText("Pesanan sedang diproses. Mohon ditunggu ya.")} className="px-3 py-1.5 bg-primary-light text-primary border border-primary/20 rounded-full text-[10px] font-black whitespace-nowrap hover:bg-primary hover:text-white transition shadow-sm">⏱️ Diproses</button>
                                                <button onClick={()=>setAdminReplyText("Sistem sibuk membutuhkan 3 menit mohon di tunggu.")} className="px-3 py-1.5 bg-primary-light text-primary border border-primary/20 rounded-full text-[10px] font-black whitespace-nowrap hover:bg-primary hover:text-white transition shadow-sm">⏳ Sistem Sibuk</button>
                                                {(chatTemplates||[]).map((t,i)=><button key={i} onClick={()=>setAdminReplyText(t)} className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-sub-theme border border-theme rounded-full text-[10px] font-black whitespace-nowrap hover:bg-gray-200 dark:hover:bg-white/10 transition truncate max-w-[150px] shadow-sm">{t}</button>)}
                                            </div>
                                            <form onSubmit={(e)=>handleAdminSendChat(e, null, false)} className="flex gap-2">
                                                <input type="text" value={adminReplyText} onChange={(e)=>setAdminReplyText(e.target.value)} placeholder="Ketik balasan pesan..." className="flex-1 input-theme rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition shadow-inner" />
                                                <button type="submit" disabled={!(adminReplyText||'').trim()} className="bg-primary hover:bg-primary-hover text-white px-5 rounded-xl font-black transition disabled:opacity-50 shadow-lg shadow-primary/20 hover:scale-105"><IconSend className="w-5 h-5"/></button>
                                            </form>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-sub-theme text-sm bg-gray-50 dark:bg-[#0a0a0a]/50 backdrop-blur-sm">
                                        <div className="w-24 h-24 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-theme shadow-sm"><IconMessageSquare className="w-10 h-10 opacity-30 text-main"/></div>
                                        <p className="font-bold text-center px-6">Buka tab Member VIP di kiri dan pilih pesan untuk merespons.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: PENGATURAN WEB */}
                    {activeAdminTab === 'settings' && (
                        <div className="animate-slide-down space-y-8 overflow-y-auto custom-scrollbar h-full pb-10 px-2">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-black text-main flex items-center gap-2 drop-shadow-sm"><IconSettings className="w-6 h-6 text-red-500"/> Peraturan & Sistem Web</h2>
                            </div>
                            <p className="text-xs text-sub-theme font-medium mb-8">Konfigurasi tampilan antarmuka, banner promosi, tema warna, operasional toko, dan data vital sistem {globalConfig?.appName || 'Vipercell'}.</p>

                            <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-theme shadow-lg space-y-6">
                                <h3 className="font-black text-main text-lg flex items-center gap-2"><IconDatabase className="w-5 h-5 text-primary"/> Konfigurasi Server (Webhook & PPOB)</h3>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-main block">URL Endpoint Server PPOB (Webhook / Digiflazz)</label>
                                    <input type="text" value={adminGasUrl || ''} onChange={(e)=>setAdminGasUrl(e.target.value)} className="w-full input-theme rounded-2xl p-4 text-sm focus:border-primary transition font-mono shadow-sm" placeholder="https://domain-anda.com/webhook.php" />
                                    <p className="text-[10px] text-sub-theme font-bold">Endpoint ini akan menerima perintah eksekusi otomatis untuk meneruskannya ke Digiflazz.</p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-theme mt-4">
                                        <button onClick={saveSettings} className="bg-black text-white dark:bg-white dark:text-black font-black px-6 py-4 rounded-xl text-xs uppercase tracking-widest transition shadow-md hover:scale-105">Simpan Webhook PPOB</button>
                                        <button onClick={triggerSyncAll} disabled={isSyncingDigiflazz || !adminGasUrl} className="flex-1 bg-primary hover:bg-primary-hover text-white font-black px-6 py-4 rounded-xl text-xs uppercase tracking-widest transition shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
                                            {isSyncingDigiflazz ? <IconLoader className="w-4 h-4 animate-spin"/> : <IconRefresh className="w-4 h-4"/>} 
                                            {isSyncingDigiflazz ? 'SINKRONISASI BERJALAN...' : 'Tarik Master Data Digiflazz (1-Klik)'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-theme shadow-lg space-y-6 mt-6">
                                <h3 className="font-black text-main text-lg flex items-center gap-2"><IconWhatsapp className="w-5 h-5 text-green-500"/> Notifikasi & WhatsApp Gateway</h3>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-main block">URL Endpoint WhatsApp API (Terpisah)</label>
                                    <input type="text" value={adminWaEndpoint || ''} onChange={(e)=>setAdminWaEndpoint(e.target.value)} className="w-full input-theme rounded-2xl p-4 text-sm focus:border-green-500 transition font-mono shadow-sm" placeholder="https://wa-server.com/send-message" />
                                    <p className="text-[10px] text-sub-theme font-bold">Digunakan untuk kirim OTP, info login, invoice bayar QRIS, dan alert perubahan status ke pembeli.</p>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-theme">
                                        <button onClick={saveSettings} className="bg-black text-white dark:bg-white dark:text-black font-black px-6 py-4 rounded-xl text-xs uppercase tracking-widest transition shadow-md hover:scale-105">Simpan WA Endpoint</button>
                                        <button onClick={async () => {
                                            if(!adminWaEndpoint) return addToast('Set URL Endpoint WA dulu!', 'warning');
                                            triggerSysLoad('Test WA...');
                                            // Asumsi: sendWhatsApp ada di dalam AppContext atau dapat dipanggil jika dibutuhkan
                                            addToast('Test terkirim', 'success');
                                            closeSysLoad();
                                        }} className="bg-green-600 hover:bg-green-500 text-white font-black px-6 py-4 rounded-xl text-xs uppercase tracking-widest transition shadow-md flex justify-center items-center gap-2">
                                            Test Koneksi WA
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-theme mt-6">
                                    <label className="text-xs font-black text-main block mb-2">Tambahkan Nomor WA Admin (Terima Info Transaksi Masuk)</label>
                                    <p className="text-[10px] text-sub-theme font-bold mb-4">Anda bisa menambahkan lebih dari 5 nomor WA Admin secara bersamaan.</p>
                                    <div className="flex gap-2">
                                        <input type="tel" value={newAdminWa} onChange={(e)=>setNewAdminWa(e.target.value)} placeholder="Misal: 08123456789" className="flex-1 input-theme p-4 rounded-xl text-sm font-mono shadow-sm"/>
                                        <button onClick={handleAddAdminWa} className="bg-green-600 text-white px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:bg-green-500">Tambah</button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                        {(globalConfig?.adminWaNumbers || []).map((admin, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 border border-theme rounded-xl bg-gray-50 dark:bg-navy-900/50 shadow-sm">
                                                <span className="font-mono text-sm font-bold text-main">+{admin.phone}</span>
                                                <button onClick={() => handleDeleteAdminWa(admin.id)} className="text-red-500 hover:text-red-700 bg-red-500/10 p-2 rounded-lg"><IconTrash className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0a0a0a] rounded-2xl border border-gray-800 shadow-inner flex flex-col h-48 font-mono text-[10px] text-green-400 overflow-hidden relative mt-6">
                                <div className="bg-gray-900 p-3 border-b border-gray-800 flex justify-between items-center shrink-0">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <span className="text-gray-400 font-bold tracking-widest uppercase">System Console Log</span>
                                    <button onClick={checkDigiflazzBalance} className="text-primary hover:text-white transition flex items-center gap-1"><IconRefresh className="w-3 h-3"/> Cek Saldo Live</button>
                                </div>
                                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2">
                                    <div className="text-gray-500 mb-2">root@vipercell-server:~# connect_webhook_server</div>
                                    {(dbLogs || []).map((log, i) => (
                                        <div key={i} className="flex gap-3">
                                            <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                            <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}>{log.msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-950/20 p-6 md:p-8 rounded-[2.5rem] border border-red-500/30 shadow-inner">
                                <div className="flex items-center gap-3 mb-2">
                                    <IconTrash className="w-6 h-6 text-red-600"/>
                                    <h3 className="font-black text-red-600 text-lg">Pembersihan Database Berkala</h3>
                                </div>
                                <p className="text-xs text-red-700/80 dark:text-red-400/80 mb-6">Hapus riwayat transaksi (kertas struk) yang berusia lebih dari 30 hari untuk menjaga kecepatan dan meringankan kinerja web.</p>
                                <button onClick={handleCleanupDatabase} className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-md flex items-center gap-2 transition hover:scale-[1.02] disabled:opacity-50">
                                    <IconTrash className="w-4 h-4"/> Eksekusi Pembersihan
                                </button>
                            </div>

                            {/* BANNER MANAGEMENT */}
                            <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-theme shadow-lg space-y-6">
                                <div className="flex justify-between items-center border-b border-theme pb-4">
                                    <h3 className="font-black text-main text-lg flex items-center gap-2"><IconImage className="w-5 h-5 text-primary"/> Manajemen Banner Utama</h3>
                                    <span className="bg-primary-light text-primary px-3 py-1 rounded-lg text-[10px] font-black border border-primary/20">{banners.length} Banner Aktif</span>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <form onSubmit={(e) => { e.preventDefault(); handleAddBanner(); }} className="space-y-4 bg-gray-50 dark:bg-black/30 p-5 rounded-2xl border border-theme shadow-inner">
                                        <p className="text-[10px] font-bold text-sub-theme uppercase tracking-widest mb-4">Formulir Tambah Banner</p>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-main uppercase">Tipe Media</label>
                                                <select value={adminBannerType} onChange={(e)=>setAdminBannerType(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs appearance-none">
                                                    <option value="image">🖼️ Gambar (JPG/PNG)</option>
                                                    <option value="youtube">📺 YouTube Video</option>
                                                    <option value="video">🎥 Video (MP4)</option>
                                                    <option value="tiktok">🎵 TikTok Video</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-main uppercase">Upload Cepat</label>
                                                <div className="relative">
                                                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    <div className="w-full input-theme p-3 rounded-xl border border-dashed text-xs text-center flex items-center justify-center truncate text-sub-theme hover:border-primary transition">
                                                        Pilih File Image
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-main uppercase">URL Banner / ID Media</label>
                                            <input type="text" required value={adminBannerUrl} onChange={(e)=>setAdminBannerUrl(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="URL Gambar / Link YT / Link TikTok"/>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-main uppercase">Judul Utama Teks</label>
                                                <input type="text" value={adminBannerTitle} onChange={(e)=>setAdminBannerTitle(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="Opsional"/>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-main uppercase">Teks Sub-Deskripsi</label>
                                                <input type="text" value={adminBannerDesc} onChange={(e)=>setAdminBannerDesc(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="Opsional"/>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-main uppercase">Link Tujuan Saat Diklik</label>
                                            <input type="text" value={adminBannerLink} onChange={(e)=>setAdminBannerLink(e.target.value)} className="w-full input-theme p-3 rounded-xl text-xs" placeholder="Opsional (Misal: https://wa.me/...)"/>
                                        </div>

                                        <button type="submit" disabled={!adminBannerUrl} className="w-full bg-primary hover:bg-primary-hover text-white font-black p-3 rounded-xl shadow-md transition disabled:opacity-50 text-xs mt-2 uppercase tracking-widest hover:scale-[1.02]">
                                            Tambahkan Banner ke Web
                                        </button>
                                    </form>

                                    <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar h-[350px] pr-2">
                                        {(banners||[]).map((b, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-white/5 border border-theme p-3 rounded-2xl flex gap-3 items-center group relative overflow-hidden shadow-sm">
                                                <div className="w-20 h-16 bg-black rounded-lg overflow-hidden shrink-0 border border-theme relative flex items-center justify-center">
                                                    {b.type === 'image' && <img src={b.url} className="w-full h-full object-cover"/>}
                                                    {b.type === 'youtube' && <span className="text-[8px] text-red-500 font-bold">YOUTUBE</span>}
                                                    {b.type === 'tiktok' && <span className="text-[8px] text-white font-bold">TIKTOK</span>}
                                                    {b.type === 'video' && <span className="text-[8px] text-primary font-bold">VIDEO</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-black text-main truncate mb-0.5">{b.title || 'Tanpa Judul Teks'}</h4>
                                                    <p className="text-[9px] text-sub-theme truncate mb-1">{b.desc || 'Tanpa Deskripsi'}</p>
                                                    {b.targetLink && <a href={b.targetLink} target="_blank" className="text-[8px] text-primary hover:underline truncate inline-block w-full">{b.targetLink}</a>}
                                                </div>
                                                <button onClick={() => {
                                                    requestConfirm('Hapus Banner', 'Hapus banner ini secara permanen?', async () => {
                                                        const newB = [...banners]; newB.splice(idx, 1);
                                                        await setDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'config', 'global'), { banners: newB }, { merge: true });
                                                        addToast('Banner dihapus', 'success');
                                                    }, 'danger', 'Hapus');
                                                }} className="p-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 shrink-0">
                                                    <IconTrash className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                                <div className="bg-gray-50 dark:bg-black/40 p-6 md:p-8 rounded-[2.5rem] border border-theme shadow-inner space-y-6">
                                    <h3 className="font-black text-main text-lg flex items-center gap-2 mb-2"><IconShieldAlert className="w-5 h-5 text-emerald-500"/> Konfigurasi Utama</h3>
                                    
                                    {/* THEME ENGINE PICKER */}
                                    <div className="bg-card p-5 rounded-2xl border border-theme shadow-sm relative overflow-hidden flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full border-2 border-theme overflow-hidden shadow-inner shrink-0 relative">
                                                <input type="color" value={adminSettingsForm.primaryColor} onChange={(e)=>setAdminSettingsForm({...adminSettingsForm, primaryColor: e.target.value})} className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"/>
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-main block">Warna Tema Utama (Primary)</span>
                                                <span className="text-[10px] text-sub-theme uppercase">HEX: {adminSettingsForm.primaryColor}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between bg-card p-5 rounded-2xl border border-theme shadow-sm relative overflow-hidden">
                                            <div>
                                                <span className="text-sm font-bold text-main block mb-1">Status Vipercell</span>
                                                <span className="text-[10px] text-sub-theme">Buka/Tutup Tab Top Up.</span>
                                            </div>
                                            <button onClick={()=>toggleStore('store')} className={`w-14 h-7 rounded-full transition-colors relative shadow-inner z-10 ${isStoreOpen ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
                                                <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-md ${isStoreOpen ? 'translate-x-7' : ''}`}></span>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between bg-card p-5 rounded-2xl border border-theme shadow-sm relative overflow-hidden">
                                            <div>
                                                <span className="text-sm font-bold text-main block mb-1">Status ViperCinema</span>
                                                <span className="text-[10px] text-sub-theme">Buka/Tutup Tab Bioskop.</span>
                                            </div>
                                            <button onClick={()=>toggleStore('cinema')} className={`w-14 h-7 rounded-full transition-colors relative shadow-inner z-10 ${isCinemaOpen ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'}`}>
                                                <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform shadow-md ${isCinemaOpen ? 'translate-x-7' : ''}`}></span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-main mb-2 block">Nama Website (Brand)</label>
                                            <input type="text" value={adminSettingsForm.appName} onChange={(e)=>setAdminSettingsForm({...adminSettingsForm, appName: e.target.value})} className="w-full input-theme rounded-2xl p-4 text-sm focus:border-primary transition font-black shadow-sm" placeholder="VIPERCELL" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-main mb-2 block">Persentase Cashback (%)</label>
                                            <input type="number" step="0.1" value={adminSettingsForm.cashbackPercent} onChange={(e)=>setAdminSettingsForm({...adminSettingsForm, cashbackPercent: e.target.value})} className="w-full input-theme rounded-2xl p-4 text-sm focus:border-primary transition font-mono shadow-sm" placeholder="Contoh: 2" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="text-xs font-black text-main mb-2 block">API Key Web Firebase</label>
                                            <input type="text" value={adminApiKey} onChange={(e)=>setAdminApiKey(e.target.value)} className="w-full input-theme rounded-2xl p-4 text-sm focus:border-primary transition font-mono shadow-sm" placeholder="AIzaSy..." />
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-500/20 mt-4 shadow-sm">
                                        <label className="text-xs font-black text-purple-700 dark:text-purple-400 mb-2 block flex items-center gap-2"><IconQrcode className="w-4 h-4"/> String QRIS Pembayaran (Dinamis)</label>
                                        <input type="text" value={adminSettingsForm.baseQris} onChange={(e)=>setAdminSettingsForm({...adminSettingsForm, baseQris: e.target.value})} className="w-full input-theme rounded-xl p-3 text-xs focus:border-purple-500 transition font-mono shadow-inner" placeholder="Masukkan string data QRIS murni Anda di sini..." />
                                        <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-2 font-medium">Jika string kosong, opsi pembayaran QRIS otomatis disembunyikan. Gunakan hasil decode barcode QRIS statis Anda (String payload murni).</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-main mb-2 block">Teks Berjalan (Running Text)</label>
                                        <p className="text-[10px] text-sub-theme mb-3">Pisahkan dengan baris baru (Enter).</p>
                                        <textarea value={runningTexts.join('\n')} onChange={(e)=>setRunningTexts(e.target.value.split('\n'))} className="w-full h-28 input-theme rounded-2xl p-4 text-sm focus:border-primary transition custom-scrollbar shadow-sm" placeholder="Promo Top Up..."></textarea>
                                    </div>
                                    
                                    <button onClick={saveSettings} className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition shadow-xl mt-2 hover:scale-[1.02]">Simpan Perubahan Sistem</button>
                                </div>

                                <div className="flex flex-col gap-8">
                                    <div className="bg-primary-light p-6 md:p-8 rounded-[2.5rem] border border-primary/30 shadow-inner flex flex-col">
                                        <h3 className="font-black text-primary text-lg mb-2 flex items-center gap-2"><IconBluetooth className="w-6 h-6"/> Pengaturan Printer Bluetooth</h3>
                                        <p className="text-[11px] text-primary/80 mb-6 font-medium leading-relaxed">Hubungkan perangkat kasir Anda dengan printer thermal. Struk cetak otomatis akan keluar saat status pesanan menjadi Pending jika opsi Auto Print diaktifkan.</p>
                                        
                                        <div className="grid grid-cols-2 gap-3 mt-auto">
                                            <button type="button" className="col-span-2 bg-primary hover:bg-primary-hover text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-md transition transform hover:-translate-y-1 flex items-center justify-center gap-2">
                                                <IconBluetooth className="w-4 h-4"/> Hubungkan Printer
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-black/40 p-6 md:p-8 rounded-[2.5rem] border border-theme shadow-inner flex-1">
                                        <h3 className="font-black text-main text-lg flex items-center gap-2 mb-2"><IconSearch className="w-5 h-5 text-primary"/> Link Sosial Media</h3>
                                        <p className="text-[10px] text-sub-theme mb-6">Tautan yang akan muncul di Footer halaman utama website.</p>
                                        
                                        <div className="space-y-4">
                                            {/* Sesuai dengan konfigurasi social */}
                                            <div className="relative group">
                                                <IconWhatsapp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70" />
                                                <input type="text" value={adminSettingsForm.wa} onChange={(e)=>setAdminSettingsForm({...adminSettingsForm, wa: e.target.value})} placeholder="Link WhatsApp Anda" className="w-full input-theme rounded-xl py-3.5 pl-12 pr-4 text-sm shadow-sm" />
                                            </div>
                                            <div className="relative group">
                                                <IconInstagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70" />
                                                <input type="text" value={adminSettingsForm.ig} onChange={(e)=>setAdminSettingsForm({...adminSettingsForm, ig: e.target.value})} placeholder="Link Instagram Anda" className="w-full input-theme rounded-xl py-3.5 pl-12 pr-4 text-sm shadow-sm" />
                                            </div>
                                        </div>
                                        
                                        <button onClick={saveSettings} className="w-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition shadow-xl mt-6 hover:scale-[1.02]">Simpan Tautan Sosmed</button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* TAB: KATALOG & HARGA */}
                    {activeAdminTab === 'katalog' && (
                        <div className="animate-slide-down flex flex-col md:flex-row gap-6 h-full">
                            <div className="w-full md:w-1/3 flex flex-col gap-4 border-r border-theme pr-0 md:pr-4">
                                <h2 className="text-lg font-black text-main flex items-center gap-2 mb-2 drop-shadow-sm"><IconGamepad className="w-5 h-5 text-primary"/> Manajemen Kategori</h2>
                                
                                <form onSubmit={handleSaveGame} className="bg-gray-50 dark:bg-navy-900/50 p-5 rounded-3xl border border-theme shadow-inner text-sm space-y-3 shrink-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-main text-xs uppercase tracking-widest">{editingGameId ? 'Edit Data Game' : 'Tambah Game Baru'}</h3>{editingGameId && <button type="button" onClick={()=>{setEditingGameId(null); setNewGameId(''); setNewGameName(''); setNewGameDev(''); setNewGameImg(''); setNewGameInput('id_zone'); setNewGameCategory('game'); setNewGameInquirySku('');}} className="text-[9px] bg-gray-200 dark:bg-navy-800 px-2 py-1 rounded text-main font-bold border border-theme shadow-sm">Batal Edit</button>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Kategori Utama</label>
                                        <select value={newGameCategory} onChange={(e)=>setNewGameCategory(e.target.value)} className="w-full input-theme p-3 rounded-xl focus:border-primary transition appearance-none shadow-sm border border-theme">
                                            <option value="game">🎮 Top Up Game</option>
                                            <option value="pulsa">📱 Pulsa & Data</option>
                                            <option value="emoney">💸 E-Money / Saldo</option>
                                            <option value="pln">⚡ Token PLN</option>
                                            <option value="pascabayar">🧾 Tagihan Pascabayar</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">ID Database Unik</label>
                                        <input type="text" required value={newGameId} onChange={(e)=>setNewGameId(e.target.value.toLowerCase().replace(/\s+/g, ''))} disabled={editingGameId!==null} placeholder="contoh: mlbb" className="w-full input-theme p-3 rounded-xl focus:border-primary transition disabled:opacity-50 shadow-sm"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Nama Game / Provider</label>
                                        <input type="text" required value={newGameName} onChange={(e)=>setNewGameName(e.target.value)} placeholder="Mobile Legends / Telkomsel" className="w-full input-theme p-3 rounded-xl focus:border-primary transition shadow-sm"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Tipe ID Tujuan</label>
                                        <select value={newGameInput} onChange={(e)=>setNewGameInput(e.target.value)} className="w-full input-theme p-3 rounded-xl focus:border-primary transition appearance-none shadow-sm border border-theme">
                                            <option value="id_zone">Butuh User ID & Zone ID</option>
                                            <option value="id_only">Hanya User ID / Nomor HP</option>
                                            <option value="riot_id">Riot ID & Tagline (#)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 border-t border-theme pt-3 mt-1">
                                        <label className="text-[9px] text-primary font-black uppercase tracking-widest">Kode SKU Digiflazz Cek ID</label>
                                        <input type="text" value={newGameInquirySku} onChange={(e)=>setNewGameInquirySku(e.target.value)} placeholder="Contoh: CEKML / PLN" className="w-full input-theme p-3 rounded-xl focus:border-primary transition shadow-sm font-mono"/>
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Cover / Logo Provider</label>
                                        <div className="relative group">
                                            <input type="file" accept="image/*" onChange={async (e) => {
                                                if(e.target.files[0]) {
                                                    setUploadingGameImg(true); 
                                                    try { const res = await compressImage(e.target.files[0], 300); setNewGameImg(res); } catch(err) { addToast('Gagal memproses gambar', 'error'); }
                                                    setUploadingGameImg(false);
                                                }
                                            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="w-full input-theme p-3 rounded-xl border border-dashed text-xs text-center flex items-center justify-center gap-2 group-hover:border-primary transition shadow-sm">
                                                {uploadingGameImg ? <IconLoader className="w-4 h-4 animate-spin"/> : <><IconUpload className="w-4 h-4"/> {newGameImg ? 'Ganti Gambar (Klik)' : 'Pilih Gambar dari HP'}</>}
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg mt-2 transition hover:scale-[1.02]">Simpan Data</button>
                                </form>
                                
                                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-navy-900/50 rounded-3xl p-3 border border-theme custom-scrollbar space-y-2 shadow-inner render-optimized">
                                    <h3 className="text-[10px] font-black text-sub-theme px-2 py-1 uppercase tracking-widest">Daftar Kategori Tersimpan</h3>
                                    {(games||[]).map(g => ( 
                                        <div key={g.id} onClick={()=>setAdminSelectedGame(g.id)} className={`p-3 rounded-2xl flex justify-between items-center cursor-pointer transition border shadow-sm ${adminSelectedGame===g.id ? 'bg-primary-light border-primary/50 scale-[1.02]' : 'bg-card border-theme hover:border-primary/30'} ${!(g.isVisible ?? true) ? 'opacity-50 grayscale' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <img src={g.image} className="w-10 h-10 rounded-xl object-cover border border-theme shadow-sm"/>
                                                <div>
                                                    <div className={`text-xs font-black truncate max-w-[100px] ${adminSelectedGame===g.id ? 'text-primary' : 'text-main'}`}>{g.name}</div>
                                                    <div className="text-[9px] text-sub-theme font-bold uppercase mt-0.5">{g.category || 'Game'}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                <div className="flex gap-1">
                                                    <button onClick={(e)=>{e.stopPropagation(); toggleGameVisibility(g)}} className="text-gray-400 hover:text-primary p-1.5 bg-gray-100 dark:bg-navy-800 border border-theme rounded-lg transition" title={(g.isVisible ?? true) ? "Sembunyikan" : "Tampilkan"}>
                                                        {(g.isVisible ?? true) ? <IconEye className="w-3.5 h-3.5"/> : <IconEyeOff className="w-3.5 h-3.5"/>}
                                                    </button>
                                                    <button onClick={(e)=>{e.stopPropagation(); handleEditGameClick(g)}} className="text-gray-400 hover:text-main p-1.5 bg-gray-100 dark:bg-navy-800 border border-theme rounded-lg transition"><IconEdit className="w-3.5 h-3.5"/></button>
                                                    <button onClick={(e)=>{e.stopPropagation(); handleDeleteGame(g.id)}} className="text-gray-400 hover:text-red-500 p-1.5 bg-gray-100 dark:bg-navy-800 border border-theme rounded-lg transition"><IconTrash className="w-3.5 h-3.5"/></button>
                                                </div>
                                            </div>
                                        </div> 
                                    ))}
                                </div>
                            </div>

                            <div className="w-full md:w-2/3 flex flex-col gap-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-black text-main flex items-center gap-2 drop-shadow-sm"><IconBox className="w-5 h-5 text-emerald-500"/> Pusat Data Harga Sistem</h2>
                                </div>

                                <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-3xl border border-orange-500/40 flex flex-col gap-4 shadow-inner shrink-0">
                                    <div className="flex items-center gap-2 border-b border-orange-500/20 pb-3">
                                        <IconTrendingUp className="w-4 h-4 text-orange-600"/>
                                        <h3 className="text-xs font-black text-orange-700 dark:text-orange-500 uppercase tracking-widest">Markup Harga Massal (Per Game)</h3>
                                    </div>
                                    <form onSubmit={handleBulkMarkup} className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] text-orange-600 font-bold uppercase ml-1">Tipe Markup</label>
                                            <select value={bulkMarkupForm.type} onChange={(e)=>setBulkMarkupForm({...bulkMarkupForm, type: e.target.value})} className="w-full input-theme p-3.5 rounded-xl text-xs appearance-none border border-orange-500/30">
                                                <option value="fixed">Tambah Nominal (Rp)</option>
                                                <option value="percent">Tambah Persentase (%)</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] text-orange-600 font-bold uppercase ml-1">Untung User Biasa</label>
                                            <input type="number" required value={bulkMarkupForm.value} onChange={(e)=>setBulkMarkupForm({...bulkMarkupForm, value: e.target.value})} placeholder="Contoh: 1500" className="w-full input-theme p-3.5 rounded-xl text-xs font-mono border border-orange-500/30"/>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] text-orange-600 font-bold uppercase ml-1">Untung Reseller VIP</label>
                                            <input type="number" value={bulkMarkupForm.resellerValue} onChange={(e)=>setBulkMarkupForm({...bulkMarkupForm, resellerValue: e.target.value})} placeholder="Opsional (500)" className="w-full input-theme p-3.5 rounded-xl text-xs font-mono border border-orange-500/30"/>
                                        </div>
                                        <div className="flex items-end">
                                            <button type="submit" disabled={!adminSelectedGame} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50">Terapkan Massal</button>
                                        </div>
                                    </form>
                                </div>

                                <form onSubmit={handleSaveItem} className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-500/40 flex flex-col gap-4 shrink-0 shadow-inner mt-2">
                                    <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3">
                                        <IconPercent className="w-4 h-4 text-emerald-600"/>
                                        <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Penambahan/Edit Manual Produk</h3>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-[2] space-y-1">
                                            <label className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest ml-1">Nama Produk</label>
                                            <input type="text" required value={newItemName}
                                            onChange={(e)=>setNewItemName(e.target.value)} placeholder="Contoh: ML 86 Diamond" disabled={!adminSelectedGame} className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-emerald-500 transition disabled:opacity-50 shadow-sm"/>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest ml-1">Harga Modal (Rp)</label>
                                            <input type="number" required value={newItemPrice} onChange={(e)=>setNewItemPrice(e.target.value)} placeholder="20000" disabled={!adminSelectedGame} className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-emerald-500 transition disabled:opacity-50 font-mono shadow-sm"/>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-navy-900/50 p-3 rounded-2xl border border-emerald-500/30">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest ml-1">Tipe Markup Manual</label>
                                            <select value={markupForm.type} onChange={(e)=>setMarkupForm({...markupForm, type: e.target.value})} className="w-full input-theme p-3 rounded-xl text-xs focus:border-emerald-500 transition appearance-none shadow-sm border border-emerald-500/30">
                                                <option value="fixed">Tambah Nominal Tetap (Rp)</option>
                                                <option value="percent">Tambah Persentase (%)</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest ml-1">Keuntungan Web (User)</label>
                                            <input type="number" value={markupForm.value} onChange={(e)=>setMarkupForm({...markupForm, value: e.target.value})} placeholder="Contoh: 1500" className="w-full input-theme p-3 rounded-xl text-xs focus:border-emerald-500 transition font-mono shadow-sm border border-emerald-500/30"/>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest ml-1">Keuntungan Reseller VIP</label>
                                            <input type="number" value={markupForm.resellerValue} onChange={(e)=>setMarkupForm({...markupForm, resellerValue: e.target.value})} placeholder="Contoh: 500" className="w-full input-theme p-3 rounded-xl text-xs focus:border-emerald-500 transition font-mono shadow-sm border border-emerald-500/30"/>
                                        </div>
                                        <div className="flex items-end sm:w-[120px]">
                                            <button type="submit" disabled={!adminSelectedGame} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 transition disabled:opacity-50 hover:scale-[1.02]">{editingItemId ? 'Update' : 'Publish'}</button>
                                            {editingItemId && <button type="button" onClick={()=>{setEditingItemId(null); setNewItemName(''); setNewItemPrice(''); setNewResellerPrice('');}} className="ml-2 bg-red-500/10 text-red-500 px-3 py-3 rounded-xl hover:bg-red-500 hover:text-white transition"><IconX className="w-4 h-4"/></button>}
                                        </div>
                                    </div>
                                </form>
                                
                                <div className="flex-1 bg-gray-50 dark:bg-navy-900/50 rounded-3xl p-5 border border-theme overflow-y-auto custom-scrollbar shadow-inner render-optimized">
                                    <h3 className="text-[10px] font-black text-sub-theme mb-4 uppercase tracking-widest flex justify-between items-center">
                                        <span>Daftar Produk Aktif di Web</span>
                                        <span className="bg-primary text-white px-2 py-0.5 rounded shadow-sm">{(items||[]).filter(i=>i.gameId===adminSelectedGame).length} Item</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {(items||[]).filter(i=>i.gameId===adminSelectedGame).sort((a,b)=>a.price-b.price).map(i => (
                                            <div key={i.id} className={`bg-card p-4 rounded-2xl flex flex-col justify-between border border-theme hover:border-emerald-500/50 transition group relative overflow-hidden shadow-sm hover:-translate-y-0.5 ${!(i.isVisible ?? true) ? 'opacity-50 grayscale' : ''}`}>
                                                {((i.sku || '').startsWith('CEK') || (i.name || '').startsWith('CEK')) && <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-xl z-10">🔍 SKU CEK ID</div>}
                                                <div className="mb-4 relative z-10">
                                                    <div className="text-main font-bold text-sm leading-tight mb-1 pr-10">{i.name}</div>
                                                    <div className="text-[9px] font-mono text-sub-theme bg-gray-100 dark:bg-black px-2 py-0.5 rounded border border-theme w-fit mb-3">SKU: {i.sku || '-'}</div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[9px] border-b border-theme pb-1">
                                                            <span className="text-sub-theme font-black uppercase">Modal Asli</span>
                                                            <span className="font-mono font-bold text-main">{formatRupiah(i.modalPrice || i.price)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[9px] border-b border-theme pb-1">
                                                            <span className="text-orange-500 font-black uppercase">Harga Reseller</span>
                                                            <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{formatRupiah(i.resellerPrice || i.price)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] pt-1">
                                                            <span className="text-emerald-500 font-black uppercase">Harga Web</span>
                                                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(i.price)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center relative z-10 pt-3 border-t border-theme mt-auto">
                                                    <div>
                                                        {!(i.isVisible ?? true) && <span className="text-[8px] font-black text-red-500 uppercase">Sembunyi</span>}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={()=>toggleItemVisibility(i)} className="text-gray-400 hover:text-primary p-2 bg-gray-100 dark:bg-navy-800 border border-theme rounded-lg transition shadow-sm hover:border-primary/30 flex items-center gap-1 text-[10px] font-black uppercase" title={(i.isVisible ?? true) ? 'Sembunyikan' : 'Tampilkan'}>{(i.isVisible ?? true) ? <IconEye className="w-3.5 h-3.5"/> : <IconEyeOff className="w-3.5 h-3.5"/>}</button>
                                                        <button onClick={()=>handleEditItemClick(adminSelectedGame, i)} className="text-gray-400 hover:text-emerald-500 p-2 bg-gray-100 dark:bg-navy-800 border border-theme rounded-lg transition shadow-sm hover:border-emerald-500/30 flex items-center gap-1 text-[10px] font-black uppercase"><IconEdit className="w-3.5 h-3.5"/></button>
                                                        <button onClick={()=>handleDeleteItem(i.id)} className="text-gray-400 hover:text-red-500 p-2 bg-gray-100 dark:bg-navy-800 border border-theme rounded-lg transition shadow-sm hover:border-red-500/30"><IconTrash className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB PROMO, BLOG, DAN CINEMA DILANJUTKAN DENGAN POLA YANG SAMA */}
                    {activeAdminTab === 'promo' && (
                        <div className="animate-slide-down flex flex-col h-full w-full space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-2">
                                <div>
                                    <h2 className="text-2xl font-black text-main flex items-center gap-2 drop-shadow-sm"><IconPercent className="w-6 h-6 text-primary"/> Pusat Promosi & Event</h2>
                                    <p className="text-xs text-sub-theme font-medium mt-1">Kelola Diskon Otomatis, Promo Per Game, Flash Sale, Kupon, dan Event Harian.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-6">
                                <div className="lg:col-span-5 flex flex-col h-full">
                                    <form onSubmit={handleSavePromo} className="w-full bg-gray-50 dark:bg-navy-900/50 p-6 md:p-8 rounded-[2.5rem] border border-theme shadow-inner h-fit">
                                        <h3 className="text-lg font-black text-main mb-6 drop-shadow-sm">Formulir Terbitkan Promo</h3>
                                        
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                                            <button type="button" onClick={()=>setPromoModalType('item')} className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition shadow-sm ${promoModalType==='item' ? 'bg-orange-50 dark:bg-orange-500/20 border-orange-500/60 text-orange-600 dark:text-orange-400 scale-[1.02]' : 'bg-card border-theme text-sub-theme hover:border-orange-300'}`}>🎯 Diskon Item</button>
                                            <button type="button" onClick={()=>setPromoModalType('game')} className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition shadow-sm ${promoModalType==='game' ? 'bg-primary-light border-primary/60 text-primary scale-[1.02]' : 'bg-card border-theme text-sub-theme hover:border-primary/30'}`}>🎮 Promo Game</button>
                                            <button type="button" onClick={()=>setPromoModalType('flash')} className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition shadow-sm ${promoModalType==='flash' ? 'bg-red-50 dark:bg-red-500/20 border-red-500/60 text-red-600 dark:text-red-400 scale-[1.02]' : 'bg-card border-theme text-sub-theme hover:border-red-300'}`}>⚡ Flash Sale</button>
                                            <button type="button" onClick={()=>setPromoModalType('code')} className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition shadow-sm ${promoModalType==='code' ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500/60 text-purple-600 dark:text-purple-400 scale-[1.02]' : 'bg-card border-theme text-sub-theme hover:border-purple-300'}`}>🔑 Kode Kupon</button>
                                            <button type="button" onClick={()=>setPromoModalType('day')} className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition shadow-sm ${promoModalType==='day' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500/60 text-emerald-600 dark:text-emerald-400 scale-[1.02]' : 'bg-card border-theme text-sub-theme hover:border-emerald-300'}`}>📅 Hari Spesial</button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[9px] font-black text-sub-theme uppercase tracking-widest ml-1">Jenis Potongan</label>
                                                    <select value={promoForm.type} onChange={(e)=>setPromoForm({...promoForm, type: e.target.value})} className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-primary appearance-none shadow-sm border border-theme">
                                                        <option value="percentage">Persen (%)</option>
                                                        <option value="fixed">Nominal Harga (Rp)</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[9px] font-black text-sub-theme uppercase tracking-widest ml-1">Besaran Nilai</label>
                                                    <input type="number" required value={promoForm.discount} onChange={(e)=>setPromoForm({...promoForm, discount: e.target.value})} placeholder="Contoh: 10" className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-primary font-mono shadow-sm border border-theme" />
                                                </div>
                                            </div>

                                            {(promoModalType==='flash' || promoModalType==='item') && (
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-sub-theme uppercase tracking-widest ml-1">Target Produk Spesifik</label>
                                                    <select value={promoTargetItem} onChange={(e)=>setPromoTargetItem(e.target.value)} required className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-primary appearance-none shadow-sm border border-theme">
                                                        <option value="">-- Pilih Item dari Katalog --</option>
                                                        {(items||[]).map(i=><option key={i.id} value={i.id}>{((games||[]).find(g=>g.id===i.gameId)?.name || 'Game')} - {i.name} ({formatRupiah(i.price)})</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            {promoModalType==='game' && (
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1">Terapkan Diskon ke Semua Item Game Ini</label>
                                                    <select value={promoTargetGame} onChange={(e)=>setPromoTargetGame(e.target.value)} required className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-primary appearance-none shadow-sm border border-theme">
                                                        <option value="">-- Pilih Game --</option>
                                                        {(games||[]).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            {promoModalType==='flash' && (
                                                <div className="space-y-4 pt-2 border-t border-theme mt-2">
                                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">Mulai Berlaku</label>
                                                            <input type="datetime-local" required value={promoForm.startTime} onChange={(e)=>setPromoForm({...promoForm, startTime: e.target.value})} className="w-full input-theme p-3 rounded-xl text-xs focus:border-red-500 shadow-sm border border-theme"/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">Berakhir Pada</label>
                                                            <input type="datetime-local" required value={promoForm.endTime} onChange={(e)=>setPromoForm({...promoForm, endTime: e.target.value})} className="w-full input-theme p-3 rounded-xl text-xs focus:border-red-500 shadow-sm border border-theme"/>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-1">Batas Kuota / Stok Promo</label>
                                                        <input type="number" required value={promoForm.stock} onChange={(e)=>setPromoForm({...promoForm, stock: e.target.value})} placeholder="Contoh: 50 pembeli pertama" className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-red-500 font-mono shadow-sm border border-theme"/>
                                                    </div>
                                                </div>
                                            )}

                                            {promoModalType==='code' && (
                                                <div className="space-y-4 pt-2 border-t border-theme mt-2">
                                                    <div className="space-y-1 mt-2">
                                                        <label className="text-[9px] font-black text-purple-500 uppercase tracking-widest ml-1">Teks Kode Kupon Rahasia</label>
                                                        <input type="text" required value={promoForm.code} onChange={(e)=>setPromoForm({...promoForm, code: (e.target.value||'').replace(/\s/g, '').toUpperCase()})} placeholder="Ketik Kode (Misal: VIPERPROMO)" className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-purple-500 font-mono uppercase font-black shadow-sm border border-theme"/>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-purple-500 uppercase tracking-widest ml-1">Maks. Pengguna</label>
                                                            <input type="number" required value={promoForm.maxUses} onChange={(e)=>setPromoForm({...promoForm, maxUses: e.target.value})} placeholder="Contoh: 100" className="w-full input-theme p-3 rounded-xl text-sm focus:border-purple-500 font-mono shadow-sm border border-theme"/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-purple-500 uppercase tracking-widest ml-1">Min. Belanja (Rp)</label>
                                                            <input type="number" value={promoForm.minPurchase} onChange={(e)=>setPromoForm({...promoForm, minPurchase: e.target.value})} placeholder="Opsional (0)" className="w-full input-theme p-3 rounded-xl text-sm focus:border-purple-500 font-mono shadow-sm border border-theme"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {promoModalType==='day' && (
                                                <div className="space-y-1 pt-2 border-t border-theme mt-2">
                                                    <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-1 mt-2 block">Pilih Hari Aktif Promo Harian</label>
                                                    <select value={promoForm.targetDay} onChange={(e)=>setPromoForm({...promoForm, targetDay: e.target.value})} className="w-full input-theme p-3.5 rounded-xl text-sm focus:border-emerald-500 appearance-none shadow-sm border border-theme">
                                                        <option value="1">Senin</option><option value="2">Selasa</option><option value="3">Rabu</option><option value="4">Kamis</option><option value="5">Jumat</option><option value="6">Sabtu</option><option value="0">Minggu</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button type="submit" className="w-full bg-black text-white dark:bg-white hover:opacity-80 dark:text-black py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl mt-8 transition transform hover:-translate-y-1 hover:scale-[1.02]">Terbitkan Promo Ke Server</button>
                                    </form>
                                </div>

                                <div className="lg:col-span-7 bg-gray-50 dark:bg-navy-900/50 rounded-[2.5rem] p-6 md:p-8 border border-theme shadow-inner flex flex-col h-full">
                                    <h3 className="text-lg font-black text-main mb-2 drop-shadow-sm">Database Promosi Aktif</h3>
                                    <p className="text-[10px] text-sub-theme mb-6">Daftar semua promo yang sedang atau pernah berjalan di sistem.</p>
                                    
                                    <div className="grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar pr-2 flex-1 pb-6 render-optimized">
                                        {(promos||[]).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).map(p => (
                                            <div key={p.id} className={`p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border transition-all shadow-md relative overflow-hidden group hover:scale-[1.01] ${p.category === 'flash' ? 'border-red-500/40 bg-red-50/90 dark:bg-gradient-to-r from-card to-red-950/40' : p.category === 'code' ? 'border-purple-500/40 bg-purple-50/90 dark:bg-gradient-to-r from-card to-purple-950/40' : p.category === 'game' ? 'border-primary/40 bg-primary-light dark:bg-gradient-to-r from-card to-primary/20' : 'border-theme bg-card'} ${!p.isActive && 'opacity-50 grayscale'}`}>
                                                <div className="flex-1 min-w-0 z-10 relative">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {p.category === 'flash' && <span className="bg-red-500 text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm">⚡ Flash Sale</span>}
                                                        {p.category === 'code' && <span className="bg-purple-500 text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm">🔑 Kode Kupon</span>}
                                                        {p.category === 'item' && <span className="bg-orange-500 text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm">🎯 Diskon Spesifik</span>}
                                                        {p.category === 'game' && <span className="bg-primary text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm">🎮 Promo Game</span>}
                                                        {p.category === 'day' && <span className="bg-emerald-500 text-white text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm">📅 Event Harian</span>}
                                                        <div className="text-base font-black font-mono tracking-widest text-main truncate max-w-[150px] drop-shadow-sm">{p.code || (p.id||'').split('_')[0]}</div>
                                                    </div>
                                                    
                                                    <div className="text-sm font-bold text-sub-theme">
                                                        {p.type === 'percentage' ? <span className="text-orange-600 dark:text-orange-400">Potongan {p.discount}% Off</span> : <span className="text-emerald-600 dark:text-emerald-400">Diskon Tunai {formatRupiah(p.discount)}</span>}
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {p.minPurchase > 0 && <span className="text-[9px] bg-black/5 dark:bg-black/50 border border-theme px-2 py-1 rounded text-main font-mono shadow-inner">Min: {formatRupiah(p.minPurchase)}</span>}
                                                        {p.targetItems?.length > 0 && <span className="text-[9px] bg-orange-500/10 dark:bg-orange-900/30 border border-orange-500/30 px-2 py-1 rounded text-orange-600 dark:text-orange-400 font-bold truncate max-w-[150px] shadow-inner">Khusus: {(items||[]).find(i=>i.id===p.targetItems[0])?.name || 'Item Terpilih'}</span>}
                                                        {p.targetGame && <span className="text-[9px] bg-primary-light border border-primary/30 px-2 py-1 rounded text-primary font-bold truncate max-w-[150px] shadow-inner">Semua Item: {(games||[]).find(g=>g.id===p.targetGame)?.name || 'Game Terpilih'}</span>}
                                                        {(p.maxUses || p.stock) && <span className={`text-[9px] bg-white/50 dark:bg-black/50 border px-2 py-1 rounded font-mono font-bold shadow-inner ${((p.usedBy||[]).length >= (p.maxUses || p.stock)) ? 'border-red-500/40 text-red-600 dark:text-red-400' : 'border-theme text-main'}`}>Terpakai: {(p.usedBy||[]).length||0} / {p.maxUses || p.stock}</span>}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0 shrink-0 z-10 relative">
                                                    <button onClick={() => togglePromoStatus(p.id, p.isActive)} className={`w-12 h-10 rounded-xl transition-all flex items-center justify-center border shadow-sm ${p.isActive ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500 hover:text-white' : 'bg-gray-200 dark:bg-gray-800/80 text-gray-500 border-theme hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-main'}`} title={p.isActive ? 'Nonaktifkan Promo' : 'Aktifkan Kembali'}>
                                                        {p.isActive ? <IconCheckCircle className="w-5 h-5"/> : <IconBlock className="w-5 h-5"/>}
                                                    </button>
                                                    <button onClick={() => requestConfirm('Hapus Promo', 'Hapus permanen promo ini?', () => handleDeletePromo(p.id), 'danger', 'Hapus Promo')} className="w-12 h-10 bg-card border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition flex items-center justify-center shadow-sm group-hover:border-red-500/60" title="Hapus Permanen">
                                                        <IconTrash className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'blog' && (
                        <div className="animate-slide-down flex flex-col lg:flex-row gap-6 h-full">
                            <div className="w-full lg:w-1/3 flex flex-col gap-4 border-r border-theme pr-0 lg:pr-4">
                                <h2 className="text-lg font-black text-main flex items-center gap-2 mb-2 drop-shadow-sm"><IconFileText className="w-5 h-5 text-primary"/> Terbitkan Artikel</h2>
                                
                                <form onSubmit={handleAddBlog} className="bg-gray-50 dark:bg-navy-900/50 p-5 rounded-3xl border border-theme shadow-inner text-sm space-y-3 shrink-0">
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Judul Artikel</label>
                                        <input type="text" required value={adminBlogForm.title} onChange={(e)=>setAdminBlogForm({...adminBlogForm, title: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-primary transition shadow-sm" placeholder="Contoh: Server MLBB Gangguan"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Kategori Berita</label>
                                        <select value={adminBlogForm.category} onChange={(e)=>setAdminBlogForm({...adminBlogForm, category: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-primary transition appearance-none shadow-sm border border-theme">
                                            <option value="INFO">Informasi Umum</option>
                                            <option value="EVENT">Event / Promo</option>
                                            <option value="WARNING">Gangguan Server</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Isi Berita</label>
                                        <textarea required value={adminBlogForm.content} onChange={(e)=>setAdminBlogForm({...adminBlogForm, content: e.target.value})} className="w-full h-32 input-theme p-3 rounded-xl focus:border-primary transition shadow-sm resize-none custom-scrollbar" placeholder="Isi berita lengkap..."></textarea>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Cover Gambar (Opsional)</label>
                                        <div className="relative group">
                                            <input type="file" accept="image/*" onChange={async (e) => {
                                                if(e.target.files[0]) {
                                                    setUploadingGameImg(true); 
                                                    try { const res = await compressImage(e.target.files[0], 600); setAdminBlogForm({...adminBlogForm, image: res}); } catch(err) {}
                                                    setUploadingGameImg(false);
                                                }
                                            }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            <div className="w-full input-theme p-3 rounded-xl border border-dashed text-xs text-center flex items-center justify-center gap-2 group-hover:border-primary transition shadow-sm">
                                                {uploadingGameImg ? <IconLoader className="w-4 h-4 animate-spin"/> : <><IconUpload className="w-4 h-4"/> {adminBlogForm.image ? 'Ganti Cover' : 'Upload Cover'}</>}
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg mt-2 transition hover:scale-[1.02]">Terbitkan Artikel</button>
                                </form>
                            </div>

                            <div className="w-full lg:w-2/3 flex flex-col h-[70vh] lg:h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-black text-main flex items-center gap-2 drop-shadow-sm"><IconList className="w-5 h-5 text-primary"/> Artikel Tersimpan</h2>
                                    <span className="text-[10px] bg-card border border-theme px-3 py-1.5 rounded-lg text-main font-bold shadow-sm">Total: {(blogs||[]).length} Artikel</span>
                                </div>
                                
                                <div className="flex-1 bg-gray-50 dark:bg-navy-900/50 rounded-[2.5rem] p-5 border border-theme overflow-y-auto custom-scrollbar shadow-inner render-optimized space-y-4">
                                    {(blogs||[]).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(blog => (
                                        <div key={blog.id} onClick={() => setActiveBlog(blog)} className="bg-card p-5 rounded-2xl flex flex-col sm:flex-row gap-4 border border-theme shadow-sm relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform">
                                            {blog.image && <img src={blog.image} className="w-full sm:w-32 h-32 rounded-xl object-cover border border-theme shadow-sm shrink-0"/>}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm border ${blog.category==='INFO'?'bg-blue-500/10 text-blue-600 border-blue-500/30':blog.category==='EVENT'?'bg-primary-light text-primary border-primary/30':'bg-red-500/10 text-red-600 border-red-500/30'}`}>{blog.category}</span>
                                                    <span className="text-[9px] text-sub-theme font-bold">{new Date(blog.createdAt).toLocaleDateString('id-ID')}</span>
                                                </div>
                                                <h3 className="text-sm font-black text-main mb-1 line-clamp-1">{blog.title}</h3>
                                                <p className="text-[10px] text-sub-theme line-clamp-2 leading-relaxed">{blog.content}</p>
                                            </div>
                                            <button onClick={(e)=>{e.stopPropagation(); handleDeleteBlog(blog.id)}} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2 bg-gray-100 dark:bg-navy-800 border border-theme rounded-lg transition shadow-sm opacity-0 group-hover:opacity-100"><IconTrash className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    {(!blogs || blogs.length === 0) && (
                                        <div className="flex flex-col items-center justify-center py-24 text-sub-theme border border-dashed border-theme rounded-[2rem] bg-white/50 dark:bg-white/5 h-full">
                                            <IconFileText className="w-12 h-12 mb-4 opacity-30"/>
                                            <span className="font-bold text-sm">Belum ada artikel berita.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeAdminTab === 'cinema' && (
                        <div className="animate-slide-down flex flex-col lg:flex-row gap-6 h-full">
                            <div className="w-full lg:w-1/3 flex flex-col gap-4 border-r border-theme pr-0 lg:pr-4">
                                <div className="flex bg-card border border-theme p-1 rounded-xl shadow-sm mb-2">
                                    <button onClick={()=>setAdminCinemaTab('movies')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${adminCinemaTab==='movies' ? 'bg-primary text-white' : 'text-sub-theme hover:bg-gray-100 dark:hover:bg-navy-800'}`}>Kelola Film</button>
                                    <button onClick={()=>setAdminCinemaTab('pos')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${adminCinemaTab==='pos' ? 'bg-emerald-500 text-white' : 'text-sub-theme hover:bg-gray-100 dark:hover:bg-navy-800'}`}>Kasir POS</button>
                                    <button onClick={()=>setAdminCinemaTab('vote')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition ${adminCinemaTab==='vote' ? 'bg-orange-500 text-white' : 'text-sub-theme hover:bg-gray-100 dark:hover:bg-navy-800'}`}>Vote</button>
                                </div>

                                {adminCinemaTab === 'movies' && (
                                    <form onSubmit={async (e)=>{
                                        e.preventDefault(); triggerSysLoad('Menyimpan Film...');
                                        try {
                                            const movieId = `movie_${Date.now()}`;
                                            await setDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_movies', movieId), {
                                                id: movieId, title: adminCinemaForm.title, poster: adminCinemaForm.poster, priceReg: Number(adminCinemaForm.priceReg), priceVip: Number(adminCinemaForm.priceVip), showTime: adminCinemaForm.showTime, vipSeats: Number(adminCinemaForm.vipSeats || 5), regSeats: Number(adminCinemaForm.regSeats || 15)
                                            });
                                            setAdminCinemaForm({title:'', poster:'', priceReg:'', priceVip:'', showTime:'', vipSeats: 5, regSeats: 15});
                                            addToast('Film Berhasil Ditambahkan!', 'success');
                                        } catch(err) { addToast('Gagal', 'error'); } finally { closeSysLoad(); }
                                    }} className="bg-gray-50 dark:bg-navy-900/50 p-5 rounded-3xl border border-theme shadow-inner text-sm space-y-3 shrink-0">
                                        <div className="space-y-1"><label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Judul Film</label><input type="text" required value={adminCinemaForm.title} onChange={(e)=>setAdminCinemaForm({...adminCinemaForm, title: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-primary shadow-sm" placeholder="Contoh: The Avengers"/></div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Poster Film</label>
                                            <div className="relative group">
                                                <input type="file" accept="image/*" onChange={async (e) => {
                                                    if(e.target.files[0]) {
                                                        setUploadingPoster(true); 
                                                        try { const res = await compressImage(e.target.files[0], 600); setAdminCinemaForm({...adminCinemaForm, poster: res}); } catch(err) {}
                                                        setUploadingPoster(false);
                                                    }
                                                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <div className="w-full input-theme p-3 rounded-xl border border-dashed text-xs text-center flex items-center justify-center gap-2 group-hover:border-primary transition shadow-sm">
                                                    {uploadingPoster ? <IconLoader className="w-4 h-4 animate-spin"/> : <><IconUpload className="w-4 h-4"/> {adminCinemaForm.poster ? 'Ganti Poster' : 'Upload dari HP'}</>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="space-y-1 flex-1"><label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Harga Reguler</label><input type="number" required value={adminCinemaForm.priceReg} onChange={(e)=>setAdminCinemaForm({...adminCinemaForm, priceReg: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-primary font-mono shadow-sm" placeholder="35000"/></div>
                                            <div className="space-y-1 flex-1"><label className="text-[9px] text-yellow-600 font-bold uppercase tracking-widest">Harga VIP</label><input type="number" required value={adminCinemaForm.priceVip} onChange={(e)=>setAdminCinemaForm({...adminCinemaForm, priceVip: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-yellow-500 font-mono shadow-sm border-yellow-500/30" placeholder="50000"/></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="space-y-1 flex-[2]"><label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Waktu Tayang</label><input type="datetime-local" required value={adminCinemaForm.showTime} onChange={(e)=>setAdminCinemaForm({...adminCinemaForm, showTime: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-primary shadow-sm"/></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="space-y-1 flex-1"><label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Kapasitas VIP</label><input type="number" min="1" max="10" required value={adminCinemaForm.vipSeats} onChange={(e)=>setAdminCinemaForm({...adminCinemaForm, vipSeats: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-yellow-500 shadow-sm text-center border-yellow-500/30" placeholder="5"/></div>
                                            <div className="space-y-1 flex-1"><label className="text-[9px] text-sub-theme font-bold uppercase tracking-widest">Kapasitas Reguler</label><input type="number" min="1" max="100" required value={adminCinemaForm.regSeats} onChange={(e)=>setAdminCinemaForm({...adminCinemaForm, regSeats: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-cyan-500 shadow-sm text-center border-cyan-500/30" placeholder="15"/></div>
                                        </div>
                                        <button type="submit" disabled={!adminCinemaForm.poster} className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg mt-2 transition hover:scale-[1.02] disabled:opacity-50">Tayangkan Film</button>
                                    </form>
                                )}

                                {adminCinemaTab === 'pos' && (
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-500/30 shadow-inner text-sm space-y-3 shrink-0">
                                        <h3 className="font-black text-emerald-600 text-sm mb-2 flex items-center gap-2"><IconBanknote className="w-4 h-4"/> Kasir Pembelian Tunai</h3>
                                        <div className="space-y-1"><label className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Pilih Film</label>
                                            <select value={activeCinemaMovie?.id || ''} onChange={(e)=> {
                                                const mv = cinemaMovies.find(m => m.id === e.target.value);
                                                setActiveCinemaMovie(mv || null);
                                                setSelectedSeats([]);
                                            }} className="w-full input-theme p-3 rounded-xl focus:border-emerald-500 appearance-none shadow-sm border border-emerald-500/30">
                                                <option value="">-- Pilih Film Tayang --</option>
                                                {(cinemaMovies||[]).map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1"><label className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Nama Pelanggan / Cashier</label><input type="text" required value={adminPosForm.userName} onChange={(e)=>setAdminPosForm({userName: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-emerald-500 shadow-sm border border-emerald-500/30" placeholder="Nama Pembeli"/></div>
                                        <button onClick={() => {
                                            if(!activeCinemaMovie) return addToast('Pilih film dulu!', 'warning');
                                            if(selectedSeats.length === 0) return addToast('Pilih kursi di panel kanan!', 'warning');
                                            if(!adminPosForm.userName) return addToast('Isi nama pembeli!', 'warning');
                                            
                                            const priceToPay = selectedSeats.reduce((a, s) => a + (s.startsWith('V') ? activeCinemaMovie.priceVip : activeCinemaMovie.priceReg), 0);
                                            requestConfirm('Cetak Tiket Fisik', `Terima uang cash sejumlah ${formatRupiah(priceToPay)} dan cetak ${selectedSeats.length} tiket?`, async () => {
                                                triggerSysLoad('Mencetak Tiket...');
                                                try {
                                                    const batch = writeBatch(db);
                                                    let lastTixData = null;
                                                    selectedSeats.forEach(seat => {
                                                        const ticketId = 'TIX-' + Date.now().toString(36).toUpperCase() + '-' + seat;
                                                        const tixData = { id: ticketId, movieId: activeCinemaMovie.id, movieTitle: activeCinemaMovie.title, seat: seat, class: seat.startsWith('V') ? 'VIP' : 'Reguler', userEmail: authUser.email, userName: adminPosForm.userName, price: seat.startsWith('V') ? activeCinemaMovie.priceVip : activeCinemaMovie.priceReg, showTime: activeCinemaMovie.showTime, createdAt: new Date().toISOString(), status: 'Scanned' };
                                                        batch.set(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_bookings', ticketId), tixData);
                                                        lastTixData = tixData;
                                                        printCinemaTicket(tixData);
                                                    });
                                                    await batch.commit();
                                                    addToast(`Berhasil Cetak ${selectedSeats.length} Tiket!`, 'success');
                                                    setSelectedSeats([]);
                                                    setAdminPosForm({userName:''});
                                                } catch(e) { addToast('Gagal memproses', 'error'); } finally { closeSysLoad(); }
                                            }, 'success', 'Cetak Tiket');
                                        }} disabled={selectedSeats.length === 0 || !activeCinemaMovie || !adminPosForm.userName} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg mt-2 transition hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"><IconPrinter className="w-4 h-4"/> Print Tiket Fisik</button>
                                    </div>
                                )}

                                {adminCinemaTab === 'vote' && (
                                    <form onSubmit={async (e)=>{
                                        e.preventDefault(); triggerSysLoad('Menyimpan Kandidat...');
                                        try {
                                            await setDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_polls', `poll_${Date.now()}`), {
                                                title: adminPollForm.title, poster: adminPollForm.poster, votes: []
                                            });
                                            setAdminPollForm({title:'', poster:''});
                                            addToast('Kandidat Ditambahkan!', 'success');
                                        } catch(err) { addToast('Gagal', 'error'); } finally { closeSysLoad(); }
                                    }} className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-3xl border border-orange-500/30 shadow-inner text-sm space-y-3 shrink-0">
                                        <div className="space-y-1"><label className="text-[9px] text-orange-600 font-bold uppercase tracking-widest">Judul Film (Kandidat)</label><input type="text" required value={adminPollForm.title} onChange={(e)=>setAdminPollForm({...adminPollForm, title: e.target.value})} className="w-full input-theme p-3 rounded-xl focus:border-orange-500 shadow-sm border border-orange-500/30" placeholder="Judul Film..."/></div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-orange-600 font-bold uppercase tracking-widest">Poster Cover</label>
                                            <div className="relative group">
                                                <input type="file" accept="image/*" onChange={async (e) => {
                                                    if(e.target.files[0]) {
                                                        setUploadingPoster(true); 
                                                        try { const res = await compressImage(e.target.files[0], 600); setAdminPollForm({...adminPollForm, poster: res}); } catch(err) {}
                                                        setUploadingPoster(false);
                                                    }
                                                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <div className="w-full input-theme p-3 rounded-xl border border-dashed text-xs text-center flex items-center justify-center gap-2 group-hover:border-orange-500 transition shadow-sm border-orange-500/30">
                                                    {uploadingPoster ? <IconLoader className="w-4 h-4 animate-spin text-orange-500"/> : <><IconUpload className="w-4 h-4 text-orange-500"/> {adminPollForm.poster ? 'Ganti Poster' : 'Upload dari HP'}</>}
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={!adminPollForm.poster} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg mt-2 transition hover:scale-[1.02] disabled:opacity-50">Tambahkan Kandidat</button>
                                    </form>
                                )}
                            </div>

                            <div className="w-full lg:w-2/3 flex flex-col h-[70vh] lg:h-full">
                                {adminCinemaTab === 'movies' && (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-black text-main flex items-center gap-2 drop-shadow-sm"><IconList className="w-5 h-5 text-primary"/> Daftar Film Tayang</h2>
                                            {globalConfig?.cinemaBellSound && (
                                                <button onClick={() => { const audio = new Audio(globalConfig.cinemaBellSound); audio.play(); addToast('Membunyikan Peringatan Teater', 'info'); }} className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md flex items-center gap-2 transition hover:scale-105">🔔 Bunyikan Bel Teater</button>
                                            )}
                                        </div>
                                        <div className="flex-1 bg-gray-50 dark:bg-navy-900/50 rounded-[2.5rem] p-5 border border-theme overflow-y-auto custom-scrollbar shadow-inner space-y-4">
                                            {(cinemaMovies||[]).map(movie => (
                                                <div key={movie.id} className="bg-card p-4 rounded-2xl flex items-center justify-between border border-theme shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <img src={movie.poster} className="w-12 h-16 rounded object-cover border border-theme"/>
                                                        <div>
                                                            <h3 className="text-sm font-black text-main">{movie.title}</h3>
                                                            <p className="text-[10px] font-bold text-primary mt-1">{formatDateTimeWIT(movie.showTime)} | VIP: {formatRupiah(movie.priceVip)}</p>
                                                            <p className="text-[9px] text-sub-theme font-mono mt-1">Tiket Terjual: {cinemaBookings.filter(b=>b.movieId===movie.id).length} / {(movie.vipSeats || 5) + (movie.regSeats || 15)} Kursi</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={async () => {
                                                        requestConfirm('Hapus Film', 'Hapus film ini beserta riwayat tiketnya?', async () => {
                                                            triggerSysLoad('Menghapus Film dan Tiket...');
                                                            try { 
                                                                const batch = writeBatch(db);
                                                                const relatedTickets = cinemaBookings.filter(b => b.movieId === movie.id);
                                                                relatedTickets.forEach(t => {
                                                                    batch.delete(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_bookings', t.id));
                                                                });
                                                                batch.delete(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_movies', movie.id));
                                                                await batch.commit();
                                                                addToast(`Film dan ${relatedTickets.length} tiket terhapus`, 'success'); 
                                                            } catch(e){} finally{closeSysLoad();}
                                                        }, 'danger', 'Hapus Data');
                                                    }} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"><IconTrash className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                            {cinemaMovies.length === 0 && <div className="text-center py-10 text-sub-theme font-bold text-sm">Tidak ada film.</div>}
                                        </div>
                                    </>
                                )}

                                {adminCinemaTab === 'pos' && !activeCinemaMovie && (
                                    <div className="flex flex-col gap-4 h-full">
                                        <h2 className="text-lg font-black text-main flex items-center gap-2 drop-shadow-sm"><IconTicket className="w-5 h-5 text-emerald-500"/> Riwayat Tiket Hari Ini</h2>
                                        <div className="flex-1 bg-gray-50 dark:bg-navy-900/50 rounded-[2.5rem] p-5 border border-theme overflow-y-auto custom-scrollbar shadow-inner space-y-3">
                                            {cinemaBookings.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString()).map(ticket => (
                                                <div key={ticket.id} className="bg-card p-4 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 border border-theme shadow-sm">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-500/20">{ticket.class}</span>
                                                            <span className="text-[10px] font-mono font-bold text-sub-theme">{ticket.id}</span>
                                                        </div>
                                                        <h4 className="font-black text-main text-sm truncate">{ticket.movieTitle}</h4>
                                                        <p className="text-[10px] text-sub-theme mt-1">Oleh: {ticket.userName} | Waktu: {new Date(ticket.createdAt).toLocaleTimeString('id-ID')}</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-theme pt-3 md:pt-0 md:pl-4">
                                                        <div className="text-center">
                                                            <p className="text-[8px] font-black uppercase text-sub-theme mb-0.5">Kursi</p>
                                                            <p className="text-lg font-black text-primary leading-none">{ticket.seat}</p>
                                                        </div>
                                                        <button onClick={() => printCinemaTicket(ticket)} className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition flex flex-col items-center justify-center gap-1 shadow-sm" title="Cetak Ulang Fisik">
                                                            <IconPrinter className="w-4 h-4"/>
                                                            <span className="text-[8px] font-black uppercase tracking-widest">Cetak</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {cinemaBookings.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString()).length === 0 && <div className="text-center py-10 text-sub-theme font-bold text-sm">Belum ada penjualan tiket hari ini. Pilih film di kiri untuk membuat tiket baru.</div>}
                                        </div>
                                    </div>
                                )}

                                {adminCinemaTab === 'pos' && activeCinemaMovie && (
                                    <div className="flex-1 bg-[#020617] rounded-[2.5rem] p-5 border-2 border-indigo-900/50 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"></div>
                                        <button onClick={()=>{setActiveCinemaMovie(null); setSelectedSeats([]);}} className="absolute top-4 left-4 z-20 text-sub-theme hover:text-white transition bg-black/50 p-2 rounded-xl backdrop-blur-sm"><IconChevronLeft className="w-5 h-5"/></button>
                                        
                                        <div className="text-center mb-12 relative z-10">
                                            <div className="w-4/5 md:w-2/3 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
                                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mt-4">Layar Teater 1</p>
                                        </div>

                                        <div className="flex flex-col gap-6 max-w-lg mx-auto relative z-10 w-full overflow-x-auto pb-4 custom-scrollbar px-2">
                                            <div className="w-full text-center">
                                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/30 mb-3 inline-block shadow-sm">Area Kursi VIP</span>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {Array.from({length: activeCinemaMovie.vipSeats || 5}, (_, i) => `V${i+1}`).map(seat => {
                                                        const isBooked = cinemaBookings.some(b => b.movieId === activeCinemaMovie.id && b.seat === seat);
                                                        const isSelected = selectedSeats.includes(seat);
                                                        return (
                                                            <button key={seat} disabled={isBooked} onClick={()=>toggleCinemaSeat(seat)} className={`aspect-square w-10 md:w-12 rounded-t-2xl rounded-b-lg flex items-center justify-center text-[10px] md:text-xs font-black transition-all transform ${isBooked ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed opacity-50' : isSelected ? 'bg-yellow-500 text-black border border-yellow-400 scale-110 shadow-[0_0_15px_rgba(234,179,8,0.6)] z-10' : 'bg-gray-800 text-yellow-500 border border-yellow-600/50 hover:border-yellow-400 hover:bg-gray-700 hover:scale-105'}`}>
                                                                {seat}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            
                                            <div className="w-full border-t border-dashed border-gray-700 my-2"></div>

                                            <div className="w-full text-center">
                                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 mb-3 inline-block shadow-sm">Area Kursi Reguler</span>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {Array.from({length: activeCinemaMovie.regSeats || 15}, (_, i) => `R${i+1}`).map(seat => {
                                                        const isBooked = cinemaBookings.some(b => b.movieId === activeCinemaMovie.id && b.seat === seat);
                                                        const isSelected = selectedSeats.includes(seat);
                                                        return (
                                                            <button key={seat} disabled={isBooked} onClick={()=>toggleCinemaSeat(seat)} className={`aspect-square w-9 md:w-10 rounded-t-xl rounded-b-md flex items-center justify-center text-[9px] md:text-[10px] font-black transition-all transform ${isBooked ? 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed opacity-50' : isSelected ? 'bg-cyan-500 text-black border border-cyan-400 scale-110 shadow-[0_0_15px_rgba(6,182,212,0.6)] z-10' : 'bg-gray-800 text-cyan-400 border border-cyan-800 hover:border-cyan-400 hover:bg-gray-700 hover:scale-105'}`}>
                                                                {seat}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-center gap-6 mt-10 text-[9px] font-bold uppercase tracking-widest text-gray-400 relative z-10 bg-black/40 py-3 rounded-xl border border-white/5 shadow-inner">
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-800 rounded border border-gray-700"></div> Terisi</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-800 rounded border border-cyan-800"></div> Reguler (R)</div>
                                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-800 rounded border border-yellow-600"></div> VIP (V)</div>
                                        </div>
                                    </div>
                                )}

                                {adminCinemaTab === 'vote' && (
                                    <>
                                        <h2 className="text-lg font-black text-main flex items-center gap-2 mb-4 drop-shadow-sm"><IconList className="w-5 h-5 text-orange-500"/> Kandidat Film & Hasil Vote</h2>
                                        <div className="flex-1 bg-gray-50 dark:bg-navy-900/50 rounded-[2.5rem] p-5 border border-theme overflow-y-auto custom-scrollbar shadow-inner space-y-4">
                                            {(cinemaPolls||[]).map(poll => {
                                                const totalVotesAll = cinemaPolls.reduce((acc, p) => acc + (p.votes?.length || 0), 0);
                                                const myVotes = poll.votes?.length || 0;
                                                const percent = totalVotesAll === 0 ? 0 : Math.round((myVotes / totalVotesAll) * 100);
                                                return (
                                                    <div key={poll.id} className="bg-card p-4 rounded-2xl flex items-center justify-between border border-theme shadow-sm">
                                                        <div className="flex items-center gap-4 w-full">
                                                            <img src={poll.poster} className="w-12 h-16 rounded object-cover border border-theme shrink-0"/>
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <h3 className="text-sm font-black text-main truncate">{poll.title}</h3>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 shadow-inner">
                                                                        <div className="bg-orange-500 h-full rounded-full" style={{width: `${percent}%`}}></div>
                                                                    </div>
                                                                    <span className="text-[10px] font-mono font-bold text-orange-600 dark:text-orange-400 shrink-0">{percent}% ({myVotes})</span>
                                                                </div>
                                                            </div>
                                                            <button onClick={async () => {
                                                                requestConfirm('Hapus Kandidat', 'Hapus kandidat ini?', async () => {
                                                                    triggerSysLoad('Menghapus...');
                                                                    try { await deleteDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_polls', poll.id)); addToast('Terhapus', 'success'); } catch(e){} finally{closeSysLoad();}
                                                                }, 'danger', 'Hapus');
                                                            }} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition shrink-0"><IconTrash className="w-4 h-4"/></button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            {cinemaPolls.length === 0 && <div className="text-center py-10 text-sub-theme font-bold text-sm">Tidak ada kandidat vote.</div>}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}