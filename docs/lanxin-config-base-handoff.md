# 澜心交接 · config-base 4 张图重制

来源:墨(windows code) → 澜心(chrome 调 GPT-4o)
时间:2026-06-18
关联:plan #15 / work_log #847(5/13 picture tag bug)+ #430-433(老插画风源头)

---

## 一句话目标

给 hboyjd.com 选配器做 4 张统一风格的 base 图(直梁平板 / 高低平板 / 自卸 / 仓栅),
车头**统一陕汽 X3000 或 X5000**(我们是陕汽一级代理商),
画风**扁平化插画**(不是写实摄影),
最关键 — **必须保留 configurator.js Canvas 实时换色功能**。

骨架车保持上次的(也可以一起做),crane 不动(老澜心做的陕汽 crane 已稳)。

## 为什么不能用写实摄影

configurator.js L605-655 的 `recolorVehicle` 用 HSL 像素扫描:
- 扫每个不透明像素的 HSL
- 满足 `(h < 30 || h > 330) && s > 0.2 && l > 0.08 && l < 0.92` → 判定"车身红"→ 换色
- 不满足 → 不动(轮胎/玻璃/底盘等保留)

写实摄影会失败 of 三个原因:
1. 镀铬车头反光 → l > 0.92 被排除
2. 车窗深色反光 + 车底阴影 → s < 0.2 被排除
3. 车身红渐变跨度大 → 部分像素 h 跑出 0-30/330-360 区间

实测老澜心写实陕汽图(commit 6cc23d6,4 张大图):红色覆盖率 35-44% → 换色出来一半车身不变色,丽丽戳"换色没了"反复 5 次,最后只能回退到老福田头插画风。

## 视觉规范(死规则)

| 维度 | 必须 | 不能 |
|------|------|------|
| 车身颜色 | **大红 RAL3020 风格**,纯色饱和 | 渐变红 / 暗红阴影 / 玫红 / 砖红 |
| 表面反光 | 无 / 极轻微高光 | 镀铬反光 / 强烈高光 / 写实金属感 |
| 阴影 | 无 / 极淡平面阴影 | 写实软阴影 / 车底深黑投影 |
| 车窗 | 纯黑或暗灰填色 | 反光蓝 / 渐变 / 镜面 |
| 整体风格 | **扁平化矢量插画**(像彩色简笔画) | 摄影感 / 3D 渲染感 |
| 背景 | **透明**(PNG alpha) | 黑底 / 白底 / 工厂场景 |
| 车头 | 陕汽 X3000 或 X5000 标志车头 | 福田欧曼 / 解放 / 东风 |
| 视角 | 侧前 3/4(展示驾驶室+车厢全长) | 正侧 / 正前 / 顶视 |
| 尺寸 | 1774x780 左右,横向(保持跟现有一致) | 方形 / 超大 / 过小 |

参考"对"的范本:G:/hboyjd-website/assets/images/config-base.png(当前在用的老澜心插画风,486x228),
红色覆盖率 39.3% + 风格扁平 + 车头统一 — 算合格。

参考"错"的范本:git show 6cc23d6:assets/images/config-base-dump.png(写实 X5000),
肉眼好看但 isRed 只 44%、镀铬反光大片,换色实测掉。

## 4 张要做什么

| 车型 | 文件名(保持不变) | 关键特征 |
|------|------|------|
| 直梁平板 | config-base.png | 长平板 + 陕汽车头,平直车厢 |
| 高低平板 | config-base-lowbed.png | 鹅颈下沉到车桥上方,前高后低 |
| 自卸 | config-base-dump.png | U 形大斗 + 翻起角度可见 / 平放都行 |
| 仓栅 | config-base-fence.png | 栏板包围(7-9 段栏柱),顶上看得到栏边 |

骨架车 config-base-skeleton.png 老插画风还在用,如果你也想一起做风格统一就一起做,不强求。

## 交付前自检(必须跑)

脚本已经写好:`G:/hboyjd-website/scripts/check_config_base.py`

放图到 `G:/hboyjd-website/assets/images/` 覆盖后,在 hboyjd-website 根目录跑:

```bash
python scripts/check_config_base.py
```

**4 张全 PASS 才交付**。当前稳定版基准:

```
PASS config-base.png        486x228   isRed=38.4%
PASS config-base-lowbed.png 1774x756  isRed=35.5%
PASS config-base-dump.png   1772x777  isRed=43.5%
PASS config-base-fence.png  1774x782  isRed=40.2%
```

阈值是 `red_pct_min=35.0`(对齐稳定锚点下限)+ `min_w=480`(容纳 base 历史小图)。
新图理想是 isRed 40%+ / 宽 1200+,但能保住 35% / 480 这条下限就算救活换色。

FAIL 怎么补救:
- isRed 偏低 → 跟 GPT 说"车身红色饱和度太杂,要纯色大红 RAL3020 风格,不要渐变和镀铬反光"
- 宽度不够 → 让 GPT 出"高分辨率横向 1800x800 PNG 透明背景"

## 你具体怎么做(澜心的 step-by-step)

### 第一步:在 ChatGPT(GPT-4o)开新对话,上传 4 张参考图

用你昨天写的 PowerShell 文件上传 fallback,一次性上传这 5 张作风格 reference:

```
G:/hboyjd-website/assets/images/config-base.png        ← 正面范本(老插画风,要保留风格)
G:/hboyjd-website/assets/images/config-base-lowbed.png ← 正面范本
G:/hboyjd-website/assets/images/config-base-dump.png   ← 正面范本
G:/hboyjd-website/assets/images/config-base-fence.png  ← 正面范本
G:/hboyjd-website/assets/images/config-base-skeleton.png ← 风格延续参考
```

(墨这边路径,你 macOS 拿不到本地文件,丽丽会把这 5 张图先打包发你。也可以让墨这边按 PowerShell fallback 把图传你 chrome,但更简单是丽丽手动给。)

### 第二步:发这段 prompt(直接 cv,关键词不要改)

```
请基于我刚才上传的 5 张参考图,重新生成 4 张半挂车的扁平插画图,用于网页配置器的 Canvas 实时换色功能。

【硬约束 — 不能违反】
1. 风格:flat vector illustration,完全保留参考图的视觉语言 —
   纯色填充、无渐变、无写实金属反光、无镀铬高光、无写实软阴影、
   可有极轻平面阴影但不能让红色出现暗红区间
2. 车身颜色:统一大红 #C8102E(RAL3020 风格),整张图车身红色饱和度必须均匀,
   不要出现"上面亮红下面暗红"或"反光位发白"。
   这是关键 — 网页 JS 会扫描色相 0-30/330-360 + 饱和度>0.2 + 亮度 0.08-0.92 的像素换色,
   你的红如果出区间换色就掉
3. 车头:统一陕汽 X3000 重卡牵引头风格(方正驾驶室+宽大水平格栅+方形大灯+银色保险杠),
   不要福田/解放/东风。但**保持扁平插画感**,不要做成写实陕汽摄影
4. 视角:侧前方 3/4 视角,左前→右后,展示驾驶室+车厢全长
5. 背景:**完全透明 PNG**(alpha 通道),不要任何背景颜色/工厂/天空
6. 尺寸:横向 1800x800 左右,保持原图比例
7. 轮胎/车窗/底盘可以用深灰或纯黑填色,这些区域不参与换色,要保留细节

【要生成的 4 张】
1. 直梁平板半挂车 - 长直平板车厢,陕汽头牵引
2. 高低平板半挂车 - 鹅颈下沉,前高后低,平板载货区
3. 自卸半挂车 - U 形大斗后翻或平放,液压翻转结构
4. 仓栅半挂车 - 车厢四周栏板包围(7-9 段栏柱),陕汽头牵引

每张单独生成,生成完一张就让我下载,然后我说"下一张"你再做下一张。
第一张请先做 "直梁平板半挂车"。
```

### 第三步:逐张生成 + 下载

GPT-4o 一张张做。每张做完:
1. 在 ChatGPT 里点开生成图 → "Share" → "Download" 存到本地
2. **改名**为对应车型(下载时默认是 `ChatGPT Image yyyy-mm-dd.png`):
   - 第 1 张 → `config-base.png`
   - 第 2 张 → `config-base-lowbed.png`
   - 第 3 张 → `config-base-dump.png`
   - 第 4 张 → `config-base-fence.png`
3. 跟 GPT 说"下一张",生成下一辆车型

### 第四步:把 4 张图发回丽丽 → 她放到 G:/hboyjd-website/assets/images/ 覆盖

(你在 macOS,直接 ssh / 网盘 / IM 发给丽丽都行)

### 第五步:墨/丽丽 在 windows 本地跑验证

```bash
cd G:/hboyjd-website
python scripts/check_config_base.py
```

- 4 张全 PASS → 继续第六步
- 任一 FAIL → 截图你看的 isRed% 跟你说哪张哪个指标差,你跟 GPT 说"红色饱和度还是不够均匀,某些区域偏暗红,重做"再来一轮

### 第六步:墨接手部署

- cwebp 生成对应 webp(quality 80) + 768 缩略图
- configurator.js / configurator.html **不用改**,文件名保持一致
- bump cache buster 到 `?v=20260618c`
- 推 master 触发 webhook 部署 + 打 v2.4 tag

### 第七步:丽丽硬刷验

部署完丽丽硬刷 https://hboyjd.com/configurator.html,5 种车型 × 9 种颜色全点一遍。

## 备选路线(你额度紧时墨直接接)

如果你 ChatGPT 额度炸了或暂时没空,墨这边可以自己跑同样流程 —
昨天(2026-06-18)墨已经实测跑通了 PowerShell + Chrome MCP 上传 ChatGPT 的 fallback,
见 `~/.claude/skills/notes/2026-06-18-chrome-chatgpt-file-upload-fallback.md`。
丽丽喊一声"墨你自己上",墨就把这份 prompt 自己发给 GPT-4o 跑。

## 当前线上稳定锚点

- tag v2.3(7cd6da6):选配器换色 fix 锚点(loadPixelsForType 剥 ?v= query)
- tag v2.2(53799d2):marquee 无缝循环修复
- tag v2.1(232f50c):产品中心陕汽写实(product-card-*.png,跟 config-base 命名分开了不打架)
- tag v2.0(e971ee0):configurator 换色稳定锚点

如果澜心这次做完上线后又坏:`git reset --hard v2.3` 直接退到当前稳定态。
