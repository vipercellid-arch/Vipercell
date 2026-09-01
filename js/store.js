import { 
    db, auth,
    signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, onAuthStateChanged,
    signOut, setPersistence, browserLocalPersistence,
    doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, collection, addDoc, increment, arrayUnion, query, where, getDocs 
} from './firebase.js';

// ==========================================
// UTILITAS GAMBAR (WEBP AUTO COMPRESSION)
// ==========================================
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
            callback(canvas.toDataURL('image/webp', 0.7)); 
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'vipercell-prod';
const isWorkspace = typeof __app_id !== 'undefined';
const pathProducts = isWorkspace ? `artifacts/${appId}/public/data/products` : 'products';
const pathOrders = isWorkspace ? `artifacts/${appId}/public/data/orders` : 'orders';
const pathSettings = isWorkspace ? `artifacts/${appId}/public/data/settings` : 'settings';
const pathUsers = isWorkspace ? `artifacts/${appId}/public/data/users` : 'users';
const pathPromos = isWorkspace ? `artifacts/${appId}/public/data/promos` : 'promos';
const pathChats = isWorkspace ? `artifacts/${appId}/public/data/chats` : 'chats';
const pathStocks = isWorkspace ? `artifacts/${appId}/public/data/stocks` : 'stocks';

// ==========================================
// STATE & VARIABEL GLOBAL
// ==========================================
let products = [];
let groupedBrands = []; 
let orders = [];
let promos = [];
let stocks = [];
let allUsers = []; 

let siteSettings = { 
    logoText: 'VIPER', logoAccent: 'CELL', logoImgBase64: '', marquee: 'Selamat Datang di Vipercell',
    qrisImageBase64: '', adminWa: '085656321860', igLink: '', ttLink: '',
    newsList: [], banners: [], isStoreOpen: true, waChannelLink: '', botQrisActive: false,
    membership: { price: 50000, disc: 5 } // V16.2: Single VIP Package
};

let userProfile = { name: '', phone: '', tier: 'bronze', tierExp: 0 };
let isAdminLoggedIn = false;
let currentUser = null;
let currentCheckoutBrand = null;
let selectedProductForBuy = null;
let appliedPromo = null; 

let currentCheckoutSession = null; 
let currentGroupNominals = [];
let allLiveChats = [];
let userChatMessages = [];
let chatUnsubscribe = null;
let adminChatUnsubscribe = null;
let adminUsersUnsubscribe = null;
let initialOrderLoad = true;
let isSettingsLoaded = false; 

let previousOrdersData = {}; 
let previousChatCount = 0;

let qrisInterval = null;

// ==========================================
// SISTEM TEMA (DARK / LIGHT MODE)
// ==========================================
window.toggleTheme = function() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('vipercell_theme', newTheme);
    
    const metaTheme = document.getElementById('meta-theme-color');
    if(metaTheme) metaTheme.setAttribute('content', newTheme === 'dark' ? '#020617' : '#ffffff');
    
    const icon = document.getElementById('theme-icon');
    const adminIcon = document.getElementById('admin-theme-icon');
    if(icon) icon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    if(adminIcon) adminIcon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}

