// ===============================
// DOM References
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

// category -> brands map
const categoryBrands = {
  "MOB": ["Apple", "Samsung", "Xiaomi", "Huawei", "OnePlus"],
  "IT": ["Dell", "HP", "Asus", "Lenovo", "Acer", "MSI"],
  "LDA": ["Bosch", "LG", "Whirlpool", "Beko"],
  "SDA": ["Philips", "Tefal", "Braun"],
  "TV": ["LG", "Samsung", "Sony", "TCL"]
};

// ===============================
// Load products.json
// ===============================
async function loadProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error("პროდუქციის ფაილი ვერ ჩაიტვირთა 😕");
    products = await response.json();
    window.allProducts = products; // 🟢 VERY IMPORTANT — for cart.js
  } catch (err) {
    console.error(err);
    products = [];
    if (grid) grid.innerHTML = `<p style="color:red; text-align:center;">❌ ${err.message}</p>`;
  } finally {
    setupTooltips();
    applyInitialGridState();
    renderFilters();
    renderProducts();
  }
}

if (document.getElementById("productGrid")) loadProducts();

// ===============================
// Sidebar toggle logic
// ===============================
menuToggle?.addEventListener("click", () => {
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("active");
    return;
  }

  sidebar.classList.toggle("desktop-open");
  sidebar.classList.toggle("desktop-closed");
  sidebar.classList.toggle("collapsed");

  if (!grid) return;

  if (sidebar.classList.contains("desktop-open")) {
    grid.classList.remove("grid-closed");
    grid.classList.add("grid-open");
    renderFilters();
  } else {
    grid.classList.remove("grid-open");
    grid.classList.add("grid-closed");
    filterSection.innerHTML = "";
  }
});

// Resize fix
window.addEventListener("resize", () => {
  if (!sidebar || !grid) return;
  if (window.innerWidth > 768) {
    if (!sidebar.classList.contains("desktop-open") &&
        !sidebar.classList.contains("desktop-closed")) {
      sidebar.classList.add("desktop-closed");
      sidebar.classList.add("collapsed");
    }

    if (sidebar.classList.contains("desktop-open")) {
      grid.classList.add("grid-open");
      sidebar.classList.remove("collapsed");
    } else {
      grid.classList.add("grid-closed");
      sidebar.classList.add("collapsed");
    }

    sidebar.classList.remove("active");
  } else {
    grid.classList.remove("grid-open", "grid-closed");
    sidebar.classList.remove("desktop-open", "desktop-closed", "collapsed");
  }
});

// ===============================
// Setup tooltips
// ===============================
function setupTooltips() {
  document.querySelectorAll("#categoryList li").forEach(li => {
    const text = li.querySelector(".sidebar-text")?.textContent?.trim() || "";
    li.setAttribute("data-tooltip", text);
  });
}

// ===============================
// Search inputs
// ===============================
mobileSearchInput?.addEventListener("input", e => {
  filters.search = e.target.value;
  currentPage = 1;
  renderProducts();
});

searchInput?.addEventListener("input", e => {
  filters.search = e.target.value;
  currentPage = 1;
  renderProducts();
});

