import re

with open('app.js', encoding='utf-8') as f:
    src = f.read()

# 1. Remove fire emoji from sec_trending_label (all languages)
# Pattern: '🔥 AKTUELL' -> 'AKTUELL', '🔥 TRENDING' -> 'TRENDING', etc.
src = re.sub(r'\ud83d\udd25\s*', '', src)  # fire emoji in unicode escapes
src = re.sub(r'🔥\s*', '', src)            # fire emoji as literal

# 2. Remove ✦ from nav_new labels
src = re.sub(r'\s*✦', '', src)
src = re.sub(r'\s*\u2726', '', src)

# 3. Remove the literal ✦ from the HTML nav_new link in ALL html files (handle separately)

# Remove emoji from any I18N string that still has them
# Clean generic emoji ranges from I18N string values only  
# (don't touch product names - already fixed)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(src)

print('Done - emoji removed from app.js')
# Verify
import re as r2
remaining = r2.findall(r'🔥|✦|\uD83D\uDD25', src)
print('Remaining fire/star emoji:', len(remaining))
