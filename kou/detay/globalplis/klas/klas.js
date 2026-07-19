import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAgvH0CpF6tGISpfLw3JWJCT2beBG28wAM",
    authDomain: "kaylakay-cdf64.firebaseapp.com",
    databaseURL: "https://kaylakay-cdf64-default-rtdb.firebaseio.com/",
    projectId: "kaylakay-cdf64",
    storageBucket: "kaylakay-cdf64.appspot.com",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app); // INisyalize Auth la

let userId = localStorage.getItem("gp_user");
let sessionId = localStorage.getItem("gp_session") || "session_" + Math.random().toString(36).substring(2, 10);
localStorage.setItem("gp_session", sessionId);

const loading = (show) => document.getElementById("loadingOverlay").classList.toggle("hidden", !show);
const authOverlay = document.getElementById("authOverlay");

// === SEKIRITE 1: TCHEKE FIREBASE AUTH ===
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Moun nan pa konekte ditou sou kont Global Plis la
        alert("🔒 Ou dwe konekte ak kont prensipal ou pou w gen aksè ak paj sal klas la.");
        window.location.href = "/index.html"; // Voye l tounen sou paj akèy la
    } else {
        // Moun nan verifye nan Auth. Nou ka retire ekran nwa ki bloke a
        if (authOverlay) authOverlay.style.display = "none";
        
        // === SEKIRITE 2: TCHEKE ID INIK (KÒD ELÈV) ===
        if (userId) {
            activateStudentAccess();
        }
    }
});

function activateStudentAccess() {
    document.getElementById("userStatus").innerText = "Elèv Enskri - Aksè Pèmèt";
    document.getElementById("userStatus").className = "text-green-600";
    document.getElementById("statusIndicator").className = "w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
    document.getElementById("displayId").innerText = "ID: " + userId;
    document.getElementById("displayId").classList.remove("hidden");
    document.getElementById("loginBtn").classList.add("hidden");
    document.getElementById("logoutBtn").classList.remove("hidden");
    startSessionSecurity();
    loadProgress();
}

function startSessionSecurity() {
    let alertShown = false;
    onValue(ref(db, "users/" + userId + "/activeSession"), (snap) => {
        if(snap.exists() && snap.val() !== sessionId && !alertShown) {
            alertShown = true;
            alert("⚠️ ALÈT SEKIRITE: ID sa a fèk konekte sou yon lòt aparèy. Pou pwoteje kont ou, n ap dekonekte w isit la.");
            localStorage.removeItem("gp_user");
            location.reload();
        }
    });
}

window.login = async () => {
    const input = prompt("Antre ID ou oswa Nimewo Telefòn ou ki anrejistre pou klas la:");
    if(!input) return;
    const cleanInput = input.trim();
    if(cleanInput.length < 4) return alert("ID a twò kout.");
    loading(true);
    try {
        const userSnap = await get(ref(db, "users/" + cleanInput));
        const codeSnap = await get(ref(db, "codes/" + cleanInput));
        if(userSnap.exists() || codeSnap.exists()) {
            localStorage.setItem("gp_user", cleanInput);
            if(!userSnap.exists()) {
                await update(ref(db, "users/" + cleanInput), { module1: true, created: Date.now() });
            }
            location.reload();
        } else {
            alert("❌ ID pa anrejistre.");
            loading(false);
        }
    } catch (error) {
        alert("Erè rezo.");
        loading(false);
    }
};

window.logout = () => {
    if(confirm("Èske w sèten ou vle dekonekte nèt sou aparèy sa a?")) {
        localStorage.removeItem("gp_user");
        signOut(auth).then(() => {
            window.location.href = "/index.html";
        }).catch((error) => {
            console.error("Erè dekoneksyon:", error);
        });
    }
};

window.changeVideo = (vidId, src) => {
    const v = document.getElementById(vidId);
    v.src = src;
    v.play();
};

const container = document.getElementById("modulesContainer");
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

