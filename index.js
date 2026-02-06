// 🔹 IMPORT FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { push, set, getDatabase, ref, onValue, runTransaction, remove, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

/* ================== VARIABLES ================== */
let currentUser = null;

/* ================== LOGIN ================== */
window.login = async () => {
  const code = document.getElementById("code").value.trim();
  if (!code) return alert("Entre un code");

  /* 👑 ADMIN LOCAL */
  if (code === "admin125") {
    currentUser = { code: "admin125", role: "admin" };
    document.getElementById("addBox")?.classList.remove("hidden");
    document.getElementById("adminBox")?.classList.remove("hidden");
    alert("Admin connecté ✔️");
    loadUsersAdmin();
    renderProducts();
    return;
  }

  /* 👤 USER FIREBASE */
  const snap = await get(ref(db, "users/" + code));
  if (!snap.exists()) return alert("Code invalide");

  currentUser = { code, role: "user" };
  document.getElementById("addBox")?.classList.remove("hidden");
  alert("Utilisateur connecté ✔️");
  renderProducts();
};

/* ================== AJOUT PRODUIT ================== */
window.addProduct = () => {
  if (!currentUser) return;

  const nameInput = document.getElementById("pname");
  const priceInput = document.getElementById("pprice");
  const descInput = document.getElementById("description");
  const fileInput = document.getElementById("pfile");

  const name = nameInput.value.trim();
  const price = priceInput.value.trim();
  const description = descInput.value.trim();
  const file = fileInput.files[0];

  if (!name || !price || !description || !file) {
    return alert("Champs vides");
  }

  const reader = new FileReader();
  reader.onload = () => {
    push(ref(db, "products"), {
      name,
      price,
      description,
      img: reader.result,
      user: currentUser.code,
      time: Date.now()
    });

    // ✅ RESET SAN ERÈ
    nameInput.value = "";
    priceInput.value = "";
    descInput.value = "";
    fileInput.value = "";
  };

  reader.readAsDataURL(file);
};
/* ================== AFFICHAGE PRODUITS ================== */
function renderProducts() {
  const box = document.getElementById("products");
  if (!box) return;

  onValue(ref(db, "products"), snap => {
    box.innerHTML = "";
    if (!snap.exists()) {
      box.innerHTML = "<p>Aucun produit</p>";
      return;
    }

    snap.forEach(p => {
      const d = p.val();
      const id = p.key;

      const card = document.createElement("div");
      card.className = "property-card";
      card.innerHTML = `
        <img src="${d.img}" class="property-img">
        <h3>${d.name}</h3>
        <p>${d.description}</p>
        <p><b>${d.price} GDS</b></p>
        <a href="https://wa.me/+50940488401"  target="blank" class="whatsapp-btn"> WhatsApp 💬 </a>
      `;

      /* ❌ BOUTON ADMIN */
      if (currentUser?.role === "admin") {
        const btn = document.createElement("button");
        btn.textContent = "❌ Supprimer";
        btn.className = "buttons";
        btn.onclick = () => deleteProduct(id);
        card.appendChild(btn);
      }

      box.appendChild(card);
    });
  });
}

/* ================== SUPPRIMER PRODUIT ================== */
window.deleteProduct = async (id) => {
  if (!currentUser || currentUser.role !== "admin") return;
  if (!confirm("Supprimer ce produit ?")) return;
  await remove(ref(db, "products/" + id));
};

/* ================== ADMIN USERS ================== */
async function loadUsersAdmin() {
  if (currentUser?.role !== "admin") return;

  const box = document.getElementById("usersBox");
  if (!box) return;
  box.innerHTML = "";

  const snap = await get(ref(db, "users"));
  if (!snap.exists()) return;

  snap.forEach(u => {
    const id = u.key;
    const d = u.val();
    box.innerHTML += `
      <div>
        <b>${d.nom || id}</b>
        <button onclick="deleteUser('${id}')" class="buttons" >❌</button>
      </div>
    `;
  });
}

