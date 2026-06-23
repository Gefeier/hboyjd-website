# 澜心交接 v2 · 6 张变种产品图

来源:墨 (windows code) → 澜心 (macOS codex / chrome 调 GPT-4o)
时间:2026-06-23
关联:plan #105 (官网车型矩阵丰富) v3

---

## 背景

#105 v1+v2 已完成:选配器 SPEC_SCHEMA 加了变种字段(variant),详情页底部加了规格清单。
v3 在做:每个变种配一张 photorealistic commercial product cutout 风格的渲染图。

已上线 2 张:
- ✅ 钩机板(挖机专用 12×3×3.3 高低平板) — 月产 ~40 台
- ✅ 小蜜蜂(7.5米轻型后翻自卸) — 月产 ~130 台

剩 12 张待补,这次先做 **Top 6 关键款**。

---

## 这次要做的 6 张

按优先级排序(月产量 × 视觉辨识度):

| # | 变种 | 大类 | 月产 | 文件名(给墨入库用) |
|---|---|---|---|---|
| 1 | **小鹅颈侧翻**(13米) | 自卸 | 204 (最高频) | `product-variant-gooseneck-tipper.png` |
| 2 | **罐式后翻**(9.6米) | 自卸 | 65 | `product-variant-tank-dump.png` |
| 3 | **集装箱不封顶**(20英尺) | 骨架 | 60 | `product-variant-open-top-container.png` |
| 4 | **40英尺集装箱平板** | 直梁平板 | 59 | `product-variant-40ft-container-flatbed.png` |
| 5 | **三桥骨架** | 骨架 | 51 | `product-variant-tri-axle-skeleton.png` |
| 6 | **U型后翻**(8.5米三桥) | 自卸 | 27 | `product-variant-u-shape-dump.png` |

---

## 工作流(每张一遍)

### Step 1 · DingDrive 镜像找 reference 实拍

DingDrive 镜像本地路径(无需走 dingtalk API,直接 ls):
```
/g/DingDrive (欧阳俊丽)/湖北欧阳聚德汽车有限公司/团队文件/市场营销/产品图片合集/产品图库/
```

按变种找对应文件夹:

| 变种 | 候选 DingDrive 文件夹 |
|---|---|
| 小鹅颈侧翻 | `产品图库/自卸车/` 或搜"小鹅颈" / "侧翻" |
| 罐式后翻 | `产品图库/后翻自卸/` 或搜"罐式" |
| 集装箱不封顶 | `产品图库/8米环保集装箱/` 或 `产品图库/集装箱/` 找不封顶款 |
| 40英尺集装箱平板 | `产品图库/平板/` 或 `产品图库/集装箱/` 找 40英尺款 |
| 三桥骨架 | `产品图库/骨架/` 或 `产品图库/骨架(1)/` 找三桥款 |
| U型后翻 | `产品图库/8米后翻自卸/` 找 U 形车斗款 |

每张挑 3 张代表性角度:
- **侧前 3/4 视角**(整车形态)
- **侧面正侧**(车厢比例)
- **后部 + 桥数**(轴数验证)

拷到 `%TEMP%\hboyjd-variant-<name>-inputs\`,避免盘符路径被 ChatGPT 拒。

### Step 2 · 接续 ChatGPT 6a334bf8 对话

URL: https://chatgpt.com/c/6a334bf8-8fb8-83ee-af72-d37c5a40ee0a

对话上下文已经有:
- 5 张原始 base 参考(老澜心 4 张 + skeleton)
- 4 张陕汽 X3000 cutout 风格 base 图(flatbed/lowbed/dump/fence)
- 钩机板 cutout 图 + 小蜜蜂 cutout 图(经过 5 轮迭代)

GPT 已经知道我们的视觉规范:photorealistic commercial product cutout + 陕汽 X3000 头 + 均匀大红 #C8102E + 透明背景。

### Step 3 · prompt 模板(按变种填空)

```
继续做下一个变种:{车型中文名}({月产 N 台 · 大类特征})

我附了 3 张钉盘真实生产实拍参考,请严格按实拍特征画,不要按通用模板。

