import { db, auth, provider } from "/firebase-j.js";
import { ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');
let currentUser = null;
let totalModulesCount = 0;
let userProgressData = {};
let currentQuizData = [];

// NOUVO: Yon ti espas nan memwa pou n sove done quiz yo san n pa mete yo nan HTML la dirèk
window.courseQuizzes = {}; 

let localDeviceId = localStorage.getItem('gp_device');
if(!localDeviceId) {
    localDeviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('gp_device', localDeviceId);
}

if(!courseId) {
    alert("⚠️ Ou pa chwazi okenn kou!");
    window.location.href = "/index.html";
} else {
    get(ref(db, `kou/${courseId}`)).then((snapshot) => {
        if (snapshot.exists()) {
            const titleEl = document.getElementById('courseTitle');
            if(titleEl) titleEl.innerHTML = `📚 ${snapshot.val().non}`;
        } else {
            alert("❌ Kou sa pa egziste ankò oswa lyen an pa bon!");
            window.location.href = "/index.html";
        }
    }).catch((error) => console.error("Erè:", error));
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const nameEl = document.getElementById('userName');
        const emailEl = document.getElementById('userEmail');
        
        if(nameEl) nameEl.innerText = user.displayName || "Elèv Global Plis";
        if(emailEl) emailEl.innerText = user.email || user.uid.substring(0,8)+"...";
        
        verifyEnrollment();
    } else {
        window.location.href = "/index.html";
    }
});

window.logout = () => {
    signOut(auth).then(() => {
        window.location.href = "/index.html";
    });
};

function verifyEnrollment() {
    onValue(ref(db, `enskripsyon/${currentUser.uid}/${courseId}`), (snap) => {
        const authOverlay = document.getElementById('authOverlay');
        if (authOverlay) authOverlay.classList.add('hidden');

        if(!snap.exists() || snap.val().estati !== "valide") {
            alert("🔒 Ou poko gen aksè valide pou kou sa a. Tanpri pase nan kès la oswa tann admin nan valide w.");
            window.location.href = "/index.html"; 
            return;
        }

        const data = snap.val();
        userProgressData = data.progress || { module1: false }; 
        const activeDevice = data.active_device;
        
        const deviceLockSection = document.getElementById('deviceLockSection');
        const deviceActiveSection = document.getElementById('deviceActiveSection');
        const modulesContainer = document.getElementById('modulesContainer');
        
        if(!activeDevice) {
            if(deviceLockSection) deviceLockSection.classList.remove('hidden');
            if(deviceActiveSection) deviceActiveSection.classList.add('hidden');
        } else if (activeDevice !== localDeviceId) {
            if(deviceLockSection) deviceLockSection.classList.add('hidden');
            if(deviceActiveSection) deviceActiveSection.classList.add('hidden');
            if(modulesContainer) modulesContainer.innerHTML = `
                <div class="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
                    <h2 class="text-xl font-bold text-red-700 mb-2">Aksè Refize</h2>
                    <p class="text-slate-600 mb-4">ID sa a deja konekte sou yon lòt telefòn oswa navigatè. Tanpri dekonekte l sou lòt aparèy la anvan.</p>
                    <button onclick="window.location.reload()" class="bg-slate-800 text-white px-6 py-2 rounded font-bold">Rafrechi paj la</button>
                </div>`;
        } else {
            if(deviceLockSection) deviceLockSection.classList.add('hidden');
            if(deviceActiveSection) deviceActiveSection.classList.remove('hidden');
            loadCourseContent(); 
        }
    });
}

window.linkDevice = async () => {
    const inputVal = document.getElementById('inputId').value.trim().toUpperCase();

    if(!inputVal) {
        return alert("❌ Tanpri antre kòd ou te resevwa a.");
    }

    try {
        const codeRef = ref(db, `etidyan_manyel/${inputVal}`);
        const snapshot = await get(codeRef);

        if (snapshot.exists()) {
            const codeData = snapshot.val();

            if(codeData.kou_id !== courseId) {
                return alert(`❌ Kòd sa fèt pou kou "${codeData.kou_id}", li pa pou kou sa w ap eseye gade a.`);
            }

            if(codeData.device_token && codeData.device_token !== localDeviceId) {
                return alert("❌ Kòd sa a gentan ap itilize sou yon lòt telefòn oswa navigatè. Si se ou, mande Admin nan debloke l pou ou.");
            }

            const updates = {};
            updates[`enskripsyon/${currentUser.uid}/${courseId}/active_device`] = localDeviceId;
            updates[`enskripsyon/${currentUser.uid}/${courseId}/estati`] = "valide";
            
            await update(ref(db), updates);
            await update(codeRef, { device_token: localDeviceId });

            alert("✅ Aksè valide ! Aparèy sa kounye a konekte ak kou a.");
            window.location.reload(); 
        } else {
            alert("❌ Kòd ou antre a pa bon. Verifye sa yo te voye ba ou sou WhatsApp la byen.");
        }
    } catch(e) {
        console.error("Erè baz done: ", e);
        alert("Gen yon pwoblèm ak koneksyon entènèt ou. Eseye ankò.");
    }
};

