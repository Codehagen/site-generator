# Site Generator - Agent Workflow

## Full Automated Workflow

Når brukeren ber om å lage en nettside:

```
Bruker: "Lag nettside for https://bedrift.no"
```

### Agenten gjør dette automatisk:

1. **Scrape nettsiden** med Firecrawl
2. **Ekstraher**: company info, branding, tjenester, kontakter
3. **Generer config** basert på scraped data
4. **Kjør generator** → lager Next.js site
5. **Opprett GitHub repo**
6. **Push kode**
7. **Returner** Vercel deploy-link

## Bruk i agent

```javascript
// Når bruker ber om nettside
const url = "https://bedrift.no";

// 1. Scrape
const data = await scrapeWithFirecrawl(url);

// 2. Create config
const config = createConfigFromScrape(data);

// 3. Generate site
await runGenerator(config);

// 4. Create GitHub repo
await createGitHubRepo(companyName);

// 5. Push and return
const deployUrl = `https://vercel.com/new/import/?repo=${repoName}`;
```

## Kommando

For å teste:
```
node agent-workflow.js https://bedrift.no
```
