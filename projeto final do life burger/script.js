
// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
function formatCurrency(v){ return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
function loadProducts(){
  const stored = localStorage.getItem('lb_products');
  if(stored) return JSON.parse(stored);
  const defaults = [
    {id:1,name:'Burger Simples',desc:'Pão brioche, burger 100g, queijo e molho.',price:24.90,cat:'burgers',img:'img/burger1.jpg'},
    {id:2,name:'Burger Duplo',desc:'Dois burgers de 100g, queijo duplo e bacon.',price:36.90,cat:'burgers',img:'img/burger2.jpg'},
    {id:3,name:'Veggie Burger',desc:'Burger vegetariano, queijo, salada e molho.',price:27.90,cat:'veggie',img:'img/burger3.jpg'},
    {id:4,name:'Porção Batata',desc:'Batata crinkle com cheddar.',price:24.90,cat:'acompanhamentos',img:'img/batata.jpg'},
    {id:5,name:'Coca 2L',desc:'Refrigerante Coca-Cola 2L.',price:12.00,cat:'bebidas',img:'img/coca2l.jpg'}
  ];
  localStorage.setItem('lb_products', JSON.stringify(defaults));
  return defaults;
}

function saveProducts(list){ localStorage.setItem('lb_products', JSON.stringify(list)); }

// ---------- Menu + Theme ----------
document.addEventListener('click', (e)=> {
  if(e.target.id === 'menu-toggle') $('#nav-menu').classList.toggle('show');
});
document.addEventListener('DOMContentLoaded', ()=>{
  const tbtn = $('#toggle-theme');
  if(tbtn) tbtn.addEventListener('click', ()=> document.body.classList.toggle('dark-mode') );
  if(location.pathname.endsWith('cardapio.html') || location.pathname.endsWith('index.html')) initCardapio();
  if(location.pathname.endsWith('carrinho.html')) initCart();
  if(location.pathname.endsWith('login.html')) initLogin();
  if(location.pathname.endsWith('admin.html')) initAdmin();
  if(location.pathname.endsWith('pagamento.html')) initPayment();
});

// ---------- Cardápio ----------
function renderProducts(products){
  const container = $('#products');
  if(!container) return;
  container.innerHTML='';
  products.forEach(p=>{
    const div = document.createElement('div'); div.className='card';
    div.innerHTML = `
      <img src="${p.img}" alt="${p.name}" class="produto-img">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <p class="price">${formatCurrency(p.price)}</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
        <button class="btn" data-add="${p.id}">Adicionar</button>
        <button class="filter-btn" data-saiba="${p.id}">Saiba mais</button>
      </div>`;
    container.appendChild(div);
  });
  $$('.card button[data-add]').forEach(b=> b.addEventListener('click', e=> {
    const id = Number(e.target.dataset.add);
    addToCart(id,1);
    alert('Produto adicionado ao carrinho');
  }));
  $$('.card button[data-saiba]').forEach(b=> b.addEventListener('click', e=> {
    const id = Number(e.target.dataset.saiba);
    openModal(id);
  }));
}

function initCardapio(){
  let products = loadProducts();
  renderProducts(products);
  const search = $('#search');
  if(search){
    search.addEventListener('input', ()=> {
      const q = search.value.toLowerCase().trim();
      const filtered = loadProducts().filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
      renderProducts(filtered);
    });
  }
  $$('.filter-btn').forEach(btn=> btn.addEventListener('click', (e)=> {
    $$('.filter-btn').forEach(b=> b.classList.remove('active'));
    e.target.classList.add('active');
    const cat = e.target.dataset.cat;
    const list = loadProducts();
    if(cat === 'all') renderProducts(list);
    else renderProducts(list.filter(p=> p.cat === cat));
  }));
  $('#close-modal').addEventListener('click', closeModal);
  $('#modal-add').addEventListener('click', ()=>{
    const id = Number($('#modal-add').dataset.id);
    addToCart(id,1);
    closeModal();
    location.href='carrinho.html';
  });
}

function openModal(id){
  const prod = loadProducts().find(p=> p.id === id);
  if(!prod) return;
  $('#modal-img').src = prod.img;
  $('#modal-title').textContent = prod.name;
  $('#modal-desc').textContent = prod.desc;
  $('#modal-price').textContent = formatCurrency(prod.price);
  $('#modal-add').dataset.id = prod.id;
  document.getElementById('modal').setAttribute('aria-hidden','false');
}

function closeModal(){ document.getElementById('modal').setAttribute('aria-hidden','true'); }

// ---------- Carrinho ----------
function getCart(){ return JSON.parse(localStorage.getItem('lb_cart')||'[]'); }
function saveCart(c){ localStorage.setItem('lb_cart', JSON.stringify(c)); }
function addToCart(id, qty){
  const cart = getCart();
  const item = cart.find(i=> i.id===id);
  if(item) item.qty += qty; else cart.push({id,qty});
  saveCart(cart);
}

function initCart(){
  renderCart();
  const form = $('#checkout-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!form.reportValidity()) return;
    const cart = getCart();
    if(cart.length===0){ alert('Carrinho vazio'); return; }
    const subtotal = calculateSubtotal();
    const shipping = subtotal < 50 ? 8 : 0;
    const total = subtotal + shipping;
    alert('Pedido confirmado! Valor total: ' + formatCurrency(total));
    localStorage.removeItem('lb_cart');
    renderCart();
    form.reset();
  });
}

