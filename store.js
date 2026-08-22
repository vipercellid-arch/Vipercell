import { 
    db, auth,
    signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, onAuthStateChanged,
    signOut, setPersistence, browserLocalPersistence,
    doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, collection, addDoc, increment, arrayUnion 
} from './firebase.js';

window.resizeImageBase64 = function(file, callback, maxWidth, maxHeight) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let w = img.width, h = img.height;
            if(w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
            if(h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL(file.type, 0.8));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'vipercell-prod';
const isWorkspace = typeof __app_id !== 'undefined';

const pathProducts = isWorkspace ? `artifacts/${appId}/public/data/products` : 'products';
const pathOrders = isWorkspace ? `artifacts/${appId}/public/data/orders` : 'orders';
const pathSettings = isWorkspace ? `artifacts/${appId}/public/data/settings` : 'settings';
const pathUsers = isWorkspace ? `artifacts/${appId}/public/data/users` : 'users';
const pathPromos = isWorkspace ? `artifacts/${appId}/public/data/promos` : 'promos';
const pathChats = isWorkspace ? `artifacts/${appId}/public/data/chats` : 'chats';
const pathStocks = isWorkspace ? `artifacts/${appId}/public/data/stocks` : 'stocks';

let products = [];
let groupedBrands = []; 
let orders = [];
let promos = [];
let stocks = [];
let siteSettings = { 
    logoText: 'VIPER', logoAccent: 'CELL', logoImgBase64: '', marquee: 'Selamat Datang di Vipercell', 
    qrisImageBase64: '', adminWa: '085656321860', igLink: '', ttLink: '', 
    tutorialList: [], banners: []
};
let userProfile = { name: '', phone: '' };

let isAdminLoggedIn = false;
let currentUser = null;

let currentCheckoutBrand = null;
let selectedProductForBuy = null;
let appliedPromo = null; 
let currentCheckoutSession = null; 
let currentGroupNominals = [];

// Chat states
let allLiveChats = [];
let userChatMessages = [];
let chatUnsubscribe = null;
let adminChatUnsubscribe = null;
let initialChatLoad = true;
let initialOrderLoad = true;

window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');
window.handleLogoClick = () => window.switchMainTab('katalog');

window.customAlert = (title, message, type = 'info') => {
    document.getElementById('ca-title').innerHTML = title;
    document.getElementById('ca-desc').innerHTML = message;
    const iconEl = document.getElementById('ca-icon');
    iconEl.className = `msg-icon ${type}`;
    if(type === 'success') iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    else if(type === 'error') iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    else if(type === 'warning') iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    else iconEl.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    
    document.getElementById('ca-extra-action').innerHTML = '';
    document.getElementById('custom-alert').classList.add('active');
};
window.closeAlert = () => {
    document.getElementById('custom-alert').classList.remove('active');
    document.getElementById('ca-extra-action').innerHTML = '';
};

let promptCallback = null;
window.openCustomPrompt = function(title, message, callback) {
    document.getElementById('cp-title').innerText = title;
    document.getElementById('cp-desc').innerHTML = message;
    document.getElementById('cp-input').value = '';
    promptCallback = callback;
    window.openModal('custom-prompt-modal');
}
window.confirmCustomPrompt = function() {
    const val = document.getElementById('cp-input').value;
    window.closeModal('custom-prompt-modal');
    if(promptCallback) promptCallback(val);
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('reveal-visible'); });
}, { threshold: 0.1 });
function observeReveals() { document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el)); }

function cutTutorialVideos() {
    const iframes = document.querySelectorAll('#public-tutorial-list iframe');
    iframes.forEach(iframe => {
        let currentSrc = iframe.src;
        iframe.src = currentSrc;
    });
}

function typeWriterEffect() {
    const text = "Selamat Datang";
    const twEl = document.getElementById('tw-text');
    if(!twEl) return;
    let i = 0;
    let isDeleting = false;
    
    function type() {
        const currentText = text.substring(0, i);
        twEl.innerHTML = currentText;
        
        let typeSpeed = 120; 
        
        if (isDeleting) {
            typeSpeed = 60; 
            i--;
        } else {
            i++;
        }
        
        if (!isDeleting && i === text.length + 1) {
            isDeleting = true;
            typeSpeed = 2500; 
        } else if (isDeleting && i === 0) {
            isDeleting = false;
            typeSpeed = 800; 
        }
        setTimeout(type, typeSpeed);
    }
    type();
}

async function initApp() {
    try {
        typeWriterEffect();
        await setPersistence(auth, browserLocalPersistence);
        onAuthStateChanged(auth, async (user) => {
            currentUser = user;
            
            if (user) {
                if (user.isAnonymous) {
                    document.getElementById('btn-login-user').style.display = 'inline-flex';
                    document.getElementById('nav-profil').style.display = 'none';
                    document.getElementById('nav-pesanan').style.display = 'none';
                    document.getElementById('btn-cek-pesanan').style.display = 'inline-flex';
                    userProfile = { name: '', phone: '' };
                } else {
                    document.getElementById('btn-login-user').style.display = 'none';
                    
                    const userDoc = await getDoc(doc(db, pathUsers, user.uid));
                    if(userDoc.exists()) {
                        userProfile = userDoc.data();
                        document.getElementById('prof-name').value = userProfile.name || '';
                        document.getElementById('prof-phone').value = userProfile.phone || '';
                    } else {
                        userProfile = { name: '', phone: '' };
                    }
                    
                    document.getElementById('prof-email').value = user.email || '';
                    document.getElementById('nav-profil').style.display = 'flex';
                    document.getElementById('nav-pesanan').style.display = 'flex';
                    document.getElementById('btn-cek-pesanan').style.display = 'none';
                    window.renderUserOrders(); 
                    updateProfileStats();
                }

                if (user.email === 'vipercell.id@gmail.com') {
                    isAdminLoggedIn = true;
                    document.getElementById('nav-admin').style.display = 'flex';
                    listenAdminLiveChat();
                } else {
                    isAdminLoggedIn = false;
                    document.getElementById('nav-admin').style.display = 'none';
                    if (document.getElementById('admin-dashboard').style.display === 'block') window.toggleAdminDashboard(false);
                    document.getElementById('user-chat-fab').style.display = 'flex';
                    listenUserChat();
                }
                listenData();
            } else {
                isAdminLoggedIn = false;
                document.getElementById('nav-admin').style.display = 'none';
                document.getElementById('btn-login-user').style.display = 'inline-flex';
                document.getElementById('nav-profil').style.display = 'none';
                document.getElementById('nav-pesanan').style.display = 'none';
                document.getElementById('btn-cek-pesanan').style.display = 'inline-flex';
                signInAnonymously(auth).catch(() => {});
            }
        });
    } catch (error) {}
    observeReveals();
}

let isListening = false;
function listenData() {
    if(isListening) return;
    isListening = true;

    onSnapshot(doc(db, pathSettings, 'mainConfig'), (docSnap) => {
        if (docSnap.exists()) {
            siteSettings = { ...siteSettings, ...docSnap.data() };
            window.applySettingsToUI();
        } else {
            setDoc(doc(db, pathSettings, 'mainConfig'), siteSettings).catch(()=>{});
        }
    });

    onSnapshot(collection(db, pathProducts), (snapshot) => {
        products = [];
        snapshot.forEach((doc) => { products.push({ dbId: doc.id, ...doc.data() }); });
        
        groupedBrands = [];
        products.forEach(p => {
            const brandName = p.brand || p.name;
            const existing = groupedBrands.find(b => b.brandName === brandName);
            if(existing) {
                existing.items.push(p);
                if(p.imgUrlBase64 && !existing.imgUrlBase64) existing.imgUrlBase64 = p.imgUrlBase64;
            } else {
                groupedBrands.push({
                    brandName: brandName,
                    type: p.type,
                    imgUrlBase64: p.imgUrlBase64 || '',
                    items: [p]
                });
            }
        });

        let activeTabBtn = document.querySelector('.tab-btn.active');
        let curFilter = activeTabBtn ? (activeTabBtn.innerText.includes('Aplikasi') ? 'app' : activeTabBtn.innerText.includes('Game') ? 'game' : 'all') : 'all';
        window.renderBrands(curFilter);
        if(isAdminLoggedIn) {
            window.renderAdminProducts();
            window.renderAdminStocks();
        }
    });

    onSnapshot(collection(db, pathPromos), (snapshot) => {
        promos = [];
        snapshot.forEach((doc) => { promos.push({ dbId: doc.id, ...doc.data() }); });
        if(isAdminLoggedIn) window.renderAdminPromos();
        if(selectedProductForBuy) window.calculateDirectBuyTotal();
    });
    
    onSnapshot(collection(db, pathStocks), (snapshot) => {
        stocks = [];
        snapshot.forEach((doc) => { stocks.push({ dbId: doc.id, ...doc.data() }); });
        if(isAdminLoggedIn) window.renderAdminStocks();
    });

    onSnapshot(collection(db, pathOrders), (snapshot) => {
        orders = [];
        snapshot.forEach((doc) => { orders.push({ dbId: doc.id, ...doc.data() }); });
        orders.sort((a,b) => new Date(b.date) - new Date(a.date));
        if(isAdminLoggedIn) window.renderAdminOrders();
        
        updateOrderBadges();
        
        if(currentUser && !currentUser.isAnonymous) {
            window.renderUserOrders();
            updateProfileStats();
        }

        initialOrderLoad = false;
    });
}

function updateOrderBadges() {
    if (isAdminLoggedIn) {
        const hasPending = orders.some(o => o.status === 'PENDING');
        document.getElementById('admin-badge').style.display = hasPending ? 'block' : 'none';
        const adminOrderTabBadge = document.getElementById('admin-tab-order-badge');
        if(adminOrderTabBadge) adminOrderTabBadge.style.display = hasPending ? 'inline-block' : 'none';
    }

    if (currentUser && !currentUser.isAnonymous) {
        const hasActionNeeded = orders.some(o => o.userEmail === currentUser.email && (o.status === 'UNPAID' || o.status === 'PENDING'));
        document.getElementById('user-order-badge').style.display = hasActionNeeded ? 'block' : 'none';
    }
}

