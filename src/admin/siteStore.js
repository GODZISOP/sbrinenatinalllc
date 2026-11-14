import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SITE_SLUG = 'sbrinternationalsllc';

const baseSiteConfig = {
  "companyName": "SBR Internationals LLC",
  "shortName": "SBR Internationals",
  "legalName": "SBR INTERNATIONALS LLC",
  "tagline": "Shop Quality Products",
  "heroTitle": "Quality For Life",
  "heroSubtitle": "Quality essentials for home, beauty, fashion, wellness, and everyday living.",
  "eyebrowStandard": "THE SBR INTERNATIONALS STANDARD",
  "phonePrimary": "(+966) 59 030 3711",
  "phonePrimaryTel": "+966590303711",
  "phoneDirect": "(+966) 59 030 3711",
  "phoneDirectTel": "+966590303711",
  "whatsappNumber": "966590303711",
  "whatsappDisplay": "(+966) 59 030 3711",
  "email": "info@sbrinternationalsllc.com",
  "website": "www.sbrinternationalsllc.com",
  "address": {
    "line1": "30 N Gould St # 68479",
    "line2": "Sheridan, WY 82801, United States",
    "full": "30 N Gould St # 68479 Sheridan, WY 82801, United States",
    "cityStateZip": "Sheridan, WY 82801, United States",
    "jurisdiction": "Wyoming LLC #68479"
  },
  "hubs": {
    "originText": "Dispatched via Sheridan, WY Registered Fulfillment",
    "dispatchNote": "Dispatched from our Sheridan, Wyoming distribution facility and partner regional hubs."
  },
  "about": {
    "mission": "At SBR Internationals LLC, our mission is to deliver dependable quality, connecting vetted brands and manufacturers with discerning retail and e-commerce customers.",
    "sourcingNote": "Every item supplied by SBR Internationals LLC undergoes strict quality checks, packaging verification, and transparent logistics tracking from dispatch to delivery.",
    "b2bNote": "Whether ordering everyday essentials or coordinating commercial wholesale volume, SBR Internationals LLC provides reliable pricing, dedicated concierge communication, and timely fulfillment.",
    "cards": [
      {
        "title": "Integrity First",
        "description": "Transparent pricing, clear communication, and verified product authenticity."
      },
      {
        "title": "Logistics Agility",
        "description": "Fast processing, reliable carrier networks, and streamlined fulfillment."
      },
      {
        "title": "Customer Centric",
        "description": "Dedicated SBR Internationals trade support ready to assist with inquiries and custom schedules."
      }
    ],
    "ctaButton": "Contact Management Desk"
  },
  "contact": {
    "sectionTag": "GET IN TOUCH",
    "tagline": "Connect with SBR Internationals LLC for product inquiries, order support, or partnership discussions.",
    "cardTitle": "Direct Coordinates",
    "formTitle": "Send Us a Message",
    "formSuccess": "Thank you! Your message has been received by SBR Internationals LLC. We will reply within 24 hours.",
    "labels": {
      "email": "Email",
      "phone": "Phone Number",
      "hub": "Registered Address",
      "whatsapp": "WhatsApp Chat",
      "management": "Management"
    }
  },
  "footer": {
    "description": "Quality essentials for home, beauty, fashion, wellness, and everyday living.",
    "operationsLabel": "Dispatched via Sheridan, WY Registered Fulfillment",
    "newsletterTagline": "Receive exclusive updates, catalog drops, and product availability notices.",
    "newsletterSuccess": "Thank you for subscribing to SBR Internationals LLC updates!",
    "copyrightSuffix": "All rights reserved.",
    "managedByLabel": "Managed by SBR Internationals LLC",
    "websiteUrl": "https://sbrinternationalsllc.com",
    "domain": "sbrinternationalsllc.com",
    "socials": [
      {
        "label": "Facebook",
        "url": "https://facebook.com/"
      },
      {
        "label": "Instagram",
        "url": "https://instagram.com/"
      },
      {
        "label": "TikTok",
        "url": "https://tiktok.com/"
      }
    ],
    "menu": [
      {
        "label": "Home",
        "tab": "home"
      },
      {
        "label": "Shop",
        "tab": "home",
        "scrollTo": "featured-products-section"
      },
      {
        "label": "About",
        "tab": "about"
      },
      {
        "label": "Contact",
        "tab": "contact"
      }
    ]
  },
  "testimonial": {
    "quote": "Partnering with SBR Internationals LLC elevated our product sourcing with consistent quality, fast fulfillment, and responsive support.",
    "author": "Verified Commercial Partner"
  },
  "currencySymbol": "$",
  "logo": "",
  "theme": {
    "primaryNavy": "#17223A",
    "secondaryTeal": "#1e3a5f",
    "accentTeal": "#D3B066",
    "accentHover": "#b8944a",
    "accentGold": "#D3B066",
    "bgLight": "#f8fafc"
  }
};

