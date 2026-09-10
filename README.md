# gh-stats — own GitHub stats cards

Original minimal SVG service by jawadur13. Real GitHub data, no third-party links.

## Use (after deploy)

```md
![stats](https://YOUR-VERCEL-URL/api?username=jawadur13&theme=dark&count_private=true)
![langs](https://YOUR-VERCEL-URL/api/top-langs?username=jawadur13&theme=dark)
```

Params `api`:
- `username` (required)
- `theme=dark|light` (default dark)
- `hide=stars,commits,prs,issues,contribs`
- `count_private=true` — counts YOUR private commits. Requires `PAT_1` = classic PAT with `repo` scope deployed as env var. Others using your link get public-only (GitHub privacy — unavoidable).

Params `api/top-langs`: `username`, `theme`, `langs_count=1..8`.

## Local dev (no push)

```powershell
Copy-Item .env.example .env
# edit .env -> PAT_1=ghp_... (only for private counts; public works without)
npm install
npm test
npm run dev
# http://localhost:3000/api?username=jawadur13
# http://localhost:3000/api/top-langs?username=jawadur13
```

## Deploy (Vercel, when ready)

1. Push this folder as its own repo (you said not now — skip).
2. Vercel -> New Project -> import repo.
3. Env: `PAT_1` = your classic PAT (`repo` scope), `CACHE_SECONDS=3600`.
4. Point profile README at your URL with `count_private=true`.

## Others reusing your link

`https://YOUR-URL/api?username=THEIR-USER` works instantly (public stats).
For their private stats they must deploy their own copy with their own `PAT_1`.
