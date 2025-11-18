/* =========================================================================
   🛒 CART SYSTEM — GLOBAL, CLEAN, FULLY COMPATIBLE WITH index & product
   ===================================================================== */

// GLOBAL ADD TO CART
window.addToCart = function(productId, qty = 1, event = null) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
function showToast() {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}
showToast();

    // products MUST exist
    if (!window.allProducts || !Array.isArray(window.allProducts)) {
        console.warn("⚠️ allProducts არ არის ჩატვირთული");
        return;
    }

    const product = window.allProducts.find(p => p.id == productId);
    if (!product) {
        console.error("❌ ვერ ვპოულობ პროდუქტს:", productId);
        return;
    }

    // FLY ANIMATION (index.html)
    if (event) {
        const card = event.target.closest(".product");
        const img = card?.querySelector("img");
        if (img) {
            const r = img.getBoundingClientRect();
            flyToCartAnimation(product.img, r.left, r.top);
            triggerCartShake();
        }
    }

    // FLY ANIMATION (product.html)
    if (!event) {
        const mainImg = document.querySelector(".hero-main-img");
        if (mainImg) {
            const r = mainImg.getBoundingClientRect();
            flyToCartAnimation(product.img, r.left, r.top);
            triggerCartShake();
        }
    }

    const existed = cart.find(item => item.id == productId);

    if (existed) {
        existed.qty += qty;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: Number(product.price),
            img: product.img,
            qty: qty
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    updateBubbleCount();
    renderCartDrawer();

    console.log("🟢 Added:", product.title);
};


// helpers
function getCart() { return JSON.parse(localStorage.getItem("cart")) || []; }
function saveCart(cart){ localStorage.setItem("cart", JSON.stringify(cart)); }
function calculateTotal(){ return getCart().reduce((s, i) => s + i.qty * i.price, 0); }
function getCartCount(){ return getCart().reduce((s,i)=>s+i.qty,0); }


// remove
function removeFromCart(id){
    saveCart(getCart().filter(i => i.id != id));
    updateBubbleCount();
    renderCartDrawer();
}

// quantity
function changeQty(id, amount){
    const cart = getCart();
    const item = cart.find(i => i.id == id);
    if (!item) return;

    item.qty += amount;
    if (item.qty <= 0) return removeFromCart(id);

    saveCart(cart);
    updateBubbleCount();
    renderCartDrawer();
}

// bubble
function updateBubbleCount(){
    const bubble = document.querySelector(".cart-count-bubble");
    if (bubble) bubble.innerText = getCartCount();
}

// drawer rendering
function renderCartDrawer(){
    const box = document.getElementById("cartDrawerItems");
    const totalBox = document.getElementById("cartDrawerTotal");
    if (!box || !totalBox) return;

    const items = getCart();

    if (!items.length){
        box.innerHTML = `<p style="opacity:.6;">კალათა ცარიელია 🛒</p>`;
        totalBox.textContent = "0 ₾";
        return;
    }

    box.innerHTML = items.map(item => `
        <div class="cart-drawer-item">
            <img src="${item.img}">

            <div style="flex:1;">
                <div class="cart-drawer-item-title">${item.title}</div>
                <div class="cart-drawer-item-price">${item.price} ₾</div>

                <div class="qty-row">
                    <button onclick="changeQty(${item.id},-1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${item.id},1)">+</button>
                </div>
            </div>

            <button onclick="removeFromCart(${item.id})"
                style="background:none;border:none;color:#ef4444;font-size:1.2rem;">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join("");

    totalBox.textContent = calculateTotal() + " ₾";
}


// drawer toggle
function openCart(){
    document.getElementById("cartDrawer")?.classList.add("open");
    document.getElementById("cartBackdrop")?.classList.add("open");
    renderCartDrawer();
}

function closeCart(){
    document.getElementById("cartDrawer")?.classList.remove("open");
    document.getElementById("cartBackdrop")?.classList.remove("open");
}

document.addEventListener("DOMContentLoaded", ()=>{
    document.getElementById("cartBubble")?.addEventListener("click", openCart);
    document.getElementById("closeCartDrawer")?.addEventListener("click", closeCart);
    document.getElementById("cartBackdrop")?.addEventListener("click", closeCart);
    updateBubbleCount();
});
