/* Zahnarztpraxis Breul, Entwurf. Kein Tracking, keine externen Dienste. */
(function () {
  'use strict';

  /* Menü am Handy */
  var knopf = document.querySelector('.menue-knopf');
  var menue = document.getElementById('menue');
  if (knopf && menue) {
    knopf.addEventListener('click', function () {
      var offen = menue.classList.toggle('offen');
      knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
      knopf.textContent = offen ? 'Menü schließen' : 'Menü';
    });
  }

  /* Schrift größer (wird gemerkt) */
  var schrift = document.querySelector('.schrift-knopf');
  if (schrift) {
    var html = document.documentElement;
    var setz = function (gross) {
      html.classList.toggle('schrift-gross', gross);
      schrift.setAttribute('aria-pressed', gross ? 'true' : 'false');
      schrift.setAttribute('aria-label', gross ? 'AA: Schrift wieder normal' : 'AA: Schrift größer');
      try { localStorage.setItem('schrift', gross ? 'gross' : 'normal'); } catch (e) {}
    };
    setz(html.classList.contains('schrift-gross'));
    schrift.addEventListener('click', function () { setz(!html.classList.contains('schrift-gross')); });
  }

  /* Status „Heute“: Sprechzeiten der Praxis (Quelle: bisherige Website).
     Urlaub oder Vertretung trägt Leon hier ein, z. B. HINWEIS = {von:'2026-12-24', bis:'2027-01-02', text:'Vom 24.12. bis 2.1. ist die Praxis geschlossen. Vertretung: …'} */
  var ZEITEN = { 1: [['8.30', '12.00'], ['14.30', '18.00']], 2: [['8.30', '12.00'], ['14.30', '19.00']], 3: [['8.30', '12.00']], 4: [['8.30', '12.00'], ['14.30', '19.00']], 5: [['8.30', '12.00']] };
  var HINWEIS = null;
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var box = document.getElementById('status-heute');
  if (box) {
    var jetzt = new Date();
    var tag = jetzt.getDay();
    var min = jetzt.getHours() * 60 + jetzt.getMinutes();
    var zuMin = function (s) { var t = s.split('.'); return parseInt(t[0], 10) * 60 + parseInt(t[1], 10); };
    var heute = ZEITEN[tag] || [];
    var offenJetzt = heute.some(function (b) { return min >= zuMin(b[0]) && min < zuMin(b[1]); });
    var naechster = heute.filter(function (b) { return min < zuMin(b[0]); })[0];
    var text, titel, klasse = '';
    var iso = jetzt.toISOString().slice(0, 10);
    if (HINWEIS && iso >= HINWEIS.von && iso <= HINWEIS.bis) {
      titel = 'Hinweis'; text = HINWEIS.text; klasse = 'hinweis';
    } else if (offenJetzt) {
      var ende = heute.filter(function (b) { return min >= zuMin(b[0]) && min < zuMin(b[1]); })[0][1];
      var rest = heute.filter(function (b) { return zuMin(b[0]) > min; }).map(function (b) { return b[0] + '–' + b[1]; });
      titel = 'Jetzt geöffnet, heute bis ' + ende + ' Uhr';
      text = rest.length ? 'Heute außerdem ' + rest.join(' und ') + ' Uhr.' : 'Danach wieder ' + naechsterTag(tag) + '.';
    } else if (naechster) {
      titel = 'Gerade geschlossen, heute wieder ab ' + naechster[0] + ' Uhr';
      text = TAGE[tag] + ': ' + heute.map(function (b) { return b[0] + '–' + b[1]; }).join(' und ') + ' Uhr.'; klasse = 'zu';
    } else {
      titel = 'Heute geschlossen'; text = 'Wieder geöffnet ' + naechsterTag(tag) + '. Bei Schmerzen außerhalb der Sprechzeiten: Notdienst 01805 98 67 00.'; klasse = 'zu';
    }
    box.className = 'status ' + klasse;
    box.innerHTML = '<span class="status-punkt" aria-hidden="true"></span><p><strong></strong><span></span></p>';
    box.querySelector('strong').textContent = titel;
    box.querySelector('span:last-child').textContent = text;
  }
  function naechsterTag(tag) {
    for (var i = 1; i <= 7; i++) {
      var t = (tag + i) % 7;
      if (ZEITEN[t]) return (i === 1 ? 'morgen' : 'am ' + TAGE[t]) + ' ab ' + ZEITEN[t][0][0] + ' Uhr';
    }
    return '';
  }

  /* Weichen im Kontaktformular */
  document.querySelectorAll('[data-weichen]').forEach(function (form) {
    var radios = form.querySelectorAll('input[name="anliegen"]');
    var zeig = function () {
      var wert = (form.querySelector('input[name="anliegen"]:checked') || {}).value;
      form.querySelectorAll('.weiche').forEach(function (w) {
        var an = w.getAttribute('data-weiche') === wert;
        w.hidden = !an;
        w.querySelectorAll('input,select,textarea').forEach(function (f) { f.disabled = !an; });
      });
    };
    radios.forEach(function (r) { r.addEventListener('change', zeig); });
    var ausHash = function () {
      var hash = location.hash.replace('#', '');
      var vorwahl = form.querySelector('input[name="anliegen"][value="' + hash + '"]');
      if (vorwahl) vorwahl.checked = true;
      zeig();
    };
    window.addEventListener('hashchange', ausHash);
    ausHash();
  });

  /* Kacheln als Knöpfe: wählen eine Option im Formular und scrollen dorthin */
  document.querySelectorAll('[data-waehlt]').forEach(function (knopf) {
    knopf.addEventListener('click', function () {
      var teile = knopf.getAttribute('data-waehlt').split('=');
      var feld = document.querySelector('input[name="' + teile[0] + '"][value="' + teile[1] + '"]');
      if (!feld) return;
      feld.checked = true;
      feld.dispatchEvent(new Event('change', { bubbles: true }));
      var ziel = document.getElementById(knopf.getAttribute('data-ziel')) || feld.closest('form');
      var ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ziel.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(function () { feld.focus({ preventScroll: true }); }, ruhig ? 0 : 450);
    });
  });

  /* Demo-Formulare: verschicken nichts, prüfen nur den Rückweg und zeigen, was in der fertigen Seite passieren würde */
  document.querySelectorAll('form.demo').forEach(function (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fehler = form.querySelector('.fehler');
      var tel = form.querySelector('input[type="tel"]:not(:disabled)');
      var mail = form.querySelector('input[type="email"]:not(:disabled)');
      var ok = (tel && tel.value.trim().length >= 5) || (mail && /\S+@\S+\.\S+/.test(mail.value));
      if (!ok) {
        if (fehler) {
          fehler.textContent = 'Bitte geben Sie eine Telefonnummer oder eine E-Mail-Adresse an, damit die Praxis sich melden kann.';
          fehler.classList.add('sichtbar');
          fehler.setAttribute('tabindex', '-1');
          fehler.focus();
        }
        (tel || mail).setAttribute('aria-invalid', 'true');
        return;
      }
      if (fehler) fehler.classList.remove('sichtbar');
      var best = document.getElementById(form.getAttribute('data-bestaetigung')) || form.nextElementSibling;
      form.hidden = true;
      if (best) {
        best.classList.add('sichtbar');
        var h = best.querySelector('h3') || best;
        h.setAttribute('tabindex', '-1');
        h.focus();
      }
    });
    form.querySelectorAll('input').forEach(function (f) { f.addEventListener('input', function () { f.removeAttribute('aria-invalid'); }); });
  });
})();