const STORAGE_KEYS = {
  WEBSITES: 'cms_websites_v1',
  USERS: 'cms_admin_users_v1',
  SESSION: 'cms_admin_session_v1',
  SUPABASE_CREDS: 'cms_supabase_creds_v1',
};

const STORE_EVENT = 'cms-sites-updated';

export const DEFAULT_SUPER_ADMIN = {
  email: 'admin@mmshahfaisalllc.com',
  password: 'Admin@1234',
};

function notifyStoreUpdate(slug = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: { slug } }));
  }
}

/**
 * Deterministic SHA-256 hex digest using Web Crypto API, with non-secure-context fallback.
 */
export async function hashPassword(plainText) {
  const input = String(plainText || '');
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Lightweight deterministic fallback for non-HTTPS local testing
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

export function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function mergeWithDefaultConfig(partialConfig = {}) {
  const base = cloneDeep(baseSiteConfig);
  const incoming = partialConfig || {};

  return {
    ...base,
    ...incoming,
    logo: incoming.logo || base.logo,
    address: {
      ...base.address,
      ...(incoming.address || {}),
    },
    hubs: {
      ...base.hubs,
      ...(incoming.hubs || {}),
    },
    about: {
      ...base.about,
      ...(incoming.about || {}),
      cards:
        Array.isArray(incoming.about?.cards) && incoming.about.cards.length > 0
          ? incoming.about.cards.map((card, idx) => ({
              ...(base.about.cards[idx] || { title: '', description: '' }),
              ...card,
            }))
          : base.about.cards,
    },
    contact: {
      ...base.contact,
      ...(incoming.contact || {}),
      labels: {
        ...base.contact.labels,
        ...(incoming.contact?.labels || {}),
      },
    },
    footer: {
      ...base.footer,
      ...(incoming.footer || {}),
      socials:
        Array.isArray(incoming.footer?.socials) && incoming.footer.socials.length > 0
          ? incoming.footer.socials
          : base.footer.socials,
      menu:
        Array.isArray(incoming.footer?.menu) && incoming.footer.menu.length > 0
          ? incoming.footer.menu
          : base.footer.menu,
    },
    testimonial: {
      ...base.testimonial,
      ...(incoming.testimonial || {}),
    },
    theme: {
      ...base.theme,
      ...(incoming.theme || {}),
    },
  };
}

function buildSeededConfig(overrides = {}) {
  return mergeWithDefaultConfig(overrides);
}

function getInitialSeedWebsites() {
  const now = new Date().toISOString();
  return [
    {
      slug: 'sbrinternationalsllc',
      domain: 'sbrinternationalsllc.com',
      name: baseSiteConfig.companyName,
      clientEmail: '',
      clientAccessCode: '',
      updatedAt: now,
      config: buildSeededConfig({}),
    },
    {
      slug: 'mmshahfaisalllc',
      domain: 'mmshahfaisalllc.com',
      name: 'MM Shah Faisal LLC',
      clientEmail: '',
      clientAccessCode: '',
      updatedAt: now,
      config: buildSeededConfig({
        companyName: 'MM Shah Faisal LLC',
        shortName: 'MM Shah Faisal',
        legalName: 'MM SHAH FAISAL LLC',
        tagline: 'Premium Wholesale, General Trading & Global Distribution',
        heroTitle: 'Quality Products Online',
        heroSubtitle:
          'Direct manufacturer sourcing, dependable bulk supply chains, and exceptional consumer essentials curated by MM Shah Faisal LLC.',
        eyebrowStandard: 'THE MM SHAH FAISAL STANDARD OF EXCELLENCE',
        phonePrimary: '(+966) 50 226 2446',
        phonePrimaryTel: '+966502262446',
        phoneDirect: '(+966) 50 226 2446',
        phoneDirectTel: '+966502262446',
        whatsappNumber: '966502262446',
        whatsappDisplay: '(+966) 50 226 2446',
        email: 'info@mmshahfaisalllc.com',
        website: 'www.mmshahfaisalllc.com',
        about: {
          ...baseSiteConfig.about,
          mission:
            'At MM Shah Faisal LLC, our mission is to deliver exceptional wholesale value, connecting premier international manufacturers with retailers, commercial distributors, and online merchants worldwide. Founded on the principles of trust, transparency, and trade excellence, we serve as a reliable bridge between global suppliers and growing businesses.',
          b2bNote:
            'Whether you operate independent retail stores, supermarket chains, or e-commerce marketplaces, MM Shah Faisal LLC provides flexible minimums, volume price tiers, and dependable fulfillment. Our team ensures every order meets the highest quality and delivery standards you can count on.',
        },
        contact: {
          ...baseSiteConfig.contact,
          formSuccess:
            'Thank you! Your message has been received by MM Shah Faisal LLC. We will reply within 24 hours.',
        },
        footer: {
          ...baseSiteConfig.footer,
          websiteUrl: 'https://www.mmshahfaisalllc.com',
          domain: 'mmshahfaisalllc.com',
        },
        testimonial: {
          ...baseSiteConfig.testimonial,
          quote:
            'Partnering with MM Shah Faisal LLC transformed our wholesale inventory turnover. Top-tier product authenticity, fast fulfillment, and flawless communication.',
        },
        theme: {
          primaryNavy: '#091526',
          secondaryTeal: '#112a45',
          accentTeal: '#d97706',
          accentHover: '#b45309',
          accentGold: '#f59e0b',
          bgLight: '#f8fafc',
        },
      }),
    },
    {
      slug: 'gulf-horizon-trading',
      domain: 'gulfhorizontrading.com',
      name: 'Gulf Horizon Trading LLC',
      clientEmail: 'manager@gulfhorizontrading.com',
      clientAccessCode: 'Gulf@2026',
      updatedAt: now,
      config: buildSeededConfig({
        companyName: 'Gulf Horizon Trading LLC',
        shortName: 'Gulf Horizon',
        legalName: 'GULF HORIZON TRADING LLC',
        tagline: 'Regional Wholesale, Consumer Goods & Logistics',
        eyebrowStandard: 'THE GULF HORIZON STANDARD',
        email: 'info@gulfhorizontrading.com',
        website: 'www.gulfhorizontrading.com',
        phonePrimary: '(+971) 50 418 9200',
        phonePrimaryTel: '+971504189200',
        phoneDirect: '(+971) 50 418 9200',
        phoneDirectTel: '+971504189200',
        whatsappNumber: '971504189200',
        whatsappDisplay: '(+971) 50 418 9200',
        address: {
          line1: 'Al Quoz Industrial Area 3, Warehouse 14',
          line2: 'Dubai, United Arab Emirates',
          full: 'Al Quoz Industrial Area 3, Warehouse 14, Dubai, UAE',
          cityStateZip: 'Dubai, UAE',
          jurisdiction: 'UAE Commercial License',
        },
        footer: {
          ...baseSiteConfig.footer,
          websiteUrl: 'https://www.gulfhorizontrading.com',
          domain: 'gulfhorizontrading.com',
        },
        theme: {
          primaryNavy: '#0f172a',
          secondaryTeal: '#1e293b',
          accentTeal: '#0d9488',
          accentHover: '#0f766e',
          accentGold: '#14b8a6',
          bgLight: '#f8fafc',
        },
      }),
    },
    {
      slug: 'pacific-supply-corp',
      domain: 'pacificsupplycorp.com',
      name: 'Pacific Supply Corp',
      clientEmail: 'ops@pacificsupplycorp.com',
      clientAccessCode: 'Pacific@2026',
      updatedAt: now,
      config: buildSeededConfig({
        companyName: 'Pacific Supply Corp',
        shortName: 'Pacific Supply',
        legalName: 'PACIFIC SUPPLY CORP',
        tagline: 'North America Bulk Distribution & Sourcing',
        eyebrowStandard: 'THE PACIFIC SUPPLY STANDARD',
        email: 'support@pacificsupplycorp.com',
        website: 'www.pacificsupplycorp.com',
        phonePrimary: '(+1) 307 555 0148',
        phonePrimaryTel: '+13075550148',
        phoneDirect: '(+1) 307 555 0148',
        phoneDirectTel: '+13075550148',
        whatsappNumber: '13075550148',
        whatsappDisplay: '(+1) 307 555 0148',
        address: {
          line1: '1309 Coffeen Avenue, Suite 1200',
          line2: 'Sheridan, WY 82801, USA',
          full: '1309 Coffeen Avenue, Suite 1200, Sheridan, WY 82801',
          cityStateZip: 'Sheridan, WY 82801',
          jurisdiction: 'Wyoming Corp Registered',
        },
        footer: {
          ...baseSiteConfig.footer,
          websiteUrl: 'https://www.pacificsupplycorp.com',
          domain: 'pacificsupplycorp.com',
        },
        theme: {
          primaryNavy: '#111827',
          secondaryTeal: '#1f2937',
          accentTeal: '#2563eb',
          accentHover: '#1d4ed8',
          accentGold: '#3b82f6',
          bgLight: '#f8fafc',
        },
      }),
    },
  ];
}

function readLocalWebsites() {
  if (typeof window === 'undefined') return getInitialSeedWebsites();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.WEBSITES);
    if (!raw) {
      const seeded = getInitialSeedWebsites();
      window.localStorage.setItem(STORAGE_KEYS.WEBSITES, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = getInitialSeedWebsites();
      window.localStorage.setItem(STORAGE_KEYS.WEBSITES, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch (e) {
    return getInitialSeedWebsites();
  }
}

function writeLocalWebsites(websites) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.WEBSITES, JSON.stringify(websites));
  } catch (e) {
    // Ignore storage quota errors
  }
}

