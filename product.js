// ===============================
// Helpers
// ===============================
function createColorDots(colors) {
  if (!Array.isArray(colors) || !colors.length)
    return "<span style='font-size:0.8rem;color:#9ca3af;'>N/A</span>";

  return (
    colors
      .slice(0, 4)
      .map((c) => `<span class='color-dot' style='background:${c};'></span>`)
      .join("") +
    (colors.length > 4
      ? `<span style="font-size:.8rem;color:#9ca3af;">+${colors.length - 4}</span>`
      : "")
  );
}

function formatFeatures(features) {
  if (!features || typeof features !== "object") return "<li>მონაცემები არ არის</li>";

  return Object.keys(features)
    .map((key) => {
      const title = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const val = Array.isArray(features[key]) ? features[key].join(", ") : features[key];
      return `<li><strong>${title}:</strong> ${val}</li>`;
    })
    .join("");
}

function stockStatus(stock) {
  stock = Number(stock || 0);
  if (stock <= 0)
    return { text: "მარაგში აღარ არის", cls: "stock-status out", icon: "fa-circle-xmark" };

  if (stock <= 3)
    return {
      text: "ბოლო ცალი(ები) მარაგში",
      cls: "stock-status low",
      icon: "fa-triangle-exclamation",
    };

  return {
    text: `მარაგში: ${stock} ერთეული`,
    cls: "stock-status in",
    icon: "fa-circle-check",
  };
}

function getParamId() {
  return new URLSearchParams(window.location.search).get("id");
}

// ===============================
// Globals
// ===============================
let allProducts = [];
let currentProduct = null;

const filters = {
  category: "ALL",
  brand: "ALL",
  featureText: "",
};

// ===============================
// INIT PRODUCT PAGE
// ===============================
async function initProductPage() {
  const id = getParamId();
  const container = document.getElementById("pageContent");

  if (!id) {
    container.innerHTML = `<p class="state-message"><span>❌ პროდუქტის ID ვერ მოიძებნა</span></p>`;
    return;
  }

  try {
    const res = await fetch("products.json");
    if (!res.ok) throw new Error("პროდუქციის ფაილი ვერ ჩაიტვირთა");

    allProducts = await res.json();
    window.allProducts = allProducts; // REQUIRED FOR cart.js

    currentProduct = allProducts.find((p) => String(p.id) === String(id));
    if (!currentProduct) {
      container.innerHTML = `<p class="state-message"><span>❌ ასეთი პროდუქტი არ არსებობს</span></p>`;
      return;
    }

    filters.category = currentProduct.category;
    filters.brand = currentProduct.brand;

    renderPage();
    setupFilterToggle();
    setupImageOverlay();

  } catch (err) {
    container.innerHTML = `<p class="state-message"><span>⚠️ ${err.message}</span></p>`;
  }
}

