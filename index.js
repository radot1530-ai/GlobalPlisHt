// 🔹 IMPORT SOTI NAN FIREBASE-J.JS AK SDK YO
import { db, auth, provider } from "/firebase-j.js";
import { ref, push, set, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

/* ================= GLOBAL ================= */
let currentUser = null;
let allProducts = [];
let cart = [];
let isSignUpMode = false; 

const loginBtn = document.getElementById("loginBtn");
const adminPanel = document.getElementById("adminPanel");
const authModal = document.getElementById("authModal");

/* ================= JERE SISTÈM KONEKSYON AN ================= */

document.getElementById("toggleAuthMode")?.addEventListener("click", (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  document.getElementById("authTitle").innerText = isSignUpMode ? "Kreye yon Kont" : "Konekte";
  document.getElementById("authName").style.display = isSignUpMode ? "block" : "none";
  document.getElementById("manualAuthBtn").innerText = isSignUpMode ? "Enskri kounye a" : "Konekte";
  document.getElementById("authToggleText").innerText = isSignUpMode ? "Ou gentan gen yon kont?" : "Ou poko gen kont?";
  e.target.innerText = isSignUpMode ? "Konekte" : "Kreye youn kounye a";
});

document.getElementById("googleAuthBtn")?.addEventListener("click", () => {
  signInWithPopup(auth, provider).then(() => {
    authModal.style.display = "none";
  }).catch((error) => showToast("Erè Google: " + error.message));
});

document.getElementById("manualAuthBtn")?.addEventListener("click", () => {
  // ==========================================
  // 1. SEKRITE DOMÈN (Verifikasyon Otorizasyon)
  // ==========================================
  const domennOtorize = ["globalplisht.onrender.com", "localhost", "127.0.0.1"];
  const domennAktyel = window.location.hostname;
  
  if (!domennOtorize.includes(domennAktyel)) {
    return showToast("Erè Sekirite: Domèn sa a pa gen otorizasyon pou konekte oswa kreye kont sou sistèm nan.");
  }
  // ==========================================

  const email = document.getElementById("authEmail").value.trim();
  const pass = document.getElementById("authPassword").value.trim();
  const name = document.getElementById("authName").value.trim();

  if (!email || !pass) return showToast("Tanpri mete imel ak modpas ou.");
  if (pass.length < 6) return showToast("Modpas la dwe gen omwen 6 karaktè.");

  const btn = document.getElementById("manualAuthBtn");
  btn.innerText = "Ap chaje...";
  btn.disabled = true;

  if (isSignUpMode) {
    if (!name) { 
      btn.innerText = "Enskri kounye a"; 
      btn.disabled = false; 
      return showToast("Tanpri mete non w."); 
    }
    
    createUserWithEmailAndPassword(auth, email, pass)
      .then(async (userCred) => {
        await sendEmailVerification(userCred.user);
        await set(ref(db, `users/${userCred.user.uid}`), { non: name, email: email, role: "user", kreyeNan: Date.now() });
        await signOut(auth);
        
        authModal.style.display = "none";
        showToast("Kont ou kreye! Tanpri tcheke bwat lèt ou (spam tou) pou verifye imel la.", 6000);
        document.getElementById("toggleAuthMode").click();
      })
      .catch(err => {
        if (err.code === 'auth/email-already-in-use') {
          showToast("Imel sa a gen yon kont deja.");
        } else {
          showToast("Erè: " + err.message);
        }
      })
      .finally(() => { btn.innerText = "Enskri kounye a"; btn.disabled = false; });
  } else {
    signInWithEmailAndPassword(auth, email, pass)
      .then(async (userCred) => {
        if (!userCred.user.emailVerified) {
          await signOut(auth);
          showToast("Ou poko verifye imel ou. Tanpri tcheke mesaj nou te voye ba ou a.", 5000);
          btn.innerText = "Konekte"; 
          btn.disabled = false;
          return;
        }
        authModal.style.display = "none"; 
        showToast("Ou konekte ak siksè!");
      })
      .catch(err => {
        showToast("Imel oswa modpas la pa bon.");
      })
      .finally(() => { 
        if(btn.innerText === "Ap chaje...") {
          btn.innerText = "Konekte"; 
          btn.disabled = false; 
        }
      });
  }
});

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    if (currentUser) {
      if (confirm("Ou vle dekonekte?")) signOut(auth);
    } else {
      authModal.style.display = "flex";
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    let displayName = user.displayName || "Itilizatè";
    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);
    
    if (!snap.exists()) {
      await set(userRef, { non: displayName, email: user.email, role: "user", kreyeNan: Date.now() });
      currentUser = { uid: user.uid, role: "user", email: user.email };
    } else {
      const data = snap.val();
      displayName = data.non || displayName;
      currentUser = { uid: user.uid, role: data.role, email: user.email };
    }

    loginBtn.innerHTML = `<span>👤</span> Sòti (${displayName.split(" ")[0]})`;
    if(adminPanel) adminPanel.style.display = (currentUser.role === "admin") ? "block" : "none";
    
    renderProducts();
  } else {
    currentUser = null;
    loginBtn.innerHTML = `<span>🔐</span> Konekte`;
    if(adminPanel) adminPanel.style.display = "none";
    renderProducts();
  }
});


