// 🔹 IMPORT SOTI NAN FIREBASE-J.JS AK SDK YO (v12.15.0)
import { db, auth } from "/firebase-j.js";
import { ref, get, update, onValue } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

// Nou pran ID kou a nan URL la pou nou konnen ki kontni pou n chaje
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id') || "default_course"; 

let userId = localStorage.getItem("gp_user");
let sessionId = localStorage.getItem("gp_session") || "session_" + Math.random().toString(36).substring(2, 10);
localStorage.setItem("gp_session", sessionId);

const loading = (show) => {
    const overlay = document.getElementById("loadingOverlay");
    if(overlay) overlay.classList.toggle("hidden", !show);
};
const authOverlay = document.getElementById("authOverlay");

// KREYE MODIL YO OTOMATIKMAN NAN DASHBOARD LA
const container = document.getElementById("modulesContainer");
if(container && container.children.length === 0) {
    for(let i=2; i<=15; i++) {
        container.innerHTML += `
            <div id="module${i}" class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 locked transition-all">
                <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h2 class="font-bold text-lg text-slate-700">Modil ${i}</h2>
                    <div class="flex gap-2">
                         <button onclick="toggleFullScreen('vid${i}')" class="bg-slate-800 text-white p-1.5 rounded text-[10px] font-bold">🔳 Full</button>
                         <button onclick="rotateVideo('vid${i}')" class="bg-slate-100 border border-slate-200 text-slate-700 p-1.5 rounded text-[10px] font-bold">🔄 Vire</button>
                         <button onclick="unlockMod(${i})" id="lockBtn${i}" class="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-md text-xs font-black pointer-events-auto shadow-sm transition-colors">🔑 DEBLOKE</button>
                    </div>
                </div>
                <div class="aspect-video bg-slate-900 rounded-lg mb-2 flex items-center justify-center overflow-hidden shadow-inner relative group">
                    <video id="vid${i}" controls controlsList="nodownload" oncontextmenu="return false;" class="w-full h-full relative z-10 transition-all opacity-0"></video>
                </div>
                <div id="playlist${i}" class="flex flex-wrap gap-2 mb-4 empty:hidden"></div>
                
                <div class="flex gap-3">
                    <button onclick="openQuiz(${i})" class="bg-slate-200 text-slate-500 px-4 py-3 rounded-lg font-bold text-sm w-full cursor-not-allowed transition-colors" id="qBtn${i}" disabled>Egzamen pa disponib</button>
                    <a id="pdf${i}" href="#" target="_blank" class="hidden bg-red-50 text-red-600 font-bold border border-red-200 px-5 py-3 rounded-lg text-sm flex items-center gap-2 transition-colors hover:bg-red-100"><span class="text-lg">📄</span> PDF</a>
                </div>
            </div>`;
    }
}

// === SEKIRITE 1: TCHEKE FIREBASE AUTH SYNC AK INDEX LA ===
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("🔒 Ou dwe konekte anvan sou paj prensipal la pou w gen aksè ak sal klas la.");
        window.location.href = "/index.html"; 
    } else {
        if (authOverlay) authOverlay.style.display = "none";
        
        // Si itilizatè a pa gen yon ID elèv manyèl (gp_user), nou itilize UID Firebase li a kòm ID otomatik
        if (!userId) {
            userId = user.uid;
            localStorage.setItem("gp_user", userId);
        }
        
        activateStudentAccess();
    }
});

function activateStudentAccess() {
    const userStatus = document.getElementById("userStatus");
    const statusIndicator = document.getElementById("statusIndicator");
    const displayId = document.getElementById("displayId");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if(userStatus) {
        userStatus.innerText = "Elèv Enskri - Aksè Pèmèt";
        userStatus.className = "text-green-600 font-bold";
    }
    if(statusIndicator) {
        statusIndicator.className = "w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
    }
    if(displayId) {
        displayId.innerText = "ID: " + userId.substring(0, 10) + "...";
        displayId.classList.remove("hidden");
    }
    if(loginBtn) loginBtn.classList.add("hidden");
    if(logoutBtn) logoutBtn.classList.remove("hidden");
    
    startSessionSecurity();
    loadProgress();
}

