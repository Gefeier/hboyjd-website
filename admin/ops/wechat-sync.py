#!/usr/bin/env python3
'''公众号文章同步到 hboyjd.com 新闻栏 v6 · 文章池增量进货模式

部署路径: /opt/wechat-sync/sync.py  (本文件是 git 纳管的权威副本)

v5 → v6 核心改动(2026-06-01 解决"公众号与实际发的不匹配/不完整"):
  1. 去掉每类只取 4 篇的硬上限 —— 拉到的文章全部进"文章池"
  2. 不再整个覆盖 news.json —— 改成按 url/id 增量 merge
  3. 保护人工决策字段(site_visible/category/important/title_en/summary_en):
     sync 只更新公众号侧内容字段(title/summary/date/cover),绝不覆盖市场部在后台
     改过的分类/显隐/置顶/译文
  4. 新文章默认 site_visible=False(审核制) —— 进池但不自动上官网,等市场部后台勾选
  5. 单 URL 模式(供 admin wechat_fetcher 调用)只读不写 —— 杜绝"手动加一篇就触发
     全量覆盖"的旧炸弹
  6. 统一写入路径到 /opt/hboyjd-website(admin 同一 working copy),复用 content_io 读写,
     git 从 REPO_ROOT 操作,webhook 双拉同步 —— 消除双 working copy push 打架
'''
import os, sys, json, datetime, subprocess, requests

REPO_ROOT = '/opt/hboyjd-website'
NEWS_JSON = REPO_ROOT + '/news.json'  # 与 admin content_io NEWS_PATH 同一文件,统一 working copy

ENV_FILE = '/etc/wechat-oa/credentials.env'
LOG_PREFIX = '[' + datetime.datetime.now().isoformat(timespec='seconds') + ']'

# 市场部在后台改过就不能被 sync 覆盖的"人工决策字段"
PROTECTED = {'site_visible', 'important', 'category', 'category_label',
             'category_label_en', 'title_en', 'summary_en'}

CASE_KEYWORDS = ['商客', '客商', '订单', '采购', '签订', '签约', '直邀', '跨国', '批量', '现订', '交付', '中东', '非洲', '出口', '交车', '提车', '到货', '订车', '成交', '客户']
GOV_KEYWORDS = ['书记', '领导', '党建', '党支部', '党组', '组织部', '社工部', '办事处', '调研', '指导', '党员', '红色领航', '党课', '党中央', '人大', '国家安全', '主题党', '工会', '政协', '共青团', '妇联', '统战']

CAT_ZH = {'case': '客户案例', 'gov': '党政动态', 'company': '公司动态'}
CAT_EN = {'case': 'Customer Stories', 'gov': 'Government & Party', 'company': 'Company News'}


def load_env():
    env = {}
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            k, _, v = line.partition('=')
            env[k] = v
    return env


def get_token(appid, secret):
    r = requests.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appid + '&secret=' + secret, timeout=10)
    r.encoding = 'utf-8'
    token = r.json().get('access_token')
    if not token:
        raise RuntimeError('access_token 失败: ' + r.text)
    return token


def fetch_freepublish(token, count=20):
    r = requests.post('https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token=' + token,
                      json={'offset': 0, 'count': count, 'no_content': 0}, timeout=15)
    r.encoding = 'utf-8'
    return r.json().get('item', [])


def fetch_material(token, count=20):
    r = requests.post('https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=' + token,
                      json={'type': 'news', 'offset': 0, 'count': count}, timeout=15)
    r.encoding = 'utf-8'
    return r.json().get('item', [])


def categorize(title):
    for kw in CASE_KEYWORDS:
        if kw in title:
            return 'case'
    for kw in GOV_KEYWORDS:
        if kw in title:
            return 'gov'
    return 'company'


def to_news_entry(item, cat):
    art = item['content']['news_item'][0]
    ts = item['update_time']
    article_id = item.get('article_id') or item.get('media_id', '')
    return {
        'id': 'wx-' + article_id[-12:],
        'title': art['title'],
        'title_en': '',
        'summary': (art.get('digest') or '')[:120],
        'summary_en': '',
        'date': datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d'),
        'category': cat,
        'category_label': CAT_ZH[cat],
        'category_label_en': CAT_EN[cat],
        'url': art.get('url', ''),
        'site_visible': False,  # 新进货默认待审,市场部后台勾选才上官网
        'source': 'wechat-auto',
    }


