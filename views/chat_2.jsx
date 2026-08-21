return function ChatView() {
    const {
        React, userChat, helpTab, setHelpTab, chatInput, setChatInput,
        loadingChat, chatEndRef, feedbackText, setFeedbackText, sysLoading, Icons, isDarkMode, db, authUser, safeAppId, addToast, setDoc
    } = React.useContext(AppContext);

    const { IconMessageSquare, IconSend, IconLoader } = Icons;

    const handleSendChatUser = async (e, customStr = null) => { 
        if(e) e.preventDefault(); 
        const str = customStr || chatInput; 
        if (!(str||'').trim()) return; 
        
        try { 
            const newMessages = [...(userChat?.messages || []), { sender: 'user', text: str, time: new Date().toISOString(), role: 'Pelanggan' }]; 
            await setDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'support_chats', authUser.email), { messages: newMessages, status: 'Open', updatedAt: new Date().toISOString() }, { merge: true }); 
            setChatInput(''); 
            setTimeout(()=> { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100); 
            addToast('Terkirim', 'success'); 
        } catch (err) { addToast('Gagal', 'error'); } 
    };

    const handleSendFeedback = async (e) => { 
        e.preventDefault(); 
        if(!feedbackText.trim()) return; 
        try { 
            const fbId = `fb_${Date.now()}`; 
            await setDoc(doc(db, 'artifacts', safeAppId, 'public', 'data', 'feedbacks', fbId), { senderEmail: authUser.email, senderName: authUser.email, text: feedbackText, createdAt: new Date().toISOString(), status: 'Unread' }); 
            setFeedbackText(''); 
            addToast('Saran dikirim.', 'success'); 
            setHelpTab('chat'); 
        } catch(err) { addToast('Gagal', 'error'); } 
    };

    return (
        <div className="animate-slide-down pb-10 max-w-5xl mx-auto pt-4 w-full h-[85vh] md:h-[calc(100vh-140px)] relative z-10 flex flex-col">
            <div className="clean-card rounded-[3rem] p-4 md:p-8 shadow-2xl flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center gap-4 mb-4 md:mb-6 shrink-0 border-b border-theme pb-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-navy-800 rounded-2xl flex items-center justify-center text-white shadow-lg"><IconMessageSquare className="w-6 h-6 md:w-8 md:h-8"/></div>
                    <div>
                        <h2 className="text-xl md:text-3xl font-black leading-tight text-main drop-shadow-sm flex items-center gap-2">Pusat Bantuan <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Live</span></h2>
                        <p className="text-[10px] md:text-xs text-sub-theme font-medium mt-1 drop-shadow-sm">Hubungi admin untuk bantuan transaksi.</p>
                    </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-navy-900/50 p-1.5 rounded-xl border border-theme shadow-inner shrink-0 mb-4">
                    <button onClick={()=>setHelpTab('chat')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${helpTab === 'chat' ? 'bg-white dark:bg-card shadow-sm text-primary' : 'text-sub-theme hover:text-main'}`}>Live Chat Admin</button>
                    <button onClick={()=>setHelpTab('saran')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${helpTab === 'saran' ? 'bg-white dark:bg-card shadow-sm text-primary' : 'text-sub-theme hover:text-main'}`}>Kotak Saran</button>
                </div>
                
                {helpTab === 'chat' && (
                    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-navy-900/30 rounded-3xl border border-theme shadow-inner overflow-hidden relative">
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-4">
                            <div className="text-center text-[9px] uppercase tracking-widest text-sub-theme font-black bg-white dark:bg-card py-1.5 px-4 rounded-full w-fit mx-auto border border-theme mb-6 shadow-sm">Obrolan Dimulai</div>
                            {(userChat?.messages || []).map((m, i) => (
                                <div key={i} className={`flex w-full ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                    <div className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}>
                                        {m.role && m.sender === 'admin' && <span className="text-[9px] font-bold uppercase tracking-widest mb-1.5 ml-1 text-primary drop-shadow-sm">{m.role}</span>}
                                        <div className="px-4 py-2.5 text-sm shadow-md font-medium leading-relaxed" 
                                            style={{ 
                                                backgroundColor: m.sender === 'user' ? 'var(--chat-user)' : 'var(--chat-admin)', 
                                                color: m.sender === 'user' ? 'var(--chat-text)' : (isDarkMode ? '#ffffff' : '#111827'),
                                                borderRadius: m.sender === 'user' ? '1.5rem 1.5rem 0 1.5rem' : '1.5rem 1.5rem 1.5rem 0' 
                                            }}>
                                            {m.text}
                                        </div>
                                        <div className="text-[9px] font-bold mt-1.5 opacity-70 px-1">{m.time ? new Date(m.time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} className="h-2" />
                        </div>
                        
                        <div className="p-3 md:p-4 bg-white dark:bg-card border-t border-theme shrink-0">
                            {userChat?.status === 'Selesai' && (
                                <div className="text-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 py-2 rounded-xl mb-3 border border-emerald-500/20">Tiket bantuan telah ditutup oleh Admin. Pesan baru akan membuka ulang tiket.</div>
                            )}
                            <form onSubmit={handleSendChatUser} className="flex gap-2 relative">
                                <input type="text" value={chatInput} onChange={(e)=>setChatInput(e.target.value)} placeholder="Ketik pesan untuk Admin..." className="flex-1 input-theme rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary shadow-inner" />
                                <button type="submit" disabled={loadingChat || !(chatInput||'').trim()} className="bg-primary hover:bg-primary-hover text-white px-6 rounded-2xl font-black transition disabled:opacity-50 shadow-lg shadow-primary/20 hover:scale-105"><IconSend className="w-5 h-5"/></button>
                            </form>
                        </div>
                    </div>
                )}

                {helpTab === 'saran' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-navy-900/30 rounded-3xl border border-theme shadow-inner animate-slide-up text-center">
                        <IconMessageSquare className="w-16 h-16 text-primary mb-4 opacity-50"/>
                        <h3 className="text-xl font-black text-main mb-2">Beri Kami Masukan</h3>
                        <p className="text-sm text-sub-theme mb-8 max-w-md">Punya ide fitur baru atau menemukan bug? Tuliskan saran Anda agar Vipercell menjadi lebih baik.</p>
                        <form onSubmit={handleSendFeedback} className="w-full max-w-md space-y-4">
                            <textarea required value={feedbackText} onChange={(e)=>setFeedbackText(e.target.value)} className="w-full h-32 input-theme rounded-2xl p-4 text-sm focus:border-primary shadow-inner resize-none custom-scrollbar" placeholder="Tulis masukan Anda di sini..."></textarea>
                            <button type="submit" disabled={!(feedbackText||'').trim() || sysLoading.active} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg transition disabled:opacity-50 hover:scale-[1.02]">Kirim Saran</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}