async function ensureLocalUsersSeeded() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // Fall through to seed
  }

  const superHash = await hashPassword(DEFAULT_SUPER_ADMIN.password);
  const gulfHash = await hashPassword('Gulf@2026');
  const pacificHash = await hashPassword('Pacific@2026');
  const seededUsers = [
    {
      email: DEFAULT_SUPER_ADMIN.email,
      passwordHash: superHash,
      role: 'super_admin',
      assignedSlug: null,
    },
    {
      email: 'manager@gulfhorizontrading.com',
      passwordHash: gulfHash,
      role: 'client',
      assignedSlug: 'gulf-horizon-trading',
    },
    {
      email: 'ops@pacificsupplycorp.com',
      passwordHash: pacificHash,
      role: 'client',
      assignedSlug: 'pacific-supply-corp',
    },
  ];
  window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seededUsers));
  return seededUsers;
}

function writeLocalUsers(users) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// ---------------------------------------------------------------------------
// Supabase Dynamic Client Management
// ---------------------------------------------------------------------------

let cachedClientKey = '';
let cachedClient = null;

const DEFAULT_SUPABASE_URL = 'https://pqppjvxueopgpxhtowrl.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_btUr5G2IYujuiioUrS591A_cDJvXKZ_';

export function getSupabaseConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY).trim();
  let localCreds = { url: '', anonKey: '' };

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.SUPABASE_CREDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        localCreds = {
          url: (parsed.url || '').trim(),
          anonKey: (parsed.anonKey || '').trim(),
        };
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  const url = localCreds.url || envUrl;
  const anonKey = localCreds.anonKey || envKey;
  const source = localCreds.url ? 'admin_settings' : envUrl ? 'env' : 'none';

  return {
    url,
    anonKey,
    source,
    configured: Boolean(url && anonKey),
  };
}

