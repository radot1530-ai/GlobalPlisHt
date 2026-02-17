  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
  import {
  update,
  push,
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  runTransaction
} from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
  
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAgvH0CpF6tGISpfLw3JWJCT2beBG28wAM",
    authDomain: "kaylakay-cdf64.firebaseapp.com",
    databaseURL:"https://kaylakay-cdf64-default-rtdb.firebaseio.com/",
    projectId: "kaylakay-cdf64",
    storageBucket:"kaylakay-cdf64.appspot.com",
    messagingSenderId: "663099511740",
    appId: "1:663099511740:web:aeb6bddccee9666ff791b9",
    measurementId: "G-JF9PNTTTG4"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// 🔹 ELEMENTS
const code = document.getElementById("code");
const nom = document.getElementById("nom");
const ville = document.getElementById("ville");
const texte = document.getElementById("texte");
const add = document.getElementById("add");
const liste = document.getElementById("liste");

// ➕ AJOUT
add.onclick = () => {
  if(!code.value || !nom.value) {
    alert("Code et nom obligatoires");
    return;
  }

  set(ref(db, "participants/" + code.value), {
    nom: nom.value,
    ville: ville.value,
    texte: texte.value,
    votes: 0,
    actif: true
  });

  code.value = nom.value = ville.value = texte.value = "";
};

// 📋 LISTE
onValue(ref(db, "participants"), snap => {
  liste.innerHTML = "";
  snap.forEach(p => {
    const d = p.val();
    liste.innerHTML += `
      <div class="card">
        <b>${p.key}</b> – ${d.nom} (${d.ville})
        <br>Votes : ${d.votes || 0}
        <br>
        <button onclick="supprimer('${p.key}')">🗑️ Supprimer</button>
      </div>
    `;
  });
});

// ❌ SUPPRIMER
window.supprimer = code => {
  if(confirm("Supprimer ce participant ?")){
    remove(ref(db, "participants/" + code));
  }
};

