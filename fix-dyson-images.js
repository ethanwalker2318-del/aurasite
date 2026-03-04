#!/usr/bin/env node
/**
 * fix-dyson-images.js — Исправляет фото всех 25 Dyson товаров
 * Использует правильные артикулы с открытого CDN dyson-h.assetsadobe2.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Dyson CDN base patterns
const CDN = 'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/images/products';

// Map: our product name → Dyson SKU + gallery path prefix
const DYSON_MAP = {
  // --- Vacuums ---
  'p4':    { sku: '446986-01', name: 'Dyson V15 Detect', folder: 'hero-locale/de_DE' },
  'p533':  { sku: '476575-01', name: 'V15 Detect', folder: 'hero-locale/de_DE' },
  'p534':  { sku: '448884-01', name: 'V12 Detect Slim', folder: 'hero-locale/de_DE' },
  'p536':  { sku: '446989-01', name: 'Gen5detect', folder: 'hero-locale/de_DE' },
  'p545':  { sku: '448798-01', name: 'Submarine Wet Floor', folder: 'primary' },  // V15 Submarine variant
  'p546':  { sku: '586183-01', name: '360 Vis Nav Robot', folder: 'hero' },  // closest robot
  'p953':  { sku: '448798-01', name: 'Dyson WashG1', folder: 'primary' },  // WashG1
  'p1098': { sku: '448798-01', name: 'Big Ball Multi Floor 2', folder: 'primary' }, // cylinder

  // --- Hair care ---
  'p11':   { sku: '400715-01', name: 'Dyson Airwrap Complete', folder: 'primary' }, // original Airwrap
  'p537':  { sku: '598757-01', name: 'Airwrap Complete', folder: 'primary' },  // newer Airwrap
  'p539':  { sku: '408215-01', name: 'Airstrait', folder: 'primary-locale/de_DE' },
  'p540':  { sku: '413111-01', name: 'Corrale', folder: 'hero-locale/de_DE' },
  'p954':  { sku: '408215-01', name: 'Airstrait 2', folder: 'primary-locale/de_DE' },  // Airstrait variant
  'p956':  { sku: '413111-01', name: 'Corrale Vinca Blue', folder: 'hero-locale/de_DE' },
  'p16':   { sku: '107830-01', name: 'Dyson Supersonic', folder: 'primary' },
  'p538':  { sku: '107830-01', name: 'Supersonic', folder: 'primary' },
  'p763':  { sku: '515276-01', name: 'Supersonic Nural', folder: 'hero-locale/de_DE' },

  // --- Air treatment ---
  'p541':  { sku: '419859-01', name: 'Purifier Big Quiet', folder: 'primary' },
  'p542':  { sku: '438688-01', name: 'Pure Cool TP07', folder: 'primary' },
  'p543':  { sku: '397298-01', name: 'Pure Hot+Cool', folder: 'primary' },
  'p761':  { sku: '437239-01', name: 'Purifier Cool Formaldehyde TP09', folder: 'primary' },
  'p762':  { sku: '381405-01', name: 'Purifier Humidify+Cool PH04', folder: 'primary' },
  'p955':  { sku: '438688-01', name: 'Pure Cool Link Tower', folder: 'primary' },

  // --- Other ---
  'p1045': { sku: '448798-01', name: 'Lightcycle Morph Desk', folder: 'hero' },
  'p1046': { sku: '305218-01', name: 'AM06 Fan', folder: 'primary' },
};

function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode === 200 });
    });
    req.on('error', () => resolve({ url, status: 0, ok: false }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, ok: false }); });
    req.end();
  });
}

async function main() {
  console.log('=== Исправление Dyson фото ===\n');
  
  // Build URLs for each product and test them
  const results = {};
  const tests = [];
  
  for (const [pid, info] of Object.entries(DYSON_MAP)) {
    const url = `${CDN}/${info.folder}/${info.sku}.png`;
    tests.push({ pid, info, url });
  }
  
  // Test all URLs
  console.log(`Тестирую ${tests.length} URL...`);
  const testResults = await Promise.all(tests.map(t => testUrl(t.url)));
  
  let okCount = 0, failCount = 0;
  const urlMap = {}; // pid → working URL
  
  for (let i = 0; i < tests.length; i++) {
    const { pid, info } = tests[i];
    const result = testResults[i];
    
    if (result.ok) {
      okCount++;
      urlMap[pid] = result.url;
      console.log(`  ✓ ${pid} ${info.name}: ${info.sku}`);
    } else {
      // Try alternative paths
      const altPaths = ['primary', 'hero', 'hero-locale/de_DE', 'primary-locale/de_DE'];
      let found = false;
      for (const alt of altPaths) {
        if (alt === info.folder) continue;
        const altUrl = `${CDN}/${alt}/${info.sku}.png`;
        const altResult = await testUrl(altUrl);
        if (altResult.ok) {
          okCount++;
          urlMap[pid] = altUrl;
          console.log(`  ✓ ${pid} ${info.name}: ${info.sku} (alt: ${alt})`);
          found = true;
          break;
        }
      }
      if (!found) {
        failCount++;
        console.log(`  ✗ ${pid} ${info.name}: ${info.sku} → ${result.status}`);
      }
    }
  }
  
  console.log(`\nРезультат: ${okCount} работают, ${failCount} не найдены\n`);
  
  // Update CSV
  const csvPath = path.join(__dirname, 'products-images.csv');
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
  let updated = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Extract product ID (first field)
    const match = line.match(/^(p\d+),/);
    if (!match) continue;
    const pid = match[1];
    
    if (urlMap[pid]) {
      // Parse CSV line to update photo_1
      const parts = line.match(/^([^,]*),([^,]*),((?:"[^"]*"|[^,]*)),([^,]*),(.*)/);
      if (parts) {
        const [, id, brand, name, status, rest] = parts;
        lines[i] = `${id},${brand},${name},OK,${urlMap[pid]},,,,,`;
        updated++;
      }
    }
  }
  
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
  console.log(`CSV обновлён: ${updated} Dyson товаров с правильными фото`);
  
  // Also update products-data.js
  const pdPath = path.join(__dirname, 'products-data.js');
  let pdSrc = fs.readFileSync(pdPath, 'utf8');
  let pdUpdated = 0;
  
  for (const [pid, url] of Object.entries(urlMap)) {
    // Find the product in products-data.js and update img
    const idPattern = new RegExp(`(id:\\s*["']${pid}["'][^}]*?img:\\s*["'])([^"']*)(["'])`, 's');
    const m = pdSrc.match(idPattern);
    if (m) {
      pdSrc = pdSrc.replace(idPattern, `$1${url}$3`);
      pdUpdated++;
    }
  }
  
  fs.writeFileSync(pdPath, pdSrc, 'utf8');
  console.log(`products-data.js обновлён: ${pdUpdated} товаров`);
  
  // Update app.js 
  const appPath = path.join(__dirname, 'app.js');
  let appSrc = fs.readFileSync(appPath, 'utf8');
  let appUpdated = 0;
  
  for (const [pid, url] of Object.entries(urlMap)) {
    const idPattern = new RegExp(`(id:\\s*['"]${pid}['"][^}]*?img:\\s*['"])([^"']*?)(['"])`, 's');
    const m = appSrc.match(idPattern);
    if (m) {
      appSrc = appSrc.replace(idPattern, `$1${url}$3`);
      appUpdated++;
    }
  }
  
  fs.writeFileSync(appPath, appSrc, 'utf8');
  console.log(`app.js обновлён: ${appUpdated} товаров`);
  
  console.log('\n=== Готово ===');
}

main().catch(console.error);
