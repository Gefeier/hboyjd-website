"""DeepSeek 起稿 — 创作工坊 AI 主笔模式。
凭证: 环境变量 DEEPSEEK_API_KEY (或 OPENAI_API_KEY 兼容)
端点: DEEPSEEK_BASE_URL 默认 https://api.deepseek.com/v1
模型: DEEPSEEK_MODEL 默认 deepseek-chat

API:
- draft_field: v1 单字段起稿 (兼容旧 workshop)
- draft_full: v2 全文起稿 - 接素材 (文本 + 图 URL + 意图) 返回 {category, title, summary, html}
- revise: v2 修订 - 接当前 HTML + 指令, 返回新 HTML (可选 title/summary)
"""
from __future__ import annotations

import html
import json
import os
import re
import urllib.request
import urllib.error


def _safe_attr(s: str) -> str:
    return html.escape(str(s), quote=True)


DEEPSEEK_BASE = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1").rstrip("/")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")


def _get_api_key() -> str:
    return os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY") or ""


SYSTEM_PROMPT = """你是欧阳聚德汽车(湖北半挂车制造商)的资深公众号文案。
品牌定位:中国湖北半挂车 SMB,产品扎实,客户多为外贸/批量/政企。
调性: 真诚专业、不喊价、不堆术语、不夸大资质。叙述像同行讲述,不像广告。

工作: 用户会指定一个推文模板和一个具体字段,请按用户提供的关键信息,生成该字段的正文(只写该字段内容,不要加额外段落/标题以外的元素,不要复述提示)。

约束:
- 严禁喊价(避免"4.8万/特价/清仓"这种)
- 严禁工艺细节(具体焊接参数/钢板牌号等不写)
- 中文,简体
- 字数按 hint 给的范围
- markdown 字段可用 ## ### **粗体** - 列表 等基本元素
"""


def draft_field(template_id: str, field_key: str, field_label: str,
                field_hint: str, user_input: str,
                category: str = "", context: dict | None = None) -> str:
    api_key = _get_api_key()
    if not api_key:
        # 没配 key 时返回提示而不是炸
        return (f"[DeepSeek 未配置]\n"
                f"请在 admin-backend.service 的 Environment= 加 DEEPSEEK_API_KEY=...\n"
                f"或先用以下信息手动撰写:\n• 模板: {template_id}\n• 字段: {field_label}\n• 你给的素材: {user_input}\n"
                f"• 字段提示: {field_hint}")

    ctx_lines = []
    if context:
        for k, v in context.items():
            if not v: continue
            if isinstance(v, list): v = '(图集 ' + str(len(v)) + ' 张)'
            sv = str(v)
            if len(sv) > 200: sv = sv[:200] + '…'
            ctx_lines.append(f"- {k}: {sv}")

    user_prompt = f"""模板: {template_id} | 分类: {category}
请生成字段「{field_label}」的内容。

字段写法 hint: {field_hint or '(无)'}

我提供的关键信息:
{user_input}

已填的其他字段(供你保持一致):
{chr(10).join(ctx_lines) if ctx_lines else '(无)'}

请直接给出该字段的最终文本(不加引号、不加解释、不复述 hint)。"""

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 800,
    }

    req = urllib.request.Request(
        f"{DEEPSEEK_BASE}/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DeepSeek HTTP {e.code}: {body[:300]}")
    except Exception as e:
        raise RuntimeError(f"DeepSeek 调用失败: {e}")

    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        raise RuntimeError(f"DeepSeek 返回结构异常: {json.dumps(data)[:300]}")


# ===================== v2 全文 AI 主笔 =====================

# 公司事实卡: 服务进程启动时从 content/index.json 装载, 嵌入每次起稿/修订的 system prompt
# 让 AI 不用每次让用户重复说"我们 2017 年成立""做半挂"
_COMPANY_KB_CACHE: dict | None = None