// ==========================================
// FITUR LIVE CHAT
// ==========================================
window.toggleUserChat = function() {
    const chatWindow = document.getElementById('user-chat-window');
    chatWindow.classList.toggle('active');
    if(chatWindow.classList.contains('active')) {
        document.getElementById('user-chat-badge').style.display = 'none';
        scrollToBottomUserChat();
    }
}

function listenUserChat() {
    if(!currentUser) return;
    const chatRef = doc(db, pathChats, currentUser.uid);
    if(chatUnsubscribe) chatUnsubscribe();
    
    chatUnsubscribe = onSnapshot(chatRef, (docSnap) => {
        if(docSnap.exists()) {
            const data = docSnap.data();
            const oldLen = userChatMessages.length;
            userChatMessages = data.messages || [];
            
            window.renderUserChatMessages();
            
            if(userChatMessages.length > oldLen && oldLen > 0) {
                const lastMsg = userChatMessages[userChatMessages.length - 1];
                if(lastMsg.sender === 'admin') {
                    if(!document.getElementById('user-chat-window').classList.contains('active')) {
                        document.getElementById('user-chat-badge').style.display = 'block';
                    }
                }
            }
        } else {
            userChatMessages = [];
            window.renderUserChatMessages();
        }
    });
}

window.renderUserChatMessages = function() {
    const body = document.getElementById('user-chat-body');
    body.innerHTML = '';
    
    if(userChatMessages.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.8rem; margin-top:20px;">Belum ada obrolan. Kirim pesan untuk memulai.</p>';
        return;
    }

    userChatMessages.forEach(msg => {
        const isUser = msg.sender === 'user';
        body.innerHTML += `
            <div class="chat-msg ${isUser ? 'user' : 'admin'}">
                ${msg.text}
                <span class="chat-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
    });
    scrollToBottomUserChat();
}

function scrollToBottomUserChat() {
    const body = document.getElementById('user-chat-body');
    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 100);
}

window.sendUserChat = async function() {
    if(!currentUser) return;
    const input = document.getElementById('user-chat-input');
    const text = input.value.trim();
    if(!text) return;
    
    input.value = '';
    const chatRef = doc(db, pathChats, currentUser.uid);
    
    const newMsg = { sender: 'user', text: text, timestamp: Date.now() };
    
    const docSnap = await getDoc(chatRef);
    if(!docSnap.exists()) {
        const userInfo = userProfile.name ? `${userProfile.name} (${userProfile.phone})` : (currentUser.isAnonymous ? 'User Guest' : currentUser.email);
        await setDoc(chatRef, {
            uid: currentUser.uid,
            userInfo: userInfo,
            updatedAt: Date.now(),
            messages: [newMsg]
        });
    } else {
        await updateDoc(chatRef, {
            updatedAt: Date.now(),
            messages: arrayUnion(newMsg)
        });
    }
    scrollToBottomUserChat();
}

// --- ADMIN CHAT LOGIC ---
function listenAdminLiveChat() {
    if(adminChatUnsubscribe) adminChatUnsubscribe();
    adminChatUnsubscribe = onSnapshot(collection(db, pathChats), (snapshot) => {
        allLiveChats = [];
        snapshot.forEach(doc => {
            allLiveChats.push({ id: doc.id, ...doc.data() });
        });
        
        allLiveChats.sort((a,b) => b.updatedAt - a.updatedAt);
        window.renderAdminChatList();
        
        const badge = document.getElementById('admin-chat-tab-badge');
        if(allLiveChats.length > 0) { badge.style.display = 'inline-block'; } else { badge.style.display = 'none'; }
        
        initialChatLoad = false;
        
        const activeId = document.getElementById('admin-active-chat-id').value;
        if(activeId && document.getElementById('modal-admin-chat').classList.contains('active')) {
            window.openAdminChatDetail(activeId); 
        }
    });
}

window.renderAdminChatList = function() {
    const list = document.getElementById('admin-chat-list');
    if(!list) return;
    list.innerHTML = '';
    if(allLiveChats.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">Tidak ada sesi obrolan aktif.</p>';
        return;
    }

    allLiveChats.forEach(chat => {
        const msgs = chat.messages || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length-1] : null;
        const hasUnread = lastMsg && lastMsg.sender === 'user';
        
        list.innerHTML += `
            <div class="admin-chat-card" onclick="window.openAdminChatDetail('${chat.id}')">
                <div style="flex:1; overflow:hidden;">
                    <strong style="color:var(--text); font-size:0.9rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chat.userInfo}</strong>
                    <small style="color:var(--text-muted); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lastMsg ? lastMsg.text : '...'}</small>
                </div>
                ${hasUnread ? '<span class="badge">Baru</span>' : ''}
            </div>
        `;
    });
}

window.openAdminChatDetail = function(chatId) {
    const chat = allLiveChats.find(c => c.id === chatId);
    if(!chat) return;
    
    document.getElementById('admin-active-chat-id').value = chatId;
    document.getElementById('admin-chat-title').innerText = `Chat: ${chat.userInfo}`;
    
    const body = document.getElementById('admin-chat-body');
    body.innerHTML = '';
    
    (chat.messages || []).forEach(msg => {
        const isAdmin = msg.sender === 'admin';
        body.innerHTML += `
            <div class="chat-msg ${isAdmin ? 'user' : 'admin'}" style="${isAdmin ? 'align-self:flex-end; background:var(--primary); color:white;' : 'align-self:flex-start;'}">
                ${msg.text}
                <span class="chat-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
    });
    
    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
    window.openModal('modal-admin-chat');
}

window.sendAdminChat = async function() {
    const chatId = document.getElementById('admin-active-chat-id').value;
    const input = document.getElementById('admin-chat-input');
    const text = input.value.trim();
    if(!text || !chatId) return;
    
    input.value = '';
    const chatRef = doc(db, pathChats, chatId);
    await updateDoc(chatRef, {
        updatedAt: Date.now(),
        messages: arrayUnion({ sender: 'admin', text: text, timestamp: Date.now() })
    });
}

window.resolveChat = async function() {
    const chatId = document.getElementById('admin-active-chat-id').value;
    if(!chatId) return;
    window.openCustomPrompt('Selesai', 'Ketik <b>SELESAI</b> untuk menutup permanen chat ini.', async (val) => {
        if(val === 'SELESAI') {
            await deleteDoc(doc(db, pathChats, chatId));
            window.closeModal('modal-admin-chat');
            window.customAlert('Dihapus', 'Sesi Live Chat dihapus.', 'info');
        } else {
            window.customAlert('Gagal', 'Kata konfirmasi salah. Penghapusan dibatalkan.', 'error');
        }
    });
}

// ==========================================
// FUNGSI UMUM LAINNYA
// ==========================================
window.toggleFaq = function(element) { element.classList.toggle('expanded'); }

window.openAuthModal = function() {
    window.switchAuthTab('login');
    window.openModal('modal-auth');
};

window.switchAuthTab = function(tab) {
    document.getElementById('form-login').style.display = tab==='login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab==='register' ? 'block' : 'none';
    document.getElementById('form-reset').style.display = tab==='reset' ? 'block' : 'none';
    document.getElementById('auth-divider').style.display = tab==='reset' ? 'none' : 'flex';
    document.getElementById('auth-google-btn').style.display = tab==='reset' ? 'none' : 'inline-flex';
    
    document.getElementById('tab-login').style.color = tab==='login' ? 'var(--primary-light)' : 'var(--text-muted)';
    document.getElementById('tab-login').style.borderBottomColor = tab==='login' ? 'var(--primary-light)' : 'transparent';
    document.getElementById('tab-register').style.color = tab==='register' ? 'var(--primary-light)' : 'var(--text-muted)';
    document.getElementById('tab-register').style.borderBottomColor = tab==='register' ? 'var(--primary-light)' : 'transparent';
    
    if(tab==='reset') document.getElementById('auth-title').innerText = 'Lupa Password';
    else document.getElementById('auth-title').innerText = tab==='login' ? 'Masuk Akun' : 'Daftar Baru';
};

window.showResetPassword = () => window.switchAuthTab('reset');

window.processLogin = async function() {
    const em = document.getElementById('auth-l-email').value.trim();
    const pw = document.getElementById('auth-l-pass').value.trim();
    if(!em || !pw) { window.customAlert('Error', 'Email dan Password wajib diisi!', 'error'); return; }
    const btn = document.getElementById('btn-do-login');
    btn.innerText = 'Memproses...'; btn.disabled = true;
    try {
        await signInWithEmailAndPassword(auth, em, pw);
        window.closeModal('modal-auth');
        if(em === 'vipercell.id@gmail.com') window.customAlert('Sukses', 'Selamat datang Admin Vipercell.', 'success');
        else window.customAlert('Sukses', 'Berhasil masuk.', 'success');
    } catch(e) { 
        window.customAlert('Gagal', 'Email atau password salah.', 'error'); 
    } finally {
        btn.innerText = 'Masuk'; btn.disabled = false;
    }
};

window.processRegister = async function() {
    const em = document.getElementById('auth-r-email').value.trim();
    const pw = document.getElementById('auth-r-pass').value.trim();
    if(!em || pw.length < 6) { window.customAlert('Peringatan', 'Gunakan Email valid dan Password min 6 karakter.', 'warning'); return; }
    
    const btn = document.getElementById('btn-do-register');
    btn.innerText = 'Memproses...'; btn.disabled = true;
    try {
        const cred = await createUserWithEmailAndPassword(auth, em, pw);
        await setDoc(doc(db, pathUsers, cred.user.uid), { 
            email: em, name: '', phone: '', createdAt: new Date().toISOString()
        });
        
        window.closeModal('modal-auth');
        window.customAlert('Sukses', 'Akun berhasil didaftarkan.', 'success');
        window.switchMainTab('profil');
    } catch(e) { 
        window.customAlert('Gagal', 'Email mungkin sudah terdaftar.', 'error'); 
    } finally {
        btn.innerText = 'Daftar'; btn.disabled = false;
    }
};

function checkResetCooldown() {
    const lastResetTime = localStorage.getItem('vipercell_last_reset') || 0;
    const COOLDOWN = 4 * 60 * 1000;
    const now = Date.now();
    if (now - lastResetTime < COOLDOWN) {
        const remaining = Math.ceil((COOLDOWN - (now - lastResetTime)) / 1000);
        const min = Math.floor(remaining / 60);
        const sec = remaining % 60;
        window.customAlert('Tunggu Sebentar', `Harap tunggu <b>${min}m ${sec}s</b> lagi sebelum meminta tautan reset sandi.`, 'warning');
        return false;
    }
    return true;
}

