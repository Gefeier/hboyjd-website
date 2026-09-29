// Public display assets and existing configurator screen colors. No engineering data.
(() => {
  const paints = [
    ['jude-red','聚德大红 RAL3020','聚德大红','Jude Red','#c1272d'],
    ['flame-red','赤焰红 RAL3000','赤焰红','Flame Red','#af2b1e'],
    ['orange','桔红 RAL2017','桔红','Orange','#fa842b'],
    ['jude-yellow','聚德黄色 RAL1007','聚德黄','Jude Yellow','#e88c00'],
    ['white','白色 RAL9016','白色','White','#f1f0ea'],
    ['silver','银灰 RAL7040','银灰','Silver Grey','#9da1aa'],
    ['light-blue','淡蓝色 RAL5012','淡蓝色','Light Blue','#3b83bd'],
    ['dongyue-blue','东岳蓝 RAL5002','东岳蓝','Dongyue Blue','#20214f'],
    ['green','苹果绿 RAL6016','苹果绿','Apple Green','#1e5945'],
    ['black','黑色 RAL9005','黑色','Black','#0a0a0a']
  ].map(([id,name,label,labelEn,hex]) => Object.freeze({id,name,label,labelEn,hex}));
  window.OYJD_3D = Object.freeze({
    paints: Object.freeze(paints),
    models: Object.freeze({JDV9382TDP: Object.freeze({
      modelUrl:'/assets/models/jdv9382tdp-exterior-v12.glb',
      posterUrl:'/assets/images/3d/jdv9382tdp-red.webp',
      photoUrl:'/assets/images/3d/jdv9382tdp-photo.webp',
      detailUrl:'/vehicles/JDV9382TDP.html'
    })})
  });
})();
