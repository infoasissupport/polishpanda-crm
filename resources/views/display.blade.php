<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shinewise — Digital display</title>
<link rel="stylesheet" href="{{ asset('css/icons.css') }}?v={{ filemtime(public_path('css/icons.css')) }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/common.css') }}">
<link rel="stylesheet" href="{{ asset('css/display.css') }}">
</head>
<body data-page="display" class="display-page">

<div class="display-shell">
  <header class="display-header">
    <div class="display-brand">
      <div class="brand-mark"><i class="ti ti-droplet-filled"></i></div>
      <div>
        <div class="display-brand-name">Shinewise</div>
        <div class="display-brand-sub">Kottayam — Main branch</div>
      </div>
    </div>
    <div class="display-clock-wrap">
      <span class="display-live"><span class="display-live-dot"></span>Live</span>
      <div class="display-clock" id="displayClock">--:--:--</div>
      <div class="display-date" id="displayDate">—</div>
    </div>
  </header>

  <main class="display-main">
    <section class="display-section">
      <h2 class="display-section-title">Bay status</h2>
      <div class="display-bay-grid" id="displayBaysGrid"></div>
    </section>

    <section class="display-section">
      <h2 class="display-section-title">Now waiting</h2>
      <div class="display-wait-list" id="displayWaitList"></div>
    </section>
  </main>

  <footer class="display-footer">Thank you for choosing Shinewise Sparkle Auto Care</footer>
</div>

<script src="{{ asset('js/display.js') }}"></script>
</body>
</html>