export function saveSupabaseConfig(url, anonKey) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEYS.SUPABASE_CREDS,
    JSON.stringify({
      url: (url || '').trim(),
      anonKey: (anonKey || '').trim(),
    })
  );
  cachedClient = null;
  cachedClientKey = '';
  notifyStoreUpdate();
}

export function clearSupabaseConfig() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEYS.SUPABASE_CREDS);
  cachedClient = null;
  cachedClientKey = '';
  notifyStoreUpdate();
}

export function getSupabaseClient() {
  const { url, anonKey, configured } = getSupabaseConfig();
  if (!configured) return null;
  const cacheKey = `${url}::${anonKey}`;
  if (cachedClient && cachedClientKey === cacheKey) {
    return cachedClient;
  }
  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  cachedClientKey = cacheKey;
  return cachedClient;
}

export async function testSupabaseConnection() {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: 'No Supabase Project URL and Anon Key configured.' };
  }
  const { error, count } = await client
    .from('websites')
    .select('slug', { count: 'exact', head: true });

  if (error) {
    return {
      ok: false,
      message: error.message || 'Connection failed. Verify URL, key, and SQL schema.',
    };
  }
  return {
    ok: true,
    count: count ?? 0,
    message: `Connected to Supabase (${count ?? 0} website records found).`,
  };
}

// ---------------------------------------------------------------------------
// Slug & Domain Resolution
// ---------------------------------------------------------------------------

export function sanitizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeDomain(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split(':')[0];
}

export function resolveRequestedSiteIdentifier() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const querySite = sanitizeSlug(params.get('site'));
    if (querySite) return { type: 'slug', value: querySite };
  }

  const envSlug = sanitizeSlug(import.meta.env.VITE_SITE_SLUG);
  if (envSlug) return { type: 'slug', value: envSlug };

  if (typeof window !== 'undefined') {
    const host = normalizeDomain(window.location.hostname);
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return { type: 'domain', value: host };
    }
  }

  return { type: 'slug', value: DEFAULT_SITE_SLUG };
}

function mapSupabaseRowToWebsite(row) {
  return {
    id: row.id,
    slug: row.slug,
    domain: row.domain || '',
    name: row.name || row.config?.companyName || row.slug,
    clientEmail: row.client_email || '',
    clientAccessCode: row.client_access_code || '',
    updatedAt: row.updated_at || new Date().toISOString(),
    config: mergeWithDefaultConfig(row.config || {}),
  };
}

