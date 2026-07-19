// 🔹 IMPORT SOTI NAN FIREBASE-J.JS AK SDK YO (v12.15.0)
import { db, auth } from "/firebase-j.js";
import { ref, get, update, onValue, set } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id') || "web_debutant"; 

let userId = localStorage.getItem("gp_user"); // SE ID MANYÈL LA SÈLMAN
let sessionId = localStorage.getItem("gp_session") || "session_" + Math.random().toString(36).substring(2, 10);
localStorage.setItem("gp_session", sessionId);

const loading = (show) => {
    const overlay = document.getElementById("loadingOverlay");
    if(overlay) overlay.classList.toggle("hidden", !show);
};

// === SEKIRITE 1: TCHEKE FIREBASE AUTH ===
onAuthStateChanged(auth, async (user) => {
    const authOverlay = document.getElementById("authOverlay");
    if (!user) {
        alert("🔒 Ou dwe konekte sou sit la anvan pou w ka gen aksè ak paj sa.");
        window.location.href = "/index.html"; 
        return;
    }

    if (authOverlay) authOverlay.style.display = "none";
    
    // Afiche Enfòmasyon Itilizatè a (Non ak Imel soti nan Firebase)
    document.getElementById("userNameDisplay").innerText = user.displayName || "Elèv Global Plus";
    document.getElementById("userEmailDisplay").innerText = user.email;

    // TCHEKE SI ID MANYÈL LA RANTRE
    if (userId) {
        activateStudentAccess();
    } else {
        restrictAccessLayout();
    }
});

function restrictAccessLayout() {
    const userStatus = document.getElementById("userStatus");
    if(userStatus) {
        userStatus.innerText = "Poko gen ID elèv - Modil yo bloke";
        userStatus.className = "text-yellow-600 font-bold";
    }
    // Isit la, nou asire tout bagay rete vid nan navigatè a, Firebase pap voye anyen
    console.log("🔒 Aksè bloke: Yo dwe antre ID manyèl la pou kontni an chaje.");
}

function activateStudentAccess() {
    const userStatus = document.getElementById("userStatus");
    const displayId = document.getElementById("displayId");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if(userStatus) {
        userStatus.innerText = "Aksè Pèmèt";
        userStatus.className = "text-green-600 font-bold";
    }
    if(displayId) {
        displayId.innerText = "ID: " + userId;
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
            alert("⚠️ ALÈT: ID sa a konekte sou yon lòt aparèy.");
            localStorage.removeItem("gp_user");
            location.reload();
        }
    });
}

// BOUTON POU ITILIZATÈ A RANTRE ID MANYÈL ADMIN NAN TE BA LI A
window.enterManualID = async () => {
    const input = prompt("Antre ID Elèv sekirite ou an:");
    if(!input) return;
    const cleanInput = input.trim();
    
    loading(true);
    try {
        const userSnap = await get(ref(db, "users/" + cleanInput));
        const codeSnap = await get(ref(db, "codes/" + cleanInput));
        
        if(userSnap.exists() || codeSnap.exists()) {
            localStorage.setItem("gp_user", cleanInput);
            alert("✅ ID Valide! Klas la ap debloke kounye a.");
            location.reload();
        } else {
            alert("❌ ID sa a pa egziste nan baz done a.");
            loading(false);
        }
    } catch (error) {
        alert("Erè rezo.");
        loading(false);
    }
};

let userProgress = {};
async function loadProgress() {
    if(!userId) return; // SI PA GEN ID MANYÈL, FIREBASE PAP CHÈCHE ANYEN
    try {
        const snap = await get(ref(db, "users/" + userId));
        if(snap.exists()) { 
            userProgress = snap.val(); 
            // Mete enfòmasyon sesyon ak dènye fwa li vizite sal la
            await update(ref(db, "users/" + userId), { 
                activeSession: sessionId, 
                lastSeen: Date.now(),
                email: auth.currentUser.email,
                non: auth.currentUser.displayName || "Elèv"
            });
            updateUI(); 
            calculateStatistics();
        }
    } catch(e) { console.error(e); }
}

// KALKILE STATISTIK AK SÈTIFIKA
function calculateStatistics() {
    let totalModules = 14; // Soti nan Modil 2 rive 15
    let completed = 0;

    for (let i = 2; i <= 15; i++) {
        if (userProgress["module" + i] === true) {
            completed++;
        }
    }

    // Pwousantaj Pwogrè
    let percentage = Math.round((completed / totalModules) * 100);
    
    // Mizajou nan HTML la
    const progressText = document.getElementById("progressPercentage");
    const progressBar = document.getElementById("progressBar");
    if(progressText) progressText.innerText = `${percentage}%`;
    if(progressBar) progressBar.style.width = `${percentage}%`;

    // Voye estatistik yo bay Admin nan an tan reyèl nan Firebase
    if(userId) {
        update(ref(db, `users/${userId}/pwogrè_live`), {
            pousantaj: percentage,
            modil_fini: completed,
            dat_mizajou: Date.now()
        });
    }

    // KONDISYON POU BOUTON SÈTIFIKA A VIN VÈT
    const certifBtn = document.getElementById("certifBtn");
    if (certifBtn) {
        if (percentage === 100) {
            certifBtn.className = "bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2";
            certifBtn.disabled = false;
            certifBtn.innerHTML = "🎓 Telechaje Sètifika w (Fini)";
        } else {
            certifBtn.className = "bg-slate-200 text-slate-400 font-bold px-6 py-3 rounded-xl cursor-not-allowed flex items-center gap-2";
            certifBtn.disabled = true;
            certifBtn.innerHTML = "🔒 Sètifika (Fini tout modil yo anvan)";
        }
    }
}

// REKIPERE DONE SOU FIREBASE SÈLMAN SI ID A VALIDE
async function updateUI() {
    if (!userId) return; // Pwoteksyon total: Pa gen kòd ki ap egzekite pou li lyen yo si pa gen ID Manyèl
    
    // Modil 1 sipoze toujou debloke pa defo
    const userSnap = await get(ref(db, "users/" + userId));
    if(userSnap.exists() && !userSnap.val().module1) {
        await update(ref(db, "users/" + userId), { module1: true });
    }

    for(let i=2; i<=15; i++) {
        const isPreviousPassed = (i === 2) ? userProgress.module1 : userProgress["module"+(i-1)];
        
        if(userProgress["unlocked"+i] && isPreviousPassed) {
            const mDiv = document.getElementById("module"+i);
            if(!mDiv) continue;
            mDiv.classList.remove("locked");
            
            try {
                // Done yo ap soti nan chemen dinamik kou a
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
