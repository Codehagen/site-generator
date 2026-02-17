#!/usr/bin/env node
/**
 * Site Generator - Config-driven (FIXED VERSION)
 * 
 * Usage: node generate.js <config-file> [output-dir]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    error(`Config file not found: ${configPath}`);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  if (!config.company) error('Missing: company');
  if (!config.company.name) error('Missing: company.name');
  if (!config.branding) error('Missing: branding');
  if (!config.branding.primaryColor) error('Missing: branding.primaryColor');
  
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!colorRegex.test(config.branding.primaryColor)) {
    error('Invalid primaryColor format. Use #RRGGBB');
  }
  
  log('✅ Config validated', 'green');
  return config;
}

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

function generateHomePage(config) {
  const { company, branding, pages } = config;
  const hero = pages.home?.hero || {};
  const stats = pages.home?.stats || [];
  const features = pages.home?.features || [];
  const services = (pages.services?.services || []).slice(0, 6).map(s => ({
    title: s.title,
    description: s.description
  }));
  
  const statsSection = stats.length > 0 ? `
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            ${stats.map(s => `<div>
              <div className="text-4xl font-bold" style={{ color: PRIMARY_COLOR }}>${s.value}</div>
              <div className="text-gray-600 mt-2">${s.label}</div>
            </div>`).join('\n            ')}
          </div>
        </div>
      </section>` : '';

  return `"use client";

import { Hero, Services, About, Contact, Footer, Header, CTASection, Features, Process, Layout } from "@/components";
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

  const services = ${JSON.stringify(services, null, 2)};

  const processSteps = [
    { title: "Kontakt oss", description: "Ta kontakt for en uforpliktende samtale" },
    { title: "Befaring", description: "Vi befarer prosjektet og gir tilbud" },
    { title: "Produksjon", description: "Vi setter løsningen i drift" },
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
        description: "${company.tagline || ''}",
        contact: {
          phone: "${company.phone}",
          email: "${company.email}",
          address: "${company.address}"
        },
        primaryColor: PRIMARY_COLOR,
        columns: [
          { title: "Tjenester", links: [
            { label: "Tjenester", href: "/tjenester" },
            { label: "Om oss", href: "/om-oss" },
            { label: "Kontakt", href: "/kontakt" }
          ]}
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

      ${services.length > 0 ? `
      <Services
        title="${pages.services?.title || 'Våre tjenester'}"
        subtitle="${pages.services?.subtitle || ''}"
        services={services}
        primaryColor={PRIMARY_COLOR}
      />` : ''}

      ${pages.about ? `
      <About
        title="${pages.about.title || 'Om oss'}"
        content="${(pages.about.content || '').substring(0, 200)}"
        points={${JSON.stringify((pages.about.values || []).map(v => v.title))}}
        imageUrl=""
        primaryColor={PRIMARY_COLOR}
      />` : ''}

      ${features.length > 0 ? `
      <Features
        title="Hvorfor velge oss?"
        features={${JSON.stringify(features, null, 2)}}
        primaryColor={PRIMARY_COLOR}
      />` : ''}

      <CTASection
        title="Trenger du våre tjenester?"
        description="Ta kontakt med oss for en uforpliktende samtale."
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
          { title: "Tjenester", links: [
            { label: "Tjenester", href: "/tjenester" },
            { label: "Om oss", href: "/om-oss" },
            { label: "Kontakt", href: "/kontakt" }
          ]}
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
          { title: "Tjenester", links: [
            { label: "Tjenester", href: "/tjenester" },
            { label: "Om oss", href: "/om-oss" },
            { label: "Kontakt", href: "/kontakt" }
          ]}
        ]
      }}
    >
      <AboutPage 
        title="${about.title || 'Om oss'}"
        subtitle="${about.subtitle || ''}"
        content={\`${(about.content || '').replace(/`/g, '\\`')}\`}
        values={${JSON.stringify((about.values || []).map(v => v.title))}}
        primaryColor={PRIMARY_COLOR}
      />
    </Layout>
  );
}
`;
}

function generateContactPage(config) {
  const { company, branding } = config;
  
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
          { title: "Tjenester", links: [
            { label: "Tjenester", href: "/tjenester" },
            { label: "Om oss", href: "/om-oss" },
            { label: "Kontakt", href: "/kontakt" }
          ]}
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

function generate(configPath, outputDir) {
  const config = loadConfig(configPath);
  const companySlug = config.company.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const output = outputDir || path.join(__dirname, '..', companySlug);
  
  log(`\n${colors.blue}🏗️  Generating: ${config.company.name}${colors.reset}\n`);
  
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }
  
  // Copy from kjeldsberg-ef template
  const templateDir = path.join(__dirname, '..', 'kjeldsberg-ef');
  
  if (fs.existsSync(templateDir)) {
    log('Copying template files...', 'yellow');
    execSync(`cp -r "${templateDir}/." "${output}/"`, { stdio: 'pipe' });
  } else {
    error(`Template not found: ${templateDir}`);
  }
  
  log('Generating CSS...', 'yellow');
  fs.writeFileSync(path.join(output, 'src/app/globals.css'), generateCSS(config));
  
  log('Generating pages...', 'yellow');
  fs.writeFileSync(path.join(output, 'src/app/page.tsx'), generateHomePage(config));
  fs.writeFileSync(path.join(output, 'src/app/tjenester/page.tsx'), generateServicesPage(config));
  fs.writeFileSync(path.join(output, 'src/app/om-oss/page.tsx'), generateAboutPage(config));
  fs.writeFileSync(path.join(output, 'src/app/kontakt/page.tsx'), generateContactPage(config));
  
  // Update package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(output, 'package.json'), 'utf-8'));
  pkg.name = companySlug;
  fs.writeFileSync(path.join(output, 'package.json'), JSON.stringify(pkg, null, 2));
  
  log(`\n✅ Site generated: ${output}`, 'green');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node generate.js <config-file> [output-dir]');
  console.log('Example: node generate.js config/examples/finneidsveis.json');
  process.exit(1);
}

generate(args[0], args[1]);
