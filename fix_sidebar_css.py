import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace .mdb-side>a with .mdb-side-item > a, .mdb-side > a
content = content.replace('.mdb-side>a', '.mdb-side-item > a, .mdb-side > a')

# Also fix the JS active class observer selector which might have broken
# wait, in the JS I did:
# const links = document.querySelectorAll('.mdb-side>div>a'); 
# this is correct, but let's double check if I broke anything else.
# The user screenshot showed standard browser blue/purple links, meaning the CSS selector was definitely broken.

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed CSS selectors!")
