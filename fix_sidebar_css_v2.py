import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Revert the broken regex
content = content.replace('.mdb-side-item > a, .mdb-side > a', '.mdb-side>a')

# Apply proper manual replacements for the specific selectors used in models.html
replacements = {
    '.mdb-side>a ': '.mdb-side-item > a, .mdb-side > a ',
    '.mdb-side>a{': '.mdb-side-item > a, .mdb-side > a {',
    '.mdb-side>a:hover': '.mdb-side-item > a:hover, .mdb-side > a:hover',
    '.mdb-side>a.active': '.mdb-side-item > a.active, .mdb-side > a.active',
    '.mdb-side>a::before': '.mdb-side-item > a::before, .mdb-side > a::before',
    '.mdb-side>a.active::before': '.mdb-side-item > a.active::before, .mdb-side > a.active::before',
    '.mdb-side>a.active .mdb-count': '.mdb-side-item > a.active .mdb-count, .mdb-side > a.active .mdb-count'
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Also fix the flex-shrink issue on mobile
# Mobile styles are in @media (max-width:1023px)
# We need `.mdb-side-item` to have flex-shrink: 0 so they don't squish and cause vertical text wrapping
mobile_fix = """
    @media (max-width:1023px) {
        .mdb-sub-menu { display: none; } /* Hide sub-menu in horizontal mobile pill-nav */
        .mdb-side-item { flex-shrink: 0; }
    }
"""
content = content.replace("""    @media (max-width:1023px) {
        .mdb-sub-menu { display: none; } /* Hide sub-menu in horizontal mobile pill-nav */
    }""", mobile_fix)

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed CSS completely!")