let userProgress = {};
async function loadProgress() {
    if(!userId) return; 
    try {
        const snap = await get(ref(db, "users/" + userId));
        if(snap.exists()) { 
            userProgress = snap.val(); 
            await update(ref(db, "users/" + userId), { activeSession: sessionId, lastSeen: Date.now() });
            updateUI(); 
        }
    } catch(e) { console.error(e); }
}

window.unlockMod = async (num) => {
    if(!userId) return alert("Ou dwe antre ID ou anvan.");
    const prevModStatus = (num === 2) ? userProgress.module1 : userProgress["module" + (num - 1)];
    if(!prevModStatus) return alert("Pase egzamen modil anvan an anvan ou debloke sa a.");
    
    const codeInput = prompt(`Kòd pou Modil ${num} :`);
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
                alert("❌ Kòd enkòrèk."); 
                loading(false); 
            }
        } else {
            alert("❌ Pa gen kòd ki anrejistre pou ID sa a.");
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
                const cSnap = await get(ref(db, "content/module"+i));
                if(cSnap.exists()) {
                    const d = cSnap.val();
                    const v = document.getElementById("vid"+i);
                    const playlist = document.getElementById("playlist"+i);
                    
                    if(d.videos && Array.isArray(d.videos)) {
                        if(!v.src) { 
                            v.src = "image/" + d.videos[0]; 
                            v.load(); 
                            v.classList.remove("opacity-0"); 
                        }
                        playlist.innerHTML = "";
                        d.videos.forEach((vidSrc, idx) => {
                            playlist.innerHTML += `<button onclick="changeVideo('vid${i}', 'image/${vidSrc}')" class="bg-blue-50 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded text-xs font-bold border border-blue-200 transition-colors">▶ Pati ${idx + 1}</button>`;
                        });
                    } else if(d.video && !v.src) { 
                        v.src = "image/" + d.video; 
                        v.load(); 
                        v.classList.remove("opacity-0"); 
                    }

                    if(d.pdf) { 
                        const pdfLink = document.getElementById("pdf"+i);
                        pdfLink.href = "image/"+d.pdf; 
                        pdfLink.classList.remove("hidden"); 
                    }
                }
            } catch(e) { console.error("Erè kontni:", e); }

            const lockBtn = document.getElementById("lockBtn"+i);
            lockBtn.innerText = "✔ AKSÈ PÈMÈT";
            lockBtn.className = "bg-green-100 text-green-700 border border-green-300 px-3 py-1 rounded text-xs font-bold pointer-events-none";
            
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