window.unlinkDevice = async () => {
    if(confirm("Ou vle dekonekte aparèy sa a pou w ka sèvi ak yon lòt?")) {
        try {
            await update(ref(db, `enskripsyon/${currentUser.uid}/${courseId}`), {
                active_device: null
            });
            window.location.reload();
        } catch(e) { alert("Erè."); }
    }
};

// ==========================================
// YOUTUBE & MEDIA HELPER FUNCTIONS
// ==========================================
function isYouTubeUrl(url) {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

function getYouTubeEmbedUrl(url) {
    let videoId = '';
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v');
    } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('shorts/')[1].split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
}

window.changeMedia = (modNum, encodedUrl) => {
    const url = decodeURIComponent(encodedUrl);
    const container = document.getElementById(`mediaContainer_${modNum}`);
    
    if(isYouTubeUrl(url)) {
        container.innerHTML = `<iframe src="${getYouTubeEmbedUrl(url)}" class="w-full aspect-video rounded-lg mb-3 border-0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
    } else {
        container.innerHTML = `<video src="${url}" autoplay controls controlsList="nodownload" class="w-full aspect-video bg-black rounded-lg mb-3"></video>`;
        attachMediaListeners(); 
    }
};

function attachMediaListeners() {
    const videos = document.querySelectorAll('video');
    videos.forEach(vid => {
        vid.removeEventListener('play', pauseOtherMedia);
        vid.addEventListener('play', pauseOtherMedia);
    });
}

function pauseOtherMedia(e) {
    document.querySelectorAll('video').forEach(vid => {
        if (vid !== e.target) {
            vid.pause();
        }
    });
    document.querySelectorAll('iframe').forEach(iframe => {
        iframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'pauseVideo',
            args: []
        }), '*');
    });
}
// ==========================================

function loadCourseContent() {
    onValue(ref(db, `kou_kontni/${courseId}`), (snap) => {
        if(!snap.exists()) return;
        
        const modules = snap.val();
        const container = document.getElementById('modulesContainer');
        const syllabus = document.getElementById('syllabusList');
        
        if(container) container.innerHTML = "";
        if(syllabus) syllabus.innerHTML = "";
        
        const modKeys = Object.keys(modules).sort((a, b) => {
            return parseInt(a.replace('module','')) - parseInt(b.replace('module',''));
        });
        
        totalModulesCount = modKeys.length;
        let passedCount = 0;

        modKeys.forEach((key, index) => {
            const modNum = key.replace('module', '');
            const modData = modules[key];
            const isPassed = userProgressData[`module${modNum}`] === true;
            const isUnlocked = modNum === "1" || userProgressData[`unlocked${modNum}`] === true;
            
            if(isPassed) passedCount++;

            let vidCount = modData.videos ? modData.videos.length : (modData.video ? 1 : 0);
            let pdfBadge = modData.pdf ? `<span class="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">PDF</span>` : '';
            let quizBadge = modData.quiz ? `<span class="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">Quiz</span>` : '';
            
            if(syllabus) syllabus.innerHTML += `
                <li class="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span class="font-bold text-slate-600">Modil ${modNum}: ${modData.tit || 'Pati '+modNum}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-slate-500">${vidCount} Vid</span>
                        ${pdfBadge} ${quizBadge}
                        ${isPassed ? '✅' : (isUnlocked ? '🔓' : '🔒')}
                    </div>
                </li>`;

            let videoHtml = "";
            if (modData.videos && isUnlocked && modData.videos.length > 0) {
                const firstUrl = modData.videos[0];
                let initialMedia = isYouTubeUrl(firstUrl) 
                    ? `<iframe src="${getYouTubeEmbedUrl(firstUrl)}" class="w-full aspect-video rounded-lg mb-3 border-0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`
                    : `<video src="${firstUrl}" controls controlsList="nodownload" class="w-full aspect-video bg-black rounded-lg mb-3"></video>`;
                
                videoHtml = `<div id="mediaContainer_${modNum}">${initialMedia}</div>`;
                
                let playlist = `<div class="flex flex-wrap gap-2 mb-4">`;
                modData.videos.forEach((v, i) => {
                    const safeUrl = encodeURIComponent(v);
                    playlist += `<button onclick="changeMedia('${modNum}', '${safeUrl}')" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-bold transition">▶ Pati ${i+1}</button>`;
                });
                playlist += `</div>`;
                videoHtml += playlist;
                
            } else if (modData.video && isUnlocked) {
                let initialMedia = isYouTubeUrl(modData.video)
                    ? `<iframe src="${getYouTubeEmbedUrl(modData.video)}" class="w-full aspect-video rounded-lg mb-4 border-0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`
                    : `<video src="${modData.video}" controls controlsList="nodownload" class="w-full aspect-video bg-black rounded-lg mb-4"></video>`;
                
                videoHtml = `<div id="mediaContainer_${modNum}">${initialMedia}</div>`;
            }

            let quizBtn = "";
            if(modData.quiz) {
                // Sove done quiz la anndan memwa paj la olye nou mete l nan HTML la dirèkteman
                window.courseQuizzes[modNum] = modData.quiz;
                
                if(isPassed) {
                    quizBtn = `<button class="bg-green-100 text-green-700 font-bold py-2 px-4 rounded w-full border border-green-300 pointer-events-none">✔ Egzamen Reyisi</button>`;
                } else {
                    // Nou pase sèlman nimewo modil la kounye a
                    quizBtn = `<button onclick="openQuiz('${modNum}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full shadow transition">Pase Egzamen Modil ${modNum}</button>`;
                }
            }

            let pdfBtn = modData.pdf && isUnlocked ? `<a href="${modData.pdf}" target="_blank" class="bg-red-50 text-red-600 font-bold px-4 py-2 rounded flex items-center justify-center border border-red-200 hover:bg-red-100 transition min-w-[100px]">📄 PDF</a>` : '';

            if(container) container.innerHTML += `
                <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 ${isUnlocked ? '' : 'locked'}">
                    <h2 class="font-bold text-xl text-slate-800 mb-4 border-b pb-2">Modil ${modNum} ${modData.tit ? '- '+modData.tit : ''}</h2>
                    ${isUnlocked ? videoHtml : '<div class="w-full aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-slate-400">🔒 Modil fèmen</div>'}
                    
                    <div class="flex flex-col sm:flex-row gap-3">
                        <div class="flex-1">${quizBtn}</div>
                        ${pdfBtn}
                    </div>
                </div>
            `;
        });

        updateStats(passedCount, totalModulesCount);
        
        setTimeout(() => { attachMediaListeners(); }, 500);
    });
}