// ---------------------------------------------------------------------------
// CRUD Operations (Supabase + Instant Local Cache)
// ---------------------------------------------------------------------------

export async function fetchAllWebsites() {
  const local = readLocalWebsites().map((w) => ({
    ...w,
    config: mergeWithDefaultConfig(w.config),
  }));

  const client = getSupabaseClient();
  if (!client) return local;

  try {
    const { data, error } = await client
      .from('websites')
      .select('id, slug, domain, name, config, client_email, client_access_code, updated_at')
      .order('slug', { ascending: true });

    if (error || !Array.isArray(data) || data.length === 0) {
      return local;
    }

    const mapped = data.map(mapSupabaseRowToWebsite);
    writeLocalWebsites(mapped);
    return mapped;
  } catch (e) {
    return local;
  }
}

export async function fetchWebsiteBySlug(slug) {
  const cleanSlug = sanitizeSlug(slug) || DEFAULT_SITE_SLUG;
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('websites')
        .select('id, slug, domain, name, config, client_email, client_access_code, updated_at')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (!error && data) {
        return mapSupabaseRowToWebsite(data);
      }
    } catch (e) {
      // Fallback to local
    }
  }

  const all = readLocalWebsites();
  const match = all.find((w) => w.slug === cleanSlug) || all[0];
  return match
    ? { ...match, config: mergeWithDefaultConfig(match.config) }
    : {
        slug: cleanSlug,
        domain: '',
        name: baseSiteConfig.companyName,
        clientEmail: '',
        clientAccessCode: '',
        updatedAt: new Date().toISOString(),
        config: mergeWithDefaultConfig({}),
      };
}

export async function resolveActiveWebsite() {
  const identifier = resolveRequestedSiteIdentifier();
  const client = getSupabaseClient();

  if (client) {
    try {
      if (identifier.type === 'domain') {
        const { data: allRows } = await client
          .from('websites')
          .select('id, slug, domain, name, config, client_email, client_access_code, updated_at');

        if (Array.isArray(allRows) && allRows.length > 0) {
          const domainMatch = allRows.find(
            (r) => normalizeDomain(r.domain) === identifier.value
          );
          if (domainMatch) return mapSupabaseRowToWebsite(domainMatch);
          const defaultMatch = allRows.find((r) => r.slug === DEFAULT_SITE_SLUG);
          if (defaultMatch) return mapSupabaseRowToWebsite(defaultMatch);
        }
      } else {
        const { data } = await client
          .from('websites')
          .select('id, slug, domain, name, config, client_email, client_access_code, updated_at')
          .eq('slug', identifier.value)
          .maybeSingle();
        if (data) return mapSupabaseRowToWebsite(data);
      }
    } catch (e) {
      // Fall back to local resolution
    }
  }

  const allLocal = readLocalWebsites();
  let matched = null;
  if (identifier.type === 'domain') {
    matched = allLocal.find((w) => normalizeDomain(w.domain) === identifier.value);
  }
  if (!matched) {
    matched = allLocal.find((w) => w.slug === identifier.value);
  }
  if (!matched) {
    matched = allLocal.find((w) => w.slug === DEFAULT_SITE_SLUG) || allLocal[0];
  }

  return {
    ...matched,
    config: mergeWithDefaultConfig(matched.config),
  };
}

