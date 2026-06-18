"""验证 4 张 config-base*.png 是否满足 configurator.js Canvas 换色要求。
红色像素覆盖率 ≥ 35% 才算合格(当前稳定锚点 v2.3 测得 35.5-43.5%,这是下限)。
原则:阈值跟实际跑过的稳定版本对齐,别 overshoot 把好图也判 FAIL。

2026-06-18 踩坑:GPT-4o 出图常常输出"白底假透明 PNG"(alpha=255 全图),
导致 isRed 比例被白底拉低。如果检测到白底占比 >30%,自动 rembg 扣一遍再算。"""
from PIL import Image
import colorsys, sys, os

THRESHOLDS = {'red_pct_min': 35.0, 'min_w': 480, 'white_bg_max_pct': 30.0}
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(HERE, 'assets', 'images')

files = ['config-base.png', 'config-base-lowbed.png', 'config-base-dump.png', 'config-base-fence.png']
fail = False
for f in files:
    p = os.path.join(IMG_DIR, f)
    if not os.path.exists(p):
        print(f'MISS {f}: 文件不存在')
        fail = True
        continue
    im = Image.open(p).convert('RGBA')
    w, h = im.size
    # 第一遍:检测白底假透明
    px = im.load()
    white_bg = 0; opaque_total = 0
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            r, g, b, a = px[x, y]
            if a < 10: continue
            opaque_total += 1
            if r > 235 and g > 235 and b > 235: white_bg += 1
    white_pct = white_bg * 100 / max(1, opaque_total)
    if white_pct > THRESHOLDS['white_bg_max_pct']:
        print(f'  [WARN] {f}: 白底 {white_pct:.1f}% 超阈值,自动 rembg 扣一遍...')
        try:
            from rembg import remove, new_session
            session = new_session('u2net')
            im = remove(im, session=session)
            # 覆盖原文件(危险),改成 .clean.png 旁边存
            clean_path = p.replace('.png', '-clean.png')
            im.save(clean_path)
            print(f'  扣完存到 {clean_path},请手动 mv 覆盖原文件')
            px = im.load()
        except ImportError:
            print(f'  rembg 未装,pip install rembg 后重试')
            fail = True
            continue
    # 第二遍:isRed 验证
    red = 0; opaque = 0
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            r, g, b, a = px[x, y]
            if a < 10: continue
            # 仍然 skip 白底像素(防 rembg 没扣干净)
            if r > 235 and g > 235 and b > 235: continue
            opaque += 1
            hh, ll, ss = colorsys.rgb_to_hls(r/255, g/255, b/255)
            hd = hh * 360
            if (hd < 30 or hd > 330) and ss > 0.2 and 0.08 < ll < 0.92:
                red += 1
    pct = red * 100 / max(1, opaque)
    ok_red = pct >= THRESHOLDS['red_pct_min']
    ok_size = w >= THRESHOLDS['min_w']
    status = 'PASS' if (ok_red and ok_size) else 'FAIL'
    print(f"{status} {f}: {w}x{h}, isRed={pct:.1f}% (need >={THRESHOLDS['red_pct_min']}%), 白底过滤后")
    if not (ok_red and ok_size): fail = True

sys.exit(1 if fail else 0)
