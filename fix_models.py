import re

def process():
    with open('models.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all groups
    groups = re.split(r'(<div class="mdb-group" id="[^"]+">)', content)
    
    new_content = groups[0]
    
    for i in range(1, len(groups), 2):
        group_tag = groups[i]
        group_body = groups[i+1]
        
        # find image
        img_match = re.search(r'<div class="mdb-banner-img"><img src="([^"]+)"[^>]*></div>', group_body)
        if img_match:
            img_src = img_match.group(1)
            # Add style to group tag
            group_tag = group_tag.replace('">', f'" style="background-image: url(\'{img_src}\')">')
            # Remove the img div
            group_body = group_body[:img_match.start()] + group_body[img_match.end():]
            
        new_content += group_tag + group_body

    # Now replace the CSS
    css_to_replace = """    .mdb-group{scroll-margin-top:96px;margin-bottom:52px}
    .mdb-group-head{display:flex;justify-content:space-between;align-items:center;margin:52px 0 14px;flex-wrap:wrap;gap:10px;border-bottom:2px solid var(--gray-200);padding-bottom:12px}
    .mdb-group-head h2{font-size:23px;color:var(--navy-900);margin:0}
    .mdb-group-sub{font-size:13px;color:var(--gray-500);font-weight:400;margin-left:12px}
    .mdb-banner{display:grid;grid-template-columns:320px minmax(0,1fr);gap:22px;background:#fff;border:1px solid var(--gray-200);border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:var(--shadow)}
    .mdb-banner-img{border-radius:10px;overflow:hidden;background:var(--gray-100);align-self:center}
    .mdb-banner-img img{width:100%;height:100%;max-height:210px;object-fit:cover;display:block}
    .mdb-banner-txt{align-self:center}
    .mdb-banner-txt p{font-size:13.5px;line-height:1.75;color:var(--gray-700);margin:0 0 8px}
    .mdb-banner-txt p:last-child{margin-bottom:0}
    .mdb-banner-txt i{font-style:normal;font-size:12px;font-weight:600;color:var(--blue-500);border:1px solid var(--blue-300);border-radius:5px;padding:1px 7px;margin-right:8px;white-space:nowrap}
    .mdb-card{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff;border:1px solid var(--gray-200);border-radius:12px;padding:16px 20px;margin-bottom:10px;transition:.15s}"""

    new_css = """    .mdb-group{position:relative;scroll-margin-top:96px;margin-bottom:48px;border-radius:20px;padding:28px 32px;background-size:cover;background-position:center;box-shadow:0 12px 36px rgba(0,0,0,0.06);overflow:hidden;border:1px solid rgba(255,255,255,0.8)}
    .mdb-group::before{content:'';position:absolute;inset:0;background:rgba(247, 249, 252, 0.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);z-index:0}
    .mdb-group > *{position:relative;z-index:1}
    .mdb-group-head{display:flex;justify-content:space-between;align-items:center;margin:0 0 20px;flex-wrap:wrap;gap:10px;border-bottom:2px solid rgba(15,23,42,0.1);padding-bottom:12px}
    .mdb-group-head h2{font-size:24px;color:var(--navy-900);margin:0;font-weight:700}
    .mdb-group-sub{font-size:13px;color:var(--blue-600);font-weight:600;margin-left:12px;background:rgba(0,195,255,0.1);padding:4px 10px;border-radius:8px}
    .mdb-banner{background:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.8);border-radius:12px;padding:20px;margin-bottom:24px;box-shadow:0 4px 12px rgba(0,0,0,0.02)}
    .mdb-banner-txt p{font-size:14px;line-height:1.75;color:var(--gray-700);margin:0 0 10px}
    .mdb-banner-txt p:last-child{margin-bottom:0}
    .mdb-banner-txt i{font-style:normal;font-size:12px;font-weight:600;color:var(--blue-600);border:1px solid rgba(0,195,255,0.3);background:rgba(0,195,255,0.05);border-radius:6px;padding:2px 8px;margin-right:10px;white-space:nowrap}
    .mdb-card{display:flex;justify-content:space-between;align-items:center;gap:18px;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.9);border-radius:12px;padding:18px 24px;margin-bottom:12px;transition:.25s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:0 4px 15px rgba(0,0,0,0.03)}"""
    
    new_content = new_content.replace(css_to_replace, new_css)
    
    # Also adjust media queries for banner
    mq_old = """    @media (max-width:1023px){
      .mdb-wrap{padding-top:110px}
      .mdb-layout{display:block}
      .mdb-side{position:sticky;top:60px;z-index:20;flex-direction:row;overflow-x:auto;gap:6px;margin-bottom:20px;padding:8px;-webkit-overflow-scrolling:touch}
      .mdb-side a{flex-shrink:0;padding:8px 13px}
      .mdb-banner{grid-template-columns:1fr;padding:12px}
      .mdb-banner-img img{max-height:180px}
      .mdb-card{flex-direction:column;align-items:stretch}
      .mdb-actions{flex-direction:row}
      .mdb-actions .mdb-btn{flex:1}
    }"""
    
    mq_new = """    @media (max-width:1023px){
      .mdb-wrap{padding-top:110px}
      .mdb-layout{display:block}
      .mdb-side{position:sticky;top:60px;z-index:20;flex-direction:row;overflow-x:auto;gap:6px;margin-bottom:20px;padding:8px;-webkit-overflow-scrolling:touch}
      .mdb-side a{flex-shrink:0;padding:8px 13px}
      .mdb-group{padding:20px 16px; margin-bottom: 32px;}
      .mdb-banner{padding:16px}
      .mdb-card{flex-direction:column;align-items:stretch;padding:16px}
      .mdb-actions{flex-direction:row}
      .mdb-actions .mdb-btn{flex:1}
    }"""
    
    new_content = new_content.replace(mq_old, mq_new)

    with open('models.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
        
process()
