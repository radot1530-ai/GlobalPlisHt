    // ==========================
// IMPORT BAZ DONE AK FIREBASE-J.JS
// ==========================
import { ref, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

// Enpòte 'db' dirèkteman nan fichye firebase-j.js ou a
// NÒT: Si fichye HTML sa a nan yon katab (tankou store/pwodui/produit.html), 
// ou ka bezwen chanje chemen an pou li tounen "../../firebase-j.js"
import { db } from "/firebase-j.js"; 

// Chèche ID pwodui a nan URL la (Egzanp: ?id=12345)
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

if (!productId) {
  document.getElementById('loadingMessage').innerText = "Erè: Nou pa jwenn pwodui sa a.";
} else {
  // Rale pwodui a nan Firebase
  const productRef = ref(db, 'products/' + productId);
  
  get(productRef).then((snapshot) => {
    if (snapshot.exists()) {
      const product = snapshot.val();
      
      // Mete ajou paj la
      document.title = product.name + " - Global Plis"; // Pou SEO
      document.getElementById('detailImg').src = product.img;
      document.getElementById('detailName').innerText = product.name;
      document.getElementById('detailPrice').innerText = product.price + " HTG";
      document.getElementById('detailDesc').innerText = product.description;
      
      document.getElementById('loadingMessage').style.display = 'none';
      document.getElementById('productDetail').style.display = 'flex';

      // Fonksyon kòmande dirèk
      document.getElementById('buyNowBtn').onclick = () => {
        let msg = `Bonjou, mwen enterese nan pwodui sa a sou sit la:\n\n▪️ ${product.name}\n▪️ Pri: ${product.price} HTG\n\nLyen: ${window.location.href}`;
        window.open("https://wa.me/50940488401?text=" + encodeURIComponent(msg));
      };
    } else {
      document.getElementById('loadingMessage').innerText = "Pwodui sa a pa egziste ankò.";
    }
  }).catch(error => {
    document.getElementById('loadingMessage').innerText = "Erè koneksyon: " + error.message;
  });
}
