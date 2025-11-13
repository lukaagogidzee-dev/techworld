// ===============================
// 📦 პროდუქციის ჩატვირთვა JSON-დან
// ===============================
const grid = document.getElementById("productGrid");
const categoryList = document.getElementById("categoryList");
const filterSection = document.getElementById("filterSection");
const searchInput = document.getElementById("searchInput");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mobileSearchInput = document.getElementById("mobileSearchInput");

let products = [];
let filters = { search: "", category: "ALL", brands: [], minPrice: 0, maxPrice: 6000 };
let currentPage = 1;
const productsPerPage = 8;

// 📑 კატეგორიების შესაბამისი ბრენდები
const categoryBrands = {
  "MOB": ["Apple", "Samsung", "Xiaomi", "Huawei", "OnePlus"],
  "IT": ["Dell", "HP", "Asus", "Lenovo", "Acer", "MSI"],
  "LDA": ["Bosch", "LG", "Whirlpool", "Beko"],
  "SDA": ["Philips", "Tefal", "Braun"],
  "TV": ["LG", "Samsung", "Sony", "TCL"]
};

// ===============================
// 🌐 პროდუქტების წამოღება JSON-დან
// ===============================
async function loadProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error("პროდუქციის ფაილი ვერ ჩაიტვირთა 😕");
    products = await response.json();
    renderFilters();
    renderProducts();
  } catch (err) {
    console.error(err);
    if (grid) grid.innerHTML = `<p style="color:red; text-align:center;">❌ ${err.message}</p>`;
  }
}

// 🚀 ვიძახებ ჩატვირთვას (მხოლოდ მთავარ გვერდზე)
if (document.getElementById("productGrid")) loadProducts();

// ===============================
// 📱 მენიუს ღილაკი
// ===============================
menuToggle?.addEventListener("click", () => sidebar.classList.toggle("active"));

// 📱 მობილურის ძიების ველი
mobileSearchInput?.addEventListener("input", e => {
  filters.search = e.target.value;
  currentPage = 1;
  renderProducts();
});

// ===============================
// 🔍 საძიებო ველი
// ===============================
searchInput?.addEventListener("input", e => {
  filters.search = e.target.value;
  currentPage = 1;
  renderProducts();
});

// ===============================
// 🗂 კატეგორიები
// ===============================
categoryList?.addEventListener("click", e => {
  if (e.target.tagName === "LI") {
    document.querySelectorAll("#categoryList li").forEach(li => li.classList.remove("active"));
    e.target.classList.add("active");
    filters.category = e.target.dataset.category;
    filters.brands = [];
    currentPage = 1;
    renderFilters();
    renderProducts();
  }
});

// ===============================
// 🎚 ფილტრები
// ===============================
function renderFilters() {
  if (!filterSection) return;

  if (filters.category === "ALL") {
    filterSection.innerHTML = `<p>აირჩიე კატეგორია ფილტრის სანახავად.</p>`;
    return;
  }

  const brands = categoryBrands[filters.category] || [];

  filterSection.innerHTML = `
    <div class="filter-group">
      <h4><i class="fa-solid fa-tags"></i> ბრენდები</h4>
      <div class="filter-content">
        ${brands.map(b => `<label><input type="checkbox" value="${b}"> ${b}</label><br>`).join("")}
      </div>
    </div>

    <div class="filter-group">
      <h4><i class="fa-solid fa-money-bill-wave"></i> ფასი</h4>
      <div class="filter-content">
        <div class="price-range">
          <div class="slider-track" id="sliderTrack"></div>
          <input type="range" id="minRange" min="0" max="6000" value="${filters.minPrice}" step="50">
          <input type="range" id="maxRange" min="0" max="6000" value="${filters.maxPrice}" step="50">
        </div>
        <div class="price-values">
          <span id="minPriceVal">${filters.minPrice} ₾</span>
          <span id="maxPriceVal">${filters.maxPrice} ₾</span>
        </div>
      </div>
    </div>

    <button class="reset-btn" id="resetFilters"><i class="fa-solid fa-rotate-right"></i> განულება</button>
  `;

  // ✅ ბრენდების ფილტრი
  document.querySelectorAll(".filter-content input[type='checkbox']").forEach(cb =>
    cb.addEventListener("change", () => {
      filters.brands = Array.from(document.querySelectorAll(".filter-content input:checked")).map(cb => cb.value);
      currentPage = 1;
      renderProducts();
    })
  );

  // ✅ ფასის სლაიდერი
  const minRange = document.getElementById("minRange");
  const maxRange = document.getElementById("maxRange");
  const track = document.getElementById("sliderTrack");
  const minLabel = document.getElementById("minPriceVal");
  const maxLabel = document.getElementById("maxPriceVal");

  function fillTrack() {
    const min = parseInt(minRange.value);
    const max = parseInt(maxRange.value);
    const percent1 = (min / 6000) * 100;
    const percent2 = (max / 6000) * 100;
    track.style.left = percent1 + "%";
    track.style.width = (percent2 - percent1) + "%";
    filters.minPrice = min;
    filters.maxPrice = max;
    minLabel.textContent = min + " ₾";
    maxLabel.textContent = max + " ₾";
    renderProducts();
  }

  minRange.addEventListener("input", fillTrack);
  maxRange.addEventListener("input", fillTrack);
  fillTrack();

  // ♻️ განულება
  document.getElementById("resetFilters").addEventListener("click", () => {
    filters = { search: "", category: filters.category, brands: [], minPrice: 0, maxPrice: 6000 };
    currentPage = 1;
    renderFilters();
    renderProducts();
  });
}

