// 🔹 IMPORT FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { push, set, getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// 🔹 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAgvH0CpF6tGISpfLw3JWJCT2beBG28wAM",
  authDomain: "kaylakay-cdf64.firebaseapp.com",
  databaseURL: "https://kaylakay-cdf64-default-rtdb.firebaseio.com/",
  projectId: "kaylakay-cdf64",
  storageBucket: "kaylakay-cdf64.appspot.com",
  messagingSenderId: "663099511740",
  appId: "1:663099511740:web:aeb6bddccee9666ff791b9",
  measurementId: "G-JF9PNTTTG4"
};

// 🔹 INITIALISATION
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔹 ELEMENTS HTML
const list = document.getElementById("list");
const search = document.getElementById("search");
const participantsRef = ref(db, "participants");

// 🔹 CACHE GLOBAL
let ALL = [];

// 🔹 AFFICHER PARTICIPANTS
function afficher(data) {
  if(!list) return console.error("Liste element non trouvé !");
  list.innerHTML = "";

  data.forEach(p => {
    const nom = p.nom || "(Nom manquant)";
    const code = p.code || p.key || "(Code manquant)";
    const resume = (p.texte && p.texte.trim().length > 0)
                    ? p.texte.substring(0, 1000)
                    : "(Pas de résumé)";
    const votes = p.votes || 0;

    list.innerHTML += `
      <div class="cardss">
        <h3>${nom}</h3>
        <p class="code"><strong>Kòd:</strong> ${code}</p>
        <p class="resume">${resume}</p>
        <p class="votes">🗳️ Votes: ${votes}</p>
        <button class="buttons" onclick="vote('${code}')">Vote</button>
      </div>
    `;
  });
}

// ===========================
// Charger participants en temps réel
// ===========================
onValue(participantsRef, snap => {
  ALL = [];
  snap.forEach(item => {
    const p = item.val();
    if(!p) return;

    // Si admin pa mete code, itilize key
    p.code = p.code || item.key;
    p.nom = p.nom || "";
    p.texte = p.texte || "";
    p.votes = p.votes || 0;

    ALL.push(p);
  });

  // Trier par votes décroissant
  ALL.sort((a,b)=> (b.votes || 0) - (a.votes || 0));
  afficher(ALL);
});

// ===========================
// Recherche par code ou nom
// ===========================
search.addEventListener("input", () => {
  const q = search.value.trim().toLowerCase();
  if(q === "") return afficher(ALL);

  const res = ALL.filter(p =>
    (p.nom || "").toLowerCase().includes(q) ||
    (p.code || "").toLowerCase().includes(q)
  );

  afficher(res);
});

// 🔹 VOTE 1 FOIS PAR UTILISATEUR
window.vote = code => {
  if(!code) return alert("Code invalide");

  if(localStorage.getItem("voted")) {
    alert("Ou deja vote pou yon patisipan, ou pap ka vote ankò");
    return;
  }

  const voteRef = ref(db, "participants/"+code+"/votes");
  runTransaction(voteRef, v => (v||0)+1)
    .then(()=> {
      localStorage.setItem("voted", code);
      alert("✅ Vote anrejistre pou patisipan sa");
    })
    .catch(err => {
      console.error("Erreur vote:", err);
      alert("❌ Erreur, réessayez");
    });
};
