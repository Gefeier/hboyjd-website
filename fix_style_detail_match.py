import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_style = """<style>
    /* Premium Aze Design - Corporate Blue (Aligned with product-detail.css) */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    /* FIX STICKY SIDEBAR */
    html, body { overflow: clip visible; scroll-behavior: smooth; }
    
    body { 
        background: linear-gradient(180deg, #f7f9fc 0%, #eef2f8 100%);
        color: var(--gray-600); 
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .navbar { background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(24px); border-bottom: 1px solid var(--gray-200) !important; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
    .nav-links a { color: var(--gray-600) !important; transition: all 0.3s ease; font-weight: 500; }
    .nav-links a:hover, .nav-links a.active { color: var(--blue-500) !important; }
    
    .mdb-wrap { max-width: 1280px; margin: 0 auto; padding: 140px 24px 80px; }
    
    .mdb-head { text-align: center; margin-bottom: 50px; position: relative; }
    .mdb-head::after {
        content: ''; position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
        width: 60px; height: 3px; background: var(--blue-500);
    }
    .mdb-head .section-tag { letter-spacing: 8px; color: var(--blue-500); font-weight: 600; text-transform: uppercase; font-size: 13px; display: inline-block; margin-bottom: 15px; }
    .mdb-head .section-title { color: var(--navy-900) !important; font-weight: 700; letter-spacing: 2px; font-size: 34px !important; margin-bottom: 16px; }
    .mdb-head .section-desc { color: var(--gray-500); font-weight: 400; font-size: 15px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    
    .mdb-layout { display: grid; grid-template-columns: 240px minmax(0,1fr); gap: 40px; align-items: start; }
    
    /* Sidebar perfectly matching variant cards layout style */
    .mdb-side { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 6px; background: var(--white); border: 1px solid var(--gray-200); border-radius: 14px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); max-height: calc(100vh - 120px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--gray-300) transparent; }
    .mdb-side::-webkit-scrollbar { width: 4px; }
    .mdb-side::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 4px; }
    
    .mdb-side>a { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; font-size: 14.5px; color: var(--gray-500); text-decoration: none; transition: all 0.25s ease; font-weight: 500; }
    .mdb-side>a:hover { background: var(--gray-50); color: var(--navy-900); }
    .mdb-side>a.active { background: rgba(37, 99, 235, 0.08); color: var(--blue-500); font-weight: 600; }
    .mdb-count { font-size: 11px; opacity: 0.8; margin-left: auto; background: var(--gray-100); padding: 2px 8px; border-radius: 12px; color: var(--gray-500); }
    .mdb-side>a.active .mdb-count { background: var(--white); color: var(--blue-500); }
    
    /* Category Background matching .pf-hero from details page */
    .mdb-group { position: relative; scroll-margin-top: 96px; margin-bottom: 52px; border-radius: 16px; padding: 32px; background-size: cover; background-position: center; box-shadow: 0 20px 50px rgba(15, 32, 53, 0.08); overflow: hidden; border: 1px solid rgba(15, 32, 53, 0.08); }
    .mdb-group::before { 
        content: ''; position: absolute; inset: 0; 
        background: linear-gradient(180deg, rgba(8,14,28,0.75) 0%, rgba(8,14,28,0.65) 50%, rgba(15,32,53,0.85) 100%);
        z-index: 0; 
    }
    .mdb-group > * { position: relative; z-index: 1; }
    
    .mdb-group-head { display: flex; justify-content: space-between; align-items: center; margin: 0 0 24px; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 16px; }
    .mdb-group-head h2 { font-size: 26px; color: #fff; margin: 0; font-weight: 700; letter-spacing: 1px; }
    .mdb-group-sub { font-size: 13px; color: var(--blue-300); font-weight: 600; margin-left: 12px; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; }
    
    .mdb-banner { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-left: 3px solid var(--blue-500); border-radius: 10px; padding: 20px; margin-bottom: 30px; }
    .mdb-banner-txt p { font-size: 14px; line-height: 1.75; color: rgba(255,255,255,0.8); margin: 0 0 10px; font-weight: 300; }
    .mdb-banner-txt p:last-child { margin-bottom: 0; }
    .mdb-banner-txt i { font-style: normal; font-size: 12px; font-weight: 600; color: var(--blue-300); border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); border-radius: 4px; padding: 2px 8px; margin-right: 10px; }
    
    /* Cards perfectly matching .pf-variant-card */
    .mdb-card { 
        display: flex; justify-content: space-between; align-items: center; gap: 18px; 
        background: var(--white); 
        border: 1px solid rgba(15, 32, 53, 0.08); 
        border-radius: 12px; 
        padding: 20px 24px; 
        margin-bottom: 12px; 
        transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .mdb-card:hover { 
        border-color: var(--blue-500); 
        transform: translateY(-3px); 
        box-shadow: 0 14px 30px rgba(37, 99, 235, 0.12); 
    }
    
    .mdb-card h4 { margin: 0 0 10px; font-size: 17px; color: var(--gray-900); display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-weight: 700; letter-spacing: 0.5px; }
    .mdb-name { font-size: 14.5px; color: var(--gray-500); font-weight: 500; }
    .mdb-brand { font-size: 11px; font-weight: 600; color: var(--blue-500); background: rgba(37, 99, 235, 0.08); border-radius: 4px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 1px; }
    
    .mdb-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .mdb-chip { font-size: 12px; color: var(--gray-600); background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 6px; padding: 4px 10px; font-weight: 500; }
    .mdb-chip i { font-style: normal; color: var(--gray-400); margin-right: 5px; font-size: 11.5px; }
    
    /* Buttons aligned with .pf-cta-btn */
    .mdb-actions { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
    .mdb-btn { font-size: 13px; text-decoration: none; text-align: center; padding: 8px 18px; border-radius: 100px; border: 1px solid var(--gray-300); color: var(--navy-900); white-space: nowrap; transition: all 0.3s ease; background: transparent; font-weight: 600; }
    .mdb-btn:hover { border-color: var(--navy-900); background: var(--gray-50); }
    
    .mdb-btn-primary { background: transparent; color: #fff; border-color: rgba(255,255,255,0.3); border-radius: 100px; padding: 8px 20px;}
    .mdb-btn-primary:hover { background: #fff; color: var(--navy-900); border-color: #fff; transform: translateY(-1px); }
    
    .mdb-btn-quote { background: var(--navy-900); color: var(--white); border-color: var(--navy-900); box-shadow: 0 4px 12px rgba(15,32,53,0.15); }
    .mdb-btn-quote:hover { background: var(--blue-500); border-color: var(--blue-500); color: #fff; box-shadow: 0 6px 20px rgba(37,99,235,0.25); transform: translateY(-2px); }
    
    .mdb-note { margin-top: 40px; font-size: 13.5px; color: var(--gray-500); line-height: 1.8; text-align: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 24px; }
    .mdb-note a { color: var(--blue-500); text-decoration: none; font-weight: 500; transition: 0.3s; }
    .mdb-note a:hover { color: var(--navy-900); }
    
    @media (max-width:1023px){
      .mdb-wrap{padding-top:110px; padding-left: 16px; padding-right: 16px;}
      .mdb-layout{display:block}
      .mdb-side{position:sticky;top:60px;z-index:20;flex-direction:row;overflow-x:auto;overflow-y:hidden;gap:8px;margin-bottom:24px;padding:12px; background: var(--white); border: 1px solid var(--gray-200); scrollbar-width:none; box-shadow: 0 4px 16px rgba(0,0,0,0.06);}
      .mdb-side::-webkit-scrollbar{display:none;}
      .mdb-side>a{flex-shrink:0;padding:8px 16px; background: var(--gray-50); border: 1px solid transparent; border-radius: 100px; font-size: 14px;}
      .mdb-side>a:hover { background: var(--gray-100); }
      .mdb-side>a.active{background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2); color: var(--blue-500);}
      .mdb-group{padding:24px 20px; margin-bottom: 32px; border-radius: 16px;}
      .mdb-banner{padding:16px}
      .mdb-card{flex-direction:column;align-items:stretch;padding:20px}
      .mdb-actions{flex-direction:row}
      .mdb-actions .mdb-btn{flex:1}
    }
</style>"""

content = re.sub(r'<style>.*?</style>', new_style, content, flags=re.DOTALL)

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)
