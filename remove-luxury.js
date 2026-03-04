#!/usr/bin/env node
/**
 * remove-luxury.js — Удаляет все luxury-бренды из каталога
 * Бренды: Rolex, Gucci, Prada, Louis Vuitton, Chanel, Hermès, Dior, Balenciaga, Omega
 * 
 * Что делает:
 * 1. Удаляет из app.js (DEFAULT_PRODUCTS)
 * 2. Удаляет из products-data.js (AURA_EXTRA_PRODUCTS)
 * 3. Удаляет из products-images.csv
 * 4. Обновляет PRODUCTS_VERSION
 */

const fs = require('fs');
const path = require('path');

const LUXURY_BRANDS = [
  'Rolex', 'Gucci', 'Prada', 'Louis Vuitton', 'Chanel',
  'Hermès', 'Hermes', 'Dior', 'Balenciaga', 'Omega'
];

function isLuxury(brand) {
  return LUXURY_BRANDS.some(lb => 
    brand.toLowerCase().trim() === lb.toLowerCase()
  );
}

// --- 1. Clean products-data.js ---
function cleanProductsData() {
  const file = path.join(__dirname, 'products-data.js');
  let src = fs.readFileSync(file, 'utf8');
  
  // Extract the array content
  const match = src.match(/window\.AURA_EXTRA_PRODUCTS\s*=\s*\[/);
  if (!match) { console.error('Cannot find AURA_EXTRA_PRODUCTS'); return 0; }
  
  // Use Function to parse the array safely
  const arrStart = src.indexOf('[', match.index);
  let depth = 0, arrEnd = -1;
  for (let i = arrStart; i < src.length; i++) {
    if (src[i] === '[') depth++;
    if (src[i] === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
  }
  
  const arrStr = src.substring(arrStart, arrEnd + 1);
  let products;
  try {
    products = new Function('return ' + arrStr)();
  } catch(e) {
    console.error('Parse error products-data.js:', e.message);
    return 0;
  }
  
  const before = products.length;
  const filtered = products.filter(p => !isLuxury(p.brand || ''));
  const removed = before - filtered.length;
  
  // Rebuild the file
  const newArr = JSON.stringify(filtered, null, 2)
    // Convert to JS-style (unquote keys where safe)
    .replace(/"([a-zA-Z_]\w*)":/g, '$1:')
    // Fix string values — keep them as double-quoted
    ;
  
  const newSrc = src.substring(0, match.index) + 
    'window.AURA_EXTRA_PRODUCTS = ' + newArr + ';\n';
  
  fs.writeFileSync(file, newSrc, 'utf8');
  console.log(`products-data.js: удалено ${removed} luxury из ${before} (осталось ${filtered.length})`);
  return removed;
}

// --- 2. Clean app.js DEFAULT_PRODUCTS ---
function cleanAppJs() {
  const file = path.join(__dirname, 'app.js');
  let src = fs.readFileSync(file, 'utf8');
  
  // Find DEFAULT_PRODUCTS array
  const match = src.match(/(const|var|let)\s+DEFAULT_PRODUCTS\s*=\s*\[/);
  if (!match) { console.error('Cannot find DEFAULT_PRODUCTS'); return 0; }
  
  const arrStart = src.indexOf('[', match.index);
  let depth = 0, arrEnd = -1;
  for (let i = arrStart; i < src.length; i++) {
    if (src[i] === '[') depth++;
    if (src[i] === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
  }
  
  const arrStr = src.substring(arrStart, arrEnd + 1);
  let products;
  try {
    products = new Function('return ' + arrStr)();
  } catch(e) {
    console.error('Parse error app.js DEFAULT_PRODUCTS:', e.message);
    return 0;
  }
  
  const before = products.length;
  const filtered = products.filter(p => !isLuxury(p.brand || ''));
  const removed = before - filtered.length;
  
  if (removed === 0) {
    console.log('app.js: luxury не найдено в DEFAULT_PRODUCTS');
    return 0;
  }
  
  // Rebuild — keep original formatting style (single-quote strings in app.js)
  // We'll use a regex approach to remove individual product objects
  let newSrc = src;
  
  // Find IDs to remove
  const luxuryIds = products.filter(p => isLuxury(p.brand || '')).map(p => p.id);
  console.log('Luxury IDs в app.js:', luxuryIds.join(', '));
  
  // Remove each product block from the source
  for (const id of luxuryIds) {
    // Match the product object: {id:'pXX', ... }, or {id:'pXX', ... }]
    const idEsc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `\\{\\s*id:\\s*['"]${idEsc}['"][^}]*?\\}\\s*,?`,
      's'
    );
    newSrc = newSrc.replace(re, '');
  }
  
  // Clean up double commas, trailing commas before ]
  newSrc = newSrc.replace(/,\s*,/g, ',');
  newSrc = newSrc.replace(/,\s*\]/g, '\n]');
  
  // Bump version
  newSrc = newSrc.replace(
    /(const|var|let)\s+PRODUCTS_VERSION\s*=\s*(\d+)/,
    (m, kw, v) => `${kw} PRODUCTS_VERSION = ${parseInt(v) + 1}`
  );
  
  fs.writeFileSync(file, newSrc, 'utf8');
  console.log(`app.js: удалено ${removed} luxury из ${before} (осталось ${filtered.length})`);
  return removed;
}

// --- 3. Clean CSV ---
function cleanCsv() {
  const file = path.join(__dirname, 'products-images.csv');
  if (!fs.existsSync(file)) { console.log('CSV не найден'); return 0; }
  
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const header = lines[0];
  let removed = 0;
  const kept = [header];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // CSV format: id,brand,name,status,...
    // Brand is the second field
    const parts = line.match(/^([^,]*),([^,]*),/);
    if (parts) {
      const brand = parts[2].trim();
      if (isLuxury(brand)) {
        removed++;
        continue;
      }
    }
    kept.push(lines[i]);
  }
  
  fs.writeFileSync(file, kept.join('\n'), 'utf8');
  console.log(`products-images.csv: удалено ${removed} luxury строк`);
  return removed;
}

// --- Main ---
console.log('=== Удаление luxury-брендов ===');
console.log('Бренды:', LUXURY_BRANDS.join(', '));
console.log('');

const r1 = cleanProductsData();
const r2 = cleanAppJs();
const r3 = cleanCsv();

console.log('');
console.log(`=== Итого удалено: ${r1 + r2 + r3} товаров ===`);
console.log('PRODUCTS_VERSION обновлён');