window.processReset = async function() {
    const em = document.getElementById('auth-res-email').value.trim();
    if(!em) { window.customAlert('Error', 'Masukkan email terdaftar.', 'error'); return; }
    if(!checkResetCooldown()) return;

    try {
        await sendPasswordResetEmail(auth, em);
        localStorage.setItem('vipercell_last_reset', Date.now());
        window.customAlert('Terkirim', 'Tautan reset telah dikirim ke email kamu.', 'success');
        window.switchAuthTab('login');
    } catch(e) { window.customAlert('Error', 'Gagal mengirim tautan reset.', 'error'); }
};

window.sendProfileResetPassword = async function() {
    if(!currentUser || currentUser.isAnonymous) return;
    if(!checkResetCooldown()) return;

    try {
        await sendPasswordResetEmail(auth, currentUser.email);
        localStorage.setItem('vipercell_last_reset', Date.now());
        window.customAlert('Terkirim', 'Cek kotak masuk email kamu untuk membuat sandi baru.', 'success');
    } catch (e) { window.customAlert('Gagal', 'Terjadi kesalahan sistem.', 'error'); }
}

window.googleLogin = async function() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        if (result.user.email === 'vipercell.id@gmail.com') {
            window.closeModal('modal-auth'); window.customAlert('Sukses', 'Selamat datang Admin.', 'success'); return;
        }
        const userDoc = await getDoc(doc(db, pathUsers, result.user.uid));
        if (!userDoc.exists()) {
            await signOut(auth);
            window.customAlert('Akses Ditolak', 'Kamu belum mendaftar. Silakan ke menu <b>Daftar Baru</b> di web ini terlebih dahulu sebelum bisa login menggunakan Google.', 'error');
            return;
        }

        window.closeModal('modal-auth');
        window.customAlert('Sukses', 'Berhasil masuk via Google.', 'success'); 
        window.switchMainTab('pesanan');
    } catch (error) {}
};

window.logoutUser = async function() {
    await signOut(auth);
    window.switchMainTab('katalog');
    window.customAlert('Logout', 'Anda telah keluar dari akun.', 'info');
};

window.saveUserProfile = async function() {
    if(!currentUser || currentUser.isAnonymous) return;
    const name = document.getElementById('prof-name').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    try {
        await setDoc(doc(db, pathUsers, currentUser.uid), { name, phone }, { merge: true });
        userProfile.name = name; userProfile.phone = phone;
        window.customAlert('Tersimpan', 'Profil berhasil diperbarui.', 'success');
    } catch(e) { window.customAlert('Error', 'Gagal menyimpan profil.', 'error'); }
};

function updateProfileStats() {
    if(!currentUser || currentUser.isAnonymous) return;
    const successCount = orders.filter(o => o.userEmail === currentUser.email && o.status === 'SUCCESS').length;
    document.getElementById('prof-stat-success').innerText = successCount;
}

window.switchMainTab = function(tab) {
    cutTutorialVideos();
    document.querySelectorAll('.main-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
    
    let navEl = document.getElementById('nav-'+tab);
    if(navEl) navEl.classList.add('active');
    
    let tabEl = document.getElementById('tab-'+tab);
    if(tabEl) {
        tabEl.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' }); 
    }
    setTimeout(observeReveals, 50);
};

function extractDriveId(link) { const match = link.match(/(?:id=|d\/)([a-zA-Z0-9_-]+)/i); return match ? match[1] : link; }

window.applySettingsToUI = function() {
    const logoDasar = siteSettings.logoText || 'VIPER';
    const logoAksen = siteSettings.logoAccent || 'CELL';
    
    document.getElementById('site-logo-text').innerHTML = `${logoDasar}<span>${logoAksen}</span>`;
    document.getElementById('footer-logo-text-2').innerHTML = `${logoDasar}<span>${logoAksen}</span>`;
    
    const imgEl = document.getElementById('site-logo-img');
    const fImgEl = document.getElementById('footer-logo-img-2');
    const favicon = document.getElementById('favicon');
    const adminLogoEl = document.getElementById('admin-header-logo-img');
    const defAdminIco = document.getElementById('admin-header-default-icon');
    
    if(siteSettings.logoImgBase64) {
        imgEl.src = siteSettings.logoImgBase64; imgEl.style.display = 'block';
        fImgEl.src = siteSettings.logoImgBase64; fImgEl.style.display = 'block';
        favicon.href = siteSettings.logoImgBase64; 
        adminLogoEl.src = siteSettings.logoImgBase64; adminLogoEl.style.display = 'inline-block';
        if(defAdminIco) defAdminIco.style.display = 'none';
    } else {
        imgEl.style.display = 'none'; fImgEl.style.display = 'none'; adminLogoEl.style.display = 'none';
        if(defAdminIco) defAdminIco.style.display = 'inline-block';
    }
    
    const mText = siteSettings.marquee || 'Selamat Datang di Vipercell';
    document.getElementById('marquee-text-1').innerText = mText;
    document.getElementById('marquee-text-2').innerText = mText;

    const igBtn = document.getElementById('footer-ig-btn');
    if(siteSettings.igLink) { igBtn.href = siteSettings.igLink; igBtn.style.display = 'inline-flex'; } else { igBtn.style.display = 'none'; }
    
    const ttBtn = document.getElementById('footer-tt-btn');
    if(siteSettings.ttLink) { ttBtn.href = siteSettings.ttLink; ttBtn.style.display = 'inline-flex'; } else { ttBtn.style.display = 'none'; }

    let adminWaNum = siteSettings.adminWa || '085656321860';
    if (adminWaNum.startsWith('0')) adminWaNum = '62' + adminWaNum.substring(1);
    const waHref = `https://wa.me/${adminWaNum}?text=${encodeURIComponent('Halo Min')}`;
    document.getElementById('footer-wa-link').href = waHref;

    window.renderBanners();
    window.renderTutorials();
    
    if(isAdminLoggedIn) { 
        window.populateAdminSettings(); 
        window.renderAdminTutorials(); 
    }
}

// ====================== ADMIN SETTINGS AND TUTORIALS LOGIC ======================
window.populateAdminSettings = function() {
    document.getElementById('set-logo-text').value = siteSettings.logoText || '';
    document.getElementById('set-logo-accent').value = siteSettings.logoAccent || '';
    document.getElementById('set-logo-base64').value = siteSettings.logoImgBase64 || '';
    document.getElementById('set-marquee').value = siteSettings.marquee || '';
    document.getElementById('set-wa').value = siteSettings.adminWa || '';
    document.getElementById('set-ig').value = siteSettings.igLink || '';
    document.getElementById('set-tt').value = siteSettings.ttLink || '';
    document.getElementById('set-qris-base64').value = siteSettings.qrisImageBase64 || '';

    if(siteSettings.logoImgBase64) {
        const p = document.getElementById('set-logo-preview');
        p.src = siteSettings.logoImgBase64; p.style.display = 'block';
        document.getElementById('set-logo-file-name').innerText = "Gambar Dimuat";
    }
    if(siteSettings.qrisImageBase64) {
        const p = document.getElementById('set-qris-preview');
        p.src = siteSettings.qrisImageBase64; p.style.display = 'block';
        document.getElementById('set-qris-file-name').innerText = "QRIS Dimuat";
    }

    window.renderAdminBanners(); 
};

window.saveSettings = async function() {
    const newSettings = {
        logoText: document.getElementById('set-logo-text').value.trim(),
        logoAccent: document.getElementById('set-logo-accent').value.trim(),
        logoImgBase64: document.getElementById('set-logo-base64').value, 
        marquee: document.getElementById('set-marquee').value.trim(),
        adminWa: document.getElementById('set-wa').value.trim(),
        igLink: document.getElementById('set-ig').value.trim(),
        ttLink: document.getElementById('set-tt').value.trim(),
        qrisImageBase64: document.getElementById('set-qris-base64').value
    };
    await updateDoc(doc(db, pathSettings, 'mainConfig'), newSettings);
    window.customAlert('Sukses', 'Pengaturan berhasil disimpan!', 'success');
};

document.getElementById('set-qris-upload').addEventListener('change', function(e) {
    if (e.target.files[0]) {
        document.getElementById('set-qris-file-name').innerText = e.target.files[0].name;
        window.resizeImageBase64(e.target.files[0], (b64) => {
            document.getElementById('set-qris-base64').value = b64;
            const p = document.getElementById('set-qris-preview');
            p.src = b64; p.style.display = 'block';
        }, 800, 800);
    }
});

document.getElementById('logo-upload').addEventListener('change', function(e) {
    if (e.target.files[0]) {
        document.getElementById('set-logo-file-name').innerText = e.target.files[0].name;
        window.resizeImageBase64(e.target.files[0], (b64) => {
            document.getElementById('set-logo-base64').value = b64; 
            const p = document.getElementById('set-logo-preview');
            p.src = b64; p.style.display = 'block';
        }, 800, 800);
    }
});

// ------------------ FITUR TAMBAH BANNER ------------------ //
document.getElementById('banner-upload').addEventListener('change', function(e) {
    if (e.target.files[0]) {
        window.resizeImageBase64(e.target.files[0], async (b64) => {
            const banners = siteSettings.banners || [];
            banners.push(b64);
            await updateDoc(doc(db, pathSettings, 'mainConfig'), { banners: banners });
            siteSettings.banners = banners; 
            window.renderAdminBanners();
            window.renderBanners();
            window.customAlert('Sukses', 'Banner berhasil ditambahkan.', 'success');
            e.target.value = ''; 
        }, 1200, 600); 
    }
});

window.renderAdminBanners = function() {
    const list = document.getElementById('admin-banner-list');
    if(!list) return;
    list.innerHTML = '';
    const banners = siteSettings.banners || [];
    if(banners.length === 0){
        list.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">Belum ada banner.</span>';
    }
    banners.forEach((b64, idx) => {
        list.innerHTML += `
        <div style="position:relative; border:1px solid #1e293b; border-radius:8px; overflow:hidden;">
            <img src="${b64}" style="width:100%; height:100px; object-fit:cover;">
            <button class="btn btn-danger" style="position:absolute; top:5px; right:5px; padding:5px 8px;" onclick="window.deleteBanner(${idx})"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    });
}

window.deleteBanner = async function(idx) {
    window.openCustomPrompt('Hapus', 'Ketik <b>YAKIN</b> untuk hapus banner ini.', async (val) => {
        if(val === 'YAKIN') {
            const banners = siteSettings.banners || [];
            banners.splice(idx, 1);
            await updateDoc(doc(db, pathSettings, 'mainConfig'), { banners: banners });
            siteSettings.banners = banners;
            window.renderAdminBanners();
            window.renderBanners();
            window.customAlert('Dihapus', 'Banner telah dihapus', 'info');
        }
    });
}
// --------------------------------------------------------- //

window.renderAdminTutorials = function() {
    const list = document.getElementById('admin-tut-list');
    if(!list) return;
    list.innerHTML = '';
    const tuts = siteSettings.tutorialList || [];
    if(tuts.length === 0) { list.innerHTML = '<p style="color:var(--text-muted)">Belum ada video panduan.</p>'; return; }
    tuts.forEach((t, i) => {
        list.innerHTML += `<div style="background:var(--surface); border:1px solid var(--border); padding:1rem; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div><strong>${t.title}</strong><br><small style="color:var(--text-muted)">${t.url}</small></div>
            <div>
                <button class="btn btn-danger" onclick="window.deleteTutorial(${i})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });
};

window.openTutorialModal = function(index = -1) {
    document.getElementById('manage-tut-index').value = index;
    document.getElementById('manage-tut-title').value = '';
    document.getElementById('manage-tut-url').value = '';
    document.getElementById('manage-tut-desc').value = '';
    window.openModal('modal-manage-tutorial');
};

window.saveTutorial = async function() {
    const title = document.getElementById('manage-tut-title').value.trim();
    const url = document.getElementById('manage-tut-url').value.trim();
    const desc = document.getElementById('manage-tut-desc').value.trim();
    if(!title || !url) { window.customAlert('Error', 'Judul dan URL wajib diisi.', 'error'); return; }

    const tuts = siteSettings.tutorialList ? [...siteSettings.tutorialList] : [];
    tuts.push({ title, url, desc, isHidden: false });
    
    await updateDoc(doc(db, pathSettings, 'mainConfig'), { tutorialList: tuts });
    window.closeModal('modal-manage-tutorial');
    window.customAlert('Sukses', 'Tutorial berhasil ditambahkan.', 'success');
};

window.deleteTutorial = async function(index) {
    window.openCustomPrompt('Hapus Tutorial', 'Ketik <b>YAKIN</b> untuk menghapus video ini.', async (val) => {
        if(val === 'YAKIN') {
            const tuts = [...siteSettings.tutorialList];
            tuts.splice(index, 1);
            await updateDoc(doc(db, pathSettings, 'mainConfig'), { tutorialList: tuts });
            window.customAlert('Dihapus', 'Tutorial berhasil dihapus.', 'info');
        }
    });
};

window.renderBanners = function() {
    const container = document.getElementById('banner-container');
    const track = document.getElementById('banner-track');
    const dotsContainer = document.getElementById('banner-dots');
    if(!container || !track || !dotsContainer) return;
    track.innerHTML = ''; dotsContainer.innerHTML = '';
    
    const banners = siteSettings.banners || [];
    if(banners.length === 0) { 
        container.style.display = 'none'; 
        return; 
    }
    
    container.style.display = 'block';
    setTimeout(() => { container.classList.add('reveal-visible'); }, 50); 
    
    banners.forEach((b64, idx) => {
        track.innerHTML += `<img src="${b64}" class="banner-slide" alt="Promo">`;
        dotsContainer.innerHTML += `<div class="banner-dot ${idx===0?'active':''}" onclick="window.goToBanner(${idx})"></div>`;
    });
    window.startBannerAuto();
}

let currentBanner = 0; let bannerInterval;
window.goToBanner = function(idx) {
    currentBanner = idx;
    const track = document.getElementById('banner-track');
    const dots = document.querySelectorAll('.banner-dot');
    if(!track) return;
    track.style.transform = `translateX(-${currentBanner * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    if(dots[currentBanner]) dots[currentBanner].classList.add('active');
};
window.startBannerAuto = function() {
    clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const total = siteSettings.banners?.length || 0;
        if(total > 1) { currentBanner = (currentBanner + 1) % total; window.goToBanner(currentBanner); }
    }, 5000);
}

window.renderTutorials = function() {
    const grid = document.getElementById('public-tutorial-list');
    if(!grid) return;
    grid.innerHTML = '';
    const list = siteSettings.tutorialList || [];
    const visibleList = list.filter(t => !t.isHidden);
    
    if(visibleList.length === 0) {
        grid.innerHTML = '<div style="text-align:center; color:var(--text-muted)">Belum ada video panduan tersedia.</div>';
        return;
    }

    visibleList.forEach(tut => {
        const driveId = extractDriveId(tut.url);
        const iframeSrc = `https://drive.google.com/file/d/${driveId}/preview`;
        grid.innerHTML += `
            <div class="tutorial-card">
                <div class="video-container"><iframe src="${iframeSrc}" allow="autoplay" allowfullscreen></iframe></div>
                <div class="tutorial-info">
                    <h3>${tut.title}</h3><p>${tut.desc.replace(/\n/g, '<br>')}</p>
                </div>
            </div>`;
    });
}

window.filterBrands = function(type, btnEl) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    window.renderBrands(type);
};

