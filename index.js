// ========================================================
// FICHYE: store.js (Jere sèlman Pwodui, Panyen ak UI)
// ========================================================
import { db } from "./firebase-j.js";
import { ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

let allProducts = [];
let cart = [];
let sponsorTimer = null;

// Rann fonksyon yo disponib globalman (sitou si nou ta itilize yo sou HTML dirèkteman)
window.addProduct = () => {
  if (!window.currentUser || window.currentUser.role !== "admin") return window.showToast("Sèlman administratè a ki ka ajoute pwodui.");
  
  const name = document.getElementById('pname').value.trim();
  const price = document.getElementById('pprice').value.trim();
  const desc = document.getElementById('description').value.trim();
  const file = document.getElementById('pfile').files[0];
  let category = document.getElementById('pcategory').value;
  
  if (!name || !price || !desc || !file) return window.showToast("Tout chan yo oblije ranpli");
  
  const btnSubmit = document.querySelector("#adminPanel button");
  btnSubmit.innerText = "Ap chaje..."; btnSubmit.disabled = true;
  
  const reader = new FileReader();
  reader.onload = () => {
    push(ref(db, "products"), {
      name, price, description: desc, category, img: reader.result, premium: category === "Sponsorisé", time: Date.now()
    }).then(() => {
      window.showToast("✅ Pwodui ajoute ak siksè!");
      document.getElementById('pname').value = ""; document.getElementById('pprice').value = "";
      document.getElementById('description').value = ""; document.getElementById('pfile').value = "";
    });
    btnSubmit.innerText = "Ajoute Pwodui"; btnSubmit.disabled = false;
  };
  reader.readAsDataURL(file);
};

window.deleteProduct = (id) => {
  if (!window.currentUser || window.currentUser.role !== "admin") return;
  if (confirm("Èske w sèten ou vle efase pwodui sa nèt?")) remove(ref(db, "products/" + id));
};

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
      <div class="image-container click-to-view" style="cursor:pointer;" title="Klike pou wè detay">
        <img src="${p.img}" loading="lazy" class="async-image" onload="this.classList.add('loaded')">
      </div>
      <div class="click-to-view" style="cursor:pointer; font-weight: bold; margin-top: 10px;">${p.name}</div>
      <div style="margin-bottom: 10px;">${p.price} HTG</div>
      <button class="big-btn">Ajoute</button>
    `;
    
    const goToProduct = () => window.location.href = `store/pwodui/produit.html?id=${p.id}`;
    card.querySelectorAll(".click-to-view").forEach(el => el.onclick = goToProduct);
    card.querySelector("button.big-btn").onclick = () => addToCart(p);
    
    // Tcheke currentUser la (ki jere nan auth.js) pou afiche bouton efase
    if (window.currentUser?.role === "admin") {
      const del = document.createElement("button");
      del.textContent = "❌";
      del.classList.add("buttons");
      del.onclick = () => window.deleteProduct(p.id);
      card.appendChild(del);
    }
    row.appendChild(card);
  });
}

function startSponsorRotation() {
  const row = document.getElementById("sponsoriseRow");
  if (!row) return;
  if (sponsorTimer) clearInterval(sponsorTimer);
  
  let sponsors = allProducts.filter(p => p.category === "Sponsorisé").sort((a, b) => b.time - a.time);
  if (sponsors.length === 0) { row.innerHTML = ""; return; }
  
  function render(list) {
    row.innerHTML = "";
    list.slice(0, 4).forEach(p => {
      const card = document.createElement("div"); 
      card.className = "product-card";
      
      card.innerHTML = `
        <div class="image-container click-to-view" style="cursor:pointer;" title="Klike pou wè detay">
          <img src="${p.img}" class="async-image" onload="this.classList.add('loaded')">
        </div>
        <div class="click-to-view" style="cursor:pointer; font-weight: bold; margin-top: 10px;">${p.name}</div>
        <div style="margin-bottom: 10px;">${p.price} HTG</div>
        <button class="big-btn">Ajoute</button>
      `;
      
      const goToProduct = () => window.location.href = `produit.html?id=${p.id}`;
      card.querySelectorAll(".click-to-view").forEach(el => el.onclick = goToProduct);
      card.querySelector("button.big-btn").onclick = () => addToCart(p);
      
      if (window.currentUser?.role === "admin") {
        const del = document.createElement("button"); 
        del.textContent = "❌"; 
        del.classList.add("buttons");
        del.onclick = () => window.deleteProduct(p.id); 
        card.appendChild(del);
      }
      row.appendChild(card);
    });
  }
  render(sponsors);
  sponsorTimer = setInterval(() => { const first = sponsors.shift(); sponsors.push(first); render(sponsors); }, 5000);
}

// Nou fè l global pou auth.js ka rele l lè sitiyasyon itilizatè a chanje
window.renderProducts = function() {
  document.querySelectorAll(".spinner").forEach(sp => sp.style.display = "block");
  onValue(ref(db, "products"), snap => {
    allProducts = [];
    if (snap.exists()) { snap.forEach(s => { allProducts.push({ id: s.key, ...s.val() }); }); }
    
    renderCategory("macheRow", "Mache"); 
    renderCategory("immobilierRow", "Immobilier");
    renderCategory("abimanRow", "Abiman & Tekstil"); 
    renderCategory("zoutiRow", "Zouti");
    startSponsorRotation();
    
    document.querySelectorAll(".spinner").forEach(sp => sp.style.display = "none");
  });
};

function addToCart(p) { 
    cart.push(p); 
    renderCart(); 
    if(window.showToast) window.showToast(`${p.name} ajoute nan panyen w lan!`); 
}

function renderCart() {
  const cartItems = document.getElementById('cartItems'); 
  const totalPrice = document.getElementById('totalPrice'); 
  const cartCount = document.getElementById('cartCount');
  if(!cartItems) return;

  cartItems.innerHTML = ""; let total = 0;
  cart.forEach((p, i) => {
    total += Number(p.price);
    const div = document.createElement("div");
    div.innerHTML = `${p.name} (${p.price} HTG) <button style="color:red; cursor:pointer; border:none; background:none;">✖</button>`;
    div.querySelector("button").onclick = () => { cart.splice(i, 1); renderCart(); };
    cartItems.appendChild(div);
  });
  totalPrice.innerText = "Total: " + total + " HTG"; 
  cartCount.innerText = cart.length;
}

document.getElementById('cartBtn')?.addEventListener('click', () => document.getElementById('cartPopup').classList.toggle("show"));
document.getElementById('whatsappBtn')?.addEventListener('click', () => {
  if (cart.length === 0) return window.showToast("Panyen an vid!");
  let msg = "Bonjou, mwen vle kòmande sou Global Plis:\n\n"; let total = 0;
  cart.forEach(p => { msg += `▪️ ${p.name} - ${p.price} HTG\n`; total += Number(p.price); });
  msg += `\nTotal: ${total} HTG`; window.open("https://wa.me/50940488401?text=" + encodeURIComponent(msg));
});

const searchInput = document.getElementById("searchService");
if (searchInput) {
  searchInput.addEventListener("input", e => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) return window.renderProducts();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    ["macheRow", "immobilierRow", "abimanRow", "zoutiRow"].forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).innerHTML = "";
    });
    const map = { "Mache": "macheRow", "Immobilier": "immobilierRow", "Abiman & Tekstil": "abimanRow", "Zouti": "zoutiRow" };
    filtered.forEach(p => renderCategory(map[p.category], p.category, filtered));
  });
}

/* UI Jeneral (Menu) */
const menuBtn = document.getElementById('menuBtn');
const closeMenu = document.getElementById('closeMenu');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');

if (menuBtn) {
  menuBtn.onclick = () => { sideMenu.classList.add('active'); menuOverlay.classList.add('active'); };
}
if (closeMenu) {
  closeMenu.onclick = () => { sideMenu.classList.remove('active'); menuOverlay.classList.remove('active'); };
}

// Egzekite chajman pwodui yo tousuit, SAN LI PA TANN AUTH LA!
window.addEventListener("DOMContentLoaded", window.renderProducts);
