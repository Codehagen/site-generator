# Site Generator Sub-Agent

## About
This sub-agent generates landing pages for businesses using Firecrawl for scraping and prosites-components for the UI.

## Trigger
User says something like:
- "Lag en nettside for [URL]"
- "Generate site for [URL]"
- "New website for [URL]"

## Workflow

### Step 1: Extract URL
Get the URL from user's message. If no URL provided, ask for it.

### Step 2: Firecrawl Scrape
Scrape the URL for:
- Branding (colors, fonts)
- Markdown content
- Contact page for contact persons

```bash
# Main page
curl -s -X POST "https://api.firecrawl.dev/v2/scrape" \
  -H "Authorization: Bearer $FIRECRAWL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "<URL>",
    "formats": ["branding", "markdown"]
  }'

# Contact page
curl -s -X POST "https://api.firecrawl.dev/v2/scrape" \
  -H "Authorization: Bearer $FIRECRAWL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "<URL>/kontakt",
    "formats": ["markdown"]
  }'
```

### Step 3: Extract Info
From the scraped data:
- Company name
- Primary color, accent color
- Services/offers
- Contact persons (names, roles, emails)
- About content

### Step 4: Create GitHub Repo
```bash
curl -s -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<repo-name>",
    "description": "Generated landing page for <company>",
    "private": false,
    "auto_init": true
  }' \
  https://api.github.com/user/repos
```

### Step 5: Generate Site
Create Next.js project with prosites-components:
- Use Layout component with Header + Footer
- Create pages: /, /tjenester, /om-oss, /kontakt
- Apply brand colors
- Include scraped content

### Step 6: Push to GitHub
```bash
git add -A && git commit -m "Generated site for <company>" && git push
```

### Step 7: Create Email Draft
Based on contact persons found:
- Target: Day manager or sales responsible
- Subject: "Nye nettsider til [Company]?"
- Body: Short, personal outreach email

## Required Environment Variables
- `FIRECRAWL_KEY` - Firecrawl API key
- `GITHUB_TOKEN` - GitHub PAT with repo scope

## Output Format
Return to user:
1. GitHub repo URL
2. Contact persons found
3. Email draft
4. "Deploy here: https://vercel.com/import/git/..."

## Example Response
```
🎉 Site generated for [Company]!

📦 Repo: https://github.com/Codehagen/company-name

👥 Kontaktpersoner funnet:
- Navn | Rolle | E-post

📧 Email-utkast:
[Emne]: Nye nettsider til [Company]?
[Body]

🚀 Deploy: https://vercel.com/...
```
