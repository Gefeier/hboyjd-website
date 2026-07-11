import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

fix_css = """
    /* --- Ultimate Contact Dark Font Fix --- */
    .mdb-contact-dark { color: rgba(255,255,255,0.85) !important; }
    .mdb-contact-dark p, 
    .mdb-contact-dark span, 
    .mdb-contact-dark a,
    .mdb-contact-dark label,
    .mdb-contact-dark div:not(.contact-form):not(.form-group) {
        color: rgba(255,255,255,0.75) !important;
    }
    .mdb-contact-dark h1, 
    .mdb-contact-dark h2, 
    .mdb-contact-dark h3, 
    .mdb-contact-dark h4, 
    .mdb-contact-dark .section-title {
        color: #ffffff !important;
    }
    .mdb-contact-dark .info-item h4 { color: #ffffff !important; margin-bottom: 4px !important; }
    .mdb-contact-dark a:hover { color: var(--blue-400) !important; }
    .mdb-contact-dark i { color: var(--blue-500) !important; }
    
    /* Ensure form inputs are visible (black text on white bg) */
    .mdb-contact-dark input, 
    .mdb-contact-dark select, 
    .mdb-contact-dark textarea {
        color: #000000 !important;
        background-color: #ffffff !important;
    }
    .mdb-contact-dark .submit-btn {
        color: #ffffff !important;
    }
"""

content = content.replace('</style>', fix_css + '\n</style>')

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Contact fonts fixed")
