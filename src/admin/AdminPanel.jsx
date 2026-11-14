import React, { useState, useEffect, useCallback } from 'react';
import schemaSql from './supabase_schema.sql?raw';
import {
  authenticateUser,
  buildClientShareMessage,
  clearSupabaseConfig,
  createNewWebsite,
  deleteWebsite,
  fetchAllWebsites,
  fetchWebsiteBySlug,
  generateWebsiteSlots,
  getSavedSession,
  getSupabaseConfig,
  mergeWithDefaultConfig,
  saveClientAccess,
  saveSession,
  saveSupabaseConfig,
  saveWebsiteConfig,
  syncLocalSitesToSupabase,
  testSupabaseConnection,
  updateSuperAdminPassword,
  verifySavedSession,
} from './siteStore';
import './admin.css';

const CONFIG_TABS = [
  { id: 'identity', label: '01. Header & Hero' },
  { id: 'contact-info', label: '02. Phone, Email & Address' },
  { id: 'about', label: '03. About Us Page' },
  { id: 'contact-page', label: '04. Contact Us Section' },
  { id: 'footer', label: '05. Footer & Socials' },
];

const SUPER_ADMIN_TABS = [
  { id: 'directory', label: 'All Websites' },
  { id: 'access', label: 'Client Access' },
  { id: 'database', label: 'Supabase Connection' },
];