// ===============================
// Category selection
// ===============================
categoryList?.addEventListener("click", e => {
  const li = e.target.closest("li");
  if (!li) return;

  document.querySelectorAll("#categoryList li").forEach(n => n.classList.remove("active"));
  li.classList.add("active");

  filters.category = li.dataset.category || "ALL";
  filters.brands = [];
  currentPage = 1;

  if (window.innerWidth > 768 && sidebar.classList.contains("desktop-closed")) {
    filterSection.innerHTML = "";
  } else {
    renderFilters();
  }

  renderProducts();
});
// ===============================
// Render Filters
// ===============================
function renderFilters() {
  if (!filterSection) return;

  if (window.innerWidth > 768 && sidebar.classList.contains("desktop-closed")) {
    filterSection.innerHTML = "";
    return;
  }

  if (filters.category === "ALL") {
    filterSection.innerHTML = `<p>აირჩიე კატეგორია ფილტრის სანახავად.</p>`;
    return;
  }

  const brands = categoryBrands[filters.category] || [];

  filterSection.innerHTML = `
    <div class="filter-group">
      <h4><i class="fa-solid fa-tags"></i> ბრენდები</h4>
      <div class="filter-content">
        ${brands.map(b => `<label><input type="checkbox" value="${b}"> ${b}</label>`).join("")}
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

    <button class="reset-btn" id="resetFilters">
      <i class="fa-solid fa-rotate-right"></i> განულება
    </button>
  `;

  // BRAND FILTER
  document.querySelectorAll(".filter-content input[type='checkbox']").forEach(cb =>
    cb.addEventListener("change", () => {
      filters.brands = Array.from(document.querySelectorAll(".filter-content input:checked"))
                            .map(x => x.value);
      currentPage = 1;
      renderProducts();
    })
  );

  // PRICE SLIDERS
  const minRange = document.getElementById("minRange");
  const maxRange = document.getElementById("maxRange");
  const track = document.getElementById("sliderTrack");
  const minLabel = document.getElementById("minPriceVal");
  const maxLabel = document.getElementById("maxPriceVal");

  function updatePriceSlider() {
    const min = parseInt(minRange.value);
    const max = parseInt(maxRange.value);

    filters.minPrice = min;
    filters.maxPrice = max;

    minLabel.textContent = min + " ₾";
    maxLabel.textContent = max + " ₾";

    const p1 = (min / 6000) * 100;
    const p2 = (max / 6000) * 100;
    track.style.left = p1 + "%";
    track.style.width = (p2 - p1) + "%";

    renderProducts();
  }

  minRange?.addEventListener("input", updatePriceSlider);
  maxRange?.addEventListener("input", updatePriceSlider);
  updatePriceSlider();

  // RESET FILTERS
  document.getElementById("resetFilters")?.addEventListener("click", () => {
    filters = { search: "", category: filters.category, brands: [], minPrice: 0, maxPrice: 6000 };
    currentPage = 1;
    renderFilters();
    renderProducts();
  });
}

// ===============================
// Render Products + Pagination
// ===============================
function renderProducts() {
  if (!grid) return;

  const filtered = products.filter(p =>
    (filters.category === "ALL" || p.category === filters.category) &&
    (filters.brands.length === 0 || filters.brands.includes(p.brand)) &&
    p.price >= filters.minPrice &&
    p.price <= filters.maxPrice &&
    p.title.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / productsPerPage);
  if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

  const start = (currentPage - 1) * productsPerPage;
  const visibleProducts = filtered.slice(start, start + productsPerPage);

  grid.classList.add("fade-out");

  setTimeout(() => {
    grid.innerHTML = visibleProducts.length
      ? visibleProducts
          .map(p => `
        <div class="product" data-id="${p.id}">
          <div class="product-img">
            <img src="${p.img}" alt="${p.title}">
          </div>
          <div class="product-info">
            <h3>${p.title}</h3>
            <p>${p.brand}</p>
            <p class="product-price">${p.price} ₾</p>

            <button class="product-add-btn" data-id="${p.id}">
              <i class="fa-solid fa-cart-plus"></i> კალათაში
            </button>
          </div>
        </div>
      `)
          .join("")
      : `<p style="text-align:center;">პროდუქტი ვერ მოიძებნა 😕</p>`;

    // REMOVE old pagination
    document.querySelector(".pagination")?.remove();

    // CARD CLICK → product page
    document.querySelectorAll(".product").forEach(card => {
      card.addEventListener("click", e => {
        if (e.target.closest(".product-add-btn")) return;
        const id = card.dataset.id;
        window.location.href = `product.html?id=${id}`;
      });
    });

    // ADD TO CART BUTTON
    document.querySelectorAll(".product-add-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const id = btn.dataset.id;

        if (typeof addToCart === "function") {
          addToCart(id, 1);
        }

        flyToCart(btn);
      });
    });

    // PAGINATION
    if (totalPages > 1) {
      grid.insertAdjacentHTML(
        "afterend",
        `
        <div class="pagination">
          <button id="prevPage" ${currentPage === 1 ? "disabled" : ""}>
            <i class="fa-solid fa-chevron-left"></i> წინა
          </button>
          <span>გვერდი ${currentPage} / ${totalPages}</span>
          <button id="nextPage" ${currentPage === totalPages ? "disabled" : ""}>
            შემდეგი <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      `
      );

      document.getElementById("prevPage")?.addEventListener("click", () => {
        currentPage--;
        renderProducts();
      });

      document.getElementById("nextPage")?.addEventListener("click", () => {
        currentPage++;
        renderProducts();
      });
    }

    grid.classList.remove("fade-out");
    grid.classList.add("fade-in");
  }, 180);
}