// KENBE QUIZ BANK OU AN ANTYE LA...
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
],
"3": [
    { q: "Ki balise ki sèvi pou ekri yon paragraf?", a: "p", b: "h1", r: "a" },
    { q: "Ki balise ki sèvi pou fè tèks la vin gra?", a: "b", b: "br", r: "a" },
    { q: "Ki balise ki sèvi pou kase liy epi desann anba?", a: "hr", b: "br", r: "b" },
    { q: "Ki balise ki sèvi pou fè yon liy orizontal?", a: "hr", b: "em", r: "a" },
    { q: "Ki balise ki sèvi pou fè tèks la italik?", a: "i", b: "strong", r: "a" },
    { q: "Ki balise ki sèvi pou mete yon lyen sou yon paj entènèt?", a: "a", b: "p", r: "a" },
    { q: "Ki balise ki reprezante pi gwo tit la nan HTML?", a: "h6", b: "h1", r: "b" },
    { q: "Ki balise ki sèvi pou bay plis enpòtans ak yon tèks?", a: "strong", b: "br", r: "a" }
],
"4": [
    { q: "Ki balise ki pèmèt nou afiche yon foto sou sit la?", a: "img", b: "video", r: "a" },
    { q: "Nan baliz img lan, ki atribi ki endike 'Kote foto a soti'?", a: "alt", b: "src", r: "b" },
    { q: "Ki balise nou itilize pou jwe mizik oswa odyo sou yon paj HTML?", a: "sound", b: "audio", r: "b" },
    { q: "Pou afiche yon videyo nan paj la, ki balise nou dwe itilize?", a: "video", b: "media", r: "a" },
    { q: "Kisa balise iframe lan fè?", a: "Li afiche yon lòt sit oswa yon videyo YouTube anndan paj ou a", b: "Li kreye yon liy vètikal nan paj la", r: "a" },
    { q: "Ki atribi nan imaj ki ede moun ki avèg yo tande kisa k nan foto a avèk yon lektè ekran?", a: "src", b: "alt", r: "b" }
],
"5": [
    { q: "Ki gwo balise ki kreye yon bwat kote kliyan yo ka ranpli enfòmasyon yo?", a: "form", b: "table", r: "a" },
    { q: "Ki balise nou itilize pou fè yon bwat kote moun ka tape tèks oswa imel?", a: "input", b: "textarea", r: "a" },
    { q: "Nan fòm nan, ki atribi ki deside *ki kote* done yo pral voye lè moun lan klike sou 'Voye'?", a: "action", b: "method", r: "a" },
    { q: "Ki atribi nan input ki kache modpas la an ti pwen nwa?", a: "type=\"password\"", b: "type=\"hidden\"", r: "a" },
    { q: "Ki atribi nan baliz lyen 'a' ki pèmèt ou ouvri yon paj lè w klike sou li?", a: "src", b: "href", r: "b" },
    { q: "Poukisa nou itilize method=\"POST\" nan yon fòm olye method=\"GET\"?", a: "Pou done sekrè yo (tankou modpas) pa parèt anlè nan lyen an", b: "Pou sit la ka pi rapid", r: "a" }
],
"6": [
    { q: "Kisa CSS vle di nan devlopman Web?", a: "Cascading Style Sheets", b: "Computer Style System", r: "a" },
    { q: "Poukisa nou itilize CSS?", a: "Pou bati estrikti a sèlman", b: "Pou bay paj la fòm, koulè, ak bèl aparans", r: "b" },
    { q: "Ki fason ki pi pwofesyonèl pou nou ekri kòd CSS nou yo?", a: "Nan yon fichye .css separe", b: "Dirèkteman anndan chak baliz HTML ak style=\"\"", r: "a" },
    { q: "Si m ekri selman `h3` nan yon kòd CSS, ki moun m ap chanje koulè li?", a: "M ap chanje koulè TOUT baliz h3 ki nan paj HTML la", b: "Yon sèl baliz mwen chwazi a", r: "a" },
    { q: "Poukisa pafwa nou mete yon pwen (.) devan yon mo nan CSS tankou `.kat-pwofil`?", a: "Pou di se yon Id li ye", b: "Pou di navigatè a se yon Klas (Class) li ye", r: "b" }
],
"7": [
    { q: "Ki pwopriyete CSS ki sèvi pou chanje koulè tèks la?", a: "color", b: "background-color", r: "a" },
    { q: "Ki pwopriyete CSS ki sèvi pou chanje koulè ki dèyè yon bwat la?", a: "color", b: "background-color", r: "b" },
    { q: "Nan CSS, kijan nou fè yon tèks vin pi gwo oswa pi piti?", a: "Avèk pwopriyete font-size", b: "Avèk pwopriyete text-align", r: "a" },
    { q: "Kisa valè sa a ye: `#002f6c`?", a: "Yon kòd koulè RGB", b: "Yon kòd koulè Heksadesimal", r: "b" },
    { q: "Ki pwopriyete ki retire liy ki toujou anba yon lyen otomatikman?", a: "text-decoration: none;", b: "text-transform: uppercase;", r: "a" }
],
"8": [
    { q: "Nan Box Model (Modèl Bwat) CSS la, kisa `padding` ye?", a: "Espas ki anndan bwat la pou tèks la respire", b: "Liy ki trase otou bwat la", r: "a" },
    { q: "Nan menm Box Model la, kisa `margin` ye?", a: "Espas ki andeyò bwat la ki pouse lòt bwat yo pa kole avè l", b: "Koulè ki nan bwat la", r: "a" },
    { q: "Ki pwopriyete CSS ki trase yon bèl liy/kad alantou bwat la?", a: "border", b: "padding", r: "a" },
    { q: "Si ou vle awondi kat kwen yon bwat nan CSS pou l pa parèt pwent, kisa w itilize?", a: "border-radius", b: "box-shadow", r: "a" },
    { q: "Kisa `border-radius: 50%;` fè sou yon foto ki kare?", a: "Li mete foto a nan mitan ekran an", b: "Li fè foto a tounen yon wonn pafè", r: "b" }
],
"9": [
    { q: "Pou ki gwo rezon pwofesyonèl nou itilize Flexbox nan CSS?", a: "Pou mete bwat yo kòt a kòt epi jere estrikti paj la byen fasil", b: "Pou chanje koulè paj la rapid", r: "a" },
    { q: "Lè nou itilize Flexbox, sou ki bwat nou dwe mete `display: flex;` la?", a: "Sou gwo bwat Kontenè a (Parent la)", b: "Sou chak ti bwat ki anndan l yo (Items yo)", r: "a" },
    { q: "Avèk Flexbox, ki pwopriyete ki separe bwat yo epi mete yon bèl espas nan mitan yo?", a: "justify-content: space-between;", b: "align-items: center;", r: "a" },
    { q: "Kisa `align-items: center;` fè nan yon fòma Flexbox?", a: "Li aliyen bwat yo dwat nan mitan vètikal ekran an", b: "Li kase liy yo", r: "a" },
    { q: "Si gen twòp bwat sou yon sèl liy pou yon ti telefòn, ki pwopriyete ki fè yo desann anba pito?", a: "flex-wrap: wrap;", b: "justify-content: center;", r: "a" }
],
"10": [
    { q: "Nan CSS, si nou mete `:hover` dèyè yon klas (Eks: `.bouton:hover`), kisa l vle di?", a: "Chanje koulè bouton an SÈLMAN lè moun lan pase sourit li sou li", b: "Kache bouton an pou pèsonn pa wè l", r: "a" },
    { q: "Pou yon chanjman koulè sou yon bouton pa fèt bridsoukou men pou l fèt dousman, kisa n dwe itilize?", a: "transition", b: "transform", r: "a" },
    { q: "Nan pwopriyete `transform`, kisa valè `scale(1.05)` la fè sou yon bwat?", a: "Li fè bwat la grandi epi avanse sou ou yon ti kras", b: "Li fè bwat la vire tèt anba", r: "a" },
    { q: "Ki pwopriyete ki bay yon kat pwofil yon bèl lonbray 3D anba l?", a: "box-shadow", b: "border-radius", r: "a" },
    { q: "Kòm astis pou mete yon bwat (ki gen lajè fiks) chita nan mitan ekran an nèt, ki valè margin nan nou itilize?", a: "margin: 0 auto;", b: "margin: center;", r: "a" }
]
};

