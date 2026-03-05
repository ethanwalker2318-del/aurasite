/* ═══════════════════════════════════════════════════════
   AURA GLOBAL MERCHANTS — Shared Application Module
   All data, auth, cart, orders managed via localStorage
   ═══════════════════════════════════════════════════════ */
(function(){
'use strict';
var ADMIN_EMAIL = atob('ZXRoYW53YWxrZXIyMzE4QGdtYWlsLmNvbQ==');
var ADMIN_PASS = atob('QXVyYUFkbWluMjAyNiE=');

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
var DEFAULT_PRODUCTS = [
  // ─── APPLE ───
  {id:'p1', name:'iPhone 16 Pro Max',        brand:'Apple',   cat:'electronics', price:1350.9,oldPrice:1626.9, img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=400&hei=400&fmt=jpeg&qlt=90', gallery:[], videoUrl:'', rating:4.8, reviews:342, desc:'Titangehäuse, 48 MP Kamerasystem mit 5× optischem Zoom, A18 Pro Chip. 6,9" Super Retina XDR Display. Apple Intelligence. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:15, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p3', name:'Apple Watch Ultra 2',       brand:'Apple',   cat:'electronics', price:750.9,oldPrice:895.9,  img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQDY3ref_VW_34FR?wid=400&hei=400&fmt=jpeg&qlt=90', gallery:[], videoUrl:'', rating:4.9, reviews:215, desc:'Titangehäuse 49 mm, Dual-Frequenz-GPS, bis 36 Stunden Akku. 100 m Wasserbeständigkeit. Für Extremsport. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:12, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p5', name:'MacBook Pro M3 14"',        brand:'Apple',   cat:'electronics', price:2000.9,oldPrice:2530.99, img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202310?wid=400&hei=400&fmt=jpeg&qlt=90', gallery:[], videoUrl:'', rating:4.9, reviews:1203,desc:'Apple M3 Pro Chip, 18 GB vereinheitlichter Speicher, Liquid Retina XDR Display. Bis zu 17 Stunden Batterie. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:6, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p12',name:'AirPods Pro 2',             brand:'Apple',   cat:'electronics', price:230.9,oldPrice:281.9,  img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-pro-2-hero-select-202409?wid=400&hei=400&fmt=jpeg&qlt=90', gallery:[], videoUrl:'', rating:4.7, reviews:3200,desc:'Adaptive Geräuschunterdrückung, USB-C Ladecase, Personalisiertes 3D Audio. Hi-Res Audio mit Adaptive EQ. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:52, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p17',name:'iPad Pro M4 13"',           brand:'Apple',   cat:'electronics', price:1350.9,oldPrice:1667.9, img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-model-select-gallery-1-202405?wid=400&hei=400&fmt=jpeg&qlt=90', gallery:[], videoUrl:'', rating:4.9, reviews:560, desc:'Ultra Retina XDR OLED-Display, M4 Chip, Apple Pencil Pro. Das dünnste und leistungsstärkste iPad aller Zeiten. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:9, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── SAMSUNG ───
  {id:'p6', name:'Samsung Galaxy S24 Ultra',  brand:'Samsung', cat:'electronics', price:1200.9,oldPrice:1468.9, img:'https://images.samsung.com/is/image/samsung/assets/de/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-kv.jpg', gallery:[], videoUrl:'', rating:4.7, reviews:678, desc:'Titanrahmen, 200 MP Kamera, S Pen, Galaxy AI. 6,8" Dynamic AMOLED 2X mit Anti-Reflex-Beschichtung. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:20, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p14',name:'Samsung Galaxy Watch 6',    brand:'Samsung', cat:'electronics', price:300.9,oldPrice:358.9,  img:'https://images.samsung.com/is/image/samsung/assets/de/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-kv.jpg', gallery:[], videoUrl:'', rating:4.3, reviews:432, desc:'BioActive Sensor, Saphirglas, Wear OS. Schlaftracking und Körperzusammensetzung. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p40',name:'Samsung Galaxy Buds3 Pro',  brand:'Samsung', cat:'electronics', price:230.9,oldPrice:260.9,  img:'https://images.samsung.com/is/image/samsung/assets/de/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-kv.jpg', gallery:[], videoUrl:'', rating:4.5, reviews:520, desc:'Blade-Design, 2-Wege-Lautsprecher, 360 Audio, ANC. Hi-Res Audio zertifiziert. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:35, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── SONY ───
  {id:'p2', name:'Sony WH-1000XM5',          brand:'Sony',    cat:'electronics', price:320.9,oldPrice:357.9,  img:'https://www.sony.com/image/5d02da5df552836db894cead8a68f5f3?fmt=png-alpha&wid=440', gallery:[], videoUrl:'', rating:4.7, reviews:891, desc:'Branchenführende Geräuschunterdrückung, 30 Stunden Akku, LDAC Hi-Res. Ultraleichtes Faltdesign mit 250 g. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:28, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p15',name:'Sony WF-1000XM5',           brand:'Sony',    cat:'electronics', price:260.9,oldPrice:297.9,  img:'https://www.sony.com/image/5d02da5df552836db894cead8a68f5f3?fmt=png-alpha&wid=440', gallery:[], videoUrl:'', rating:4.6, reviews:780, desc:'Kleinstes Noise-Cancelling TWS der Welt, LDAC Hi-Res Wireless. Bis zu 24 Stunden mit Case. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:25, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p18',name:'PS5 Pro',                    brand:'Sony',    cat:'electronics', price:700.9,oldPrice:808.9,  img:'https://www.sony.com/image/5d02da5df552836db894cead8a68f5f3?fmt=png-alpha&wid=440', gallery:[], videoUrl:'', rating:4.8, reviews:1100,desc:'Erweiterter GPU-Modus, 2 TB SSD, 8K-Unterstützung, Ray Tracing. Die leistungsstärkste PlayStation. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:7, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── BOSE ───
  {id:'p7', name:'Bose QuietComfort Ultra',   brand:'Bose',    cat:'electronics', price:370.9,oldPrice:474.9,  img:'https://www.sony.com/image/5d02da5df552836db894cead8a68f5f3?fmt=png-alpha&wid=440', gallery:[], videoUrl:'', rating:4.5, reviews:445, desc:'Immersive Audio, CustomTune Technologie, bis 24 Stunden Akkulaufzeit. Spatial Audio für 3D-Klang. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:14, inspection:{authentic:true,functional:true,sealed:false}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p41',name:'Bose SoundLink Max',        brand:'Bose',    cat:'electronics', price:380.9,oldPrice:466.9,  img:'https://www.sony.com/image/5d02da5df552836db894cead8a68f5f3?fmt=png-alpha&wid=440', gallery:[], videoUrl:'', rating:4.6, reviews:230, desc:'Tragbarer Lautsprecher, 20 Stunden Akku, IP67 Schutz, Stereo-Pair. Tiefer, kraftvoller Bass. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:18, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── DYSON ───
  {id:'p4', name:'Dyson V15 Detect',          brand:'Dyson',   cat:'home',        price:660.9,oldPrice:805.9,  img:'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/hero-locale/de_DE/446986-01.png', gallery:[], videoUrl:'', rating:4.6, reviews:567, desc:'Laser-Stauberkennung, HEPA-Filtration, piezoelektrischer Sensor. Bis zu 60 Minuten Laufzeit. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:8, inspection:{authentic:true,functional:true,sealed:false}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p11',name:'Dyson Airwrap Complete',    brand:'Dyson',   cat:'home',        price:500.9,oldPrice:583.9,  img:'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/primary/400715-01.png', gallery:[], videoUrl:'', rating:4.6, reviews:1890,desc:'Multistyler mit Coanda-Effekt, 6 Aufsätze für alle Haartypen. Kein extreme Hitze nötig. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:19, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p16',name:'Dyson Supersonic',           brand:'Dyson',   cat:'home',        price:400.9,oldPrice:460.9,  img:'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products/primary/107830-01.png', gallery:[], videoUrl:'', rating:4.5, reviews:2300,desc:'Digitaler Motor V9, Intelligente Wärmekontrolle, Magnetic Styling-Aufsätze. Schnelles, schonendes Trocknen. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:17, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NIKE ───
  {id:'p8', name:'Nike Air Max 90',           brand:'Nike',    cat:'fashion',     price:130.9,oldPrice:146.9,  img:'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/e6da41fa-1be4-4ce5-b89c-22be4f1f02d4/air-max-90-shoes-kRsBnD.png', gallery:[], videoUrl:'', rating:4.4, reviews:2100,desc:'Kultiger Laufschuh mit sichtbarer Air-Sohle. Leder- und Mesh-Obermaterial. Seit 1990 eine Ikone. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:45, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p13',name:'Nike Air Jordan 1 Retro',   brand:'Nike',    cat:'fashion',     price:159.99,oldPrice:201.99,  img:'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/e6da41fa-1be4-4ce5-b89c-22be4f1f02d4/air-max-90-shoes-kRsBnD.png', gallery:[], videoUrl:'', rating:4.6, reviews:1560,desc:'Der Sneaker, der alles veränderte. Premium-Leder, Nike Air Dämpfung, OG Colorway. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:22, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p42',name:'Nike Dunk Low Panda',       brand:'Nike',    cat:'fashion',     price:100.9,oldPrice:125.9,  img:'https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/e6da41fa-1be4-4ce5-b89c-22be4f1f02d4/air-max-90-shoes-kRsBnD.png', gallery:[], videoUrl:'', rating:4.5, reviews:4200,desc:'Schwarz-weiße Leder-Kombination, Foam-Mittelsohle. Der meistgefragte Dunk der letzten Jahre. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:60, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ADIDAS ───
  {id:'p21',name:'Adidas Ultraboost Light',   brand:'Adidas',  cat:'fashion',     price:165.9,oldPrice:206.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EADIDAS%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.5, reviews:1850,desc:'BOOST + Lightstrike Dämpfung, Primeknit-Obermaterial, Continental™ Gummiaußensohle. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:38, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p22',name:'Adidas Samba OG',           brand:'Adidas',  cat:'fashion',     price:95.9,oldPrice:112.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EADIDAS%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.7, reviews:3400,desc:'Kultige Indoor-Ikone seit 1950. Glattleder-Obermaterial, Wildleder-T-Toe, Gummisohle. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:55, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NEW BALANCE ───
  {id:'p23',name:'New Balance 2002R',          brand:'New Balance',cat:'fashion',  price:140.9,oldPrice:161.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23CF0A2C%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23CF0A2C%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ENEW%20BALANCE%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:1200,desc:'N-ERGY Dämpfung, Wildleder- und Mesh-Obermaterial, Vintage-Look. Komfort trifft Heritage. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p24',name:'New Balance 550',            brand:'New Balance',cat:'fashion',  price:110.9,oldPrice:137.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23CF0A2C%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23CF0A2C%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ENEW%20BALANCE%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.4, reviews:2800,desc:'Retro-Basketball-Silhouette, Leder-Obermaterial, schlankes Profil. Seit 1989 ein Geheimtipp. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:42, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RIMOWA ───
  {id:'p19',name:'Rimowa Original Cabin',     brand:'Rimowa',  cat:'travel',      price:950.9,oldPrice:1164.9, img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ERIMOWA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.7, reviews:200, desc:'Aluminium-Handgepäck, TSA-Schlösser, Multiwheel®-System. Made in Germany seit 1898. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:5, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p51',name:'Rimowa Essential Check-In L',brand:'Rimowa', cat:'travel',      price:629.99,oldPrice:789.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ERIMOWA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.5, reviews:340, desc:'Polycarbonat, Flex-Divider, TSA-Schlösser. Leicht, robust und flexibel. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:10, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── LOGITECH ───
  {id:'p31',name:'Logitech MX Master 3S',     brand:'Logitech',cat:'electronics', price:90.9,oldPrice:112.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%2300B8FC%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%2300B8FC%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ELOGITECH%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.7, reviews:4500,desc:'Leise Klicks, 8K DPI, MagSpeed-Rad, Multi-Device. Die Referenz für produktives Arbeiten. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:80, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p52',name:'Logitech MX Keys S',        brand:'Logitech',cat:'electronics', price:95.9,oldPrice:108.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%2300B8FC%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%2300B8FC%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ELOGITECH%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:2100,desc:'Smart-Beleuchtung, Perfect Stroke Tasten, Multi-OS. Ergonomisch und erstklassiges Tippgefühl. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:45, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── GOOGLE ───
  {id:'p32',name:'Google Pixel 9 Pro',        brand:'Google',  cat:'electronics', price:949.99,oldPrice:1187.9, img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%234285F4%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%234285F4%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EGOOGLE%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:890, desc:'Tensor G4, Gemini AI, 50 MP Dreifach-Kamera, 7 Jahre Updates. Das intelligenteste Smartphone. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:15, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NOTHING ───
  {id:'p33',name:'Nothing Phone (2a)',        brand:'Nothing',  cat:'electronics', price:330.9,oldPrice:388.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ENOTHING%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.4, reviews:1200,desc:'Glyph Interface, Dimensity 7200 Pro, 50 MP Kamera, Transparentes Design. Kein Smartphone wie jedes andere. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:22, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ONEPLUS ───
  {id:'p34',name:'OnePlus 12',                brand:'OnePlus', cat:'electronics', price:750.9,oldPrice:949.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23EB0028%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23EB0028%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EONEPLUS%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:1560,desc:'Snapdragon 8 Gen 3, Hasselblad-Kamera, 100W SUPERVOOC. Flaggschiff-Killer. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:18, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── DELL ───
  {id:'p35',name:'Dell XPS 15',               brand:'Dell',    cat:'electronics', price:1600.9,oldPrice:1811.9, img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23007DB8%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23007DB8%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EDELL%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.5, reviews:780, desc:'Intel Core Ultra, 15,6" 3,5K OLED, 32 GB RAM, Infinity Edge. Für kreative Profis. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:5, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── GOPRO ───
  {id:'p36',name:'GoPro HERO13 Black',        brand:'GoPro',   cat:'electronics', price:370.9,oldPrice:463.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%2300AEEF%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%2300AEEF%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EGOPRO%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.5, reviews:2200,desc:'5,3K60, HyperSmooth 7.0, GPS, 10 m Wasserschutz, Magnethalterung. Für Action-Momente. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:25, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── META ───
  {id:'p37',name:'Meta Quest 3',              brand:'Meta',    cat:'electronics', price:480.9,oldPrice:554.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%230081FB%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%230081FB%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EMETA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.4, reviews:3400,desc:'Mixed Reality, Snapdragon XR2 Gen 2, 4K+ Display, Passthrough-Kameras. VR und MR vereint. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:20, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RAY-BAN ───
  {id:'p38',name:'Ray-Ban Meta Wayfarer',     brand:'Ray-Ban', cat:'fashion',     price:280.9,oldPrice:311.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ERAY-BAN%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.3, reviews:1800,desc:'12 MP Kamera, Live-Streaming, Meta AI, Open-Ear-Audio. Smarte Brille im Wayfarer-Design. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p53',name:'Ray-Ban Aviator Classic',   brand:'Ray-Ban', cat:'fashion',     price:140.9,oldPrice:166.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ERAY-BAN%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.7, reviews:8900,desc:'Goldene Metallfassung, grüne G-15 Gläser. Das Original seit 1937. 100% UV-Schutz. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:50, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── UNDER ARMOUR ───
  {id:'p54',name:'Under Armour HOVR Phantom 3',brand:'Under Armour',cat:'fashion',price:139.9,oldPrice:155.99,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%231D1D1D%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%231D1D1D%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EUNDER%20ARMOUR%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.4, reviews:780, desc:'HOVR Zero Gravity Dämpfung, UA Flow Außensohle, MapMyRun Sensor. Lauf-Performance. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:28, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── PUMA ───
  {id:'p55',name:'Puma Suede Classic XXI',    brand:'Puma',    cat:'fashion',     price:70.9,oldPrice:79.9,   img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EPUMA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.3, reviews:3200,desc:'Wildleder-Obermaterial, Formstreifen, vulkanisierte Gummisohle. Kultiger Silhouett seit 1968. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:65, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NORTH FACE ───
  {id:'p56',name:'The North Face Nuptse 700', brand:'North Face',cat:'fashion',   price:260.9,oldPrice:330.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ENORTH%20FACE%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.7, reviews:4100,desc:'700-Fill-Gänsedaunen, DWR-Beschichtung, 1996 Retro-Design. Die Winterjacke schlechthin. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:20, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ARC'TERYX ───
  {id:'p57',name:'Arc\'teryx Beta LT Jacket', brand:'Arc\'teryx',cat:'fashion',   price:470.9,oldPrice:539.9,  img:'jacket', gallery:[], videoUrl:'', rating:4.8, reviews:890, desc:'GORE-TEX, 390 g, minimalistisches Alpine-Design, WaterTight™ Reißverschlüsse. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:10, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── PATAGONIA ───
  {id:'p58',name:'Patagonia Better Sweater',  brand:'Patagonia',cat:'fashion',    price:110.9,oldPrice:127.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%231A3B5C%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%231A3B5C%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EPATAGONIA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:5600,desc:'100% recycelter Polyester-Fleece, Fair Trade, warmer Griff. Umweltbewusst und gemütlich. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:35, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── LULULEMON ───
  {id:'p59',name:'Lululemon Align Leggings',  brand:'Lululemon',cat:'fashion',    price:89.99,oldPrice:108.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23D31334%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23D31334%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ELULULEMON%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.8, reviews:11200,desc:'Nulu™ Stoff, ultraleicht, hoher Bund 25". Fühlt sich an wie eine zweite Haut. Yoga-Favorit. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:50, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── COACH ───
  {id:'p60',name:'Coach Tabby Shoulder Bag',  brand:'Coach',   cat:'fashion',     price:400.9,oldPrice:492.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%238B4513%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%238B4513%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ECOACH%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.5, reviews:1400,desc:'Refined Calf Leather, geschmiedetes C-Logo, Retro-Silhouette. Handwerkskunst seit 1941. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:12, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── PANDORA ───
  {id:'p61',name:'Pandora Moments Bracelet',  brand:'Pandora', cat:'fashion',     price:60.9,oldPrice:72.9,   img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23C0C0C0%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23C0C0C0%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EPANDORA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:8200,desc:'Sterling-Silber 925, Barrel-Verschluss, kompatibel mit allen Pandora-Charms. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:100, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ECOVACS ───
  {id:'p62',name:'Ecovacs Deebot X2 Omni',   brand:'Ecovacs', cat:'home',        price:850.9,oldPrice:1058.9, img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%230099CC%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%230099CC%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EECOVACS%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.4, reviews:1300,desc:'LiDAR + Kamera-Navigation, 8000 Pa, Auto-Reinigung, Heißluft-Trocknung. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:11, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── HEXCLAD ───
  {id:'p63',name:'HexClad 12-Piece Pan Set',  brand:'HexClad', cat:'home',        price:549.9,oldPrice:664.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23333333%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23333333%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EHEXCLAD%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:4500,desc:'Tri-Ply Edelstahl + Antihaftbeschichtung, patentiertes Hex-Design. 12-teiliges Set. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:8, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RING ───
  {id:'p64',name:'Ring Video Doorbell Pro 2', brand:'Ring',    cat:'home',        price:220.9,oldPrice:266.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%231C96E8%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%231C96E8%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ERING%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.5, reviews:6700,desc:'1536p HD+, 3D Motion, Bird\'s Eye Zone, Alexa-Integration. Sicherheit an der Haustür. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:40, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── OURA ───
  {id:'p65',name:'Oura Ring Generation 3',    brand:'Oura',    cat:'electronics', price:300.9,oldPrice:337.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EOURA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.4, reviews:2400,desc:'Schlaf-Tracking, SpO2, Hauttemperatur, Titan-Gehäuse. Gesundheit am Finger. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:25, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── TESLA ───
  {id:'p66',name:'Tesla Cybertruck 1:18 Diecast',brand:'Tesla',cat:'home',       price:169.99,oldPrice:195.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23CC0000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23CC0000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ETESLA%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.3, reviews:560, desc:'Offiziell lizenziert, Edelstahl-Optik, Geschenkbox. Sammlerstück für Tesla-Fans. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:15, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── TREZOR ───
  {id:'p67',name:'Trezor Safe 5',             brand:'Trezor',  cat:'electronics', price:150.9,oldPrice:168.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%2300854D%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%2300854D%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ETREZOR%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.7, reviews:3100,desc:'Haptischer Touchscreen, Secure Element, 8000+ Token, Open Source. Krypto-Sicherheit. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── XREAL ───
  {id:'p68',name:'XREAL Air 2 Pro',           brand:'XREAL',   cat:'electronics', price:390.9,oldPrice:492.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%23000000%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%23000000%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EXREAL%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.3, reviews:780, desc:'AR-Brille, 130" virtuelles Display, 3 Verdunkelungsstufen, nur 72 g. Kino auf der Nase. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:12, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── GOVEE ───
  {id:'p69',name:'Govee Glide Hexa Pro',      brand:'Govee',   cat:'home',        price:179.99,oldPrice:229.9,  img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%234A6CF7%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%234A6CF7%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3EGOVEE%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.5, reviews:3400,desc:'10 RGBIC Hex-Panels, DreamView, Music Sync, WiFi + Bluetooth. Smart Lighting. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:22, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RITUALS ───
  {id:'p70',name:'Rituals Sakura Body Cream', brand:'Rituals', cat:'home',        price:19.99,oldPrice:22.9,   img:'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%20400%20400%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f8f7f4%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22100%22%20width%3D%22120%22%20height%3D%22120%22%20rx%3D%2220%22%20fill%3D%22%232C1810%22%20opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22240%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%2214%22%20font-weight%3D%22600%22%20fill%3D%22%232C1810%22%20opacity%3D%220.35%22%20letter-spacing%3D%223%22%3ERITUALS%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22500%22%20fill%3D%22%23001A3D%22%20opacity%3D%220.15%22%20letter-spacing%3D%224%22%3EAURA%20VERIFIED%3C%2Ftext%3E%3C%2Fsvg%3E', gallery:[], videoUrl:'', rating:4.6, reviews:7800,desc:'Reismilch + Kirschblüte, 220 ml, 24h Feuchtigkeit. Japanisch inspirierte Pflege. ✓ Originalverpackt ✓ 24 Monate Garantie ✓ Blitzversand', stock:90, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0}
];

var PRODUCTS_VERSION = 6; // Bump to force refresh after overrides system
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
  if(window.AURA_EXTRA_PRODUCTS && window.AURA_EXTRA_PRODUCTS.length){
    var existingIds = {};
    p.forEach(function(x){ existingIds[x.id] = true; });
    window.AURA_EXTRA_PRODUCTS.forEach(function(ep){
      if(!existingIds[ep.id] && deletedIds.indexOf(ep.id)===-1){ p.push(ep); existingIds[ep.id] = true; }
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
    var users = getUsers();
    var adm = users.find(function(u){return u.email===ADMIN_EMAIL;});
    if(!adm){
      adm = {id:uid(), name:'Admin', email:ADMIN_EMAIL, password:ADMIN_PASS, role:'admin', created:new Date().toISOString()};
      users.push(adm);
      saveUsers(users);
    }
    if(password===adm.password){ ls('aura_session',{id:adm.id, userId:adm.id, email:adm.email, role:'admin', name:adm.name}); return {ok:true,user:adm}; }
    return {ok:false, error:t('err_wrong_pass')};
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
function imgHtml(src, sizeClass, altText){
  var alt = (altText||'').replace(/"/g,'&quot;');
  if(isImgUrl(src)) return '<img src="'+src+'" alt="'+alt+'" class="w-full h-full object-cover" loading="lazy">';
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
  var heartBtn='<button onclick="event.preventDefault();event.stopPropagation();Aura.toggleWishlist(\''+p.id+'\');this.querySelector(\'svg\').setAttribute(\'fill\',Aura.isInWishlist(\''+p.id+'\')?\'currentColor\':\'none\');this.classList.toggle(\'text-red-500\',Aura.isInWishlist(\''+p.id+'\'));this.classList.toggle(\'text-white\',!Aura.isInWishlist(\''+p.id+'\'))" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-colors '+(wishActive?'text-red-500':'text-white')+' hover:scale-110" title="Wunschliste"><svg class="w-4 h-4" fill="'+(wishActive?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button>';
  if(isLink){
    return '<a href="/product.html?id='+p.id+'" class="product-card group bg-white border border-gray-100 hover:border-navy/20 transition-all rounded-xl '+cls+'">'
    +'<div class="relative overflow-hidden rounded-t-xl">'+heartBtn+'<div class="prod-img aspect-square bg-gray-50 flex items-center justify-center transition-transform duration-500">'+imgHtml(p.img,null,p.brand+' '+p.name)+'</div>'
    +'<span class="absolute top-3 left-3 px-2 py-0.5 '+badge+' text-white text-[9px] font-bold rounded">'+badgeT+'</span>'+disc
    +'<div class="quick-act absolute bottom-3 left-3 right-3"><span class="flex items-center justify-center gap-2 w-full py-2.5 bg-navy text-white text-xs font-semibold rounded-lg">'+t('view_prod')+'</span></div></div>'
    +'<div class="p-4"><p class="text-gold text-[10px] font-semibold tracking-[0.15em] uppercase">'+p.brand+'</p><h3 class="text-sm font-medium mt-1 leading-snug truncate">'+p.name+'</h3>'
    +stars+sold
    +'<div class="flex items-baseline flex-wrap mt-2"><span class="text-base font-bold">'+formatPrice(p.price)+'</span>'+mwst+old+'</div>'
    +trustLine
    +'</div></a>';
  }
  return '<div class="product-card group bg-white border border-gray-100 hover:border-navy/20 transition-all rounded-xl '+cls+'">'
  +'<a href="/product.html?id='+p.id+'" class="block"><div class="relative overflow-hidden rounded-t-xl">'+heartBtn+'<div class="prod-img aspect-square bg-gray-50 flex items-center justify-center transition-transform duration-500">'+imgHtml(p.img,null,p.brand+' '+p.name)+'</div>'
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
  nav_all:'Alle Produkte',nav_electronics:'Elektronik',nav_fashion:'Mode',nav_fashion_long:'Mode & Accessoires',nav_home:'Haus & Wohnen',nav_travel:'Reise & Outdoor',nav_sale:'Sale %',nav_new:'Neuheiten ✦',
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
  cookie_text:'Wir verwenden ausschließlich <strong style="color:white">technisch notwendige Cookies</strong>, die für den Betrieb unserer Website erforderlich sind. Mehr erfahren Sie in unserer',cookie_accept:'AKZEPTIEREN',cookie_privacy:'Datenschutzerklärung',
  activity_just:'Gerade eben · Aura Global',
  sec_process:'UNSER PROZESS',sec_how:'So funktioniert Aura',sec_how_d:'Jedes Produkt durchl\u00e4uft unser dreistufiges Pr\u00fcfverfahren im Londoner Hub, bevor es zu Ihnen gelangt.',
  step1_n:'Schritt 1',step1_t:'Beschaffung',step1_d:'Wir beziehen Originalware direkt von autorisierten H\u00e4ndlern und Marken weltweit \u2014 von Apple \u00fcber Nike bis Louis Vuitton. \u00dcber 120 verifizierte Quellen.',
  step2_n:'Schritt 2',step2_t:'Hub-Inspektion',step2_d:'In unserem Londoner Hub wird jedes Produkt manuell auf Originalit\u00e4t, Vollst\u00e4ndigkeit und Funktion gepr\u00fcft \u2014 mit Video-Dokumentation.',
  step3_n:'Schritt 3',step3_t:'Versand zu Ihnen',step3_d:'Versiegeltes, gepr\u00fcftes Paket \u2014 versichert und mit Tracking direkt zu Ihnen nach Hause. In nur 2\u20134 Werktagen.',
  stat_items:'Gepr\u00fcfte Artikel',stat_brands:'Top-Marken',stat_sat:'Kundenzufriedenheit',stat_del:'Tage Lieferung',
  cat_elec_d:'Smartphones, Laptops, Audio',cat_fash_d:'Schuhe, Taschen, Schmuck',cat_home_d:'Dyson, Smarthome, Pflege',cat_travel_d:'Gep\u00e4ck, Accessoires',cat_beauty:'Beauty & Pflege',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'ENTDECKEN \u2192',
  spot_top:'TOP KATEGORIE',spot_elec:'Elektronik & Technik',spot_all_elec:'Alle Elektronik \u2192',spot_fash:'Mode & Lifestyle',spot_all_fash:'Alle Mode \u2192',
  sec_trending_label:'\ud83d\udd25 AKTUELL',sec_trending:'Trending jetzt',sec_all_new:'Alle Neuheiten \u2192',
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
  nav_all:'All Products',nav_electronics:'Electronics',nav_fashion:'Fashion',nav_fashion_long:'Fashion & Accessories',nav_home:'Home & Living',nav_travel:'Travel & Outdoor',nav_sale:'Sale %',nav_new:'New Arrivals ✦',
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
  cookie_text:'We only use <strong style="color:white">essential cookies</strong> required for our website to function. Learn more in our',cookie_accept:'ACCEPT',cookie_privacy:'Privacy Policy',
  activity_just:'Just now · Aura Global',
  sec_process:'OUR PROCESS',sec_how:'How Aura Works',sec_how_d:'Every product goes through our three-step inspection process at the London hub before it reaches you.',
  step1_n:'Step 1',step1_t:'Sourcing',step1_d:'We source original goods directly from authorised dealers and brands worldwide — from Apple to Nike to Louis Vuitton. Over 120 verified sources.',
  step2_n:'Step 2',step2_t:'Hub Inspection',step2_d:'At our London hub, every product is manually checked for authenticity, completeness and function — with video documentation.',
  step3_n:'Step 3',step3_t:'Shipping to You',step3_d:'Sealed, inspected package — insured and tracked directly to your door. In just 2–4 business days.',
  stat_items:'Inspected Items',stat_brands:'Top Brands',stat_sat:'Customer Satisfaction',stat_del:'Days Delivery',
  cat_elec_d:'Smartphones, Laptops, Audio',cat_fash_d:'Shoes, Bags, Jewellery',cat_home_d:'Dyson, Smart Home, Care',cat_travel_d:'Luggage, Accessories',cat_beauty:'Beauty & Care',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'DISCOVER →',
  spot_top:'TOP CATEGORY',spot_elec:'Electronics & Tech',spot_all_elec:'All Electronics →',spot_fash:'Fashion & Lifestyle',spot_all_fash:'All Fashion →',
  sec_trending_label:'🔥 TRENDING',sec_trending:'Trending Now',sec_all_new:'All New Arrivals →',
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
  nav_all:'Tous les produits',nav_electronics:'\u00c9lectronique',nav_fashion:'Mode',nav_fashion_long:'Mode & Accessoires',nav_home:'Maison',nav_travel:'Voyage & Outdoor',nav_sale:'Promo %',nav_new:'Nouveaut\u00e9s \u2726',
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
  cookie_text:'Nous utilisons uniquement des <strong style="color:white">cookies techniques</strong> n\u00e9cessaires au fonctionnement du site. En savoir plus dans notre',cookie_accept:'ACCEPTER',cookie_privacy:'Politique de confidentialit\u00e9',
  activity_just:'\u00c0 l\u0027instant \u00b7 Aura Global',
  sec_process:'NOTRE PROCESSUS',sec_how:'Comment fonctionne Aura',sec_how_d:'Chaque produit passe par notre processus d\u0027inspection en trois \u00e9tapes au hub de Londres avant de vous parvenir.',
  step1_n:'\u00c9tape 1',step1_t:'Approvisionnement',step1_d:'Nous achetons des produits originaux directement aupr\u00e8s de revendeurs agr\u00e9\u00e9s et de marques mondiales. Plus de 120 sources v\u00e9rifi\u00e9es.',
  step2_n:'\u00c9tape 2',step2_t:'Inspection Hub',step2_d:'Dans notre hub londonien, chaque produit est contr\u00f4l\u00e9 manuellement \u2014 avec documentation vid\u00e9o.',
  step3_n:'\u00c9tape 3',step3_t:'Livraison chez vous',step3_d:'Colis scell\u00e9, inspect\u00e9 \u2014 assur\u00e9 et suivi jusqu\u0027\u00e0 votre porte. En 2\u20134 jours.',
  stat_items:'Articles inspect\u00e9s',stat_brands:'Top Marques',stat_sat:'Satisfaction client',stat_del:'Jours de livraison',
  cat_elec_d:'Smartphones, PC portables, Audio',cat_fash_d:'Chaussures, Sacs, Bijoux',cat_home_d:'Dyson, Maison connect\u00e9e, Soin',cat_travel_d:'Bagages, Accessoires',cat_beauty:'Beaut\u00e9 & Soin',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'D\u00c9COUVRIR \u2192',
  spot_top:'TOP CAT\u00c9GORIE',spot_elec:'\u00c9lectronique & Tech',spot_all_elec:'Toute l\u0027\u00e9lectronique \u2192',spot_fash:'Mode & Lifestyle',spot_all_fash:'Toute la mode \u2192',
  sec_trending_label:'\ud83d\udd25 TENDANCES',sec_trending:'Tendances actuelles',sec_all_new:'Toutes les nouveaut\u00e9s \u2192',
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
  nav_all:'Todos',nav_electronics:'Electr\u00f3nica',nav_fashion:'Moda',nav_fashion_long:'Moda y Accesorios',nav_home:'Hogar',nav_travel:'Viaje & Outdoor',nav_sale:'Ofertas %',nav_new:'Novedades \u2726',
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
  cookie_text:'Solo usamos <strong style="color:white">cookies t\u00e9cnicas</strong> necesarias para el funcionamiento del sitio. M\u00e1s informaci\u00f3n en nuestra',cookie_accept:'ACEPTAR',cookie_privacy:'Pol\u00edtica de privacidad',
  activity_just:'Ahora mismo \u00b7 Aura Global',
  sec_process:'NUESTRO PROCESO',sec_how:'C\u00f3mo funciona Aura',sec_how_d:'Cada producto pasa por nuestro proceso de inspecci\u00f3n en tres pasos en el hub de Londres antes de llegar a usted.',
  step1_n:'Paso 1',step1_t:'Abastecimiento',step1_d:'Obtenemos productos originales directamente de distribuidores autorizados y marcas de todo el mundo. M\u00e1s de 120 fuentes verificadas.',
  step2_n:'Paso 2',step2_t:'Inspecci\u00f3n Hub',step2_d:'En nuestro hub de Londres, cada producto se verifica manualmente \u2014 con documentaci\u00f3n en v\u00eddeo.',
  step3_n:'Paso 3',step3_t:'Env\u00edo a su puerta',step3_d:'Paquete sellado e inspeccionado \u2014 asegurado y rastreado hasta su puerta. En solo 2\u20134 d\u00edas.',
  stat_items:'Art\u00edculos inspeccionados',stat_brands:'Top Marcas',stat_sat:'Satisfacci\u00f3n del cliente',stat_del:'D\u00edas de entrega',
  cat_elec_d:'Smartphones, Port\u00e1tiles, Audio',cat_fash_d:'Zapatos, Bolsos, Joyer\u00eda',cat_home_d:'Dyson, Hogar inteligente, Cuidado',cat_travel_d:'Equipaje, Accesorios',cat_beauty:'Belleza & Cuidado',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'DESCUBRIR \u2192',
  spot_top:'TOP CATEGOR\u00cdA',spot_elec:'Electr\u00f3nica & Tech',spot_all_elec:'Toda la Electr\u00f3nica \u2192',spot_fash:'Moda & Lifestyle',spot_all_fash:'Toda la Moda \u2192',
  sec_trending_label:'\ud83d\udd25 TENDENCIA',sec_trending:'En tendencia ahora',sec_all_new:'Todas las novedades \u2192',
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
  nav_all:'Tutti',nav_electronics:'Elettronica',nav_fashion:'Moda',nav_fashion_long:'Moda e Accessori',nav_home:'Casa',nav_travel:'Viaggio & Outdoor',nav_sale:'Offerte %',nav_new:'Novit\u00e0 \u2726',
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
  cookie_text:'Utilizziamo solo <strong style="color:white">cookie tecnici</strong> necessari al funzionamento del sito. Maggiori info nella nostra',cookie_accept:'ACCETTA',cookie_privacy:'Informativa sulla privacy',
  activity_just:'Proprio ora \u00b7 Aura Global',
  sec_process:'IL NOSTRO PROCESSO',sec_how:'Come Funziona Aura',sec_how_d:'Ogni prodotto passa attraverso il nostro processo di ispezione in tre fasi presso l\u0027hub di Londra prima di arrivare a te.',
  step1_n:'Passo 1',step1_t:'Approvvigionamento',step1_d:'Acquistiamo prodotti originali direttamente da rivenditori autorizzati e marchi di tutto il mondo. Oltre 120 fonti verificate.',
  step2_n:'Passo 2',step2_t:'Ispezione Hub',step2_d:'Nel nostro hub di Londra, ogni prodotto viene controllato manualmente \u2014 con documentazione video.',
  step3_n:'Passo 3',step3_t:'Spedizione a Te',step3_d:'Pacco sigillato e ispezionato \u2014 assicurato e tracciato fino alla tua porta. In soli 2\u20134 giorni.',
  stat_items:'Articoli Ispezionati',stat_brands:'Top Brand',stat_sat:'Soddisfazione Clienti',stat_del:'Giorni di Consegna',
  cat_elec_d:'Smartphone, Laptop, Audio',cat_fash_d:'Scarpe, Borse, Gioielli',cat_home_d:'Dyson, Smart Home, Cura',cat_travel_d:'Bagagli, Accessori',cat_beauty:'Bellezza & Cura',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'SCOPRI \u2192',
  spot_top:'TOP CATEGORIA',spot_elec:'Elettronica & Tech',spot_all_elec:'Tutta l\u0027Elettronica \u2192',spot_fash:'Moda & Lifestyle',spot_all_fash:'Tutta la Moda \u2192',
  sec_trending_label:'\ud83d\udd25 DI TENDENZA',sec_trending:'Di Tendenza Ora',sec_all_new:'Tutte le Novit\u00e0 \u2192',
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
  nav_all:'Wszystkie',nav_electronics:'Elektronika',nav_fashion:'Moda',nav_fashion_long:'Moda i Akcesoria',nav_home:'Dom',nav_travel:'Podr\u00f3\u017ce & Outdoor',nav_sale:'Wyprzeda\u017c %',nav_new:'Nowo\u015bci \u2726',
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
  cookie_text:'Używamy wyłącznie <strong style="color:white">technicznie niezbędnych plików cookie</strong>. Więcej w naszej',cookie_accept:'AKCEPTUJĘ',cookie_privacy:'Polityce prywatności',
  activity_just:'Właśnie teraz · Aura Global',
  sec_process:'NASZ PROCES',sec_how:'Jak Działa Aura',sec_how_d:'Każdy produkt przechodzi przez nasz trzyetapowy proces inspekcji w hubie w Londynie, zanim dotrze do Ciebie.',
  step1_n:'Krok 1',step1_t:'Zaopatrzenie',step1_d:'Pozyskujemy oryginalne produkty bezpośrednio od autoryzowanych sprzedawców i marek z całego świata. Ponad 120 zweryfikowanych źródeł.',
  step2_n:'Krok 2',step2_t:'Inspekcja Hub',step2_d:'W naszym londyńskim hubie każdy produkt jest ręcznie sprawdzany — z dokumentacją wideo.',
  step3_n:'Krok 3',step3_t:'Wysyłka do Ciebie',step3_d:'Zapieczętowana, sprawdzona paczka — ubezpieczona i śledzona prosto pod Twoje drzwi. W zaledwie 2–4 dni.',
  stat_items:'Sprawdzone Produkty',stat_brands:'Top Marki',stat_sat:'Zadowolenie Klientów',stat_del:'Dni Dostawy',
  cat_elec_d:'Smartfony, Laptopy, Audio',cat_fash_d:'Buty, Torby, Biżuteria',cat_home_d:'Dyson, Smart Home, Pielęgnacja',cat_travel_d:'Bagaż, Akcesoria',cat_beauty:'Uroda & Pielęgnacja',cat_beauty_d:'Sephora, Rituals, Dyson Hair',cat_gaming:'Gaming & VR',cat_gaming_d:'PlayStation, Meta Quest, Steam',cat_discover:'ODKRYJ →',
  spot_top:'TOP KATEGORIA',spot_elec:'Elektronika & Tech',spot_all_elec:'Cała Elektronika →',spot_fash:'Moda & Lifestyle',spot_all_fash:'Cała Moda →',
  sec_trending_label:'🔥 TRENDY',sec_trending:'Teraz w Trendach',sec_all_new:'Wszystkie Nowości →',
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
  var loc=getLocale();
  if(loc==='en') return '\u00a3'+Math.round(n*EUR_GBP).toLocaleString('en-GB');
  return '\u20ac'+n.toLocaleString('de-DE');
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
  bar.innerHTML='<div style="max-width:1200px;margin:0 auto;padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between"><div style="flex:1;min-width:200px"><p style="font-size:13px;line-height:1.6;margin:0;color:rgba(255,255,255,0.8)">'+t('cookie_text')+' <a href="/privacy.html" style="color:#C5A059;text-decoration:underline">'+t('cookie_privacy')+'</a>.</p></div><div style="display:flex;gap:10px;flex-shrink:0"><button id="aura-cookie-ok" style="padding:10px 24px;background:#C5A059;color:white;border:none;font-size:12px;font-weight:700;letter-spacing:0.1em;cursor:pointer;font-family:Inter,system-ui,sans-serif">'+t('cookie_accept')+'</button></div></div>';
  document.body.appendChild(bar);
  document.getElementById('aura-cookie-ok').addEventListener('click',function(){
    localStorage.setItem('aura_cookie_consent','1');
    bar.style.transition='transform 0.3s ease';
    bar.style.transform='translateY(100%)';
    setTimeout(function(){bar.remove();},400);
  });
})();

})();