function calculateSubtotal(){
  const cart = getCart();
  const products = loadProducts();
  let s = 0;
  cart.forEach(it=>{
    const p = products.find(x=> x.id===it.id);
    if(p) s += p.price * it.qty;
  });
  return Number(s.toFixed(2));
}

function renderCart(){
  const container = $('#cart-container');
  container.innerHTML='';
  const cart = getCart();
  const products = loadProducts();
  if(cart.length===0){ container.innerHTML = '<p>Seu carrinho está vazio.</p>'; $('#subtotal').textContent='Subtotal: R$ 0,00'; $('#shipping').textContent='Frete: R$ 0,00'; $('#total').textContent='Total: R$ 0,00'; return; }
  const ul = document.createElement('ul');
  ul.style.listStyle='none';
  ul.style.padding='0';
  cart.forEach(it=>{
    const p = products.find(x=> x.id===it.id);
    const li = document.createElement('li');
    li.style.display='flex'; li.style.gap='12px'; li.style.alignItems='center'; li.style.marginBottom='10px'; li.style.background='#fff'; li.style.padding='10px'; li.style.borderRadius='8px';
    li.innerHTML = `
      <img src="${p.img}" alt="${p.name}" style="width:96px;height:64px;object-fit:cover;border-radius:6px">
      <div style="flex:1"><strong>${p.name}</strong><div style="color:#666">${p.desc}</div></div>
      <div style="text-align:right">
        <div>${formatCurrency(p.price)}</div>
        <div style="margin-top:8px;display:flex;gap:6px;align-items:center;justify-content:flex-end">
          <button class="qty-btn" data-id="${p.id}" data-op="decrease">-</button>
          <span id="q-${p.id}">${it.qty}</span>
          <button class="qty-btn" data-id="${p.id}" data-op="increase">+</button>
          <button class="btn" data-remove="${p.id}" style="margin-left:8px;background:#e74c3c">Remover</button>
        </div>
      </div>`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
  const subtotal = calculateSubtotal();
  const shipping = subtotal < 50 ? 8 : 0;
  $('#subtotal').textContent = 'Subtotal: ' + formatCurrency(subtotal);
  $('#shipping').textContent = 'Frete: ' + formatCurrency(shipping);
  $('#total').textContent = 'Total: ' + formatCurrency(subtotal + shipping);
  $$('.qty-btn').forEach(b=> b.addEventListener('click', (e)=>{
    const id = Number(e.target.dataset.id);
    const op = e.target.dataset.op;
    const cart = getCart();
    const item = cart.find(x=> x.id===id);
    if(!item) return;
    if(op==='increase') item.qty++;
    else item.qty = Math.max(0, item.qty-1);
    const idx = cart.findIndex(x=> x.id===id);
    if(item.qty===0) cart.splice(idx,1);
    saveCart(cart); renderCart();
  }));
  $$('.btn[data-remove]').forEach(b=> b.addEventListener('click', (e)=>{
    const id = Number(e.target.dataset.remove);
    if(!confirm('Deseja remover este produto do carrinho?')) return;
    let cart = getCart();
    cart = cart.filter(x=> x.id!==id);
    saveCart(cart); renderCart();
  }));
}

// ---------- Login / Admin (simples demo) ----------
function initLogin(){
  $('#login-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = $('#admin-email').value.trim();
    const pass = $('#admin-pass').value;
    if(email==='admin@lifeburguer.com' && pass==='admin123'){
      localStorage.setItem('lb_admin','true');
      location.href='admin.html';
    } else {
      $('#login-status').textContent='Credenciais inválidas (use admin@lifeburguer.com / admin123 para demo)';
    }
  });
}

function initAdmin(){
  if(!localStorage.getItem('lb_admin')){ alert('Acesso restrito. Faça login como administrador.'); location.href='login.html'; return; }
  const list = $('#product-list');
  const form = $('#product-form');
  function refreshList(){
    const prod = loadProducts();
    list.innerHTML='';
    prod.forEach(p=>{
      const li = document.createElement('li');
      li.innerHTML = `<span>${p.name} - ${formatCurrency(p.price)}</span>
        <span>
          <button class="btn edit" data-id="${p.id}">Editar</button>
          <button class="btn delete" data-id="${p.id}" style="background:#e74c3c">Excluir</button>
        </span>`;
      list.appendChild(li);
    });
    $$('.edit').forEach(b=> b.addEventListener('click', ()=> {
      const id = Number(b.dataset.id);
      const prod = loadProducts().find(x=> x.id===id);
      $('#p-id').value = prod.id; $('#p-name').value = prod.name; $('#p-desc').value = prod.desc;
      $('#p-price').value = prod.price; $('#p-cat').value = prod.cat; $('#p-img').value = prod.img || '';
    }));
    $$('.delete').forEach(b=> b.addEventListener('click', ()=> {
      const id = Number(b.dataset.id);
      if(!confirm('Confirmar exclusão do produto?')) return;
      let prods = loadProducts();
      prods = prods.filter(x=> x.id!==id);
      saveProducts(prods); refreshList();
    }));
  }
  refreshList();
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!form.reportValidity()) return;
    const id = Number($('#p-id').value) || 0;
    const name = $('#p-name').value.trim(); const desc = $('#p-desc').value.trim();
    const price = Number($('#p-price').value); const cat = $('#p-cat').value.trim(); const img = $('#p-img').value.trim() || 'img/placeholder.jpg';
    let prods = loadProducts();
    if(id>0){
      prods = prods.map(p=> p.id===id ? {...p,name,desc,price,cat,img} : p);
    } else {
      const nid = prods.length ? Math.max(...prods.map(p=> p.id))+1 : 1;
      prods.push({id:nid,name,desc,price,cat,img});
    }
    saveProducts(prods); form.reset(); refreshList();
  });
  $('#logout').addEventListener('click', ()=> { localStorage.removeItem('lb_admin'); location.href='index.html'; });
}

// ---------- Payment simulate ----------
function initPayment(){
  const form = $('#payment-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    alert('Pagamento simulado. Obrigado pela compra!');
    localStorage.removeItem('lb_cart');
    location.href='index.html';
  });
}
