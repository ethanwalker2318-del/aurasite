import re

with open('app.js', encoding='utf-8') as f:
    src = f.read()

# Remove fire emoji as JS unicode escape sequence \ud83d\udd25
src = re.sub(r'\\ud83d\\udd25\s*', '', src)
# Remove sparkle \u2726 with spaces
src = re.sub(r'\s*\\u2726', '', src)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(src)

print('Done')
# Verify
hits = re.findall(r'\\ud83d\\udd25|\\u2726', src)
print('Remaining escaped emoji:', len(hits))
