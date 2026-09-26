# 车型外观图片与型号映射维护说明

更新日期：2026-09-26。本文记录本次本地实现及验证范围，不表示已部署。

## 范围与数据入口

本次新增或重做 **24 张 AI 外观示意图**；加上 4 个复用选项，形成 **28 个外观项**。其中 22 个外观项映射 `content/vehicles.json` 中全部 **45 款公告车型**：新图对应 36 款，复用项对应 9 款。另 6 项仅用于类别外观展示，没有绑定公告型号。

- `vehicle-visual-data.js`：唯一外观清单，包含 `id`、中英文名称、配置器 `type` / `variant`、图库 `group`、`models` 以及三个资源路径。
- `product-visuals.js` / `.css`：为中英文车型库、系列页和型号详情页接入缩略图、放大、配色与选配入口。
- `configurator.js`：读取同一清单，设置各外观变体的显示图和换色像素来源。
- `content/vehicles.json`：公告车型参数来源。图片映射不能覆盖或推导公告参数。

每张新图在 `assets/images/visuals/` 下对应三个文件：`<id>.webp` 用于显示、`<id>.png` 用于像素换色、`<id>-thumb.webp` 用于列表。24 张新图共 72 个文件；清单另引用 3 个已有文件，合计 **75 个不同资源文件**。复用项 `standard-flatbed` 与新图 `container-flatbed-40ft-v2` 共用显示资源，所以 28 个外观项不等于 28 张不同图片。

## 24 张新增或重做图片

“类别展示”表示 `models: []`，不代表新增了公告型号。表内型号映射均为外观类别示意，不是精确车型复刻。

| 外观 ID | 展示名称 | 映射公告型号 |
| --- | --- | --- |
| `straight-drop-side` | 直梁栏板 | EHJ9400LB、EHJ9400LBE |
| `drop-deck-drop-side` | 高低栏板 | 类别展示 |
| `drop-deck-stake` | 高低仓栏 | 类别展示 |
| `tandem-skeleton` | 两桥骨架 | EHJ9350TJZE、JDV9350TJZE |
| `tri-axle-skeleton-v2` | 三桥骨架 | EHJ9400TJZ、EHJ9400TJZE、EHJ9401TJZE、JDV9390TJZE |
| `container-flatbed-40ft-v2` | 40 英尺集装箱平板 | 类别展示；另供标准平板项复用 |
| `skeleton-stake` | 骨架仓栏上装 | 类别展示 |
| `curtain-container` | 骨架侧帘上装 | 类别展示 |
| `box-container` | 骨架箱式上装 · 三轴 | EHJ9400XXYE |
| `box-container-tandem` | 两轴厢式半挂车 | EHJ9350XXY |
| `rigid-stake-9m6` | 9.6 米载货车仓栏 | 类别展示 |
| `timber-semitrailer` | 运材半挂车 | EHJ9400TYC |
| `oilfield-maintenance` | 检修车 · 庆铃底盘 | JDV5040XJXQL6 |
| `oilfield-maintenance-foton` | 检修车 · 福田底盘 | JDV5041XJXFT6 |
| `rescue-pickup` | 救险车 | JDV5030XXHQL6 |
| `command-suv` | 指挥车 | JDV5030XZH |
| `detachable-refuse-truck` | 车厢可卸式垃圾车 | JDV5030ZXXSC |
| `crane-semitrailer` | 随车起重运输半挂车 | JDV9400JSQ、JDV9401JSQ、JDV9402JSQ |
| `aerial-platform` | 高空作业车 | JDV5040JGKZZ6 |
| `tank-container-chassis` | 罐箱运输骨架 | JDV9400TWY |
| `crane-truck-3axle` | 三轴随车起重运输车 | JDV5250JSQS1 |
| `communications-semitrailer` | 单轴方舱半挂车 | JDV9180XTX |
| `lowbed-3axle` | 三轴低平板 | EHJ9400TDP、JDV9380TDP、JDV9381TDP、JDV9382TDP |
| `dump-3axle` | 三轴自卸半挂车 | EHJ9400Z、EHJ9400ZHX、EHJ9401Z、EHJ9401ZHX、EHJ9402ZHX、JDV9400Z、JDV9400ZHX、EHJ9400ZZXP、EHJ9401ZZXP |

三桥骨架与 40 英尺平板已分别重做，区分空透骨架和完整铺面；不恢复此前因外形混淆而撤下的旧图。低平板、自卸与两轴厢式也使用本次核对轴数后的新图。

## 4 个复用外观项及可复用型号清单

| 外观 ID | 展示名称 | 显示资源（相对 `assets/images/`） | 映射公告型号 |
| --- | --- | --- | --- |
| `standard-flatbed` | 三轴平板 | `visuals/container-flatbed-40ft-v2.webp` | EHJ9400TPB、EHJ9400TPBE、EHJ9401TPB |
| `standard-stake` | 直梁仓栏 | `config-base-fence.webp` | EHJ9400CCY、EHJ9400CCYE、EHJ9400CCYEQ |
| `bulk-feed` | 散装饲料运输半挂车 | `vehicles/feed.webp` | EHJ9400ZSL、EHJ9405ZSLXND |
| `crane-truck-4axle` | 四轴随车起重运输车 | `vehicles/crane.webp` | JDV5310JSQS1 |