提取这些硬特征:
1. **轴数/桥数**:实拍是 {X} 桥 {Y} 胎位,严格遵守
2. **整车长度**:{N} 米,跟前几张对比保持比例
3. **车厢特征**:{车厢特有形态描述}
4. **大类底盘**:{鹅颈下沉/直梁/骨架等}
5. **红色统一**:车厢+车架+栏板全部 #C8102E,不要画暗红/灰红区
6. **陕汽 X3000 头牵引**(同前几张)

输出要求:
- 同款 photorealistic commercial product cutout 路线
- 横向 1800x800
- 透明背景 PNG(尽量真透明,墨这边 rembg 兜底)
- **静态展示态,车厢不要画后翻动作中**
- **整车一体**:陕汽头 + 半挂车一气呵成,不要分两段画

直接出图,不要解释。
```

填空提示(每变种关键)：
- 小鹅颈侧翻:鹅颈段微抬+车厢侧面有侧翻油缸/侧翻铰链,矮栏板
- 罐式后翻:车厢是圆柱形或半圆形罐体(不是方形栏板),后部带卸料口/罐口
- 集装箱不封顶:20英尺骨架+集装箱框架(立柱+底盘锁),**箱顶完全开放**
- 40英尺集装箱平板:平板 12.19米,可以载 40英尺集装箱大小
- 三桥骨架:骨架车架 + **3 桥 6 胎位**(强调,GPT 默认 2 桥)
- U型后翻:车斗横截面是 **U 形(底部圆弧)**,不是方形

### Step 4 · 下载

GPT 出图后右下角 ↓,下到 `~/Downloads/`。
告诉丽丽"第 N 张下了",墨这边接续 rembg + 入库。

### Step 5 · 验收前自检(可选)

如果想自验,跑:
```python
from PIL import Image
import colorsys
im = Image.open('~/Downloads/ChatGPT Image xxx.png').convert('RGBA')
w, h = im.size; px = im.load()
red, opaque = 0, 0
for y in range(0, h, 3):
    for x in range(0, w, 3):
        r,g,b,a = px[x,y]
        if a<50 or (r>235 and g>235 and b>235): continue
        opaque += 1
        hh,ll,ss = colorsys.rgb_to_hls(r/255,g/255,b/255)
        hd = hh*360
        if (hd<30 or hd>330) and ss>0.2 and 0.08<ll<0.92: red += 1
print(f'isRed={red*100/opaque:.1f}%')  # 需要 >= 35%
```

isRed < 35% → 车架画暗红了,跟 GPT 再说"车厢/车架饱和度跟驾驶室同一档,不要画暗红"

---

## 墨这边接手做什么(澜心不用管)

每张澜心下完丽丽通知,墨自动:
1. cp 到 `G:/hboyjd-website/tmp/config-variants/<name>/`
2. rembg isnet+alpha matting 扣底
3. isRed 验证(目标 >= 35%)
4. Pillow 生成 .webp + -thumb.webp
5. 入 `assets/images/product-variant-<name>.{png,webp,-thumb.webp}`
6. **typeVariantImages 表**加节点(configurator.js L297,**容易漏**)
7. 详情页规格卡加 `<picture>` 缩略图(已有 .pf-variant-has-image CSS 模板)
8. commit + push + cache buster bump

## 卡点 / 接手坑

- **typeVariantImages 表必填**:加新变种入库时,**必须同步加到表里**,否则选配器选 variant 不会切图(墨 a4a6b37 已经踩过这坑)
- **白底假透明**:GPT-4o 出的 PNG 常常 alpha=255 全图,看着透明其实白底。墨 rembg isnet 兜底
- **桥数错画**:GPT 默认 13米半挂车比例 3 桥,小车型(7.5/8.5米)要明确强调桥数,否则 1-2 轮 prompt 改不动

## 当前线上稳定锚点

- v2.4 (b594e46):configurator 4 张陕汽 X3000 base
- 0c5e5cb:钩机板上线
- c125c48:小蜜蜂上线
- a4a6b37:variant 切图 bug 修复

坏了 `git reset --hard a4a6b37` 退回当前稳定态。