def _load_company_kb() -> dict:
    global _COMPANY_KB_CACHE
    if _COMPANY_KB_CACHE is not None:
        return _COMPANY_KB_CACHE

    from content_io import REPO_ROOT
    out = {"facts": "", "voice_examples": ""}

    # 1) 公司事实: content/index.json 里 hero/about/about_page/timeline_items
    try:
        idx_path = REPO_ROOT / "content" / "index.json"
        if idx_path.exists():
            idx = json.loads(idx_path.read_text(encoding="utf-8-sig"))
            ab = idx.get("about_page") or {}
            hero = idx.get("hero") or {}
            about = idx.get("about") or {}
            timeline = idx.get("timeline_items") or []

            facts = ["# 关于欧阳聚德 (你下笔时必须吃下来的固定事实, 不要编造/不要矛盾)"]
            facts.append(f"- 全名: 湖北欧阳聚德汽车有限公司")
            facts.append(f"- 位置: 湖北省枣阳市 (千古帝乡)")
            facts.append(f"- 成立: 2017 年")
            facts.append(f"- 车间面积: {ab.get('ab-stat-area', '120,000')} 平米")
            facts.append(f"- 员工: {ab.get('ab-stat-employees', '200')}+ 人")
            facts.append(f"- 年产能: {ab.get('ab-stat-capacity', '8,000')} 台, 日产能峰值 15 台")
            facts.append(f"- 专利: {ab.get('ab-stat-patents', '44')} 项")
            facts.append(f"- 主营: 半挂车研发/生产/销售, 6 大产品系列 (栏板/平板/低平板/挖机板/飞翼/厢式 等)")
            facts.append(f"- 关键技术: T700C 超高强度钢材, 全系定制化生产")
            facts.append(f"- 行业首创: 折臂式随车吊半挂车 (全国首创自主研发) + 自研等离子切割装置 (减 37% 设备投入, 提 20% 工效)")
            facts.append(f"- 研发: 22 名工程师, 3 所合作院校, 每年 300 万+ 研发投入, 车辆技术研发中心 + 焊工技能大师工作室")
            facts.append(f"- 标语: \"做客户值得信任、员工值得自豪的企业\" / \"聚德同行 · 逐梦前行\" / \"聚天下有德之人\"")
            facts.append(f"- 服务网络: 全国 30+ 省")
            facts.append(f"- 文化:\"聚德心\"企业文化, \"工分制\" 九星激励管理体系")
            facts.append(f"- 公益: 枣阳本地助学/救灾/敬老常态投入; 党员志愿者队伍 (献血/防汛); 本地 200+ 工作岗位")

            if about.get("para1"): facts.append(f"\n# 公司简介\n{about['para1']}")
            if about.get("para2"): facts.append(f"\n{about['para2']}")

            if timeline:
                facts.append(f"\n# 大事记 (2017-2026 关键里程碑)")
                for it in timeline:
                    y, t = it.get("year", ""), it.get("title", "")
                    if y and t: facts.append(f"- {y}: {t}")

            out["facts"] = "\n".join(facts)
    except Exception as e:
        out["facts"] = f"# 公司事实加载失败: {e}"

    # 2) 历史推文 voice: news.json 最近 10 篇 wechat 类标题+摘要
    try:
        news_path = REPO_ROOT / "news.json"
        if news_path.exists():
            news = json.loads(news_path.read_text(encoding="utf-8-sig"))
            # 取最近 wechat 类、有 summary 的
            recent = [n for n in news if n.get("source", "").startswith("wechat") and n.get("title") and n.get("summary")][:10]
            if recent:
                lines = ["# 过去公众号推文的标题与摘要 (你下笔的文风要跟这些保持同源)"]
                for n in recent:
                    lines.append(f"- 【{n.get('category_label', '')}】{n['title']} — {n['summary']}")
                out["voice_examples"] = "\n".join(lines)
    except Exception as e:
        out["voice_examples"] = f"# 历史推文加载失败: {e}"

    _COMPANY_KB_CACHE = out
    return out