该表及上表共同构成 45 款完整映射。复用的前提是类别和轴数一致；不因同属一个系列就覆盖不同底盘、轴数或车身结构。长度、栏板分段、爬梯、门数等差异仍以对应型号的参数、实车和订单为准。

## 外观核对与 AI 示意限制

图片用于产品外观辨识、配色预览和询价入口，不能作为尺寸图、生产图、车型认证图或交付配置承诺。中英文界面均显示 AI 示意及实车、订单优先的说明。首页既有实拍产品卡继续承担实车展示；新增示意图用于车型库、系列补图、详情预览和选配。

维护时必须保留以下区别：

- 两桥骨架 `EHJ9350TJZE` / `JDV9350TJZE` 为 2 轴；`EHJ9400TJZ` / `EHJ9400TJZE` / `EHJ9401TJZE` / `JDV9390TJZE` 为 3 轴。图片不能跨这两组复用。
- 厢式 `EHJ9350XXY` 为 2 轴，`EHJ9400XXYE` 为 3 轴；`JDV9180XTX` 为 1 轴，单独使用类别示意。
- 9.6 米仓栏参考为三轴刚性载货车；随车起重半挂是三轴半挂车。二者都不能被普通半挂或刚性随车起重车替代。
- 两款检修车分别使用庆铃、福田底盘，不合并为同一张精确车型图。
- 运材 `EHJ9400TYC` 的公告为三轴、六条宽单胎。本次尚未找到可确认该型号外形的整车参考；其图仅作类别示意。单轴方舱 `JDV9180XTX` 同样未找到可确认型号外形的照片，不据此宣称具体设备配置。
- 三轴低平板共用图没有精确表达各型号爬梯差别；三轴自卸共用图也不能表达全部卸料方式与箱体结构差别。取得可用型号实拍后可继续拆分。
- 配色目前基于红色像素范围变换，属于视觉预览，并非逐部件的精确遮罩。红色灯具、反射件等像素也可能受影响；屏幕颜色不能替代实物色卡。

对照图片必须逐张看内容，不能只信目录名。例如 `assets/images/products/fence/01.webp` 实际是高低栏板实车，用作同系列参考时必须保留该说明，不能标成直梁样板型号的精确实拍。

## 3D / CAD 核查与可复用展示模型

本次搜索了网站仓库中的常见展示及工程模型扩展名：GLB、GLTF、STEP、STP、FBX、OBJ、STL、BLEND、IGES、IGS、DWG、DXF，未找到模型文件。既有资料索引中能检索到 STEP / STP 与装配体文件，但按“栏板”与 STEP / STP 联合检索尚未确认匹配本次直梁栏板样板的文件。部分文件名称仅含项目编号，因此这个结果不能解释为公司没有 CAD。

本次仅确认工程资料是否存在，没有读取或导入这些工程模型作为网站资产。营销整车参考与工程文件分开处理；不能直接把工程文件放进公开静态目录。

目前可复用的 3D 展示实现只有 **1 套直梁栏板简化外观样板**，位于 `vehicle-experience.js` 的 `createViewer()`。它使用 WebGL 几何体和独立车身材质，支持自由旋转、缩放、复位、四处局部聚焦和配色。它不是导入的 CAD，也不是 EHJ9400LB 的精确模型；24 张 AI 位图不能计作 24 套 3D 模型。

样板入口为 `/vehicle-experience.html`，英文入口加 `?lang=en`。后续如获得可用于公开展示的准确模型，可替换几何体并重设聚焦点，保留按需加载、照片回退和型号参数入口。详细维护说明见 [vehicle-experience.md](vehicle-experience.md)。

## 当前验证办法

从仓库根目录执行：

```sh
node tests/check_vehicle_visuals.js
node --check vehicle-visual-data.js
node --check product-visuals.js
node --check configurator.js
node --check vehicle-experience.js
```

映射检查当前基线：**28 个外观项、45 款公告车型映射、75 个不同资源文件、822 项检查通过**。脚本加载实际外观清单与配置器数据，检查：

- 外观 ID 和型号映射不重复，所有型号均存在公告库，45 款均有映射。
- `image`、`pixels`、`thumb` 均为站内非空文件。
- 各 `type` / `variant` 可在实际配置 schema 中选择，显示图与像素来源正确。
- 同图不混用不同公告轴数；两桥/三桥骨架、两轴/三轴厢式及单轴方舱的关键归属不变。
- 高低仓栏在“高低平板”和“仓栅”两个入口的路由一致。

该脚本验证静态数据与路由，不验证图片外形，也不证明浏览器交互已通过。每次换图需人工确认轴数、半挂/刚性车区别、透明边缘、裁切和真实参考对应关系。

浏览器复核应覆盖中文及英文车型库、系列页、型号详情；全部分类与展开/收起；放大、六色切换、图片加载失败与重试；快速切换车型后不串图；选配入口保留所选型号与变体；弹窗关闭后的焦点返回。桌面和 375 px 手机布局均要复核，3D 样板另按其维护文档检查。

本次对新增公共页面和自有脚本的文字、链接做了只读扫描，未发现内部人员称呼、本机路径、资料下载地址或私有链接。扫描结果不替代图片人工审核。以后新增参考只记录适合公开的来源描述，不把原始资料存储标识、访问凭据或操作日志写入页面。
