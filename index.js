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
  
  // ✅ preload sèlman 4 premye (pa tout lis la)
  sponsors.slice(0, 2).forEach(p => {
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
  renderUsers(); // ✅ Rele global
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
      <img src="${p.img}" loading="lazy">
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
  cart.push(p);
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = "";
  let total = 0;
  
  cart.forEach((p, i) => {
    total += Number(p.price);
    
    const div = document.createElement("div");
    div.innerHTML = `${p.name} (${p.price}) <button>X</button>`;
    
    div.querySelector("button").onclick = () => {
      cart.splice(i, 1);
      renderCart();
    };
    
    cartItems.appendChild(div);
  });
  
  totalPrice.innerText = "Total: " + total + " HTG";
  cartCount.innerText = cart.length;
}

cartBtn.onclick = () => cartPopup.classList.toggle("show");

whatsappBtn.onclick = () => {
  if (cart.length === 0) return alert("Panier vid");
  
  let msg = "Bonjou, mwen vle kòmande:\n";
  let total = 0;
  
  cart.forEach(p => {
    msg += `${p.name} - ${p.price}\n`;
    total += Number(p.price);
  });
  
  msg += "Total: " + total;
  window.open("https://wa.me/?text=" + encodeURIComponent(msg));
};

/* ================= RENDER PRODUCTS ================= */
function renderProducts() {
  showSpinner(true);
  
  onValue(ref(db, "products"), snap => {
    allProducts = [];
    
    if (snap.exists()) {
      snap.forEach(s => {
        allProducts.push({ id: s.key, ...s.val() });
      });
    }
    
    // 🔥 RANN LÒT KATEGORI SELMAN
    renderCategory("macheRow", "Mache");
    renderCategory("immobilierRow", "Immobilier");
    renderCategory("abimanRow", "Abiman & Tekstil");
    renderCategory("zoutiRow", "Zouti");
    
    // 🔥 SLIDER
    startSponsorRotation();
    
    showSpinner(false);
  });
}

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  initSearch();
});


/* ================= LOGIN POPUP ================= */
window.openLogin = () => {
  document.getElementById("loginPopup").style.display = "flex";
};

window.closeLogin = () => {
  document.getElementById("loginPopup").style.display = "none";
};

// Fèmen si klike deyò
window.addEventListener("click", e => {
  const popup = document.getElementById("loginPopup");
  if (e.target === popup) popup.style.display = "none";
});


// MENU SYSTEM
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const closeMenu = document.getElementById("closeMenu");
const overlay = document.getElementById("menuOverlay");

// Open menu
menuBtn.onclick = () => {
  sideMenu.classList.add("show");
  overlay.classList.add("show");
};

// Close menu bouton
closeMenu.onclick = closeMenuFunc;

// Close menu klik deyò
overlay.onclick = closeMenuFunc;

function closeMenuFunc() {
  sideMenu.classList.remove("show");
  overlay.classList.remove("show");
}

// TELECHAJE PAJ LA OTOMATIKMAN
function downloadPage() {
  const html = document.documentElement.outerHTML;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "globalplus_offline.html";
  a.click();

  URL.revokeObjectURL(url);
  }
