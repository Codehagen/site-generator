#!/usr/bin/env node
/**
 * Site Generator - Agent Workflow
 * 
 * Automatiserer hele prosessen:
 * 1. Scrape nettside med Firecrawl
 * 2. Lag config fra scraped data
 * 3. Generer site
 * 4. Opprett GitHub repo
 * 5. Push kode
 * 
 * Usage: node agent-workflow.js <url>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FIRECRAWL_KEY = process.env.FIRECRAWL_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function error(msg) {
  console.error(`${colors.red}Error: ${msg}${colors.reset}`);
  process.exit(1);
}

// Step 1: Scrape website
async function scrapeWebsite(url) {
  log(`\n${colors.cyan}1️⃣  Scraping: ${url}${colors.reset}`, 'cyan');
  
  if (!FIRECRAWL_KEY) {
    error('FIRECRAWL_KEY not set');
  }
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [
      '-s', '-X', 'POST', 'https://api.firecrawl.dev/v2/scrape',
      '-H', `Authorization: Bearer ${FIRECRAWL_KEY}`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({
        url,
        formats: ['branding', 'markdown']
      })
    ]);

    let data = '';
    curl.stdout.on('data', (chunk) => data += chunk);
    curl.stderr.on('data', (chunk) => console.error(chunk.toString()));
    curl.on('close', (code) => {
      if (code !== 0) reject(new Error(`curl exited with ${code}`));
      try {
        const json = JSON.parse(data);
        if (!json.success) {
          reject(new Error(json.error || 'Scrape failed'));
          return;
        }
        resolve(json.data);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Step 2: Extract info from scraped data
function extractInfo(data, url) {
  log(`${colors.cyan}2️⃣  Extracting company info...${colors.reset}`, 'cyan');
  
  // Extract domain for company name
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace(/^www\./, '');
  const companyName = domain.split('.')[0]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  // Extract branding
  const branding = data.branding || {};
  const primaryColor = branding.colors?.[0]?.primary || '#2B7FFF';
  const accentColor = branding.colors?.[0]?.accent || primaryColor;
  
  // Extract content from markdown
  const content = data.markdown || '';
  const lines = content.split('\n').filter(l => l.trim());
  
  // Try to extract services (lines with common service patterns)
  const services = [];
  const serviceKeywords = ['tjenester', 'services', 'tilbyr', 'leverer', 'produkter'];
  
  // Extract from markdown content
  const plainText = content.replace(/[#*`]/g, '').trim();
  
  return {
    company: {
      name: companyName,
      fullName: companyName + ' AS',
      tagline: lines[0]?.substring(0, 100) || '',
      phone: '',
      email: '',
      address: ''
    },
    branding: {
      primaryColor,
      accentColor
    },
    content: plainText.substring(0, 2000),
    url
  };
}

// Step 3: Create config
function createConfig(info) {
  log(`${colors.cyan}3️⃣  Creating config...${colors.reset}`, 'cyan');
  
  const config = {
    company: info.company,
    branding: info.branding,
    pages: {
      home: {
        hero: {
          title: info.company.name,
          subtitle: info.company.tagline,
          primaryCta: 'Kontakt oss',
          secondaryCta: 'Les mer'
        },
        stats: [
          { value: '10+', label: 'Års erfaring' },
          { value: '100+', label: 'Prosjekter' },
          { value: 'Norge', label: 'Landsdekkende' }
        ],
        features: [
          { title: 'Kvalitet', description: 'Vi leverer alltid kvalitet' },
          { title: 'Pålitelighet', description: 'Vi holder det vi lover' },
          { title: 'Kompetanse', description: 'Erfarne fagfolk' },
          { title: 'Lokal', description: 'Lokal tilstedeværelse' }
        ]
      },
      services: {
        title: 'Våre tjenester',
        subtitle: 'Vi tilbyr',
        intro: 'Vi tilbyr et bredt spekter av tjenester.',
        services: [
          { title: 'Tjeneste 1', description: 'Beskrivelse av tjeneste 1', features: ['Feature 1', 'Feature 2'] },
          { title: 'Tjeneste 2', description: 'Beskrivelse av tjeneste 2', features: ['Feature 1', 'Feature 2'] },
          { title: 'Tjeneste 3', description: 'Beskrivelse av tjeneste 3', features: ['Feature 1', 'Feature 2'] }
        ]
      },
      about: {
        title: 'Om oss',
        subtitle: 'Velkommen til ' + info.company.name,
        content: info.content || `Vi er ${info.company.name}. Vi leverer kvalitetstjenester til våre kunder.`,
        values: [
          { title: 'Kvalitet', description: 'Vi leverer alltid kvalitet' },
          { title: 'Pålitelighet', description: 'Vi holder det vi lover' },
          { title: 'Kompetanse', description: 'Erfarne fagfolk' }
        ]
      },
      contact: {
        contacts: []
      }
    }
  };
  
  return config;
}

// Step 4: Generate site
function generateSite(config) {
  log(`${colors.cyan}4️⃣  Generating site...${colors.reset}`, 'cyan');
  
  const configPath = path.join(__dirname, 'temp-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  try {
    execSync(`node generate.js temp-config.json`, { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
  } finally {
    fs.unlinkSync(configPath);
  }
  
  const slug = config.company.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return path.join(__dirname, '..', slug);
}

// Step 5: Create GitHub repo
async function createGitHubRepo(companyName) {
  log(`${colors.cyan}5️⃣  Creating GitHub repo...${colors.reset}`, 'cyan');
  
  if (!GITHUB_TOKEN) {
    error('GITHUB_TOKEN not set');
  }
  
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [
      '-s', '-X', 'POST', 'https://api.github.com/user/repos',
      '-H', `Authorization: Bearer ${GITHUB_TOKEN}`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({
        name: slug,
        private: false,
        description: `${companyName} - Generert nettside`
      })
    ]);

    let data = '';
    curl.stdout.on('data', (chunk) => data += chunk);
    curl.on('close', (code) => {
      try {
        const json = JSON.parse(data);
        // Success - repo created
        if (json.full_name) {
          resolve(json.full_name);
        } 
        // Repo already exists - that's OK
        else if (json.message && json.message.includes('already exists')) {
          log(`   Repo already exists, continuing...`, 'yellow');
          resolve(slug);
        }
        // Other error
        else if (json.message) {
          log(`   Warning: ${json.message}`, 'yellow');
          resolve(slug);
        }
        else {
          resolve(slug);
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Step 6: Push to GitHub
function pushToGitHub(slug, localPath) {
  log(`${colors.cyan}6️⃣  Pushing to GitHub...${colors.reset}`, 'cyan');
  
  try {
    execSync('rm -rf .git && git init', { cwd: localPath, stdio: 'inherit' });
    execSync(`git add . && git commit -m "Initial commit: Generated site"`, { 
      cwd: localPath,
      stdio: 'inherit'
    });
    
    const remoteUrl = `https://${GITHUB_TOKEN}@github.com/Codehagen/${slug}.git`;
    
    // Remove old git and reinit
    execSync('rm -rf .git && git init', { cwd: localPath });
    execSync(`git remote add origin ${remoteUrl}`, { cwd: localPath });
    execSync('git branch -M main', { cwd: localPath });
    execSync('git add . && git commit -m "Initial commit"', { cwd: localPath });
    execSync('git push -u origin main --force', { cwd: localPath, stdio: 'inherit' });
    
    return `https://github.com/Codehagen/${slug}`;
  } catch (e) {
    log(`   Push warning: ${e.message}`, 'yellow');
    return `https://github.com/Codehagen/${slug}`;
  }
}

// Main workflow
async function main() {
  const url = process.argv[2];
  
  if (!url) {
    console.log('Usage: node agent-workflow.js <url>');
    console.log('Example: node agent-workflow.js https://bedrift.no');
    process.exit(1);
  }
  
  try {
    log('🚀 Starting automated site generation...', 'green');
    log(`� URL: ${url}\n`, 'yellow');
    
    // 1. Scrape
    const scrapedData = await scrapeWebsite(url);
    
    // 2. Extract info
    const info = extractInfo(scrapedData, url);
    log(`\n✅ Company: ${info.company.name}`, 'green');
    log(`   Primary color: ${info.branding.primaryColor}`, 'green');
    
    // 3. Create config
    const config = createConfig(info);
    
    // 4. Generate site
    const sitePath = generateSite(config);
    log(`\n✅ Site generated: ${sitePath}`, 'green');
    
    // 5. Create GitHub repo
    const repoSlug = await createGitHubRepo(config.company.name);
    log(`\n✅ GitHub repo: ${repoSlug}`, 'green');
    
    // 6. Push
    const repoUrl = pushToGitHub(repoSlug, sitePath);
    
    // Result
    log(`\n${colors.green}🎉 Ferdig!${colors.reset}`, 'green');
    log(`\n📦 Repo: ${repoUrl}`, 'blue');
    log(`🚀 Deploy: https://vercel.com/new/import/?repo=${repoSlug}`, 'blue');
    
  } catch (e) {
    error(e.message);
  }
}

main();