def reload_company_kb() -> None:
    """调试用: 强制重新加载公司事实卡"""
    global _COMPANY_KB_CACHE
    _COMPANY_KB_CACHE = None


CATEGORY_GUIDE = """
# 分类清单 (你必须选一个)
- case: 客户案例 - 单笔成交/批量交付/外贸订单/客户来访
- company: 公司动态 - 内部喜报/月度回顾/团队活动/不带政企色彩
- gov: 党政动态 - 党支部活动/政府调研/党课/党建主题
- product: 产品介绍 - 车型深度/技术亮点/适用场景, 非价格喊话
- tech: 技术小知识 - T700C 钢材科普/装载注意事项/保养 tips, 避工艺细节红线
- insight: 老板视角 - 行业洞察/经营理念/趋势判断

# 写作风格通用约束
- 真诚专业, 不喊价 (严禁"4.8万/特价/清仓"), 不堆术语, 不夸大资质
- 中文简体, 800-1500 字之间
- 不要复制广告腔, 像同行向同行讲述
- 严禁工艺细节 (具体焊接参数/钢板牌号配方等)
- 引用公司事实卡里的数据/年份/位置/技术名, 不要编造
"""


CLASS_BLOCKS_GUIDE = """
# 可选语义块 (按内容性质主动用, 让排版更有变化)
你的 HTML 段落除了用 <h2><h3><p><ul><li><blockquote>, 还可以在 <section> 上加以下 class,
官网详情页 CSS 会渲染对应视觉. 不强制用, 内容性质适合就用:

- <section class="wsx-stat-row"> 横排数据卡 (适合放数据点, 内部用 3-4 个 <div class="wsx-stat-item"><strong>数值</strong><span>说明</span></div>)
  例: 36 台/3 年合作/T700C 大梁 — 三张并列卡片金色数字
- <section class="wsx-callout"> 强调段 (金边框金底, 用来高亮关键观点/口号)
  例: "聚德同行 · 逐梦前行" 或 "首批已于 7 月 3 日装船发运"
- <section class="wsx-pull-quote"> 大引言 (适合客户证言/领导讲话原话, 内含 <blockquote> 和 <cite>来源</cite>)
- <section class="wsx-timeline-list"> 时间线 (适合交付节点/活动议程, 内部 <ul> 但带左侧节点视觉)
- <section class="wsx-spec-grid"> 参数对比 (适合产品介绍的关键参数, 内部 <dl><dt>项目</dt><dd>数值</dd>)

不要 <style> 块, 不要 inline-style, 只用 class. 详情页 CSS 自己处理视觉.
"""


_DRAFT_FULL_SYSTEM_HEADER = """你是欧阳聚德汽车的资深公众号主笔。

# 任务
用户会丢一段乱序的素材 (文字 + 图片 URL + 可选意图), 你直接出一篇可发布的完整推文。

# 输出严格 JSON 对象, 不要 JSON 外文字, 不要 markdown 代码块包裹:
{
  "category": "case|company|gov|product|tech|insight",
  "category_label": "中文分类名",
  "title": "推文标题 16-30字",
  "summary": "一句话摘要 30-60字",
  "html": "<section>...完整正文 HTML...</section>",
  "template_used": "ai-freeform 或具体模板名"
}

# 正文 HTML 约束
- 最外层用 <section> 包
- 段落用 <p>, 副标题用 <h2><h3>, 列表用 <ul><li>, 引用用 <blockquote>
- 配图用 <img src="..." alt="..."> 引用用户给的 URL (有图就用, 没图就不放)
- 不要 <html><head><body> 这些, 不要 <style> 块, 不要 inline-style
- 可以用下面的「特色块 class」让排版更有变化
"""


def _build_draft_system() -> str:
    kb = _load_company_kb()
    parts = [_DRAFT_FULL_SYSTEM_HEADER, "\n---\n", kb.get("facts", ""), "\n---\n"]
    if kb.get("voice_examples"):
        parts.extend([kb["voice_examples"], "\n---\n"])
    parts.extend([CATEGORY_GUIDE, "\n", CLASS_BLOCKS_GUIDE])
    return "\n".join(parts)


