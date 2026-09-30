window.GLOWCART_STARTER_PRODUCTS = [
  { id: 1, name: "Island SPF 50 Daily Shield", brand: "Kindred Skin", category: "Skincare", price: 4850, rating: 4.9, popularScore: 100, stock: 28, label: "POPULAR PICK", description: "A lightweight daily sunscreen for bright, sunny island days.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=760&q=80" },
  { id: 2, name: "Ceylon Aloe Calm Gel", brand: "Island Botanics", category: "Skincare", price: 2250, rating: 4.8, popularScore: 95, stock: 16, label: "ISLAND PICK", description: "A cool, light gel for a fresh-feeling post-sun routine.", image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=760&q=80" },
  { id: 3, name: "Niacinamide Brightening Serum", brand: "Nila Skin", category: "Skincare", price: 3950, rating: 4.8, popularScore: 92, stock: 11, label: "POPULAR PICK", description: "A simple, easy-layering serum for your everyday routine.", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=760&q=80" },
  { id: 4, name: "Ceylon Rosewater Toner", brand: "Island Botanics", category: "Skincare", price: 2850, rating: 4.7, popularScore: 88, stock: 18, label: "LOCAL PICK", description: "A refreshing mist for a quick midday skin reset.", image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=760&q=80" },
  { id: 5, name: "Humidity Reset Gel Moisturizer", brand: "Kindred Skin", category: "Skincare", price: 4350, rating: 4.8, popularScore: 86, stock: 9, label: "LIGHTWEIGHT", description: "Comfortable hydration with a light feel in warm weather.", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=760&q=80" },
  { id: 6, name: "Coconut Cloud Body Lotion", brand: "Ceylon Day", category: "Body", price: 2950, rating: 4.6, popularScore: 81, stock: 21, label: "EVERYDAY FAVOURITE", description: "A soft, quick-absorbing lotion for everyday use.", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=760&q=80" },
  { id: 7, name: "Ceylon Rose Lip Tint", brand: "Bare Ritual", category: "Makeup", price: 2550, rating: 4.7, popularScore: 79, stock: 34, label: "POCKET-SIZED", description: "An easy pop of colour for workdays and weekends.", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=760&q=80" },
  { id: 8, name: "Jasmine & Tea Leaf Face Mist", brand: "Ceylon Day", category: "Skincare", price: 3650, rating: 4.5, popularScore: 75, stock: 7, label: "FRESHEN UP", description: "A fine facial mist to keep in your bag for warm days.", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=760&q=80" },
  { id: 9, name: "Gentle Coconut Face Wash", brand: "Island Botanics", category: "Skincare", price: 2450, rating: 4.8, popularScore: 72, stock: 14, label: "DAILY CLEANSE", description: "A gentle-feeling cleanse to start or end your day.", image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=760&q=80" },
  { id: 10, name: "Cica & Aloe Spot Gel", brand: "Nila Skin", category: "Skincare", price: 2150, rating: 4.9, popularScore: 70, stock: 25, label: "SKIN COMFORT", description: "A lightweight gel that fits neatly into a targeted routine.", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=760&q=80" },
  { id: 11, name: "Everyday Sheer Lip Balm", brand: "Bare Ritual", category: "Makeup", price: 1850, rating: 4.6, popularScore: 66, stock: 13, label: "DAILY ESSENTIAL", description: "A pocket-friendly balm with a soft wash of colour.", image: "https://images.unsplash.com/photo-1583241800698-e8ab01830a3f?auto=format&fit=crop&w=760&q=80" },
  { id: 12, name: "Sandalwood Body Oil", brand: "Ceylon Day", category: "Body", price: 3450, rating: 4.7, popularScore: 62, stock: 19, label: "SLOW DOWN", description: "A nourishing body oil for a slower after-shower ritual.", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=760&q=80" }
];

(() => {
  const version = "LKR-1";
  try {
    if (localStorage.getItem("glowcart-catalog-currency") === version) return;
    const savedProducts = JSON.parse(localStorage.getItem("glowcart-products") || "null");
    if (Array.isArray(savedProducts)) {
      const starterIds = new Set(window.GLOWCART_STARTER_PRODUCTS.map(product => product.id));
      const productsById = new Map(savedProducts.map(product => [product.id, product]));
      const localizedStarters = window.GLOWCART_STARTER_PRODUCTS.map(product => {
        const saved = productsById.get(product.id);
        return { ...product, stock: saved && Number.isInteger(saved.stock) ? saved.stock : product.stock, image: saved?.image || product.image };
      });
      const convertedCustomProducts = savedProducts.filter(product => !starterIds.has(product.id)).map(product => ({ ...product, price: Math.round(Number(product.price) * 300) }));
      localStorage.setItem("glowcart-products", JSON.stringify([...localizedStarters, ...convertedCustomProducts]));
    }
    const savedOrders = JSON.parse(localStorage.getItem("glowcart-orders") || "null");
    if (Array.isArray(savedOrders)) {
      const localizedOrders = savedOrders.map(order => order.currency === "LKR" ? order : ({
        ...order,
        total: Math.round(Number(order.total || 0) * 300),
        currency: "LKR",
        items: (order.items || []).map(item => ({ ...item, unitPrice: Math.round(Number(item.unitPrice || 0) * 300), subtotal: Math.round(Number(item.subtotal || 0) * 300) }))
      }));
      localStorage.setItem("glowcart-orders", JSON.stringify(localizedOrders));
    }
    localStorage.setItem("glowcart-catalog-currency", version);
  } catch {}
})();
