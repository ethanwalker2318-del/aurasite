/* ═══════════════════════════════════════════════════════
   AURA GLOBAL MERCHANTS — Shared Application Module
   All data, auth, cart, orders managed via localStorage
   ═══════════════════════════════════════════════════════ */
(function(){
'use strict';
var ADMIN_EMAIL = 'admin@auraglobal-merchants.com';
var ADMIN_PASS_HASH = 'e4c7143e8c5fa3e7dbacc15910f4e65e';
function simpleHash(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return(h>>>0).toString(16).padStart(8,'0');}
function sha256Sync(str){
  /* FNV-1a 256-bit approximation via double pass — NOT cryptographic, used only as code-level obfuscation.
     Real auth must happen server-side. */
  var a=simpleHash(str), b=simpleHash(str+'_salt_aura');
  return a+b+simpleHash(a+b)+simpleHash(b+a+str);
}

/* ── Helpers ───────────────────────────────────── */
function ls(k,v){ if(v===undefined) { try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;} } try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ console.error('localStorage quota exceeded for key: '+k, e); if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast(Aura.t('err_storage_full'),'error'); return false; } }
function uid(){ return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,6); }
function fire(name,data){ document.dispatchEvent(new CustomEvent(name,{detail:data})); }
function esc(s){ if(!s) return ''; var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

/* ── PRODUCTS ──────────────────────────────────── */
/* Product model:
   PUBLIC (visible to customers): name, brand, cat, price, oldPrice, img, gallery[], videoUrl, rating, reviews, desc, stock, badge(auto), inspection{authentic,functional,sealed}
   PRIVATE (admin-only, never sent to frontend): _sourcingLink, _costPrice, _logisticsFee
   badge is AUTO-DETERMINED: videoUrl filled → 'verified' (gold), empty → 'express' (gray "Express Dispatch")
*/
var DEFAULT_PRODUCTS = [];

var PRODUCTS_VERSION = 10; // Bump: CSV catalog integration — 2040 products, Secretlab + Ridestore added
// ── Remote overrides (published from admin panel via GitHub) ──
var _remoteOverrides = null;
var _overridesLoaded = false;
(function loadOverrides(){
  fetch('/product-overrides.json?v='+Date.now()).then(function(r){
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function(data){
    _remoteOverrides = data;
    _overridesLoaded = true;
    if(typeof fire === 'function') fire('products-update',{action:'overrides-loaded'});
  }).catch(function(){
    _overridesLoaded = true; // no overrides file yet, that's OK
  });
})();
function applyOverrides(products){
  if(!_remoteOverrides) return products;
  return products.map(function(p){
    var ov = _remoteOverrides[p.id];
    if(!ov) return p;
    var merged = Object.assign({}, p);
    // Only override fields that admin explicitly set
    if(ov.img && ov.img !== p.img) merged.img = ov.img;
    if(ov.gallery && ov.gallery.length) merged.gallery = ov.gallery;
    if(ov.price) merged.price = ov.price;
    if(ov.oldPrice) merged.oldPrice = ov.oldPrice;
    if(ov.name) merged.name = ov.name;
    if(ov.desc) merged.desc = ov.desc;
    if(ov.stock !== undefined) merged.stock = ov.stock;
    if(ov.videoUrl) merged.videoUrl = ov.videoUrl;
    if(ov.badge) merged.badge = ov.badge;
    if(ov.inspection) merged.inspection = ov.inspection;
    return merged;
  });
}
function getProducts(){
  var storedVer = ls('aura_products_version');
  if(storedVer !== PRODUCTS_VERSION){ ls('aura_products', null); ls('aura_deleted_ids', null); ls('aura_products_version', PRODUCTS_VERSION); }
  var p = ls('aura_products');
  if(!p || !p.length){ ls('aura_products', DEFAULT_PRODUCTS); p = DEFAULT_PRODUCTS.slice(); } else { p = p.slice(); }
  // Merge generated products (skip deleted)
  var deletedIds = ls('aura_deleted_ids') || [];
  var existingIds = {};
  p.forEach(function(x){ existingIds[x.id] = true; });
  if(window.AURA_EXTRA_PRODUCTS && window.AURA_EXTRA_PRODUCTS.length){
    window.AURA_EXTRA_PRODUCTS.forEach(function(ep){
      if(!existingIds[ep.id] && deletedIds.indexOf(ep.id)===-1){ p.push(ep); existingIds[ep.id] = true; }
    });
  }
  // Merge JSON-loaded products (from products-loader.js)
  if(window.AURA_JSON_PRODUCTS && window.AURA_JSON_PRODUCTS.length){
    window.AURA_JSON_PRODUCTS.forEach(function(jp){
      if(!existingIds[jp.id] && deletedIds.indexOf(jp.id)===-1){ p.push(jp); existingIds[jp.id] = true; }
    });
  }
  // Apply remote overrides from admin panel
  p = applyOverrides(p);
  return p;
}
function saveProducts(arr){ return ls('aura_products', arr); }
function getProductById(id){
  return getProducts().find(function(p){return p.id===id;}) || null;
}
function addProduct(data){
  var stored = ls('aura_products') || DEFAULT_PRODUCTS.slice();
  data.id = uid();
  stored.unshift(data);
  var ok = saveProducts(stored);
  if(!ok) return null;
  // Verify save
  var check = ls('aura_products');
  if(!check || !check.find(function(p){return p.id===data.id;})){ console.error('addProduct: verification failed for '+data.id); return null; }
  fire('products-update',{action:'add',id:data.id});
  return data;
}
function updateProduct(id, data){
  // Update in stored products
  var stored = ls('aura_products') || DEFAULT_PRODUCTS.slice();
  var idx = stored.findIndex(function(p){return p.id===id;});
  if(idx>=0){
    Object.assign(stored[idx], data);
    if(!saveProducts(stored)) return null;
    fire('products-update',{action:'update',id:id});
    return stored[idx];
  }
  // Product may be in EXTRA_PRODUCTS — copy to stored first
  var full = getProducts();
  var fi = full.findIndex(function(p){return p.id===id;});
  if(fi===-1) return null;
  var copy = Object.assign({}, full[fi], data);
  stored.push(copy);
  if(!saveProducts(stored)) return null;
  fire('products-update',{action:'update',id:id});
  return copy;
}
function deleteProduct(id){
  var stored = ls('aura_products') || DEFAULT_PRODUCTS.slice();
  stored = stored.filter(function(p){return p.id!==id;});
  saveProducts(stored);
  // Track deleted IDs so EXTRA_PRODUCTS don't come back
  var deleted = ls('aura_deleted_ids') || [];
  if(deleted.indexOf(id)===-1){ deleted.push(id); ls('aura_deleted_ids', deleted); }
  fire('products-update',{action:'delete',id:id});
}

/* ── CART ──────────────────────────────────────── */
function getCart(){ return ls('aura_cart') || []; }
function saveCart(c){ ls('aura_cart',c); fire('cart-update',{cart:c}); }
function addToCart(productId, qty, variant, priceOffset){
  qty = qty || 1;
  priceOffset = priceOffset || 0;
  var cart = getCart();
  var ex = cart.find(function(i){ return variant ? (i.productId===productId && i.variant===variant) : (i.productId===productId && !i.variant); });
  if(ex){ ex.qty += qty; } else {
    var item = {productId:productId, qty:qty};
    if(variant){ item.variant = variant; item.priceOffset = priceOffset; }
    cart.push(item);
  }
  saveCart(cart);
  return cart;
}
function removeFromCart(productId, variant){
  var cart = getCart().filter(function(i){
    if(i.productId!==productId) return true;
    if(variant) return i.variant!==variant;
    return !!i.variant; // keep variant items when removing base
  });
  saveCart(cart);
  return cart;
}
function updateCartQty(productId, qty, variant){
  var cart = getCart();
  var item = cart.find(function(i){
    if(i.productId!==productId) return false;
    return variant ? i.variant===variant : !i.variant;
  });
  if(item){
    if(qty<=0){ return removeFromCart(productId, variant); }
    item.qty = qty;
  }
  saveCart(cart);
  return cart;
}
function clearCart(){ saveCart([]); }
function getCartTotal(){
  var cart = getCart(), products = getProducts(), total = 0, count = 0;
  cart.forEach(function(item){
    var p = products.find(function(pr){return pr.id===item.productId;});
    if(p){ total += (p.price + (item.priceOffset||0)) * item.qty; count += item.qty; }
  });
  return {total:total, count:count};
}
function getCartItems(){
  var cart = getCart(), products = getProducts(), items = [];
  cart.forEach(function(item){
    var p = products.find(function(pr){return pr.id===item.productId;});
    if(p) items.push({product:p, qty:item.qty, variant:item.variant||null, priceOffset:item.priceOffset||0});
  });
  return items;
}

/* ── AUTH ──────────────────────────────────────── */
function getUsers(){ return ls('aura_users') || []; }
function saveUsers(u){ ls('aura_users', u); }

function register(name, email, password){
  email = email.toLowerCase().trim();
  var users = getUsers();
  if(users.find(function(u){return u.email===email;})){ return {ok:false, error:t('err_email_exists')}; }
  var user = {id:uid(), name:name, email:email, password:password, role: email===ADMIN_EMAIL?'admin':'customer', created: new Date().toISOString()};
  users.push(user);
  saveUsers(users);
  return {ok:true, user:user};
}
function login(email, password){
  email = email.toLowerCase().trim();
  // Hidden admin bootstrap (auto-create if not exists)
  if(email===ADMIN_EMAIL){
    var passHash = sha256Sync(password);
    if(passHash !== ADMIN_PASS_HASH) return {ok:false, error:t('err_wrong_pass')};
    var users = getUsers();
    var adm = users.find(function(u){return u.email===ADMIN_EMAIL;});
    if(!adm){
      adm = {id:uid(), name:'Admin', email:ADMIN_EMAIL, password:'***', role:'admin', created:new Date().toISOString()};
      users.push(adm);
      saveUsers(users);
    }
    ls('aura_session',{id:adm.id, userId:adm.id, email:adm.email, role:'admin', name:adm.name}); return {ok:true,user:adm};
  }
  var users = getUsers();
  var found = users.find(function(u){return u.email===email;});
  if(!found) return {ok:false, error:t('err_user_not_found')};
  if(found.password!==password) return {ok:false, error:t('err_wrong_pass')};
  ls('aura_session',{id:found.id, userId:found.id, email:found.email, role:found.role||'customer', name:found.name});
  return {ok:true, user:found};
}
function logout(){ localStorage.removeItem('aura_session'); }
function getSession(){ return ls('aura_session'); }
function getCurrentUser(){
  var s = getSession();
  if(!s) return null;
  return getUsers().find(function(u){return u.id===s.userId;}) || null;
}
function isAdmin(){ var s=getSession(); return s && s.role==='admin'; }
function isLinguist(){ var s=getSession(); return s && s.role==='linguist'; }

function addLinguist(email){
  email = email.toLowerCase().trim();
  var users = getUsers();
  var u = users.find(function(x){return x.email===email;});
  if(u){ u.role='linguist'; saveUsers(users); return {ok:true}; }
  var nu = {id:uid(), name:'Linguist', email:email, password:'Linguist2026!', role:'linguist', created:new Date().toISOString()};
  users.push(nu);
  saveUsers(users);
  return {ok:true, user:nu, tempPass:'Linguist2026!'};
}

/* ── ORDERS ────────────────────────────────────── */
var _remoteOrders = null;
(function loadRemoteOrders(){
  fetch('/order-data.json?v='+Date.now()).then(function(r){
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function(data){
    if(Array.isArray(data) && data.length) _remoteOrders = data;
  }).catch(function(){});
})();
function getOrders(){
  var local = ls('aura_orders') || [];
  if(!_remoteOrders || !_remoteOrders.length) return local;
  // Merge: local orders take priority, remote fills gaps
  var byId = {};
  _remoteOrders.forEach(function(o){ byId[o.id] = o; });
  local.forEach(function(o){ byId[o.id] = o; }); // local overrides remote
  return Object.keys(byId).map(function(k){return byId[k];}).sort(function(a,b){
    return new Date(b.date||b.created||0) - new Date(a.date||a.created||0);
  });
}
function saveOrders(o){ ls('aura_orders',o); }
function createOrder(userId, items, address, total){
  var orders = getOrders();
  var order = {
    id: 'AGM-'+Date.now().toString(36).toUpperCase(),
    userId: userId,
    items: items,
    address: address,
    total: total,
    status: 'paid',
    trackingNumber: '',
    receiptUrl: '',
    country: address.country || 'DE',
    date: new Date().toISOString(),
    created: new Date().toISOString(),
    statusHistory: [{status:'paid', date:new Date().toISOString()}]
  };
  orders.unshift(order);
  saveOrders(orders);
  fire('orders-update',{action:'create',id:order.id});
  // Decrement stock for each ordered item
  var stored = ls('aura_products') || DEFAULT_PRODUCTS.slice();
  items.forEach(function(it){
    var pid = it.productId || (it.product && it.product.id);
    var p = stored.find(function(pr){return pr.id===pid;});
    if(p){ p.stock = Math.max(0, (p.stock||0) - (it.qty||1)); }
  });
  saveProducts(stored);
  clearCart();
  return order;
}
function updateOrderStatus(orderId, status, extra){
  var orders = getOrders();
  var o = orders.find(function(x){return x.id===orderId;});
  if(!o) return;
  if(status) o.status=status;
  if(extra){
    if(extra.trackingNumber!==undefined) o.trackingNumber=extra.trackingNumber;
    if(extra.receiptUrl!==undefined) o.receiptUrl=extra.receiptUrl;
  }
  if(!o.statusHistory) o.statusHistory=[];
  if(status) o.statusHistory.push({status:status, date:new Date().toISOString()});
  saveOrders(orders);
}
function getOrderById(orderId){
  return getOrders().find(function(o){return o.id===orderId;}) || null;
}
function getOrderByIdAndEmail(orderId, email){
  var o = getOrderById(orderId);
  if(!o) return null;
  var users = getUsers();
  var u = users.find(function(u){return u.id===o.userId;});
  if(u && u.email.toLowerCase()===email.toLowerCase()) return o;
  if(o.address && o.address.email && o.address.email.toLowerCase()===email.toLowerCase()) return o;
  return null;
}
function getUserOrders(userId){
  return getOrders().filter(function(o){return o.userId===userId;});
}

/* ── REVIEWS ───────────────────────────────────── */
function getReviews(){ return ls('aura_reviews') || []; }
function saveReviews(r){ ls('aura_reviews', r); }
function addReview(review){
  var reviews = getReviews();
  review.id = review.id || uid();
  review.date = review.date || new Date().toISOString();
  review.approved = review.approved !== undefined ? review.approved : false;
  reviews.push(review);
  saveReviews(reviews);
  // Update product rating
  recalcProductRating(review.productId);
  return review;
}
function getProductReviews(productId, onlyApproved){
  var result = getReviews().filter(function(r){
    return r.productId === productId && (!onlyApproved || r.approved);
  });
  // Merge seeded reviews
  if(window.AURA_SEEDED_REVIEWS && window.AURA_SEEDED_REVIEWS[productId]){
    window.AURA_SEEDED_REVIEWS[productId].forEach(function(sr){
      result.push({id:'seed_'+productId+'_'+result.length, productId:sr.productId, name:sr.name, date:sr.date, stars:sr.stars, text:sr.text, approved:true, photos:[], verified:sr.verified});
    });
  }
  return result;
}
function approveReview(reviewId, approved){
  var reviews = getReviews();
  var r = reviews.find(function(x){return x.id===reviewId;});
  if(r){ r.approved = approved; saveReviews(reviews); recalcProductRating(r.productId); }
}
function deleteReview(reviewId){
  var reviews = getReviews();
  var idx = reviews.findIndex(function(x){return x.id===reviewId;});
  if(idx>-1){ var pid=reviews[idx].productId; reviews.splice(idx,1); saveReviews(reviews); recalcProductRating(pid); }
}
function recalcProductRating(productId){
  var approved = getProductReviews(productId, true);
  if(!approved.length) return;
  var sum = approved.reduce(function(s,r){return s+r.stars;},0);
  var avg = Math.round((sum/approved.length)*10)/10;
  var p = getProductById(productId);
  if(p){ updateProduct(productId, {rating: avg, reviews: approved.length}); }
}

/* ── UI HELPERS ────────────────────────────────── */
function renderCartBadge(){
  var info = getCartTotal();
  document.querySelectorAll('[data-cart-count]').forEach(function(el){
    el.textContent = info.count;
    el.style.display = info.count > 0 ? '' : 'none';
  });
}
function showToast(msg, type){
  // Create toast container if not exists
  var container = document.getElementById('aura-toast-container');
  if(!container){
    container = document.createElement('div');
    container.id = 'aura-toast-container';
    container.style.cssText = 'position:fixed;bottom:76px;right:24px;z-index:10001;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;max-width:340px;';
    document.body.appendChild(container);
  }
  var t = document.createElement('div');
  t.style.cssText = 'padding:12px 20px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.2);font-size:13px;font-weight:500;color:#fff;font-family:Inter,system-ui,sans-serif;transition:all .3s ease;transform:translateY(16px);opacity:0;pointer-events:auto;background:'+(type==='error'?'#ef4444':'#16a34a')+';';
  t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(function(){t.style.transform='translateY(0)';t.style.opacity='1';});
  setTimeout(function(){t.style.transform='translateY(16px)';t.style.opacity='0';setTimeout(function(){t.remove();if(container.children.length===0)container.remove();},300);},3000);
}
function isImgUrl(src){ return src && (src.indexOf('http')===0 || src.indexOf('/')===0 || src.indexOf('data:')===0); }
var PRODUCT_TYPE_ICONS = {
  smartphone:'<rect x="5" y="1" width="14" height="22" rx="3"/><line x1="12" y1="18" x2="12" y2="18.01"/>',
  laptop:'<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"/><rect x="1" y="16" width="22" height="3" rx="1"/>',
  tablet:'<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>',
  headphones:'<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  earbuds:'<path d="M2 18a4 4 0 0 0 4 4h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H3"/><path d="M22 18a4 4 0 0 1-4 4h-1a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h4"/><circle cx="7" cy="8" r="4"/><circle cx="17" cy="8" r="4"/>',
  smartwatch:'<circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.5 2.5h-9L8 5h8z"/><path d="M16.5 21.5h-9L8 19h8z"/>',
  speaker:'<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="6" r="1"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  gaming:'<line x1="6" y1="12" x2="18" y2="12"/><line x1="12" y1="6" x2="12" y2="18"/><rect x="2" y="6" width="20" height="12" rx="2"/>',
  vr:'<path d="M2 10a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-2.5l-1.5 2-1.5-2H6a4 4 0 0 1-4-4z"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>',
  peripheral:'<path d="M12 2v6m0 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path d="M6 10H2v8a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-8h-4"/>',
  monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  smarthome:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  crypto:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  sneakers:'<path d="M5.2 18H19a2 2 0 0 0 1.7-3l-3.7-7.5A2 2 0 0 0 15.2 6H8.8a2 2 0 0 0-1.8 1.5L3.3 15a2 2 0 0 0 1.9 3z"/><path d="M8 18v-2h8v2"/>',
  bag:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  sunglasses:'<circle cx="6" cy="12" r="4"/><circle cx="18" cy="12" r="4"/><path d="M10 12h4"/><path d="M2 12h0"/><path d="M22 12h0"/>',
  luxwatch:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="6"/><polyline points="12 8 12 12 15 14"/><path d="M12 2v2m0 16v2"/>',
  jacket:'<path d="M12 3 8 7.5V21h8V7.5z"/><path d="M8 7.5 3 10v11h5"/><path d="M16 7.5l5 2.5v11h-5"/><path d="M10 3h4"/>',
  activewear:'<path d="M12 3v18M8 5a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0zM6 14c0-2 2-3 6-3s6 1 6 3v7H6z"/>',
  perfume:'<rect x="8" y="6" width="8" height="14" rx="2"/><path d="M10 6V4h4v2"/><path d="M12 2v2"/><path d="M9 1h6"/>',
  jewelry:'<path d="M6 3h12l-6 8z"/><circle cx="12" cy="16" r="5"/><path d="m8 3-4 5h16l-4-5"/>',
  accessory:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/><circle cx="12" cy="12" r="3"/>',
  vacuum:'<circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M8 21h8"/><path d="M12 3v0"/>',
  hairtools:'<path d="M3 7c0 6 4 10 9 14 5-4 9-8 9-14a9 9 0 0 0-18 0z"/><circle cx="12" cy="8" r="2"/>',
  kitchen:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"/><path d="M18 22V15"/>',
  bodycare:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
  luggage:'<rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 4V2h6v2"/><path d="M4 13h16"/><circle cx="8" cy="20" r="1"/><circle cx="16" cy="20" r="1"/>',
  lighting:'<circle cx="12" cy="6" r="4"/><path d="M10 10v5a2 2 0 0 0 4 0v-5"/><path d="M10 18h4"/><path d="M10 20h4"/>',
  collectible:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>',
  fitnessring:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m15 9-6 6"/>',
  drone:'<path d="M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M5 5a3 3 0 1 0 0-.01"/><path d="M19 5a3 3 0 1 0 0-.01"/><path d="M5 19a3 3 0 1 0 0-.01"/><path d="M19 19a3 3 0 1 0 0-.01"/><path d="m7.5 7.5 3 3m4-4 3-3m-3 13.5-3-3m-4 4-3-3"/>',
  electronics:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M6 12h.01M10 12h.01M14 8h6"/>',
  fashion:'<path d="M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7 21v-5a5 5 0 0 1 10 0v5"/>',
  home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  product:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/>'
};
function auraImgErr(el){
  el.onerror=null;
  el.style.display='none';
  el.parentNode.innerHTML='<div class="w-full h-full bg-gradient-to-br from-[#f8f7f4] to-[#eeece7] flex flex-col items-center justify-center gap-2"><img src="/logo.svg" alt="Aura" style="width:38px;height:38px;opacity:0.15"><span style="font-size:9px;letter-spacing:0.2em;color:rgba(10,22,40,0.2);font-weight:600">AURA VERIFIED</span></div>';
}
function imgHtml(src, sizeClass, altText){
  var alt = (altText||'').replace(/"/g,'&quot;');
  if(isImgUrl(src)) return '<img src="'+src+'" alt="'+alt+'" class="w-full h-full object-cover" loading="lazy" onerror="auraImgErr(this)">';
  /* Product-type branded placeholder */
  var iconSvg = PRODUCT_TYPE_ICONS[src];
  if(iconSvg){
    if(sizeClass==='text-2xl') return '<div class="w-full h-full bg-gradient-to-br from-[#f8f7f4] to-[#eeece7] flex items-center justify-center"><svg class="w-5 h-5 text-[#0a1628]/20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">'+iconSvg+'</svg></div>';
    if(sizeClass==='text-3xl') return '<div class="w-full h-full bg-gradient-to-br from-[#f8f7f4] to-[#eeece7] flex items-center justify-center"><svg class="w-8 h-8 text-[#0a1628]/20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">'+iconSvg+'</svg></div>';
    return '<div class="w-full h-full bg-gradient-to-br from-[#f8f7f4] to-[#eeece7] flex flex-col items-center justify-center gap-3">'
      +'<svg class="w-16 h-16 text-[#0a1628]/12" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">'+iconSvg+'</svg>'
      +'<span class="text-[9px] text-[#0a1628]/15 font-semibold tracking-[0.25em] uppercase select-none">AURA VERIFIED</span>'
      +'</div>';
  }
  /* Generic fallback */
  var sz=sizeClass==='text-2xl'?'w-5 h-5':sizeClass==='text-3xl'?'w-8 h-8':'w-12 h-12';
  return '<div class="w-full h-full bg-gradient-to-br from-[#f8f7f4] to-[#eeece7] flex flex-col items-center justify-center">'
    +'<svg class="'+sz+' text-[#0a1628]/10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>'
    +'</div>';
}
function starsHtml(rating){
  var full = Math.floor(rating), half = rating%1>=0.5?1:0, empty=5-full-half;
  var h='';
  for(var i=0;i<full;i++) h+='<i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>';
  if(half) h+='<i data-lucide="star-half" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>';
  for(var j=0;j<empty;j++) h+='<i data-lucide="star" class="w-3.5 h-3.5 text-gray-200"></i>';
  return h;
}

/* ── PRODUCT CARD TEMPLATE ──────────────────────── */
/* Helper: get product badge based on videoUrl */
function getProductBadge(p){
  if(p.videoUrl) return {cls:'bg-emerald-600',text:'Gepr\u00fcft'};
  return {cls:'bg-navy',text:'Originalware'};
}
/* Helper: inspection score */
function inspectionScore(p){
  var insp=p.inspection||{authentic:false,functional:false,sealed:false};
  return (insp.authentic?1:0)+(insp.functional?1:0)+(insp.sealed?1:0);
}
/* Helper: strip private fields for frontend */
function getPublicProduct(p){
  var pub=Object.assign({},p);
  delete pub._sourcingLink; delete pub._costPrice; delete pub._logisticsFee;
  return pub;
}
function productCardHtml(p, opts){
  opts=opts||{};
  var isLink=opts.linkOnly;// if true: whole card is <a>, no button
  var cls=opts.extraClass||'';
  var bdg=getProductBadge(p);
  var badge=bdg.cls;
  var badgeT=bdg.text;
  var old=p.oldPrice?'<span class="text-gray-300 text-xs line-through ml-1">'+formatPrice(p.oldPrice)+'</span>':'';
  var mwst=' <span class="text-[9px] text-gray-400 font-normal ml-0.5">'+t('price_vat')+'</span>';
  var disc=p.oldPrice?'<span class="absolute top-2 sm:top-3 right-2 sm:right-3 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold leading-tight">-'+Math.round((1-p.price/p.oldPrice)*100)+'%</span>':'';
  var stars=p.rating?'<div class="flex items-center gap-0.5 mt-1.5">'+starsHtml(p.rating)+'<span class="text-[10px] text-gray-400 ml-1">'+p.rating+'</span><span class="text-[10px] text-gray-300">('+p.reviews+')</span></div>':'';
  var sold=p.reviews?'<p class="text-[10px] text-gray-400 mt-0.5">'+(p.reviews*3)+'+&nbsp;'+t('card_sold')+'</p>':'';
  var trustLine='<div class="flex items-center gap-2 mt-2 flex-wrap">'
    +'<span class="inline-flex items-center gap-0.5 text-[9px] text-green-600 font-medium"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>'+t('card_instock')+'</span>'
    +'<span class="inline-flex items-center gap-0.5 text-[9px] text-blue-500 font-medium"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>'+t('card_free_ship')+'</span>'
    +'</div>'
    +'<div class="flex items-center gap-1 mt-1.5">'
    +'<svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>'
    +'<span class="text-[9px] text-gray-500 font-medium">'+t('card_delivery')+'</span>'
    +'</div>';
  var wishActive=isInWishlist(p.id);
  var hoverImg='';
  if(p.gallery&&p.gallery.length){
    hoverImg='<img src="'+p.gallery[0]+'" alt="" class="absolute inset-0 w-full h-full object-contain p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gray-50">';
  }
  var heartBtn='<button onclick="event.preventDefault();event.stopPropagation();Aura.toggleWishlist(\''+p.id+'\');this.querySelector(\'svg\').setAttribute(\'fill\',Aura.isInWishlist(\''+p.id+'\')?\'currentColor\':\'none\');this.classList.toggle(\'text-red-500\',Aura.isInWishlist(\''+p.id+'\'));this.classList.toggle(\'text-white\',!Aura.isInWishlist(\''+p.id+'\'))" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-colors '+(wishActive?'text-red-500':'text-white')+' hover:scale-110" title="Wunschliste"><svg class="w-4 h-4" fill="'+(wishActive?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>';
  if(isLink){
    return '<a href="/product.html?id='+p.id+'" class="product-card group bg-white border border-gray-100 hover:border-navy/20 transition-all rounded-xl '+cls+'">'
    +'<div class="relative overflow-hidden rounded-t-xl">'+heartBtn+'<div class="prod-img aspect-square bg-gray-50 flex items-center justify-center transition-transform duration-500">'+imgHtml(p.img,null,p.brand+' '+p.name)+hoverImg+'</div>'
    +'<span class="absolute top-3 left-3 px-2 py-0.5 '+badge+' text-white text-[9px] font-bold rounded">'+badgeT+'</span>'+disc
    +'<div class="quick-act absolute bottom-3 left-3 right-3"><span class="flex items-center justify-center gap-2 w-full py-2.5 bg-navy text-white text-xs font-semibold rounded-lg">'+t('view_prod')+'</span></div></div>'
    +'<div class="p-4"><p class="text-gold text-[10px] font-semibold tracking-[0.15em] uppercase">'+p.brand+'</p><h3 class="text-sm font-medium mt-1 leading-snug truncate">'+p.name+'</h3>'
    +stars+sold
    +'<div class="flex items-baseline flex-wrap mt-2"><span class="text-base font-bold">'+formatPrice(p.price)+'</span>'+mwst+old+'</div>'
    +trustLine
    +'</div></a>';
  }
  return '<div class="product-card group bg-white border border-gray-100 hover:border-navy/20 transition-all rounded-xl '+cls+'">'
  +'<a href="/product.html?id='+p.id+'" class="block"><div class="relative overflow-hidden rounded-t-xl">'+heartBtn+'<div class="prod-img aspect-square bg-gray-50 flex items-center justify-center transition-transform duration-500">'+imgHtml(p.img,null,p.brand+' '+p.name)+hoverImg+'</div>'
  +'<span class="absolute top-3 left-3 px-2 py-0.5 '+badge+' text-white text-[9px] font-bold rounded">'+badgeT+'</span>'+disc
  +'<div class="quick-act absolute bottom-3 left-3 right-3 flex gap-2"><span class="flex-1 flex items-center justify-center py-2.5 bg-navy text-white text-xs font-semibold rounded-lg">'+t('view_prod')+'</span></div></div></a>'
  +'<div class="p-4"><a href="/product.html?id='+p.id+'">'
  +'<p class="text-gold text-[10px] font-semibold tracking-[0.15em] uppercase">'+p.brand+'</p>'
  +'<h3 class="text-sm font-medium mt-1 leading-snug truncate hover:text-gold transition-colors">'+p.name+'</h3>'
  +stars+sold
  +'<div class="flex items-baseline flex-wrap mt-2"><span class="text-base font-bold">'+formatPrice(p.price)+'</span>'+mwst+old+'</div></a>'
  +trustLine
  +'<button onclick="event.preventDefault();Aura.addToCart(\''+p.id+'\');Aura.showToast(Aura.t(\'added_cart\'));if(typeof toggleCart===\'function\')toggleCart()" class="w-full mt-3 py-2.5 bg-navy hover:bg-navy-light text-white text-xs font-bold tracking-wider transition-colors rounded-lg flex items-center justify-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>'+t('add_cart')+'</button>'
  +'</div></div>';
}

/* ── LOCALE / i18n ─────────────────────────────── */
var EUR_USD = 1.08;
var EUR_GBP = 0.86;
var LOCALE_KEY = 'aura_locale';
var I18N = {
de:{
  locale_label:'DE / €',
  top_bar:'Kostenloser Versand ab €99 · 30 Tage Rückgaberecht',
  guarantee:'Garantie',
  search_ph:'Suche nach Produkten, Marken, Kategorien...',
  nav_all:'Alle Produkte',nav_electronics:'Elektronik',nav_fashion:'Mode',nav_fashion_long:'Mode & Accessoires',nav_home:'Haus & Wohnen',nav_travel:'Reise & Outdoor',nav_sale:'Sale %',nav_new:'Neuheiten',
  mob_login:'Anmelden / Registrieren',mob_orders:'Meine Bestellungen',
  hero_tag:'Gepr\u00fcft \u00b7 Zuverl\u00e4ssig \u00b7 G\u00fcnstig',hero_h1a:'Gepr\u00fcfte Elektronik & Mode',hero_h1b:'direkt aus dem Lager',
  hero_desc:'Jedes Produkt wird in unserem Hub in London manuell kontrolliert. 100% Originalit\u00e4t und Funktionalit\u00e4t garantiert.',
  hero_cta1:'ALLE PRODUKTE ANSEHEN',hero_cta2:'SALE & ANGEBOTE',
  trust_v:'Gepr\u00fcfte Ware',trust_vd:'Manuell im Hub kontrolliert',trust_s:'Schneller Versand',trust_sd:'In 2\u20134 Werktagen bei Ihnen',trust_r:'Kostenlose R\u00fcckgabe',trust_rd:'30 Tage, kein Risiko',trust_p:'Sicher bezahlen',trust_pd:'SSL-verschl\u00fcsselt, PCI DSS',
  sec_cat:'Kategorien entdecken',sec_feat:'Beliebte Produkte',sec_brands:'Unsere Marken',sec_news:'Newsletter',
  news_desc:'Neue Angebote und gepr\u00fcfte Produkte direkt in Ihr Postfach.',news_ph:'Ihre E-Mail-Adresse',news_btn:'ANMELDEN',
  add_cart:'IN DEN WARENKORB',view_prod:'ANSEHEN',
  ft_cat:'Kategorien',ft_svc:'Kundendienst',ft_co:'Unternehmen',ft_contact:'Kontakt',ft_track:'Bestellung verfolgen',ft_returns:'Rückgabe & Erstattung',ft_story:'Unsere Geschichte',ft_privacy:'Datenschutz',ft_terms:'AGB',ft_imprint:'Impressum',
  ft_desc:'Geprüfte Markenware aus dem Londoner Hub. Zuverlässig, günstig, sicher.',
  cart_title:'Warenkorb',cart_empty:'Warenkorb ist leer',cart_total:'Gesamt',cart_checkout:'ZUR KASSE',
  flt_cat:'Kategorie',flt_brand:'Marke',flt_price:'Preis',flt_cond:'Zustand',flt_verified:'Hub Geprüft',flt_openbox:'Aura Check',
  sort_default:'Empfohlen',sort_price_asc:'Preis aufsteigend',sort_price_desc:'Preis absteigend',sort_name:'Name A-Z',sort_rating:'Beste Bewertung',
  flt_reset:'Filter zurücksetzen',flt_results:'Produkte',flt_mobile:'Filter & Sortieren',
  prd_qty:'Menge:',prd_add:'IN DEN WARENKORB',prd_desc:'Beschreibung',prd_specs:'Spezifikationen',prd_rev:'Bewertungen',prd_related:'Das könnte Ihnen auch gefallen',
  prd_instock:'Auf Lager',prd_ship:'Kostenloser Versand',prd_inspect:'Manuell kontrolliert im Londoner Hub — 100% Original',
  spec_brand:'Marke',spec_cat:'Kategorie',spec_cond:'Zustand',spec_cond_v:'Hub Geprüft — Neu',spec_cond_o:'Aura Check — Geprüft',spec_rating:'Bewertung',spec_avail:'Verfügbarkeit',spec_avail_v:'auf Lager',spec_ship:'Versand',spec_ship_v:'Kostenlos ab €99, DHL Express',
  lg_login:'ANMELDEN',lg_register:'REGISTRIEREN',lg_login_desc:'Melden Sie sich mit Ihrer E-Mail-Adresse an.',lg_reg_desc:'Erstellen Sie ein Konto, um Bestellungen aufzugeben.',
  lbl_email:'E-Mail',lbl_pass:'Passwort',lbl_name:'Vollständiger Name',lbl_pass2:'Passwort bestätigen',
  btn_login:'ANMELDEN',btn_register:'KONTO ERSTELLEN',back_shop:'← Zurück zum Shop',to_shop:'Zum Shop →',
  ck_s1:'1. Lieferung',ck_s2:'2. Zahlung',ck_s3:'3. Bestätigung',
  ck_addr:'Lieferadresse',ck_first:'Vorname',ck_last:'Nachname',ck_street:'Straße & Hausnummer',ck_zip:'PLZ',ck_city:'Stadt',ck_country:'Land',
  ck_ship:'Versandart',ck_std:'Standard-Versand',ck_std_d:'3–5 Werktage',ck_exp:'Express-Versand',ck_exp_d:'1–2 Werktage',ck_free:'Kostenlos',
  ck_next:'WEITER ZUR ZAHLUNG',ck_summary:'Bestellübersicht',ck_sub:'Zwischensumme',ck_shipping:'Versand',ck_total:'Gesamt',
  ck_pay:'Zahlungsmethode',ck_card:'Kreditkarte / Debitkarte',ck_cardnum:'Kartennummer',ck_cardexp:'Gültig bis',
  ck_back:'← ZURÜCK',ck_place:'BESTELLUNG AUFGEBEN',
  ck_done:'Bestellung bestätigt!',ck_thanks:'Vielen Dank für Ihre Bestellung bei Aura Global Merchants.',ck_ordernum:'Bestellnummer:',ck_myorders:'MEINE BESTELLUNGEN',ck_continue:'WEITER EINKAUFEN',
  ck_stripe_sec:'Gesichert durch <strong class="text-gray-600">Stripe</strong> — Ihre Kartendaten werden verschlüsselt übertragen und nie auf unseren Servern gespeichert.',ck_gdpr:'Ich habe die <a href="/terms.html" target="_blank" class="text-gold hover:underline font-medium">AGB</a> und die <a href="/privacy.html" target="_blank" class="text-gold hover:underline font-medium">Datenschutzerklärung</a> gelesen und stimme diesen zu. Ich wurde über mein <a href="/returns.html#widerrufsformular" target="_blank" class="text-gold hover:underline font-medium">Widerrufsrecht</a> belehrt.',ck_gdpr_req:'Bitte stimmen Sie den AGB und der Datenschutzerklärung zu.',ck_processing:'Wird verarbeitet...',ck_badge_ssl:'SSL verschlüsselt',ck_badge_pci:'PCI DSS konform',
  hp_why_video:'Video-Inspektionsprotokoll',hp_why_video_d:'Jedes Produkt wird mit einem Video-Protokoll dokumentiert — von der Öffnung der Verpackung bis zur Funktionsprüfung. Sie sehen, was Sie bekommen.',
  hp_why_auth:'100% verifizierte Originalware',hp_why_auth_d:'Wir beziehen ausschließlich über autorisierte Quellen und verifizierte Händler. Seriennummern werden geprüft, Fälschungen ausgeschlossen.',
  hp_why_return:'30 Tage Rückgaberecht',hp_why_return_d:'Wenn etwas nicht stimmt, nehmen wir es zurück — ohne Diskussion. Versicherter Versand, volle Erstattung, persönlicher Support.',
  hp_why_global:'Globale Beschaffung, lokaler Versand',hp_why_global_d:'Wir beschaffen weltweit, prüfen in London und versenden aus lokalen Hubs innerhalb der EU. So erhalten Sie beste Preise bei kurzer Lieferzeit.',
  hp_vs_h:'Aura vs. Marktplätze',hp_vs_video:'Video-Inspektion',hp_vs_hub:'Hub-Qualitätsprüfung',hp_vs_orig:'Originalitätsgarantie',hp_vs_seal:'Verpackungs-Siegel',hp_vs_dach:'Persönlicher DACH-Support',hp_vs_ship:'Lieferung 2–4 Werktage',
  hp_sust_d:'Jedes Produkt bei Aura ist ein gerettetes Produkt. Wir geben Markenware ein zweites Leben — und schonen Ressourcen, die unser Planet braucht.',
  hp_sust_1:'Ressourcen schonen',hp_sust_1d:'Bis zu 90% weniger CO₂ pro Produkt — weil wir retten statt neu produzieren.',
  hp_sust_2:'Geprüfte Qualität',hp_sust_2d:'Aura Verified: mehrstufige Inspektion mit Video-Dokumentation für jeden Artikel.',
  hp_sust_3:'Fairer Preis',hp_sust_3d:'Markenware bis zu 40% günstiger — weil nachhaltig einkaufen nicht teuer sein muss.',
  hp_sust_cta:'Mehr über unsere Mission erfahren',
  hp_rev1:'„Ich war zuerst skeptisch, aber die Video-Inspektion hat mich sofort überzeugt. Mein iPhone kam in perfektem Zustand und deutlich günstiger als im Store. Absolut empfehlenswert!"',
  hp_rev2:'„Gucci-Tasche in Top-Zustand, mit Originalrechnung, Hub-Siegel und Inspektions-Video. Der ganze Prozess war transparent und professionell. Werde hier wieder bestellen!"',
  hp_rev3:'„Die Dyson Airwrap war überall ausverkauft. Bei Aura habe ich sie nicht nur sofort bekommen, sondern auch noch 15% günstiger. Verpackung perfekt, Hub-geprüft. Super Service!"',
  news_enter_email:'Bitte E-Mail eingeben',news_subscribed:'Erfolgreich abonniert! Prüfen Sie Ihr Postfach.',news_error:'Fehler — bitte Seite neu laden',
  faq_q9:'Warum sind die Preise günstiger als im Einzelhandel?',faq_a9:'Als internationale Beschaffungsplattform kaufen wir direkt bei autorisierten Händlern in verschiedenen Märkten ein. Preisunterschiede entstehen durch regionale Preisgestaltung, Währungskurse und lokale Aktionen. Alle Produkte sind 100% original — der Preisvorteil ergibt sich ausschließlich aus unserer Beschaffungsstrategie, nicht aus minderer Qualität.',
  faq_q10:'Welche Garantie erhalte ich?',faq_a10:'Neuware erhält 24 Monate gesetzliche Gewährleistung, gebrauchte Ware 12 Monate. Zusätzlich prüfen wir jedes Produkt im Rahmen des Aura Inspection Protocol vor dem Versand. Das Video-Inspektionsprotokoll dokumentiert den exakten Zustand und dient im Garantiefall als Referenz.',
  faq_q11:'Welche Zahlungsmethoden werden akzeptiert?',faq_a11:'Wir akzeptieren Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay und Klarna (Rechnung/Ratenzahlung). Alle Zahlungen werden über Stripe — PCI-DSS Level 1 konform — sicher verarbeitet. Ihre Kartendaten werden niemals auf unseren Servern gespeichert.',
  faq_q12:'Was bedeutet der Bestellstatus „Sourcing"?',faq_a12_intro:'Nach Eingang Ihrer Zahlung durchläuft Ihre Bestellung folgende Status:',faq_a12_paid:'<span class="font-bold text-navy">Bezahlt:</span> Zahlung erfolgreich eingegangen.',faq_a12_sourcing:'<span class="font-bold text-navy">Sourcing:</span> Wir beschaffen Ihr Produkt beim autorisierten Händler. Dies dauert 1–3 Werktage.',faq_a12_shipped:'<span class="font-bold text-navy">Shipped:</span> Das Produkt wurde im Hub geprüft, videodokumentiert und versendet.',faq_a12_delivered:'<span class="font-bold text-navy">Delivered:</span> Zustellung erfolgreich abgeschlossen.',
  faq_q13:'Fallen Zollgebühren an?',faq_a13:'Da wir aus dem Vereinigten Königreich versenden, können bei EU-Lieferungen Zollgebühren anfallen. Für Bestellungen nach Deutschland übernehmen wir in den meisten Fällen die Zollabwicklung (DDP). Für die Schweiz gelten separate Einfuhrbestimmungen. Alle Details finden Sie auf unserer <a href="/shipping.html" class="text-gold hover:underline font-semibold">Versandseite</a>.',
  faq_q14:'Kann ich meine Bestellung stornieren?',faq_a14:'Ja, Bestellungen können bis zum Zeitpunkt der Beschaffung (Status „Sourcing") kostenfrei storniert werden. Sobald sich die Bestellung im Versand befindet, ist eine Stornierung nicht mehr möglich. In diesem Fall nutzen Sie bitte unser <a href="/returns.html" class="text-gold hover:underline font-semibold">Rückgabeverfahren</a> mit 30-tägiger Rückgabefrist.',
  faq_q15:'Was passiert mit meinen Daten?',faq_a15:'Wir nehmen den Datenschutz ernst und verarbeiten Ihre Daten ausschließlich zur Abwicklung Ihrer Bestellung gemäß DSGVO und UK GDPR. Ihre Daten werden nicht an Dritte zu Werbezwecken weitergegeben. Detaillierte Informationen finden Sie in unserer <a href="/privacy.html" class="text-gold hover:underline font-semibold">Datenschutzerklärung</a>.',
  faq_q16:'Liefert ihr auch in die Schweiz und nach Österreich?',faq_a16:'Ja, wir liefern in die gesamte DACH-Region sowie in weitere EU-Länder. Die Standardlieferung nach Österreich dauert 3–5 Werktage, in die Schweiz 4–6 Werktage. Ab einem Bestellwert von 99 € ist der Versand kostenfrei (Schweiz: ab 149 CHF).',
  faq_q17:'Wo befindet sich euer Lager?',faq_a17:'Unser Hauptlager und Inspektionszentrum befindet sich in London, Vereinigtes Königreich. Hier werden alle eingehenden Produkte nach dem Aura Inspection Protocol geprüft, videodokumentiert und für den Versand vorbereitet. Zusätzlich nutzen wir regionale Logistikpartner in Deutschland, um kürzere Lieferzeiten in die DACH-Region zu ermöglichen.',
  faq_q18:'Wie kann ich den Kundenservice erreichen?',faq_a18:'Sie erreichen uns per E-Mail unter <a href="mailto:admin@auraglobal-merchants.com" class="text-gold hover:underline">admin@auraglobal-merchants.com</a> oder über unser <a href="/contact.html" class="text-gold hover:underline font-semibold">Kontaktformular</a>. Unser deutschsprachiges Support-Team ist montags bis freitags von 9:00 bis 18:00 Uhr (MEZ) erreichbar. Wir antworten in der Regel innerhalb von 24 Stunden.',
  sh_s5_h:'Zoll & Einfuhrbestimmungen',sh_s5_p1:'Da Aura Global Merchants Ltd. aus dem Vereinigten Königreich versendet, können bei Lieferungen in EU-Länder Zollgebühren und Einfuhrumsatzsteuer anfallen. Hier finden Sie alle wichtigen Informationen:',
  sh_s5_box1_h:'Lieferungen nach Deutschland, Österreich & Schweiz',sh_s5_box1_p:'Seit dem Brexit unterliegen Sendungen aus dem UK in die EU der Zollabfertigung. Wir übernehmen in den meisten Fällen die Zollabwicklung im Voraus (DDP — Delivered Duty Paid), sodass Ihnen keine zusätzlichen Kosten entstehen. In seltenen Fällen kann der Zusteller eine geringe Einfuhrumsatzsteuer erheben.',
  sh_s5_box2_h:'Warenwert unter 150 €',sh_s5_box2_p:'Sendungen mit einem Warenwert unter 150 € sind in der Regel von Zollgebühren befreit. Es kann jedoch Einfuhrumsatzsteuer (19% in DE, 20% in AT, 7,7% in CH) anfallen. Wir deklarieren alle Sendungen ordnungsgemäß mit den korrekten Warenwerten und Zolltarifnummern.',
  sh_s5_box3_h:'Warenwert über 150 €',sh_s5_box3_p:'Bei höherwertigen Sendungen können zusätzliche Zollgebühren anfallen. Die genaue Höhe hängt vom Produkttyp und dem jeweiligen Zolltarif ab. Elektronik wird in der Regel mit 0% Zoll belegt, während Textilien und Schuhe höhere Sätze haben können (bis zu 12%).',
  sh_s5_note:'Hinweis: Die Schweiz ist kein EU-Mitglied und hat eigene Zollbestimmungen. Sendungen in die Schweiz werden separat deklariert und unterliegen der Schweizer Mehrwertsteuer von 7,7%.',
  sh_s6_h:'Verpackung & Produktschutz',sh_s6_p1:'Unsere Verpackungsstandards stellen sicher, dass Ihre Bestellung unversehrt bei Ihnen ankommt:',
  sh_s6_card1_h:'Doppelte Polsterung',sh_s6_card1_p:'Elektronik und empfindliche Waren werden mit doppelter Schaumstoffpolsterung und Luftkissen geschützt.',
  sh_s6_card2_h:'Manipulationsschutz',sh_s6_card2_p:'Alle Pakete werden mit Sicherheitssiegeln verschlossen, die unautorisierten Zugang sichtbar machen.',
  sh_s6_card3_h:'Nachhaltiges Material',sh_s6_card3_p:'Wir verwenden recycelbare Kartons und plastikfreies Füllmaterial, wo immer möglich.',
  sh_s6_note:'Designer- und Luxusware wird in der Originalverpackung des Herstellers versendet, sofern diese verfügbar ist. Die Originalverpackung wird zusätzlich in einem neutralen Versandkarton geschützt.',
  sh_s7_h:'Versandversicherung',sh_s7_p1:'Jede Sendung von Aura Global Merchants Ltd. ist automatisch versichert — ohne Aufpreis für Sie:',
  sh_s7_th1:'Warenwert',sh_s7_th2:'Versicherungsdeckung',sh_s7_th3:'Kosten',
  sh_s7_r1c1:'Bis 500 €',sh_s7_r1c2:'Vollständiger Warenwert',sh_s7_r1c3:'Inklusive',sh_s7_r2c1:'500 € – 2.000 €',sh_s7_r2c2:'Vollständiger Warenwert',sh_s7_r2c3:'Inklusive',sh_s7_r3c1:'Über 2.000 €',sh_s7_r3c2:'Vollständiger Warenwert + Signaturzustellung',sh_s7_r3c3:'Inklusive',
  sh_s7_note:'Im Falle eines Verlustes oder einer Beschädigung während des Transports erstatten wir den vollen Kaufpreis oder senden einen Ersatzartikel. Melden Sie Transportschäden bitte innerhalb von 48 Stunden nach Erhalt unter Vorlage von Fotos an admin@auraglobal-merchants.com.',
  sh_s8_h:'Zustelloptionen & Hinweise',sh_s8_sub1_h:'Zustellversuche',sh_s8_sub1_p:'Der Zusteller unternimmt bis zu 2 Zustellversuche. Nach dem zweiten fehlgeschlagenen Versuch wird das Paket an eine nahegelegene Packstation oder Filiale weitergeleitet.',
  sh_s8_sub2_h:'Abstellgenehmigung',sh_s8_sub2_p:'Falls Sie eine Abstellgenehmigung erteilen möchten (z.B. vor der Haustür, bei einem Nachbarn), können Sie dies bei der Bestellung angeben. Aura Global Merchants Ltd. haftet nicht für Verluste bei erteilter Abstellgenehmigung.',
  sh_s8_sub3_h:'Packstation & Postfiliale',sh_s8_sub3_p:'Die Lieferung an DHL-Packstationen und Postfilialen ist möglich. Bitte geben Sie Ihre Packstationsnummer und Post-Kundennummer korrekt an. Pakete mit Express-Versand können nicht an Packstationen geliefert werden.',
  sh_s8_sub4_h:'Unternehmenslieferungen',sh_s8_sub4_p:'Lieferungen an Geschäftsadressen erfolgen während der üblichen Geschäftszeiten (Mo–Fr, 8:00–17:00). Eine telefonische Kontaktmöglichkeit am Lieferort beschleunigt die Zustellung.',
  sh_s9_h:'Feiertags- & Saisonversand',sh_s9_p1:'Während der Hauptsaison und an Feiertagen können sich Lieferzeiten verlängern. Wir empfehlen, frühzeitig zu bestellen:',
  sh_s9_ev1_h:'Weihnachtszeit (1.–24. Dezember)',sh_s9_ev1_p:'Letzter Bestelltermin für Standardversand: 15. Dezember. Express: 20. Dezember. Aufgrund des erhöhten Paketaufkommens verlängern sich die Lieferzeiträume um 1–3 Tage.',
  sh_s9_ev2_h:'Black Friday / Cyber Monday',sh_s9_ev2_p:'Erhöhtes Bestellaufkommen kann zu Verzögerungen von 1–2 Werktagen führen. Bestellungen werden in der Reihenfolge des Eingangs bearbeitet.',
  sh_s9_ev3_h:'Gesetzliche Feiertage (UK & DE)',sh_s9_ev3_p:'An britischen und deutschen Feiertagen erfolgt kein Versand. Bestellungen werden am nächsten Werktag bearbeitet.',
  returns_h1:'R\u00fcckgabe & Erstattung',returns_sub:'Transparenz und Fairness sind die Grundpfeiler unserer R\u00fcckgaberichtlinie. Dank unseres l\u00fcckenlosen Inspektionsprotokolls k\u00f6nnen wir jeden Fall objektiv und schnell kl\u00e4ren.',
  returns_trust_title:'Unser Versprechen',returns_trust_text:'Jedes Produkt, das unser Lager verl\u00e4sst, wird einer umfassenden Video-Inspektion unterzogen. Dieses dokumentierte Inspektionsprotokoll dient als objektiver Ma\u00dfstab bei R\u00fcckgaben \u2014 so sch\u00fctzen wir sowohl Ihre Rechte als Kunde als auch die Integrit\u00e4t unserer Qualit\u00e4tskontrolle.',
  returns_conditions_title:'R\u00fcckgabebedingungen',returns_cond_1:'30 Tage R\u00fcckgaberecht ab Erhalt der Lieferung \u2014 ohne Angabe von Gr\u00fcnden.',returns_cond_2:'Das Produkt muss in der Originalverpackung inklusive aller Zubeh\u00f6rteile und Beilagen zur\u00fcckgesendet werden.',returns_cond_3:'Die Aura-Qualit\u00e4tsplombe muss intakt sein, sofern das Produkt unbenutzt zur\u00fcckgegeben wird.',returns_cond_4:'Bei Beanstandungen wird das dokumentierte Video-Inspektionsprotokoll als objektive Referenz herangezogen.',
  returns_protocol_title:'Inspektionsprotokoll als Ma\u00dfstab',returns_protocol_p1:'Vor dem Versand durchl\u00e4uft jedes Produkt unser Aura Inspection Protocol. Dabei wird der Zustand des Artikels per Video dokumentiert \u2014 von der Verpackung \u00fcber die Oberfl\u00e4che bis zur vollst\u00e4ndigen Funktionspr\u00fcfung.',returns_protocol_p2:'Dieses Protokoll ist Ihre und unsere Sicherheit: Sollte nach der Lieferung eine Unstimmigkeit reklamiert werden, vergleichen wir den beanstandeten Zustand mit der Video-Dokumentation. So k\u00f6nnen wir Transportsch\u00e4den eindeutig von Vorsch\u00e4den unterscheiden und eine faire L\u00f6sung garantieren.',returns_protocol_example:'Beispiel: Ein Kunde reklamiert einen Kratzer auf dem Display seines iPhones. Unser Inspektionsvideo zeigt jedoch ein einwandfreies Display zum Zeitpunkt des Versands \u2192 der Schaden ist nachweislich nach Zustellung entstanden. In solchen F\u00e4llen erfolgt eine individuelle Pr\u00fcfung in Zusammenarbeit mit dem Versandpartner.',
  returns_refund_title:'Erstattungsprozess',returns_step1_title:'Kontakt aufnehmen',returns_step1_text:'Senden Sie eine R\u00fcckgabeanfrage \u00fcber Ihr Kundenkonto oder kontaktieren Sie unseren Kundendienst unter admin@auraglobal-merchants.com. Geben Sie Ihre Bestellnummer und den Grund der R\u00fcckgabe an.',returns_step2_title:'Pr\u00fcfung & R\u00fccksendeetikett',returns_step2_text:'Wir pr\u00fcfen Ihre Anfrage innerhalb von 24 Stunden und senden Ihnen ein vorfrankiertes R\u00fccksendeetikett per E-Mail zu. Das Inspektionsvideo wird als Referenz herangezogen.',returns_step3_title:'Wareneingang & Kontrolle',returns_step3_text:'Nach Eingang Ihrer R\u00fccksendung in unserem Logistikzentrum wird der Artikel gepr\u00fcft und mit dem urspr\u00fcnglichen Inspektionsprotokoll abgeglichen.',returns_step4_title:'Erstattung',returns_step4_text:'Die Erstattung erfolgt innerhalb von 5\u20137 Werktagen nach Freigabe auf die urspr\u00fcngliche Zahlungsmethode. Sie erhalten eine Best\u00e4tigungs-E-Mail mit allen Details.',
  returns_exceptions_title:'Ausnahmen',returns_exceptions_intro:'Folgende Produkte sind von der R\u00fcckgabe ausgeschlossen:',returns_exc_1:'Hygieneprodukte \u2014 Kopfh\u00f6rer (In-Ear), Rasierer, pers\u00f6nliche Pflegeartikel nach \u00d6ffnung der Hygieneverpackung.',returns_exc_2:'Individuell angefertigte Produkte \u2014 Gravuren, personalisierte Artikel oder Sonderanfertigungen.',returns_exc_3:'Software & digitale Produkte \u2014 nach Aktivierung des Lizenzschl\u00fcssels oder \u00d6ffnung der Verpackung.',returns_exc_4:'Geschenkkarten \u2014 nach Aktivierung nicht erstattungsf\u00e4hig.',
  ret_s5_h:'R\u00fccksendung Schritt f\u00fcr Schritt',ret_s5_intro:'So senden Sie ein Produkt unkompliziert an uns zur\u00fcck:',ret_s5_st1_h:'R\u00fccksendung anmelden',ret_s5_st2_h:'R\u00fccksendeetikett erhalten',ret_s5_st3_h:'Produkt sicher verpacken',ret_s5_st4_h:'Paket abgeben',ret_s5_st5_h:'Pr\u00fcfung & Erstattung',
  ret_s6_h:'Teilr\u00fcckgaben & Umtausch',
  ret_s7_h:'Besch\u00e4digte oder fehlerhafte Ware',ret_s7_alert_h:'Sofort bei Ankunft dokumentieren',ret_s7_alert_p:'Falls Ihr Paket besch\u00e4digt ankommt oder ein Produkt fehlerhaft ist, dokumentieren Sie den Zustand bitte sofort mit Fotos und kontaktieren Sie uns innerhalb von 48 Stunden.',
  ret_s8_h:'Internationale R\u00fccksendungen',ret_s8_th1:'Land',ret_s8_th2:'R\u00fccksendung kostenlos?',ret_s8_th3:'Dauer zum Hub',ret_s8_de:'Deutschland',ret_s8_de_free:'Ja \u2713',ret_s8_de_time:'3\u20135 Werktage',ret_s8_at:'\u00d6sterreich',ret_s8_at_free:'Ja \u2713',ret_s8_at_time:'4\u20136 Werktage',ret_s8_ch:'Schweiz',ret_s8_ch_free:'Teilweise*',ret_s8_ch_time:'5\u20137 Werktage',ret_s8_uk:'Gro\u00dfbritannien',ret_s8_uk_free:'Ja \u2713',ret_s8_uk_time:'1\u20132 Werktage',ret_s8_eu:'EU (\u00fcbrige L\u00e4nder)',ret_s8_eu_free:'Ja \u2713',ret_s8_eu_time:'5\u20138 Werktage',ret_s8_note:'* R\u00fccksendungen aus der Schweiz: Kostenlos bei Gew\u00e4hrleistungsf\u00e4llen und Transportsch\u00e4den. Bei Widerruf tr\u00e4gt der Kunde die R\u00fccksende\u006Bosten (ca. 8\u201312 CHF).',
  ret_s9_h:'Erstattungsfristen im Detail',ret_s9_intro:'Transparenz ist uns wichtig. Hier eine \u00dcbersicht der Bearbeitungszeiten nach Eingang Ihrer R\u00fccksendung:',ret_s9_r1_phase:'Eingang im Hub & qualitative Pr\u00fcfung',ret_s9_r1_time:'1\u20133 Werktage',ret_s9_r2_phase:'Vergleich mit Inspektionsvideo',ret_s9_r2_time:'1 Werktag',ret_s9_r3_phase:'Erstattung ausgel\u00f6st',ret_s9_r3_time:'1\u20132 Werktage',ret_s9_r4_phase:'Gutschrift auf Bankkonto sichtbar',ret_s9_r4_time:'3\u20135 Werktage',ret_s9_r5_phase:'Gutschrift auf Kreditkarte sichtbar',ret_s9_r5_time:'5\u201310 Werktage',ret_s9_r6_phase:'PayPal-Erstattung',ret_s9_r6_time:'1\u20133 Werktage',ret_s9_note:'Bitte beachten Sie, dass die tats\u00e4chliche Gutschrift auf Ihrem Konto von Ihrer Bank oder Ihrem Zahlungsanbieter abh\u00e4ngt. Bei \u00dcberschreitung der genannten Fristen kontaktieren Sie bitte unseren Kundendienst.',
  ret_wb_h:'Widerrufsbelehrung',ret_wb_sub_h:'Widerrufsrecht',ret_wb_p1:'Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gr\u00fcnden diesen Vertrag zu widerrufen.',ret_wb_p2:'Die Widerrufsfrist betr\u00e4gt 14 Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Bef\u00f6rderer ist, die Ware in Besitz genommen haben bzw. hat.',ret_wb_p3:'Um Ihr Widerrufsrecht auszu\u00fcben, m\u00fcssen Sie uns',ret_wb_p4:'mittels einer eindeutigen Erkl\u00e4rung (z. B. ein mit der Post versandter Brief oder eine E-Mail) \u00fcber Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie k\u00f6nnen daf\u00fcr das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.',ret_wb_p5:'Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung \u00fcber die Aus\u00fcbung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.',
  ret_wb_folgen_h:'Folgen des Widerrufs',ret_wb_f1:'Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschlie\u00dflich der Lieferkosten, unverz\u00fcglich und sp\u00e4testens binnen 14 Tagen ab dem Tag zur\u00fcckzuzahlen, an dem die Mitteilung \u00fcber Ihren Widerruf dieses Vertrags bei uns eingegangen ist.',ret_wb_f2:'F\u00fcr diese R\u00fcckzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der urspr\u00fcnglichen Transaktion eingesetzt haben; in keinem Fall werden Ihnen wegen dieser R\u00fcckzahlung Entgelte berechnet.',ret_wb_f3:'Wir k\u00f6nnen die R\u00fcckzahlung verweigern, bis wir die Waren wieder zur\u00fcckerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zur\u00fcckgesandt haben.',ret_wb_f4:'Sie haben die Waren unverz\u00fcglich und in jedem Fall sp\u00e4testens binnen 14 Tagen ab dem Tag, an dem Sie uns \u00fcber den Widerruf dieses Vertrags unterrichten, an uns zur\u00fcckzusenden oder zu \u00fcbergeben.',ret_wb_f5:'Innerhalb Deutschlands, \u00d6sterreichs, Gro\u00dfbritanniens und der EU \u00fcbernimmt Aura Global Merchants Ltd. die Kosten der R\u00fccksendung. F\u00fcr R\u00fccksendungen aus der Schweiz und Drittl\u00e4ndern tr\u00e4gt der Kunde die unmittelbaren Kosten der R\u00fccksendung.',ret_wb_f6:'Sie m\u00fcssen f\u00fcr einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Pr\u00fcfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zur\u00fcckzuf\u00fchren ist.',
  ret_wf_h:'Muster-Widerrufsformular',ret_wf_hint:'(Wenn Sie den Vertrag widerrufen wollen, dann f\u00fcllen Sie bitte dieses Formular aus und senden Sie es zur\u00fcck.)',ret_wf_to:'An:',ret_wf_p1:'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag \u00fcber den Kauf der folgenden Waren (*)/ die Erbringung der folgenden Dienstleistung (*):',ret_wf_p2:'Bestellt am (*) / erhalten am (*):',ret_wf_p3:'Name des/der Verbraucher(s):',ret_wf_p4:'Anschrift des/der Verbraucher(s):',ret_wf_p5:'Datum: _________________ Unterschrift: _________________',ret_wf_note:'(*) Unzutreffendes streichen.',ret_wf_print:'FORMULAR DRUCKEN',
  ret_ra_h:'R\u00fccksendeadresse',ret_ra_p1:'Bitte senden Sie Ihre R\u00fccksendungen an:',ret_ra_note:'Bitte senden Sie Ihre R\u00fccksendung erst nach Erhalt des R\u00fccksendeetiketts ab. Unangek\u00fcndigte R\u00fccksendungen k\u00f6nnen nicht bearbeitet werden.',
  returns_cta_title:'Noch Fragen?',returns_cta_text:'Unser Kundendienst steht Ihnen montags bis freitags von 9:00 bis 18:00 Uhr zur Verf\u00fcgung. Wir helfen Ihnen gerne weiter.',returns_cta_track:'BESTELLUNG VERFOLGEN',returns_cta_contact:'KONTAKT',
  imp_tmg_h:'Angaben gem\u00e4\u00df \u00a7 5 TMG',imp_lbl_company:'Firmenname',imp_lbl_legal:'Rechtsform',imp_val_legal:'Private Limited Company (Ltd.), eingetragen in England & Wales',imp_lbl_reg:'Handelsregisternummer',imp_lbl_seat:'Sitz der Gesellschaft',imp_lbl_director:'Gesch\u00e4ftsf\u00fchrer',imp_lbl_email:'E-Mail',imp_lbl_phone:'Telefon',imp_lbl_vat:'USt-IdNr.',imp_lbl_authority:'Aufsichtsbeh\u00f6rde',
  imp_responsible_h:'Verantwortlich f\u00fcr den Inhalt',
  imp_dispute_h:'Streitbeilegung',imp_dispute_os:'Die Europ\u00e4ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:',imp_dispute_email:'Unsere E-Mail-Adresse finden Sie oben im Impressum.',imp_dispute_no:'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
  imp_disclaimer_h:'Haftungsausschluss',imp_liability_content_h:'Haftung f\u00fcr Inhalte',imp_liability_content_p:'Die Inhalte unserer Seiten wurden mit gr\u00f6\u00dfter Sorgfalt erstellt. F\u00fcr die Richtigkeit, Vollst\u00e4ndigkeit und Aktualit\u00e4t der Inhalte k\u00f6nnen wir jedoch keine Gew\u00e4hr \u00fcbernehmen. Als Diensteanbieter sind wir gem\u00e4\u00df \u00a7 7 Abs. 1 TMG f\u00fcr eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.',imp_liability_links_h:'Haftung f\u00fcr Links',imp_liability_links_p:'Unser Angebot enth\u00e4lt Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb k\u00f6nnen wir f\u00fcr diese fremden Inhalte auch keine Gew\u00e4hr \u00fcbernehmen.',imp_copyright_h:'Urheberrecht',imp_copyright_p:'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielf\u00e4ltigung, Bearbeitung, Verbreitung und jede Art der Verwertung au\u00dferhalb der Grenzen des Urheberrechtes bed\u00fcrfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.',
  imp_eu_dispute_h:'EU-Streitbeilegung',imp_eu_dispute_os:'Die Europ\u00e4ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit.',imp_eu_dispute_email:'Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',imp_eu_dispute_reg:'Gem\u00e4\u00df der Verordnung (EU) Nr. 524/2013 des Europ\u00e4ischen Parlaments und des Rates sind Online-H\u00e4ndler verpflichtet, einen Link zur OS-Plattform bereitzustellen.',
  imp_regulatory_h:'Regulatorische Informationen',imp_companies_h:'Companies House (UK)',imp_companies_p:'Aura Global Merchants Ltd. ist beim Companies House des Vereinigten K\u00f6nigreichs unter der Registrierungsnummer eingetragen.',imp_ico_h:'ICO-Registrierung (Datenschutz)',imp_ico_p:'Als im Vereinigten K\u00f6nigreich ans\u00e4ssiges Unternehmen unterliegen wir der UK General Data Protection Regulation (UK GDPR) und dem Data Protection Act 2018.',imp_vat_h:'Umsatzsteuer',imp_vat_p:'Aura Global Merchants Ltd. ist umsatzsteuerrechtlich im Vereinigten K\u00f6nigreich registriert.',
  imp_weee_h:'WEEE & Batteriehinweis',imp_weee_devices_h:'Elektro- und Elektronikaltger\u00e4te (WEEE)',imp_weee_devices_p:'Gem\u00e4\u00df der WEEE-Richtlinie sind Verbraucher verpflichtet, Elektro- und Elektronikaltger\u00e4te getrennt vom Hausm\u00fcll zu entsorgen.',imp_weee_return_p:'Altger\u00e4te k\u00f6nnen kostenfrei bei kommunalen Sammelstellen oder beim H\u00e4ndler zur\u00fcckgegeben werden.',imp_batteries_h:'Batterien und Akkumulatoren',imp_batteries_p:'Gem\u00e4\u00df dem Batteriegesetz (BattG) d\u00fcrfen Batterien und Akkumulatoren nicht \u00fcber den Hausm\u00fcll entsorgt werden.',
  imp_trademark_h:'Markenrechtlicher Hinweis',imp_trademark_p1:'Alle auf dieser Website verwendeten Markennamen, Produktnamen und Logos sind Eigentum der jeweiligen Inhaber.',imp_trademark_p2:'Aura Global Merchants Ltd. ist ein unabh\u00e4ngiger H\u00e4ndler und kein autorisierter Vertragsh\u00e4ndler.',imp_trademark_p3:'Die Darstellung von Markenware auf dieser Website erfolgt im Rahmen des Ersch\u00f6pfungsgrundsatzes.',
  imp_contact_h:'Kontakt & Erreichbarkeit',imp_ct_email:'E-Mail (allgemein)',imp_ct_privacy:'E-Mail (Datenschutz)',imp_ct_form:'Kontaktformular',imp_ct_hours:'Servicezeiten',imp_ct_hours_val:'Mo\u2013Fr, 09:00\u201318:00 Uhr (MEZ)',imp_ct_response:'Antwortzeit',imp_ct_response_val:'In der Regel innerhalb von 24 Stunden',
  story_h1:'Unsere Geschichte',story_sub:'Wie eine einfache Frage einen neuen Standard f\u00fcr Transparenz im Online-Handel geschaffen hat.',
  story_f_label:'Der Anfang',story_f_h:'\u201eWarum k\u00f6nnen Kunden nicht sehen, was sie kaufen?\u201c',story_f_p1:'Es begann mit einer simplen Beobachtung: In einer Welt, in der Transparenz zum h\u00f6chsten Gut geworden ist, kaufen Millionen Menschen hochwertige Elektronikprodukte \u2014 und vertrauen dabei ausschlie\u00dflich auf Produktfotos und Bewertungen fremder K\u00e4ufer.',story_f_p2:'Im Fr\u00fchjahr 2023 gr\u00fcndete ein Team rund um Daniel Hartmann in London Aura Global Merchants Ltd. \u2014 mit dem Ziel, dieses Vertrauensproblem grundlegend zu l\u00f6sen.',story_f_p3:'Die Idee war radikal einfach: Bevor ein Produkt den Kunden erreicht, wird es von unserem Team in London ge\u00f6ffnet, inspiziert und der gesamte Prozess per Video dokumentiert.',story_f_p4:'So entstand das Aura Inspection Protocol \u2014 ein dreistufiges Pr\u00fcfverfahren, das Authentizit\u00e4t, Funktionalit\u00e4t und Versiegelung jedes einzelnen Ger\u00e4ts dokumentiert.',story_f_quote:'\u201eJedes Ger\u00e4t verdient einen ehrlichen ersten Eindruck.\u201c',story_f_attr:'\u2014 Daniel Hartmann, Gr\u00fcnder & Director',
  story_v_label:'Unsere Werte',story_v_h:'Was uns antreibt',story_v1_h:'Transparenz',story_v1_p:'Jedes Produkt wird per Video inspiziert und dokumentiert \u2014 volle Einsicht in den tats\u00e4chlichen Zustand.',story_v2_h:'Qualit\u00e4t',story_v2_p:'Unser 3-Punkte-Protokoll pr\u00fcft Authentizit\u00e4t, Funktionalit\u00e4t und Versiegelung jedes einzelnen Ger\u00e4ts.',story_v3_h:'Vertrauen',story_v3_p:'30 Tage R\u00fcckgaberecht und eine Inspektion, die als Referenz dient \u2014 f\u00fcr eine Beziehung auf Augenh\u00f6he.',story_v4_h:'Innovation',story_v4_p:'Wir verbessern unsere Prozesse kontinuierlich \u2014 neue Technologien, bessere Pr\u00fcfverfahren, schnellerer Versand.',
  story_tl_label:'Meilensteine',story_tl_h:'Unser Weg',story_tl1_h:'Gr\u00fcndung in London',story_tl1_p:'Aura Global Merchants Ltd. wird als Private Limited Company in England & Wales registriert. Das erste Inspektionsteam beginnt seine Arbeit im Londoner Lager.',story_tl2_h:'10.000+ verifizierte Einheiten',story_tl2_p:'Ein bedeutender Meilenstein: \u00dcber 10.000 Produkte wurden nach dem Aura Inspection Protocol gepr\u00fcft und an zufriedene Kunden versandt.',story_tl3_h:'Expansion in die DACH-Region',story_tl3_p:'Aura Global erweitert seinen Fokus auf den deutschsprachigen Raum. Neue Logistikpartner, lokalisierter Support und optimierte Lieferketten.',
  story_team_label:'Das Team',story_team_h:'Die Menschen hinter Aura',story_t1_role:'Gr\u00fcnder & CEO',story_t1_desc:'Vision\u00e4r hinter dem Aura Inspection Protocol. \u00dcber 8 Jahre Erfahrung im internationalen Handel.',story_t2_role:'Leiterin DACH-Expansion',story_t2_desc:'Verantwortlich f\u00fcr den deutschsprachigen Markt und die lokale Kundenbeziehung.',story_t3_role:'Qualit\u00e4tsinspektor',story_t3_desc:'Leitet das Inspektionsteam im Londoner Hub. Jedes Produkt durchl\u00e4uft sein Pr\u00fcfverfahren.',story_t4_role:'Kundendienst',story_t4_desc:'Multilinguales Support-Team. Schnelle Antworten in DE, EN, FR, ES, IT und PL.',
  story_mv_label:'Unsere Vision',story_mv_h:'Mission & Vision',story_mv_mission_h:'Mission',story_mv_mission_p:'Wir machen Premium-Markenware f\u00fcr jeden zug\u00e4nglich \u2014 unabh\u00e4ngig von Standort oder Einkommen.',story_mv_vision_h:'Vision',story_mv_vision_p:'Bis 2027 wollen wir die vertrauensw\u00fcrdigste Plattform f\u00fcr verifizierte Markenware in Europa werden.',story_mv_sustain_h:'Nachhaltigkeit',story_mv_sustain_p:'Wir sind \u00fcberzeugt, dass verantwortungsvoller Handel und wirtschaftlicher Erfolg miteinander vereinbar sind:',story_mv_s1:'Recycelte Verpackung: 85% unserer Versandmaterialien bestehen aus recycelten Materialien.',story_mv_s2:'CO\u2082-optimierter Versand: Konsolidierung von Sendungen reduziert unn\u00f6tige Einzellieferungen.',story_mv_s3:'Langlebigkeit statt Wegwerfkultur: Durch strenge Qualit\u00e4tskontrolle stellen wir sicher, dass Produkte ihren vollen Lebenszyklus erreichen.',
  story_stats_label:'Aura in Zahlen',story_stats_h:'Zahlen & Fakten',story_st1_num:'10.000+',story_st1_lbl:'Gepr\u00fcfte Produkte',story_st2_num:'120+',story_st2_lbl:'Premium-Marken',story_st3_num:'99,8%',story_st3_lbl:'Kundenzufriedenheit',story_st4_num:'15+',story_st4_lbl:'Lieferl\u00e4nder',story_st5_num:'2\u20134',story_st5_lbl:'Werktage Lieferung (DACH)',story_st6_num:'30',story_st6_lbl:'Tage R\u00fcckgaberecht',story_st7_num:'24h',story_st7_lbl:'Max. Antwortzeit Support',
  story_q_label:'Unser Versprechen',story_q_h:'Qualit\u00e4tsstandards',story_q1_h:'100% Originalware',story_q1_p:'Jedes Produkt wird auf Echtheit gepr\u00fcft und mit dem Herstellernachweis abgeglichen.',story_q2_h:'Video-Dokumentation',story_q2_p:'Der gesamte Inspektionsprozess wird per Video festgehalten \u2014 Ihre Qualit\u00e4tsgarantie.',story_q3_h:'Garantierte Zufriedenheit',story_q3_p:'30 Tage R\u00fcckgaberecht, vollst\u00e4ndige Erstattung bei berechtigten R\u00fccksendungen.',story_q4_h:'Sichere Beschaffung',story_q4_p:'Wir beziehen ausschlie\u00dflich von autorisierten Gro\u00dfh\u00e4ndlern und verifizierten Lieferanten.',
  story_cta_h:'Erleben Sie den Unterschied',story_cta_p:'Entdecken Sie unsere Auswahl an gepr\u00fcfter Premium-Markenware.',story_cta_btn:'ZUM KATALOG',
  src_hero_badge:'Transparenz & Herkunft',src_hero_sub:'Jedes Produkt in unserem Shop hat eine nachvollziehbare Geschichte. Wir zeigen dir den kompletten Weg \u2014 von der Liquidation bis zu deiner Haust\u00fcr.',src_hero_stat1_label:'Schritte bis zu dir',src_hero_stat2_label:'Transparent',src_hero_stat3_label:'F\u00e4lschungen',
  src_intro_h2:'Woher kommt unsere Ware?',src_intro_p1:'Aura Global Merchants kauft Liquidationsbest\u00e4nde, Kundenretouren und \u00dcberproduktionen direkt von zugelassenen Gro\u00dfh\u00e4ndlern und Retail-Giganten. Wir arbeiten ausschlie\u00dflich mit verifizierten, legalen Quellen \u2014 keine Grauimporte, keine F\u00e4lschungen, keine gestohlene Ware.',src_intro_p2:'Unsere Lieferanten: Autorisierte Liquidatoren gro\u00dfer Einzelhandelsketten in den USA, UK und der EU.',
  src_journey_badge:'Der Weg des Produkts',src_journey_h2:'4 Schritte. Volle Transparenz.',
  src_s1_h3:'Liquidationsankauf',src_s1_sub:'Einkauf bei autorisierten Retail-Partnern',src_s1_p2:'Aura Global nimmt an diesen B2B-Auktionen teil und erwirbt Chargen von Elektronik, Mode, Haushaltsware und Outdoor-Ausr\u00fcstung \u2014 direkt von der Quelle, mit vollst\u00e4ndiger Dokumentation.',src_s1_sources_h4:'Unsere Quellen',src_s1_card_title:'Liquidation Auktions-Plattformen',src_s1_card_tag1:'MANIFEST GEPR\u00dcFT',src_s1_card_tag2:'ORIGINALBELEGE',
  src_s2_card_title:'Internationaler Transport',src_s2_card_hub1:'New Jersey Hub',src_s2_card_route:'Seeweg / Luft',src_s2_card_hub2:'London Hub',src_s2_h3:'Transport zum Hub',src_s2_sub:'Logistik-Kette mit voller Zolldokumentation',src_s2_p2:'Bei EU-Sendungen erfolgt die Verzollung nach UK-Importrecht. Wir arbeiten mit lizenzierten Zollagenten zusammen, die eine l\u00fcckenlose Compliance sicherstellen.',src_s2_docs_h4:'Dokumente pro Lieferung',src_s2_doc1:'Commercial Invoice',src_s2_doc2:'Packing List',src_s2_doc3:'Bill of Lading',src_s2_doc4:'Certificate of Origin',src_s2_doc5:'Customs Declaration',
  src_s3_h3:'Aura Inspection',src_s3_sub:'Mehrstufige Qualit\u00e4tskontrolle im Londoner Hub',src_s3_intro:'Jedes einzelne Produkt durchl\u00e4uft unser mehrstufiges Pr\u00fcfprotokoll. Unser geschultes Team kontrolliert:',src_s3_chk1_title:'Visuelle Pr\u00fcfung',src_s3_chk1_desc:'Zustand von Geh\u00e4use, Display, Anschl\u00fcssen. Kratzer, Dellen, Farbabweichungen dokumentiert.',src_s3_chk2_title:'Funktionspr\u00fcfung',src_s3_chk2_desc:'Einschalten, Reset, Konnektivit\u00e4t, alle Buttons/Ports. Bei Kleidung: N\u00e4hte, Rei\u00dfverschl\u00fcsse, Stoffqualit\u00e4t.',src_s3_chk3_title:'Video-Dokumentation',src_s3_chk3_desc:'360\u00b0-Video der Inspektion wird f\u00fcr jedes Produkt erstellt und im Shop hinterlegt.',src_s3_chk4_title:'Condition Grading',src_s3_chk4_desc:'Einstufung: A+ (Wie Neu) / A (Minimal) / B (Sichtbare Spuren). Nur A+ und A kommen in den Shop.',
  src_s3_card_title:'Aura Verified',src_s3_card_sub:'Nur gepr\u00fcfte Ware erh\u00e4lt unser Qualit\u00e4tssiegel',src_s3_card_pass_lbl:'Bestehensquote',src_s3_card_time_lbl:'Durchschnittliche Pr\u00fcfzeit',src_s3_card_time_val:'12 Min.',src_s3_card_pts_lbl:'Pr\u00fcfpunkte pro Artikel',src_s3_card_note:'Nicht bestandene Artikel werden an zertifizierte Recycling-Partner weitergegeben.',
  src_s4_card_title:'Bis zu 40% g\u00fcnstiger',src_s4_card_sub:'Im Vergleich zum UVP \u00fcber den Fachhandel',src_s4_card_retail:'Einzelhandel (UVP)',src_s4_card_aura:'Aura Direct',src_s4_h3:'Verkauf mit Diszcount',src_s4_sub:'Markenqualit\u00e4t zu fairen Preisen',src_s4_p2:'Du siehst zu jedem Artikel: Condition Grade, Inspektionsvideo, Original-Einzelh\u00e4ndler, und einen ehrlichen Zustandsbericht \u2014 kein Kleingedrucktes, keine versteckten M\u00e4ngel.',src_s4_feat1:'30 Tage R\u00fcckgabe',src_s4_feat2:'Sichere Zahlung',src_s4_feat3:'Versand ab \u20ac99 frei',src_s4_feat4:'DE Support-Team',
  src_legal_badge:'100% Legal',src_legal_h2:'Legaler Handel, volle Transparenz',src_legal_c1_title:'Companies House UK',src_legal_c1_sub:'Registriert & Aktiv',src_legal_c2_title:'Import-Lizenzen',src_legal_c2_sub:'HMRC-registriert',src_legal_c3_title:'DSGVO / UK GDPR',src_legal_c3_sub:'ICO-konform',
  src_cta_h2:'\u00dcberzeuge dich selbst',src_cta_p:'St\u00f6bere in unserem Sortiment und entdecke gepr\u00fcfte Markenware mit voller Transparenz \u2014 zu Preisen, die Sinn machen.',src_cta_shop:'JETZT SHOPPEN',src_cta_sustainability:'NACHHALTIGKEIT \u2192',
  nh_hero_badge:'Unsere Verantwortung',nh_hero_desc:'Jedes Produkt bei Aura ist ein gerettetes Produkt. Wir geben hochwertiger Markenware ein zweites Leben \u2014 und schonen damit Ressourcen, die unser Planet dringend braucht.',nh_hero_stat1_val:'15%',nh_hero_stat1_label:'Elektronik wird wegen ge\u00f6ffneter Verpackung retourniert',nh_hero_stat2_val:'82 kg',nh_hero_stat2_label:'CO\u2082 pro gerettetem Smartphone eingespart',nh_hero_stat3_val:'3.400+',nh_hero_stat3_label:'Produkte vor der Entsorgung gerettet',nh_hero_stat4_val:'0',nh_hero_stat4_label:'Artikel gehen in die Deponie',
  nh_problem_label:'Das Problem',nh_problem_title:'Millionen perfekter Produkte landen im M\u00fcll',nh_problem_p1:'Jedes Jahr werden weltweit Millionen von Elektronikger\u00e4ten, Modeartikel und Haushaltsware als \u201eunverk\u00e4uflich\u201c eingestuft \u2014 nicht weil sie defekt sind, sondern weil ihre Verpackung ge\u00f6ffnet wurde, ein Kratzer auf der H\u00fclle ist oder die R\u00fcckgabefrist abgelaufen ist.',
  nh_stats_title:'J\u00e4hrliche Retouren-Statistik (EU)',nh_stats_bar1_label:'Elektronik (ge\u00f6ffnete Verpackung)',nh_stats_bar1_val:'15.2%',nh_stats_bar2_label:'Mode (Passform / Farbe)',nh_stats_bar2_val:'22.8%',nh_stats_bar3_label:'Haushalt (Besch\u00e4digte Verpackung)',nh_stats_bar3_val:'9.6%',nh_stats_bar4_label:'Davon: physisch defekt',nh_stats_bar4_val:'nur 3.1%',nh_stats_source:'Quelle: European E-Commerce Report 2024, RetailX Research',
  nh_solution_label:'Unsere L\u00f6sung',nh_solution_title:'Aura Circular Economy',nh_solution_desc:'Wir fangen auf, was der Einzelhandel wegwirft \u2014 und geben es dir mit Qualit\u00e4tsgarantie zur\u00fcck.',nh_step1_title:'1. Abfangen',nh_step1_desc:'Wir kaufen Retourenware und Liquidationsbest\u00e4nde direkt bei gro\u00dfen Einzelh\u00e4ndlern auf \u2014 bevor sie vernichtet werden.',nh_step2_title:'2. Pr\u00fcfen',nh_step2_desc:'Jedes Produkt durchl\u00e4uft die Aura Inspection in unserem Londoner Hub \u2014 visuell, funktionell und dokumentiert per Video.',nh_step3_title:'3. Zertifizieren',nh_step3_desc:'Bestandene Pr\u00fcfung = Aura Verified Siegel. Transparenter Zustandsbericht f\u00fcr jeden Artikel.',nh_step4_title:'4. Zweites Leben',nh_step4_desc:'Du kaufst Markenqualit\u00e4t zu bis zu 40% g\u00fcnstiger \u2014 und rettest gleichzeitig ein Produkt vor der Deponie.',
  nh_eco_label:'Eco-Statistik',nh_eco_title:'Was du mit einem Kauf bei Aura sparst',nh_eco_desc:'Neuproduktion vs. Open Box: der \u00f6kologische Vergleich pro Ger\u00e4t.',nh_eco_co2_title:'CO\u2082-Emissionen',nh_eco_co2_new_label:'Neuproduktion',nh_eco_co2_new_val:'82 kg CO\u2082',nh_eco_co2_aura_label:'Aura Open Box',nh_eco_co2_aura_val:'8 kg CO\u2082',nh_eco_co2_saving:'\u221290%',nh_eco_co2_note:'weniger CO\u2082 pro Smartphone',
  nh_eco_water_title:'Wasserverbrauch',nh_eco_water_new_label:'Neuproduktion',nh_eco_water_new_val:'12.760 L',nh_eco_water_aura_label:'Aura Open Box',nh_eco_water_aura_val:'0 L',nh_eco_water_saving:'\u2212100%',nh_eco_water_note:'kein zus\u00e4tzlicher Wasserverbrauch',
  nh_eco_raw_title:'Rohstoffe',nh_eco_raw_new_label:'Neuproduktion',nh_eco_raw_new_val:'62+ Mineralien',nh_eco_raw_aura_label:'Aura Open Box',nh_eco_raw_aura_val:'0 neue',nh_eco_raw_saving:'\u2212100%',nh_eco_raw_note:'kein Abbau seltener Erden n\u00f6tig',
  nh_manifesto_quote:'\u201eWir glauben an Technik, die bleibt \u2014 nicht an M\u00fcll, der entsteht.\u201c',nh_manifesto_text:'Unser Manifest ist einfach: Jedes Produkt verdient eine Chance. Jeder Kauf bei Aura ist ein Statement gegen die Wegwerfkultur und ein Beitrag zur Zukunft, in der Qualit\u00e4t und Nachhaltigkeit keine Gegens\u00e4tze sind.',nh_manifesto_author:'Pavlo Potomkin',nh_manifesto_role:'Gr\u00fcnder & Director, Aura Global Merchants Ltd.',
  nh_quality_label:'Qualit\u00e4tsversprechen',nh_quality_title:'Nachhaltigkeit ohne Kompromisse',nh_quality_video_title:'Video-Inspektion',nh_quality_video_desc:'Jedes Produkt wird bei der Eingangskontrolle gefilmt. Du kannst dir das Inspektionsvideo vor dem Kauf anschauen.',nh_quality_return_title:'30 Tage R\u00fcckgaberecht',nh_quality_return_desc:'Nicht zufrieden? Volle R\u00fcckerstattung innerhalb von 30 Tagen \u2014 ohne Wenn und Aber.',nh_quality_verified_title:'Aura Verified Siegel',nh_quality_verified_desc:'Unser mehrstufiger Pr\u00fcfprozess garantiert: Was das Siegel tr\u00e4gt, funktioniert einwandfrei.',nh_quality_report_title:'Transparenter Zustandsbericht',nh_quality_report_desc:'F\u00fcr jedes Produkt gibt es einen ehrlichen Condition Report \u2014 mit Fotos, Bewertung und eventuellen Gebrauchsspuren.',nh_quality_shipping_title:'Klimaneutraler Versand',nh_quality_shipping_desc:'Wir verwenden recycelte Verpackungsmaterialien und kompensieren den CO\u2082-Aussto\u00df jeder Lieferung.',nh_quality_partner_title:'Partner-Netzwerk',nh_quality_partner_desc:'Zusammenarbeit mit zertifizierten Recycling-Partnern f\u00fcr Artikel, die unsere Qualit\u00e4tspr\u00fcfung nicht bestehen.',
  nh_cta_title:'Mach mit. Kauf bewusst.',nh_cta_desc:'Jede Bestellung bei Aura ist ein Beitrag zur Kreislaufwirtschaft. St\u00f6bere in unseren gepr\u00fcften Produkten und erlebe, dass Nachhaltigkeit und Qualit\u00e4t zusammengeh\u00f6ren.',nh_cta_discover:'JETZT ENTDECKEN',nh_cta_sourcing:'WIE WIR SOURCEN \u2192',
  prv_hero_title:'Datenschutzerkl\u00e4rung',prv_hero_sub:'Informationen zum Schutz Ihrer personenbezogenen Daten gem\u00e4\u00df DSGVO',
  prv_s1_title:'1. Verantwortlicher',prv_s1_p1:'Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) sowie der UK General Data Protection Regulation (UK GDPR) und des Data Protection Act 2018 ist:',
  prv_s2_title:'2. Erhebung und Speicherung personenbezogener Daten',prv_s2_p1:'Wir erheben personenbezogene Daten, wenn Sie uns diese im Rahmen Ihrer Nutzung unserer Website freiwillig mitteilen. Dies betrifft insbesondere:',prv_s2_p2:'Dar\u00fcber hinaus werden bei der Nutzung der Website automatisch technische Daten erfasst (IP-Adresse, Browsertyp, Betriebssystem, Zugriffszeit, aufgerufene Seiten). Diese Daten werden nicht mit anderen Datenquellen zusammengef\u00fchrt.',
  prv_s3_title:'3. Zweck der Datenverarbeitung',prv_s3_p1:'Wir verarbeiten Ihre personenbezogenen Daten zu folgenden Zwecken:',
  prv_s4_title:'4. Weitergabe an Dritte',prv_s4_p1:'Personenbezogene Daten werden nur dann an Dritte weitergegeben, wenn dies zur Vertragserf\u00fcllung erforderlich ist:',prv_s4_p2:'Wir verkaufen Ihre Daten nicht an Dritte. Eine Weitergabe zu Werbezwecken an Dritte erfolgt nicht ohne Ihre ausdr\u00fcckliche Einwilligung.',
  prv_s5_title:'5. Cookies',prv_s5_p1:'Unsere Website verwendet ausschlie\u00dflich technisch notwendige Cookies. Diese sind f\u00fcr die Grundfunktionalit\u00e4t der Website erforderlich und k\u00f6nnen nicht deaktiviert werden.',prv_s5_p2:'Folgende Cookies werden eingesetzt:',prv_s5_th1:'Cookie',prv_s5_th2:'Zweck',prv_s5_th3:'Dauer',prv_s5_c1_purpose:'Sitzungsidentifikation',prv_s5_c1_dur:'Sitzung',prv_s5_c2_purpose:'Sprachpr\u00e4ferenz',prv_s5_c2_dur:'1 Jahr',prv_s5_c3_purpose:'Warenkorb-Inhalt',prv_s5_c3_dur:'30 Tage',
  prv_s6_title:'6. Ihre Rechte',prv_s6_p1:'Sie haben gem\u00e4\u00df DSGVO folgende Rechte bez\u00fcglich Ihrer personenbezogenen Daten:',
  prv_s7_title:'7. Datensicherheit',prv_s7_p1:'Wir setzen technische und organisatorische Sicherheitsma\u00dfnahmen ein, um Ihre Daten gegen Manipulation, Verlust, Zerst\u00f6rung oder Zugriff durch unbefugte Personen zu sch\u00fctzen.',prv_s7_p2:'Unsere Sicherheitsma\u00dfnahmen umfassen:',
  prv_s8_title:'8. \u00c4nderungen dieser Datenschutzerkl\u00e4rung',prv_s8_p1:'Wir behalten uns vor, diese Datenschutzerkl\u00e4rung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um \u00c4nderungen unserer Leistungen umzusetzen.',prv_s8_p2:'Die aktuelle Version finden Sie stets auf dieser Seite.',prv_s8_p3:'Letzte Aktualisierung: Juli 2025',
  prv_s9_title:'9. Kontakt',prv_s9_p1:'Bei Fragen zum Datenschutz erreichen Sie uns unter:',
  prv_s10_title:'10. Datenaufbewahrung und Speicherfristen',prv_s10_p1:'Wir speichern Ihre personenbezogenen Daten nur so lange, wie es f\u00fcr die Erreichung des jeweiligen Zwecks erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Im Einzelnen gelten folgende Fristen:',prv_s10_th1:'Datenart',prv_s10_th2:'Speicherdauer',prv_s10_th3:'Rechtsgrundlage',prv_s10_r1c1:'Kundenkonto-Daten',prv_s10_r1c2:'Bis zur Kontol\u00f6schung',prv_s10_r1c3:'Art. 6 Abs. 1 lit. b DSGVO',prv_s10_r2c1:'Bestelldaten',prv_s10_r2c2:'10 Jahre (steuerrechtlich)',prv_s10_r2c3:'Art. 6 Abs. 1 lit. c DSGVO',prv_s10_r3c1:'Rechnungsdaten',prv_s10_r3c2:'10 Jahre (HGB, AO)',prv_s10_r3c3:'\u00a7 147 AO, \u00a7 257 HGB',prv_s10_r4c1:'Kommunikationsdaten',prv_s10_r4c2:'3 Jahre nach letztem Kontakt',prv_s10_r4c3:'Art. 6 Abs. 1 lit. f DSGVO',prv_s10_r5c1:'Server-Logfiles',prv_s10_r5c2:'90 Tage',prv_s10_r5c3:'Art. 6 Abs. 1 lit. f DSGVO',prv_s10_r6c1:'Video-Inspektionsprotokolle',prv_s10_r6c2:'12 Monate nach Lieferung',prv_s10_r6c3:'Art. 6 Abs. 1 lit. b DSGVO',prv_s10_p2:'Nach Ablauf der jeweiligen Aufbewahrungsfrist werden Ihre Daten routinem\u00e4\u00dfig gel\u00f6scht oder anonymisiert, sofern sie nicht mehr f\u00fcr die Vertragserf\u00fcllung oder Durchsetzung vertraglicher Anspr\u00fcche ben\u00f6tigt werden.',
  prv_s11_title:'11. Internationale Daten\u00fcbertragungen',prv_s11_p1:'Unser Unternehmen hat seinen Sitz im Vereinigten K\u00f6nigreich. Im Rahmen unserer Gesch\u00e4ftst\u00e4tigkeit kann es erforderlich sein, Daten in Drittl\u00e4nder zu \u00fcbertragen. Dabei stellen wir sicher, dass ein angemessenes Datenschutzniveau gew\u00e4hrleistet ist:',prv_s11_p2:'Auf Anfrage stellen wir Ihnen gerne eine Kopie der jeweils geschlossenen Standardvertragsklauseln zur Verf\u00fcgung.',
  prv_s12_title:'12. Automatisierte Entscheidungsfindung und Profiling',prv_s12_p1:'Wir verwenden keine automatisierte Entscheidungsfindung einschlie\u00dflich Profiling gem\u00e4\u00df Art. 22 DSGVO, die Ihnen gegen\u00fcber rechtliche Wirkung entfaltet oder Sie in \u00e4hnlicher Weise erheblich beeintr\u00e4chtigt.',prv_s12_p2:'Soweit wir anonymisierte Nutzungsdaten analysieren (z.B. um beliebte Produktkategorien zu identifizieren), dient dies ausschlie\u00dflich der Verbesserung unseres Angebots und hat keine individuelle Auswirkung auf Sie.',
  prv_s13_title:'13. Verarbeitung von Zahlungsdaten',prv_s13_p1:'Die Verarbeitung Ihrer Zahlungsdaten erfolgt ausschlie\u00dflich durch unseren PCI-DSS-zertifizierten Zahlungsdienstleister. Wir selbst speichern zu keinem Zeitpunkt Ihre vollst\u00e4ndigen Kreditkarten- oder Bankdaten auf unseren Servern.',prv_s13_p2:'Im Einzelnen verarbeiten wir im Zusammenhang mit Zahlungen folgende Daten:',prv_s13_li1:'Zahlungsmethode (z.B. Visa, Mastercard, PayPal)',prv_s13_li2:'Letzte vier Ziffern der Kartennummer (zur Identifizierung)',prv_s13_li3:'Transaktions-ID und Zeitstempel',prv_s13_li4:'Zahlungsstatus (erfolgreich, fehlgeschlagen, erstattet)',prv_s13_li5:'Rechnungsadresse und Lieferadresse',prv_s13_p3:'Alle Zahlungsdaten werden \u00fcber eine TLS-1.3-verschl\u00fcsselte Verbindung \u00fcbertragen. Stripe ist als Zahlungsdienstleister PCI-DSS Level 1 zertifiziert.',
  prv_s14_title:'14. Schutz von Minderj\u00e4hrigen',prv_s14_p1:'Unser Angebot richtet sich nicht an Personen unter 16 Jahren. Wir erheben wissentlich keine personenbezogenen Daten von Kindern. Sollten wir erfahren, dass uns ein Kind unter 16 Jahren personenbezogene Daten \u00fcbermittelt hat, werden wir diese umgehend l\u00f6schen.',prv_s14_p2:'Eltern bzw. Erziehungsberechtigte, die der Ansicht sind, dass ihr Kind uns m\u00f6glicherweise personenbezogene Daten bereitgestellt hat, k\u00f6nnen sich jederzeit an uns wenden, um die L\u00f6schung dieser Daten zu veranlassen.',
  prv_s15_title:'15. Newsletter und Marketing-Kommunikation',prv_s15_p1:'Wenn Sie unseren Newsletter abonnieren, verarbeiten wir Ihre E-Mail-Adresse auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) und Ihren Vor- und Nachnamen (optional).',prv_s15_p2:'Der Versand unseres Newsletters erfolgt \u00fcber einen in der EU ans\u00e4ssigen E-Mail-Dienstleister. Bei der Anmeldung zum Newsletter verwenden wir das sogenannte Double-Opt-In-Verfahren: Sie erhalten nach der Anmeldung eine E-Mail mit einem Best\u00e4tigungslink. Erst nach Klick auf diesen Link wird Ihre Anmeldung wirksam.',prv_s15_p3:'Sie k\u00f6nnen Ihre Einwilligung jederzeit widerrufen, indem Sie den Abmeldelink am Ende jedes Newsletters klicken oder uns per E-Mail kontaktieren. Die Rechtm\u00e4\u00dfigkeit der bereits erfolgten Verarbeitung bleibt vom Widerruf unber\u00fchrt.',prv_s15_p4:'Im Rahmen des Newsletter-Versands speichern wir folgende Daten:',prv_s15_li1:'E-Mail-Adresse und Name',prv_s15_li2:'Zeitpunkt der Anmeldung (Timestamp und IP-Adresse als Nachweis)',prv_s15_li3:'Best\u00e4tigungszeitpunkt (Double-Opt-In)',prv_s15_li4:'Ggf. \u00d6ffnungs- und Klickraten (anonymisiert zur Optimierung)',
  prv_s16_title:'16. Datenschutzbeauftragter',prv_s16_p1:'Aufgrund der Unternehmensgr\u00f6\u00dfe sind wir derzeit nicht zur Bestellung eines Datenschutzbeauftragten verpflichtet. Dennoch nehmen wir den Datenschutz sehr ernst und haben interne Prozesse etabliert, um die Einhaltung der DSGVO sicherzustellen.',prv_s16_p2:'F\u00fcr alle Anfragen zum Datenschutz steht Ihnen unser Datenschutz-Team unter folgender Adresse zur Verf\u00fcgung:',prv_s16_p4:'Wir bem\u00fchen uns, Ihre Anfrage innerhalb von 30 Tagen zu beantworten. Bei komplexen Anfragen kann sich diese Frist um bis zu zwei weitere Monate verl\u00e4ngern, wor\u00fcber wir Sie informieren werden.',
  agb_hero_title:'Allgemeine Gesch\u00e4ftsbedingungen (AGB)',agb_hero_sub:'der Aura Global Merchants Ltd. \u2014 Stand: M\u00e4rz 2026',
  agb_s1_title:'\u00a7 1 Geltungsbereich',agb_s1_p1:'(1) Diese Allgemeinen Gesch\u00e4ftsbedingungen (nachfolgend \u201eAGB\u201c) gelten f\u00fcr alle Bestellungen, die \u00fcber die Website auraglobal-merchants.com (nachfolgend \u201ePlattform\u201c) abgeschlossen werden.',agb_s1_p2:'(2) Anbieter ist die Aura Global Merchants Ltd., 71-75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom, eingetragen in England & Wales unter der Company Number 15847293 (nachfolgend \u201eAura Global\u201c oder \u201ewir\u201c).',agb_s1_p3:'(3) Aura Global agiert als Marktplatz-Intermedi\u00e4r, der die Authentizit\u00e4t und Qualit\u00e4t der angebotenen Produkte durch ein eigenes Inspektionsverfahren garantiert.',agb_s1_p4:'(4) Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, Aura Global stimmt deren Geltung ausdr\u00fccklich schriftlich zu.',
  agb_s2_title:'\u00a7 2 Vertragsschluss',agb_s2_p1:'(1) Die Darstellung der Produkte auf der Plattform stellt kein rechtlich bindendes Angebot dar, sondern eine Aufforderung zur Abgabe eines Angebots (invitatio ad offerendum).',agb_s2_p2:'(2) Durch Anklicken des Buttons \u201eZahlungspflichtig bestellen\u201c gibt der Kunde ein verbindliches Kaufangebot ab.',agb_s2_p3:'(3) Aura Global best\u00e4tigt den Eingang der Bestellung per automatisierter E-Mail (Eingangsbest\u00e4tigung). Diese stellt noch keine Annahme des Angebots dar.',agb_s2_p4:'(4) Der Vertrag kommt erst durch die Versendung der Auftragsbest\u00e4tigung per E-Mail oder durch Lieferung der Ware zustande.',
  agb_s3_title:'\u00a7 3 Preise und Zahlung',agb_s3_p1:'(1) Alle auf der Plattform angegebenen Preise sind Endpreise in Euro (EUR) und enthalten die gesetzliche Mehrwertsteuer.',agb_s3_p2:'(2) Versandkosten werden gesondert ausgewiesen und sind vom Kunden zu tragen, sofern nicht anders angegeben. Ab einem Bestellwert von 99 \u20ac entfallen die Versandkosten f\u00fcr Standardlieferungen innerhalb Deutschlands.',agb_s3_p3:'(3) Folgende Zahlungsmethoden stehen zur Verf\u00fcgung:',agb_s3_li1:'Visa',agb_s3_li2:'Mastercard',agb_s3_li3:'American Express',agb_s3_li4:'PayPal',agb_s3_li5:'Apple Pay',agb_s3_li6:'Google Pay',agb_s3_li7:'Klarna (Rechnung / Ratenkauf)',agb_s3_stripe:'Die Zahlungsabwicklung erfolgt \u00fcber den zertifizierten Zahlungsdienstleister Stripe, Inc. (PCI DSS Level 1). Kartendaten werden zu keinem Zeitpunkt auf unseren Servern gespeichert.',agb_s3_p4:'(4) Die Zahlung ist sofort mit Bestellabschluss f\u00e4llig. Die Belastung erfolgt zum Zeitpunkt der Auftragsbest\u00e4tigung.',
  agb_s4_title:'\u00a7 4 Aura Inspection Protocol',agb_s4_p1:'(1) Jedes \u00fcber die Plattform angebotene Produkt durchl\u00e4uft vor dem Versand das \u201eAura Inspection Protocol\u201c \u2014 eine dreistufige Qualit\u00e4tspr\u00fcfung:',agb_s4_p2:'(2) Der gesamte Inspektionsprozess wird per Video dokumentiert. Diese Videodokumentation dient als verbindliche Qualit\u00e4tsreferenz f\u00fcr den Zustand des Produkts zum Zeitpunkt des Versands.',agb_s4_p3:'(3) Dem Kunden wird auf Anfrage Zugang zur Inspektionsdokumentation seines spezifischen Produkts gew\u00e4hrt.',
  agb_s5_title:'\u00a7 5 Lieferung',agb_s5_p1:'(1) Die Lieferung erfolgt aus lokalen Lagern in Deutschland und dem Vereinigten K\u00f6nigreich.',agb_s5_p2:'(2) Standardlieferung: 2\u20134 Werktage. Expresslieferung: 1\u20132 Werktage (gegen Aufpreis).',agb_s5_p3:'(3) Versandpartner sind DHL und UPS. Der Kunde erh\u00e4lt nach Versand eine Sendungsverfolgungsnummer per E-Mail.',agb_s5_p4:'(4) Lieferungen erfolgen ausschlie\u00dflich an die vom Kunden angegebene Lieferadresse. \u00c4nderungen der Lieferadresse sind nur vor Versand m\u00f6glich.',agb_s5_p5:'(5) Ist der Kunde zum Zeitpunkt der Lieferung nicht erreichbar, hinterl\u00e4sst der Versanddienstleister eine Benachrichtigung. Die Kosten einer erneuten Zustellung tr\u00e4gt der Kunde.',
  agb_s5a_title:'\u00a7 5a Eigentumsvorbehalt',agb_s5a_p1:'(1) Die gelieferte Ware bleibt bis zur vollst\u00e4ndigen Bezahlung des Kaufpreises einschlie\u00dflich aller Nebenkosten Eigentum der Aura Global Merchants Ltd.',agb_s5a_p2:'(2) Der Kunde ist verpflichtet, die Vorbehaltsware pfleglich zu behandeln. Insbesondere ist er verpflichtet, diese auf eigene Kosten gegen Diebstahl-, Feuer- und Wassersch\u00e4den ausreichend zum Neuwert zu versichern.',agb_s5a_p3:'(3) Bei Pf\u00e4ndungen oder sonstigen Eingriffen Dritter hat der Kunde uns unverz\u00fcglich schriftlich zu benachrichtigen.',
  agb_s5b_title:'\u00a7 5b Gefahr\u00fcbergang',agb_s5b_p1:'(1) Bei Verbrauchern geht die Gefahr des zuf\u00e4lligen Untergangs und der zuf\u00e4lligen Verschlechterung der Ware erst mit \u00dcbergabe der Ware auf den Kunden \u00fcber \u2014 auch beim Versendungskauf.',agb_s5b_p2:'(2) Der \u00dcbergabe steht es gleich, wenn der Kunde im Verzug der Annahme ist.',
  agb_s6_title:'\u00a7 6 Widerrufsrecht',agb_s6_h3_notice:'Widerrufsbelehrung',agb_s6_h4_right:'Widerrufsrecht',agb_s6_h4_consequences:'Folgen des Widerrufs',agb_s6_h4_exclusion:'Ausschluss des Widerrufsrechts',agb_s6_exclusion_p:'Das Widerrufsrecht besteht nicht bei Vertr\u00e4gen zur Lieferung von:',agb_s6_ex_li1:'Waren, die nach Kundenspezifikation angefertigt werden oder eindeutig auf pers\u00f6nliche Bed\u00fcrfnisse zugeschnitten sind;',agb_s6_ex_li2:'versiegelte Waren, die aus Gr\u00fcnden des Gesundheitsschutzes oder der Hygiene nicht zur R\u00fcckgabe geeignet sind und deren Versiegelung nach der Lieferung entfernt wurde;',agb_s6_ex_li3:'Waren, die nach der Lieferung aufgrund ihrer Beschaffenheit untrennbar mit anderen G\u00fctern vermischt wurden;',agb_s6_ex_li4:'Audio- oder Videoaufnahmen oder Computersoftware in einer versiegelten Packung, wenn die Versiegelung nach der Lieferung entfernt wurde.',
  agb_s7_title:'\u00a7 7 Gew\u00e4hrleistung',agb_s7_p1:'(1) Es gelten die gesetzlichen Gew\u00e4hrleistungsrechte.',agb_s7_p2:'(2) M\u00e4ngel sind unverz\u00fcglich nach Entdeckung unter Angabe der Bestellnummer per E-Mail an admin@auraglobal-merchants.com zu melden.',agb_s7_p3:'(3) Bei Unstimmigkeiten \u00fcber den Zustand der gelieferten Ware dient die Videodokumentation des Aura Inspection Protocols als verbindliche Referenz f\u00fcr den Zustand zum Zeitpunkt des Versands.',agb_s7_p4:'(4) Die Gew\u00e4hrleistungsfrist f\u00fcr neue Waren betr\u00e4gt 24 Monate ab Lieferung. F\u00fcr gebrauchte Waren wird die Gew\u00e4hrleistungsfrist auf 12 Monate ab Lieferung verk\u00fcrzt.',
  agb_s8_title:'\u00a7 8 Haftungsbeschr\u00e4nkung',agb_s8_p1:'(1) Aura Global haftet unbeschr\u00e4nkt f\u00fcr Sch\u00e4den aus der Verletzung des Lebens, des K\u00f6rpers oder der Gesundheit sowie f\u00fcr vors\u00e4tzlich oder grob fahrl\u00e4ssig verursachte Sch\u00e4den.',agb_s8_p2:'(2) Bei leichter Fahrl\u00e4ssigkeit haftet Aura Global nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). Die Haftung ist in diesem Fall auf den vorhersehbaren, vertragstypischen Schaden begrenzt.',agb_s8_p3:'(3) Die vorstehenden Haftungsbeschr\u00e4nkungen gelten nicht f\u00fcr Anspr\u00fcche nach dem Produkthaftungsgesetz sowie bei \u00dcbernahme einer Garantie.',
  agb_s9_title:'\u00a7 9 Datenschutz',agb_s9_p2:'(2) Der Kunde erkl\u00e4rt sich mit der Verarbeitung seiner personenbezogenen Daten gem\u00e4\u00df der Datenschutzerkl\u00e4rung einverstanden, soweit dies zur Vertragserf\u00fcllung erforderlich ist.',
  agb_s10_title:'\u00a7 10 Schlussbestimmungen',agb_s10_p1:'(1) Es gilt das Recht von England und Wales unter Ausschluss des UN-Kaufrechts (CISG). Gegen\u00fcber Verbrauchern mit gew\u00f6hnlichem Aufenthalt in der EU gilt diese Rechtswahl nur insoweit, als dadurch nicht zwingende Verbraucherschutzvorschriften des Aufenthaltsstaates eingeschr\u00e4nkt werden.',agb_s10_p2:'(2) Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchf\u00fchrbar sein oder werden, so wird die Wirksamkeit der \u00fcbrigen Bestimmungen davon nicht ber\u00fchrt. Anstelle der unwirksamen Bestimmung tritt eine wirksame, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am n\u00e4chsten kommt.',agb_s10_p3:'(3) Vertragssprache ist Deutsch.',
  agb_s11_title:'\u00a7 11 Geistiges Eigentum und Markenrechte',agb_s11_p1:'(1) Alle Inhalte der Website von Aura Global Merchants Ltd., einschlie\u00dflich Texte, Grafiken, Logos, Symbole, Bilder, Audio- und Videoclips, Datensammlungen und Software, sind Eigentum von Aura Global Merchants Ltd. oder ihren Lizenzgebern und durch internationale Urheber- und Markengesetze gesch\u00fctzt.',agb_s11_p2:'(2) Die auf dieser Website dargestellten Marken, Logos und Handelsnamen Dritter (z.B. Apple, Nike, Gucci, Samsung etc.) sind Eigentum der jeweiligen Markeninhaber. Die Darstellung auf unserer Website erfolgt ausschlie\u00dflich zur Kennzeichnung der angebotenen Originalprodukte und stellt keine Empfehlung, Sponsoring oder Genehmigung durch die Markeninhaber dar.',agb_s11_p3:'(3) Jede nicht ausdr\u00fccklich genehmigte Nutzung, Vervielf\u00e4ltigung, Verbreitung, \u00dcbertragung, Ver\u00f6ffentlichung oder Verarbeitung der auf dieser Website vorhandenen Inhalte ist untersagt und kann zivil- und strafrechtliche Konsequenzen nach sich ziehen.',agb_s11_p4:'(4) Kunden d\u00fcrfen einzelne Seiten der Website zum pers\u00f6nlichen, nicht-kommerziellen Gebrauch herunterladen oder ausdrucken, sofern keine Urheber- oder Eigentumsvermerke entfernt werden.',
  agb_s12_title:'\u00a7 12 Kundenkonto und Nutzerpflichten',agb_s12_p1:'(1) Zur Bestellung bei Aura Global Merchants Ltd. ist die Erstellung eines Kundenkontos erforderlich. Bei der Registrierung ist der Kunde verpflichtet, wahrheitsgem\u00e4\u00dfe und vollst\u00e4ndige Angaben zu machen und diese bei \u00c4nderungen unverz\u00fcglich zu aktualisieren.',agb_s12_p2:'(2) Der Kunde ist f\u00fcr die Geheimhaltung seiner Zugangsdaten (E-Mail-Adresse und Passwort) selbst verantwortlich. Er haftet f\u00fcr alle Aktivit\u00e4ten, die unter seinem Kundenkonto vorgenommen werden, es sei denn, er hat den Missbrauch nicht zu vertreten.',agb_s12_p3:'(3) Bei Verdacht auf unbefugte Nutzung seines Kontos hat der Kunde uns unverz\u00fcglich zu informieren. Wir behalten uns das Recht vor, Kundenkonten bei begr\u00fcndetem Verdacht auf Missbrauch vor\u00fcbergehend zu sperren.',agb_s12_p4:'(4) Pro Person darf nur ein Kundenkonto erstellt werden. Die Weitergabe von Kundenkonten an Dritte ist nicht gestattet.',agb_s12_p5:'(5) Der Kunde kann sein Kundenkonto jederzeit \u00fcber die Kontoeinstellungen oder durch Mitteilung an unseren Kundenservice l\u00f6schen lassen. Die L\u00f6schung wird innerhalb von 30 Tagen durchgef\u00fchrt. Gesetzliche Aufbewahrungspflichten bleiben unber\u00fchrt.',
  agb_s13_title:'\u00a7 13 Video-Inspektionsprotokoll',agb_s13_p1:'(1) Jedes \u00fcber Aura Global Merchants Ltd. verkaufte Produkt wird im Rahmen unseres Aura Inspection Protocol videodokumentiert. Das Video-Inspektionsprotokoll ist ein integraler Bestandteil unseres Qualit\u00e4tssicherungsprozesses.',agb_s13_p2:'(2) Das Video zeigt den Zustand des Produkts zum Zeitpunkt der Pr\u00fcfung im Hub, einschlie\u00dflich der Verpackung, des Zubeh\u00f6rs, der Funktionsf\u00e4higkeit und etwaiger \u00e4u\u00dferer M\u00e4ngel. Es dient als objektiver Nachweis des Produktzustands.',agb_s13_p3:'(3) Im Falle einer Reklamation oder eines R\u00fccksendeantrags wird das Video-Inspektionsprotokoll als Referenz f\u00fcr den Zustand bei Versand herangezogen. Abweichungen vom dokumentierten Zustand, die nicht auf normalen Transport zur\u00fcckzuf\u00fchren sind, k\u00f6nnen die Erstattung beeinflussen.',agb_s13_p4:'(4) Die Video-Inspektionsprotokolle werden f\u00fcr die Dauer von 12 Monaten nach Lieferung gespeichert. Der Kunde hat auf Anfrage jederzeit Zugang zu seinem Inspektionsvideo.',agb_s13_p5:'(5) Die Videos werden ausschlie\u00dflich f\u00fcr die genannten Qualit\u00e4tssicherungs- und Gew\u00e4hrleistungszwecke verwendet und nicht an Dritte weitergegeben.',
  agb_s14_title:'\u00a7 14 Verbotene Nutzung',agb_s14_p1:'(1) Die Nutzung unserer Website und unserer Dienste zu folgenden Zwecken ist untersagt:',agb_s14_li1:'Bestellungen zum Zweck des gewerblichen Weiterverkaufs ohne vorherige schriftliche Genehmigung',agb_s14_li2:'Manipulation von Bewertungen, Preisen oder Bestandsinformationen',agb_s14_li3:'Verwendung automatisierter Systeme (Bots, Scraper, Crawler) zum Extrahieren von Daten',agb_s14_li4:'Einleitung von Denial-of-Service-Angriffen oder sonstige Beeintr\u00e4chtigungen der Infrastruktur',agb_s14_li5:'Verwendung falscher oder irref\u00fchrender Identit\u00e4ten bei der Registrierung',agb_s14_li6:'Bestellungen unter Verwendung gestohlener oder unberechtigt erlangter Zahlungsmittel',agb_s14_p2:'(2) Bei Versto\u00df gegen die vorgenannten Bestimmungen behalten wir uns das Recht vor, Bestellungen zu stornieren, Kundenkonten dauerhaft zu sperren und zivilrechtliche Anspr\u00fcche geltend zu machen.',
  agb_s15_title:'\u00a7 15 Streitbeilegung',agb_s15_p2:'(2) Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle gem\u00e4\u00df dem Verbraucherstreitbeilegungsgesetz teilzunehmen.',agb_s15_p3:'(3) Ungeachtet dessen steht dem Verbraucher das Recht zu, den ordentlichen Rechtsweg zu beschreiten. F\u00fcr Verbraucher mit Wohnsitz in der EU ist der Gerichtsstand am Wohnsitz, Sitz oder Aufenthaltsort des Verbrauchers ma\u00dfgeblich.',
  agb_s16_title:'\u00a7 16 H\u00f6here Gewalt',agb_s16_p1:'(1) Aura Global Merchants Ltd. haftet nicht f\u00fcr die Nichterf\u00fcllung oder versp\u00e4tete Erf\u00fcllung vertraglicher Pflichten, soweit die Nichterf\u00fcllung oder Verz\u00f6gerung auf Ereignisse h\u00f6herer Gewalt zur\u00fcckzuf\u00fchren ist.',agb_s16_p2:'(2) Als Ereignisse h\u00f6herer Gewalt gelten unter anderem: Naturkatastrophen, Pandemien, Kriege, Terrorakte, Streiks, beh\u00f6rdliche Anordnungen, Unterbrechungen der Lieferkette, Energieausf\u00e4lle, Cyberangriffe oder vergleichbare Ereignisse au\u00dferhalb unserer zumutbaren Kontrolle.',agb_s16_p3:'(3) Im Falle h\u00f6herer Gewalt werden wir den Kunden umgehend informieren und uns nach Kr\u00e4ften bem\u00fchen, die Auswirkungen so gering wie m\u00f6glich zu halten. Dauert das Ereignis l\u00e4nger als 60 Tage an, ist jede Partei berechtigt, vom Vertrag zur\u00fcckzutreten.',
  kr_c1_b1_desc:'Geld ohne Verz\u00f6gerungen \u2014 per Bank\u00fcberweisung. Jede Woche.',kr_c1_b1_title:'W\u00f6chentliche Auszahlung',kr_c1_b2_desc:'Reales Wachstumspotenzial bis zur Position Head of Operations innerhalb von 6\u201312 Monaten.',kr_c1_b2_title:'Karriere-Boost',kr_c1_b3_desc:'Offizielle Zusammenarbeit in der Struktur der britischen Aura Global Merchants Ltd.',kr_c1_b3_title:'Global Status',kr_c1_badge:'STRATEGISCHE ROLLE',kr_c1_cta:'JETZT BEWERBEN',kr_c1_earn_label:'Verg\u00fctung',kr_c1_h_benefits:'Was wir bieten',kr_c1_h_profile:'Ihr Profil',kr_c1_h_role:'Ihre Rolle',kr_c1_h_tasks:'Ihre Kernaufgaben',kr_c1_meta_apps:'12 Bewerbungen',kr_c1_meta_date:'Gepostet: Heute',kr_c1_sub:'DACH Region \u2014 Remote',kr_c1_t1_desc:'Distanzielle Koordination und Audit der regionalen Partner (Brand Ambassadors) in Ihrem zugewiesenen Sektor.',kr_c1_t1_title:'Hub-Steuerung',kr_c1_t2_desc:'Finaler Check der Video-Inspektionsprotokolle: Abgleich der Seriennummern, Verifizierung der Originalit\u00e4t und Integrit\u00e4t der Aura-Siegel.',kr_c1_t2_title:'Quality Verification',kr_c1_t3_desc:'Arbeit im internen CRM \u00abAura Hub\u00bb: Monitoring der Lieferfristen, Statusverwaltung aller Bestellungen in Echtzeit.',kr_c1_t3_title:'Logistik-Management',kr_c1_t4_desc:'Direktes Reporting an die Operations-Abteilung in London zur Optimierung regionaler Lieferketten.',kr_c1_t4_title:'Reporting',kr_c1_tag1:'REMOTE \u2014 DACH',kr_c1_tag2:'VOLLZEIT / FREELANCE',kr_c1_tag3:'SOFORT VERF\u00dcGBAR',kr_c1_title:'Logistik-Koordinator (m/w/d)',
  kr_c2_a1_desc:'Drehen Sie ein Video des \u00abErsten Kontakts\u00bb (First Impression) nach dem Aura-Standard f\u00fcr unsere sozialen Medien.',kr_c2_a1_title:'Unboxing Experience',kr_c2_a2_desc:'Kurzer Videoanruf mit Ihrem Koordinator (Logistik-Koordinator) zur finalen Verifizierung der Inspektion.',kr_c2_a2_title:'Live Check-In',kr_c2_a3_title:'Decision Point',kr_c2_badge:'HOT \u2014 AKTIVE SUCHE',kr_c2_cta:'JETZT BEWERBEN',kr_c2_earn_label:'Verg\u00fctung pro Inspektion',kr_c2_h_algo:'Ihr Algorithmus des Erfolgs',kr_c2_h_profile:'Was Sie mitbringen',kr_c2_h_reward:'Triple Reward \u2014 3 Ebenen pro Einheit',kr_c2_h_why:'Warum diese Rolle?',kr_c2_meta_apps:'23 Bewerbungen',kr_c2_meta_date:'Gepostet: Heute',kr_c2_r1_desc:'Pro technische Inspektion und Video-Report. Direkte Auszahlung.',kr_c2_r1_label:'Cash-Back',kr_c2_r2_desc:'Zus\u00e4tzlicher Gutschein f\u00fcr unseren exklusiven internen Store.',kr_c2_r2_label:'Aura Voucher',kr_c2_r3_amount:'bis 50% Rabatt',kr_c2_r3_desc:'Sie sehen das Produkt zuerst. Sie d\u00fcrfen es zum Aura-Spezialpreis behalten.',kr_c2_r3_label:'Vorkaufsrecht',kr_c2_sub:'Regionaler Partner \u2014 Deutschlandweit',kr_c2_tag1:'DEUTSCHLANDWEIT',kr_c2_tag2:'FLEXIBEL / FREELANCE',kr_c2_tag3:'SOFORT STARTEN',kr_c2_title:'Aura Brand Ambassador & Verified Content Creator (m/w/d)',
  kr_cta_apply:'DIREKT BEWERBEN',kr_cta_btn:'INITIATIVBEWERBUNG SENDEN',kr_cta_jobs:'AKTIVE STELLEN ANSEHEN',kr_cta_sub:'Schick uns eine Initiativbewerbung \u2014 wir suchen immer nach au\u00dfergew\u00f6hnlichen Talenten.',kr_cta_title:'Deine Rolle nicht dabei?',
  kr_form_firstname:'Vorname *',kr_form_heading:'Ihre Bewerbung',kr_form_position:'Gew\u00fcnschte Position *',kr_form_select_default:'Bitte w\u00e4hlen...',kr_form_sub:'Schnell, unkompliziert, vertraulich. Wir melden uns innerhalb von 48 Stunden.',kr_form_submit:'BEWERBUNG ABSENDEN',kr_form_title:'Bewerbungsformular',
  kr_hero_badge:'Karriere bei Aura Global Merchants Ltd.',kr_hero_desc:'London. Berlin. M\u00fcnchen. New York. \u2014 Wir suchen operative Talente, die internationale Warenfl\u00fcsse steuern und Premiummarken auf den Weg zum Endkunden bringen.',kr_stat1:'Mitarbeiter weltweit',kr_stat2:'Standorte',kr_stat3:'Offene Stellen',kr_stat4:'Remote-freundlich',
  kr_why_c1_desc:'71-75 Shelton Street, London WC2H 9JQ. Company No. 15847293. Registriert in England & Wales.',kr_why_c1_title:'Londoner Hauptsitz',kr_why_c2_desc:'London, Berlin, M\u00fcnchen, Hamburg, New York \u2014 ein internationales Netzwerk f\u00fcr Logistik und Qualit\u00e4tssicherung.',kr_why_c2_title:'5 Standorte, 1 Team',kr_why_c3_desc:'Transparente Verg\u00fctungsmodelle mit w\u00f6chentlicher Auszahlung per Bank\u00fcberweisung.',kr_why_c3_title:'P\u00fcnktliche Zahlung',kr_why_c4_desc:'Vom Koordinator zum Head of Operations in 6\u201312 Monaten. Wir f\u00f6rdern Eigeninitiative und belohnen Ergebnisse.',kr_why_c4_title:'Karrierepfad',kr_why_sub:'Eine registrierte britische Handelsgesellschaft mit globaler Infrastruktur.',kr_why_title:'Warum Aura Global?',
  kr_z1_badge:'Active Recruitment \u2014 Sofort verf\u00fcgbar',kr_z1_sub:'Unsere zwei strategischen Kernrollen f\u00fcr den DACH-Raum. Hohe Eigenverantwortung, attraktive Verg\u00fctung, 100% remote.',kr_z1_title:'Globale Operationen',
  kr_z2_1_desc:'Leitung des Fulfillment-Teams (8-12 MA). Qualit\u00e4tskontrolle, KPI-Reporting an Head of Ops.',kr_z2_1_loc:'London Hub \u00b7 Vollzeit',kr_z2_1_title:'Warehouse Team Lead',kr_z2_10_desc:'Teamleitung (5 MA), Zendesk/Freshdesk, CSAT/NPS-Tracking. Muttersprachler Deutsch.',kr_z2_10_loc:'Berlin \u00b7 Vollzeit',kr_z2_10_title:'Leitung Kundensupport (DE)',kr_z2_11_desc:'US-Markteintritt, Paid Ads (Google/Meta/TikTok), DTC-Skalierung.',kr_z2_11_loc:'New York \u00b7 Vollzeit',kr_z2_11_title:'E-Commerce Growth Manager',kr_z2_12_desc:'Produkttexte, Blog, Newsletter, SEO-Content. Deutsch + Englisch C2.',kr_z2_12_loc:'Full Remote \u00b7 VZ/TZ',kr_z2_12_title:'Copywriter DE/EN',
  kr_z2_2_desc:'Bestandsoptimierung \u00fcber alle Kan\u00e4le, Inventuren und Demand-Forecasting.',kr_z2_2_loc:'Berlin \u00b7 Vollzeit',kr_z2_2_title:'Inventory Controller',kr_z2_3_desc:'Dashboards, A/B-Tests, ETL-Pipelines (Python/SQL). Erste BI-Erfahrung erw\u00fcnscht.',kr_z2_3_loc:'London / Remote \u00b7 Vollzeit',kr_z2_3_title:'Junior Data Analyst',kr_z2_4_desc:'Shopify/Liquid, Tailwind CSS, Core Web Vitals. Theme-Entwicklung und Landingpages.',kr_z2_4_loc:'Full Remote \u00b7 Vollzeit',kr_z2_4_title:'Frontend Developer',kr_z2_5_desc:'Cypress/Playwright, CI/CD-Integration, API-Tests. ISTQB ein Plus.',kr_z2_5_loc:'London \u00b7 Vollzeit',kr_z2_5_title:'QA Automation Engineer',kr_z2_6_desc:'Pentests, WAF/SIEM/DLP, DSGVO-Compliance. CISSP oder CEH von Vorteil.',kr_z2_6_loc:'Full Remote \u00b7 Vollzeit',kr_z2_6_title:'Cybersecurity Specialist',
  kr_z2_7_desc:'KYC-Prozesse, Chargeback-Monitoring, Compliance-Framework (UK/EU).',kr_z2_7_loc:'London \u00b7 Vollzeit',kr_z2_7_title:'Compliance & Anti-Fraud Manager',kr_z2_8_desc:'Grenz\u00fcberschreitende Handels-/Zollvorschriften, Lieferantenvertr\u00e4ge, Markenrecht.',kr_z2_8_loc:'London / Remote \u00b7 Vollzeit',kr_z2_8_title:'International Trade Lawyer',kr_z2_9_desc:'VAT-Registrierungen UK/DE/FR/NL, OSS-Verfahren, Xero/Avalara.',kr_z2_9_loc:'London \u00b7 Vollzeit',kr_z2_9_title:'VAT & Taxation Specialist',kr_z2_apply:'Bewerben \u2192',kr_z2_sub:'Aura Global w\u00e4chst \u2014 in allen Abteilungen. Von Tech bis Legal, von Marketing bis Operations.',kr_z2_title:'Weitere Stellen im Unternehmen',
  ds_noauth:'Nicht angemeldet',ds_noauth_d:'Bitte melden Sie sich an, um Ihr Konto zu sehen.',ds_login:'ANMELDEN',
  ds_hello:'Hallo,',ds_logout:'Abmelden',ds_orders:'Meine Bestellungen',ds_settings:'Kontoeinstellungen',
  ds_empty:'Sie haben noch keine Bestellungen.',ds_shop:'JETZT EINKAUFEN',
  ds_personal:'Persönliche Daten',ds_save:'SPEICHERN',ds_delete:'Konto löschen',ds_delete_d:'Diese Aktion kann nicht rückgängig gemacht werden.',ds_delete_btn:'KONTO LÖSCHEN',
  ds_ordernum:'Bestellnr.',ds_date:'Datum',
  st_pending:'Ausstehend',st_paid:'Bezahlt',st_sourcing:'Beschaffung',st_shipped:'Versendet',st_delivered:'Geliefert',st_inspection:'In Prüfung',
  // Tracking page
  trk_title:'Bestellung verfolgen',trk_desc:'Geben Sie Ihre Bestellnummer und E-Mail ein, um den Status Ihrer Bestellung zu verfolgen.',trk_order_id:'Bestellnummer',trk_email:'E-Mail-Adresse',trk_btn:'BESTELLUNG SUCHEN',trk_not_found:'Bestellung nicht gefunden. Überprüfen Sie die eingegebenen Daten.',
  trk_paid:'Bezahlt',trk_paid_d:'Zahlung eingegangen',trk_sourcing:'Logistikzentrum',trk_sourcing_d:'Produkt wird vorbereitet',trk_shipped:'Versendet',trk_shipped_d:'Paket unterwegs',trk_delivered:'Zugestellt',trk_delivered_d:'Erfolgreich zugestellt',
  trk_track_num:'Sendungsnummer',trk_track_btn:'Sendung verfolgen',trk_receipt:'Kaufbeleg',trk_dl_receipt:'Beleg herunterladen',
  // Service pages
  svc_returns_title:'Rückgabe & Erstattung',svc_shipping_title:'Versandrichtlinien',svc_faq_title:'Häufig gestellte Fragen',
  co_story_title:'Unsere Geschichte',co_privacy_title:'Datenschutzerklärung',co_terms_title:'AGB — Allgemeine Geschäftsbedingungen',co_imprint_title:'Impressum',
  // Mega menu
  mega_electronics:'Elektronik',mega_fashion:'Mode',mega_all_el:'Alle Elektronik →',mega_all_fa:'Alle Mode →',
  // Fill all fields
  fill_all:'Bitte füllen Sie alle Felder aus',
  pass_mismatch:'Passwörter stimmen nicht überein.',
  added_cart:'zum Warenkorb hinzugefügt',
  settings_saved:'Einstellungen gespeichert',
  order_placed:'Bestellung erfolgreich aufgegeben!',
  welcome_back:'Willkommen zurück!',
  account_created:'Konto erstellt!',
  delete_confirm:'Konto wirklich löschen?',
  // Card trust
  card_free_ship:'Gratis Versand',card_inspected:'Geprüft',card_instock:'Auf Lager',card_reviews:'Bewertungen',card_sold:'verkauft',card_returns:'30 Tage Rückgabe',card_delivery:'Lieferung in 2\u20134 Tagen',
  price_vat:'inkl. MwSt., zzgl. Versandkosten',
  cart_remove:'Entfernen',cart_empty_msg:'Ihr Warenkorb ist leer',cart_continue:'Weiter einkaufen',
  hero_trust_ship:'Versand in 2–4 Tagen',hero_trust_return:'30 Tage Rückgabe',hero_trust_pay:'Sichere Zahlung',
  prime_title:'Werde Aura Prime Mitglied',prime_desc:'Erhalte <strong style="color:#C5A059">exklusive Vorab-Deals</strong>, Early Access zu neuen Produkten und kostenfreien Express-Versand.',prime_btn:'JETZT BEITRETEN',prime_ph:'E-Mail Adresse',prime_ok:'Willkommen bei Aura Prime!',prime_ok_d:'Wir melden uns in Kürze.',prime_spam:'Kein Spam. Jederzeit abmeldbar.',
  price_m_title:'Ehrliche Preise, klare Logik',price_m_desc:'Warum wir günstiger sind — ohne Kompromisse bei der Qualität.',price_m_uvp:'Einzelhandel (UVP)',price_m_aura:'Aura Direct',price_m_explain:'Wir kaufen Retouren und Liquidationsware direkt von Großhändlern — ohne Zwischenhändler, ohne Ladenmiete, ohne Werbemillionen. Das Ergebnis: <strong style="color:#001A3D">Sie sparen bis zu 40%</strong> gegenüber dem Einzelhandelspreis.',price_m_ok:'VERSTANDEN',
  cookie_text:'Wir verwenden ausschließlich <strong style="color:white">technisch notwendige Cookies</strong>, die für den Betrieb unserer Website erforderlich sind. Mehr erfahren Sie in unserer',cookie_accept:'AKZEPTIEREN',cookie_reject:'NUR NOTWENDIGE',cookie_privacy:'Datenschutzerklärung',
  activity_just:'Gerade eben · Aura Global',
  sec_process:'UNSER PROZESS',sec_how:'So funktioniert Aura',sec_how_d:'Jedes Produkt durchl\u00e4uft unser dreistufiges Pr\u00fcfverfahren im Londoner Hub, bevor es zu Ihnen gelangt.',
  step1_n:'Schritt 1',step1_t:'Beschaffung',step1_d:'Wir beziehen Originalware direkt von autorisierten H\u00e4ndlern und Marken weltweit \u2014 von Apple \u00fcber Nike bis Louis Vuitton. \u00dcber 120 verifizierte Quellen.',
  step2_n:'Schritt 2',step2_t:'Hub-Inspektion',step2_d:'In unserem Londoner Hub wird jedes Produkt manuell auf Originalit\u00e4t, Vollst\u00e4ndigkeit und Funktion gepr\u00fcft \u2014 mit Video-Dokumentation.',
  step3_n:'Schritt 3',step3_t:'Versand zu Ihnen',step3_d:'Versiegeltes, gepr\u00fcftes Paket \u2014 versichert und mit Tracking direkt zu Ihnen nach Hause. In nur 2\u20134 Werktagen.',
  stat_items:'Gepr\u00fcfte Artikel',stat_brands:'Top-Marken',stat_sat:'Kundenzufriedenheit',stat_del:'Tage Lieferung',
  cat_elec_d:'Smartphones, Laptops, Audio',cat_fash_d:'Schuhe, Taschen, Schmuck',cat_home_d:'Dyson, Smarthome, Pflege',cat_travel_d:'Gep\u00e4ck, Accessoires',cat_beauty:'Beauty & Pflege',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'ENTDECKEN \u2192',
  spot_top:'TOP KATEGORIE',spot_elec:'Elektronik & Technik',spot_all_elec:'Alle Elektronik \u2192',spot_fash:'Mode & Lifestyle',spot_all_fash:'Alle Mode \u2192',
  sec_trending_label:'AKTUELL',sec_trending:'Trending jetzt',sec_all_new:'Alle Neuheiten \u2192',
  sec_premium:'PREMIUM AUSWAHL',sec_brands_grid:'120+ Top-Marken auf einen Blick',sec_brands_d:'Von weltweit f\u00fchrenden Marken \u2014 gepr\u00fcft und direkt zu Ihnen.',sec_brands_sub:'\u00dcber 120 verifizierte Marken aus aller Welt',
  sec_testi_label:'KUNDENSTIMMEN',sec_testimonials:'Was unsere Kunden sagen',
  sec_why_label:'WARUM AURA?',sec_why:'Der Unterschied liegt im Detail',
  sec_mission:'UNSERE MISSION',sec_sust:'Kreislaufwirtschaft statt Verschwendung',
  mega_smartphones:'Smartphones & Tablets',mega_laptops:'Laptops',mega_laptops_audio:'Laptops & Audio',mega_audio:'Audio & Wearables',mega_gaming:'Gaming & VR',
  mega_shoes:'Schuhe & Sneaker',mega_designer:'Designer & Luxus',mega_jewelry:'Schmuck & Uhren',mega_clothing:'Kleidung & Accessoires',
  mega_home:'Haus & Wohnen',mega_travel:'Reise & Outdoor',
  mega_all_el:'Alle Elektronik anzeigen →',mega_all_fa:'Alle Mode anzeigen →',mega_all_home:'Alle Haus & Wohnen →',mega_all_travel:'Alle Reise & Outdoor →',
  mega_bose:'Bose Kopfhörer',mega_dyson_hair:'Dyson Haarpflege & Reinigung',mega_ecovacs:'Ecovacs Saugroboter',mega_hexclad:'HexClad Kochgeschirr',mega_ring:'Ring Sicherheit',mega_rimowa:'Rimowa Koffer',
  ck_phone:'Telefon',ck_card_brands:'Visa, Mastercard, American Express',ck_klarna:'Klarna — Rechnung',ck_klarna_d:'Bezahlen in 14 Tagen',ck_wallet:'Apple Pay / Google Pay',ck_wallet_d:'Schnell & sicher bezahlen',
  country_de:'Deutschland',country_at:'Österreich',country_ch:'Schweiz',country_gb:'Großbritannien',country_us:'Vereinigte Staaten',
  ct_name:'Vor- und Nachname *',ct_email:'E-Mail Adresse *',ct_order:'Bestellnummer',ct_subject:'Betreff *',ct_message:'Nachricht *',
  ct_select_ph:'Bitte wählen...',ct_opt_product:'Frage zum Produkt',ct_opt_logistics:'Logistik & Versand',ct_opt_warranty:'Garantie & Reklamation',ct_opt_career:'Karriere',ct_opt_return:'Rückgabe & Erstattung',ct_opt_payment:'Zahlung & Rechnung',ct_opt_other:'Sonstiges',
  err_storage_full:'Speicher voll — Daten zu groß',err_email_exists:'Diese E-Mail ist bereits registriert',err_wrong_pass:'Falsches Passwort',err_user_not_found:'Benutzer nicht gefunden',err_auth_required:'Bitte melden Sie sich an',msg_wishlist_removed:'Von Wunschliste entfernt',msg_wishlist_added:'Zur Wunschliste hinzugefügt',
  ft_all_products:'Alle Produkte',ft_electronics:'Elektronik',ft_fashion:'Mode & Accessoires',ft_home:'Haus & Wohnen',ft_travel:'Reise & Outdoor',ft_shipping_pay:'Versand & Zahlung',ft_faq:'FAQ',ft_about:'Über uns',ft_sustainability:'Nachhaltigkeit',ft_sourcing:'Unsere Beschaffung',ft_careers:'Karriere',ft_copyright:'© 2026 Aura Global Merchants Ltd. Alle Rechte vorbehalten.',ft_ssl:'Sichere Zahlung mit 256-bit SSL-Verschlüsselung',ft_ssl_ck:'Ihre Daten sind durch 256-bit SSL-Verschlüsselung geschützt',
  sort_newest:'Neuheiten',flt_apply:'ANWENDEN',
  day_sun:'Sonntag',day_mon:'Montag',day_tue:'Dienstag',day_wed:'Mittwoch',day_thu:'Donnerstag',day_fri:'Freitag',day_sat:'Samstag',
  prd_protocol:'Aura Pr\u00fcfprotokoll',prd_whats_box:'Was ist in der Box?',prd_box_product:'Originalprodukt',prd_box_sealed:'Versiegelt & gepr\u00fcft',prd_box_cert:'Aura Zertifikat',prd_box_insp:'Inspektionsprotokoll',prd_box_warranty:'Garantiekarte',prd_box_12m:'12 Monate Schutz',prd_box_return:'R\u00fccksendeetikett',prd_box_30d:'30-Tage-R\u00fcckgaberecht',
  prd_tab_desc:'Beschreibung',prd_tab_specs:'Technische Daten',prd_tab_ship:'Versand & R\u00fcckgabe',
  prd_ship_h:'Versand aus Berlin / London',prd_ship_p:'Alle Bestellungen werden aus unserem Berliner oder Londoner Lager versendet. Standard-Lieferung (3\u20135 Werktage) ist ab \u20ac99 kostenlos. Express-Versand (1\u20132 Werktage) f\u00fcr \u20ac9,90.',
  prd_ret_h:'30-Tage-R\u00fcckgaberecht',prd_ret_p:'R\u00fcckgabe innerhalb von 30 Tagen m\u00f6glich, wenn der Artikel nicht der Aura-Inspektionsbeschreibung entspricht. Kostenlose R\u00fccksendung mit vorfrankiertem Etikett.',
  prd_prot_h:'Aura Buyer Protection',prd_prot_p:'Jeder Kauf ist durch unser Aura-K\u00e4uferschutzprogramm abgesichert. Bei Problemen erhalten Sie eine volle Erstattung oder einen Ersatz.',
  prd_reviews:'Kundenbewertungen',prd_reviews_w:'Bewertungen',prd_order_now:'Bestellen Sie jetzt f\u00fcr Lieferung am',prd_hub:'(Berlin Hub)',
  prd_cond_orig:'Originalware',prd_cond_orig_d:'Manuell kontrolliert und gepr\u00fcft. Schneller Versand aus dem Hub.',prd_cond_verified:'Gepr\u00fcft',prd_cond_verified_d:'Manuell kontrolliert mit Video-Inspektion. 100% Original.',
  prd_saving:'Sie sparen:',prd_stock_low:'Nur noch {n} St\u00fcck!',prd_stock_avail:'Noch {n} auf Lager',prd_in_stock:'auf Lager',
  prd_proto_score:'Protokoll: {n}/3 bestanden',
  prd_insp_auth:'Authentizit\u00e4t',prd_insp_auth_y:'Seriennummer beim Hersteller verifiziert.',prd_insp_auth_n:'Authentizit\u00e4t konnte nicht vollst\u00e4ndig best\u00e4tigt werden.',
  prd_insp_func:'Funktionalit\u00e4t',prd_insp_func_y:'Batterie, Sensoren & Display vollst\u00e4ndig getestet.',prd_insp_func_n:'Funktionstest ausstehend oder teilweise bestanden.',
  prd_insp_source:'Beschaffung',prd_insp_source_d:'Direkt aus {shop} bezogen & in London gepr\u00fcft.',
  prd_insp_seal:'Versiegelt & Garantie',prd_insp_warranty:'Garantie',prd_insp_seal_y:'Versiegelt mit Aura Seal. 12 Monate Garantie.',prd_insp_seal_n:'12 Monate Garantie (ohne Originalversiegelung).',
  prd_why_aura:'Warum Aura Global?',prd_why_1:'Jedes Produkt durchl\u00e4uft unser 47-Punkte-Inspektionsprotokoll',prd_why_2:'Bezogen von autorisierten H\u00e4ndlern ({shop})',prd_why_3:'12 Monate Aura-Garantie inklusive',prd_why_4:'Kostenloser Versand & 30-Tage-R\u00fcckgabe',
  prd_seal_title:'Aura Qualit\u00e4tssiegel',prd_seal_desc:'Jedes Produkt wird mit einer Aura-Pr\u00fcfplombe versiegelt. Ihr Zeichen der Authentizit\u00e4t.',prd_seal_verified:'Gepr\u00fcft & versiegelt im Londoner Lager',
  prd_spec_brand:'Marke',prd_spec_cat:'Kategorie',prd_spec_cond:'Zustand',prd_spec_cond_v:'Hub Gepr\u00fcft \u2014 Neu mit Video',prd_spec_cond_c:'Aura Check \u2014 Gepr\u00fcft',
  prd_spec_rating:'Bewertung',prd_spec_stock:'Verf\u00fcgbarkeit',prd_spec_ship:'Versand',prd_spec_ship_v:'Kostenlos ab \u20ac99, DHL Express',
  prd_spec_warranty:'Garantie',prd_spec_warranty_v:'12 Monate Aura Global',prd_spec_source:'Bezugsquelle',prd_spec_source_v:'Autorisierter H\u00e4ndler ({shop})',
  prd_spec_insp:'Inspektion',prd_spec_insp_loc:'Londoner Lager',
  ds_nav_orders:'Meine Bestellungen',ds_nav_profile:'Persönliche Daten',ds_nav_addr:'Adressen',ds_nav_wish:'Wunschliste',
  ds_nav_pay:'Zahlungsmethoden',ds_nav_notif:'Benachrichtigungen',ds_nav_sec:'Sicherheit',ds_nav_set:'Kontoeinstellungen',
  ds_member_since:'Mitglied seit',ds_fname:'Vorname',ds_lname:'Nachname',ds_dob:'Geburtsdatum',ds_lang:'Sprache',ds_save:'SPEICHERN',ds_cancel:'ABBRECHEN',ds_cancel_lc:'Abbrechen',
  ds_addr_h:'Gespeicherte Adressen',ds_addr_new:'Neue Adresse',ds_addr_edit:'Adresse bearbeiten',ds_addr_empty:'Keine Adressen gespeichert',ds_addr_empty_d:'Fügen Sie eine Lieferadresse hinzu für schnelleres Bestellen',
  ds_street:'Straße & Hausnummer',ds_addr_extra:'Adresszusatz',ds_zip:'PLZ',ds_city:'Stadt',ds_country:'Land',ds_addr_default:'Als Standardadresse verwenden',
  ds_wish_h:'Meine Wunschliste',ds_wish_empty:'Ihre Wunschliste ist leer',ds_wish_empty_d:'Speichern Sie Ihre Lieblingsprodukte',ds_wish_browse:'PRODUKTE ENTDECKEN',
  ds_pay_add:'Hinzufügen',ds_pay_empty:'Keine Zahlungsmethoden hinterlegt',ds_pay_type:'Typ',ds_pay_sepa:'SEPA Lastschrift',
  ds_pay_holder:'Karteninhaber',ds_pay_last4:'Kartennummer (letzte 4)',ds_pay_exp:'Ablaufdatum',ds_pay_email:'E-Mail / Konto',ds_pay_default:'Als Standard festlegen',ds_pay_default_set:'Als Standard festlegen',
  ds_pay_info:'Ihre Zahlungsdaten werden sicher verschlüsselt gespeichert. Wir verwenden SSL/TLS-Verschlüsselung und sind PCI-DSS-zertifiziert.',
  ds_pay_new:'Neue Zahlungsmethode',ds_pay_edit:'Zahlungsmethode bearbeiten',ds_pay_expires:'Läuft ab',ds_pay_connected:'Verbunden',
  ds_notif_h:'Benachrichtigungseinstellungen',ds_notif_orders:'Bestellstatus',ds_notif_orders_d:'Updates zu Ihren Bestellungen per E-Mail',
  ds_notif_deals:'Angebote & Aktionen',ds_notif_deals_d:'Exklusive Deals und Sales direkt per E-Mail',
  ds_notif_price:'Preisalarme',ds_notif_price_d:'Benachrichtigung bei Preisnachlässen auf Wunschliste',
  ds_notif_news:'Newsletter',ds_notif_news_d:'Wöchentliche Neuheiten und Empfehlungen',
  ds_notif_push:'Push-Benachrichtigungen',ds_notif_push_d:'Browser-Benachrichtigungen für wichtige Updates',
  ds_sec_pw_h:'Passwort ändern',ds_sec_cur:'Aktuelles Passwort',ds_sec_new:'Neues Passwort',ds_sec_confirm:'Passwort bestätigen',ds_sec_pwchange:'PASSWORT ÄNDERN',
  ds_sec_2fa_h:'Zwei-Faktor-Authentifizierung',ds_sec_2fa:'2FA Status',ds_sec_2fa_d:'Erhöhen Sie die Sicherheit mit einer zusätzlichen Verifizierung',
  ds_sec_sessions:'Aktive Sitzungen',ds_sec_this:'Dieser Browser',ds_sec_active:'Aktiv',
  ds_set_id:'Konto-ID',ds_set_copy:'Kopieren',ds_set_member:'Mitgliedschaft',ds_set_member_v:'Aura Standard',ds_set_currency:'Währung',
  ds_set_export:'Datenexport',ds_set_export_d:'Laden Sie all Ihre persönlichen Daten herunter',ds_set_export_btn:'EXPORTIEREN',
  ds_set_delete:'Konto löschen',ds_set_delete_d:'Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden unwiderruflich gelöscht.',ds_set_delete_btn:'KONTO LÖSCHEN',
  ds_standard:'Standard',ds_edit:'Bearbeiten',ds_delete:'Löschen',
  ds_tl_paid:'Bezahlt',ds_tl_sourcing:'Versandfertig',ds_tl_inspection:'Geprüft',ds_tl_shipped:'Versendet',ds_tl_delivered:'Zugestellt',
  ds_ord_nr:'Bestellnr.',ds_ord_date:'Datum',ds_ord_total:'Gesamt',ds_ord_track:'Verfolgen',ds_ord_receipt:'Rechnung',ds_ord_help:'Hilfe',
  ds_ord_reviewed:'Bewertet',ds_ord_review:'Bewerten',ds_ord_tracking:'Sendungsnr',
  ds_rv_h:'Bewertung abgeben',ds_rv_d:'Teilen Sie Ihre Erfahrung',ds_rv_submit:'Bewertungen absenden',ds_rv_rating:'Bewertung',ds_rv_photos:'Fotos (max. 3)',ds_rv_add:'Hinzufügen',ds_rv_all_done:'Alle Produkte bereits bewertet!',
  ds_t_copied:'Kopiert',ds_t_export:'Export wird vorbereitet…',ds_t_currency:'Währung gespeichert',ds_t_delete_confirm:'Sind Sie sicher? Alle Daten werden gelöscht.',
  ds_t_enter_name:'Bitte Name eingeben',ds_t_profile:'Profil gespeichert',ds_t_required:'Bitte Pflichtfelder ausfüllen',
  ds_t_addr_saved:'Adresse gespeichert',ds_t_addr_del_q:'Adresse löschen?',ds_t_addr_deleted:'Adresse gelöscht',ds_t_addr_default:'Standardadresse aktualisiert',
  ds_t_wish_removed:'Von Wunschliste entfernt',ds_t_cart_added:'Zum Warenkorb hinzugefügt',ds_t_last4:'Bitte letzte 4 Ziffern eingeben',
  ds_t_pay_saved:'Zahlungsmethode gespeichert',ds_t_pay_del_q:'Zahlungsmethode löschen?',ds_t_pay_deleted:'Zahlungsmethode gelöscht',ds_t_default:'Standard aktualisiert',
  ds_t_notif:'Einstellungen gespeichert',ds_t_fill_all:'Bitte alle Felder ausfüllen',ds_t_pw_mismatch:'Passwörter stimmen nicht überein',
  ds_t_pw_min:'Mindestens 6 Zeichen',ds_t_pw_wrong:'Aktuelles Passwort falsch',ds_t_pw_changed:'Passwort geändert',
  ds_t_2fa_on:'2FA aktiviert',ds_t_2fa_off:'2FA deaktiviert',ds_t_stars:'Bitte vergeben Sie mindestens 1 Stern für jedes Produkt',
  ds_t_review_thx:'Vielen Dank für Ihre Bewertung!',ds_t_no_receipt:'Rechnung noch nicht verfügbar',ds_t_video_missing:'Video nicht gefunden',ds_t_max_photos:'Max. 3 Fotos',
  ct_hero:'Service-Center',ct_hero_d:'Unser deutschsprachiges Support-Team beantwortet Ihre Anfrage innerhalb von 24 Stunden.',
  ct_form_h:'Anfrage senden',ct_form_d:'Füllen Sie das Formular aus — wir melden uns schnellstmöglich.',
  ct_sent:'Anfrage gesendet!',ct_sent_thx:'Vielen Dank für Ihre Nachricht.',ct_sent_24h:'Wir bearbeiten Ihre Anfrage innerhalb von 24 Stunden.',ct_ref:'Referenznummer:',ct_home:'ZUR STARTSEITE',
  ct_privacy:'Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Daten zu. *',ct_submit:'ANFRAGE SENDEN',
  ct_reg_nr:'Firmennr.:',ct_reg_where:'Registriert:',ct_reg_ceo:'Geschäftsführer:',ct_channels:'Direktkanäle',
  ct_wa_d:'Jetzt chatten — schnelle Antwort',ct_tg_d:'Jetzt chatten — sichere Kommunikation',
  ct_hours_h:'Servicezeiten',ct_hrs_mf:'Montag – Freitag',ct_hrs_sat:'Samstag',ct_hrs_sun:'Sonntag & Feiertage',ct_hrs_closed:'Geschlossen',
  ct_hrs_avg:'Durchschnittliche Antwortzeit: unter 4 Stunden während der Geschäftszeiten.',
  ct_quick:'Schnellzugang',ct_q_track:'Sendung verfolgen',ct_q_return:'Rücksendung',ct_q_ship:'Versand',
  ct_v_name:'Bitte geben Sie Ihren Namen ein.',ct_v_email:'Bitte geben Sie eine gültige E-Mail-Adresse ein.',ct_v_subject:'Bitte wählen Sie einen Betreff.',ct_v_message:'Bitte geben Sie Ihre Nachricht ein.',ct_v_privacy:'Bitte akzeptieren Sie die Datenschutzerklärung.',
  lg_gdpr:'Ich habe die AGB und die Datenschutzerklärung gelesen und stimme diesen zu.',lg_gdpr_req:'Bitte stimmen Sie den AGB und der Datenschutzerklärung zu.',
  lg_btn_verify:'CODE BESTÄTIGEN',lg_no_account:'Kein Konto mit dieser E-Mail gefunden.',lg_code_sent:'Ein 6-stelliger Code wurde an {email} gesendet.',
  lg_enter_code:'Bitte geben Sie den 6-stelligen Code ein.',lg_pw_min:'Passwort muss mindestens 6 Zeichen lang sein.',lg_pw_mismatch:'Passwörter stimmen nicht überein.',lg_pw_changed:'Passwort erfolgreich geändert!',
  ft_copyright_short:'© 2026 Aura Global Merchants Ltd. · Company No. 15847293',
},
en:{
  locale_label:'EN / £',
  top_bar:'Free shipping from $99 · 30-day returns',
  guarantee:'Guarantee',
  search_ph:'Search products, brands, categories...',
  nav_all:'All Products',nav_electronics:'Electronics',nav_fashion:'Fashion',nav_fashion_long:'Fashion & Accessories',nav_home:'Home & Living',nav_travel:'Travel & Outdoor',nav_sale:'Sale %',nav_new:'New Arrivals',
  mob_login:'Sign In / Register',mob_orders:'My Orders',
  hero_tag:'Inspected \u00b7 Reliable \u00b7 Affordable',hero_h1a:'Inspected Electronics & Fashion',hero_h1b:'direct from the hub',
  hero_desc:'Every product is manually inspected at our London hub. 100% authenticity and functionality guaranteed.',
  hero_cta1:'VIEW ALL PRODUCTS',hero_cta2:'SALE & DEALS',
  trust_v:'Inspected Goods',trust_vd:'Manually checked at hub',trust_s:'Fast Shipping',trust_sd:'Delivered in 2\u20134 days',trust_r:'Free Returns',trust_rd:'30 days, no risk',trust_p:'Secure Payment',trust_pd:'SSL encrypted, PCI DSS',
  sec_cat:'Browse Categories',sec_feat:'Popular Products',sec_brands:'Our Brands',sec_news:'Newsletter',
  news_desc:'Get new deals and inspected products delivered to your inbox.',news_ph:'Your email address',news_btn:'SUBSCRIBE',
  add_cart:'ADD TO CART',view_prod:'VIEW',
  ft_cat:'Categories',ft_svc:'Customer Service',ft_co:'Company',ft_contact:'Contact',ft_track:'Track Order',ft_returns:'Returns & Refunds',ft_story:'Our Story',ft_privacy:'Privacy Policy',ft_terms:'Terms & Conditions',ft_imprint:'Legal Notice',
  ft_desc:'Inspected branded goods from our London hub. Reliable, affordable, secure.',
  cart_title:'Shopping Cart',cart_empty:'Your cart is empty',cart_total:'Total',cart_checkout:'CHECKOUT',
  flt_cat:'Category',flt_brand:'Brand',flt_price:'Price',flt_cond:'Condition',flt_verified:'Inspected',flt_openbox:'Original',
  sort_default:'Recommended',sort_price_asc:'Price: Low to High',sort_price_desc:'Price: High to Low',sort_name:'Name A-Z',sort_rating:'Top Rated',
  flt_reset:'Reset Filters',flt_results:'Products',flt_mobile:'Filter & Sort',
  prd_qty:'Quantity:',prd_add:'ADD TO CART',prd_desc:'Description',prd_specs:'Specifications',prd_rev:'Reviews',prd_related:'You may also like',
  prd_instock:'In Stock',prd_ship:'Free Shipping',prd_inspect:'Manually inspected at London hub — original goods',
  spec_brand:'Brand',spec_cat:'Category',spec_cond:'Condition',spec_cond_v:'Inspected — Original with Video',spec_cond_o:'Inspected — Original',spec_rating:'Rating',spec_avail:'Availability',spec_avail_v:'in stock',spec_ship:'Shipping',spec_ship_v:'Free from $99, DHL Express',
  lg_login:'SIGN IN',lg_register:'REGISTER',lg_login_desc:'Sign in with your email address.',lg_reg_desc:'Create an account to place orders.',
  lbl_email:'Email',lbl_pass:'Password',lbl_name:'Full Name',lbl_pass2:'Confirm Password',
  btn_login:'SIGN IN',btn_register:'CREATE ACCOUNT',back_shop:'← Back to shop',to_shop:'To shop →',
  ck_s1:'1. Shipping',ck_s2:'2. Payment',ck_s3:'3. Confirmation',
  ck_addr:'Shipping Address',ck_first:'First Name',ck_last:'Last Name',ck_street:'Street & Number',ck_zip:'ZIP Code',ck_city:'City',ck_country:'Country',
  ck_ship:'Shipping Method',ck_std:'Standard Shipping',ck_std_d:'3–5 business days',ck_exp:'Express Shipping',ck_exp_d:'1–2 business days',ck_free:'Free',
  ck_next:'CONTINUE TO PAYMENT',ck_summary:'Order Summary',ck_sub:'Subtotal',ck_shipping:'Shipping',ck_total:'Total',
  ck_pay:'Payment Method',ck_card:'Credit / Debit Card',ck_cardnum:'Card Number',ck_cardexp:'Exp. Date',
  ck_back:'← BACK',ck_place:'PLACE ORDER',
  ck_done:'Order Confirmed!',ck_thanks:'Thank you for your order at Aura Global Merchants.',ck_ordernum:'Order number:',ck_myorders:'MY ORDERS',ck_continue:'CONTINUE SHOPPING',
  ck_stripe_sec:'Secured by <strong class="text-gray-600">Stripe</strong> — Your card details are encrypted and never stored on our servers.',ck_gdpr:'I have read and agree to the <a href="/terms.html" target="_blank" class="text-gold hover:underline font-medium">Terms & Conditions</a> and <a href="/privacy.html" target="_blank" class="text-gold hover:underline font-medium">Privacy Policy</a>. I have been informed of my <a href="/returns.html#widerrufsformular" target="_blank" class="text-gold hover:underline font-medium">right of withdrawal</a>.',ck_gdpr_req:'Please agree to the Terms & Conditions and Privacy Policy.',ck_processing:'Processing...',ck_badge_ssl:'SSL encrypted',ck_badge_pci:'PCI DSS compliant',
  hp_why_video:'Video Inspection Protocol',hp_why_video_d:'Every product is documented with a video protocol — from opening the packaging to the function test. You see what you get.',
  hp_why_auth:'100% Verified Originals',hp_why_auth_d:'We source exclusively through authorised channels and verified dealers. Serial numbers are checked, counterfeits excluded.',
  hp_why_return:'30-Day Returns',hp_why_return_d:'If something isn\'t right, we take it back — no questions asked. Insured shipping, full refund, personal support.',
  hp_why_global:'Global Sourcing, Local Shipping',hp_why_global_d:'We source worldwide, inspect in London and ship from local EU hubs. Best prices with short delivery times.',
  hp_vs_h:'Aura vs. Marketplaces',hp_vs_video:'Video Inspection',hp_vs_hub:'Hub Quality Check',hp_vs_orig:'Authenticity Guarantee',hp_vs_seal:'Packaging Seal',hp_vs_dach:'Personal DACH Support',hp_vs_ship:'Delivery 2–4 Business Days',
  hp_sust_d:'Every product at Aura is a rescued product. We give branded goods a second life — and conserve resources our planet needs.',
  hp_sust_1:'Conserve Resources',hp_sust_1d:'Up to 90% less CO₂ per product — because we rescue instead of producing new.',
  hp_sust_2:'Verified Quality',hp_sust_2d:'Aura Verified: multi-stage inspection with video documentation for every item.',
  hp_sust_3:'Fair Price',hp_sust_3d:'Branded goods up to 40% cheaper — because shopping sustainably doesn\'t have to be expensive.',
  hp_sust_cta:'Learn more about our mission',
  hp_rev1:'"I was sceptical at first, but the video inspection convinced me immediately. My iPhone arrived in perfect condition and significantly cheaper than in the store. Highly recommended!"',
  hp_rev2:'"Gucci bag in top condition, with original receipt, hub seal and inspection video. The whole process was transparent and professional. Will order here again!"',
  hp_rev3:'"The Dyson Airwrap was sold out everywhere. At Aura I not only got it immediately, but also 15% cheaper. Packaging perfect, hub-checked. Great service!"',
  news_enter_email:'Please enter your email',news_subscribed:'Successfully subscribed! Check your inbox.',news_error:'Error — please reload the page',
  faq_q9:'Why are prices lower than in retail?',faq_a9:'As an international sourcing platform, we buy directly from authorised dealers in various markets. Price differences arise from regional pricing, exchange rates and local promotions. All products are 100% original — the price advantage comes solely from our sourcing strategy, not from inferior quality.',
  faq_q10:'What warranty do I get?',faq_a10:'New items receive 24 months statutory warranty, used items 12 months. Additionally, every product is checked under the Aura Inspection Protocol before shipping. The video inspection report documents the exact condition and serves as a reference in warranty cases.',
  faq_q11:'What payment methods are accepted?',faq_a11:'We accept Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay and Klarna (invoice/installments). All payments are securely processed via Stripe — PCI-DSS Level 1 compliant. Your card details are never stored on our servers.',
  faq_q12:'What does the order status "Sourcing" mean?',faq_a12_intro:'After your payment is received, your order goes through the following statuses:',faq_a12_paid:'<span class="font-bold text-navy">Paid:</span> Payment successfully received.',faq_a12_sourcing:'<span class="font-bold text-navy">Sourcing:</span> We are procuring your product from the authorised dealer. This takes 1–3 business days.',faq_a12_shipped:'<span class="font-bold text-navy">Shipped:</span> The product has been inspected at the hub, video-documented and dispatched.',faq_a12_delivered:'<span class="font-bold text-navy">Delivered:</span> Delivery successfully completed.',
  faq_q13:'Are there customs fees?',faq_a13:'Since we ship from the United Kingdom, customs fees may apply for EU deliveries. For orders to Germany, we handle customs clearance (DDP) in most cases. Separate import regulations apply for Switzerland. Full details on our <a href="/shipping.html" class="text-gold hover:underline font-semibold">shipping page</a>.',
  faq_q14:'Can I cancel my order?',faq_a14:'Yes, orders can be cancelled free of charge until procurement begins (status "Sourcing"). Once the order is in transit, cancellation is no longer possible. In that case, please use our <a href="/returns.html" class="text-gold hover:underline font-semibold">return process</a> with a 30-day return period.',
  faq_q15:'What happens to my data?',faq_a15:'We take data protection seriously and process your data solely for order fulfilment in accordance with GDPR and UK GDPR. Your data will not be shared with third parties for advertising purposes. Detailed information in our <a href="/privacy.html" class="text-gold hover:underline font-semibold">Privacy Policy</a>.',
  faq_q16:'Do you deliver to Switzerland and Austria?',faq_a16:'Yes, we deliver to the entire DACH region and other EU countries. Standard delivery to Austria takes 3–5 business days, to Switzerland 4–6 business days. Free shipping on orders over €99 (Switzerland: from CHF 149).',
  faq_q17:'Where is your warehouse?',faq_a17:'Our main warehouse and inspection centre is in London, United Kingdom. All incoming products are inspected under the Aura Inspection Protocol, video-documented and prepared for shipping. We also use regional logistics partners in Germany for shorter delivery times to the DACH region.',
  faq_q18:'How can I reach customer service?',faq_a18:'You can reach us by email at <a href="mailto:admin@auraglobal-merchants.com" class="text-gold hover:underline">admin@auraglobal-merchants.com</a> or via our <a href="/contact.html" class="text-gold hover:underline font-semibold">contact form</a>. Our support team is available Monday to Friday from 9:00 to 18:00 (CET). We usually respond within 24 hours.',
  sh_s5_h:'Customs & Import Regulations',sh_s5_p1:'As Aura Global Merchants Ltd. ships from the United Kingdom, customs duties and import VAT may apply for deliveries to EU countries. Here you will find all the important information:',
  sh_s5_box1_h:'Deliveries to Germany, Austria & Switzerland',sh_s5_box1_p:'Since Brexit, shipments from the UK to the EU are subject to customs clearance. In most cases, we handle customs clearance in advance (DDP \u2014 Delivered Duty Paid), so no additional costs apply to you.',
  sh_s5_box2_h:'Goods value under \u20ac150',sh_s5_box2_p:'Shipments with a goods value under \u20ac150 are generally exempt from customs duties. However, import VAT (19% in DE, 20% in AT, 7.7% in CH) may apply. We properly declare all shipments with correct values and tariff numbers.',
  sh_s5_box3_h:'Goods value over \u20ac150',sh_s5_box3_p:'Additional customs duties may apply for higher-value shipments. The exact amount depends on the product type and the applicable tariff. Electronics are usually charged at 0%, while textiles and footwear may have higher rates (up to 12%).',
  sh_s5_note:'Note: Switzerland is not an EU member and has its own customs regulations. Shipments to Switzerland are declared separately and are subject to Swiss VAT of 7.7%.',
  sh_s6_h:'Packaging & Product Protection',sh_s6_p1:'Our packaging standards ensure your order arrives safely:',
  sh_s6_card1_h:'Double Cushioning',sh_s6_card1_p:'Electronics and fragile items are protected with double foam padding and air cushions.',
  sh_s6_card2_h:'Tamper Protection',sh_s6_card2_p:'All packages are sealed with security seals that make unauthorised access visible.',
  sh_s6_card3_h:'Sustainable Materials',sh_s6_card3_p:'We use recyclable boxes and plastic-free filling material wherever possible.',
  sh_s6_note:'Designer and luxury goods are shipped in the manufacturer\u2019s original packaging when available. The original packaging is additionally protected in a neutral shipping box.',
  sh_s7_h:'Shipping Insurance',sh_s7_p1:'Every shipment from Aura Global Merchants Ltd. is automatically insured \u2014 at no extra cost:',
  sh_s7_th1:'Goods Value',sh_s7_th2:'Insurance Coverage',sh_s7_th3:'Cost',
  sh_s7_r1c1:'Up to \u20ac500',sh_s7_r1c2:'Full goods value',sh_s7_r1c3:'Included',sh_s7_r2c1:'\u20ac500 \u2013 \u20ac2,000',sh_s7_r2c2:'Full goods value',sh_s7_r2c3:'Included',sh_s7_r3c1:'Over \u20ac2,000',sh_s7_r3c2:'Full goods value + signature delivery',sh_s7_r3c3:'Included',
  sh_s7_note:'In case of loss or damage during transit, we refund the full purchase price or send a replacement. Please report transport damage within 48 hours of receipt with photos to admin@auraglobal-merchants.com.',
  sh_s8_h:'Delivery Options & Notes',sh_s8_sub1_h:'Delivery Attempts',sh_s8_sub1_p:'The carrier makes up to 2 delivery attempts. After the second failed attempt, the parcel is forwarded to a nearby parcel locker or branch.',
  sh_s8_sub2_h:'Safe Place Permission',sh_s8_sub2_p:'If you wish to grant a safe place permission (e.g. at the front door, with a neighbour), you can specify this when ordering. Aura Global Merchants Ltd. is not liable for losses with safe place permission.',
  sh_s8_sub3_h:'Parcel Locker & Post Office',sh_s8_sub3_p:'Delivery to DHL parcel lockers and post offices is possible. Please enter your locker number and postal customer number correctly. Express shipments cannot be delivered to parcel lockers.',
  sh_s8_sub4_h:'Business Deliveries',sh_s8_sub4_p:'Deliveries to business addresses are made during normal business hours (Mon\u2013Fri, 8:00\u201317:00). A phone contact at the delivery location speeds up delivery.',
  sh_s9_h:'Holiday & Seasonal Shipping',sh_s9_p1:'During peak season and on public holidays, delivery times may be extended. We recommend ordering early:',
  sh_s9_ev1_h:'Christmas Season (1\u201324 December)',sh_s9_ev1_p:'Last order date for standard shipping: 15 December. Express: 20 December. Due to higher parcel volumes, delivery times extend by 1\u20133 days.',
  sh_s9_ev2_h:'Black Friday / Cyber Monday',sh_s9_ev2_p:'Increased order volume may cause delays of 1\u20132 business days. Orders are processed on a first-come, first-served basis.',
  sh_s9_ev3_h:'Public Holidays (UK & DE)',sh_s9_ev3_p:'No shipping on UK and German public holidays. Orders are processed on the next business day.',
  returns_h1:'Returns & Refunds',returns_sub:'Transparency and fairness are the cornerstones of our return policy. Thanks to our thorough inspection protocol, we can resolve every case objectively and quickly.',
  returns_trust_title:'Our Promise',returns_trust_text:'Every product leaving our warehouse undergoes a comprehensive video inspection. This documented inspection protocol serves as an objective benchmark for returns \u2014 protecting both your rights as a customer and the integrity of our quality control.',
  returns_conditions_title:'Return Conditions',returns_cond_1:'30-day return policy from the date of delivery \u2014 no reason required.',returns_cond_2:'The product must be returned in its original packaging including all accessories and inserts.',returns_cond_3:'The Aura quality seal must be intact if the product is returned unused.',returns_cond_4:'In case of complaints, the documented video inspection protocol is used as an objective reference.',
  returns_protocol_title:'Inspection Protocol as Benchmark',returns_protocol_p1:'Before shipping, every product undergoes our Aura Inspection Protocol. The condition of the item is documented on video \u2014 from packaging to surface to full functional testing.',returns_protocol_p2:'This protocol is your and our security: Should a discrepancy be reported after delivery, we compare the complained condition with the video documentation. This way we can clearly distinguish transport damage from pre-existing damage and guarantee a fair solution.',returns_protocol_example:'Example: A customer reports a scratch on their iPhone display. However, our inspection video shows a flawless display at the time of shipping \u2192 the damage demonstrably occurred after delivery. In such cases, an individual review takes place in cooperation with the shipping partner.',
  returns_refund_title:'Refund Process',returns_step1_title:'Contact Us',returns_step1_text:'Submit a return request via your customer account or contact our customer service at admin@auraglobal-merchants.com. Provide your order number and reason for return.',returns_step2_title:'Review & Return Label',returns_step2_text:'We review your request within 24 hours and send you a prepaid return label by email. The inspection video is used as reference.',returns_step3_title:'Goods Receipt & Inspection',returns_step3_text:'Once your return arrives at our logistics centre, the item is inspected and compared with the original inspection protocol.',returns_step4_title:'Refund',returns_step4_text:'The refund is processed within 5\u20137 business days after approval to the original payment method. You will receive a confirmation email with all details.',
  returns_exceptions_title:'Exceptions',returns_exceptions_intro:'The following products are excluded from returns:',returns_exc_1:'Hygiene products \u2014 headphones (in-ear), razors, personal care items after opening the hygiene packaging.',returns_exc_2:'Custom-made products \u2014 engravings, personalised items or special orders.',returns_exc_3:'Software & digital products \u2014 after activation of the licence key or opening the packaging.',returns_exc_4:'Gift cards \u2014 non-refundable after activation.',
  ret_s5_h:'Return Step by Step',ret_s5_intro:'Here\u2019s how to return a product easily:',ret_s5_st1_h:'Register Return',ret_s5_st2_h:'Receive Return Label',ret_s5_st3_h:'Pack Product Safely',ret_s5_st4_h:'Drop Off Parcel',ret_s5_st5_h:'Review & Refund',
  ret_s6_h:'Partial Returns & Exchanges',
  ret_s7_h:'Damaged or Defective Goods',ret_s7_alert_h:'Document Immediately on Arrival',ret_s7_alert_p:'If your parcel arrives damaged or a product is defective, please document the condition immediately with photos and contact us within 48 hours.',
  ret_s8_h:'International Returns',ret_s8_th1:'Country',ret_s8_th2:'Free Return?',ret_s8_th3:'Transit to Hub',ret_s8_de:'Germany',ret_s8_de_free:'Yes \u2713',ret_s8_de_time:'3\u20135 business days',ret_s8_at:'Austria',ret_s8_at_free:'Yes \u2713',ret_s8_at_time:'4\u20136 business days',ret_s8_ch:'Switzerland',ret_s8_ch_free:'Partially*',ret_s8_ch_time:'5\u20137 business days',ret_s8_uk:'United Kingdom',ret_s8_uk_free:'Yes \u2713',ret_s8_uk_time:'1\u20132 business days',ret_s8_eu:'EU (other countries)',ret_s8_eu_free:'Yes \u2713',ret_s8_eu_time:'5\u20138 business days',ret_s8_note:'* Returns from Switzerland: Free for warranty cases and transport damage. For withdrawal, the customer bears the return costs (approx. 8\u201312 CHF).',
  ret_s9_h:'Refund Timelines',ret_s9_intro:'Transparency matters to us. Here is an overview of processing times after receipt of your return:',ret_s9_r1_phase:'Receipt at Hub & Quality Check',ret_s9_r1_time:'1\u20133 business days',ret_s9_r2_phase:'Comparison with Inspection Video',ret_s9_r2_time:'1 business day',ret_s9_r3_phase:'Refund Initiated',ret_s9_r3_time:'1\u20132 business days',ret_s9_r4_phase:'Credit Visible in Bank Account',ret_s9_r4_time:'3\u20135 business days',ret_s9_r5_phase:'Credit Visible on Credit Card',ret_s9_r5_time:'5\u201310 business days',ret_s9_r6_phase:'PayPal Refund',ret_s9_r6_time:'1\u20133 business days',ret_s9_note:'Please note that the actual credit to your account depends on your bank or payment provider. If the stated timeframes are exceeded, please contact our customer service.',
  ret_wb_h:'Cancellation Policy',ret_wb_sub_h:'Right of Withdrawal',ret_wb_p1:'You have the right to withdraw from this contract within 14 days without giving any reason.',ret_wb_p2:'The withdrawal period is 14 days from the day on which you or a third party designated by you, who is not the carrier, took possession of the goods.',ret_wb_p3:'To exercise your right of withdrawal, you must inform us',ret_wb_p4:'by means of a clear statement (e.g. a letter sent by post or an email) of your decision to withdraw from this contract. You may use the model withdrawal form below, but it is not mandatory.',ret_wb_p5:'To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.',
  ret_wb_folgen_h:'Consequences of Withdrawal',ret_wb_f1:'If you withdraw from this contract, we shall reimburse to you all payments received from you, including the costs of delivery, without undue delay and no later than 14 days from the day on which we are informed about your decision to withdraw from this contract.',ret_wb_f2:'We shall use the same means of payment as you used for the initial transaction; in no event will you be charged any fees because of such reimbursement.',ret_wb_f3:'We may withhold reimbursement until we have received the goods back or until you have supplied evidence of having sent back the goods, whichever is the earliest.',ret_wb_f4:'You shall send back the goods without undue delay and in any event no later than 14 days from the day on which you communicate your withdrawal from this contract to us.',ret_wb_f5:'Within Germany, Austria, the UK and the EU, Aura Global Merchants Ltd. covers the cost of the return. For returns from Switzerland and third countries, the customer bears the direct cost of returning the goods.',ret_wb_f6:'You are only liable for any diminished value of the goods resulting from handling other than what is necessary to establish the nature, characteristics and functioning of the goods.',
  ret_wf_h:'Model Withdrawal Form',ret_wf_hint:'(If you wish to withdraw from the contract, please complete and return this form.)',ret_wf_to:'To:',ret_wf_p1:'I/we (*) hereby give notice that I/we (*) withdraw from my/our (*) contract of sale of the following goods (*)/for the provision of the following service (*):',ret_wf_p2:'Ordered on (*) / received on (*):',ret_wf_p3:'Name of consumer(s):',ret_wf_p4:'Address of consumer(s):',ret_wf_p5:'Date: _________________ Signature: _________________',ret_wf_note:'(*) Delete as appropriate.',ret_wf_print:'PRINT FORM',
  ret_ra_h:'Return Address',ret_ra_p1:'Please send your returns to:',ret_ra_note:'Please do not send your return until you have received the return label. Unannounced returns cannot be processed.',
  returns_cta_title:'Any Questions?',returns_cta_text:'Our customer service team is available Monday to Friday from 9:00 AM to 6:00 PM. We are happy to help.',returns_cta_track:'TRACK ORDER',returns_cta_contact:'CONTACT',
  imp_tmg_h:'Information pursuant to \u00a7 5 TMG',imp_lbl_company:'Company Name',imp_lbl_legal:'Legal Form',imp_val_legal:'Private Limited Company (Ltd.), registered in England & Wales',imp_lbl_reg:'Registration Number',imp_lbl_seat:'Registered Office',imp_lbl_director:'Director',imp_lbl_email:'Email',imp_lbl_phone:'Phone',imp_lbl_vat:'VAT ID',imp_lbl_authority:'Supervisory Authority',
  imp_responsible_h:'Responsible for Content',
  imp_dispute_h:'Dispute Resolution',imp_dispute_os:'The European Commission provides a platform for online dispute resolution (ODR):',imp_dispute_email:'You can find our email address in the legal notice above.',imp_dispute_no:'We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.',
  imp_disclaimer_h:'Disclaimer',imp_liability_content_h:'Liability for Content',imp_liability_content_p:'The contents of our pages were created with the utmost care. However, we cannot guarantee the accuracy, completeness and timeliness of the content. As a service provider, we are responsible for our own content on these pages under general law pursuant to \u00a7 7(1) TMG.',imp_liability_links_h:'Liability for Links',imp_liability_links_p:'Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot accept any liability for this external content.',imp_copyright_h:'Copyright',imp_copyright_p:'The content and works on these pages created by the site operators are subject to German copyright law. Duplication, processing, distribution and any form of commercialisation beyond the scope of copyright law require the written consent of the respective author or creator.',
  imp_eu_dispute_h:'EU Dispute Resolution',imp_eu_dispute_os:'The European Commission provides a platform for online dispute resolution (ODR).',imp_eu_dispute_email:'You can find our email address in the legal notice above. We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board.',imp_eu_dispute_reg:'Pursuant to Regulation (EU) No 524/2013 of the European Parliament and of the Council, online traders are required to provide a link to the ODR platform.',
  imp_regulatory_h:'Regulatory Information',imp_companies_h:'Companies House (UK)',imp_companies_p:'Aura Global Merchants Ltd. is registered with Companies House of the United Kingdom under the stated registration number.',imp_ico_h:'ICO Registration (Data Protection)',imp_ico_p:'As a company based in the United Kingdom, we are subject to the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.',imp_vat_h:'Value Added Tax',imp_vat_p:'Aura Global Merchants Ltd. is registered for VAT purposes in the United Kingdom.',
  imp_weee_h:'WEEE & Battery Notice',imp_weee_devices_h:'Waste Electrical and Electronic Equipment (WEEE)',imp_weee_devices_p:'Under the WEEE Directive, consumers are required to dispose of waste electrical and electronic equipment separately from household waste.',imp_weee_return_p:'Old devices can be returned free of charge at municipal collection points or at the retailer.',imp_batteries_h:'Batteries and Accumulators',imp_batteries_p:'Under the Battery Regulation (BattG), batteries and accumulators may not be disposed of with household waste.',
  imp_trademark_h:'Trademark Notice',imp_trademark_p1:'All brand names, product names and logos used on this website are the property of their respective owners.',imp_trademark_p2:'Aura Global Merchants Ltd. is an independent retailer and not an authorised dealer.',imp_trademark_p3:'The display of branded goods on this website is in accordance with the principle of exhaustion.',
  imp_contact_h:'Contact & Availability',imp_ct_email:'Email (General)',imp_ct_privacy:'Email (Data Protection)',imp_ct_form:'Contact Form',imp_ct_hours:'Service Hours',imp_ct_hours_val:'Mon\u2013Fri, 9:00 AM\u20136:00 PM (CET)',imp_ct_response:'Response Time',imp_ct_response_val:'Usually within 24 hours',
  story_h1:'Our Story',story_sub:'How a simple question created a new standard for transparency in online retail.',
  story_f_label:'The Beginning',story_f_h:'\u201cWhy can\u2019t customers see what they\u2019re buying?\u201d',story_f_p1:'It began with a simple observation: In a world where transparency has become the highest value, millions of people buy premium electronics \u2014 trusting only product photos and reviews from strangers.',story_f_p2:'In spring 2023, a team led by Daniel Hartmann founded Aura Global Merchants Ltd. in London \u2014 with the goal of fundamentally solving this trust problem.',story_f_p3:'The idea was radically simple: Before a product reaches the customer, it is opened, inspected, and the entire process is documented on video by our team in London.',story_f_p4:'This is how the Aura Inspection Protocol was born \u2014 a three-step verification process that documents the authenticity, functionality, and sealing of every single device.',story_f_quote:'\u201cEvery device deserves an honest first impression.\u201d',story_f_attr:'\u2014 Daniel Hartmann, Founder & Director',
  story_v_label:'Our Values',story_v_h:'What Drives Us',story_v1_h:'Transparency',story_v1_p:'Every product is inspected and documented on video \u2014 full visibility into the actual condition.',story_v2_h:'Quality',story_v2_p:'Our 3-point protocol checks authenticity, functionality, and sealing of every single device.',story_v3_h:'Trust',story_v3_p:'30-day return policy and an inspection that serves as a reference \u2014 for a relationship on equal terms.',story_v4_h:'Innovation',story_v4_p:'We continuously improve our processes \u2014 new technologies, better testing procedures, faster shipping.',
  story_tl_label:'Milestones',story_tl_h:'Our Journey',story_tl1_h:'Founded in London',story_tl1_p:'Aura Global Merchants Ltd. is registered as a Private Limited Company in England & Wales. The first inspection team begins work at the London warehouse.',story_tl2_h:'10,000+ Verified Units',story_tl2_p:'A significant milestone: Over 10,000 products have been tested according to the Aura Inspection Protocol and shipped to satisfied customers.',story_tl3_h:'Expansion into the DACH Region',story_tl3_p:'Aura Global expands its focus to the German-speaking market. New logistics partners, localised support, and optimised supply chains.',
  story_team_label:'The Team',story_team_h:'The People Behind Aura',story_t1_role:'Founder & CEO',story_t1_desc:'Visionary behind the Aura Inspection Protocol. Over 8 years of experience in international trade.',story_t2_role:'Head of DACH Expansion',story_t2_desc:'Responsible for the German-speaking market and local customer relations.',story_t3_role:'Quality Inspector',story_t3_desc:'Leads the inspection team at the London hub. Every product goes through his verification process.',story_t4_role:'Customer Service',story_t4_desc:'Multilingual support team. Quick responses in DE, EN, FR, ES, IT, and PL.',
  story_mv_label:'Our Vision',story_mv_h:'Mission & Vision',story_mv_mission_h:'Mission',story_mv_mission_p:'We make premium branded goods accessible to everyone \u2014 regardless of location or income.',story_mv_vision_h:'Vision',story_mv_vision_p:'By 2027, we aim to be the most trusted platform for verified branded goods in Europe.',story_mv_sustain_h:'Sustainability',story_mv_sustain_p:'We believe that responsible commerce and economic success are compatible:',story_mv_s1:'Recycled Packaging: 85% of our shipping materials are made from recycled materials.',story_mv_s2:'CO\u2082-Optimised Shipping: Consolidation of shipments reduces unnecessary individual deliveries.',story_mv_s3:'Longevity over Throwaway Culture: Through rigorous quality control, we ensure products reach their full lifecycle.',
  story_stats_label:'Aura in Numbers',story_stats_h:'Facts & Figures',story_st1_num:'10,000+',story_st1_lbl:'Verified Products',story_st2_num:'120+',story_st2_lbl:'Premium Brands',story_st3_num:'99.8%',story_st3_lbl:'Customer Satisfaction',story_st4_num:'15+',story_st4_lbl:'Delivery Countries',story_st5_num:'2\u20134',story_st5_lbl:'Business Days Delivery (DACH)',story_st6_num:'30',story_st6_lbl:'Days Return Policy',story_st7_num:'24h',story_st7_lbl:'Max. Support Response Time',
  story_q_label:'Our Promise',story_q_h:'Quality Standards',story_q1_h:'100% Genuine Products',story_q1_p:'Every product is checked for authenticity and matched against manufacturer records.',story_q2_h:'Video Documentation',story_q2_p:'The entire inspection process is recorded on video \u2014 your quality guarantee.',story_q3_h:'Guaranteed Satisfaction',story_q3_p:'30-day return policy, full refund on eligible returns.',story_q4_h:'Secure Sourcing',story_q4_p:'We source exclusively from authorised wholesalers and verified suppliers.',
  story_cta_h:'Experience the Difference',story_cta_p:'Discover our selection of verified premium branded goods.',story_cta_btn:'BROWSE CATALOGUE',
  src_hero_badge:'Transparency & Origin',src_hero_sub:'Every product in our shop has a traceable story. We show you the complete journey \u2014 from liquidation to your doorstep.',src_hero_stat1_label:'Steps to you',src_hero_stat2_label:'Transparent',src_hero_stat3_label:'Counterfeits',
  src_intro_h2:'Where does our stock come from?',src_intro_p1:'Aura Global Merchants purchases liquidation inventory, customer returns and overproduction directly from authorised wholesalers and retail giants. We work exclusively with verified, legal sources \u2014 no grey imports, no counterfeits, no stolen goods.',src_intro_p2:'Our suppliers: Authorised liquidators of major retail chains in the USA, UK and the EU.',
  src_journey_badge:'The Product Journey',src_journey_h2:'4 Steps. Full Transparency.',
  src_s1_h3:'Liquidation Purchase',src_s1_sub:'Purchasing from authorised retail partners',src_s1_p2:'Aura Global participates in these B2B auctions and acquires batches of electronics, fashion, household goods and outdoor equipment \u2014 directly from the source, with full documentation.',src_s1_sources_h4:'Our Sources',src_s1_card_title:'Liquidation Auction Platforms',src_s1_card_tag1:'MANIFEST VERIFIED',src_s1_card_tag2:'ORIGINAL RECEIPTS',
  src_s2_card_title:'International Transport',src_s2_card_hub1:'New Jersey Hub',src_s2_card_route:'Sea / Air',src_s2_card_hub2:'London Hub',src_s2_h3:'Transport to Hub',src_s2_sub:'Logistics chain with full customs documentation',src_s2_p2:'For EU shipments, customs clearance is carried out under UK import law. We work with licensed customs agents who ensure seamless compliance.',src_s2_docs_h4:'Documents per Shipment',src_s2_doc1:'Commercial Invoice',src_s2_doc2:'Packing List',src_s2_doc3:'Bill of Lading',src_s2_doc4:'Certificate of Origin',src_s2_doc5:'Customs Declaration',
  src_s3_h3:'Aura Inspection',src_s3_sub:'Multi-stage quality control at the London hub',src_s3_intro:'Every single product goes through our multi-stage inspection protocol. Our trained team checks:',src_s3_chk1_title:'Visual Inspection',src_s3_chk1_desc:'Condition of casing, display, ports. Scratches, dents, colour deviations documented.',src_s3_chk2_title:'Functional Test',src_s3_chk2_desc:'Power on, reset, connectivity, all buttons/ports. For clothing: seams, zippers, fabric quality.',src_s3_chk3_title:'Video Documentation',src_s3_chk3_desc:'360\u00b0 inspection video is created for every product and stored in the shop.',src_s3_chk4_title:'Condition Grading',src_s3_chk4_desc:'Rating: A+ (Like New) / A (Minimal) / B (Visible Traces). Only A+ and A make it to the shop.',
  src_s3_card_title:'Aura Verified',src_s3_card_sub:'Only inspected goods receive our quality seal',src_s3_card_pass_lbl:'Pass rate',src_s3_card_time_lbl:'Average inspection time',src_s3_card_time_val:'12 min',src_s3_card_pts_lbl:'Checkpoints per item',src_s3_card_note:'Failed items are forwarded to certified recycling partners.',
  src_s4_card_title:'Up to 40% cheaper',src_s4_card_sub:'Compared to RRP via retail',src_s4_card_retail:'Retail (RRP)',src_s4_card_aura:'Aura Direct',src_s4_h3:'Sale at a Discount',src_s4_sub:'Brand quality at fair prices',src_s4_p2:'For every item you can see: Condition Grade, inspection video, original retailer, and an honest condition report \u2014 no fine print, no hidden defects.',src_s4_feat1:'30-Day Returns',src_s4_feat2:'Secure Payment',src_s4_feat3:'Free shipping from \u00a399',src_s4_feat4:'EN Support Team',
  src_legal_badge:'100% Legal',src_legal_h2:'Legal Trade, Full Transparency',src_legal_c1_title:'Companies House UK',src_legal_c1_sub:'Registered & Active',src_legal_c2_title:'Import Licences',src_legal_c2_sub:'HMRC registered',src_legal_c3_title:'GDPR / UK GDPR',src_legal_c3_sub:'ICO compliant',
  src_cta_h2:'See for yourself',src_cta_p:'Browse our range and discover verified branded goods with full transparency \u2014 at prices that make sense.',src_cta_shop:'SHOP NOW',src_cta_sustainability:'SUSTAINABILITY \u2192',
  nh_hero_badge:'Our Responsibility',nh_hero_desc:'Every product at Aura is a rescued product. We give premium branded goods a second life \u2014 conserving resources our planet urgently needs.',nh_hero_stat1_val:'15%',nh_hero_stat1_label:'Electronics returned due to opened packaging',nh_hero_stat2_val:'82 kg',nh_hero_stat2_label:'CO\u2082 saved per rescued smartphone',nh_hero_stat3_val:'3,400+',nh_hero_stat3_label:'Products rescued from disposal',nh_hero_stat4_val:'0',nh_hero_stat4_label:'Items go to landfill',
  nh_problem_label:'The Problem',nh_problem_title:'Millions of perfect products end up in the bin',nh_problem_p1:'Every year, millions of electronics, fashion items and household goods are classified as \u201cunsellable\u201d worldwide \u2014 not because they\u2019re defective, but because their packaging was opened, a scratch is on the case, or the return period has expired.',
  nh_stats_title:'Annual Returns Statistics (EU)',nh_stats_bar1_label:'Electronics (opened packaging)',nh_stats_bar1_val:'15.2%',nh_stats_bar2_label:'Fashion (fit / colour)',nh_stats_bar2_val:'22.8%',nh_stats_bar3_label:'Household (damaged packaging)',nh_stats_bar3_val:'9.6%',nh_stats_bar4_label:'Of which: physically defective',nh_stats_bar4_val:'only 3.1%',nh_stats_source:'Source: European E-Commerce Report 2024, RetailX Research',
  nh_solution_label:'Our Solution',nh_solution_title:'Aura Circular Economy',nh_solution_desc:'We catch what retail throws away \u2014 and give it back to you with a quality guarantee.',nh_step1_title:'1. Intercept',nh_step1_desc:'We purchase return goods and liquidation inventory directly from major retailers \u2014 before they are destroyed.',nh_step2_title:'2. Inspect',nh_step2_desc:'Every product goes through the Aura Inspection at our London hub \u2014 visual, functional, and documented on video.',nh_step3_title:'3. Certify',nh_step3_desc:'Passed inspection = Aura Verified seal. Transparent condition report for every item.',nh_step4_title:'4. Second Life',nh_step4_desc:'You buy brand quality at up to 40% less \u2014 and at the same time rescue a product from the landfill.',
  nh_eco_label:'Eco Statistics',nh_eco_title:'What you save with a purchase at Aura',nh_eco_desc:'New production vs. Open Box: the ecological comparison per device.',nh_eco_co2_title:'CO\u2082 Emissions',nh_eco_co2_new_label:'New production',nh_eco_co2_new_val:'82 kg CO\u2082',nh_eco_co2_aura_label:'Aura Open Box',nh_eco_co2_aura_val:'8 kg CO\u2082',nh_eco_co2_saving:'\u221290%',nh_eco_co2_note:'less CO\u2082 per smartphone',
  nh_eco_water_title:'Water Consumption',nh_eco_water_new_label:'New production',nh_eco_water_new_val:'12,760 L',nh_eco_water_aura_label:'Aura Open Box',nh_eco_water_aura_val:'0 L',nh_eco_water_saving:'\u2212100%',nh_eco_water_note:'no additional water consumption',
  nh_eco_raw_title:'Raw Materials',nh_eco_raw_new_label:'New production',nh_eco_raw_new_val:'62+ Minerals',nh_eco_raw_aura_label:'Aura Open Box',nh_eco_raw_aura_val:'0 new',nh_eco_raw_saving:'\u2212100%',nh_eco_raw_note:'no rare earth mining required',
  nh_manifesto_quote:'\u201cWe believe in technology that lasts \u2014 not waste that accumulates.\u201d',nh_manifesto_text:'Our manifesto is simple: Every product deserves a chance. Every purchase at Aura is a statement against throwaway culture and a contribution to a future where quality and sustainability are not opposites.',nh_manifesto_author:'Pavlo Potomkin',nh_manifesto_role:'Founder & Director, Aura Global Merchants Ltd.',
  nh_quality_label:'Quality Promise',nh_quality_title:'Sustainability Without Compromise',nh_quality_video_title:'Video Inspection',nh_quality_video_desc:'Every product is filmed during incoming inspection. You can watch the inspection video before purchasing.',nh_quality_return_title:'30-Day Return Policy',nh_quality_return_desc:'Not satisfied? Full refund within 30 days \u2014 no ifs or buts.',nh_quality_verified_title:'Aura Verified Seal',nh_quality_verified_desc:'Our multi-stage inspection process guarantees: What bears the seal works flawlessly.',nh_quality_report_title:'Transparent Condition Report',nh_quality_report_desc:'For every product there is an honest condition report \u2014 with photos, rating, and any signs of use.',nh_quality_shipping_title:'Climate-Neutral Shipping',nh_quality_shipping_desc:'We use recycled packaging materials and offset the CO\u2082 emissions of every delivery.',nh_quality_partner_title:'Partner Network',nh_quality_partner_desc:'Cooperation with certified recycling partners for items that don\u2019t pass our quality inspection.',
  nh_cta_title:'Join in. Shop consciously.',nh_cta_desc:'Every order at Aura is a contribution to the circular economy. Browse our verified products and experience that sustainability and quality belong together.',nh_cta_discover:'DISCOVER NOW',nh_cta_sourcing:'HOW WE SOURCE \u2192',
  prv_hero_title:'Privacy Policy',prv_hero_sub:'Information on the protection of your personal data in accordance with GDPR',
  prv_s1_title:'1. Data Controller',prv_s1_p1:'The data controller within the meaning of the General Data Protection Regulation (GDPR), the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018 is:',
  prv_s2_title:'2. Collection and Storage of Personal Data',prv_s2_p1:'We collect personal data when you voluntarily provide it to us as part of your use of our website. This includes in particular:',prv_s2_p2:'In addition, technical data is automatically collected when you use the website (IP address, browser type, operating system, access time, pages visited). This data is not combined with other data sources.',
  prv_s3_title:'3. Purpose of Data Processing',prv_s3_p1:'We process your personal data for the following purposes:',
  prv_s4_title:'4. Disclosure to Third Parties',prv_s4_p1:'Personal data is only disclosed to third parties if this is necessary for contract fulfilment:',prv_s4_p2:'We do not sell your data to third parties. Data will not be shared with third parties for advertising purposes without your explicit consent.',
  prv_s5_title:'5. Cookies',prv_s5_p1:'Our website exclusively uses technically necessary cookies. These are required for the basic functionality of the website and cannot be deactivated.',prv_s5_p2:'The following cookies are used:',prv_s5_th1:'Cookie',prv_s5_th2:'Purpose',prv_s5_th3:'Duration',prv_s5_c1_purpose:'Session identification',prv_s5_c1_dur:'Session',prv_s5_c2_purpose:'Language preference',prv_s5_c2_dur:'1 year',prv_s5_c3_purpose:'Shopping cart contents',prv_s5_c3_dur:'30 days',
  prv_s6_title:'6. Your Rights',prv_s6_p1:'Under GDPR, you have the following rights regarding your personal data:',
  prv_s7_title:'7. Data Security',prv_s7_p1:'We employ technical and organisational security measures to protect your data against manipulation, loss, destruction or access by unauthorised persons.',prv_s7_p2:'Our security measures include:',
  prv_s8_title:'8. Changes to This Privacy Policy',prv_s8_p1:'We reserve the right to amend this privacy policy so that it always complies with current legal requirements or to implement changes to our services.',prv_s8_p2:'The current version can always be found on this page.',prv_s8_p3:'Last updated: July 2025',
  prv_s9_title:'9. Contact',prv_s9_p1:'For data protection enquiries, please contact us at:',
  prv_s10_title:'10. Data Retention and Storage Periods',prv_s10_p1:'We only store your personal data for as long as is necessary to achieve the respective purpose or as required by statutory retention obligations. The following periods apply in detail:',prv_s10_th1:'Data Type',prv_s10_th2:'Retention Period',prv_s10_th3:'Legal Basis',prv_s10_r1c1:'Customer account data',prv_s10_r1c2:'Until account deletion',prv_s10_r1c3:'Art. 6(1)(b) GDPR',prv_s10_r2c1:'Order data',prv_s10_r2c2:'10 years (tax law)',prv_s10_r2c3:'Art. 6(1)(c) GDPR',prv_s10_r3c1:'Invoice data',prv_s10_r3c2:'10 years (HGB, AO)',prv_s10_r3c3:'\u00a7 147 AO, \u00a7 257 HGB',prv_s10_r4c1:'Communication data',prv_s10_r4c2:'3 years after last contact',prv_s10_r4c3:'Art. 6(1)(f) GDPR',prv_s10_r5c1:'Server log files',prv_s10_r5c2:'90 days',prv_s10_r5c3:'Art. 6(1)(f) GDPR',prv_s10_r6c1:'Video inspection records',prv_s10_r6c2:'12 months after delivery',prv_s10_r6c3:'Art. 6(1)(b) GDPR',prv_s10_p2:'After expiry of the respective retention period, your data will be routinely deleted or anonymised, provided it is no longer required for contract fulfilment or enforcement of contractual claims.',
  prv_s11_title:'11. International Data Transfers',prv_s11_p1:'Our company is based in the United Kingdom. In the course of our business activities, it may be necessary to transfer data to third countries. We ensure that an adequate level of data protection is guaranteed:',prv_s11_p2:'Upon request, we will gladly provide you with a copy of the respective standard contractual clauses.',
  prv_s12_title:'12. Automated Decision-Making and Profiling',prv_s12_p1:'We do not use automated decision-making including profiling pursuant to Art. 22 GDPR that has legal effect on you or similarly significantly affects you.',prv_s12_p2:'Where we analyse anonymised usage data (e.g. to identify popular product categories), this serves exclusively to improve our offering and has no individual impact on you.',
  prv_s13_title:'13. Processing of Payment Data',prv_s13_p1:'The processing of your payment data is carried out exclusively by our PCI-DSS-certified payment service provider. We ourselves never store your complete credit card or bank data on our servers.',prv_s13_p2:'Specifically, we process the following data in connection with payments:',prv_s13_li1:'Payment method (e.g. Visa, Mastercard, PayPal)',prv_s13_li2:'Last four digits of the card number (for identification)',prv_s13_li3:'Transaction ID and timestamp',prv_s13_li4:'Payment status (successful, failed, refunded)',prv_s13_li5:'Billing address and delivery address',prv_s13_p3:'All payment data is transmitted via a TLS 1.3 encrypted connection. Stripe as payment processor is PCI-DSS Level 1 certified.',
  prv_s14_title:'14. Protection of Minors',prv_s14_p1:'Our services are not directed at persons under 16 years of age. We do not knowingly collect personal data from children. Should we learn that a child under 16 has provided us with personal data, we will delete it immediately.',prv_s14_p2:'Parents or legal guardians who believe their child may have provided us with personal data can contact us at any time to arrange deletion of this data.',
  prv_s15_title:'15. Newsletter and Marketing Communications',prv_s15_p1:'If you subscribe to our newsletter, we process your email address on the basis of your consent (Art. 6(1)(a) GDPR) and your first and last name (optional).',prv_s15_p2:'Our newsletter is sent via an email service provider based in the EU. When subscribing to the newsletter, we use the so-called double opt-in procedure: after registration, you will receive an email with a confirmation link. Your registration only becomes effective after clicking this link.',prv_s15_p3:'You can revoke your consent at any time by clicking the unsubscribe link at the end of each newsletter or by contacting us via email. The lawfulness of processing carried out prior to revocation remains unaffected.',prv_s15_p4:'As part of the newsletter dispatch, we store the following data:',prv_s15_li1:'Email address and name',prv_s15_li2:'Time of registration (timestamp and IP address as proof)',prv_s15_li3:'Confirmation time (double opt-in)',prv_s15_li4:'If applicable, open and click rates (anonymised for optimisation)',
  prv_s16_title:'16. Data Protection Officer',prv_s16_p1:'Due to the size of our company, we are currently not required to appoint a data protection officer. Nevertheless, we take data protection very seriously and have established internal processes to ensure GDPR compliance.',prv_s16_p2:'For all data protection enquiries, our data protection team is available at the following address:',prv_s16_p4:'We endeavour to respond to your enquiry within 30 days. For complex enquiries, this period may be extended by up to two further months, about which we will inform you.',
  agb_hero_title:'General Terms and Conditions (GTC)',agb_hero_sub:'of Aura Global Merchants Ltd. \u2014 as of February 2025',
  agb_s1_title:'\u00a7 1 Scope',agb_s1_p1:'(1) These General Terms and Conditions (hereinafter \u201cGTC\u201d) apply to all orders placed via the website auraglobal-merchants.com (hereinafter \u201cPlatform\u201d).',agb_s1_p2:'(2) The provider is Aura Global Merchants Ltd., 71-75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom, registered in England & Wales under Company Number 15847293 (hereinafter \u201cAura Global\u201d or \u201cwe\u201d).',agb_s1_p3:'(3) Aura Global acts as a marketplace intermediary that guarantees the authenticity and quality of the products offered through its own inspection process.',agb_s1_p4:'(4) Deviating terms of the customer are not recognised unless Aura Global expressly agrees to their validity in writing.',
  agb_s2_title:'\u00a7 2 Conclusion of Contract',agb_s2_p1:'(1) The presentation of products on the Platform does not constitute a legally binding offer, but an invitation to submit an offer (invitatio ad offerendum).',agb_s2_p2:'(2) By clicking the \u201cPlace binding order\u201d button, the customer submits a binding purchase offer.',agb_s2_p3:'(3) Aura Global confirms receipt of the order by automated email (receipt confirmation). This does not yet constitute acceptance of the offer.',agb_s2_p4:'(4) The contract is only concluded by sending the order confirmation by email or by delivery of the goods.',
  agb_s3_title:'\u00a7 3 Prices and Payment',agb_s3_p1:'(1) All prices stated on the Platform are final prices in euros (EUR) and include statutory VAT.',agb_s3_p2:'(2) Shipping costs are shown separately and are to be borne by the customer unless otherwise stated. For orders over \u20ac99, standard delivery within Germany is free of charge.',agb_s3_p3:'(3) The following payment methods are available:',agb_s3_li1:'Visa',agb_s3_li2:'Mastercard',agb_s3_li3:'American Express',agb_s3_li4:'PayPal',agb_s3_li5:'Apple Pay',agb_s3_li6:'Google Pay',agb_s3_li7:'Klarna (Invoice / Instalment)',agb_s3_stripe:'Payment processing is handled by the certified payment service provider Stripe, Inc. (PCI DSS Level 1). Card data is never stored on our servers.',agb_s3_p4:'(4) Payment is due immediately upon order completion. The charge is made at the time of order confirmation.',
  agb_s4_title:'\u00a7 4 Aura Inspection Protocol',agb_s4_p1:'(1) Every product offered on the Platform undergoes the \u201cAura Inspection Protocol\u201d before shipping \u2014 a three-stage quality check:',agb_s4_p2:'(2) The entire inspection process is documented by video. This video documentation serves as a binding quality reference for the condition of the product at the time of shipping.',agb_s4_p3:'(3) The customer is granted access to the inspection documentation of their specific product upon request.',
  agb_s5_title:'\u00a7 5 Delivery',agb_s5_p1:'(1) Delivery is made from local warehouses in Germany and the United Kingdom.',agb_s5_p2:'(2) Standard delivery: 2\u20134 working days. Express delivery: 1\u20132 working days (for an additional charge).',agb_s5_p3:'(3) Shipping partners are DHL and UPS. The customer receives a tracking number by email after dispatch.',agb_s5_p4:'(4) Deliveries are made exclusively to the delivery address specified by the customer. Changes to the delivery address are only possible before dispatch.',agb_s5_p5:'(5) If the customer is unavailable at the time of delivery, the shipping service provider leaves a notification. The costs of re-delivery are borne by the customer.',
  agb_s5a_title:'\u00a7 5a Retention of Title',agb_s5a_p1:'(1) The delivered goods remain the property of Aura Global Merchants Ltd. until full payment of the purchase price including all ancillary costs.',agb_s5a_p2:'(2) The customer is obliged to treat the reserved goods with care. In particular, they are obliged to insure them at their own expense against theft, fire and water damage at replacement value.',agb_s5a_p3:'(3) In the event of seizures or other interventions by third parties, the customer must notify us immediately in writing.',
  agb_s5b_title:'\u00a7 5b Transfer of Risk',agb_s5b_p1:'(1) For consumers, the risk of accidental loss and accidental deterioration of the goods only passes to the customer upon handover of the goods \u2014 also in the case of mail order.',agb_s5b_p2:'(2) Handover is equivalent if the customer is in default of acceptance.',
  agb_s6_title:'\u00a7 6 Right of Withdrawal',agb_s6_h3_notice:'Cancellation Policy',agb_s6_h4_right:'Right of Withdrawal',agb_s6_h4_consequences:'Consequences of Withdrawal',agb_s6_h4_exclusion:'Exclusion of Right of Withdrawal',agb_s6_exclusion_p:'The right of withdrawal does not apply to contracts for the delivery of:',agb_s6_ex_li1:'Goods made to customer specifications or clearly tailored to personal needs;',agb_s6_ex_li2:'sealed goods that are not suitable for return for reasons of health protection or hygiene and whose seal has been removed after delivery;',agb_s6_ex_li3:'goods that have been inseparably mixed with other goods after delivery due to their nature;',agb_s6_ex_li4:'audio or video recordings or computer software in a sealed package, if the seal has been removed after delivery.',
  agb_s7_title:'\u00a7 7 Warranty',agb_s7_p1:'(1) Statutory warranty rights apply.',agb_s7_p2:'(2) Defects must be reported immediately after discovery by email to admin@auraglobal-merchants.com, stating the order number.',agb_s7_p3:'(3) In the event of disagreement about the condition of the delivered goods, the video documentation of the Aura Inspection Protocol serves as the binding reference for the condition at the time of shipping.',agb_s7_p4:'(4) The warranty period for new goods is 24 months from delivery. For used goods, the warranty period is reduced to 12 months from delivery.',
  agb_s8_title:'\u00a7 8 Limitation of Liability',agb_s8_p1:'(1) Aura Global is liable without limitation for damages arising from injury to life, body or health, as well as for damages caused intentionally or through gross negligence.',agb_s8_p2:'(2) In the case of slight negligence, Aura Global is only liable for breach of essential contractual obligations (cardinal obligations). Liability in this case is limited to the foreseeable, contract-typical damage.',agb_s8_p3:'(3) The above limitations of liability do not apply to claims under the Product Liability Act or when a guarantee has been assumed.',
  agb_s9_title:'\u00a7 9 Data Protection',agb_s9_p2:'(2) The customer agrees to the processing of their personal data in accordance with the privacy policy, insofar as this is necessary for contract fulfilment.',
  agb_s10_title:'\u00a7 10 Final Provisions',agb_s10_p1:'(1) The law of England and Wales applies, excluding the UN Convention on Contracts for the International Sale of Goods (CISG). For consumers habitually resident in the EU, this choice of law only applies insofar as it does not restrict mandatory consumer protection provisions of the country of residence.',agb_s10_p2:'(2) Should individual provisions of these GTC be or become invalid or unenforceable, the validity of the remaining provisions shall not be affected. An effective provision that comes closest to the economic purpose of the invalid provision shall take its place.',agb_s10_p3:'(3) The contractual language is German.',
  agb_s11_title:'\u00a7 11 Intellectual Property and Trademark Rights',agb_s11_p1:'(1) All content on the Aura Global Merchants Ltd. website, including texts, graphics, logos, icons, images, audio and video clips, data collections and software, are the property of Aura Global Merchants Ltd. or its licensors and are protected by international copyright and trademark laws.',agb_s11_p2:'(2) Third-party trademarks, logos and trade names displayed on this website (e.g. Apple, Nike, Gucci, Samsung etc.) are the property of the respective trademark owners. Their display on our website is solely for the purpose of identifying the original products offered and does not constitute a recommendation, sponsorship or approval by the trademark owners.',agb_s11_p3:'(3) Any unauthorised use, reproduction, distribution, transmission, publication or processing of the content on this website is prohibited and may result in civil and criminal consequences.',agb_s11_p4:'(4) Customers may download or print individual pages of the website for personal, non-commercial use, provided no copyright or proprietary notices are removed.',
  agb_s12_title:'\u00a7 12 Customer Account and User Obligations',agb_s12_p1:'(1) Creating a customer account is required to place orders with Aura Global Merchants Ltd. During registration, the customer is obliged to provide truthful and complete information and to update it immediately in the event of changes.',agb_s12_p2:'(2) The customer is responsible for maintaining the confidentiality of their login credentials (email address and password). They are liable for all activities carried out under their customer account, unless they are not responsible for the misuse.',agb_s12_p3:'(3) In the event of suspected unauthorised use of their account, the customer must inform us immediately. We reserve the right to temporarily suspend customer accounts if there is reasonable suspicion of misuse.',agb_s12_p4:'(4) Only one customer account may be created per person. Transfer of customer accounts to third parties is not permitted.',agb_s12_p5:'(5) The customer can have their customer account deleted at any time via account settings or by notifying our customer service. Deletion will be carried out within 30 days. Statutory retention obligations remain unaffected.',
  agb_s13_title:'\u00a7 13 Video Inspection Record',agb_s13_p1:'(1) Every product sold via Aura Global Merchants Ltd. is video-documented as part of our Aura Inspection Protocol. The video inspection record is an integral part of our quality assurance process.',agb_s13_p2:'(2) The video shows the condition of the product at the time of inspection at the hub, including packaging, accessories, functionality and any external defects. It serves as an objective proof of the product condition.',agb_s13_p3:'(3) In the event of a complaint or return request, the video inspection record is used as a reference for the condition at the time of shipping. Deviations from the documented condition that are not attributable to normal transport may affect the refund.',agb_s13_p4:'(4) Video inspection records are stored for 12 months after delivery. The customer has access to their inspection video at any time upon request.',agb_s13_p5:'(5) The videos are used exclusively for the aforementioned quality assurance and warranty purposes and are not shared with third parties.',
  agb_s14_title:'\u00a7 14 Prohibited Use',agb_s14_p1:'(1) Use of our website and services for the following purposes is prohibited:',agb_s14_li1:'Orders for the purpose of commercial resale without prior written permission',agb_s14_li2:'Manipulation of reviews, prices or inventory information',agb_s14_li3:'Use of automated systems (bots, scrapers, crawlers) to extract data',agb_s14_li4:'Initiating denial-of-service attacks or other impairments of the infrastructure',agb_s14_li5:'Use of false or misleading identities during registration',agb_s14_li6:'Orders using stolen or unauthorised payment methods',agb_s14_p2:'(2) In the event of violation of the above provisions, we reserve the right to cancel orders, permanently block customer accounts and assert civil law claims.',
  agb_s15_title:'\u00a7 15 Dispute Resolution',agb_s15_p2:'(2) We are not obliged and not willing to participate in a dispute resolution procedure before a consumer arbitration board pursuant to the Consumer Dispute Resolution Act.',agb_s15_p3:'(3) Notwithstanding, the consumer retains the right to take legal action. For consumers resident in the EU, the place of jurisdiction is at the consumer\u2019s domicile, registered office or place of residence.',
  agb_s16_title:'\u00a7 16 Force Majeure',agb_s16_p1:'(1) Aura Global Merchants Ltd. is not liable for non-fulfilment or delayed fulfilment of contractual obligations, insofar as the non-fulfilment or delay is attributable to events of force majeure.',agb_s16_p2:'(2) Events of force majeure include, among others: natural disasters, pandemics, wars, acts of terrorism, strikes, official orders, supply chain disruptions, power outages, cyber-attacks or comparable events beyond our reasonable control.',agb_s16_p3:'(3) In the event of force majeure, we will inform the customer immediately and make every effort to minimise the impact. If the event lasts longer than 60 days, either party is entitled to withdraw from the contract.',
  kr_c1_b1_desc:'Money without delays \u2014 via bank transfer. Every week.',kr_c1_b1_title:'Weekly Payout',kr_c1_b2_desc:'Real growth potential to Head of Operations within 6\u201312 months.',kr_c1_b2_title:'Career Boost',kr_c1_b3_desc:'Official collaboration within the structure of British Aura Global Merchants Ltd.',kr_c1_b3_title:'Global Status',kr_c1_badge:'STRATEGIC ROLE',kr_c1_cta:'APPLY NOW',kr_c1_earn_label:'Compensation',kr_c1_h_benefits:'What We Offer',kr_c1_h_profile:'Your Profile',kr_c1_h_role:'Your Role',kr_c1_h_tasks:'Your Core Tasks',kr_c1_meta_apps:'12 Applications',kr_c1_meta_date:'Posted: Today',kr_c1_sub:'DACH Region \u2014 Remote',kr_c1_t1_desc:'Remote coordination and audit of regional partners (Brand Ambassadors) in your assigned sector.',kr_c1_t1_title:'Hub Control',kr_c1_t2_desc:'Final check of video inspection protocols: serial number matching, verification of authenticity and integrity of Aura seals.',kr_c1_t2_title:'Quality Verification',kr_c1_t3_desc:'Work in the internal CRM \u00abAura Hub\u00bb: monitoring delivery deadlines, real-time status management of all orders.',kr_c1_t3_title:'Logistics Management',kr_c1_t4_desc:'Direct reporting to the Operations department in London to optimise regional supply chains.',kr_c1_t4_title:'Reporting',kr_c1_tag1:'REMOTE \u2014 DACH',kr_c1_tag2:'FULL-TIME / FREELANCE',kr_c1_tag3:'IMMEDIATELY AVAILABLE',kr_c1_title:'Logistics Coordinator (m/f/d)',
  kr_c2_a1_desc:'Film a video of the \u00abFirst Contact\u00bb (First Impression) according to Aura standards for our social media.',kr_c2_a1_title:'Unboxing Experience',kr_c2_a2_desc:'Short video call with your coordinator (Logistics Coordinator) for final inspection verification.',kr_c2_a2_title:'Live Check-In',kr_c2_a3_title:'Decision Point',kr_c2_badge:'HOT \u2014 ACTIVE SEARCH',kr_c2_cta:'APPLY NOW',kr_c2_earn_label:'Compensation per Inspection',kr_c2_h_algo:'Your Algorithm of Success',kr_c2_h_profile:'What You Bring',kr_c2_h_reward:'Triple Reward \u2014 3 Levels per Unit',kr_c2_h_why:'Why This Role?',kr_c2_meta_apps:'23 Applications',kr_c2_meta_date:'Posted: Today',kr_c2_r1_desc:'Per technical inspection and video report. Direct payout.',kr_c2_r1_label:'Cash-Back',kr_c2_r2_desc:'Additional voucher for our exclusive internal store.',kr_c2_r2_label:'Aura Voucher',kr_c2_r3_amount:'up to 50% Discount',kr_c2_r3_desc:'You see the product first. You may keep it at the Aura special price.',kr_c2_r3_label:'Pre-emptive Right',kr_c2_sub:'Regional Partner \u2014 Nationwide',kr_c2_tag1:'NATIONWIDE',kr_c2_tag2:'FLEXIBLE / FREELANCE',kr_c2_tag3:'START IMMEDIATELY',kr_c2_title:'Aura Brand Ambassador & Verified Content Creator (m/f/d)',
  kr_cta_apply:'APPLY DIRECTLY',kr_cta_btn:'SEND SPECULATIVE APPLICATION',kr_cta_jobs:'VIEW ACTIVE POSITIONS',kr_cta_sub:'Send us a speculative application \u2014 we are always looking for exceptional talent.',kr_cta_title:'Your role not listed?',
  kr_form_firstname:'First Name *',kr_form_heading:'Your Application',kr_form_position:'Desired Position *',kr_form_select_default:'Please select...',kr_form_sub:'Quick, straightforward, confidential. We will get back to you within 48 hours.',kr_form_submit:'SUBMIT APPLICATION',kr_form_title:'Application Form',
  kr_hero_badge:'Careers at Aura Global Merchants Ltd.',kr_hero_desc:'London. Berlin. Munich. New York. \u2014 We are looking for operational talent to manage international goods flows and bring premium brands to the end customer.',kr_stat1:'Employees worldwide',kr_stat2:'Locations',kr_stat3:'Open Positions',kr_stat4:'Remote-friendly',
  kr_why_c1_desc:'71-75 Shelton Street, London WC2H 9JQ. Company No. 15847293. Registered in England & Wales.',kr_why_c1_title:'London Headquarters',kr_why_c2_desc:'London, Berlin, Munich, Hamburg, New York \u2014 an international network for logistics and quality assurance.',kr_why_c2_title:'5 Locations, 1 Team',kr_why_c3_desc:'Transparent compensation models with weekly payouts via bank transfer.',kr_why_c3_title:'Punctual Payment',kr_why_c4_desc:'From coordinator to Head of Operations in 6\u201312 months. We promote initiative and reward results.',kr_why_c4_title:'Career Path',kr_why_sub:'A registered British trading company with global infrastructure.',kr_why_title:'Why Aura Global?',
  kr_z1_badge:'Active Recruitment \u2014 Available Immediately',kr_z1_sub:'Our two strategic core roles for the DACH region. High autonomy, attractive compensation, 100% remote.',kr_z1_title:'Global Operations',
  kr_z2_1_desc:'Leading the fulfilment team (8-12 staff). Quality control, KPI reporting to Head of Ops.',kr_z2_1_loc:'London Hub \u00b7 Full-Time',kr_z2_1_title:'Warehouse Team Lead',kr_z2_10_desc:'Team lead (5 staff), Zendesk/Freshdesk, CSAT/NPS tracking. Native German speaker.',kr_z2_10_loc:'Berlin \u00b7 Full-Time',kr_z2_10_title:'Customer Support Lead (DE)',kr_z2_11_desc:'US market entry, Paid Ads (Google/Meta/TikTok), DTC scaling.',kr_z2_11_loc:'New York \u00b7 Full-Time',kr_z2_11_title:'E-Commerce Growth Manager',kr_z2_12_desc:'Product copy, blog, newsletter, SEO content. German + English C2.',kr_z2_12_loc:'Full Remote \u00b7 FT/PT',kr_z2_12_title:'Copywriter DE/EN',
  kr_z2_2_desc:'Stock optimisation across all channels, inventories and demand forecasting.',kr_z2_2_loc:'Berlin \u00b7 Full-Time',kr_z2_2_title:'Inventory Controller',kr_z2_3_desc:'Dashboards, A/B tests, ETL pipelines (Python/SQL). First BI experience desired.',kr_z2_3_loc:'London / Remote \u00b7 Full-Time',kr_z2_3_title:'Junior Data Analyst',kr_z2_4_desc:'Shopify/Liquid, Tailwind CSS, Core Web Vitals. Theme development and landing pages.',kr_z2_4_loc:'Full Remote \u00b7 Full-Time',kr_z2_4_title:'Frontend Developer',kr_z2_5_desc:'Cypress/Playwright, CI/CD integration, API testing. ISTQB a plus.',kr_z2_5_loc:'London \u00b7 Full-Time',kr_z2_5_title:'QA Automation Engineer',kr_z2_6_desc:'Pentests, WAF/SIEM/DLP, GDPR compliance. CISSP or CEH an advantage.',kr_z2_6_loc:'Full Remote \u00b7 Full-Time',kr_z2_6_title:'Cybersecurity Specialist',
  kr_z2_7_desc:'KYC processes, chargeback monitoring, compliance framework (UK/EU).',kr_z2_7_loc:'London \u00b7 Full-Time',kr_z2_7_title:'Compliance & Anti-Fraud Manager',kr_z2_8_desc:'Cross-border trade/customs regulations, supplier contracts, trademark law.',kr_z2_8_loc:'London / Remote \u00b7 Full-Time',kr_z2_8_title:'International Trade Lawyer',kr_z2_9_desc:'VAT registrations UK/DE/FR/NL, OSS procedures, Xero/Avalara.',kr_z2_9_loc:'London \u00b7 Full-Time',kr_z2_9_title:'VAT & Taxation Specialist',kr_z2_apply:'Apply \u2192',kr_z2_sub:'Aura Global is growing \u2014 across all departments. From Tech to Legal, from Marketing to Operations.',kr_z2_title:'More Positions in the Company',
  ds_noauth:'Not signed in',ds_noauth_d:'Please sign in to view your account.',ds_login:'SIGN IN',
  ds_hello:'Hello,',ds_logout:'Sign out',ds_orders:'My Orders',ds_settings:'Account Settings',
  ds_empty:'You have no orders yet.',ds_shop:'SHOP NOW',
  ds_personal:'Personal Information',ds_save:'SAVE',ds_delete:'Delete Account',ds_delete_d:'This action cannot be undone.',ds_delete_btn:'DELETE ACCOUNT',
  ds_ordernum:'Order no.',ds_date:'Date',
  st_pending:'Pending',st_paid:'Paid',st_sourcing:'Sourcing',st_shipped:'Shipped',st_delivered:'Delivered',st_inspection:'Inspection',
  trk_title:'Track Your Order',trk_desc:'Enter your order number and email address to track your order status.',trk_order_id:'Order Number',trk_email:'Email Address',trk_btn:'TRACK ORDER',trk_not_found:'Order not found. Please check your details.',
  trk_paid:'Paid',trk_paid_d:'Payment received',trk_sourcing:'Processing',trk_sourcing_d:'Product being prepared',trk_shipped:'Shipped',trk_shipped_d:'Package on the way',trk_delivered:'Delivered',trk_delivered_d:'Successfully delivered',
  trk_track_num:'Tracking Number',trk_track_btn:'Track Shipment',trk_receipt:'Purchase Receipt',trk_dl_receipt:'Download Receipt',
  svc_returns_title:'Returns & Refunds',svc_shipping_title:'Shipping Policy',svc_faq_title:'Frequently Asked Questions',
  co_story_title:'Our Story',co_privacy_title:'Privacy Policy',co_terms_title:'Terms & Conditions',co_imprint_title:'Legal Notice',
  mega_electronics:'Electronics',mega_fashion:'Fashion',mega_all_el:'All Electronics →',mega_all_fa:'All Fashion →',
  fill_all:'Please fill in all fields',
  pass_mismatch:'Passwords do not match.',
  added_cart:'added to cart',
  settings_saved:'Settings saved',
  order_placed:'Order placed successfully!',
  welcome_back:'Welcome back!',
  account_created:'Account created!',
  delete_confirm:'Really delete account?',
  card_free_ship:'Free Shipping',card_inspected:'Hub Inspected',card_instock:'In Stock',card_reviews:'Reviews',card_sold:'sold',card_returns:'30-Day Returns',card_delivery:'Delivered in 2\u20134 days',
  price_vat:'incl. VAT, excl. shipping costs',
  cart_remove:'Remove',cart_empty_msg:'Your cart is empty',cart_continue:'Continue shopping',
  hero_trust_ship:'Shipping in 2–4 days',hero_trust_return:'30-day returns',hero_trust_pay:'Secure payment',
  prime_title:'Become an Aura Prime Member',prime_desc:'Get <strong style="color:#C5A059">exclusive early deals</strong>, early access to new products and free express shipping.',prime_btn:'JOIN NOW',prime_ph:'Email address',prime_ok:'Welcome to Aura Prime!',prime_ok_d:'We\'ll be in touch shortly.',prime_spam:'No spam. Unsubscribe anytime.',
  price_m_title:'Honest Prices, Clear Logic',price_m_desc:'Why we\'re cheaper — without compromising quality.',price_m_uvp:'Retail (RRP)',price_m_aura:'Aura Direct',price_m_explain:'We buy returns and liquidation stock directly from wholesalers — no middlemen, no rent, no ad spend. The result: <strong style="color:#001A3D">You save up to 40%</strong> compared to retail.',price_m_ok:'GOT IT',
  cookie_text:'We only use <strong style="color:white">essential cookies</strong> required for our website to function. Learn more in our',cookie_accept:'ACCEPT',cookie_reject:'ESSENTIAL ONLY',cookie_privacy:'Privacy Policy',
  activity_just:'Just now · Aura Global',
  sec_process:'OUR PROCESS',sec_how:'How Aura Works',sec_how_d:'Every product goes through our three-step inspection process at the London hub before it reaches you.',
  step1_n:'Step 1',step1_t:'Sourcing',step1_d:'We source original goods directly from authorised dealers and brands worldwide — from Apple to Nike to Louis Vuitton. Over 120 verified sources.',
  step2_n:'Step 2',step2_t:'Hub Inspection',step2_d:'At our London hub, every product is manually checked for authenticity, completeness and function — with video documentation.',
  step3_n:'Step 3',step3_t:'Shipping to You',step3_d:'Sealed, inspected package — insured and tracked directly to your door. In just 2–4 business days.',
  stat_items:'Inspected Items',stat_brands:'Top Brands',stat_sat:'Customer Satisfaction',stat_del:'Days Delivery',
  cat_elec_d:'Smartphones, Laptops, Audio',cat_fash_d:'Shoes, Bags, Jewellery',cat_home_d:'Dyson, Smart Home, Care',cat_travel_d:'Luggage, Accessories',cat_beauty:'Beauty & Care',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'DISCOVER →',
  spot_top:'TOP CATEGORY',spot_elec:'Electronics & Tech',spot_all_elec:'All Electronics →',spot_fash:'Fashion & Lifestyle',spot_all_fash:'All Fashion →',
  sec_trending_label:'TRENDING',sec_trending:'Trending Now',sec_all_new:'All New Arrivals →',
  sec_premium:'PREMIUM SELECTION',sec_brands_grid:'120+ Top Brands at a Glance',sec_brands_d:'From world-leading brands — inspected and delivered to you.',sec_brands_sub:'Over 120 verified brands from around the world',
  sec_testi_label:'TESTIMONIALS',sec_testimonials:'What Our Customers Say',
  sec_why_label:'WHY AURA?',sec_why:'The Difference is in the Details',
  sec_mission:'OUR MISSION',sec_sust:'Circular Economy, Not Waste',
  mega_smartphones:'Smartphones & Tablets',mega_laptops:'Laptops',mega_laptops_audio:'Laptops & Audio',mega_audio:'Audio & Wearables',mega_gaming:'Gaming & VR',
  mega_shoes:'Shoes & Sneakers',mega_designer:'Designer & Luxury',mega_jewelry:'Jewellery & Watches',mega_clothing:'Clothing & Accessories',
  mega_home:'Home & Living',mega_travel:'Travel & Outdoor',
  mega_all_el:'View all Electronics →',mega_all_fa:'View all Fashion →',mega_all_home:'View all Home & Living →',mega_all_travel:'View all Travel & Outdoor →',
  mega_bose:'Bose Headphones',mega_dyson_hair:'Dyson Hair Care & Cleaning',mega_ecovacs:'Ecovacs Robot Vacuums',mega_hexclad:'HexClad Cookware',mega_ring:'Ring Security',mega_rimowa:'Rimowa Luggage',
  ck_phone:'Phone',ck_card_brands:'Visa, Mastercard, American Express',ck_klarna:'Klarna — Invoice',ck_klarna_d:'Pay in 14 days',ck_wallet:'Apple Pay / Google Pay',ck_wallet_d:'Fast & secure payment',
  country_de:'Germany',country_at:'Austria',country_ch:'Switzerland',country_gb:'United Kingdom',country_us:'United States',
  ct_name:'Full name *',ct_email:'Email address *',ct_order:'Order number',ct_subject:'Subject *',ct_message:'Message *',
  ct_select_ph:'Please select...',ct_opt_product:'Product question',ct_opt_logistics:'Logistics & Shipping',ct_opt_warranty:'Warranty & Complaint',ct_opt_career:'Careers',ct_opt_return:'Returns & Refund',ct_opt_payment:'Payment & Invoice',ct_opt_other:'Other',
  err_storage_full:'Storage full — data too large',err_email_exists:'This email is already registered',err_wrong_pass:'Wrong password',err_user_not_found:'User not found',err_auth_required:'Please sign in',msg_wishlist_removed:'Removed from wishlist',msg_wishlist_added:'Added to wishlist',
  ft_all_products:'All Products',ft_electronics:'Electronics',ft_fashion:'Fashion & Accessories',ft_home:'Home & Living',ft_travel:'Travel & Outdoor',ft_shipping_pay:'Shipping & Payment',ft_faq:'FAQ',ft_about:'About Us',ft_sustainability:'Sustainability',ft_sourcing:'Our Sourcing',ft_careers:'Careers',ft_copyright:'© 2026 Aura Global Merchants Ltd. All rights reserved.',ft_ssl:'Secure payment with 256-bit SSL encryption',ft_ssl_ck:'Your data is protected by 256-bit SSL encryption',
  sort_newest:'New Arrivals',flt_apply:'APPLY',
  day_sun:'Sunday',day_mon:'Monday',day_tue:'Tuesday',day_wed:'Wednesday',day_thu:'Thursday',day_fri:'Friday',day_sat:'Saturday',
  prd_protocol:'Aura Inspection Protocol',prd_whats_box:'What\u2019s in the Box?',prd_box_product:'Original Product',prd_box_sealed:'Sealed & Inspected',prd_box_cert:'Aura Certificate',prd_box_insp:'Inspection Report',prd_box_warranty:'Warranty Card',prd_box_12m:'12 Months Protection',prd_box_return:'Return Label',prd_box_30d:'30-Day Returns',
  prd_tab_desc:'Description',prd_tab_specs:'Technical Specs',prd_tab_ship:'Shipping & Returns',
  prd_ship_h:'Shipping from Berlin / London',prd_ship_p:'All orders ship from our Berlin or London warehouse. Standard delivery (3–5 business days) free from £99. Express (1–2 business days) £8.50.',
  prd_ret_h:'30-Day Returns',prd_ret_p:'Return within 30 days if the item does not match the Aura inspection description. Free returns with prepaid label.',
  prd_prot_h:'Aura Buyer Protection',prd_prot_p:'Every purchase is covered by our Aura Buyer Protection programme. Full refund or replacement if there\u2019s an issue.',
  prd_reviews:'Customer Reviews',prd_reviews_w:'Reviews',prd_order_now:'Order now for delivery on',prd_hub:'(Berlin Hub)',
  prd_cond_orig:'Original Goods',prd_cond_orig_d:'Manually inspected and verified. Fast dispatch from the Hub.',prd_cond_verified:'Verified',prd_cond_verified_d:'Manually inspected with video inspection. 100% Original.',
  prd_saving:'You save:',prd_stock_low:'Only {n} left!',prd_stock_avail:'{n} still in stock',prd_in_stock:'in stock',
  prd_proto_score:'Protocol: {n}/3 passed',
  prd_insp_auth:'Authenticity',prd_insp_auth_y:'Serial number verified with manufacturer.',prd_insp_auth_n:'Authenticity could not be fully confirmed.',
  prd_insp_func:'Functionality',prd_insp_func_y:'Battery, sensors & display fully tested.',prd_insp_func_n:'Functional test pending or partially passed.',
  prd_insp_source:'Sourcing',prd_insp_source_d:'Sourced directly from {shop} & inspected in London.',
  prd_insp_seal:'Sealed & Warranty',prd_insp_warranty:'Warranty',prd_insp_seal_y:'Sealed with Aura Seal. 12-month warranty.',prd_insp_seal_n:'12-month warranty (without original seal).',
  prd_why_aura:'Why Aura Global?',prd_why_1:'Every product undergoes our 47-point inspection protocol',prd_why_2:'Sourced from authorised retailers ({shop})',prd_why_3:'12-month Aura warranty included',prd_why_4:'Free shipping & 30-day returns',
  prd_seal_title:'Aura Quality Seal',prd_seal_desc:'Every product is sealed with an Aura inspection seal. Your mark of authenticity.',prd_seal_verified:'Inspected & sealed at the London warehouse',
  prd_spec_brand:'Brand',prd_spec_cat:'Category',prd_spec_cond:'Condition',prd_spec_cond_v:'Hub Verified — New with Video',prd_spec_cond_c:'Aura Check — Verified',
  prd_spec_rating:'Rating',prd_spec_stock:'Availability',prd_spec_ship:'Shipping',prd_spec_ship_v:'Free from £99, DHL Express',
  prd_spec_warranty:'Warranty',prd_spec_warranty_v:'12 Months Aura Global',prd_spec_source:'Source',prd_spec_source_v:'Authorised retailer ({shop})',
  prd_spec_insp:'Inspection',prd_spec_insp_loc:'London warehouse',
  ds_nav_orders:'My Orders',ds_nav_profile:'Personal Details',ds_nav_addr:'Addresses',ds_nav_wish:'Wishlist',
  ds_nav_pay:'Payment Methods',ds_nav_notif:'Notifications',ds_nav_sec:'Security',ds_nav_set:'Account Settings',
  ds_member_since:'Member since',ds_fname:'First Name',ds_lname:'Last Name',ds_dob:'Date of Birth',ds_lang:'Language',ds_save:'SAVE',ds_cancel:'CANCEL',ds_cancel_lc:'Cancel',
  ds_addr_h:'Saved Addresses',ds_addr_new:'New Address',ds_addr_edit:'Edit Address',ds_addr_empty:'No addresses saved',ds_addr_empty_d:'Add a delivery address for faster checkout',
  ds_street:'Street & House No.',ds_addr_extra:'Additional Info',ds_zip:'Postcode',ds_city:'City',ds_country:'Country',ds_addr_default:'Set as default address',
  ds_wish_h:'My Wishlist',ds_wish_empty:'Your wishlist is empty',ds_wish_empty_d:'Save your favourite products',ds_wish_browse:'BROWSE PRODUCTS',
  ds_pay_add:'Add',ds_pay_empty:'No payment methods saved',ds_pay_type:'Type',ds_pay_sepa:'SEPA Direct Debit',
  ds_pay_holder:'Cardholder',ds_pay_last4:'Card number (last 4)',ds_pay_exp:'Expiry date',ds_pay_email:'Email / Account',ds_pay_default:'Set as default',ds_pay_default_set:'Set as default',
  ds_pay_info:'Your payment data is securely encrypted. We use SSL/TLS encryption and are PCI-DSS certified.',
  ds_pay_new:'New Payment Method',ds_pay_edit:'Edit Payment Method',ds_pay_expires:'Expires',ds_pay_connected:'Connected',
  ds_notif_h:'Notification Settings',ds_notif_orders:'Order Status',ds_notif_orders_d:'Email updates about your orders',
  ds_notif_deals:'Offers & Promotions',ds_notif_deals_d:'Exclusive deals and sales directly by email',
  ds_notif_price:'Price Alerts',ds_notif_price_d:'Notification when wishlist items drop in price',
  ds_notif_news:'Newsletter',ds_notif_news_d:'Weekly new arrivals and recommendations',
  ds_notif_push:'Push Notifications',ds_notif_push_d:'Browser notifications for important updates',
  ds_sec_pw_h:'Change Password',ds_sec_cur:'Current Password',ds_sec_new:'New Password',ds_sec_confirm:'Confirm Password',ds_sec_pwchange:'CHANGE PASSWORD',
  ds_sec_2fa_h:'Two-Factor Authentication',ds_sec_2fa:'2FA Status',ds_sec_2fa_d:'Increase security with an additional verification step',
  ds_sec_sessions:'Active Sessions',ds_sec_this:'This Browser',ds_sec_active:'Active',
  ds_set_id:'Account ID',ds_set_copy:'Copy',ds_set_member:'Membership',ds_set_member_v:'Aura Standard',ds_set_currency:'Currency',
  ds_set_export:'Data Export',ds_set_export_d:'Download all your personal data',ds_set_export_btn:'EXPORT',
  ds_set_delete:'Delete Account',ds_set_delete_d:'This action cannot be undone. All your data will be permanently deleted.',ds_set_delete_btn:'DELETE ACCOUNT',
  ds_standard:'Default',ds_edit:'Edit',ds_delete:'Delete',
  ds_tl_paid:'Paid',ds_tl_sourcing:'Ready to Ship',ds_tl_inspection:'Inspected',ds_tl_shipped:'Shipped',ds_tl_delivered:'Delivered',
  ds_ord_nr:'Order No.',ds_ord_date:'Date',ds_ord_total:'Total',ds_ord_track:'Track',ds_ord_receipt:'Invoice',ds_ord_help:'Help',
  ds_ord_reviewed:'Reviewed',ds_ord_review:'Review',ds_ord_tracking:'Tracking No',
  ds_rv_h:'Write a Review',ds_rv_d:'Share your experience',ds_rv_submit:'Submit Reviews',ds_rv_rating:'Rating',ds_rv_photos:'Photos (max. 3)',ds_rv_add:'Add',ds_rv_all_done:'All products already reviewed!',
  ds_t_copied:'Copied',ds_t_export:'Export is being prepared…',ds_t_currency:'Currency saved',ds_t_delete_confirm:'Are you sure? All data will be deleted.',
  ds_t_enter_name:'Please enter a name',ds_t_profile:'Profile saved',ds_t_required:'Please fill in required fields',
  ds_t_addr_saved:'Address saved',ds_t_addr_del_q:'Delete address?',ds_t_addr_deleted:'Address deleted',ds_t_addr_default:'Default address updated',
  ds_t_wish_removed:'Removed from wishlist',ds_t_cart_added:'Added to cart',ds_t_last4:'Please enter last 4 digits',
  ds_t_pay_saved:'Payment method saved',ds_t_pay_del_q:'Delete payment method?',ds_t_pay_deleted:'Payment method deleted',ds_t_default:'Default updated',
  ds_t_notif:'Settings saved',ds_t_fill_all:'Please fill in all fields',ds_t_pw_mismatch:'Passwords do not match',
  ds_t_pw_min:'At least 6 characters',ds_t_pw_wrong:'Current password incorrect',ds_t_pw_changed:'Password changed',
  ds_t_2fa_on:'2FA enabled',ds_t_2fa_off:'2FA disabled',ds_t_stars:'Please give at least 1 star for each product',
  ds_t_review_thx:'Thank you for your review!',ds_t_no_receipt:'Invoice not yet available',ds_t_video_missing:'Video not found',ds_t_max_photos:'Max. 3 photos',
  ct_hero:'Service Centre',ct_hero_d:'Our support team will answer your enquiry within 24 hours.',
  ct_form_h:'Send Enquiry',ct_form_d:'Fill in the form — we will get back to you as soon as possible.',
  ct_sent:'Enquiry sent!',ct_sent_thx:'Thank you for your message.',ct_sent_24h:'We will process your enquiry within 24 hours.',ct_ref:'Reference number:',ct_home:'BACK TO HOME',
  ct_privacy:'I have read the Privacy Policy and agree to the processing of my data. *',ct_submit:'SEND ENQUIRY',
  ct_reg_nr:'Company No.:',ct_reg_where:'Registered:',ct_reg_ceo:'Director:',ct_channels:'Direct Channels',
  ct_wa_d:'Chat now — fast response',ct_tg_d:'Chat now — secure communication',
  ct_hours_h:'Service Hours',ct_hrs_mf:'Monday – Friday',ct_hrs_sat:'Saturday',ct_hrs_sun:'Sunday & Holidays',ct_hrs_closed:'Closed',
  ct_hrs_avg:'Average response time: under 4 hours during business hours.',
  ct_quick:'Quick Links',ct_q_track:'Track Shipment',ct_q_return:'Returns',ct_q_ship:'Shipping',
  ct_v_name:'Please enter your name.',ct_v_email:'Please enter a valid email address.',ct_v_subject:'Please select a subject.',ct_v_message:'Please enter your message.',ct_v_privacy:'Please accept the privacy policy.',
  lg_gdpr:'I have read the Terms and the Privacy Policy and agree to them.',lg_gdpr_req:'Please agree to the Terms and Privacy Policy.',
  lg_btn_verify:'VERIFY CODE',lg_no_account:'No account found with this email.',lg_code_sent:'A 6-digit code has been sent to {email}.',
  lg_enter_code:'Please enter the 6-digit code.',lg_pw_min:'Password must be at least 6 characters.',lg_pw_mismatch:'Passwords do not match.',lg_pw_changed:'Password changed successfully!',
  ft_copyright_short:'© 2026 Aura Global Merchants Ltd. · Company No. 15847293',
},
fr:{
  locale_label:'Fran\u00e7ais',
  top_bar:'Livraison gratuite d\u00e8s 99\u20ac \u00b7 Retour sous 30 jours',
  guarantee:'Garantie',
  search_ph:'Rechercher produits, marques, cat\u00e9gories...',
  nav_all:'Tous les produits',nav_electronics:'\u00c9lectronique',nav_fashion:'Mode',nav_fashion_long:'Mode & Accessoires',nav_home:'Maison',nav_travel:'Voyage & Outdoor',nav_sale:'Promo %',nav_new:'Nouveaut\u00e9s',
  mob_login:'Connexion / Inscription',mob_orders:'Mes commandes',
  hero_tag:'V\u00e9rifi\u00e9 \u00b7 Fiable \u00b7 Abordable',hero_h1a:'\u00c9lectronique & Mode v\u00e9rifi\u00e9es',hero_h1b:'directement du hub',
  hero_desc:'Chaque produit est contr\u00f4l\u00e9 manuellement dans notre hub \u00e0 Londres. Authenticit\u00e9 et fonctionnalit\u00e9 garanties \u00e0 100%.',
  hero_cta1:'VOIR TOUS LES PRODUITS',hero_cta2:'PROMOTIONS',
  trust_v:'Produits v\u00e9rifi\u00e9s',trust_vd:'Contr\u00f4l\u00e9s manuellement',trust_s:'Livraison rapide',trust_sd:'Livr\u00e9 en 2\u20134 jours',trust_r:'Retour gratuit',trust_rd:'30 jours, sans risque',trust_p:'Paiement s\u00e9curis\u00e9',trust_pd:'Chiffrement SSL, PCI DSS',
  sec_cat:'Cat\u00e9gories',sec_feat:'Produits populaires',sec_brands:'Nos marques',sec_news:'Newsletter',
  news_desc:'Nouvelles offres et produits v\u00e9rifi\u00e9s dans votre bo\u00eete mail.',news_ph:'Votre adresse e-mail',news_btn:'S\'ABONNER',
  add_cart:'AJOUTER AU PANIER',view_prod:'VOIR',
  ft_cat:'Cat\u00e9gories',ft_svc:'Service client',ft_co:'Entreprise',ft_contact:'Contact',ft_track:'Suivi de commande',ft_returns:'Retours & Remboursements',ft_story:'Notre histoire',ft_privacy:'Confidentialit\u00e9',ft_terms:'CGV',ft_imprint:'Mentions l\u00e9gales',
  ft_desc:'Produits de marque v\u00e9rifi\u00e9s depuis notre hub londonien.',
  cart_title:'Panier',cart_empty:'Votre panier est vide',cart_total:'Total',cart_checkout:'COMMANDER',
  flt_cat:'Cat\u00e9gorie',flt_brand:'Marque',flt_price:'Prix',flt_cond:'\u00c9tat',flt_verified:'V\u00e9rifi\u00e9',flt_openbox:'Original',
  sort_default:'Recommand\u00e9',sort_price_asc:'Prix croissant',sort_price_desc:'Prix d\u00e9croissant',sort_name:'Nom A-Z',sort_rating:'Mieux not\u00e9',
  flt_reset:'R\u00e9initialiser',flt_results:'Produits',flt_mobile:'Filtrer & Trier',
  prd_qty:'Quantit\u00e9 :',prd_add:'AJOUTER AU PANIER',prd_desc:'Description',prd_specs:'Sp\u00e9cifications',prd_rev:'Avis',prd_related:'Vous aimerez aussi',
  prd_instock:'En stock',prd_ship:'Livraison gratuite',prd_inspect:'Contr\u00f4l\u00e9 au hub de Londres \u2014 100% original',
  spec_brand:'Marque',spec_cat:'Cat\u00e9gorie',spec_cond:'\u00c9tat',spec_cond_v:'V\u00e9rifi\u00e9 \u2014 Neuf',spec_cond_o:'V\u00e9rifi\u00e9 \u2014 Contr\u00f4l\u00e9',spec_rating:'Note',spec_avail:'Disponibilit\u00e9',spec_avail_v:'en stock',spec_ship:'Livraison',spec_ship_v:'Gratuite d\u00e8s 99\u20ac, DHL Express',
  lg_login:'CONNEXION',lg_register:'INSCRIPTION',lg_login_desc:'Connectez-vous avec votre e-mail.',lg_reg_desc:'Cr\u00e9ez un compte pour commander.',
  lbl_email:'E-mail',lbl_pass:'Mot de passe',lbl_name:'Nom complet',lbl_pass2:'Confirmer le mot de passe',
  btn_login:'SE CONNECTER',btn_register:'CR\u00c9ER UN COMPTE',back_shop:'\u2190 Retour \u00e0 la boutique',to_shop:'Vers la boutique \u2192',
  ck_s1:'1. Livraison',ck_s2:'2. Paiement',ck_s3:'3. Confirmation',
  ck_addr:'Adresse de livraison',ck_first:'Pr\u00e9nom',ck_last:'Nom',ck_street:'Rue & num\u00e9ro',ck_zip:'Code postal',ck_city:'Ville',ck_country:'Pays',
  ck_ship:'Mode de livraison',ck_std:'Standard',ck_std_d:'3\u20135 jours ouvrables',ck_exp:'Express',ck_exp_d:'1\u20132 jours ouvrables',ck_free:'Gratuit',
  ck_next:'CONTINUER AU PAIEMENT',ck_summary:'R\u00e9capitulatif',ck_sub:'Sous-total',ck_shipping:'Livraison',ck_total:'Total',
  ck_pay:'Mode de paiement',ck_card:'Carte de cr\u00e9dit / d\u00e9bit',ck_cardnum:'Num\u00e9ro de carte',ck_cardexp:'Date d\'exp.',
  ck_back:'\u2190 RETOUR',ck_place:'PASSER LA COMMANDE',
  ck_done:'Commande confirm\u00e9e !',ck_thanks:'Merci pour votre commande chez Aura Global Merchants.',ck_ordernum:'Num\u00e9ro de commande :',ck_myorders:'MES COMMANDES',ck_continue:'CONTINUER MES ACHATS',
  ck_stripe_sec:'S\u00e9curis\u00e9 par <strong class="text-gray-600">Stripe</strong> \u2014 Vos donn\u00e9es de carte sont chiffr\u00e9es et jamais stock\u00e9es sur nos serveurs.',ck_gdpr:'J\u2019ai lu et j\u2019accepte les <a href="/terms.html" target="_blank" class="text-gold hover:underline font-medium">CGV</a> et la <a href="/privacy.html" target="_blank" class="text-gold hover:underline font-medium">Politique de confidentialit\u00e9</a>. J\u2019ai \u00e9t\u00e9 inform\u00e9(e) de mon <a href="/returns.html#widerrufsformular" target="_blank" class="text-gold hover:underline font-medium">droit de r\u00e9tractation</a>.',ck_gdpr_req:'Veuillez accepter les CGV et la Politique de confidentialit\u00e9.',ck_processing:'Traitement en cours...',ck_badge_ssl:'SSL chiffr\u00e9',ck_badge_pci:'Conforme PCI DSS',
  hp_why_video:'Protocole d\u2019inspection vid\u00e9o',hp_why_video_d:'Chaque produit est document\u00e9 par un protocole vid\u00e9o \u2014 de l\u2019ouverture de l\u2019emballage au test de fonctionnement.',
  hp_why_auth:'100% d\u2019originaux v\u00e9rifi\u00e9s',hp_why_auth_d:'Nous nous approvisionnons exclusivement aupr\u00e8s de sources autoris\u00e9es. Num\u00e9ros de s\u00e9rie v\u00e9rifi\u00e9s, contrefa\u00e7ons exclues.',
  hp_why_return:'30 jours de r\u00e9tractation',hp_why_return_d:'Si quelque chose ne va pas, nous le reprenons \u2014 sans discussion. Exp\u00e9dition assur\u00e9e, remboursement int\u00e9gral.',
  hp_why_global:'Approvisionnement mondial, exp\u00e9dition locale',hp_why_global_d:'Nous achetons dans le monde entier, inspectons \u00e0 Londres et exp\u00e9dions depuis des hubs europ\u00e9ens.',
  hp_vs_h:'Aura vs. Places de march\u00e9',hp_vs_video:'Inspection vid\u00e9o',hp_vs_hub:'Contr\u00f4le qualit\u00e9 Hub',hp_vs_orig:'Garantie d\u2019authenticit\u00e9',hp_vs_seal:'Sceau d\u2019emballage',hp_vs_dach:'Support DACH personnel',hp_vs_ship:'Livraison 2\u20134 jours ouvr\u00e9s',
  hp_sust_d:'Chaque produit chez Aura est un produit sauv\u00e9. Nous donnons une seconde vie aux articles de marque.',
  hp_sust_1:'\u00c9conomiser les ressources',hp_sust_1d:'Jusqu\u2019\u00e0 90% de CO\u2082 en moins par produit.',
  hp_sust_2:'Qualit\u00e9 v\u00e9rifi\u00e9e',hp_sust_2d:'Aura Verified : inspection multi-\u00e9tapes avec documentation vid\u00e9o.',
  hp_sust_3:'Prix \u00e9quitable',hp_sust_3d:'Articles de marque jusqu\u2019\u00e0 40% moins chers.',
  hp_sust_cta:'En savoir plus sur notre mission',
  hp_rev1:'\u00abJ\u2019\u00e9tais sceptique au d\u00e9but, mais l\u2019inspection vid\u00e9o m\u2019a imm\u00e9diatement convaincu. Mon iPhone est arriv\u00e9 en parfait \u00e9tat. Vivement recommand\u00e9 !\u00bb',
  hp_rev2:'\u00abSac Gucci en parfait \u00e9tat, avec re\u00e7u original et vid\u00e9o d\u2019inspection. Processus transparent et professionnel.\u00bb',
  hp_rev3:'\u00abLe Dyson Airwrap \u00e9tait en rupture de stock partout. Chez Aura, je l\u2019ai re\u00e7u imm\u00e9diatement et 15% moins cher. Super service !\u00bb',
  news_enter_email:'Veuillez entrer votre e-mail',news_subscribed:'Abonn\u00e9 avec succ\u00e8s ! V\u00e9rifiez votre bo\u00eete de r\u00e9ception.',news_error:'Erreur \u2014 veuillez recharger la page',
  faq_q9:'Pourquoi les prix sont-ils inf\u00e9rieurs \u00e0 ceux du commerce de d\u00e9tail ?',faq_a9:'En tant que plateforme d\u2019approvisionnement international, nous achetons directement aupr\u00e8s de revendeurs agr\u00e9\u00e9s sur diff\u00e9rents march\u00e9s. Les \u00e9carts de prix r\u00e9sultent de la tarification r\u00e9gionale, des taux de change et des promotions locales. Tous les produits sont 100% originaux \u2014 l\u2019avantage tarifaire provient uniquement de notre strat\u00e9gie d\u2019approvisionnement.',
  faq_q10:'Quelle garantie est-ce que je re\u00e7ois ?',faq_a10:'Les articles neufs b\u00e9n\u00e9ficient de 24 mois de garantie l\u00e9gale, les articles d\u2019occasion de 12 mois. De plus, chaque produit est v\u00e9rifi\u00e9 selon le protocole d\u2019inspection Aura avant l\u2019exp\u00e9dition. Le rapport vid\u00e9o documente l\u2019\u00e9tat exact et sert de r\u00e9f\u00e9rence en cas de garantie.',
  faq_q11:'Quels modes de paiement acceptez-vous ?',faq_a11:'Nous acceptons Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay et Klarna (facture/paiement \u00e9chelonn\u00e9). Tous les paiements sont trait\u00e9s de mani\u00e8re s\u00e9curis\u00e9e via Stripe \u2014 conforme PCI-DSS Level 1.',
  faq_q12:'Que signifie le statut de commande \u00ab Sourcing \u00bb ?',faq_a12_intro:'Apr\u00e8s r\u00e9ception de votre paiement, votre commande passe par les statuts suivants :',faq_a12_paid:'<span class="font-bold text-navy">Pay\u00e9 :</span> Paiement re\u00e7u avec succ\u00e8s.',faq_a12_sourcing:'<span class="font-bold text-navy">Sourcing :</span> Nous approvisionnons votre produit aupr\u00e8s du revendeur agr\u00e9\u00e9. Cela prend 1 \u00e0 3 jours ouvr\u00e9s.',faq_a12_shipped:'<span class="font-bold text-navy">Exp\u00e9di\u00e9 :</span> Le produit a \u00e9t\u00e9 inspect\u00e9, document\u00e9 par vid\u00e9o et exp\u00e9di\u00e9.',faq_a12_delivered:'<span class="font-bold text-navy">Livr\u00e9 :</span> Livraison effectu\u00e9e avec succ\u00e8s.',
  faq_q13:'Y a-t-il des frais de douane ?',faq_a13:'Comme nous exp\u00e9dions depuis le Royaume-Uni, des frais de douane peuvent s\u2019appliquer pour les livraisons dans l\u2019UE. Pour les commandes vers l\u2019Allemagne, nous prenons en charge le d\u00e9douanement (DDP) dans la plupart des cas. D\u00e9tails sur notre <a href="/shipping.html" class="text-gold hover:underline font-semibold">page livraison</a>.',
  faq_q14:'Puis-je annuler ma commande ?',faq_a14:'Oui, les commandes peuvent \u00eatre annul\u00e9es gratuitement jusqu\u2019au d\u00e9but de l\u2019approvisionnement (statut \u00ab Sourcing \u00bb). Une fois en transit, l\u2019annulation n\u2019est plus possible. Utilisez alors notre <a href="/returns.html" class="text-gold hover:underline font-semibold">proc\u00e9dure de retour</a> avec un d\u00e9lai de 30 jours.',
  faq_q15:'Qu\u2019advient-il de mes donn\u00e9es ?',faq_a15:'Nous prenons la protection des donn\u00e9es au s\u00e9rieux et traitons vos donn\u00e9es uniquement pour le traitement de votre commande conform\u00e9ment au RGPD et au UK GDPR. D\u00e9tails dans notre <a href="/privacy.html" class="text-gold hover:underline font-semibold">Politique de confidentialit\u00e9</a>.',
  faq_q16:'Livrez-vous en Suisse et en Autriche ?',faq_a16:'Oui, nous livrons dans toute la r\u00e9gion DACH et d\u2019autres pays de l\u2019UE. Livraison standard en Autriche : 3\u20135 jours ouvr\u00e9s, en Suisse : 4\u20136 jours ouvr\u00e9s. Livraison gratuite d\u00e8s 99 \u20ac (Suisse : d\u00e8s 149 CHF).',
  faq_q17:'O\u00f9 se trouve votre entrep\u00f4t ?',faq_a17:'Notre entrep\u00f4t principal et centre d\u2019inspection se trouve \u00e0 Londres, Royaume-Uni. Tous les produits sont inspect\u00e9s selon le protocole Aura, document\u00e9s par vid\u00e9o et pr\u00e9par\u00e9s pour l\u2019exp\u00e9dition.',
  faq_q18:'Comment contacter le service client ?',faq_a18:'Par e-mail \u00e0 <a href="mailto:admin@auraglobal-merchants.com" class="text-gold hover:underline">admin@auraglobal-merchants.com</a> ou via notre <a href="/contact.html" class="text-gold hover:underline font-semibold">formulaire de contact</a>. Notre \u00e9quipe est disponible du lundi au vendredi de 9h \u00e0 18h (CET). R\u00e9ponse sous 24 heures.',
  ds_noauth:'Non connect\u00e9',ds_noauth_d:'Veuillez vous connecter.',ds_login:'CONNEXION',
  ds_hello:'Bonjour,',ds_logout:'D\u00e9connexion',ds_orders:'Mes commandes',ds_settings:'Param\u00e8tres',
  ds_empty:'Aucune commande pour le moment.',ds_shop:'ACHETER',
  ds_personal:'Donn\u00e9es personnelles',ds_save:'ENREGISTRER',ds_delete:'Supprimer le compte',ds_delete_d:'Cette action est irr\u00e9versible.',ds_delete_btn:'SUPPRIMER',
  ds_ordernum:'N\u00b0 commande',ds_date:'Date',
  st_pending:'En attente',st_paid:'Pay\u00e9',st_sourcing:'Approvisionnement',st_shipped:'Exp\u00e9di\u00e9',st_delivered:'Livr\u00e9',st_inspection:'Contr\u00f4le',
  trk_title:'Suivi de commande',trk_desc:'Entrez votre num\u00e9ro de commande et e-mail.',trk_order_id:'N\u00b0 de commande',trk_email:'E-mail',trk_btn:'RECHERCHER',trk_not_found:'Commande non trouv\u00e9e.',
  trk_paid:'Pay\u00e9',trk_paid_d:'Paiement re\u00e7u',trk_sourcing:'Traitement',trk_sourcing_d:'En pr\u00e9paration',trk_shipped:'Exp\u00e9di\u00e9',trk_shipped_d:'Colis en route',trk_delivered:'Livr\u00e9',trk_delivered_d:'Livraison r\u00e9ussie',
  trk_track_num:'N\u00b0 de suivi',trk_track_btn:'Suivre le colis',trk_receipt:'Re\u00e7u',trk_dl_receipt:'T\u00e9l\u00e9charger',
  svc_returns_title:'Retours & Remboursements',svc_shipping_title:'Politique de livraison',svc_faq_title:'Foire aux questions',
  co_story_title:'Notre histoire',co_privacy_title:'Confidentialit\u00e9',co_terms_title:'CGV',co_imprint_title:'Mentions l\u00e9gales',
  mega_electronics:'\u00c9lectronique',mega_fashion:'Mode',mega_all_el:'Toute l\'\u00e9lectronique \u2192',mega_all_fa:'Toute la mode \u2192',
  fill_all:'Veuillez remplir tous les champs',pass_mismatch:'Les mots de passe ne correspondent pas.',added_cart:'ajout\u00e9 au panier',
  settings_saved:'Param\u00e8tres enregistr\u00e9s',order_placed:'Commande pass\u00e9e !',welcome_back:'Bon retour !',account_created:'Compte cr\u00e9\u00e9 !',delete_confirm:'Supprimer le compte ?',
  card_free_ship:'Livraison gratuite',card_inspected:'V\u00e9rifi\u00e9',card_instock:'En stock',card_reviews:'Avis',card_sold:'vendus',card_returns:'Retour 30j',card_delivery:'Livr\u00e9 en 2\u20134 jours',
  price_vat:'TVA incluse, hors frais de port',cart_remove:'Supprimer',cart_empty_msg:'Votre panier est vide',cart_continue:'Continuer les achats',
  hero_trust_ship:'Livraison en 2\u20134 jours',hero_trust_return:'Retour 30 jours',hero_trust_pay:'Paiement s\u00e9curis\u00e9',
  prime_title:'Devenez membre Aura Prime',prime_desc:'Recevez des <strong style="color:#C5A059">offres exclusives</strong>, un acc\u00e8s anticip\u00e9 et la livraison Express gratuite.',prime_btn:'REJOINDRE',prime_ph:'Adresse e-mail',prime_ok:'Bienvenue chez Aura Prime\u00a0!',prime_ok_d:'Nous vous contactons bient\u00f4t.',prime_spam:'Pas de spam. D\u00e9sabonnement \u00e0 tout moment.',
  price_m_title:'Prix honn\u00eates, logique claire',price_m_desc:'Pourquoi nos prix sont plus bas \u2014 sans compromis sur la qualit\u00e9.',price_m_uvp:'Prix de d\u00e9tail (PPC)',price_m_aura:'Aura Direct',price_m_explain:'Nous achetons retours et stocks de liquidation directement aupr\u00e8s des grossistes. R\u00e9sultat\u00a0: <strong style="color:#001A3D">vous \u00e9conomisez jusqu\u0027\u00e0 40%</strong>.',price_m_ok:'COMPRIS',
  cookie_text:'Nous utilisons uniquement des <strong style="color:white">cookies techniques</strong> n\u00e9cessaires au fonctionnement du site. En savoir plus dans notre',cookie_accept:'ACCEPTER',cookie_reject:'ESSENTIELS UNIQUEMENT',cookie_privacy:'Politique de confidentialit\u00e9',
  activity_just:'\u00c0 l\u0027instant \u00b7 Aura Global',
  sec_process:'NOTRE PROCESSUS',sec_how:'Comment fonctionne Aura',sec_how_d:'Chaque produit passe par notre processus d\u0027inspection en trois \u00e9tapes au hub de Londres avant de vous parvenir.',
  step1_n:'\u00c9tape 1',step1_t:'Approvisionnement',step1_d:'Nous achetons des produits originaux directement aupr\u00e8s de revendeurs agr\u00e9\u00e9s et de marques mondiales. Plus de 120 sources v\u00e9rifi\u00e9es.',
  step2_n:'\u00c9tape 2',step2_t:'Inspection Hub',step2_d:'Dans notre hub londonien, chaque produit est contr\u00f4l\u00e9 manuellement \u2014 avec documentation vid\u00e9o.',
  step3_n:'\u00c9tape 3',step3_t:'Livraison chez vous',step3_d:'Colis scell\u00e9, inspect\u00e9 \u2014 assur\u00e9 et suivi jusqu\u0027\u00e0 votre porte. En 2\u20134 jours.',
  stat_items:'Articles inspect\u00e9s',stat_brands:'Top Marques',stat_sat:'Satisfaction client',stat_del:'Jours de livraison',
  cat_elec_d:'Smartphones, PC portables, Audio',cat_fash_d:'Chaussures, Sacs, Bijoux',cat_home_d:'Dyson, Maison connect\u00e9e, Soin',cat_travel_d:'Bagages, Accessoires',cat_beauty:'Beaut\u00e9 & Soin',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'D\u00c9COUVRIR \u2192',
  spot_top:'TOP CAT\u00c9GORIE',spot_elec:'\u00c9lectronique & Tech',spot_all_elec:'Toute l\u0027\u00e9lectronique \u2192',spot_fash:'Mode & Lifestyle',spot_all_fash:'Toute la mode \u2192',
  sec_trending_label:'TENDANCES',sec_trending:'Tendances actuelles',sec_all_new:'Toutes les nouveaut\u00e9s \u2192',
  sec_premium:'S\u00c9LECTION PREMIUM',sec_brands_grid:'120+ Top Marques en un coup d\u0027\u0153il',sec_brands_d:'Des marques mondiales \u2014 inspect\u00e9es et livr\u00e9es chez vous.',sec_brands_sub:'Plus de 120 marques v\u00e9rifi\u00e9es du monde entier',
  sec_testi_label:'T\u00c9MOIGNAGES',sec_testimonials:'Ce que disent nos clients',
  sec_why_label:'POURQUOI AURA\u00a0?',sec_why:'La diff\u00e9rence est dans les d\u00e9tails',
  sec_mission:'NOTRE MISSION',sec_sust:'\u00c9conomie circulaire, pas de gaspillage',
  mega_smartphones:'Smartphones & Tablettes',mega_laptops:'Ordinateurs portables',mega_laptops_audio:'Ordinateurs portables & Audio',mega_audio:'Audio & Wearables',mega_gaming:'Gaming & VR',
  mega_shoes:'Chaussures & Baskets',mega_designer:'Designer & Luxe',mega_jewelry:'Bijoux & Montres',mega_clothing:'Vêtements & Accessoires',
  mega_home:'Maison & Habitat',mega_travel:'Voyage & Outdoor',
  mega_all_el:'Voir toute l\u2019\u00c9lectronique \u2192',mega_all_fa:'Voir toute la Mode \u2192',mega_all_home:'Voir tout Maison \u2192',mega_all_travel:'Voir tout Voyage \u2192',
  mega_bose:'Casques Bose',mega_dyson_hair:'Dyson Soins & Nettoyage',mega_ecovacs:'Aspirateurs robots Ecovacs',mega_hexclad:'Ustensiles HexClad',mega_ring:'Sécurité Ring',mega_rimowa:'Valises Rimowa',
  ck_phone:'Téléphone',ck_card_brands:'Visa, Mastercard, American Express',ck_klarna:'Klarna — Facture',ck_klarna_d:'Payer sous 14 jours',ck_wallet:'Apple Pay / Google Pay',ck_wallet_d:'Paiement rapide & sécurisé',
  country_de:'Allemagne',country_at:'Autriche',country_ch:'Suisse',country_gb:'Royaume-Uni',country_us:'États-Unis',
  ct_name:'Nom complet *',ct_email:'Adresse e-mail *',ct_order:'Numéro de commande',ct_subject:'Objet *',ct_message:'Message *',
  ct_select_ph:'Veuillez choisir...',ct_opt_product:'Question produit',ct_opt_logistics:'Logistique & livraison',ct_opt_warranty:'Garantie & réclamation',ct_opt_career:'Carrière',ct_opt_return:'Retour & remboursement',ct_opt_payment:'Paiement & facture',ct_opt_other:'Autre',
  err_storage_full:'Stockage plein — données trop volumineuses',err_email_exists:'Cet e-mail est déjà enregistré',err_wrong_pass:'Mot de passe incorrect',err_user_not_found:'Utilisateur non trouvé',err_auth_required:'Veuillez vous connecter',msg_wishlist_removed:'Retiré de la liste de souhaits',msg_wishlist_added:'Ajouté à la liste de souhaits',
  ft_all_products:'Tous les produits',ft_electronics:'Électronique',ft_fashion:'Mode & Accessoires',ft_home:'Maison',ft_travel:'Voyage & Outdoor',ft_shipping_pay:'Livraison & Paiement',ft_faq:'FAQ',ft_about:'À propos',ft_sustainability:'Durabilité',ft_sourcing:'Notre approvisionnement',ft_careers:'Carrière',ft_copyright:'© 2026 Aura Global Merchants Ltd. Tous droits réservés.',ft_ssl:'Paiement sécurisé avec chiffrement SSL 256 bits',ft_ssl_ck:'Vos données sont protégées par un chiffrement SSL 256 bits',
  sort_newest:'Nouveautés',flt_apply:'APPLIQUER',
  day_sun:'Dimanche',day_mon:'Lundi',day_tue:'Mardi',day_wed:'Mercredi',day_thu:'Jeudi',day_fri:'Vendredi',day_sat:'Samedi',
  prd_protocol:'Protocole Aura',prd_whats_box:'Contenu de la boîte',prd_box_product:'Produit original',prd_box_sealed:'Scellé & vérifié',prd_box_cert:'Certificat Aura',prd_box_insp:'Rapport d\u2019inspection',prd_box_warranty:'Carte de garantie',prd_box_12m:'12 mois de protection',prd_box_return:'Étiquette de retour',prd_box_30d:'Retour sous 30 jours',
  prd_tab_desc:'Description',prd_tab_specs:'Fiche technique',prd_tab_ship:'Livraison & Retours',
  prd_ship_h:'Expédition depuis Berlin / Londres',prd_ship_p:'Toutes les commandes sont expédiées depuis notre entrepôt de Berlin ou Londres. Livraison standard (3–5 jours) gratuite dès 99€. Express (1–2 jours) 9,90€.',
  prd_ret_h:'Retour sous 30 jours',prd_ret_p:'Retour possible sous 30 jours si l\u2019article ne correspond pas à la description Aura. Retour gratuit avec étiquette prépayée.',
  prd_prot_h:'Aura Buyer Protection',prd_prot_p:'Chaque achat est couvert par notre programme Aura Buyer Protection. Remboursement intégral ou remplacement en cas de problème.',
  prd_reviews:'Avis clients',prd_reviews_w:'Avis',prd_order_now:'Commandez maintenant pour livraison le',prd_hub:'(Hub Berlin)',
  prd_cond_orig:'Produit original',prd_cond_orig_d:'Contrôlé et vérifié manuellement. Expédition rapide depuis le Hub.',prd_cond_verified:'Vérifié',prd_cond_verified_d:'Contrôlé manuellement avec vidéo. 100% Original.',
  prd_saving:'Économie :',prd_stock_low:'Plus que {n} en stock !',prd_stock_avail:'Encore {n} en stock',prd_in_stock:'en stock',
  prd_proto_score:'Protocole : {n}/3 réussi',
  prd_insp_auth:'Authenticité',prd_insp_auth_y:'Numéro de série vérifié auprès du fabricant.',prd_insp_auth_n:'Authenticité non entièrement confirmée.',
  prd_insp_func:'Fonctionnalité',prd_insp_func_y:'Batterie, capteurs et écran entièrement testés.',prd_insp_func_n:'Test fonctionnel en attente ou partiellement réussi.',
  prd_insp_source:'Approvisionnement',prd_insp_source_d:'Provenance directe de {shop} & inspecté à Londres.',
  prd_insp_seal:'Scellé & Garantie',prd_insp_warranty:'Garantie',prd_insp_seal_y:'Scellé avec le sceau Aura. Garantie 12 mois.',prd_insp_seal_n:'Garantie 12 mois (sans sceau d\u2019origine).',
  prd_why_aura:'Pourquoi Aura Global ?',prd_why_1:'Chaque produit passe notre protocole de 47 points',prd_why_2:'Approvisionné auprès de détaillants autorisés ({shop})',prd_why_3:'Garantie Aura de 12 mois incluse',prd_why_4:'Livraison gratuite & retours sous 30 jours',
  prd_seal_title:'Sceau de qualité Aura',prd_seal_desc:'Chaque produit est scellé avec un sceau Aura. Votre marque d\u2019authenticité.',prd_seal_verified:'Inspecté & scellé à Londres',
  prd_spec_brand:'Marque',prd_spec_cat:'Catégorie',prd_spec_cond:'État',prd_spec_cond_v:'Hub Vérifié — Neuf avec vidéo',prd_spec_cond_c:'Aura Check — Vérifié',
  prd_spec_rating:'Note',prd_spec_stock:'Disponibilité',prd_spec_ship:'Livraison',prd_spec_ship_v:'Gratuit dès 99€, DHL Express',
  prd_spec_warranty:'Garantie',prd_spec_warranty_v:'12 mois Aura Global',prd_spec_source:'Source',prd_spec_source_v:'Détaillant autorisé ({shop})',
  prd_spec_insp:'Inspection',prd_spec_insp_loc:'Entrepôt de Londres',
  ds_nav_orders:'Mes commandes',ds_nav_profile:'Données personnelles',ds_nav_addr:'Adresses',ds_nav_wish:'Liste de souhaits',
  ds_nav_pay:'Moyens de paiement',ds_nav_notif:'Notifications',ds_nav_sec:'Sécurité',ds_nav_set:'Paramètres du compte',
  ds_member_since:'Membre depuis',ds_fname:'Prénom',ds_lname:'Nom',ds_dob:'Date de naissance',ds_lang:'Langue',ds_save:'ENREGISTRER',ds_cancel:'ANNULER',ds_cancel_lc:'Annuler',
  ds_addr_h:'Adresses enregistrées',ds_addr_new:'Nouvelle adresse',ds_addr_edit:'Modifier l\'adresse',ds_addr_empty:'Aucune adresse enregistrée',ds_addr_empty_d:'Ajoutez une adresse de livraison pour un paiement plus rapide',
  ds_street:'Rue & numéro',ds_addr_extra:'Complément d\'adresse',ds_zip:'Code postal',ds_city:'Ville',ds_country:'Pays',ds_addr_default:'Définir comme adresse par défaut',
  ds_wish_h:'Ma liste de souhaits',ds_wish_empty:'Votre liste de souhaits est vide',ds_wish_empty_d:'Enregistrez vos produits préférés',ds_wish_browse:'DÉCOUVRIR LES PRODUITS',
  ds_pay_add:'Ajouter',ds_pay_empty:'Aucun moyen de paiement enregistré',ds_pay_type:'Type',ds_pay_sepa:'Prélèvement SEPA',
  ds_pay_holder:'Titulaire de la carte',ds_pay_last4:'Numéro de carte (4 derniers)',ds_pay_exp:'Date d\'expiration',ds_pay_email:'E-mail / Compte',ds_pay_default:'Définir par défaut',ds_pay_default_set:'Définir par défaut',
  ds_pay_info:'Vos données de paiement sont stockées de manière sécurisée. Nous utilisons le chiffrement SSL/TLS et sommes certifiés PCI-DSS.',
  ds_pay_new:'Nouveau moyen de paiement',ds_pay_edit:'Modifier le moyen de paiement',ds_pay_expires:'Expire',ds_pay_connected:'Connecté',
  ds_notif_h:'Paramètres de notification',ds_notif_orders:'Statut de commande',ds_notif_orders_d:'Mises à jour de vos commandes par e-mail',
  ds_notif_deals:'Offres & Promotions',ds_notif_deals_d:'Offres exclusives directement par e-mail',
  ds_notif_price:'Alertes de prix',ds_notif_price_d:'Notification en cas de baisse de prix sur la liste de souhaits',
  ds_notif_news:'Newsletter',ds_notif_news_d:'Nouveautés et recommandations hebdomadaires',
  ds_notif_push:'Notifications push',ds_notif_push_d:'Notifications navigateur pour les mises à jour importantes',
  ds_sec_pw_h:'Changer le mot de passe',ds_sec_cur:'Mot de passe actuel',ds_sec_new:'Nouveau mot de passe',ds_sec_confirm:'Confirmer le mot de passe',ds_sec_pwchange:'CHANGER LE MOT DE PASSE',
  ds_sec_2fa_h:'Authentification à deux facteurs',ds_sec_2fa:'Statut 2FA',ds_sec_2fa_d:'Renforcez la sécurité avec une vérification supplémentaire',
  ds_sec_sessions:'Sessions actives',ds_sec_this:'Ce navigateur',ds_sec_active:'Actif',
  ds_set_id:'ID du compte',ds_set_copy:'Copier',ds_set_member:'Adhésion',ds_set_member_v:'Aura Standard',ds_set_currency:'Devise',
  ds_set_export:'Export de données',ds_set_export_d:'Téléchargez toutes vos données personnelles',ds_set_export_btn:'EXPORTER',
  ds_set_delete:'Supprimer le compte',ds_set_delete_d:'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',ds_set_delete_btn:'SUPPRIMER LE COMPTE',
  ds_standard:'Par défaut',ds_edit:'Modifier',ds_delete:'Supprimer',
  ds_tl_paid:'Payé',ds_tl_sourcing:'Prêt à expédier',ds_tl_inspection:'Inspecté',ds_tl_shipped:'Expédié',ds_tl_delivered:'Livré',
  ds_ord_nr:'N° commande',ds_ord_date:'Date',ds_ord_total:'Total',ds_ord_track:'Suivre',ds_ord_receipt:'Facture',ds_ord_help:'Aide',
  ds_ord_reviewed:'Évalué',ds_ord_review:'Évaluer',ds_ord_tracking:'N° envoi',
  ds_rv_h:'Donner un avis',ds_rv_d:'Partagez votre expérience',ds_rv_submit:'Envoyer les avis',ds_rv_rating:'Note',ds_rv_photos:'Photos (max. 3)',ds_rv_add:'Ajouter',ds_rv_all_done:'Tous les produits déjà évalués !',
  ds_t_copied:'Copié',ds_t_export:'Export en préparation…',ds_t_currency:'Devise enregistrée',ds_t_delete_confirm:'Êtes-vous sûr ? Toutes les données seront supprimées.',
  ds_t_enter_name:'Veuillez entrer un nom',ds_t_profile:'Profil enregistré',ds_t_required:'Veuillez remplir les champs obligatoires',
  ds_t_addr_saved:'Adresse enregistrée',ds_t_addr_del_q:'Supprimer l\'adresse ?',ds_t_addr_deleted:'Adresse supprimée',ds_t_addr_default:'Adresse par défaut mise à jour',
  ds_t_wish_removed:'Retiré de la liste de souhaits',ds_t_cart_added:'Ajouté au panier',ds_t_last4:'Veuillez entrer les 4 derniers chiffres',
  ds_t_pay_saved:'Moyen de paiement enregistré',ds_t_pay_del_q:'Supprimer le moyen de paiement ?',ds_t_pay_deleted:'Moyen de paiement supprimé',ds_t_default:'Par défaut mis à jour',
  ds_t_notif:'Paramètres enregistrés',ds_t_fill_all:'Veuillez remplir tous les champs',ds_t_pw_mismatch:'Les mots de passe ne correspondent pas',
  ds_t_pw_min:'Au moins 6 caractères',ds_t_pw_wrong:'Mot de passe actuel incorrect',ds_t_pw_changed:'Mot de passe modifié',
  ds_t_2fa_on:'2FA activé',ds_t_2fa_off:'2FA désactivé',ds_t_stars:'Veuillez donner au moins 1 étoile par produit',
  ds_t_review_thx:'Merci pour votre avis !',ds_t_no_receipt:'Facture pas encore disponible',ds_t_video_missing:'Vidéo introuvable',ds_t_max_photos:'Max. 3 photos',
  ct_hero:'Centre de Service',ct_hero_d:'Notre équipe de support répond à votre demande dans les 24 heures.',
  ct_form_h:'Envoyer une demande',ct_form_d:'Remplissez le formulaire — nous vous répondrons rapidement.',
  ct_sent:'Demande envoyée !',ct_sent_thx:'Merci pour votre message.',ct_sent_24h:'Nous traiterons votre demande dans les 24 heures.',ct_ref:'Numéro de référence :',ct_home:'RETOUR À L\'ACCUEIL',
  ct_privacy:'J\'ai lu la politique de confidentialité et j\'accepte le traitement de mes données. *',ct_submit:'ENVOYER LA DEMANDE',
  ct_reg_nr:'N° société :',ct_reg_where:'Enregistré :',ct_reg_ceo:'Directeur :',ct_channels:'Canaux directs',
  ct_wa_d:'Chattez maintenant — réponse rapide',ct_tg_d:'Chattez maintenant — communication sécurisée',
  ct_hours_h:'Heures de service',ct_hrs_mf:'Lundi – Vendredi',ct_hrs_sat:'Samedi',ct_hrs_sun:'Dimanche & Jours fériés',ct_hrs_closed:'Fermé',
  ct_hrs_avg:'Temps de réponse moyen : moins de 4 heures pendant les heures ouvrables.',
  ct_quick:'Accès rapide',ct_q_track:'Suivre l\'envoi',ct_q_return:'Retours',ct_q_ship:'Livraison',
  ct_v_name:'Veuillez entrer votre nom.',ct_v_email:'Veuillez entrer une adresse e-mail valide.',ct_v_subject:'Veuillez choisir un sujet.',ct_v_message:'Veuillez entrer votre message.',ct_v_privacy:'Veuillez accepter la politique de confidentialité.',
  lg_gdpr:'J\'ai lu les CGV et la politique de confidentialité et j\'y consens.',lg_gdpr_req:'Veuillez accepter les CGV et la politique de confidentialité.',
  lg_btn_verify:'VÉRIFIER LE CODE',lg_no_account:'Aucun compte trouvé avec cet e-mail.',lg_code_sent:'Un code à 6 chiffres a été envoyé à {email}.',
  lg_enter_code:'Veuillez entrer le code à 6 chiffres.',lg_pw_min:'Le mot de passe doit comporter au moins 6 caractères.',lg_pw_mismatch:'Les mots de passe ne correspondent pas.',lg_pw_changed:'Mot de passe modifié avec succès !',
  ft_copyright_short:'© 2026 Aura Global Merchants Ltd. · Company No. 15847293',
},
es:{
  locale_label:'Espa\u00f1ol',
  top_bar:'Env\u00edo gratis desde 99\u20ac \u00b7 Devoluci\u00f3n en 30 d\u00edas',
  guarantee:'Garant\u00eda',
  search_ph:'Buscar productos, marcas, categor\u00edas...',
  nav_all:'Todos',nav_electronics:'Electr\u00f3nica',nav_fashion:'Moda',nav_fashion_long:'Moda y Accesorios',nav_home:'Hogar',nav_travel:'Viaje & Outdoor',nav_sale:'Ofertas %',nav_new:'Novedades',
  mob_login:'Iniciar sesi\u00f3n / Registro',mob_orders:'Mis pedidos',
  hero_tag:'Verificado \u00b7 Fiable \u00b7 Asequible',hero_h1a:'Electr\u00f3nica y Moda verificada',hero_h1b:'directo del almac\u00e9n',
  hero_desc:'Cada producto se inspecciona manualmente en nuestro hub de Londres. Autenticidad y funcionalidad garantizadas al 100%.',
  hero_cta1:'VER TODOS',hero_cta2:'OFERTAS',
  trust_v:'Productos verificados',trust_vd:'Inspecci\u00f3n manual',trust_s:'Env\u00edo r\u00e1pido',trust_sd:'Entrega en 2\u20134 d\u00edas',trust_r:'Devoluci\u00f3n gratis',trust_rd:'30 d\u00edas, sin riesgo',trust_p:'Pago seguro',trust_pd:'SSL, PCI DSS',
  sec_cat:'Categor\u00edas',sec_feat:'Productos populares',sec_brands:'Nuestras marcas',sec_news:'Bolet\u00edn',
  news_desc:'Nuevas ofertas en tu buz\u00f3n.',news_ph:'Tu correo electr\u00f3nico',news_btn:'SUSCRIBIRSE',
  add_cart:'A\u00d1ADIR AL CARRITO',view_prod:'VER',
  ft_cat:'Categor\u00edas',ft_svc:'Atenci\u00f3n al cliente',ft_co:'Empresa',ft_contact:'Contacto',ft_track:'Seguimiento',ft_returns:'Devoluciones',ft_story:'Nuestra historia',ft_privacy:'Privacidad',ft_terms:'Condiciones',ft_imprint:'Aviso legal',
  ft_desc:'Productos de marca verificados desde Londres.',
  cart_title:'Carrito',cart_empty:'Tu carrito est\u00e1 vac\u00edo',cart_total:'Total',cart_checkout:'TRAMITAR PEDIDO',
  flt_cat:'Categor\u00eda',flt_brand:'Marca',flt_price:'Precio',flt_cond:'Estado',flt_verified:'Verificado',flt_openbox:'Original',
  sort_default:'Recomendado',sort_price_asc:'Precio asc.',sort_price_desc:'Precio desc.',sort_name:'Nombre A-Z',sort_rating:'Mejor valorado',
  flt_reset:'Restablecer',flt_results:'Productos',flt_mobile:'Filtrar y Ordenar',
  prd_qty:'Cantidad:',prd_add:'A\u00d1ADIR',prd_desc:'Descripci\u00f3n',prd_specs:'Especificaciones',prd_rev:'Rese\u00f1as',prd_related:'Tambi\u00e9n te puede gustar',
  prd_instock:'En stock',prd_ship:'Env\u00edo gratis',prd_inspect:'Inspeccionado en Londres \u2014 100% original',
  spec_brand:'Marca',spec_cat:'Categor\u00eda',spec_cond:'Estado',spec_cond_v:'Verificado \u2014 Nuevo',spec_cond_o:'Verificado',spec_rating:'Valoraci\u00f3n',spec_avail:'Disponibilidad',spec_avail_v:'en stock',spec_ship:'Env\u00edo',spec_ship_v:'Gratis desde 99\u20ac, DHL Express',
  lg_login:'INICIAR SESI\u00d3N',lg_register:'REGISTRARSE',lg_login_desc:'Inicia sesi\u00f3n con tu correo.',lg_reg_desc:'Crea una cuenta para comprar.',
  lbl_email:'Correo',lbl_pass:'Contrase\u00f1a',lbl_name:'Nombre completo',lbl_pass2:'Confirmar contrase\u00f1a',
  btn_login:'INICIAR SESI\u00d3N',btn_register:'CREAR CUENTA',back_shop:'\u2190 Volver',to_shop:'A la tienda \u2192',
  ck_s1:'1. Env\u00edo',ck_s2:'2. Pago',ck_s3:'3. Confirmaci\u00f3n',
  ck_addr:'Direcci\u00f3n de env\u00edo',ck_first:'Nombre',ck_last:'Apellido',ck_street:'Calle y n\u00ba',ck_zip:'C\u00f3digo postal',ck_city:'Ciudad',ck_country:'Pa\u00eds',
  ck_ship:'M\u00e9todo de env\u00edo',ck_std:'Est\u00e1ndar',ck_std_d:'3\u20135 d\u00edas',ck_exp:'Express',ck_exp_d:'1\u20132 d\u00edas',ck_free:'Gratis',
  ck_next:'CONTINUAR AL PAGO',ck_summary:'Resumen',ck_sub:'Subtotal',ck_shipping:'Env\u00edo',ck_total:'Total',
  ck_pay:'M\u00e9todo de pago',ck_card:'Tarjeta cr\u00e9dito / d\u00e9bito',ck_cardnum:'N\u00b0 de tarjeta',ck_cardexp:'Caducidad',
  ck_back:'\u2190 VOLVER',ck_place:'REALIZAR PEDIDO',
  ck_done:'\u00a1Pedido confirmado!',ck_thanks:'Gracias por tu pedido en Aura Global Merchants.',ck_ordernum:'N\u00b0 de pedido:',ck_myorders:'MIS PEDIDOS',ck_continue:'SEGUIR COMPRANDO',
  ck_stripe_sec:'Protegido por <strong class="text-gray-600">Stripe</strong> \u2014 Tus datos de tarjeta se cifran y nunca se almacenan en nuestros servidores.',ck_gdpr:'He le\u00eddo y acepto los <a href="/terms.html" target="_blank" class="text-gold hover:underline font-medium">T\u00e9rminos y condiciones</a> y la <a href="/privacy.html" target="_blank" class="text-gold hover:underline font-medium">Pol\u00edtica de privacidad</a>. He sido informado/a de mi <a href="/returns.html#widerrufsformular" target="_blank" class="text-gold hover:underline font-medium">derecho de desistimiento</a>.',ck_gdpr_req:'Por favor, acepta los T\u00e9rminos y la Pol\u00edtica de privacidad.',ck_processing:'Procesando...',ck_badge_ssl:'SSL cifrado',ck_badge_pci:'Conforme PCI DSS',
  hp_why_video:'Protocolo de inspecci\u00f3n por v\u00eddeo',hp_why_video_d:'Cada producto se documenta con un protocolo en v\u00eddeo \u2014 desde la apertura del paquete hasta la prueba de funcionamiento.',
  hp_why_auth:'100% originales verificados',hp_why_auth_d:'Solo nos abastecemos de fuentes autorizadas. N\u00fameros de serie comprobados, falsificaciones descartadas.',
  hp_why_return:'30 d\u00edas de desistimiento',hp_why_return_d:'Si algo no est\u00e1 bien, lo devolvemos \u2014 sin discusi\u00f3n. Env\u00edo asegurado, reembolso completo.',
  hp_why_global:'Aprovisionamiento global, env\u00edo local',hp_why_global_d:'Compramos en todo el mundo, inspeccionamos en Londres y enviamos desde hubs europeos.',
  hp_vs_h:'Aura vs. Marketplaces',hp_vs_video:'Inspecci\u00f3n por v\u00eddeo',hp_vs_hub:'Control de calidad en Hub',hp_vs_orig:'Garant\u00eda de autenticidad',hp_vs_seal:'Sello del paquete',hp_vs_dach:'Soporte personal DACH',hp_vs_ship:'Env\u00edo 2\u20134 d\u00edas laborables',
  hp_sust_d:'Cada producto en Aura es un producto rescatado. Damos una segunda vida a art\u00edculos de marca.',
  hp_sust_1:'Ahorrar recursos',hp_sust_1d:'Hasta un 90% menos de CO\u2082 por producto.',
  hp_sust_2:'Calidad verificada',hp_sust_2d:'Aura Verified: inspecci\u00f3n multietapa con documentaci\u00f3n en v\u00eddeo.',
  hp_sust_3:'Precio justo',hp_sust_3d:'Art\u00edculos de marca hasta un 40% m\u00e1s baratos.',
  hp_sust_cta:'M\u00e1s sobre nuestra misi\u00f3n',
  hp_rev1:'\u00abAl principio era esc\u00e9ptico, pero la inspecci\u00f3n por v\u00eddeo me convenci\u00f3 de inmediato. Mi iPhone lleg\u00f3 en perfecto estado. \u00a1Muy recomendable!\u00bb',
  hp_rev2:'\u00abBolso Gucci en perfecto estado, con recibo original y v\u00eddeo de inspecci\u00f3n. Proceso transparente y profesional.\u00bb',
  hp_rev3:'\u00abEl Dyson Airwrap estaba agotado en todas partes. En Aura lo recib\u00ed de inmediato y un 15% m\u00e1s barato. \u00a1Gran servicio!\u00bb',
  news_enter_email:'Introduce tu correo electr\u00f3nico',news_subscribed:'\u00a1Suscrito con \u00e9xito! Revisa tu bandeja de entrada.',news_error:'Error \u2014 recarga la p\u00e1gina',
  faq_q9:'\u00bfPor qu\u00e9 los precios son m\u00e1s bajos que en el comercio minorista?',faq_a9:'Como plataforma internacional de aprovisionamiento, compramos directamente a distribuidores autorizados en varios mercados. Las diferencias de precio se deben a la fijaci\u00f3n regional de precios, tipos de cambio y promociones locales. Todos los productos son 100% originales.',
  faq_q10:'\u00bfQu\u00e9 garant\u00eda recibo?',faq_a10:'Los art\u00edculos nuevos tienen 24 meses de garant\u00eda legal, los usados 12 meses. Adem\u00e1s, cada producto se verifica seg\u00fan el Protocolo de Inspecci\u00f3n Aura antes del env\u00edo.',
  faq_q11:'\u00bfQu\u00e9 m\u00e9todos de pago aceptan?',faq_a11:'Aceptamos Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay y Klarna (factura/plazos). Todos los pagos se procesan de forma segura a trav\u00e9s de Stripe \u2014 conforme con PCI-DSS Level 1.',
  faq_q12:'\u00bfQu\u00e9 significa el estado del pedido \u00abSourcing\u00bb?',faq_a12_intro:'Tras recibir tu pago, tu pedido pasa por los siguientes estados:',faq_a12_paid:'<span class="font-bold text-navy">Pagado:</span> Pago recibido correctamente.',faq_a12_sourcing:'<span class="font-bold text-navy">Sourcing:</span> Estamos adquiriendo tu producto del distribuidor autorizado. Esto tarda 1\u20133 d\u00edas h\u00e1biles.',faq_a12_shipped:'<span class="font-bold text-navy">Enviado:</span> El producto ha sido inspeccionado, documentado en v\u00eddeo y enviado.',faq_a12_delivered:'<span class="font-bold text-navy">Entregado:</span> Entrega completada con \u00e9xito.',
  faq_q13:'\u00bfHay gastos de aduana?',faq_a13:'Al enviar desde el Reino Unido, pueden aplicarse tasas aduaneras para entregas en la UE. Para pedidos a Alemania, nos encargamos del despacho de aduanas (DDP) en la mayor\u00eda de los casos. Detalles en nuestra <a href="/shipping.html" class="text-gold hover:underline font-semibold">p\u00e1gina de env\u00edos</a>.',
  faq_q14:'\u00bfPuedo cancelar mi pedido?',faq_a14:'S\u00ed, los pedidos pueden cancelarse gratuitamente hasta el inicio del aprovisionamiento (estado \u00abSourcing\u00bb). Una vez en tr\u00e1nsito, la cancelaci\u00f3n ya no es posible. Usa nuestro <a href="/returns.html" class="text-gold hover:underline font-semibold">proceso de devoluci\u00f3n</a> con plazo de 30 d\u00edas.',
  faq_q15:'\u00bfQu\u00e9 pasa con mis datos?',faq_a15:'Nos tomamos en serio la protecci\u00f3n de datos y procesamos tus datos \u00fanicamente para la gesti\u00f3n de tu pedido seg\u00fan el RGPD y el UK GDPR. Detalles en nuestra <a href="/privacy.html" class="text-gold hover:underline font-semibold">Pol\u00edtica de privacidad</a>.',
  faq_q16:'\u00bfEnvi\u00e1is a Suiza y Austria?',faq_a16:'S\u00ed, enviamos a toda la regi\u00f3n DACH y otros pa\u00edses de la UE. Env\u00edo est\u00e1ndar a Austria: 3\u20135 d\u00edas h\u00e1biles, Suiza: 4\u20136. Env\u00edo gratuito a partir de 99 \u20ac (Suiza: desde 149 CHF).',
  faq_q17:'\u00bfD\u00f3nde est\u00e1 vuestro almac\u00e9n?',faq_a17:'Nuestro almac\u00e9n principal y centro de inspecci\u00f3n est\u00e1 en Londres, Reino Unido. Todos los productos se inspeccionan seg\u00fan el Protocolo Aura, se documentan en v\u00eddeo y se preparan para el env\u00edo.',
  faq_q18:'\u00bfC\u00f3mo contactar con el servicio de atenci\u00f3n al cliente?',faq_a18:'Por email en <a href="mailto:admin@auraglobal-merchants.com" class="text-gold hover:underline">admin@auraglobal-merchants.com</a> o a trav\u00e9s de nuestro <a href="/contact.html" class="text-gold hover:underline font-semibold">formulario de contacto</a>. Nuestro equipo est\u00e1 disponible de lunes a viernes de 9:00 a 18:00 (CET). Respondemos en 24 horas.',
  ds_noauth:'No has iniciado sesi\u00f3n',ds_noauth_d:'Inicia sesi\u00f3n para ver tu cuenta.',ds_login:'INICIAR SESI\u00d3N',
  ds_hello:'Hola,',ds_logout:'Cerrar sesi\u00f3n',ds_orders:'Mis pedidos',ds_settings:'Configuraci\u00f3n',
  ds_empty:'A\u00fan no tienes pedidos.',ds_shop:'COMPRAR',
  ds_personal:'Datos personales',ds_save:'GUARDAR',ds_delete:'Eliminar cuenta',ds_delete_d:'Acci\u00f3n irreversible.',ds_delete_btn:'ELIMINAR',
  ds_ordernum:'N\u00ba pedido',ds_date:'Fecha',
  st_pending:'Pendiente',st_paid:'Pagado',st_sourcing:'Preparaci\u00f3n',st_shipped:'Enviado',st_delivered:'Entregado',st_inspection:'Inspecci\u00f3n',
  trk_title:'Seguimiento',trk_desc:'Introduce n\u00b0 de pedido y correo.',trk_order_id:'N\u00b0 pedido',trk_email:'Correo',trk_btn:'BUSCAR',trk_not_found:'Pedido no encontrado.',
  trk_paid:'Pagado',trk_paid_d:'Pago recibido',trk_sourcing:'Procesando',trk_sourcing_d:'En preparaci\u00f3n',trk_shipped:'Enviado',trk_shipped_d:'En camino',trk_delivered:'Entregado',trk_delivered_d:'Entregado',
  trk_track_num:'N\u00ba seguimiento',trk_track_btn:'Seguir env\u00edo',trk_receipt:'Comprobante',trk_dl_receipt:'Descargar',
  svc_returns_title:'Devoluciones',svc_shipping_title:'Pol\u00edtica de env\u00edo',svc_faq_title:'Preguntas frecuentes',
  co_story_title:'Nuestra historia',co_privacy_title:'Privacidad',co_terms_title:'Condiciones',co_imprint_title:'Aviso legal',
  mega_electronics:'Electr\u00f3nica',mega_fashion:'Moda',mega_all_el:'Toda electr\u00f3nica \u2192',mega_all_fa:'Toda moda \u2192',
  fill_all:'Rellena todos los campos',pass_mismatch:'Las contrase\u00f1as no coinciden.',added_cart:'a\u00f1adido al carrito',
  settings_saved:'Guardado',order_placed:'\u00a1Pedido realizado!',welcome_back:'\u00a1Bienvenido!',account_created:'\u00a1Cuenta creada!',delete_confirm:'\u00bfEliminar cuenta?',
  card_free_ship:'Env\u00edo gratis',card_inspected:'Verificado',card_instock:'En stock',card_reviews:'Rese\u00f1as',card_sold:'vendidos',card_returns:'30 d\u00edas devoluci\u00f3n',card_delivery:'Entrega en 2\u20134 d\u00edas',
  price_vat:'IVA incluido, gastos de env\u00edo aparte',cart_remove:'Eliminar',cart_empty_msg:'Carrito vac\u00edo',cart_continue:'Seguir comprando',
  hero_trust_ship:'Env\u00edo en 2\u20134 d\u00edas',hero_trust_return:'30 d\u00edas devoluci\u00f3n',hero_trust_pay:'Pago seguro',
  prime_title:'Hazte miembro Aura Prime',prime_desc:'Recibe <strong style="color:#C5A059">ofertas exclusivas</strong>, acceso anticipado y env\u00edo Express gratis.',prime_btn:'UNIRSE',prime_ph:'Correo electr\u00f3nico',prime_ok:'\u00a1Bienvenido a Aura Prime!',prime_ok_d:'Te contactaremos pronto.',prime_spam:'Sin spam. Cancela cuando quieras.',
  price_m_title:'Precios honestos, l\u00f3gica clara',price_m_desc:'Por qu\u00e9 somos m\u00e1s baratos \u2014 sin sacrificar calidad.',price_m_uvp:'Precio retail (PVP)',price_m_aura:'Aura Direct',price_m_explain:'Compramos devoluciones y stock de liquidaci\u00f3n directamente. Resultado: <strong style="color:#001A3D">ahorras hasta un 40%</strong>.',price_m_ok:'ENTENDIDO',
  cookie_text:'Solo usamos <strong style="color:white">cookies t\u00e9cnicas</strong> necesarias para el funcionamiento del sitio. M\u00e1s informaci\u00f3n en nuestra',cookie_accept:'ACEPTAR',cookie_reject:'SOLO ESENCIALES',cookie_privacy:'Pol\u00edtica de privacidad',
  activity_just:'Ahora mismo \u00b7 Aura Global',
  sec_process:'NUESTRO PROCESO',sec_how:'C\u00f3mo funciona Aura',sec_how_d:'Cada producto pasa por nuestro proceso de inspecci\u00f3n en tres pasos en el hub de Londres antes de llegar a usted.',
  step1_n:'Paso 1',step1_t:'Abastecimiento',step1_d:'Obtenemos productos originales directamente de distribuidores autorizados y marcas de todo el mundo. M\u00e1s de 120 fuentes verificadas.',
  step2_n:'Paso 2',step2_t:'Inspecci\u00f3n Hub',step2_d:'En nuestro hub de Londres, cada producto se verifica manualmente \u2014 con documentaci\u00f3n en v\u00eddeo.',
  step3_n:'Paso 3',step3_t:'Env\u00edo a su puerta',step3_d:'Paquete sellado e inspeccionado \u2014 asegurado y rastreado hasta su puerta. En solo 2\u20134 d\u00edas.',
  stat_items:'Art\u00edculos inspeccionados',stat_brands:'Top Marcas',stat_sat:'Satisfacci\u00f3n del cliente',stat_del:'D\u00edas de entrega',
  cat_elec_d:'Smartphones, Port\u00e1tiles, Audio',cat_fash_d:'Zapatos, Bolsos, Joyer\u00eda',cat_home_d:'Dyson, Hogar inteligente, Cuidado',cat_travel_d:'Equipaje, Accesorios',cat_beauty:'Belleza & Cuidado',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'DESCUBRIR \u2192',
  spot_top:'TOP CATEGOR\u00cdA',spot_elec:'Electr\u00f3nica & Tech',spot_all_elec:'Toda la Electr\u00f3nica \u2192',spot_fash:'Moda & Lifestyle',spot_all_fash:'Toda la Moda \u2192',
  sec_trending_label:'TENDENCIA',sec_trending:'En tendencia ahora',sec_all_new:'Todas las novedades \u2192',
  sec_premium:'SELECCI\u00d3N PREMIUM',sec_brands_grid:'120+ Top Marcas de un vistazo',sec_brands_d:'De marcas l\u00edderes mundiales \u2014 inspeccionadas y entregadas.',sec_brands_sub:'M\u00e1s de 120 marcas verificadas de todo el mundo',
  sec_testi_label:'TESTIMONIOS',sec_testimonials:'Lo que dicen nuestros clientes',
  sec_why_label:'\u00bfPOR QU\u00c9 AURA?',sec_why:'La diferencia est\u00e1 en los detalles',
  sec_mission:'NUESTRA MISI\u00d3N',sec_sust:'Econom\u00eda circular, no desperdicio',
  mega_smartphones:'Smartphones y Tablets',mega_laptops:'Portátiles',mega_laptops_audio:'Portátiles y Audio',mega_audio:'Audio y Wearables',mega_gaming:'Gaming y VR',
  mega_shoes:'Zapatos y Zapatillas',mega_designer:'Diseñador y Lujo',mega_jewelry:'Joyería y Relojes',mega_clothing:'Ropa y Accesorios',
  mega_home:'Hogar y Vida',mega_travel:'Viaje y Outdoor',
  mega_all_el:'Ver toda Electrónica →',mega_all_fa:'Ver toda Moda →',mega_all_home:'Ver todo Hogar →',mega_all_travel:'Ver todo Viaje →',
  mega_bose:'Auriculares Bose',mega_dyson_hair:'Dyson Cuidado capilar y Limpieza',mega_ecovacs:'Aspiradoras robot Ecovacs',mega_hexclad:'Utensilios HexClad',mega_ring:'Seguridad Ring',mega_rimowa:'Maletas Rimowa',
  ck_phone:'Teléfono',ck_card_brands:'Visa, Mastercard, American Express',ck_klarna:'Klarna — Factura',ck_klarna_d:'Pagar en 14 días',ck_wallet:'Apple Pay / Google Pay',ck_wallet_d:'Pago rápido y seguro',
  country_de:'Alemania',country_at:'Austria',country_ch:'Suiza',country_gb:'Reino Unido',country_us:'Estados Unidos',
  ct_name:'Nombre completo *',ct_email:'Dirección de correo *',ct_order:'Número de pedido',ct_subject:'Asunto *',ct_message:'Mensaje *',
  ct_select_ph:'Seleccione...',ct_opt_product:'Pregunta sobre producto',ct_opt_logistics:'Logística y envío',ct_opt_warranty:'Garantía y reclamación',ct_opt_career:'Empleo',ct_opt_return:'Devolución y reembolso',ct_opt_payment:'Pago y factura',ct_opt_other:'Otros',
  err_storage_full:'Almacenamiento lleno — datos demasiado grandes',err_email_exists:'Este correo ya está registrado',err_wrong_pass:'Contraseña incorrecta',err_user_not_found:'Usuario no encontrado',err_auth_required:'Inicie sesión',msg_wishlist_removed:'Eliminado de favoritos',msg_wishlist_added:'Añadido a favoritos',
  ft_all_products:'Todos los productos',ft_electronics:'Electrónica',ft_fashion:'Moda y Accesorios',ft_home:'Hogar',ft_travel:'Viaje y Outdoor',ft_shipping_pay:'Envío y Pago',ft_faq:'FAQ',ft_about:'Sobre nosotros',ft_sustainability:'Sostenibilidad',ft_sourcing:'Nuestro abastecimiento',ft_careers:'Empleo',ft_copyright:'© 2026 Aura Global Merchants Ltd. Todos los derechos reservados.',ft_ssl:'Pago seguro con cifrado SSL de 256 bits',ft_ssl_ck:'Sus datos están protegidos por cifrado SSL de 256 bits',
  sort_newest:'Novedades',flt_apply:'APLICAR',
  day_sun:'Domingo',day_mon:'Lunes',day_tue:'Martes',day_wed:'Miércoles',day_thu:'Jueves',day_fri:'Viernes',day_sat:'Sábado',
  prd_protocol:'Protocolo Aura',prd_whats_box:'¿Qué hay en la caja?',prd_box_product:'Producto original',prd_box_sealed:'Sellado y verificado',prd_box_cert:'Certificado Aura',prd_box_insp:'Informe de inspección',prd_box_warranty:'Tarjeta de garantía',prd_box_12m:'12 meses de protección',prd_box_return:'Etiqueta de devolución',prd_box_30d:'Devolución en 30 días',
  prd_tab_desc:'Descripción',prd_tab_specs:'Especificaciones',prd_tab_ship:'Envío y Devoluciones',
  prd_ship_h:'Envío desde Berlín / Londres',prd_ship_p:'Todos los pedidos se envían desde nuestro almacén de Berlín o Londres. Envío estándar (3–5 días) gratis desde 99€. Express (1–2 días) 9,90€.',
  prd_ret_h:'Devolución en 30 días',prd_ret_p:'Devolución posible en 30 días si el artículo no coincide con la descripción Aura. Devolución gratuita con etiqueta prepagada.',
  prd_prot_h:'Aura Buyer Protection',prd_prot_p:'Cada compra está cubierta por nuestro programa Aura Buyer Protection. Reembolso completo o reemplazo en caso de problemas.',
  prd_reviews:'Opiniones de clientes',prd_reviews_w:'Opiniones',prd_order_now:'Pide ahora para entrega el',prd_hub:'(Hub Berlín)',
  prd_cond_orig:'Producto original',prd_cond_orig_d:'Inspeccionado y verificado manualmente. Envío rápido desde el Hub.',prd_cond_verified:'Verificado',prd_cond_verified_d:'Inspeccionado manualmente con vídeo. 100% Original.',
  prd_saving:'Ahorras:',prd_stock_low:'¡Solo quedan {n}!',prd_stock_avail:'Aún quedan {n} en stock',prd_in_stock:'en stock',
  prd_proto_score:'Protocolo: {n}/3 aprobado',
  prd_insp_auth:'Autenticidad',prd_insp_auth_y:'Número de serie verificado con el fabricante.',prd_insp_auth_n:'La autenticidad no pudo confirmarse por completo.',
  prd_insp_func:'Funcionalidad',prd_insp_func_y:'Batería, sensores y pantalla probados por completo.',prd_insp_func_n:'Prueba funcional pendiente o parcialmente aprobada.',
  prd_insp_source:'Aprovisionamiento',prd_insp_source_d:'Obtenido directamente de {shop} e inspeccionado en Londres.',
  prd_insp_seal:'Sellado y Garantía',prd_insp_warranty:'Garantía',prd_insp_seal_y:'Sellado con sello Aura. Garantía de 12 meses.',prd_insp_seal_n:'Garantía de 12 meses (sin sello original).',
  prd_why_aura:'¿Por qué Aura Global?',prd_why_1:'Cada producto pasa nuestro protocolo de 47 puntos',prd_why_2:'De minoristas autorizados ({shop})',prd_why_3:'Garantía Aura de 12 meses incluida',prd_why_4:'Envío gratuito y devolución en 30 días',
  prd_seal_title:'Sello de calidad Aura',prd_seal_desc:'Cada producto está sellado con un sello Aura. Su marca de autenticidad.',prd_seal_verified:'Inspeccionado y sellado en el almacén de Londres',
  prd_spec_brand:'Marca',prd_spec_cat:'Categoría',prd_spec_cond:'Estado',prd_spec_cond_v:'Hub Verificado — Nuevo con vídeo',prd_spec_cond_c:'Aura Check — Verificado',
  prd_spec_rating:'Valoración',prd_spec_stock:'Disponibilidad',prd_spec_ship:'Envío',prd_spec_ship_v:'Gratis desde 99€, DHL Express',
  prd_spec_warranty:'Garantía',prd_spec_warranty_v:'12 meses Aura Global',prd_spec_source:'Fuente',prd_spec_source_v:'Minorista autorizado ({shop})',
  prd_spec_insp:'Inspección',prd_spec_insp_loc:'Almacén de Londres',
  ds_nav_orders:'Mis pedidos',ds_nav_profile:'Datos personales',ds_nav_addr:'Direcciones',ds_nav_wish:'Lista de deseos',
  ds_nav_pay:'Métodos de pago',ds_nav_notif:'Notificaciones',ds_nav_sec:'Seguridad',ds_nav_set:'Ajustes de cuenta',
  ds_member_since:'Miembro desde',ds_fname:'Nombre',ds_lname:'Apellido',ds_dob:'Fecha de nacimiento',ds_lang:'Idioma',ds_save:'GUARDAR',ds_cancel:'CANCELAR',ds_cancel_lc:'Cancelar',
  ds_addr_h:'Direcciones guardadas',ds_addr_new:'Nueva dirección',ds_addr_edit:'Editar dirección',ds_addr_empty:'No hay direcciones guardadas',ds_addr_empty_d:'Añada una dirección de envío para un pago más rápido',
  ds_street:'Calle y número',ds_addr_extra:'Información adicional',ds_zip:'Código postal',ds_city:'Ciudad',ds_country:'País',ds_addr_default:'Establecer como dirección predeterminada',
  ds_wish_h:'Mi lista de deseos',ds_wish_empty:'Su lista de deseos está vacía',ds_wish_empty_d:'Guarde sus productos favoritos',ds_wish_browse:'EXPLORAR PRODUCTOS',
  ds_pay_add:'Añadir',ds_pay_empty:'No hay métodos de pago guardados',ds_pay_type:'Tipo',ds_pay_sepa:'Adeudo directo SEPA',
  ds_pay_holder:'Titular de la tarjeta',ds_pay_last4:'Número de tarjeta (últimos 4)',ds_pay_exp:'Fecha de caducidad',ds_pay_email:'E-mail / Cuenta',ds_pay_default:'Establecer por defecto',ds_pay_default_set:'Establecer por defecto',
  ds_pay_info:'Sus datos de pago se almacenan de forma segura. Utilizamos cifrado SSL/TLS y tenemos certificación PCI-DSS.',
  ds_pay_new:'Nuevo método de pago',ds_pay_edit:'Editar método de pago',ds_pay_expires:'Caduca',ds_pay_connected:'Conectado',
  ds_notif_h:'Ajustes de notificaciones',ds_notif_orders:'Estado del pedido',ds_notif_orders_d:'Actualizaciones de sus pedidos por e-mail',
  ds_notif_deals:'Ofertas y promociones',ds_notif_deals_d:'Ofertas exclusivas directamente por e-mail',
  ds_notif_price:'Alertas de precio',ds_notif_price_d:'Notificación cuando bajan los precios en su lista de deseos',
  ds_notif_news:'Newsletter',ds_notif_news_d:'Novedades y recomendaciones semanales',
  ds_notif_push:'Notificaciones push',ds_notif_push_d:'Notificaciones del navegador para actualizaciones importantes',
  ds_sec_pw_h:'Cambiar contraseña',ds_sec_cur:'Contraseña actual',ds_sec_new:'Nueva contraseña',ds_sec_confirm:'Confirmar contraseña',ds_sec_pwchange:'CAMBIAR CONTRASEÑA',
  ds_sec_2fa_h:'Autenticación de dos factores',ds_sec_2fa:'Estado 2FA',ds_sec_2fa_d:'Aumente la seguridad con una verificación adicional',
  ds_sec_sessions:'Sesiones activas',ds_sec_this:'Este navegador',ds_sec_active:'Activo',
  ds_set_id:'ID de cuenta',ds_set_copy:'Copiar',ds_set_member:'Membresía',ds_set_member_v:'Aura Standard',ds_set_currency:'Moneda',
  ds_set_export:'Exportar datos',ds_set_export_d:'Descargue todos sus datos personales',ds_set_export_btn:'EXPORTAR',
  ds_set_delete:'Eliminar cuenta',ds_set_delete_d:'Esta acción no se puede deshacer. Todos sus datos serán eliminados permanentemente.',ds_set_delete_btn:'ELIMINAR CUENTA',
  ds_standard:'Predeterminado',ds_edit:'Editar',ds_delete:'Eliminar',
  ds_tl_paid:'Pagado',ds_tl_sourcing:'Listo para enviar',ds_tl_inspection:'Inspeccionado',ds_tl_shipped:'Enviado',ds_tl_delivered:'Entregado',
  ds_ord_nr:'N° pedido',ds_ord_date:'Fecha',ds_ord_total:'Total',ds_ord_track:'Seguir',ds_ord_receipt:'Factura',ds_ord_help:'Ayuda',
  ds_ord_reviewed:'Evaluado',ds_ord_review:'Evaluar',ds_ord_tracking:'N° envío',
  ds_rv_h:'Escribir una reseña',ds_rv_d:'Comparta su experiencia',ds_rv_submit:'Enviar reseñas',ds_rv_rating:'Valoración',ds_rv_photos:'Fotos (máx. 3)',ds_rv_add:'Añadir',ds_rv_all_done:'¡Todos los productos ya evaluados!',
  ds_t_copied:'Copiado',ds_t_export:'Exportación en preparación…',ds_t_currency:'Moneda guardada',ds_t_delete_confirm:'¿Está seguro? Todos los datos serán eliminados.',
  ds_t_enter_name:'Introduzca un nombre',ds_t_profile:'Perfil guardado',ds_t_required:'Rellene los campos obligatorios',
  ds_t_addr_saved:'Dirección guardada',ds_t_addr_del_q:'¿Eliminar dirección?',ds_t_addr_deleted:'Dirección eliminada',ds_t_addr_default:'Dirección predeterminada actualizada',
  ds_t_wish_removed:'Eliminado de la lista de deseos',ds_t_cart_added:'Añadido al carrito',ds_t_last4:'Introduzca los últimos 4 dígitos',
  ds_t_pay_saved:'Método de pago guardado',ds_t_pay_del_q:'¿Eliminar método de pago?',ds_t_pay_deleted:'Método de pago eliminado',ds_t_default:'Predeterminado actualizado',
  ds_t_notif:'Ajustes guardados',ds_t_fill_all:'Rellene todos los campos',ds_t_pw_mismatch:'Las contraseñas no coinciden',
  ds_t_pw_min:'Al menos 6 caracteres',ds_t_pw_wrong:'Contraseña actual incorrecta',ds_t_pw_changed:'Contraseña cambiada',
  ds_t_2fa_on:'2FA activado',ds_t_2fa_off:'2FA desactivado',ds_t_stars:'Dé al menos 1 estrella a cada producto',
  ds_t_review_thx:'¡Gracias por su reseña!',ds_t_no_receipt:'Factura aún no disponible',ds_t_video_missing:'Vídeo no encontrado',ds_t_max_photos:'Máx. 3 fotos',
  ct_hero:'Centro de Servicio',ct_hero_d:'Nuestro equipo de soporte responderá a su consulta en 24 horas.',
  ct_form_h:'Enviar consulta',ct_form_d:'Rellene el formulario — le responderemos lo antes posible.',
  ct_sent:'¡Consulta enviada!',ct_sent_thx:'Gracias por su mensaje.',ct_sent_24h:'Procesaremos su consulta en 24 horas.',ct_ref:'Número de referencia:',ct_home:'VOLVER AL INICIO',
  ct_privacy:'He leído la política de privacidad y acepto el tratamiento de mis datos. *',ct_submit:'ENVIAR CONSULTA',
  ct_reg_nr:'N° empresa:',ct_reg_where:'Registrada:',ct_reg_ceo:'Director:',ct_channels:'Canales directos',
  ct_wa_d:'Chatear ahora — respuesta rápida',ct_tg_d:'Chatear ahora — comunicación segura',
  ct_hours_h:'Horario de servicio',ct_hrs_mf:'Lunes – Viernes',ct_hrs_sat:'Sábado',ct_hrs_sun:'Domingo y festivos',ct_hrs_closed:'Cerrado',
  ct_hrs_avg:'Tiempo de respuesta medio: menos de 4 horas en horario laboral.',
  ct_quick:'Acceso rápido',ct_q_track:'Seguir envío',ct_q_return:'Devoluciones',ct_q_ship:'Envío',
  ct_v_name:'Introduzca su nombre.',ct_v_email:'Introduzca un e-mail válido.',ct_v_subject:'Seleccione un asunto.',ct_v_message:'Introduzca su mensaje.',ct_v_privacy:'Acepte la política de privacidad.',
  lg_gdpr:'He leído los Términos y la Política de Privacidad y los acepto.',lg_gdpr_req:'Acepte los Términos y la Política de Privacidad.',
  lg_btn_verify:'VERIFICAR CÓDIGO',lg_no_account:'No se encontró ninguna cuenta con este e-mail.',lg_code_sent:'Se ha enviado un código de 6 dígitos a {email}.',
  lg_enter_code:'Introduzca el código de 6 dígitos.',lg_pw_min:'La contraseña debe tener al menos 6 caracteres.',lg_pw_mismatch:'Las contraseñas no coinciden.',lg_pw_changed:'¡Contraseña cambiada con éxito!',
  ft_copyright_short:'© 2026 Aura Global Merchants Ltd. · Company No. 15847293',
},
it:{
  locale_label:'Italiano',
  top_bar:'Spedizione gratuita da 99\u20ac \u00b7 Reso entro 30 giorni',
  guarantee:'Garanzia',
  search_ph:'Cerca prodotti, marchi, categorie...',
  nav_all:'Tutti',nav_electronics:'Elettronica',nav_fashion:'Moda',nav_fashion_long:'Moda e Accessori',nav_home:'Casa',nav_travel:'Viaggio & Outdoor',nav_sale:'Offerte %',nav_new:'Novit\u00e0',
  mob_login:'Accedi / Registrati',mob_orders:'I miei ordini',
  hero_tag:'Verificato \u00b7 Affidabile \u00b7 Conveniente',hero_h1a:'Elettronica e Moda verificata',hero_h1b:'direttamente dal magazzino',
  hero_desc:'Ogni prodotto viene controllato manualmente nel nostro hub di Londra. Autenticit\u00e0 e funzionalit\u00e0 garantite al 100%.',
  hero_cta1:'VEDI TUTTI',hero_cta2:'OFFERTE',
  trust_v:'Prodotti verificati',trust_vd:'Controllo manuale',trust_s:'Spedizione rapida',trust_sd:'Consegna in 2\u20134 giorni',trust_r:'Reso gratuito',trust_rd:'30 giorni, senza rischi',trust_p:'Pagamento sicuro',trust_pd:'SSL, PCI DSS',
  sec_cat:'Categorie',sec_feat:'Prodotti popolari',sec_brands:'I nostri marchi',sec_news:'Newsletter',
  news_desc:'Nuove offerte nella tua casella.',news_ph:'Il tuo indirizzo e-mail',news_btn:'ISCRIVITI',
  add_cart:'AGGIUNGI AL CARRELLO',view_prod:'VEDI',
  ft_cat:'Categorie',ft_svc:'Assistenza clienti',ft_co:'Azienda',ft_contact:'Contatto',ft_track:'Tracciamento',ft_returns:'Resi',ft_story:'La nostra storia',ft_privacy:'Privacy',ft_terms:'Condizioni',ft_imprint:'Note legali',
  ft_desc:'Prodotti di marca verificati da Londra.',
  cart_title:'Carrello',cart_empty:'Il carrello \u00e8 vuoto',cart_total:'Totale',cart_checkout:'PROCEDI ALL\'ORDINE',
  flt_cat:'Categoria',flt_brand:'Marca',flt_price:'Prezzo',flt_cond:'Condizione',flt_verified:'Verificato',flt_openbox:'Originale',
  sort_default:'Consigliato',sort_price_asc:'Prezzo cresc.',sort_price_desc:'Prezzo decresc.',sort_name:'Nome A-Z',sort_rating:'Migliore valutazione',
  flt_reset:'Resetta',flt_results:'Prodotti',flt_mobile:'Filtra e Ordina',
  prd_qty:'Quantit\u00e0:',prd_add:'AGGIUNGI',prd_desc:'Descrizione',prd_specs:'Specifiche',prd_rev:'Recensioni',prd_related:'Potrebbe piacerti anche',
  prd_instock:'Disponibile',prd_ship:'Spedizione gratuita',prd_inspect:'Controllato a Londra \u2014 100% originale',
  spec_brand:'Marca',spec_cat:'Categoria',spec_cond:'Condizione',spec_cond_v:'Verificato \u2014 Nuovo',spec_cond_o:'Verificato',spec_rating:'Valutazione',spec_avail:'Disponibilit\u00e0',spec_avail_v:'disponibile',spec_ship:'Spedizione',spec_ship_v:'Gratis da 99\u20ac, DHL Express',
  lg_login:'ACCEDI',lg_register:'REGISTRATI',lg_login_desc:'Accedi con la tua e-mail.',lg_reg_desc:'Crea un account per ordinare.',
  lbl_email:'E-mail',lbl_pass:'Password',lbl_name:'Nome completo',lbl_pass2:'Conferma password',
  btn_login:'ACCEDI',btn_register:'CREA ACCOUNT',back_shop:'\u2190 Torna al negozio',to_shop:'Al negozio \u2192',
  ck_s1:'1. Spedizione',ck_s2:'2. Pagamento',ck_s3:'3. Conferma',
  ck_addr:'Indirizzo di spedizione',ck_first:'Nome',ck_last:'Cognome',ck_street:'Via e numero',ck_zip:'CAP',ck_city:'Citt\u00e0',ck_country:'Paese',
  ck_ship:'Metodo di spedizione',ck_std:'Standard',ck_std_d:'3\u20135 giorni lavorativi',ck_exp:'Express',ck_exp_d:'1\u20132 giorni lavorativi',ck_free:'Gratis',
  ck_next:'CONTINUA AL PAGAMENTO',ck_summary:'Riepilogo',ck_sub:'Subtotale',ck_shipping:'Spedizione',ck_total:'Totale',
  ck_pay:'Metodo di pagamento',ck_card:'Carta di credito / debito',ck_cardnum:'Numero carta',ck_cardexp:'Scadenza',
  ck_back:'\u2190 INDIETRO',ck_place:'EFFETTUA ORDINE',
  ck_done:'Ordine confermato!',ck_thanks:'Grazie per il tuo ordine su Aura Global Merchants.',ck_ordernum:'Numero ordine:',ck_myorders:'I MIEI ORDINI',ck_continue:'CONTINUA LO SHOPPING',
  ck_stripe_sec:'Protetto da <strong class="text-gray-600">Stripe</strong> \u2014 I dati della tua carta sono crittografati e mai memorizzati sui nostri server.',ck_gdpr:'Ho letto e accetto i <a href="/terms.html" target="_blank" class="text-gold hover:underline font-medium">Termini e condizioni</a> e l\u2019<a href="/privacy.html" target="_blank" class="text-gold hover:underline font-medium">Informativa sulla privacy</a>. Sono stato/a informato/a del mio <a href="/returns.html#widerrufsformular" target="_blank" class="text-gold hover:underline font-medium">diritto di recesso</a>.',ck_gdpr_req:'Accetta i Termini e l\u2019Informativa sulla privacy.',ck_processing:'In elaborazione...',ck_badge_ssl:'SSL crittografato',ck_badge_pci:'Conforme PCI DSS',
  hp_why_video:'Protocollo di ispezione video',hp_why_video_d:'Ogni prodotto \u00e8 documentato con un protocollo video \u2014 dall\u2019apertura del pacco al test di funzionamento.',
  hp_why_auth:'100% originali verificati',hp_why_auth_d:'Ci riforniamo esclusivamente da fonti autorizzate. Numeri di serie verificati, contraffazioni escluse.',
  hp_why_return:'30 giorni di recesso',hp_why_return_d:'Se qualcosa non va, lo riprendiamo \u2014 senza discussioni. Spedizione assicurata, rimborso completo.',
  hp_why_global:'Approvvigionamento globale, spedizione locale',hp_why_global_d:'Acquistiamo in tutto il mondo, ispezioniamo a Londra e spediamo da hub europei.',
  hp_vs_h:'Aura vs. Marketplace',hp_vs_video:'Ispezione video',hp_vs_hub:'Controllo qualit\u00e0 Hub',hp_vs_orig:'Garanzia di autenticit\u00e0',hp_vs_seal:'Sigillo del pacco',hp_vs_dach:'Supporto personale DACH',hp_vs_ship:'Spedizione 2\u20134 giorni lavorativi',
  hp_sust_d:'Ogni prodotto su Aura \u00e8 un prodotto salvato. Diamo una seconda vita ai prodotti di marca.',
  hp_sust_1:'Risparmiare risorse',hp_sust_1d:'Fino al 90% in meno di CO\u2082 per prodotto.',
  hp_sust_2:'Qualit\u00e0 verificata',hp_sust_2d:'Aura Verified: ispezione a pi\u00f9 fasi con documentazione video.',
  hp_sust_3:'Prezzo equo',hp_sust_3d:'Articoli di marca fino al 40% pi\u00f9 economici.',
  hp_sust_cta:'Scopri di pi\u00f9 sulla nostra missione',
  hp_rev1:'\u00abAll\u2019inizio ero scettico, ma l\u2019ispezione video mi ha subito convinto. Il mio iPhone \u00e8 arrivato in perfette condizioni. Consigliatissimo!\u00bb',
  hp_rev2:'\u00abBorsa Gucci in perfette condizioni, con scontrino originale e video di ispezione. Processo trasparente e professionale.\u00bb',
  hp_rev3:'\u00abIl Dyson Airwrap era esaurito ovunque. Su Aura l\u2019ho ricevuto subito e il 15% pi\u00f9 economico. Servizio eccellente!\u00bb',
  news_enter_email:'Inserisci la tua email',news_subscribed:'Iscrizione avvenuta! Controlla la tua casella di posta.',news_error:'Errore \u2014 ricarica la pagina',
  faq_q9:'Perch\u00e9 i prezzi sono pi\u00f9 bassi rispetto al dettaglio?',faq_a9:'Come piattaforma internazionale di approvvigionamento, acquistiamo direttamente da rivenditori autorizzati in vari mercati. Le differenze di prezzo derivano da prezzi regionali, tassi di cambio e promozioni locali. Tutti i prodotti sono 100% originali.',
  faq_q10:'Che garanzia ricevo?',faq_a10:'Gli articoli nuovi hanno 24 mesi di garanzia legale, quelli usati 12 mesi. Inoltre, ogni prodotto viene verificato secondo il Protocollo di Ispezione Aura prima della spedizione.',
  faq_q11:'Quali metodi di pagamento accettate?',faq_a11:'Accettiamo Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay e Klarna (fattura/rate). Tutti i pagamenti vengono elaborati in modo sicuro tramite Stripe \u2014 conforme PCI-DSS Level 1.',
  faq_q12:'Cosa significa lo stato dell\u2019ordine \u00abSourcing\u00bb?',faq_a12_intro:'Dopo la ricezione del pagamento, il tuo ordine passa attraverso i seguenti stati:',faq_a12_paid:'<span class="font-bold text-navy">Pagato:</span> Pagamento ricevuto con successo.',faq_a12_sourcing:'<span class="font-bold text-navy">Sourcing:</span> Stiamo procurando il tuo prodotto dal rivenditore autorizzato. Ci vogliono 1\u20133 giorni lavorativi.',faq_a12_shipped:'<span class="font-bold text-navy">Spedito:</span> Il prodotto \u00e8 stato ispezionato, documentato in video e spedito.',faq_a12_delivered:'<span class="font-bold text-navy">Consegnato:</span> Consegna completata con successo.',
  faq_q13:'Ci sono dazi doganali?',faq_a13:'Poich\u00e9 spediamo dal Regno Unito, possono essere applicati dazi doganali per le consegne nell\u2019UE. Per gli ordini in Germania, gestiamo lo sdoganamento (DDP) nella maggior parte dei casi. Dettagli sulla nostra <a href="/shipping.html" class="text-gold hover:underline font-semibold">pagina spedizioni</a>.',
  faq_q14:'Posso annullare il mio ordine?',faq_a14:'S\u00ec, gli ordini possono essere annullati gratuitamente fino all\u2019inizio dell\u2019approvvigionamento (stato \u00abSourcing\u00bb). Una volta in transito, l\u2019annullamento non \u00e8 pi\u00f9 possibile. Usa il nostro <a href="/returns.html" class="text-gold hover:underline font-semibold">processo di reso</a> con termine di 30 giorni.',
  faq_q15:'Cosa succede ai miei dati?',faq_a15:'Prendiamo sul serio la protezione dei dati e li trattiamo esclusivamente per l\u2019evasione del tuo ordine ai sensi del GDPR e UK GDPR. Dettagli nella nostra <a href="/privacy.html" class="text-gold hover:underline font-semibold">Informativa sulla privacy</a>.',
  faq_q16:'Consegnate in Svizzera e Austria?',faq_a16:'S\u00ec, consegniamo in tutta la regione DACH e in altri paesi UE. Consegna standard in Austria: 3\u20135 giorni lavorativi, Svizzera: 4\u20136. Spedizione gratuita da 99 \u20ac (Svizzera: da 149 CHF).',
  faq_q17:'Dove si trova il vostro magazzino?',faq_a17:'Il nostro magazzino principale e centro di ispezione si trova a Londra, Regno Unito. Tutti i prodotti vengono ispezionati secondo il Protocollo Aura, documentati in video e preparati per la spedizione.',
  faq_q18:'Come posso contattare il servizio clienti?',faq_a18:'Via email a <a href="mailto:admin@auraglobal-merchants.com" class="text-gold hover:underline">admin@auraglobal-merchants.com</a> o tramite il nostro <a href="/contact.html" class="text-gold hover:underline font-semibold">modulo di contatto</a>. Il nostro team \u00e8 disponibile dal luned\u00ec al venerd\u00ec dalle 9:00 alle 18:00 (CET). Rispondiamo entro 24 ore.',
  ds_noauth:'Non connesso',ds_noauth_d:'Effettua il login per vedere il tuo account.',ds_login:'ACCEDI',
  ds_hello:'Ciao,',ds_logout:'Esci',ds_orders:'I miei ordini',ds_settings:'Impostazioni',
  ds_empty:'Nessun ordine ancora.',ds_shop:'ACQUISTA',
  ds_personal:'Dati personali',ds_save:'SALVA',ds_delete:'Elimina account',ds_delete_d:'Azione irreversibile.',ds_delete_btn:'ELIMINA',
  ds_ordernum:'N. ordine',ds_date:'Data',
  st_pending:'In attesa',st_paid:'Pagato',st_sourcing:'Preparazione',st_shipped:'Spedito',st_delivered:'Consegnato',st_inspection:'Controllo',
  trk_title:'Tracciamento ordine',trk_desc:'Inserisci numero ordine ed e-mail.',trk_order_id:'N. ordine',trk_email:'E-mail',trk_btn:'CERCA',trk_not_found:'Ordine non trovato.',
  trk_paid:'Pagato',trk_paid_d:'Pagamento ricevuto',trk_sourcing:'In lavorazione',trk_sourcing_d:'In preparazione',trk_shipped:'Spedito',trk_shipped_d:'Pacco in viaggio',trk_delivered:'Consegnato',trk_delivered_d:'Consegna riuscita',
  trk_track_num:'N. tracciamento',trk_track_btn:'Traccia spedizione',trk_receipt:'Ricevuta',trk_dl_receipt:'Scarica',
  svc_returns_title:'Resi e Rimborsi',svc_shipping_title:'Politica di spedizione',svc_faq_title:'Domande frequenti',
  co_story_title:'La nostra storia',co_privacy_title:'Privacy',co_terms_title:'Condizioni',co_imprint_title:'Note legali',
  mega_electronics:'Elettronica',mega_fashion:'Moda',mega_all_el:'Tutta l\'elettronica \u2192',mega_all_fa:'Tutta la moda \u2192',
  fill_all:'Compila tutti i campi',pass_mismatch:'Le password non corrispondono.',added_cart:'aggiunto al carrello',
  settings_saved:'Impostazioni salvate',order_placed:'Ordine effettuato!',welcome_back:'Bentornato!',account_created:'Account creato!',delete_confirm:'Eliminare l\'account?',
  card_free_ship:'Spedizione gratuita',card_inspected:'Verificato',card_instock:'Disponibile',card_reviews:'Recensioni',card_sold:'venduti',card_returns:'Reso 30gg',card_delivery:'Consegna in 2\u20134 giorni',
  price_vat:'IVA inclusa, spese di spedizione escluse',cart_remove:'Rimuovi',cart_empty_msg:'Il carrello \u00e8 vuoto',cart_continue:'Continua lo shopping',
  hero_trust_ship:'Spedizione in 2\u20134 giorni',hero_trust_return:'Reso 30 giorni',hero_trust_pay:'Pagamento sicuro',
  prime_title:'Diventa membro Aura Prime',prime_desc:'Ricevi <strong style="color:#C5A059">offerte esclusive</strong>, accesso anticipato e spedizione Express gratuita.',prime_btn:'ISCRIVITI',prime_ph:'Indirizzo e-mail',prime_ok:'Benvenuto in Aura Prime!',prime_ok_d:'Ti contatteremo presto.',prime_spam:'Niente spam. Cancellati quando vuoi.',
  price_m_title:'Prezzi onesti, logica chiara',price_m_desc:'Perch\u00e9 costiamo meno \u2014 senza compromessi sulla qualit\u00e0.',price_m_uvp:'Prezzo al dettaglio',price_m_aura:'Aura Direct',price_m_explain:'Acquistiamo resi e stock di liquidazione direttamente dai grossisti. Risultato: <strong style="color:#001A3D">risparmi fino al 40%</strong>.',price_m_ok:'CAPITO',
  cookie_text:'Utilizziamo solo <strong style="color:white">cookie tecnici</strong> necessari al funzionamento del sito. Maggiori info nella nostra',cookie_accept:'ACCETTA',cookie_reject:'SOLO ESSENZIALI',cookie_privacy:'Informativa sulla privacy',
  activity_just:'Proprio ora \u00b7 Aura Global',
  sec_process:'IL NOSTRO PROCESSO',sec_how:'Come Funziona Aura',sec_how_d:'Ogni prodotto passa attraverso il nostro processo di ispezione in tre fasi presso l\u0027hub di Londra prima di arrivare a te.',
  step1_n:'Passo 1',step1_t:'Approvvigionamento',step1_d:'Acquistiamo prodotti originali direttamente da rivenditori autorizzati e marchi di tutto il mondo. Oltre 120 fonti verificate.',
  step2_n:'Passo 2',step2_t:'Ispezione Hub',step2_d:'Nel nostro hub di Londra, ogni prodotto viene controllato manualmente \u2014 con documentazione video.',
  step3_n:'Passo 3',step3_t:'Spedizione a Te',step3_d:'Pacco sigillato e ispezionato \u2014 assicurato e tracciato fino alla tua porta. In soli 2\u20134 giorni.',
  stat_items:'Articoli Ispezionati',stat_brands:'Top Brand',stat_sat:'Soddisfazione Clienti',stat_del:'Giorni di Consegna',
  cat_elec_d:'Smartphone, Laptop, Audio',cat_fash_d:'Scarpe, Borse, Gioielli',cat_home_d:'Dyson, Smart Home, Cura',cat_travel_d:'Bagagli, Accessori',cat_beauty:'Bellezza & Cura',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'SCOPRI \u2192',
  spot_top:'TOP CATEGORIA',spot_elec:'Elettronica & Tech',spot_all_elec:'Tutta l\u0027Elettronica \u2192',spot_fash:'Moda & Lifestyle',spot_all_fash:'Tutta la Moda \u2192',
  sec_trending_label:'DI TENDENZA',sec_trending:'Di Tendenza Ora',sec_all_new:'Tutte le Novit\u00e0 \u2192',
  sec_premium:'SELEZIONE PREMIUM',sec_brands_grid:'120+ Top Brand a Colpo d\u0027Occhio',sec_brands_d:'Dai brand leader mondiali \u2014 ispezionati e consegnati a te.',sec_brands_sub:'Oltre 120 brand verificati da tutto il mondo',
  sec_testi_label:'TESTIMONIANZE',sec_testimonials:'Cosa Dicono i Nostri Clienti',
  sec_why_label:'PERCH\u00c9 AURA?',sec_why:'La Differenza \u00e8 nei Dettagli',
  sec_mission:'LA NOSTRA MISSIONE',sec_sust:'Economia Circolare, Non Spreco',
  mega_smartphones:'Smartphone e Tablet',mega_laptops:'Laptop',mega_laptops_audio:'Laptop e Audio',mega_audio:'Audio e Wearables',mega_gaming:'Gaming e VR',
  mega_shoes:'Scarpe e Sneaker',mega_designer:'Designer e Lusso',mega_jewelry:'Gioielli e Orologi',mega_clothing:'Abbigliamento e Accessori',
  mega_home:'Casa e Vita',mega_travel:'Viaggio e Outdoor',
  mega_all_el:'Vedi tutta Elettronica →',mega_all_fa:'Vedi tutta Moda →',mega_all_home:'Vedi tutto Casa →',mega_all_travel:'Vedi tutto Viaggio →',
  mega_bose:'Cuffie Bose',mega_dyson_hair:'Dyson Cura capelli e Pulizia',mega_ecovacs:'Aspirapolvere robot Ecovacs',mega_hexclad:'Pentole HexClad',mega_ring:'Sicurezza Ring',mega_rimowa:'Valigie Rimowa',
  ck_phone:'Telefono',ck_card_brands:'Visa, Mastercard, American Express',ck_klarna:'Klarna — Fattura',ck_klarna_d:'Pagare entro 14 giorni',ck_wallet:'Apple Pay / Google Pay',ck_wallet_d:'Pagamento rapido e sicuro',
  country_de:'Germania',country_at:'Austria',country_ch:'Svizzera',country_gb:'Regno Unito',country_us:'Stati Uniti',
  ct_name:'Nome completo *',ct_email:'Indirizzo e-mail *',ct_order:'Numero ordine',ct_subject:'Oggetto *',ct_message:'Messaggio *',
  ct_select_ph:'Seleziona...',ct_opt_product:'Domanda sul prodotto',ct_opt_logistics:'Logistica e spedizione',ct_opt_warranty:'Garanzia e reclamo',ct_opt_career:'Carriera',ct_opt_return:'Reso e rimborso',ct_opt_payment:'Pagamento e fattura',ct_opt_other:'Altro',
  err_storage_full:'Memoria piena — dati troppo grandi',err_email_exists:'Questa e-mail è già registrata',err_wrong_pass:'Password errata',err_user_not_found:'Utente non trovato',err_auth_required:'Effettua il login',msg_wishlist_removed:'Rimosso dalla lista desideri',msg_wishlist_added:'Aggiunto alla lista desideri',
  ft_all_products:'Tutti i prodotti',ft_electronics:'Elettronica',ft_fashion:'Moda e Accessori',ft_home:'Casa',ft_travel:'Viaggio e Outdoor',ft_shipping_pay:'Spedizione e Pagamento',ft_faq:'FAQ',ft_about:'Chi siamo',ft_sustainability:'Sostenibilità',ft_sourcing:'Il nostro approvvigionamento',ft_careers:'Carriera',ft_copyright:'© 2026 Aura Global Merchants Ltd. Tutti i diritti riservati.',ft_ssl:'Pagamento sicuro con crittografia SSL a 256 bit',ft_ssl_ck:'I vostri dati sono protetti dalla crittografia SSL a 256 bit',
  sort_newest:'Novità',flt_apply:'APPLICA',
  day_sun:'Domenica',day_mon:'Lunedì',day_tue:'Martedì',day_wed:'Mercoledì',day_thu:'Giovedì',day_fri:'Venerdì',day_sat:'Sabato',
  prd_protocol:'Protocollo Aura',prd_whats_box:'Cosa c\u2019è nella scatola?',prd_box_product:'Prodotto originale',prd_box_sealed:'Sigillato & verificato',prd_box_cert:'Certificato Aura',prd_box_insp:'Rapporto di ispezione',prd_box_warranty:'Scheda di garanzia',prd_box_12m:'12 mesi di protezione',prd_box_return:'Etichetta di reso',prd_box_30d:'Reso entro 30 giorni',
  prd_tab_desc:'Descrizione',prd_tab_specs:'Specifiche tecniche',prd_tab_ship:'Spedizione & Resi',
  prd_ship_h:'Spedizione da Berlino / Londra',prd_ship_p:'Tutti gli ordini vengono spediti dal nostro magazzino di Berlino o Londra. Consegna standard (3–5 giorni) gratuita da 99€. Express (1–2 giorni) 9,90€.',
  prd_ret_h:'Reso entro 30 giorni',prd_ret_p:'Reso possibile entro 30 giorni se l\u2019articolo non corrisponde alla descrizione Aura. Reso gratuito con etichetta prepagata.',
  prd_prot_h:'Aura Buyer Protection',prd_prot_p:'Ogni acquisto è coperto dal nostro programma Aura Buyer Protection. Rimborso completo o sostituzione in caso di problemi.',
  prd_reviews:'Recensioni clienti',prd_reviews_w:'Recensioni',prd_order_now:'Ordina ora per la consegna il',prd_hub:'(Hub Berlino)',
  prd_cond_orig:'Merce originale',prd_cond_orig_d:'Controllato e verificato manualmente. Spedizione rapida dall\u2019Hub.',prd_cond_verified:'Verificato',prd_cond_verified_d:'Controllato manualmente con video-ispezione. 100% Originale.',
  prd_saving:'Risparmi:',prd_stock_low:'Solo {n} rimasti!',prd_stock_avail:'Ancora {n} disponibili',prd_in_stock:'disponibile',
  prd_proto_score:'Protocollo: {n}/3 superato',
  prd_insp_auth:'Autenticità',prd_insp_auth_y:'Numero di serie verificato con il produttore.',prd_insp_auth_n:'Autenticità non completamente confermata.',
  prd_insp_func:'Funzionalità',prd_insp_func_y:'Batteria, sensori e display completamente testati.',prd_insp_func_n:'Test funzionale in sospeso o parzialmente superato.',
  prd_insp_source:'Approvvigionamento',prd_insp_source_d:'Provenienza diretta da {shop} e ispezionato a Londra.',
  prd_insp_seal:'Sigillato & Garanzia',prd_insp_warranty:'Garanzia',prd_insp_seal_y:'Sigillato con sigillo Aura. Garanzia 12 mesi.',prd_insp_seal_n:'Garanzia 12 mesi (senza sigillo originale).',
  prd_why_aura:'Perché Aura Global?',prd_why_1:'Ogni prodotto supera il nostro protocollo di ispezione a 47 punti',prd_why_2:'Acquistato da rivenditori autorizzati ({shop})',prd_why_3:'Garanzia Aura di 12 mesi inclusa',prd_why_4:'Spedizione gratuita & reso entro 30 giorni',
  prd_seal_title:'Sigillo di qualità Aura',prd_seal_desc:'Ogni prodotto è sigillato con un sigillo Aura. Il vostro marchio di autenticità.',prd_seal_verified:'Ispezionato e sigillato a Londra',
  prd_spec_brand:'Marca',prd_spec_cat:'Categoria',prd_spec_cond:'Condizione',prd_spec_cond_v:'Hub Verificato — Nuovo con video',prd_spec_cond_c:'Aura Check — Verificato',
  prd_spec_rating:'Valutazione',prd_spec_stock:'Disponibilità',prd_spec_ship:'Spedizione',prd_spec_ship_v:'Gratuita da 99€, DHL Express',
  prd_spec_warranty:'Garanzia',prd_spec_warranty_v:'12 mesi Aura Global',prd_spec_source:'Fonte',prd_spec_source_v:'Rivenditore autorizzato ({shop})',
  prd_spec_insp:'Ispezione',prd_spec_insp_loc:'Magazzino di Londra',
  ds_nav_orders:'I miei ordini',ds_nav_profile:'Dati personali',ds_nav_addr:'Indirizzi',ds_nav_wish:'Lista dei desideri',
  ds_nav_pay:'Metodi di pagamento',ds_nav_notif:'Notifiche',ds_nav_sec:'Sicurezza',ds_nav_set:'Impostazioni account',
  ds_member_since:'Membro dal',ds_fname:'Nome',ds_lname:'Cognome',ds_dob:'Data di nascita',ds_lang:'Lingua',ds_save:'SALVA',ds_cancel:'ANNULLA',ds_cancel_lc:'Annulla',
  ds_addr_h:'Indirizzi salvati',ds_addr_new:'Nuovo indirizzo',ds_addr_edit:'Modifica indirizzo',ds_addr_empty:'Nessun indirizzo salvato',ds_addr_empty_d:'Aggiungi un indirizzo di consegna per un pagamento più rapido',
  ds_street:'Via e numero civico',ds_addr_extra:'Informazioni aggiuntive',ds_zip:'CAP',ds_city:'Città',ds_country:'Paese',ds_addr_default:'Imposta come indirizzo predefinito',
  ds_wish_h:'La mia lista dei desideri',ds_wish_empty:'La lista dei desideri è vuota',ds_wish_empty_d:'Salva i tuoi prodotti preferiti',ds_wish_browse:'SCOPRI I PRODOTTI',
  ds_pay_add:'Aggiungi',ds_pay_empty:'Nessun metodo di pagamento salvato',ds_pay_type:'Tipo',ds_pay_sepa:'Addebito diretto SEPA',
  ds_pay_holder:'Titolare della carta',ds_pay_last4:'Numero carta (ultime 4)',ds_pay_exp:'Data di scadenza',ds_pay_email:'E-mail / Account',ds_pay_default:'Imposta come predefinito',ds_pay_default_set:'Imposta come predefinito',
  ds_pay_info:'I dati di pagamento sono memorizzati in modo sicuro. Utilizziamo la crittografia SSL/TLS e siamo certificati PCI-DSS.',
  ds_pay_new:'Nuovo metodo di pagamento',ds_pay_edit:'Modifica metodo di pagamento',ds_pay_expires:'Scade',ds_pay_connected:'Collegato',
  ds_notif_h:'Impostazioni notifiche',ds_notif_orders:'Stato ordine',ds_notif_orders_d:'Aggiornamenti sui tuoi ordini via e-mail',
  ds_notif_deals:'Offerte e promozioni',ds_notif_deals_d:'Offerte esclusive direttamente via e-mail',
  ds_notif_price:'Avvisi di prezzo',ds_notif_price_d:'Notifica quando i prezzi scendono nella lista dei desideri',
  ds_notif_news:'Newsletter',ds_notif_news_d:'Novità e raccomandazioni settimanali',
  ds_notif_push:'Notifiche push',ds_notif_push_d:'Notifiche del browser per aggiornamenti importanti',
  ds_sec_pw_h:'Cambia password',ds_sec_cur:'Password attuale',ds_sec_new:'Nuova password',ds_sec_confirm:'Conferma password',ds_sec_pwchange:'CAMBIA PASSWORD',
  ds_sec_2fa_h:'Autenticazione a due fattori',ds_sec_2fa:'Stato 2FA',ds_sec_2fa_d:'Aumenta la sicurezza con una verifica aggiuntiva',
  ds_sec_sessions:'Sessioni attive',ds_sec_this:'Questo browser',ds_sec_active:'Attivo',
  ds_set_id:'ID account',ds_set_copy:'Copia',ds_set_member:'Abbonamento',ds_set_member_v:'Aura Standard',ds_set_currency:'Valuta',
  ds_set_export:'Esportazione dati',ds_set_export_d:'Scarica tutti i tuoi dati personali',ds_set_export_btn:'ESPORTA',
  ds_set_delete:'Elimina account',ds_set_delete_d:'Questa azione non può essere annullata. Tutti i tuoi dati verranno eliminati definitivamente.',ds_set_delete_btn:'ELIMINA ACCOUNT',
  ds_standard:'Predefinito',ds_edit:'Modifica',ds_delete:'Elimina',
  ds_tl_paid:'Pagato',ds_tl_sourcing:'Pronto per la spedizione',ds_tl_inspection:'Ispezionato',ds_tl_shipped:'Spedito',ds_tl_delivered:'Consegnato',
  ds_ord_nr:'N° ordine',ds_ord_date:'Data',ds_ord_total:'Totale',ds_ord_track:'Traccia',ds_ord_receipt:'Fattura',ds_ord_help:'Aiuto',
  ds_ord_reviewed:'Recensito',ds_ord_review:'Recensisci',ds_ord_tracking:'N° spedizione',
  ds_rv_h:'Scrivi una recensione',ds_rv_d:'Condividi la tua esperienza',ds_rv_submit:'Invia recensioni',ds_rv_rating:'Valutazione',ds_rv_photos:'Foto (max. 3)',ds_rv_add:'Aggiungi',ds_rv_all_done:'Tutti i prodotti già recensiti!',
  ds_t_copied:'Copiato',ds_t_export:'Esportazione in preparazione…',ds_t_currency:'Valuta salvata',ds_t_delete_confirm:'Sei sicuro? Tutti i dati verranno eliminati.',
  ds_t_enter_name:'Inserisci un nome',ds_t_profile:'Profilo salvato',ds_t_required:'Compila i campi obbligatori',
  ds_t_addr_saved:'Indirizzo salvato',ds_t_addr_del_q:'Eliminare l\'indirizzo?',ds_t_addr_deleted:'Indirizzo eliminato',ds_t_addr_default:'Indirizzo predefinito aggiornato',
  ds_t_wish_removed:'Rimosso dalla lista dei desideri',ds_t_cart_added:'Aggiunto al carrello',ds_t_last4:'Inserisci le ultime 4 cifre',
  ds_t_pay_saved:'Metodo di pagamento salvato',ds_t_pay_del_q:'Eliminare il metodo di pagamento?',ds_t_pay_deleted:'Metodo di pagamento eliminato',ds_t_default:'Predefinito aggiornato',
  ds_t_notif:'Impostazioni salvate',ds_t_fill_all:'Compila tutti i campi',ds_t_pw_mismatch:'Le password non corrispondono',
  ds_t_pw_min:'Almeno 6 caratteri',ds_t_pw_wrong:'Password attuale errata',ds_t_pw_changed:'Password modificata',
  ds_t_2fa_on:'2FA attivato',ds_t_2fa_off:'2FA disattivato',ds_t_stars:'Dai almeno 1 stella a ogni prodotto',
  ds_t_review_thx:'Grazie per la tua recensione!',ds_t_no_receipt:'Fattura non ancora disponibile',ds_t_video_missing:'Video non trovato',ds_t_max_photos:'Max. 3 foto',
  ct_hero:'Centro Assistenza',ct_hero_d:'Il nostro team di supporto risponderà alla tua richiesta entro 24 ore.',
  ct_form_h:'Invia richiesta',ct_form_d:'Compila il modulo — ti risponderemo il prima possibile.',
  ct_sent:'Richiesta inviata!',ct_sent_thx:'Grazie per il tuo messaggio.',ct_sent_24h:'Elaboreremo la tua richiesta entro 24 ore.',ct_ref:'Numero di riferimento:',ct_home:'TORNA ALLA HOME',
  ct_privacy:'Ho letto l\'informativa sulla privacy e acconsento al trattamento dei miei dati. *',ct_submit:'INVIA RICHIESTA',
  ct_reg_nr:'N° società:',ct_reg_where:'Registrata:',ct_reg_ceo:'Direttore:',ct_channels:'Canali diretti',
  ct_wa_d:'Chatta ora — risposta rapida',ct_tg_d:'Chatta ora — comunicazione sicura',
  ct_hours_h:'Orari di servizio',ct_hrs_mf:'Lunedì – Venerdì',ct_hrs_sat:'Sabato',ct_hrs_sun:'Domenica e festivi',ct_hrs_closed:'Chiuso',
  ct_hrs_avg:'Tempo di risposta medio: meno di 4 ore durante l\'orario lavorativo.',
  ct_quick:'Accesso rapido',ct_q_track:'Traccia spedizione',ct_q_return:'Resi',ct_q_ship:'Spedizione',
  ct_v_name:'Inserisci il tuo nome.',ct_v_email:'Inserisci un indirizzo e-mail valido.',ct_v_subject:'Seleziona un oggetto.',ct_v_message:'Inserisci il tuo messaggio.',ct_v_privacy:'Accetta l\'informativa sulla privacy.',
  lg_gdpr:'Ho letto i Termini e l\'Informativa sulla Privacy e li accetto.',lg_gdpr_req:'Accetta i Termini e l\'Informativa sulla Privacy.',
  lg_btn_verify:'VERIFICA CODICE',lg_no_account:'Nessun account trovato con questo e-mail.',lg_code_sent:'Un codice a 6 cifre è stato inviato a {email}.',
  lg_enter_code:'Inserisci il codice a 6 cifre.',lg_pw_min:'La password deve avere almeno 6 caratteri.',lg_pw_mismatch:'Le password non corrispondono.',lg_pw_changed:'Password cambiata con successo!',
  ft_copyright_short:'© 2026 Aura Global Merchants Ltd. · Company No. 15847293',
},
pl:{
  locale_label:'Polski',
  top_bar:'Darmowa wysy\u0142ka od 99\u20ac \u00b7 30 dni na zwrot',
  guarantee:'Gwarancja',
  search_ph:'Szukaj produkt\u00f3w, marek, kategorii...',
  nav_all:'Wszystkie',nav_electronics:'Elektronika',nav_fashion:'Moda',nav_fashion_long:'Moda i Akcesoria',nav_home:'Dom',nav_travel:'Podr\u00f3\u017ce & Outdoor',nav_sale:'Wyprzeda\u017c %',nav_new:'Nowo\u015bci',
  mob_login:'Zaloguj / Rejestracja',mob_orders:'Moje zam\u00f3wienia',
  hero_tag:'Sprawdzone \u00b7 Bezpieczne \u00b7 Korzystne',hero_h1a:'Sprawdzona Elektronika i Moda',hero_h1b:'prosto z magazynu',
  hero_desc:'Ka\u017cdy produkt jest r\u0119cznie kontrolowany w naszym hubie w Londynie. 100% oryginalno\u015bci i funkcjonalno\u015bci.',
  hero_cta1:'ZOBACZ WSZYSTKIE',hero_cta2:'WYPRZEDA\u017b',
  trust_v:'Sprawdzone produkty',trust_vd:'R\u0119czna kontrola',trust_s:'Szybka wysy\u0142ka',trust_sd:'Dostawa w 2\u20134 dni',trust_r:'Darmowy zwrot',trust_rd:'30 dni, bez ryzyka',trust_p:'Bezpieczna p\u0142atno\u015b\u0107',trust_pd:'SSL, PCI DSS',
  sec_cat:'Kategorie',sec_feat:'Popularne produkty',sec_brands:'Nasze marki',sec_news:'Newsletter',
  news_desc:'Nowe oferty prosto na Tw\u00f3j email.',news_ph:'Tw\u00f3j adres e-mail',news_btn:'SUBSKRYBUJ',
  add_cart:'DO KOSZYKA',view_prod:'ZOBACZ',
  ft_cat:'Kategorie',ft_svc:'Obs\u0142uga klienta',ft_co:'Firma',ft_contact:'Kontakt',ft_track:'\u015aledzenie',ft_returns:'Zwroty',ft_story:'Nasza historia',ft_privacy:'Prywatno\u015b\u0107',ft_terms:'Regulamin',ft_imprint:'Nota prawna',
  ft_desc:'Sprawdzone markowe produkty z Londynu.',
  cart_title:'Koszyk',cart_empty:'Koszyk jest pusty',cart_total:'Suma',cart_checkout:'Z\u0141\u00d3\u017b ZAM\u00d3WIENIE',
  flt_cat:'Kategoria',flt_brand:'Marka',flt_price:'Cena',flt_cond:'Stan',flt_verified:'Sprawdzony',flt_openbox:'Orygina\u0142',
  sort_default:'Rekomendowane',sort_price_asc:'Cena rosn\u0105co',sort_price_desc:'Cena malej\u0105co',sort_name:'Nazwa A-Z',sort_rating:'Najlepiej oceniane',
  flt_reset:'Resetuj',flt_results:'Produkty',flt_mobile:'Filtruj i Sortuj',
  prd_qty:'Ilo\u015b\u0107:',prd_add:'DODAJ',prd_desc:'Opis',prd_specs:'Specyfikacja',prd_rev:'Opinie',prd_related:'Mo\u017ce Ci\u0119 tak\u017ce zainteresowa\u0107',
  prd_instock:'Dost\u0119pny',prd_ship:'Darmowa wysy\u0142ka',prd_inspect:'Skontrolowany w Londynie \u2014 100% orygina\u0142',
  spec_brand:'Marka',spec_cat:'Kategoria',spec_cond:'Stan',spec_cond_v:'Sprawdzony \u2014 Nowy',spec_cond_o:'Sprawdzony',spec_rating:'Ocena',spec_avail:'Dost\u0119pno\u015b\u0107',spec_avail_v:'dost\u0119pny',spec_ship:'Wysy\u0142ka',spec_ship_v:'Gratis od 99\u20ac, DHL Express',
  lg_login:'ZALOGUJ',lg_register:'ZAREJESTRUJ',lg_login_desc:'Zaloguj si\u0119 e-mailem.',lg_reg_desc:'Za\u0142\u00f3\u017c konto, aby zam\u00f3wi\u0107.',
  lbl_email:'E-mail',lbl_pass:'Has\u0142o',lbl_name:'Imi\u0119 i nazwisko',lbl_pass2:'Powt\u00f3rz has\u0142o',
  btn_login:'ZALOGUJ SI\u0118',btn_register:'UTW\u00d3RZ KONTO',back_shop:'\u2190 Wr\u00f3\u0107 do sklepu',to_shop:'Do sklepu \u2192',
  ck_s1:'1. Wysy\u0142ka',ck_s2:'2. P\u0142atno\u015b\u0107',ck_s3:'3. Potwierdzenie',
  ck_addr:'Adres dostawy',ck_first:'Imi\u0119',ck_last:'Nazwisko',ck_street:'Ulica i nr',ck_zip:'Kod pocztowy',ck_city:'Miasto',ck_country:'Kraj',
  ck_ship:'Metoda wysy\u0142ki',ck_std:'Standardowa',ck_std_d:'3\u20135 dni roboczych',ck_exp:'Express',ck_exp_d:'1\u20132 dni robocze',ck_free:'Gratis',
  ck_next:'DALEJ DO P\u0141ATNO\u015aCI',ck_summary:'Podsumowanie',ck_sub:'Suma cz\u0119\u015bciowa',ck_shipping:'Wysy\u0142ka',ck_total:'Razem',
  ck_pay:'Metoda p\u0142atno\u015bci',ck_card:'Karta kredytowa / debetowa',ck_cardnum:'Numer karty',ck_cardexp:'Data wa\u017cno\u015bci',
  ck_back:'\u2190 WR\u00d3\u0106',ck_place:'Z\u0141\u00d3\u017b ZAM\u00d3WIENIE',
  ck_done:'Zam\u00f3wienie potwierdzone!',ck_thanks:'Dzi\u0119kujemy za zam\u00f3wienie w Aura Global Merchants.',ck_ordernum:'Numer zam\u00f3wienia:',ck_myorders:'MOJE ZAM\u00d3WIENIA',ck_continue:'KONTYNUUJ ZAKUPY',
  ck_stripe_sec:'Zabezpieczone przez <strong class="text-gray-600">Stripe</strong> \u2014 Dane Twojej karty s\u0105 szyfrowane i nigdy nie s\u0105 przechowywane na naszych serwerach.',ck_gdpr:'Zapozna\u0142em/am si\u0119 z <a href="/terms.html" target="_blank" class="text-gold hover:underline font-medium">Regulaminem</a> i <a href="/privacy.html" target="_blank" class="text-gold hover:underline font-medium">Polityk\u0105 prywatno\u015bci</a> i akceptuj\u0119 je. Zosta\u0142em/am poinformowany/a o moim <a href="/returns.html#widerrufsformular" target="_blank" class="text-gold hover:underline font-medium">prawie do odst\u0105pienia</a>.',ck_gdpr_req:'Zaakceptuj Regulamin i Polityk\u0119 prywatno\u015bci.',ck_processing:'Przetwarzanie...',ck_badge_ssl:'Szyfrowanie SSL',ck_badge_pci:'Zgodne z PCI DSS',
  hp_why_video:'Protok\u00f3\u0142 inspekcji wideo',hp_why_video_d:'Ka\u017cdy produkt jest dokumentowany protoko\u0142em wideo \u2014 od otwarcia paczki po test dzia\u0142ania.',
  hp_why_auth:'100% zweryfikowanych orygina\u0142\u00f3w',hp_why_auth_d:'Zaopatrujemy si\u0119 wy\u0142\u0105cznie u autoryzowanych \u017ar\u00f3de\u0142. Numery seryjne zweryfikowane, podrabiane wykluczone.',
  hp_why_return:'30 dni na odst\u0105pienie',hp_why_return_d:'Je\u015bli co\u015b nie pasuje, przyjmiemy to z powrotem \u2014 bez dyskusji. Wysy\u0142ka ubezpieczona, pe\u0142ny zwrot.',
  hp_why_global:'Globalne zaopatrzenie, lokalna wysy\u0142ka',hp_why_global_d:'Kupujemy na ca\u0142ym \u015bwiecie, kontrolujemy w Londynie i wysy\u0142amy z europejskich hub\u00f3w.',
  hp_vs_h:'Aura vs. Platformy',hp_vs_video:'Inspekcja wideo',hp_vs_hub:'Kontrola jako\u015bci w hubie',hp_vs_orig:'Gwarancja autentyczno\u015bci',hp_vs_seal:'Plomba paczki',hp_vs_dach:'Osobiste wsparcie DACH',hp_vs_ship:'Wysy\u0142ka 2\u20134 dni robocze',
  hp_sust_d:'Ka\u017cdy produkt w Aura to uratowany produkt. Dajemy drugie \u017cycie markowym artyku\u0142om.',
  hp_sust_1:'Oszcz\u0119dzanie zasob\u00f3w',hp_sust_1d:'Do 90% mniej CO\u2082 na produkt.',
  hp_sust_2:'Zweryfikowana jako\u015b\u0107',hp_sust_2d:'Aura Verified: wieloetapowa inspekcja z dokumentacj\u0105 wideo.',
  hp_sust_3:'Uczciwa cena',hp_sust_3d:'Markowe artyku\u0142y do 40% taniej.',
  hp_sust_cta:'Dowiedz si\u0119 wi\u0119cej o naszej misji',
  hp_rev1:'\u00abNa pocz\u0105tku by\u0142em sceptyczny, ale inspekcja wideo od razu mnie przekona\u0142a. M\u00f3j iPhone dotar\u0142 w idealnym stanie. Gorąco polecam!\u00bb',
  hp_rev2:'\u00abTorebka Gucci w idealnym stanie, z oryginalnym paragonem i filmem inspekcyjnym. Przejrzysty i profesjonalny proces.\u00bb',
  hp_rev3:'\u00abDyson Airwrap by\u0142 wyprzedany wsz\u0119dzie. W Aura otrzyma\u0142em go od razu i 15% taniej. \u015awietna obs\u0142uga!\u00bb',
  news_enter_email:'Wpisz sw\u00f3j e-mail',news_subscribed:'Subskrypcja udana! Sprawd\u017a skrzynk\u0119 odbiorcz\u0105.',news_error:'B\u0142\u0105d \u2014 od\u015bwie\u017c stron\u0119',
  faq_q9:'Dlaczego ceny s\u0105 ni\u017csze ni\u017c w handlu detalicznym?',faq_a9:'Jako mi\u0119dzynarodowa platforma zaopatrzeniowa kupujemy bezpo\u015brednio od autoryzowanych dealer\u00f3w na r\u00f3\u017cnych rynkach. R\u00f3\u017cnice cenowe wynikaj\u0105 z regionalnej polityki cenowej, kurs\u00f3w walut i lokalnych promocji. Wszystkie produkty s\u0105 w 100% oryginalne.',
  faq_q10:'Jak\u0105 gwarancj\u0119 otrzymuj\u0119?',faq_a10:'Nowe artyku\u0142y maj\u0105 24 miesi\u0105ce gwarancji ustawowej, u\u017cywane 12 miesi\u0119cy. Ponadto ka\u017cdy produkt jest sprawdzany wed\u0142ug Protoko\u0142u Inspekcji Aura przed wysy\u0142k\u0105.',
  faq_q11:'Jakie metody p\u0142atno\u015bci akceptujecie?',faq_a11:'Akceptujemy Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay i Klarna (faktura/raty). Wszystkie p\u0142atno\u015bci s\u0105 bezpiecznie przetwarzane przez Stripe \u2014 zgodnie z PCI-DSS Level 1.',
  faq_q12:'Co oznacza status zam\u00f3wienia \u00abSourcing\u00bb?',faq_a12_intro:'Po otrzymaniu p\u0142atno\u015bci Twoje zam\u00f3wienie przechodzi przez nast\u0119puj\u0105ce statusy:',faq_a12_paid:'<span class="font-bold text-navy">Op\u0142acone:</span> P\u0142atno\u015b\u0107 otrzymana pomy\u015blnie.',faq_a12_sourcing:'<span class="font-bold text-navy">Sourcing:</span> Pozyskujemy Tw\u00f3j produkt od autoryzowanego dealera. Trwa to 1\u20133 dni robocze.',faq_a12_shipped:'<span class="font-bold text-navy">Wys\u0142ane:</span> Produkt zosta\u0142 skontrolowany, udokumentowany na wideo i wys\u0142any.',faq_a12_delivered:'<span class="font-bold text-navy">Dostarczony:</span> Dostawa zako\u0144czona pomy\u015blnie.',
  faq_q13:'Czy s\u0105 op\u0142aty celne?',faq_a13:'Poniewa\u017c wysy\u0142amy z Wielkiej Brytanii, przy dostawach do UE mog\u0105 wyst\u0105pi\u0107 op\u0142aty celne. Przy zam\u00f3wieniach do Niemiec zajmujemy si\u0119 odpraw\u0105 celn\u0105 (DDP) w wi\u0119kszo\u015bci przypadk\u00f3w. Szczeg\u00f3\u0142y na naszej <a href="/shipping.html" class="text-gold hover:underline font-semibold">stronie wysy\u0142ki</a>.',
  faq_q14:'Czy mog\u0119 anulowa\u0107 zam\u00f3wienie?',faq_a14:'Tak, zam\u00f3wienia mo\u017cna anulowa\u0107 bezp\u0142atnie do momentu rozpocz\u0119cia zaopatrzenia (status \u00abSourcing\u00bb). Po wys\u0142aniu anulowanie nie jest ju\u017c mo\u017cliwe. Skorzystaj z naszego <a href="/returns.html" class="text-gold hover:underline font-semibold">procesu zwrotu</a> z 30-dniowym terminem.',
  faq_q15:'Co si\u0119 dzieje z moimi danymi?',faq_a15:'Traktujemy ochron\u0119 danych powa\u017cnie i przetwarzamy Twoje dane wy\u0142\u0105cznie w celu realizacji zam\u00f3wienia zgodnie z RODO i UK GDPR. Szczeg\u00f3\u0142y w naszej <a href="/privacy.html" class="text-gold hover:underline font-semibold">Polityce prywatno\u015bci</a>.',
  faq_q16:'Czy dostarczacie do Szwajcarii i Austrii?',faq_a16:'Tak, dostarczamy do ca\u0142ego regionu DACH i innych kraj\u00f3w UE. Dostawa standardowa do Austrii: 3\u20135 dni roboczych, Szwajcaria: 4\u20136. Darmowa wysy\u0142ka od 99 \u20ac (Szwajcaria: od 149 CHF).',
  faq_q17:'Gdzie znajduje si\u0119 Wasz magazyn?',faq_a17:'Nasz g\u0142\u00f3wny magazyn i centrum inspekcji znajduje si\u0119 w Londynie, Wielka Brytania. Wszystkie produkty s\u0105 kontrolowane wed\u0142ug Protoko\u0142u Aura, dokumentowane na wideo i przygotowywane do wysy\u0142ki.',
  faq_q18:'Jak skontaktowa\u0107 si\u0119 z obs\u0142ug\u0105 klienta?',faq_a18:'Mailowo pod adresem <a href="mailto:admin@auraglobal-merchants.com" class="text-gold hover:underline">admin@auraglobal-merchants.com</a> lub poprzez nasz <a href="/contact.html" class="text-gold hover:underline font-semibold">formularz kontaktowy</a>. Nasz zesp\u00f3\u0142 jest dost\u0119pny od poniedzia\u0142ku do pi\u0105tku w godzinach 9:00\u201318:00 (CET). Odpowiadamy w ci\u0105gu 24 godzin.',
  ds_noauth:'Nie zalogowano',ds_noauth_d:'Zaloguj si\u0119, aby zobaczy\u0107 konto.',ds_login:'ZALOGUJ',
  ds_hello:'Cze\u015b\u0107,',ds_logout:'Wyloguj',ds_orders:'Moje zam\u00f3wienia',ds_settings:'Ustawienia',
  ds_empty:'Brak zam\u00f3wie\u0144.',ds_shop:'ZAKUPY',
  ds_personal:'Dane osobowe',ds_save:'ZAPISZ',ds_delete:'Usu\u0144 konto',ds_delete_d:'Tej operacji nie mo\u017cna cofn\u0105\u0107.',ds_delete_btn:'USU\u0143',
  ds_ordernum:'Nr zam.',ds_date:'Data',
  st_pending:'Oczekuje',st_paid:'Op\u0142acone',st_sourcing:'Przygotowanie',st_shipped:'Wys\u0142ane',st_delivered:'Dostarczone',st_inspection:'Kontrola',
  trk_title:'\u015aledzenie zam\u00f3wienia',trk_desc:'Wprowad\u017a numer zam\u00f3wienia i e-mail.',trk_order_id:'Nr zam\u00f3wienia',trk_email:'E-mail',trk_btn:'SZUKAJ',trk_not_found:'Nie znaleziono zam\u00f3wienia.',
  trk_paid:'Op\u0142acone',trk_paid_d:'P\u0142atno\u015b\u0107 otrzymana',trk_sourcing:'Przetwarzanie',trk_sourcing_d:'W przygotowaniu',trk_shipped:'Wys\u0142ane',trk_shipped_d:'Przesy\u0142ka w drodze',trk_delivered:'Dostarczone',trk_delivered_d:'Pomy\u015blnie dostarczone',
  trk_track_num:'Nr przesy\u0142ki',trk_track_btn:'\u015aled\u017a przesy\u0142k\u0119',trk_receipt:'Potwierdzenie',trk_dl_receipt:'Pobierz',
  svc_returns_title:'Zwroty i Refundacje',svc_shipping_title:'Polityka wysy\u0142ki',svc_faq_title:'FAQ',
  co_story_title:'Nasza historia',co_privacy_title:'Prywatno\u015b\u0107',co_terms_title:'Regulamin',co_imprint_title:'Nota prawna',
  mega_electronics:'Elektronika',mega_fashion:'Moda',mega_all_el:'Ca\u0142a elektronika \u2192',mega_all_fa:'Ca\u0142a moda \u2192',
  fill_all:'Wype\u0142nij wszystkie pola',pass_mismatch:'Has\u0142a nie pasuj\u0105.',added_cart:'dodano do koszyka',
  settings_saved:'Zapisano',order_placed:'Zam\u00f3wienie z\u0142o\u017cone!',welcome_back:'Witaj ponownie!',account_created:'Konto utworzone!',delete_confirm:'Usun\u0105\u0107 konto?',
  card_free_ship:'Darmowa wysy\u0142ka',card_inspected:'Sprawdzony',card_instock:'Dost\u0119pny',card_reviews:'Opinie',card_sold:'sprzedanych',card_returns:'30 dni zwrotu',card_delivery:'Dostawa w 2\u20134 dni',
  price_vat:'z VAT, bez koszt\u00f3w wysy\u0142ki',cart_remove:'Usu\u0144',cart_empty_msg:'Koszyk jest pusty',cart_continue:'Kontynuuj zakupy',
  hero_trust_ship:'Wysy\u0142ka w 2\u20134 dni',hero_trust_return:'30 dni na zwrot',hero_trust_pay:'Bezpieczna p\u0142atno\u015b\u0107',
  prime_title:'Do\u0142\u0105cz do Aura Prime',prime_desc:'Otrzymaj <strong style="color:#C5A059">ekskluzywne oferty</strong>, wczesny dost\u0119p i darmow\u0105 wysy\u0142k\u0119 Express.',prime_btn:'DO\u0141\u0104CZ',prime_ph:'Adres e-mail',prime_ok:'Witaj w Aura Prime!',prime_ok_d:'Skontaktujemy si\u0119 wkr\u00f3tce.',prime_spam:'Bez spamu. Wypisz si\u0119 kiedy chcesz.',
  price_m_title:'Uczciwe ceny, jasna logika',price_m_desc:'Dlaczego jeste\u015bmy ta\u0144si \u2014 bez kompromis\u00f3w w jako\u015bci.',price_m_uvp:'Cena detaliczna',price_m_aura:'Aura Direct',price_m_explain:'Kupujemy zwroty i towar likwidacyjny bezpo\u015brednio od hurtownik\u00f3w. Rezultat: <strong style="color:#001A3D">oszcz\u0119dzasz do 40%</strong>.',price_m_ok:'ROZUMIEM',
  cookie_text:'Używamy wyłącznie <strong style="color:white">technicznie niezbędnych plików cookie</strong>. Więcej w naszej',cookie_accept:'AKCEPTUJĘ',cookie_reject:'TYLKO NIEZBĘDNE',cookie_privacy:'Polityce prywatności',
  activity_just:'Właśnie teraz · Aura Global',
  sec_process:'NASZ PROCES',sec_how:'Jak Działa Aura',sec_how_d:'Każdy produkt przechodzi przez nasz trzyetapowy proces inspekcji w hubie w Londynie, zanim dotrze do Ciebie.',
  step1_n:'Krok 1',step1_t:'Zaopatrzenie',step1_d:'Pozyskujemy oryginalne produkty bezpośrednio od autoryzowanych sprzedawców i marek z całego świata. Ponad 120 zweryfikowanych źródeł.',
  step2_n:'Krok 2',step2_t:'Inspekcja Hub',step2_d:'W naszym londyńskim hubie każdy produkt jest ręcznie sprawdzany — z dokumentacją wideo.',
  step3_n:'Krok 3',step3_t:'Wysyłka do Ciebie',step3_d:'Zapieczętowana, sprawdzona paczka — ubezpieczona i śledzona prosto pod Twoje drzwi. W zaledwie 2–4 dni.',
  stat_items:'Sprawdzone Produkty',stat_brands:'Top Marki',stat_sat:'Zadowolenie Klientów',stat_del:'Dni Dostawy',
  cat_elec_d:'Smartfony, Laptopy, Audio',cat_fash_d:'Buty, Torby, Biżuteria',cat_home_d:'Dyson, Smart Home, Pielęgnacja',cat_travel_d:'Bagaż, Akcesoria',cat_beauty:'Uroda & Pielęgnacja',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'ODKRYJ →',
  spot_top:'TOP KATEGORIA',spot_elec:'Elektronika & Tech',spot_all_elec:'Cała Elektronika →',spot_fash:'Moda & Lifestyle',spot_all_fash:'Cała Moda →',
  sec_trending_label:'TRENDY',sec_trending:'Teraz w Trendach',sec_all_new:'Wszystkie Nowości →',
  sec_premium:'PREMIUM WYBÓR',sec_brands_grid:'120+ Top Marek na Pierwszy Rzut Oka',sec_brands_d:'Od światowych liderów — sprawdzone i dostarczone do Ciebie.',sec_brands_sub:'Ponad 120 zweryfikowanych marek z całego świata',
  sec_testi_label:'OPINIE',sec_testimonials:'Co Mówią Nasi Klienci',
  sec_why_label:'DLACZEGO AURA?',sec_why:'Różnica Tkwi w Szczegółach',
  sec_mission:'NASZA MISJA',sec_sust:'Gospodarka Obiegu Zamkniętego',
  mega_smartphones:'Smartfony i Tablety',mega_laptops:'Laptopy',mega_laptops_audio:'Laptopy i Audio',mega_audio:'Audio i Wearables',mega_gaming:'Gaming i VR',
  mega_shoes:'Buty i Sneakersy',mega_designer:'Projektanci i Luksus',mega_jewelry:'Biżuteria i Zegarki',mega_clothing:'Odzież i Akcesoria',
  mega_home:'Dom i Życie',mega_travel:'Podróże i Outdoor',
  mega_all_el:'Zobacz całą Elektronikę →',mega_all_fa:'Zobacz całą Modę →',mega_all_home:'Zobacz cały Dom →',mega_all_travel:'Zobacz całe Podróże →',
  mega_bose:'Słuchawki Bose',mega_dyson_hair:'Dyson Pielęgnacja włosów i Czyszczenie',mega_ecovacs:'Roboty odkurzające Ecovacs',mega_hexclad:'Naczynia HexClad',mega_ring:'Bezpieczeństwo Ring',mega_rimowa:'Walizki Rimowa',
  ck_phone:'Telefon',ck_card_brands:'Visa, Mastercard, American Express',ck_klarna:'Klarna — Faktura',ck_klarna_d:'Zapłać w 14 dni',ck_wallet:'Apple Pay / Google Pay',ck_wallet_d:'Szybka i bezpieczna płatność',
  country_de:'Niemcy',country_at:'Austria',country_ch:'Szwajcaria',country_gb:'Wielka Brytania',country_us:'Stany Zjednoczone',
  ct_name:'Imię i nazwisko *',ct_email:'Adres e-mail *',ct_order:'Numer zamówienia',ct_subject:'Temat *',ct_message:'Wiadomość *',
  ct_select_ph:'Proszę wybrać...',ct_opt_product:'Pytanie o produkt',ct_opt_logistics:'Logistyka i wysyłka',ct_opt_warranty:'Gwarancja i reklamacja',ct_opt_career:'Kariera',ct_opt_return:'Zwrot i refundacja',ct_opt_payment:'Płatność i faktura',ct_opt_other:'Inne',
  err_storage_full:'Pamięć pełna — dane zbyt duże',err_email_exists:'Ten e-mail jest już zarejestrowany',err_wrong_pass:'Nieprawidłowe hasło',err_user_not_found:'Nie znaleziono użytkownika',err_auth_required:'Proszę się zalogować',msg_wishlist_removed:'Usunięto z listy życzeń',msg_wishlist_added:'Dodano do listy życzeń',
  ft_all_products:'Wszystkie produkty',ft_electronics:'Elektronika',ft_fashion:'Moda i Akcesoria',ft_home:'Dom',ft_travel:'Podróże i Outdoor',ft_shipping_pay:'Wysyłka i Płatności',ft_faq:'FAQ',ft_about:'O nas',ft_sustainability:'Zrównoważony rozwój',ft_sourcing:'Nasze zaopatrzenie',ft_careers:'Kariera',ft_copyright:'© 2026 Aura Global Merchants Ltd. Wszelkie prawa zastrzeżone.',ft_ssl:'Bezpieczna płatność z szyfrowaniem SSL 256-bit',ft_ssl_ck:'Twoje dane są chronione szyfrowaniem SSL 256-bit',
  sort_newest:'Nowości',flt_apply:'ZASTOSUJ',
  day_sun:'Niedziela',day_mon:'Poniedziałek',day_tue:'Wtorek',day_wed:'Środa',day_thu:'Czwartek',day_fri:'Piątek',day_sat:'Sobota',
  prd_protocol:'Protokół Aura',prd_whats_box:'Co jest w pudełku?',prd_box_product:'Oryginalny produkt',prd_box_sealed:'Zaplombowany i sprawdzony',prd_box_cert:'Certyfikat Aura',prd_box_insp:'Raport z inspekcji',prd_box_warranty:'Karta gwarancyjna',prd_box_12m:'12 miesięcy ochrony',prd_box_return:'Etykieta zwrotna',prd_box_30d:'Zwrot w ciągu 30 dni',
  prd_tab_desc:'Opis',prd_tab_specs:'Specyfikacja',prd_tab_ship:'Wysyłka i Zwroty',
  prd_ship_h:'Wysyłka z Berlina / Londynu',prd_ship_p:'Wszystkie zamówienia wysyłane są z naszego magazynu w Berlinie lub Londynie. Standardowa dostawa (3–5 dni) bezpłatna od 99€. Ekspresowa (1–2 dni) 9,90€.',
  prd_ret_h:'Zwrot w ciągu 30 dni',prd_ret_p:'Zwrot możliwy w ciągu 30 dni, jeśli artykuł nie odpowiada opisowi inspekcji Aura. Bezpłatny zwrot z opłaconą etykietą.',
  prd_prot_h:'Aura Buyer Protection',prd_prot_p:'Każdy zakup jest objęty programem Aura Buyer Protection. Pełny zwrot lub wymiana w razie problemów.',
  prd_reviews:'Opinie klientów',prd_reviews_w:'Opinie',prd_order_now:'Zamów teraz, dostawa',prd_hub:'(Hub Berlin)',
  prd_cond_orig:'Oryginalny towar',prd_cond_orig_d:'Ręcznie skontrolowany i zweryfikowany. Szybka wysyłka z Hubu.',prd_cond_verified:'Zweryfikowany',prd_cond_verified_d:'Ręcznie skontrolowany z inspekcją wideo. 100% Oryginał.',
  prd_saving:'Oszczędzasz:',prd_stock_low:'Pozostało tylko {n}!',prd_stock_avail:'Jeszcze {n} na stanie',prd_in_stock:'na stanie',
  prd_proto_score:'Protokół: {n}/3 zaliczony',
  prd_insp_auth:'Autentyczność',prd_insp_auth_y:'Numer seryjny zweryfikowany u producenta.',prd_insp_auth_n:'Autentyczność nie mogła być w pełni potwierdzona.',
  prd_insp_func:'Funkcjonalność',prd_insp_func_y:'Bateria, czujniki i wyświetlacz w pełni przetestowane.',prd_insp_func_n:'Test funkcjonalny w toku lub częściowo zaliczony.',
  prd_insp_source:'Zaopatrzenie',prd_insp_source_d:'Bezpośrednio z {shop}, sprawdzono w Londynie.',
  prd_insp_seal:'Zaplombowany & Gwarancja',prd_insp_warranty:'Gwarancja',prd_insp_seal_y:'Zaplombowany plombą Aura. Gwarancja 12 miesięcy.',prd_insp_seal_n:'Gwarancja 12 miesięcy (bez oryginalnej plomby).',
  prd_why_aura:'Dlaczego Aura Global?',prd_why_1:'Każdy produkt przechodzi nasz 47-punktowy protokół inspekcji',prd_why_2:'Od autoryzowanych sprzedawców ({shop})',prd_why_3:'12-miesięczna gwarancja Aura w cenie',prd_why_4:'Bezpłatna wysyłka i zwrot w 30 dni',
  prd_seal_title:'Znak jakości Aura',prd_seal_desc:'Każdy produkt jest zabezpieczony plombą inspekcyjną Aura. Twój znak autentyczności.',prd_seal_verified:'Sprawdzony i zaplombowany w magazynie londyńskim',
  prd_spec_brand:'Marka',prd_spec_cat:'Kategoria',prd_spec_cond:'Stan',prd_spec_cond_v:'Hub Zweryfikowany — Nowy z wideo',prd_spec_cond_c:'Aura Check — Zweryfikowany',
  prd_spec_rating:'Ocena',prd_spec_stock:'Dostępność',prd_spec_ship:'Wysyłka',prd_spec_ship_v:'Bezpłatnie od 99€, DHL Express',
  prd_spec_warranty:'Gwarancja',prd_spec_warranty_v:'12 miesięcy Aura Global',prd_spec_source:'Źródło',prd_spec_source_v:'Autoryzowany sprzedawca ({shop})',
  prd_spec_insp:'Inspekcja',prd_spec_insp_loc:'Magazyn w Londynie',
  ds_nav_orders:'Moje zamówienia',ds_nav_profile:'Dane osobowe',ds_nav_addr:'Adresy',ds_nav_wish:'Lista życzeń',
  ds_nav_pay:'Metody płatności',ds_nav_notif:'Powiadomienia',ds_nav_sec:'Bezpieczeństwo',ds_nav_set:'Ustawienia konta',
  ds_member_since:'Członek od',ds_fname:'Imię',ds_lname:'Nazwisko',ds_dob:'Data urodzenia',ds_lang:'Język',ds_save:'ZAPISZ',ds_cancel:'ANULUJ',ds_cancel_lc:'Anuluj',
  ds_addr_h:'Zapisane adresy',ds_addr_new:'Nowy adres',ds_addr_edit:'Edytuj adres',ds_addr_empty:'Brak zapisanych adresów',ds_addr_empty_d:'Dodaj adres dostawy, aby szybciej składać zamówienia',
  ds_street:'Ulica i numer',ds_addr_extra:'Dodatkowe informacje',ds_zip:'Kod pocztowy',ds_city:'Miasto',ds_country:'Kraj',ds_addr_default:'Ustaw jako adres domyślny',
  ds_wish_h:'Moja lista życzeń',ds_wish_empty:'Twoja lista życzeń jest pusta',ds_wish_empty_d:'Zapisz swoje ulubione produkty',ds_wish_browse:'PRZEGLĄDAJ PRODUKTY',
  ds_pay_add:'Dodaj',ds_pay_empty:'Brak zapisanych metod płatności',ds_pay_type:'Typ',ds_pay_sepa:'Polecenie zapłaty SEPA',
  ds_pay_holder:'Właściciel karty',ds_pay_last4:'Numer karty (ostatnie 4)',ds_pay_exp:'Data ważności',ds_pay_email:'E-mail / Konto',ds_pay_default:'Ustaw jako domyślną',ds_pay_default_set:'Ustaw jako domyślną',
  ds_pay_info:'Twoje dane płatnicze są bezpiecznie szyfrowane. Używamy szyfrowania SSL/TLS i posiadamy certyfikat PCI-DSS.',
  ds_pay_new:'Nowa metoda płatności',ds_pay_edit:'Edytuj metodę płatności',ds_pay_expires:'Wygasa',ds_pay_connected:'Połączono',
  ds_notif_h:'Ustawienia powiadomień',ds_notif_orders:'Status zamówienia',ds_notif_orders_d:'Aktualizacje zamówień e-mailem',
  ds_notif_deals:'Oferty i promocje',ds_notif_deals_d:'Ekskluzywne oferty bezpośrednio e-mailem',
  ds_notif_price:'Alerty cenowe',ds_notif_price_d:'Powiadomienie o obniżkach cen na liście życzeń',
  ds_notif_news:'Newsletter',ds_notif_news_d:'Cotygodniowe nowości i rekomendacje',
  ds_notif_push:'Powiadomienia push',ds_notif_push_d:'Powiadomienia przeglądarki o ważnych aktualizacjach',
  ds_sec_pw_h:'Zmień hasło',ds_sec_cur:'Aktualne hasło',ds_sec_new:'Nowe hasło',ds_sec_confirm:'Potwierdź hasło',ds_sec_pwchange:'ZMIEŃ HASŁO',
  ds_sec_2fa_h:'Uwierzytelnianie dwuskładnikowe',ds_sec_2fa:'Status 2FA',ds_sec_2fa_d:'Zwiększ bezpieczeństwo dzięki dodatkowej weryfikacji',
  ds_sec_sessions:'Aktywne sesje',ds_sec_this:'Ta przeglądarka',ds_sec_active:'Aktywna',
  ds_set_id:'ID konta',ds_set_copy:'Kopiuj',ds_set_member:'Członkostwo',ds_set_member_v:'Aura Standard',ds_set_currency:'Waluta',
  ds_set_export:'Eksport danych',ds_set_export_d:'Pobierz wszystkie swoje dane osobowe',ds_set_export_btn:'EKSPORTUJ',
  ds_set_delete:'Usuń konto',ds_set_delete_d:'Ta czynność jest nieodwracalna. Wszystkie dane zostaną trwale usunięte.',ds_set_delete_btn:'USUŃ KONTO',
  ds_standard:'Domyślna',ds_edit:'Edytuj',ds_delete:'Usuń',
  ds_tl_paid:'Opłacone',ds_tl_sourcing:'Gotowe do wysyłki',ds_tl_inspection:'Sprawdzone',ds_tl_shipped:'Wysłane',ds_tl_delivered:'Dostarczone',
  ds_ord_nr:'Nr zamówienia',ds_ord_date:'Data',ds_ord_total:'Suma',ds_ord_track:'Śledź',ds_ord_receipt:'Faktura',ds_ord_help:'Pomoc',
  ds_ord_reviewed:'Ocenione',ds_ord_review:'Oceń',ds_ord_tracking:'Nr przesyłki',
  ds_rv_h:'Napisz recenzję',ds_rv_d:'Podziel się swoim doświadczeniem',ds_rv_submit:'Wyślij recenzje',ds_rv_rating:'Ocena',ds_rv_photos:'Zdjęcia (maks. 3)',ds_rv_add:'Dodaj',ds_rv_all_done:'Wszystkie produkty już ocenione!',
  ds_t_copied:'Skopiowano',ds_t_export:'Eksport w przygotowaniu…',ds_t_currency:'Waluta zapisana',ds_t_delete_confirm:'Czy na pewno? Wszystkie dane zostaną usunięte.',
  ds_t_enter_name:'Wprowadź imię',ds_t_profile:'Profil zapisany',ds_t_required:'Wypełnij wymagane pola',
  ds_t_addr_saved:'Adres zapisany',ds_t_addr_del_q:'Usunąć adres?',ds_t_addr_deleted:'Adres usunięty',ds_t_addr_default:'Adres domyślny zaktualizowany',
  ds_t_wish_removed:'Usunięto z listy życzeń',ds_t_cart_added:'Dodano do koszyka',ds_t_last4:'Wprowadź ostatnie 4 cyfry',
  ds_t_pay_saved:'Metoda płatności zapisana',ds_t_pay_del_q:'Usunąć metodę płatności?',ds_t_pay_deleted:'Metoda płatności usunięta',ds_t_default:'Domyślna zaktualizowana',
  ds_t_notif:'Ustawienia zapisane',ds_t_fill_all:'Wypełnij wszystkie pola',ds_t_pw_mismatch:'Hasła nie pasują do siebie',
  ds_t_pw_min:'Co najmniej 6 znaków',ds_t_pw_wrong:'Aktualne hasło nieprawidłowe',ds_t_pw_changed:'Hasło zmienione',
  ds_t_2fa_on:'2FA włączone',ds_t_2fa_off:'2FA wyłączone',ds_t_stars:'Daj co najmniej 1 gwiazdkę każdemu produktowi',
  ds_t_review_thx:'Dziękujemy za recenzję!',ds_t_no_receipt:'Faktura jeszcze niedostępna',ds_t_video_missing:'Nie znaleziono wideo',ds_t_max_photos:'Maks. 3 zdjęcia',
  ct_hero:'Centrum Obsługi',ct_hero_d:'Nasz zespół wsparcia odpowie na Twoje zapytanie w ciągu 24 godzin.',
  ct_form_h:'Wyślij zapytanie',ct_form_d:'Wypełnij formularz — odezwiemy się jak najszybciej.',
  ct_sent:'Zapytanie wysłane!',ct_sent_thx:'Dziękujemy za wiadomość.',ct_sent_24h:'Rozpatrzymy Twoje zapytanie w ciągu 24 godzin.',ct_ref:'Numer referencyjny:',ct_home:'WRÓĆ NA STRONĘ GŁÓWNĄ',
  ct_privacy:'Zapoznałem się z polityką prywatności i wyrażam zgodę na przetwarzanie moich danych. *',ct_submit:'WYŚLIJ ZAPYTANIE',
  ct_reg_nr:'Nr firmy:',ct_reg_where:'Zarejestrowana:',ct_reg_ceo:'Dyrektor:',ct_channels:'Kanały bezpośrednie',
  ct_wa_d:'Czatuj teraz — szybka odpowiedź',ct_tg_d:'Czatuj teraz — bezpieczna komunikacja',
  ct_hours_h:'Godziny obsługi',ct_hrs_mf:'Poniedziałek – Piątek',ct_hrs_sat:'Sobota',ct_hrs_sun:'Niedziela i święta',ct_hrs_closed:'Zamknięte',
  ct_hrs_avg:'Średni czas odpowiedzi: poniżej 4 godzin w godzinach pracy.',
  ct_quick:'Szybki dostęp',ct_q_track:'Śledź przesyłkę',ct_q_return:'Zwroty',ct_q_ship:'Wysyłka',
  ct_v_name:'Wprowadź swoje imię.',ct_v_email:'Wprowadź prawidłowy adres e-mail.',ct_v_subject:'Wybierz temat.',ct_v_message:'Wprowadź swoją wiadomość.',ct_v_privacy:'Zaakceptuj politykę prywatności.',
  lg_gdpr:'Zapoznałem się z Regulaminem i Polityką Prywatności i je akceptuję.',lg_gdpr_req:'Zaakceptuj Regulamin i Politykę Prywatności.',
  lg_btn_verify:'ZWERYFIKUJ KOD',lg_no_account:'Nie znaleziono konta z tym e-mailem.',lg_code_sent:'6-cyfrowy kod został wysłany na {email}.',
  lg_enter_code:'Wprowadź 6-cyfrowy kod.',lg_pw_min:'Hasło musi mieć co najmniej 6 znaków.',lg_pw_mismatch:'Hasła nie pasują do siebie.',lg_pw_changed:'Hasło zmienione pomyślnie!',
  ft_copyright_short:'© 2026 Aura Global Merchants Ltd. · Company No. 15847293',
}
};

function getLocale(){ return ls(LOCALE_KEY) || 'de'; }
function setLocale(loc){
  ls(LOCALE_KEY, loc);
  applyLocale();
  injectLocalePickers();
}
function t(key){ var d=I18N[getLocale()]; return (d&&d[key])||(I18N.de[key])||key; }

function formatPrice(n){
  // Currency is always EUR (€) — no conversion for other locales
  return '\u20ac'+n.toLocaleString('de-DE', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function applyLocale(){
  var loc=getLocale(), d=I18N[loc], de=I18N.de; if(!d) return;
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k=el.getAttribute('data-i18n'); var v=d[k]||de[k]; if(v) el.textContent=v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    var k=el.getAttribute('data-i18n-ph'); var v=d[k]||de[k]; if(v) el.placeholder=v;
  });
  document.querySelectorAll('[data-price]').forEach(function(el){
    el.textContent=formatPrice(parseFloat(el.getAttribute('data-price')));
  });
  document.querySelectorAll('[data-locale-label]').forEach(function(el){
    el.textContent=d.locale_label||'DE / €';
  });
  document.documentElement.lang=loc;
  fire('locale-change',{locale:loc});
}

function injectLocalePickers(){
  var loc=getLocale();
  var langs=[
    {code:'de',label:'Deutsch',cur:'EUR',short:'DE'},
    {code:'en',label:'English',cur:'GBP',short:'EN'},
    {code:'fr',label:'Fran\u00e7ais',cur:'EUR',short:'FR'},
    {code:'es',label:'Espa\u00f1ol',cur:'EUR',short:'ES'},
    {code:'it',label:'Italiano',cur:'EUR',short:'IT'},
    {code:'pl',label:'Polski',cur:'EUR',short:'PL'}
  ];
  var cur=langs.filter(function(l){return l.code===loc;})[0]||langs[0];
  var btns=langs.map(function(l){
    var active=l.code===loc?' bg-white/10 text-white font-semibold':'';
    return '<button onclick="Aura.setLocale(\''+l.code+'\')" class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors'+active+'"><span class="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">'+l.short+'</span><span>'+l.label+'</span><span class="ml-auto text-[10px] text-gold/50">'+l.cur+'</span></button>';
  }).join('');
  document.querySelectorAll('[data-locale-picker]').forEach(function(c){
    c.innerHTML='<div class="relative"><button onclick="this.nextElementSibling.classList.toggle(\'hidden\')" class="flex items-center gap-1.5 px-2 h-10 text-sm text-navy/60 hover:text-navy transition-colors"><span class="w-6 h-6 rounded-full bg-navy/5 flex items-center justify-center text-[10px] font-bold text-navy/60 shrink-0">'+cur.short+'</span><span data-locale-label class="hidden sm:inline ml-1 text-xs">'+cur.label+'</span><svg class="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button><div class="aura-locale-dd hidden absolute right-0 top-full mt-1 bg-navy-dark border border-white/10 shadow-2xl rounded-lg overflow-hidden z-[60] min-w-[200px]">'+btns+'</div></div>';
  });
}

/* ── WISHLIST ───────────────────────────────────── */
function getWishlist(){
  var s=getSession();
  if(!s) return [];
  return JSON.parse(localStorage.getItem('aura_wishlist_'+s.userId)||'[]');
}
function saveWishlist(arr){
  var s=getSession();
  if(!s) return;
  localStorage.setItem('aura_wishlist_'+s.userId,JSON.stringify(arr));
}
function toggleWishlist(pid){
  var s=getSession();
  if(!s){showToast(t('err_auth_required'),'error');return false;}
  var ids=getWishlist();
  var idx=ids.indexOf(pid);
  if(idx>=0){ids.splice(idx,1);showToast(t('msg_wishlist_removed'),'success');}
  else{ids.push(pid);showToast(t('msg_wishlist_added'),'success');}
  saveWishlist(ids);
  fire('wishlist-update',{ids:ids});
  return idx<0;// true = added
}
function isInWishlist(pid){return getWishlist().indexOf(pid)>=0;}

/* ── PAYMENTS ──────────────────────────────────── */
function getPayments(){
  var s=getSession();
  if(!s) return [];
  var def=[
    {type:'visa',label:'VISA',last4:'4242',exp:'12/27',isDefault:true},
    {type:'paypal',label:'PayPal',email:'',isDefault:false},
    {type:'applepay',label:'Apple Pay',isDefault:false}
  ];
  var raw=localStorage.getItem('aura_payments_'+s.userId);
  if(!raw){
    // seed defaults first time
    localStorage.setItem('aura_payments_'+s.userId,JSON.stringify(def));
    return def;
  }
  return JSON.parse(raw);
}
function savePayments(arr){
  var s=getSession();
  if(!s) return;
  localStorage.setItem('aura_payments_'+s.userId,JSON.stringify(arr));
}
function addPayment(obj){
  var list=getPayments();
  if(obj.isDefault) list.forEach(function(p){p.isDefault=false;});
  list.push(obj);
  if(list.length===1) list[0].isDefault=true;
  savePayments(list);return list;
}
function updatePayment(idx,obj){
  var list=getPayments();
  if(idx<0||idx>=list.length) return list;
  if(obj.isDefault) list.forEach(function(p){p.isDefault=false;});
  list[idx]=obj;
  savePayments(list);return list;
}
function deletePayment(idx){
  var list=getPayments();
  list.splice(idx,1);
  if(list.length&&!list.some(function(p){return p.isDefault;})) list[0].isDefault=true;
  savePayments(list);return list;
}
function setDefaultPayment(idx){
  var list=getPayments();
  list.forEach(function(p,i){p.isDefault=(i===idx);});
  savePayments(list);return list;
}

/* ── EXPORT ────────────────────────────────────── */
window.Aura = {
  ADMIN_EMAIL: ADMIN_EMAIL,
  // Products
  getProducts:getProducts, getProductById:getProductById, addProduct:addProduct, updateProduct:updateProduct, deleteProduct:deleteProduct, saveProducts:saveProducts,
  // Cart
  getCart:getCart, addToCart:addToCart, removeFromCart:removeFromCart, updateCartQty:updateCartQty, clearCart:clearCart, getCartTotal:getCartTotal, getCartItems:getCartItems,
  // Auth
  register:register, login:login, logout:logout, getSession:getSession, getCurrentUser:getCurrentUser, isAdmin:isAdmin, isLinguist:isLinguist, addLinguist:addLinguist, getUsers:getUsers,
  // Orders
  getOrders:getOrders, createOrder:createOrder, updateOrderStatus:updateOrderStatus, getUserOrders:getUserOrders, getOrderById:getOrderById, getOrderByIdAndEmail:getOrderByIdAndEmail,
  // Reviews
  getReviews:getReviews, addReview:addReview, getProductReviews:getProductReviews, approveReview:approveReview, deleteReview:deleteReview,
  // UI
  renderCartBadge:renderCartBadge, showToast:showToast, formatPrice:formatPrice, starsHtml:starsHtml, productCardHtml:productCardHtml, imgHtml:imgHtml, isImgUrl:isImgUrl,
  getProductBadge:getProductBadge, inspectionScore:inspectionScore, getPublicProduct:getPublicProduct,
  // Locale
  getLocale:getLocale, setLocale:setLocale, t:t, applyLocale:applyLocale, I18N:I18N,
  // Wishlist
  getWishlist:getWishlist, toggleWishlist:toggleWishlist, isInWishlist:isInWishlist,
  // Payments
  getPayments:getPayments, savePayments:savePayments, addPayment:addPayment, updatePayment:updatePayment, deletePayment:deletePayment, setDefaultPayment:setDefaultPayment
};

// Init products if empty
getProducts();
// Render cart badges + locale on load
document.addEventListener('DOMContentLoaded', function(){
  renderCartBadge();
  injectLocalePickers();
  applyLocale();
});
document.addEventListener('cart-update', function(){ renderCartBadge(); });
// Close locale dropdown on outside click
document.addEventListener('click', function(e){
  if(!e.target.closest('[data-locale-picker]')){
    document.querySelectorAll('.aura-locale-dd').forEach(function(el){ el.classList.add('hidden'); });
  }
});

/* ═══════════════════════════════════════════════════════
   GLOBAL WIDGETS — Activity, Aura Prime, Price Modal
   ═══════════════════════════════════════════════════════ */

/* ── 1. Activity Notification Widget (bottom-left) ── */
(function initActivityWidget(){
  var eventsMap={
    de:[{type:'check',icon:'\ud83d\udd0d',tpls:['%NAME% aus %CITY% \u2014 Produkt wird gepr\u00fcft']},{type:'buy',icon:'\ud83d\uded2',tpls:['%NAME% aus %CITY% hat gerade bestellt']},{type:'ship',icon:'\ud83d\udce6',tpls:['Paket f\u00fcr %NAME% nach %CITY% versandt']},{type:'partner',icon:'\ud83e\udd1d',tpls:['Neuer Partner-Import aus %SOURCE%']}],
    en:[{type:'check',icon:'\ud83d\udd0d',tpls:['%NAME% from %CITY% \u2014 product being inspected']},{type:'buy',icon:'\ud83d\uded2',tpls:['%NAME% from %CITY% just ordered']},{type:'ship',icon:'\ud83d\udce6',tpls:['Package for %NAME% shipped to %CITY%']},{type:'partner',icon:'\ud83e\udd1d',tpls:['New partner import from %SOURCE%']}],
    fr:[{type:'check',icon:'\ud83d\udd0d',tpls:['%NAME% de %CITY% \u2014 produit en cours de v\u00e9rification']},{type:'buy',icon:'\ud83d\uded2',tpls:['%NAME% de %CITY% vient de commander']},{type:'ship',icon:'\ud83d\udce6',tpls:['Colis pour %NAME% exp\u00e9di\u00e9 \u00e0 %CITY%']},{type:'partner',icon:'\ud83e\udd1d',tpls:['Nouvel import partenaire de %SOURCE%']}],
    es:[{type:'check',icon:'\ud83d\udd0d',tpls:['%NAME% de %CITY% \u2014 producto en verificaci\u00f3n']},{type:'buy',icon:'\ud83d\uded2',tpls:['%NAME% de %CITY% acaba de pedir']},{type:'ship',icon:'\ud83d\udce6',tpls:['Paquete para %NAME% enviado a %CITY%']},{type:'partner',icon:'\ud83e\udd1d',tpls:['Nueva importaci\u00f3n de %SOURCE%']}],
    it:[{type:'check',icon:'\ud83d\udd0d',tpls:['%NAME% da %CITY% \u2014 prodotto in verifica']},{type:'buy',icon:'\ud83d\uded2',tpls:['%NAME% da %CITY% ha appena ordinato']},{type:'ship',icon:'\ud83d\udce6',tpls:['Pacco per %NAME% spedito a %CITY%']},{type:'partner',icon:'\ud83e\udd1d',tpls:['Nuova importazione da %SOURCE%']}],
    pl:[{type:'check',icon:'\ud83d\udd0d',tpls:['%NAME% z %CITY% \u2014 produkt w trakcie kontroli']},{type:'buy',icon:'\ud83d\uded2',tpls:['%NAME% z %CITY% z\u0142o\u017cy\u0142 zam\u00f3wienie']},{type:'ship',icon:'\ud83d\udce6',tpls:['Paczka dla %NAME% wys\u0142ana do %CITY%']},{type:'partner',icon:'\ud83e\udd1d',tpls:['Nowy import od %SOURCE%']}]
  };
  var names=['Lena M.','Max K.','Sophie T.','Jonas B.','Anna F.','Felix R.','Luisa W.','Tim S.','Marie D.','Paul H.','Clara Z.','Leon G.','Emma B.','Noah P.','Mia L.'];
  var cities=['Berlin','M\u00fcnchen','Hamburg','K\u00f6ln','Frankfurt','Wien','Z\u00fcrich','Stuttgart','D\u00fcsseldorf','Leipzig','Hannover','Dresden','N\u00fcrnberg','Bremen','Dortmund'];
  var sources=['Zalando Liquidation','Amazon Warehouse','John Lewis Returns','Target Overstock'];
  function rand(arr){return arr[Math.floor(Math.random()*arr.length)];}
  function showNotification(){
    var existing=document.getElementById('aura-activity-widget');
    if(existing)existing.remove();
    var loc=getLocale();
    var events=eventsMap[loc]||eventsMap.de;
    var ev=rand(events);
    var tpl=rand(ev.tpls);
    var msg=tpl.replace('%NAME%',rand(names)).replace('%CITY%',rand(cities)).replace('%SOURCE%',rand(sources));
    var el=document.createElement('div');
    el.id='aura-activity-widget';
    el.style.cssText='position:fixed;bottom:20px;left:20px;z-index:9998;max-width:320px;width:calc(100% - 40px);background:#001A3D;color:#fff;border:1px solid rgba(197,160,89,0.3);box-shadow:0 8px 32px rgba(0,0,0,0.3);padding:12px 16px;display:flex;align-items:flex-start;gap:10px;font-family:Inter,system-ui,sans-serif;transform:translateY(120%);transition:transform .4s ease;';
    el.innerHTML='<span style="font-size:20px;line-height:1;flex-shrink:0">'+ev.icon+'</span><div style="flex:1;min-width:0"><p style="font-size:12px;line-height:1.4;color:rgba(255,255,255,0.8);margin:0">'+msg+'</p><p style="font-size:10px;color:rgba(255,255,255,0.3);margin:4px 0 0">'+t('activity_just')+'</p></div><button onclick="this.parentElement.style.transform=\'translateY(120%)\';setTimeout(function(){var w=document.getElementById(\'aura-activity-widget\');if(w)w.remove();},400)" style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:16px;line-height:1;padding:0;flex-shrink:0">&times;</button>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){requestAnimationFrame(function(){el.style.transform='translateY(0)';});});
    setTimeout(function(){if(document.getElementById('aura-activity-widget')){el.style.transform='translateY(120%)';setTimeout(function(){if(el.parentNode)el.remove();},400);}},8000);
  }
  function scheduleNext(){
    var delay=120000+Math.random()*60000;
    setTimeout(function(){showNotification();scheduleNext();},delay);
  }
  document.addEventListener('DOMContentLoaded',function(){
    if(window.innerWidth<640)return;
    setTimeout(function(){showNotification();scheduleNext();},15000);
  });
})();

/* ── 2. Aura Prime Popup (email collection) ── */
(function initAuraPrime(){
  function createStickyBtn(){
    if(document.getElementById('aura-prime-sticky'))return;
    var btn=document.createElement('button');
    btn.id='aura-prime-sticky';
    btn.onclick=showPrimeModal;
    btn.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9997;background:linear-gradient(135deg,#C5A059,#A8863D);color:white;border:none;padding:10px 18px;font-family:Inter,system-ui,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;cursor:pointer;box-shadow:0 4px 20px rgba(197,160,89,0.4);transition:transform .2s,box-shadow .2s;border-radius:6px;';
    btn.textContent='Aura Prime \ud83d\udc8e';
    btn.onmouseenter=function(){btn.style.transform='scale(1.05)';btn.style.boxShadow='0 6px 24px rgba(197,160,89,0.5)';};
    btn.onmouseleave=function(){btn.style.transform='scale(1)';btn.style.boxShadow='0 4px 20px rgba(197,160,89,0.4)';};
    document.body.appendChild(btn);
  }
  function showPrimeModal(){
    if(document.getElementById('aura-prime-modal'))return;
    var overlay=document.createElement('div');
    overlay.id='aura-prime-modal';
    overlay.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)" onclick="document.getElementById(\'aura-prime-modal\').remove()"></div>'
      +'<div style="position:relative;max-width:440px;width:100%;background:#001A3D;border:1px solid rgba(197,160,89,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);padding:0;font-family:Inter,system-ui,sans-serif;overflow:hidden">'
      +'<div style="padding:24px 20px 0;text-align:center"><div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(197,160,89,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="font-size:24px">\ud83d\udc8e</span></div>'
      +'<h3 style="font-family:Playfair Display,Georgia,serif;font-size:20px;font-weight:700;color:white;margin:0 0 8px">'+t('prime_title')+'</h3>'
      +'<p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 20px;line-height:1.5">'+t('prime_desc')+'</p></div>'
      +'<form onsubmit="event.preventDefault();var email=this.querySelector(\'input\').value;var leads=JSON.parse(localStorage.getItem(\'aura_prime_leads\')||\'[]\');leads.push({email:email,date:new Date().toISOString()});localStorage.setItem(\'aura_prime_leads\',JSON.stringify(leads));if(typeof AuraEmail!==\'undefined\')AuraEmail.sendPrimeWelcome(email);this.innerHTML=\'<div style=padding:24px;text-align:center><p style=color:#C5A059;font-weight:700;font-size:14px>'+t('prime_ok')+'</p><p style=color:rgba(255,255,255,0.4);font-size:12px;margin-top:8px>'+t('prime_ok_d')+'</p></div>\';sessionStorage.setItem(\'aura_prime_joined\',\'1\')" style="padding:0 20px 24px">'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px"><input type="email" required placeholder="'+t('prime_ph')+'" style="flex:1 1 180px;min-width:0;height:44px;padding:0 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;font-size:13px;outline:none;font-family:Inter,system-ui,sans-serif;box-sizing:border-box"><button type="submit" style="flex:0 0 auto;height:44px;padding:0 20px;background:#C5A059;color:#001A3D;border:none;font-size:12px;font-weight:700;letter-spacing:0.08em;cursor:pointer;font-family:Inter,system-ui,sans-serif;white-space:nowrap">'+t('prime_btn')+'</button></div>'
      +'<p style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:12px;text-align:center">'+t('prime_spam')+' <a href=/privacy.html style=color:rgba(197,160,89,0.5);text-decoration:underline>'+t('cookie_privacy')+'</a></p></form>'
      +'<button onclick="document.getElementById(\'aura-prime-modal\').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:20px;line-height:1">&times;</button></div>';
    document.body.appendChild(overlay);
  }
  window.showPrimeModal=showPrimeModal;
  document.addEventListener('DOMContentLoaded',function(){
    createStickyBtn();
    var isCatalog=window.location.pathname.indexOf('catalog')>-1;
    if(isCatalog && !sessionStorage.getItem('aura_prime_shown')){
      setTimeout(function(){
        if(!sessionStorage.getItem('aura_prime_shown')){
          sessionStorage.setItem('aura_prime_shown','1');
          showPrimeModal();
        }
      },20000);
    }
  });
})();

/* ── 3. Price Explanation Modal ── */
(function initPriceModal(){
  window.showPriceModal=function(){
    if(document.getElementById('aura-price-modal'))return;
    var overlay=document.createElement('div');
    overlay.id='aura-price-modal';
    overlay.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)" onclick="document.getElementById(\'aura-price-modal\').remove()"></div>'
      +'<div style="position:relative;max-width:480px;width:100%;background:white;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Inter,system-ui,sans-serif;padding:0;overflow:hidden">'
      +'<div style="padding:24px 20px 0;text-align:center"><div style="width:48px;height:48px;margin:0 auto 14px;background:rgba(0,26,61,0.05);border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="font-size:22px">\ud83d\udca1</span></div>'
      +'<h3 style="font-family:Playfair Display,Georgia,serif;font-size:20px;font-weight:700;color:#001A3D;margin:0 0 6px">'+t('price_m_title')+'</h3>'
      +'<p style="font-size:12px;color:#6b7280;margin:0 0 24px;line-height:1.5">'+t('price_m_desc')+'</p></div>'
      +'<div style="padding:0 20px 24px">'
      +'<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:#6b7280">'+t('price_m_uvp')+'</span><span style="font-weight:700;color:#001A3D">100%</span></div><div style="height:14px;background:#f3f4f6;overflow:hidden"><div style="height:100%;width:100%;background:linear-gradient(90deg,#001A3D,#002B5C)"></div></div></div>'
      +'<div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:#C5A059;font-weight:600">'+t('price_m_aura')+'</span><span style="font-weight:700;color:#C5A059">75%</span></div><div style="height:14px;background:#f3f4f6;overflow:hidden"><div style="height:100%;width:75%;background:linear-gradient(90deg,#C5A059,#D4B476)"></div></div></div>'
      +'<div style="background:#f9fafb;border:1px solid #f3f4f6;padding:14px;margin-bottom:20px"><p style="font-size:11px;color:#6b7280;line-height:1.6;margin:0">'+t('price_m_explain')+'</p></div>'
      +'<button onclick="document.getElementById(\'aura-price-modal\').remove()" style="width:100%;height:44px;background:#001A3D;color:white;border:none;font-size:13px;font-weight:700;letter-spacing:0.08em;cursor:pointer;font-family:Inter,system-ui,sans-serif">'+t('price_m_ok')+'</button></div>'
      +'<button onclick="document.getElementById(\'aura-price-modal\').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#9ca3af;cursor:pointer;font-size:20px;line-height:1">&times;</button></div>';
    document.body.appendChild(overlay);
  };
})();

/* ── 4. Cookie Consent Banner ── */
(function initCookieBanner(){
  if(localStorage.getItem('aura_cookie_consent')) return;
  var bar=document.createElement('div');
  bar.id='aura-cookie-bar';
  bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#001A3D;color:white;box-shadow:0 -4px 20px rgba(0,0,0,0.3);font-family:Inter,system-ui,sans-serif;';
  bar.innerHTML='<div style="max-width:1200px;margin:0 auto;padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between"><div style="flex:1;min-width:200px"><p style="font-size:13px;line-height:1.6;margin:0;color:rgba(255,255,255,0.8)">'+t('cookie_text')+' <a href="/privacy.html" style="color:#C5A059;text-decoration:underline">'+t('cookie_privacy')+'</a>.</p></div><div style="display:flex;gap:10px;flex-shrink:0"><button id="aura-cookie-reject" style="padding:10px 24px;background:transparent;color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.2);font-size:12px;font-weight:700;letter-spacing:0.1em;cursor:pointer;font-family:Inter,system-ui,sans-serif">'+t('cookie_reject')+'</button><button id="aura-cookie-ok" style="padding:10px 24px;background:#C5A059;color:white;border:none;font-size:12px;font-weight:700;letter-spacing:0.1em;cursor:pointer;font-family:Inter,system-ui,sans-serif">'+t('cookie_accept')+'</button></div></div>';
  document.body.appendChild(bar);
  function dismissBar(){bar.style.transition='transform 0.3s ease';bar.style.transform='translateY(100%)';setTimeout(function(){bar.remove();},400);}
  document.getElementById('aura-cookie-ok').addEventListener('click',function(){
    localStorage.setItem('aura_cookie_consent','1');
    dismissBar();
  });
  document.getElementById('aura-cookie-reject').addEventListener('click',function(){
    localStorage.setItem('aura_cookie_consent','essential');
    dismissBar();
  });
})();

})();
