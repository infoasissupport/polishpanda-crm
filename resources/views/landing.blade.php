<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shine wise— Smart Car Wash Management Software</title>
<meta name="description" content="WashFlow is a cloud-based car wash management platform for bookings, staff, inventory, billing, memberships and customer history.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/landing/css/common-style.css">
<link rel="stylesheet" href="/landing/css/landing.css?v={{ filemtime(public_path('landing/css/landing.css')) }}">
</head>
<body class="landing">

<!-- ============ ICON SPRITE ============ -->
<svg style="display:none">
<defs>
<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/><circle cx="8" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17.5" cy="9" r="2.4"/><path d="M15.5 14.2c2.6.3 4.7 2.5 4.7 5.8"/></symbol>
<symbol id="i-box" viewBox="0 0 24 24"><path d="M3 8l9-4.5L21 8v8l-9 4.5L3 16z"/><path d="M3 8l9 4.5L21 8M12 12.5V21"/></symbol>
<symbol id="i-card" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19M6 15h4"/></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2.5 20.5h19"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.4"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.4"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.4"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></symbol>
<symbol id="i-history" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 2.6-6.3"/><path d="M3 4v5h5M12 8v4l3 2"/></symbol>
<symbol id="i-badge" viewBox="0 0 24 24"><path d="M12 3l2.2 2.2 3.1-.4.9 3 2.8 1.4-1 3 1 3-2.8 1.4-.9 3-3.1-.4L12 21l-2.2-2.2-3.1.4-.9-3-2.8-1.4 1-3-1-3 2.8-1.4.9-3 3.1.4z"/><circle cx="12" cy="12" r="2.6"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 12.5h5"/></symbol>
<symbol id="i-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></symbol>
<symbol id="i-car" viewBox="0 0 24 24"><path d="M4 16V11l2-5h12l2 5v5"/><path d="M2.5 16h19v3h-3v-2h-13v2h-3z"/><circle cx="7.5" cy="16" r="1.6"/><circle cx="16.5" cy="16" r="1.6"/></symbol>
<symbol id="i-trend" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6"/></symbol>
<symbol id="i-cloud" viewBox="0 0 24 24"><path d="M7 18h10.5a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.7-1.7A4 4 0 0 0 7 18z"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.2h2"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></symbol>
<symbol id="i-receipt" viewBox="0 0 24 24"><path d="M6 3h12v18l-2.5-1.5L13 21l-1-1.5-1 1.5-2.5-1.5L6 21z"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4"/></symbol>
<symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.3"/><path d="M10 8.5l6 3.5-6 3.5z"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></symbol>
<symbol id="i-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
<symbol id="i-branch" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M6 8.2V15.8M6 8v.2c0 3.5 2.5 5.8 6 5.8h4"/></symbol>
<symbol id="i-whatsapp" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L2 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-69.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.9 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.6-9.7-1.5-2.8-13.4-32.3-18.3-44.2-4.8-11.6-9.7-10-13.3-10.2-3.4-.2-7.3-.2-11.2-.2-3.9 0-10.2 1.5-15.6 7.3-5.4 5.8-20.7 20.3-20.7 49.4 0 29.1 21.2 57.3 24.1 61.2 2.9 3.9 40.1 61.2 97.6 83.4 48.9 19 58.9 15.3 69.5 13.9 10.7-1.3 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.3-5.2-3.7-10.9-6.4z"/></symbol>
</defs>
</svg>

<!-- ============ NAVBAR ============ -->
<header class="nav" id="top">
  <div class=" nav__inner">
    <a href="#top" class="nav__logo"><img alt="Shinewise" src="/images/landing-logo.png"></a>
    <nav class="nav__menu" id="navMenu">
      <button class="nav__menu-close" id="navMenuClose" aria-label="Close menu"><svg width="20" height="20"><use href="#i-close"/></svg></button>
      <a href="#home" class="nav__link">Home</a>
      <a href="#features" class="nav__link">Features</a>
      <a href="#faq" class="nav__link">FAQ</a>
      <a href="#contact" class="nav__link">Contact</a>
      <a href="#privacy" class="nav__link">Privacy Policy</a>
    <a target="_blank" rel="noopener" href="https://shinewise.in/dashboard" class="btn btn--accent btn--fill nav__cta">Go To DashBoard</a>
    </nav>
    <div class="nav__overlay" id="navOverlay"></div>
    <button class="nav__burger" id="navBurger" aria-label="Toggle menu"><svg width="22" height="22"><use href="#i-menu"/></svg></button>
  </div>