def draft_full(source_text: str, images: list[str], intent: str = "") -> dict:
    api_key = _get_api_key()
    if not api_key:
        return {
            "category": "case",
            "category_label": "客户案例",
            "title": "[DeepSeek 未配置] " + (source_text[:20] or "请填素材"),
            "summary": "请在 admin-backend.service 加 DEEPSEEK_API_KEY",
            "html": f"<section><p>DeepSeek 未配置。原始素材:</p><pre>{_safe_attr(source_text[:500])}</pre></section>",
            "template_used": "stub",
        }

    img_lines = "\n".join(f"- {u}" for u in images) or "(本次无图)"
    user_prompt = f"""素材 (文字):
{source_text or '(空)'}

素材 (图片 URL,你可在 html 里用 <img src='...'> 引用):
{img_lines}

意图 (用户的额外说明,可空):
{intent or '(无,你自己判断)'}

请按上面要求返回严格 JSON 对象。"""

    raw = _chat_complete(api_key, _build_draft_system(), user_prompt, max_tokens=2500, temperature=0.7)
    return _parse_json_obj(raw)


_REVISE_HEADER = """你是欧阳聚德汽车的资深公众号主笔。用户会给你一段当前 HTML 推文 + 一条修订指令, 请按指令重写。

# 输出严格 JSON, 不要 JSON 外文字, 不要代码块包裹:
{
  "title": "新标题 (如果指令涉及标题,否则原样)",
  "summary": "新摘要 (可选, 大改时给)",
  "html": "<section>...新正文 HTML...</section>"
}

# 约束
- 保留原素材, 不要无中生有
- 修订幅度跟指令对齐 (指令"再短一点"别加内容, "加客户口碑"在合适位置加一段)
- 保留 <img src> 不要丢图
- 不要喊价/工艺细节
- 引用公司事实卡里的数据/年份, 不要编造
- 可用「特色块 class」(下文说明) 提升排版变化
"""


def _build_revise_system() -> str:
    kb = _load_company_kb()
    parts = [_REVISE_HEADER, "\n---\n", kb.get("facts", ""), "\n---\n", CLASS_BLOCKS_GUIDE]
    return "\n".join(parts)


def revise(current_html: str, instruction: str, title: str = "", category: str = "") -> dict:
    api_key = _get_api_key()
    if not api_key:
        return {"html": current_html, "title": title, "summary": ""}

    user_prompt = f"""当前 HTML 推文 (你要在这基础上重写):
---
{current_html}
---

当前标题: {title or '(无)'}
分类: {category or '(无)'}

修订指令:
{instruction}

请按指令重写后返回严格 JSON。"""

    raw = _chat_complete(api_key, _build_revise_system(), user_prompt, max_tokens=2500, temperature=0.6)
    return _parse_json_obj(raw)


# ---------- 公共: chat completion + JSON 解析 ----------

def _chat_complete(api_key: str, system: str, user: str, max_tokens: int = 1500, temperature: float = 0.7) -> str:
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    req = urllib.request.Request(
        f"{DEEPSEEK_BASE}/chat/completions",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DeepSeek HTTP {e.code}: {body[:300]}")
    except Exception as e:
        raise RuntimeError(f"DeepSeek 调用失败: {e}")
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        raise RuntimeError(f"DeepSeek 返回结构异常: {json.dumps(data)[:300]}")


def _parse_json_obj(raw: str) -> dict:
    """从 LLM 返回里抠出 JSON 对象。先直接 parse, 失败就 regex 抠 {...}。"""
    raw = raw.strip()
    # 去掉常见的 markdown 包裹
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # 抠第一个 {...} 块
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        raise RuntimeError(f"AI 没返回 JSON: {raw[:200]}")
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError as e:
        raise RuntimeError(f"AI JSON 解析失败: {e}; raw: {raw[:200]}")
