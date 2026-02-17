# Site Generator Prompt

## Workflow

1. **Get URL from user**
2. **Scrape with Firecrawl**
   ```bash
   curl -s -X POST "https://api.firecrawl.dev/v2/scrape" \
     -H "Authorization: Bearer $FIRECRAWL_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "<URL>",
       "formats": ["branding", "markdown"]
     }'
   ```

3. **Extract branding:**
   - primary color
   - accent color
   - fonts
   - logo

4. **Generate site using prosites-components**

## Prompt Template

```
Lag en Next.js landingsside for <BEDRIFTSNAVN>.

BRANDING:
- Primary: <FARGE>
- Accent: <FARGE>
- Font: <FONT>

INNHOLD:
- Hero: <HEADLINE>
- Tjenester: <TJENESTER>
- Om oss: <OM OSS>
- Kontakt: <KONTAKT>

TECH: Next.js + prosites-components + Tailwind

SIDER:
- / (forside med hero, tjenester, om oss, kontakt, CTA)
- /tjenester (alle tjenester)
- /om-oss (om bedriften)
- /kontakt (kontaktside + skjema)

BRUK LAYOUT KOMPONENT MED HEADER + FOOTER PÅ ALLE SIDER!
```

## Example Full Prompt

```
Lag en Next.js landingsside for Kjeldsberg Eiendomsforvaltning.

BRANDING:
- Primary: #F3D030 (gul)
- Accent: #3D4459 (mørk blå)
- Font: Open Sans + Montserrat

INNHOLD:
- Eiendomsforvaltning
- Energi, miljø og bærekraft
- Brann og sikkerhet
- ITB og teknisk prosjektledelse
- Rådgivning og prosjektledelse
- Økonomisk og administrativ forvaltning

SIDER:
- / (forside med hero, tjenester, om oss, kontakt, CTA)
- /tjenester (alle tjenester med beskrivelser)
- /om-oss (om bedriften, verdier, mission)
- /kontakt (kontaktside med skjema + info)

BRUK PROSITES-COMPONENTS OG LAYOUT KOMPONENT!
```

## Sub-agent Instructions

When user asks to generate a site:
1. Ask for URL
2. Firecrawl scrape
3. Create GitHub repo
4. Clone Next.js template
5. Install prosites-components
6. Generate pages with Layout
7. Push to GitHub
8. Tell user to deploy in Vercel
