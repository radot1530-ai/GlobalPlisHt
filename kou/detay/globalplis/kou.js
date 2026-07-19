// 🔹 IMPORT SOTI NAN FIREBASE-J.JS AK SDK YO (v12.15.0)
import { db, auth, provider } from "/firebase-j.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import { onAuthStateChanged, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

const loadingSpinner = document.getElementById('loadingSpinner');
const courseDetailCard = document.getElementById('courseDetailCard');
const actionSection = document.getElementById('actionSection');

if (!courseId) {
  window.location.href = "/index.html"; // Voye l tounen si pa gen ID
}

// 1. Chaje Enfòmasyon Kou a nan Navigatè a
onValue(ref(db, `kou/${courseId}`), (snapshot) => {
  if (!snapshot.exists()) {
    loadingSpinner.innerHTML = "<p style='color:red;'>Kou sa pa disponib ankò.</p>";
    return;
  }

  const kou = snapshot.val();
  
  // Mete done yo nan HTML la
  document.getElementById('kouImaj').src = kou.imajUrl;
  document.getElementById('kouBadge').innerText = kou.badge || "FÒMASYON";
  document.getElementById('kouTit').innerText = kou.non;
  document.getElementById('kouDire').innerText = kou.dire;
  document.getElementById('kouNivo').innerText = kou.nivo;
  document.getElementById('kouObjektif').innerText = kou.objektif;
  document.getElementById('kouDeskripsyon').innerText = kou.deskripsyon || "Deskripsyon konplè kou sa ap ede w metrize domèn nan pafètman.";
  
  // Jere afichaj pri a
  const isFree = (kou.pri == 0 || String(kou.pri).toLowerCase() === "gratis");
  document.getElementById('kouPri').innerText = isFree ? "GRATIS" : `${kou.pri} HTG`;

  // Retire Loading, Montre Kat la
  loadingSpinner.style.display = "none";
  courseDetailCard.style.display = "block";

  // 2. Jere Aksyon Itilizatè a (Koneksyon / Pèman)
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // ITILIZATÈ PA KONEKTE: Pa montre okenn done pèman nan navigatè a
      actionSection.innerHTML = `
        <h3 style="color: #333; margin-top: 0;">Ou dwe enskri pou swiv kou sa</h3>
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Kreye yon kont Global Plis +∞ pou w ka jwenn aksè ak fòmasyon an oswa fè pèman an.</p>
        <button id="loginBtnEnroll" class="btn btn-google"><i class="fab fa-google"></i> Konekte ak Google pou Enskri</button>
      `;
      // Nou itilize "provider" ki soti nan firebase-j.js la
      document.getElementById('loginBtnEnroll').addEventListener('click', () => {
        signInWithPopup(auth, provider).catch((error) => {
          alert("Erè lè w ap konekte ak Google: " + error.message);
        });
      });
    } else {
      // ITILIZATÈ KONEKTE: Tcheke si l gen dwa sou kou a
      verifyEnrollment(user.uid, kou, isFree);
    }
  });
});

