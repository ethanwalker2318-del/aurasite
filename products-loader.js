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
      cat:        (function(rawCat, rawBrand){
      var b = (rawBrand||'').toLowerCase();
      var nm = (raw.name||'').toLowerCase();
      // ── Name-based override (highest priority — beats brand) ──
      if(/backpack|rucksack|bag|handtasche|satchel|tote|purse|clutch|wallet|geldbeutel|shoulder|portfolio|messenger bag/.test(nm)) return 'fashion';
      if(/watch|uhr|reloj|orologio|montre|timepiece|chronograph|armbanduhr|smartwatch/.test(nm) && !/smartwatch/.test(b)) return 'fashion';
      if(/vacuum|staubsauger|saugroboter|air purifier|luftreiniger|coffee maker|espresso|kaffeemaschine|blender|mixer/.test(nm)) return 'home';
      // ── Brand arrays ──
      var fashionBrands = [
        'nike','adidas','lululemon','new balance','carhartt','polo ralph lauren','ralph lauren',
        'supreme','off-white','stone island','canada goose','gucci','prada','balenciaga',
        'converse','vans','reebok','puma','under armour','jordan','north face','gap','h&m','zara','uniqlo',
        // Watch & accessory brands
        'guess','etti','fossil','casio','seiko','michael kors','tommy hilfiger','calvin klein',
        'dkny','emporio armani','hugo boss','daniel wellington','tag heuer','longines','swatch',
        'timex','tissot','versace','armani exchange','coach','kate spade','marc jacobs',
        'ted baker','lacoste','boss','rolex','omega','breitling','iwc','patek','hublot',
        'cartier watch','burberry','montblanc','tory burch','furla','charles & keith',
        'pedro','aldo','steve madden','nine west','charles david'
      ];
      var travelBrands = ['mammut','patagonia','salomon','hoka','columbia','arcteryx','merrell','osprey','gregory','msr','blackdiamond','black diamond','suunto','garmin','rimowa','samsonite','tumi','away','peak design','lowepro','manfrotto'];
      var homeBrands = ['dyson','ecovacs','hexclad','kitchenaid','nespresso','ring','govee','roomba','irobot','philips hue','le creuset','vitamix','breville','keurig','instant pot','ninja','cuisinart','sonos','augustlock','august','nest','delonghi','smeg','shark','rowenta','tefal','bosch home','braun'];
      var electronicsBrands = ['apple','samsung','sony','bose','microsoft','lg','dell','hp','lenovo','asus','acer','google','oneplus','huawei','xiaomi','canon','nikon','fujifilm','gopro','meta','oculus','playstation','xbox','nintendo','jbl','beats','anker','razer','logitech','corsair','alienware','msi','benq','viewsonic'];
      for(var i=0;i<fashionBrands.length;i++){if(b.indexOf(fashionBrands[i])!==-1) return 'fashion';}
      for(var i=0;i<travelBrands.length;i++){if(b.indexOf(travelBrands[i])!==-1) return 'travel';}
      for(var i=0;i<homeBrands.length;i++){if(b.indexOf(homeBrands[i])!==-1) return 'home';}
      for(var i=0;i<electronicsBrands.length;i++){if(b.indexOf(electronicsBrands[i])!==-1) return 'electronics';}
      // Fall back to raw.cat if valid, else electronics
      return (['electronics','fashion','home','travel'].indexOf(rawCat)!==-1 ? rawCat : 'electronics');
    })(raw.cat, raw.brand),
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
    xhr.open('GET', '/products.json?v=12', true);
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