</header>
<div id="smooth-wrapper">
<div id="smooth-content">

<section class="cine-hero" id="home">
  <div class="cine-hero__pin">
    <video id="heroVideo" class="cine-hero__video" autoplay muted loop playsinline tabindex="-1" aria-hidden="true" poster="/landing/images/hero-poster.png">
      <source src="/landing/images/hero-video.mp4" type="video/mp4">
    </video>
    <div class="cine-hero__scrim"></div>
    <div class="cine-hero__watermark-mask" aria-hidden="true"></div>

    <div class="container cine-hero__content" id="cineContent">
      <span class="eyebrow" data-reveal>Built for Modern Car Wash Businesses</span>
      <h1 class="hero__title" data-reveal>Smart Car Wash <span class="text-accent">Management</span> Software</h1>
      <p class="hero__sub" data-reveal>Manage bookings, staff, inventory, billing, memberships, and customer history — all from one cloud-based platform.</p>
      <div class="hero__cta" data-reveal>
        <a  href="https://wa.me/+918075983996?text=Hi%20Shinewise!%20I'm%20interested%20in%20booking%20a%20demo%20for%20the%20car%20wash%20management%20software.%20Could%20you%20share%20more%20details%3F" class="btn btn--accent btn--fill btn--lg">Start Free Demo <svg width="16" height="16"><use href="#i-arrow-right"/></svg></a>

      </div>
      <ul class="hero__highlights" data-reveal>
        <li><svg width="14" height="14"><use href="#i-check"/></svg> Cloud Based</li>
        <li><svg width="14" height="14"><use href="#i-check"/></svg> Multi Branch</li>
        <li><svg width="14" height="14"><use href="#i-check"/></svg> Mobile Friendly</li>
        <li><svg width="14" height="14"><use href="#i-check"/></svg> Secure Data</li>
        <li><svg width="14" height="14"><use href="#i-check"/></svg> GST Ready</li>
      </ul>
    </div>
  </div>
</section>



<!-- ============ WHY CHOOSE ============ -->
<section class="why" id="why">
  <div class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Why Shinewyz</span>
      <h2>Why Choose Our Software</h2>
      <p>Everything you need to run a modern, multi-branch car wash operation — in one dashboard.</p>
    </div>
    <div class="grid grid--3 reveal-stagger">
      <div class="card">
        <div class="card__icon"><svg width="22" height="22"><use href="#i-calendar"/></svg></div>
        <h3>Booking Management</h3>
        <p>Manage appointments effortlessly, online and walk-in.</p>
      </div>
      <div class="card">
        <div class="card__icon"><svg width="22" height="22"><use href="#i-users"/></svg></div>
        <h3>Customer CRM</h3>
        <p>Complete customer &amp; vehicle history at your fingertips.</p>
      </div>
      <div class="card">
        <div class="card__icon"><svg width="22" height="22"><use href="#i-badge"/></svg></div>
        <h3>Staff Management</h3>
        <p>Attendance, shifts and performance tracking made easy.</p>
      </div>
      <div class="card">
        <div class="card__icon"><svg width="22" height="22"><use href="#i-box"/></svg></div>
        <h3>Inventory</h3>
        <p>Track foam, wax, chemicals and stock levels in real time.</p>
      </div>
      <div class="card">
        <div class="card__icon"><svg width="22" height="22"><use href="#i-card"/></svg></div>
        <h3>POS Billing</h3>
        <p>Fast billing with GST-ready invoices, every time.</p>
      </div>
      <div class="card">
        <div class="card__icon"><svg width="22" height="22"><use href="#i-chart"/></svg></div>
        <h3>Reports</h3>
        <p>Business insights and analytics in real time.</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ PRODUCT FEATURES ============ -->