window.renderBrands = function(filter) {
    const grid = document.getElementById('brand-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const filteredBrands = filter === 'all' ? groupedBrands : groupedBrands.filter(b => b.type === filter);
    if(filteredBrands.length === 0) { 
        grid.innerHTML = `<div style="text-align:center; grid-column: 1/-1; color:var(--text-muted);">Katalog kosong.</div>`; 
        return; 
    }

    filteredBrands.forEach(b => {
        const typeName = b.type === 'game' ? 'Game' : 'Aplikasi';
        const imgHtml = b.imgUrlBase64 
            ? `<img src="${b.imgUrlBase64}" alt="${b.brandName}">` 
            : `<div style="width:100%; height:100%; background:var(--primary-gradient); display:flex; align-items:center; justify-content:center; font-size:3rem; font-weight:bold; color:rgba(255,255,255,0.3);">${b.brandName.charAt(0)}</div>`;

        grid.innerHTML += `
            <div class="brand-card reveal" onclick="window.openDirectBuyModal('${b.brandName}')">
                <div class="brand-img-wrapper">
                    ${imgHtml}
                    <span class="card-badge">${typeName}</span>
                </div>
                <div class="brand-content">
                    <h3>${b.brandName}</h3>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">Pilih Nominal/Item</p>
                </div>
            </div>`;
    });
    setTimeout(observeReveals, 100);
};

window.openDirectBuyModal = function(brandName) {
    const brandObj = groupedBrands.find(b => b.brandName === brandName);
    if(!brandObj) return;

    currentCheckoutBrand = brandObj;
    selectedProductForBuy = null;
    appliedPromo = null;
    document.getElementById('buy-promo-code').value = '';
    document.getElementById('buy-promo-msg').innerHTML = '';
    
    document.getElementById('buy-brand-name').innerText = brandObj.brandName;
    document.getElementById('buy-brand-badge').innerText = brandObj.type === 'game' ? 'TOP UP GAME' : 'APLIKASI PREMIUM';
    const imgEl = document.getElementById('buy-brand-img');
    if(brandObj.imgUrlBase64) {
        imgEl.src = brandObj.imgUrlBase64; imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    const itemGrid = document.getElementById('buy-item-grid');
    itemGrid.innerHTML = '';
    
    const sortedItems = [...brandObj.items].sort((a, b) => (a.priceNum||0) - (b.priceNum||0));
    sortedItems.forEach(item => {
        const fmtPrice = 'Rp' + (item.priceNum || 0).toLocaleString('id-ID');
        const isSold = item.soldOut;
        itemGrid.innerHTML += `
            <div class="item-card ${isSold ? 'sold-out' : ''}" id="buy-card-${item.dbId}" onclick="${isSold ? '' : `window.selectItemToBuy('${item.dbId}')`}">
                <h4>${item.name}</h4>
                <p>${fmtPrice}</p>
            </div>
        `;
    });

    const fields = document.getElementById('buy-detail-fields');
    let inpType = brandObj.items[0]?.inputType || 'id_zone'; 
    
    if(brandObj.type === 'game') {
        if(inpType === 'id_only') {
            fields.innerHTML = `
                <div class="form-group"><label>ID Player / Target (Wajib)</label><input type="text" id="buy-id" class="form-control" placeholder="Contoh: 123456789" required></div>`;
        } else if(inpType === 'custom') {
            fields.innerHTML = `
                <div class="form-group"><label>Informasi Akun / Server / Karakter (Wajib)</label><input type="text" id="buy-id" class="form-control" placeholder="Contoh: Server Asia, Nickname Budi" required></div>`;
        } else {
            fields.innerHTML = `
                <div class="form-group"><label>ID Player (Wajib)</label><input type="text" id="buy-id" class="form-control" placeholder="Contoh: 12345678" required></div>
                <div class="form-group"><label>Zone ID / Server</label><input type="text" id="buy-zone" class="form-control" placeholder="Contoh: 1234"></div>`;
        }
    } else {
        fields.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding: 1rem; background:rgba(37,99,235,0.1); border-radius:8px;">Informasi akun premium akan otomatis ditaruh admin di menu detail <b>Lacak Pesanan</b> setelah disetujui.</p>`;
    }

    const waInputGroup = document.getElementById('buy-wa-group');
    const waInput = document.getElementById('buy-wa');
    if(currentUser && !currentUser.isAnonymous && userProfile.phone) {
        waInput.value = userProfile.phone;
        waInputGroup.style.display = 'none'; 
    } else {
        waInput.value = '';
        waInputGroup.style.display = 'block';
    }

    window.calculateDirectBuyTotal();
    window.openModal('modal-buy-direct');
};

window.selectItemToBuy = function(dbId) {
    selectedProductForBuy = currentCheckoutBrand.items.find(i => i.dbId === dbId);
    document.querySelectorAll('.item-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`buy-card-${dbId}`).classList.add('selected');
    window.calculateDirectBuyTotal();
};

window.applyPromoDirect = function() {
    const codeInput = document.getElementById('buy-promo-code').value.trim().toUpperCase();
    const msgEl = document.getElementById('buy-promo-msg');
    
    if(!codeInput) {
        appliedPromo = null;
        window.calculateDirectBuyTotal();
        return;
    }

    const p = promos.find(x => x.code === codeInput);
    if(!p || !p.active) {
        appliedPromo = null;
        msgEl.innerHTML = `<span style="color:var(--danger)">Kode promo tidak valid atau tidak aktif.</span>`;
    } else if (p.usedCount >= p.maxUses) {
        appliedPromo = null;
        msgEl.innerHTML = `<span style="color:var(--danger)">Kode promo telah melampaui batas pemakaian.</span>`;
    } else {
        appliedPromo = { dbId: p.dbId, code: p.code, amount: p.amount };
        msgEl.innerHTML = `<span style="color:var(--success)"><i class="fa-solid fa-check"></i> Promo dipakai! Potongan Rp${p.amount.toLocaleString('id-ID')}</span>`;
    }
    window.calculateDirectBuyTotal();
};

window.calculateDirectBuyTotal = function() {
    const btnProc = document.getElementById('btn-process-buy');
    if(!selectedProductForBuy) {
        document.getElementById('buy-total-price').innerText = 'Rp0';
        btnProc.innerText = 'Pilih Item Dahulu';
        btnProc.disabled = true;
        return;
    }

    let baseTotal = selectedProductForBuy.priceNum;
    let disc = 0;
    if(appliedPromo) {
        disc = appliedPromo.amount;
        if(disc > baseTotal) disc = baseTotal;
        baseTotal -= disc;
    } else if (document.getElementById('buy-promo-code').value === '') {
         document.getElementById('buy-promo-msg').innerHTML = '';
    }

    document.getElementById('buy-total-price').innerText = `Rp${baseTotal.toLocaleString('id-ID')}`;
    btnProc.innerText = 'Checkout & Bayar (QRIS)';
    btnProc.disabled = false;
}

window.processDirectCheckout = async function() {
    if(!selectedProductForBuy) return;

    let wa = document.getElementById('buy-wa').value;
    if(currentUser && !currentUser.isAnonymous && userProfile.phone) wa = userProfile.phone;
    if(!wa || wa.length < 9) { window.customAlert('Peringatan', 'Nomor WhatsApp wajib diisi minimal 9 angka!', 'warning'); return; }

    let playerInfo = '';
    if(currentCheckoutBrand.type === 'game') {
        const pid = document.getElementById('buy-id').value.trim();
        const zol = document.getElementById('buy-zone') ? document.getElementById('buy-zone').value.trim() : '';
        if(!pid) { window.customAlert('Peringatan', 'Target tujuan wajib diisi!', 'warning'); return; }
        
        let inpType = currentCheckoutBrand.items[0]?.inputType || 'id_zone';
        if(inpType === 'id_only') playerInfo = `ID: ${pid}`;
        else if(inpType === 'custom') playerInfo = `Info: ${pid}`;
        else playerInfo = `ID: ${pid} ${zol ? '| Zone: '+zol : ''}`;
    } else {
        playerInfo = `Akun Premium`;
    }

    let rawTotal = selectedProductForBuy.priceNum;
    let discountApplied = 0;
    let promoUsedCode = '';
    
    if(appliedPromo) {
        discountApplied = appliedPromo.amount;
        promoUsedCode = appliedPromo.code;
    }
    
    let baseTotal = rawTotal - discountApplied;
    if(baseTotal < 0) baseTotal = 0;

    let uniqueCode = Math.floor(Math.random() * 300) + 1;
    let finalTotal = baseTotal + uniqueCode;
    const invId = 'VP-' + Math.floor(100000 + Math.random() * 900000);

    const singleItem = { 
        cartId: Date.now().toString(), 
        productDbId: selectedProductForBuy.dbId, 
        name: `${currentCheckoutBrand.brandName} - ${selectedProductForBuy.name}`, 
        priceNum: selectedProductForBuy.priceNum, 
        type: currentCheckoutBrand.type, 
        playerInfo: playerInfo 
    };

    const newOrder = {
        id: invId,
        userEmail: currentUser.isAnonymous ? null : currentUser.email,
        items: [singleItem],
        customerWa: wa,
        finalTotal: finalTotal,
        baseTotal: baseTotal,
        uniqueCode: uniqueCode,
        promoCode: promoUsedCode,
        promoDiscount: discountApplied,
        status: 'UNPAID', 
        adminReply: '',
        date: new Date().toISOString()
    };

    try {
        const docRef = await addDoc(collection(db, pathOrders), newOrder);
        currentCheckoutSession = { dbId: docRef.id, id: invId, finalTotal: finalTotal };

        if(appliedPromo) {
            const promoRef = doc(db, pathPromos, appliedPromo.dbId);
            await updateDoc(promoRef, { usedCount: increment(1) }).catch(e=>console.log(e));
        }
        
        window.openQRISModal();
        window.closeModal('modal-buy-direct');
    } catch (e) {
        window.customAlert("Error", "Gagal menghubungkan pesanan ke server, coba lagi.", "error");
    }
};

window.openQRISModal = function() {
    const qrImgDisplay = document.getElementById('qris-image-display');
    const qrErrorMsg = document.getElementById('qris-error-msg');
    
    if(siteSettings.qrisImageBase64) {
        qrImgDisplay.src = siteSettings.qrisImageBase64;
        qrImgDisplay.style.display = 'block';
        qrErrorMsg.style.display = 'none';
    } else {
        qrImgDisplay.style.display = 'none';
        qrErrorMsg.style.display = 'block';
    }

    document.getElementById('pay-total-display').innerText = `Rp${currentCheckoutSession.finalTotal.toLocaleString('id-ID')}`;
    
    const btnPay = document.getElementById('btn-final-pay');
    btnPay.innerText = 'Saya Sudah Bayar';
    btnPay.disabled = false;
    
    window.openModal('modal-payment');
}

window.resumePayment = function(dbId) {
    const order = orders.find(o => o.dbId === dbId);
    if(!order) return;
    currentCheckoutSession = { dbId: order.dbId, id: order.id, finalTotal: order.finalTotal };
    window.openQRISModal();
}

window.downloadQRIS = function() {
    const qrImg = document.getElementById('qris-image-display');
    if (qrImg && qrImg.src && qrImg.style.display !== 'none') {
        const link = document.createElement('a'); 
        link.download = `QRIS-Vipercell.png`; 
        link.href = qrImg.src; 
        link.click();
    } else {
        window.customAlert("Gagal", "Tidak ada gambar QRIS valid untuk diunduh.", "error");
    }
};

window.finalizeCartOrder = async function() {
    if(!currentCheckoutSession) return;
    
    const btnPay = document.getElementById('btn-final-pay');
    btnPay.innerText = 'Memproses...'; btnPay.disabled = true;

    try {
        await updateDoc(doc(db, pathOrders, currentCheckoutSession.dbId), { status: 'PENDING' });

        const el = document.createElement('textarea');
        el.value = currentCheckoutSession.id; el.setAttribute('readonly', ''); el.style.position = 'absolute'; el.style.left = '-9999px';
        document.body.appendChild(el); el.select(); try { document.execCommand('copy'); } catch(e){} document.body.removeChild(el);

        let adminWaNum = siteSettings.adminWa || '085656321860';
        if (adminWaNum.startsWith('0')) adminWaNum = '62' + adminWaNum.substring(1);
        const waText = `Halo Admin Vipercell, saya sudah transfer!\n\n*Invoice ID:* ${currentCheckoutSession.id}\n*Total Transfer (Tepat):* Rp${currentCheckoutSession.finalTotal.toLocaleString('id-ID')}\n\nMohon dicek mutasinya ya Min.`;
        const waUrl = `https://wa.me/${adminWaNum}?text=${encodeURIComponent(waText)}`;

        window.closeModal('modal-payment');
        
        const successMsg = `Pembayaran sedang diproses! ID Anda: <strong>${currentCheckoutSession.id}</strong> (Disalin).<br><br>Sistem mengalihkan Anda ke WhatsApp Admin. <b>JIKA</b> tidak dialihkan otomatis, tekan tombol di bawah ini.`;
        
        document.getElementById('ca-extra-action').innerHTML = `<a href="${waUrl}" target="_blank" class="btn btn-primary" style="display:inline-block; width:100%; margin-top:10px;"><i class="fa-brands fa-whatsapp"></i> Buka WA Manual</a>`;
        window.customAlert('Berhasil', successMsg, 'success');

        setTimeout(() => {
            window.open(waUrl, '_blank');
            currentCheckoutSession = null;
            if(!currentUser.isAnonymous) window.switchMainTab('pesanan');
        }, 1500);

    } catch (error) {
        window.customAlert('Error', 'Gagal memproses sistem pesananmu, coba lagi.', 'error');
        btnPay.innerText = 'Saya Sudah Bayar'; btnPay.disabled = false;
    }
};

function generateHelpButtons(invId, orderStatus) {
    if(orderStatus !== 'SUCCESS') return '';

    let adminWaNum = siteSettings.adminWa || '085656321860';
    if (adminWaNum.startsWith('0')) adminWaNum = '62' + adminWaNum.substring(1);

    const msgAccount = encodeURIComponent(`Halo Admin Vipercell, saya butuh bantuan untuk pesanan ID: ${invId}.\n\n*Masalah*: Akun bermasalah / gagal login.\nMohon bantuannya.`);
    const msgItem = encodeURIComponent(`Halo Admin Vipercell, saya butuh bantuan untuk pesanan ID: ${invId}.\n\n*Masalah*: Item / Top Up belum masuk padahal status sudah sukses.\nMohon bantuannya.`);

    return `
    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #334155;">
        <p style="font-size: 0.8rem; color:var(--text-muted); margin-bottom: 8px;">Pusat Komplain & Bantuan:</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="https://wa.me/${adminWaNum}?text=${msgAccount}" target="_blank" class="btn btn-outline" style="flex:1; font-size:0.75rem; padding: 0.5rem; color:var(--warning); border-color:var(--warning);">
                <i class="fa-brands fa-whatsapp"></i> Akun Bermasalah
            </a>
            <a href="https://wa.me/${adminWaNum}?text=${msgItem}" target="_blank" class="btn btn-outline" style="flex:1; font-size:0.75rem; padding: 0.5rem; color:var(--primary-light); border-color:var(--primary-light);">
                <i class="fa-brands fa-whatsapp"></i> Item Belum Masuk
            </a>
        </div>
    </div>`;
}

window.trackOrder = function() {
    const invId = document.getElementById('track-id').value.trim().toUpperCase();
    if(!invId) return;

    const order = orders.find(o => o.id === invId);
    const resBox = document.getElementById('track-result');
    
    if(!order) { 
        resBox.style.display = 'block'; 
        resBox.innerHTML = `<p style="color:var(--danger); background:var(--surface); padding:1rem; border-radius:8px; border:1px solid var(--border);"><i class="fa-solid fa-xmark"></i> Pesanan tidak ditemukan.</p>`; 
        return; 
    }

    const sBadge = order.status === 'UNPAID' ? 'status-unpaid' : order.status === 'PENDING' ? 'status-pending' : order.status === 'FAILED' ? 'status-failed' : 'status-success';
    const sName = order.status === 'UNPAID' ? 'Belum Dibayar' : order.status === 'PENDING' ? 'Menunggu Proses' : order.status === 'FAILED' ? 'Gagal/Batal' : 'Sukses & Selesai';
    
    let actionHtml = '';
    if (order.status === 'UNPAID') {
        actionHtml = `<button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="window.resumePayment('${order.dbId}')">Lanjut Selesaikan Pembayaran</button>`;
    }

    let replyHtml = (order.status === 'SUCCESS' && order.adminReply) ? `
    <div style="background: rgba(37,99,235,0.1); border: 1px dashed var(--primary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <p style="margin-bottom:0.5rem; color:var(--primary-light); font-weight:bold;">Informasi Akun / Balasan Admin:</p>
        <p style="font-family:monospace; color:var(--text); white-space:pre-wrap;">${order.adminReply}</p>
    </div>` : '';

    const helpHtml = generateHelpButtons(order.id, order.status);

    resBox.style.display = 'block';
    resBox.innerHTML = `
    <div class="receipt-card receipt-anim" style="margin-top:0;">
        <div class="receipt-header">
            <div>
                <div style="color:var(--text-muted); font-size: 0.75rem;">INVOICE</div>
                <div style="color:var(--primary-light); font-weight: 800; font-size: 1.1rem; letter-spacing: 1px;">${order.id}</div>
            </div>
            <span class="status-badge ${sBadge}">${sName}</span>
        </div>
        <div class="receipt-body">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">
                <i class="fa-regular fa-clock"></i> ${new Date(order.date).toLocaleString('id-ID')}
            </div>
            <div style="border-left: 2px solid var(--primary); padding-left: 10px; margin-bottom: 15px;">
                ${order.items.map(i => `
                    <div style="font-weight: 600; color: var(--text);">${i.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${i.playerInfo}</div>
                `).join('')}
            </div>
            ${replyHtml}
        </div>
        <div class="receipt-footer">
            <div class="receipt-row">
                <span style="color:var(--text-muted);">Harga Normal</span>
                <span>Rp${(order.baseTotal + order.promoDiscount).toLocaleString('id-ID')}</span>
            </div>
            ${order.promoDiscount > 0 ? `
            <div class="receipt-row">
                <span style="color:var(--success);">Promo (${order.promoCode})</span>
                <span style="color:var(--success);">-Rp${order.promoDiscount.toLocaleString('id-ID')}</span>
            </div>` : ''}
            <div class="receipt-row">
                <span style="color:var(--warning);">Kode Unik</span>
                <span style="color:var(--warning);">+Rp${order.uniqueCode || 0}</span>
            </div>
            <div class="receipt-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #334155;">
                <strong style="font-size: 1.1rem; color: var(--text);">Total Bayar</strong>
                <strong style="font-size: 1.1rem; color: var(--primary-light);">Rp${order.finalTotal.toLocaleString('id-ID')}</strong>
            </div>
            ${actionHtml}
            ${helpHtml}
        </div>
    </div>`;
};

window.renderUserOrders = function() {
    const grid = document.getElementById('user-order-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    if(!currentUser || currentUser.isAnonymous) return;
    const userOrders = orders.filter(o => o.userEmail === currentUser.email);
    
    if(userOrders.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding: 2rem; color:var(--text-muted);">Belum ada riwayat pesanan.</div>'; return;
    }

    userOrders.forEach((o, index) => {
        const sBadge = o.status === 'UNPAID' ? 'status-unpaid' : o.status === 'PENDING' ? 'status-pending' : o.status === 'FAILED' ? 'status-failed' : 'status-success';
        const sName = o.status === 'UNPAID' ? 'Belum Dibayar' : o.status === 'PENDING' ? 'Proses Antrian' : o.status === 'FAILED' ? 'Dibatalkan' : 'Selesai';
        
        let replyHtml = (o.status === 'SUCCESS' && o.adminReply) ? `
            <div style="background: rgba(37,99,235,0.1); border: 1px dashed var(--primary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin-bottom:0.5rem; color:var(--primary-light); font-weight:bold;">Informasi Akun (Admin):</p>
                <p style="font-family:monospace; color:var(--text); white-space:pre-wrap;">${o.adminReply}</p>
            </div>` : '';

        let actionHtml = (o.status === 'UNPAID') 
            ? `<button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="window.resumePayment('${o.dbId}')">Lanjut Selesaikan Pembayaran</button>` 
            : '';

        const helpHtml = generateHelpButtons(o.id, o.status);

        const animDelay = (index * 0.1) + 's';

        grid.innerHTML += `
            <div class="receipt-card receipt-anim" style="animation-delay: ${animDelay}; width: 100%;">
                <div class="receipt-header">
                    <div>
                        <div style="color:var(--text-muted); font-size: 0.75rem;">INVOICE</div>
                        <div style="color:var(--primary-light); font-weight: 800; font-size: 1.1rem; letter-spacing: 1px;">${o.id}</div>
                    </div>
                    <span class="status-badge ${sBadge}">${sName}</span>
                </div>
                <div class="receipt-body">
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">
                        <i class="fa-regular fa-clock"></i> ${new Date(o.date).toLocaleString('id-ID')}
                    </div>
                    <div style="border-left: 2px solid var(--primary); padding-left: 10px; margin-bottom: 15px;">
                        ${o.items.map(i => `
                            <div style="font-weight: 600; color: var(--text);">${i.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${i.playerInfo}</div>
                        `).join('')}
                    </div>
                    ${replyHtml}
                </div>
                <div class="receipt-footer">
                    <div class="receipt-row">
                        <span style="color:var(--text-muted);">Harga Normal</span>
                        <span>Rp${(o.baseTotal + o.promoDiscount).toLocaleString('id-ID')}</span>
                    </div>
                    ${o.promoDiscount > 0 ? `
                    <div class="receipt-row">
                        <span style="color:var(--success);">Promo (${o.promoCode})</span>
                        <span style="color:var(--success);">-Rp${o.promoDiscount.toLocaleString('id-ID')}</span>
                    </div>` : ''}
                    <div class="receipt-row">
                        <span style="color:var(--warning);">Kode Unik</span>
                        <span style="color:var(--warning);">+Rp${o.uniqueCode || 0}</span>
                    </div>
                    <div class="receipt-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #334155;">
                        <strong style="font-size: 1.1rem; color: var(--text);">Total Bayar</strong>
                        <strong style="font-size: 1.1rem; color: var(--primary-light);">Rp${o.finalTotal.toLocaleString('id-ID')}</strong>
                    </div>
                    ${actionHtml}
                    ${helpHtml}
                </div>
            </div>`;
    });
    setTimeout(observeReveals, 100);
};

window.toggleAdminDashboard = (show) => {
    if(show && !isAdminLoggedIn) { window.customAlert("Ditolak", "Anda bukan Admin.", "error"); return; }
    document.getElementById('store-view').style.display = show ? 'none' : 'block';
    document.getElementById('admin-dashboard').style.display = show ? 'block' : 'none';
    if(show) { 
        window.populateAdminSettings(); 
        window.renderAdminOrders(); 
        window.renderAdminProducts(); 
        window.renderAdminTutorials(); 
        window.renderAdminPromos(); 
        window.renderAdminChatList();
        window.renderAdminStocks();
    }
    if(!show) { observeReveals(); window.scrollTo({ top: 0, behavior: 'instant' }); } 
};

window.switchAdminTab = function(tabId, btnEl) {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    btnEl.classList.add('active'); document.getElementById(tabId).style.display = 'block';
};

window.renderAdminStocks = function() {
    const sel = document.getElementById('stock-brand-select');
    const tb = document.getElementById('admin-stock-list');
    if(!sel || !tb) return;

    const appBrands = groupedBrands.filter(b => b.type === 'app');
    const curVal = sel.value;
    sel.innerHTML = '<option value="">-- Pilih Produk/Aplikasi --</option>';
    appBrands.forEach(b => {
        sel.innerHTML += `<option value="${b.brandName}">${b.brandName}</option>`;
    });
    sel.value = curVal; 

    tb.innerHTML = '';
    if(stocks.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Stok kosong</td></tr>';
        return;
    }

    let sortedStocks = [...stocks].sort((a,b) => b.createdAt - a.createdAt);
    sortedStocks.forEach((s, i) => {
        const parts = s.data.split('|');
        const em = parts[0] || '-';
        const pw = parts[1] ? 'P****' : '-'; 
        const dur = parts[2] || '-';
        const badge = s.status === 'Ready' ? '<span class="status-badge status-success">Ready</span>' : '<span class="status-badge status-failed">Terjual</span>';
        
        tb.innerHTML += `<tr>
            <td>${i+1}</td>
            <td><strong>${s.brand}</strong><br><small style="color:var(--text-muted)">${em}</small></td>
            <td>${pw}</td>
            <td>${dur}</td>
            <td>${badge}</td>
            <td><button class="btn btn-outline" style="color:var(--danger); padding:4px;" onclick="window.deleteStock('${s.dbId}')"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
}

window.addStockMassal = async function() {
    const brand = document.getElementById('stock-brand-select').value;
    const rawData = document.getElementById('stock-bulk-input').value.trim();
    if(!brand || !rawData) {
        window.customAlert('Error', 'Pilih produk dan masukkan data.', 'error');
        return;
    }
    const lines = rawData.split('\n').filter(l => l.trim() !== '');
    let count = 0;
    for(const line of lines) {
        const parts = line.split('|');
        if(parts.length >= 2) {
            await addDoc(collection(db, pathStocks), {
                brand: brand,
                data: line.trim(),
                status: 'Ready',
                createdAt: Date.now()
            });
            count++;
        }
    }
    document.getElementById('stock-bulk-input').value = '';
    window.customAlert('Sukses', `${count} Akun berhasil ditambahkan ke stok.`, 'success');
}

window.deleteStock = async function(dbId) {
    window.openCustomPrompt('Hapus Stok', 'Ketik <b>YAKIN</b> untuk menghapus stok akun ini.', async (val) => {
        if(val === 'YAKIN') {
            await deleteDoc(doc(db, pathStocks, dbId));
            window.customAlert('Dihapus', 'Stok akun dihapus.', 'info');
        }
    });
}

window.renderAdminOrders = function() {
    const tbody = document.getElementById('admin-order-list');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const searchInput = document.getElementById('admin-search-order');
    let queryText = '';
    if(searchInput) queryText = searchInput.value.trim().toUpperCase();

    let filteredOrders = orders;
    if (queryText !== '') {
        filteredOrders = orders.filter(o => o.id.includes(queryText));
    }

    if(filteredOrders.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">${queryText ? 'Tidak ada invoice yang cocok' : 'Kosong'}</td></tr>`; 
        return; 
    }

    filteredOrders.forEach(o => {
        const sBadge = o.status === 'UNPAID' ? `<span class="status-badge status-unpaid">UNPAID</span>` : o.status === 'PENDING' ? `<span class="status-badge status-pending">PENDING</span>` : o.status === 'FAILED' ? `<span class="status-badge status-failed">FAILED</span>` : `<span class="status-badge status-success">SUCCESS</span>`;

        let itemsDesc = o.items.map(i => `${i.name} <br><span style="color:var(--text-muted);font-size:0.75rem">${i.playerInfo}</span>`).join('<br>');
        let promoDesc = o.promoCode ? `<br><small style="color:var(--success);">Promo: ${o.promoCode} (-Rp${o.promoDiscount})</small>` : '';
        
        let actionBtn = (o.status === 'PENDING')
            ? `<button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="window.promptProcessOrder('${o.dbId}')">Proses</button>` 
            : `<span style="font-size:0.75rem;color:var(--text-muted)">Ditinjau</span>`;
        
        let deleteBtn = `<button class="btn btn-outline" style="padding:0.4rem; color:var(--danger); border-color:transparent;" title="Hapus Permanen" onclick="window.promptDeleteOrder('${o.dbId}', '${o.id}')"><i class="fa-solid fa-trash"></i></button>`;

        tbody.innerHTML += `<tr>
            <td><strong>${o.id}</strong></td>
            <td><small style="color:var(--text-muted)">${new Date(o.date).toLocaleDateString()}</small><br>${itemsDesc}${promoDesc}</td>
            <td>${o.customerWa}</td>
            <td>Rp${o.finalTotal.toLocaleString('id-ID')}</td>
            <td>${sBadge}</td>
            <td style="white-space:nowrap;">${actionBtn} ${deleteBtn}</td>
        </tr>`;
    });
};

window.promptProcessOrder = function(dbId) {
    const order = orders.find(o => o.dbId === dbId);
    if(!order) return;
    document.getElementById('proc-inv').innerText = order.id;
    document.getElementById('proc-order-id').value = dbId;
    document.getElementById('proc-reply').value = '';
    
    const list = document.getElementById('proc-items-list');
    list.innerHTML = '<strong>Detail Item:</strong><ul style="margin-left:20px; font-size:0.85rem; color:var(--text);">' + order.items.map(i => `<li>${i.name} <br><small style="color:var(--text-muted);">${i.playerInfo}</small></li>`).join('') + '</ul>';
    
    const hasApp = order.items.some(i => i.type === 'app');
    const stockSec = document.getElementById('proc-stock-section');
    const stockSel = document.getElementById('proc-stock-select');

    if(hasApp) {
        stockSec.style.display = 'block';
        stockSel.innerHTML = '<option value="">-- Pilih Stok dari Database --</option>';
        const appItem = order.items.find(i => i.type === 'app');
        const cleanBrandName = appItem.name.split(' - ')[0]; 
        
        const readyStocks = stocks.filter(s => s.brand === cleanBrandName && s.status === 'Ready');
        if(readyStocks.length === 0) {
            stockSel.innerHTML += '<option value="" disabled>Stok Habis / Kosong!</option>';
        } else {
            readyStocks.forEach((s, index) => {
                const em = s.data.split('|')[0];
                stockSel.innerHTML += `<option value="${s.dbId}" ${index === 0 ? 'selected' : ''}>${em} | [Ready]</option>`;
            });
        }
        
        stockSel.onchange = function() {
            const sId = this.value;
            if(!sId) return;
            const sData = stocks.find(x => x.dbId === sId);
            if(sData) {
                const parts = sData.data.split('|');
                document.getElementById('proc-reply').value = `Detail Akun Premium Anda:\nEmail/NoHP: ${parts[0] || '-'}\nPassword: ${parts[1] || '-'}\nDurasi/Ket: ${parts[2] || '-'}`;
            }
        };
        if (readyStocks.length > 0) stockSel.onchange();

    } else {
        stockSec.style.display = 'none';
    }

    window.openModal('modal-process-order');
};

window.markOrderComplete = async function(statusType) {
    if(!currentUser) return;
    const dbId = document.getElementById('proc-order-id').value;
    const reply = document.getElementById('proc-reply').value;
    const order = orders.find(o => o.dbId === dbId);
    
    if(statusType === 'SUCCESS' && order.items.some(i => i.type === 'app')) {
        const stockSel = document.getElementById('proc-stock-select');
        if(stockSel && stockSel.value) {
            await updateDoc(doc(db, pathStocks, stockSel.value), { status: 'Used', usedAt: Date.now(), orderId: order.id });
        }
    }

    await updateDoc(doc(db, pathOrders, dbId), { status: statusType, adminReply: reply });
    window.closeModal('modal-process-order');
    if(statusType === 'SUCCESS') window.customAlert('Sukses', 'Pesanan selesai disetujui.', 'success');
    else window.customAlert('Dibatalkan', 'Pesanan digagalkan.', 'info');
};

window.promptDeleteOrder = function(dbId, invoiceId) {
    if(!currentUser) return;
    window.openCustomPrompt("Hapus Permanen", `Ketik <b>HAPUS</b> untuk menghapus riwayat Invoice ${invoiceId} selamanya.`, async (inputVal) => {
        if(inputVal === "HAPUS") {
            await deleteDoc(doc(db, pathOrders, dbId));
            window.customAlert("Terhapus", `Invoice ${invoiceId} berhasil dihapus dari sistem.`, "success");
        } else {
            window.customAlert("Gagal", "Kata pengaman salah. Penghapusan dibatalkan.", "error");
        }
    });
};

window.renderAdminProducts = function() {
    const tbody = document.getElementById('admin-prod-list');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(groupedBrands.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Kosong</td></tr>`; return; }

    groupedBrands.forEach(b => {
        const imgHtml = b.imgUrlBase64 
            ? `<img src="${b.imgUrlBase64}" style="width:35px; height:35px; object-fit:cover; border-radius:4px;">` 
            : `<div style="width:35px; height:35px; background:var(--primary); color:white; display:flex; justify-content:center; align-items:center; border-radius:4px; font-weight:bold;">${b.brandName.charAt(0)}</div>`;

        const itemsCount = b.items.length;
        const isSoldOut = b.items.every(i => i.soldOut);

        tbody.innerHTML += `<tr>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    ${imgHtml}
                    <div>
                        <strong>${b.brandName}</strong><br>
                        <small style="color:var(--text-muted)">${itemsCount} Varian Nominal</small>
                    </div>
                </div>
            </td>
            <td>${b.type === 'app' ? 'Aplikasi' : 'Game'}</td>
            <td>-</td>
            <td>${isSoldOut ? '<span class="status-badge status-failed" style="font-size:0.75rem;">Habis</span>' : '<span class="status-badge status-success" style="font-size:0.75rem;">Ada</span>'}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-outline" style="padding:0.4rem; font-size:0.75rem; margin-right:4px;" onclick="window.openProductGroupModal('${b.brandName}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger" style="padding:0.4rem; font-size:0.75rem;" onclick="window.deleteProductGroup('${b.brandName}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    });
};

window.toggleInputTypeBox = function() {
    const type = document.getElementById('manage-prod-type').value;
    const inputGroup = document.getElementById('group-tipe-input');
    if(type === 'game') {
        inputGroup.style.display = 'block';
    } else {
        inputGroup.style.display = 'none';
    }
};

window.selectInputType = function(val, el) {
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    el.querySelector('input').checked = true;
    
    const previewBox = document.getElementById('type-preview-box');
    if(val === 'id_only') previewBox.innerText = 'Contoh: 123456789 (9 digit Player ID)';
    else if(val === 'id_zone') previewBox.innerText = 'Player ID: 12345678 -> Zone ID: (1234)';
    else if(val === 'custom') previewBox.innerText = 'Contoh: Server Asia, Nama Karakter Viper';
};

window.openProductGroupModal = function(brandName = null) {
    currentGroupNominals = [];
    
    if(brandName) {
        const group = groupedBrands.find(b => b.brandName === brandName);
        if(group) {
            document.getElementById('modal-prod-title').innerText = 'Edit Grup Item';
            document.getElementById('manage-prod-old-brand').value = brandName;
            document.getElementById('manage-prod-type').value = group.type;
            document.getElementById('manage-prod-brand').value = group.brandName;
            document.getElementById('manage-prod-img-base64').value = group.imgUrlBase64 || '';
            document.getElementById('manage-prod-file-name').innerText = group.imgUrlBase64 ? 'Gambar tersimpan' : 'Tidak ada file dipilih';
            
            currentGroupNominals = group.items.map(i => ({ dbId: i.dbId, name: i.name, priceNum: i.priceNum, soldOut: i.soldOut || false }));
            
            const allSoldOut = currentGroupNominals.length > 0 && currentGroupNominals.every(n => n.soldOut);
            document.getElementById('manage-prod-soldout').checked = allSoldOut;

            let inpType = group.items[0]?.inputType || 'id_zone';
            const targetEl = document.querySelector(`.type-card input[value="${inpType}"]`);
            if(targetEl) window.selectInputType(inpType, targetEl.parentElement);
        }
    } else {
        document.getElementById('modal-prod-title').innerText = 'Tambah item';
        document.getElementById('manage-prod-old-brand').value = '';
        document.getElementById('manage-prod-type').value = 'game';
        document.getElementById('manage-prod-brand').value = '';
        document.getElementById('manage-prod-img-base64').value = '';
        document.getElementById('manage-prod-file-name').innerText = 'Tidak ada file dipilih';
        document.getElementById('manage-prod-soldout').checked = false;
        
        const defaultEl = document.querySelector(`.type-card input[value="id_zone"]`);
        if(defaultEl) window.selectInputType('id_zone', defaultEl.parentElement);
    }
    
    window.toggleInputTypeBox();
    document.getElementById('temp-nom-name').value = '';
    document.getElementById('temp-nom-price').value = '';
    
    window.renderTempNominals();
    window.openModal('modal-manage-product');
};

window.clearTempNominalInput = function() {
    document.getElementById('temp-nom-name').value = '';
    document.getElementById('temp-nom-price').value = '';
};

window.addTempNominal = function() {
    const name = document.getElementById('temp-nom-name').value.trim();
    const priceNum = parseInt(document.getElementById('temp-nom-price').value) || 0;
    if(!name || priceNum <= 0) {
        window.customAlert('Error', 'Nama Item dan Harga nominal wajib diisi dan valid.', 'error');
        return;
    }
    currentGroupNominals.push({ dbId: null, name, priceNum, soldOut: false });
    window.clearTempNominalInput();
    
    document.getElementById('manage-prod-soldout').checked = false; 
    window.renderTempNominals();
};

window.removeTempNominal = function(index) {
    currentGroupNominals.splice(index, 1);
    window.renderTempNominals();
};

window.toggleIndividualSoldOut = function(index, isChecked) {
    currentGroupNominals[index].soldOut = isChecked;
    const allSoldOut = currentGroupNominals.length > 0 && currentGroupNominals.every(n => n.soldOut);
    document.getElementById('manage-prod-soldout').checked = allSoldOut;
};

window.toggleAllSoldOut = function(isChecked) {
    currentGroupNominals.forEach(n => n.soldOut = isChecked);
    window.renderTempNominals();
};

window.renderTempNominals = function() {
    const container = document.getElementById('manage-prod-nominals-list');
    container.innerHTML = '';
    if(currentGroupNominals.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#64748b; font-size:0.8rem; padding: 10px;">Belum ada nominal ditambahkan.</div>`;
        return;
    }
    
    const groupImg = document.getElementById('manage-prod-img-base64').value;
    const fallbackImg = `<div style="width:30px; height:30px; background:var(--primary); color:white; display:flex; justify-content:center; align-items:center; border-radius:6px; font-weight:bold; font-size:14px;">V</div>`;
    const finalImg = groupImg ? `<img src="${groupImg}" style="width:30px; height:30px; border-radius:6px; object-fit:cover;">` : fallbackImg;

    currentGroupNominals.forEach((nom, index) => {
        const isSold = nom.soldOut ? 'checked' : '';
        container.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: transparent; padding: 10px 0; border-bottom: 1px solid #1e293b;">
            <div style="display:flex; align-items:center; gap:10px;">
                ${finalImg}
                <div>
                    <div style="font-size: 0.85rem; font-weight: bold; color: white;">${nom.name}</div>
                    <div style="font-size: 0.75rem; color: #94a3b8;">Rp${nom.priceNum.toLocaleString('id-ID')}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <input type="checkbox" style="width:18px; height:18px; cursor:pointer; accent-color: var(--danger);" title="Tandai Habis Individual" onchange="window.toggleIndividualSoldOut(${index}, this.checked)" ${isSold}>
                <button class="btn btn-outline" style="border: none; color: #ef4444; padding: 5px; font-size:1rem;" onclick="window.removeTempNominal(${index})" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });
};

document.getElementById('manage-prod-img-file').addEventListener('change', function(e) {
    if (e.target.files[0]) {
        document.getElementById('manage-prod-file-name').innerText = e.target.files[0].name;
        window.resizeImageBase64(e.target.files[0], (b64) => {
            document.getElementById('manage-prod-img-base64').value = b64;
            window.renderTempNominals(); 
        }, 800, 800);
    }
});

window.saveProductGroup = async function() {
    if(!currentUser) return;
    const type = document.getElementById('manage-prod-type').value;
    const brand = document.getElementById('manage-prod-brand').value.trim();
    const imgBase64 = document.getElementById('manage-prod-img-base64').value;
    const oldBrand = document.getElementById('manage-prod-old-brand').value;
    
    let inputType = 'id_zone';
    const checkedType = document.querySelector('input[name="manage_input_type"]:checked');
    if(checkedType) inputType = checkedType.value;

    if(!brand) { window.customAlert('Error', 'Nama Brand wajib diisi.', 'error'); return; }
    if(currentGroupNominals.length === 0) { window.customAlert('Error', 'Tambahkan minimal 1 nominal ke dalam grup ini.', 'error'); return; }

    const oldGroup = groupedBrands.find(b => b.brandName === oldBrand);
    const oldDbIds = oldGroup ? oldGroup.items.map(i => i.dbId) : [];
    const newDbIds = currentGroupNominals.map(n => n.dbId).filter(id => id);
    
    const toDelete = oldDbIds.filter(id => !newDbIds.includes(id));
    for(const id of toDelete) {
        await deleteDoc(doc(db, pathProducts, id));
    }

    for(const nom of currentGroupNominals) {
        const prodData = {
            type: type,
            brand: brand,
            name: nom.name,
            priceNum: nom.priceNum,
            imgUrlBase64: imgBase64,
            desc: '', 
            soldOut: nom.soldOut,
            inputType: type === 'game' ? inputType : null
        };

        if(nom.dbId) {
            await updateDoc(doc(db, pathProducts, nom.dbId), prodData);
        } else {
            await addDoc(collection(db, pathProducts), prodData);
        }
    }

    window.closeModal('modal-manage-product');
    window.customAlert('Sukses', `Seluruh item grup ${brand} tersimpan.`, 'success');
};

window.deleteProductGroup = function(brandName) {
    if(!currentUser) return;
    window.openCustomPrompt("Hapus Grup", `Ketik <b>YAKIN</b> untuk menghapus seluruh item ${brandName}.`, async (val) => {
        if(val === 'YAKIN') {
            const group = groupedBrands.find(b => b.brandName === brandName);
            if(group) {
                for(const item of group.items) {
                    await deleteDoc(doc(db, pathProducts, item.dbId));
                }
                window.customAlert('Sukses', `Semua Item ${brandName} telah dihapus.`, 'info');
            }
        }
    });
};

window.renderAdminPromos = function() {
    const tbody = document.getElementById('admin-promo-list');
    if(!tbody) return;
    tbody.innerHTML = '';
    promos.forEach(p => {
        tbody.innerHTML += `<tr>
            <td><strong>${p.code}</strong></td>
            <td>Rp${p.amount.toLocaleString('id-ID')}</td>
            <td>${p.usedCount} / ${p.maxUses}</td>
            <td>${p.active ? '<span class="status-badge status-success">Aktif</span>' : '<span class="status-badge status-failed">Mati</span>'}</td>
            <td style="white-space:nowrap;">
                <button class="btn btn-outline" style="padding:0.4rem; font-size:0.75rem; margin-right:4px;" onclick="window.openPromoModal('${p.dbId}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger" style="padding:0.4rem; font-size:0.75rem;" onclick="window.deletePromo('${p.dbId}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    });
};

window.openPromoModal = function(dbId = null) {
    if(dbId) {
        const p = promos.find(x => x.dbId === dbId);
        document.getElementById('modal-promo-title').innerText = 'Edit Promo';
        document.getElementById('manage-promo-id').value = p.dbId;
        document.getElementById('manage-promo-code').value = p.code;
        document.getElementById('manage-promo-amount').value = p.amount;
        document.getElementById('manage-promo-max').value = p.maxUses;
        document.getElementById('manage-promo-active').checked = p.active;
    } else {
        document.getElementById('modal-promo-title').innerText = 'Buat Promo Baru';
        document.getElementById('manage-promo-id').value = '';
        document.getElementById('manage-promo-code').value = '';
        document.getElementById('manage-promo-amount').value = '';
        document.getElementById('manage-promo-max').value = '';
        document.getElementById('manage-promo-active').checked = true;
    }
    window.openModal('modal-manage-promo');
};

window.savePromo = async function() {
    if(!currentUser) return;
    const dbId = document.getElementById('manage-promo-id').value;
    const data = {
        code: document.getElementById('manage-promo-code').value.trim().toUpperCase(),
        amount: parseInt(document.getElementById('manage-promo-amount').value) || 0,
        maxUses: parseInt(document.getElementById('manage-promo-max').value) || 0,
        active: document.getElementById('manage-promo-active').checked,
        usedCount: 0 
    };
    if(!data.code || data.amount <= 0 || data.maxUses <= 0) { window.customAlert('Error', 'Data promo tidak valid.', 'error'); return; }
    
    if(dbId) {
        delete data.usedCount; 
        await updateDoc(doc(db, pathPromos, dbId), data);
    } else {
        await addDoc(collection(db, pathPromos), data);
    }
    window.closeModal('modal-manage-promo'); window.customAlert('Sukses', 'Promo disimpan.', 'success');
};

window.deletePromo = function(dbId) {
    if(!currentUser) return;
    window.openCustomPrompt("Hapus", "Ketik <b>YAKIN</b> untuk menghapus Promo ini.", async (val) => {
        if(val === 'YAKIN') {
            await deleteDoc(doc(db, pathPromos, dbId));
            window.customAlert('Sukses', 'Promo Dihapus.', 'success');
        }
    });
};

window.onload = initApp;