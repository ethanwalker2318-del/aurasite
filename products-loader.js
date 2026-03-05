/* ═══════════════════════════════════════════════════════
   AURA — JSON Product Loader
   Loads products from /products.json and merges them
   into the existing product system via window.AURA_JSON_PRODUCTS
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function normalizeProduct(raw){
    var b = raw.image_base;
    var rat = raw.rating || (3.8 + Math.random()*1.2);
    rat = Math.round(rat*10)/10;
    var rev = raw.reviews || (10 + Math.floor(Math.random()*290));
    return {
      id:         String(raw.id),
      name:       raw.name,
      brand:      raw.brand,
      cat:        raw.cat || 'electronics',
      price:      raw.price,
      oldPrice:   raw.oldPrice || 0,
      img:        b + '1.webp',
      gallery:    [b+'2.webp', b+'3.webp', b+'4.webp', b+'5.webp', b+'6.webp'],
      videoUrl:   '',
      rating:     rat,
      reviews:    rev,
      desc:       raw.desc || '',
      stock:      raw.stock || (5 + Math.floor(Math.random()*45)),
      inspection: {authentic:true, functional:true, sealed:true},
      _sourcingLink: '', _costPrice: 0, _logisticsFee: 0
    };
  }

  function loadProducts(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/products.json?v=9', true);
    xhr.onreadystatechange = function(){
      if(xhr.readyState !== 4) return;
      if(xhr.status !== 200){ console.warn('[products-loader] Failed to load products.json:', xhr.status); return; }
      try {
        var raw = JSON.parse(xhr.responseText);
        if(!Array.isArray(raw) || !raw.length) return;
        var products = raw.map(normalizeProduct);
        window.AURA_JSON_PRODUCTS = products;
        document.dispatchEvent(new CustomEvent('aura:json-products-loaded', {detail: products}));
      } catch(e) {
        console.error('[products-loader] Parse error:', e);
      }
    };
    xhr.send();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadProducts);
  } else {
    loadProducts();
  }
})();