<section class="features" id="features">
  <div class="container features__inner">
    <div class="features__visual" data-reveal-left>
      <div class="mock" id="featMock" data-parallax="0.12">
        <div class="mock__bar"><span></span><span></span><span></span><p>dashboard</p></div>
        <div class="mock__body">
          <div class="mock__side">
            <div class="mock__side-logo"></div>
            <div class="mock__side-item"><svg width="14" height="14"><use href="#i-grid"/></svg></div>
            <div class="mock__side-item mock__side-item--active"><svg width="14" height="14"><use href="#i-chart"/></svg></div>
            <div class="mock__side-item"><svg width="14" height="14"><use href="#i-users"/></svg></div>
            <div class="mock__side-item"><svg width="14" height="14"><use href="#i-box"/></svg></div>
            <div class="mock__side-item"><svg width="14" height="14"><use href="#i-settings"/></svg></div>
          </div>
          <div class="mock__main">
            <div class="mock__heading">
              <h4>Monthly Overview</h4>
              <span class="mock__pill">This Month</span>
            </div>
            <div class="mock__stats3">
              <div class="mock__stat"><span class="mock__stat-label">Revenue</span><span class="mock__stat-value">₹1.2L</span></div>
              <div class="mock__stat"><span class="mock__stat-label">Bookings</span><span class="mock__stat-value">842</span></div>
              <div class="mock__stat"><span class="mock__stat-label">Customers</span><span class="mock__stat-value">312</span></div>
            </div>
            <div class="mock__chart mock__chart--full">
              <span style="--h:30%"></span><span style="--h:55%"></span><span style="--h:70%"></span>
              <span style="--h:45%"></span><span style="--h:85%"></span><span style="--h:60%"></span>
              <span style="--h:75%"></span><span style="--h:50%"></span><span style="--h:90%"></span>
              <span style="--h:65%"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="features__list" data-reveal-right>
      <span class="eyebrow">Product Features</span>
      <h2>One platform. Every workflow.</h2>
      <ul class="feat-list reveal-stagger">
        <li><svg width="16" height="16"><use href="#i-grid"/></svg>Dashboard</li>
        <li><svg width="16" height="16"><use href="#i-calendar"/></svg>Online Booking</li>
        <li><svg width="16" height="16"><use href="#i-car"/></svg>Walk-in Booking</li>
        <li><svg width="16" height="16"><use href="#i-clock"/></svg>Staff Attendance</li>
        <li><svg width="16" height="16"><use href="#i-history"/></svg>Customer History</li>
        <li><svg width="16" height="16"><use href="#i-box"/></svg>Inventory</li>
        <li><svg width="16" height="16"><use href="#i-badge"/></svg>Membership</li>
        <li><svg width="16" height="16"><use href="#i-card"/></svg>Billing</li>
        <li><svg width="16" height="16"><use href="#i-chart"/></svg>Reports</li>
        <li><svg width="16" height="16"><use href="#i-chat"/></svg>WhatsApp Notification</li>
      </ul>
    </div>
  </div>
</section>

<!-- ============ HOW IT WORKS ============ -->
<section class="workflow" id="how">
  <div class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">How It Works</span>
      <h2>Complete Workflow</h2>
      <p>From booking to feedback — every step tracked automatically.</p>
    </div>
    <div class="workflow__track">
      <div class="workflow__line"><span class="workflow__line-fill"></span></div>
      <div class="workflow__steps">
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">1</span><p>Customer Booking</p></div>
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">2</span><p>Appointment</p></div>
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">3</span><p>Vehicle Check-in</p></div>
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">4</span><p>Wash Process</p></div>
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">5</span><p>Quality Inspection</p></div>
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">6</span><p>Invoice</p></div>
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">7</span><p>Payment</p></div>
        <div class="wstep"><span class="wstep__connector"></span><span class="wstep__num">8</span><p>Customer Feedback</p></div>
      </div>
    </div>
  </div>
</section>



<!-- ============ CORE MODULES ============ -->
<section class="modules" id="modules">
  <div class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Core Modules</span>
      <h2>Built To Run Every Part Of Your Business</h2>
    </div>
    <div class="grid grid--4 modules__grid reveal-stagger">
      <div class="module module--featured">
        <span class="module__icon module__icon--lg"><svg width="26" height="26"><use href="#i-grid"/></svg></span>
        <h4 class="module__title">Dashboard</h4>
        <p class="module__desc">A real-time overview of bookings, revenue, staff and inventory — all in one view.</p>
      </div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-calendar"/></svg></span>Booking</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-users"/></svg></span>Customers</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-car"/></svg></span>Vehicles</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-badge"/></svg></span>Staff</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-clock"/></svg></span>Attendance</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-box"/></svg></span>Inventory</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-card"/></svg></span>POS Billing</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-badge"/></svg></span>Membership</div>
      <div class="module module--wide">
        <span class="module__icon module__icon--lg"><svg width="22" height="22"><use href="#i-chart"/></svg></span>
        <div class="module__body">
          <h4 class="module__title">Reports</h4>
          <p class="module__desc">Export business insights to Excel or PDF in one click.</p>
        </div>
      </div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-trend"/></svg></span>Analytics</div>
      <div class="module"><span class="module__icon"><svg width="20" height="20"><use href="#i-settings"/></svg></span>Settings</div>
    </div>
  </div>