function startSessionSecurity() {
    let alertShown = false;
    onValue(ref(db, "users/" + userId + "/activeSession"), (snap) => {
        if(snap.exists() && snap.val() !== sessionId && !alertShown) {
            alertShown = true;
            alert("⚠️ ALÈT SEKIRITE: Kont sa a konekte sou yon lòt aparèy.");
            localStorage.removeItem("gp_user");
            location.reload();
        }
    });
}

window.logout = () => {
    if(confirm("Èske w sèten ou vle dekonekte?")) {
        localStorage.removeItem("gp_user");
        signOut(auth).then(() => {
            window.location.href = "/index.html";
        }).catch((error) => {
            console.error(error);
        });
    }
};

window.changeVideo = (vidId, src) => {
    const v = document.getElementById(vidId);
    if(v) {
        v.src = src;
        v.play();
    }
};

let userProgress = {};
async function loadProgress() {
    if(!userId) return; 
    try {
        const snap = await get(ref(db, "users/" + userId));
        if(snap.exists()) { 
            userProgress = snap.val(); 
        } else {
            // Si itilizatè a fenk vini, nou ba li premye modil la pa defo
            userProgress = { module1: true };
        }
        await update(ref(db, "users/" + userId), { activeSession: sessionId, lastSeen: Date.now() });
        updateUI(); 
    } catch(e) { console.error(e); }
}

window.unlockMod = async (num) => {
    if(!userId) return alert("Ou dwe konekte anvan.");
    const prevModStatus = (num === 2) ? userProgress.module1 : userProgress["module" + (num - 1)];
    if(!prevModStatus) return alert(`Pase egzamen Modil ${num - 1} an anvan ou debloke sa a.`);
    
    const codeInput = prompt(`Antre kòd peman pou Modil ${num} :`);
    if(!codeInput) return;
    loading(true);
    try {
        const snap = await get(ref(db, "codes/" + userId));
        if(snap.exists()) {
            const dbVal = snap.val();
            const correctCode = (typeof dbVal === 'object') ? dbVal.code : dbVal;
            
            if(String(correctCode).trim() === codeInput.trim()) {
                await update(ref(db, "users/" + userId), { ["unlocked" + num]: true });
                alert("✅ Modil debloke ak siksè!");
                location.reload();
            } else { 
                alert("❌ Kòd la pa bon."); 
                loading(false); 
            }
        } else {
            alert("❌ Pa gen kòd ki anrejistre pou ID ou.");
            loading(false);
        }
    } catch(e) { 
        alert("Erè rezo."); 
        loading(false); 
    }
};

async function updateUI() {
    for(let i=2; i<=15; i++) {
        const isPreviousPassed = (i === 2) ? userProgress.module1 : userProgress["module"+(i-1)];
        if(userProgress["unlocked"+i] && isPreviousPassed) {
            const mDiv = document.getElementById("module"+i);
            if(!mDiv) continue;
            mDiv.classList.remove("locked");
            try {
                // Done yo chaje daprè ID kou a pou kontni an pa melanje
                const cSnap = await get(ref(db, `content/${courseId}/module${i}`));
                if(cSnap.exists()) {
                    const d = cSnap.val();
                    const v = document.getElementById("vid"+i);
                    const playlist = document.getElementById("playlist"+i);
                    
                    if(d.videos && Array.isArray(d.videos)) {
                        if(!v.src) { 
                            v.src = d.videos[0]; 
                            v.load(); 
                            v.classList.remove("opacity-0"); 
                        }
                        playlist.innerHTML = "";
                        d.videos.forEach((vidSrc, idx) => {
                            playlist.innerHTML += `<button onclick="changeVideo('vid${i}', '${vidSrc}')" class="bg-blue-50 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded text-xs font-bold border border-blue-200 transition-colors">▶ Pati ${idx + 1}</button>`;
                        });
                    } else if(d.video && !v.src) { 
                        v.src = d.video; 
                        v.load(); 
                        v.classList.remove("opacity-0"); 
                    }

                    if(d.pdf) { 
                        const pdfLink = document.getElementById("pdf"+i);
                        pdfLink.href = d.pdf; 
                        pdfLink.classList.remove("hidden"); 
                    }
                }
            } catch(e) { console.error("Erè kontni:", e); }

            const lockBtn = document.getElementById("lockBtn"+i);
            if(lockBtn) {
                lockBtn.innerText = "✔ AKSÈ PÈMÈT";
                lockBtn.className = "bg-green-100 text-green-700 border border-green-300 px-3 py-1 rounded text-xs font-bold pointer-events-none";
            }
            
            const qBtn = document.getElementById("qBtn"+i);
            if(qBtn) {
                qBtn.disabled = false;
                qBtn.innerText = "Pase Egzamen Modil " + i;
                qBtn.className = "bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold text-sm w-full transition-colors cursor-pointer shadow-sm";
                if(userProgress["module"+i]) {
                     qBtn.innerText = "★ Egzamen Reyisi";
                     qBtn.className = "bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-sm w-full pointer-events-none";
                }
            }
        }
    }
}

