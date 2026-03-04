/**
 * AURA GLOBAL — Import images from CSV back into product files
 * 
 * CSV format: id, brand, name, status, photo_1 (MAIN), photo_2..photo_6
 * photo_1 = главное фото, photo_2..6 = галерея
 * 
 * Usage: node import-images.js
 */
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'products-images.csv');
if (!fs.existsSync(csvPath)) {
  console.error('ERROR: products-images.csv not found! Run export-csv.js first.');
  process.exit(1);
}

// Parse CSV (handles quoted fields)
function parseCSV(text) {
  const lines = text.split('\n');
  const header = lines[0].replace(/^\ufeff/, '').split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    
    const obj = {};
    header.forEach((h, idx) => obj[h] = (fields[idx] || '').trim());
    rows.push(obj);
  }
  return { header, rows };
}

const csvText = fs.readFileSync(csvPath, 'utf8');
const { header, rows } = parseCSV(csvText);

// Detect column names (flexible)
const photoKeys = header.filter(h => h.toLowerCase().startsWith('photo_'));
console.log(`CSV columns: ${header.join(', ')}`);
console.log(`Photo columns found: ${photoKeys.join(', ')}`);

// Build update map: id → { img, gallery }
const updates = {};
let updateCount = 0;
let galleryCount = 0;

for (const row of rows) {
  const id = row.id;
  if (!id) continue;
  
  // photo_1 (MAIN) = main image
  const mainKey = photoKeys[0] || 'photo_1 (ГЛАВНОЕ)';
  const mainImg = (row[mainKey] || '').trim();
  
  // photo_2..6 = gallery
  const gallery = [];
  for (let i = 1; i < photoKeys.length; i++) {
    const url = (row[photoKeys[i]] || '').trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      gallery.push(url);
    }
  }
  
  if ((mainImg && mainImg.startsWith('http')) || gallery.length > 0) {
    updates[id] = {};
    if (mainImg && mainImg.startsWith('http')) {
      updates[id].img = mainImg;
      updateCount++;
    }
    if (gallery.length > 0) {
      updates[id].gallery = gallery;
      galleryCount++;
    }
  }
}

console.log(`\nParsed: ${rows.length} rows, ${updateCount} main photos, ${galleryCount} galleries`);

if (updateCount === 0 && galleryCount === 0) {
  console.log('Nothing to update. Fill photo columns in the CSV.');
  process.exit(0);
}

// ── Update products-data.js (JSON-style double quotes) ──
function updateProductsData() {
  const fp = path.join(__dirname, 'products-data.js');
  let content = fs.readFileSync(fp, 'utf8');
  let changed = 0;
  
  for (const [id, data] of Object.entries(updates)) {
    const idStr = `"id":"${id}"`;
    const idx = content.indexOf(idStr);
    if (idx === -1) continue;
    
    // Find the product object boundaries
    const objStart = content.lastIndexOf('{', idx);
    const objEnd = content.indexOf('}', idx);
    if (objStart === -1 || objEnd === -1) continue;
    
    let obj = content.substring(objStart, objEnd + 1);
    
    // Replace img
    if (data.img) {
      const imgMatch = obj.match(/"img":"([^"]*)"/);
      if (imgMatch) {
        const safeUrl = data.img.replace(/"/g, '\\"');
        obj = obj.replace(/"img":"[^"]*"/, `"img":"${safeUrl}"`);
      }
    }
    
    // Replace gallery
    if (data.gallery && data.gallery.length > 0) {
      const galleryJson = JSON.stringify(data.gallery);
      obj = obj.replace(/"gallery":\[[^\]]*\]/, `"gallery":${galleryJson}`);
    }
    
    if (obj !== content.substring(objStart, objEnd + 1)) {
      content = content.substring(0, objStart) + obj + content.substring(objEnd + 1);
      changed++;
    }
  }
  
  fs.writeFileSync(fp, content, 'utf8');
  console.log(`  products-data.js: ${changed} products updated`);
  return changed;
}

// ── Update app.js (single-quote style) ──
function updateAppJs() {
  const fp = path.join(__dirname, 'app.js');
  let content = fs.readFileSync(fp, 'utf8');
  let changed = 0;
  
  for (const [id, data] of Object.entries(updates)) {
    const idStr = `id:'${id}'`;
    const idx = content.indexOf(idStr);
    if (idx === -1) continue;
    
    // Find img field near this product
    if (data.img) {
      const imgRegex = new RegExp(`(id:'${id}'[^}]*?)img:'([^']*)'`);
      const m = content.match(imgRegex);
      if (m) {
        const safeUrl = data.img.replace(/'/g, "\\'");
        content = content.replace(imgRegex, `$1img:'${safeUrl}'`);
      }
    }
    
    // Replace gallery
    if (data.gallery && data.gallery.length > 0) {
      const galleryOld = new RegExp(`(id:'${id}'[^}]*?)gallery:\\[[^\\]]*\\]`);
      const galleryNew = `$1gallery:[${data.gallery.map(u => "'" + u.replace(/'/g, "\\'") + "'").join(',')}]`;
      if (content.match(galleryOld)) {
        content = content.replace(galleryOld, galleryNew);
      }
    }
    
    changed++;
  }
  
  fs.writeFileSync(fp, content, 'utf8');
  console.log(`  app.js: ${changed} products updated`);
  return changed;
}

console.log('\nApplying updates...');
const c1 = updateProductsData();
const c2 = updateAppJs();

// Bump PRODUCTS_VERSION
let appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const verMatch = appJs.match(/var PRODUCTS_VERSION = (\d+);/);
if (verMatch) {
  const newVer = parseInt(verMatch[1]) + 1;
  appJs = appJs.replace(/var PRODUCTS_VERSION = \d+;/, `var PRODUCTS_VERSION = ${newVer};`);
  fs.writeFileSync(path.join(__dirname, 'app.js'), appJs, 'utf8');
  console.log(`\n✓ PRODUCTS_VERSION bumped to ${newVer}`);
}

console.log(`\n✓ Done! ${c1 + c2} total updates applied.`);
console.log('  Run: git add -A && git commit -m "Update product images" && git push');
