import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('id="contact" class="contact"', 'id="contact" class="contact mdb-contact-dark"')
# Just in case it's in a different order:
content = content.replace('class="contact" id="contact"', 'class="contact mdb-contact-dark" id="contact"')

dark_contact_css = """
    /* Contact Section Dark Theme Override */
    .mdb-contact-dark { background: #080c16 !important; border-top: 1px solid rgba(255,255,255,0.05); }
    .mdb-contact-dark .section-title { color: #ffffff !important; }
    .mdb-contact-dark .section-desc { color: rgba(255,255,255,0.6) !important; }
    .mdb-contact-dark .contact-card { background: rgba(15, 20, 31, 0.75) !important; border: 1px solid rgba(255,255,255,0.08) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
    .mdb-contact-dark .contact-card h3 { color: #ffffff !important; }
    .mdb-contact-dark .contact-card p, .mdb-contact-dark .contact-card a { color: rgba(255,255,255,0.7) !important; }
    .mdb-contact-dark .contact-card i { color: var(--blue-500) !important; }
    .mdb-contact-dark .contact-form { background: rgba(15, 20, 31, 0.75) !important; border: 1px solid rgba(255,255,255,0.08) !important; box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
    .mdb-contact-dark .form-group input, .mdb-contact-dark .form-group textarea { background: rgba(0,0,0,0.3) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #ffffff !important; }
    .mdb-contact-dark .form-group input:focus, .mdb-contact-dark .form-group textarea:focus { border-color: var(--blue-500) !important; background: rgba(0,0,0,0.5) !important; box-shadow: 0 0 0 4px rgba(37,99,235,0.1) !important; }
    .mdb-contact-dark .submit-btn { background: var(--blue-600) !important; color: #fff !important; border: none !important; box-shadow: 0 4px 15px rgba(37,99,235,0.3) !important; }
    .mdb-contact-dark .submit-btn:hover { background: var(--blue-500) !important; transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(37,99,235,0.5) !important; }
"""

content = content.replace('</style>', dark_contact_css + '\n</style>')

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dark contact CSS applied")
