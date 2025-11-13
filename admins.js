const form = document.getElementById("productForm");
const productList = document.getElementById("productList");
const message = document.getElementById("message");

// შეინახება ბრაუზერის localStorage-ში
let products = JSON.parse(localStorage.getItem("productsData")) || [];

function renderProducts() {
  productList.innerHTML = products.length
    ? products.map(p => `
      <div class="product-item">
        <strong>${p.title}</strong> (${p.brand}) — ${p.price} ₾
        <br><small>კატეგორია: ${p.category}</small>
      </div>
    `).join("")
    : "<p>პროდუქტი ჯერ არ არის დამატებული.</p>";

  localStorage.setItem("productsData", JSON.stringify(products));
}

form.addEventListener("submit", e => {
  e.preventDefault();

  const newProduct = {
    id: Date.now(),
    title: document.getElementById("title").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    price: parseFloat(document.getElementById("price").value),
    category: document.getElementById("category").value,
    img: document.getElementById("img").value.trim() || "images/default.jpg"
  };

  products.push(newProduct);
  renderProducts();
  message.textContent = "✅ პროდუქტი წარმატებით დაემატა!";
  message.style.color = "green";
  form.reset();
});
document.getElementById("addProductBtn").addEventListener("click", () => {
  const title = document.getElementById("title").value.trim();
  const brand = document.getElementById("brand").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const category = document.getElementById("category").value;
  const img = document.getElementById("img").value.trim() || "images/default.jpg";

  if (!title || !brand || !price || !category) {
    alert("გთხოვ შეავსო ყველა ველი!");
    return;
  }

  const newProduct = {
    id: Date.now(),
    title,
    brand,
    price,
    category,
    img
  };

  // 🧠 შენახვა localStorage-ში
  const existing = JSON.parse(localStorage.getItem("productsData")) || [];
  existing.push(newProduct);
  localStorage.setItem("productsData", JSON.stringify(existing));

  alert("✅ პროდუქტი წარმატებით დაემატა!");
  document.getElementById("productForm").reset();
});


renderProducts();
