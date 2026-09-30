const readStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    let products = readStore("glowcart-products", window.GLOWCART_STARTER_PRODUCTS);
    if (!localStorage.getItem("glowcart-products")) localStorage.setItem("glowcart-products", JSON.stringify(products));
    let cart = readStore("glowcart-cart", []);
    let wishlist = readStore("glowcart-wishlist", []);
    let category = "All products";
    let wishlistOnly = false;
    let page = 1;
    let toastTimer;
    const pageSize = 8;
    const $ = (selector, root = document) => root.querySelector(selector);
    const money = amount => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(amount);
    const FREE_SHIPPING_THRESHOLD = 10000;
    const SHIPPING_FEE = 450;
    if (window.GlowCartAuth.getSession()?.role === "admin") window.location.replace("admin.html");
    const splashScreen = $("#splash-screen");
    if (sessionStorage.getItem("glowcart-splash-shown") || matchMedia("(prefers-reduced-motion: reduce)").matches) splashScreen.classList.add("dismissed");
    else {
      sessionStorage.setItem("glowcart-splash-shown", "true");
      setTimeout(() => splashScreen.classList.add("dismissed"), 900);
    }
    const save = () => {
      localStorage.setItem("glowcart-products", JSON.stringify(products));
      localStorage.setItem("glowcart-cart", JSON.stringify(cart));
      localStorage.setItem("glowcart-wishlist", JSON.stringify(wishlist));
    };
    const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    function showToast(message) {
      const toast = $("#toast");
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
    }
    function renderCategories() {
      const categories = ["All products", ...new Set(products.map(product => product.category))];
      $("#category-tabs").innerHTML = categories.map(item => `<button class="tab ${category === item ? "active" : ""}" data-category="${escapeHtml(item)}" aria-pressed="${category === item}">${escapeHtml(item)}</button>`).join("");
      const brands = [...new Set(products.map(product => product.brand))].sort();
      const currentBrand = $("#brand-filter").value;
      $("#brand-filter").innerHTML = `<option value="">All brands</option>${brands.map(brand => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join("")}`;
      if (brands.includes(currentBrand)) $("#brand-filter").value = currentBrand;
    }
    function filteredProducts() {
      const query = $("#search-input").value.trim().toLowerCase();
      const brand = $("#brand-filter").value;
      const maxPrice = Number($("#price-filter").value);
      let result = products.filter(product => {
        const matchesQuery = !query || [product.name, product.brand, product.category, product.description].some(value => value.toLowerCase().includes(query));
        return matchesQuery && (category === "All products" || product.category === category) && (!brand || product.brand === brand) && (!maxPrice || product.price < maxPrice) && (!$("#stock-filter").checked || product.stock > 0);
      });
      const sort = $("#sort-filter").value;
      if (sort === "price-low") result.sort((a, b) => a.price - b.price);
      if (sort === "price-high") result.sort((a, b) => b.price - a.price);
      if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
      if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === "popular") result.sort((a, b) => (b.popularScore || 0) - (a.popularScore || 0));
      return result;
    }
    function renderProducts() {
      const result = filteredProducts().filter(product => !wishlistOnly || wishlist.includes(product.id));
      $("#shop-title").textContent = wishlistOnly ? "Saved island picks" : category === "All products" ? "Popular island picks" : category;
      const pages = Math.max(1, Math.ceil(result.length / pageSize));
      page = Math.min(page, pages);
      const shown = result.slice((page - 1) * pageSize, page * pageSize);
      $("#result-count").textContent = `${result.length} ${result.length === 1 ? "little good thing" : "little good things"}`;
      $("#filter-summary").textContent = result.length ? `Showing ${Math.min((page - 1) * pageSize + 1, result.length)}–${Math.min(page * pageSize, result.length)} of ${result.length}` : "";
      $("#product-grid").innerHTML = shown.length ? shown.map((product, index) => `<article class="product-card" style="animation-delay:${Math.min(index * 35, 210)}ms"><div class="product-media"><img loading="lazy" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.src='https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=760&q=80'"><span class="product-label">${escapeHtml(product.label || product.category)}</span><button class="heart-button ${wishlist.includes(product.id) ? "active" : ""}" data-wishlist="${product.id}" aria-label="${wishlist.includes(product.id) ? "Remove from" : "Add to"} wishlist" aria-pressed="${wishlist.includes(product.id)}"><svg width="17" height="17" viewBox="0 0 24 24" fill="${wishlist.includes(product.id) ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7"><path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z"/></svg></button><button class="button quick-add" data-add="${product.id}" ${product.stock < 1 ? "disabled" : ""}>${product.stock < 1 ? "Out of stock" : "Add to bag · " + money(product.price)}</button></div><div class="product-info"><div class="product-meta"><span>${escapeHtml(product.brand)}</span><span class="rating">★ ${Number(product.rating).toFixed(1)}</span></div><h3>${escapeHtml(product.name)}</h3><p class="product-description">${escapeHtml(product.description)}</p><div class="price-row"><span>${money(product.price)}</span><small>${product.stock > 0 ? `${product.stock} ready to ship` : "Back soon"}</small></div></div></article>`).join("") : `<div class="empty-state"><span class="eyebrow">Nothing here just yet</span><h3>No matches, but something will.</h3><p>Try a different search or clear a filter to keep exploring.</p><button class="button button-outline" data-clear-filters>Clear filters</button></div>`;
      const pageButtons = Array.from({ length: pages }, (_, index) => {
        const pageNumber = index + 1;
        return `<button class="page-button page-number" data-page="${pageNumber}" aria-label="Page ${pageNumber}" aria-current="${pageNumber === page ? "page" : "false"}">${pageNumber}</button>`;
      }).join("");
      $("#pagination").innerHTML = result.length > pageSize ? `<button class="page-button" data-page="${page - 1}" aria-label="Previous page" ${page === 1 ? "disabled" : ""}>←</button>${pageButtons}<span class="page-status">Page ${page} of ${pages}</span><button class="page-button" data-page="${page + 1}" aria-label="Next page" ${page === pages ? "disabled" : ""}>→</button>` : "";
      $("#wish-count").textContent = wishlist.length;
      $("#cart-count").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
      $("#mobile-cart-count").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
    function linkProductTitles() {
      $("#product-grid").querySelectorAll(".product-info h3").forEach(title => {
        if (title.querySelector("[data-details]")) return;
        const card = title.closest(".product-card");
        const favorite = card?.querySelector("[data-wishlist]");
        if (!favorite) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "product-title";
        button.dataset.details = favorite.dataset.wishlist;
        button.setAttribute("aria-label", `View ${title.textContent.trim()} details`);
        button.textContent = title.textContent.trim();
        title.replaceChildren(button);
      });
    }
    function renderCart() {
      const items = cart.map(item => ({ ...item, product: products.find(product => product.id === item.id) })).filter(item => item.product);
      const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      $("#cart-title-count").textContent = items.length ? `(${items.reduce((sum, item) => sum + item.quantity, 0)})` : "";
      $("#cart-items").innerHTML = items.length ? items.map(({ product, quantity }) => `<div class="cart-item"><img src="${escapeHtml(product.image)}" alt=""><div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.brand)} · ${money(product.price)}</p><div class="quantity-controls"><button data-quantity="${product.id}" data-change="-1" aria-label="Decrease ${escapeHtml(product.name)} quantity">−</button><span>${quantity}</span><button data-quantity="${product.id}" data-change="1" aria-label="Increase ${escapeHtml(product.name)} quantity" ${quantity >= product.stock ? "disabled" : ""}>+</button></div></div><div class="cart-line-end"><strong>${money(product.price * quantity)}</strong><button class="remove-button" data-remove="${product.id}">Remove</button></div></div>`).join("") : `<div class="cart-empty">Your bag is taking a little breather.<br>Find something that feels like you.</div>`;
      $("#cart-summary").innerHTML = items.length ? `<div class="summary-line"><span>Subtotal</span><span>${money(total)}</span></div><div class="summary-line"><span>Islandwide delivery</span><span>${total >= FREE_SHIPPING_THRESHOLD ? "Free" : money(SHIPPING_FEE)}</span></div><div class="summary-line total"><span>Total</span><span>${money(total + (total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE))}</span></div><button class="button" id="checkout-button">Continue to checkout</button><p>Secure checkout · payment simulated in this demo</p>` : `<button class="button button-outline" id="continue-shopping" style="width:100%">Keep exploring</button>`;
      $("#cart-count").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
      $("#mobile-cart-count").textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
      $("#wish-count").textContent = wishlist.length;
    }
    function addToCart(id) {
      const product = products.find(item => item.id === id);
      if (!product || product.stock < 1) return showToast("That one's taking a little rest. Check back soon.");
      const existing = cart.find(item => item.id === id);
      if (existing) {
        if (existing.quantity >= product.stock) return showToast("That's all the stock we have right now.");
        existing.quantity += 1;
      } else cart.push({ id, quantity: 1 });
      save(); renderProducts(); renderCart(); showToast(`${product.name} added to your bag.`);
      return true;
    }
    function openCart() { renderCart(); $("#cart-overlay").classList.add("open"); $("#cart-overlay").setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; $("#close-cart").focus(); }
    function closeCart() { $("#cart-overlay").classList.remove("open"); $("#cart-overlay").setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
    function openModal(id) { closeCart(); $(id).classList.add("open"); document.body.style.overflow = "hidden"; const focusable = $("input,button,select", $(id)); if (focusable) focusable.focus(); }
    function closeModal(modal) { modal.classList.remove("open"); document.body.style.overflow = ""; }
    function openProductDetails(id) {
      const product = products.find(item => item.id === id);
      if (!product) return;
      $("#detail-image").src = product.image;
      $("#detail-image").alt = product.name;
      $("#product-detail-content").innerHTML = `<button class="icon-button modal-close" data-close-modal aria-label="Close product details"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m6 6 12 12M18 6 6 18"/></svg></button><span class="eyebrow">${escapeHtml(product.category)}</span><h2 id="detail-name">${escapeHtml(product.name)}</h2><span class="detail-brand">${escapeHtml(product.brand)}</span><span class="detail-rating">★★★★★ <span style="color:var(--brand-text-muted)">${Number(product.rating).toFixed(1)}</span></span><p class="detail-price">${money(product.price)}</p><p class="detail-description">${escapeHtml(product.description)}</p><div class="detail-actions"><button class="button" data-detail-add="${product.id}" ${product.stock < 1 ? "disabled" : ""}>Add to cart</button><button class="button buy-now" data-buy-now="${product.id}" ${product.stock < 1 ? "disabled" : ""}>Buy now</button></div><span class="detail-stock">${product.stock > 0 ? `${product.stock} in stock · Islandwide delivery` : "Currently out of stock"}</span>`;
      openModal("#product-modal");
    }
    function beginCheckout() {
      const session = window.GlowCartAuth.getSession();
      if (!session || session.role !== "customer") return window.location.assign("auth.html?role=customer&return=checkout");
      const total = cart.reduce((sum, item) => sum + (products.find(product => product.id === item.id)?.price || 0) * item.quantity, 0);
      $("#checkout-total").textContent = money(total + (total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE));
      openModal("#checkout-modal");
    }
    $("#category-tabs").addEventListener("click", event => { const button = event.target.closest("[data-category]"); if (button) { wishlistOnly = false; category = button.dataset.category; page = 1; renderCategories(); renderProducts(); } });
    $("#product-grid").addEventListener("click", event => {
      const add = event.target.closest("[data-add]");
      const favorite = event.target.closest("[data-wishlist]");
      const details = event.target.closest("[data-details]");
      if (details) { openProductDetails(Number(details.dataset.details)); return; }
      if (!add && !favorite && event.target.closest(".product-info h3")) {
        const card = event.target.closest(".product-card");
        const id = Number(card.querySelector("[data-wishlist]").dataset.wishlist);
        openProductDetails(id);
        return;
      }
      if (add) addToCart(Number(add.dataset.add));
      if (favorite) { const id = Number(favorite.dataset.wishlist); wishlist = wishlist.includes(id) ? wishlist.filter(item => item !== id) : [...wishlist, id]; save(); if (wishlistOnly || $("#shop-title").textContent === "Saved island picks") { wishlistOnly = true; renderProducts(); } else renderProducts(); showToast(wishlist.includes(id) ? "Saved to your feel-good list." : "Removed from your saved picks."); }
      if (event.target.closest("[data-clear-filters]")) { wishlistOnly = false; $("#search-input").value = ""; $("#brand-filter").value = ""; $("#price-filter").value = "0"; $("#stock-filter").checked = false; category = "All products"; page = 1; renderCategories(); renderProducts(); }
    });
    $("#pagination").addEventListener("click", event => { const button = event.target.closest("[data-page]"); if (button && !button.disabled) { page = Number(button.dataset.page); renderProducts(); $("#shop").scrollIntoView({ behavior: "smooth" }); } });
    ["search-input", "brand-filter", "price-filter", "sort-filter", "stock-filter"].forEach(id => $("#" + id).addEventListener(id === "search-input" ? "input" : "change", () => { wishlistOnly = false; page = 1; renderProducts(); }));
    $("#cart-button").addEventListener("click", openCart);
    $("#close-cart").addEventListener("click", closeCart);
    $("#cart-overlay").addEventListener("click", event => { if (event.target === event.currentTarget) closeCart(); });
    $("#cart-items").addEventListener("click", event => {
      const remove = event.target.closest("[data-remove]");
      const quantity = event.target.closest("[data-quantity]");
      if (remove) cart = cart.filter(item => item.id !== Number(remove.dataset.remove));
      if (quantity) {
        const item = cart.find(entry => entry.id === Number(quantity.dataset.quantity));
        if (item) { item.quantity += Number(quantity.dataset.change); if (item.quantity < 1) cart = cart.filter(entry => entry !== item); }
      }
      save(); renderCart(); renderProducts();
    });
    $("#cart-summary").addEventListener("click", event => {
      if (event.target.closest("#continue-shopping")) closeCart();
      if (event.target.closest("#checkout-button")) beginCheckout();
    });
    $("#product-modal").addEventListener("click", event => {
      if (event.target === event.currentTarget || event.target.closest("[data-close-modal]")) closeModal($("#product-modal"));
    });
    $("#product-detail-content").addEventListener("click", event => {
      const add = event.target.closest("[data-detail-add]");
      const buy = event.target.closest("[data-buy-now]");
      if (add) { addToCart(Number(add.dataset.detailAdd)); closeModal($("#product-modal")); }
      if (buy && addToCart(Number(buy.dataset.buyNow))) { closeModal($("#product-modal")); beginCheckout(); }
    });
    const checkoutFormMarkup = $("#checkout-content").innerHTML;
    $("#checkout-modal").addEventListener("submit", event => {
      if (event.target.id !== "checkout-form") return;
      event.preventDefault();
      if (!cart.length) return closeModal($("#checkout-modal"));
      const session = window.GlowCartAuth.getSession();
      if (!session || session.role !== "customer") return window.location.assign("auth.html?role=customer&return=checkout");
      const reference = `GC-${Date.now().toString().slice(-6)}`;
      const subtotal = cart.reduce((sum, item) => sum + (products.find(product => product.id === item.id)?.price || 0) * item.quantity, 0);
      const order = {
        id: reference,
        userId: session.id,
        customerName: $("#checkout-name").value.trim(),
        customerEmail: session.email,
        items: cart.map(item => {
          const product = products.find(entry => entry.id === item.id);
          return { productId: item.id, name: product.name, quantity: item.quantity, unitPrice: product.price, subtotal: product.price * item.quantity };
        }),
        total: subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE),
        currency: "LKR",
        status: "Processing",
        paymentStatus: "Demo only",
        address: [$("#checkout-address").value.trim(), $("#checkout-city").value.trim(), $("#checkout-postal").value.trim()].join(", "),
        createdAt: new Date().toISOString()
      };
      const orders = readStore("glowcart-orders", []);
      orders.push(order);
      localStorage.setItem("glowcart-orders", JSON.stringify(orders));
      cart.forEach(item => { const product = products.find(entry => entry.id === item.id); if (product) product.stock = Math.max(0, product.stock - item.quantity); });
      $("#checkout-content").innerHTML = `<div class="order-confirmation"><div class="success-mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 5 5L20 7"/></svg></div><h3>That's a good feeling.</h3><p>Your demo order <strong>${reference}</strong> is placed. No payment was collected; your details stay in this browser.</p><button class="button" id="done-order">Back to the good stuff</button></div>`;
      cart = []; save(); renderCart(); renderProducts();
      $("#done-order").addEventListener("click", () => { closeModal($("#checkout-modal")); $("#checkout-content").innerHTML = checkoutFormMarkup; });
    });
    const accountSession = window.GlowCartAuth.getSession();
    if (accountSession?.role === "customer") {
      $("#account-button").setAttribute("aria-label", `Sign out ${accountSession.name}`);
      $("#account-button").title = `Sign out ${accountSession.name}`;
    }
    $("#account-button").addEventListener("click", () => {
      const session = window.GlowCartAuth.getSession();
      if (!session) return window.location.assign("auth.html?role=customer");
      window.GlowCartAuth.signOut();
      $("#account-button").setAttribute("aria-label", "Sign in");
      $("#account-button").title = "Sign in";
      showToast("You are signed out.");
    });
    $("#wishlist-button").addEventListener("click", () => { category = "All products"; $("#search-input").value = ""; $("#brand-filter").value = ""; $("#price-filter").value = "0"; $("#stock-filter").checked = false; renderCategories(); renderProducts(); const favoriteIds = new Set(wishlist); const matching = filteredProducts().filter(product => favoriteIds.has(product.id)); $("#product-grid").innerHTML = matching.length ? matching.map(product => `<article class="product-card"><div class="product-media"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"><button class="heart-button active" data-wishlist="${product.id}" aria-label="Remove from wishlist"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7"><path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z"/></svg></button><button class="button quick-add" data-add="${product.id}" ${product.stock < 1 ? "disabled" : ""}>${product.stock < 1 ? "Out of stock" : "Add to bag · " + money(product.price)}</button></div><div class="product-info"><div class="product-meta"><span>${escapeHtml(product.brand)}</span><span class="rating">★ ${Number(product.rating).toFixed(1)}</span></div><h3>${escapeHtml(product.name)}</h3><div class="price-row">${money(product.price)}<small>${product.stock > 0 ? "Ready to ship" : "Back soon"}</small></div></div></article>`).join("") : `<div class="empty-state"><h3>Your feel-good list is waiting.</h3><p>Tap a little heart on anything you love to save it here.</p></div>`; $("#shop-title").textContent = "Little things you love"; $("#result-count").textContent = `${matching.length} saved ${matching.length === 1 ? "favorite" : "favorites"}`; $("#filter-summary").textContent = ""; $("#pagination").innerHTML = ""; $("#shop").scrollIntoView({ behavior: "smooth" }); });
    $("#wishlist-button").addEventListener("click", () => { wishlistOnly = true; $("#shop-title").textContent = "Saved island picks"; });
    $("#mobile-wishlist").addEventListener("click", () => $("#wishlist-button").click());
    $("#mobile-cart").addEventListener("click", openCart);
    $(".bottom-nav").addEventListener("click", event => {
      const link = event.target.closest("[data-bottom-link]");
      if (!link) return;
      document.querySelectorAll(".bottom-nav [data-bottom-link]").forEach(item => item.classList.toggle("active", item === link));
      wishlistOnly = false;
      renderProducts();
    });
    $("#newsletter-form").addEventListener("submit", event => { event.preventDefault(); event.currentTarget.reset(); showToast("You're on the list. Keep an eye on your inbox."); });
    document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", () => closeModal(button.closest(".modal-wrap"))));
    document.querySelectorAll(".modal-wrap").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) closeModal(modal); }));
    $("#menu-button").addEventListener("click", () => { const nav = $("#main-nav"); const open = nav.classList.toggle("open"); $("#menu-button").setAttribute("aria-expanded", String(open)); });
    $("#main-nav").addEventListener("click", event => { const link = event.target.closest("[data-nav-category]"); if (link) { wishlistOnly = false; category = link.dataset.navCategory; renderCategories(); renderProducts(); } $("#main-nav").classList.remove("open"); $("#menu-button").setAttribute("aria-expanded", "false"); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") { closeCart(); document.querySelectorAll(".modal-wrap.open").forEach(closeModal); } });
    const productTitleObserver = new MutationObserver(linkProductTitles);
    productTitleObserver.observe($("#product-grid"), { childList: true });
    renderCategories(); renderProducts(); renderCart();
    if (new URLSearchParams(window.location.search).get("checkout") === "1") {
      if (window.GlowCartAuth.getSession()?.role !== "customer") window.location.replace("auth.html?role=customer&return=checkout");
      else {
        const subtotal = cart.reduce((sum, item) => sum + (products.find(product => product.id === item.id)?.price || 0) * item.quantity, 0);
        $("#checkout-total").textContent = money(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE));
        history.replaceState({}, "", "index.html");
        if (cart.length) openModal("#checkout-modal");
      }
    }
