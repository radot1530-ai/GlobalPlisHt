// app.js

// Chaje done soti nan data.js
// Si ou mete data.js nan menm folder a index.html, li pral travay

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      // Chanje active tab
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Montre kontni ki koresponn
      tabContents.forEach(tc => {
        tc.classList.remove("active");
        if(tc.id === target) tc.classList.add("active");
      });

      // Afich done dinamik
      if(target === "accueil") loadKay();
      if(target === "terres") loadTerres();
      if(target === "services") loadServices();
      if(target=== "konkou") loadKonkou();
    });
  });

  // Chaje kay nan premye fwa
  loadKay();
});

// Fonksyon pou montre kay
function loadKay() {
  const container = document.getElementById("accueil");
  container.innerHTML = "<h2></h2>";

  kayList.forEach(kay => {
    const div = document.createElement("div");
    div.className = "property-card";
    div.innerHTML = `
      <img src="${kay.imaj}" alt="${kay.tit}" class="property-img">
      <h3>${kay.tit}</h3>
      <p>${kay.deskripsyon}</p>
      <strong>${kay.pri}</strong>
   <p>${kay.adresse}</p>
      <a href="https://wa.me/+50940488401"  target="blank" class="whatsapp-btn">${kay.adminwhatsapp}</a>
    `;
    container.appendChild(div);
  });
}

// Fonksyon pou montre tè
function loadTerres() {
  const container = document.getElementById("terres");
  container.innerHTML = "<h2>🌿 Tè ak Jaden</h2>";

  terresList.forEach(ter => {
    const div = document.createElement("div");
    div.className = "property-card";
    div.innerHTML = `
<img src="${ter.imaj}" alt="${ter.tit}" class="card-img">
      <h3>${ter.tit}</h3>
      <p>${ter.deskripsyon}</p>
      <strong>${ter.pri}</strong>
      <p>${ter.adresse}</p>
<a href="https://wa.me/+50940488401"  target="blank" class="whatsapp-btn">${ter.adminwhatsapp}</a>
    `;
    container.appendChild(div);
  });
}

// Fonksyon pou montre sèvis
function loadServices() {
  const container = document.getElementById("services");
  container.innerHTML = "<h2>🔧 Sèvis disponib</h2>";

  servicesList.forEach(serv => {
    const div = document.createElement("div");
    div.className = "property-card";
    div.innerHTML = `
    <img src="${serv.imaj}" alt="${serv.tit}" class="property-img">
      <h3>${serv.tit}</h3>
      <p>${serv.deskripsyon}</p>
      <p><strong>${serv.pri}</strong></p>
         <p><strong>${serv.adresse}</strong></p>
      <a href="https://wa.me/+50940488401"  target="blank" class="whatsapp-btn">${serv.adminwhatsapp}</a>
    `;
    container.appendChild(div);
  });
}