</section>

<!-- ============ MOBILE RESPONSIVE ============ -->
<section class="responsive">
  <div class="container responsive__inner">
    <div class="responsive__text" data-reveal-left>
      <span class="eyebrow">Mobile Responsive</span>
      <h2>Runs Great On Every Screen</h2>
      <p>Give customers a booking experience they love, and give staff a simple app for daily tasks — no install required.</p>
      <div class="tabs">
        <button class="tab tab--active" data-tab="customer"><svg width="15" height="15"><use href="#i-users"/></svg>Customer</button>
        <button class="tab" data-tab="staff"><svg width="15" height="15"><use href="#i-badge"/></svg>Staff</button>
        <button class="tab" data-tab="manager"><svg width="15" height="15"><use href="#i-chart"/></svg>Manager</button>
      </div>
    </div>
    <div class="responsive__visual" data-reveal-right>
      <div class="phone" data-parallax="0.1">
        <div class="phone__notch"></div>
        <div class="phone__screen">
          <div class="phone__status">
            <span>9:41</span>
            <span class="phone__status-icons"><svg width="12" height="12"><use href="#i-trend"/></svg><svg width="12" height="12"><use href="#i-cloud"/></svg></span>
          </div>
          <div class="phone__body">
            <div class="phone__panel phone__panel--active" data-panel="customer">
              <div class="phone__head">Hi Aravind 👋</div>
              <div class="phone__card">
                <span class="phone__card-label">Next Wash</span>
                <span class="phone__card-value">Today, 4:30 PM</span>
              </div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-calendar"/></svg>Book Wash</div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-badge"/></svg>Membership</div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-card"/></svg>Payment</div>
            </div>
            <div class="phone__panel" data-panel="staff">
              <div class="phone__head">Hi Rahul 👋</div>
              <div class="phone__card">
                <span class="phone__card-label">Today's Shift</span>
                <span class="phone__card-value">9:00 AM – 6:00 PM</span>
              </div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-clock"/></svg>Attendance</div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-check"/></svg>Complete Job</div>
            </div>
            <div class="phone__panel" data-panel="manager">
              <div class="phone__head">Hi Divya 👋</div>
              <div class="phone__card">
                <span class="phone__card-label">Today's Revenue</span>
                <span class="phone__card-value">₹12,400</span>
              </div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-chart"/></svg>Reports</div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-trend"/></svg>Revenue</div>
              <div class="phone__item"><svg width="16" height="16"><use href="#i-users"/></svg>Staff Overview</div>
            </div>
          </div>
          <div class="phone__navbar">
            <span class="phone__navbtn phone__navbtn--active"><svg width="16" height="16"><use href="#i-grid"/></svg></span>
            <span class="phone__navbtn"><svg width="16" height="16"><use href="#i-calendar"/></svg></span>
            <span class="phone__navbtn"><svg width="16" height="16"><use href="#i-chat"/></svg></span>
            <span class="phone__navbtn"><svg width="16" height="16"><use href="#i-settings"/></svg></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ BENEFITS ============ -->
