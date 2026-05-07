# admin backend

Flask API for `admin.hboyjd.com`. This directory is the local/demo source; on the server it should be copied to `/opt/admin-backend/`.

## Local

```powershell
python -m venv .venv-admin
.venv-admin\Scripts\python -m pip install -r admin\backend\requirements.txt
.venv-admin\Scripts\python admin\backend\app.py
```

Open `http://127.0.0.1:9005/admin/dashboard.html`.

## Environment

| Name | Default | Purpose |
|---|---|---|
| `ADMIN_PORT` | `9005` | Flask port |
| `ADMIN_AUTH_MODE` | `mock` | `mock` locally, `dingtalk` online |
| `ADMIN_SECRET_KEY` | local placeholder | Flask session secret |
| `HBOYJD_REPO_ROOT` | repo inferred from this file | Website repo root |
| `ADMIN_ACTION_LOG` | `admin/backend/logs/admin-actions.jsonl` | JSONL audit log |
| `WECHAT_SYNC_SCRIPT` | `/opt/wechat-sync/sync.py` | Existing WeChat fetcher |
| `ADMIN_PUBLISH_PUSH` | `0` | Set `1` online to allow git push |

## API

- `GET /api/auth/me`
- `GET /api/auth/dingtalk-qrcode`
- `POST /api/auth/dingtalk-callback`
- `GET/PATCH /api/content/<section>`
- `GET /api/images`
- `POST /api/upload/image`
- `POST /api/news/from-wechat-url`
- `POST /api/publish`
- `GET /api/logs?limit=50`