// ===============================
// 🛒 პროდუქციის ჩვენება + Pagination
// ===============================
function renderProducts() {
  if (!grid || !products.length) return;

  const filtered = products.filter(p =>
    (filters.category === "ALL" || p.category === filters.category) &&
    (filters.brands.length === 0 || filters.brands.includes(p.brand)) &&
    (p.price >= filters.minPrice && p.price <= filters.maxPrice) &&
    p.title.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / productsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * productsPerPage;
  const visibleProducts = filtered.slice(start, start + productsPerPage);

  grid.classList.add("fade-out");
  setTimeout(() => {
    grid.innerHTML = visibleProducts.length
      ? visibleProducts.map(p => `
        <div class="product" onclick="window.location.href='product.html?id=${p.id}'">
          <div class="product-img">
            <img src="${p.img}" alt="${p.title}">
          </div>
          <div class="product-info">
            <h3 class="product-title">${p.title}</h3>
            <p class="product-brand">${p.brand}</p>
            <p class="product-price">${p.price} ₾</p>
          </div>
        </div>
      `).join("")
      : `<p style="text-align:center;">პროდუქტი ვერ მოიძებნა 😕</p>`;

    document.querySelector(".pagination")?.remove();
    if (totalPages > 1) {
      const paginationHTML = `
        <div class="pagination">
          <button ${currentPage === 1 ? "disabled" : ""} id="prevPage">
            <i class="fa-solid fa-chevron-left"></i> წინა
          </button>
          <span>გვერდი ${currentPage} / ${totalPages}</span>
          <button ${currentPage === totalPages ? "disabled" : ""} id="nextPage">
            შემდეგი <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>`;
      grid.insertAdjacentHTML("afterend", paginationHTML);

      document.getElementById("prevPage")?.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderProducts();
        }
      });
      document.getElementById("nextPage")?.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderProducts();
        }
      });
    }

    grid.classList.remove("fade-out");
    grid.classList.add("fade-in");
  }, 200);
}

// ===============================
// 🧩 ინდივიდუალური პროდუქტის ჩვენება (product.html)
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  const productContainer = document.querySelector(".product-details");
  if (!productContainer) return; // მარტო product.html-ზე იმუშაოს

  try {
    const res = await fetch("products.json");
    const data = await res.json();

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"));
    const product = data.find(p => p.id === id);

    if (!product) {
      productContainer.innerHTML = "<p>პროდუქტი ვერ მოიძებნა 😕</p>";
      return;
    }

    productContainer.innerHTML = `
      <div class="product-page">
        <img src="${product.img}" alt="${product.title}" class="product-image">
        <div class="product-info">
          <h2>${product.title}</h2>
          <p class="brand">ბრენდი: ${product.brand}</p>
          <p class="price">ფასი: ${product.price} ${product.currency}</p>
          <p class="rating">⭐ ${product.rating} (${product.reviews} მიმოხილვა)</p>
          <button class="buy-btn">დამატება კალათაში</button>
        </div>
      </div>

      <div class="features">
        <h3>მახასიათებლები</h3>
        <ul>${generateFeatures(product.features)}</ul>
      </div>
    `;
  } catch (error) {
    console.error(error);
    productContainer.innerHTML = "<p>შეცდომა პროდუქტის ჩატვირთვისას 😔</p>";
  }
});

// Helper ფუნქცია
function generateFeatures(features) {
  let html = "";
  for (const key in features) {
    const value = features[key];
    if (Array.isArray(value)) {
      html += `<li><strong>${formatKey(key)}:</strong> ${value.join(", ")}</li>`;
    } else {
      html += `<li><strong>${formatKey(key)}:</strong> ${value}</li>`;
    }
  }
  return html;
}

function formatKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