<section class="benefits" id="benefits">
  <div class="container">
    <div class="section-head" data-reveal>
      <span class="eyebrow">Business Benefits</span>
      <h2>Grow Your Car Wash Business Faster</h2>
    </div>
    <div class="grid grid--3 reveal-stagger">
      <div class="benefit"><span class="benefit__icon"><svg width="20" height="20"><use href="#i-trend"/></svg></span><h4>Increase Revenue</h4><p>Capture every booking and upsell opportunity.</p></div>
      <div class="benefit"><span class="benefit__icon"><svg width="20" height="20"><use href="#i-settings"/></svg></span><h4>Reduce Manual Work</h4><p>Automate scheduling, billing and reminders.</p></div>
      <div class="benefit"><span class="benefit__icon"><svg width="20" height="20"><use href="#i-clock"/></svg></span><h4>Save Time</h4><p>Run daily operations in minutes, not hours.</p></div>
      <div class="benefit"><span class="benefit__icon"><svg width="20" height="20"><use href="#i-users"/></svg></span><h4>Improve Satisfaction</h4><p>Faster service and transparent communication.</p></div>
      <div class="benefit"><span class="benefit__icon"><svg width="20" height="20"><use href="#i-history"/></svg></span><h4>Track Every Booking</h4><p>Full visibility from check-in to payment.</p></div>
      <div class="benefit"><span class="benefit__icon"><svg width="20" height="20"><use href="#i-branch"/></svg></span><h4>Grow Faster</h4><p>Scale to new branches without extra overhead.</p></div>
    </div>
  </div>
</section>



<!-- ============ FAQ ============ -->
<section class="faq" id="faq">
  <div class="container faq__inner">
    <div class="section-head section-head--start" data-reveal>
      <span class="eyebrow">FAQ</span>
      <h2>Frequently Asked Questions</h2>
    </div>
    <div class="accordion reveal-stagger">
      <div class="acc-item acc-item--open">
        <button class="acc-head">Can I manage multiple branches?<svg width="16" height="16"><use href="#i-chevron"/></svg></button>
        <div class="acc-body"><p>Yes — switch between branches from a single account with branch-level reporting.</p></div>
      </div>
      <div class="acc-item">
        <button class="acc-head">Is GST supported?<svg width="16" height="16"><use href="#i-chevron"/></svg></button>
        <div class="acc-body"><p>Yes, all invoices are GST-ready out of the box.</p></div>
      </div>
      <div class="acc-item">
        <button class="acc-head">Can customers book online?<svg width="16" height="16"><use href="#i-chevron"/></svg></button>
        <div class="acc-body"><p>Yes, customers can book online or walk in — both flow into the same dashboard.</p></div>
      </div>
      <div class="acc-item">
        <button class="acc-head">Is there a mobile app?<svg width="16" height="16"><use href="#i-chevron"/></svg></button>
        <div class="acc-body"><p>WashFlow is a responsive web app that works great on any phone — no install needed.</p></div>
      </div>
      <div class="acc-item">
        <button class="acc-head">Can I export reports?<svg width="16" height="16"><use href="#i-chevron"/></svg></button>
        <div class="acc-body"><p>Yes, export any report to Excel or PDF in one click.</p></div>
      </div>
    </div>
  </div>
</section>

<!-- ============ CONTACT / DEMO FORM ============ -->
<section class="contact" id="contact">
  <canvas id="contact-canvas"></canvas>
  <div class="container contact__inner">
    <div class="contact__text" data-reveal>
      <span class="eyebrow">Book A Demo</span>
      <h2>Ready To Digitize Your Car Wash Business?</h2>
      <p>Start managing bookings, staff, billing, inventory, and customer relationships from one powerful platform.</p>
      <ul class="hero__highlights">
        <li><svg width="14" height="14"><use href="#i-check"/></svg> No credit card required</li>
        <li><svg width="14" height="14"><use href="#i-check"/></svg> Setup in under a day</li>
      </ul>
      <div class="contact__cta">
        <a target="_blank"  href="https://wa.me/+918075983996?text=Hi%20Shinewise!%20I'm%20interested%20in%20booking%20a%20demo%20for%20the%20car%20wash%20management%20software.%20Could%20you%20share%20more%20details%3F"  class="btn btn--accent btn--fill btn--lg">Book Demo <svg width="16" height="16"><use href="#i-arrow-right"/></svg></a>
        <a  target="_blank" rel="noopener" href="https://wa.me/+918075983996?text=Hi%20Shinewise!%20I'm%20interested%20in%20booking%20a%20demo%20for%20the%20car%20wash%20management%20software.%20Could%20you%20share%20more%20details%3F" class="btn btn--whatsapp btn--lg"><svg width="18" height="18" class="icon-fill"><use href="#i-whatsapp"/></svg> WhatsApp Us</a>
      </div>
    </div>
  </div>
</section>

