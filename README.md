# gh-stats — own GitHub stats cards

Self-hosted SVG stats service by jawadur13. Real GitHub data, no third-party links.
Live at **https://gh-stats-jawadur-rafid.vercel.app**.

## Use it (just paste a link)

```md
![stats](https://gh-stats-jawadur-rafid.vercel.app/api?username=jawadur13&theme=dark&hide_border=false&include_all_commits=false&count_private=true)
![streak](https://gh-stats-jawadur-rafid.vercel.app/api/streak?user=jawadur13&theme=dark&hide_border=false)
![langs](https://gh-stats-jawadur-rafid.vercel.app/api/top-langs?username=jawadur13&theme=dark&hide_border=false&include_all_commits=false&count_private=false&layout=compact)
```

Params `api` (stats card):
- `username` (or `user`) — required
- `theme=dark|light` (default dark)
- `hide=stars,commits,prs,issues,contribs`
- `hide_border=true` — borderless card
- `count_private=true` — counts MY private commits (needs `PAT_1` on server).
  Others using this link get public-only stats (GitHub privacy — unavoidable).

Params `api/streak`: `username` (or `user`), `theme`, `hide_border`.
Params `api/top-langs`: `username` (or `user`), `theme`, `hide_border`, `langs_count=1..8`.

## Others reusing my link

`https://gh-stats-jawadur-rafid.vercel.app/api?username=THEIR-USER` works instantly (public stats).
For their private stats they must fork/deploy their own copy with their own `PAT_1`.

## Local dev

```powershell
Copy-Item .env.example .env
# edit .env -> PAT_1=ghp_... (only for private counts; public works without)
npm install
npm test
npm run dev
# http://localhost:3000/api?username=jawadur13&count_private=true
# http://localhost:3000/api/streak?user=jawadur13
# http://localhost:3000/api/top-langs?username=jawadur13
```

## Deploy (Vercel)

1. Push this folder as its own repo and import in Vercel.
2. Env vars: `PAT_1` = classic PAT (`repo` scope), `CACHE_SECONDS=3600`.
   (If Output Directory is set to `public`, `public/index.html` keeps the build green.)
3. Point profile README at your URL with `count_private=true`.
