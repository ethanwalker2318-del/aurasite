/* ═══════════════════════════════════════════════════════
   AURA — JSON Product Loader
   Loads products from /products.json and merges them
   into the existing product system via window.AURA_JSON_PRODUCTS
   ═══════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── Category detection ── */
  function getCat(rawCat, brandLc, nameLc) {
    // Name-based override (highest priority)
    if(/backpack|rucksack|bag|handtasche|satchel|tote|purse|clutch|wallet|geldbeutel|shoulder|portfolio|messenger bag/.test(nameLc)) return 'fashion';
    if(/watch|uhr|reloj|orologio|montre|timepiece|chronograph|armbanduhr|smartwatch/.test(nameLc) && !/smartwatch/.test(brandLc)) return 'fashion';
    if(/vacuum|staubsauger|saugroboter|air purifier|luftreiniger|coffee maker|espresso|kaffeemaschine|blender|mixer/.test(nameLc)) return 'home';
    // Brand arrays
    var fashionBrands = [
      'nike','adidas','lululemon','new balance','carhartt','polo ralph lauren','ralph lauren',
      'supreme','off-white','stone island','canada goose','gucci','prada','balenciaga',
      'converse','vans','reebok','puma','under armour','jordan','north face','gap','h&m','zara','uniqlo',
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
    for(var i=0;i<fashionBrands.length;i++){if(brandLc.indexOf(fashionBrands[i])!==-1) return 'fashion';}
    for(var i=0;i<travelBrands.length;i++){if(brandLc.indexOf(travelBrands[i])!==-1) return 'travel';}
    for(var i=0;i<homeBrands.length;i++){if(brandLc.indexOf(homeBrands[i])!==-1) return 'home';}
    for(var i=0;i<electronicsBrands.length;i++){if(brandLc.indexOf(electronicsBrands[i])!==-1) return 'electronics';}
    return (['electronics','fashion','home','travel'].indexOf(rawCat)!==-1 ? rawCat : 'electronics');
  }

  /* ── Subcategory detection ── */
  function getSubcat(cat, nm, b) {
    if(cat==='fashion'){
      if(/\bwatch\b|uhr\b|armbanduhr|timepiece|chronograph/.test(nm) || /fossil|casio|seiko|rolex|omega|tag heuer|tissot|swatch|timex|longines|daniel wellington|breitling|iwc|patek|hublot|cartier/.test(b)) return 'watches';
      if(/bag\b|backpack|rucksack|wallet|purse|clutch|tote|satchel|shoulder|handtasche|portfolio|messenger/.test(nm)) return 'bags';
      if(/trainer|sneaker|\bshoe\b|\bboot\b|loafer|sandal|pump|derby|oxford|slipper|mule|court\b/.test(nm)) return 'shoes';
      if(/sunglass|glasse|\bbelt\b|\bscarf\b|\bhat\b|\bcap\b|beanie|gloves?|bracelet|\bring\b|necklace/.test(nm)) return 'accessories';
      if(/underwear|boxer|brief|\bbra\b|sock\b|lingerie/.test(nm)) return 'underwear';
      return 'clothing';
    }
    if(cat==='electronics'){
      if(/iphone|galaxy\s*[sa]\d|pixel\s*\d|oneplus|xiaomi.*mi\b|smartphone|handy/.test(nm)) return 'phones';
      if(/\bipad\b|tablet|galaxy\s*tab/.test(nm)) return 'tablets';
      if(/macbook|laptop|notebook|thinkpad|ideapad|\bxps\b|matebook/.test(nm)) return 'computers';
      if(/ps[45]|playstation|xbox|nintendo\s*switch|gaming\s*headset|game\s*controller/.test(nm)) return 'gaming';
      if(/headphone|earphone|earbuds|airpods|soundbar|speaker|\baudio\b|kopfhoerer|lautsprecher/.test(nm)) return 'audio';
      if(/camera|kamera|lens|objektiv|dslr|mirrorless|gopro/.test(nm) || /^(canon|nikon|fujifilm|gopro)/.test(b)) return 'cameras';
      if(/\btv\b|television|monitor|display|\boled\b|\bqled\b/.test(nm)) return 'displays';
      if(/\bled\b|stripe|govee|philips hue|ring cam|smart.?home|alexa|\becho\b/.test(nm)) return 'smart_home';
      return 'gadgets';
    }
    if(cat==='home'){
      if(/espresso|coffee|kaffeemaschine|nespresso|capsule|keurig|blender|mixer|toaster|kettle|fryer|grill|instant pot/.test(nm)) return 'kitchen';
      if(/vacuum|saugroboter|roomba|robomop|staubsauger|\bmop\b/.test(nm) || /^(dyson|ecovacs|irobot|roborock|shark|rowenta)/.test(b)) return 'cleaning';
      if(/hair|supersonic|airwrap|airstrait|shaver|trimmer|epilator|styler|trockner/.test(nm)) return 'hair_beauty';
      return 'appliances';
    }
    if(cat==='travel'){
      if(/backpack|rucksack|luggage|suitcase|trolley|\bbag\b|koffer/.test(nm) || /^(rimowa|samsonite|tumi|away|osprey|gregory|lowepro|manfrotto|peak design)/.test(b)) return 'luggage';
      if(/\bshoe\b|\bboot\b|hiking|trail\s*shoe|trail\s*run/.test(nm) || /^(salomon|hoka|merrell)/.test(b)) return 'footwear';
      if(/tent|schlafsack|sleeping bag|headlamp|thermos|hydration|bivouac/.test(nm) || /^(msr|black.?diamond|garmin|suunto)/.test(b)) return 'gear';
      return 'outdoor'; // clothing: caps, jackets, fleece, vests
    }
    return '';
  }

  function normalizeProduct(raw){
    var b = raw.image_base;
    var rat = raw.rating || (3.8 + Math.random()*1.2);
    rat = Math.round(rat*10)/10;
    var rev = raw.reviews || (10 + Math.floor(Math.random()*290));
    var brandLc = (raw.brand||'').toLowerCase();
    var nameLc = (raw.name||'').toLowerCase();
    var cat = getCat(raw.cat, brandLc, nameLc);
    return {
      id:         String(raw.id),
      name:       raw.name,
      brand:      raw.brand,
      cat:        cat,
      subcat:     getSubcat(cat, nameLc, brandLc),
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
