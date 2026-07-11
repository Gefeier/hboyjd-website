import re

new_css = """
    /* ============================================
       Cinematic Automotive Dark Style
       (Matched with product-detail-dark.css)
       ============================================ */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&display=swap');
    
    html, body { overflow: clip visible; scroll-behavior: smooth; }
    
    body { 
        background: #050505 !important;
        color: #e2e8f0; 
        font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    /* Navbar Override */
    .navbar { background: rgba(5,5,5,0.85) !important; backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
    .nav-links a { color: rgba(255,255,255,0.8) !important; transition: all 0.3s ease; font-weight: 500; }
    .nav-links a:hover, .nav-links a.active { color: #fff !important; }
    
    .mdb-wrap { max-width: 1280px; margin: 0 auto; padding: 140px 24px 0; } 
    
    .mdb-head { text-align: center; margin-bottom: 70px; position: relative; z-index: 2; }
    .mdb-head .section-tag { letter-spacing: 6px; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 13px; display: inline-block; margin-bottom: 12px; }
    .mdb-head .section-title { color: #ffffff !important; font-weight: 800; letter-spacing: 2px; font-size: 40px !important; margin-bottom: 16px; text-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    .mdb-head .section-desc { color: #94a3b8; font-weight: 400; font-size: 15px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    
    .mdb-layout { display: grid; grid-template-columns: 260px minmax(0,1fr); gap: 40px; align-items: start; padding-bottom: 80px; }
    
    /* Cinematic Sidebar (Matched with .vh-toc) */
    .mdb-side { 
        position: sticky; top: 96px; display: flex; flex-direction: column; gap: 4px; 
        background: rgba(5,5,5,0.72); 
        border: 1px solid rgba(255,255,255,0.14); 
        border-radius: 12px; 
        padding: 16px 14px; 
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        max-height: calc(100vh - 120px); overflow-y: auto; 
        scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; z-index: 10; 
    }
    .mdb-side::-webkit-scrollbar { width: 4px; }
    .mdb-side::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    
    .mdb-side-item { display: flex; flex-direction: column; }
    .mdb-side-item > a { 
        position: relative; display: flex; justify-content: space-between; align-items: center; 
        padding: 10px 12px; border-radius: 7px; font-size: 14px; color: #cbd5e1; 
        text-decoration: none; transition: all 0.2s ease; font-weight: 500; margin-bottom: 0;
    }
    .mdb-side-item > a:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .mdb-side-item > a.active { background: #ffffff; color: #000000; font-weight: 600; }
    
    .mdb-count { font-size: 11px; margin-left: auto; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; color: #94a3b8; transition: all 0.2s; }
    .mdb-side-item > a:hover .mdb-count { color: #fff; }
    .mdb-side-item > a.active .mdb-count { background: rgba(0,0,0,0.1); color: #000000; }
    
    /* Sidebar Accordion */
    .mdb-sub-menu { 
        max-height: 0; overflow: hidden; transition: max-height 0.3s ease-in-out;
        display: flex; flex-direction: column; padding-left: 12px; margin-left: 6px; border-left: 1px solid rgba(255,255,255,0.1);
    }
    .mdb-side-item.open .mdb-sub-menu { max-height: 500px; padding-top: 6px; padding-bottom: 6px; margin-top: 4px; }
    
    .mdb-sub-link {
        font-size: 12.5px; color: #64748b; font-family: Consolas, monospace; letter-spacing: 0.5px; text-decoration: none;
        padding: 6px 12px; transition: 0.2s; border-radius: 6px; display: block;
    }
    .mdb-sub-link:hover { color: #ffffff; background: rgba(255,255,255,0.05); }
    
    /* Content Layout */
    .mdb-group { position: relative; scroll-margin-top: 96px; margin-bottom: 56px; padding: 0; border: none; }
    
    .mdb-group-head { display: flex; justify-content: space-between; align-items: center; margin: 0 0 24px; flex-wrap: wrap; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid #1e293b; }
    .mdb-group-head h2 { font-size: 28px; color: #ffffff; margin: 0; font-weight: 700; letter-spacing: 1px; }
    .mdb-group-sub { font-size: 13px; color: #cbd5e1; font-weight: 600; margin-left: 14px; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
    
    /* Cinematic Product Cards */
    .mdb-card { 
        display: flex; justify-content: space-between; align-items: center; gap: 20px; 
        background: rgba(255,255,255,0.02);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 24px 28px; 
        margin-bottom: 16px; 
        transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
    }
    .mdb-card:hover { 
        background: rgba(255,255,255,0.04);
        border-color: rgba(255,255,255,0.2);
        transform: translateY(-5px);
    }
    
    .mdb-card h4 { margin: 0 0 12px; font-size: 19px; color: #ffffff; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-weight: 600; letter-spacing: 0.5px; }
    .mdb-name { font-size: 15px; color: #94a3b8; font-weight: 400; }
    .mdb-brand { font-size: 11px; font-weight: 600; color: #e2e8f0; background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 1px; }
    
    .mdb-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .mdb-chip { font-size: 12px; color: #94a3b8; background: transparent; border: 1px solid #334155; border-radius: 6px; padding: 4px 10px; font-weight: 400; }
    .mdb-chip i { font-style: normal; color: #64748b; margin-right: 6px; font-size: 11.5px; }
    
    .mdb-actions { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; min-width: 140px; }
    .mdb-btn { font-size: 13.5px; text-decoration: none; text-align: center; padding: 10px 24px; border-radius: 100px; border: 1px solid #334155; color: #ffffff; white-space: nowrap; transition: all 0.3s ease; background: transparent; font-weight: 500; letter-spacing: 0.5px; }
    .mdb-btn:hover { border-color: #ffffff; background: rgba(255,255,255,0.05); }
    
    .mdb-btn-quote { background: #ffffff; color: #000000; border: none; font-weight: 700; }
    .mdb-btn-quote:hover { background: #e2e8f0; color: #000000; transform: scale(1.03); box-shadow: 0 0 20px rgba(255,255,255,0.15); }
    
    .mdb-note { position: relative; z-index: 2; margin-top: 40px; font-size: 13px; color: #64748b; line-height: 1.8; text-align: center; border-top: 1px solid #111; padding-top: 24px; padding-bottom: 24px;}
    .mdb-note a { color: #94a3b8; text-decoration: none; font-weight: 500; transition: 0.3s; }
    .mdb-note a:hover { color: #ffffff; text-decoration: underline; }
    
    /* --- Scroll Reveal Animations --- */
    .mdb-group-head.reveal, .mdb-banner.reveal, .mdb-card.reveal {
        opacity: 0; transform: translateY(30px);
        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .mdb-group-head.reveal.is-visible, .mdb-banner.reveal.is-visible, .mdb-card.reveal.is-visible {
        opacity: 1; transform: translateY(0);
    }
    .mdb-card.reveal.is-visible {
        transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease !important;
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
        background: rgba(5,5,5,0.9); border: 1px solid rgba(255,255,255,0.1); 
        scrollbar-width: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      .mdb-side::-webkit-scrollbar{display:none;}
      
      /* Wrapper item on mobile */
      .mdb-side-item { 
        display: inline-block; /* MUST be inline-block in flex row to prevent squishing */
        flex-shrink: 0; 
      }
      
      /* Hide the accordion submenu completely */
      .mdb-sub-menu { display: none !important; }
      
      /* Clean pill buttons for mobile */
      .mdb-side-item > a {
        display: flex; justify-content: center; align-items: center;
        padding: 8px 16px; background: rgba(255,255,255,0.05); 
        border: 1px solid rgba(255,255,255,0.1); border-radius: 100px; 
        font-size: 14px; white-space: nowrap; color: #94a3b8; margin: 0;
      }
      .mdb-side-item > a.active {
        background: #ffffff; border-color: #ffffff; color: #000000;
      }
      .mdb-side-item > a.active .mdb-count {
        background: rgba(0,0,0,0.1); color: #000000;
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

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied Cinematic Automotive Dark Style!")