window.toggleFullScreen = (id) => {
    const v = document.getElementById(id);
    if (!document.fullscreenElement) { v.requestFullscreen?.() || v.webkitRequestFullscreen?.(); }
    else { document.exitFullscreen?.(); }
};

window.rotateVideo = (id) => document.getElementById(id).classList.toggle("rotate-90");

// BANK EGZAMEN AN
const quizBank = {
"1": [
    { q: "Si nou konpare yon sit entènèt ak yon kò moun, ki wòl HTML jwe?", a: "Li se po ak rad (Design)", b: "Li se skelèt la (Structure)", r: "b" },
    { q: "Kisa nou itilize pou bay yon sit entènèt 'Design', koulè, ak bèl aparans?", a: "CSS", b: "JavaScript", r: "a" },
    { q: "Ki langaj ki sèvi kòm 'Sèvo' sit la pou ba li entèlijans ak mouvman?", a: "HTML", b: "JavaScript", r: "b" },
    { q: "Kisa yon sit entènèt ye vreman?", a: "Yon koleksyon paj ki konekte ansanm", b: "Yon senp foto nou gade sou Google", r: "a" },
    { q: "Ki diferans ki genyen ant yon fichye ak yon dosye?", a: "Dosye a se yon bwat ki ka gen plizyè fichye ladan l", b: "Fichye a pi gwo pase dosye a toujou", r: "a" }
],
"2": [
    { q: "Ki balise ki toujou kòmanse yon dokiman HTML?", a: "!DOCTYPE html", b: "body", r: "a" },
    { q: "Ki pati nan HTML ki gen enfòmasyon ki pa parèt dirèkteman sou paj la?", a: "head", b: "body", r: "a" },
    { q: "Ki balise ki gen tout sa ki parèt sou paj entènèt la?", a: "meta", b: "body", r: "b" },
    { q: "Ki balise ki sèvi pou bay paj entènèt la yon tit?", a: "title", b: "html", r: "a" },
    { q: "Kisa yon balise ye nan HTML?", a: "Yon kòmand nou ekri ant siy pi piti ak pi gran", b: "Yon foto nou mete sou sit la", r: "a" },
    { q: "Ki balise ki vlope tout dokiman HTML la?", a: "html", b: "head", r: "a" },
    { q: "Ki balise ki sèvi pou mete enfòmasyon sou paj la tankou charset oswa description?", a: "meta", b: "title", r: "a" }
]
};

window.openQuiz = (m) => {
    const questions = quizBank[m];
    if(!questions) return alert("Egzamen sa poko disponib.");
    
    const modNumElem = document.getElementById("qModNum");
    if(modNumElem) modNumElem.innerText = m;
    
    const t = document.getElementById("quizContent");
    if(!t) return;
    t.innerHTML = "";
    
    questions.forEach((item, k) => {
        t.innerHTML += `
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm mb-3">
                <p class="font-bold text-slate-700 mb-3 text-sm">${k + 1}. ${item.q}</p>
                <div class="space-y-2">
                    <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
                        <input type="radio" name="q${k + 1}" value="a" class="w-4 h-4"> 
                        <span class="text-sm font-medium text-slate-600">${item.a}</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50 transition-colors">
                        <input type="radio" name="q${k + 1}" value="b" class="w-4 h-4"> 
                        <span class="text-sm font-medium text-slate-600">${item.b}</span>
                    </label>
                </div>
            </div>`;
    });
    
    const quizBox = document.getElementById("quizBox");
    if(quizBox) quizBox.classList.remove("hidden");
};

window.closeQuiz = () => {
    const quizBox = document.getElementById("quizBox");
    if(quizBox) quizBox.classList.add("hidden");
};
