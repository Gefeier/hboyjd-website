import re

with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The block to find
old_block = """    const selectors = [
        '.stat-item',
        '.timeline-item',
        '.tech-card',
        '.member-block',
        '.advantage-block',
        '.market-block',
        '.contribution-block',
        '.honor-figure',
        '.ft-tile',
        '.pp-card',
        '.trinity-item',
        '.section-header',
        '.about-carousel',
        '.about-content',
        '.advantage-card',
        '.news-column',
        '.mission-text',
        '.mission-tags',
        '.cta-content'
    ];"""

new_block = """    const selectors = [
        '.stat-item',
        '.timeline-item',
        '.tech-card',
        '.member-block',
        '.advantage-block',
        '.market-block',
        '.contribution-block',
        '.honor-figure',
        '.ft-tile',
        '.pp-card',
        '.trinity-item',
        '.section-header',
        '.about-carousel',
        '.about-content',
        '.advantage-card',
        '.news-column',
        '.mission-text',
        '.mission-tags',
        '.cta-content',
        '.mdb-group-head',
        '.mdb-banner',
        '.mdb-card'
    ];"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully!")
else:
    print("Could not find the block to replace!")
