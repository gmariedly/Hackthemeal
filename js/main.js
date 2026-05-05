const SUPABASE_URL = 'https://wbtpmbbwrvbolzzlnles.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WumFc9d16GndV04KWoP3LA_S0RezPiD';
const WA_NUMBER   = '5491166758923';

const VISUALS = {
  'Pabellón Criollo': { emoji: '🍲', bg: 'linear-gradient(135deg,#FF5200,#FF7A00)' },
  'Tequeños x12':     { emoji: '🧀', bg: 'linear-gradient(135deg,#FFD100,#FFE566)' },
  'Pastelitos x8':    { emoji: '🫓', bg: 'var(--cr)' },
  'Salsa Guasacaca':  { emoji: '🌶️', bg: 'linear-gradient(135deg,#CC1500,#FF3A2A)' },
  'Carne Mechada':    { emoji: '🥩', bg: 'linear-gradient(135deg,#FF5200,#FF7A00)' },
  'Pollo Guisado':    { emoji: '🍗', bg: 'linear-gradient(135deg,#FFD100,#FFE566)' },
  'Asado Negro':      { emoji: '🫕', bg: '#1a0800' },
};
const DEF = { emoji: '🍽️', bg: 'var(--cr)' };

// ── CART ──────────────────────────────────────────────────
let cart = {};

function cartCount() {
  return Object.values(cart).reduce((s, i) => s + i.qty, 0);
}

function cartTotal() {
  return Object.values(cart).reduce((s, i) => s + i.p.precio * i.qty, 0);
}

function addToCart(p) {
  if (!p.disponible || p.stock <= 0) return;
  if (cart[p.id]) {
    if (cart[p.id].qty >= p.stock) {
      showToast('¡Llegaste al límite de stock!');
      return;
    }
    cart[p.id].qty++;
  } else {
    cart[p.id] = { p, qty: 1 };
  }
  updateCartUI();
  showToast((VISUALS[p.nombre] || DEF).emoji + ' Agregado al pedido');
}

function changeQty(id, d) {
  if (!cart[id]) return;
  cart[id].qty += d;
  if (cart[id].qty <= 0) delete cart[id];
  updateCartUI();
}

function updateCartUI() {
  const n = cartCount();
  const el = document.getElementById('cartCount');
  el.textContent = n;
  el.classList.toggle('show', n > 0);

  document.getElementById('cartTotal').textContent = '$' + cartTotal().toLocaleString('es-AR');
  document.getElementById('waBtn').disabled = n === 0;

  const c = document.getElementById('cartItems');
  if (n === 0) {
    c.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>';
    return;
  }

  c.innerHTML = Object.values(cart).map(({ p, qty }) => {
    const v = VISUALS[p.nombre] || DEF;
    return `
      <div class="cart-item">
        <div class="ci-emoji">${v.emoji}</div>
        <div class="ci-info">
          <div class="ci-name">${p.nombre}</div>
          <div class="ci-price">$${(p.precio * qty).toLocaleString('es-AR')}</div>
        </div>
        <div class="ci-controls">
          <button class="ci-btn" onclick="changeQty(${p.id}, -1)">−</button>
          <div class="ci-qty">${qty}</div>
          <button class="ci-btn" onclick="changeQty(${p.id}, 1)">+</button>
        </div>
      </div>`;
  }).join('');
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function checkoutWhatsApp() {
  const items = Object.values(cart);
  if (!items.length) { openCart(); return; }
  const lines = items.map(({ p, qty }) =>
    `• ${qty}x ${p.nombre} ($${(p.precio * qty).toLocaleString('es-AR')})`
  ).join('\n');
  const msg = `Hola! Quiero hacer un pedido en Hack The Meal 🍖\n\n${lines}\n\nTOTAL: $${cartTotal().toLocaleString('es-AR')}\n\n¿Tienen disponibilidad?`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── TOAST ─────────────────────────────────────────────────
let toastTimer;
function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ── RENDER PRODUCTS ───────────────────────────────────────
function badge(p) {
  if (!p.disponible || p.stock === 0) return { cls: 'b-out', label: 'AGOTADO' };
  if (p.stock <= 3) return { cls: 'b-low', label: 'ÚLTIMOS SPOTS' };
  return { cls: 'b-av', label: 'DISPONIBLE' };
}

function renderProducts(productos) {
  const disp = productos.filter(p => p.disponible && p.stock > 0).length;
  document.getElementById('spotsText').textContent =
    disp > 0
      ? `${disp} producto${disp !== 1 ? 's' : ''} disponible${disp !== 1 ? 's' : ''}`
      : 'Menú agotado esta semana';

  if (!productos.length) {
    document.getElementById('productsContainer').innerHTML =
      '<div class="loading-menu">No hay productos esta semana.</div>';
    return;
  }

  const cards = productos.map(p => {
    const v = VISUALS[p.nombre] || DEF;
    const b = badge(p);
    const sold = !p.disponible || p.stock === 0;
    const pData = JSON.stringify(p).replace(/'/g, "&apos;");
    return `
      <div class="card ${sold ? 'sold' : ''}">
        <div class="c-badge ${b.cls}">${b.label}</div>
        <div class="c-img" style="background:${v.bg}">${v.emoji}</div>
        <div class="c-body">
          <div class="c-name">${p.nombre}</div>
          <div class="c-desc">${p.descripcion}</div>
          <div class="c-stock">${sold ? 'Sin stock' : 'Stock: ' + p.stock + ' unidades'}</div>
          <div class="c-foot">
            <div class="c-price ${sold ? 'dim' : ''}">$${p.precio.toLocaleString('es-AR')}</div>
            <button class="c-btn ${sold ? 'off' : ''}" ${sold ? 'disabled' : `onclick='addToCart(${pData})'`}>
              ${sold ? 'AGOTADO' : 'AGREGAR'}
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('productsContainer').innerHTML = `<div class="cards">${cards}</div>`;
}

// ── INIT ──────────────────────────────────────────────────
async function init() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!r.ok) throw new Error();
    renderProducts(await r.json());
  } catch (e) {
    document.getElementById('productsContainer').innerHTML =
      '<div class="loading-menu">Error al cargar el menú. Intentá de nuevo.</div>';
  }
}

init();
