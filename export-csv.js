/**
 * AURA GLOBAL — Export all products to CSV for bulk image editing
 * 
 * Format: id | brand | name | photo_1 (MAIN) | photo_2 | photo_3 | photo_4 | photo_5 | photo_6
 * 
 * photo_1 = титульное фото (главное изображение карточки товара)
 * photo_2..photo_6 = дополнительные фото (галерея на странице товара)
 * 
 * Вставляй прямые ссылки на изображения (URL заканчивается на .jpg/.png/.webp)
 */
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const pdJs = fs.readFileSync(path.join(__dirname, 'products-data.js'), 'utf8');

const defMatch = appJs.match(/var DEFAULT_PRODUCTS\s*=\s*\[([\s\S]*?)\];\s*var PRODUCTS_VERSION/);
let allProducts = [];

if (defMatch) {
  try { allProducts.push(...eval('[' + defMatch[1] + ']')); }
  catch(e) { console.error('Error parsing DEFAULT_PRODUCTS:', e.message); }
}

const extraMatch = pdJs.match(/window\.AURA_EXTRA_PRODUCTS\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (extraMatch) {
  try { allProducts.push(...JSON.parse(extraMatch[1])); }
  catch(e) { console.error('Error parsing EXTRA_PRODUCTS:', e.message); }
}

console.log(`Loaded ${allProducts.length} products`);

// Sort: brand → name
allProducts.sort((a, b) => {
  if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
  return a.name.localeCompare(b.name);
});

function esc(val) {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function isRealUrl(img) {
  return img && (img.startsWith('http://') || img.startsWith('https://'));
}

const SEP = ',';
const header = ['id','brand','name','status','photo_1 (ГЛАВНОЕ)','photo_2','photo_3','photo_4','photo_5','photo_6'];
const rows = [header.join(SEP)];

let needPhotos = 0;
let hasPhotos = 0;

for (const p of allProducts) {
  const hasReal = isRealUrl(p.img);
  const status = hasReal ? 'OK' : 'НУЖНО ФОТО';
  if (!hasReal) needPhotos++; else hasPhotos++;

  const gallery = p.gallery || [];
  
  const row = [
    esc(p.id),
    esc(p.brand),
    esc(p.name),
    status,
    hasReal ? esc(p.img) : '',           // photo_1 — fill if empty
    isRealUrl(gallery[0]) ? esc(gallery[0]) : '',
    isRealUrl(gallery[1]) ? esc(gallery[1]) : '',
    isRealUrl(gallery[2]) ? esc(gallery[2]) : '',
    isRealUrl(gallery[3]) ? esc(gallery[3]) : '',
    isRealUrl(gallery[4]) ? esc(gallery[4]) : '',
  ];
  rows.push(row.join(SEP));
}

const csv = rows.join('\n');
fs.writeFileSync(path.join(__dirname, 'products-images.csv'), '\ufeff' + csv, 'utf8');

console.log(`\n✓ Exported to products-images.csv`);
console.log(`  ${hasPhotos} товаров с фото (status: OK)`);
console.log(`  ${needPhotos} товаров БЕЗ фото (status: НУЖНО ФОТО)`);
console.log(`\n  Открой CSV → заполни photo_1 (главное) + photo_2..6 (галерея)`);
console.log(`  Потом: node import-images.js`);
