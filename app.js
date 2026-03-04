/* ═══════════════════════════════════════════════════════
   AURA GLOBAL MERCHANTS — Shared Application Module
   All data, auth, cart, orders managed via localStorage
   ═══════════════════════════════════════════════════════ */
(function(){
'use strict';
var ADMIN_EMAIL = 'ethanwalker2318@gmail.com';
var ADMIN_PASS = 'AuraAdmin2026!';

/* ── Helpers ───────────────────────────────────── */
function ls(k,v){ if(v===undefined) { try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;} } try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ console.error('localStorage quota exceeded for key: '+k, e); if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('Speicher voll — Daten zu groß','error'); return false; } }
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
  {id:'p1', name:'iPhone 16 Pro Max',        brand:'Apple',   cat:'electronics', price:1299, oldPrice:1449, img:'📱', gallery:[], videoUrl:'', rating:4.8, reviews:342, desc:'Титановый корпус, 48 МП камера, A18 Pro чип. 6.9" Super Retina XDR.', stock:15, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p3', name:'Apple Watch Ultra 2',       brand:'Apple',   cat:'electronics', price:799,  oldPrice:899,  img:'⌚', gallery:[], videoUrl:'', rating:4.9, reviews:215, desc:'Титановый корпус 49мм, двухчастотный GPS, глубиномер.', stock:12, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p5', name:'MacBook Pro M3 14"',        brand:'Apple',   cat:'electronics', price:2499, oldPrice:2799, img:'💻', gallery:[], videoUrl:'', rating:4.9, reviews:1203,desc:'Чип M3 Pro, 18ГБ RAM, Liquid Retina XDR дисплей.', stock:6, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p12',name:'AirPods Pro 2',             brand:'Apple',   cat:'electronics', price:279,  oldPrice:299,  img:'🎵', gallery:[], videoUrl:'', rating:4.7, reviews:3200,desc:'Адаптивное шумоподавление, USB-C, персональный звук.', stock:52, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p17',name:'iPad Pro M4 13"',           brand:'Apple',   cat:'electronics', price:1399, oldPrice:1599, img:'📱', gallery:[], videoUrl:'', rating:4.9, reviews:560, desc:'Ultra Retina XDR OLED, M4 чип, Apple Pencil Pro.', stock:9, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── SAMSUNG ───
  {id:'p6', name:'Samsung Galaxy S24 Ultra',  brand:'Samsung', cat:'electronics', price:1199, oldPrice:1399, img:'📱', gallery:[], videoUrl:'', rating:4.7, reviews:678, desc:'Титановая рамка, 200 МП камера, S Pen, Galaxy AI.', stock:20, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p14',name:'Samsung Galaxy Watch 6',    brand:'Samsung', cat:'electronics', price:329,  oldPrice:399,  img:'⌚', gallery:[], videoUrl:'', rating:4.3, reviews:432, desc:'BioActive датчик, сапфировое стекло, Wear OS.', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p40',name:'Samsung Galaxy Buds3 Pro',  brand:'Samsung', cat:'electronics', price:249,  oldPrice:279,  img:'🎵', gallery:[], videoUrl:'', rating:4.5, reviews:520, desc:'Blade-дизайн, 2-Way динамик, 360 Audio, ANC.', stock:35, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── SONY ───
  {id:'p2', name:'Sony WH-1000XM5',          brand:'Sony',    cat:'electronics', price:349,  oldPrice:399,  img:'🎧', gallery:[], videoUrl:'', rating:4.7, reviews:891, desc:'Лучшие шумоподавляющие наушники с 30ч автономности.', stock:28, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p15',name:'Sony WF-1000XM5',           brand:'Sony',    cat:'electronics', price:299,  oldPrice:329,  img:'🎵', gallery:[], videoUrl:'', rating:4.6, reviews:780, desc:'Самые маленькие TWS с LDAC и Hi-Res Wireless.', stock:25, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p18',name:'PS5 Pro',                    brand:'Sony',    cat:'electronics', price:699,  oldPrice:0,    img:'🎮', gallery:[], videoUrl:'', rating:4.8, reviews:1100,desc:'Улучшенный GPU, 2ТБ SSD, 8K поддержка, Ray Tracing.', stock:7, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── BOSE ───
  {id:'p7', name:'Bose QuietComfort Ultra',   brand:'Bose',    cat:'electronics', price:379,  oldPrice:449,  img:'🎧', gallery:[], videoUrl:'', rating:4.5, reviews:445, desc:'Иммерсивный звук, CustomTune, до 24 ч работы.', stock:14, inspection:{authentic:true,functional:true,sealed:false}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p41',name:'Bose SoundLink Max',        brand:'Bose',    cat:'electronics', price:399,  oldPrice:0,    img:'🔊', gallery:[], videoUrl:'', rating:4.6, reviews:230, desc:'Портативная колонка, 20ч батарея, IP67, Stereo Pair.', stock:18, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── DYSON ───
  {id:'p4', name:'Dyson V15 Detect',          brand:'Dyson',   cat:'home',        price:649,  oldPrice:799,  img:'🔋', gallery:[], videoUrl:'', rating:4.6, reviews:567, desc:'Лазерное обнаружение пыли, HEPA фильтрация, 60 мин работы.', stock:8, inspection:{authentic:true,functional:true,sealed:false}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p11',name:'Dyson Airwrap Complete',    brand:'Dyson',   cat:'home',        price:549,  oldPrice:649,  img:'🌀', gallery:[], videoUrl:'', rating:4.6, reviews:1890,desc:'Мультистайлер с эффектом Коанда для всех типов волос.', stock:19, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p16',name:'Dyson Supersonic',           brand:'Dyson',   cat:'home',        price:449,  oldPrice:499,  img:'💨', gallery:[], videoUrl:'', rating:4.5, reviews:2300,desc:'Фен с цифровым мотором V9, интеллектуальный нагрев.', stock:17, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NIKE ───
  {id:'p8', name:'Nike Air Max 90',           brand:'Nike',    cat:'fashion',     price:149,  oldPrice:179,  img:'👟', gallery:[], videoUrl:'', rating:4.4, reviews:2100,desc:'Культовые кроссовки с видимой Air подушкой.', stock:45, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p13',name:'Nike Air Jordan 1 Retro',   brand:'Nike',    cat:'fashion',     price:189,  oldPrice:220,  img:'👟', gallery:[], videoUrl:'', rating:4.6, reviews:1560,desc:'Классические высокие кроссовки OG colorway.', stock:22, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p42',name:'Nike Dunk Low Panda',       brand:'Nike',    cat:'fashion',     price:119,  oldPrice:139,  img:'👟', gallery:[], videoUrl:'', rating:4.5, reviews:4200,desc:'Чёрно-белая классика, кожаный верх, Foam подошва.', stock:60, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ADIDAS ───
  {id:'p21',name:'Adidas Ultraboost Light',   brand:'Adidas',  cat:'fashion',     price:179,  oldPrice:199,  img:'👟', gallery:[], videoUrl:'', rating:4.5, reviews:1850,desc:'Lightstrike + Boost подошва, Primeknit верх, Continental™ резина.', stock:38, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p22',name:'Adidas Samba OG',           brand:'Adidas',  cat:'fashion',     price:99,   oldPrice:120,  img:'👟', gallery:[], videoUrl:'', rating:4.7, reviews:3400,desc:'Культовая классика 1950-х, кожаный верх, гамшевый T-toe.', stock:55, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NEW BALANCE ───
  {id:'p23',name:'New Balance 2002R',          brand:'New Balance',cat:'fashion',  price:159,  oldPrice:179,  img:'👟', gallery:[], videoUrl:'', rating:4.6, reviews:1200,desc:'N-ERGY амортизация, замша + mesh, vintage-дизайн.', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p24',name:'New Balance 550',            brand:'New Balance',cat:'fashion',  price:129,  oldPrice:0,    img:'👟', gallery:[], videoUrl:'', rating:4.4, reviews:2800,desc:'Ретро-баскетбольный силуэт, кожаный верх, slim профиль.', stock:42, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── GUCCI ───
  {id:'p9', name:'Gucci GG Marmont',          brand:'Gucci',   cat:'fashion',     price:1890, oldPrice:2100, img:'👜', gallery:[], videoUrl:'', rating:4.8, reviews:89,  desc:'Стёганая кожа мателассе с двойной G фурнитурой.', stock:3, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p43',name:'Gucci Ace Sneakers',        brand:'Gucci',   cat:'fashion',     price:690,  oldPrice:790,  img:'👟', gallery:[], videoUrl:'', rating:4.6, reviews:310, desc:'Белая кожа, вышивка-пчела, зелёно-красная Web полоса.', stock:8, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── HERMÈS ───
  {id:'p10',name:'Hermès Birkin 25',          brand:'Hermès',  cat:'fashion',     price:8900, oldPrice:0,    img:'👜', gallery:[], videoUrl:'', rating:5.0, reviews:12,  desc:'Togo кожа, палладиевая фурнитура. Эксклюзив.', stock:1, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── PRADA ───
  {id:'p25',name:'Prada Re-Nylon Backpack',   brand:'Prada',   cat:'fashion',     price:1490, oldPrice:0,    img:'🎒', gallery:[], videoUrl:'', rating:4.7, reviews:145, desc:'Переработанный нейлон ECONYL®, треугольное лого, Saffiano отделка.', stock:5, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p44',name:'Prada Symbole Sunglasses',  brand:'Prada',   cat:'fashion',     price:380,  oldPrice:420,  img:'🕶️', gallery:[], videoUrl:'', rating:4.5, reviews:410, desc:'Геометрическая оправа, поляризованные линзы, металлический треугольник.', stock:15, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── DIOR ───
  {id:'p26',name:'Dior B23 High-Top',         brand:'Dior',    cat:'fashion',     price:1090, oldPrice:0,    img:'👟', gallery:[], videoUrl:'', rating:4.8, reviews:98,  desc:'Oblique-холст, прозрачная подошва, ручная сборка в Италии.', stock:4, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p45',name:'Dior Sauvage EDP 100ml',    brand:'Dior',    cat:'fashion',     price:119,  oldPrice:135,  img:'✨', gallery:[], videoUrl:'', rating:4.7, reviews:5800,desc:'Бергамот, Ambroxan, Vanille. Бестселлер мужской парфюмерии.', stock:70, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── BALENCIAGA ───
  {id:'p27',name:'Balenciaga Triple S',       brand:'Balenciaga',cat:'fashion',   price:950,  oldPrice:1050, img:'👟', gallery:[], videoUrl:'', rating:4.4, reviews:670, desc:'Тройная подошва, distressed-отделка, oversized silhouette.', stock:7, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p46',name:'Balenciaga Hourglass Bag',  brand:'Balenciaga',cat:'fashion',   price:2190, oldPrice:0,    img:'👜', gallery:[], videoUrl:'', rating:4.6, reviews:120, desc:'Curved frame, зернистая кожа, антикварная латунная фурнитура.', stock:3, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── CHANEL ───
  {id:'p28',name:'Chanel Classic Flap Medium',brand:'Chanel',  cat:'fashion',     price:9350, oldPrice:0,    img:'👜', gallery:[], videoUrl:'', rating:5.0, reviews:34,  desc:'Lambskin, цепочка с кожаным переплетом, CC замок. Вечная классика.', stock:1, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p47',name:'Chanel N°5 EDP 100ml',     brand:'Chanel',  cat:'fashion',     price:159,  oldPrice:0,    img:'✨', gallery:[], videoUrl:'', rating:4.9, reviews:12400,desc:'Альдегиды, жасмин, сандал. Самый знаменитый аромат в мире.', stock:45, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── LOUIS VUITTON ───
  {id:'p20',name:'Louis Vuitton Keepall 45',  brand:'Louis Vuitton', cat:'travel',price:1960, oldPrice:0,    img:'💼', gallery:[], videoUrl:'', rating:4.8, reviews:67,  desc:'Монограм Canvas дорожная сумка, знаковый силуэт.', stock:2, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p48',name:'Louis Vuitton Neverfull MM',brand:'Louis Vuitton', cat:'fashion',price:1980,oldPrice:0,    img:'👜', gallery:[], videoUrl:'', rating:4.8, reviews:230, desc:'Monogram Canvas, кожаные ручки, съёмный pochette.', stock:4, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ROLEX ───
  {id:'p29',name:'Rolex Submariner Date',     brand:'Rolex',   cat:'fashion',     price:13500,oldPrice:0,    img:'⌚', gallery:[], videoUrl:'', rating:5.0, reviews:28,  desc:'Oystersteel 41мм, Cerachrom безель, 300м водозащита, калибр 3235.', stock:1, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p49',name:'Rolex Datejust 41',         brand:'Rolex',   cat:'fashion',     price:10900,oldPrice:0,    img:'⌚', gallery:[], videoUrl:'', rating:5.0, reviews:19,  desc:'Jubilee браслет, fluted безель, голубой циферблат.', stock:1, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── OMEGA ───
  {id:'p30',name:'Omega Speedmaster Moonwatch',brand:'Omega',  cat:'fashion',     price:6900, oldPrice:0,    img:'⌚', gallery:[], videoUrl:'', rating:4.9, reviews:156, desc:'Hesalite стекло, калибр 3861, наследие космоса с 1957.', stock:2, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p50',name:'Omega Seamaster 300M',      brand:'Omega',   cat:'fashion',     price:5400, oldPrice:0,    img:'⌚', gallery:[], videoUrl:'', rating:4.8, reviews:220, desc:'Керамический безель, Master Chronometer, 300м водозащита.', stock:3, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RIMOWA ───
  {id:'p19',name:'Rimowa Original Cabin',     brand:'Rimowa',  cat:'travel',      price:1100, oldPrice:0,    img:'🧳', gallery:[], videoUrl:'', rating:4.7, reviews:200, desc:'Алюминиевый чемодан ручной клади, TSA замки.', stock:5, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p51',name:'Rimowa Essential Check-In L',brand:'Rimowa', cat:'travel',      price:750,  oldPrice:0,    img:'🧳', gallery:[], videoUrl:'', rating:4.5, reviews:340, desc:'Поликарбонат, мультиколёсная система, Flex-Divider.', stock:10, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── LOGITECH ───
  {id:'p31',name:'Logitech MX Master 3S',     brand:'Logitech',cat:'electronics', price:99,   oldPrice:119,  img:'🖱️', gallery:[], videoUrl:'', rating:4.7, reviews:4500,desc:'Тихие клики, 8K DPI, MagSpeed колесо, мультидевайс.', stock:80, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p52',name:'Logitech MX Keys S',        brand:'Logitech',cat:'electronics', price:109,  oldPrice:129,  img:'⌨️', gallery:[], videoUrl:'', rating:4.6, reviews:2100,desc:'Smart подсветка, Perfect Stroke клавиши, multi-OS.', stock:45, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── GOOGLE ───
  {id:'p32',name:'Google Pixel 9 Pro',        brand:'Google',  cat:'electronics', price:1099, oldPrice:1179, img:'📱', gallery:[], videoUrl:'', rating:4.6, reviews:890, desc:'Tensor G4, Gemini AI, 50 МП тройная камера, 7 лет обновлений.', stock:15, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NOTHING ───
  {id:'p33',name:'Nothing Phone (2a)',        brand:'Nothing',  cat:'electronics', price:349,  oldPrice:399,  img:'📱', gallery:[], videoUrl:'', rating:4.4, reviews:1200,desc:'Glyph Interface, Dimensity 7200 Pro, 50 МП, прозрачный дизайн.', stock:22, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ONEPLUS ───
  {id:'p34',name:'OnePlus 12',                brand:'OnePlus', cat:'electronics', price:799,  oldPrice:899,  img:'📱', gallery:[], videoUrl:'', rating:4.6, reviews:1560,desc:'Snapdragon 8 Gen 3, Hasselblad камера, 100Вт SUPERVOOC.', stock:18, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── DELL ───
  {id:'p35',name:'Dell XPS 15',               brand:'Dell',    cat:'electronics', price:1799, oldPrice:1999, img:'💻', gallery:[], videoUrl:'', rating:4.5, reviews:780, desc:'Intel Core Ultra, 15.6" 3.5K OLED, 32ГБ RAM, Infinity Edge.', stock:5, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── GOPRO ───
  {id:'p36',name:'GoPro HERO13 Black',        brand:'GoPro',   cat:'electronics', price:399,  oldPrice:449,  img:'📷', gallery:[], videoUrl:'', rating:4.5, reviews:2200,desc:'5.3K60, HyperSmooth 7.0, GPS, 10m водозащита, магнитное крепление.', stock:25, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── META ───
  {id:'p37',name:'Meta Quest 3',              brand:'Meta',    cat:'electronics', price:549,  oldPrice:0,    img:'🥽', gallery:[], videoUrl:'', rating:4.4, reviews:3400,desc:'Mixed reality, Snapdragon XR2 Gen 2, 4K+ дисплей, passthrough.', stock:20, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RAY-BAN ───
  {id:'p38',name:'Ray-Ban Meta Wayfarer',     brand:'Ray-Ban', cat:'fashion',     price:329,  oldPrice:0,    img:'🕶️', gallery:[], videoUrl:'', rating:4.3, reviews:1800,desc:'Камера 12 МП, live streaming, Meta AI, open-ear аудио.', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  {id:'p53',name:'Ray-Ban Aviator Classic',   brand:'Ray-Ban', cat:'fashion',     price:159,  oldPrice:179,  img:'🕶️', gallery:[], videoUrl:'', rating:4.7, reviews:8900,desc:'Золотая оправа, зелёные G-15 линзы, с 1937 года.', stock:50, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── UNDER ARMOUR ───
  {id:'p54',name:'Under Armour HOVR Phantom 3',brand:'Under Armour',cat:'fashion',price:149, oldPrice:169,  img:'👟', gallery:[], videoUrl:'', rating:4.4, reviews:780, desc:'HOVR Zero Gravity, UA Flow подошва, MapMyRun датчик.', stock:28, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── PUMA ───
  {id:'p55',name:'Puma Suede Classic XXI',    brand:'Puma',    cat:'fashion',     price:79,   oldPrice:95,   img:'👟', gallery:[], videoUrl:'', rating:4.3, reviews:3200,desc:'Замшевый верх, формованная подошва, культовый силуэт с 1968.', stock:65, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── NORTH FACE ───
  {id:'p56',name:'The North Face Nuptse 700', brand:'North Face',cat:'fashion',   price:299,  oldPrice:350,  img:'🧥', gallery:[], videoUrl:'', rating:4.7, reviews:4100,desc:'700-fill гусиный пух, DWR покрытие, знаковый 1996 Retro дизайн.', stock:20, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ARC\'TERYX ───
  {id:'p57',name:'Arc\'teryx Beta LT Jacket', brand:'Arc\'teryx',cat:'fashion',   price:550,  oldPrice:0,    img:'🧥', gallery:[], videoUrl:'', rating:4.8, reviews:890, desc:'GORE-TEX, 390g, минималистичный alpine дизайн, WaterTight™ молнии.', stock:10, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── PATAGONIA ───
  {id:'p58',name:'Patagonia Better Sweater',  brand:'Patagonia',cat:'fashion',    price:139,  oldPrice:0,    img:'🧥', gallery:[], videoUrl:'', rating:4.6, reviews:5600,desc:'100% переработанный полиэстер, Fair Trade, тёплый флис.', stock:35, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── LULULEMON ───
  {id:'p59',name:'Lululemon Align Leggings',  brand:'Lululemon',cat:'fashion',    price:98,   oldPrice:0,    img:'👖', gallery:[], videoUrl:'', rating:4.8, reviews:11200,desc:'Nulu™ ткань, ультралёгкие, высокая посадка 25", как вторая кожа.', stock:50, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── COACH ───
  {id:'p60',name:'Coach Tabby Shoulder Bag',  brand:'Coach',   cat:'fashion',     price:450,  oldPrice:495,  img:'👜', gallery:[], videoUrl:'', rating:4.5, reviews:1400,desc:'Refined Calf кожа, кованая подпись C, ретро силуэт.', stock:12, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── PANDORA ───
  {id:'p61',name:'Pandora Moments Bracelet',  brand:'Pandora', cat:'fashion',     price:69,   oldPrice:79,   img:'💎', gallery:[], videoUrl:'', rating:4.6, reviews:8200,desc:'Sterling Silver, barrel-застёжка, совместимо со всеми шармами.', stock:100, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── ECOVACS ───
  {id:'p62',name:'Ecovacs Deebot X2 Omni',   brand:'Ecovacs', cat:'home',        price:899,  oldPrice:1099, img:'🤖', gallery:[], videoUrl:'', rating:4.4, reviews:1300,desc:'LiDAR + камера, 8000Pa, автоочистка, горячая сушка.', stock:11, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── HEXCLAD ───
  {id:'p63',name:'HexClad 12-Piece Pan Set',  brand:'HexClad', cat:'home',        price:599,  oldPrice:799,  img:'🍳', gallery:[], videoUrl:'', rating:4.6, reviews:4500,desc:'Tri-Ply нерж. сталь + антипригарное покрытие, патент Hex дизайн.', stock:8, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RING ───
  {id:'p64',name:'Ring Video Doorbell Pro 2', brand:'Ring',    cat:'home',        price:249,  oldPrice:279,  img:'🔔', gallery:[], videoUrl:'', rating:4.5, reviews:6700,desc:'1536p HD+, 3D Motion, Bird\'s Eye Zone, Alexa integration.', stock:40, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── OURA ───
  {id:'p65',name:'Oura Ring Generation 3',    brand:'Oura',    cat:'electronics', price:349,  oldPrice:0,    img:'💍', gallery:[], videoUrl:'', rating:4.4, reviews:2400,desc:'Sleep tracking, SpO2, температура тела, титановый корпус.', stock:25, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── TESLA ───
  {id:'p66',name:'Tesla Cybertruck 1:18 Diecast',brand:'Tesla',cat:'home',       price:199,  oldPrice:0,    img:'🚗', gallery:[], videoUrl:'', rating:4.3, reviews:560, desc:'Officially licensed, stainless steel finish, подарочный бокс.', stock:15, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── TREZOR ───
  {id:'p67',name:'Trezor Safe 5',             brand:'Trezor',  cat:'electronics', price:169,  oldPrice:0,    img:'🔐', gallery:[], videoUrl:'', rating:4.7, reviews:3100,desc:'Haptic touchscreen, Secure Element, 8000+ токенов, open-source.', stock:30, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── XREAL ───
  {id:'p68',name:'XREAL Air 2 Pro',           brand:'XREAL',   cat:'electronics', price:449,  oldPrice:0,    img:'🥽', gallery:[], videoUrl:'', rating:4.3, reviews:780, desc:'AR очки, 130" виртуальный экран, 3 уровня затемнения, 72g.', stock:12, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── GOVEE ───
  {id:'p69',name:'Govee Glide Hexa Pro',      brand:'Govee',   cat:'home',        price:199,  oldPrice:229,  img:'💡', gallery:[], videoUrl:'', rating:4.5, reviews:3400,desc:'10 RGBIC панелей, DreamView, Music Sync, WiFi + Bluetooth.', stock:22, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0},
  // ─── RITUALS ───
  {id:'p70',name:'Rituals Sakura Body Cream', brand:'Rituals', cat:'home',        price:23,   oldPrice:0,    img:'🌸', gallery:[], videoUrl:'', rating:4.6, reviews:7800,desc:'Рисовое молоко + цветки вишни, 220мл, увлажнение 24ч.', stock:90, inspection:{authentic:true,functional:true,sealed:true}, _sourcingLink:'',_costPrice:0,_logisticsFee:0}
];

function getProducts(){
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
  if(users.find(function(u){return u.email===email;})){ return {ok:false, error:'Email уже зарегистрирован'}; }
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
    return {ok:false, error:'Неверный пароль'};
  }
  var users = getUsers();
  var found = users.find(function(u){return u.email===email;});
  if(!found) return {ok:false, error:'Пользователь не найден'};
  if(found.password!==password) return {ok:false, error:'Неверный пароль'};
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
function getOrders(){ return ls('aura_orders') || []; }
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
function imgHtml(src, sizeClass){
  if(isImgUrl(src)) return '<img src="'+src+'" alt="" class="w-full h-full object-cover">';
  var sz=sizeClass==='text-2xl'?'w-5 h-5':sizeClass==='text-3xl'?'w-8 h-8':'w-12 h-12';
  return '<div class="w-full h-full flex flex-col items-center justify-center">'
    +'<svg class="'+sz+' text-navy/15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>'
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
    +'<div class="relative overflow-hidden rounded-t-xl">'+heartBtn+'<div class="prod-img aspect-square bg-gray-50 flex items-center justify-center transition-transform duration-500">'+imgHtml(p.img)+'</div>'
    +'<span class="absolute top-3 left-3 px-2 py-0.5 '+badge+' text-white text-[9px] font-bold rounded">'+badgeT+'</span>'+disc
    +'<div class="quick-act absolute bottom-3 left-3 right-3"><span class="flex items-center justify-center gap-2 w-full py-2.5 bg-navy text-white text-xs font-semibold rounded-lg">'+t('view_prod')+'</span></div></div>'
    +'<div class="p-4"><p class="text-gold text-[10px] font-semibold tracking-[0.15em] uppercase">'+p.brand+'</p><h3 class="text-sm font-medium mt-1 leading-snug truncate">'+p.name+'</h3>'
    +stars+sold
    +'<div class="flex items-baseline mt-2"><span class="text-base font-bold">'+formatPrice(p.price)+'</span>'+old+'</div>'
    +trustLine
    +'</div></a>';
  }
  return '<div class="product-card group bg-white border border-gray-100 hover:border-navy/20 transition-all rounded-xl '+cls+'">'
  +'<a href="/product.html?id='+p.id+'" class="block"><div class="relative overflow-hidden rounded-t-xl">'+heartBtn+'<div class="prod-img aspect-square bg-gray-50 flex items-center justify-center transition-transform duration-500">'+imgHtml(p.img)+'</div>'
  +'<span class="absolute top-3 left-3 px-2 py-0.5 '+badge+' text-white text-[9px] font-bold rounded">'+badgeT+'</span>'+disc
  +'<div class="quick-act absolute bottom-3 left-3 right-3 flex gap-2"><span class="flex-1 flex items-center justify-center py-2.5 bg-navy text-white text-xs font-semibold rounded-lg">'+t('view_prod')+'</span></div></div></a>'
  +'<div class="p-4"><a href="/product.html?id='+p.id+'">'
  +'<p class="text-gold text-[10px] font-semibold tracking-[0.15em] uppercase">'+p.brand+'</p>'
  +'<h3 class="text-sm font-medium mt-1 leading-snug truncate hover:text-gold transition-colors">'+p.name+'</h3>'
  +stars+sold
  +'<div class="flex items-baseline mt-2"><span class="text-base font-bold">'+formatPrice(p.price)+'</span>'+old+'</div></a>'
  +trustLine
  +'<button onclick="event.preventDefault();Aura.addToCart(\''+p.id+'\');Aura.showToast(Aura.t(\'added_cart\'));if(typeof toggleCart===\'function\')toggleCart()" class="w-full mt-3 py-2.5 bg-navy hover:bg-navy-light text-white text-xs font-bold tracking-wider transition-colors rounded-lg flex items-center justify-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>'+t('add_cart')+'</button>'
  +'</div></div>';
}

/* ── LOCALE / i18n ─────────────────────────────── */
var EUR_USD = 1.08;
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
},
en:{
  locale_label:'EN / $',
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
}
};

function getLocale(){ return ls(LOCALE_KEY) || 'de'; }
function setLocale(loc){
  ls(LOCALE_KEY, loc);
  applyLocale();
  document.querySelectorAll('.aura-locale-dd').forEach(function(el){ el.classList.add('hidden'); });
}
function t(key){ var d=I18N[getLocale()]; return (d&&d[key])||(I18N.de[key])||key; }

function formatPrice(n){
  var loc=getLocale();
  if(loc==='en'){ return '$'+Math.round(n*EUR_USD).toLocaleString('en-US'); }
  return '€'+n.toLocaleString('de-DE');
}

function applyLocale(){
  var loc=getLocale(), d=I18N[loc]; if(!d) return;
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k=el.getAttribute('data-i18n'); if(d[k]) el.textContent=d[k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    var k=el.getAttribute('data-i18n-ph'); if(d[k]) el.placeholder=d[k];
  });
  document.querySelectorAll('[data-price]').forEach(function(el){
    el.textContent=formatPrice(parseFloat(el.getAttribute('data-price')));
  });
  document.querySelectorAll('[data-locale-label]').forEach(function(el){
    el.textContent=d.locale_label||'DE / €';
  });
  document.documentElement.lang=loc==='de'?'de':'en';
  fire('locale-change',{locale:loc});
}

function injectLocalePickers(){
  var loc=getLocale();
  document.querySelectorAll('[data-locale-picker]').forEach(function(c){
    c.innerHTML='<div class="relative"><button onclick="this.nextElementSibling.classList.toggle(\'hidden\')" class="flex items-center gap-1.5 px-2 h-10 text-sm text-navy/60 hover:text-navy transition-colors"><span data-locale-label>'+(loc==='de'?'DE / €':'EN / $')+'</span><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button><div class="aura-locale-dd hidden absolute right-0 top-full mt-1 bg-navy-dark border border-white/10 shadow-2xl z-[60] min-w-[180px]"><button onclick="Aura.setLocale(\'de\')" class="flex items-center gap-3 w-full px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"><span class="text-[10px] font-bold text-gold tracking-wider">DE</span>Deutsch / EUR</button><button onclick="Aura.setLocale(\'en\')" class="flex items-center gap-3 w-full px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"><span class="text-[10px] font-bold text-gold tracking-wider">US</span>English / USD</button></div></div>';
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
  if(!s){showToast('Bitte melden Sie sich an','error');return false;}
  var ids=getWishlist();
  var idx=ids.indexOf(pid);
  if(idx>=0){ids.splice(idx,1);showToast('Von Wunschliste entfernt','success');}
  else{ids.push(pid);showToast('Zur Wunschliste hinzugefügt','success');}
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
  var events=[
    {type:'check',icon:'🔍',templates:['%NAME% aus %CITY% — Produkt wird geprüft','Qualitätsprüfung für %NAME% (%CITY%) gestartet']},
    {type:'buy',icon:'🛒',templates:['%NAME% aus %CITY% hat gerade bestellt','Neue Bestellung von %NAME% (%CITY%)']},
    {type:'ship',icon:'📦',templates:['Paket für %NAME% nach %CITY% versandt','Sendung an %NAME% (%CITY%) unterwegs']},
    {type:'partner',icon:'🤝',templates:['Neuer Partner-Import aus %SOURCE%','%SOURCE% — neue Charge eingetroffen']}
  ];
  var names=['Lena M.','Max K.','Sophie T.','Jonas B.','Anna F.','Felix R.','Luisa W.','Tim S.','Marie D.','Paul H.','Clara Z.','Leon G.','Emma B.','Noah P.','Mia L.'];
  var cities=['Berlin','München','Hamburg','Köln','Frankfurt','Wien','Zürich','Stuttgart','Düsseldorf','Leipzig','Hannover','Dresden','Nürnberg','Bremen','Dortmund'];
  var sources=['Zalando Liquidation','Amazon Warehouse','Macy\'s Überschuss','John Lewis Returns','Target Overstock','Walmart Clearance'];
  function rand(arr){return arr[Math.floor(Math.random()*arr.length)];}
  function showNotification(){
    var existing=document.getElementById('aura-activity-widget');
    if(existing)existing.remove();
    var ev=rand(events);
    var tpl=rand(ev.templates);
    var msg=tpl.replace('%NAME%',rand(names)).replace('%CITY%',rand(cities)).replace('%SOURCE%',rand(sources));
    var el=document.createElement('div');
    el.id='aura-activity-widget';
    el.style.cssText='position:fixed;bottom:20px;left:20px;z-index:9998;max-width:340px;background:#001A3D;color:#fff;border:1px solid rgba(197,160,89,0.3);box-shadow:0 8px 32px rgba(0,0,0,0.3);padding:12px 16px;display:flex;align-items:flex-start;gap:10px;font-family:Inter,system-ui,sans-serif;transform:translateY(120%);transition:transform .4s ease;border-radius:0;';
    el.innerHTML='<span style="font-size:20px;line-height:1;flex-shrink:0">'+ev.icon+'</span><div style="flex:1;min-width:0"><p style="font-size:12px;line-height:1.4;color:rgba(255,255,255,0.8);margin:0">'+msg+'</p><p style="font-size:10px;color:rgba(255,255,255,0.3);margin:4px 0 0">Gerade eben · Aura Global</p></div><button onclick="this.parentElement.style.transform=\'translateY(120%)\';setTimeout(function(){var w=document.getElementById(\'aura-activity-widget\');if(w)w.remove();},400)" style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:16px;line-height:1;padding:0;flex-shrink:0">&times;</button>';
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
    btn.textContent='Aura Prime 💎';
    btn.onmouseenter=function(){btn.style.transform='scale(1.05)';btn.style.boxShadow='0 6px 24px rgba(197,160,89,0.5)';};
    btn.onmouseleave=function(){btn.style.transform='scale(1)';btn.style.boxShadow='0 4px 20px rgba(197,160,89,0.4)';};
    document.body.appendChild(btn);
  }
  function showPrimeModal(){
    if(document.getElementById('aura-prime-modal'))return;
    var overlay=document.createElement('div');
    overlay.id='aura-prime-modal';
    overlay.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)" onclick="document.getElementById(\'aura-prime-modal\').remove()"></div><div style="position:relative;max-width:440px;width:100%;background:#001A3D;border:1px solid rgba(197,160,89,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);padding:0;font-family:Inter,system-ui,sans-serif"><div style="padding:32px 32px 0;text-align:center"><div style="width:56px;height:56px;margin:0 auto 16px;background:rgba(197,160,89,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="font-size:24px">💎</span></div><h3 style="font-family:Playfair Display,Georgia,serif;font-size:22px;font-weight:700;color:white;margin:0 0 8px">Werde Aura Prime Mitglied</h3><p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 24px;line-height:1.5">Erhalte <strong style="color:#C5A059">exklusive Vorab-Deals</strong>, Early Access zu neuen Produkten und kostenfreien Express-Versand.</p></div><form onsubmit="event.preventDefault();var email=this.querySelector(\'input\').value;var leads=JSON.parse(localStorage.getItem(\'aura_prime_leads\')||\'[]\');leads.push({email:email,date:new Date().toISOString()});localStorage.setItem(\'aura_prime_leads\',JSON.stringify(leads));if(typeof AuraEmail!==\'undefined\')AuraEmail.sendPrimeWelcome(email);this.innerHTML=\'<div style=padding:24px;text-align:center><p style=color:#C5A059;font-weight:700;font-size:14px>Willkommen bei Aura Prime!</p><p style=color:rgba(255,255,255,0.4);font-size:12px;margin-top:8px>Wir melden uns in K&uuml;rze.</p></div>\';sessionStorage.setItem(\'aura_prime_joined\',\'1\')" style="padding:0 32px 32px"><div style="display:flex;gap:8px"><input type="email" required placeholder="E-Mail Adresse" style="flex:1;height:44px;padding:0 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;font-size:13px;outline:none;font-family:Inter,system-ui,sans-serif"><button type="submit" style="height:44px;padding:0 20px;background:#C5A059;color:#001A3D;border:none;font-size:12px;font-weight:700;letter-spacing:0.08em;cursor:pointer;font-family:Inter,system-ui,sans-serif;white-space:nowrap">JETZT BEITRETEN</button></div><p style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:12px;text-align:center">Kein Spam. Jederzeit abmeldbar. <a href=/privacy.html style=color:rgba(197,160,89,0.5);text-decoration:underline>Datenschutz</a></p></form><button onclick="document.getElementById(\'aura-prime-modal\').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:20px;line-height:1">&times;</button></div>';
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

/* ── 3. Price Explanation Modal ("Ehrliche Preise") ── */
(function initPriceModal(){
  window.showPriceModal=function(){
    if(document.getElementById('aura-price-modal'))return;
    var overlay=document.createElement('div');
    overlay.id='aura-price-modal';
    overlay.style.cssText='position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML='<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6)" onclick="document.getElementById(\'aura-price-modal\').remove()"></div><div style="position:relative;max-width:480px;width:100%;background:white;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:Inter,system-ui,sans-serif;padding:0"><div style="padding:28px 28px 0;text-align:center"><div style="width:48px;height:48px;margin:0 auto 14px;background:rgba(0,26,61,0.05);border-radius:50%;display:flex;align-items:center;justify-content:center"><span style="font-size:22px">💡</span></div><h3 style="font-family:Playfair Display,Georgia,serif;font-size:20px;font-weight:700;color:#001A3D;margin:0 0 6px">Ehrliche Preise, klare Logik</h3><p style="font-size:12px;color:#6b7280;margin:0 0 24px;line-height:1.5">Warum wir günstiger sind — ohne Kompromisse bei der Qualität.</p></div><div style="padding:0 28px 28px"><div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:#6b7280">Einzelhandel (UVP)</span><span style="font-weight:700;color:#001A3D">100%</span></div><div style="height:14px;background:#f3f4f6;overflow:hidden"><div style="height:100%;width:100%;background:linear-gradient(90deg,#001A3D,#002B5C)"></div></div></div><div style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span style="color:#C5A059;font-weight:600">Aura Direct</span><span style="font-weight:700;color:#C5A059">75%</span></div><div style="height:14px;background:#f3f4f6;overflow:hidden"><div style="height:100%;width:75%;background:linear-gradient(90deg,#C5A059,#D4B476)"></div></div></div><div style="background:#f9fafb;border:1px solid #f3f4f6;padding:14px;margin-bottom:20px"><p style="font-size:11px;color:#6b7280;line-height:1.6;margin:0">Wir kaufen Retouren und Liquidationsware direkt von Großhändlern — ohne Zwischenhändler, ohne Ladenmiete, ohne Werbemillionen. Das Ergebnis: <strong style="color:#001A3D">Sie sparen bis zu 40%</strong> gegenüber dem Einzelhandelspreis.</p></div><button onclick="document.getElementById(\'aura-price-modal\').remove()" style="width:100%;height:44px;background:#001A3D;color:white;border:none;font-size:13px;font-weight:700;letter-spacing:0.08em;cursor:pointer;font-family:Inter,system-ui,sans-serif">VERSTANDEN</button></div><button onclick="document.getElementById(\'aura-price-modal\').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:#9ca3af;cursor:pointer;font-size:20px;line-height:1">&times;</button></div>';
    document.body.appendChild(overlay);
  };
})();

/* ── 4. Cookie Consent Banner ── */
(function initCookieBanner(){
  if(localStorage.getItem('aura_cookie_consent')) return;
  var bar=document.createElement('div');
  bar.id='aura-cookie-bar';
  bar.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#001A3D;color:white;box-shadow:0 -4px 20px rgba(0,0,0,0.3);font-family:Inter,system-ui,sans-serif;';
  bar.innerHTML='<div style="max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between"><div style="flex:1;min-width:280px"><p style="font-size:13px;line-height:1.6;margin:0;color:rgba(255,255,255,0.8)">Wir verwenden ausschließlich <strong style="color:white">technisch notwendige Cookies</strong>, die für den Betrieb unserer Website erforderlich sind. Mehr erfahren Sie in unserer <a href="/privacy.html" style="color:#C5A059;text-decoration:underline">Datenschutzerklärung</a>.</p></div><div style="display:flex;gap:10px;flex-shrink:0"><button id="aura-cookie-ok" style="padding:10px 28px;background:#C5A059;color:white;border:none;font-size:12px;font-weight:700;letter-spacing:0.1em;cursor:pointer;font-family:Inter,system-ui,sans-serif">AKZEPTIEREN</button></div></div>';
  document.body.appendChild(bar);
  document.getElementById('aura-cookie-ok').addEventListener('click',function(){
    localStorage.setItem('aura_cookie_consent','1');
    bar.style.transition='transform 0.3s ease';
    bar.style.transform='translateY(100%)';
    setTimeout(function(){bar.remove();},400);
  });
})();

})();
