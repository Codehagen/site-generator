# Site Generator - Complete Workflow

## Overview
This system automates the entire process of generating landing pages for businesses, from URL to ready-to-deploy website with contact information.

## Workflow Steps

### 1. User Input
User provides a URL: "Lag en nettside for https://bedrift.no"

### 2. Firecrawl Scrape
Scrape the main URL and contact page:
- Main URL: branding + markdown
- /kontakt URL: markdown (for contact info)

### 3. Extract Information
From scraped data:
- **Branding**: Primary color, accent color, fonts
- **Content**: Company name, services, about text
- **Contacts**: Names, roles, emails, phones

### 4. Generate Site
Create Next.js project with prosites-components:
- Use Layout component for consistent header/footer
- Create pages: /, /tjenester, /om-oss, /kontakt
- Apply brand colors from extracted branding
- Include scraped content

### 5. GitHub
- Create new repo: `company-name` (kebab-case)
- Push generated code

### 6. Output to User
Return:
- GitHub repo URL
- Contact persons found
- Email draft
- Vercel deploy link

## API Keys Required
- Firecrawl API key
- GitHub PAT with repo scope

## Example Output

```
🎉 Site generated for Kjeldsberg Eiendomsforvaltning!

📦 Repo: https://github.com/Codehagen/kjeldsberg-ef

👥 Kontaktpersoner funnet:
- Lars Petter Gjellan | Daglig leder | larspetter.gjellan@kjeldsberg.no
- Svein Olav Roheim | Salgs- og markedsansvarlig | svein.olav.roheim@kjeldsberg.no

📧 Email-utkast:
Til: larspetter.gjellan@kjeldsberg.no
Emne: Nye nettsider til Kjeldsberg Eiendomsforvaltning?

Hei Lars Petter,

Jeg så på deres nettsider og tenkte...

🚀 Deploy: https://vercel.com/new/import/?repo=Codehagen%2Fkjeldsberg-ef
```

## Prompt for AI Assistant

When user asks to generate a site, use this prompt:

```
A user wants to generate a landing page for a business.

URL: [USER_PROVIDED_URL]

Please follow this workflow:

1. SCRAPE with Firecrawl:
   - Main page: branding + markdown
   - Contact page (/kontakt): markdown

2. EXTRACT:
   - Company name
   - Primary/accent colors
   - Services offered
   - Contact persons (name, role, email)

3. CREATE GitHub repo

4. GENERATE Next.js site using prosites-components
   - Use Layout with Header + Footer
   - Create all 4 pages
   - Apply brand colors

5. PUSH to GitHub

6. OUTPUT:
   - GitHub repo URL
   - Contact persons
   - Email draft
   - Vercel deploy link
```

## Future Enhancements
- Add LinkedIn profile scraping for more contact info
- Add multi-language support
- Add more page templates
- Add blog/news section
