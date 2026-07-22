// 🔹 IMPORT FIREBASE (Vèsyon 12.7.0 jan w te mande l la)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { push, getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

/* ================= GLOBAL ================= */
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
  
  // ✅ preload sèlman 4 premye
  sponsors.slice(0, 2).forEach(p => {
    const img = new Image();
    img.src = p.img;
  });
  
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

/* ================= ADD PRODUCT ================= */
window.addProduct = () => {
  const name = document.getElementById("pname")?.value.trim();
  const price = document.getElementById("pprice")?.value.trim();
  const desc = document.getElementById("description")?.value.trim();
  const fileInput = document.getElementById("pfile");
  const file = fileInput?.files[0];
  let category = document.getElementById("pcategory")?.value;
  
  if (!name || !price || !desc || !file) return alert("Tout chan yo oblije ranpli");
  
  const reader = new FileReader();
  reader.onload = () => {
    push(ref(db, "products"), {
      name,
      price,
      description: desc,
      category,
      img: reader.result,
      premium: category === "Sponsorisé",
      time: Date.now()
    }).then(() => {
        alert("Pwodui ajoute ak siksè !");
        document.getElementById("pname").value = "";
        document.getElementById("pprice").value = "";
        document.getElementById("description").value = "";
        fileInput.value = "";
    });
  };
  reader.readAsDataURL(file);
};

/* ================= CATEGORY RENDER ================= */
function renderCategory(rowId, category, list = allProducts) {
  if (category === "Sponsorisé") return; 
  
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
    .forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).innerHTML = "";
    });
    
    const map = {
      "Mache": "macheRow",
      "Immobilier": "immobilierRow",
      "Abiman & Tekstil": "abimanRow",
      "Zouti": "zoutiRow"
    };
    
    filtered.forEach(p => {
        if(map[p.category]) renderCategory(map[p.category], p.category, filtered);
    });
    
    showSpinner(false);
  });
}

/* ================= DELETE ================= */
// Opsyonèl: Ou ka itilize sa nan konsole a siw bezwen efase yon pwodui
window.deleteProduct = id => {
  if (confirm("Èske w sèten ou vle efase pwodui sa?")) remove(ref(db, "products/" + id));
};

/* ================= CART ================= */
function addToCart(p) {
  cart.push(p);
  renderCart();
  alert(`${p.name} ajoute nan panyen w lan!`);
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const totalPrice = document.getElementById("totalPrice");
  const cartCount = document.getElementById("cartCount");
  
  if (!cartItems || !totalPrice || !cartCount) return;

  cartItems.innerHTML = "";
  let total = 0;
  
  cart.forEach((p, i) => {
    total += Number(p.price);
    
    const div = document.createElement("div");
    div.innerHTML = `${p.name} (${p.price} HTG) <button style="color:red; border:none; background:none; cursor:pointer;">X</button>`;
    
    div.querySelector("button").onclick = () => {
      cart.splice(i, 1);
      renderCart();
    };
    
    cartItems.appendChild(div);
  });
  
  totalPrice.innerText = "Total: " + total + " HTG";
  cartCount.innerText = cart.length;
}

const cartBtn = document.getElementById("cartBtn");
if(cartBtn) cartBtn.onclick = () => document.getElementById("cartPopup")?.classList.toggle("show");

const whatsappBtn = document.getElementById("whatsappBtn");
if (whatsappBtn) {
    whatsappBtn.onclick = () => {
      if (cart.length === 0) return alert("Panyen w lan vid!");
      
      let msg = "Bonjou, mwen vle kòmande:\n";
      let total = 0;
      
      cart.forEach(p => {
        msg += `▪️ ${p.name} - ${p.price} HTG\n`;
        total += Number(p.price);
      });
      
      msg += `\nTotal: ${total} HTG`;
      window.open("https://wa.me/50940488401?text=" + encodeURIComponent(msg));
    };
}

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
    
    // Rann kategori yo
    renderCategory("macheRow", "Mache");
    renderCategory("immobilierRow", "Immobilier");
    renderCategory("abimanRow", "Abiman & Tekstil");
    renderCategory("zoutiRow", "Zouti");
    
    // Slider
    startSponsorRotation();
    
    showSpinner(false);
  });
}

/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  initSearch();
});

/* ================= MENU LOGIC ================= */
const menuBtn = document.getElementById('menuBtn');
const closeMenu = document.getElementById('closeMenu');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');

if (menuBtn) {
    menuBtn.onclick = () => {
      sideMenu.classList.add('active');
      menuOverlay.classList.add('active');
    };
}

if (closeMenu) {
    closeMenu.onclick = () => {
      sideMenu.classList.remove('active');
      menuOverlay.classList.remove('active');
    };
}

if (menuOverlay) {
    menuOverlay.onclick = () => {
      sideMenu.classList.remove('active');
      menuOverlay.classList.remove('active');
    };
}

/* ================= DOWNLOAD PAGE ================= */
window.downloadPage = () => {
  const html = document.documentElement.outerHTML;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "globalplus_offline.html";
  a.click();
  URL.revokeObjectURL(url);
};
