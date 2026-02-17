# Site Generator - Config-Driven

Denne versjonen bruker JSON-config for å generere nettsider. Det gir:
- ✅ Type-sikkerhet og validering
- ✅ Enkelt å legge til nye bedrifter
- ✅ Gjenbruk av komponenter
- ✅ Forutsigbart resultat

## Bruk

```bash
# Generer nettside fra config
node generate.js <config-fil> [output-mappe]

# Eksempel
node generate.js config/examples/finneidsveis.json
```

## Config-struktur

Se `config/schema.json` for full schema.

```json
{
  "company": {
    "name": "Bedriftsnavn",
    "fullName": "Bedriftsnavn AS",
    "tagline": "Din tagline",
    "phone": "12 34 56 78",
    "email": "epost@bedrift.no",
    "address": "Gateadresse, 1234 By"
  },
  "branding": {
    "primaryColor": "#FF0000",
    "accentColor": "#00FF00"
  },
  "pages": {
    "home": {
      "hero": { ... },
      "stats": [ ... ],
      "features": [ ... ]
    },
    "services": {
      "title": "...",
      "services": [ ... ]
    },
    "about": { ... },
    "contact": { ... }
  }
}
```

## Legge til ny bedrift

1. Kopier `config/examples/finneidsveis.json`
2. Endre bedriftsdata
3. Kjør generatoren
4. Push til GitHub

## API-nøkler

Sett i `.env`:
```
FIRECRAWL_KEY=fc-...
GITHUB_TOKEN=ghp_...
```
