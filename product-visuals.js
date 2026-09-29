(() => {
  'use strict';
  const assets = window.OYJD_VISUALS || [];
  if (!assets.length) return;
  const en = document.documentElement.lang.startsWith('en');
  const t = (zh, english) => en ? english : zh;
  const name = a => en ? a.en : a.zh;
  const note = t('AI 外观示意 · 颜色仅供参考，外形与配置以实车及订单为准。','AI appearance illustration. Colours are indicative; actual vehicles and agreed specifications take precedence.');
  const viewerURL = '/vehicle-experience.html' + (en ? '?lang=en' : '');
  const lowbedViewerURL = '/vehicle-experience.html?' + new URLSearchParams({model:'JDV9382TDP',...(en ? {lang:'en'} : {})});
  const byModel = model => assets.find(a => a.models.includes(model));
  const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text) n.textContent = text; return n; };
  const link = (text, href) => { const n = el('a','pv-link',text); n.href = href; return n; };
  function previewButton(a, cls = 'pv-card-preview', modelID = '') {
    const b = el('button', cls); b.type = 'button';
    if (modelID) b.dataset.model = modelID;
    b.setAttribute('aria-label', t('查看','Preview ') + name(a) + t('外观与配色',' appearance and colours'));
    const img = el('img'); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    const fallbackSources = [...new Set([a.thumb, a.image, a.pixels].filter(Boolean))];
    let fallbackIndex = 0;
    img.addEventListener('error', () => {
      if (++fallbackIndex < fallbackSources.length) img.src = fallbackSources[fallbackIndex];
      else { img.hidden = true; b.classList.add('pv-image-unavailable'); }
    });
    img.src = fallbackSources[0];
    b.append(img, el('span','',t('AI 示意 · 放大 / 换色 ↗','AI illustration · Zoom / Colour ↗')));
    b.addEventListener('click', () => openPreview(a,b)); return b;
  }
  document.querySelectorAll('.mdb-card').forEach(card => {
    const href = card.querySelector('a[href*="vehicles/"]')?.getAttribute('href');
    const a = href && byModel(href.match(/vehicles\/([^/]+)\.html/)?.[1]);
    if (a) card.prepend(previewButton(a,'pv-card-preview',href.match(/vehicles\/([^/]+)\.html/)?.[1]));
    if (href?.match(/vehicles\/JDV9382TDP\.html/)) card.append(link(t('低平板 · 3D 看车 ↗','Low-bed · Explore in 3D ↗'),lowbedViewerURL));
  });
  const model = location.pathname.match(/\/vehicles\/([^/]+)\.html/)?.[1];
  const a = model && byModel(model);
  if (a) {
    const section = el('section','pv-detail'); const copy = el('div');
    copy.append(el('span','pv-kicker','COLOUR & FORM'),el('h2','',t('看看它的另一种颜色','Explore its colours')),el('p','pv-note',note));
    if (/^EHJ9400LB/.test(model) || model === 'JDV9382TDP') {const actions=el('div','pv-detail-actions'); actions.append(link(t('360° 互动看车 ↗','Explore in 3D ↗'),model === 'JDV9382TDP' ? lowbedViewerURL : viewerURL)); copy.append(actions);}
    section.append(copy,previewButton(a,'pv-card-preview',model)); document.querySelector('.vh-photo')?.after(section);
  }
  const group = location.pathname.match(/product-([^/]+)\.html/)?.[1];
  if (group) {
    const rules = [
      [/直梁栏板|Straight.*drop.side/i,'straight-drop-side'],[/40英尺|40 ft/i,'container-flatbed-40ft-v2'],
      [/高低栏板|Drop.deck.*drop.side/i,'drop-deck-drop-side'],[/高低仓栏|Drop.deck.*stake/i,'drop-deck-stake'],
      [/三桥骨架|Tri.axle.*chassis/i,'tri-axle-skeleton-v2'],[/两桥骨架|Tandem.*chassis/i,'tandem-skeleton'],
      [/骨架仓栏|Stake body/i,'skeleton-stake'],[/侧帘|Curtain/i,'curtain-container'],[/箱式上装|Box.*body/i,'box-container'],
      [/9.6米.*仓栏|9.6 m.*stake/i,'rigid-stake-9m6']
    ];
    document.querySelectorAll('.pf-variant-card').forEach(card => {
      if(card.querySelector('img')) return;
      const detailLink = card.matches('a[href*="vehicles/"]') ? card : card.querySelector('a[href*="vehicles/"]');
      const href=detailLink?.getAttribute('href');
      const label=card.querySelector('.pf-variant-name')?.textContent || card.textContent;
      const match=rules.find(([re])=>re.test(label));
      const asset=card.dataset.visualId
        ? assets.find(a=>a.id===card.dataset.visualId)
        : href ? byModel(href.match(/vehicles\/([^/]+)\.html/)?.[1]) : assets.find(a=>a.id===match?.[1]);
      if(asset) {
        const preview = previewButton(asset,'pv-series-image',href?.match(/vehicles\/([^/]+)\.html/)?.[1]);
        // A whole-card detail link must not contain another interactive control.
        if (card.tagName === 'A') {
          const wrapper = el('div', card.className);
          card.replaceWith(wrapper); card.className = 'pv-series-link';
          wrapper.append(preview,card);
        } else card.prepend(preview);
      }
    });
  }
  // One gallery makes shape variants discoverable without pretending each is an approval model.
  const anchor = document.querySelector('.mdb-head');
  if(anchor) {
    const gallery=el('section','pv-gallery'); gallery.id='appearance-gallery';
    const head=el('div','pv-heading'), copy=el('div');
    copy.append(el('span','pv-kicker','VISUAL COLLECTION'),el('h2','',t('先看外观，再选车型','Explore the shape. Find your vehicle.')),el('p','',note));
    head.append(copy,link(t('栏板半挂车 · 360° 互动 ↗','Drop-side trailer · Explore in 3D ↗'),viewerURL));
    head.append(link(t('JDV9382TDP 低平板 · 3D 看车 ↗','JDV9382TDP low-bed · Explore in 3D ↗'),lowbedViewerURL));
    const filters=el('div','pv-filters'); filters.setAttribute('role','group'); filters.setAttribute('aria-label',t('外观分类','Filter appearances'));
    const grid=el('div','pv-grid');grid.id='appearance-grid';
    const galleryActions=el('div','pv-gallery-actions');
    const expand=el('button','pv-view-button');expand.type='button';expand.setAttribute('aria-controls',grid.id);
    let filter='all',expanded=false;
    function updateGallery() {
      grid.querySelectorAll('[data-group]').forEach((tile,index)=>{
        tile.hidden=filter==='all' ? (!expanded&&index>=8) : tile.dataset.group!==filter;
      });
      expand.hidden=filter!=='all'||assets.length<=8;
      expand.setAttribute('aria-expanded',String(expanded));
      expand.textContent=expanded?t('收起外观 ↑','Show fewer ↑'):t(`展开全部外观（${assets.length}） ↓`,`Show all ${assets.length} appearances ↓`);
    }
    expand.addEventListener('click',()=>{expanded=!expanded;updateGallery();});
    galleryActions.append(expand);
    const modelLibrary=document.querySelector('.mdb-layout');
    if(modelLibrary){
      if(!modelLibrary.id)modelLibrary.id='approved-models';
      modelLibrary.tabIndex=-1;
      galleryActions.append(link(t('查看 45 款公告车型 →','Browse 45 approved vehicle models →'),'#'+modelLibrary.id));
    }
    const groups=[['all','全部','All'],['flatbed','平板 / 栏板','Flatbed / Drop-side'],['dump','自卸','Tipper'],['lowbed','高低平板','Drop-deck'],['fence','仓栏','Stake'],['skeleton','集装箱 / 骨架','Container / Chassis'],['special','专用车','Special purpose'],['crane','随车起重','Crane']];
    for(const [key,zh,english] of groups) { const b=el('button','',t(zh,english)); b.type='button'; b.setAttribute('aria-pressed',String(key==='all')); b.addEventListener('click',()=>{filter=key;expanded=false;filters.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateGallery();});filters.append(b);}
    for(const a of assets) {const b=previewButton(a,'pv-tile');b.dataset.group=a.group; b.insertBefore(el('strong','',name(a)),b.lastChild); grid.append(b);}
    updateGallery();gallery.append(head,filters,grid,galleryActions); anchor.after(gallery);
  }
  const dialog=el('dialog','pv-dialog'); dialog.setAttribute('aria-labelledby','pvTitle'); dialog.setAttribute('aria-describedby','pvNote');
  const header=el('div','pv-modal-head'),title=el('h2');title.id='pvTitle';
  const close=el('button','pv-close','×');close.type='button';close.setAttribute('aria-label',t('关闭预览','Close preview'));close.addEventListener('click',()=>dialog.close());header.append(title,close);
  const stage=el('div','pv-stage'), image=el('img'); image.decoding='async';
  const imageError=el('div','pv-image-error'); imageError.hidden=true;
  const retry=el('button','pv-view-button',t('重新载入图片','Retry image'));retry.type='button';
  imageError.append(el('p','',t('图片暂时无法显示。','This image is currently unavailable.')),retry);stage.append(image,imageError);
  const foot=el('div','pv-modal-footer'),status=el('p','pv-status');status.setAttribute('role','status');
  const palette=el('div','pv-palette'),colorLabel=el('span','pv-color-name');palette.setAttribute('role','group');palette.setAttribute('aria-label',t('车身颜色','Body colour'));
  const colors=[['#c8102e','聚德红','Red',null],['#2678c7','蓝色','Blue',[210,.65,1]],['#e5af21','黄色','Yellow',[44,.9,1.1]],['#d9dde2','银灰','Silver',[220,.04,1.45]],['#f4f4f2','白色','White',[0,.02,1.9]],['#25292d','黑色','Black',[0,.02,.3]]];
  let active, pixelPromise, requestId=0, invoker;
  colors.forEach(([hex,zh,english],index)=>{const b=el('button','pv-swatch');b.type='button';b.style.setProperty('--paint',hex);b.setAttribute('aria-label',t(zh,english));b.setAttribute('aria-pressed',String(index===0));b.addEventListener('click',()=>applyColour(index));palette.append(b);});palette.append(colorLabel);
  const actions=el('div','pv-modal-links'),zoom=el('button','pv-view-button',t('放大查看','Zoom in'));zoom.type='button';zoom.setAttribute('aria-pressed','false');zoom.addEventListener('click',()=>{const on=stage.classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(on));zoom.textContent=on?t('还原全车','Fit vehicle'):t('放大查看','Zoom in');});
  const configure=link(t('选配此款外观 →','Configure this appearance →'),'#'),three=link(t('360° 互动 ↗','Explore in 3D ↗'),viewerURL);actions.append(zoom,configure,three);
  const modalNote=el('p','pv-note',note);modalNote.id='pvNote';
  foot.append(modalNote,palette,status,actions);dialog.append(header,stage,foot);document.body.append(dialog);
  dialog.addEventListener('close',()=>{++requestId;stage.removeAttribute('aria-busy');document.body.classList.remove('pv-modal-open');if(invoker?.isConnected)invoker.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  function selectColour(index) {
    palette.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    colorLabel.textContent=t(colors[index][1],colors[index][2]);
  }
  function openPreview(asset,button) {
    ++requestId;active=asset;pixelPromise=null;invoker=button;title.textContent=name(asset);
    image.hidden=true;image.removeAttribute('src');image.alt=name(asset)+' · '+t('AI 外观示意','AI appearance illustration');imageError.hidden=true;
    status.textContent='';selectColour(0);stage.classList.remove('is-zoomed');stage.scrollTop=0;stage.scrollLeft=0;
    zoom.disabled=true;zoom.textContent=t('放大查看','Zoom in');zoom.setAttribute('aria-pressed','false');
    const params = {type:asset.type,variant:asset.variant};
    if(button.dataset.model) params.model=button.dataset.model;
    configure.href='/configurator.html?'+new URLSearchParams(params);
    const isReviewedLowbed=button.dataset.model==='JDV9382TDP';
    three.hidden=asset.id!=='straight-drop-side'&&!isReviewedLowbed;
    three.href=isReviewedLowbed?lowbedViewerURL:viewerURL;
    dialog.showModal();document.body.classList.add('pv-modal-open');dialog.scrollTop=0;close.focus();applyColour(0);
  }
  retry.addEventListener('click',()=>applyColour(0));
  async function applyColour(index) {
    if (!active || !dialog.open) return;
    const id=++requestId, asset=active, target=colors[index][3];
    imageError.hidden=true;stage.setAttribute('aria-busy','true');
    status.textContent=target?t('正在应用颜色…','Applying colour…'):t('正在载入图片…','Loading image…');
    try {
      let loaded;
      if (!target) loaded=await loadFirstImage([asset.image,asset.pixels,asset.thumb]);
      else {
        const pixels=await pixelsFor(asset);
        if(id!==requestId||!dialog.open)return;
        loaded=await loadFirstImage([recolour(pixels,target)]);
      }
      if(id!==requestId||!dialog.open)return;
      image.src=loaded.src;image.hidden=false;zoom.disabled=false;selectColour(index);status.textContent='';
    } catch {
      if(id!==requestId||!dialog.open)return;
      // Leave both the previous image and its selected swatch intact on failure.
      if(image.hidden){imageError.hidden=false;zoom.disabled=true;}
      status.textContent=target?t('配色暂时加载失败，已保留当前图片，请重试。','Colour preview failed. The current image has been kept; please retry.'):t('图片暂时加载失败，请重试。','Unable to load the image. Please retry.');
    } finally {if(id===requestId)stage.removeAttribute('aria-busy');}
  }
  function pixelsFor(asset) {
    if(!pixelPromise){
      const pending=loadFirstImage([asset.pixels,asset.image]).then(img=>{
        const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
        const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Canvas unavailable');
        ctx.drawImage(img,0,0);return ctx.getImageData(0,0,c.width,c.height);
      });
      pixelPromise=pending;pending.catch(()=>{if(pixelPromise===pending)pixelPromise=null;});
    }
    return pixelPromise;
  }
  async function loadFirstImage(sources) {
    for(const src of [...new Set(sources.filter(Boolean))]) {
      try {return await new Promise((resolve,reject)=>{
        const img=new Image();img.decoding='async';
        const timer=setTimeout(()=>{img.onload=img.onerror=null;reject(new Error('Image timeout'));},20000);
        img.onload=()=>{clearTimeout(timer);img.onload=img.onerror=null;img.naturalWidth?resolve(img):reject(new Error('Empty image'));};
        img.onerror=()=>{clearTimeout(timer);img.onload=img.onerror=null;reject(new Error('Image unavailable'));};img.src=src;
      });}catch{/* Try a same-asset fallback, never another vehicle. */}
    }
    throw new Error('No available image');
  }
  function recolour(source,[h,s,mul]) {const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d'),out=new ImageData(new Uint8ClampedArray(source.data),source.width,source.height),d=out.data;
    for(let i=0;i<d.length;i+=4){if(d[i+3]<10)continue;const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;if(!delta)continue;const sat=delta/(1-Math.abs(2*l-1)),hue=max===r?((g-b)/delta+6)%6*60:max===g?((b-r)/delta+2)*60:((r-g)/delta+4)*60;if((hue<20||hue>340)&&sat>.35&&l>.05&&l<.75){const light=Math.min(.97,Math.max(.02,l*mul)),c=(1-Math.abs(2*light-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=light-c/2;const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];for(let j=0;j<3;j++)d[i+j]=Math.round((rgb[j]+m)*255);}}
    ctx.putImageData(out,0,0);return canvas.toDataURL('image/png');
  }
})();
