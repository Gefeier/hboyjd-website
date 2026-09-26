/* Reviewed appearance illustrations; not type-approval drawings. */
window.OYJD_VISUALS = (() => {
  const rows = [
    ['straight-drop-side','直梁栏板','Straight drop-side','直梁平板','直梁栏板','flatbed',['EHJ9400LB','EHJ9400LBE']],
    ['drop-deck-drop-side','高低栏板','Drop-deck drop-side','高低平板','高低栏板','lowbed',[]],
    ['drop-deck-stake','高低仓栏','Drop-deck stake','高低平板','高低仓栏','fence',[]],
    ['tandem-skeleton','两桥骨架','Tandem container chassis','骨架','两桥骨架','skeleton',['EHJ9350TJZE','JDV9350TJZE']],
    ['tri-axle-skeleton-v2','三桥骨架','Tri-axle container chassis','骨架','三桥骨架','skeleton',['EHJ9400TJZ','EHJ9400TJZE','EHJ9401TJZE','JDV9390TJZE']],
    ['container-flatbed-40ft-v2','40英尺集装箱平板','40 ft container flatbed','直梁平板','40英尺集装箱平板','flatbed',[]],
    ['skeleton-stake','骨架仓栏上装','Stake body on container chassis','骨架','骨架仓栏上装','skeleton',[]],
    ['curtain-container','骨架侧帘上装','Curtain-side container body','骨架','骨架侧帘上装','skeleton',[]],
    ['box-container','骨架箱式上装 · 三轴','Box container body · Tri-axle','骨架','骨架箱式上装','skeleton',['EHJ9400XXYE']],
    ['box-container-tandem','两轴厢式半挂车','Tandem box semi-trailer','骨架','两轴厢式上装','skeleton',['EHJ9350XXY']],
    ['rigid-stake-9m6','9.6米载货车仓栏','9.6 m rigid stake truck','仓栅','载货车仓栏(9.6米)','fence',[]],
    ['timber-semitrailer','运材半挂车','Timber semi-trailer','特种','运材半挂车','special',['EHJ9400TYC']],
    ['oilfield-maintenance','检修车 · 庆铃底盘','Maintenance truck · Qingling chassis','特种','检修车(庆铃底盘)','special',['JDV5040XJXQL6']],
    ['oilfield-maintenance-foton','检修车 · 福田底盘','Maintenance truck · Foton chassis','特种','检修车(福田底盘)','special',['JDV5041XJXFT6']],
    ['rescue-pickup','救险车','Rescue pickup','特种','救险车','special',['JDV5030XXHQL6']],
    ['command-suv','指挥车','Command vehicle','特种','指挥车','special',['JDV5030XZH']],
    ['detachable-refuse-truck','车厢可卸式垃圾车','Detachable-body refuse truck','特种','车厢可卸式垃圾车','special',['JDV5030ZXXSC']],
    ['crane-semitrailer','随车起重运输半挂车','Crane semi-trailer','特种','随车起重运输半挂车','crane',['JDV9400JSQ','JDV9401JSQ','JDV9402JSQ']],
    ['aerial-platform','高空作业车','Aerial platform truck','特种','高空作业车','special',['JDV5040JGKZZ6']],
    ['tank-container-chassis','罐箱运输骨架','Tank-container chassis','特种','罐箱运输骨架','skeleton',['JDV9400TWY']],
    ['crane-truck-3axle','三轴随车起重运输车','Tri-axle crane truck','特种','三轴随车起重运输车','crane',['JDV5250JSQS1']],
    ['communications-semitrailer','单轴方舱半挂车','Single-axle box-body trailer','特种','单轴方舱半挂车','special',['JDV9180XTX']],
    ['lowbed-3axle','三轴低平板','Tri-axle lowbed','高低平板','三轴低平板','lowbed',['EHJ9400TDP','JDV9380TDP','JDV9381TDP','JDV9382TDP']],
    ['dump-3axle','三轴自卸半挂车','Tri-axle tipping trailer','自卸','三轴自卸半挂车','dump',['EHJ9400Z','EHJ9400ZHX','EHJ9401Z','EHJ9401ZHX','EHJ9402ZHX','JDV9400Z','JDV9400ZHX','EHJ9400ZZXP','EHJ9401ZZXP']]
  ];
  const result = rows.map(([id,zh,en,type,variant,group,models]) => ({id,zh,en,type,variant,group,models,
    image:'/assets/images/visuals/'+id+'.webp', pixels:'/assets/images/visuals/'+id+'.png', thumb:'/assets/images/visuals/'+id+'-thumb.webp'}));
  const existing = [
    ['standard-flatbed','三轴平板','Tri-axle flatbed','直梁平板','标准直梁平板','flatbed',['EHJ9400TPB','EHJ9400TPBE','EHJ9401TPB'],'visuals/container-flatbed-40ft-v2'],
    ['standard-stake','直梁仓栏','Straight stake trailer','仓栅','直梁仓栏','fence',['EHJ9400CCY','EHJ9400CCYE','EHJ9400CCYEQ'],'config-base-fence'],
    ['bulk-feed','散装饲料运输半挂车','Bulk-feed semi-trailer','特种','散装饲料运输半挂车','special',['EHJ9400ZSL','EHJ9405ZSLXND'],'vehicles/feed'],
    ['crane-truck-4axle','四轴随车起重运输车','Four-axle crane truck','特种','四轴随车起重运输车','crane',['JDV5310JSQS1'],'vehicles/crane']
  ];
  existing.forEach(([id,zh,en,type,variant,group,models,path]) => result.push({id,zh,en,type,variant,group,models,
    image:'/assets/images/'+path+'.webp',pixels:'/assets/images/'+path+'.webp',thumb:'/assets/images/'+path+'.webp'}));
  return result;
})();