window.openQuiz = (m) => {
    const questions = quizBank[m];
    if(!questions) return alert("Egzamen sa poko disponib.");
    document.getElementById("qModNum").innerText = m;
    const t = document.getElementById("quizContent");
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
    document.getElementById("quizBox").classList.remove("hidden");
};

window.closeQuiz = () => document.getElementById("quizBox").classList.add("hidden");

window.submitQuiz = async () => {
    const m = document.getElementById("qModNum").innerText;
    const questions = quizBank[m];
    let score = 0;
    let answered = 0;
    
    for(let k=1; k<=questions.length; k++) {
        const checked = document.querySelector(`input[name="q${k}"]:checked`);
        if(checked) {
            answered++;
            if(checked.value === questions[k-1].r) score++;
        }
    }

    if(answered < questions.length) return alert("Reponn tout kesyon yo!");

    if(score >= 4) {
        alert(`🎉 Konpliman! Ou fè ${score}/${questions.length}.`);
        if(userId) {
            loading(true);
            await update(ref(db, "users/" + userId), { ["module" + m]: true });
            location.reload();
        } else { window.closeQuiz(); }
    } else {
        alert(`Ou fè ${score}/${questions.length}. Ou bezwen 4 pou pase.`);
    }
};

document.addEventListener("contextmenu", e => e.preventDefault());
