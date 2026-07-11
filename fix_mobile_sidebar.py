import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add white-space: nowrap to mobile side links
old_mobile_link = ".mdb-side-item > a, .mdb-side > a {flex-shrink:0;padding:8px 16px; background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 6px; font-size: 14px;}"
new_mobile_link = ".mdb-side-item > a, .mdb-side > a {flex-shrink:0;padding:8px 16px; background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 6px; font-size: 14px; white-space: nowrap; display: block;}"

content = content.replace(old_mobile_link, new_mobile_link)

# Fix top position and z-index for mobile sticky sidebar
content = content.replace('top:60px;z-index:20;flex-direction:row;overflow-x:auto;overflow-y:hidden;gap:8px;margin-bottom:24px;padding:12px;', 'top:64px;z-index:90;flex-direction:row;overflow-x:auto;overflow-y:hidden;gap:8px;margin-bottom:24px;padding:12px; align-items: center;')

# Ensure submenu is fully hidden on mobile and wrappers shrink properly
old_mobile_adjustments = """    @media (max-width:1023px) {
        .mdb-sub-menu { display: none; } /* Hide sub-menu in horizontal mobile pill-nav */
        .mdb-side-item { flex-shrink: 0; }
    }"""
    
new_mobile_adjustments = """    @media (max-width:1023px) {
        .mdb-sub-menu { display: none !important; } /* Hide sub-menu in horizontal mobile pill-nav */
        .mdb-side-item { flex-shrink: 0; display: block; }
    }"""
    
content = content.replace(old_mobile_adjustments, new_mobile_adjustments)

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed mobile layout for sidebar!")