export async function saveWebsiteConfig(slug, newConfig, meta = {}, actor = null) {
  const cleanSlug = sanitizeSlug(slug);
  if (!cleanSlug) throw new Error('Invalid website slug');

  if (actor?.role === 'client' && actor.assignedSlug !== cleanSlug) {
    throw new Error('Unauthorized: Clients can only edit their assigned website.');
  }

  const mergedConfig = mergeWithDefaultConfig(newConfig);
  const all = readLocalWebsites();
  const existingIdx = all.findIndex((w) => w.slug === cleanSlug);
  const existing = existingIdx >= 0 ? all[existingIdx] : null;
  const now = new Date().toISOString();

  const updatedRecord = {
    slug: cleanSlug,
    domain:
      actor?.role === 'super_admin' && meta.domain !== undefined
        ? normalizeDomain(meta.domain)
        : existing?.domain || '',
    name: mergedConfig.companyName || meta.name || existing?.name || cleanSlug,
    clientEmail:
      meta.clientEmail !== undefined ? meta.clientEmail : existing?.clientEmail || '',
    clientAccessCode:
      meta.clientAccessCode !== undefined
        ? meta.clientAccessCode
        : existing?.clientAccessCode || '',
    updatedAt: now,
    config: mergedConfig,
  };

  if (existingIdx >= 0) {
    all[existingIdx] = updatedRecord;
  } else {
    all.push(updatedRecord);
  }
  writeLocalWebsites(all);

  // Persist to Supabase if configured
  let supabaseSynced = false;
  let supabaseWarning = '';
  const client = getSupabaseClient();
  if (client && actor) {
    try {
      const { data, error } = await client.rpc('cms_upsert_website', {
        p_actor_email: actor.email,
        p_actor_password_hash: actor.passwordHash,
        p_slug: cleanSlug,
        p_domain: updatedRecord.domain || null,
        p_name: updatedRecord.name,
        p_config: mergedConfig,
        p_client_email: updatedRecord.clientEmail || null,
        p_client_access_code: updatedRecord.clientAccessCode || null,
      });

      if (error) {
        supabaseWarning = error.message;
      } else if (data && data.ok === false) {
        throw new Error(data.error || 'Supabase rejected update');
      } else {
        supabaseSynced = true;
      }
    } catch (err) {
      if (err.message && err.message.includes('Forbidden')) {
        throw err;
      }
      supabaseWarning = err.message || 'Saved locally; Supabase sync skipped.';
    }
  }

  notifyStoreUpdate(cleanSlug);
  return { website: updatedRecord, supabaseSynced, supabaseWarning };
}

export async function createNewWebsite(
  { slug, domain, companyName, clientEmail = '', clientPassword = '', cloneFromSlug = '' },
  actor
) {
  if (actor?.role !== 'super_admin') {
    throw new Error('Only Super Admin can create new websites.');
  }

  const cleanSlug = sanitizeSlug(slug || companyName);
  if (!cleanSlug) throw new Error('Website slug or name is required.');

  const all = readLocalWebsites();
  if (all.some((w) => w.slug === cleanSlug)) {
    throw new Error(`Website with slug "${cleanSlug}" already exists.`);
  }

  const cleanDomain = normalizeDomain(domain);
  let templateConfig = cloneDeep(baseSiteConfig);
  if (cloneFromSlug) {
    const source = all.find((w) => w.slug === cloneFromSlug);
    if (source?.config) {
      templateConfig = cloneDeep(source.config);
    }
  }

  const finalName = (companyName || '').trim() || cleanSlug;
  const domainDisplay = cleanDomain || `${cleanSlug}.com`;

  const newConfig = mergeWithDefaultConfig({
    ...templateConfig,
    companyName: finalName,
    shortName: finalName.split(' ').slice(0, 2).join(' '),
    legalName: finalName.toUpperCase(),
    eyebrowStandard: `THE ${finalName.toUpperCase()} STANDARD`,
    email: `info@${domainDisplay}`,
    website: `www.${domainDisplay}`,
    footer: {
      ...(templateConfig.footer || baseSiteConfig.footer),
      domain: domainDisplay,
      websiteUrl: `https://www.${domainDisplay}`,
    },
  });

  const saved = await saveWebsiteConfig(
    cleanSlug,
    newConfig,
    {
      domain: cleanDomain,
      name: finalName,
      clientEmail: (clientEmail || '').trim().toLowerCase(),
      clientAccessCode: clientPassword || '',
    },
    actor
  );

  if (clientEmail && clientPassword) {
    await saveClientAccess(
      {
        slug: cleanSlug,
        clientEmail,
        clientPassword,
      },
      actor
    );
  }

  return saved.website;
}

export async function generateWebsiteSlots(targetTotal = 20, actor) {
  if (actor?.role !== 'super_admin') {
    throw new Error('Only Super Admin can generate website slots.');
  }
  const existing = readLocalWebsites();
  const created = [];
  let index = 1;

  while (existing.length + created.length < targetTotal && index <= 50) {
    const padded = String(index).padStart(2, '0');
    const slug = `site-${padded}`;
    const already =
      existing.some((w) => w.slug === slug) || created.some((w) => w.slug === slug);

    if (!already) {
      const site = await createNewWebsite(
        {
          slug,
          domain: `site-${padded}.example.com`,
          companyName: `Storefront ${padded} LLC`,
        },
        actor
      );
      created.push(site);
    }
    index += 1;
  }

  return created;
}

export async function deleteWebsite(slug, actor) {
  if (actor?.role !== 'super_admin') {
    throw new Error('Only Super Admin can delete websites.');
  }
  const cleanSlug = sanitizeSlug(slug);
  const all = readLocalWebsites();
  if (all.length <= 1) {
    throw new Error('Cannot delete the last remaining website.');
  }

  const next = all.filter((w) => w.slug !== cleanSlug);
  writeLocalWebsites(next);

  const users = await ensureLocalUsersSeeded();
  writeLocalUsers(users.filter((u) => u.assignedSlug !== cleanSlug));

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.rpc('cms_delete_website', {
        p_actor_email: actor.email,
        p_actor_password_hash: actor.passwordHash,
        p_slug: cleanSlug,
      });
    } catch (e) {
      // Ignore remote delete error if schema not deployed yet
    }
  }

  notifyStoreUpdate();
  return next;
}

