import re

with open('index.html', 'r', encoding='utf-8') as f:
    idx = f.read()

m = re.search(r'<section\s+[^>]*id="contact"[^>]*>.*?</section>', idx, re.DOTALL)
if m:
    contact_html = m.group(0)
    print("Found contact section:", len(contact_html), "bytes")
    
    with open('models.html', 'r', encoding='utf-8') as f:
        mod = f.read()
    
    # We want to insert it right before the footer
    # Footer starts with <footer class="footer pf-footer"> or similar
    mod = re.sub(r'(<footer\b[^>]*>)', r'\n' + contact_html.replace('\\', '\\\\') + r'\n\1', mod)
    
    with open('models.html', 'w', encoding='utf-8') as f:
        f.write(mod)
    print("Injected into models.html")
else:
    print("Could not find contact section in index.html")
