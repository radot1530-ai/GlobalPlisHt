// ==========================
// IMPORT AK CONFIG FIREBASE
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1f26ZYfvHkFWf9x1Zm6bJlrUwbXWWBfk",
    authDomain: "globalplis-9f740.firebaseapp.com",
    databaseURL: "https://globalplis-9f740-default-rtdb.firebaseio.com",
    projectId: "globalplis-9f740",
    storageBucket: "globalplis-9f740.firebasestorage.app",
    messagingSenderId: "907235331553",
    appId: "1:907235331553:web:5b13a1497f857a0fec16a0",
    measurementId: "G-R91CLS4MY8"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================
// AFICHE KOU YO (Li konpatib ak Base64)
// ==========================
const courseWrapper = document.getElementById("courseWrapper");

if (courseWrapper) {
  // 1. Mete mesaj chajman an (Sistèm Lazy/Loading)
  courseWrapper.innerHTML = `
    <div style="width: 100%; text-align: center; padding: 40px; color: #1e3f8a;">
      <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
      <p>⏳ Ap chaje kou yo... Tanpri tann.</p>
    </div>
  `;

  onValue(ref(db, "kou"), (snapshot) => {
    courseWrapper.innerHTML = ""; // Efase mesaj chajman an lè done yo rive
    
    if (!snapshot.exists()) {
      courseWrapper.innerHTML = "<p>Pa gen kou ki disponib pou kounye a.</p>";
      return;
    }
    
    Object.entries(snapshot.val()).forEach(([id, kou]) => {
      // Mwen itilize klas CSS ou te bay yo pou kòd la pi pwòp
      courseWrapper.innerHTML += `
        <div class="course-card" style="width:300px;">
          <img src="${kou.imajUrl}" alt="${kou.non}">
          <div class="course-content">
            <span class="course-badge">${kou.badge || "FÒMASYON"}</span>
            <h2 class="course-title">${kou.non}</h2>
            <p class="course-objective"><strong>Objektif:</strong> ${kou.objektif}</p>
            <div class="course-meta">
              <span>⏰ ${kou.dire}</span> | <span>📈 ${kou.nivo}</span>
            </div>
            <div class="btn-group">
              <span class="btn btn-price">${kou.pri} HTG</span>
              <a href="kou/detay/globalplis/kou.html?id=${id}" class="btn btn-enroll">Detay / Enskri</a>
            </div>
          </div>
        </div>
      `;
    });
  }, (error) => {
    // Si gen pwoblèm entènèt ki anpeche done yo vini
    courseWrapper.innerHTML = "<p style='color:red;'>Koneksyon an echwe. Tanpri verifye entènèt ou.</p>";
  });
}

// ==========================
// SLIDER PIBLISITE PRO
// ==========================

const slides = document.getElementById("slides");
const dots = document.getElementById("dots");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let current = 0;
let total = 0;
let autoPlayInterval;

// Fonksyon pou chaje done yo
async function loadSliderData() {
    try {
        const response = await fetch("publicites.json");
        if (!response.ok) throw new Error("Pa ka jwenn fichye JSON lan");
        
        const data = await response.json();
        total = data.length;

        if (total === 0) return; // Si pa gen done, pa fè anyen

        // Kreye HTML pou chak imaj
        data.forEach((item, index) => {
            slides.innerHTML += `
                <div class="slide">
                    <a href="${item.lien || '#'}">
                        <img src="${item.image}" alt="Piblisite ${index + 1}">
                    </a>
                </div>
            `;
            // Kreye pwen yo
            dots.innerHTML += `<span class="dot" data-index="${index}"></span>`;
        });

        // Ajoute evenman sou pwen yo tou pou moun ka klike sou yo
        document.querySelectorAll(".dot").forEach((dot, index) => {
            dot.addEventListener("click", () => {
                current = index;
                afficher();
                resetInterval(); // Rekòmanse tan an
            });
        });

        afficher();
        startAutoPlay();

    } catch (error) {
        console.error("Erè pandan chajman slider a:", error);
    }
}

// Fonksyon pou afiche imaj aktyèl la
function afficher() {
    const slideWidth = 100;
    slides.style.transform = `translateX(-${current * slideWidth}%)`;

    // Mete a jou pwen yo
    document.querySelectorAll(".dot").forEach((d, i) => {
        d.classList.toggle("active", i === current);
    });
}

// Fonksyon pou pase nan imaj swivan
function nextSlide() {
    current = (current + 1) % total;
    afficher();
}

// Fonksyon pou tounen nan imaj anvan
function prevSlide() {
    current = (current - 1 + total) % total;
    afficher();
}

// Jere bouton yo
nextBtn.addEventListener("click", () => {
    nextSlide();
    resetInterval();
});

prevBtn.addEventListener("click", () => {
    prevSlide();
    resetInterval();
});

// Otomatikman chanje imaj chak 4 segonn
function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 4000);
}

// Si yon moun klike, nou rekòmanse tan an pou l pa chanje twò vit nan figi l
function resetInterval() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
}

// Kòmanse chaje done yo
loadSliderData();
