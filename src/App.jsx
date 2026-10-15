import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MapPin, Search, ArrowRight, CheckCircle2, 
  Send, ExternalLink, ShieldCheck, Truck, Award,
  X, MessageSquare, Layers, Building2, ShoppingCart, Menu as MenuIcon,
  Plus, Minus, Trash2, ShoppingBag, Eye, ArrowLeft, Check,
  LayoutGrid, Sparkles, ChevronDown, Package, Star
} from 'lucide-react';
import { companyInfo, curatedCategories, categories, products } from './data/products';
import logoImg from './images/sbr-logo.svg';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [modalType, setModalType] = useState(null); // 'partner', 'quote', 'supplier', 'checkout', null
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Cart & Product Detail state
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('sbr_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(products[0]);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [activeDetailTab, setActiveDetailTab] = useState('description');
  const [toastMessage, setToastMessage] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sbr_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Filter & sort products
  const filteredProducts = products.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.priceNumeric - b.priceNumeric;
    if (sortBy === 'price-high') return b.priceNumeric - a.priceNumeric;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'latest') return b.id - a.id;
    return 0;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const addToCart = (product, qty = 1, openDrawer = true) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    showToast(`Added ${qty}x ${product.name} to cart!`);
    if (openDrawer) {
      setCartOpen(true);
    }
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.priceNumeric * item.quantity), 0);

  const viewProductDetail = (product) => {
    setActiveProduct(product);
    setDetailQuantity(1);
    setActiveDetailTab('description');
    setActiveTab('product-detail');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuote = (product) => {
    setSelectedProduct(product);
    setModalType('quote');
    setFormSubmitted(false);
  };

  const handleOpenPartner = (type = 'partner') => {
    setModalType(type);
    setFormSubmitted(false);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedProduct(null);
    setFormSubmitted(false);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSuccess(true);
      setTimeout(() => setNewsletterSuccess(false), 4000);
      setNewsletterEmail('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const navigateTo = (tabName, categoryId = null) => {
    if (tabName === 'contact') {
      setActiveTab('contact');
    } else if (tabName === 'about') {
      setActiveTab('about');
    } else if (tabName === 'business') {
      setActiveTab('business');
    } else if (tabName === 'partnerships') {
      setActiveTab('partnerships');
    } else if (tabName === 'supplier') {
      setActiveTab('supplier');
    } else if (tabName === 'shop') {
      setActiveTab('shop');
      if (categoryId) setSelectedCategory(categoryId);
      else setSelectedCategory('all');
    } else {
      setActiveTab('home');
      if (categoryId) setSelectedCategory(categoryId);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    if (activeTab !== 'home' && activeTab !== 'shop') {
      setActiveTab('home');
    }
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById('featured-products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9] text-[#1e293b]">
      {/* 2-TIER MODERN STICKY HEADER */}
      <header className="site-header">
        {/* UPPER TIER: MAIN NAVIGATION */}
        <div className="main-nav">
          <div className="nav-brand" onClick={() => navigateTo('home')} style={{ cursor: 'pointer' }}>
            <img src={logoImg} alt="SBR Internationals LLC Logo" className="brand-logo-img" />
            <div>
              <div className="brand-title">{companyInfo.name}</div>
              <div className="brand-subtitle">{companyInfo.tagline} • Quality For Life</div>
            </div>
          </div>

          {/* Desktop Navigation Links: Clean 3-4 main links only */}
          <nav className="desktop-nav">
            <ul className="nav-links">
              <li>
                <button 
                  className={`nav-link ${activeTab === 'home' && selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory('all'); navigateTo('home'); }}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeTab === 'shop' ? 'active' : ''}`}
                  onClick={() => navigateTo('shop')}
                >
                  Shop
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
                  onClick={() => navigateTo('about')}
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => navigateTo('contact')}
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </nav>

          {/* Header Action Buttons */}
          <div className="nav-actions">
            <button 
              className="btn-nav-cart"
              onClick={() => setCartOpen(true)}
              aria-label="Open Shopping Cart"
            >
              <ShoppingCart size={18} />
              <span className="nav-cart-text">Cart</span>
              {totalCartItems > 0 && (
                <span className="nav-cart-badge">{totalCartItems}</span>
              )}
            </button>

            <a 
              href={companyInfo.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-nav-partner"
            >
              <MessageSquare size={16} />
              <span>WhatsApp Direct</span>
            </a>

            <button 
              className="mobile-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>

        {/* LOWER TIER: THE BLUE/DARK CATEGORIES BAR */}
        <div className="products-blue-bar">
          <div className="blue-bar-content">
            {/* All Products master pill */}
            <div className="blue-bar-categories">
              <button 
                className={`blue-cat-btn all-cat-btn ${selectedCategory === 'all' && activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleCategoryClick('all')}
              >
                <LayoutGrid size={15} />
                <span>All Products</span>
                <span className="blue-count-pill">{products.length}</span>
              </button>

              <div className="blue-bar-divider"></div>

              {/* Individual Product Categories in the Blue Line */}
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id && (activeTab === 'home' || activeTab === 'shop');
                return (
                  <button
                    key={cat.id}
                    className={`blue-cat-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right side quick contact & brand perk */}
            <div className="blue-bar-perks">
              <span className="blue-perk-item">
                <Truck size={14} />
                <span>Quality For Life</span>
              </span>
              <span className="blue-perk-divider">•</span>
              <a href={`tel:${companyInfo.phoneRaw}`} className="blue-perk-phone">
                <Phone size={13} />
                <span>{companyInfo.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU ACCORDION */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-drawer-section">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setCartOpen(true);
              }}
              className="mobile-cart-btn"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} />
                <span>Shopping Cart</span>
              </span>
              <span className="nav-cart-badge">{totalCartItems}</span>
            </button>
          </div>

          <div className="mobile-drawer-section">
            <div className="mobile-section-label">Navigation</div>
            {[
              { key: 'home', label: 'Home' },
              { key: 'shop', label: 'Shop' },
              { key: 'about', label: 'About Us' },
              { key: 'contact', label: 'Contact Us' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                className={`mobile-nav-link ${activeTab === item.key ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mobile-drawer-section">
            <div className="mobile-section-label">Categories</div>
            <button
              onClick={() => handleCategoryClick('all')}
              className={`mobile-nav-link ${selectedCategory === 'all' && activeTab === 'home' ? 'active' : ''}`}
            >
              <LayoutGrid size={16} />
              <span>All Products ({products.length})</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`mobile-nav-link ${selectedCategory === cat.id && activeTab === 'home' ? 'active' : ''}`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="mobile-drawer-footer">
            <a 
              href={companyInfo.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-hero-primary"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
            >
              <MessageSquare size={16} />
              <span>WhatsApp Us: {companyInfo.phone}</span>
            </a>
          </div>
        </div>
      )}

      {/* VIEW: HOME PAGE */}
      {activeTab === 'home' && (
        <main>
          {/* HERO SECTION - EXACT FROM SBR INTERNATIONALS LLC */}
          <section className="hero-section" style={{
            backgroundImage: `linear-gradient(rgba(13, 20, 26, 0.55), rgba(13, 20, 26, 0.65)), url(${companyInfo.heroBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            borderRadius: '16px',
            margin: '20px auto',
            maxWidth: '1280px',
            minHeight: '440px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '80px 24px'
          }}>
            <div className="hero-container" style={{ maxWidth: '780px' }}>
              <div className="hero-content">
                <div className="hero-pretitle" style={{ letterSpacing: '3px', color: '#D3B066', fontWeight: '700', fontSize: '0.9rem', marginBottom: '14px' }}>
                  {companyInfo.name.toUpperCase()}
                </div>
                <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', color: '#ffffff', marginBottom: '16px', lineHeight: 1.15 }}>
                  {companyInfo.heroTitle}
                </h1>
                <p className="hero-description" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#f1f5f9', marginBottom: '32px', maxWidth: '640px', margin: '0 auto 32px' }}>
                  {companyInfo.heroSubtitle}
                </p>
                <div className="hero-actions" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn-hero-primary"
                    style={{ background: '#D3B066', color: '#17223A', fontWeight: '700', borderRadius: '50px', padding: '14px 36px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                    onClick={() => {
                      const el = document.getElementById('featured-products-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Shop Now
                  </button>
                  <button 
                    className="btn-hero-outline"
                    style={{ background: 'transparent', border: '2px solid #ffffff', color: '#ffffff', fontWeight: '600', borderRadius: '50px', padding: '14px 32px', cursor: 'pointer', fontSize: '1rem' }}
                    onClick={() => {
                      const el = document.getElementById('curated-categories-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Curated Categories
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* CURATED CATEGORIES (EXACT FROM SBR INTERNATIONALS LLC) */}
          <section id="curated-categories-section" className="section-wrapper" style={{ padding: '60px 24px 40px' }}>
            <div className="section-header-center" style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: '600', letterSpacing: '2px', color: '#8b7224', marginBottom: '8px' }}>
                Shop With Confidence
              </div>
              <h2 className="section-heading-clean" style={{ fontSize: '2.4rem', fontWeight: '800', color: '#17223A' }}>
                Curated Categories
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              maxWidth: '1280px',
              margin: '0 auto'
            }}>
              {curatedCategories.map((card) => (
                <div 
                  key={card.id}
                  onClick={() => handleCategoryClick(card.targetCategory)}
                  style={{
                    position: 'relative',
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.7)), url(${card.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '24px',
                    minHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '32px 28px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                  }}
                  className="curated-category-card"
                >
                  <h3 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '10px', color: '#ffffff' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '0.98rem', color: '#f1f5f9', marginBottom: '20px', lineHeight: 1.5 }}>
                    {card.description}
                  </p>
                  <div>
                    <button 
                      style={{
                        background: 'transparent',
                        border: '1.5px solid #ffffff',
                        color: '#ffffff',
                        padding: '10px 24px',
                        borderRadius: '50px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(card.targetCategory);
                      }}
                    >
                      {card.buttonText}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FEATURED PRODUCTS (EXACT FROM SBR INTERNATIONALS LLC) */}
          <section id="featured-products-section" className="section-wrapper featured-section" style={{ padding: '60px 24px 80px' }}>
            <div className="section-header-center" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ textTransform: 'uppercase', fontSize: '14px', fontWeight: '600', letterSpacing: '2px', color: '#8b7224', marginBottom: '8px' }}>
                Verified Selection
              </div>
              <h2 className="section-heading-clean" style={{ fontSize: '2.4rem', fontWeight: '800', color: '#17223A' }}>
                Featured Products
              </h2>
              <p style={{ color: '#64748b', maxWidth: '580px', margin: '10px auto 0', fontSize: '1rem' }}>
                Explore authentic merchandise directly available at SBR Internationals LLC.
              </p>
            </div>

            {/* Filter pills & search */}
            <div style={{ maxWidth: '1280px', margin: '0 auto 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '50px',
                    border: selectedCategory === 'all' ? '2px solid #8b7224' : '1px solid #cbd5e1',
                    background: selectedCategory === 'all' ? '#17223A' : '#ffffff',
                    color: selectedCategory === 'all' ? '#D3B066' : '#475569',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  All ({products.length})
                </button>
                {categories.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '50px',
                      border: selectedCategory === c.id ? '2px solid #8b7224' : '1px solid #cbd5e1',
                      background: selectedCategory === c.id ? '#17223A' : '#ffffff',
                      color: selectedCategory === c.id ? '#D3B066' : '#475569',
                      fontWeight: '600',
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderRadius: '50px', padding: '8px 16px', border: '1px solid #cbd5e1', minWidth: '240px' }}>
                <Search size={16} color="#94a3b8" style={{ marginRight: '8px' }} />
                <input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#17223A' }}
                />
              </div>
            </div>

            {/* Products Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '28px',
              maxWidth: '1280px',
              margin: '0 auto'
            }}>
              {filteredProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  className="sbr-product-card"
                  onClick={() => viewProductDetail(prod)}
                >
                  <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#f8fafc', overflow: 'hidden' }}>
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      loading="lazy" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      className="product-card-img"
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(23, 34, 58, 0.85)', backdropFilter: 'blur(6px)', color: '#D3B066', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '50px' }}>
                      {prod.categoryName}
                    </div>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#17223A', marginBottom: '8px', lineHeight: 1.35 }}>
                        {prod.name}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {prod.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#8b7224', marginBottom: '16px' }}>
                        {prod.price}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          style={{
                            flex: 1,
                            background: '#17223A',
                            color: '#ffffff',
                            border: 'none',
                            padding: '11px',
                            borderRadius: '50px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1, true);
                          }}
                        >
                          <ShoppingCart size={15} />
                          <span>Add to cart</span>
                        </button>
                        <button 
                          style={{
                            background: '#f1f5f9',
                            color: '#17223A',
                            border: '1px solid #cbd5e1',
                            padding: '11px 14px',
                            borderRadius: '50px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            viewProductDetail(prod);
                          }}
                          aria-label="View Product Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Centered View All Products Pill */}
            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <button 
                style={{
                  background: 'transparent',
                  border: '2px solid #17223A',
                  color: '#17223A',
                  padding: '12px 36px',
                  borderRadius: '50px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  navigateTo('shop');
                }}
              >
                View All Products
              </button>
            </div>
          </section>

          {/* SBR VALUE PROPOSITIONS & TRUST BANNER */}
          <section style={{ background: '#17223A', color: '#ffffff', padding: '60px 24px', margin: '40px auto 0' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(211, 176, 102, 0.15)', padding: '12px', borderRadius: '12px', color: '#D3B066' }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', color: '#ffffff' }}>Shop With Confidence</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>100% genuine merchandise verified by SBR Internationals LLC standards.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(211, 176, 102, 0.15)', padding: '12px', borderRadius: '12px', color: '#D3B066' }}>
                  <Award size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', color: '#ffffff' }}>Quality For Life</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>Essentials designed for durable performance, everyday comfort, and ease.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(211, 176, 102, 0.15)', padding: '12px', borderRadius: '12px', color: '#D3B066' }}>
                  <Truck size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', color: '#ffffff' }}>Swift Dispatch</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>Carefully packaged and expedited from our registered US logistics desk.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(211, 176, 102, 0.15)', padding: '12px', borderRadius: '12px', color: '#D3B066' }}>
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', color: '#ffffff' }}>Direct Support</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>Connect directly with our desk on WhatsApp at (+1) 3076677525.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* VIEW: SHOP PAGE */}
      {activeTab === 'shop' && (
        <main className="section-wrapper" style={{ padding: '40px 24px 80px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px', fontSize: '0.9rem', color: '#64748b' }}>
              <span onClick={() => navigateTo('home')} style={{ cursor: 'pointer', color: '#8b7224', fontWeight: '600' }}>Home</span>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ fontWeight: '600', color: '#17223A' }}>Shop</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#17223A', marginBottom: '6px' }}>Catalog Shop</h1>
                <p style={{ color: '#64748b' }}>Showing all {filteredProducts.length} verified products available from SBR Internationals LLC.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.9rem' }}
                >
                  <option value="default">Default Sorting</option>
                  <option value="price-low">Sort by price: low to high</option>
                  <option value="price-high">Sort by price: high to low</option>
                  <option value="rating">Sort by average rating</option>
                  <option value="latest">Sort by latest</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '32px'
            }}>
              {filteredProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    cursor: 'pointer'
                  }}
                  className="sbr-product-card"
                  onClick={() => viewProductDetail(prod)}
                >
                  <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#f8fafc', overflow: 'hidden' }}>
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      loading="lazy" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(23, 34, 58, 0.85)', backdropFilter: 'blur(6px)', color: '#D3B066', fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '50px' }}>
                      {prod.categoryName}
                    </div>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#17223A', marginBottom: '8px' }}>
                        {prod.name}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                        {prod.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#8b7224', marginBottom: '16px' }}>
                        {prod.price}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          style={{
                            flex: 1,
                            background: '#17223A',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '50px',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1, true);
                          }}
                        >
                          <ShoppingCart size={16} />
                          <span>Add to cart</span>
                        </button>
                        <button 
                          style={{
                            background: '#f1f5f9',
                            color: '#17223A',
                            border: '1px solid #cbd5e1',
                            padding: '12px 16px',
                            borderRadius: '50px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            viewProductDetail(prod);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* VIEW: PRODUCT DETAIL PAGE */}
      {activeTab === 'product-detail' && activeProduct && (
        <div className="product-detail-page">
          <div className="detail-container">
            
            {/* Top Breadcrumbs & Back Button */}
            <div className="detail-top-nav">
              <button 
                className="btn-back-catalog" 
                onClick={() => navigateTo('home')}
              >
                <ArrowLeft size={16} />
                <span>Back to Catalog</span>
              </button>
              <div className="detail-breadcrumbs">
                <span onClick={() => navigateTo('home')} className="crumb-link">Home</span>
                <span className="crumb-sep">/</span>
                <span 
                  onClick={() => { setSelectedCategory(activeProduct.category); navigateTo('home'); }} 
                  className="crumb-link"
                >
                  {activeProduct.categoryName}
                </span>
                <span className="crumb-sep">/</span>
                <span className="crumb-current">{activeProduct.name}</span>
              </div>
            </div>

            {/* Main Product Showcase Grid */}
            <div className="detail-showcase-grid">
              
              {/* Left Column: Visual Showcase & Quality Badges */}
              <div className="detail-gallery-col">
                <div className="detail-img-card">
                  <img 
                    src={activeProduct.image} 
                    alt={activeProduct.name} 
                    className="detail-hero-img" 
                  />
                  <div className="detail-badge-float">{activeProduct.categoryName}</div>
                  <div className="detail-verified-badge">
                    <ShieldCheck size={16} />
                    <span>SBR Internationals LLC Certified</span>
                  </div>
                </div>

                {/* Quality & Assurance Badges */}
                <div className="detail-assurance-strip">
                  <div className="assurance-item">
                    <Truck size={18} className="assurance-icon" />
                    <div>
                      <strong>Fast Quality Dispatch</strong>
                      <span>Dispatched via Sheridan, WY Registered Fulfillment</span>
                    </div>
                  </div>
                  <div className="assurance-item">
                    <Award size={18} className="assurance-icon" />
                    <div>
                      <strong>Quality Inspected</strong>
                      <span>Inspected by SBR Internationals LLC</span>
                    </div>
                  </div>
                  <div className="assurance-item">
                    <Building2 size={18} className="assurance-icon" />
                    <div>
                      <strong>Wyoming Registered Entity</strong>
                      <span>Official Registration: 30 N Gould St # 68479</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Product Information & Add to Cart */}
              <div className="detail-info-col">
                <div className="detail-meta-row">
                  <span className="detail-sku-badge">SKU: {activeProduct.sku}</span>
                  <span className="detail-stock-badge">
                    <span className="stock-pulsing-dot"></span>
                    {activeProduct.availability} ({activeProduct.stockUnits?.toLocaleString() || '1,000+'} units ready)
                  </span>
                </div>

                <h1 className="detail-product-title">{activeProduct.name}</h1>

                <div className="detail-reviews-row">
                  <div className="star-rating">★★★★★</div>
                  <span className="rating-score">{activeProduct.rating}</span>
                  <span className="review-count">({activeProduct.reviewCount || 45} verified customer reviews)</span>
                </div>

                <div className="detail-price-panel">
                  <div className="detail-price-row">
                    <div className="detail-unit-price">
                      <span className="price-currency">{activeProduct.price}</span>
                      <span className="price-per">/ unit</span>
                    </div>
                    <div className="detail-price-note">
                      <span className="tax-tag">Official Store Price</span>
                      <span>{activeProduct.priceNote}</span>
                    </div>
                  </div>
                </div>

                {/* Volume Tier Table */}
                {activeProduct.tiers && activeProduct.tiers.length > 0 && (
                  <div className="wholesale-tiers-box">
                    <div className="tiers-title">Volume Pricing & Quantity Breaks:</div>
                    <div className="tiers-grid">
                      {activeProduct.tiers.map((tier, idx) => (
                        <div key={idx} className="tier-card">
                          <div className="tier-qty">{tier.range}</div>
                          <div className="tier-price">{tier.price} <small>/ unit</small></div>
                          <div className="tier-discount">{tier.discount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="detail-lead-summary">{activeProduct.description}</p>

                {/* Key Features Bullet Points */}
                {activeProduct.features && (
                  <div className="detail-features-box">
                    <h3 className="features-title">Highlights:</h3>
                    <ul className="features-list">
                      {activeProduct.features.map((feat, idx) => (
                        <li key={idx}>
                          <Check size={16} className="feature-check" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Purchase & Cart Actions */}
                <div className="detail-purchase-panel">
                  <div className="qty-row">
                    <label className="qty-label">Quantity:</label>
                    <div className="qty-stepper">
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                      >
                        <Minus size={16} />
                      </button>
                      <input 
                        type="number" 
                        min="1" 
                        value={detailQuantity} 
                        onChange={(e) => setDetailQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="stepper-input"
                      />
                      <button 
                        type="button" 
                        className="stepper-btn"
                        onClick={() => setDetailQuantity(q => q + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="subtotal-preview">
                      Subtotal: <strong>₨ {(activeProduct.priceNumeric * detailQuantity).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="detail-actions-grid">
                    <button 
                      className="btn-detail-add-cart"
                      onClick={() => addToCart(activeProduct, detailQuantity, true)}
                    >
                      <ShoppingCart size={18} />
                      <span>Add to Cart ({detailQuantity} Units)</span>
                    </button>

                    <a 
                      href={`https://wa.me/+13076677525?text=${encodeURIComponent(`Hello SBR Internationals LLC, I want to order ${detailQuantity}x ${activeProduct.name} (SKU: ${activeProduct.sku}, Total: ₨ ${(activeProduct.priceNumeric * detailQuantity).toLocaleString()}).`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-detail-whatsapp"
                    >
                      <MessageSquare size={18} />
                      <span>WhatsApp Direct Order</span>
                    </a>
                  </div>

                  <div className="detail-secondary-actions">
                    <button 
                      className="btn-detail-rfq"
                      onClick={() => handleOpenQuote(activeProduct)}
                    >
                      <span>Inquire for Invoice / Quote</span>
                    </button>
                  </div>
                </div>

                {/* Contact Help Strip */}
                <div className="detail-help-strip">
                  <span>Questions about this item?</span>
                  <a href={`tel:${companyInfo.phoneRaw}`} className="help-link">
                    <Phone size={14} /> {companyInfo.phone}
                  </a>
                  <span className="sep">•</span>
                  <a href={`mailto:${companyInfo.email}`} className="help-link">
                    <Mail size={14} /> {companyInfo.email}
                  </a>
                </div>

              </div>
            </div>

            {/* Tabbed Detailed Specifications */}
            <div className="detail-tabs-section">
              <div className="detail-tabs-header">
                <button 
                  className={`detail-tab-btn ${activeDetailTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('description')}
                >
                  Product Details & Overview
                </button>
                <button 
                  className={`detail-tab-btn ${activeDetailTab === 'specs' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('specs')}
                >
                  Technical Specifications
                </button>
                <button 
                  className={`detail-tab-btn ${activeDetailTab === 'shipping' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('shipping')}
                >
                  Packaging & Delivery
                </button>
              </div>

              <div className="detail-tab-content">
                {activeDetailTab === 'description' && (
                  <div className="tab-pane">
                    <h3 className="tab-title">Product Description</h3>
                    <p className="tab-lead-text">{activeProduct.longDescription || activeProduct.description}</p>
                    <div className="tab-features-grid">
                      <div className="tab-feature-card">
                        <h4>Authentic Quality Standard</h4>
                        <p>Directly inspected and curated under SBR Internationals LLC quality guidelines for everyday elegance, longevity, and consumer trust.</p>
                      </div>
                      <div className="tab-feature-card">
                        <h4>Packaging & Presentation</h4>
                        <p>All items come in protective retail presentation packaging with barcodes, official product labels, and sealed containers.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'specs' && (
                  <div className="tab-pane">
                    <h3 className="tab-title">Technical Specifications</h3>
                    {activeProduct.specs && activeProduct.specs.length > 0 ? (
                      <table className="specs-table">
                        <tbody>
                          {activeProduct.specs.map((item, idx) => (
                            <tr key={idx}>
                              <td className="spec-label">{item.label}</td>
                              <td className="spec-value">{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p>Standard quality specifications apply. Contact us for detailed spec sheets.</p>
                    )}
                  </div>
                )}

                {activeDetailTab === 'shipping' && (
                  <div className="tab-pane">
                    <h3 className="tab-title">Packaging & Dispatch Terms</h3>
                    <div className="shipping-info-grid">
                      <div className="ship-card">
                        <h4>Prompt Processing</h4>
                        <p>Orders are dispatched within 24 to 48 business hours upon confirmation. Tracking numbers are shared immediately.</p>
                      </div>
                      <div className="ship-card">
                        <h4>Registered Facility</h4>
                        <p>Dispatched from our registered facility at 30 N Gould St # 68479 Sheridan, WY 82801, USA.</p>
                      </div>
                      <div className="ship-card">
                        <h4>Customer Protection</h4>
                        <p>All packages are carefully wrapped in tamper-resistant and impact-absorbing materials.</p>
                      </div>
                      <div className="ship-card">
                        <h4>Customer Care</h4>
                        <p>Need support or custom invoicing? Contact {companyInfo.email} or call {companyInfo.phone}.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Related Products Strip */}
            <div className="detail-related-section">
              <div className="related-header">
                <span className="section-tag">MORE ESSENTIALS</span>
                <h2 className="related-title">Other Products from SBR Internationals LLC</h2>
              </div>

              <div className="products-grid">
                {products.filter(p => p.id !== activeProduct.id).map(prod => (
                  <div 
                    key={prod.id} 
                    className="product-card" 
                    onClick={() => viewProductDetail(prod)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-img-wrap">
                      <img src={prod.image} alt={prod.name} className="product-img" loading="lazy" />
                      <span className="product-badge">{prod.categoryName}</span>
                    </div>
                    <div className="product-body">
                      <div className="product-header-row">
                        <span className="product-sku">SKU: {prod.sku}</span>
                        <span className="stock-tag">● {prod.availability}</span>
                      </div>
                      <h3 className="product-title">
                        <button 
                          onClick={(e) => { e.stopPropagation(); viewProductDetail(prod); }}
                          className="product-title-btn"
                        >
                          {prod.name}
                        </button>
                      </h3>
                      <div className="product-price-box">
                        <span className="product-price-val">{prod.price}</span>
                      </div>
                      <p className="product-excerpt">{prod.description}</p>
                      <div className="product-actions-row">
                        <button 
                          className="btn-add-cart"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1, true);
                          }}
                        >
                          <ShoppingCart size={15} />
                          <span>Add to cart</span>
                        </button>
                        <button 
                          className="btn-view-details"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewProductDetail(prod);
                          }}
                        >
                          <Eye size={15} />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW: ABOUT US */}
      {activeTab === 'about' && (
        <div className="section-wrapper" style={{ padding: '60px 24px' }}>
          <div style={{ maxWidth: '880px', margin: '0 auto', background: '#fff', padding: '48px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <span className="section-tag" style={{ color: '#8b7224' }}>COMPANY OVERVIEW</span>
            <h1 className="section-title" style={{ marginBottom: '20px', color: '#17223A' }}>About SBR Internationals LLC</h1>
            <p style={{ fontSize: '1.08rem', color: '#334155', lineHeight: 1.8, marginBottom: '20px' }}>
              <strong>SBR Internationals LLC</strong> is a premier company dedicated to curating quality products across home and kitchen, beauty, personal care, electronics, fashion, and wellness. Operating from our registered headquarters at <strong>30 N Gould St # 68479 Sheridan, WY 82801</strong>.
            </p>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.8, marginBottom: '24px' }}>
              Our philosophy — <em>Quality For Life</em> — drives our commitment to offering everyday essentials that combine functionality, timeless style, and dependable customer service. Whether you are shopping for your personal sanctuary or seeking bulk supply solutions, SBR Internationals LLC delivers excellence at every touchpoint.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', margin: '36px 0' }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#17223A', fontSize: '1.15rem', marginBottom: '8px' }}>Quality For Life</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>Thoughtful essentials designed for everyday living, reliability, and satisfaction.</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#17223A', fontSize: '1.15rem', marginBottom: '8px' }}>Curated Selections</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>Rigorous vetting across beauty, personal care, smart tech, and culinary items.</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#17223A', fontSize: '1.15rem', marginBottom: '8px' }}>Direct Support</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>Dedicated customer desk ready on phone, WhatsApp, and official email.</p>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button 
                className="btn-hero-primary" 
                style={{ background: '#17223A', color: '#D3B066', border: 'none', padding: '12px 32px', borderRadius: '50px', fontWeight: '700', cursor: 'pointer' }}
                onClick={() => navigateTo('contact')}
              >
                Contact Our Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CONTACT US */}
      {activeTab === 'contact' && (
        <div className="section-wrapper" style={{ padding: '60px 24px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <div className="section-header-center" style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span className="section-tag" style={{ color: '#8b7224' }}>GET IN TOUCH</span>
              <h1 className="section-title" style={{ color: '#17223A' }}>Contact SBR Internationals LLC</h1>
              <p style={{ color: '#64748b', maxWidth: '600px', margin: '10px auto 0' }}>
                We are at your service for product inquiries, customer support, or partnership discussions.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '32px', marginTop: '40px' }} className="contact-grid-responsive">
              <div style={{ background: '#17223A', color: '#fff', padding: '36px', borderRadius: '24px', border: '1px solid rgba(211, 176, 102, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', color: '#D3B066', fontWeight: '700' }}>Direct Coordinates</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', fontSize: '0.95rem' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <Mail size={20} color="#D3B066" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Email</div>
                        <a href={`mailto:${companyInfo.email}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
                          {companyInfo.email}
                        </a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '14px' }}>
                      <Phone size={20} color="#D3B066" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Phone</div>
                        <div><a href={`tel:${companyInfo.phoneRaw}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: '600' }}>{companyInfo.phone}</a></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '14px' }}>
                      <MapPin size={20} color="#D3B066" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Official Address</div>
                        <div style={{ color: '#fff', fontWeight: '600' }}>{companyInfo.address}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '14px' }}>
                      <MessageSquare size={20} color="#25d366" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>WhatsApp Direct</div>
                        <a 
                          href={companyInfo.whatsappUrl}
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: '#25d366', fontWeight: '700', textDecoration: 'none' }}
                        >
                          {companyInfo.phone} (Instant Chat)
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.88rem', color: '#94a3b8' }}>
                  {companyInfo.name} • {companyInfo.tagline}
                </div>
              </div>

              <div style={{ background: '#fff', padding: '36px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '18px', color: '#17223A', fontWeight: '700' }}>Send Us a Message</h3>
                <form onSubmit={handleFormSubmit} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input type="text" required placeholder="Your name" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" required placeholder="your.email@example.com" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input type="text" placeholder="Product Inquiry / Order / Assistance" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message *</label>
                    <textarea rows={4} placeholder="How can we assist you today?" required className="form-textarea"></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className="btn-submit-modal"
                    style={{ background: '#17223A', color: '#D3B066', fontWeight: '700' }}
                  >
                    Send Message
                  </button>
                </form>

                {formSubmitted && (
                  <div style={{ marginTop: '16px', padding: '14px', background: '#ecfdf5', color: '#065f46', borderRadius: '12px', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={20} color="#059669" />
                    <span>Thank you! Your message has been received by SBR Internationals LLC. We will reply shortly.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER - EXACT LAYOUT AND CONTENT FROM SBR INTERNATIONALS LLC */}
      <footer className="site-footer" style={{ background: '#3d3210', color: '#ffffff', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '48px', paddingBottom: '48px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Menu Column */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', color: '#ffffff' }}>Menu</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
              <li>
                <a href="#home" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Home</a>
              </li>
              <li>
                <a href="#shop" onClick={(e) => { e.preventDefault(); navigateTo('shop'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Shop</a>
              </li>
              <li>
                <a href="#home-kitchen" onClick={(e) => { e.preventDefault(); handleCategoryClick('home-kitchen'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Home & Kitchen</a>
              </li>
              <li>
                <a href="#beauty" onClick={(e) => { e.preventDefault(); handleCategoryClick('beauty'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Beauty</a>
              </li>
              <li>
                <a href="#personal-care" onClick={(e) => { e.preventDefault(); handleCategoryClick('personal-care'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Personal Care</a>
              </li>
              <li>
                <a href="#electronics" onClick={(e) => { e.preventDefault(); handleCategoryClick('electronics'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Electronics</a>
              </li>
              <li>
                <a href="#fashion" onClick={(e) => { e.preventDefault(); handleCategoryClick('fashion'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Fashion</a>
              </li>
              <li>
                <a href="#health-wellness" onClick={(e) => { e.preventDefault(); handleCategoryClick('health-wellness'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Health & Wellness</a>
              </li>
              <li>
                <a href="#best-sellers" onClick={(e) => { e.preventDefault(); handleCategoryClick('best-sellers'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>Best Sellers</a>
              </li>
              <li>
                <a href="#new-arrivals" onClick={(e) => { e.preventDefault(); handleCategoryClick('new-arrivals'); }} style={{ color: '#ffffff', textDecoration: 'none' }}>New Arrivals</a>
              </li>
            </ul>
          </div>

          {/* Contacts & Socials Column */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', color: '#ffffff' }}>Contacts</h3>
            <div style={{ marginBottom: '28px', fontSize: '0.95rem', lineHeight: 1.8 }}>
              <div>
                <a href={`mailto:${companyInfo.email}`} style={{ color: '#ffffff', textDecoration: 'none' }}>
                  {companyInfo.email}
                </a>
              </div>
              <div>
                <a href={`tel:${companyInfo.phoneRaw}`} style={{ color: '#ffffff', textDecoration: 'none' }}>
                  {companyInfo.phone}
                </a>
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Socials</h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <a href={companyInfo.socials.facebook} target="_blank" rel="noreferrer" style={{ color: '#ffffff' }} aria-label="Facebook">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/>
                </svg>
              </a>
              <a href={companyInfo.socials.instagram} target="_blank" rel="noreferrer" style={{ color: '#ffffff' }} aria-label="Instagram">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4.622c2.403,0,2.688,0.009,3.637,0.052c0.877,0.04,1.354,0.187,1.671,0.31c0.42,0.163,0.72,0.358,1.035,0.673 c0.315,0.315,0.51,0.615,0.673,1.035c0.123,0.317,0.27,0.794,0.31,1.671c0.043,0.949,0.052,1.234,0.052,3.637 s-0.009,2.688-0.052,3.637c-0.04,0.877-0.187,1.354-0.31,1.671c-0.163,0.42-0.358,0.72-0.673,1.035 c-0.315,0.315-0.615,0.51-1.035,0.673c-0.317,0.123-0.794,0.27-1.671,0.31c-0.949,0.043-1.233,0.052-3.637,0.052 s-2.688-0.009-3.637-0.052c-0.877-0.04-1.354-0.187-1.671-0.31c-0.42-0.163-0.72-0.358-1.035-0.673 c-0.315-0.315-0.51-0.615-0.673-1.035c-0.123-0.317-0.27-0.794-0.31-1.671C4.631,14.688,4.622,14.403,4.622,12 s0.009-2.688,0.052-3.637c0.04-0.877,0.187-1.354,0.31-1.671c0.163-0.42,0.358-0.72,0.673-1.035 c0.315-0.315,0.615-0.51,1.035-0.673c0.317-0.123,0.794-0.27,1.671-0.31C9.312,4.631,9.597,4.622,12,4.622 M12,3 C9.556,3,9.249,3.01,8.289,3.054C7.331,3.098,6.677,3.25,6.105,3.472C5.513,3.702,5.011,4.01,4.511,4.511 c-0.5,0.5-0.808,1.002-1.038,1.594C3.25,6.677,3.098,7.331,3.054,8.289C3.01,9.249,3,9.556,3,12c0,2.444,0.01,2.751,0.054,3.711 c0.044,0.958,0.196,1.612,0.418,2.185c0.23,0.592,0.538,1.094,1.038,1.594c0.5,0.5,1.002,0.808,1.594,1.038 c0.572,0.222,1.227,0.375,2.185,0.418C9.249,20.99,9.556,21,12,21s2.751-0.01,3.711-0.054c0.958-0.044,1.612-0.196,2.185-0.418 c0.592-0.23,1.094-0.538,1.594-1.038c0.5-0.5,0.808-1.002,1.038-1.594c0.222-0.572,0.375-1.227,0.418-2.185 C20.99,14.751,21,14.444,21,12s-0.01-2.751-0.054-3.711c-0.044-0.958-0.196-1.612-0.418-2.185c-0.23-0.592-0.538-1.094-1.038-1.594 c-0.5-0.5-1.002-0.808-1.594-1.038c-0.572-0.222-1.227-0.375-2.185-0.418C14.751,3.01,14.444,3,12,3L12,3z M12,7.378 c-2.552,0-4.622,2.069-4.622,4.622S9.448,16.622,12,16.622s4.622-2.069,4.622-4.622S14.552,7.378,12,7.378z M12,15 c-1.657,0-3-1.343-3-3s1.343-3,3-3s3,1.343,3,3S13.657,15,12,15z M16.804,6.116c-0.596,0-1.08,0.484-1.08,1.08 s0.484,1.08,1.08,1.08c0.596,0,1.08-0.484,1.08-1.08S17.401,6.116,16.804,6.116z"/>
                </svg>
              </a>
              <a href={companyInfo.socials.tiktok} target="_blank" rel="noreferrer" style={{ color: '#ffffff' }} aria-label="TikTok">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16.708 0.027c1.745-0.027 3.48-0.011 5.213-0.027 0.105 2.041 0.839 4.12 2.333 5.563 1.491 1.479 3.6 2.156 5.652 2.385v5.369c-1.923-0.063-3.855-0.463-5.6-1.291-0.76-0.344-1.468-0.787-2.161-1.24-0.009 3.896 0.016 7.787-0.025 11.667-0.104 1.864-0.719 3.719-1.803 5.255-1.744 2.557-4.771 4.224-7.88 4.276-1.907 0.109-3.812-0.411-5.437-1.369-2.693-1.588-4.588-4.495-4.864-7.615-0.032-0.667-0.043-1.333-0.016-1.984 0.24-2.537 1.495-4.964 3.443-6.615 2.208-1.923 5.301-2.839 8.197-2.297 0.027 1.975-0.052 3.948-0.052 5.923-1.323-0.428-2.869-0.308-4.025 0.495-0.844 0.547-1.485 1.385-1.819 2.333-0.276 0.676-0.197 1.427-0.181 2.145 0.317 2.188 2.421 4.027 4.667 3.828 1.489-0.016 2.916-0.88 3.692-2.145 0.251-0.443 0.532-0.896 0.547-1.417 0.131-2.385 0.079-4.76 0.095-7.145 0.011-5.375-0.016-10.735 0.025-16.093z" />
                </svg>
              </a>
              <a href={companyInfo.socials.whatsapp} target="_blank" rel="noreferrer" style={{ color: '#ffffff' }} aria-label="WhatsApp">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M 12.011719 2 C 6.5057187 2 2.0234844 6.478375 2.0214844 11.984375 C 2.0204844 13.744375 2.4814687 15.462563 3.3554688 16.976562 L 2 22 L 7.2324219 20.763672 C 8.6914219 21.559672 10.333859 21.977516 12.005859 21.978516 L 12.009766 21.978516 C 17.514766 21.978516 21.995047 17.499141 21.998047 11.994141 C 22.000047 9.3251406 20.962172 6.8157344 19.076172 4.9277344 C 17.190172 3.0407344 14.683719 2.001 12.011719 2 z M 12.009766 4 C 14.145766 4.001 16.153109 4.8337969 17.662109 6.3417969 C 19.171109 7.8517969 20.000047 9.8581875 19.998047 11.992188 C 19.996047 16.396187 16.413812 19.978516 12.007812 19.978516 C 10.674812 19.977516 9.3544062 19.642812 8.1914062 19.007812 L 7.5175781 18.640625 L 6.7734375 18.816406 L 4.8046875 19.28125 L 5.2851562 17.496094 L 5.5019531 16.695312 L 5.0878906 15.976562 C 4.3898906 14.768562 4.0204844 13.387375 4.0214844 11.984375 C 4.0234844 7.582375 7.6067656 4 12.009766 4 z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', color: '#ffffff' }}>Subscribe to our newsletter</h3>
            <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem', color: '#f1f5f9' }}>Email <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="email" 
                required 
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                style={{
                  background: '#8b7224',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  marginTop: '4px'
                }}
              >
                Subscribe
              </button>
            </form>

            {newsletterSuccess && (
              <div style={{ marginTop: '12px', color: '#4ade80', fontSize: '0.88rem' }}>
                ✓ Thanks for subscribing.
              </div>
            )}
          </div>
        </div>

        {/* Footer Bottom copyright */}
        <div style={{ maxWidth: '1280px', margin: '30px auto 0', textAlign: 'center', fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>© 2026</span>
          <strong style={{ color: '#ffffff' }}>{companyInfo.name}</strong>
          <span>All rights reserved.</span>
        </div>
      </footer>

      {/* CART DRAWER SLIDE-OVER */}
      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <div className="cart-header-title">
                <ShoppingBag size={20} color="#8b7224" />
                <h3>Your Shopping Cart</h3>
                <span className="cart-count-pill">{totalCartItems} items</span>
              </div>
              <button className="cart-close-btn" onClick={() => setCartOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-drawer-body">
              {cart.length === 0 ? (
                <div className="cart-empty-state">
                  <div className="empty-cart-icon">
                    <ShoppingCart size={48} strokeWidth={1.5} color="#94a3b8" />
                  </div>
                  <h4>Your shopping cart is empty</h4>
                  <p>Browse our quality categories and add products to your cart.</p>
                  <button 
                    className="btn-hero-primary" 
                    style={{ marginTop: '16px', background: '#17223A', color: '#D3B066', border: 'none', padding: '12px 28px', borderRadius: '50px', cursor: 'pointer' }}
                    onClick={() => {
                      setCartOpen(false);
                      navigateTo('shop');
                    }}
                  >
                    Return to shop
                  </button>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.product.id} className="cart-item-row">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="cart-item-img" 
                      />
                      <div className="cart-item-info">
                        <h4 className="cart-item-name">{item.product.name}</h4>
                        <div className="cart-item-sku">SKU: {item.product.sku}</div>
                        <div className="cart-item-price-unit">{item.product.price} each</div>
                        
                        <div className="cart-item-controls">
                          <div className="cart-qty-stepper">
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, -1)}
                              className="cart-qty-btn"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="cart-qty-num">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, 1)}
                              className="cart-qty-btn"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div className="cart-item-line-total">
                            ₨ {(item.product.priceNumeric * item.quantity).toLocaleString()}
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="cart-remove-btn"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-summary-box">
                  <div className="summary-row">
                    <span>Total Quantity:</span>
                    <strong>{totalCartItems} units</strong>
                  </div>
                  <div className="summary-row subtotal">
                    <span>Subtotal:</span>
                    <strong className="summary-amount">₨ {cartSubtotal.toLocaleString()}</strong>
                  </div>
                  <p className="summary-note">Shipping and taxes confirmed upon order placement.</p>
                </div>

                <div className="cart-footer-actions">
                  <a 
                    href={`https://wa.me/+13076677525?text=${encodeURIComponent(
                      `Hello SBR Internationals LLC, I would like to order:\n\n` +
                      cart.map(i => `• ${i.product.name} (SKU: ${i.product.sku}) - Qty: ${i.quantity} x ${i.product.price} = ₨ ${(i.product.priceNumeric * i.quantity).toLocaleString()}`).join('\n') +
                      `\n\nTotal Estimated: ₨ ${cartSubtotal.toLocaleString()}\nTotal Items: ${totalCartItems}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-cart-whatsapp"
                    style={{ background: '#25d366', color: '#ffffff', textDecoration: 'none' }}
                  >
                    <MessageSquare size={18} />
                    <span>Instant Checkout via WhatsApp</span>
                  </a>

                  <button 
                    className="btn-cart-checkout"
                    style={{ background: '#17223A', color: '#D3B066' }}
                    onClick={() => {
                      setCartOpen(false);
                      handleOpenPartner('checkout');
                    }}
                  >
                    <span>Proceed to Order Checkout</span>
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="cart-clear-row">
                  <button onClick={clearCart} className="btn-clear-cart">
                    Clear Entire Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="cart-toast">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL: QUOTE REQUEST, INQUIRY, OR CHECKOUT */}
      {modalType && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <X size={18} />
            </button>

            {modalType === 'quote' && selectedProduct && (
              <>
                <h3 className="modal-title">Request Product Quote / Invoice</h3>
                <p className="modal-subtitle">
                  Inquiring for: <strong>{selectedProduct.name}</strong> (SKU: {selectedProduct.sku})
                </p>
                <form onSubmit={handleFormSubmit} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input type="text" required placeholder="Your name" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" required placeholder="your.email@example.com" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number / WhatsApp *</label>
                    <input type="tel" required placeholder="(+1) 3076677525" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Requested Quantity</label>
                    <input type="text" placeholder="e.g. 10 Units / 1 Carton" className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Destination</label>
                    <input type="text" placeholder="City, State / Country" className="form-input" required />
                  </div>
                  <button type="submit" className="btn-submit-modal" style={{ background: '#17223A', color: '#D3B066' }}>
                    Submit Quote Request
                  </button>
                </form>
              </>
            )}

            {modalType === 'checkout' && (
              <>
                <h3 className="modal-title">Order Checkout</h3>
                <p className="modal-subtitle">
                  Submitting order for: <strong>{totalCartItems} units • Total: ₨ {cartSubtotal.toLocaleString()}</strong>
                </p>
                <form onSubmit={handleFormSubmit} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Customer Name *</label>
                    <input type="text" required placeholder="Your full name" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" required placeholder="your.email@example.com" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone / WhatsApp Number *</label>
                    <input type="tel" required placeholder="(+1) Phone" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shipping / Delivery Address *</label>
                    <input type="text" required placeholder="Street address, City, Country" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order Notes</label>
                    <textarea rows={2} placeholder="Optional delivery instructions..." className="form-textarea"></textarea>
                  </div>
                  <button type="submit" className="btn-submit-modal" style={{ background: '#17223A', color: '#D3B066' }}>
                    Confirm & Place Order (₨ {cartSubtotal.toLocaleString()})
                  </button>
                </form>
              </>
            )}

            {formSubmitted && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#ecfdf5', color: '#065f46', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="#059669" />
                <div>
                  <strong>Order / Inquiry Dispatched!</strong>
                  <p style={{ fontSize: '0.85rem' }}>SBR Internationals LLC customer desk will confirm your order and reach out via WhatsApp/email promptly.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
