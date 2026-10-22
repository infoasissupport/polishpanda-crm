<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shinewise — @yield('title', 'Sparkle Auto Care')</title>
<link rel="stylesheet" href="{{ asset('css/icons.css') }}?v={{ filemtime(public_path('css/icons.css')) }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/common.css') }}">
@yield('styles')
</head>
<body data-page="@yield('page-id')">

@yield('content')

<script src="{{ asset('js/common.js') }}"></script>
@yield('scripts')
</body>
</html>
