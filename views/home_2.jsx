return function HomeView() {
    const {
        React, globalConfig, currentUserData, authUser, banners, BannerSlider,
        games, items, promos, selectedGame, setSelectedGame, userId, setUserId,
        zoneId, setZoneId, nickname, isIdValid, bypassValidation, setBypassValidation,
        selectedNominal, setSelectedNominal, selectedPayment, setSelectedPayment,
        inputPromo, setInputPromo, activePromo, setActivePromo, isProcessing,
        postpaidData, setPostpaidData, isCheckingPostpaid, formatRupiah,
        getDisplayPrice, Icons, handleManualCekId, handleCheckPostpaid, triggerCheckout,
        allGlobalOrders, addToast, isStoreOpen, isAdmin
    } = React.useContext(AppContext);

    const { useMemo } = React;
    const { IconZap, IconTrendingUp, IconGamepad, IconChevronLeft, IconUser, IconShield, IconTag, IconEdit, IconSearch, IconCheckCircle, IconWallet, IconBanknote, IconQrcode, IconKey, IconGift, IconLoader, IconLock } = Icons;

    const greeting = useMemo(() => { 
        const h = new Date().getHours(); 
        if (h<11) return 'Pagi 🌅'; 
        if (h<15) return 'Siang ☀️'; 
        if (h<18) return 'Sore 🌇'; 
        return 'Malam 🌙'; 
    }, []);

    const popularGameIds = useMemo(() => {
        const counts = {};
        (allGlobalOrders||[]).forEach(o => {
            if(o.status === 'Sukses' && o.gameId && o.gameId !== 'TOPUP_SALDO') {
                counts[o.gameId] = (counts[o.gameId] || 0) + 1;
            }
        });
        return Object.entries(counts).sort((a,b) => b[1] - a[1]).map(e => e[0]);
    }, [allGlobalOrders]);

    const sortedGamesDisplay = [...games].sort((a, b) => {
        const idxA = popularGameIds.indexOf(a.id);
        const idxB = popularGameIds.indexOf(b.id);
        if(idxA !== -1 && idxB !== -1) return idxA - idxB;
        if(idxA !== -1) return -1;
        if(idxB !== -1) return 1;
        return 0;
    });

    const groupedGames = sortedGamesDisplay.reduce((acc, game) => { 
        if(!(game.isVisible ?? true)) return acc; 
        const cat = game.category || 'game'; 
        if (!acc[cat]) acc[cat] = []; 
        acc[cat].push(game); 
        return acc; 
    }, {});

    const PAYMENTS = [ 
        { id: 'saldo', name: 'Saldo Akun (E-Wallet)', type: 'Bayar Otomatis', fee: 0, color: 'from-blue-600 to-blue-800', badge: 'WALLET' }, 
        { id: 'qris', name: 'QRIS Dinamis', type: 'Scan Barcode', fee: 0, color: 'from-blue-500 to-indigo-500', badge: 'QRIS' }, 
        { id: 'cash', name: 'Uang Tunai (Cash)', type: 'Bayar Kasir', fee: 0, color: 'from-emerald-500 to-green-600', badge: 'CASH' } 
    ];
    const availablePayments = PAYMENTS.filter(p => p.id !== 'qris' || !!globalConfig?.baseQris);

    const getActivePromosForItem = (itemId) => { 
        if(!promos) return []; 
        const now = new Date(); 
        return promos.filter(p => { 
            if(!p.isActive) return false; 
            if(p.category === 'flash') { 
                if(now > new Date(p.endTime) || (p.usedBy||[]).length >= p.stock) return false; 
                if(p.targetItems?.length && !p.targetItems.includes(itemId)) return false; 
                return true; 
            } 
            if(p.category === 'item') { 
                if(p.targetItems?.length && !p.targetItems.includes(itemId)) return false; 
                return true; 
            } 
            if(p.category === 'game') { 
                if(p.targetGame && p.targetGame !== selectedGame?.id) return false; 
                return true; 
            } 
            if(p.category === 'day') return now.getDay() === parseInt(p.targetDay); 
            return false; 
        }); 
    };

    const handleApplyPromoCode = () => { 
        if(!selectedNominal) return addToast('❌ Pilih produk.', 'warning'); 
        const promo = (promos || []).find(p => p.category === 'code' && p.isActive && (p.code || '').toUpperCase() === inputPromo.toUpperCase()); 
        if (!promo) return addToast('❌ Kode tidak valid.', 'error'); 
        if (promo.usedBy && promo.usedBy.includes(authUser.email)) return addToast('❌ Sudah dipakai.', 'error'); 
        if (promo.usedBy && (promo.usedBy.length || 0) >= promo.maxUses) return addToast('❌ Kuota habis.', 'error'); 
        if (promo.minPurchase && getDisplayPrice(selectedNominal) < promo.minPurchase) return addToast(`❌ Min. beli ${formatRupiah(promo.minPurchase)}.`, 'error'); 
        setActivePromo(promo); 
        addToast('Kupon diterapkan!', 'success'); 
    };

    const calculateFinalPrice = (basePrice, itemId) => { 
        let price = basePrice; 
        let bestAutoDiscount = 0; 
        getActivePromosForItem(itemId).forEach(p => { 
            let discountAmt = p.type === 'percentage' ? (basePrice * p.discount / 100) : p.discount; 
            if(discountAmt > bestAutoDiscount) bestAutoDiscount = discountAmt; 
        }); 
        price -= bestAutoDiscount; 
        if (activePromo) price -= activePromo.type === 'percentage' ? (price * activePromo.discount / 100) : activePromo.discount; 
        return Math.max(0, price); 
    };

    const flashSalePromos = (promos||[]).filter(p => p.category === 'flash' && p.isActive) || [];
    const currentBasePrice = selectedNominal ? calculateFinalPrice(getDisplayPrice(selectedNominal) + (selectedPayment?.fee||0), selectedNominal.id) : 0;
    const displayTotal = currentBasePrice;
    const estimatedCashback = globalConfig?.cashbackPercent ? (displayTotal * (globalConfig.cashbackPercent / 100)) : 0;
    const isFormValid = userId.length >= 2 && selectedNominal && selectedPayment && (selectedGame?.inquirySku ? (isIdValid || bypassValidation) : true) && (selectedGame?.inputType === 'id_only' ? true : zoneId.length > 0);

    return (
        <div className="animate-slide-down">
            {!isStoreOpen && !isAdmin ? (
                <div className="clean-card rounded-[3rem] p-10 shadow-2xl text-center py-24 my-8">
                    <IconLock className="w-24 h-24 mx-auto text-red-500 mb-6 opacity-80 drop-shadow-md"/>
                    <h2 className="text-3xl md:text-4xl font-black text-main mb-4 uppercase tracking-widest">Toko Sedang Tutup</h2>
                    <p className="text-sm text-sub-theme font-medium max-w-md mx-auto">Layanan Top Up & PPOB Vipercell sedang tidak tersedia saat ini atau dalam perbaikan sistem.</p>
                </div>
            ) : (
                <>
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pl-2">
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-main tracking-tight drop-shadow-sm">Selamat {greeting},</h1>
                            <h2 className="text-xl md:text-3xl font-black text-primary mt-1 drop-shadow-sm flex items-center">
                                {currentUserData?.name || (authUser.email || '').split('@')[0] || 'Guest'} 
                                {currentUserData?.isReseller && <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full ml-2 shadow-sm font-black tracking-widest uppercase">Reseller</span>}
                            </h2>
                        </div>
                    </div>

                    {!selectedGame && (
                        <>
                            <div className="w-full mb-8 relative z-20">
                                <BannerSlider items={banners} />
                            </div>
                            <div className="mb-8 relative z-20">
                                <div className="flex items-center gap-2 mb-4 pl-2">
                                    <IconTrendingUp className="w-6 h-6 text-primary"/>
                                    <h2 className="text-xl font-black text-main">Layanan Terpopuler</h2>
                                </div>
                                <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
                                    {Object.keys(groupedGames).reduce((topGames, category) => {
                                        const gamesInCategory = groupedGames[category].filter(g => (items||[]).some(i => i.gameId === g.id && (i.status === 'Tersedia' || !i.status) && (i.isVisible ?? true) && !(i.sku||'').startsWith('CEK')));
                                        return [...topGames, ...gamesInCategory];
                                    }, []).slice(0, 6).map((game) => (
                                        <div key={`top-${game.id}`} onClick={() => {setSelectedGame(game); setSelectedNominal(null); setUserId(''); setZoneId(''); setNickname(''); setPostpaidData(null); window.scrollTo({top:0, behavior:'smooth'})}} className="snap-center shrink-0 w-32 md:w-40 cursor-pointer clean-card overflow-hidden relative flex flex-col h-full z-30 hover:-translate-y-1 transition-transform group">
                                            <div className="aspect-square bg-gray-100/50 dark:bg-navy-800 p-2 relative overflow-hidden">
                                                <img src={game.image} alt={game.name} className="w-full h-full object-cover rounded-xl md:rounded-2xl group-hover:scale-105 transition-transform duration-500"/>
                                            </div>
                                            <div className="p-3 md:p-4 text-center flex-grow flex flex-col justify-center">
                                                <h3 className="font-black text-xs md:text-sm leading-tight mb-1 line-clamp-1 text-main">{game.name}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-6 relative z-20">
                                <div className="lg:w-3/4 mb-12 render-optimized">
                                    <div className="flex items-center gap-3 mb-6 pl-2">
                                        <div className="bg-card p-2.5 rounded-xl border border-theme shadow-sm"><IconGamepad className="w-5 h-5 text-primary"/></div>
                                        <div><h2 className="text-xl md:text-2xl font-black leading-tight text-main drop-shadow-sm">Katalog Layanan Lengkap</h2></div>
                                    </div>
                                    <div className="space-y-10 relative z-30">
                                        {[ { key: 'game', label: '🎮 Top Up Game' }, { key: 'pulsa', label: '📱 Pulsa & Data' }, { key: 'emoney', label: '💸 E-Money & Saldo' }, { key:'pascabayar', label: '🧾 PPOB & Tagihan' }, { key:'pln', label: '⚡ Token PLN Listrik' } ].map(category => {
                                            const categoryGames = groupedGames[category.key]?.filter(game => {
                                                const gameItems = (items||[]).filter(i => i.gameId === game.id);
                                                return gameItems.some(i => (i.status === 'Tersedia' || !i.status) && (i.isVisible ?? true) && !(i.sku||'').startsWith('CEK')); 
                                            }) || [];
                                            if(categoryGames.length === 0) return null; 
                                            return (
                                                <div key={category.key} className="space-y-4">
                                                    <h3 className="font-black text-lg uppercase tracking-widest text-sub-theme border-b border-theme pb-2">{category.label}</h3>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-5">
                                                        {categoryGames.map(game => {
                                                            const hasGamePromo = promos.some(p => p.isActive && p.category === 'game' && p.targetGame === game.id);
                                                            return (
                                                                <div key={game.id} onClick={() => {setSelectedGame(game); setSelectedNominal(null); setUserId(''); setZoneId(''); setNickname(''); setPostpaidData(null); window.scrollTo({top:0, behavior:'smooth'})}} className="cursor-pointer clean-card overflow-hidden relative flex flex-col h-full z-30 hover:-translate-y-1 transition-transform group">
                                                                    {hasGamePromo && <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse-fast">PROMO</div>}
                                                                    <div className="aspect-square bg-gray-100/50 dark:bg-navy-800 p-1.5 md:p-2 relative overflow-hidden">
                                                                        <img src={game.image} alt={game.name} className="w-full h-full object-cover rounded-xl md:rounded-2xl group-hover:scale-105 transition-transform duration-500"/>
                                                                    </div>
                                                                    <div className="p-3 md:p-4 text-center flex-grow flex flex-col justify-center">
                                                                        <h3 className="font-black text-[11px] md:text-sm leading-tight mb-1 line-clamp-1 text-main">{game.name}</h3>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {(!games || games.length === 0) && <div className="col-span-full py-12 text-center text-sub-theme text-sm font-bold bg-card rounded-[2rem] border border-dashed border-theme">Katalog masih kosong.</div>}
                                    </div>
                                </div>
                                <div className="lg:w-1/4 flex flex-col space-y-6">
                                    {flashSalePromos?.length > 0 && (
                                        <div className="animate-slide-down relative z-20">
                                            <div className="flex items-center gap-2 mb-4 pl-1">
                                                <IconZap className="w-6 h-6 text-red-500 animate-pulse-fast drop-shadow-md" />
                                                <h2 className="text-xl font-black uppercase tracking-widest text-main drop-shadow-md">Flash Sale!</h2>
                                            </div>
                                            <div className="flex flex-col gap-4 pb-4 custom-scrollbar">
                                                {flashSalePromos.map(promo => {
                                                    const timeLeft = Math.max(0, new Date(promo.endTime) - new Date());
                                                    const hours = Math.floor(timeLeft / (1000 * 60 * 60)); const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)); const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);
                                                    if(timeLeft === 0 || (promo.usedBy||[]).length >= promo.stock) return null;
                                                    return (
                                                        <div key={promo.id} className="min-w-[250px] bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden flex-shrink-0 border border-red-400/30 backdrop-blur-md">
                                                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                                <div>
                                                                    <div className="text-[10px] font-black uppercase tracking-widest bg-black/20 px-3 py-1.5 rounded-lg inline-block mb-3 border border-white/10 shadow-sm">Waktu Terbatas</div>
                                                                    <div className="text-2xl font-black tracking-wider drop-shadow-md mb-1">{promo.type === 'percentage' ? `Diskon ${promo.discount}%` : `Potongan ${formatRupiah(promo.discount)}`}</div>
                                                                    <div className="text-xs font-bold opacity-90 flex items-center gap-1.5"><IconGift className="w-4 h-4"/> Produk Pilihan</div>
                                                                </div>
                                                                <div className="mt-5">
                                                                    <div className="flex justify-between items-end mb-1">
                                                                        <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Sisa Waktu</span>
                                                                        <span className="font-mono text-sm font-black bg-black/30 px-2 py-1 rounded-md border border-white/10 shadow-inner">{hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</span>
                                                                    </div>
                                                                    <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden mt-3 shadow-inner"><div className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_#fff]" style={{width: `${((promo.stock-(promo.usedBy?.length||0))/promo.stock)*100}%`}}></div></div>
                                                                    <div className="text-[9px] mt-1.5 font-bold opacity-80 uppercase tracking-widest text-right">Tersisa {(promo.stock - (promo.usedBy?.length || 0))} Stok</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {selectedGame && (
                        <div className="animate-slide-down relative z-20">
                            <div className="flex items-center gap-4 mb-6 clean-card p-4 md:p-5 border-t-4 border-primary">
                                <button onClick={() => {setSelectedGame(null); setPostpaidData(null);}} className="p-3 bg-gray-100 dark:bg-navy-800 border border-theme rounded-xl text-main hover:bg-gray-200 dark:hover:bg-navy-700 transition"><IconChevronLeft className="w-5 h-5"/></button>
                                <img src={selectedGame.image} className="w-14 h-14 rounded-2xl object-cover border border-theme shadow-sm" />
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-main leading-tight drop-shadow-sm">{selectedGame.name}</h2>
                                    <p className="text-xs text-primary font-bold mt-1 uppercase tracking-widest">Kategori: {selectedGame.category === 'game' ? 'Game' : selectedGame.category === 'pulsa' ? 'Pulsa/Data' : selectedGame.category === 'pascabayar' ? 'Pascabayar / PPOB' : selectedGame.category === 'pln' ? 'Token PLN' : 'E-Money'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-7 space-y-6">
                                    <div className="clean-card p-6 md:p-8 relative overflow-hidden">
                                        <h3 className="text-lg font-black text-main mb-5 flex items-center gap-3 relative z-10"><span className="bg-primary text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">1</span> Masukkan Data Tujuan</h3>
                                        <div className="flex flex-col sm:flex-row gap-4 relative z-10 mb-4">
                                            <div className="flex-1 relative group">
                                                <IconUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme" />
                                                <input type={(selectedGame?.category === 'pulsa' || selectedGame?.category === 'emoney') ? 'tel' : 'text'} value={userId} onChange={(e) => { const val = e.target.value; if (selectedGame?.inputType !== 'riot_id' && val && !/^\d+$/.test(val) && selectedGame?.category !== 'emoney' && selectedGame?.category !== 'pascabayar') { addToast('ID hanya angka.', 'warning'); return; } setUserId(val); }} placeholder={selectedGame?.inputType === 'riot_id' ? 'Masukkan Riot ID' : (selectedGame?.category === 'pulsa' || selectedGame?.category === 'emoney') ? 'Nomor HP Tujuan (08xx)' : selectedGame?.category === 'pascabayar' || selectedGame?.category === 'pln' ? 'Nomor Tagihan / Meter / Pelanggan' : 'Masukkan User ID (Angka)'} className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 font-mono font-bold text-sm shadow-inner"/>
                                            </div>
                                            {selectedGame?.inputType === 'id_zone' && selectedGame?.category !== 'pulsa' && selectedGame?.category !== 'emoney' && selectedGame?.category !== 'pascabayar' && selectedGame?.category !== 'pln' && (
                                                <div className="w-full sm:w-1/3 relative group">
                                                    <IconShield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme" />
                                                    <input type="text" value={zoneId} onChange={(e) => setZoneId(e.target.value)} placeholder="Zone ID" className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 font-mono font-bold text-sm shadow-inner"/>
                                                </div>
                                            )}
                                            {selectedGame?.inputType === 'riot_id' && (
                                                <div className="w-full sm:w-1/3 relative group">
                                                    <IconTag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme" />
                                                    <input type="text" value={zoneId} onChange={(e) => setZoneId(e.target.value)} placeholder="Tagline (#)" className="w-full input-theme rounded-2xl py-4 pl-12 pr-4 font-mono font-bold text-sm shadow-inner"/>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {selectedGame.inquirySku && selectedGame.category !== 'pascabayar' && (
                                            <div className="relative group z-10 mb-4 animate-slide-down">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <div className="flex-1 relative">
                                                        <IconEdit className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sub-theme" />
                                                        <input type="text" readOnly value={nickname} placeholder={isIdValid ? nickname : "Klik Cek Nickname..."} className={`w-full input-theme rounded-2xl py-4 pl-12 pr-4 font-bold text-sm shadow-inner ${isIdValid ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'opacity-70'}`} />
                                                    </div>
                                                    <button onClick={handleManualCekId} disabled={isProcessing || !userId || (selectedGame.inputType === 'id_zone' && !zoneId) || (selectedGame.inputType === 'riot_id' && !zoneId)} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-4 rounded-2xl shadow-md transition disabled:opacity-50 shrink-0 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                                        {isProcessing ? <IconLoader className="w-4 h-4 animate-spin"/> : <><IconSearch className="w-4 h-4"/> Cek Nickname</>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {selectedGame.inquirySku && selectedGame.category !== 'pascabayar' && (
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-800/50 border border-theme rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-700/50 transition mt-2">
                                                <input type="checkbox" checked={bypassValidation} onChange={(e) => setBypassValidation(e.target.checked)} className="w-4 h-4 text-primary rounded border-theme"/>
                                                <span className="text-[10px] md:text-xs font-bold text-sub-theme leading-tight">Lewati Cek ID (Saya yakin ID saya benar. Kesalahan input sepenuhnya tanggung jawab saya).</span>
                                            </label>
                                        )}

                                        {!selectedGame.inquirySku && selectedGame.category !== 'pascabayar' && (
                                            <p className="text-[10px] text-sub-theme mt-3 font-medium border-t border-theme pt-3">⚠️ Game/Layanan ini tidak mendukung Cek ID Otomatis. Pastikan ID Anda benar sebelum membayar.</p>
                                        )}
                                    </div>

                                    <div className="clean-card p-6 md:p-8 relative overflow-hidden mt-6">
                                        <h3 className="text-lg font-black text-main mb-5 flex items-center gap-3 relative z-10"><span className="bg-primary text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">2</span> Pilih Produk {selectedGame.category === 'pulsa' ? 'Pulsa' : selectedGame.category === 'pascabayar' ? 'Layanan' : ''}</h3>
                                        
                                        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 relative z-10 transition-all duration-500 ${selectedGame.inquirySku && selectedGame.category !== 'pascabayar' && !isIdValid && !bypassValidation ? 'opacity-30 pointer-events-none filter grayscale-[50%]' : ''}`}>
                                            {(items||[]).filter(i => i.gameId === selectedGame?.id && i.status === 'Tersedia' && (i.isVisible ?? true) && !(i.sku||'').startsWith('CEK')).sort((a,b)=>a.price-b.price).map(item => {
                                                const itemPromos = getActivePromosForItem(item.id);
                                                const itemBasePrice = getDisplayPrice(item);
                                                const bestAutoPromo = itemPromos.length > 0 ? itemPromos.reduce((prev, current) => {
                                                    const prevD = prev.type === 'percentage' ? (itemBasePrice * prev.discount / 100) : prev.discount;
                                                    const currD = current.type === 'percentage' ? (itemBasePrice * current.discount / 100) : current.discount;
                                                    return (currD > prevD) ? current : prev;
                                                }) : null;
                                                const finalP = calculateFinalPrice(itemBasePrice, item.id);
                                                const hasPromo = bestAutoPromo !== null;
                                                
                                                return (
                                                <div key={item.id} onClick={() => { setSelectedNominal(item); setPostpaidData(null); setIsIdValid(false); }} className={`cursor-pointer rounded-[1.5rem] p-4 border-2 text-center relative overflow-hidden flex flex-col justify-center min-h-[100px] transition-all bg-card ${selectedNominal?.id === item.id ? 'border-primary bg-primary-light scale-[1.02] shadow-md' : 'border-theme hover:border-primary/50'}`}>
                                                    {hasPromo && <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-sm z-10">{bestAutoPromo.category === 'flash' ? '⚡ FLASH' : '🔥 PROMO'}</div>}
                                                    {selectedNominal?.id === item.id && <div className="absolute top-2 left-2 z-10"><IconCheckCircle className="w-4 h-4 text-primary"/></div>}
                                                    <div className="font-bold text-xs md:text-sm text-main mb-2 mt-2">{item.name}</div>
                                                    
                                                    {selectedGame.category !== 'pascabayar' ? (
                                                        <div className={`text-[10px] md:text-xs font-mono font-black mt-auto ${hasPromo || currentUserData?.isReseller ? 'text-primary' : 'text-sub-theme'}`}>
                                                            {hasPromo ? (
                                                                <div className="flex flex-col items-center"><span className="line-through text-gray-400 text-[9px] mb-0.5">{formatRupiah(itemBasePrice)}</span><span>{formatRupiah(finalP)}</span></div>
                                                            ) : currentUserData?.isReseller ? (
                                                                <div className="flex flex-col items-center"><span className="line-through text-gray-400 text-[9px] mb-0.5" title="Harga User Normal">{formatRupiah(item.price)}</span><span className="text-primary">{formatRupiah(itemBasePrice)}</span></div>
                                                            ) : formatRupiah(itemBasePrice)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[9px] md:text-[10px] font-bold text-primary mt-auto uppercase tracking-widest bg-primary-light px-2 py-1 rounded border border-primary/20">Cek Tagihan Dulu</div>
                                                    )}
                                                </div>
                                                )
                                            })}
                                        </div>
                                        {(!items || items.filter(i => i.gameId === selectedGame?.id && i.status === 'Tersedia' && (i.isVisible ?? true) && !(i.sku||'').startsWith('CEK')).length === 0) && <div className="py-10 text-center text-sub-theme text-sm font-bold bg-gray-100 dark:bg-navy-800 rounded-3xl border border-dashed border-theme">Produk sedang gangguan atau kosong.</div>}
                                    </div>
                                </div>

                                <div className="lg:col-span-5 space-y-6">
                                    <div className={`clean-card p-6 md:p-8 relative overflow-hidden transition-all duration-500 ${(selectedGame.category === 'pascabayar' && !postpaidData) ? 'opacity-40 pointer-events-none filter grayscale-[20%]' : ''}`}>
                                        <h3 className="text-lg font-black text-main mb-5 flex items-center gap-3 relative z-10"><span className="bg-primary text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">3</span> Metode Pembayaran</h3>
                                        <div className="space-y-3 mb-6 relative z-10">
                                            {availablePayments.map(pay => (
                                                <div key={pay.id} onClick={() => setSelectedPayment(pay)} className={`cursor-pointer rounded-2xl p-4 border-2 flex items-center gap-4 transition-all bg-card ${selectedPayment?.id === pay.id ? 'border-primary bg-primary-light shadow-md scale-[1.02]' : 'border-theme hover:border-primary/50'}`}>
                                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pay.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                                        {pay.id === 'saldo' ? <IconWallet className="w-8 h-8"/> : pay.id === 'cash' ? <IconBanknote className="w-8 h-8"/> : <IconQrcode className="w-8 h-8"/>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2"><div className="text-sm font-black text-main">{pay.name}</div><span className="text-[8px] bg-gray-200 dark:bg-navy-800 text-main px-2 py-0.5 rounded font-black border border-theme">{pay.badge}</span></div>
                                                        <div className="text-[10px] text-sub-theme font-bold mt-1">{pay.type}</div>
                                                    </div>
                                                    {selectedPayment?.id === pay.id && <IconCheckCircle className="w-6 h-6 text-primary shrink-0"/>}
                                                </div>
                                            ))}
                                        </div>

                                        {selectedGame.category !== 'pascabayar' && (
                                            <div className="relative z-10 pt-4 border-t border-theme">
                                                <label className="text-[10px] font-black text-sub-theme uppercase tracking-widest mb-2 flex items-center gap-1.5"><IconKey className="w-3 h-3 text-primary"/> Kode Kupon Promosi</label>
                                                <div className="flex gap-2 bg-gray-100 dark:bg-navy-900/50 p-1.5 rounded-2xl border border-theme shadow-inner">
                                                    <input type="text" value={inputPromo} onChange={(e)=>setInputPromo(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="KODE DISKON..." disabled={activePromo !== null} className="flex-1 bg-transparent py-3 px-4 text-xs font-mono font-black text-main focus:outline-none uppercase disabled:opacity-50" />
                                                    {activePromo ? (
                                                        <button onClick={()=>{setActivePromo(null); setInputPromo('');}} className="bg-red-500/20 text-red-600 dark:text-red-500 px-5 rounded-xl text-xs font-black uppercase border border-red-500/30 transition hover:bg-red-500 hover:text-white shadow-sm">Hapus</button>
                                                    ) : (
                                                        <button onClick={handleApplyPromoCode} className="bg-black text-white dark:bg-white dark:text-black px-5 rounded-xl text-xs font-black uppercase shadow-sm transition hover:scale-105">Pakai</button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="clean-card p-6 md:p-8 relative overflow-hidden mt-6">
                                        {selectedGame.category === 'pascabayar' ? (
                                            <>
                                                {postpaidData && (
                                                    <div className="bg-gray-50 dark:bg-navy-800/30 p-4 rounded-2xl border border-theme mb-5 text-sm space-y-2 shadow-inner">
                                                        <div className="flex justify-between items-center border-b border-theme pb-2"><span className="text-sub-theme text-xs">Nama Pelanggan</span><span className="font-bold text-main">{postpaidData.customer_name}</span></div>
                                                        <div className="flex justify-between items-center border-b border-theme pb-2"><span className="text-sub-theme text-xs">Periode</span><span className="font-bold text-main">{postpaidData.desc?.detail?.[0]?.periode || '-'}</span></div>
                                                        <div className="flex justify-between items-center pt-1"><span className="text-sub-theme text-xs">Tagihan (Inc. Admin Web)</span><span className="font-black text-primary text-lg">{formatRupiah(postpaidData.price)}</span></div>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mb-4 relative z-10 border-b border-theme pb-4">
                                                    <span className="text-xs font-black text-sub-theme uppercase tracking-widest">Total Bayar:</span>
                                                    <span className="text-2xl md:text-3xl font-black text-primary font-mono drop-shadow-sm">{postpaidData ? formatRupiah(postpaidData.price + (selectedPayment?.fee||0)) : 'Rp 0'}</span>
                                                </div>
                                                {!postpaidData ? (
                                                    <button onClick={handleCheckPostpaid} disabled={isCheckingPostpaid || !userId || !selectedNominal} className={`w-full py-4 md:py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex justify-center items-center gap-3 relative z-10 shadow-xl transition-transform ${userId && selectedNominal ? 'bg-primary text-white hover:bg-primary-hover hover:scale-[1.02]' : 'bg-gray-200 dark:bg-navy-800 text-gray-500 dark:text-gray-400 border border-theme'}`}>
                                                        {isCheckingPostpaid ? <IconLoader className="w-6 h-6 animate-spin"/> : <><IconSearch className={`w-5 h-5 ${userId && selectedNominal ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} /> Cek Data Tagihan</>}
                                                    </button>
                                                ) : (
                                                    <button onClick={() => {
                                                        if(!selectedPayment) return addToast('Pilih metode pembayaran.', 'warning');
                                                        const fPrice = postpaidData.price + (selectedPayment?.fee||0);
                                                        const orderPayload = { gameId: selectedGame.id, gameName: selectedGame.name, gameImage: selectedGame.image, userId: userId, zoneId: zoneId, nickname: postpaidData.customer_name, itemId: selectedNominal.id, itemName: selectedNominal.name, paymentName: selectedPayment.name, finalPrice: fPrice, usedCashback: 0, basePrice: fPrice };
                                                        setPendingOrderPayload(orderPayload); setCheckoutSummary({ isOpen: true, data: orderPayload }); 
                                                    }} disabled={isProcessing || !selectedPayment} className={`w-full py-4 md:py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex justify-center items-center gap-3 relative z-10 shadow-xl transition-transform ${selectedPayment ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[1.02]' : 'bg-gray-200 dark:bg-navy-800 text-gray-500 dark:text-gray-400 border border-theme'}`}>
                                                        {isProcessing ? <IconLoader className="w-6 h-6 animate-spin"/> : <><IconZap className={`w-5 h-5 ${selectedPayment ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} /> Lanjut Bayar</>}
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-4 relative z-10 border-b border-theme pb-4">
                                                    <span className="text-xs font-black text-sub-theme uppercase tracking-widest">Total Bayar:</span>
                                                    <span className="text-2xl md:text-3xl font-black text-primary font-mono drop-shadow-sm">{selectedNominal ? formatRupiah(displayTotal) : 'Rp 0'}</span>
                                                </div>
                                                {estimatedCashback > 0 && (
                                                    <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between shadow-sm">
                                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">Cashback Diterima (Setelah Lunas):</span>
                                                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">+ {formatRupiah(estimatedCashback)}</span>
                                                    </div>
                                                )}
                                                <button onClick={triggerCheckout} disabled={isProcessing || (selectedGame.inquirySku && !isIdValid && !bypassValidation)} className={`w-full py-4 md:py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex justify-center items-center gap-3 relative z-10 shadow-xl transition-transform ${isFormValid ? 'bg-primary text-white hover:bg-primary-hover hover:scale-[1.02]' : 'bg-gray-200 dark:bg-navy-800 text-gray-500 dark:text-gray-400 border border-theme'}`}>
                                                    {isProcessing ? <IconLoader className="w-6 h-6 animate-spin"/> : <><IconZap className={`w-5 h-5 ${isFormValid ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} /> {isFormValid ? 'Pesan Sekarang' : 'Lengkapi Data'}</>}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}   