window.deleteUser = async (id) => {
  if (!confirm("Supprimer utilisateur ?")) return;
  await remove(ref(db, "users/" + id));

  const snap = await get(ref(db, "products"));
  snap.forEach(p => {
    if (p.val().user === id) {
      remove(ref(db, "products/" + p.key));
    }
  });
  loadUsersAdmin();
};

window.addUser = async () => {
  const code = prompt("Code user");
  const nom = prompt("Nom user");
  if (!code || !nom) return;

  await set(ref(db, "users/" + code), {
    nom,
    role: "user"
  });
  loadUsersAdmin();
};

/* ================== AUTO ================== */
window.addEventListener("DOMContentLoaded", renderProducts);

// ===============================
// BOUTON FLOTTANT ➕ AJOUT PRODUIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const floatBtn = document.getElementById("floatingAddBtn");
  const addBox = document.getElementById("addBox");

  if (!floatBtn || !addBox) return;

  floatBtn.onclick = () => {

    // 🔐 pas connecté
    if (!currentUser) {
      alert("❌ Fòk ou konekte pou ajoute pwodui");
      return;
    }

    // ✅ afficher formulaire
    addBox.classList.remove("hidden");
// 🔹 IMPORT FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { push, set, getDatabase, ref, onValue, runTransaction, remove, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

/* ================== VARIABLES ================== */
let currentUser = null;

/* ================== LOGIN ================== */
window.login = async () => {
  const code = document.getElementById("code").value.trim();
  if (!code) return alert("Entre un code");

  /* 👑 ADMIN LOCAL */
  if (code === "admin125") {
    currentUser = { code: "admin125", role: "admin" };
    document.getElementById("addBox")?.classList.remove("hidden");
    document.getElementById("adminBox")?.classList.remove("hidden");
    alert("Admin connecté ✔️");
    loadUsersAdmin();
    renderProducts();
    return;
  }

  /* 👤 USER FIREBASE */
  const snap = await get(ref(db, "users/" + code));
  if (!snap.exists()) return alert("Code invalide");

  currentUser = { code, role: "user" };
  document.getElementById("addBox")?.classList.remove("hidden");
  alert("Utilisateur connecté ✔️");
  renderProducts();
};

/* ================== AJOUT PRODUIT ================== */
window.addProduct = () => {
  if (!currentUser) return;

  const nameInput = document.getElementById("pname");
  const priceInput = document.getElementById("pprice");
  const descInput = document.getElementById("description");
  const fileInput = document.getElementById("pfile");

  const name = nameInput.value.trim();
  const price = priceInput.value.trim();
  const description = descInput.value.trim();
  const file = fileInput.files[0];

  if (!name || !price || !description || !file) {
    return alert("Champs vides");
  }

  const reader = new FileReader();
  reader.onload = () => {
    push(ref(db, "products"), {
      name,
      price,
      description,
      img: reader.result,
      user: currentUser.code,
      time: Date.now()
    });

    // ✅ RESET SAN ERÈ
    nameInput.value = "";
    priceInput.value = "";
    descInput.value = "";
    fileInput.value = "";
  };

  reader.readAsDataURL(file);
};
// Tout pwodui yo pral sove la pou rechèch
let allProducts = [];
/* ================== AFFICHAGE PRODUITS ================== */
function renderProducts() {
  const box = document.getElementById("products");
  const loader = document.getElementById("productsLoader");
  if (!box) return;
  
  box.innerHTML = "";
  if (loader) loader.style.display = "flex";
  
  onValue(ref(db, "products"), (snapshot) => {
    allProducts = [];
    box.innerHTML = "";
    
    if (!snapshot.exists()) {
      if (loader) loader.style.display = "none";
      box.innerHTML = "<p>Aucun produit disponible</p>";
      return;
    }
    
    snapshot.forEach((snap) => {
      allProducts.push({ id: snap.key, ...snap.val() });
    });
    
    afficherProduits(allProducts);
    
    if (loader) loader.style.display = "none";
  });
}

/* ================== FONKSYON POU AFICHE PWODUI ================== */
function afficherProduits(liste) {
  const box = document.getElementById("products");
  box.innerHTML = "";
  
  let delay = 0;
  liste.forEach((p) => {
    const card = document.createElement("div");
    card.className = "property-info";
    card.style.animationDelay = `${delay}s`;
    delay += 0.1;
    
    card.innerHTML = `
      <img src="${p.img}" class="property-card">
      <h3>${p.name}</h3>
      <p><i>${p.description}</i></p>
      <p><b>${p.price} GDS</b></p>
      <a href="https://wa.me/+50948404585" target="_blank" class="whatsapp-btn">💬 WhatsApp</a>
    `;
    
    // ❌ Bouton supprimer sèlman admin
    if (currentUser?.role === "admin") {
      const btn = document.createElement("button");
      btn.textContent = "❌ Supprimer";
      btn.className = "buttons";
      btn.onclick = () => deleteProduct(p.id);
      card.appendChild(btn);
    }
    
    box.appendChild(card);
  });
}

/* ================== DELETE PRODUIT (ADMIN) ================== */
window.deleteProduct = async (productId) => {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Accès refusé");
    return;
  }
  
  if (!confirm("Supprimer ce produit ?")) return;
  
  try {
    await remove(ref(db, "products/" + productId));
    alert("Produit supprimé ✔️");
    renderProducts(); // refresh lis apre suppression
  } catch (e) {
    console.error(e);
    alert("Erreur suppression");
  }
};

