import { db, auth, provider } from "./firebase-j.js";
    import { ref, push, set, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
    import { 
      signInWithPopup, 
      onAuthStateChanged, 
      signOut, 
      createUserWithEmailAndPassword, 
      signInWithEmailAndPassword, 
      sendEmailVerification,
      sendPasswordResetEmail 
    } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

    /* ================= GLOBAL ================= */
    let currentUser = null;
    let allProducts = [];
    let cart = [];
    let isSignUpMode = false; 

    const loginBtn = document.getElementById("loginBtn");
    const adminPanel = document.getElementById("adminPanel");
    const authModal = document.getElementById("authModal");

    window.chanjeOnglet = function(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      const target = document.getElementById(tabId);
      if(target) target.style.display = 'block';
      const tabBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
      if(tabBtn) tabBtn.classList.add('active');
    };

    /* Fonksyon pou Wè Plis nan Kou yo */
    window.toggleObjektif = function(btn) {
      const p = btn.previousElementSibling;
      p.classList.toggle("expanded");
      if(p.classList.contains("expanded")) {
        btn.innerText = "Wè mwens";
      } else {
        btn.innerText = "Wè plis";
      }
    };

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
      const email = document.getElementById("authEmail").value.trim();
      const pass = document.getElementById("authPassword").value.trim();
      const name = document.getElementById("authName").value.trim();

      if (!email || !pass) return showToast("Tanpri mete imel ak modpas ou.");
      if (pass.length < 6) return showToast("Modpas la dwe gen omwen 6 karaktè.");

      const btn = document.getElementById("manualAuthBtn");
      btn.innerText = "Ap chaje..."; btn.disabled = true;

      if (isSignUpMode) {
        if (!name) { btn.innerText = "Enskri kounye a"; btn.disabled = false; return showToast("Tanpri mete non w."); }
        createUserWithEmailAndPassword(auth, email, pass)
          .then(async (userCred) => {
            await sendEmailVerification(userCred.user);
            await set(ref(db, `users/${userCred.user.uid}`), { non: name, email: email, role: "user", kreyeNan: Date.now() });
            await signOut(auth);
            authModal.style.display = "none";
            showToast("Kont ou kreye! Tanpri tcheke bwat lèt ou pou verifye imel la.", 6000);
            document.getElementById("toggleAuthMode").click();
          })
          .catch(err => showToast("Erè: " + err.message))
          .finally(() => { btn.innerText = "Enskri kounye a"; btn.disabled = false; });
      } else {
        signInWithEmailAndPassword(auth, email, pass)
          .then(async (userCred) => {
            if (!userCred.user.emailVerified) {
              showToast("Ou poko verifye imel ou. Tanpri tcheke bwat lèt ou.");
              await signOut(auth);
              btn.innerText = "Konekte"; btn.disabled = false;
              return;
            }
            authModal.style.display = "none"; 
            showToast("Ou konekte ak siksè!");
          })
          .catch(() => showToast("Imel oswa modpas la pa bon."))
          .finally(() => { btn.innerText = "Konekte"; btn.disabled = false; });
      }
    });

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
      } else {
        currentUser = null;
        loginBtn.innerHTML = `<span>🔐</span> Konekte`;
        if(adminPanel) adminPanel.style.display = "none";
      }
      renderProducts();
    });

    /* ================= STORE & PRODUCTS ================= */
    window.addProduct = () => {
      if (!currentUser || currentUser.role !== "admin") return showToast("Sèlman administratè a ki ka ajoute pwodui.");
      const name = document.getElementById('pname').value.trim();
      const price = document.getElementById('pprice').value.trim();
      const desc = document.getElementById('description').value.trim();
      const file = document.getElementById('pfile').files[0];
      let category = document.getElementById('pcategory').value;
      if (!name || !price || !desc || !file) return showToast("Tout chan yo oblije ranpli");

      const reader = new FileReader();
      reader.onload = () => {
        push(ref(db, "products"), {
          name, price, description: desc, category, img: reader.result, premium: category === "Sponsorisé", time: Date.now()
        }).then(() => {
          showToast("✅ Pwodui ajoute ak siksè!");
          document.getElementById('pname').value = ""; document.getElementById('pprice').value = "";
          document.getElementById('description').value = ""; document.getElementById('pfile').value = "";
        });
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

        /* Kat Pwodui: Wotè imaj pase a 120px pito 160px pou evite depasman */
        card.innerHTML = `
          <a href="store/pwodui/produit.html?id=${p.id}" style="display:block; text-decoration:none; color:inherit;">
            <div class="image-container" style="height: 120px; border-radius: 8px 8px 0 0;" title="Klike pou wè detay">
              <img src="${p.img}" loading="lazy" class="async-image" onload="this.classList.add('loaded')" alt="${p.name}">
            </div>
            <div style="font-weight: bold; margin-top: 10px;">${p.name}</div>
          </a>
          <div style="margin-bottom: 10px;">${p.price} HTG</div>
          <button class="big-btn">Ajoute</button>
        `;

        card.querySelector("button.big-btn").onclick = () => addToCart(p);

        if (currentUser?.role === "admin") {
          const del = document.createElement("button");
          del.textContent = "❌ Efase";
          del.style.marginTop = "5px";
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

          /* Wotè mete nan 120px menm jan ak enstriksyon anlè a */
          card.innerHTML = `
            <a href="store/pwodui/produit.html?id=${p.id}" style="display:block; text-decoration:none; color:inherit;">
              <div class="image-container" style="height: 120px; border-radius: 8px 8px 0 0;" title="Klike pou wè detay">
                <img src="${p.img}" loading="lazy" class="async-image" onload="this.classList.add('loaded')" alt="${p.name}">
              </div>
              <div style="font-weight: bold; margin-top: 10px;">${p.name}</div>
            </a>
            <div style="margin-bottom: 10px;">${p.price} HTG</div>
            <button class="big-btn">Ajoute</button>
          `;

          card.querySelector("button.big-btn").onclick = () => addToCart(p);

          if (currentUser?.role === "admin") {
            const del = document.createElement("button"); 
            del.textContent = "❌ Efase"; 
            del.style.marginTop = "5px";
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
      onValue(ref(db, "products"), snap => {
        allProducts = [];
        if (snap.exists()) { snap.forEach(s => { allProducts.push({ id: s.key, ...s.val() }); }); }
        renderCategory("macheRow", "Mache"); 
        renderCategory("immobilierRow", "Immobilier");
        renderCategory("abimanRow", "Abiman & Tekstil"); 
        renderCategory("zoutiRow", "Zouti");
        startSponsorRotation();
      });
    }

    /* ================= KOU (COURSES) AK VOIR PLUS ================= */
    const courseWrapper = document.getElementById("courseWrapper");
    if (courseWrapper) {
      onValue(ref(db, "kou"), (snapshot) => {
        courseWrapper.innerHTML = ""; 
        if (!snapshot.exists()) {
          courseWrapper.innerHTML = "<p>Pa gen kou ki disponib pou kounye a.</p>";
          return;
        }
        Object.entries(snapshot.val()).forEach(([id, kou]) => {
          courseWrapper.innerHTML += `
            <div class="course-card" style="width:300px; border:1px solid #ddd; border-radius:16px; background:#fff; overflow:hidden;">
              <div class="image-container" style="height: 190px;">
                <img src="${kou.imajUrl}" alt="${kou.non}" loading="lazy" class="async-image" onload="this.classList.add('loaded')">
              </div>
              <div class="course-content" style="padding: 15px;">
                <span class="course-badge" style="background:#e0e7ff; color:#3730a3; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">${kou.badge || "FÒMASYON"}</span>
                <h2 class="course-title" style="margin:10px 0; font-size:18px;">${kou.non}</h2>
                
                <div style="margin-bottom:15px;">
                  <p class="course-objective objektif-text" style="font-size:14px; color:#555; margin-bottom: 0;"><strong>Objektif:</strong> ${kou.objektif}</p>
                  <button class="voir-plus-btn" onclick="toggleObjektif(this)">Wè plis</button>
                </div>

                <div class="course-meta" style="margin-bottom:15px; font-size:13px; color:#666;">
                  <span>⏰ ${kou.dire || "N/A"}</span> | <span>📈 ${kou.nivo || "Tout nivo"}</span>
                </div>
                <div class="btn-group" style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="btn btn-price" style="font-weight:bold; color:#1e3f8a;">${kou.pri} HTG</span>
                  <a href="kou/detay/globalplis/kou.html?id=${id}" class="btn btn-enroll" style="background:#3b82f6; color:#fff; padding:8px 12px; text-decoration:none; border-radius:6px; font-size:14px;">Detay / Enskri</a>
                </div>
              </div>
            </div>
          `;
        });
      });
    }

    /* ================= CART & UI UTILS ================= */
    function addToCart(p) { cart.push(p); renderCart(); showToast(`${p.name} ajoute nan panyen w lan!`); }

    function renderCart() {
      const cartItems = document.getElementById('cartItems'); 
      const totalPrice = document.getElementById('totalPrice'); 
      const cartCount = document.getElementById('cartCount');
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

    document.getElementById('cartBtn').onclick = () => document.getElementById('cartPopup').classList.toggle("show");
    document.getElementById('whatsappBtn').onclick = () => {
      if (cart.length === 0) return showToast("Panyen an vid!");
      let msg = "Bonjou, mwen vle kòmande sou Global Plis:\n\n"; let total = 0;
      cart.forEach(p => { msg += `▪️ ${p.name} - ${p.price} HTG\n`; total += Number(p.price); });
      msg += `\nTotal: ${total} HTG`; window.open("https://wa.me/50940488401?text=" + encodeURIComponent(msg));
    };

    function showToast(message, duration = 3000) {
      const toast = document.getElementById("toast");
      if(toast) { toast.innerText = message; toast.style.display = "block"; setTimeout(() => { toast.style.display = "none"; }, duration); }
    }

    window.addEventListener("DOMContentLoaded", () => {
      /* Retire Preloader an prèske menm kote a pou bay aksè ak "Skeleton Cards" yo */
      setTimeout(() => {
        const p = document.getElementById('globalPreloader');
        if(p) { p.classList.add('preloader-hidden'); setTimeout(()=> p.style.display='none', 300); }
      }, 150);

      const menuBtn = document.getElementById('menuBtn');
      const closeMenu = document.getElementById('closeMenu');
      const sideMenu = document.getElementById('sideMenu');
      const menuOverlay = document.getElementById('menuOverlay');

      if (menuBtn) {
        menuBtn.onclick = () => { sideMenu.classList.add('active'); menuOverlay.classList.add('active'); };
      }
      if (closeMenu) {
        closeMenu.onclick = menuOverlay.onclick = () => { 
          sideMenu.classList.remove('active'); menuOverlay.classList.remove('active'); 
        };
      }
    });