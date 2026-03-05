/* ═══════════════════════════════════════════════════════
   AURA — JSON Product Loader
   Loads products from /products.json and merges them
   into the existing product system via window.AURA_JSON_PRODUCTS
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function normalizeProduct(raw){
    var imgBase = '/public/images/products/' + raw.image_folder + '/';
    return {
      id:         raw.id,
      name:       raw.name,
      brand:      raw.brand,
      cat:        raw.category || 'electronics',
      price:      raw.price,
      oldPrice:   raw.oldPrice || 0,
      img:        imgBase + '1.webp',
      gallery:    [imgBase+'2.webp', imgBase+'3.webp', imgBase+'4.webp', imgBase+'5.webp', imgBase+'6.webp'],
      videoUrl:   raw.videoUrl || '',
      rating:     raw.rating || 0,
      reviews:    raw.reviews || 0,
      desc:       raw.description_de || '',
      stock:      raw.stock || 0,
      inspection: raw.inspection || {authentic:true, functional:true, sealed:true},
      _sourcingLink: '', _costPrice: 0, _logisticsFee: 0
    };
  }

  function loadProducts(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/products.json?v=' + Date.now(), true);
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
