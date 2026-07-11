import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

fix_css = """
    /* Fix for social tags which have white backgrounds */
    .mdb-contact-dark .social-tag {
        color: #0f2035 !important;
    }
"""

content = content.replace('</style>', fix_css + '\n</style>')

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Social tag text color fixed")
