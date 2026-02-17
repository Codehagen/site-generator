#!/usr/bin/env node
/**
 * Site Generator - Config-driven
 * 
 * Usage: node generate.js <config-file> [output-dir]
 * 
 * Reads a JSON config, validates it, and generates a Next.js site.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function error(msg) {
  console.error(`${colors.red}Error: ${msg}${colors.reset}`);
  process.exit(1);
}

// Load and validate config
function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    error(`Config file not found: ${configPath}`);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  // Basic validation
  if (!config.company) error('Missing required field: company');
  if (!config.company.name) error('Missing required field: company.name');
  if (!config.branding) error('Missing required field: branding');
  if (!config.branding.primaryColor) error('Missing required field: branding.primaryColor');
  
  // Validate color format
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!colorRegex.test(config.branding.primaryColor)) {
    error('Invalid primaryColor format. Use #RRGGBB');
  }
  if (config.branding.accentColor && !colorRegex.test(config.branding.accentColor)) {
    error('Invalid accentColor format. Use #RRGGBB');
  }
  
  log('✅ Config validated successfully', 'green');
  return config;
}

// Generate globals.css with brand colors
function generateCSS(config) {
  const primary = config.branding.primaryColor;
  const accent = config.branding.accentColor || primary;
  
  return `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
}

:root {
  --background: #FFFFFF;
  --foreground: #333333;
  --card: #FFFFFF;
  --card-foreground: #333333;
  --popover: #FFFFFF;
  --popover-foreground: #333333;
  --primary: ${primary};
  --primary-foreground: #FFFFFF;
  --secondary: #F5F5F5;
  --secondary-foreground: #333333;
  --muted: #F5F5F5;
  --muted-foreground: #666666;
  --accent: ${accent};
  --accent-foreground: #FFFFFF;
  --destructive: #EF4444;
  --border: #E5E5E5;
  --input: #E5E5E5;
  --ring: ${primary};
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Open Sans', sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Montserrat', sans-serif;
  }
}

/* Animations */
@keyframes hero-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-fade-up {
  animation: hero-fade-up 600ms cubic-bezier(0.215, 0.61, 0.355, 1) both;
}

@keyframes gentle-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