function verifyEnrollment(userId, kou, isFree) {
  onValue(ref(db, `enskripsyon/${userId}/${courseId}`), (snapshot) => {
    const status = snapshot.exists() ? snapshot.val().estati : "poko";

    if (status === "valide") {
      actionSection.innerHTML = `
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border: 1px solid #a7f3d0;">
          <h3 style="color: #059669; margin: 0 0 10px 0;"><i class="fas fa-check-circle"></i> Enskripsyon w Valide!</h3>
          <p style="margin-bottom: 15px;">Ou gentan gen aksè ak tout modil kou sa a.</p>
          <a href="/kou/detay/globalplis/klas/sal_de_klas.html?id=${courseId}" class="btn" style="background: #1e3f8a; color: white; text-decoration: none; display: inline-block; padding: 10px 20px; border-radius: 5px;">Antre nan Sal de Klas la</a>
        </div>
      `;
    } else if (status === "ann_atant") {
      actionSection.innerHTML = `
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 1px solid #fde68a;">
          <h3 style="color: #d97706; margin: 0 0 10px 0;"><i class="fas fa-hourglass-half"></i> Pèman an anba verifikasyon</h3>
          <p style="margin: 0;">Administratè yo ap verifye kòd tranzaksyon w lan. Aksè w la ap debloke trè byento.</p>
          <div style="text-align: center; margin-top: 15px;">
            <a href="https://wa.me/50940488401" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold;">
              <i class="fab fa-whatsapp"></i> Kontakte n pou swivi
            </a>
          </div>
        </div>
      `;
    } else {
      // POKO ENSKRI
      if (isFree) {
        // KOU GRATIS: Sote pèman, anrejistre dirèk
        actionSection.innerHTML = `
          <h3 style="color: #1e3f8a;">Kou sa se kado!</h3>
          <p>Klike anba a pou w ajoute kou sa nan kont ou imedyatman san w pa peye anyen.</p>
          <button id="enrollFreeBtn" class="btn btn-free" style="background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;"><i class="fas fa-unlock"></i> Kòmanse Kou a Gratis</button>
        `;
        document.getElementById('enrollFreeBtn').addEventListener('click', () => {
          set(ref(db, `enskripsyon/${userId}/${courseId}`), {
            estati: "valide",
            dat: new Date().toISOString(),
            tip: "gratis"
          });
        });
      } else {
        // KOU PEYE: Montre fòm pèman ak Logo MonCash/NatCash
        actionSection.innerHTML = `
          <div style="text-align: left;">
            <h3 style="color: #1e3f8a; text-align: center; margin-top: 0;">Pèman Fòmasyon an</h3>
            <p style="font-size: 14px; color: #555; text-align: center;">Fè yon transfè <strong>${kou.pri} HTG</strong> sou youn nan nimewo sa yo:</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0; color: #dc2626;"><strong>🔴 MonCash:</strong> +509 49348086 (PHIL.. SYL...)</p>
              <p style="margin: 5px 0; color: #0284c7;"><strong>🔵 NatCash:</strong> +509 32923206 (FLA.... RIG....)</p>
            </div>
            
            <div class="payment-input-group" style="margin-bottom: 12px;">
              <label for="whatsappNum" style="display: block; margin-bottom: 5px; font-weight: bold;"><i class="fab fa-whatsapp" style="color:#25D366;"></i> Nimewo WhatsApp ou:</label>
              <input type="text" id="whatsappNum" placeholder="+509 XXXX XXXX" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>

            <div class="payment-input-group" style="margin-bottom: 12px;">
              <label for="senderInfo" style="display: block; margin-bottom: 5px; font-weight: bold;">Nimewo transfè a OSWA Non Biznis la:</label>
              <input type="text" id="senderInfo" placeholder="Eg: +509 4XXX XXXX oswa Global Biz" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>

            <div class="payment-input-group" style="margin-bottom: 15px;">
              <label for="transCode" style="display: block; margin-bottom: 5px; font-weight: bold;">Kòd Tranzaksyon an (Trans. ID):</label>
              <input type="text" id="transCode" placeholder="Egzanp: 1234567890" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
            </div>
            
            <button id="submitPaymentBtn" class="btn btn-pay" style="width: 100%; background: #1e3f8a; color: white; padding: 12px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;"><i class="fas fa-paper-plane"></i> Soumèt Pèman an</button>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://wa.me/50940488401" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold; border: 1px solid #25D366; padding: 8px 15px; border-radius: 20px; display: inline-block;">
                <i class="fab fa-whatsapp" style="font-size: 18px; vertical-align: middle;"></i> Kontakte n pou plis enfòmasyon
              </a>
            </div>
          </div>
        `;

        document.getElementById('submitPaymentBtn').addEventListener('click', () => {
          const code = document.getElementById('transCode').value.trim();
          const whatsapp = document.getElementById('whatsappNum').value.trim();
          const senderInfo = document.getElementById('senderInfo').value.trim();

          if(code.length > 4 && whatsapp.length > 7 && senderInfo.length > 2) {
            
            const btn = document.getElementById('submitPaymentBtn');
            btn.innerText = "Ap chaje...";
            btn.disabled = true;

            set(ref(db, `enskripsyon/${userId}/${courseId}`), {
              estati: "ann_atant",
              kod_tranzaksyon: code,
              whatsapp: whatsapp,
              info_transfe: senderInfo, // Anrejistre nimewo/biznis la
              montan: kou.pri,
              dat: new Date().toISOString()
            }).then(() => {
              alert("✅ Mèsi! Nou resevwa pèman w lan. Administratè a ap valide l byento.");
              window.location.reload(); // Rechaje paj la
            }).catch(err => {
              alert("Erè: " + err.message);
              btn.innerText = "Soumèt Pèman an";
              btn.disabled = false;
            });
          } else {
            alert("⚠️ Tanpri ranpli tout chan yo kòrèkteman.");
          }
        });
      }
    }
  });
}