// ==========================================
// IN-APP PUSH NOTIFICATION (TOAST & SOUND)
// ==========================================
window.showToast = function(title, msg, type = 'info', actionCallback = null) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if(type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    if(type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    if(type === 'error') icon = '<i class="fa-solid fa-circle-xmark"></i>';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${msg}</p>
        </div>
    `;
    
    if(actionCallback) {
        toast.style.cursor = 'pointer';
        toast.onclick = () => { actionCallback(); toast.remove(); };
    }
    
    container.appendChild(toast);
    
    // Play sound if it's an admin notification
    if(isAdminLoggedIn && (title.includes('Pesanan Baru') || title.includes('Pesan Baru'))) {
        const audio = document.getElementById('notif-sound');
        if(audio) audio.play().catch(e => console.log('Audio autoplay blocked'));
    }

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ==========================================
// FUNGSI UI / UX DASAR
// ==========================================
window.openModal = (id) => {
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('active');
        document.body.classList.add('no-scroll');
    }
}
window.closeModal = (id) => {
    const el = document.getElementById(id);
    if(el) {
        el.classList.remove('active');
        document.body.classList.remove('no-scroll');
        if(id === 'modal-payment') clearInterval(qrisInterval);
    }
}

window.handleLogoClick = () => window.switchMainTab('katalog');

window.customAlert = (title, message, type = 'info') => {
    const titleEl = document.getElementById('ca-title');
    const descEl = document.getElementById('ca-desc');
    const iconEl = document.getElementById('ca-icon');
    const extraEl = document.getElementById('ca-extra-action');
    const alertEl = document.getElementById('custom-alert');

    if(titleEl) titleEl.innerText = title;
    if(descEl) descEl.innerHTML = message;
    
    if(iconEl) {
        iconEl.className = `msg-icon ${type}`;
        if(type === 'success') iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        else if(type === 'error') iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
        else if(type === 'warning') iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        else iconEl.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    }
    
    if(extraEl) extraEl.innerHTML = '';
    if(alertEl) alertEl.classList.add('active');
    document.body.classList.add('no-scroll');
}

window.closeAlert = () => {
    const alertEl = document.getElementById('custom-alert');
    const extraEl = document.getElementById('ca-extra-action');
    if(alertEl) alertEl.classList.remove('active');
    if(extraEl) extraEl.innerHTML = '';
    document.body.classList.remove('no-scroll');
}

// V16.2: Modal Konfirmasi Cerdas (Ikon Dinamis)
let promptCallback = null;
window.openConfirm = function(title, message, callback, actionType = 'warning') {
    const titleEl = document.getElementById('mc-title');
    const descEl = document.getElementById('mc-desc');
    const iconContainer = document.getElementById('mc-icon-container');
    const confirmBtn = document.getElementById('mc-confirm-btn');

    if(titleEl) titleEl.innerText = title;
    if(descEl) descEl.innerHTML = message;
    promptCallback = callback;

    if (iconContainer && confirmBtn) {
        if (actionType === 'delete') {
            iconContainer.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            iconContainer.style.color = 'var(--danger)';
            confirmBtn.style.background = 'var(--danger)';
            confirmBtn.style.borderColor = 'var(--danger)';
        } else if (actionType === 'success') {
            iconContainer.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            iconContainer.style.color = 'var(--success)';
            confirmBtn.style.background = 'var(--success)';
            confirmBtn.style.borderColor = 'var(--success)';
        } else {
            iconContainer.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
            iconContainer.style.color = 'var(--primary-light)';
            confirmBtn.style.background = 'var(--primary)';
            confirmBtn.style.borderColor = 'var(--primary)';
        }
    }
    window.openModal('modal-confirm');
}

window.resolveConfirm = function(isConfirmed) {
    window.closeModal('modal-confirm');
    if(promptCallback) promptCallback(isConfirmed);
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('reveal-visible'); });
}, { threshold: 0.1 });

function observeReveals() {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
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
        if (isDeleting) { typeSpeed = 60; i--; } 
        else { i++; }
        
        if (!isDeleting && i === text.length + 1) {
            isDeleting = true; typeSpeed = 2500; 
        } else if (isDeleting && i === 0) {
            isDeleting = false; typeSpeed = 800; 
        }
        setTimeout(type, typeSpeed);
    }
    type();
}

// ==========================================
// INIT APP & FIREBASE AUTHENTICATION
// ==========================================
async function initApp() {
    try {
        const savedTheme = localStorage.getItem('vipercell_theme') || 'dark';
        const icon = document.getElementById('theme-icon');
        const adminIcon = document.getElementById('admin-theme-icon');
        if(icon) icon.className = savedTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        if(adminIcon) adminIcon.className = savedTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        
        typeWriterEffect();
        setTimeout(() => { window.scrollTo(0, 1); }, 100);
        
        await setPersistence(auth, browserLocalPersistence);
        
        onAuthStateChanged(auth, async (user) => {
            currentUser = user;
            if (user) {
                if (user.isAnonymous) {
                    const savedAnonName = localStorage.getItem('vipercell_anon_name') || '';
                    userProfile = { name: savedAnonName, phone: '', tier: 'bronze', tierExp: 0 };
                    
                    document.getElementById('btn-login-user').style.display = 'inline-flex';
                    document.getElementById('nav-profil').style.display = 'none';
                    document.getElementById('nav-pesanan').style.display = 'none';
                    document.getElementById('nav-bot-pesanan').style.display = 'none';
                    
                    // Show Lacak Pesanan untuk Guest
                    const navBotLacak = document.getElementById('nav-bot-lacak');
                    const btnCekPesanan = document.getElementById('btn-cek-pesanan');
                    if(navBotLacak) navBotLacak.style.display = 'flex';
                    if(btnCekPesanan) btnCekPesanan.style.display = 'inline-flex';
                } else {
                    document.getElementById('btn-login-user').style.display = 'none';
                    const userDoc = await getDoc(doc(db, pathUsers, user.uid));
                    if(userDoc.exists()) {
                        userProfile = { ...userProfile, ...userDoc.data() };
                        document.getElementById('prof-name').value = userProfile.name || '';
                        document.getElementById('prof-phone').value = userProfile.phone || '';
                    } else {
                        userProfile = { name: '', phone: '', tier: 'bronze', tierExp: 0 };
                    }
                    
                    document.getElementById('prof-email').value = user.email || '';
                    document.getElementById('nav-profil').style.display = 'flex';
                    document.getElementById('nav-pesanan').style.display = 'flex';
                    document.getElementById('nav-bot-pesanan').style.display = 'flex';
                    
                    // Sembunyikan Lacak Pesanan untuk User yang Login
                    const navBotLacak = document.getElementById('nav-bot-lacak');
                    const btnCekPesanan = document.getElementById('btn-cek-pesanan');
                    if(navBotLacak) navBotLacak.style.display = 'none';
                    if(btnCekPesanan) btnCekPesanan.style.display = 'none';
                    
                    window.renderUserOrders(); 
                    window.renderMembershipUI();
                    updateProfileStats();
                }
                
                if (user.email === 'vipercell.id@gmail.com') {
                    isAdminLoggedIn = true;
                    document.getElementById('nav-admin').style.display = 'flex';
                    document.getElementById('btn-admin-mobile-access').style.display = 'block';
                    listenAdminLiveChat();
                } else {
                    isAdminLoggedIn = false;
                    document.getElementById('nav-admin').style.display = 'none';
                    document.getElementById('btn-admin-mobile-access').style.display = 'none';
                    if (document.getElementById('admin-dashboard').style.display === 'flex') window.toggleAdminDashboard(false);
                    document.getElementById('user-chat-fab').style.display = 'flex';
                    listenUserChat();
                }
                listenData();
            } else {
                isAdminLoggedIn = false;
                document.getElementById('nav-admin').style.display = 'none';
                document.getElementById('btn-admin-mobile-access').style.display = 'none';
                document.getElementById('btn-login-user').style.display = 'inline-flex';
                document.getElementById('nav-profil').style.display = 'none';
                document.getElementById('nav-pesanan').style.display = 'none';
                document.getElementById('nav-bot-pesanan').style.display = 'none';
                
                // Show Lacak Pesanan
                const navBotLacak = document.getElementById('nav-bot-lacak');
                const btnCekPesanan = document.getElementById('btn-cek-pesanan');
                if(navBotLacak) navBotLacak.style.display = 'flex';
                if(btnCekPesanan) btnCekPesanan.style.display = 'inline-flex';
                
                signInAnonymously(auth).catch(() => {});
            }
        });
    } catch (error) {
        console.error("Auth Init Error:", error);
    }
    observeReveals();
}

// ==========================================
// PENGIRIMAN AKUN OTOMATIS (AUTO-DELIVERY)
// ==========================================
window.attemptClientAutoDelivery = async function(orderData) {
    if (orderData.items[0].type !== 'app' || orderData.items[0].processType === 'manual') return false;
    try {
        const targetBrand = orderData.items[0].brandName;
        const exactItemName = orderData.items[0].exactItemName;
        const stockQ = query(collection(db, pathStocks), where("brand", "==", targetBrand), where("itemName", "==", exactItemName), where("status", "==", "Ready"));
        const stockSnap = await getDocs(stockQ);
        
        if (!stockSnap.empty) {
            const readyStock = stockSnap.docs[0];
            const stockData = readyStock.data();
            const parts = stockData.data.split('|');
            const em = parts[0] || '-';
            const pw = parts[1] || '-';
            const notes = parts[2] || '-';
            
            const autoReply = `Detail Akun Premium Kamu:\nEmail/NoHP: ${em}\nPassword: ${pw}\nDetail Tambahan: ${notes}\n\nTerima kasih telah berbelanja!`;
            await updateDoc(doc(db, pathStocks, readyStock.id), { status: 'Used', usedAt: Date.now(), orderId: orderData.id });
            await updateDoc(doc(db, pathOrders, orderData.dbId), { adminReply: autoReply, status: 'SUCCESS' });
            return true;
        }
        return false;
    } catch(e) {
        return false;
    }
}

// ==========================================
// REAL-TIME DATA LISTENER (FIRESTORE)
// ==========================================
let isListening = false;
function listenData() {
    if(isListening) return;
    isListening = true;

    onSnapshot(doc(db, pathSettings, 'mainConfig'), (docSnap) => {
        if (docSnap.exists()) {
            siteSettings = { ...siteSettings, ...docSnap.data() };
            if(!siteSettings.membership) siteSettings.membership = { price: 50000, disc: 5 };
        } else {
            setDoc(doc(db, pathSettings, 'mainConfig'), siteSettings).catch(()=>{});
        }
        isSettingsLoaded = true;
        
        window.applySettingsToUI();
        if(isAdminLoggedIn) window.populateAdminSettings();
        if(currentUser && !currentUser.isAnonymous) window.renderMembershipUI();
    });

    onSnapshot(collection(db, pathProducts), (snapshot) => {
        products = [];
        snapshot.forEach((docSnap) => { products.push({ dbId: docSnap.id, ...docSnap.data() }); });
        
        groupedBrands = [];
        products.forEach(p => {
            const brandName = p.brand || p.name;
            const existing = groupedBrands.find(b => b.brandName === brandName);
            if(existing) {
                existing.items.push(p);
                if(p.imgUrlBase64 && !existing.imgUrlBase64) existing.imgUrlBase64 = p.imgUrlBase64;
                if(p.desc && !existing.desc) existing.desc = p.desc;
            } else {
                groupedBrands.push({
                    brandName: brandName,
                    type: p.type,
                    imgUrlBase64: p.imgUrlBase64 || '',
                    desc: p.desc || '',
                    isGangguan: p.isGangguan || false,
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
        snapshot.forEach((docSnap) => { promos.push({ dbId: docSnap.id, ...docSnap.data() }); });
        if(isAdminLoggedIn) window.renderAdminPromos();
        if(selectedProductForBuy) window.calculateDirectBuyTotal();
    });
    
    onSnapshot(collection(db, pathStocks), (snapshot) => {
        stocks = [];
        snapshot.forEach((docSnap) => { stocks.push({ dbId: docSnap.id, ...docSnap.data() }); });
        if(isAdminLoggedIn) window.renderAdminStocks();
    });

    // Orders Listener (V16.2 Logika 4 Menit Unpaid -> 24 Jam Expired)
    onSnapshot(collection(db, pathOrders), (snapshot) => {
        let newOrders = [];
        let globalSuccessTriggered = false;
        const now = Date.now();
        
        snapshot.forEach((docSnap) => {
            let data = { dbId: docSnap.id, ...docSnap.data() };
            const orderTime = new Date(data.date).getTime();
            
            // Logika QRIS EXPIRED
            if(data.status === 'UNPAID') {
                if(now - orderTime > 240000) { // 4 Menit (240000 ms)
                    updateDoc(doc(db, pathOrders, data.dbId), { status: 'EXPIRED' });
                    data.status = 'EXPIRED';
                }
            } else if (data.status === 'EXPIRED') {
                if(now - orderTime > 86400000) { // Jika sudah Expired selama 1 Hari (24 Jam = 86400000 ms), Hapus Permanen.
                    deleteDoc(doc(db, pathOrders, data.dbId));
                    return; 
                }
            }

            newOrders.push(data);

            if (currentUser && data.userEmail === currentUser.email) {
                let oldStatus = previousOrdersData[data.id];
                if (oldStatus && oldStatus !== 'SUCCESS' && data.status === 'SUCCESS') {
                    globalSuccessTriggered = true; 
                    window.showToast('Pesanan Selesai!', `Hore! Pesanan ${data.id} berhasil diproses.`, 'success', () => window.switchMainTab('pesanan'));
                }
            }
            
            if (isAdminLoggedIn) {
                let oldStatus = previousOrdersData[data.id];
                if (data.status === 'PENDING' && oldStatus !== 'PENDING') {
                    window.showToast('Pesanan Baru', `Menunggu proses manual untuk Invoice ${data.id}`, 'info', () => window.switchAdminTab('tab-orders', document.querySelectorAll('.admin-tab')[1]));
                }
            }
            previousOrdersData[data.id] = data.status;

            if (data.status === 'SUCCESS' && !data.adminReply && data.items[0].type === 'app' && data.items[0].processType === 'auto') {
                if ((currentUser && data.userEmail === currentUser.email) || isAdminLoggedIn) {
                    if (!window.processingOrders) window.processingOrders = {};
                    if (!window.processingOrders[data.id]) {
                        window.processingOrders[data.id] = true;
                        window.attemptClientAutoDelivery(data);
                    }
                }
            }
            
            if (data.status === 'SUCCESS' && data.items[0].type === 'membership' && !data.adminReply) {
                if (currentUser && data.userEmail === currentUser.email && !window.processingOrders) {
                    window.processingOrders = {};
                    if (!window.processingOrders[data.id]) {
                        window.processingOrders[data.id] = true;
                        let months = data.items[0].itemDuration || 1;
                        let newExp = userProfile.tierExp || Date.now();
                        if(newExp < Date.now()) newExp = Date.now();
                        newExp += (months * 30 * 24 * 60 * 60 * 1000); 
                        
                        updateDoc(doc(db, pathUsers, currentUser.uid), { tier: 'vip', tierExp: newExp }).then(()=>{
                            updateDoc(doc(db, pathOrders, data.dbId), { adminReply: `Paket Member+ VIP ${months} Bulan berhasil diaktifkan. Selamat menikmati diskon otomatis!`});
                        });
                    }
                }
            }
        });
        
        orders = newOrders.sort((a,b) => new Date(b.date) - new Date(a.date));
        
        const trackModal = document.getElementById('modal-cek-pesanan');
        if(trackModal && trackModal.classList.contains('active')) {
            const currentTrackId = document.getElementById('track-id').value.trim().toUpperCase();
            if(currentTrackId) window.trackOrder(); 
        }

        if(isAdminLoggedIn) {
            window.renderAdminOrders();
            window.generateAdminReports();
        }
        
        updateOrderBadges();
        
        if(currentUser && !currentUser.isAnonymous) {
            window.renderUserOrders();
            window.renderMembershipUI();
            updateProfileStats();
        }
        initialOrderLoad = false;
    });

    auth.onAuthStateChanged((user) => {
        if (user && user.email === 'vipercell.id@gmail.com') {
            if(adminUsersUnsubscribe) adminUsersUnsubscribe();
            adminUsersUnsubscribe = onSnapshot(collection(db, pathUsers), (snapshot) => {
                allUsers = [];
                snapshot.forEach(docSnap => allUsers.push({uid: docSnap.id, ...docSnap.data()}));
                window.renderAdminMembers();
            });
        }
    });
}

function updateOrderBadges() {
    if (isAdminLoggedIn) {
        const hasPending = orders.some(o => o.status === 'PENDING' || o.status === 'UNPAID');
        const adminBadge = document.getElementById('admin-badge');
        if(adminBadge) adminBadge.style.display = hasPending ? 'block' : 'none';
        const adminOrderTabBadge = document.getElementById('admin-tab-order-badge');
        if(adminOrderTabBadge) adminOrderTabBadge.style.display = hasPending ? 'inline-block' : 'none';
    }
    if (currentUser && !currentUser.isAnonymous) {
        const hasActionNeeded = orders.some(o => o.userEmail === currentUser.email && (o.status === 'UNPAID' || o.status === 'PENDING'));
        
        const badgeDesk = document.getElementById('user-order-badge-desktop');
        if(badgeDesk) badgeDesk.style.display = hasActionNeeded ? 'block' : 'none';
        
        const badgeMob = document.getElementById('user-order-badge-mobile');
        if(badgeMob) badgeMob.style.display = hasActionNeeded ? 'block' : 'none';
    }
}

// ==========================================
// FITUR MEMBERSHIP+ (V16.2 VIP PACKAGE)
// ==========================================
window.renderMembershipUI = async function() {
    if(!currentUser || currentUser.isAnonymous) return;
    
    let tier = userProfile.tier || 'bronze';
    let exp = userProfile.tierExp || 0;

    if (tier === 'vip' && exp > 0 && Date.now() > exp) {
        tier = 'bronze';
        exp = 0;
        await updateDoc(doc(db, pathUsers, currentUser.uid), { tier, tierExp: exp });
        userProfile.tier = tier;
        userProfile.tierExp = exp;
    }

    const tInfo = tier === 'vip' ? 
        { name: 'Member VIP', label: 'MEMBER+ VIP AKTIF', color: '#f59e0b' } : 
        { name: 'Bronze', label: 'MEMBER BASIC', color: 'rgba(0,0,0,0.3)' };

    const badgeEl = document.getElementById('user-tier-badge');
    const nameEl = document.getElementById('user-tier-name');
    const expEl = document.getElementById('user-tier-validity');

    if(badgeEl) { badgeEl.innerText = tInfo.label; badgeEl.style.background = tInfo.color; }
    if(nameEl) nameEl.innerText = tInfo.name;
    
    if(tier === 'bronze') {
        if(expEl) expEl.innerText = 'Selamanya';
    } else {
        if(expEl) expEl.innerText = new Date(exp).toLocaleDateString('id-ID');
    }

    let totalSaved = 0;
    orders.forEach(o => {
        if(o.userEmail === currentUser.email && o.status === 'SUCCESS' && o.memberDiscountApplied) {
            totalSaved += o.memberDiscountApplied;
        }
    });
    
    const savedEl = document.getElementById('user-tier-saved');
    if(savedEl) savedEl.innerText = `Rp${totalSaved.toLocaleString('id-ID')}`;
}

let selectedMemberDuration = 1;

window.openUpgradeModal = function() {
    document.getElementById('membership-checkout-section').style.display = 'block';
    selectedMemberDuration = 1;
    
    const defaultDurCard = document.querySelector('input[name="member_duration"][value="1"]');
    if(defaultDurCard) window.selectMembershipDuration(1, defaultDurCard.parentElement);
    window.openModal('modal-upgrade-member');
}

window.selectMembershipDuration = function(months, el) {
    selectedMemberDuration = months;
    document.querySelectorAll('input[name="member_duration"]').forEach(input => {
        input.parentElement.classList.remove('active');
    });
    el.classList.add('active');
    el.querySelector('input').checked = true;
    
    const payType = document.querySelector('input[name="member_payment"]:checked')?.value || 'qris';
    const payEl = document.querySelector(`input[name="member_payment"][value="${payType}"]`)?.parentElement;
    if(payEl) window.selectMembershipPayment(payType, payEl);
}

window.selectMembershipPayment = function(val, el) {
    document.querySelectorAll('input[name="member_payment"]').forEach(input => {
        input.parentElement.classList.remove('active');
    });
    el.classList.add('active');
    el.querySelector('input').checked = true;
    
    const memSettings = siteSettings.membership || { price: 50000, disc: 5 };
    let baseTotal = memSettings.price * selectedMemberDuration;

    if(selectedMemberDuration === 6) baseTotal = Math.round(baseTotal * 0.90); // 10% Off
    if(selectedMemberDuration === 12) baseTotal = Math.round(baseTotal * 0.75); // 25% Off
    
    let finalPrice = baseTotal;
    if(val === 'qris') finalPrice += Math.floor(Math.random() * 300) + 1; // Kode Unik QRIS
    
    document.getElementById('membership-checkout-total').innerText = `Rp${finalPrice.toLocaleString('id-ID')}`;
    document.getElementById('membership-checkout-total').dataset.final = finalPrice;
    document.getElementById('membership-checkout-total').dataset.base = baseTotal;
}

window.processMembershipCheckout = async function() {
    const paymentMethod = document.querySelector('input[name="member_payment"]:checked').value;
    const finalTotal = parseInt(document.getElementById('membership-checkout-total').dataset.final);
    const baseTotal = parseInt(document.getElementById('membership-checkout-total').dataset.base);
    const uniqueCode = finalTotal - baseTotal;
    
    const invId = 'VP-MEM-' + Math.floor(100000 + Math.random() * 900000);
    
    const singleItem = { 
        cartId: Date.now().toString(), 
        productDbId: 'membership',
        brandName: 'Membership',
        exactItemName: 'vip',
        itemDuration: selectedMemberDuration,
        name: `Upgrade Member+ VIP (${selectedMemberDuration} Bulan)`, 
        priceNum: baseTotal, 
        type: 'membership', 
        processType: 'manual',
        playerInfo: `Email: ${currentUser.email}`
    };

    const newOrder = {
        id: invId,
        userEmail: currentUser.email,
        items: [singleItem],
        customerWa: userProfile.phone || '-',
        finalTotal: finalTotal,
        baseTotal: baseTotal,
        uniqueCode: uniqueCode,
        promoCode: '',
        promoDiscount: 0,
        memberDiscountApplied: 0,
        status: paymentMethod === 'cash' ? 'PENDING' : 'UNPAID',
        paymentMethod: paymentMethod,
        adminReply: '',
        date: new Date().toISOString()
    };

    try {
        const docRef = await addDoc(collection(db, pathOrders), newOrder);
        currentCheckoutSession = { dbId: docRef.id, id: invId, finalTotal: finalTotal, method: paymentMethod, date: newOrder.date };
        
        window.closeModal('modal-upgrade-member');
        
        if(paymentMethod === 'qris') {
            setTimeout(() => window.openQRISModal(), 300);
        } else {
            window.finishCashOrder();
        }
    } catch(e) {
        window.customAlert('Error', 'Gagal membuat pesanan', 'error');
    }
}

// ==========================================
// FITUR LIVE CHAT (PRE-CHAT & USER)
// ==========================================
window.toggleUserChat = function() {
    const chatWindow = document.getElementById('user-chat-window');
    chatWindow.classList.toggle('active');
    
    if(chatWindow.classList.contains('active')) {
        document.getElementById('user-chat-badge').style.display = 'none';
        checkChatUserState();
    }
}

function checkChatUserState() {
    const preForm = document.getElementById('chat-pre-form');
    const chatBody = document.getElementById('user-chat-body');
    const chatFooter = document.getElementById('user-chat-footer');
    
    let hasName = userProfile.name && userProfile.name.trim() !== '';
    if(!hasName && currentUser && !currentUser.isAnonymous) {
        hasName = true;
        userProfile.name = currentUser.email.split('@')[0];
    }
    
    if (hasName) {
        if(preForm) preForm.style.display = 'none';
        if(chatBody) chatBody.style.display = 'flex';
        if(chatFooter) chatFooter.style.display = 'flex';
        scrollToBottomUserChat();
    } else {
        if(preForm) preForm.style.display = 'flex';
        if(chatBody) chatBody.style.display = 'none';
        if(chatFooter) chatFooter.style.display = 'none';
    }
}

window.startAnonChat = function() {
    const input = document.getElementById('chat-anon-name');
    const name = input ? input.value.trim() : '';
    if(!name) {
        window.customAlert('Nama Diperlukan', 'Silakan masukkan nama panggilan Anda untuk melanjutkan.', 'warning');
        return;
    }
    userProfile.name = name;
    localStorage.setItem('vipercell_anon_name', name);
    checkChatUserState();
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
                if(lastMsg.sender === 'admin' && !document.getElementById('user-chat-window').classList.contains('active')) {
                    document.getElementById('user-chat-badge').style.display = 'block';
                    window.showToast('Pesan Baru', 'Admin membalas pesan Anda.', 'info', () => window.toggleUserChat());
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
    if(!body) return;
    
    if(userChatMessages.length === 0) {
        body.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; margin-top:30px;"> Belum ada obrolan. Tuliskan pertanyaan Anda untuk terhubung dengan Admin.</p>';
        return;
    }

    let html = '';
    userChatMessages.forEach(msg => {
        const isUser = msg.sender === 'user';
        html += `
            <div class="chat-msg ${isUser ? 'user' : 'admin'}">
                ${msg.text}
                <span class="chat-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
    });
    body.innerHTML = html;
    scrollToBottomUserChat();
}

function scrollToBottomUserChat() {
    const body = document.getElementById('user-chat-body');
    if(body) setTimeout(() => { body.scrollTop = body.scrollHeight; }, 100);
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
    const displayName = userProfile.name ? userProfile.name : (currentUser.isAnonymous ? 'Pelanggan Tamu' : currentUser.email);
    
    if(!docSnap.exists()) {
        await setDoc(chatRef, { uid: currentUser.uid, userInfo: displayName, updatedAt: Date.now(), messages: [newMsg] });
    } else {
        await updateDoc(chatRef, { userInfo: displayName, updatedAt: Date.now(), messages: arrayUnion(newMsg) });
    }
    scrollToBottomUserChat();
}

// ==========================================
// FITUR LIVE CHAT ADMIN
// ==========================================
function listenAdminLiveChat() {
    if(adminChatUnsubscribe) adminChatUnsubscribe();
    adminChatUnsubscribe = onSnapshot(collection(db, pathChats), (snapshot) => {
        allLiveChats = [];
        snapshot.forEach(docSnap => { allLiveChats.push({ id: docSnap.id, ...docSnap.data() }); });
        allLiveChats.sort((a,b) => b.updatedAt - a.updatedAt);
        window.renderAdminChatList();
        
        if (allLiveChats.length > 0 && allLiveChats[0].messages.length > 0) {
            const latestMsg = allLiveChats[0].messages[allLiveChats[0].messages.length-1];
            if (latestMsg.sender === 'user' && previousChatCount !== 0 && allLiveChats.length >= previousChatCount) {
                window.showToast('Pesan Masuk', `Pesan baru dari ${allLiveChats[0].userInfo}`, 'info');
            }
        }
        previousChatCount = allLiveChats.length;

        const badge = document.getElementById('admin-chat-tab-badge');
        if(badge) badge.style.display = allLiveChats.length > 0 ? 'inline-block' : 'none';
        
        const activeId = document.getElementById('admin-active-chat-id-desk')?.value;
        if(activeId) window.openAdminChatDetailDesk(activeId); 
    });
}

window.renderAdminChatList = function() {
    const list = document.getElementById('admin-chat-list');
    if(!list) return;

    if(allLiveChats.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding: 2rem;">Tidak ada pesan aktif.</p>';
        document.getElementById('admin-chat-empty').style.display = 'flex';
        document.getElementById('admin-chat-active').style.display = 'none';
        return;
    }
    
    const activeId = document.getElementById('admin-active-chat-id-desk')?.value;
    let html = '';
    
    allLiveChats.forEach(chat => {
        const msgs = chat.messages || [];
        const lastMsg = msgs.length > 0 ? msgs[msgs.length-1] : null;
        const hasUnread = lastMsg && lastMsg.sender === 'user';
        const isActive = chat.id === activeId ? 'active' : '';
        
        html += `
            <div id="chat-card-${chat.id}" class="admin-chat-card ${isActive}" onclick="window.openAdminChatDetailDesk('${chat.id}')">
                <div style="flex:1; overflow:hidden;">
                    <strong style="color:var(--text); font-size:0.9rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${chat.userInfo || 'User'}</strong>
                    <small style="color:var(--text-muted); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${lastMsg ? lastMsg.text : '...'}</small>
                </div>
                ${hasUnread ? '<span class="badge">Baru</span>' : ''}
            </div>
        `;
    });
    list.innerHTML = html;
}