.animate-gentle-float {
  animation: gentle-float 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hero-fade-up, .animate-gentle-float {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
`;
}

// Generate home page
function generateHomePage(config) {
  const { company, branding, pages } = config;
  const p = pages.home || {};
  const hero = p.hero || {};
  const stats = p.stats || [];
  const features = p.features || [];
  const servicesList = (pages.services?.services || []).slice(0, 6).map(s => ({
    title: s.title,
    description: s.description
  }));
  
  const hasStats = stats.length > 0;
  const hasServices = servicesList.length > 0;
  const hasAbout = !!pages.about;
  const hasFeatures = features.length > 0;
  
  const statsSection = hasStats ? `<section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            ${stats.map(s => `<div>
              <div className="text-4xl font-bold" style={{ color: PRIMARY_COLOR }}>${s.value}</div>
              <div className="text-gray-600 mt-2">${s.label}</div>
            </div>`).join('\n            ')}
          </div>
        </div>
      </section>` : '';

  const servicesSection = hasServices ? `<Services
        title="${pages.services?.title || 'Våre tjenester'}"
        subtitle="${pages.services?.subtitle || ''}"
        services={servicesList}
        primaryColor={PRIMARY_COLOR}
      />` : '';

  const aboutSection = hasAbout ? `<About
        title="${pages.about.title || 'Om oss'}"
        content="${pages.about.content || ''}"
        points={${JSON.stringify((pages.about.values || []).map(v => v.title))}}
        imageUrl=""
        primaryColor={PRIMARY_COLOR}
      />` : '';

  const featuresSection = hasFeatures ? `<Features
        title="Hvorfor velge oss?"
        features={${JSON.stringify(features, null, 2)}}
        primaryColor={PRIMARY_COLOR}
      />` : '';

  return `"use client";

import { 
  Hero, 
  Services, 
  About, 
  Contact, 
  Footer, 
  Header,
  CTASection,
  Features,
  Process,
  Layout
} from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const PRIMARY_COLOR = "${branding.primaryColor}";
const ACCENT_COLOR = "${branding.accentColor || branding.primaryColor}";

const NAV_LINKS = [
  { label: "Tjenester", href: "/tjenester" },
  { label: "Om oss", href: "/om-oss" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const services = ${JSON.stringify(servicesList, null, 2)};

  const processSteps = [
    { title: "Kontakt oss", description: "Ta kontakt for en uforpliktende samtale" },
    { title: "Befaring", description: "Vi befarer prosjektet og gir tilbud" },
    { title: "Produksjon", description: "Vi produserer konstruksjonene" },
    { title: "Levering", description: "Vi leverer til avtalt tid" }
  ];

  return (
    <Layout
      headerProps={{
        companyName: "${company.name}",
        navLinks: NAV_LINKS,
        ctaText: "Kontakt oss",
        ctaHref: "/kontakt",
        primaryColor: PRIMARY_COLOR,
        transparent: true,
      }}
      footerProps={{
        companyName: "${company.fullName || company.name}",
        description: "${company.tagline || 'Kvalitet til avtalt tid'}",
        contact: {
          phone: "${company.phone}",
          email: "${company.email}",
          address: "${company.address}"
        },
        primaryColor: PRIMARY_COLOR,
        columns: [
          {
            title: "Tjenester",
            links: [
              { label: "Tjenester", href: "/tjenester" },
              { label: "Om oss", href: "/om-oss" },
              { label: "Kontakt", href: "/kontakt" }
            ]
          }
        ]
      }}
    >
      <Hero
        title="${hero.title || company.name}"
        subtitle="${hero.subtitle || company.tagline || ''}"
        primaryCta="${hero.primaryCta || 'Kontakt oss'}"
        primaryCtaHref="/kontakt"
        secondaryCta="${hero.secondaryCta || 'Les mer'}"
        secondaryCtaHref="/om-oss"
        primaryColor={PRIMARY_COLOR}
        backgroundImage=""
      />

      ${statsSection}

      ${servicesSection}

      ${aboutSection}

      ${featuresSection}

      <CTASection
        title="Trenger du våre tjenester?"
        description="Ta kontakt med oss for en uforpliktende samtale om ditt prosjekt."
        ctaText="Kontakt oss"
        ctaHref="/kontakt"
        primaryColor={PRIMARY_COLOR}
      />

      <Contact
        title="Kontakt oss"
        subtitle="Ta gjerne kontakt med oss"
        primaryColor={PRIMARY_COLOR}
        contactInfo={{
          phone: "${company.phone}",
          email: "${company.email}",
          address: "${company.address}"
        }}
      />
    </Layout>
  );
}
`;
}

// Generate services page
function generateServicesPage(config) {
  const { company, branding, pages } = config;
  const services = pages.services?.services || [];
  
  return `import { ServicesPage, Layout } from "@/components";

const PRIMARY_COLOR = "${branding.primaryColor}";

const NAV_LINKS = [
  { label: "Tjenester", href: "/tjenester" },
  { label: "Om oss", href: "/om-oss" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Page() {
  return (
    <Layout
      headerProps={{
        companyName: "${company.name}",
        navLinks: NAV_LINKS,
        ctaText: "Kontakt oss",
        ctaHref: "/kontakt",
        primaryColor: PRIMARY_COLOR,
      }}
      footerProps={{
        companyName: "${company.fullName || company.name}",
        description: "${company.tagline || ''}",
        contact: {
          phone: "${company.phone}",
          email: "${company.email}",
          address: "${company.address}"
        },
        primaryColor: PRIMARY_COLOR,
        columns: [
          {
            title: "Tjenester",
            links: [
              { label: "Tjenester", href: "/tjenester" },
              { label: "Om oss", href: "/om-oss" },
              { label: "Kontakt", href: "/kontakt" }
            ]
          }
        ]
      }}
    >
      <ServicesPage 
        title="${pages.services?.title || 'Våre tjenester'}"
        subtitle="${pages.services?.subtitle || ''}"
        intro="${pages.services?.intro || ''}"
        services={${JSON.stringify(services, null, 4)}}
        primaryColor={PRIMARY_COLOR}
      />
    </Layout>
  );
}
`;
}

// Generate about page
function generateAboutPage(config) {
  const { company, branding, pages } = config;
  const about = pages.about || {};
  
  return `import { AboutPage, Layout } from "@/components";

const PRIMARY_COLOR = "${branding.primaryColor}";

const NAV_LINKS = [
  { label: "Tjenester", href: "/tjenester" },
  { label: "Om oss", href: "/om-oss" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Page() {
  return (
    <Layout
      headerProps={{
        companyName: "${company.name}",
        navLinks: NAV_LINKS,
        ctaText: "Kontakt oss",
        ctaHref: "/kontakt",
        primaryColor: PRIMARY_COLOR,
      }}
      footerProps={{
        companyName: "${company.fullName || company.name}",
        description: "${company.tagline || ''}",
        contact: {
          phone: "${company.phone}",
          email: "${company.email}",
          address: "${company.address}"
        },
        primaryColor: PRIMARY_COLOR,
        columns: [
          {
            title: "Tjenester",
            links: [
              { label: "Tjenester", href: "/tjenester" },
              { label: "Om oss", href: "/om-oss" },
              { label: "Kontakt", href: "/kontakt" }
            ]
          }
        ]
      }}
    >
      <AboutPage 
        companyName="${company.name}"
        content={\`${(about.content || '').replace(/`/g, '\\`')}\`}
        values={${JSON.stringify((about.values || []).map(v => v.title))}}
        primaryColor={PRIMARY_COLOR}
      />
    </Layout>
  );
}
`;
}

// Generate contact page
function generateContactPage(config) {
  const { company, branding, pages } = config;
  const contacts = pages.contact?.contacts || [];
  
  return `import { ContactPage, Layout } from "@/components";

const PRIMARY_COLOR = "${branding.primaryColor}";

const NAV_LINKS = [
  { label: "Tjenester", href: "/tjenester" },
  { label: "Om oss", href: "/om-oss" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Page() {
  return (
    <Layout
      headerProps={{
        companyName: "${company.name}",
        navLinks: NAV_LINKS,
        ctaText: "Kontakt oss",
        ctaHref: "/kontakt",
        primaryColor: PRIMARY_COLOR,
      }}
      footerProps={{
        companyName: "${company.fullName || company.name}",
        description: "${company.tagline || ''}",
        contact: {
          phone: "${company.phone}",
          email: "${company.email}",
          address: "${company.address}"
        },
        primaryColor: PRIMARY_COLOR,
        columns: [
          {
            title: "Tjenester",
            links: [
              { label: "Tjenester", href: "/tjenester" },
              { label: "Om oss", href: "/om-oss" },
              { label: "Kontakt", href: "/kontakt" }
            ]
          }
        ]
      }}
    >
      <ContactPage 
        companyName="${company.name}"
        contact={{
          phone: "${company.phone}",
          email: "${company.email}",
          address: "${company.address}"
        }}
        primaryColor={PRIMARY_COLOR}
      />
    </Layout>
  );
}
`;
}

// Main generator
function generate(configPath, outputDir) {
  const config = loadConfig(configPath);
  const companyName = config.company.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const output = outputDir || path.join(__dirname, '..', '..', companyName);
  
  log(`\n${colors.blue}🏗️  Generating site for: ${config.company.name}${colors.reset}\n`);
  
  // Create output directory
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
    log(`Created directory: ${output}`, 'yellow');
  }
  
  // Copy template files (from kjeldsberg-ef)
  const templateDir = path.join(__dirname, '..', 'kjeldsberg-ef');
  
  if (fs.existsSync(templateDir)) {
    log('Copying template files...', 'yellow');
    execSync(`cp -r "${templateDir}/." "${output}/"`, { stdio: 'pipe' });
  } else {
    error(`Template directory not found: ${templateDir}`);
  }
  
  // Generate CSS
  log('Generating globals.css...', 'yellow');
  fs.writeFileSync(path.join(output, 'src/app/globals.css'), generateCSS(config));
  
  // Generate pages
  log('Generating pages...', 'yellow');
  fs.writeFileSync(path.join(output, 'src/app/page.tsx'), generateHomePage(config));
  fs.writeFileSync(path.join(output, 'src/app/tjenester/page.tsx'), generateServicesPage(config));
  fs.writeFileSync(path.join(output, 'src/app/om-oss/page.tsx'), generateAboutPage(config));
  fs.writeFileSync(path.join(output, 'src/app/kontakt/page.tsx'), generateContactPage(config));
  
  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(output, 'package.json'), 'utf-8'));
  packageJson.name = companyName;
  fs.writeFileSync(path.join(output, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  log(`\n✅ Site generated in: ${output}`, 'green');
  log(`\nNext steps:`, 'blue');
  log(`  cd ${output}`, 'reset');
  log(`  npm run dev  # Test locally`, 'reset');
  log(`  git add . && git commit -m "Generated from config"`, 'reset');
}

// Run
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node generate.js <config-file> [output-dir]');
  console.log('Example: node generate.js config/examples/finneidsveis.json');
  process.exit(1);
}

generate(args[0], args[1]);