function updateStats(passed, total) {
    if(total === 0) return;
    const percentage = Math.round((passed / total) * 100);
    
    const pBar = document.getElementById('progressBar');
    const pText = document.getElementById('progressText');
    if(pBar) pBar.style.width = percentage + "%";
    if(pText) pText.innerText = percentage;

    const certBtn = document.getElementById('certBtn');
    if(certBtn && percentage === 100) {
        certBtn.disabled = false;
        certBtn.className = "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg font-black px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer";
        certBtn.innerHTML = "🏆 Reklame Sètifika";
        certBtn.onclick = () => alert("Sistèm sètifika a ap pare byento!");
    }
}

// Chanjman isit la: Nou resevwa sèlman nimewo modil la (modNum) epi nou chache quiz la nan memwa a
window.openQuiz = (modNum) => {
    currentQuizData = window.courseQuizzes[modNum];
    
    if(!currentQuizData) return alert("Egzamen sa poko disponib byen.");
    
    document.getElementById('currentModNum').innerText = modNum;
    
    const content = document.getElementById('quizContent');
    content.innerHTML = "";
    
    currentQuizData.forEach((item, k) => {
        content.innerHTML += `
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-3">
                <p class="font-bold text-slate-700 mb-3 text-sm">${k + 1}. ${item.q}</p>
                <div class="space-y-2">
                    <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${k}" value="a" class="w-4 h-4"> 
                        <span class="text-sm font-medium text-slate-600">${item.a}</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-blue-50">
                        <input type="radio" name="q${k}" value="b" class="w-4 h-4"> 
                        <span class="text-sm font-medium text-slate-600">${item.b}</span>
                    </label>
                </div>
            </div>`;
    });
    
    document.getElementById('quizModal').classList.remove('hidden');
};

window.closeQuiz = () => document.getElementById('quizModal').classList.add('hidden');

window.submitQuiz = async () => {
    let score = 0;
    let answered = 0;
    const modNum = document.getElementById('currentModNum').innerText;
    
    currentQuizData.forEach((item, k) => {
        const checked = document.querySelector(`input[name="q${k}"]:checked`);
        if(checked) {
            answered++;
            if(checked.value === item.r) score++;
        }
    });

    if(answered < currentQuizData.length) return alert("Tanpri reponn tout kesyon yo!");

    const passingScore = Math.ceil(currentQuizData.length * 0.8);

    if(score >= passingScore) {
        alert(`🎉 Konpliman! Ou fè ${score}/${currentQuizData.length}. Modil swivan an debloke!`);
        
        const updates = {};
        updates[`progress/module${modNum}`] = true; 
        const nextMod = parseInt(modNum) + 1;
        updates[`progress/unlocked${nextMod}`] = true; 

        await update(ref(db, `enskripsyon/${currentUser.uid}/${courseId}`), updates);
        closeQuiz();
    } else {
        alert(`Ou fè ${score}/${currentQuizData.length}. Ou bezwen ${passingScore} pou w pase. Relve defi a ankò!`);
    }
};
