(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  function setMenu(open) {
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.textContent = open ? 'Close' : 'Menu';
  }
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
  }

  // ---------- menu panels (Services, About)
  var panelBtns = [].slice.call(document.querySelectorAll('[data-panel]'));
  function panelOf(btn) { return document.getElementById(btn.getAttribute('aria-controls')); }
  function closePanels(except) {
    panelBtns.forEach(function (b) {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      panelOf(b).classList.remove('open');
    });
  }
  var wide = window.matchMedia('(hover: hover) and (min-width: 1001px)');
  panelBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      closePanels(b);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      panelOf(b).classList.toggle('open', open);
    });
    b.parentElement.addEventListener('mouseenter', function () { if (wide.matches) closePanels(b); });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-panel')) closePanels(null);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openBtn = panelBtns.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
    closePanels(null);
    if (openBtn) openBtn.focus();
    if (links && links.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  // ---------- hero: Macs move from Jamf Pro to Intune. Only the status shows: Moving, then Migrated.
  var moving = [].slice.call(document.querySelectorAll('.chip.moving[data-move]'));
  var migCount = document.getElementById('migCount');
  var movCount = document.getElementById('movCount');
  var moveMsg = document.getElementById('moveMsg');
  if (moving.length && !reduce) {
    var done = 0, total = parseInt(migCount.textContent, 10) + moving.length;
    moving.sort(function (a, b) { return a.getAttribute('data-move') - b.getAttribute('data-move'); });
    moving.forEach(function (chip, i) {
      setTimeout(function () {
        chip.textContent = 'Migrated';
        chip.className = 'chip ok';
        done++;
        migCount.textContent = String(total - moving.length + done);
        movCount.textContent = String(moving.length - done);
        if (done === moving.length) moveMsg.textContent = 'All ' + total + ' Macs migrated to Microsoft Intune.';
      }, 1800 + i * 1700);
    });
  }

  // ---------- device console: one pending device finishes updating
  var chip = document.getElementById('flipChip');
  if (chip && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      setTimeout(function () {
        chip.textContent = 'Compliant';
        chip.className = 'chip ok';
        document.getElementById('okCount').textContent = '47';
        document.getElementById('attCount').textContent = '1';
      }, 1600);
    }, { threshold: 0.6 });
    io.observe(chip);
  }

  // ---------- demo videos: show the real YouTube thumbnail when one is available
  [].forEach.call(document.querySelectorAll('.video[data-youtube]'), function (v) {
    var id = v.getAttribute('data-youtube');
    var sizes = ['maxresdefault', 'hqdefault'];
    (function tryNext() {
      var size = sizes.shift();
      if (!size) return;
      var img = new Image();
      img.onload = function () {
        if (img.naturalWidth > 200) {
          v.style.backgroundImage = 'url(' + img.src + ')';
          v.classList.add('has-thumb');
        } else { tryNext(); }
      };
      img.onerror = tryNext;
      img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/' + size + '.jpg';
    })();
  });

  // ---------- demo videos: load the player only when someone presses play
  [].forEach.call(document.querySelectorAll('.video'), function (v) {
    var btn = v.querySelector('.video-play');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var yt = v.getAttribute('data-youtube'), src = v.getAttribute('data-src');
      var title = btn.getAttribute('aria-label').replace(/^Play /, '');
      if (yt) {
        var f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(yt) + '?autoplay=1&rel=0';
        f.title = title;
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        f.allowFullscreen = true;
        v.innerHTML = ''; v.appendChild(f);
      } else if (src) {
        var el = document.createElement('video');
        el.src = src; el.controls = true; el.playsInline = true; el.setAttribute('aria-label', title);
        v.innerHTML = ''; v.appendChild(el);
        var pr = el.play(); if (pr && pr.catch) pr.catch(function () {});
      } else {
        var note = v.querySelector('.video-caption .ph');
        if (note) note.textContent = 'The demo video will play here once it is added.';
      }
    });
  });

  // ---------- contact form. On the live site this posts to the form service and emails info@.
  var form = document.getElementById('enquiry');
  if (form) {
    var status = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      status.classList.add('show');
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
        status.classList.add('error');
        status.textContent = 'Add your name and a valid work email, then send again.';
        return;
      }
      status.classList.remove('error');
      var company = (document.getElementById('company') || {}).value || '';
      var phone = (document.getElementById('phone') || {}).value || '';
      var interest = (document.getElementById('interest') || {}).value || '';
      var devices = (document.getElementById('devices') || {}).value || '';
      var msg = (document.getElementById('msg') || {}).value || '';
      var subject = encodeURIComponent('Website Enquiry: ' + interest + (company ? ' (' + company + ')' : ''));
      var body = encodeURIComponent('Name: ' + name + '\nCompany: ' + company + '\nEmail: ' + email + '\nPhone: ' + phone + '\nInterest: ' + interest + '\nDevices: ' + devices + '\n\nMessage:\n' + msg);
      window.location.href = 'mailto:sales@uemtechnologies.com?cc=info@uemtechnologies.com&subject=' + subject + '&body=' + body;
      status.innerHTML = 'Opening your email client to send to <b>sales@uemtechnologies.com</b> &amp; <b>info@uemtechnologies.com</b> — or <a href="https://wa.me/918175052104" target="_blank" rel="noopener noreferrer">chat with us on WhatsApp (+91 81750 52104)</a>.';
    });
  }
})();
