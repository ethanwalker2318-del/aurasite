/**
 * AURA GLOBAL — Export all products to CSV for bulk image editing
 * Output: products-images.csv (id, brand, name, img, gallery_1..gallery_5)
 */
const fs = require('fs');
const path = require('path');

// Load products from both sources
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const pdJs = fs.readFileSync(path.join(__dirname, 'products-data.js'), 'utf8');

// Parse DEFAULT_PRODUCTS from app.js
const defMatch = appJs.match(/var DEFAULT_PRODUCTS\s*=\s*\[([\s\S]*?)\];\s*var PRODUCTS_VERSION/);
let allProducts = [];

if (defMatch) {
  try {
    const arr = eval('[' + defMatch[1] + ']');
    allProducts.push(...arr);
  } catch(e) {
    console.error('Error parsing DEFAULT_PRODUCTS:', e.message);
  }
}

// Parse AURA_EXTRA_PRODUCTS from products-data.js
const extraMatch = pdJs.match(/window\.AURA_EXTRA_PRODUCTS\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (extraMatch) {
  try {
    const arr = JSON.parse(extraMatch[1]);
    allProducts.push(...arr);
  } catch(e) {
    console.error('Error parsing EXTRA_PRODUCTS:', e.message);
  }
}

console.log(`Loaded ${allProducts.length} products`);

// Sort by brand, then name
allProducts.sort((a, b) => {
  if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
  return a.name.localeCompare(b.name);
});

// Generate CSV
const header = ['id', 'brand', 'name', 'img', 'new_img', 'gallery_1', 'gallery_2', 'gallery_3', 'gallery_4', 'gallery_5'];

function csvEscape(val) {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Check if img is a real URL or placeholder
function imgStatus(img) {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  if (img.startsWith('data:')) return '[PLACEHOLDER]';
  return img; // type string
}

const rows = [header.join(',')];
let placeholderCount = 0;
let realCount = 0;

for (const p of allProducts) {
  const currentImg = imgStatus(p.img);
  if (currentImg === '[PLACEHOLDER]' || (!currentImg.startsWith('http') && currentImg !== '')) {
    placeholderCount++;
  } else if (currentImg.startsWith('http')) {
    realCount++;
  }

  const gallery = p.gallery || [];
  const row = [
    csvEscape(p.id),
    csvEscape(p.brand),
    csvEscape(p.name),
    csvEscape(currentImg.length > 80 ? currentImg.substring(0, 80) + '...' : currentImg),
    '', // new_img — user fills this
    csvEscape(gallery[0] || ''),
    csvEscape(gallery[1] || ''),
    csvEscape(gallery[2] || ''),
    csvEscape(gallery[3] || ''),
    csvEscape(gallery[4] || ''),
  ];
  rows.push(row.join(','));
}

const csv = rows.join('\n');
const outPath = path.join(__dirname, 'products-images.csv');
fs.writeFileSync(outPath, '\ufeff' + csv, 'utf8'); // BOM for Excel

console.log(`\n✓ Exported ${allProducts.length} products to products-images.csv`);
console.log(`  ${realCount} with real CDN URLs`);
console.log(`  ${placeholderCount} need photos (placeholder/type string)`);
console.log(`\nInstructions:`);
console.log(`  1. Open products-images.csv in Google Sheets / Excel`);
console.log(`  2. Fill "new_img" column with real photo URLs`);
console.log(`  3. Fill gallery_1..gallery_5 for additional photos`);
console.log(`  4. Save as CSV, then run: node import-images.js`);