/* ================== RECHÈCH AN TAN REYÈL ================== */
const searchInput = document.getElementById("searchService");
searchInput?.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const resultat = allProducts.filter(
    (p) =>
    p.name.toLowerCase().includes(term) ||
    p.description.toLowerCase().includes(term)
  );
  afficherProduits(resultat);
});

/* ================== LANSMAN ================== */
renderProducts();

/* ================== ADMIN USERS ================== */
async function loadUsersAdmin() {
  if (currentUser?.role !== "admin") return;

  const box = document.getElementById("usersBox");
  if (!box) return;
  box.innerHTML = "";

  const snap = await get(ref(db, "users"));
  if (!snap.exists()) return;

  snap.forEach(u => {
    const id = u.key;
    const d = u.val();
    box.innerHTML += `
      <div>
        <b>${d.nom || id}</b>
        <button onclick="deleteUser('${id}')" class="buttons" >❌</button>
      </div>
    `;
  });
}

window.deleteUser = async (id) => {
  if (!confirm("Supprimer utilisateur ?")) return;
  await remove(ref(db, "users/" + id));

  const snap = await get(ref(db, "products"));
  snap.forEach(p => {
    if (p.val().user === id) {
      remove(ref(db, "products/" + p.key));
    }
  });
  loadUsersAdmin();
};

window.addUser = async () => {
  const code = prompt("Code user");
  const nom = prompt("Nom user");
  if (!code || !nom) return;

  await set(ref(db, "users/" + code), {
    nom,
    role: "user"
  });
  loadUsersAdmin();
};

/* ================== AUTO ================== */
window.addEventListener("DOMContentLoaded", renderProducts);

// ===============================
// BOUTON FLOTTANT ➕ AJOUT PRODUIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const floatBtn = document.getElementById("floatingAddBtn");
  const addBox = document.getElementById("addBox");

  if (!floatBtn || !addBox) return;

  floatBtn.onclick = () => {

    // 🔐 pas connecté
    if (!currentUser) {
      alert("❌ Fòk ou konekte pou ajoute pwodui");
      return;
    }

    // ✅ afficher formulaire
    addBox.classList.remove("hidden");

    // 📜 scroll doux
    addBox.scrollIntoView({ behavior: "smooth" });
  };
});




  
  const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

menuBtn.addEventListener("click", () => {
  menu.classList.toggle("show");
});
