return function CinemaView() {
    const {
        React, isCinemaOpen, isAdmin, cinemaMovies, cinemaPolls, cinemaBookings,
        activeCinemaMovie, setActiveCinemaMovie, selectedSeats, setSelectedSeats,
        activeCinemaTab, setActiveCinemaTab, authUser, currentUserData,
        formatDateTimeWIT, formatRupiah, requestConfirm, triggerSysLoad, closeSysLoad,
        addToast, db, safeAppId, Icons, setLargeQrModal, writeBatch, doc, arrayUnion, updateDoc
    } = React.useContext(AppContext);

    const { IconLock, IconFilm, IconZap, IconClock, IconTrendingUp, IconCheck, IconTicket, IconCheckCircle } = Icons;

    const toggleCinemaSeat = (seat) => {
        if (selectedSeats.includes(seat)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seat));
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    return (
        <div className="animate-slide-down pb-10 max-w-6xl mx-auto pt-4 w-full relative z-10">
            {!isCinemaOpen && !isAdmin ? (
                <div className="clean-card rounded-[3rem] p-10 shadow-2xl text-center py-24 my-8">
                    <IconLock className="w-24 h-24 mx-auto text-red-500 mb-6 opacity-80 drop-shadow-md"/>
                    <h2 className="text-3xl md:text-4xl font-black text-main mb-4 uppercase tracking-widest">Bioskop Ditutup</h2>
                    <p className="text-sm text-sub-theme font-medium max-w-md mx-auto">Layanan pemesanan tiket ViperCinema sedang tidak tersedia atau dalam perbaikan.</p>
                </div>
            ) : (
            <div className="clean-card rounded-[3rem] p-6 md:p-10 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-theme pb-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><IconFilm className="w-8 h-8"/></div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-main drop-shadow-sm flex items-center gap-2">ViperCinema <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest ml-2">Mini</span></h2>
                            <p className="text-xs text-sub-theme font-medium mt-1.5 drop-shadow-sm">Bioskop Mini Eksklusif Teater 1.</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-navy-900 p-1.5 rounded-xl border border-theme shadow-inner w-full md:w-auto">
                        <button onClick={() => {setActiveCinemaTab('nowplaying'); setActiveCinemaMovie(null); setSelectedSeats([]);}} className={`flex-1 md:w-32 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeCinemaTab === 'nowplaying' ? 'bg-white dark:bg-card shadow-sm text-primary' : 'text-sub-theme hover:text-main'}`}>Now Playing</button>
                        <button onClick={() => {setActiveCinemaTab('vote'); setActiveCinemaMovie(null); setSelectedSeats([]);}} className={`flex-1 md:w-32 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeCinemaTab === 'vote' ? 'bg-white dark:bg-card shadow-sm text-primary' : 'text-sub-theme hover:text-main'}`}>Vote Film</button>
                    </div>
                </div>

                {activeCinemaTab === 'nowplaying' && (
                    <>
                    {!activeCinemaMovie ? (
                        <div className="animate-slide-down">
                            <h3 className="text-lg font-black text-main mb-5 flex items-center gap-2"><IconZap className="w-5 h-5 text-primary"/> Jadwal Film Tayang</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                {(cinemaMovies||[]).map(movie => (
                                    <div key={movie.id} onClick={() => setActiveCinemaMovie(movie)} className="bg-card rounded-2xl border border-theme overflow-hidden cursor-pointer group hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg hover:border-primary/50 flex flex-col">
                                        <div className="aspect-[2/3] relative overflow-hidden bg-black w-full">
                                            <img src={movie.poster} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-500"/>
                                            <div className="absolute top-2 left-2 flex gap-1">
                                                <span className="bg-black/80 backdrop-blur-sm text-white border border-white/20 text-[8px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm">TEATER 1</span>
                                            </div>
                                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-12 flex justify-between items-end">
                                                <span className="bg-primary text-white text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest shadow-sm">{formatDateTimeWIT(movie.showTime)}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <h4 className="font-black text-sm text-main line-clamp-2 mb-2 leading-tight">{movie.title}</h4>
                                            <div className="mt-auto">
                                                <p className="text-[10px] text-sub-theme font-bold uppercase mb-0.5">Mulai dari</p>
                                                <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">{formatRupiah(movie.priceReg)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {cinemaMovies.length === 0 && <div className="py-16 text-center text-sub-theme font-bold text-sm border border-dashed border-theme rounded-[2rem] bg-gray-50 dark:bg-navy-800 flex flex-col items-center"><IconFilm className="w-12 h-12 mb-3 opacity-30"/>Belum ada jadwal film yang ditambahkan Admin.</div>}
                            
                            {cinemaBookings.filter(b => b.userEmail === authUser.email).length > 0 && (
                                <div className="mt-12 pt-8 border-t border-theme animate-slide-up">
                                    <h3 className="text-lg font-black text-main mb-6 flex items-center gap-2"><IconTicket className="w-5 h-5 text-primary"/> Tiket Aktif Anda</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {cinemaBookings.filter(b => b.userEmail === authUser.email).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(ticket => (
                                            <div key={ticket.id} className="cinema-ticket" onClick={() => setLargeQrModal({isOpen: true, data: ticket.id})}>
                                                <div className="cinema-ticket-left flex flex-col justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-black bg-gray-200 dark:bg-navy-800 px-3 py-1 rounded text-main uppercase tracking-widest mb-3 inline-block shadow-sm">TEATER 1</span>
                                                        <h4 className="font-black text-xl md:text-2xl leading-tight mb-2 truncate text-main tracking-tight uppercase">{ticket.movieTitle}</h4>
                                                        <p className="text-xs text-sub-theme font-bold mb-6">{formatDateTimeWIT(ticket.showTime)}</p>
                                                    </div>
                                                    <div className="flex justify-between items-end border-t border-theme pt-4 mt-2">
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest text-sub-theme mb-1 font-bold">Kursi</p>
                                                            <p className="text-3xl font-black text-primary drop-shadow-sm">{ticket.seat}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] uppercase tracking-widest text-sub-theme mb-1 font-bold">Kelas</p>
                                                            <p className={`text-sm font-black uppercase tracking-widest ${ticket.class==='VIP'?'text-yellow-500':'text-cyan-500'}`}>{ticket.class}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="cinema-ticket-right">
                                                    {ticket.status === 'Scanned' ? (
                                                        <div className="text-center w-full h-full flex flex-col items-center justify-center">
                                                            <IconCheckCircle className="w-10 h-10 text-blue-700 dark:text-blue-400 mx-auto mb-2"/>
                                                            <span className="text-[10px] font-black text-blue-800 dark:text-blue-300 uppercase text-center block leading-tight px-1">Telah<br/>Dipakai</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center w-full h-full">
                                                            <div className="bg-white p-2 rounded-xl shadow-md mb-3 hover:scale-110 transition-transform cursor-pointer">
                                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.id}&margin=0`} className="w-16 h-16 md:w-20 md:h-20"/>
                                                            </div>
                                                            <p className="text-[10px] font-black text-blue-700 dark:text-blue-300 text-center leading-tight uppercase tracking-widest">Scan<br/>Kasir</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-slide-down">
                            <button onClick={()=>{setActiveCinemaMovie(null); setSelectedSeats([]);}} className="mb-6 bg-gray-100 dark:bg-navy-800 border border-theme px-4 py-2.5 rounded-xl text-xs font-bold text-main flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-navy-700 transition shadow-sm"><IconChevronLeft className="w-4 h-4"/> Kembali ke Jadwal</button>
                            
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                <div className="w-full lg:w-1/3 shrink-0 clean-card p-4 flex flex-col sm:flex-row lg:flex-col gap-5 lg:sticky lg:top-24 z-20">
                                    <img src={activeCinemaMovie.poster} className="w-1/2 sm:w-1/3 lg:w-full rounded-2xl shadow-md border border-theme object-cover aspect-[2/3] mx-auto sm:mx-0"/>
                                    <div className="flex-1 text-center sm:text-left lg:text-center flex flex-col justify-center">
                                        <h3 className="text-xl md:text-2xl font-black text-main leading-tight mb-2">{activeCinemaMovie.title}</h3>
                                        <p className="text-xs font-bold text-sub-theme bg-gray-100 dark:bg-navy-900 border border-theme px-3 py-1.5 rounded-lg inline-block w-fit mx-auto sm:mx-0 lg:mx-auto mb-4"><IconClock className="w-3.5 h-3.5 inline mr-1 -mt-0.5"/> {formatDateTimeWIT(activeCinemaMovie.showTime)}</p>
                                        
                                        <div className="bg-gray-50 dark:bg-navy-800/50 border border-theme rounded-2xl p-4 shadow-inner">
                                            <div className="flex justify-between items-center border-b border-theme pb-2 mb-2">
                                                <span className="text-[10px] font-black text-sub-theme uppercase tracking-widest">Reguler (R)</span>
                                                <span className="text-sm font-black font-mono text-cyan-600 dark:text-cyan-400">{formatRupiah(activeCinemaMovie.priceReg)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest flex items-center gap-1"><IconTrendingUp className="w-3 h-3"/> VIP (V)</span>
                                                <span className="text-sm font-black font-mono text-yellow-600 dark:text-yellow-500">{formatRupiah(activeCinemaMovie.priceVip)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full lg:w-2/3 z-10">
                                    <div className="bg-[#020617] p-6 md:p-10 rounded-[2.5rem] border-2 border-indigo-900/50 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"></div>
                                        
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

                                    <div className="mt-6 flex flex-col sm:flex-row gap-4 relative z-10">
                                        <div className="bg-card p-4 rounded-2xl border border-theme shadow-sm flex-1 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-sub-theme uppercase tracking-widest mb-1">Total Bayar</p>
                                                <p className="text-xl font-black font-mono text-primary">
                                                    {selectedSeats.length > 0 ? formatRupiah(selectedSeats.reduce((a, s) => a + (s.startsWith('V') ? activeCinemaMovie.priceVip : activeCinemaMovie.priceReg), 0)) : 'Rp 0'}
                                                </p>
                                            </div>
                                            {selectedSeats.length > 0 && <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border shadow-sm bg-cyan-500/10 text-cyan-600 border-cyan-500/30`}>{selectedSeats.length} Kursi Terpilih</span>}
                                        </div>
                                        
                                        <button onClick={async () => {
                                            if(selectedSeats.length === 0) return addToast('Pilih kursi terlebih dahulu!', 'warning');
                                            const priceToPay = selectedSeats.reduce((a, s) => a + (s.startsWith('V') ? activeCinemaMovie.priceVip : activeCinemaMovie.priceReg), 0);
                                            if((currentUserData?.saldoAkun || 0) < priceToPay) return addToast('Saldo Akun tidak cukup! Silakan top up E-Wallet.', 'error');
                                            
                                            requestConfirm('Bayar Tiket', `Beli ${selectedSeats.length} tiket seharga ${formatRupiah(priceToPay)}? Saldo otomatis terpotong.`, async () => {
                                                triggerSysLoad('Memproses Tiket...');
                                                try {
                                                    const batch = writeBatch(db);
                                                    selectedSeats.forEach(seat => {
                                                        const ticketId = 'TIX-' + Date.now().toString(36).toUpperCase() + '-' + seat;
                                                        batch.set(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_bookings', ticketId), {
                                                            id: ticketId, movieId: activeCinemaMovie.id, movieTitle: activeCinemaMovie.title, seat: seat, class: seat.startsWith('V') ? 'VIP' : 'Reguler', userEmail: authUser.email, userName: currentUserData?.name || authUser.email.split('@')[0], price: seat.startsWith('V') ? activeCinemaMovie.priceVip : activeCinemaMovie.priceReg, showTime: activeCinemaMovie.showTime, createdAt: new Date().toISOString(), status: 'Active'
                                                        });
                                                    });
                                                    batch.update(doc(db, 'artifacts', safeAppId, 'public', 'data', 'members', authUser.uid), { saldoAkun: (currentUserData.saldoAkun||0) - priceToPay });
                                                    await batch.commit();
                                                    addToast(`Berhasil Membeli ${selectedSeats.length} Tiket! Silakan cek di menu Jadwal.`, 'success');
                                                    setSelectedSeats([]);
                                                    setActiveCinemaMovie(null);
                                                    setActiveCinemaTab('nowplaying');
                                                } catch(e) { addToast('Gagal memproses', 'error'); } finally { closeSysLoad(); }
                                            }, 'success', 'Beli Sekarang');
                                        }} disabled={selectedSeats.length === 0} className="w-full sm:w-auto sm:flex-[1.5] bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02]">
                                            <IconCheckCircle className="w-5 h-5"/> Bayar Tiket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                )}

                {activeCinemaTab === 'vote' && (
                    <div className="animate-slide-down">
                        <h3 className="text-lg font-black text-main mb-2 flex items-center gap-2"><IconTrendingUp className="w-5 h-5 text-primary"/> Voting Film Tayang Besok</h3>
                        <p className="text-xs text-sub-theme font-medium mb-6">Pilih film mana yang paling ingin kamu tonton di Teater 1 ViperCinema besok. Film dengan vote tertinggi akan ditayangkan!</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {(cinemaPolls||[]).map(poll => {
                                const totalVotesAll = cinemaPolls.reduce((acc, p) => acc + (p.votes?.length || 0), 0);
                                const myVotes = poll.votes?.length || 0;
                                const percent = totalVotesAll === 0 ? 0 : Math.round((myVotes / totalVotesAll) * 100);
                                const hasVotedAny = cinemaPolls.some(p => (p.votes||[]).includes(authUser.email));
                                const iVotedThis = (poll.votes||[]).includes(authUser.email);

                                return (
                                    <div key={poll.id} className={`bg-card rounded-3xl border-2 overflow-hidden flex flex-col transition-all shadow-sm ${iVotedThis ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'border-theme'}`}>
                                        <div className="aspect-[4/5] relative overflow-hidden bg-black">
                                            <img src={poll.poster} className="w-full h-full object-cover opacity-80"/>
                                            {iVotedThis && <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1.5 shadow-md"><IconCheck className="w-4 h-4"/></div>}
                                            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
                                                <h4 className="font-black text-white text-lg leading-tight drop-shadow-md">{poll.title}</h4>
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col justify-between bg-gray-50 dark:bg-navy-900/50">
                                            <div className="mb-4">
                                                <div className="flex justify-between items-end mb-1.5">
                                                    <span className="text-[10px] font-black uppercase text-sub-theme">Total Suara</span>
                                                    <span className="text-sm font-black font-mono text-primary">{percent}% ({myVotes})</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-navy-800 rounded-full h-2 shadow-inner overflow-hidden">
                                                    <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{width: `${percent}%`}}></div>
                                                </div>
                                            </div>
                                            <button onClick={async () => {
                                                if(hasVotedAny) return addToast('Anda sudah memberikan suara hari ini!', 'warning');
                                                try {
                                                    triggerSysLoad();
                                                    await updateDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'cinema_polls', poll.id), {
                                                        votes: arrayUnion(authUser.email)
                                                    });
                                                    addToast('Vote berhasil dikirim!', 'success');
                                                } catch(e) { addToast('Gagal vote', 'error'); } finally { closeSysLoad(); }
                                            }} disabled={hasVotedAny} className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${iVotedThis ? 'bg-primary text-white' : hasVotedAny ? 'bg-gray-200 dark:bg-navy-800 text-gray-400 cursor-not-allowed border border-theme' : 'bg-white dark:bg-navy-800 text-primary border border-primary hover:bg-primary hover:text-white'}`}>
                                                {iVotedThis ? 'Pilihan Anda' : hasVotedAny ? 'Sudah Vote' : 'Vote Film Ini'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                            {cinemaPolls.length === 0 && <div className="col-span-full py-16 text-center text-sub-theme font-bold text-sm border border-dashed border-theme rounded-[2rem] bg-gray-50 dark:bg-navy-800 flex flex-col items-center"><IconTrendingUp className="w-10 h-10 mb-3 opacity-30"/>Belum ada kandidat film untuk di-vote.</div>}
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}