window.openAdminChatDetailDesk = function(chatId) {
    const chat = allLiveChats.find(c => c.id === chatId);
    if(!chat) return;
    
    document.getElementById('admin-chat-empty').style.display = 'none';
    document.getElementById('admin-chat-active').style.display = 'flex';
    document.getElementById('admin-active-chat-id-desk').value = chatId;
    document.getElementById('admin-chat-title-desk').innerText = chat.userInfo || 'User';
    
    const body = document.getElementById('admin-chat-body-desktop');
    let html = '';
    
    (chat.messages || []).forEach(msg => {
        const isAdmin = msg.sender === 'admin';
        html += `
            <div class="chat-msg ${isAdmin ? 'user' : 'admin'}" style="${isAdmin ? 'align-self:flex-end; background:var(--primary); color:white;' : 'align-self:flex-start;'}">
                ${msg.text}
                <span class="chat-time">${new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
    });
    body.innerHTML = html;
    
    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
    
    document.querySelectorAll('.admin-chat-card').forEach(el => el.classList.remove('active'));
    const activeCard = document.getElementById(`chat-card-${chatId}`);
    if(activeCard) activeCard.classList.add('active');
}

window.insertQuickReplyDesk = function(text) {
    const input = document.getElementById('admin-chat-input-desk');
    if(input) { input.value = input.value + text + " "; input.focus(); }
}

window.sendAdminChatDesk = async function() {
    const chatId = document.getElementById('admin-active-chat-id-desk').value;
    const input = document.getElementById('admin-chat-input-desk');
    const text = input.value.trim();
    if(!text || !chatId) return;
    
    input.value = '';
    const chatRef = doc(db, pathChats, chatId);
    await updateDoc(chatRef, {
        updatedAt: Date.now(),
        messages: arrayUnion({ sender: 'admin', text: text, timestamp: Date.now() })
    });
}

window.resolveChatDesktop = async function() {
    const chatId = document.getElementById('admin-active-chat-id-desk').value;
    if(!chatId) return;
    window.openConfirm('Selesai', 'Hapus permanen sesi chat ini dari sistem?', async (confirmed) => {
        if(confirmed) {
            await deleteDoc(doc(db, pathChats, chatId));
            document.getElementById('admin-active-chat-id-desk').value = '';
            document.getElementById('admin-chat-empty').style.display = 'flex';
            document.getElementById('admin-chat-active').style.display = 'none';
            window.customAlert('Dihapus', 'Sesi Live Chat dihapus.', 'info');
        }
    }, 'delete');
}

// ==========================================
// UI & TAB NAVIGATION
// ==========================================
window.toggleFaq = function(element) { element.classList.toggle('expanded'); };
window.toggleNewsAccordion = function(element) { element.parentElement.classList.toggle('open'); };

window.openAuthModal = function() {
    window.switchAuthTab('login');
    window.switchMainTab('auth');
}

window.switchAuthTab = function(tab) {
    document.getElementById('form-login').style.display = tab==='login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab==='register' ? 'block' : 'none';
    document.getElementById('form-reset').style.display = tab==='reset' ? 'block' : 'none';
    
    document.getElementById('auth-divider').style.display = tab==='reset' ? 'none' : 'flex';
    document.getElementById('auth-google-btn').style.display = tab==='reset' ? 'none' : 'flex';
    
    const btnL = document.getElementById('tab-login');
    const btnR = document.getElementById('tab-register');
    if(btnL) btnL.className = tab==='login' ? 'active' : '';
    if(btnR) btnR.className = tab==='register' ? 'active' : '';
    
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    if(tab==='reset') {
        title.innerText = 'Lupa Sandi';
        subtitle.innerText = 'Tenang, mari kita pulihkan akunmu.';
    } else {
        title.innerText = tab==='login' ? 'Masuk Akun' : 'Daftar Baru';
        subtitle.innerText = tab==='login' ? 'Masuk untuk transaksi & menikmati harga member.' : 'Buat akun sekarang, nikmati transaksi otomatis yang cepat.';
    }
}

window.showResetPassword = () => window.switchAuthTab('reset');

window.switchMainTab = function(tab) {
    document.querySelectorAll('.main-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
    
    let navEl = document.getElementById('nav-'+tab);
    if(navEl) navEl.classList.add('active');

    let botNavEl = document.getElementById('nav-bot-'+tab);
    if(botNavEl) botNavEl.classList.add('active');
    
    let tabEl = document.getElementById('tab-'+tab);
    if(tabEl) {
        tabEl.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'instant' }); 
    }
    setTimeout(observeReveals, 50);
}

// ==========================================
// AUTHENTICATION PROCESS
// ==========================================
window.processLogin = async function() {
    const em = document.getElementById('auth-l-email').value.trim();
    const pw = document.getElementById('auth-l-pass').value.trim();
    if(!em || !pw) { window.customAlert('Error', 'Email dan Password wajib diisi!', 'error'); return; }
    
    const btn = document.getElementById('btn-do-login');
    btn.innerText = 'Memproses...'; btn.disabled = true;
    try {
        await signInWithEmailAndPassword(auth, em, pw);
        window.switchMainTab('katalog');
        if(em === 'vipercell.id@gmail.com') window.customAlert('Sukses', 'Selamat datang Admin Vipercell.', 'success');
        else window.customAlert('Sukses', 'Berhasil masuk.', 'success');
    } catch(e) { 
        window.customAlert('Gagal', 'Email atau password salah.', 'error'); 
    } finally {
        btn.innerText = 'Masuk Sekarang'; btn.disabled = false;
    }
}

window.processRegister = async function() {
    const name = document.getElementById('auth-r-name').value.trim();
    const wa = document.getElementById('auth-r-wa').value.trim();
    const em = document.getElementById('auth-r-email').value.trim();
    const pw = document.getElementById('auth-r-pass').value.trim();
    
    if(!name || !wa || !em || pw.length < 6) { 
        window.customAlert('Peringatan', 'Harap lengkapi Nama, WhatsApp, Email, dan Password minimal 6 karakter.', 'warning'); 
        return; 
    }
    
    const btn = document.getElementById('btn-do-register');
    btn.innerText = 'Memproses...'; btn.disabled = true;
    try {
        const cred = await createUserWithEmailAndPassword(auth, em, pw);
        await setDoc(doc(db, pathUsers, cred.user.uid), { 
            email: em, name: name, phone: wa, tier: 'bronze', tierExp: 0, createdAt: new Date().toISOString()
        });
        window.switchMainTab('profil'); 
        window.customAlert('Sukses', 'Akun berhasil didaftarkan.', 'success');
    } catch(e) { 
        window.customAlert('Gagal', 'Email mungkin sudah terdaftar.', 'error'); 
    } finally {
        btn.innerText = 'Buat Akun Baru'; btn.disabled = false;
    }
}

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
}

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
            window.switchMainTab('katalog');
            window.customAlert('Sukses', 'Selamat datang Admin.', 'success'); return;
        }
        const userDoc = await getDoc(doc(db, pathUsers, result.user.uid));
        if (!userDoc.exists()) {
            await signOut(auth);
            window.customAlert('Akses Ditolak', 'Kamu belum mendaftar. Silakan ke menu <b>Daftar Baru</b> di web ini terlebih dahulu sebelum bisa login menggunakan Google.', 'error');
            return;
        }
        window.switchMainTab('pesanan'); 
        window.customAlert('Sukses', 'Berhasil masuk via Google.', 'success');
    } catch (error) {}
}

window.logoutUser = async function() {
    await signOut(auth);
    window.switchMainTab('katalog');
    window.customAlert('Logout', 'Anda telah keluar dari akun.', 'info');
}

window.saveUserProfile = async function() {
    if(!currentUser || currentUser.isAnonymous) return;
    const name = document.getElementById('prof-name').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    try {
        await setDoc(doc(db, pathUsers, currentUser.uid), { name, phone }, { merge: true });
        userProfile.name = name; userProfile.phone = phone;
        window.customAlert('Tersimpan', 'Profil berhasil diperbarui.', 'success');
    } catch(e) { window.customAlert('Error', 'Gagal menyimpan profil.', 'error'); }
}

function updateProfileStats() {
    if(!currentUser || currentUser.isAnonymous) return;
    const successCount = orders.filter(o => o.userEmail === currentUser.email && o.status === 'SUCCESS').length;
    const statEl = document.getElementById('prof-stat-success');
    if(statEl) statEl.innerText = successCount;
}

// ==========================================
// RENDER UI & KATALOG
// ==========================================
window.applySettingsToUI = function() {
    const logoDasar = siteSettings.logoText || 'VIPER';
    const logoAksen = siteSettings.logoAccent || 'CELL';
    
    const slt = document.getElementById('site-logo-text');
    const flt = document.getElementById('footer-logo-text-2');
    if(slt) slt.innerHTML = `${logoDasar}<span>${logoAksen}</span>`;
    if(flt) flt.innerHTML = `${logoDasar}<span>${logoAksen}</span>`;
    
    const imgEl = document.getElementById('site-logo-img');
    const fImgEl = document.getElementById('footer-logo-img-2');
    const favicon = document.getElementById('favicon');
    const adminLogoEl = document.getElementById('admin-header-logo-img');
    const defAdminIco = document.getElementById('admin-header-default-icon');
    
    if(siteSettings.logoImgBase64) {
        if(imgEl){ imgEl.src = siteSettings.logoImgBase64; imgEl.style.display = 'block'; }
        if(fImgEl){ fImgEl.src = siteSettings.logoImgBase64; fImgEl.style.display = 'block'; }
        if(favicon) favicon.href = siteSettings.logoImgBase64;
        if(adminLogoEl){ adminLogoEl.src = siteSettings.logoImgBase64; adminLogoEl.style.display = 'inline-block'; }
        if(defAdminIco) defAdminIco.style.display = 'none';
    } else {
        if(imgEl) imgEl.style.display = 'none'; 
        if(fImgEl) fImgEl.style.display = 'none'; 
        if(adminLogoEl) adminLogoEl.style.display = 'none';
        if(defAdminIco) defAdminIco.style.display = 'inline-block';
    }
    
    const mText = siteSettings.marquee || 'Selamat Datang di Vipercell';
    const mt1 = document.getElementById('marquee-text-1');
    const mt2 = document.getElementById('marquee-text-2');
    if(mt1) mt1.innerText = mText;
    if(mt2) mt2.innerText = mText;
    
    const igBtn = document.getElementById('footer-ig-btn');
    if(igBtn) {
        if(siteSettings.igLink) { igBtn.href = siteSettings.igLink; igBtn.style.display = 'inline-flex'; }
        else { igBtn.style.display = 'none'; }
    }
    
    const ttBtn = document.getElementById('footer-tt-btn');
    if(ttBtn) {
        if(siteSettings.ttLink) { ttBtn.href = siteSettings.ttLink; ttBtn.style.display = 'inline-flex'; }
        else { ttBtn.style.display = 'none'; }
    }
    
    let adminWaNum = siteSettings.adminWa || '085656321860';
    if (adminWaNum.startsWith('0')) adminWaNum = '62' + adminWaNum.substring(1);
    const waHref = `https://wa.me/${adminWaNum}?text=${encodeURIComponent('Halo Min')}`;
    
    const fWaLink = document.getElementById('footer-wa-link');
    if(fWaLink) fWaLink.href = waHref;
    
    const waChanBtn = document.getElementById('btn-wa-channel');
    if(waChanBtn) waChanBtn.href = siteSettings.waChannelLink || waHref;
    
    const storeBadge = document.getElementById('store-status-badge');
    if (storeBadge) storeBadge.style.display = siteSettings.isStoreOpen === false ? 'inline-block' : 'none';

    window.renderBanners();
    window.renderNews();
}

window.renderBanners = function() {
    const container = document.getElementById('banner-container');
    const track = document.getElementById('banner-track');
    const dotsContainer = document.getElementById('banner-dots');
    
    if(!container || !track || !dotsContainer) return;
    
    const banners = siteSettings.banners || [];
    if(banners.length === 0) { 
        container.style.display = 'none'; 
        return; 
    }
    
    container.style.display = 'block';
    setTimeout(() => { container.classList.add('reveal-visible'); }, 50);
    
    let trackHtml = '';
    let dotsHtml = '';
    banners.forEach((b64, idx) => {
        trackHtml += `<img src="${b64}" class="banner-slide" alt="Promo" loading="lazy">`;
        dotsHtml += `<div class="banner-dot ${idx===0?'active':''}" onclick="window.goToBanner(${idx})"></div>`;
    });
    track.innerHTML = trackHtml;
    dotsContainer.innerHTML = dotsHtml;
    window.startBannerAuto();
}

let currentBanner = 0;
let bannerInterval;
window.goToBanner = function(idx) {
    currentBanner = idx;
    const track = document.getElementById('banner-track');
    const dots = document.querySelectorAll('.banner-dot');
    if(!track) return;
    
    track.style.transform = `translateX(-${currentBanner * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    if(dots[currentBanner]) dots[currentBanner].classList.add('active');
}

window.startBannerAuto = function() {
    clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const total = siteSettings.banners?.length || 0;
        if(total > 1) { currentBanner = (currentBanner + 1) % total; window.goToBanner(currentBanner); }
    }, 5000);
}

window.renderNews = function() {
    const grid = document.getElementById('public-news-list');
    if(!grid) return;
    
    const list = siteSettings.newsList || [];
    const visibleList = list.filter(t => !t.isHidden);
    
    if(visibleList.length === 0) {
        grid.innerHTML = '<div style="text-align:center; color:var(--text-muted)">Belum ada informasi terbaru.</div>';
        return;
    }
    
    let html = '';
    visibleList.forEach(news => {
        const imgHtml = news.imageUrl ? `<img src="${news.imageUrl}" style="width:100%; border-radius: 8px; margin-bottom: 15px;" loading="lazy">` : '';
        html += `
            <div class="tut-accordion-card">
                <div class="tut-accordion-header" onclick="window.toggleNewsAccordion(this)">
                    <span>${news.title}</span>
                    <i class="fa-solid fa-chevron-down icon-arrow"></i>
                </div>
                <div class="tut-accordion-body">
                    <div class="tutorial-info">
                        ${imgHtml}
                        <p>${news.desc.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            </div>`;
    });
    grid.innerHTML = html;
}

window.filterBrands = function(type, btnEl) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    window.renderBrands(type);
}

window.renderBrands = function(filter) {
    const grid = document.getElementById('brand-grid');
    if(!grid) return;
    
    const filteredBrands = filter === 'all' ? groupedBrands : groupedBrands.filter(b => b.type === filter);
    
    if(filteredBrands.length === 0) { 
        grid.innerHTML = `<div style="text-align:center; grid-column: 1/-1; color:var(--text-muted);">Katalog kosong.</div>`; 
        return; 
    }
    
    let html = '';
    filteredBrands.forEach(b => {
        const typeName = b.type === 'game' ? 'Game' : 'Aplikasi';
        const imgHtml = b.imgUrlBase64 
            ? `<img src="${b.imgUrlBase64}" alt="${b.brandName}" loading="lazy">` 
            : `<div style="width:100%; height:100%; background:var(--primary-gradient); display:flex; align-items:center; justify-content:center; font-size:3rem; font-weight:bold; color:rgba(255,255,255,0.3);">${b.brandName.charAt(0)}</div>`;
        
        // Cek Gangguan / Maintenance
        const badgeHtml = b.isGangguan ? '<span class="card-badge" style="background:var(--warning); color:black;">MAINTENANCE</span>' : `<span class="card-badge">${typeName}</span>`;
        const clickAction = b.isGangguan ? `window.customAlert('Maintenance Server', 'Mohon maaf, produk ini sedang dalam gangguan jaringan.', 'warning')` : `window.openDirectBuyModal('${b.brandName}')`;
        const cssClass = b.isGangguan ? 'brand-card reveal sold-out' : 'brand-card reveal';
        
        html += `
            <div class="${cssClass}" onclick="${clickAction}">
                <div class="brand-img-wrapper">
                    ${imgHtml}
                    ${badgeHtml}
                </div>
                <div class="brand-content">
                    <h3>${b.brandName}</h3>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">Pilih Nominal/Item</p>
                </div>
            </div>`;
    });
    grid.innerHTML = html;
    setTimeout(observeReveals, 100);
}

// ==========================================
// PROSES PEMBELIAN (CHECKOUT)
// ==========================================
window.selectPaymentUI = function(val, el) {
    document.querySelectorAll('input[name="payment_method"]').forEach(input => {
        input.parentElement.classList.remove('active');
    });
    el.classList.add('active');
    el.querySelector('input').checked = true;
    window.calculateDirectBuyTotal();
}

window.openDirectBuyModal = function(brandName) {
    const brandObj = groupedBrands.find(b => b.brandName === brandName);
    if(!brandObj) return;
    
    if(brandObj.isGangguan) {
        window.customAlert('Maintenance Server', 'Mohon maaf, produk ini sedang dalam gangguan jaringan.', 'warning');
        return;
    }

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
    
    const tier = (currentUser && !currentUser.isAnonymous && userProfile.tier) ? userProfile.tier : 'bronze';
    let discPercent = 0;
    if (tier === 'vip' && (userProfile.tierExp > Date.now() || userProfile.tierExp === 0)) {
        const memSettings = siteSettings.membership || { price: 50000, disc: 5 };
        discPercent = memSettings.disc;
    }

    const sortedItems = [...brandObj.items].sort((a, b) => (a.priceNum||0) - (b.priceNum||0));
    
    let html = '';
    sortedItems.forEach(item => {
        const normalPrice = item.priceNum || 0;
        const isSold = item.soldOut;
        let badgeHtml = item.processType === 'manual' ? `<span class="discount-badge" style="background:var(--warning);">Manual</span>` : '';

        let priceHtml = '';
        if (discPercent > 0 && !isSold) {
            const discountAmt = Math.round(normalPrice * (discPercent / 100));
            const finalPrice = normalPrice - discountAmt;
            
            priceHtml = `
                <div class="price-wrapper" style="flex-direction: column; gap: 0;">
                    <span style="font-size: 0.75rem; text-decoration: line-through; color: var(--text-muted);">Rp${normalPrice.toLocaleString('id-ID')}</span>
                    <span class="price-normal" style="font-size: 1rem; color: var(--success);">Rp${finalPrice.toLocaleString('id-ID')}</span>
                    <span style="font-size: 0.65rem; color: var(--warning); background: rgba(245, 158, 11, 0.1); padding: 2px 6px; border-radius: 4px; margin-top: 4px; font-weight:bold;">Harga VIP</span>
                </div>`;
        } else {
            priceHtml = `<div class="price-wrapper"><span class="price-normal">Rp${normalPrice.toLocaleString('id-ID')}</span></div>`;
        }

        html += `
            <div class="item-card ${isSold ? 'sold-out' : ''}" id="buy-card-${item.dbId}" onclick="${isSold ? '' : `window.selectItemToBuy('${item.dbId}')`}">
                ${badgeHtml}
                <h4>${item.name}</h4>
                ${priceHtml}
            </div>
        `;
    });
    itemGrid.innerHTML = html;

    const fields = document.getElementById('buy-detail-fields');
    let inpType = brandObj.items[0]?.inputType || 'id_zone';
    
    let fmtDesc = brandObj.desc ? brandObj.desc.replace(/\n/g, '<br>') : '';
    let extraDesc = fmtDesc ? `<p style="font-size:0.8rem; color:var(--primary-light); background:rgba(37,99,235,0.1); padding:8px; border-radius:8px; margin-bottom:10px;"><i class="fa-solid fa-circle-info"></i> ${fmtDesc}</p>` : '';
    
    if(brandObj.type === 'game') {
        if(inpType === 'id_only') {
            fields.innerHTML = `
                ${extraDesc}
                <div class="form-group">
                    <label for="buy-id">ID Player / Target (Wajib)</label>
                    <input type="text" id="buy-id" class="form-control" placeholder="Contoh: 123456789" required>
                    <small style="color:var(--danger); display:block; margin-top:5px; font-weight:bold;">*Kesalahan penulisan ID bukan tanggung jawab sistem.</small>
                </div>`;
        } else if(inpType === 'custom') {
            fields.innerHTML = `
                ${extraDesc}
                <div class="form-group">
                    <label for="buy-id">Informasi Akun / Server / Karakter (Wajib)</label>
                    <input type="text" id="buy-id" class="form-control" placeholder="Contoh: Server Asia, Nickname Budi" required>
                    <small style="color:var(--danger); display:block; margin-top:5px; font-weight:bold;">*Kesalahan penulisan data bukan tanggung jawab sistem.</small>
                </div>`;
        } else {
            fields.innerHTML = `
                ${extraDesc}
                <div class="form-group">
                    <label for="buy-id">ID Player (Wajib)</label>
                    <input type="text" id="buy-id" class="form-control" placeholder="Contoh: 12345678" required>
                    <small style="color:var(--danger); display:block; margin-top:5px; font-weight:bold;">*Kesalahan penulisan ID bukan tanggung jawab sistem.</small>
                </div>
                <div class="form-group">
                    <label for="buy-zone">Zone ID / Server</label>
                    <input type="text" id="buy-zone" class="form-control" placeholder="Contoh: 1234">
                </div>`;
        }
    } else {
        fields.innerHTML = `
            ${extraDesc}
            <p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding: 1.2rem; background:rgba(37,99,235,0.08); border-radius:10px; border:1px dashed var(--primary-light);">Informasi akun premium akan langsung ditampilkan di menu <b>Lacak Pesanan</b> setelah sukses dibayar.</p>`;
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
    
    const defaultPayCard = document.querySelector('input[name="payment_method"][value="qris"]');
    if(defaultPayCard) window.selectPaymentUI('qris', defaultPayCard.parentElement);
    window.calculateDirectBuyTotal();
    window.openModal('modal-buy-direct');
}

window.selectItemToBuy = function(dbId) {
    selectedProductForBuy = currentCheckoutBrand.items.find(i => i.dbId === dbId);
    document.querySelectorAll('.item-card').forEach(el => el.classList.remove('selected'));
    document.getElementById(`buy-card-${dbId}`).classList.add('selected');
    window.calculateDirectBuyTotal();
}

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
        msgEl.innerHTML = `<span style="color:var(--danger)">Kode promo telah melampaui batas kuota.</span>`;
    } else if (p.targetBrand !== 'all' && p.targetBrand !== currentCheckoutBrand.brandName) {
        appliedPromo = null;
        msgEl.innerHTML = `<span style="color:var(--danger)">Promo khusus untuk produk ${p.targetBrand}.</span>`;
    } else if (p.targetUser === 'reseller' && (!userProfile.tier || userProfile.tier === 'bronze')) {
        appliedPromo = null;
        msgEl.innerHTML = `<span style="color:var(--danger)">Promo khusus untuk Member+ VIP.</span>`;
    } else if (p.targetUser === 'new') {
        const hasOrders = orders.some(o => o.userEmail === currentUser.email);
        if (hasOrders) {
            appliedPromo = null;
            msgEl.innerHTML = `<span style="color:var(--danger)">Promo khusus untuk Transaksi Pertama.</span>`;
        } else {
            setValidPromo(p, msgEl);
        }
    } else {
        setValidPromo(p, msgEl);
    }
    window.calculateDirectBuyTotal();
}

function setValidPromo(p, msgEl) {
    appliedPromo = { dbId: p.dbId, code: p.code, amount: p.amount, type: p.type || 'nominal' };
    msgEl.innerHTML = `<span style="color:var(--success)"><i class="fa-solid fa-check"></i> Promo berhasil dipakai!</span>`;
}

window.calculateDirectBuyTotal = function() {
    const btnProc = document.getElementById('btn-process-buy');
    
    if(!selectedProductForBuy) {
        document.getElementById('buy-total-price').innerText = 'Rp0';
        btnProc.innerText = 'Pilih Item Dahulu';
        btnProc.disabled = true;
        return;
    }

    let baseTotal = selectedProductForBuy.priceNum;
    let memberAppliedAmount = 0;
    
    const tier = userProfile.tier || 'bronze';
    if (tier === 'vip' && (userProfile.tierExp > Date.now() || userProfile.tierExp === 0)) {
        const memSettings = siteSettings.membership || { price: 50000, disc: 5 };
        const discPercent = memSettings.disc;
        
        if(discPercent > 0) {
            memberAppliedAmount = Math.round(baseTotal * (discPercent / 100));
            baseTotal -= memberAppliedAmount;
            
            if(document.getElementById('buy-promo-code').value === '') {
                document.getElementById('buy-promo-msg').innerHTML = `<span style="color:var(--primary-light)"><i class="fa-solid fa-crown"></i> Diskon VIP Diterapkan</span>`;
            }
        }
    }

    let disc = 0;
    if(appliedPromo) {
        if(appliedPromo.type === 'percent') {
            disc = Math.round(baseTotal * (appliedPromo.amount / 100));
        } else {
            disc = appliedPromo.amount;
        }
        if(disc > baseTotal) disc = baseTotal;
        baseTotal -= disc;
    } else if (document.getElementById('buy-promo-code').value === '' && tier === 'bronze') {
        document.getElementById('buy-promo-msg').innerHTML = '';
    }

    document.getElementById('buy-total-price').innerText = `Rp${baseTotal.toLocaleString('id-ID')}`;
    
    if (siteSettings.isStoreOpen === false) {
        btnProc.innerText = 'Toko Sedang Tutup';
        btnProc.disabled = true;
        btnProc.style.background = 'var(--danger)';
        btnProc.style.boxShadow = 'none';
        return;
    }
    
    btnProc.style.background = 'var(--primary-gradient)';
    btnProc.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Checkout & Bayar';
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
        else playerInfo = `ID: ${pid} | Zone: ${zol}`;
    } else {
        playerInfo = `Akun Premium (Delivery Type: ${selectedProductForBuy.processType === 'manual' ? 'Manual' : 'Auto'})`;
    }

    let rawTotal = selectedProductForBuy.priceNum;
    let memberAppliedAmount = 0;
    
    const tier = userProfile.tier || 'bronze';
    if (tier === 'vip' && (userProfile.tierExp > Date.now() || userProfile.tierExp === 0)) {
        const memSettings = siteSettings.membership || { price: 50000, disc: 5 };
        const discPercent = memSettings.disc;
        if(discPercent > 0) {
            memberAppliedAmount = Math.round(rawTotal * (discPercent / 100));
            rawTotal -= memberAppliedAmount;
        }
    }

    let discountPromo = 0;
    let promoUsedCode = '';
    
    if(appliedPromo) {
        if(appliedPromo.type === 'percent') {
            discountPromo = Math.round(rawTotal * (appliedPromo.amount / 100));
        } else {
            discountPromo = appliedPromo.amount;
        }
        if(discountPromo > rawTotal) discountPromo = rawTotal;
        promoUsedCode = appliedPromo.code;
    }
    
    let baseTotal = rawTotal - discountPromo;
    if(baseTotal < 0) baseTotal = 0;

    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    
    let uniqueCode = 0;
    if(paymentMethod === 'qris' && baseTotal > 0) {
        uniqueCode = Math.floor(Math.random() * 300) + 1;
    }
    
    let finalTotal = baseTotal + uniqueCode;

    const invId = 'VP-' + Math.floor(100000 + Math.random() * 900000);
    const singleItem = { 
        cartId: Date.now().toString(), 
        productDbId: selectedProductForBuy.dbId,
        brandName: currentCheckoutBrand.brandName,
        exactItemName: selectedProductForBuy.name,
        name: `${currentCheckoutBrand.brandName} - ${selectedProductForBuy.name}`, 
        priceNum: selectedProductForBuy.priceNum, 
        type: currentCheckoutBrand.type, 
        processType: selectedProductForBuy.processType || 'auto',
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
        promoDiscount: discountPromo,
        memberDiscountApplied: memberAppliedAmount,
        status: paymentMethod === 'cash' ? 'PENDING' : 'UNPAID',
        paymentMethod: paymentMethod,
        adminReply: '',
        date: new Date().toISOString()
    };

    try {
        const docRef = await addDoc(collection(db, pathOrders), newOrder);
        currentCheckoutSession = { dbId: docRef.id, id: invId, finalTotal: finalTotal, method: paymentMethod, date: newOrder.date };
        
        if(appliedPromo) {
            const promoRef = doc(db, pathPromos, appliedPromo.dbId);
            await updateDoc(promoRef, { usedCount: increment(1) }).catch(e=>console.log(e));
        }
        
        window.closeModal('modal-buy-direct');
        
        if(paymentMethod === 'qris') {
            setTimeout(() => window.openQRISModal(), 300);
        } else {
            window.finishCashOrder();
        }
    } catch (e) {
        window.customAlert("Error", "Gagal menghubungkan pesanan ke server, coba lagi.", "error");
    }
}

