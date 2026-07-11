import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS to add .reveal animations and .mdb-sub-menu styles
css_additions = """
    /* --- Scroll Reveal Animations --- */
    .mdb-group-head.reveal, .mdb-banner.reveal, .mdb-card.reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .mdb-group-head.reveal.is-visible, .mdb-banner.reveal.is-visible, .mdb-card.reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    /* Ensure hover transitions are preserved after reveal */
    .mdb-card.reveal.is-visible {
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease, background 0.4s ease !important;
    }

    /* --- Sidebar Accordion (Fan-out Submenu) --- */
    .mdb-side-item { display: flex; flex-direction: column; }
    .mdb-side>a { margin-bottom: 0; } /* override old margin */
    .mdb-sub-menu { 
        max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex; flex-direction: column; padding-left: 20px;
    }
    .mdb-side-item.open .mdb-sub-menu { max-height: 500px; }
    
    .mdb-sub-link {
        font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none;
        padding: 8px 12px; transition: 0.3s;
        border-left: 1px solid rgba(255,255,255,0.1);
        display: block; position: relative;
    }
    .mdb-sub-link:hover { color: #fff; border-left-color: var(--blue-500); background: rgba(255,255,255,0.03); }
    .mdb-sub-link::before {
        content: ''; position: absolute; left: -3px; top: 50%; transform: translateY(-50%);
        width: 5px; height: 5px; border-radius: 50%; background: var(--blue-500);
        opacity: 0; transition: 0.3s;
    }
    .mdb-sub-link:hover::before { opacity: 1; }
    
    /* Mobile Accordion adjustments */
    @media (max-width:1023px) {
        .mdb-sub-menu { display: none; } /* Hide sub-menu in horizontal mobile pill-nav */
    }
</style>
"""
content = content.replace("</style>", css_additions)


# 2. Inject the JS at the bottom (before </body>) to generate the sub-menus
js_injection = """
<!-- Auto-generate Sidebar Accordion -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // 1. First, assign IDs to all cards so we can scroll to them
    const groups = document.querySelectorAll('.mdb-group');
    groups.forEach(group => {
        const catId = group.id; // e.g. cat-flatbed
        const cards = group.querySelectorAll('.mdb-card');
        const sidebarLink = document.querySelector(`.mdb-side a[href="#${catId}"]`);
        
        if (!sidebarLink) return;
        
        // Wrap the link in a container
        const wrapper = document.createElement('div');
        wrapper.className = 'mdb-side-item';
        sidebarLink.parentNode.insertBefore(wrapper, sidebarLink);
        wrapper.appendChild(sidebarLink);
        
        // Create the submenu container
        const subMenu = document.createElement('div');
        subMenu.className = 'mdb-sub-menu';
        
        cards.forEach((card, index) => {
            // Give card an ID
            const modelName = card.querySelector('h4').childNodes[0].textContent.trim();
            const cardId = `card-${catId}-${index}`;
            card.id = cardId;
            card.style.scrollMarginTop = '100px';
            
            // Create sub-link
            const subLink = document.createElement('a');
            subLink.className = 'mdb-sub-link';
            subLink.href = `#${cardId}`;
            subLink.textContent = modelName;
            
            // Click scroll smooth
            subLink.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById(cardId).scrollIntoView({behavior: 'smooth'});
            });
            
            subMenu.appendChild(subLink);
        });
        
        wrapper.appendChild(subMenu);
        
        // Toggle Accordion on main link click
        sidebarLink.addEventListener('click', function(e) {
            // Close other wrappers
            document.querySelectorAll('.mdb-side-item').forEach(w => {
                if(w !== wrapper) w.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });
    });
    
    // Override the active scroll spy logic to also open the wrapper
    const links = document.querySelectorAll('.mdb-side>div>a'); // it is now inside .mdb-side-item
    const map = {};
    links.forEach(a => { map[a.dataset.cat] = a; });
    const obs = new IntersectionObserver(function(es){
        es.forEach(function(e){
            if(e.isIntersecting && e.intersectionRatio > 0.1){
                const a = map[e.target.id];
                if(a){
                    // Make active
                    document.querySelectorAll('.mdb-side a').forEach(al => al.classList.remove('active'));
                    a.classList.add('active');
                    // Open accordion
                    document.querySelectorAll('.mdb-side-item').forEach(w => w.classList.remove('open'));
                    a.closest('.mdb-side-item').classList.add('open');
                }
            }
        });
    }, {rootMargin:'-20% 0px -70% 0px'});
    groups.forEach(g => obs.observe(g));
});
</script>
</body>
"""

# replace the bottom IntersectionObserver inline script with the new accordion logic
content = re.sub(r'<script>\s*\(function\(\)\{\s*var links = document\.querySelectorAll.*?\}\)\(\);\s*</script>\s*</body>', js_injection, content, flags=re.DOTALL)

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated CSS and injected Accordion JS!")
