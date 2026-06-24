# 变体图接入 SOP · hboyjd-website

**适用范围**：选配器 #105 v3 的 `typeVariantImages` 通道——非标变体图（钩机板 / 小蜜蜂 / 三桥骨架等）从澜心 GPT-4o 出图到上线选配器的完整流程。

**为什么写这份**：第二次干这事的时候发现踩坑全都是同款（变体 key 不对齐 SPEC_SCHEMA、忘记 preload、缺 webp/thumb），落成 SOP 后下次按表走完即可。

---

## 一、命名规则

| 文件 | 命名 | 说明 |
|---|---|---|
| 原图 | `product-variant-<英文 kebab>.png` | rembg 抠图后透明背景 PNG，长边 ≤ 1600px |
| 显示用 | `product-variant-<英文 kebab>.webp` | webp quality=82 method=6，~80-90KB |
| 缩略图 | `product-variant-<英文 kebab>-thumb.webp` | 长边 400px，webp quality=78，~10-12KB |

英文 kebab 命名参考：
- 钩机板 → `excavator-bed`
- 小蜜蜂 → `small-bee`
- 三桥骨架 → `tri-axle-skeleton`
- 40英尺集装箱平板 → `40ft-container-flatbed`
- 罐式后翻 → `tank-dump`
- U型后翻 → `u-shape-dump`
- 小鹅颈侧翻 → `gooseneck-tipper`
- 集装箱不封顶(20英尺) → `open-top-container`

---

## 二、从 Downloads 到入仓的 Python 脚本

```python
from rembg import remove
from PIL import Image
import io, os

OUT = r'G:\hboyjd-website\assets\images'
files = [
    ('product-variant-<name>', r'C:\Users\mac\Downloads\product-variant-<name>.png'),
]
for name, src in files:
    with open(src, 'rb') as f:
        out = remove(f.read(), alpha_matting=True,
                     alpha_matting_foreground_threshold=240,
                     alpha_matting_background_threshold=10,
                     alpha_matting_erode_size=2)
    im = Image.open(io.BytesIO(out)).convert('RGBA')
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    w, h = im.size
    if w > 1600:
        im = im.resize((1600, int(h * 1600 / w)), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.png'), optimize=True)
    im.save(os.path.join(OUT, name + '.webp'), format='WEBP', quality=82, method=6)
    thumb = im.copy(); thumb.thumbnail((400, 400), Image.LANCZOS)
    thumb.save(os.path.join(OUT, name + '-thumb.webp'), format='WEBP', quality=78, method=6)
```

**执行环境**：`py` 启动器（系统默认 Python），pillow 12+ + rembg 2.0+。`python` 命令指向 hermes venv 没装这两个包，必须用 `py`。

---

## 三、接进选配器（4 步必做，缺一不响应）

### 步骤 1：`configurator.js` L297 `typeVariantImages` 加一条

```js
const typeVariantImages = {
    '骨架': {
        '三桥骨架': 'assets/images/product-variant-tri-axle-skeleton.webp?v=20260624a',
    },
};
```

### 步骤 2：变体 key 必须**逐字符匹配** `SPEC_SCHEMA[车型].step1.groups[].name=='variant'` 的 options

**这是头号踩坑点**。如果 SPEC_SCHEMA 里写的是 `'钩机板(挖机专用 12×3×3.3)'`（注意是中文括号、空格、半角×），typeVariantImages 的 key 也必须**一字不差**——少一个空格、把中文括号写成英文括号都不触发。

查询方式：`grep -n "name: 'variant'" configurator.js` 看对应车型那一行 options 数组的字面值。

### 步骤 3：`configurator.html` L14 加 preload

```html
<link rel="preload" as="image" href="assets/images/product-variant-<name>.webp?v=YYYYMMDDx" type="image/webp">
```

**为什么必须**：切 variant 时 vehicleImg.src 立刻换图，没 preload 会闪一下白底。

### 步骤 4：cache buster bump

新加的 webp 用本次日期 `?v=YYYYMMDD<a-z>`。同日多次推送字母递增。这一条没做对 → 浏览器命中旧缓存看不到新图。

---

## 四、可选：详情页变体卡挂图

部分 `product-*.html` 详情页 `.pf-variant-card` 是纯文本卡，没图。**保持一致性**：要么全 6 张都加图，要么都不加。只给 1/6 加会很怪。

详情页用 AI 图 vs 实拍图的总原则（丽丽 2026-06-23 定）：
- **详情页**用钉盘真实拍照（`products/<type>/01.jpg`）
- **选配器**用澜心 AI 抠图（`product-variant-*.webp`）

两个 namespace 严格分开，不混用。

---

## 五、SPEC_SCHEMA 变体名速查（截至 2026-06-24）

```
直梁平板 → ['标准直梁平板', '直梁栏板', '40英尺集装箱平板', '其他']
高低平板 → ['标准高低平板', '钩机板(挖机专用 12×3×3.3)', '高低栏板', '高低仓栏', '其他']
自卸    → ['标准后翻自卸', '小蜜蜂(7.5米轻型后翻)', '小鹅颈侧翻(13米)',
           'U型后翻(8.5米三桥)', '罐式后翻(9.6米)', '直梁侧翻', '其他']
骨架    → ['标准骨架', '三桥骨架', '两桥骨架', '集装箱不封顶(20英尺)',
           '骨架仓栏上装', '骨架侧帘上装', '骨架箱式上装', '饲料车专用', '其他']
仓栅    → ['直梁仓栏', '鹅颈仓栏(13米)', '高低仓栏', '载货车仓栏(9.6米)', '其他']
```

更新这份 schema 后必须同步更新本文档。

---

## 六、上线后验证

1. 进 hboyjd.com/configurator.html?type=skeleton
2. 选车型变种 → 三桥骨架
3. F12 Network 看 `product-variant-tri-axle-skeleton.webp` 200，不是 404
4. Devtools Application → Disable Cache 后刷新，确认 cache buster 生效

如果上线后看不到：99% 是变体 key 字面值不匹配 SPEC_SCHEMA（参考步骤 2）。

---

## 关联

- 抠图源头交接：[lanxin-variant-handoff.md](lanxin-variant-handoff.md)
- 返工反馈样例：[lanxin-variant-rework-2026-06-24.md](lanxin-variant-rework-2026-06-24.md)
- 选配器整体设计：[configurator-simplify-v0.md](configurator-simplify-v0.md)