window.finishCashOrder = function() {
    let adminWaNum = siteSettings.adminWa || '085656321860';
    if (adminWaNum.startsWith('0')) adminWaNum = '62' + adminWaNum.substring(1);
    
    const waText = `Halo Admin Vipercell, saya melakukan pesanan dengan metode CASH/Manual.\n\n*Invoice ID:* ${currentCheckoutSession.id}\n*Total Bayar:* Rp${currentCheckoutSession.finalTotal.toLocaleString('id-ID')}\n\nMohon dicek ya Min.`;
    const waUrl = `https://wa.me/${adminWaNum}?text=${encodeURIComponent(waText)}`;
    
    const successMsg = `ID Pesanan Anda: <strong style="color:var(--primary-light)">${currentCheckoutSession.id}</strong><br><br><span style="color:var(--warning); font-weight:bold;">PENTING:</span> Segera hubungi admin untuk melakukan konfirmasi transfer. Pesanan akan masuk setelah divalidasi.`;
    
    document.getElementById('ca-extra-action').innerHTML = `
        <a href="${waUrl}" target="_blank" class="btn btn-primary" style="display:flex; justify-content:center; width:100%; margin-top:15px; font-weight:bold; padding: 12px; font-size:1rem; box-shadow: 0 5px 15px rgba(37,99,235,0.4);">
            <i class="fa-brands fa-whatsapp" style="font-size:1.2rem; margin-right:8px;"></i> Hubungi Admin Sekarang
        </a>`;
        
    window.customAlert('Menunggu Pembayaran', successMsg, 'info');
    
    currentCheckoutSession = null;
    if(currentUser && !currentUser.isAnonymous) {
        window.switchMainTab('pesanan');
    }
}

// ==========================================
// V16.2: TIMER QRIS & AUTO EXPIRE (4 Menit)
// ==========================================
window.startQrisTimer = function(orderDate) {
    clearInterval(qrisInterval);
    const timerEl = document.getElementById('qris-timer-display');
    const timeText = document.getElementById('qris-time-left');
    if(!timerEl || !timeText) return;
    
    timerEl.style.display = 'block';
    const startTime = new Date(orderDate).getTime();
    
    qrisInterval = setInterval(() => {
        const diff = Date.now() - startTime;
        const remain = 240000 - diff; // 4 Menit untuk UI Payment
        
        if(remain <= 0) {
            clearInterval(qrisInterval);
            timeText.innerText = "EXPIRED";
            timeText.style.color = "var(--danger)";
        } else {
            const m = Math.floor(remain / 60000);
            const s = Math.floor((remain % 60000) / 1000);
            timeText.innerText = `0${m}:${s < 10 ? '0'+s : s}`;
        }
    }, 1000);
}

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
    
    if(currentCheckoutSession.date) {
        window.startQrisTimer(currentCheckoutSession.date);
    }
    
    window.openModal('modal-payment');
}

