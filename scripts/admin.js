const session = window.GlowCartAuth.getSession();
    if (!session || session.role !== "admin") location.replace("auth.html?role=admin");
    const $ = (selector, root = document) => root.querySelector(selector);
    $("#product-price").min = "1";
    $("#product-price").step = "1";
    $("#product-price").labels[0].textContent = "Price (LKR)";
    const money = value => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(Number(value));
    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    let products = read("glowcart-products", window.GLOWCART_STARTER_PRODUCTS);
    let categories = read("glowcart-categories", [...new Set(products.map(product => product.category))]);
    let users = window.GlowCartAuth.readUsers();
    let orders = read("glowcart-orders", []);
    let activeView = "overview";
    let editingProductId = null;
    let toastTimer;
    localStorage.setItem("glowcart-products", JSON.stringify(products));
    localStorage.setItem("glowcart-categories", JSON.stringify(categories));
    $("#admin-name").textContent = session?.name || "Administrator";
    function notify(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2400); }
    function saveProducts() { localStorage.setItem("glowcart-products", JSON.stringify(products)); }
    function saveOrders() { localStorage.setItem("glowcart-orders", JSON.stringify(orders)); }
    function setHeading(title, description, action = "") { return `<div class="page-heading"><div><span class="eyebrow">GlowCart workspace</span><h1>${title}</h1><p>${description}</p></div>${action}</div>`; }
    function statsMarkup() {
      const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      return `<div class="stats"><div class="stat"><span class="stat-label">Products</span><strong class="stat-value">${products.length}</strong><span class="stat-note">In your catalog</span></div><div class="stat"><span class="stat-label">Orders</span><strong class="stat-value">${orders.length}</strong><span class="stat-note">${orders.filter(order => order.status !== "Delivered" && order.status !== "Cancelled").length} need attention</span></div><div class="stat"><span class="stat-label">Customers</span><strong class="stat-value">${users.length}</strong><span class="stat-note">Registered accounts</span></div><div class="stat"><span class="stat-label">Demo order value</span><strong class="stat-value">${money(totalSales)}</strong><span class="stat-note">No payments collected</span></div></div>`;
    }
    function productRows(list = products) {
      return list.length ? list.map(product => `<tr><td><div class="product-cell"><img class="product-thumb" src="${escapeHtml(product.image)}" alt=""><div><div class="product-title">${escapeHtml(product.name)}</div><div class="product-sub">${escapeHtml(product.brand)}</div></div></div></td><td>${escapeHtml(product.category)}</td><td>${money(product.price)}</td><td><span class="status ${product.stock < 1 ? "off" : ""}">${product.stock} in stock</span></td><td><div class="row-actions"><button data-edit-product="${product.id}">Edit</button><button class="danger" data-delete-product="${product.id}">Delete</button></div></td></tr>`).join("") : `<tr><td colspan="5" class="empty">No products match this view.</td></tr>`;
    }
    function overviewView() {
      const recent = orders.slice(0, 5);
      return `${setHeading("Overview", "A quick look at the GlowCart shop.", `<button class="primary-button" data-open-product>＋ Add product</button>`)}${statsMarkup()}<section class="surface"><h2 class="section-title">Recent orders</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>${recent.length ? recent.map(order => `<tr><td>${escapeHtml(order.id)}</td><td>${escapeHtml(order.customerName)}<div class="product-sub">${escapeHtml(order.customerEmail)}</div></td><td>${new Date(order.createdAt).toLocaleDateString()}</td><td>${money(order.total)}</td><td><span class="status">${escapeHtml(order.status)}</span></td></tr>`).join("") : `<tr><td colspan="5" class="empty">No orders yet. Test checkout from the customer storefront to see one here.</td></tr>`}</tbody></table></div></section><section class="surface" style="margin-top:15px"><h2 class="section-title">Inventory to watch</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>${productRows(products.filter(product => product.stock < 6))}</tbody></table></div></section>`;
    }
    function productsView() {
      return `${setHeading("Products", "Create, update, and manage the customer catalog.", `<button class="primary-button" data-open-product>＋ Add product</button>`)}<div class="toolbar"><input id="product-search" class="search" type="search" placeholder="Search name, brand, or category" aria-label="Search products"><span class="product-sub">${products.length} products</span></div><section class="surface table-scroll"><table class="data-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Inventory</th><th>Actions</th></tr></thead><tbody id="product-rows">${productRows()}</tbody></table></section>`;
    }
    function categoriesView() {
      const rows = categories.map(category => {
        const count = products.filter(product => product.category === category).length;
        return `<div class="category-row"><div><span class="category-name">${escapeHtml(category)}</span><span class="category-count">${count} products</span></div><div class="row-actions"><button class="danger" data-delete-category="${escapeHtml(category)}" ${count ? "disabled title='Move products to another category first'" : ""}>Delete</button></div></div>`;
      }).join("");
      return `${setHeading("Categories", "Keep product discovery organized for customers.")}<div class="content-grid"><section class="surface"><h2 class="section-title">Your categories</h2><form class="inline-form" id="category-form"><input id="new-category" required maxlength="40" placeholder="New category name" aria-label="New category name"><button class="primary-button" type="submit">Add</button></form>${rows || `<div class="empty">No categories yet.</div>`}</section><section class="surface"><h2 class="section-title">Category totals</h2><div class="table-scroll"><table class="data-table"><thead><tr><th>Category</th><th>Products</th><th>Units in stock</th></tr></thead><tbody>${categories.map(category => `<tr><td>${escapeHtml(category)}</td><td>${products.filter(product => product.category === category).length}</td><td>${products.filter(product => product.category === category).reduce((sum, product) => sum + product.stock, 0)}</td></tr>`).join("")}</tbody></table></div></section></div>`;
    }
    function ordersView() {
      const statuses = ["Processing", "Packed", "Shipped", "Delivered", "Cancelled"];
      return `${setHeading("Orders", "Review orders and update fulfillment status.")}<section class="surface table-scroll"><table class="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead><tbody>${orders.length ? orders.map(order => `<tr><td>${escapeHtml(order.id)}</td><td>${escapeHtml(order.customerName)}<div class="product-sub">${escapeHtml(order.customerEmail)}</div></td><td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>${money(order.total)}</td><td>${escapeHtml(order.paymentStatus)}</td><td><select class="select-status" data-order-status="${escapeHtml(order.id)}">${statuses.map(status => `<option ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></td><td>${new Date(order.createdAt).toLocaleDateString()}</td></tr>`).join("") : `<tr><td colspan="7" class="empty">No orders yet. New customer orders will appear here.</td></tr>`}</tbody></table></section>`;
    }
    function customersView() {
      return `${setHeading("Customers", "View customer accounts and manage demo access.")}<section class="surface table-scroll"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Orders</th><th>Access</th><th>Action</th></tr></thead><tbody>${users.length ? users.map(user => { const count = orders.filter(order => order.customerEmail === user.email).length; const active = user.active !== false; return `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td><td>${count}</td><td><span class="status ${active ? "" : "off"}">${active ? "Active" : "Suspended"}</span></td><td><div class="row-actions"><button data-toggle-user="${escapeHtml(user.id)}">${active ? "Suspend" : "Restore"}</button></div></td></tr>`; }).join("") : `<tr><td colspan="6" class="empty">No customer accounts have registered yet.</td></tr>`}</tbody></table></section>`;
    }
    function render() {
      const content = { overview: overviewView, products: productsView, categories: categoriesView, orders: ordersView, customers: customersView };
      $("#admin-content").innerHTML = content[activeView]();
      document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === activeView));
      if (activeView === "products") $("#product-search").addEventListener("input", event => { $("#product-rows").innerHTML = productRows(products.filter(product => [product.name, product.brand, product.category].some(value => value.toLowerCase().includes(event.target.value.trim().toLowerCase())))); });
      if (activeView === "categories") $("#category-form").addEventListener("submit", event => {
        event.preventDefault();
        const name = $("#new-category").value.trim();
        if (!name || categories.some(category => category.toLowerCase() === name.toLowerCase())) return notify("Enter a new category name.");
        categories.push(name); localStorage.setItem("glowcart-categories", JSON.stringify(categories)); render(); notify("Category added.");
      });
    }
    function updateCategoryOptions(selected = "") {
      const options = categories.map(category => `<option ${category === selected ? "selected" : ""}>${escapeHtml(category)}</option>`).join("");
      $("#product-category").innerHTML = options || "<option value=''>Add a category first</option>";
    }
    function openProductDialog(productId = null) {
      editingProductId = productId;
      const product = products.find(entry => entry.id === productId);
      $("#product-form").reset();
      updateCategoryOptions(product?.category || categories[0] || "");
      $("#product-modal-title").textContent = product ? "Edit product" : "Add product";
      $("#product-name").value = product?.name || "";
      $("#product-brand").value = product?.brand || "";
      $("#product-price").value = product?.price ?? "";
      $("#product-stock").value = product?.stock ?? "";
      $("#product-image-url").value = product?.image?.startsWith("data:") ? "" : product?.image || "";
      $("#product-modal").classList.add("open"); document.body.style.overflow = "hidden"; $("#product-name").focus();
    }
    function closeProductDialog() { $("#product-modal").classList.remove("open"); document.body.style.overflow = ""; }
    async function readImage(file) {
      if (!file) return "";
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG, or WebP image.");
      if (file.size > 1.5 * 1024 * 1024) throw new Error("Images must be 1.5 MB or smaller.");
      return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("Image could not be read.")); reader.readAsDataURL(file); });
    }
    document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => { activeView = button.dataset.view; render(); }));
    $("#admin-content").addEventListener("click", event => {
      if (event.target.closest("[data-open-product]")) openProductDialog();
      const edit = event.target.closest("[data-edit-product]");
      if (edit) openProductDialog(Number(edit.dataset.editProduct));
      const remove = event.target.closest("[data-delete-product]");
      if (remove) { products = products.filter(product => product.id !== Number(remove.dataset.deleteProduct)); saveProducts(); render(); notify("Product removed from the customer catalog."); }
      const deleteCategory = event.target.closest("[data-delete-category]");
      if (deleteCategory && !deleteCategory.disabled) { categories = categories.filter(category => category !== deleteCategory.dataset.deleteCategory); localStorage.setItem("glowcart-categories", JSON.stringify(categories)); render(); notify("Category removed."); }
      const toggleUser = event.target.closest("[data-toggle-user]");
      if (toggleUser) { users = users.map(user => user.id === toggleUser.dataset.toggleUser ? { ...user, active: user.active === false } : user); localStorage.setItem("glowcart-users", JSON.stringify(users)); render(); notify("Customer access updated."); }
    });
    $("#admin-content").addEventListener("change", event => {
      const orderControl = event.target.closest("[data-order-status]");
      if (orderControl) { orders = orders.map(order => order.id === orderControl.dataset.orderStatus ? { ...order, status: orderControl.value } : order); saveOrders(); render(); notify("Order status updated."); }
    });
    window.addEventListener("storage", event => {
      if (event.key !== "glowcart-orders") return;
      orders = read("glowcart-orders", []);
      if (activeView === "overview" || activeView === "orders") render();
    });
    $("#product-form").addEventListener("submit", async event => {
      event.preventDefault();
      const name = $("#product-name").value.trim();
      const brand = $("#product-brand").value.trim();
      const price = Number($("#product-price").value);
      const stock = Number($("#product-stock").value);
      const category = $("#product-category").value;
      if (!name || !brand || !category || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) return notify("Check the product details and try again.");
      try {
        const current = products.find(product => product.id === editingProductId);
        const uploadedImage = await readImage($("#product-image-file").files[0]);
        const image = uploadedImage || $("#product-image-url").value.trim() || current?.image || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=760&q=80";
        if (editingProductId) products = products.map(product => product.id === editingProductId ? { ...product, name, brand, price, stock, category, image } : product);
        else products.unshift({ id: Date.now(), name, brand, price, stock, category, image, rating: 5, label: "JUST ADDED", description: "A new addition to your beauty routine." });
        saveProducts(); closeProductDialog(); render(); notify(editingProductId ? "Product updated." : "Product added to the customer catalog.");
      } catch (error) { notify(error.message); }
    });
    $("#product-modal").addEventListener("click", event => { if (event.target.id === "product-modal" || event.target.closest("[data-close]")) closeProductDialog(); });
    $("#logout").addEventListener("click", () => { window.GlowCartAuth.signOut(); location.assign("auth.html?role=admin"); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeProductDialog(); });
    render();
