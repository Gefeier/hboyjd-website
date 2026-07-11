import re

with open('models.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_style = """<style>
    /* Premium Aze Design - Airy Light & Gold Cinematic (Group BG Version) */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    /* FIX STICKY SIDEBAR */
    html, body { overflow: clip visible; scroll-behavior: smooth; }
    
    body { 
        background: #F8FAFC; 
        background-image: 
            radial-gradient(circle at 15% 50%, rgba(212, 168, 83, 0.03), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(0, 163, 255, 0.03), transparent 25%);
        color: #334155; 
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .navbar { background: rgba(255, 255, 255, 0.9) !important; backdrop-filter: blur(24px); border-bottom: 1px solid rgba(226, 232, 240, 0.8) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .nav-links a { color: #475569 !important; transition: all 0.3s ease; font-weight: 500; }
    .nav-links a:hover, .nav-links a.active { color: #D4A853 !important; }
    .nav-logo .logo-img { filter: drop-shadow(0 0 2px rgba(0,0,0,0.05)); }
    
    .mdb-wrap { max-width: 1280px; margin: 0 auto; padding: 140px 24px 80px; }
    
    .mdb-head { text-align: center; margin-bottom: 50px; position: relative; }
    .mdb-head::after {
        content: ''; position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
        width: 60px; height: 3px; background: linear-gradient(90deg, transparent, #D4A853, transparent);
    }
    .mdb-head .section-tag { letter-spacing: 8px; color: #D4A853; font-weight: 600; text-transform: uppercase; font-size: 13px; display: inline-block; margin-bottom: 15px; }
    .mdb-head .section-title { color: #0F172A !important; font-weight: 700; letter-spacing: 2px; font-size: 34px !important; margin-bottom: 16px; }
    .mdb-head .section-desc { color: #64748B; font-weight: 300; font-size: 15px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    
    .mdb-layout { display: grid; grid-template-columns: 230px minmax(0,1fr); gap: 40px; align-items: start; }
    
    .mdb-side { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 8px; background: rgba(255,255,255,0.7); border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 16px; padding: 16px; backdrop-filter: blur(20px); box-shadow: 0 4px 24px rgba(0,0,0,0.02); max-height: calc(100vh - 120px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(212,168,83,0.3) transparent; }
    .mdb-side::-webkit-scrollbar { width: 4px; }
    .mdb-side::-webkit-scrollbar-thumb { background: rgba(212,168,83,0.3); border-radius: 4px; }
    
    .mdb-side>a { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; font-size: 14.5px; color: #64748B; text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 500; position: relative; overflow: hidden; }
    .mdb-side>a::before { content: ''; position: absolute; left: 0; top: 0; width: 3px; height: 100%; background: #D4A853; transform: scaleY(0); transition: transform 0.3s ease; transform-origin: center; }
    .mdb-side>a:hover { background: rgba(248, 250, 252, 0.8); color: #0F172A; transform: translateX(4px); }
    .mdb-side>a.active { background: linear-gradient(90deg, rgba(212,168,83,0.08) 0%, transparent 100%); color: #D4A853; font-weight: 600; }
    .mdb-side>a.active::before { transform: scaleY(1); }
    .mdb-count { font-size: 11px; opacity: 0.7; margin-left: auto; background: rgba(0,0,0,0.04); padding: 2px 8px; border-radius: 12px; }
    
    /* Category Background Glassmorphism (Light version) */
    .mdb-group { position: relative; scroll-margin-top: 96px; margin-bottom: 52px; border-radius: 20px; padding: 28px 32px; background-size: cover; background-position: center; box-shadow: 0 12px 36px rgba(0,0,0,0.06); overflow: hidden; border: 1px solid rgba(255,255,255,0.6); }
    .mdb-group::before { content: ''; position: absolute; inset: 0; background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 0; }
    .mdb-group > * { position: relative; z-index: 1; }
    
    .mdb-group-head { display: flex; justify-content: space-between; align-items: center; margin: 0 0 20px; flex-wrap: wrap; gap: 10px; border-bottom: 2px solid rgba(212,168,83,0.15); padding-bottom: 12px; }
    .mdb-group-head h2 { font-size: 24px; color: #0F172A; margin: 0; font-weight: 700; letter-spacing: 1px; }
    .mdb-group-sub { font-size: 13px; color: #D4A853; font-weight: 600; margin-left: 12px; background: rgba(212,168,83,0.1); padding: 4px 10px; border-radius: 8px; }
    
    .mdb-banner { background: rgba(255,255,255,0.6); border: 1px solid rgba(226,232,240,0.8); border-left: 3px solid #D4A853; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .mdb-banner-txt p { font-size: 14px; line-height: 1.75; color: #475569; margin: 0 0 10px; font-weight: 400; }
    .mdb-banner-txt p:last-child { margin-bottom: 0; }
    .mdb-banner-txt i { font-style: normal; font-size: 12px; font-weight: 600; color: #B88A3A; border: 1px solid rgba(212,168,83,0.3); background: rgba(212,168,83,0.05); border-radius: 6px; padding: 2px 8px; margin-right: 10px; white-space: nowrap; }
    
    /* Simple Cards on Light BG */
    .mdb-card { display: flex; justify-content: space-between; align-items: center; gap: 18px; background: rgba(255,255,255,0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.9); border-radius: 12px; padding: 18px 24px; margin-bottom: 12px; transition: .25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
    .mdb-card:hover { background: #ffffff; border-color: rgba(212,168,83,0.3); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.06); }
    
    .mdb-card h4 { margin: 0 0 8px; font-size: 16.5px; color: #0F172A; display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; font-weight: 600; letter-spacing: 0.5px; }
    .mdb-name { font-size: 14px; color: #64748B; font-weight: 500; }
    .mdb-brand { font-size: 11px; color: #fff; font-weight: 600; background: #D4A853; border-radius: 4px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 1px; }
    
    .mdb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .mdb-chip { font-size: 12.5px; color: #475569; background: rgba(241,245,249,0.8); border: 1px solid rgba(226,232,240,0.8); border-radius: 7px; padding: 3px 9px; font-weight: 400; }
    .mdb-chip i { font-style: normal; color: #94A3B8; margin-right: 5px; font-size: 11px; }
    
    .mdb-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .mdb-btn { font-size: 13px; text-decoration: none; text-align: center; padding: 7px 16px; border-radius: 8px; border: 1px solid rgba(226,232,240,1); color: #475569; white-space: nowrap; transition: .15s; background: #fff; }
    .mdb-btn:hover { border-color: #CBD5E1; background: #F8FAFC; color: #0F172A; }
    
    .mdb-btn-primary { background: #F1F5F9; color: #334155; border-color: rgba(226,232,240,1); }
    .mdb-btn-primary:hover { background: #E2E8F0; color: #0F172A; }
    
    .mdb-btn-quote { background: linear-gradient(135deg, #D4A853 0%, #B88A3A 100%); color: #fff; border: none; font-weight: 600; box-shadow: 0 4px 15px rgba(212,168,83,0.25); }
    .mdb-btn-quote:hover { background: linear-gradient(135deg, #E5B865 0%, #D4A853 100%); box-shadow: 0 6px 20px rgba(212,168,83,0.4); transform: translateY(-1px); color: #fff; border-color: transparent;}
    
    .mdb-note { margin-top: 30px; font-size: 13px; color: #94A3B8; line-height: 1.8; text-align: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 20px; }
    .mdb-note a { color: #D4A853; text-decoration: none; transition: 0.3s; }
    .mdb-note a:hover { color: #B88A3A; }
    
    @media (max-width:1023px){
      .mdb-wrap{padding-top:110px; padding-left: 16px; padding-right: 16px;}
      .mdb-layout{display:block}
      .mdb-side{position:sticky;top:60px;z-index:20;flex-direction:row;overflow-x:auto;overflow-y:hidden;gap:6px;margin-bottom:20px;padding:8px;-webkit-overflow-scrolling:touch;background: rgba(255,255,255,0.95); border: 1px solid rgba(226,232,240,0.8); scrollbar-width:none; box-shadow: 0 4px 12px rgba(0,0,0,0.05);}
      .mdb-side::-webkit-scrollbar{display:none;}
      .mdb-side>a{flex-shrink:0;padding:8px 13px; background: rgba(248,250,252,0.8); border: 1px solid transparent;}
      .mdb-side>a::before{content:none;}
      .mdb-side>a.active{background: rgba(212,168,83,0.08); border: 1px solid rgba(212,168,83,0.2);}
      .mdb-group{padding:20px 16px; margin-bottom: 32px;}
      .mdb-banner{padding:16px}
      .mdb-card{flex-direction:column;align-items:stretch;padding:16px}
      .mdb-actions{flex-direction:row}
      .mdb-actions .mdb-btn{flex:1}
    }
</style>"""

content = re.sub(r'<style>.*?</style>', new_style, content, flags=re.DOTALL)

with open('models.html', 'w', encoding='utf-8') as f:
    f.write(content)