// ===============================
// RENDER FULL PAGE
// ===============================
function renderPage() {
  const container = document.getElementById("pageContent");
  const st = stockStatus(currentProduct.stock);

  const allCategories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];

  // Render HTML
  container.innerHTML = `
    <div class="product-layout">

      <aside class="filter-panel">
        <div class="filter-panel-header">
          <h3><i class="fa-solid fa-sliders"></i> გაფილტვრა</h3>
          <button id="closeFiltersBtn" class="filters-close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="filter-group">
          <label>კატეგორია</label>
          <select id="filterCategory">
            <option value="ALL">ყველა</option>
            ${allCategories
              .map(
                (c) =>
                  `<option value="${c}" ${
                    filters.category === c ? "selected" : ""
                  }>${c}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="filter-group">
          <label>ბრენდი</label>
          <select id="filterBrand">
            <option value="ALL">ყველა</option>
            ${[...new Set(allProducts.map((p) => p.brand))].map(
              (b) => `<option value="${b}" ${
                filters.brand === b ? "selected" : ""
              }>${b}</option>`
            )}
          </select>
        </div>

        <div class="filter-group">
          <label>ძიება მახასიათებლებით</label>
          <input id="filterFeature" value="${filters.featureText}" placeholder="მაგ: 256GB">
        </div>

        <button id="resetFiltersBtn" class="reset-filters-btn">
          <i class="fa-solid fa-rotate-right"></i> განულება
        </button>
      </aside>


      <main class="product-main-area">

        <section class="product-hero">

          <div class="hero-image-col">
            <div class="image-main-box">
              <img src="${currentProduct.img}" class="hero-main-img">
            </div>
          </div>

          <div class="hero-info-col">

            <h1 class="info-title">${currentProduct.title}</h1>

            <div class="price-stock-row">
              <div class="price-main">${currentProduct.price} ₾</div>
              <div class="${st.cls}">
                <i class="fa-solid ${st.icon}"></i> ${st.text}
              </div>
            </div>

            <div class="actions-row">
              <button class="buy-btn">
                <i class="fa-solid fa-cart-plus"></i> კალათაში დამატება
              </button>
            </div>

          </div>

        </section>


        <section class="product-sections">
          <article class="section-card">
            <div class="section-header">
              <i class="fa-solid fa-gears"></i> მახასიათებლები
            </div>
            <ul>${formatFeatures(currentProduct.features)}</ul>
          </article>
        </section>


        <section class="related-section">
          <div class="related-header">
            <strong>მსგავსი პროდუქტები</strong>
            <span id="relatedCount"></span>
          </div>
          <div id="relatedStrip" class="related-strip"></div>
        </section>

      </main>
    </div>
  `;

  // EVENTS
  document.getElementById("filterCategory").addEventListener("change", (e) => {
    filters.category = e.target.value;
    renderRelated();
  });

  document.getElementById("filterBrand").addEventListener("change", (e) => {
    filters.brand = e.target.value;
    renderRelated();
  });

  document.getElementById("filterFeature").addEventListener("input", (e) => {
    filters.featureText = e.target.value.toLowerCase();
    renderRelated();
  });

  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    filters.category = "ALL";
    filters.brand = "ALL";
    filters.featureText = "";
    renderPage();
  });

  document.getElementById("closeFiltersBtn").addEventListener("click", () => {
    document.body.classList.remove("filters-open");
  });

  // BUY BUTTON → ADD TO CART (IMPORTANT!)
  const buyBtn = container.querySelector(".buy-btn");
  buyBtn.addEventListener("click", (e) => {
    addToCart(currentProduct.id, 1, e); // <<< FIXED
  });

  renderRelated();
}


// ===============================
// RELATED PRODUCTS
// ===============================
function renderRelated() {
  const strip = document.getElementById("relatedStrip");
  const countLabel = document.getElementById("relatedCount");

  let result = allProducts.filter((p) => p.id != currentProduct.id);

  if (filters.category !== "ALL")
    result = result.filter((p) => p.category === filters.category);

  if (filters.brand !== "ALL")
    result = result.filter((p) => p.brand === filters.brand);

  if (filters.featureText)
    result = result.filter((p) =>
      JSON.stringify(p.features || {})
        .toLowerCase()
        .includes(filters.featureText)
    );

  countLabel.textContent = result.length ? `${result.length} პროდუქტი` : "არაფერი";

  strip.innerHTML = result
    .slice(0, 12)
    .map(
      (p) => `
      <article class="rel-card" onclick="location.href='product.html?id=${p.id}'">
        <img src="${p.img}">
        <div class="rel-title">${p.title}</div>
        <div class="rel-price">${p.price} ₾</div>
      </article>
    `
    )
    .join("");
}


// ===============================
// FILTER TOGGLE (mobile)
// ===============================
function setupFilterToggle() {
  document.getElementById("openFilters")?.addEventListener("click", () => {
    document.body.classList.add("filters-open");
  });

  document.getElementById("filtersBackdrop")?.addEventListener("click", () => {
    document.body.classList.remove("filters-open");
  });
}

// ===============================
// IMAGE OVERLAY
// ===============================
function setupImageOverlay() {
  const overlay = document.getElementById("imageOverlay");
  const overlayImg = document.getElementById("overlayImage");

  document.querySelector(".image-overlay-backdrop")?.addEventListener("click", () => {
    overlay.classList.remove("open");
  });

  document.getElementById("closeOverlay")?.addEventListener("click", () => {
    overlay.classList.remove("open");
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("hero-main-img")) {
      overlayImg.src = e.target.src;
      overlay.classList.add("open");
    }
  });
}


// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", initProductPage);
