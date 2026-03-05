import json, re

data = json.load(open('products.json', encoding='utf-8'))

# Fix emoji in names (remove non-standard chars)
emoji_count = 0
for p in data:
    for field in ('name', 'desc'):
        val = p.get(field, '')
        clean = ''
        for c in val:
            cp = ord(c)
            # Keep normal unicode ranges (latin, cyrillic, german, basic CJK excluded)
            if cp < 0xD800 or (0xE000 <= cp < 0xF900):
                clean += c
            else:
                emoji_count += 1
        if clean != val:
            p[field] = clean.strip()

print('Emoji chars removed:', emoji_count)

# Find Apple/Samsung/premium products
apple = [p for p in data if p.get('brand') == 'Apple']
samsung = [p for p in data if p.get('brand') == 'Samsung']
sony = [p for p in data if p.get('brand') == 'Sony']
bose = [p for p in data if p.get('brand') == 'Bose']
dyson = [p for p in data if p.get('brand') == 'Dyson']

print('Apple:', len(apple))
for p in sorted(apple, key=lambda x: -x.get('price',0))[:15]:
    print(f"  id={p['id']} price={p['price']} name={p['name'][:60]}")

print('Samsung:', len(samsung))
for p in sorted(samsung, key=lambda x: -x.get('price',0))[:5]:
    print(f"  id={p['id']} price={p['price']} name={p['name'][:60]}")
    
print('Sony:', len(sony))
for p in sorted(sony, key=lambda x: -x.get('price',0))[:5]:
    print(f"  id={p['id']} price={p['price']} name={p['name'][:60]}")

json.dump(data, open('products.json','w',encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
print('Saved OK, total:', len(data))