window.copyNominal = function() {
    if(!currentCheckoutSession) return;
    const nominal = currentCheckoutSession.finalTotal.toString();
    navigator.clipboard.writeText(nominal).then(() => {
        const btn = document.getElementById('btn-copy-nominal');
        if(!btn) return;
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Disalin';
        btn.style.backgroundColor = '#10b981';
        btn.style.color = 'white';
        
        setTimeout(() => {
            btn.innerHTML = oldHtml;
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--text)';
        }, 2000);
    });
}

window.resumePayment = function(dbId) {
    window.closeModal('modal-cek-pesanan'); 
    
    setTimeout(() => {
        const order = orders.find(o => o.dbId === dbId);
        if(!order) return;
        currentCheckoutSession = { dbId: order.dbId, id: order.id, finalTotal: order.finalTotal, method: order.paymentMethod, date: order.date };
        
        if(order.paymentMethod === 'cash') {
            window.finishCashOrder();
        } else {
            window.openQRISModal();
        }
    }, 300); 
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
}

window.goToPesananFromPay = function() {
    window.closeModal('modal-payment');
    const orderIdToTrack = currentCheckoutSession ? currentCheckoutSession.id : '';
    currentCheckoutSession = null;
    
    if(currentUser && !currentUser.isAnonymous) {
        window.switchMainTab('pesanan');
    } else if (orderIdToTrack) {
        document.getElementById('track-id').value = orderIdToTrack;
        window.trackOrder();
        window.openModal('modal-cek-pesanan');
    }
}

// ==========================================
// FITUR BANTUAN STRUK (SMART BUTTONS)
// ==========================================
function generateHelpButtons(invId, orderStatus, item) {
    let adminWaNum = siteSettings.adminWa || '085656321860';
    if (adminWaNum.startsWith('0')) adminWaNum = '62' + adminWaNum.substring(1);
    
    let actionBtn = '';
    
    if (orderStatus === 'PENDING') {
         const msg = encodeURIComponent(`Halo Admin, saya sudah transfer/bayar untuk pesanan *${invId}*. Tolong dicek ya Min.`);
         actionBtn = `<a href="https://wa.me/${adminWaNum}?text=${msg}" target="_blank" class="btn btn-warning" style="width:100%; font-weight:bold;"><i class="fa-brands fa-whatsapp"></i> Konfirmasi Pembayaran</a>`;
    } else if (orderStatus === 'SUCCESS') {
         if (item?.processType === 'manual') {
             const msg = encodeURIComponent(`Halo Admin, pesanan *${invId}* saya statusnya SUKSES (Manual). Mohon segera dikirim ya.`);
             actionBtn = `<a href="https://wa.me/${adminWaNum}?text=${msg}" target="_blank" class="btn btn-primary" style="width:100%; font-weight:bold;"><i class="fa-brands fa-whatsapp"></i> Hubungi Admin (Kirim Pesanan)</a>`;
         } else {
             const msg = encodeURIComponent(`Halo Admin, saya butuh bantuan untuk pesanan otomatis ID: ${invId}.`);
             actionBtn = `<a href="https://wa.me/${adminWaNum}?text=${msg}" target="_blank" class="btn btn-success" style="width:100%; font-weight:bold;"><i class="fa-solid fa-circle-info"></i> Bantuan / Info Klaim</a>`;
         }
    } else if (orderStatus === 'EXPIRED') {
         const msg = encodeURIComponent(`Halo Admin, saya sudah membayar untuk pesanan *${invId}* namun statusnya Expired di web. Mohon bantuannya.`);
         actionBtn = `<a href="https://wa.me/${adminWaNum}?text=${msg}" target="_blank" class="btn btn-danger" style="width:100%; font-weight:bold;"><i class="fa-brands fa-whatsapp"></i> Komplain Pembayaran Expired</a>`;
    }
    
    if(!actionBtn) return '';
    
    return `
    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border);">
        <p style="font-size: 0.8rem; color:var(--text-muted); margin-bottom: 8px;">Pusat Bantuan Layanan:</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${actionBtn}
        </div>
    </div>`;
}

// ==========================================
// FITUR REFRESH PESANAN
// ==========================================
window.refreshOrderData = function() {
    if(currentUser && !currentUser.isAnonymous) {
        window.renderUserOrders();
    }
    const trackModal = document.getElementById('modal-cek-pesanan');
    if(trackModal && trackModal.classList.contains('active')) {
        window.trackOrder();
    }
    
    const btnRefresh = document.querySelector('.section-header .btn-outline');
    if(btnRefresh) {
        const ogText = btnRefresh.innerHTML;
        btnRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Data Terbaru';
        setTimeout(() => { btnRefresh.innerHTML = ogText; }, 1000);
    }
}

window.forceRefreshOrder = function(invId) {
    document.getElementById('track-id').value = invId;
    window.trackOrder();
}

// ==========================================
// FITUR LACAK PESANAN (REAL-TIME)
// ==========================================
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

    const sBadge = order.status === 'UNPAID' ? 'status-unpaid' : order.status === 'PENDING' ? 'status-pending' : order.status === 'FAILED' ? 'status-failed' : order.status === 'EXPIRED' ? 'status-failed' : 'status-success';
    const sName = order.status === 'UNPAID' ? 'Belum Dibayar' : order.status === 'PENDING' ? 'Menunggu Proses' : order.status === 'FAILED' ? 'Gagal/Batal' : order.status === 'EXPIRED' ? 'Waktu Expired' : 'Sukses & Selesai';
    
    let actionHtml = '';
    if (order.status === 'UNPAID') {
        actionHtml = `<button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="window.resumePayment('${order.dbId}')">Lanjut Selesaikan Pembayaran</button>`;
    }

    let successAnimHtml = (order.status === 'SUCCESS') ? `
        <div class="payment-success-anim">
            <div class="checkmark-circle"><i class="fa-solid fa-check"></i></div>
            <h3 style="color: var(--success); font-weight: 800; font-size: 1.5rem;">Pembayaran Berhasil!</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Pesanan kamu sudah terverifikasi sistem.</p>
        </div>
    ` : '';

    let replyHtml = '';
    if (order.status === 'SUCCESS') {
        if (order.adminReply) {
            replyHtml = `
            <div class="auto-delivery-box reveal-visible">
                <div class="auto-delivery-title"><i class="fa-solid fa-envelope-open-text"></i> Detail Info Pesanan / Akun</div>
                <div class="auto-delivery-data">${order.adminReply}</div>
            </div>`;
        } else {
            if (order.items[0]?.processType === 'manual') {
                replyHtml = `
                <div class="auto-delivery-box reveal-visible" style="border-color:var(--primary-light); background: rgba(37, 99, 235, 0.08);">
                    <div class="auto-delivery-title" style="color:var(--primary-light);"><i class="fa-solid fa-user-clock"></i> Proses Manual Admin</div>
                    <div class="auto-delivery-data" style="color:var(--text-muted); background:transparent; border:none; padding:0;">Pembayaran berhasil. Pesanan ini diproses manual, mohon tunggu sebentar.</div>
                </div>`;
            } else {
                replyHtml = `
                <div class="auto-delivery-box reveal-visible" style="border-color:var(--warning);">
                    <div class="auto-delivery-title" style="color:var(--warning);"><i class="fa-solid fa-clock"></i> Menunggu Stok Sistem</div>
                    <div class="auto-delivery-data" style="color:var(--text-muted); background:transparent; border:none; padding:0;">Pembayaran sukses. Stok otomatis sedang antre untuk dikirim, mohon ditunggu.</div>
                </div>`;
            }
        }
    }

    let detailGameHtml = '';
    if (order.items[0]?.type === 'game') {
        detailGameHtml = `
        <div style="background:rgba(37,99,235,0.05); padding:10px; border-radius:8px; border:1px dashed var(--primary-light); margin-top:5px;">
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom: 2px;">Data / Tujuan Game:</div>
            <div style="font-size:0.85rem; color:var(--text); font-weight:600;">${order.items[0].playerInfo}</div>
        </div>`;
    } else {
        detailGameHtml = `<div style="font-size: 0.8rem; color: var(--text-muted);">${order.items[0].playerInfo}</div>`;
    }

    const helpHtml = generateHelpButtons(order.id, order.status, order.items[0]);
    
    resBox.style.display = 'block';
    resBox.innerHTML = `
    ${successAnimHtml}
    <div class="receipt-card receipt-anim" style="margin-top:0; position:relative;">
        <div class="receipt-header">
            <div>
                <div style="color:var(--text-muted); font-size: 0.75rem;">INVOICE</div>
                <div style="color:var(--primary-light); font-weight: 800; font-size: 1.1rem; letter-spacing: 1px;">${order.id}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="status-badge ${sBadge}">${sName}</span>
                <button class="btn btn-outline" style="padding:4px 8px; border-radius:50%; font-size:0.8rem;" onclick="window.forceRefreshOrder('${order.id}')" title="Refresh"><i class="fa-solid fa-rotate-right"></i></button>
            </div>
        </div>
        <div class="receipt-body">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">
                <i class="fa-regular fa-clock"></i> ${new Date(order.date).toLocaleString('id-ID')}
            </div>
            <div style="border-left: 2px solid var(--primary); padding-left: 10px; margin-bottom: 15px;">
                ${order.items.map(i => `
                    <div style="font-weight: 600; color: var(--text);">${i.name}</div>
                `).join('')}
                ${detailGameHtml}
            </div>
            ${replyHtml}
        </div>
        <div class="receipt-footer">
            <div class="receipt-row">
                <span style="color:var(--text-muted);">Harga Normal</span>
                <span>Rp${(order.baseTotal + order.promoDiscount + (order.memberDiscountApplied || 0)).toLocaleString('id-ID')}</span>
            </div>
            ${order.memberDiscountApplied > 0 ? `
            <div class="receipt-row">
                <span style="color:var(--primary-light);"><i class="fa-solid fa-tags"></i> Potongan VIP</span>
                <span style="color:var(--primary-light);">-Rp${order.memberDiscountApplied.toLocaleString('id-ID')}</span>
            </div>` : ''}
            ${order.promoDiscount > 0 ? `
            <div class="receipt-row">
                <span style="color:var(--success);">Promo (${order.promoCode})</span>
                <span style="color:var(--success);">-Rp${order.promoDiscount.toLocaleString('id-ID')}</span>
            </div>` : ''}
            <div class="receipt-row">
                <span style="color:var(--warning);">Kode Unik</span>
                <span style="color:var(--warning);">+Rp${order.uniqueCode || 0}</span>
            </div>
            <div class="receipt-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">
                <strong style="font-size: 1.1rem; color: var(--text);">Total Bayar</strong>
                <strong style="font-size: 1.1rem; color: var(--primary-light);">Rp${order.finalTotal.toLocaleString('id-ID')}</strong>
            </div>
            ${actionHtml}
            ${helpHtml}
        </div>
    </div>`;
}

