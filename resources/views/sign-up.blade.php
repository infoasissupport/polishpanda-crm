@extends('layouts.guest')

@section('title', 'Create Account')
@section('page-id', 'sign-up')

@section('content')
<main class="login-shell">
  <aside class="login-story" aria-label="Shinewise introduction">
    <div class="login-brand">
       <a href="/dashboard">
      <img src="{{ asset('images/logo.png') }}" alt="Shinewise" class="brand-logo-img">
    </a>
    </div>
    <div class="story-content">

      <h1>Run every bay<br><em>without</em> the<br>guesswork<span style="color:#ff622b">.</span></h1>
      <p class="story-copy">Queue tracking, chemical logs, and revenue by bay — the whole wash, watched from one screen.</p>
      <div class="story-features">
        <div class="story-feature">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="1" y="1" width="46" height="46" rx="11" stroke="#FF741F" stroke-opacity=".18"/><path d="M13 34V14h22v20H13Z" stroke="#FF741F" stroke-width="2" stroke-linejoin="round"/><path d="m16 30 5-6 4 3 7-9" stroke="#FF741F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><div><strong>Real-time Tracking</strong><span>Live updates, always</span></div></div>
        <div class="story-feature">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="1" y="1" width="46" height="46" rx="11" stroke="#FF741F" stroke-opacity=".18"/><path d="M19 13h10M22 13v9l-7 12c-.9 1.5.2 3 2 3h14c1.8 0 2.9-1.5 2-3l-7-12v-9" stroke="#FF741F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 30h12" stroke="#FF741F" stroke-width="2" stroke-linecap="round"/></svg><div><strong>Chemical Logs</strong><span>Track and analyze</span></div></div>
        <div class="story-feature">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="1" y="1" width="46" height="46" rx="11" stroke="#FF741F" stroke-opacity=".18"/><path d="M24 13v11h11" stroke="#FF741F" stroke-width="2" stroke-linecap="round"/><path d="M24 13a11 11 0 1 0 11 11H24V13Z" stroke="#FF741F" stroke-width="2" stroke-linejoin="round"/></svg><div><strong>Revenue Insights</strong><span>Performance that drives</span></div></div>
      </div>
    </div>
    <div class="story-footer">Designed by <a href="https://infoasis.in/"> <b>TechInfoasis</b></a> </div>
  </aside>

  <section class="login-panel">
    <div class="login-card">
      <h2>Tell Us About Yourself</h2>
      <p class="lead">Enter your details to proceed further</p>
      <div id="errorAlert" style="display:none"><span class="msg-text"></span></div>
      <div id="successAlert" style="display:none"><span class="msg-text"></span></div>

      <form id="signupForm">
        <div class="signUpScrollingBottom">
        <div class="fieldLogin"><label for="email">Email address</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><input id="email" type="email" placeholder="Email Address" autocomplete="username" required></div><div class="under"></div></div>

        <div class="fieldRow">
          <div class="fieldLogin"><label for="firstName">First name</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 20c.6-3.3 2.8-5 6.5-5s5.9 1.7 6.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input id="firstName" type="text" placeholder="First Name" autocomplete="given-name" required></div><div class="under"></div></div>
          <div class="fieldLogin"><label for="lastName">Last name</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 20c.6-3.3 2.8-5 6.5-5s5.9 1.7 6.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><input id="lastName" type="text" placeholder="Last Name" autocomplete="family-name" required></div><div class="under"></div></div>
        </div>

        <div id="branchesContainer">
          <div class="fieldLogin branch-field"><label>Branch name</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg><input type="text" class="branch-name-input" placeholder="Branch Name" required></div><div class="under"></div></div>
        </div>
        <button type="button" id="addBranchBtn" class="add-branch-btn"><i class="ti ti-plus"></i>Add another branch</button>

        <div class="fieldLogin"><label for="password">Password</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="15" r="1" fill="currentColor"/></svg><input id="password" type="password" placeholder="Create a password" autocomplete="new-password" required><button type="button" class="password-toggle" data-target="password" aria-label="Show password" aria-pressed="false"><svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button></div><div class="under"></div></div>

        <div class="fieldLogin"><label for="confirmPassword">Confirm password</label><div class="input-wrap">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="15" r="1" fill="currentColor"/></svg><input id="confirmPassword" type="password" placeholder="Re-enter your password" autocomplete="new-password" required><button type="button" class="password-toggle" data-target="confirmPassword" aria-label="Show password" aria-pressed="false"><svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button></div><div class="under"></div></div>
</div>
        <label class="remember"><input type="checkbox" checked> Keep this station signed in</label>

        <button class="submit" type="submit" id="signupSubmitBtn">CREATE ACCOUNT <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </form>
      <p class="signup-line">Already have an account? <a href="/login">Sign in</a></p>
    </div>
  </section>
</main>


@endsection

@section('scripts')
<script>
  function wirePasswordToggle(toggleBtn) {
    const targetId = toggleBtn.dataset.target;
    const input = document.getElementById(targetId);
    toggleBtn.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      toggleBtn.querySelector('.icon-eye').style.display = showing ? '' : 'none';
      toggleBtn.querySelector('.icon-eye-off').style.display = showing ? 'none' : '';
      toggleBtn.setAttribute('aria-pressed', String(!showing));
      toggleBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }
  document.querySelectorAll('.password-toggle').forEach(wirePasswordToggle);

  // dynamic branches input creation
  const addBranchBtn = document.getElementById('addBranchBtn');
  const branchesContainer = document.getElementById('branchesContainer');

  if (addBranchBtn && branchesContainer) {
    addBranchBtn.addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'fieldLogin branch-field has-remove';
      div.innerHTML = `
        <label>Branch name</label>
        <div class="input-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg>
          <input type="text" class="branch-name-input" placeholder="Branch name" required>
          <button type="button" class="remove-branch-btn" title="Remove branch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <div class="under"></div>
      `;

      div.querySelector('.remove-branch-btn').addEventListener('click', () => {
        div.remove();
      });

      branchesContainer.appendChild(div);
    });
  }

  // signup API integration
  const signupForm = document.getElementById('signupForm');
  const errorAlert = document.getElementById('errorAlert');
  const successAlert = document.getElementById('successAlert');
  const submitBtn = document.getElementById('signupSubmitBtn');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';

    const email = document.getElementById('email').value;
    const first_name = document.getElementById('firstName').value;
    const last_name = document.getElementById('lastName').value;
    const password = document.getElementById('password').value;
    const password_confirmation = document.getElementById('confirmPassword').value;

    const branches = [];
    document.querySelectorAll('.branch-name-input').forEach((input) => {
      const val = input.value.trim();
      if (val) {
        branches.push(val);
      }
    });

    if (password !== password_confirmation) {
      errorAlert.querySelector('.msg-text').textContent = 'Passwords do not match.';
      errorAlert.style.display = 'flex';
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.textContent = 'CREATING ACCOUNT...';

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          first_name,
          last_name,
          password,
          password_confirmation,
          branches
        })
      });

      const data = await res.json();

      if (res.ok) {
        successAlert.querySelector('.msg-text').textContent = 'Account created successfully! Redirecting to dashboard…';
        successAlert.style.display = 'flex';
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        errorAlert.querySelector('.msg-text').textContent = data.message || 'Registration failed. Please check the details and try again.';
        errorAlert.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    } catch (err) {
      errorAlert.querySelector('.msg-text').textContent = 'A connection error occurred. Please try again.';
      errorAlert.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
</script>
@endsection
