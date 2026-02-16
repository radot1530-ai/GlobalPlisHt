import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { push, set, getDatabase, ref, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAgvH0CpF6tGISpfLw3JWJCT2beBG28wAM",
  authDomain: "kaylakay-cdf64.firebaseapp.com",
  databaseURL: "https://kaylakay-cdf64-default-rtdb.firebaseio.com/",
  projectId: "kaylakay-cdf64",
  storageBucket: "kaylakay-cdf64.appspot.com",
  messagingSenderId: "663099511740",
  appId: "1:663099511740:web:aeb6bddccee9666ff791b9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ================= GLOBAL ================= */
let currentUser = null;
let allProducts = [];
let cart = [];

/* ================= SPONSOR TRUE ROTATION ================= */
let sponsorTimer = null;

function startSponsorRotation() {
  const row = document.getElementById("sponsoriseRow");
  if (!row) return;

  if (sponsorTimer) clearInterval(sponsorTimer);

  let sponsors = allProducts
    .filter(p => p.category === "Sponsorisé")
    .sort((a, b) => b.premium - a.premium || b.time - a.time);

  if (sponsors.length === 0) {
    row.innerHTML = "";
    return;
  }

  function render(list) {
    row.innerHTML = "";

    list.slice(0, 4).forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.img}">
        <div>${p.name}</div>
        <div>${p.price} HTG</div>
        <button class="big-btn">Ajoute</button>
      `;
      card.querySelector("button").onclick = () => addToCart(p);
      row.appendChild(card);
    });
  }

  // first render
  render(sponsors);

  sponsorTimer = setInterval(() => {
    // 🔥 FÈ ROTATION
    const first = sponsors.shift(); // retire premye
    sponsors.push(first);          // mete l dèyè

    render(sponsors);
  }, 10000);
}
/* ================= SPINNER ================= */
function showSpinner(show = true) {
  document.querySelectorAll(".spinner").forEach(sp => {
    sp.style.display = show ? "block" : "none";
  });
}

/* ================= LOGIN ================= */
window.login = async () => {
  const code = document.getElementById("code").value.trim();
  if (!code) return alert("Antre kòd");
  
  if (code === "admin125") {
    currentUser = { code, role: "admin" };
    addBox.classList.remove("hidden");
    adminBox.classList.remove("hidden");
    alert("Admin konekte ✔️");
  } else {
    const snap = await get(ref(db, "users/" + code));
    if (!snap.exists()) return alert("Code invalide");
    
    const role = snap.val().role || "user";
    currentUser = { code, role };
    
    if (role === "user" || role === "premium") {
      addBox.classList.remove("hidden");
    }
    
    alert(`Login ✔️ (${role})`);
  }
  
  renderProducts();
  renderUsers();
};

/* ================= ADD PRODUCT ================= */
window.addProduct = () => {
  if (!currentUser) return alert("Ou pa konekte");
  
  const name = pname.value.trim();
  const price = pprice.value.trim();
  const desc = description.value.trim();
  const file = pfile.files[0];
  let category = pcategory.value;
  
  if (!name || !price || !desc || !file) return alert("Champs vid");
  
  if (currentUser.role === "user" && category === "Sponsorisé") {
    alert("Ou pa gen dwa Sponsorisé");
    category = "Mache";
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    push(ref(db, "products"), {
      name,
      price,
      description: desc,
      category,
      img: reader.result,
      user: currentUser.code,
      premium: currentUser.role === "premium" || category === "Sponsorisé",
      time: Date.now()
    });
    
    pname.value = "";
    pprice.value = "";
    description.value = "";
    pfile.value = "";
  };
  reader.readAsDataURL(file);
};

/* ================= CATEGORY RENDER ================= */
function renderCategory(rowId, category, list = allProducts) {
  if (category === "Sponsorisé") return; // 🔥 PA RANN SPONSOR ISIT
  
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = "";
  
  let products = list.filter(p => p.category === category);
  products.sort((a, b) => b.time - a.time);
  
  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    
    card.innerHTML = `
      <img src="${p.img}">
      <div>${p.name}</div>
      <div>${p.price} HTG</div>
      <button class="big-btn">Ajoute</button>
    `;
    
    card.querySelector("button").onclick = () => addToCart(p);
    
    if (currentUser?.role === "admin") {
      const del = document.createElement("button");
      del.textContent = "❌";
      del.onclick = () => deleteProduct(p.id);
      card.appendChild(del);
    }
    
    row.appendChild(card);
  });
}

/* ================= SEARCH ================= */
function initSearch() {
  const input = document.getElementById("searchService");
  if (!input) return;
  
  input.addEventListener("input", e => {
    const term = e.target.value.toLowerCase().trim();
    
    if (!term) return renderProducts();
    
    showSpinner(true);
    
    const filtered = allProducts.filter(p =>
      p.name.toLowerCase().includes(term)
    );
    
    ["macheRow", "immobilierRow", "abimanRow", "zoutiRow"]
    .forEach(id => document.getElementById(id).innerHTML = "");
    
    const map = {
      "Mache": "macheRow",
      "Immobilier": "immobilierRow",
      "Abiman & Tekstil": "abimanRow",
      "Zouti": "zoutiRow"
    };
    
    filtered.forEach(p => renderCategory(map[p.category], p.category, filtered));
    
    showSpinner(false);
  });
}

/* ================= DELETE ================= */
window.deleteProduct = id => {
  if (currentUser?.role !== "admin") return alert("Ou pa admin");
  if (confirm("Supprimer ?")) remove(ref(db, "products/" + id));
};

/* ================= CART ================= */
function addToCart(p) {
function startSponsorRotation() {
  const row = document.getElementById("sponsoriseRow");
  if (!row) return;

  if (sponsorTimer) clearInterval(sponsorTimer);

  let sponsors = allProducts
    .filter(p => p.category === "Sponsorisé")
    .sort((a, b) => b.premium - a.premium || b.time - a.time);

  if (sponsors.length === 0) {
    row.innerHTML = "";
    return;
  }

  // ✅ preload sèlman 4 premye (pa tout lis la)
  sponsors.slice(0, 4).forEach(p => {
    const img = new Image();
    img.src = p.img;
  });

  function render(list) {
    row.innerHTML = "";

    list.slice(0, 4).forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";

      // ❌ retire lazy loading pou slider
      card.innerHTML = `
        <img src="${p.img}">
        <div>${p.name}</div>
        <div>${p.price} HTG</div>
        <button class="big-btn">Ajoute</button>
      `;

      card.querySelector("button").onclick = () => addToCart(p);

      // ADMIN DELETE (kenbe lojik Code 2)
      if (currentUser?.role === "admin") {
        const del = document.createElement("button");
        del.textContent = "❌";
        del.onclick = () => deleteProduct(p.id);
        card.appendChild(del);
      }

      row.appendChild(card);
    });
  }

  render(sponsors);

  sponsorTimer = setInterval(() => {
    const first = sponsors.shift();
    sponsors.push(first);
    render(sponsors);
  }, 5000);
}
