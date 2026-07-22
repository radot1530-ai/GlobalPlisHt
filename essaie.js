// ======================================================================
// 1. IMPORT AK CONFIG FIREBASE (Sèlman sa k nesesè pou DB a)
// ======================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
// ❌ Mwen retire import Auth la isit la

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

// Initialisation globale
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
// ❌ Mwen retire const auth ak const provider isit la


// ======================================================================
// 2. LOJIK POU AFICHE KOU YO SOT NAN FIREBASE (Realtime Database)
// ======================================================================
const courseWrapper = document.getElementById("courseWrapper");

if (courseWrapper) {
  courseWrapper.innerHTML = `
    <div style="width: 100%; text-align: center; padding: 40px; color: #1e3f8a;">
      <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
      <p>⏳ Ap chaje kou yo... Tanpri tann.</p>
    </div>
  `;

  onValue(ref(db, "kou"), (snapshot) => {
    courseWrapper.innerHTML = ""; 
    
    if (!snapshot.exists()) {
      courseWrapper.innerHTML = "<p>Pa gen kou ki disponib pou kounye a.</p>";
      return;
    }
    
    Object.entries(snapshot.val()).forEach(([id, kou]) => {
      courseWrapper.innerHTML += `
        <div class="course-card" style="width:300px;">
          <!-- 🔹 NOUVO LOJIK IMAJ LA POU KOU YO 🔹 -->
          <div class="image-container" style="height: 190px; border-radius: 16px 16px 0 0;">
            <img src="${kou.imajUrl}" alt="${kou.non}" loading="lazy" class="async-image" onload="this.classList.add('loaded')">
          </div>
          
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
    courseWrapper.innerHTML = "<p style='color:red;'>Koneksyon an echwe. Tanpri verifye entènèt ou.</p>";
  });
}


// ======================================================================
// 3. LOJIK POU SLIDER PIBLISITE PRO (Pa itilize Firebase, sèlman JSON)
// ======================================================================
const slides = document.getElementById("slides");
const dots = document.getElementById("dots");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let current = 0;
let total = 0;
let autoPlayInterval;

async function loadSliderData() {
    try {
        const response = await fetch("publicites.json");
        if (!response.ok) throw new Error("Pa ka jwenn fichye JSON lan");
        
        const data = await response.json();
        total = data.length;

        if (total === 0) return;

        data.forEach((item, index) => {
            slides.innerHTML += `
                <div class="slide">
                    <a href="${item.lien || '#'}">
                        <!-- 🔹 NOUVO LOJIK IMAJ LA POU SLIDER A 🔹 -->
                        <div class="image-container" style="height: auto; aspect-ratio: 16 / 9; border-radius: 16px;">
                            <img src="${item.image}" alt="Piblisite ${index + 1}" class="async-image" onload="this.classList.add('loaded')">
                        </div>
                    </a>
                </div>
            `;
            dots.innerHTML += `<span class="dot" data-index="${index}"></span>`;
        });

        document.querySelectorAll(".dot").forEach((dot, index) => {
            dot.addEventListener("click", () => {
                current = index;
                afficher();
                resetInterval(); 
            });
        });

        afficher();
        startAutoPlay();

    } catch (error) {
        console.error("Erè pandan chajman slider a:", error);
    }
}

function afficher() {
    const slideWidth = 100;
    slides.style.transform = `translateX(-${current * slideWidth}%)`;

    document.querySelectorAll(".dot").forEach((d, i) => {
        d.classList.toggle("active", i === current);
    });
}

function nextSlide() {
    current = (current + 1) % total;
    afficher();
}

function prevSlide() {
    current = (current - 1 + total) % total;
    afficher();
}

if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        nextSlide();
        resetInterval();
    });
}

if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        prevSlide();
        resetInterval();
    });
}

function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 4000);
}

function resetInterval() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
}

// Sèlman chaje slider a si eleman an egziste nan paj la
if (slides) {
    loadSliderData();
}
