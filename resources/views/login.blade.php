@extends('layouts.guest')

@section('title', 'Welcome Back')
@section('page-id', 'login')



@section('content')
<main class="login-shell">
  <aside class="login-story" aria-label="Shinewise introduction">
    <div class="login-brand">
       <a href="/dashboard">
      <img src="{{ asset('images/landing-logo.png') }}" alt="Shinewise" class="brand-logo-img">
    </a>
    </div>
    <div class="story-content">

      <h1>Run every bay<br><em>without</em> the<br>guesswork<span style="color:#fa0100">.</span></h1>
      <p class="story-copy">Queue tracking, chemical logs, and revenue by bay — the whole wash, watched from one screen.</p>
   <div class="story-features">
        <div class="story-feature">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="1" y="1" width="46" height="46" rx="11" stroke="#fa0100" stroke-opacity=".18"/><path d="M13 34V14h22v20H13Z" stroke="#fa0100" stroke-width="2" stroke-linejoin="round"/><path d="m16 30 5-6 4 3 7-9" stroke="#fa0100" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><div><strong>Real-time Tracking</strong><span>Live updates, always</span></div></div>
        <div class="story-feature">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="1" y="1" width="46" height="46" rx="11" stroke="#fa0100" stroke-opacity=".18"/><path d="M19 13h10M22 13v9l-7 12c-.9 1.5.2 3 2 3h14c1.8 0 2.9-1.5 2-3l-7-12v-9" stroke="#fa0100" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 30h12" stroke="#fa0100" stroke-width="2" stroke-linecap="round"/></svg><div><strong>Chemical Logs</strong><span>Track and analyze</span></div></div>
        <div class="story-feature">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="1" y="1" width="46" height="46" rx="11" stroke="#fa0100" stroke-opacity=".18"/><path d="M24 13v11h11" stroke="#fa0100" stroke-width="2" stroke-linecap="round"/><path d="M24 13a11 11 0 1 0 11 11H24V13Z" stroke="#fa0100" stroke-width="2" stroke-linejoin="round"/></svg><div><strong>Revenue Insights</strong><span>Performance that drives</span></div></div>
      </div>
    </div>
    <div class="story-footer">Designed by <a target="_blank" href="https://infoasis.in/"> <b>ATTechInfoasis</b></a> </div>
  </aside>

  <section class="login-panel">
    <div class="login-card">
      <h2>Welcome Back</h2>
      <p class="lead">Sign in to your account to continue</p>
      <div id="errorAlert" style="display:none; background:#fee2e2; color:#991b1b; padding:12px; margin-bottom:16px; border-radius:7px; font-size:14px; font-weight:500; align-items:center; gap:8px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><span class="msg-text"></span></div>
      <div id="successAlert" style="display:none; background:#dcfce7; color:#166534; padding:12px; margin-bottom:16px; border-radius:7px; font-size:14px; font-weight:500; align-items:center; gap:8px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span class="msg-text"></span></div>
      <form id="loginForm">
        <div class="fieldLogin"><label for="user">Email address</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><input id="user" type="email" placeholder="Enter Your UserName" autocomplete="username" required></div><div class="under"></div></div>
        <div class="fieldLogin"><label for="pass">Password</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="15" r="1" fill="currentColor"/></svg><input id="pass" type="password" placeholder="Enter your password" autocomplete="current-password" required><button type="button" class="password-toggle" id="passToggle" aria-label="Show password" aria-pressed="false"><svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button></div><div class="under"></div></div>
        <div class="row-between"><label class="remember"><input type="checkbox" checked> Keep me signed in</label><a class="forgot" href="#">Forgot password?</a></div>
        <button class="submit" type="submit" id="loginSubmitBtn">SIGN IN <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </form>
      <!-- <p class="signup-line">Don’t have an account? <a href="/sign-up">Sign up</a></p> -->
    </div>
  </section>
</main>
@endsection

@section('scripts')
<script>
  const passInput = document.getElementById('pass'), passToggle = document.getElementById('passToggle');
  passToggle.addEventListener('click', () => { const showing = passInput.type === 'text'; passInput.type = showing ? 'password' : 'text'; passToggle.querySelector('.icon-eye').style.display = showing ? '' : 'none'; passToggle.querySelector('.icon-eye-off').style.display = showing ? 'none' : ''; passToggle.setAttribute('aria-pressed', String(!showing)); passToggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password'); });
  
  const loginSubmitBtn = document.getElementById('loginSubmitBtn'), urlParams = new URLSearchParams(window.location.search);
  const loginForm = document.getElementById('loginForm'), errorAlert = document.getElementById('errorAlert'), successAlert = document.getElementById('successAlert');
  
  loginForm.addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    errorAlert.style.display = successAlert.style.display = 'none'; 
    loginSubmitBtn.disabled = true; 
    const originalText = loginSubmitBtn.innerHTML; 
    loginSubmitBtn.textContent = 'SIGNING IN...'; 
    try { 
      const res = await fetch('/api/login', { 
        method:'POST', 
        headers:{'Content-Type':'application/json','Accept':'application/json'}, 
        body:JSON.stringify({
          email:document.getElementById('user').value,
          password:passInput.value,
          remember:loginForm.querySelector('.remember input').checked
        }) 
      }); 
      const data = await res.json(); 
      if (res.ok) { 
        localStorage.setItem('sw_user_role', 'admin'); 
        successAlert.querySelector('.msg-text').textContent = 'Success! Redirecting…'; 
        successAlert.style.display = 'flex'; 
        setTimeout(() => window.location.href = urlParams.get('redirect') || '/dashboard', 700); 
      } else { 
        errorAlert.querySelector('.msg-text').textContent = data.message || 'Login failed. Please check your credentials.'; 
        errorAlert.style.display = 'flex'; 
        loginSubmitBtn.disabled = false; 
        loginSubmitBtn.innerHTML = originalText; 
      } 
    } catch (err) { 
      errorAlert.querySelector('.msg-text').textContent = 'A connection error occurred. Please try again.'; 
      errorAlert.style.display = 'flex'; 
      loginSubmitBtn.disabled = false; 
      loginSubmitBtn.innerHTML = originalText; 
    } 
  });
</script>
@endsection