<!-- ============ PRIVACY POLICY ============ -->
<section class="privacy" id="privacy">
  <div class="container privacy__inner">
    <div class="section-head section-head--start" data-reveal>
      <span class="eyebrow">Privacy Policy</span>
      <h2>Your Data, Protected</h2>
      <p>How Shinewise collects, uses and safeguards information when you use our car wash management software.</p>
      <p class="privacy__updated">Last updated: 29 September 2026</p>
    </div>
    <div class="privacy__list reveal-stagger">
      <div class="privacy__item">
        <h3>1. Information We Collect</h3>
        <p>When you sign up or book a demo we collect business details such as your name, business name, phone number, email and branch address. While you use Shinewise, the data you enter (customers, vehicles, bookings, staff, attendance, inventory, invoices and payments) is stored on your behalf.</p>
      </div>
      <div class="privacy__item">
        <h3>2. How We Use Information</h3>
        <p>We use this information to provide and maintain the service, generate invoices and reports, send booking and service notifications (including WhatsApp messages you choose to send), offer support, and improve the product. We do not sell your data or your customers' data.</p>
      </div>
      <div class="privacy__item">
        <h3>3. Your Customers' Data</h3>
        <p>Customer and vehicle records you add belong to your business. Shinewise processes them only to run the features you use, and you remain responsible for having your customers' consent to store their contact details.</p>
      </div>
      <div class="privacy__item">
        <h3>4. Data Security</h3>
        <p>Data is kept on secured cloud servers with encrypted connections (HTTPS), password-protected accounts and role-based access for owners, managers and staff. No system is completely risk-free, so please keep your login credentials confidential.</p>
      </div>
      <div class="privacy__item">
        <h3>5. Sharing With Third Parties</h3>
        <p>We share information only with trusted service providers needed to run Shinewise, such as hosting and messaging services, or when required by law. These providers may use the data only to deliver their service to us.</p>
      </div>
      <div class="privacy__item">
        <h3>6. Data Retention &amp; Your Rights</h3>
        <p>We keep your data for as long as your account is active. You can export your data at any time from Settings, and you may ask us to correct or delete your account information by contacting us.</p>
      </div>
      <div class="privacy__item">
        <h3>7. Cookies</h3>
        <p>We use essential cookies to keep you signed in and to remember your preferences. We do not use cookies for third-party advertising.</p>
      </div>
      <div class="privacy__item">
        <h3>8. Contact Us</h3>
        <p>For any privacy questions or requests, reach us on <a target="_blank" rel="noopener" href="https://wa.me/+918075983996">WhatsApp at +91 80759 83996</a>. We may update this policy from time to time, and changes will be posted on this page.</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="footer">
  <div class="container">
  <div class=" footer__inner reveal-stagger">
    <div class="footer__brand">
      <a href="#top" class="nav__logo"><img alt="Shinewise" src="/images/landing-logo.png" style="height:28px;width:auto;"></a>

      <p>Smart car wash management software for growing businesses.</p>
 
    </div>
    <div class="footer__col">
      <h5>Company</h5>
      <a href="#why">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#">Support</a>
    </div>
    <div class="footer__col">
      <h5>Legal</h5>
      <a href="#privacy">Privacy Policy</a>
  
    </div>
    <div class="footer__col">
      <h5>Contact</h5>
      <a  target="_blank" rel="noopener" href="https://wa.me/+918075983996?text=Hi%20Shinewise!%20I'm%20interested%20in%20booking%20a%20demo%20for%20the%20car%20wash%20management%20software.%20Could%20you%20share%20more%20details%3F" rel="noopener">Book a Demo</a>

    </div>
  </div>
  <div class=" footer__bottom ">
    <p>&copy; 2026 Shinewyz. All rights reserved.</p>
    <p>Designed by <a target="_blank" href="https://infoasis.in/">ATTECHINFOASIS</a></p>
  </div>
  </div>

</footer>

</div>
</div>


<a href="https://wa.me/+918075983996?text=Hi%20Shinewise!%20I'm%20interested%20in%20booking%20a%20demo%20for%20the%20car%20wash%20management%20software.%20Could%20you%20share%20more%20details%3F" target="_blank" rel="noopener" class="whatsapp-float" aria-label="Chat on WhatsApp">
  <span class="whatsapp-float__pulse"></span>
  <svg width="26" height="26"><use href="#i-whatsapp"/></svg>
</a>

<button class="to-top" id="toTop" aria-label="Back to top"><svg width="16" height="16" class="to-top__icon"><use href="#i-chevron"/></svg></button>

<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="/landing/js/landing.js"></script>
</body>
</html>
