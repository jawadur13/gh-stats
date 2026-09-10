# gh-stats — own GitHub stats cards

Live SVG cards with real GitHub data. No third-party links, self-hosted.

![stats](https://gh-stats-jawadur-rafid.vercel.app/api?username=jawadur13&theme=dark&count_private=true)
![streak](https://gh-stats-jawadur-rafid.vercel.app/api/streak?user=jawadur13&theme=dark)
![langs](https://gh-stats-jawadur-rafid.vercel.app/api/top-langs?username=jawadur13&theme=dark)

## Show these on YOUR profile (3 steps, no setup)

**Step 1 — Copy these 3 lines, replace `YOUR-USERNAME` with your GitHub username:**

```md
![](https://gh-stats-jawadur-rafid.vercel.app/api?username=YOUR-USERNAME&theme=dark&count_private=false)<br/>
![](https://gh-stats-jawadur-rafid.vercel.app/api/streak?user=YOUR-USERNAME&theme=dark)<br/>
![](https://gh-stats-jawadur-rafid.vercel.app/api/top-langs?username=YOUR-USERNAME&theme=dark&layout=compact)
```

**Step 2 — Paste them into your profile README:**
Create a repo named exactly like your username (`YOUR-USERNAME/YOUR-USERNAME`), add a `README.md`, paste the lines, commit.

**Step 3 — Open `github.com/YOUR-USERNAME`** and check your cards. Done.

> Public stats work instantly. Private commits only show for the service owner (see below).

## Customize

| Param | Values | What it does |
|---|---|---|
| `theme` | `dark` (default), `light` | Card color scheme |
| `hide` | `stars,commits,prs,issues,contribs,followers,repos` | Hide fields, e.g. `hide=issues,prs` |
| `hide_border` | `true` | Borderless card |
| `langs_count` | `1`–`8` (top-langs only) | How many languages to show |
| `count_private` | `true` | Include private commits — only works for the service owner's own username |

Example (light theme, no border, top 4 languages):

```md
![](https://gh-stats-jawadur-rafid.vercel.app/api?username=YOUR-USERNAME&theme=light&hide_border=true)
![](https://gh-stats-jawadur-rafid.vercel.app/api/top-langs?username=YOUR-USERNAME&theme=light&langs_count=4)
```

## Want YOUR private commits too? (deploy your own copy)

1. Fork this repo (or push this folder as its own repo).
2. Import it in Vercel (free Hobby plan is enough).
3. Create a classic token: GitHub → Settings → Developer settings → Personal access tokens (classic) → Generate → check the `repo` scope → copy the token.
4. Vercel → your project → Settings → Environment Variables → add `PAT_1` = your token and `CACHE_SECONDS` = `3600` → Redeploy.
5. Use your own URL with `count_private=true`:
   `https://YOUR-URL/api?username=YOUR-USERNAME&theme=dark&count_private=true`

## FAQ

**My card still shows old numbers — why?**
Cards are cached for 1 hour. Wait, or add a dummy param to force refresh: `&v=2` (change the number each time).

**New account shows all zeros — is it broken?**
No. Fresh accounts genuinely have 0 stars/commits/followers. Stats appear automatically as you contribute.

**Why can't I see someone else's private commits?**
GitHub privacy. A token can only see private data of its own owner. Others get public-only stats through this link.

**Profile picture not showing?**
It is embedded server-side, so it works through GitHub's image proxy. If an avatar ever fails to load, the card shows name initials instead — never a broken icon.

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

## Deploy notes (Vercel)

- Env vars: `PAT_1` (classic PAT, `repo` scope), `CACHE_SECONDS=3600`.
- If Output Directory is set to `public`, the included `public/index.html` keeps the build green.