// ===============================
// INITIAL STATE HELPERS
// ===============================
function applyInitialGridState() {
  if (!grid || !sidebar) return;

  if (window.innerWidth > 768) {
    if (sidebar.classList.contains("desktop-open")) {
      grid.classList.add("grid-open");
      sidebar.classList.remove("collapsed");
    } else {
      sidebar.classList.add("desktop-closed");
      grid.classList.add("grid-closed");
      sidebar.classList.add("collapsed");
    }
  }
}
// ===============================================================
// 🛒 FLY-TO-CART ANIMATION (GLOBAL)
// ===============================================================
function flyToCart(button) {
  try {
    const cartBubble = document.querySelector("#cartBubble");

    // Get product image
    const productCard = button.closest(".product");
    const img = productCard?.querySelector("img");

    if (!img || !cartBubble) return;

    const imgRect = img.getBoundingClientRect();
    const cartRect = cartBubble.getBoundingClientRect();

    // clone image
    const clone = img.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = imgRect.left + "px";
    clone.style.top = imgRect.top + "px";
    clone.style.width = imgRect.width + "px";
    clone.style.height = imgRect.height + "px";
    clone.style.transition = "all 0.7s cubic-bezier(0.42,0,0.58,1)";
    clone.style.zIndex = 99999;
    clone.style.pointerEvents = "none";
    clone.style.borderRadius = "10px";
    clone.style.opacity = "0.95";

    document.body.appendChild(clone);

    // Trigger animation (next tick)
    setTimeout(() => {
      clone.style.left = cartRect.left + "px";
      clone.style.top = cartRect.top + "px";
      clone.style.width = "20px";
      clone.style.height = "20px";
      clone.style.opacity = "0.1";
    }, 50);

    // Remove clone after animation
    setTimeout(() => {
      clone.remove();
      bubbleShake();
    }, 750);

  } catch (err) {
    console.warn("flyToCart error:", err);
  }
}

// ===============================
// 🔔 Bubble shake animation
// ===============================
function bubbleShake() {
  const bubble = document.querySelector("#cartBubble");
  if (!bubble) return;

  bubble.classList.add("shake");
  setTimeout(() => bubble.classList.remove("shake"), 400);
}

// Add small CSS if not in your stylesheet (OPTIONAL)
const bubbleCSS = `
#cartBubble.shake {
  animation: cartShake 0.3s ease;
}
@keyframes cartShake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-3px); }
  100% { transform: translateX(0); }
}`;
const styleTag = document.createElement("style");
styleTag.innerHTML = bubbleCSS;
document.head.appendChild(styleTag);

// ======================================================
// ensure ALL add-to-cart buttons work on ALL pages
// ======================================================
document.addEventListener("click", (event) => {
  const btn = event.target.closest(".product-add-btn");
  if (!btn) return;

  const id = btn.dataset.id;
  if (!id) return;

  if (typeof addToCart === "function") {
    addToCart(id, 1);
  }

  flyToCart(btn);
});