/* ================= REST KÒD POU STORE LA ================= */
window.addProduct = () => {
  if (!currentUser || currentUser.role !== "admin") return showToast("Sèlman administratè a ki ka ajoute pwodui.");
  const name = document.getElementById('pname').value.trim();
  const price = document.getElementById('pprice').value.trim();
  const desc = document.getElementById('description').value.trim();
  const file = document.getElementById('pfile').files[0];
  let category = document.getElementById('pcategory').value;
  if (!name || !price || !desc || !file) return showToast("Tout chan yo oblije ranpli");
  
  const btnSubmit = document.querySelector("#adminPanel button");
  btnSubmit.innerText = "Ap chaje..."; btnSubmit.disabled = true;
  
  const reader = new FileReader();
  reader.onload = () => {
    push(ref(db, "products"), {
      name, price, description: desc, category, img: reader.result, premium: category === "Sponsorisé", time: Date.now()
    }).then(() => {
      showToast("✅ Pwodui ajoute ak siksè!");
      document.getElementById('pname').value = ""; document.getElementById('pprice').value = "";
      document.getElementById('description').value = ""; document.getElementById('pfile').value = "";
    });
    btnSubmit.innerText = "Ajoute Pwodui"; btnSubmit.disabled = false;
  };
  reader.readAsDataURL(file);
};

window.deleteProduct = id => {
  if (!currentUser || currentUser.role !== "admin") return;
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
    
    if (currentUser?.role === "admin") {
      const del = document.createElement("button");
      del.textContent = "❌";
      del.classList.add("buttons");
      del.onclick = () => deleteProduct(p.id);
      card.appendChild(del);
    }
    
    row.appendChild(card);
  });
}

let sponsorTimer = null;
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
      
      if (currentUser?.role === "admin") {
        const del = document.createElement("button"); 
        del.textContent = "❌"; 
        del.classList.add("buttons");
        del.onclick = () => deleteProduct(p.id); 
        card.appendChild(del);
      }
      
      row.appendChild(card);
    });
  }
  
  render(sponsors);
  sponsorTimer = setInterval(() => { const first = sponsors.shift(); sponsors.push(first); render(sponsors); }, 5000);
}

function renderProducts() {
  document.querySelectorAll(".spinner").forEach(sp => sp.style.display = "block");
  onValue(ref(db, "products"), snap => {
    allProducts = [];
    if (snap.exists()) { snap.forEach(s => { allProducts.push({ id: s.key, ...s.val() }); }); }
    renderCategory("macheRow", "Mache"); renderCategory("immobilierRow", "Immobilier");
    renderCategory("abimanRow", "Abiman & Tekstil"); renderCategory("zoutiRow", "Zouti");
    startSponsorRotation();
    document.querySelectorAll(".spinner").forEach(sp => sp.style.display = "none");
  });
}

function addToCart(p) { cart.push(p); renderCart(); showToast(`${p.name} ajoute nan panyen w lan!`); }

function renderCart() {
  const cartItems = document.getElementById('cartItems'); const totalPrice = document.getElementById('totalPrice'); const cartCount = document.getElementById('cartCount');
  cartItems.innerHTML = ""; let total = 0;
  cart.forEach((p, i) => {
    total += Number(p.price);
    const div = document.createElement("div");
    div.innerHTML = `${p.name} (${p.price} HTG) <button style="color:red; cursor:pointer; border:none; background:none;">✖</button>`;
    div.querySelector("button").onclick = () => { cart.splice(i, 1); renderCart(); };
    cartItems.appendChild(div);
  });
  totalPrice.innerText = "Total: " + total + " HTG"; cartCount.innerText = cart.length;
}

document.getElementById('cartBtn').onclick = () => document.getElementById('cartPopup').classList.toggle("show");
document.getElementById('whatsappBtn').onclick = () => {
  if (cart.length === 0) return showToast("Panyen an vid!");
  let msg = "Bonjou, mwen vle kòmande sou Global Plis:\n\n"; let total = 0;
  cart.forEach(p => { msg += `▪️ ${p.name} - ${p.price} HTG\n`; total += Number(p.price); });
  msg += `\nTotal: ${total} HTG`; window.open("https://wa.me/50940488401?text=" + encodeURIComponent(msg));
};

const searchInput = document.getElementById("searchService");
if (searchInput) {
  searchInput.addEventListener("input", e => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) return renderProducts();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    ["macheRow", "immobilierRow", "abimanRow", "zoutiRow"].forEach(id => document.getElementById(id).innerHTML = "");
    const map = { "Mache": "macheRow", "Immobilier": "immobilierRow", "Abiman & Tekstil": "abimanRow", "Zouti": "zoutiRow" };
    filtered.forEach(p => renderCategory(map[p.category], p.category, filtered));
  });
}

window.addEventListener("DOMContentLoaded", renderProducts);

function showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, duration);
}

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