def read_pool():
    with open(NEWS_JSON, encoding='utf-8') as f:
        return json.load(f)


def write_pool(pool):
    with open(NEWS_JSON, 'w', encoding='utf-8') as f:
        json.dump(pool, f, ensure_ascii=False, indent=2)


def git(cmd):
    return subprocess.run(['git', '-C', REPO_ROOT] + cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True)


def run_sync(dry_run=False):
    env = load_env()
    print(LOG_PREFIX, '开始同步' + (' [DRY-RUN]' if dry_run else ''))
    token = get_token(env['WX_OA_APPID'], env['WX_OA_APPSECRET'])
    fp = fetch_freepublish(token, count=20)
    mat = fetch_material(token, count=20)
    print(LOG_PREFIX, 'freepublish', len(fp), '篇 | material', len(mat), '篇')

    # 合并去重(同一篇可能两接口都有,按 title 去重)
    seen_titles = set()
    deduped = []
    for it in fp + mat:
        title = it['content']['news_item'][0]['title']
        if title in seen_titles:
            continue
        seen_titles.add(title)
        deduped.append(it)
    deduped.sort(key=lambda x: x['update_time'], reverse=True)
    print(LOG_PREFIX, '去重后', len(deduped), '篇 (全部进池,不再每类砍 4)')

    # 读现有文章池
    pool = read_pool()
    by_url = {n['url']: n for n in pool if n.get('url')}
    by_id = {n['id']: n for n in pool if n.get('id')}

    added = 0
    updated = 0
    for it in deduped:
        title = it['content']['news_item'][0]['title']
        entry = to_news_entry(it, categorize(title))
        existing = by_url.get(entry['url']) or by_id.get(entry['id'])
        if existing:
            # 只更新公众号侧内容字段,保护人工决策字段
            changed = False
            for k, v in entry.items():
                if k in PROTECTED:
                    continue
                if v in ('', None):
                    continue
                if existing.get(k) != v:
                    existing[k] = v
                    changed = True
            if changed:
                updated += 1
        else:
            pool.insert(0, entry)
            by_url[entry['url']] = entry
            by_id[entry['id']] = entry
            added += 1

    pool.sort(key=lambda n: n.get('date', ''), reverse=True)
    visible = sum(1 for n in pool if n.get('site_visible') is not False)
    print(LOG_PREFIX, '池总计', len(pool), '篇 | 新增', added, '| 更新', updated, '| 当前官网可见', visible)

    if added == 0 and updated == 0:
        print(LOG_PREFIX, '内容无变化,skip')
        return 0

    if dry_run:
        print(LOG_PREFIX, '[DRY-RUN] 不写入不推送。新增文章预览(默认待审 site_visible=false):')
        for n in pool:
            if n.get('source') == 'wechat-auto' and n.get('site_visible') is False:
                print('  [待审]', n.get('date'), '|', CAT_ZH.get(n.get('category'), '?'), '|', n.get('title', '')[:30])
        return 0

    write_pool(pool)
    print(LOG_PREFIX, '写入 news.json (' + str(len(pool)) + ' 篇)')

    git(['pull', '--rebase', 'origin', 'master'])
    git(['add', 'news.json'])
    msg = 'sync(news): 公众号增量进货 ' + datetime.datetime.now().strftime('%Y-%m-%d %H:%M') + ' (+' + str(added) + ' 待审 ~' + str(updated) + ')'
    r = git(['commit', '-m', msg])
    if r.returncode != 0:
        print(LOG_PREFIX, 'commit 失败(可能无改动):', r.stderr.strip())
        return 0
    r = git(['push', 'origin', 'master'])
    if r.returncode != 0:
        print(LOG_PREFIX, 'push 失败:', r.stderr.strip())
        return 1
    print(LOG_PREFIX, '已 commit + push,webhook 双拉同步')
    return 0


def main():
    # 单 URL 模式: admin wechat_fetcher 可能以 `sync.py <url>` 调用。
    # 只读不写 —— 直接退出让 wechat_fetcher fallback 到 requests 直抓,
    # 杜绝旧版"手动加一篇就触发全量覆盖"的炸弹。
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    if args and args[0].startswith('http'):
        return 0
    return run_sync(dry_run=('--dry-run' in sys.argv))


if __name__ == '__main__':
    sys.exit(main())