function toTelFormat(displayStr) {
  const trimmed = String(displayStr || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return trimmed.includes('+') ? `+${digits}` : digits;
}

function toWhatsAppDigits(displayStr) {
  return String(displayStr || '').replace(/\D/g, '');
}

export default function AdminPanel({ onExitAdmin }) {
  const [session, setSession] = useState(() => getSavedSession());
  const [verifyingSession, setVerifyingSession] = useState(() => Boolean(getSavedSession()));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [websites, setWebsites] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [activeTab, setActiveTab] = useState('identity');
  const [draftConfig, setDraftConfig] = useState(() => mergeWithDefaultConfig({}));
  const [draftDomain, setDraftDomain] = useState('');
  const [loadingSites, setLoadingSites] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'info' | 'error', text: string }

  // New Website Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSiteForm, setNewSiteForm] = useState({
    companyName: '',
    slug: '',
    domain: '',
    cloneFromSlug: 'mmshahfaisalllc',
    clientEmail: '',
    clientPassword: '',
  });

  // Client Access Form State
  const [accessSlug, setAccessSlug] = useState('');
  const [accessEmail, setAccessEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [copiedSlug, setCopiedSlug] = useState('');

  // Super Admin Password Change
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  // Supabase Settings State
  const [sbUrl, setSbUrl] = useState(() => getSupabaseConfig().url);
  const [sbKey, setSbKey] = useState(() => getSupabaseConfig().anonKey);
  const [sbStatus, setSbStatus] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSecondaryPhone, setShowSecondaryPhone] = useState(false);

  const showNotice = useCallback((text, type = 'info') => {
    setNotice({ text, type });
  }, []);

  const loadWorkspaceData = useCallback(
    async (currentSession) => {
      if (!currentSession) return;
      setLoadingSites(true);
      try {
        if (currentSession.role === 'client') {
          const site = await fetchWebsiteBySlug(currentSession.assignedSlug);
          setWebsites([site]);
          setSelectedSlug(site.slug);
          setDraftConfig(mergeWithDefaultConfig(site.config));
          setDraftDomain(site.domain || '');
        } else {
          const all = await fetchAllWebsites();
          setWebsites(all);
          const urlSite = new URLSearchParams(window.location.search).get('site');
          const preferred =
            all.find((w) => w.slug === selectedSlug) ||
            all.find((w) => w.slug === urlSite) ||
            all[0];
          if (preferred) {
            setSelectedSlug(preferred.slug);
            setDraftConfig(mergeWithDefaultConfig(preferred.config));
            setDraftDomain(preferred.domain || '');
            setAccessSlug((prev) => prev || preferred.slug);
          }
        }
      } catch (err) {
        showNotice(err.message || 'Failed to load website data.', 'error');
      } finally {
        setLoadingSites(false);
      }
    },
    [selectedSlug, showNotice]
  );

  useEffect(() => {
    let cancelled = false;
    const initial = getSavedSession();
    if (!initial) {
      setSession(null);
      setVerifyingSession(false);
      return () => {};
    }
    verifySavedSession(initial).then((verified) => {
      if (cancelled) return;
      if (verified) {
        setSession(verified);
        if (verified.role === 'client') {
          setSelectedSlug(verified.assignedSlug || '');
        }
      } else {
        setSession(null);
      }
      setVerifyingSession(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session && !verifyingSession) {
      loadWorkspaceData(session);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, verifyingSession]);

  useEffect(() => {
    if (!accessSlug || websites.length === 0) return;
    const target = websites.find((w) => w.slug === accessSlug);
    if (target) {
      setAccessEmail(target.clientEmail || '');
      setAccessPassword(target.clientAccessCode || '');
    }
  }, [accessSlug, websites]);

  const handleSelectWebsite = (slug) => {
    if (session?.role !== 'super_admin') return;
    const target = websites.find((w) => w.slug === slug);
    if (!target) return;
    setSelectedSlug(target.slug);
    setDraftConfig(mergeWithDefaultConfig(target.config));
    setDraftDomain(target.domain || '');
    setNotice(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginBusy(true);
    try {
      const res = await authenticateUser(loginEmail, loginPassword);
      if (!res.ok) {
        setLoginError(res.error || 'Authentication failed.');
      } else {
        setSession(res.user);
        setVerifyingSession(false);
        setActiveTab('identity');
        if (res.user.role === 'client') {
          setSelectedSlug(res.user.assignedSlug || '');
        }
        setLoginPassword('');
      }
    } catch (err) {
      setLoginError(err.message || 'Unable to sign in.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleSignOut = () => {
    saveSession(null);
    setSession(null);
    setNotice(null);
  };

  const updateConfigField = (path, value) => {
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let ref = next;
      for (let i = 0; i < parts.length - 1; i += 1) {
        if (!ref[parts[i]] || typeof ref[parts[i]] !== 'object') {
          ref[parts[i]] = {};
        }
        ref = ref[parts[i]];
      }
      ref[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const updateAboutCard = (index, field, value) => {
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const cards = Array.isArray(next.about?.cards) ? [...next.about.cards] : [];
      cards[index] = { ...(cards[index] || {}), [field]: value };
      next.about = { ...(next.about || {}), cards };
      return next;
    });
  };

  const updateSocialUrl = (index, url) => {
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const socials = Array.isArray(next.footer?.socials) ? [...next.footer.socials] : [];
      if (socials[index]) {
        socials[index] = { ...socials[index], url };
      }
      next.footer = { ...(next.footer || {}), socials };
      return next;
    });
  };

  const handleCompanyNameChange = (nameVal) => {
    const trimmed = String(nameVal || '');
    const shortVal =
      trimmed.replace(/\s+(LLC|L\.L\.C\.|INC\.?|LTD\.?|CORP\.?)$/i, '').trim() || trimmed;
    const legalVal = trimmed.toUpperCase();
    setDraftConfig((prev) => ({
      ...prev,
      companyName: nameVal,
      shortName: shortVal,
      legalName: legalVal,
    }));
  };

  const handleMainPhoneChange = (displayVal) => {
    const telVal = toTelFormat(displayVal);
    const digitsVal = toWhatsAppDigits(displayVal);
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const directMatchesPrimary = !showSecondaryPhone || prev.phoneDirect === prev.phonePrimary;
      const waMatchesPrimary =
        !prev.whatsappDisplay ||
        prev.whatsappDisplay === prev.phonePrimary ||
        prev.whatsappNumber === toWhatsAppDigits(prev.phonePrimary);
      next.phonePrimary = displayVal;
      next.phonePrimaryTel = telVal;
      if (directMatchesPrimary) {
        next.phoneDirect = displayVal;
        next.phoneDirectTel = telVal;
      }
      if (waMatchesPrimary) {
        next.whatsappDisplay = displayVal;
        next.whatsappNumber = digitsVal;
      }
      return next;
    });
  };

  const handleDirectPhoneChange = (displayVal) => {
    const telVal = toTelFormat(displayVal);
    setDraftConfig((prev) => ({
      ...prev,
      phoneDirect: displayVal,
      phoneDirectTel: telVal,
    }));
  };

  const handleWhatsAppChange = (displayVal) => {
    const digitsOnly = toWhatsAppDigits(displayVal);
    setDraftConfig((prev) => ({
      ...prev,
      whatsappDisplay: displayVal,
      whatsappNumber: digitsOnly,
    }));
  };

  const handleAddressLineChange = (field, value) => {
    setDraftConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.address = { ...(next.address || {}), [field]: value };
      const line1 = field === 'line1' ? value : next.address.line1;
      const line2 = field === 'line2' ? value : next.address.line2;
      next.address.full = [line1, line2].filter(Boolean).join(', ');
      return next;
    });
  };

  const handleSaveCurrentSite = async (e) => {
    if (e) e.preventDefault();
    if (!session) return;
    const targetSlug = session.role === 'client' ? session.assignedSlug : selectedSlug;
    if (!targetSlug) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await saveWebsiteConfig(
        targetSlug,
        draftConfig,
        session.role === 'super_admin' ? { domain: draftDomain } : {},
        session
      );
      setWebsites((prev) =>
        prev.map((w) => (w.slug === targetSlug ? res.website : w))
      );
      if (res.supabaseSynced) {
        showNotice(`Saved "${res.website.name}" and synced to Supabase.`);
      } else if (res.supabaseWarning) {
        showNotice(
          `Saved "${res.website.name}" locally. Supabase notice: ${res.supabaseWarning}`
        );
      } else {
        showNotice(`Saved "${res.website.name}" locally.`);
      }
    } catch (err) {
      showNotice(err.message || 'Failed to save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWebsite = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await createNewWebsite(newSiteForm, session);
      const updated = await fetchAllWebsites();
      setWebsites(updated);
      setSelectedSlug(created.slug);
      setDraftConfig(mergeWithDefaultConfig(created.config));
      setDraftDomain(created.domain || '');
      setAccessSlug(created.slug);
      setShowNewModal(false);
      setNewSiteForm({
        companyName: '',
        slug: '',
        domain: '',
        cloneFromSlug: 'mmshahfaisalllc',
        clientEmail: '',
        clientPassword: '',
      });
      setActiveTab('identity');
      showNotice(`Created website "${created.name}" (${created.slug}).`);
    } catch (err) {
      showNotice(err.message || 'Could not create website.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate20Slots = async () => {
    setSaving(true);
    try {
      const created = await generateWebsiteSlots(20, session);
      const updated = await fetchAllWebsites();
      setWebsites(updated);
      showNotice(
        created.length > 0
          ? `Initialized ${created.length} new website slots. Total websites: ${updated.length}.`
          : `Directory already contains ${updated.length} websites.`
      );
    } catch (err) {
      showNotice(err.message || 'Could not generate slots.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebsite = async (slug) => {
    if (!window.confirm(`Delete website "${slug}" and its client login?`)) return;
    setSaving(true);
    try {
      const next = await deleteWebsite(slug, session);
      setWebsites(next);
      if (selectedSlug === slug && next[0]) {
        handleSelectWebsite(next[0].slug);
      }
      showNotice(`Deleted website "${slug}".`);
    } catch (err) {
      showNotice(err.message || 'Failed to delete website.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClientAccess = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveClientAccess(
        {
          slug: accessSlug,
          clientEmail: accessEmail,
          clientPassword: accessPassword,
        },
        session
      );
      const updated = await fetchAllWebsites();
      setWebsites(updated);
      showNotice(
        res.supabaseSynced
          ? `Client access updated for "${res.slug}" and synced to Supabase.`
          : `Client access updated locally for "${res.slug}".`
      );
    } catch (err) {
      showNotice(err.message || 'Failed to update client access.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAccess = async (website) => {
    const text = buildClientShareMessage(website);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlug(website.slug);
      setTimeout(() => setCopiedSlug(''), 2200);
    } catch (err) {
      showNotice('Clipboard permission denied. Copy manually from the form.', 'error');
    }
  };

  const handleUpdateSuperPassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      showNotice('New password and confirmation do not match.', 'error');
      return;
    }
    setSaving(true);
    try {
      const nextSession = await updateSuperAdminPassword(
        pwForm.current,
        pwForm.next,
        session
      );
      setSession(nextSession);
      setPwForm({ current: '', next: '', confirm: '' });
      showNotice('Super Admin password updated.');
    } catch (err) {
      showNotice(err.message || 'Could not update password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndTestSupabase = async (e) => {
    e.preventDefault();
    saveSupabaseConfig(sbUrl, sbKey);
    setSbStatus('Testing connection...');
    const result = await testSupabaseConnection();
    setSbStatus(result.message);
    if (result.ok) {
      showNotice(result.message);
      loadWorkspaceData(session);
    } else {
      showNotice(result.message, 'error');
    }
  };

  const handleSyncToSupabase = async () => {
    setSaving(true);
    try {
      const res = await syncLocalSitesToSupabase(session);
      setSbStatus(`Synced ${res.syncedCount} websites to Supabase.`);
      showNotice(`Uploaded ${res.syncedCount} websites and client credentials to Supabase.`);
    } catch (err) {
      showNotice(err.message || 'Sync failed. Verify SQL schema is installed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearSupabaseOverride = () => {
    clearSupabaseConfig();
    const cfg = getSupabaseConfig();
    setSbUrl(cfg.url);
    setSbKey(cfg.anonKey);
    setSbStatus('Cleared local Supabase override.');
    showNotice('Cleared saved Supabase URL/Key.');
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(schemaSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2200);
    } catch (err) {
      showNotice('Unable to copy SQL automatically.', 'error');
    }
  };

  // -------------------------------------------------------------------------
  // Render: Session Verification & Login Gate
  // -------------------------------------------------------------------------
  if (verifyingSession) {
    return (
      <div className="adm-root">
        <div className="adm-login-wrap">
          <div className="adm-login-card" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div className="adm-login-eyebrow">Multi-Website Control Plane</div>
            <h1 className="adm-login-title">Verifying Session</h1>
            <p className="adm-login-subtitle">Checking credentials with server...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    const sbConfigured = getSupabaseConfig().configured;
    return (
      <div className="adm-root">
        <div className="adm-login-wrap">
          <div className="adm-login-card">
            <div className="adm-login-header">
              <div className="adm-login-eyebrow">Multi-Website Control Plane</div>
              <h1 className="adm-login-title">Admin Panel Sign In</h1>
              <p className="adm-login-subtitle">
                Enter your Super Admin or Client credentials to manage website settings.
              </p>
            </div>

            {loginError && (
              <div className="adm-notice adm-notice-error" style={{ marginBottom: '16px' }}>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="adm-field">
                <label className="adm-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="adm-input"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="adm-field">
                <label className="adm-label">Password</label>
                <input
                  type="password"
                  required
                  className="adm-input"
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loginBusy}
                className="adm-btn adm-btn-primary adm-btn-full"
                style={{ marginTop: '4px' }}
              >
                {loginBusy ? 'Verifying...' : 'Sign In'}
              </button>
            </form>

            <div className="adm-login-footer">
              <span>Storage: {sbConfigured ? 'Supabase Connected' : 'Local Storage Mode'}</span>
              {onExitAdmin && (
                <button
                  type="button"
                  onClick={() => onExitAdmin()}
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                >
                  Back to Website
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin = session.role === 'super_admin';
  const currentWebsite = websites.find((w) => w.slug === selectedSlug);
  const isConfigTab = CONFIG_TABS.some((t) => t.id === activeTab);
  const sbConfig = getSupabaseConfig();

  return (
    <div className="adm-root">
      {/* Top Bar */}
      <header className="adm-topbar">
        <div className="adm-topbar-left">
          <div className="adm-brand-block">
            <span className="adm-brand-title">Control Panel</span>
            <span className="adm-role-tag">
              {isSuperAdmin ? 'Super Admin' : 'Client Access'}
            </span>
          </div>

          <div className="adm-divider-v" />

          {isSuperAdmin ? (
            <div className="adm-switcher-group">
              <select
                aria-label="Select website"
                className="adm-select-switcher"
                value={selectedSlug}
                onChange={(e) => handleSelectWebsite(e.target.value)}
              >
                {websites.map((site) => (
                  <option key={site.slug} value={site.slug}>
                    {site.name} ({site.domain || site.slug})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={() => setShowNewModal(true)}
              >
                <span>New Website</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>
                {currentWebsite?.name || selectedSlug}
              </span>
              {currentWebsite?.domain && (
                <span className="adm-mono" style={{ fontSize: '12px', color: '#71717a' }}>
                  {currentWebsite.domain}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="adm-topbar-right">
          <span className="adm-user-label adm-mono">{session.email}</span>
          {onExitAdmin && (
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={() => onExitAdmin(selectedSlug)}
            >
              <span>View Live Website</span>
            </button>
          )}
          {isConfigTab && (
            <button
              type="button"
              disabled={saving || loadingSites}
              className="adm-btn adm-btn-primary"
              onClick={handleSaveCurrentSite}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={handleSignOut}
          >
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="adm-shell">
        {/* Sidebar Navigation */}
        <aside className="adm-sidebar">
          <div className="adm-nav-group">
            <div className="adm-nav-group-label">Website Settings</div>
            {CONFIG_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`adm-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="adm-nav-item-inner">
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>

          {isSuperAdmin && (
            <div className="adm-nav-group">
              <div className="adm-nav-group-label">Platform Management</div>
              {SUPER_ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`adm-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="adm-nav-item-inner">
                    <span>{tab.label}</span>
                  </span>
                  {tab.id === 'directory' && (
                    <span className="adm-nav-count">{websites.length}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Active Panel Content */}
        <main className="adm-main">
          {notice && (
            <div className={`adm-notice ${notice.type === 'error' ? 'adm-notice-error' : ''}`}>
              <span>{notice.text}</span>
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => setNotice(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 01. Header & Hero */}
          {activeTab === 'identity' && (
            <form onSubmit={handleSaveCurrentSite} className="adm-card">
              <div className="adm-card-header">
                <div>
                  <h2 className="adm-card-title">01. Header & Hero</h2>
                  <p className="adm-card-subtitle">
                    Matches the top navbar, website title, blue phone bar, and opening hero banner.
                  </p>
                </div>
                <span className="adm-status-pill adm-mono">slug: {selectedSlug}</span>
              </div>

              <div className="adm-form-grid">
                <div className="adm-field">
                  <label className="adm-label">1.1 Website / Company Name</label>
                  <input
                    className="adm-input"
                    value={draftConfig.companyName || ''}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Top Header, Browser Tab, About Us, Contact Us &amp; Footer (auto-updates Legal &amp; Short Name)
                  </span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">1.2 Header Subtitle (Under Company Name)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.tagline || ''}
                    onChange={(e) => updateConfigField('tagline', e.target.value)}
                  />
                  <span className="adm-help">Website: Directly below Company Name in Top Header</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">1.3 Top Blue Bar Phone Number</label>
                  <input
                    className="adm-input"
                    placeholder="(+966) 50 226 2446"
                    value={draftConfig.phonePrimary || ''}
                    onChange={(e) => handleMainPhoneChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Top Blue Bar (&quot;Fast Global Dispatch • (+966) 50 226 2446&quot;). Auto call link: tel:{draftConfig.phonePrimaryTel || ''}
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">1.4 Hero Top Badge Text</label>
                  <input
                    className="adm-input"
                    value={draftConfig.eyebrowStandard || ''}
                    onChange={(e) => updateConfigField('eyebrowStandard', e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Badge above Hero heading (&quot;THE MM SHAH FAISAL STANDARD OF EXCELLENCE&quot;)
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">1.5 Hero Main Heading</label>
                  <input
                    className="adm-input"
                    value={draftConfig.heroTitle ?? 'Quality Products & Global Wholesale'}
                    onChange={(e) => updateConfigField('heroTitle', e.target.value)}
                  />
                  <span className="adm-help">Website: Large main heading inside the Hero banner</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">1.6 Hero Description Paragraph</label>
                  <textarea
                    className="adm-textarea"
                    value={draftConfig.heroSubtitle || ''}
                    onChange={(e) => updateConfigField('heroSubtitle', e.target.value)}
                  />
                  <span className="adm-help">Website: Paragraph below the main heading in the Hero banner</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">1.7 Website Logo URL (Optional)</label>
                  <input
                    className="adm-input adm-mono"
                    placeholder="https://.../logo.svg"
                    value={draftConfig.logo || ''}
                    onChange={(e) => updateConfigField('logo', e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Header &amp; Footer logo image (leave default or paste SVG/PNG URL)
                  </span>
                </div>

                {isSuperAdmin && (
                  <div className="adm-field adm-field-full">
                    <label className="adm-label">1.8 Assigned Custom Domain</label>
                    <input
                      className="adm-input adm-mono"
                      placeholder="example.com"
                      value={draftDomain}
                      onChange={(e) => setDraftDomain(e.target.value)}
                    />
                    <span className="adm-help">
                      Used to auto-detect this website when hosted under its custom domain.
                    </span>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* 02. Phone, Email & Address */}
          {activeTab === 'contact-info' && (
            <form onSubmit={handleSaveCurrentSite} className="adm-card">
              <div className="adm-card-header">
                <div>
                  <h2 className="adm-card-title">02. Phone, Email & Address</h2>
                  <p className="adm-card-subtitle">
                    Unified sequence: Name, Phone, WhatsApp, Email, Address, and Website. Same order appears in Contact Us &amp; Footer.
                  </p>
                </div>
              </div>

              <div className="adm-form-grid">
                <div className="adm-field adm-field-full">
                  <label className="adm-label">2.1 Website / Company Name</label>
                  <input
                    className="adm-input"
                    value={draftConfig.companyName || ''}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                  />
                  <span className="adm-help">Website: Management name in Contact Us, Footer Contacts &amp; WhatsApp messages</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">2.2 Phone Number (Website Display Format)</label>
                  <input
                    className="adm-input"
                    placeholder="(+966) 50 226 2446"
                    value={draftConfig.phonePrimary || ''}
                    onChange={(e) => handleMainPhoneChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Write exactly as shown on website: (+966) 50 226 2446 — Auto call link: tel:{draftConfig.phonePrimaryTel || ''}
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label className="adm-label">2.3 WhatsApp Number (Website Display Format)</label>
                    <button
                      type="button"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => handleWhatsAppChange(draftConfig.phonePrimary || '')}
                    >
                      Same as Phone Number
                    </button>
                  </div>
                  <input
                    className="adm-input"
                    placeholder="(+966) 50 226 2446"
                    value={draftConfig.whatsappDisplay ?? draftConfig.phonePrimary ?? ''}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Used on all WhatsApp Order &amp; Chat buttons — Auto WhatsApp link: wa.me/{draftConfig.whatsappNumber || ''}
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">2.4 Email Address</label>
                  <input
                    className="adm-input"
                    value={draftConfig.email || ''}
                    onChange={(e) => updateConfigField('email', e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Contact Us (&quot;Email&quot;), VIP Banner, Supplier Inquiries &amp; Footer (&quot;Contacts&quot;)
                  </span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">2.5 Address Line 1 (Operating Trade Hub)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.address?.line1 || ''}
                    onChange={(e) => handleAddressLineChange('line1', e.target.value)}
                  />
                  <span className="adm-help">Website: First line under &quot;Operating Trade Hub&quot; &amp; Footer Contacts</span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">2.6 Address Line 2 (City, State / Region)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.address?.line2 || ''}
                    onChange={(e) => handleAddressLineChange('line2', e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Second line under &quot;Operating Trade Hub&quot; &amp; Footer Contacts (Full: {draftConfig.address?.full || ''})
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">2.7 Official Website</label>
                  <input
                    className="adm-input"
                    value={draftConfig.website || ''}
                    onChange={(e) => updateConfigField('website', e.target.value)}
                  />
                  <span className="adm-help">Website: Contact Us (&quot;Official Website&quot;) &amp; Footer (&quot;Contacts&quot;)</span>
                </div>
              </div>
            </form>
          )}

          {/* 03. About Us Page */}
          {activeTab === 'about' && (
            <form onSubmit={handleSaveCurrentSite} className="adm-card">
              <div className="adm-card-header">
                <div>
                  <h2 className="adm-card-title">03. About Us Page</h2>
                  <p className="adm-card-subtitle">
                    Matches the heading, paragraphs, 3 feature cards, and bottom button on the About Us page.
                  </p>
                </div>
              </div>

              <div className="adm-form-grid">
                <div className="adm-field adm-field-full">
                  <label className="adm-label">
                    3.1 Website / Company Name (&quot;About {draftConfig.companyName || 'Company'}&quot;)
                  </label>
                  <input
                    className="adm-input"
                    value={draftConfig.companyName || ''}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Page heading &quot;About {draftConfig.companyName || 'Company'}&quot; and legal intro paragraph
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">3.2 Paragraph 1 — Company Mission</label>
                  <textarea
                    className="adm-textarea"
                    rows={4}
                    value={draftConfig.about?.mission || ''}
                    onChange={(e) => updateConfigField('about.mission', e.target.value)}
                  />
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">3.3 Paragraph 2 — Thoughtful Sourcing</label>
                  <textarea
                    className="adm-textarea"
                    rows={3}
                    value={draftConfig.about?.sourcingNote || ''}
                    onChange={(e) => updateConfigField('about.sourcingNote', e.target.value)}
                  />
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">3.4 Paragraph 3 — Wholesale &amp; B2B Supply</label>
                  <textarea
                    className="adm-textarea"
                    rows={3}
                    value={draftConfig.about?.b2bNote || ''}
                    onChange={(e) => updateConfigField('about.b2bNote', e.target.value)}
                  />
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label" style={{ marginBottom: '4px' }}>
                    3.5 Three Feature Cards (Bottom of About Us Page)
                  </label>
                  <div className="adm-form-grid-3">
                    {[0, 1, 2].map((idx) => {
                      const card = draftConfig.about?.cards?.[idx] || { title: '', description: '' };
                      return (
                        <div key={idx} className="adm-subblock">
                          <div className="adm-subblock-title">3.5.{idx + 1} Card {idx + 1}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                              className="adm-input"
                              placeholder="Card Title"
                              value={card.title || ''}
                              onChange={(e) => updateAboutCard(idx, 'title', e.target.value)}
                            />
                            <textarea
                              className="adm-textarea"
                              rows={3}
                              placeholder="Card Description"
                              value={card.description || ''}
                              onChange={(e) => updateAboutCard(idx, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">3.6 Bottom Button Text (&quot;Contact Management Desk&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.about?.ctaButton || ''}
                    onChange={(e) => updateConfigField('about.ctaButton', e.target.value)}
                  />
                </div>
              </div>
            </form>
          )}

          {/* 04. Contact Us Section */}
          {activeTab === 'contact-page' && (
            <form onSubmit={handleSaveCurrentSite} className="adm-card">
              <div className="adm-card-header">
                <div>
                  <h2 className="adm-card-title">04. Contact Us Section</h2>
                  <p className="adm-card-subtitle">
                    Matches the website Contact Us card in exact order: Name, Phone, WhatsApp, Email, Address, and Website.
                  </p>
                </div>
              </div>

              <div className="adm-form-grid">
                <div className="adm-field adm-field-full">
                  <label className="adm-label">
                    4.1 Website / Company Name (&quot;Contact {draftConfig.companyName || 'Company'}&quot; &amp; &quot;Management&quot;)
                  </label>
                  <input
                    className="adm-input"
                    value={draftConfig.companyName || ''}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                  />
                  <span className="adm-help">Website: First item inside Contact Us &quot;Direct Coordinates&quot; &amp; section heading</span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">4.2 Phone Number (&quot;Direct: ...&quot;)</label>
                  <input
                    className="adm-input"
                    placeholder="(+966) 50 226 2446"
                    value={draftConfig.phonePrimary || ''}
                    onChange={(e) => handleMainPhoneChange(e.target.value)}
                  />
                  <span className="adm-help">Auto call link: tel:{draftConfig.phonePrimaryTel || ''}</span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">4.3 WhatsApp Chat Number</label>
                  <input
                    className="adm-input"
                    placeholder="(+966) 50 226 2446"
                    value={draftConfig.whatsappDisplay ?? draftConfig.phonePrimary ?? ''}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                  />
                  <span className="adm-help">Auto WhatsApp link: wa.me/{draftConfig.whatsappNumber || ''}</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">4.4 Email Address</label>
                  <input
                    className="adm-input"
                    value={draftConfig.email || ''}
                    onChange={(e) => updateConfigField('email', e.target.value)}
                  />
                </div>

                <div className="adm-field">
                  <label className="adm-label">4.5 Operating Trade Hub — Address Line 1</label>
                  <input
                    className="adm-input"
                    value={draftConfig.address?.line1 || ''}
                    onChange={(e) => handleAddressLineChange('line1', e.target.value)}
                  />
                </div>

                <div className="adm-field">
                  <label className="adm-label">4.6 Operating Trade Hub — Address Line 2</label>
                  <input
                    className="adm-input"
                    value={draftConfig.address?.line2 || ''}
                    onChange={(e) => handleAddressLineChange('line2', e.target.value)}
                  />
                </div>

                <div className="adm-field">
                  <label className="adm-label">4.7 Official Website</label>
                  <input
                    className="adm-input"
                    value={draftConfig.website || ''}
                    onChange={(e) => updateConfigField('website', e.target.value)}
                  />
                </div>

                <div className="adm-field">
                  <label className="adm-label">4.8 Left Box Title (&quot;Direct Coordinates&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.contact?.cardTitle || ''}
                    onChange={(e) => updateConfigField('contact.cardTitle', e.target.value)}
                  />
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">
                    4.9 Contact Subtitle (Under &quot;Contact {draftConfig.companyName || 'Company'}&quot;)
                  </label>
                  <input
                    className="adm-input"
                    value={draftConfig.contact?.tagline || ''}
                    onChange={(e) => updateConfigField('contact.tagline', e.target.value)}
                  />
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">4.10 Right Form Heading (&quot;Send Us a Message&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.contact?.formTitle || ''}
                    onChange={(e) => updateConfigField('contact.formTitle', e.target.value)}
                  />
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">4.11 Form Submit Confirmation Message</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    value={draftConfig.contact?.formSuccess || ''}
                    onChange={(e) => updateConfigField('contact.formSuccess', e.target.value)}
                  />
                </div>
              </div>
            </form>
          )}

          {/* 05. Footer & Socials */}
          {activeTab === 'footer' && (
            <form onSubmit={handleSaveCurrentSite} className="adm-card">
              <div className="adm-card-header">
                <div>
                  <h2 className="adm-card-title">05. Website Footer &amp; Socials</h2>
                  <p className="adm-card-subtitle">
                    Matches Footer Contacts in exact order: Name, Phone, WhatsApp, Email, Address, Website, plus Description &amp; Socials.
                  </p>
                </div>
              </div>

              <div className="adm-form-grid">
                <div className="adm-field adm-field-full">
                  <label className="adm-label">5.1 Website / Company Name (Footer Heading, &quot;Management:&quot; &amp; &quot;Contacts&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.companyName || ''}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Footer Brand Title, first line of &quot;Contacts&quot;, &quot;Management: {draftConfig.companyName || ''}&quot; &amp; Copyright bar
                  </span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">5.2 Footer Phone Number (&quot;Trade Desk Hotline&quot; &amp; &quot;Contacts&quot;)</label>
                  <input
                    className="adm-input"
                    placeholder="(+966) 50 226 2446"
                    value={draftConfig.phonePrimary || ''}
                    onChange={(e) => handleMainPhoneChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Footer &quot;Trade Desk Hotline&quot; &amp; &quot;Contacts&quot; (tel:{draftConfig.phonePrimaryTel || ''})
                  </span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">5.3 Footer WhatsApp Number (&quot;Contacts&quot;)</label>
                  <input
                    className="adm-input"
                    placeholder="(+966) 50 226 2446"
                    value={draftConfig.whatsappDisplay ?? draftConfig.phonePrimary ?? ''}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                  />
                  <span className="adm-help">
                    Website: WhatsApp link under Footer &quot;Contacts&quot; (wa.me/{draftConfig.whatsappNumber || ''})
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">5.4 Footer Email Address (&quot;Trade Desk Hotline&quot; &amp; &quot;Contacts&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.email || ''}
                    onChange={(e) => updateConfigField('email', e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Shown in Footer &quot;Trade Desk Hotline&quot; &amp; &quot;Contacts&quot;
                  </span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">5.5 Footer Address Line 1 (&quot;Contacts&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.address?.line1 || ''}
                    onChange={(e) => handleAddressLineChange('line1', e.target.value)}
                  />
                  <span className="adm-help">Website: First address line under Footer &quot;Contacts&quot;</span>
                </div>

                <div className="adm-field">
                  <label className="adm-label">5.6 Footer Address Line 2 (&quot;Contacts&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.address?.line2 || ''}
                    onChange={(e) => handleAddressLineChange('line2', e.target.value)}
                  />
                  <span className="adm-help">
                    Website: Second address line under Footer &quot;Contacts&quot; (Full: {draftConfig.address?.full || ''})
                  </span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">5.7 Footer Official Website (&quot;Contacts&quot;)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.website || ''}
                    onChange={(e) => updateConfigField('website', e.target.value)}
                  />
                  <span className="adm-help">Website: Clickable website link under Footer &quot;Contacts&quot;</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">5.8 Footer Brand Description (Under Company Name)</label>
                  <textarea
                    className="adm-textarea"
                    rows={3}
                    value={draftConfig.footer?.description || ''}
                    onChange={(e) => updateConfigField('footer.description', e.target.value)}
                  />
                  <span className="adm-help">Website: Paragraph directly under Company Name in Footer</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">5.9 &quot;Operations:&quot; Line (Footer Left Column)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.footer?.operationsLabel || ''}
                    onChange={(e) => updateConfigField('footer.operationsLabel', e.target.value)}
                  />
                  <span className="adm-help">Website: Text next to &quot;Operations:&quot; in Footer left column</span>
                </div>

                <div className="adm-field adm-field-full">
                  <label className="adm-label">5.10 &quot;Subscribe to our newsletter&quot; Text (Footer Right Column)</label>
                  <input
                    className="adm-input"
                    value={draftConfig.footer?.newsletterTagline || ''}
                    onChange={(e) => updateConfigField('footer.newsletterTagline', e.target.value)}
                  />
                  <span className="adm-help">Website: Description above the newsletter email box</span>
                </div>

                <div className="adm-field adm-field-full" style={{ paddingTop: '12px', borderTop: '1px solid #f4f4f5' }}>
                  <label className="adm-label" style={{ marginBottom: '4px' }}>
                    5.11 &quot;Socials&quot; Links (Facebook, Instagram, TikTok)
                  </label>
                  <div className="adm-form-grid-3">
                    {(draftConfig.footer?.socials || []).map((social, idx) => (
                      <div key={social.label || idx} className="adm-field">
                        <label className="adm-label">5.11.{idx + 1} {social.label}</label>
                        <input
                          className="adm-input adm-mono"
                          value={social.url || ''}
                          onChange={(e) => updateSocialUrl(idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 7. All Websites Directory (Super Admin Only) */}
          {activeTab === 'directory' && isSuperAdmin && (
            <div className="adm-card">
              <div className="adm-card-header">
                <div>
                  <h2 className="adm-card-title">Managed Websites Directory ({websites.length})</h2>
                  <p className="adm-card-subtitle">
                    Manage all storefronts, custom domains, and client owners from one database.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {websites.length < 20 && (
                    <button
                      type="button"
                      disabled={saving}
                      className="adm-btn adm-btn-secondary"
                      onClick={handleGenerate20Slots}
                    >
                      <span>Initialize 20 Slots</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="adm-btn adm-btn-primary"
                    onClick={() => setShowNewModal(true)}
                  >
                    <span>Add Website</span>
                  </button>
                </div>
              </div>

              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Company / Site</th>
                      <th>Slug</th>
                      <th>Custom Domain</th>
                      <th>Assigned Client</th>
                      <th>Updated</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websites.map((site) => (
                      <tr key={site.slug}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{site.name}</div>
                        </td>
                        <td className="adm-mono" style={{ fontSize: '12px', color: '#52525b' }}>
                          {site.slug}
                        </td>
                        <td className="adm-mono" style={{ fontSize: '12px' }}>
                          {site.domain || '—'}
                        </td>
                        <td className="adm-mono" style={{ fontSize: '12px', color: '#52525b' }}>
                          {site.clientEmail || 'Unassigned'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#71717a', whiteSpace: 'nowrap' }}>
                          {site.updatedAt ? new Date(site.updatedAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div className="adm-table-actions">
                            <button
                              type="button"
                              className="adm-btn adm-btn-secondary adm-btn-sm"
                              onClick={() => {
                                handleSelectWebsite(site.slug);
                                setActiveTab('identity');
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="adm-btn adm-btn-secondary adm-btn-sm"
                              onClick={() => {
                                setAccessSlug(site.slug);
                                setActiveTab('access');
                              }}
                            >
                              Access
                            </button>
                            {onExitAdmin && (
                              <button
                                type="button"
                                className="adm-btn adm-btn-secondary adm-btn-sm"
                                onClick={() => onExitAdmin(site.slug)}
                              >
                                Preview
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={websites.length <= 1 || saving}
                              className="adm-btn adm-btn-danger adm-btn-sm"
                              onClick={() => handleDeleteWebsite(site.slug)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. Client Access & Credentials (Super Admin Only) */}
          {activeTab === 'access' && isSuperAdmin && (
            <>
              <form onSubmit={handleSaveClientAccess} className="adm-card">
                <div className="adm-card-header">
                  <div>
                    <h2 className="adm-card-title">Assign Client Admin Access</h2>
                    <p className="adm-card-subtitle">
                      Create login credentials restricted exclusively to one website.
                    </p>
                  </div>
                </div>

                <div className="adm-form-grid">
                  <div className="adm-field adm-field-full">
                    <label className="adm-label">Target Website</label>
                    <select
                      className="adm-select"
                      value={accessSlug}
                      onChange={(e) => setAccessSlug(e.target.value)}
                    >
                      {websites.map((site) => (
                        <option key={site.slug} value={site.slug}>
                          {site.name} ({site.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="adm-field">
                    <label className="adm-label">Client Login Email</label>
                    <input
                      type="email"
                      required
                      className="adm-input"
                      placeholder="owner@clientdomain.com"
                      value={accessEmail}
                      onChange={(e) => setAccessEmail(e.target.value)}
                    />
                  </div>

                  <div className="adm-field">
                    <label className="adm-label">Client Access Password</label>
                    <input
                      type="text"
                      required
                      className="adm-input adm-mono"
                      placeholder="Client@2026"
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="adm-btn adm-btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Client Access'}
                  </button>
                  {accessSlug && (
                    <button
                      type="button"
                      className="adm-btn adm-btn-secondary"
                      onClick={() => {
                        const target = websites.find((w) => w.slug === accessSlug);
                        if (target) {
                          handleCopyAccess({
                            ...target,
                            clientEmail: accessEmail,
                            clientAccessCode: accessPassword,
                          });
                        }
                      }}
                    >
                      <span>
                        {copiedSlug === accessSlug ? 'Copied Access Details' : 'Copy Access Details'}
                      </span>
                    </button>
                  )}
                </div>
              </form>

              <div className="adm-card">
                <div className="adm-card-header">
                  <div>
                    <h2 className="adm-card-title">Issued Client Credentials</h2>
                    <p className="adm-card-subtitle">
                      Copy and send any website&apos;s login URL and credentials to its owner.
                    </p>
                  </div>
                </div>

                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Website</th>
                        <th>Client Email</th>
                        <th>Passcode</th>
                        <th>Admin Link</th>
                        <th style={{ textAlign: 'right' }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {websites.map((site) => {
                        const origin =
                          typeof window !== 'undefined' ? window.location.origin : '';
                        const adminLink = `${origin}/?site=${site.slug}#admin`;
                        return (
                          <tr key={site.slug}>
                            <td style={{ fontWeight: 500 }}>{site.name}</td>
                            <td className="adm-mono" style={{ fontSize: '12px' }}>
                              {site.clientEmail || '—'}
                            </td>
                            <td className="adm-mono" style={{ fontSize: '12px' }}>
                              {site.clientAccessCode || '—'}
                            </td>
                            <td className="adm-mono" style={{ fontSize: '11px', color: '#52525b' }}>
                              {adminLink}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="adm-btn adm-btn-secondary adm-btn-sm"
                                onClick={() => handleCopyAccess(site)}
                              >
                                {copiedSlug === site.slug ? (
                                  <span>Copied</span>
                                ) : (
                                  <span>Copy Access Details</span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <form onSubmit={handleUpdateSuperPassword} className="adm-card">
                <div className="adm-card-header">
                  <div>
                    <h2 className="adm-card-title">Super Admin Password</h2>
                    <p className="adm-card-subtitle">
                      Update the master password for {session.email}.
                    </p>
                  </div>
                </div>

                <div className="adm-form-grid-3">
                  <div className="adm-field">
                    <label className="adm-label">Current Password</label>
                    <input
                      type="password"
                      required
                      className="adm-input"
                      value={pwForm.current}
                      onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="adm-input"
                      value={pwForm.next}
                      onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      className="adm-input"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <button type="submit" disabled={saving} className="adm-btn adm-btn-secondary">
                    Update Master Password
                  </button>
                </div>
              </form>
            </>
          )}

          {/* 9. Supabase Connection (Super Admin Only) */}
          {activeTab === 'database' && isSuperAdmin && (
            <>
              <form onSubmit={handleSaveAndTestSupabase} className="adm-card">
                <div className="adm-card-header">
                  <div>
                    <h2 className="adm-card-title">Supabase Backend Connection</h2>
                    <p className="adm-card-subtitle">
                      Connect one Supabase project to store and serve all 20+ websites.
                    </p>
                  </div>
                  <span className="adm-status-pill">
                    {sbConfig.configured ? `Source: ${sbConfig.source}` : 'Not Connected'}
                  </span>
                </div>

                <div className="adm-form-grid">
                  <div className="adm-field adm-field-full">
                    <label className="adm-label">Supabase Project URL</label>
                    <input
                      className="adm-input adm-mono"
                      placeholder="https://your-project-id.supabase.co"
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                    />
                  </div>

                  <div className="adm-field adm-field-full">
                    <label className="adm-label">Supabase Anon Public Key</label>
                    <input
                      className="adm-input adm-mono"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                    />
                    <span className="adm-help">
                      Saved in browser storage or set via VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for production builds.
                    </span>
                  </div>
                </div>

                {sbStatus && (
                  <div className="adm-notice" style={{ marginTop: '14px' }}>
                    <span>{sbStatus}</span>
                  </div>
                )}

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="submit" className="adm-btn adm-btn-primary">
                    Save & Test Connection
                  </button>
                  <button
                    type="button"
                    disabled={saving || !sbUrl || !sbKey}
                    className="adm-btn adm-btn-secondary"
                    onClick={handleSyncToSupabase}
                  >
                    Sync Local Sites to Supabase
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary"
                    onClick={handleClearSupabaseOverride}
                  >
                    Clear Saved Credentials
                  </button>
                </div>
              </form>

              <div className="adm-card">
                <div className="adm-card-header">
                  <div>
                    <h2 className="adm-card-title">Supabase SQL Schema</h2>
                    <p className="adm-card-subtitle">
                      Copy and run this SQL once in Supabase SQL Editor to create tables, RLS policies, and auth RPCs.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="adm-btn adm-btn-secondary"
                      onClick={handleCopySql}
                    >
                      <span>{copiedSql ? 'Copied SQL' : 'Copy SQL'}</span>
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-secondary"
                      onClick={() => setShowSql((s) => !s)}
                    >
                      {showSql ? 'Hide SQL' : 'Show SQL'}
                    </button>
                  </div>
                </div>

                {showSql && <pre className="adm-code-block">{schemaSql}</pre>}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add / Clone Website Modal */}
      {showNewModal && isSuperAdmin && (
        <div className="adm-modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Add New Website</h3>
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => setShowNewModal(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateWebsite} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="adm-field">
                <label className="adm-label">Company / Website Name *</label>
                <input
                  required
                  className="adm-input"
                  placeholder="Al Noor Trading LLC"
                  value={newSiteForm.companyName}
                  onChange={(e) =>
                    setNewSiteForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                />
              </div>

              <div className="adm-form-grid">
                <div className="adm-field">
                  <label className="adm-label">Site Slug *</label>
                  <input
                    required
                    className="adm-input adm-mono"
                    placeholder="al-noor-trading"
                    value={newSiteForm.slug}
                    onChange={(e) => setNewSiteForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Custom Domain</label>
                  <input
                    className="adm-input adm-mono"
                    placeholder="alnoortrading.com"
                    value={newSiteForm.domain}
                    onChange={(e) => setNewSiteForm((f) => ({ ...f, domain: e.target.value }))}
                  />
                </div>
              </div>

              <div className="adm-field">
                <label className="adm-label">Clone Initial Template From</label>
                <select
                  className="adm-select"
                  value={newSiteForm.cloneFromSlug}
                  onChange={(e) =>
                    setNewSiteForm((f) => ({ ...f, cloneFromSlug: e.target.value }))
                  }
                >
                  <option value="">Default Base Template</option>
                  {websites.map((w) => (
                    <option key={w.slug} value={w.slug}>
                      {w.name} ({w.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="adm-form-grid">
                <div className="adm-field">
                  <label className="adm-label">Client Email (Optional)</label>
                  <input
                    type="email"
                    className="adm-input"
                    placeholder="client@domain.com"
                    value={newSiteForm.clientEmail}
                    onChange={(e) =>
                      setNewSiteForm((f) => ({ ...f, clientEmail: e.target.value }))
                    }
                  />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Client Password (Optional)</label>
                  <input
                    type="text"
                    className="adm-input adm-mono"
                    placeholder="Client@2026"
                    value={newSiteForm.clientPassword}
                    onChange={(e) =>
                      setNewSiteForm((f) => ({ ...f, clientPassword: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="adm-modal-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="adm-btn adm-btn-primary">
                  {saving ? 'Creating...' : 'Create Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