// ---------------------------------------------------------------------------
// Authentication & Client Access Control
// ---------------------------------------------------------------------------

export function getSavedSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveSession(session) {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEYS.SESSION);
  } else {
    window.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }
}

export async function authenticateUser(email, password) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPassword = String(password || '');
  if (!cleanEmail || !cleanPassword) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const passwordHash = await hashPassword(cleanPassword);
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.rpc('cms_login', {
        p_email: cleanEmail,
        p_password_hash: passwordHash,
      });

      if (!error && data) {
        if (data.ok && data.user) {
          const session = {
            email: data.user.email,
            role: data.user.role,
            assignedSlug: data.user.assignedSlug || null,
            passwordHash,
          };
          saveSession(session);
          return { ok: true, user: session };
        }
        // If DB has users and rejected login, check if super admin needs bootstrap first
        if (
          cleanEmail === DEFAULT_SUPER_ADMIN.email &&
          cleanPassword === DEFAULT_SUPER_ADMIN.password
        ) {
          const boot = await client.rpc('cms_bootstrap_super_admin', {
            p_email: cleanEmail,
            p_password_hash: passwordHash,
          });
          if (boot.data?.bootstrapped) {
            const session = {
              email: cleanEmail,
              role: 'super_admin',
              assignedSlug: null,
              passwordHash,
            };
            saveSession(session);
            return { ok: true, user: session };
          }
        }
        return { ok: false, error: data.error || 'Invalid email or password.' };
      }
    } catch (e) {
      // Fall back to local auth if RPC is not deployed yet
    }
  }

  const users = await ensureLocalUsersSeeded();
  const matched = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === passwordHash
  );
  if (!matched) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const session = {
    email: matched.email,
    role: matched.role,
    assignedSlug: matched.assignedSlug || null,
    passwordHash,
  };
  saveSession(session);
  return { ok: true, user: session };
}

export async function saveClientAccess({ slug, clientEmail, clientPassword }, actor) {
  if (actor?.role !== 'super_admin') {
    throw new Error('Only Super Admin can assign client access.');
  }

  const cleanSlug = sanitizeSlug(slug);
  const cleanEmail = String(clientEmail || '').trim().toLowerCase();
  const cleanPass = String(clientPassword || '').trim();

  if (!cleanSlug || !cleanEmail || !cleanPass) {
    throw new Error('Website, client email, and password are required.');
  }

  const clientHash = await hashPassword(cleanPass);

  // Update local website record
  const all = readLocalWebsites();
  const idx = all.findIndex((w) => w.slug === cleanSlug);
  if (idx === -1) throw new Error('Website not found.');
  all[idx] = {
    ...all[idx],
    clientEmail: cleanEmail,
    clientAccessCode: cleanPass,
    updatedAt: new Date().toISOString(),
  };
  writeLocalWebsites(all);

  // Update local users list (one active client credential per email, replacing prior client for same slug)
  const users = await ensureLocalUsersSeeded();
  const filtered = users.filter(
    (u) => !(u.role === 'client' && u.assignedSlug === cleanSlug) && u.email !== cleanEmail
  );
  filtered.push({
    email: cleanEmail,
    passwordHash: clientHash,
    role: 'client',
    assignedSlug: cleanSlug,
  });
  writeLocalUsers(filtered);

  // Sync to Supabase if connected
  let supabaseSynced = false;
  let supabaseWarning = '';
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.rpc('cms_set_client_access', {
        p_actor_email: actor.email,
        p_actor_password_hash: actor.passwordHash,
        p_slug: cleanSlug,
        p_client_email: cleanEmail,
        p_client_password_hash: clientHash,
        p_client_access_code: cleanPass,
      });

      if (error) {
        supabaseWarning = error.message;
      } else if (data && data.ok === false) {
        throw new Error(data.error || 'Failed to update client access in Supabase.');
      } else {
        supabaseSynced = true;
      }
    } catch (err) {
      supabaseWarning = err.message || 'Saved locally; Supabase sync skipped.';
    }
  }

  notifyStoreUpdate(cleanSlug);
  return {
    slug: cleanSlug,
    clientEmail: cleanEmail,
    clientPassword: cleanPass,
    supabaseSynced,
    supabaseWarning,
  };
}

