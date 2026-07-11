import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_style = """<style>
    /* Premium Aze Design - Dark Obsidian Automotive (Tesla/Porsche Vibe) */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    /* FIX STICKY SIDEBAR & PREVENT HORIZONTAL SCROLL */
    html, body { overflow: clip visible; scroll-behavior: smooth; }
    
    body { 
        background: #080c16; /* Deep space showroom floor */
        color: rgba(255,255,255,0.7); 
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    /* Dark Mode Navbar */
    .navbar { background: rgba(10, 14, 23, 0.95) !important; backdrop-filter: blur(24px); border-bottom: 1px solid rgba(255,255,255,0.08) !important; box-shadow: 0 4px 30px rgba(0,0,0,0.5); }
    .nav-links a { color: rgba(255,255,255,0.75) !important; transition: all 0.3s ease; font-weight: 500; }
    .nav-links a:hover, .nav-links a.active { color: #fff !important; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
    
    .mdb-wrap { max-width: 1280px; margin: 0 auto; padding: 140px 24px 0; } 
    
    .mdb-head { text-align: center; margin-bottom: 70px; position: relative; z-index: 2; }
    .mdb-head::after {
        content: ''; position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
        width: 60px; height: 3px; background: var(--blue-500); box-shadow: 0 0 10px var(--blue-500);
    }
    .mdb-head .section-tag { letter-spacing: 8px; color: var(--blue-400); font-weight: 600; text-transform: uppercase; font-size: 13px; display: inline-block; margin-bottom: 15px; }
    .mdb-head .section-title { color: #ffffff !important; font-weight: 700; letter-spacing: 2px; font-size: 34px !important; margin-bottom: 16px; }
    .mdb-head .section-desc { color: rgba(255,255,255,0.6); font-weight: 400; font-size: 15px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    
    .mdb-layout { display: grid; grid-template-columns: 240px minmax(0,1fr); gap: 40px; align-items: start; padding-bottom: 80px; }
    
    /* Obsidian Tinted Glass Sidebar */
    .mdb-side { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 6px; background: rgba(10, 15, 25, 0.6); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-top: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); max-height: calc(100vh - 120px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent; z-index: 10; }
    .mdb-side::-webkit-scrollbar { width: 4px; }
    .mdb-side::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
    
    /* Wind Organ animation for active sidebar items */
    .mdb-side>a { position: relative; overflow: hidden; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 8px; font-size: 14.5px; color: rgba(255,255,255,0.6); text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 500; }
    .mdb-side>a::before { content: ''; position: absolute; left: 0; top: 0; width: 3px; height: 100%; background: var(--blue-500); box-shadow: 0 0 8px var(--blue-500); transform: scaleY(0); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: center; }
    .mdb-side>a:hover { background: rgba(255,255,255,0.05); color: #fff; transform: translateX(3px); }
    .mdb-side>a.active { background: linear-gradient(90deg, rgba(37,99,235,0.15) 0%, transparent 100%); color: #fff; font-weight: 600; text-shadow: 0 0 10px rgba(255,255,255,0.2); }
    .mdb-side>a.active::before { transform: scaleY(1); }
    
    .mdb-count { font-size: 11px; opacity: 0.9; margin-left: auto; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; color: rgba(255,255,255,0.7); transition: all 0.3s; }
    .mdb-side>a.active .mdb-count { background: var(--blue-500); color: white; box-shadow: 0 0 8px rgba(37,99,235,0.5); }
    
    /* Full-Width Parallax Categories */
    .mdb-group { position: relative; scroll-margin-top: 96px; margin-bottom: 0; padding: 80px 32px; border: none; border-radius: 0; z-index: 1; }
    
    /* The Parallax Image */
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
    
    /* The Dark Overlay (Deep Cinematic) */
    .mdb-group::after { 
        content: ''; 
        position: absolute; 
        top: 0; bottom: 0; left: -50vw; right: -50vw;
        background: linear-gradient(180deg, rgba(4,7,14,0.75) 0%, rgba(8,12,22,0.9) 100%);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        z-index: -1; 
    }
    
    .mdb-group-head { display: flex; justify-content: space-between; align-items: center; margin: 0 0 32px; flex-wrap: wrap; gap: 10px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.15); }
    .mdb-group-head h2 { font-size: 32px; color: #fff; margin: 0; font-weight: 700; letter-spacing: 1.5px; text-shadow: 0 4px 15px rgba(0,0,0,0.5); }
    .mdb-group-sub { font-size: 13px; color: var(--blue-400); font-weight: 600; margin-left: 14px; background: rgba(37,99,235,0.15); border: 1px solid rgba(37,99,235,0.3); padding: 5px 12px; border-radius: 4px; letter-spacing: 1px; }
    
    /* Intro Banner */
    .mdb-banner { background: rgba(255,255,255,0.02); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.05); border-left: 3px solid var(--blue-500); border-radius: 8px; padding: 24px; margin-bottom: 40px; }
    .mdb-banner-txt p { font-size: 14.5px; line-height: 1.8; color: rgba(255,255,255,0.7); margin: 0 0 12px; font-weight: 300; }
    .mdb-banner-txt p:last-child { margin-bottom: 0; }
    .mdb-banner-txt i { font-style: normal; font-size: 12px; font-weight: 600; color: #fff; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 2px 8px; margin-right: 12px; }
    
    /* Dark Obsidian Glassmorphism Cards */
    .mdb-card { 
        display: flex; justify-content: space-between; align-items: center; gap: 18px; 
        background: rgba(15, 20, 31, 0.75); /* Dark Tinted Glass */
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.08); 
        border-top: 1px solid rgba(255,255,255,0.15); /* Specular highlight */
        border-radius: 8px; 
        padding: 24px 28px; 
        margin-bottom: 16px; 
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease, background 0.4s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .mdb-card:hover { 
        background: rgba(22, 30, 46, 0.95);
        border-color: rgba(255,255,255,0.25); 
        transform: translateY(-4px) scale(1.01); 
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(37,99,235,0.1); 
    }
    
    .mdb-card h4 { margin: 0 0 12px; font-size: 18px; color: #ffffff; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-weight: 700; letter-spacing: 1px; }
    .mdb-name { font-size: 14.5px; color: rgba(255,255,255,0.6); font-weight: 400; }
    .mdb-brand { font-size: 11px; font-weight: 600; color: #fff; background: var(--blue-600); border-radius: 3px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 8px rgba(37,99,235,0.4); }
    
    .mdb-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .mdb-chip { font-size: 12px; color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 4px 10px; font-weight: 400; }
    .mdb-chip i { font-style: normal; color: var(--blue-400); margin-right: 6px; font-size: 11.5px; }
    
    .mdb-actions { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; }
    .mdb-btn { font-size: 13.5px; text-decoration: none; text-align: center; padding: 9px 24px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); color: #fff; white-space: nowrap; transition: all 0.3s ease; background: transparent; font-weight: 500; letter-spacing: 1px; }
    .mdb-btn:hover { border-color: #fff; background: rgba(255,255,255,0.1); }
    
    .mdb-btn-primary { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.2); border-radius: 4px; padding: 10px 24px;}
    .mdb-btn-primary:hover { background: rgba(255,255,255,0.2); color: #fff; border-color: rgba(255,255,255,0.4); }
    
    .mdb-btn-quote { background: var(--blue-600); color: #fff; border-color: var(--blue-600); box-shadow: 0 4px 15px rgba(37,99,235,0.3); border-radius: 4px; }
    .mdb-btn-quote:hover { background: var(--blue-500); border-color: var(--blue-500); color: #fff; box-shadow: 0 6px 20px rgba(37,99,235,0.5); transform: translateY(-2px); }
    
    .mdb-note { position: relative; z-index: 2; margin-top: 40px; font-size: 13.5px; color: rgba(255,255,255,0.4); line-height: 1.8; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; padding-bottom: 24px;}
    .mdb-note a { color: var(--blue-400); text-decoration: none; font-weight: 500; transition: 0.3s; }
    .mdb-note a:hover { color: #fff; }
    
    @media (max-width:1023px){
      .mdb-wrap{padding-top:110px; padding-left: 16px; padding-right: 16px;}
      .mdb-layout{display:block}
      .mdb-side{position:sticky;top:60px;z-index:20;flex-direction:row;overflow-x:auto;overflow-y:hidden;gap:8px;margin-bottom:24px;padding:12px; background: rgba(10, 15, 26, 0.95); border: 1px solid rgba(255,255,255,0.1); scrollbar-width:none; box-shadow: 0 10px 30px rgba(0,0,0,0.5);}
      .mdb-side::-webkit-scrollbar{display:none;}
      .mdb-side>a{flex-shrink:0;padding:8px 16px; background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 6px; font-size: 14px;}
      .mdb-side>a.active{background: rgba(37,99,235,0.2); border: 1px solid rgba(37,99,235,0.4); color: white;}
      .mdb-side>a::before{content:none;}
      
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
