import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_style = """<style>
    /* Premium Aze Design - Parallax Backgrounds with Crisp High-Contrast Cards */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    /* FIX STICKY SIDEBAR & PREVENT HORIZONTAL SCROLL */
    html, body { overflow: clip visible; scroll-behavior: smooth; }
    
    body { 
        background: #f7f9fc;
        color: var(--gray-600); 
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .navbar { background: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(24px); border-bottom: 1px solid var(--gray-200) !important; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
    .nav-links a { color: var(--gray-600) !important; transition: all 0.3s ease; font-weight: 500; }
    .nav-links a:hover, .nav-links a.active { color: var(--blue-500) !important; }
    
    .mdb-wrap { max-width: 1280px; margin: 0 auto; padding: 140px 24px 0; } 
    
    .mdb-head { text-align: center; margin-bottom: 70px; position: relative; z-index: 2; }
    .mdb-head::after {
        content: ''; position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
        width: 60px; height: 3px; background: var(--blue-500);
    }
    .mdb-head .section-tag { letter-spacing: 8px; color: var(--blue-500); font-weight: 600; text-transform: uppercase; font-size: 13px; display: inline-block; margin-bottom: 15px; }
    .mdb-head .section-title { color: var(--navy-900) !important; font-weight: 700; letter-spacing: 2px; font-size: 34px !important; margin-bottom: 16px; }
    .mdb-head .section-desc { color: var(--gray-500); font-weight: 400; font-size: 15px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    
    .mdb-layout { display: grid; grid-template-columns: 240px minmax(0,1fr); gap: 40px; align-items: start; padding-bottom: 80px; }
    
    /* Sidebar */
    .mdb-side { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 6px; background: rgba(255,255,255,0.88); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.9); border-radius: 14px; padding: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); max-height: calc(100vh - 120px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--gray-300) transparent; z-index: 10; }
    .mdb-side::-webkit-scrollbar { width: 4px; }
    .mdb-side::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 4px; }
    
    /* Restored "Wind Organ" animation for active sidebar items */
    .mdb-side>a { position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; font-size: 14.5px; color: var(--gray-500); text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 500; }
    .mdb-side>a::before { content: ''; position: absolute; left: 0; top: 0; width: 4px; height: 100%; background: var(--blue-500); transform: scaleY(0); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: center; }
    .mdb-side>a:hover { background: rgba(0,0,0,0.03); color: var(--navy-900); transform: translateX(3px); }
    .mdb-side>a.active { background: linear-gradient(90deg, rgba(37,99,235,0.08) 0%, transparent 100%); color: var(--blue-500); font-weight: 700; }
    .mdb-side>a.active::before { transform: scaleY(1); }
    
    .mdb-count { font-size: 11px; opacity: 0.9; margin-left: auto; background: var(--gray-100); padding: 2px 8px; border-radius: 12px; color: var(--gray-500); transition: all 0.3s; }
    .mdb-side>a.active .mdb-count { background: var(--blue-500); color: white; }
    
    /* Full-Width Parallax Categories */
    .mdb-group { position: relative; scroll-margin-top: 96px; margin-bottom: 0; padding: 80px 32px; border: none; border-radius: 0; z-index: 1; }
    
    /* 1. The Parallax Image stretching out of container */
    .mdb-group::before { 
        content: ''; 
        position: absolute; 
        top: 0; bottom: 0; left: -50vw; right: -50vw;
        background-image: inherit; 
        background-size: cover;
        background-position: center;
        background-attachment: fixed; 
        z-index: -2; 
    }
    
    /* 2. The Dark Overlay stretching out */
    .mdb-group::after { 
        content: ''; 
        position: absolute; 
        top: 0; bottom: 0; left: -50vw; right: -50vw;
        background: linear-gradient(180deg, rgba(8,14,28,0.7) 0%, rgba(15,32,53,0.85) 100%);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        z-index: -1; 
    }
    
    .mdb-group-head { display: flex; justify-content: space-between; align-items: center; margin: 0 0 32px; flex-wrap: wrap; gap: 10px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.2); }
    .mdb-group-head h2 { font-size: 32px; color: #fff; margin: 0; font-weight: 700; letter-spacing: 1px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .mdb-group-sub { font-size: 13px; color: var(--blue-300); font-weight: 700; margin-left: 14px; background: rgba(255,255,255,0.15); padding: 5px 12px; border-radius: 6px; letter-spacing: 0.5px; }
    
    /* Dark Glass Intro Banner (Keep it dark so it matches the background) */
    .mdb-banner { background: rgba(255,255,255,0.06); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.12); border-left: 4px solid var(--blue-500); border-radius: 12px; padding: 24px; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
    .mdb-banner-txt p { font-size: 14.5px; line-height: 1.8; color: rgba(255,255,255,0.9); margin: 0 0 12px; font-weight: 300; }
    .mdb-banner-txt p:last-child { margin-bottom: 0; }
    .mdb-banner-txt i { font-style: normal; font-size: 12px; font-weight: 600; color: #fff; background: var(--blue-500); border-radius: 4px; padding: 2px 8px; margin-right: 12px; }
    
    /* High-Contrast Bright Glassmorphism Cards */
    .mdb-card { 
        display: flex; justify-content: space-between; align-items: center; gap: 18px; 
        background: rgba(255,255,255,0.92); /* Bright background for contrast */
        backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
        border: 1px solid rgba(255,255,255,1); 
        border-radius: 14px; 
        padding: 24px 28px; 
        margin-bottom: 16px; 
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    .mdb-card:hover { 
        background: #ffffff;
        border-color: var(--blue-500); 
        transform: translateY(-4px); 
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25); 
    }
    
    .mdb-card h4 { margin: 0 0 12px; font-size: 18px; color: var(--navy-900); display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-weight: 800; letter-spacing: 0.5px; }
    .mdb-name { font-size: 14.5px; color: var(--gray-600); font-weight: 600; }
    .mdb-brand { font-size: 11px; font-weight: 700; color: var(--blue-500); background: rgba(37,99,235,0.1); border-radius: 4px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 1px; }
    
    .mdb-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .mdb-chip { font-size: 12px; color: var(--gray-600); background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 6px; padding: 4px 10px; font-weight: 500; }
    .mdb-chip i { font-style: normal; color: var(--gray-400); margin-right: 5px; font-size: 11.5px; }
    
    .mdb-actions { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
    .mdb-btn { font-size: 13.5px; text-decoration: none; text-align: center; padding: 9px 24px; border-radius: 100px; border: 1px solid var(--gray-300); color: var(--navy-900); white-space: nowrap; transition: all 0.3s ease; background: transparent; font-weight: 600; }
    .mdb-btn:hover { border-color: var(--navy-900); background: var(--gray-50); }
    
    .mdb-btn-primary { background: transparent; color: #fff; border-color: rgba(255,255,255,0.5); border-radius: 100px; padding: 10px 24px;}
    .mdb-btn-primary:hover { background: #fff; color: var(--navy-900); border-color: #fff; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(255,255,255,0.2); }
    
    .mdb-btn-quote { background: var(--navy-900); color: #fff; border-color: var(--navy-900); box-shadow: 0 4px 12px rgba(15,32,53,0.15); }
    .mdb-btn-quote:hover { background: var(--blue-500); border-color: var(--blue-500); color: #fff; box-shadow: 0 8px 25px rgba(37,99,235,0.3); transform: translateY(-2px); }
    
    .mdb-note { position: relative; z-index: 2; margin-top: 40px; font-size: 13.5px; color: var(--gray-500); line-height: 1.8; text-align: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 24px; padding-bottom: 24px;}
    .mdb-note a { color: var(--blue-500); text-decoration: none; font-weight: 600; transition: 0.3s; }
    .mdb-note a:hover { color: var(--navy-900); }
    
    @media (max-width:1023px){
      .mdb-wrap{padding-top:110px; padding-left: 16px; padding-right: 16px;}
      .mdb-layout{display:block}
      .mdb-side{position:sticky;top:60px;z-index:20;flex-direction:row;overflow-x:auto;overflow-y:hidden;gap:8px;margin-bottom:24px;padding:12px; background: rgba(255,255,255,0.98); border: 1px solid var(--gray-200); scrollbar-width:none; box-shadow: 0 6px 20px rgba(0,0,0,0.08);}
      .mdb-side::-webkit-scrollbar{display:none;}
      .mdb-side>a{flex-shrink:0;padding:8px 16px; background: var(--gray-50); border: 1px solid transparent; border-radius: 100px; font-size: 14px;}
      .mdb-side>a.active{background: var(--blue-500); color: white;}
      .mdb-side>a::before{content:none;} /* Disable wind organ line on mobile pills */
      
      .mdb-group{padding: 40px 16px; margin-bottom: 0;}
      .mdb-group::before { background-attachment: scroll; }
      .mdb-banner{padding:16px}
      .mdb-card{flex-direction:column;align-items:stretch;padding:24px 20px}
      .mdb-actions{flex-direction:row}
      .mdb-actions .mdb-btn{flex:1}
    }
</style>"""

content = re.sub(r'<style>.*?</style>', new_style, content, flags=re.DOTALL)

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)