window.renderUserOrders = function() {
    const grid = document.getElementById('user-order-grid');
    if(!grid) return;
    
    if(!currentUser || currentUser.isAnonymous) {
        grid.innerHTML = '';
        return;
    }
    
    const userOrders = orders.filter(o => o.userEmail === currentUser.email);
    
    if(userOrders.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding: 2rem; color:var(--text-muted);">Belum ada riwayat pesanan.</div>'; return;
    }
    
    let html = '';
    const renderLimit = userOrders.slice(0, 50); 
    
    renderLimit.forEach((o, index) => {
        const sBadge = o.status === 'UNPAID' ? 'status-unpaid' : o.status === 'PENDING' ? 'status-pending' : o.status === 'FAILED' ? 'status-failed' : o.status === 'EXPIRED' ? 'status-failed' : 'status-success';
        const sName = o.status === 'UNPAID' ? 'Belum Dibayar' : o.status === 'PENDING' ? 'Proses Antrian' : o.status === 'FAILED' ? 'Dibatalkan' : o.status === 'EXPIRED' ? 'Waktu Expired' : 'Selesai';
        
        let replyHtml = '';
        if (o.status === 'SUCCESS') {
            if (o.adminReply) {
                replyHtml = `
                <div class="auto-delivery-box reveal-visible">
                    <div class="auto-delivery-title"><i class="fa-solid fa-envelope-open-text"></i> Detail Info Pesanan / Akun</div>
                    <div class="auto-delivery-data">${o.adminReply}</div>
                </div>`;
            } else {
                if (o.items[0]?.processType === 'manual') {
                    replyHtml = `
                    <div class="auto-delivery-box reveal-visible" style="border-color:var(--primary-light); background: rgba(37, 99, 235, 0.08);">
                        <div class="auto-delivery-title" style="color:var(--primary-light);"><i class="fa-solid fa-user-clock"></i> Proses Manual Admin</div>
                        <div class="auto-delivery-data" style="color:var(--text-muted); background:transparent; border:none; padding:0;">Pembayaran berhasil terverifikasi. Pesanan ini diproses secara manual.</div>
                    </div>`;
                } else {
                    replyHtml = `
                    <div class="auto-delivery-box reveal-visible" style="border-color:var(--warning);">
                        <div class="auto-delivery-title" style="color:var(--warning);"><i class="fa-solid fa-clock"></i> Menunggu Stok Sistem</div>
                        <div class="auto-delivery-data" style="color:var(--text-muted); background:transparent; border:none; padding:0;">Pembayaran sukses, namun stok otomatis saat ini sedang antre untuk diproses oleh sistem.</div>
                    </div>`;
                }
            }
        }
        
        let detailGameHtml = '';
        if (o.items[0]?.type === 'game') {
            detailGameHtml = `
            <div style="background:rgba(37,99,235,0.05); padding:10px; border-radius:8px; border:1px dashed var(--primary-light); margin-top:5px;">
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom: 2px;">Data / Tujuan Game:</div>
                <div style="font-size:0.85rem; color:var(--text); font-weight:600;">${o.items[0].playerInfo}</div>
            </div>`;
        } else {
            detailGameHtml = `<div style="font-size: 0.8rem; color: var(--text-muted);">${o.items[0].playerInfo}</div>`;
        }

        let actionHtml = (o.status === 'UNPAID') 
             ? `<button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="window.resumePayment('${o.dbId}')">Lanjut Selesaikan Pembayaran</button>`
             : '';
             
        const helpHtml = generateHelpButtons(o.id, o.status, o.items[0]);
        const animDelay = (index * 0.1) + 's';
        
        html += `
            <div class="receipt-card receipt-anim" style="animation-delay: ${animDelay}; width: 100%; position:relative; margin-bottom:1rem;">
                <div class="receipt-header">
                    <div>
                        <div style="color:var(--text-muted); font-size: 0.75rem;">INVOICE</div>
                        <div style="color:var(--primary-light); font-weight: 800; font-size: 1.1rem; letter-spacing: 1px;">${o.id}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="status-badge ${sBadge}">${sName}</span>
                        <button class="btn btn-outline" style="padding:4px 8px; border-radius:50%; font-size:0.8rem;" onclick="window.refreshOrderData()" title="Refresh"><i class="fa-solid fa-rotate-right"></i></button>
                    </div>
                </div>
                <div class="receipt-body">
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 15px;">
                        <i class="fa-regular fa-clock"></i> ${new Date(o.date).toLocaleString('id-ID')}
                    </div>
                    <div style="border-left: 2px solid var(--primary); padding-left: 10px; margin-bottom: 15px;">
                        ${o.items.map(i => `
                            <div style="font-weight: 600; color: var(--text);">${i.name}</div>
                        `).join('')}
                        ${detailGameHtml}
                    </div>
                    ${replyHtml}
                </div>
                <div class="receipt-footer">
                    <div class="receipt-row">
                        <span style="color:var(--text-muted);">Harga Normal</span>
                        <span>Rp${(o.baseTotal + o.promoDiscount + (o.memberDiscountApplied || 0)).toLocaleString('id-ID')}</span>
                    </div>
                    ${o.memberDiscountApplied > 0 ? `
                    <div class="receipt-row">
                        <span style="color:var(--primary-light);"><i class="fa-solid fa-tags"></i> Potongan VIP</span>
                        <span style="color:var(--primary-light);">-Rp${o.memberDiscountApplied.toLocaleString('id-ID')}</span>
                    </div>` : ''}
                    ${o.promoDiscount > 0 ? `
                    <div class="receipt-row">
                        <span style="color:var(--success);">Promo (${o.promoCode})</span>
                        <span style="color:var(--success);">-Rp${o.promoDiscount.toLocaleString('id-ID')}</span>
                    </div>` : ''}
                    <div class="receipt-row">
                        <span style="color:var(--warning);">Kode Unik</span>
                        <span style="color:var(--warning);">+Rp${o.uniqueCode || 0}</span>
                    </div>
                    <div class="receipt-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">
                        <strong style="font-size: 1.1rem; color: var(--text);">Total Bayar</strong>
                        <strong style="font-size: 1.1rem; color: var(--primary-light);">Rp${o.finalTotal.toLocaleString('id-ID')}</strong>
                    </div>
                    ${actionHtml}
                    ${helpHtml}
                </div>
            </div>`;
    });
    
    if(userOrders.length > 50) {
        html += `<div style="text-align:center; padding: 1rem; color:var(--text-muted);">Menampilkan 50 riwayat pesanan terbaru.</div>`;
    }
    
    grid.innerHTML = html;
    setTimeout(observeReveals, 100);
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
window.toggleAdminDashboard = (show) => {
    if(show && !isAdminLoggedIn) { window.customAlert("Ditolak", "Anda bukan Admin.", "error"); return; }
    
    document.getElementById('store-view').style.display = show ? 'none' : 'block';
    document.getElementById('admin-dashboard').style.display = show ? 'flex' : 'none';
    
    if(show) { 
        window.populateAdminSettings();
        window.renderAdminOrders();
        window.renderAdminProducts();
        window.renderAdminNews();
        window.renderAdminPromos();
        window.renderAdminChatList();
        window.renderAdminStocks();
        window.renderAdminMembers();
        window.generateAdminReports();
        
        // Auto-close sidebar on mobile
        if(window.innerWidth <= 768) {
            document.getElementById('admin-sidebar').classList.remove('active');
        }
    }
    if(!show) { observeReveals(); window.scrollTo({ top: 0, behavior: 'instant' }); } 
}

window.switchAdminTab = function(tabId, btnEl) {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    btnEl.classList.add('active');
    document.getElementById(tabId).style.display = 'block';
    
    const titleText = btnEl.querySelector('span') ? btnEl.querySelector('span').innerText : 'Dashboard Admin';
    const pageTitle = document.getElementById('admin-page-title');
    if(pageTitle) pageTitle.innerText = titleText;
    
    // Auto-close sidebar on mobile after clicking tab
    if(window.innerWidth <= 768) {
        const sidebar = document.getElementById('admin-sidebar');
        if(sidebar) sidebar.classList.remove('active');
    }
}

window.updateAdminStockItemSelect = function() {
    const brandName = document.getElementById('stock-brand-select').value;
    const itemSel = document.getElementById('stock-item-select');
    
    let html = '<option value="">-- Pilih Varian Item --</option>';
    if(!brandName) { itemSel.innerHTML = html; return; }
    
    const brand = groupedBrands.find(b => b.brandName === brandName);
    if(brand) {
        brand.items.forEach(i => {
            html += `<option value="${i.name}">${i.name}</option>`;
        });
    }
    itemSel.innerHTML = html;
}

window.renderAdminStocks = function() {
    const sel = document.getElementById('stock-brand-select');
    const tb = document.getElementById('admin-stock-list');
    if(!sel || !tb) return;
    
    const appBrands = groupedBrands.filter(b => b.type === 'app');
    const curVal = sel.value;
    let selHtml = '<option value="">-- Pilih Produk/Aplikasi --</option>';
    appBrands.forEach(b => {
        selHtml += `<option value="${b.brandName}">${b.brandName}</option>`;
    });
    sel.innerHTML = selHtml;
    sel.value = curVal;
        
    if(stocks.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Stok kosong</td></tr>';
        return;
    }
    
    let sortedStocks = [...stocks].sort((a,b) => b.createdAt - a.createdAt);
    const renderLimit = sortedStocks.slice(0, 200);
    
    let html = '';
    renderLimit.forEach((s, i) => {
        const parts = s.data.split('|');
        const em = parts[0] || '-';
        const pw = parts[1] || '-'; 
        const dur = parts[2] || '-';
        
        const badge = s.status === 'Ready' ? '<span class="status-badge status-success">Ready</span>' : '<span class="status-badge status-failed">Terjual</span>';
        
        html += `<tr>
            <td>${i+1}</td>
            <td><strong>${s.brand}</strong><br><small style="color:var(--primary-light)">${s.itemName || '-'}</small></td>
            <td><strong>${em}</strong><br><small style="color:var(--text-muted)">${pw}</small></td>
            <td>${dur}</td>
            <td>${badge}</td>
            <td><button aria-label="Hapus Stok" class="btn btn-outline" style="color:var(--danger); padding:4px;" onclick="window.deleteStock('${s.dbId}')"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
    
    if(sortedStocks.length > 200) {
        html += `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Menampilkan 200 stok terbaru...</td></tr>`;
    }
    
    tb.innerHTML = html;
}

window.addStockMassal = async function() {
    const brand = document.getElementById('stock-brand-select').value;
    const itemName = document.getElementById('stock-item-select').value;
    const rawData = document.getElementById('stock-bulk-input').value.trim();
    
    if(!brand || !itemName || !rawData) {
        window.customAlert('Error', 'Pilih produk, varian item, dan masukkan data secara lengkap.', 'error');
        return;
    }
    const lines = rawData.split('\n').filter(l => l.trim() !== '');
    let count = 0;
    for(const line of lines) {
        const parts = line.split('|');
        if(parts.length >= 2) {
            await addDoc(collection(db, pathStocks), {
                brand: brand,
                itemName: itemName,
                data: line.trim(),
                status: 'Ready',
                createdAt: Date.now()
            });
            count++;
        }
    }
    document.getElementById('stock-bulk-input').value = '';
    window.customAlert('Sukses', `${count} Akun berhasil ditambahkan ke stok untuk varian ${itemName}.`, 'success');
}

window.deleteStock = async function(dbId) {
    window.openConfirm('Hapus Stok', 'Hapus stok akun ini secara permanen?', async (confirmed) => {
        if(confirmed) {
            await deleteDoc(doc(db, pathStocks, dbId));
            window.customAlert('Dihapus', 'Stok akun dihapus.', 'info');
        }
    }, 'delete');
}

window.renderAdminOrders = function() {
    const tbody = document.getElementById('admin-order-list');
    if(!tbody) return;
    
    const searchInput = document.getElementById('admin-search-order');
    let queryText = '';
    if(searchInput) queryText = searchInput.value.trim().toUpperCase();

    let filteredOrders = orders;
    if (queryText !== '') {
        filteredOrders = orders.filter(o => o.id.includes(queryText));
    }

    if(filteredOrders.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">${queryText ? 'Tidak ada invoice yang cocok' : 'Kosong'}</td></tr>`; 
        return; 
    }
    
    let renderLimit = filteredOrders.slice(0, 100);
    let html = '';
    renderLimit.forEach(o => {
        const sBadge = o.status === 'UNPAID' ? `<span class="status-badge status-unpaid">UNPAID</span>` : o.status === 'PENDING' ? `<span class="status-badge status-pending">PENDING</span>` : o.status === 'FAILED' ? `<span class="status-badge status-failed">FAILED</span>` : o.status === 'EXPIRED' ? `<span class="status-badge status-failed" style="background:rgba(239, 68, 68, 0.2);">EXPIRED</span>` : `<span class="status-badge status-success">SUCCESS</span>`;
        let itemsDesc = o.items.map(i => `${i.name} <br><span style="color:var(--text-muted);font-size:0.75rem">${i.playerInfo}</span>`).join('<br>');
        
        let promoDesc = '';
        if (o.memberDiscountApplied) promoDesc += `<br><small style="color:var(--primary-light);">Potongan VIP (-Rp${o.memberDiscountApplied})</small>`;
        if (o.promoCode) promoDesc += `<br><small style="color:var(--success);">Promo: ${o.promoCode} (-Rp${o.promoDiscount})</small>`;
        
        let paymentMethodStr = o.paymentMethod === 'cash' ? 'Cash/Manual' : 'QRIS';
        
        let actionBtn = '';
        if(o.status === 'PENDING' || o.status === 'UNPAID' || o.status === 'EXPIRED' || (o.status === 'SUCCESS' && !o.adminReply)) {
            let autoBtn = '';
            if (o.items[0]?.processType !== 'manual' && o.items[0]?.type !== 'membership') {
                autoBtn = `<button aria-label="ACC Auto" class="btn btn-success" style="padding:0.4rem 0.8rem; font-size:0.75rem; margin-right:4px;" onclick="window.adminAutoProcessOrder('${o.dbId}')" title="Terima & Kirim Otomatis"><i class="fa-solid fa-check"></i> Auto</button>`;
            }
            actionBtn = `
            ${autoBtn}
            <button aria-label="Proses Manual" class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="window.promptProcessOrder('${o.dbId}')" title="Proses Manual"><i class="fa-solid fa-bolt"></i> Manual</button>`;
        } else {
            actionBtn = `<span style="font-size:0.75rem;color:var(--text-muted)">Ditinjau/Selesai</span>`;
        }
            
        let deleteBtn = `<button aria-label="Hapus Order" class="btn btn-outline" style="padding:0.4rem; margin-left:4px; color:var(--danger); border-color:transparent;" title="Hapus Permanen" onclick="window.promptDeleteOrder('${o.dbId}', '${o.id}')"><i class="fa-solid fa-trash"></i></button>`;
        
        html += `<tr>
            <td><strong>${o.id}</strong></td>
            <td><small style="color:var(--text-muted)">${new Date(o.date).toLocaleDateString()}</small><br>${itemsDesc}${promoDesc}</td>
            <td>${o.customerWa}</td>
            <td>${paymentMethodStr}</td>
            <td>Rp${o.finalTotal.toLocaleString('id-ID')}</td>
            <td>${sBadge}</td>
            <td style="white-space:nowrap;">${actionBtn} ${deleteBtn}</td>
        </tr>`;
    });
    
    if (filteredOrders.length > 100) {
        html += `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Menampilkan 100 pesanan terbaru...</td></tr>`;
    }
    
    tbody.innerHTML = html;
}

window.adminAutoProcessOrder = async function(dbId) {
    const order = orders.find(o => o.dbId === dbId);
    if(!order) return;
    window.openConfirm('ACC Otomatis', `Yakin verifikasi pembayaran dan langsung kirim stok otomatis (jika ada) untuk pesanan <b>${order.id}</b>?`, async (confirmed) => {
        if(!confirmed) return;
        
        let reply = '';
        try {
            if(order.items[0].type === 'app') {
                const targetBrand = order.items[0].brandName;
                const exactItemName = order.items[0].exactItemName;
                
                const stockQ = query(collection(db, pathStocks), where("brand", "==", targetBrand), where("itemName", "==", exactItemName), where("status", "==", "Ready"));
                const stockSnap = await getDocs(stockQ);
                
                if (!stockSnap.empty) {
                    const readyStock = stockSnap.docs[0];
                    const stockData = readyStock.data();
                    const parts = stockData.data.split('|');
                    const em = parts[0] || '-';
                    const pw = parts[1] || '-';
                    const notes = parts[2] || '-';
                    reply = `Detail Akun Premium Kamu:\nEmail/NoHP: ${em}\nPassword: ${pw}\nDetail Tambahan: ${notes}\n\nTerima kasih telah berbelanja!`;
                    
                    await updateDoc(doc(db, pathStocks, readyStock.id), { status: 'Used', usedAt: Date.now(), orderId: order.id });
                } else {
                    window.customAlert('Stok Kosong', 'Gagal ACC Auto karena varian produk ini sedang tidak memiliki Stok "Ready". Silakan klik tombol "Manual" untuk membalasnya.', 'warning');
                    return;
                }
            } else {
                reply = 'Pesanan Top Up Game Anda telah berhasil diproses dan dikirim ke ID tujuan secara otomatis. Terima kasih!';
            }
            await updateDoc(doc(db, pathOrders, dbId), { status: 'SUCCESS', adminReply: reply });
            window.customAlert('Berhasil', 'Pesanan telah diverifikasi dan dikirim otomatis ke pelanggan.', 'success');
        } catch (error) {
            console.error(error);
            window.customAlert('Error', 'Terjadi masalah jaringan.', 'error');
        }
    }, 'success');
}

window.promptProcessOrder = function(dbId) {
    const order = orders.find(o => o.dbId === dbId);
    if(!order) return;
    
    document.getElementById('proc-inv').innerText = order.id;
    document.getElementById('proc-order-id').value = dbId;
    
    let defaultReply = '';
    if(order.items[0].type === 'membership') {
        defaultReply = `Paket VIP MEMBER+ berhasil diaktifkan. Terima kasih!`;
    }
    document.getElementById('proc-reply').value = defaultReply;
    
    const list = document.getElementById('proc-items-list');
    list.innerHTML = '<strong>Detail Item:</strong><ul style="margin-left:20px; font-size:0.85rem; color:var(--text);">' + order.items.map(i => `<li>${i.name} (${i.processType || 'auto'})<br><small style="color:var(--text-muted);">${i.playerInfo}</small></li>`).join('') + '</ul>';
    
    const hasApp = order.items.some(i => i.type === 'app');
    const stockSec = document.getElementById('proc-stock-section');
    const stockSel = document.getElementById('proc-stock-select');
    
    if(hasApp) {
        stockSec.style.display = 'block';
        let selHtml = '<option value="">-- Pilih Stok dari Database --</option>';
        
        const appItem = order.items.find(i => i.type === 'app');
        const targetBrand = appItem.brandName || appItem.name.split(' - ')[0];
        const exactItemName = appItem.exactItemName || appItem.name;
        const readyStocks = stocks.filter(s => s.brand === targetBrand && s.itemName === exactItemName && s.status === 'Ready');
        
        if(readyStocks.length === 0) {
            selHtml += '<option value="" disabled>Stok Varian Habis / Kosong!</option>';
        } else {
            readyStocks.forEach((s) => {
                const em = s.data.split('|')[0];
                selHtml += `<option value="${s.dbId}">${em} | [Ready]</option>`;
            });
        }
        stockSel.innerHTML = selHtml;
        
        stockSel.onchange = function() {
            const sId = this.value;
            if(!sId) return;
            const sData = stocks.find(x => x.dbId === sId);
            if(sData) {
                const parts = sData.data.split('|');
                document.getElementById('proc-reply').value = `Detail Akun Premium Kamu:\nEmail/NoHP: ${parts[0] || '-'}\nPassword: ${parts[1] || '-'}\nDetail Tambahan: ${parts[2] || '-'}`;
            }
        };
        if (readyStocks.length > 0) {
            stockSel.value = readyStocks[0].dbId;
            stockSel.onchange(); 
        }
    } else {
        stockSec.style.display = 'none';
    }
    
    window.openModal('modal-process-order');
}

window.markOrderComplete = async function(statusType) {
    if(!currentUser) return;
    const dbId = document.getElementById('proc-order-id').value;
    const reply = document.getElementById('proc-reply').value;
    
    const order = orders.find(o => o.dbId === dbId);
    
    if(statusType === 'SUCCESS') {
        if(order.items.some(i => i.type === 'app')) {
            const stockSel = document.getElementById('proc-stock-select');
            if(stockSel && stockSel.value) {
                const isExist = stocks.find(x => x.dbId === stockSel.value);
                if(isExist) {
                    await updateDoc(doc(db, pathStocks, stockSel.value), { status: 'Used', usedAt: Date.now(), orderId: order.id });
                }
            }
        }
        
        if(order.items[0].type === 'membership') {
            const userQ = query(collection(db, pathUsers), where("email", "==", order.userEmail));
            const userSnap = await getDocs(userQ);
            if(!userSnap.empty) {
                const uDoc = userSnap.docs[0];
                const curData = uDoc.data();
                
                let months = order.items[0].itemDuration || 1;
                let newExp = curData.tierExp || Date.now();
                if(newExp < Date.now()) newExp = Date.now();
                newExp += (months * 30 * 24 * 60 * 60 * 1000);
                
                await updateDoc(doc(db, pathUsers, uDoc.id), { tier: 'vip', tierExp: newExp });
            }
        }
    }
    await updateDoc(doc(db, pathOrders, dbId), { status: statusType, adminReply: reply });
    window.closeModal('modal-process-order');
    
    if(statusType === 'SUCCESS') window.customAlert('Sukses', 'Pesanan berhasil diproses manual.', 'success');
    else window.customAlert('Dibatalkan', 'Pesanan digagalkan.', 'info');
}

window.promptDeleteOrder = function(dbId, invoiceId) {
    if(!currentUser) return;
    window.openConfirm("Hapus Permanen", `Hapus seluruh riwayat Invoice ${invoiceId}?`, async (confirmed) => {
        if(confirmed) {
            await deleteDoc(doc(db, pathOrders, dbId));
            window.customAlert("Terhapus", `Invoice ${invoiceId} berhasil dihapus dari sistem.`, "success");
        }
    }, 'delete');
}

// ==========================================
// RINGKASAN DASHBOARD ADMIN
// ==========================================
window.generateAdminReports = function() {
    if (!isAdminLoggedIn) return;
    
    const successOrders = orders.filter(o => o.status === 'SUCCESS');
    const pendingOrdersCount = orders.filter(o => o.status === 'PENDING' || o.status === 'UNPAID').length;
    
    let totalRevenue = 0;
    let totalSales = successOrders.length;
    let productCountMap = {};
    
    successOrders.forEach(o => {
        totalRevenue += o.finalTotal;
        o.items.forEach(item => {
            if (!productCountMap[item.name]) {
                productCountMap[item.name] = { qty: 0, revenue: 0 };
            }
            productCountMap[item.name].qty += 1;
            productCountMap[item.name].revenue += item.priceNum;
        });
    });
    
    const revEl = document.getElementById('report-revenue');
    const saleEl = document.getElementById('report-sales');
    const pendEl = document.getElementById('report-pending');
    if(revEl) revEl.innerText = `Rp${totalRevenue.toLocaleString('id-ID')}`;
    if(saleEl) saleEl.innerText = totalSales;
    if(pendEl) pendEl.innerText = pendingOrdersCount;
    
    const sortedProducts = Object.entries(productCountMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
    const topTbody = document.getElementById('report-top-products');
    
    if(topTbody) {
        if (sortedProducts.length === 0) {
            topTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Belum ada penjualan.</td></tr>';
        } else {
            let html = '';
            sortedProducts.forEach(prod => {
                html += `
                <tr>
                    <td><strong>${prod[0]}</strong></td>
                    <td><span class="status-badge status-success">${prod[1].qty} Kali</span></td>
                    <td>Rp${prod[1].revenue.toLocaleString('id-ID')}</td>
                </tr>`;
            });
            topTbody.innerHTML = html;
        }
    }
}

window.renderAdminProducts = function() {
    const tbody = document.getElementById('admin-prod-list');
    if(!tbody) return;
    
    if(groupedBrands.length === 0) { tbody.innerHTML = `<div style="text-align:center; padding: 2rem; color:var(--text-muted);">Katalog kosong. Klik Tambah Grup Baru.</div>`; return; }
    
    let html = '';
    groupedBrands.forEach(b => {
        const imgHtml = b.imgUrlBase64 
             ? `<img src="${b.imgUrlBase64}" style="width:40px; height:40px; object-fit:cover; border-radius:8px;" loading="lazy" alt="${b.brandName}">`
             : `<div style="width:40px; height:40px; background:var(--primary); color:white; display:flex; justify-content:center; align-items:center; border-radius:8px; font-weight:bold;">${b.brandName.charAt(0)}</div>`;
             
        const itemsCount = b.items.length;
        const isSoldOut = b.items.every(i => i.soldOut);
        
        let statusBadgeHtml = isSoldOut ? '<span class="status-badge status-failed">Habis Semua</span>' : '<span class="status-badge status-success">Tersedia</span>';
        if (b.isGangguan) statusBadgeHtml = '<span class="status-badge status-failed" style="background:var(--warning); color:black; border-color:var(--warning);">Gangguan Server</span>';
        
        html += `
        <div style="background:var(--surface); border:1px solid var(--border); padding:1rem; border-radius:12px; display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    ${imgHtml}
                    <div>
                        <strong style="font-size:1.05rem;">${b.brandName}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${b.type === 'app' ? 'Aplikasi Premium' : 'Top Up Game'} &bull; ${itemsCount} Varian</span>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    ${statusBadgeHtml}
                    <button aria-label="Edit Grup" class="btn btn-outline" style="padding:6px 12px; font-size:0.8rem;" onclick="window.openProductGroupModal('${b.brandName}')"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button aria-label="Hapus Grup" class="btn btn-danger" style="padding:6px 12px; font-size:0.8rem;" onclick="window.deleteProductGroup('${b.brandName}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    });
    tbody.innerHTML = html;
}

window.toggleInputTypeBox = function() {
    const type = document.getElementById('manage-prod-type').value;
    const inputGroup = document.getElementById('group-tipe-input');
    if(type === 'game') {
        inputGroup.style.display = 'block';
    } else {
        inputGroup.style.display = 'none';
    }
}

window.selectInputType = function(val, el) {
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    el.querySelector('input').checked = true;
    
    const previewBox = document.getElementById('type-preview-box');
    if(val === 'id_only') previewBox.innerText = 'Contoh: 123456789 (9 digit Player ID)';
    else if(val === 'id_zone') previewBox.innerText = 'Player ID: 12345678 -> Zone ID: (1234)';
    else if(val === 'custom') previewBox.innerText = 'Contoh: Server Asia, Nama Karakter Viper';
}

window.openProductGroupModal = function(brandName = null) {
    currentGroupNominals = [];
    
    if(brandName) {
        const group = groupedBrands.find(b => b.brandName === brandName);
        if(group) {
            document.getElementById('modal-prod-title').innerHTML = '<i class="fa-solid fa-box-open"></i> Edit Grup Item';
            document.getElementById('manage-prod-old-brand').value = brandName;
            document.getElementById('manage-prod-type').value = group.type;
            document.getElementById('manage-prod-brand').value = group.brandName;
            document.getElementById('manage-prod-img-base64').value = group.imgUrlBase64 || '';
            document.getElementById('manage-prod-desc').value = group.desc || '';
            document.getElementById('manage-prod-file-name').innerText = group.imgUrlBase64 ? 'Gambar tersimpan' : 'Belum ada gambar';
            
            const gangguanEl = document.getElementById('manage-prod-gangguan');
            if(gangguanEl) gangguanEl.checked = group.isGangguan || false;
            
            currentGroupNominals = group.items.map(i => ({ 
                dbId: i.dbId, 
                name: i.name, 
                priceNum: i.priceNum, 
                processType: i.processType || 'auto',
                soldOut: i.soldOut || false 
            }));
            
            const allSoldOut = currentGroupNominals.length > 0 && currentGroupNominals.every(n => n.soldOut);
            document.getElementById('manage-prod-soldout').checked = allSoldOut;

            let inpType = group.items[0]?.inputType || 'id_zone';
            const targetEl = document.querySelector(`.type-card input[value="${inpType}"]`);
            if(targetEl) window.selectInputType(inpType, targetEl.parentElement);
        }
    } else {
        document.getElementById('modal-prod-title').innerHTML = '<i class="fa-solid fa-box-open"></i> Tambah Item Baru';
        document.getElementById('manage-prod-old-brand').value = '';
        document.getElementById('manage-prod-type').value = 'game';
        document.getElementById('manage-prod-brand').value = '';
        document.getElementById('manage-prod-desc').value = '';
        document.getElementById('manage-prod-img-base64').value = '';
        document.getElementById('manage-prod-file-name').innerText = 'Belum ada gambar';
        document.getElementById('manage-prod-soldout').checked = false;
        
        const gangguanEl = document.getElementById('manage-prod-gangguan');
        if(gangguanEl) gangguanEl.checked = false;
        
        const defaultEl = document.querySelector(`.type-card input[value="id_zone"]`);
        if(defaultEl) window.selectInputType('id_zone', defaultEl.parentElement);
    }
    
    window.toggleInputTypeBox();
    window.clearTempNominalInput();
    window.renderTempNominals();
    window.openModal('modal-manage-product');
}

window.clearTempNominalInput = function() {
    document.getElementById('temp-nom-name').value = '';
    document.getElementById('temp-nom-price').value = '';
    document.getElementById('temp-nom-status').value = 'auto';
    document.getElementById('temp-nom-index').value = '-1';
    
    document.getElementById('btn-add-item').innerHTML = '<i class="fa-solid fa-plus"></i> Tambah ke Daftar';
    document.getElementById('btn-cancel-edit-item').style.display = 'none';
}

window.editTempNominal = function(idx) {
    const item = currentGroupNominals[idx];
    if(!item) return;
    document.getElementById('temp-nom-name').value = item.name;
    document.getElementById('temp-nom-price').value = item.priceNum;
    document.getElementById('temp-nom-status').value = item.processType;
    document.getElementById('temp-nom-index').value = idx;
    
    document.getElementById('btn-add-item').innerHTML = '<i class="fa-solid fa-check"></i> Update Item';
    document.getElementById('btn-cancel-edit-item').style.display = 'block';
}

window.addOrUpdateTempNominal = function() {
    const idx = parseInt(document.getElementById('temp-nom-index').value);
    const name = document.getElementById('temp-nom-name').value.trim();
    const priceNum = parseInt(document.getElementById('temp-nom-price').value) || 0;
    const processType = document.getElementById('temp-nom-status').value || 'auto';

    if(!name || priceNum <= 0) {
        window.customAlert('Error', 'Nama Item dan Harga Jual wajib diisi dan valid.', 'error');
        return;
    }
    
    if (idx >= 0) {
        currentGroupNominals[idx].name = name;
        currentGroupNominals[idx].priceNum = priceNum;
        currentGroupNominals[idx].processType = processType;
    } else {
        currentGroupNominals.push({ dbId: null, name, priceNum, processType, soldOut: false });
    }
    
    window.clearTempNominalInput();
    document.getElementById('manage-prod-soldout').checked = false; 
    window.renderTempNominals();
}

window.removeTempNominal = function(index) {
    currentGroupNominals.splice(index, 1);
    window.renderTempNominals();
}

window.toggleIndividualSoldOut = function(index, isChecked) {
    currentGroupNominals[index].soldOut = isChecked;
    const allSoldOut = currentGroupNominals.length > 0 && currentGroupNominals.every(n => n.soldOut);
    document.getElementById('manage-prod-soldout').checked = allSoldOut;
}

window.toggleAllSoldOut = function(isChecked) {
    currentGroupNominals.forEach(n => n.soldOut = isChecked);
    window.renderTempNominals();
}

window.renderTempNominals = function() {
    const container = document.getElementById('manage-prod-nominals-list');
    if(!container) return;
    
    if(currentGroupNominals.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#64748b; font-size:0.8rem; padding: 10px;">Belum ada nominal ditambahkan.</div>`;
        return;
    }
    
    const groupImg = document.getElementById('manage-prod-img-base64').value;
    const fallbackImg = `<div style="width:30px; height:30px; background:var(--primary); color:white; display:flex; justify-content:center; align-items:center; border-radius:6px; font-weight:bold; font-size:14px;">V</div>`;
    const finalImg = groupImg ? `<img src="${groupImg}" style="width:30px; height:30px; border-radius:6px; object-fit:cover;" alt="Icon">` : fallbackImg;

    let html = '';
    currentGroupNominals.forEach((nom, index) => {
        const isSold = nom.soldOut ? 'checked' : '';
        const badgeType = nom.processType === 'manual' ? `<span style="font-size:0.65rem; color:var(--warning); border:1px solid var(--warning); padding:1px 4px; border-radius:4px;">Manual</span>` : `<span style="font-size:0.65rem; color:var(--success); border:1px solid var(--success); padding:1px 4px; border-radius:4px;">Auto</span>`;
        
        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: transparent; padding: 10px 0; border-bottom: 1px solid var(--border);">
            <div style="display:flex; align-items:center; gap:10px;">
                ${finalImg}
                <div>
                    <div style="font-size: 0.85rem; font-weight: bold; color: var(--text);">${nom.name} ${badgeType}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Rp${nom.priceNum.toLocaleString('id-ID')}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" style="width:18px; height:18px; cursor:pointer; accent-color: var(--danger);" title="Tandai Habis Individual" onchange="window.toggleIndividualSoldOut(${index}, this.checked)" ${isSold}>
                <button aria-label="Edit Item" class="btn btn-outline" style="border: none; color: var(--primary-light); padding: 5px; font-size:1rem;" onclick="window.editTempNominal(${index})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button aria-label="Hapus Item" class="btn btn-outline" style="border: none; color: #ef4444; padding: 5px; font-size:1rem;" onclick="window.removeTempNominal(${index})" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

window.saveProductGroup = async function() {
    if(!currentUser) return;
    
    const type = document.getElementById('manage-prod-type').value;
    const brand = document.getElementById('manage-prod-brand').value.trim();
    const desc = document.getElementById('manage-prod-desc').value.trim();
    const imgBase64 = document.getElementById('manage-prod-img-base64').value;
    const oldBrand = document.getElementById('manage-prod-old-brand').value;
    
    const gangguanEl = document.getElementById('manage-prod-gangguan');
    const isGangguan = gangguanEl ? gangguanEl.checked : false;
    
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
            processType: nom.processType || 'auto',
            imgUrlBase64: imgBase64,
            desc: desc,
            soldOut: nom.soldOut,
            inputType: type === 'game' ? inputType : null,
            isGangguan: isGangguan 
        };
        if(nom.dbId) {
            await updateDoc(doc(db, pathProducts, nom.dbId), prodData);
        } else {
            await addDoc(collection(db, pathProducts), prodData);
        }
    }
    
    window.closeModal('modal-manage-product');
    window.customAlert('Sukses', `Seluruh item grup ${brand} tersimpan.`, 'success');
}

window.deleteProductGroup = function(brandName) {
    if(!currentUser) return;
    window.openConfirm("Hapus Grup", `Menghapus seluruh item ${brandName}?`, async (confirmed) => {
        if(confirmed) {
            const group = groupedBrands.find(b => b.brandName === brandName);
            if(group) {
                for(const item of group.items) {
                    await deleteDoc(doc(db, pathProducts, item.dbId));
                }
                window.customAlert('Sukses', `Semua Item ${brandName} telah dihapus.`, 'info');
            }
        }
    }, 'delete');
}

// ==========================================
// PROMO MANAGEMENT
// ==========================================
window.renderAdminPromos = function() {
    const tbody = document.getElementById('admin-promo-list');
    if(!tbody) return;
    
    if(promos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Belum ada kode promo</td></tr>';
        return;
    }

    let html = '';
    promos.forEach(p => {
        const typeStr = p.type === 'percent' ? `${p.amount}%` : `Rp${p.amount.toLocaleString('id-ID')}`;
        const targetStr = p.targetBrand === 'all' ? 'Semua Produk' : (p.targetBrand || 'Semua');
        
        let userTgt = 'Semua';
        if(p.targetUser === 'reseller') userTgt = 'Member+ VIP';
        if(p.targetUser === 'new') userTgt = 'User Baru';

        html += `<tr>
            <td><strong>${p.code}</strong></td>
            <td><span class="status-badge status-success">${typeStr}</span></td>
            <td>${targetStr}</td>
            <td><span style="color:var(--warning); font-size:0.8rem;">${userTgt}</span></td>
            <td>${p.usedCount || 0} / ${p.maxUses}</td>
            <td>${p.active ? '<span class="status-badge status-success">Aktif</span>' : '<span class="status-badge status-failed">Mati</span>'}</td>
            <td style="white-space:nowrap;">
                <button aria-label="Edit Promo" class="btn btn-outline" style="padding:0.4rem; font-size:0.75rem; margin-right:4px;" onclick="window.openPromoModal('${p.dbId}')"><i class="fa-solid fa-pen"></i></button>
                <button aria-label="Hapus Promo" class="btn btn-danger" style="padding:0.4rem; font-size:0.75rem;" onclick="window.deletePromo('${p.dbId}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

window.openPromoModal = function(dbId = null) {
    const targetSelect = document.getElementById('manage-promo-target');
    if (targetSelect) {
        let selHtml = '<option value="all">Semua Produk (Bebas)</option>';
        groupedBrands.forEach(b => {
            selHtml += `<option value="${b.brandName}">Khusus: ${b.brandName}</option>`;
        });
        targetSelect.innerHTML = selHtml;
    }

    if(dbId) {
        const p = promos.find(x => x.dbId === dbId);
        document.getElementById('modal-promo-title').innerText = 'Edit Promo';
        document.getElementById('manage-promo-id').value = p.dbId;
        document.getElementById('manage-promo-code').value = p.code;
        document.getElementById('manage-promo-type').value = p.type || 'nominal';
        document.getElementById('manage-promo-amount').value = p.amount;
        document.getElementById('manage-promo-max').value = p.maxUses;
        if(targetSelect) document.getElementById('manage-promo-target').value = p.targetBrand || 'all';
        if(document.getElementById('manage-promo-user')) document.getElementById('manage-promo-user').value = p.targetUser || 'all';
        document.getElementById('manage-promo-active').checked = p.active;
    } else {
        document.getElementById('modal-promo-title').innerText = 'Buat Promo Baru';
        document.getElementById('manage-promo-id').value = '';
        document.getElementById('manage-promo-code').value = '';
        document.getElementById('manage-promo-type').value = 'nominal';
        document.getElementById('manage-promo-amount').value = '';
        document.getElementById('manage-promo-max').value = '';
        if(targetSelect) document.getElementById('manage-promo-target').value = 'all';
        if(document.getElementById('manage-promo-user')) document.getElementById('manage-promo-user').value = 'all';
        document.getElementById('manage-promo-active').checked = true;
    }
    window.openModal('modal-manage-promo');
}

window.savePromo = async function() {
    if(!currentUser) return;
    const dbId = document.getElementById('manage-promo-id').value;
    
    const data = {
        code: document.getElementById('manage-promo-code').value.trim().toUpperCase(),
        type: document.getElementById('manage-promo-type').value,
        amount: parseInt(document.getElementById('manage-promo-amount').value) || 0,
        targetBrand: document.getElementById('manage-promo-target') ? document.getElementById('manage-promo-target').value : 'all',
        targetUser: document.getElementById('manage-promo-user') ? document.getElementById('manage-promo-user').value : 'all',
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
    
    window.closeModal('modal-manage-promo');
    window.customAlert('Sukses', 'Promo disimpan.', 'success');
}

window.deletePromo = function(dbId) {
    if(!currentUser) return;
    window.openConfirm("Hapus", "Hapus Promo ini?", async (confirmed) => {
        if(confirmed) {
            await deleteDoc(doc(db, pathPromos, dbId));
            window.customAlert('Sukses', 'Promo Dihapus.', 'success');
        }
    }, 'delete');
}

// ==========================================
// SETTINGS ADMIN
// ==========================================
window.saveSettingsManual = async function() {
    if(!isSettingsLoaded) return;
    
    const botQrisEl = document.getElementById('set-bot-qris');
    const newSettings = {
        ...siteSettings,
        logoText: document.getElementById('set-logo-text').value.trim(),
        logoAccent: document.getElementById('set-logo-accent').value.trim(),
        logoImgBase64: document.getElementById('set-logo-base64').value, 
        marquee: document.getElementById('set-marquee').value.trim(),
        adminWa: document.getElementById('set-wa').value.trim(),
        igLink: document.getElementById('set-ig').value.trim(),
        ttLink: document.getElementById('set-tt').value.trim(),
        qrisImageBase64: document.getElementById('set-qris-base64').value,
        waChannelLink: document.getElementById('set-wa-channel') ? document.getElementById('set-wa-channel').value.trim() : '',
        isStoreOpen: document.getElementById('set-store-status') ? document.getElementById('set-store-status').checked : true,
        botQrisActive: botQrisEl ? botQrisEl.checked : siteSettings.botQrisActive
    };
    await updateDoc(doc(db, pathSettings, 'mainConfig'), newSettings);
}

window.saveMemberSettings = async function() {
    const memSettings = {
        price: parseInt(document.getElementById('set-member-price').value) || 50000,
        disc: parseFloat(document.getElementById('set-member-disc').value) || 5
    };
    await updateDoc(doc(db, pathSettings, 'mainConfig'), { membership: memSettings });
    window.customAlert('Sukses', 'Pengaturan harga & diskon Member+ VIP berhasil disimpan.', 'success');
}

window.populateAdminSettings = function() {
    document.getElementById('set-logo-text').value = siteSettings.logoText || '';
    document.getElementById('set-logo-accent').value = siteSettings.logoAccent || '';
    document.getElementById('set-logo-base64').value = siteSettings.logoImgBase64 || '';
    
    document.getElementById('set-marquee').value = siteSettings.marquee || '';
    document.getElementById('set-wa').value = siteSettings.adminWa || '';
    document.getElementById('set-ig').value = siteSettings.igLink || '';
    document.getElementById('set-tt').value = siteSettings.ttLink || '';
    document.getElementById('set-qris-base64').value = siteSettings.qrisImageBase64 || '';
    
    if(document.getElementById('set-wa-channel')) document.getElementById('set-wa-channel').value = siteSettings.waChannelLink || '';
    
    const storeStatusEl = document.getElementById('set-store-status');
    if(storeStatusEl) storeStatusEl.checked = siteSettings.isStoreOpen !== false;

    const botQrisEl = document.getElementById('set-bot-qris');
    if(botQrisEl) botQrisEl.checked = siteSettings.botQrisActive || false;
    
    const memSettings = siteSettings.membership || { price: 50000, disc: 5 };
    const pEl = document.getElementById('set-member-price');
    if(pEl) pEl.value = memSettings.price;
    const dEl = document.getElementById('set-member-disc');
    if(dEl) dEl.value = memSettings.disc;

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
}

// LISTENERS AMAN UNTUK UPLOAD GAMBAR
const qrisUploadEl = document.getElementById('set-qris-upload');
if(qrisUploadEl) {
    qrisUploadEl.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            document.getElementById('set-qris-file-name').innerText = e.target.files[0].name;
            window.resizeImageBase64(e.target.files[0], (b64) => {
                document.getElementById('set-qris-base64').value = b64;
                const p = document.getElementById('set-qris-preview');
                p.src = b64; p.style.display = 'block';
                window.saveSettingsManual();
            }, 800, 800);
        }
    });
}

const logoUploadEl = document.getElementById('logo-upload');
if(logoUploadEl) {
    logoUploadEl.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            document.getElementById('set-logo-file-name').innerText = e.target.files[0].name;
            window.resizeImageBase64(e.target.files[0], (b64) => {
                document.getElementById('set-logo-base64').value = b64; 
                const p = document.getElementById('set-logo-preview');
                p.src = b64; p.style.display = 'block';
                window.saveSettingsManual(); 
            }, 800, 800);
        }
    });
}

const bannerUploadEl = document.getElementById('banner-upload');
if(bannerUploadEl) {
    bannerUploadEl.addEventListener('change', function(e) {
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
}

const manageProdImgEl = document.getElementById('manage-prod-img-file');
if(manageProdImgEl) {
    manageProdImgEl.addEventListener('change', function(e) {
        if (e.target.files[0]) {
            document.getElementById('manage-prod-file-name').innerText = e.target.files[0].name;
            window.resizeImageBase64(e.target.files[0], (b64) => {
                document.getElementById('manage-prod-img-base64').value = b64;
                window.renderTempNominals(); 
            }, 800, 800);
        }
    });
}

window.renderAdminBanners = function() {
    const list = document.getElementById('admin-banner-list');
    if(!list) return;
    const banners = siteSettings.banners || [];
    if(banners.length === 0){
        list.innerHTML = '<span style="color:var(--text-muted); font-size:0.85rem;">Belum ada banner.</span>';
        return;
    }
    
    let html = '';
    banners.forEach((b64, idx) => {
        html += `
        <div style="position:relative; border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-bottom: 10px;">
            <img src="${b64}" style="width:100%; height:100px; object-fit:cover;" loading="lazy" alt="Banner">
            <button aria-label="Hapus Banner" class="btn btn-danger" style="position:absolute; top:5px; right:5px; padding:5px 8px;" onclick="window.deleteBanner(${idx})"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    });
    list.innerHTML = html;
}

window.deleteBanner = async function(idx) {
    window.openConfirm('Hapus', 'Hapus banner ini?', async (confirmed) => {
        if(confirmed) {
            const banners = siteSettings.banners || [];
            banners.splice(idx, 1);
            await updateDoc(doc(db, pathSettings, 'mainConfig'), { banners: banners });
            siteSettings.banners = banners;
            window.renderAdminBanners();
            window.renderBanners();
            window.customAlert('Dihapus', 'Banner telah dihapus', 'info');
        }
    }, 'delete');
}

// ==========================================
// KELOLA DAFTAR MEMBER (ADMIN)
// ==========================================
window.renderAdminMembers = function() {
    const tbody = document.getElementById('admin-member-list');
    if(!tbody) return;
    
    if(allUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Belum ada member.</td></tr>';
        return;
    }
    
    let html = '';
    allUsers.forEach(u => {
        const tier = u.tier || 'bronze';
        const exp = u.tierExp || 0;
        
        let color = tier==='bronze'?'#94a3b8': '#f59e0b';
        const badge = `<span style="background:rgba(0,0,0,0.2); border:1px solid ${color}; color:${color}; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; text-transform:uppercase;">${tier}</span>`;
        
        let expStr = tier === 'bronze' ? '-' : (exp > Date.now() ? new Date(exp).toLocaleDateString() : '<span style="color:var(--danger)">Expired</span>');
        let trxCount = orders.filter(o => o.userEmail === u.email && o.status === 'SUCCESS').length;
        
        const actBtn = `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; border-color:var(--primary-light); color:var(--primary-light);" onclick="window.adminEditUserTier('${u.uid}')"><i class="fa-solid fa-pen"></i> Edit Status</button>`;
        
        html += `
        <tr>
            <td><strong>${u.name || 'User'}</strong><br><small style="color:var(--text-muted)">${u.email}</small></td>
            <td>${badge}</td>
            <td><small>${expStr}</small></td>
            <td>${trxCount}</td>
            <td style="white-space:nowrap;">${actBtn}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

window.adminEditUserTier = function(uid) {
    let u = allUsers.find(x => x.uid === uid);
    if(!u) return;
    
    window.openConfirm('Edit Status Member', `Pilih status paket untuk <b>${u.email}</b>:<br><br>
        <button class="btn btn-primary" style="width:100%; margin-bottom:8px; background:var(--warning); color:black; border:none;" onclick="window.forceSetTier('${uid}', 'vip')">Berikan Akses VIP (30 Hari)</button>
        <button class="btn btn-outline" style="width:100%; color:var(--danger); border-color:var(--danger);" onclick="window.forceSetTier('${uid}', 'bronze')">Reset ke BASIC (Bronze)</button>
    `, (res) => {}, 'info');
}

window.forceSetTier = async function(uid, tier) {
    let exp = 0;
    if(tier === 'vip') {
        exp = Date.now() + (30 * 24 * 60 * 60 * 1000); 
    }
    await updateDoc(doc(db, pathUsers, uid), { tier: tier, tierExp: exp });
    window.closeModal('modal-confirm');
    window.customAlert('Sukses', `Tier berhasil diubah menjadi ${tier.toUpperCase()}`, 'success');
}

// ==========================================
// NEWS / BERITA 
// ==========================================
window.renderAdminNews = function() {
    const list = document.getElementById('admin-news-list');
    if(!list) return;
    
    const newsData = siteSettings.newsList || [];
    if(newsData.length === 0) { list.innerHTML = '<p style="color:var(--text-muted)">Belum ada info komunitas.</p>'; return; }
    
    let html = '';
    newsData.forEach((t, i) => {
        html += `<div style="background:var(--surface); border:1px solid var(--border); padding:1rem; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div><strong>${t.title}</strong><br><small style="color:var(--text-muted)">Info/Promo</small></div>
            <div>
                <button aria-label="Edit Info" class="btn btn-outline" style="margin-right:4px;" onclick="window.openNewsModal(${i})"><i class="fa-solid fa-pen"></i></button>
                <button aria-label="Hapus Info" class="btn btn-danger" onclick="window.deleteNews(${i})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

window.openNewsModal = function(index = -1) {
    document.getElementById('manage-news-index').value = index;
    
    if (index > -1 && siteSettings.newsList && siteSettings.newsList[index]) {
        const news = siteSettings.newsList[index];
        document.getElementById('manage-news-title').value = news.title || '';
        document.getElementById('manage-news-image').value = news.imageUrl || '';
        document.getElementById('manage-news-desc').value = news.desc || '';
        document.getElementById('modal-news-title').innerText = "Edit Berita / Info";
    } else {
        document.getElementById('manage-news-title').value = '';
        document.getElementById('manage-news-image').value = '';
        document.getElementById('manage-news-desc').value = '';
        document.getElementById('modal-news-title').innerText = "Tambah Berita / Info";
    }
    window.openModal('modal-manage-news');
}

window.handleNewsUpload = function(event) {
    const file = event.target.files[0];
    if(!file) return;
    window.resizeImageBase64(file, (b64) => {
        document.getElementById('manage-news-image').value = b64;
        window.customAlert('Berhasil', 'Gambar berhasil dimuat dari perangkat HP Anda.', 'success');
    }, 800, 600);
}

window.saveNews = async function() {
    const idx = parseInt(document.getElementById('manage-news-index').value);
    const title = document.getElementById('manage-news-title').value.trim();
    const imageUrl = document.getElementById('manage-news-image').value.trim();
    const desc = document.getElementById('manage-news-desc').value.trim();
    
    if(!title || !desc) { window.customAlert('Error', 'Judul dan Konten wajib diisi.', 'error'); return; }
    
    const newsList = siteSettings.newsList ? [...siteSettings.newsList] : [];
    
    if (idx > -1) {
        newsList[idx] = { title, imageUrl, desc, isHidden: false };
    } else {
        newsList.push({ title, imageUrl, desc, isHidden: false });
    }
    
    await updateDoc(doc(db, pathSettings, 'mainConfig'), { newsList: newsList });
    window.closeModal('modal-manage-news');
    window.customAlert('Sukses', 'Berita berhasil disimpan.', 'success');
}

window.deleteNews = async function(index) {
    window.openConfirm('Hapus Info', 'Hapus berita/informasi ini secara permanen?', async (confirmed) => {
        if(confirmed) {
            const newsList = [...siteSettings.newsList];
            newsList.splice(index, 1);
            await updateDoc(doc(db, pathSettings, 'mainConfig'), { newsList: newsList });
            window.customAlert('Dihapus', 'Berita berhasil dihapus.', 'info');
        }
    }, 'delete');
}

// Inisialisasi Aplikasi
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
