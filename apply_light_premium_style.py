import re

new_css = """
    /* Premium Clean Design - Matched with Product Detail (pf-variant-card) */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    html, body { overflow: clip visible; scroll-behavior: smooth; }
    
    body { 
        background: linear-gradient(180deg, #f7f9fc 0%, #eef2f8 100%);
        color: var(--gray-700); 
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .mdb-wrap { max-width: 1280px; margin: 0 auto; padding: 140px 24px 0; } 
    
    .mdb-head { text-align: center; margin-bottom: 70px; position: relative; z-index: 2; }
    .mdb-head::after {
        content: ''; position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
        width: 60px; height: 3px; background: var(--blue-500); border-radius: 2px;
    }
    .mdb-head .section-tag { letter-spacing: 4px; color: var(--blue-600); font-weight: 600; text-transform: uppercase; font-size: 13px; display: inline-block; margin-bottom: 12px; }
    .mdb-head .section-title { color: #0f2035 !important; font-weight: 800; letter-spacing: 1px; font-size: 36px !important; margin-bottom: 16px; }
    .mdb-head .section-desc { color: var(--gray-500); font-weight: 400; font-size: 15px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    
    .mdb-layout { display: grid; grid-template-columns: 260px minmax(0,1fr); gap: 40px; align-items: start; padding-bottom: 80px; }
    
    /* Clean Sidebar */
    .mdb-side { 
        position: sticky; top: 96px; display: flex; flex-direction: column; gap: 4px; 
        background: #ffffff; 
        border: 1px solid rgba(15,32,53,0.08); 
        border-radius: 14px; 
        padding: 20px 16px; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
        max-height: calc(100vh - 120px); overflow-y: auto; 
        scrollbar-width: thin; scrollbar-color: rgba(15,32,53,0.1) transparent; z-index: 10; 
    }
    .mdb-side::-webkit-scrollbar { width: 4px; }
    .mdb-side::-webkit-scrollbar-thumb { background: rgba(15,32,53,0.1); border-radius: 4px; }
    
    .mdb-side-item { display: flex; flex-direction: column; }
    .mdb-side-item > a { 
        position: relative; display: flex; justify-content: space-between; align-items: center; 
        padding: 12px 16px; border-radius: 8px; font-size: 14.5px; color: #475569; 
        text-decoration: none; transition: all 0.25s ease; font-weight: 500; margin-bottom: 0;
    }
    .mdb-side-item > a:hover { background: rgba(15,32,53,0.03); color: #0f2035; }
    .mdb-side-item > a.active { 
        background: rgba(37,99,235,0.08); color: var(--blue-600); font-weight: 600; 
    }
    
    .mdb-count { font-size: 11px; margin-left: auto; background: var(--gray-100); padding: 2px 8px; border-radius: 12px; color: var(--gray-500); transition: all 0.3s; }
    .mdb-side-item > a.active .mdb-count { background: var(--blue-500); color: white; }
    
    /* Sidebar Accordion (Fan-out Submenu) */
    .mdb-sub-menu { 
        max-height: 0; overflow: hidden; transition: max-height 0.3s ease-in-out;
        display: flex; flex-direction: column; padding-left: 20px;
    }
    .mdb-side-item.open .mdb-sub-menu { max-height: 500px; padding-bottom: 8px; }
    
    .mdb-sub-link {
        font-size: 13px; color: var(--gray-400); text-decoration: none;
        padding: 8px 12px 8px 16px; transition: 0.2s;
        border-left: 2px solid var(--gray-100);
        display: block; position: relative;
    }
    .mdb-sub-link:hover { color: var(--blue-600); border-left-color: var(--blue-400); background: rgba(37,99,235,0.02); }
    .mdb-sub-link::before {
        content: ''; position: absolute; left: -4px; top: 50%; transform: translateY(-50%);
        width: 6px; height: 6px; border-radius: 50%; background: var(--blue-500);
        opacity: 0; transition: 0.2s;
    }
    .mdb-sub-link:hover::before { opacity: 1; }
    
    /* Content Layout */
    .mdb-group { position: relative; scroll-margin-top: 96px; margin-bottom: 56px; padding: 0; border: none; }
    
    .mdb-group-head { display: flex; justify-content: space-between; align-items: center; margin: 0 0 24px; flex-wrap: wrap; gap: 10px; padding-bottom: 12px; border-bottom: 2px solid rgba(15,32,53,0.05); }
    .mdb-group-head h2 { font-size: 28px; color: #0f2035; margin: 0; font-weight: 800; letter-spacing: 0.5px; }
    .mdb-group-sub { font-size: 13px; color: var(--blue-600); font-weight: 600; margin-left: 14px; background: rgba(37,99,235,0.08); padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; }
    
    /* Intro Banner */
    .mdb-banner { background: #ffffff; border: 1px solid rgba(15,32,53,0.08); border-left: 4px solid var(--blue-500); border-radius: 12px; padding: 20px 24px; margin-bottom: 32px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
    .mdb-banner-txt p { font-size: 14px; line-height: 1.7; color: var(--gray-600); margin: 0 0 8px; }
    .mdb-banner-txt p:last-child { margin-bottom: 0; }
    .mdb-banner-txt i { font-style: normal; font-size: 12px; font-weight: 600; color: #0f2035; background: var(--gray-100); border-radius: 4px; padding: 2px 8px; margin-right: 8px; }
    
    /* Clean Product Cards (Match pf-variant-card) */
    .mdb-card { 
        display: flex; justify-content: space-between; align-items: center; gap: 20px; 
        background: #ffffff;
        border: 1px solid rgba(15, 32, 53, 0.08);
        border-radius: 14px;
        padding: 24px 28px; 
        margin-bottom: 16px; 
        transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .mdb-card:hover { 
        border-color: var(--blue-500);
        transform: translateY(-3px);
        box-shadow: 0 14px 30px rgba(37, 99, 235, 0.12);
    }
    
    .mdb-card h4 { margin: 0 0 12px; font-size: 19px; color: #0f2035; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-weight: 700; letter-spacing: 0.5px; }
    .mdb-name { font-size: 15px; color: var(--gray-500); font-weight: 500; }
    .mdb-brand { font-size: 11px; font-weight: 600; color: var(--blue-600); background: rgba(37,99,235,0.08); border-radius: 4px; padding: 3px 8px; text-transform: uppercase; letter-spacing: 1px; }
    
    .mdb-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .mdb-chip { font-size: 12.5px; color: var(--gray-600); background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 6px; padding: 4px 10px; font-weight: 500; }
    .mdb-chip i { font-style: normal; color: var(--gray-400); margin-right: 6px; font-size: 12px; }
    
    .mdb-actions { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; min-width: 140px; }
    .mdb-btn { font-size: 13.5px; text-decoration: none; text-align: center; padding: 10px 24px; border-radius: 100px; border: 1px solid var(--gray-300); color: #0f2035; white-space: nowrap; transition: all 0.3s ease; background: transparent; font-weight: 600; letter-spacing: 0.5px; }
    .mdb-btn:hover { border-color: #0f2035; background: var(--gray-50); }
    
    .mdb-btn-quote { background: #0f2035; color: #ffffff; border-color: #0f2035; }
    .mdb-btn-quote:hover { background: var(--blue-500); border-color: var(--blue-500); color: #ffffff; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.25); }
    
    .mdb-note { position: relative; z-index: 2; margin-top: 40px; font-size: 13px; color: var(--gray-400); line-height: 1.8; text-align: center; border-top: 1px solid rgba(15,32,53,0.05); padding-top: 24px; padding-bottom: 24px;}
    .mdb-note a { color: var(--blue-500); text-decoration: none; font-weight: 500; transition: 0.3s; }
    .mdb-note a:hover { color: var(--blue-600); text-decoration: underline; }
    
    /* --- Scroll Reveal Animations --- */
    .mdb-group-head.reveal, .mdb-banner.reveal, .mdb-card.reveal {
        opacity: 0; transform: translateY(30px);
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .mdb-group-head.reveal.is-visible, .mdb-banner.reveal.is-visible, .mdb-card.reveal.is-visible {
        opacity: 1; transform: translateY(0);
    }
    .mdb-card.reveal.is-visible {
        transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important;
    }
    
    /* MOBILE ROBUST FIX */
    @media (max-width:1023px){
      .mdb-wrap{padding-top:90px; padding-left: 16px; padding-right: 16px;}
      .mdb-layout{display:block}
      
      /* Pure horizontal scroll for side container */
      .mdb-side {
        position: sticky; top: 60px; z-index: 90; 
        flex-direction: row; align-items: center;
        overflow-x: auto; overflow-y: hidden;
        gap: 8px; margin-bottom: 24px; padding: 12px 16px; 
        background: #ffffff; border: 1px solid rgba(15,32,53,0.08); 
        scrollbar-width: none; box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      }
      .mdb-side::-webkit-scrollbar{display:none;}
      
      /* Wrapper item on mobile */
      .mdb-side-item { 
        display: inline-block; /* MUST be inline-block or flex-shrink:0 in flex row */
        flex-shrink: 0; 
      }
      
      /* Hide the accordion submenu completely */
      .mdb-sub-menu { display: none !important; }
      
      /* Clean pill buttons for mobile */
      .mdb-side-item > a {
        display: flex; justify-content: center; align-items: center;
        padding: 8px 16px; background: var(--gray-50); 
        border: 1px solid var(--gray-200); border-radius: 100px; 
        font-size: 14px; white-space: nowrap; color: var(--gray-600);
      }
      .mdb-side-item > a.active {
        background: var(--blue-500); border-color: var(--blue-500); color: #ffffff;
      }
      .mdb-side-item > a.active .mdb-count {
        background: rgba(255,255,255,0.2); color: #ffffff;
      }
      
      .mdb-group{padding: 0; margin-bottom: 40px;}
      .mdb-card{flex-direction:column;align-items:stretch;padding:24px 20px}
      .mdb-actions{flex-direction:row; min-width: auto; margin-top: 8px;}
      .mdb-actions .mdb-btn{flex:1; padding: 12px 16px;}
    }
"""

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()
    
# Replace the old style block entirely
content = re.sub(r'<style>.*?</style>', f'<style>\n{new_css}\n</style>', content, flags=re.DOTALL)

# Ensure the JS animation block is also intact, no changes needed for JS
# Write the new file
with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied Light Premium Clean Style!")