export async function updateSuperAdminPassword(currentPassword, newPassword, actor) {
  if (actor?.role !== 'super_admin') {
    throw new Error('Super Admin login required.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  const oldHash = await hashPassword(currentPassword);
  const newHash = await hashPassword(newPassword);

  if (oldHash !== actor.passwordHash) {
    throw new Error('Current password is incorrect.');
  }

  const users = await ensureLocalUsersSeeded();
  const updatedUsers = users.map((u) =>
    u.email.toLowerCase() === actor.email.toLowerCase() && u.role === 'super_admin'
      ? { ...u, passwordHash: newHash }
      : u
  );
  writeLocalUsers(updatedUsers);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.rpc('cms_update_super_admin_password', {
        p_actor_email: actor.email,
        p_old_password_hash: oldHash,
        p_new_password_hash: newHash,
      });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error);
    } catch (err) {
      throw new Error(err.message || 'Failed to update password in Supabase.');
    }
  }

  const nextSession = { ...actor, passwordHash: newHash };
  saveSession(nextSession);
  return nextSession;
}

export async function syncLocalSitesToSupabase(actor) {
  if (actor?.role !== 'super_admin') {
    throw new Error('Super Admin login required.');
  }
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Please enter and save Supabase URL and Anon Key first.');
  }

  // Ensure super_admin exists in Supabase if table was freshly created
  await client.rpc('cms_bootstrap_super_admin', {
    p_email: actor.email,
    p_password_hash: actor.passwordHash,
  });

  const localSites = readLocalWebsites();
  let syncedCount = 0;

  for (const site of localSites) {
    const { data, error } = await client.rpc('cms_upsert_website', {
      p_actor_email: actor.email,
      p_actor_password_hash: actor.passwordHash,
      p_slug: site.slug,
      p_domain: site.domain || null,
      p_name: site.name || site.config?.companyName || site.slug,
      p_config: mergeWithDefaultConfig(site.config),
      p_client_email: site.clientEmail || null,
      p_client_access_code: site.clientAccessCode || null,
    });

    if (error) throw new Error(error.message);
    if (data && data.ok === false) throw new Error(data.error);

    if (site.clientEmail && site.clientAccessCode) {
      const clientHash = await hashPassword(site.clientAccessCode);
      await client.rpc('cms_set_client_access', {
        p_actor_email: actor.email,
        p_actor_password_hash: actor.passwordHash,
        p_slug: site.slug,
        p_client_email: site.clientEmail,
        p_client_password_hash: clientHash,
        p_client_access_code: site.clientAccessCode,
      });
    }
    syncedCount += 1;
  }

  notifyStoreUpdate();
  return { syncedCount };
}

export function buildClientShareMessage(website) {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
  const liveUrl = website.domain
    ? `https://${website.domain}`
    : `${origin}/?site=${website.slug}`;
  const adminUrl = `${origin}/?site=${website.slug}#admin`;

  return [
    `Website Control Panel Access — ${website.name || website.slug}`,
    `Admin Panel URL: ${adminUrl}`,
    `Website URL: ${liveUrl}`,
    `Email: ${website.clientEmail || '(not set)'}`,
    `Password: ${website.clientAccessCode || '(set a password first)'}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// React Hook for Storefront
// ---------------------------------------------------------------------------

function resolveInitialLocalWebsite() {
  const identifier = resolveRequestedSiteIdentifier();
  const allLocal = readLocalWebsites();
  let matched = null;
  if (identifier.type === 'domain') {
    matched = allLocal.find((w) => normalizeDomain(w.domain) === identifier.value);
  }
  if (!matched) {
    matched = allLocal.find((w) => w.slug === identifier.value);
  }
  if (!matched) {
    matched = allLocal.find((w) => w.slug === DEFAULT_SITE_SLUG) || allLocal[0];
  }
  return matched;
}

export function useActiveSiteConfig() {
  const [state, setState] = useState(() => {
    const initial = resolveInitialLocalWebsite();
    return {
      website: initial,
      config: mergeWithDefaultConfig(initial?.config || {}),
      slug: initial?.slug || DEFAULT_SITE_SLUG,
      loading: true,
    };
  });

  const refresh = useCallback(async () => {
    const active = await resolveActiveWebsite();
    setState({
      website: active,
      config: active.config,
      slug: active.slug,
      loading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
    const onStoreChange = () => {
      refresh();
    };
    window.addEventListener(STORE_EVENT, onStoreChange);
    window.addEventListener('storage', onStoreChange);
    window.addEventListener('popstate', onStoreChange);
    return () => {
      window.removeEventListener(STORE_EVENT, onStoreChange);
      window.removeEventListener('storage', onStoreChange);
      window.removeEventListener('popstate', onStoreChange);
    };
  }, [refresh]);

  return { ...state, refresh };
}
