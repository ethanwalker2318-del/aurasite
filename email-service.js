/* ═══════════════════════════════════════════════════════
   AURA GLOBAL MERCHANTS — Email Service Module
   Uses EmailJS (https://www.emailjs.com) for client-side email.
   FREE PLAN: 1 universal template — all HTML built in JS.
   ═══════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── CONFIGURATION ─────────────────────────────────── */
var CONFIG = {
  EMAILJS_PUBLIC_KEY:  '6E1iefDAtX8goF9mt',
  EMAILJS_SERVICE_ID:  'service_6xbgj7m',
  TEMPLATE_ID:         'tmpl_universal',
  TEMPLATE_ID_FALLBACK:'template_s9ftzqi',
  /* Cloudflare Email Routing → Gmail */
  ADMIN_EMAIL:      'info@auraglobal-merchants.com',
  SUPPORT_EMAIL:    'support@auraglobal-merchants.com',
  HR_EMAIL:         'karriere@auraglobal-merchants.com',
  ORDERS_EMAIL:     'orders@auraglobal-merchants.com',
  NOREPLY_EMAIL:    'noreply@auraglobal-merchants.com',
  MARKETING_EMAIL:  'marketing@auraglobal-merchants.com',
  NEWSLETTER_EMAIL: 'newsletter@auraglobal-merchants.com',
  BILLING_EMAIL:    'billing@auraglobal-merchants.com',
  HELLO_EMAIL:      'hello@auraglobal-merchants.com'
};

var COMPANY = 'Aura Global Merchants Ltd.';
var YEAR    = new Date().getFullYear();
var ORIGIN  = window.location.origin;

/* ── INIT ──────────────────────────────────────────── */
var _init  = false;
var _queue = [];
var _initRetries = 0;
var _maxRetries  = 20;

function init(){
  if(_init) return;
  if(typeof emailjs === 'undefined'){
    _initRetries++;
    if(_initRetries <= _maxRetries){
      console.warn('[AuraEmail] EmailJS SDK not loaded yet, retry ' + _initRetries + '/' + _maxRetries);
      setTimeout(init, 300);
    } else {
      console.error('[AuraEmail] EmailJS SDK failed to load after ' + _maxRetries + ' retries');
    }
    return;
  }
  emailjs.init({ publicKey: CONFIG.EMAILJS_PUBLIC_KEY });
  _init = true;
  if(_queue.length){
    console.log('[AuraEmail] Flushing ' + _queue.length + ' queued emails');
    _queue.forEach(function(q){ _send(q.to, q.subject, q.html, q.reply); });
    _queue = [];
  }
  console.log('[AuraEmail] Initialized OK');
}

/* ── CORE SEND (always uses the ONE universal template) ── */
function _send(toEmail, subject, htmlContent, replyTo){
  if(!_init){
    _queue.push({ to: toEmail, subject: subject, html: htmlContent, reply: replyTo });
    init();
    return;
  }
  var params = {
    to_email:     toEmail,
    subject:      subject,
    html_content: htmlContent,
    reply_to:     replyTo || CONFIG.NOREPLY_EMAIL
  };
  emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.TEMPLATE_ID, params)
  .then(function(r){
    console.log('[AuraEmail] Sent → ' + toEmail + ' | ' + subject, r.status);
    if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('Email gesendet ✓','success');
  }).catch(function(e){
    console.warn('[AuraEmail] Template "'+CONFIG.TEMPLATE_ID+'" failed, trying fallback...', e);
    emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.TEMPLATE_ID_FALLBACK, params)
    .then(function(r2){
      console.log('[AuraEmail] Sent via fallback → ' + toEmail, r2.status);
      if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('Email gesendet ✓','success');
    }).catch(function(e2){
      console.error('[AuraEmail] Both templates failed → ' + toEmail, e, e2);
      if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('Email konnte nicht gesendet werden','error');
    });
  });
}

/* ═══════════════════════════════════════════════════════
   HTML BUILDERS
   ═══════════════════════════════════════════════════════ */
function _hdr(t){
  return '<div style="background:#001A3D;padding:30px 20px;text-align:center">' +
    '<h1 style="color:#C5A059;margin:0;font-size:24px;font-family:Arial,sans-serif">' +
    (t || 'AURA GLOBAL MERCHANTS') + '</h1></div>';
}
function _ftr(){
  return '<div style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#999;font-family:Arial,sans-serif">' +
    '&copy; ' + YEAR + ' ' + COMPANY + ' &middot; Company No.&nbsp;15847293</div>';
}
function _wrap(body, title){
  return '<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#333">' +
    _hdr(title) + '<div style="padding:30px;background:#fff">' + body + '</div>' + _ftr() + '</div>';
}
function _btn(text, href){
  return '<div style="text-align:center;margin:30px 0"><a href="' + href +
    '" style="background:#C5A059;color:#fff;padding:14px 30px;text-decoration:none;font-weight:bold;display:inline-block;border-radius:4px">' +
    text + '</a></div>';
}
function _code(c){
  return '<div style="background:#001A3D;color:#C5A059;font-size:36px;letter-spacing:10px;padding:20px;margin:20px auto;' +
    'max-width:250px;font-weight:bold;text-align:center;border-radius:8px">' + c + '</div>';
}

/* ═══════════════════════════════════════════════════════
   EMAIL FUNCTIONS (public API unchanged)
   ═══════════════════════════════════════════════════════ */

/* ── helpers ───────────────────────────────────────── */
function generateCode(){ return Math.floor(100000 + Math.random() * 900000).toString(); }

/* ── VERIFICATION CODE ─────────────────────────────── */
function sendVerificationCode(email, name){
  var code = generateCode();
  localStorage.setItem('aura_verify_code', JSON.stringify({
    code: code, email: email, expires: Date.now() + 5 * 60 * 1000
  }));
  var n = name || email.split('@')[0];
  var html = _wrap(
    '<h2 style="color:#001A3D;text-align:center">Best&auml;tigungscode</h2>' +
    '<p style="text-align:center">Hallo ' + n + ', hier ist Ihr Best&auml;tigungscode:</p>' +
    _code(code) +
    '<p style="color:#999;font-size:13px;text-align:center">Dieser Code ist 5&nbsp;Minuten g&uuml;ltig.</p>' +
    '<p style="color:#999;font-size:13px;text-align:center">Falls Sie diesen Code nicht angefordert haben, ignorieren Sie diese E-Mail.</p>'
  );
  _send(email, 'Ihr Best\u00e4tigungscode: ' + code, html, CONFIG.NOREPLY_EMAIL);
  return code;
}

function verifyCode(inputCode){
  var raw = localStorage.getItem('aura_verify_code');
  if(!raw) return { ok: false, error: 'Kein Code angefordert' };
  var d = JSON.parse(raw);
  if(Date.now() > d.expires){ localStorage.removeItem('aura_verify_code'); return { ok: false, error: 'Code abgelaufen. Bitte erneut anfordern.' }; }
  if(d.code !== inputCode) return { ok: false, error: 'Ung\u00fcltiger Code' };
  localStorage.removeItem('aura_verify_code');
  return { ok: true, email: d.email };
}

/* ── WELCOME ───────────────────────────────────────── */
function sendWelcome(email, name){
  var html = _wrap(
    '<h2 style="color:#001A3D">Willkommen, ' + name + '!</h2>' +
    '<p>Vielen Dank f&uuml;r Ihre Registrierung bei Aura Global Merchants.</p>' +
    '<p>Ihr Konto wurde erfolgreich erstellt. Sie k&ouml;nnen jetzt:</p>' +
    '<ul>' +
    '<li>Exklusive Produkte entdecken</li>' +
    '<li>Bestellungen aufgeben und verfolgen</li>' +
    '<li>Ihre Wunschliste verwalten</li>' +
    '</ul>' +
    _btn('ZUM SHOP &rarr;', ORIGIN + '/catalog.html')
  );
  _send(email, 'Willkommen bei Aura Global Merchants, ' + name + '! \uD83C\uDF89', html, CONFIG.SUPPORT_EMAIL);
}

/* ── ORDER CONFIRMATION ────────────────────────────── */
function sendOrderConfirmation(order, customerEmail, customerName){
  var items = (order.items || []).map(function(it){
    var p = it.product || (typeof Aura !== 'undefined' ? Aura.getProductById(it.productId) : null) || {};
    return '<tr>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' + (p.name || it.productId) + (it.variant ? ' (' + it.variant + ')' : '') + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' + (it.qty || 1) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">&euro;' + ((p.price || 0) + (it.priceOffset || 0)).toFixed(2) + '</td></tr>';
  }).join('');

  var a = order.address || {};
  var html = _wrap(
    '<h2 style="color:#001A3D">Danke f&uuml;r Ihre Bestellung, ' + (customerName || a.name || '') + '!</h2>' +
    '<p><strong>Bestellnummer:</strong> #' + order.id + '<br>' +
    '<strong>Datum:</strong> ' + new Date(order.date).toLocaleDateString('de-DE') + '<br>' +
    '<strong>Gesamtbetrag:</strong> &euro;' + order.total.toFixed(2) + '</p>' +
    '<h3 style="color:#001A3D;border-bottom:2px solid #C5A059;padding-bottom:8px">Bestellte Artikel</h3>' +
    '<table style="width:100%;border-collapse:collapse">' +
    '<tr style="background:#f5f5f5"><th style="padding:10px;text-align:left">Artikel</th>' +
    '<th style="padding:10px;text-align:center">Menge</th>' +
    '<th style="padding:10px;text-align:right">Preis</th></tr>' + items + '</table>' +
    '<h3 style="color:#001A3D;border-bottom:2px solid #C5A059;padding-bottom:8px;margin-top:20px">Lieferadresse</h3>' +
    '<p>' + (a.name || '') + '<br>' + (a.street || '') + '<br>' + (a.zip || '') + ' ' + (a.city || '') + '<br>' + (a.country || 'DE') + '</p>' +
    '<p style="color:#999;font-size:13px;margin-top:20px">Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versendet wird.</p>',
    'BEST&Auml;TIGUNG'
  );
  _send(customerEmail, 'Bestellbest\u00e4tigung #' + order.id + ' \u2014 Aura Global Merchants', html, CONFIG.ORDERS_EMAIL);

  /* Admin notification */
  var adminHtml = _wrap(
    '<p><strong>Bestellung:</strong> #' + order.id + '<br>' +
    '<strong>Kunde:</strong> ' + customerName + ' (' + customerEmail + ')<br>' +
    '<strong>Betrag:</strong> &euro;' + order.total.toFixed(2) + '<br>' +
    '<strong>Artikel:</strong> ' + (order.items || []).length + '</p>' +
    '<table style="width:100%;border-collapse:collapse">' + items + '</table>' +
    _btn('ADMIN PANEL &Ouml;FFNEN &rarr;', ORIGIN + '/admin-hub.html'),
    'NEUE BESTELLUNG'
  );
  _send(CONFIG.ORDERS_EMAIL, '\uD83D\uDED2 Neue Bestellung #' + order.id + ' \u2014 \u20AC' + order.total.toFixed(2), adminHtml, customerEmail);
}

/* ── ORDER STATUS UPDATE ───────────────────────────── */
function sendStatusUpdate(order, newStatus){
  var email = order.address && order.address.email;
  if(!email){
    var users = typeof Aura !== 'undefined' ? Aura.getUsers() : [];
    var u = users.find(function(x){ return x.id === order.userId; });
    if(u) email = u.email;
  }
  if(!email) return;

  var map = {
    'paid':       { de: 'Bezahlt',        icon: '\uD83D\uDCB3' },
    'processing': { de: 'In Bearbeitung', icon: '\u2699\uFE0F' },
    'shipped':    { de: 'Versendet',      icon: '\uD83D\uDCE6' },
    'delivered':  { de: 'Zugestellt',     icon: '\u2705' },
    'cancelled':  { de: 'Storniert',      icon: '\u274C' },
    'returned':   { de: 'Retoure',        icon: '\u21A9\uFE0F' }
  };
  var s = map[newStatus] || { de: newStatus, icon: '\uD83D\uDCCB' };

  var tracking = '';
  if(order.trackingNumber){
    tracking = '<p><strong>Sendungsverfolgung:</strong><br>' +
      '<a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=' +
      order.trackingNumber + '" style="color:#C5A059;font-weight:bold">' + order.trackingNumber + '</a></p>';
  }

  var html = _wrap(
    '<div style="text-align:center">' +
    '<div style="font-size:48px;margin:10px 0">' + s.icon + '</div>' +
    '<h2 style="color:#001A3D">Bestellung #' + order.id + '</h2>' +
    '<p>Hallo ' + (order.address.name || '') + ', der Status Ihrer Bestellung wurde aktualisiert:</p>' +
    '<div style="background:#f0f7ff;border:2px solid #001A3D;padding:15px;margin:20px 0;font-size:18px;font-weight:bold;color:#001A3D">' + s.de + '</div>' +
    tracking +
    _btn('BESTELLUNG ANSEHEN &rarr;', ORIGIN + '/dashboard.html') +
    '</div>',
    'BESTELLSTATUS UPDATE'
  );
  _send(email, s.icon + ' Bestellung #' + order.id + ' \u2014 ' + s.de, html, CONFIG.ORDERS_EMAIL);
}

/* ── CONTACT FORM ──────────────────────────────────── */
function sendContactForm(data){
  /* → admin */
  var adminHtml = _wrap(
    '<p><strong>Von:</strong> ' + data.name + ' (' + data.email + ')<br>' +
    '<strong>Betreff:</strong> ' + data.subject + '<br>' +
    '<strong>Bestellnummer:</strong> ' + (data.orderNumber || '&mdash;') + '<br>' +
    '<strong>Referenz:</strong> ' + (data.refId || '') + '</p>' +
    '<h3 style="color:#001A3D;border-bottom:2px solid #C5A059;padding-bottom:8px">Nachricht:</h3>' +
    '<div style="background:#f5f5f5;padding:20px;white-space:pre-wrap">' + data.message + '</div>' +
    '<p style="margin-top:20px;font-size:13px;color:#999">Antworten Sie direkt auf diese E-Mail, um dem Kunden zu antworten.</p>',
    'KONTAKTANFRAGE'
  );
  _send(CONFIG.SUPPORT_EMAIL, '\uD83D\uDCE9 Kontaktanfrage: ' + data.subject + ' [Ref: ' + (data.refId || '') + ']', adminHtml, data.email);

  /* auto-reply */
  var replyHtml = _wrap(
    '<h2 style="color:#001A3D">Vielen Dank f&uuml;r Ihre Nachricht, ' + data.name + '!</h2>' +
    '<p>Wir haben Ihre Anfrage erhalten und werden uns schnellstm&ouml;glich bei Ihnen melden.</p>' +
    '<p><strong>Referenznummer:</strong> ' + (data.refId || '') + '</p>' +
    '<p>Unser Kundendienst antwortet in der Regel innerhalb von 24&ndash;48&nbsp;Stunden.</p>' +
    '<p>Mit freundlichen Gr&uuml;&szlig;en,<br><strong>Aura Global Merchants Support Team</strong></p>'
  );
  _send(data.email, 'Ihre Anfrage wurde empfangen [' + (data.refId || '') + '] \u2014 Aura Global Merchants', replyHtml, CONFIG.SUPPORT_EMAIL);
}

/* ── CAREER APPLICATION ────────────────────────────── */
function sendCareerApplication(data){
  /* → HR */
  var hrHtml = _wrap(
    '<p><strong>Bewerber:</strong> ' + data.firstname + '<br>' +
    '<strong>E-Mail:</strong> ' + data.email + '<br>' +
    '<strong>Messenger:</strong> ' + (data.messenger || '&mdash;') + '<br>' +
    '<strong>Position:</strong> ' + data.position + '<br>' +
    '<strong>Referenz:</strong> ' + (data.refId || '') + '</p>' +
    '<h3 style="color:#001A3D;border-bottom:2px solid #C5A059;padding-bottom:8px">Anschreiben:</h3>' +
    '<div style="background:#f5f5f5;padding:20px;white-space:pre-wrap">' + (data.message || '&mdash;') + '</div>',
    'NEUE BEWERBUNG'
  );
  _send(CONFIG.HR_EMAIL, '\uD83D\uDCBC Bewerbung: ' + data.position + ' \u2014 ' + data.firstname + ' [' + (data.refId || '') + ']', hrHtml, data.email);

  /* auto-reply */
  var replyHtml = _wrap(
    '<h2 style="color:#001A3D">Vielen Dank f&uuml;r Ihre Bewerbung, ' + data.firstname + '!</h2>' +
    '<p>Wir haben Ihre Bewerbung f&uuml;r die Position <strong>' + data.position + '</strong> erhalten.</p>' +
    '<p><strong>Referenznummer:</strong> ' + (data.refId || '') + '</p>' +
    '<p>Unser HR-Team wird Ihre Unterlagen pr&uuml;fen und sich innerhalb von 5&ndash;7&nbsp;Werktagen bei Ihnen melden.</p>' +
    '<p>Mit freundlichen Gr&uuml;&szlig;en,<br><strong>Aura Global Merchants HR Team</strong></p>'
  );
  _send(data.email, 'Ihre Bewerbung wurde empfangen \u2014 ' + data.position + ' [' + (data.refId || '') + ']', replyHtml, CONFIG.HR_EMAIL);
}

/* ── NEWSLETTER ────────────────────────────────────── */
function sendNewsletterWelcome(email){
  var subs = JSON.parse(localStorage.getItem('aura_newsletter_subs') || '[]');
  if(!subs.some(function(s){ return s.email === email; })){
    subs.push({ email: email, date: new Date().toISOString() });
    localStorage.setItem('aura_newsletter_subs', JSON.stringify(subs));
  }
  var html = _wrap(
    '<div style="text-align:center">' +
    '<h2 style="color:#001A3D">Willkommen im Newsletter!</h2>' +
    '<p>Sie sind jetzt f&uuml;r unseren exklusiven Newsletter angemeldet und erhalten:</p>' +
    '<ul style="text-align:left;display:inline-block">' +
    '<li>Exklusive Angebote und Rabatte</li>' +
    '<li>Neue Produktank&uuml;ndigungen</li>' +
    '<li>Insider-Tipps und Trends</li>' +
    '</ul>' +
    _btn('JETZT SHOPPEN &rarr;', ORIGIN + '/catalog.html') +
    '</div>'
  );
  _send(email, 'Willkommen im Aura Global Newsletter! \uD83D\uDC8E', html, CONFIG.NEWSLETTER_EMAIL);
}

/* ── PASSWORD CHANGED ──────────────────────────────── */
function sendPasswordChanged(email, name){
  var html = _wrap(
    '<h2 style="color:#001A3D">Passwort ge&auml;ndert</h2>' +
    '<p>Hallo ' + (name || '') + ',</p>' +
    '<p>Ihr Passwort wurde soeben erfolgreich ge&auml;ndert.</p>' +
    '<p style="background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:4px">' +
    '<strong>\u26A0\uFE0F Nicht Sie?</strong> Falls Sie diese &Auml;nderung nicht vorgenommen haben, kontaktieren Sie uns sofort unter ' +
    '<a href="mailto:support@auraglobal-merchants.com" style="color:#C5A059">support@auraglobal-merchants.com</a></p>'
  );
  _send(email, '\uD83D\uDD12 Ihr Passwort wurde ge\u00e4ndert \u2014 Aura Global Merchants', html, CONFIG.SUPPORT_EMAIL);
}

/* ── PASSWORD RESET ────────────────────────────────── */
function sendPasswordReset(email){
  var code = generateCode();
  localStorage.setItem('aura_reset_code', JSON.stringify({
    code: code, email: email, expires: Date.now() + 15 * 60 * 1000, type: 'reset'
  }));
  var html = _wrap(
    '<div style="text-align:center">' +
    '<h2 style="color:#001A3D">Passwort zur&uuml;cksetzen</h2>' +
    '<p>Sie haben das Zur&uuml;cksetzen Ihres Passworts angefordert. Verwenden Sie den folgenden Code:</p>' +
    _code(code) +
    '<p style="color:#999;font-size:13px">Dieser Code ist 15&nbsp;Minuten g&uuml;ltig.</p>' +
    '<p style="color:#999;font-size:13px">Falls Sie kein Zur&uuml;cksetzen angefordert haben, ignorieren Sie diese E-Mail.</p>' +
    '</div>'
  );
  _send(email, '\uD83D\uDD11 Passwort zur\u00fccksetzen \u2014 Code: ' + code, html, CONFIG.NOREPLY_EMAIL);
  return code;
}

function verifyResetCode(inputCode){
  var raw = localStorage.getItem('aura_reset_code');
  if(!raw) return { ok: false, error: 'Kein Code angefordert' };
  var d = JSON.parse(raw);
  if(Date.now() > d.expires){ localStorage.removeItem('aura_reset_code'); return { ok: false, error: 'Code abgelaufen' }; }
  if(d.code !== inputCode) return { ok: false, error: 'Ung\u00fcltiger Code' };
  localStorage.removeItem('aura_reset_code');
  return { ok: true, email: d.email };
}

/* ── EXPORT ────────────────────────────────────────── */
window.AuraEmail = {
  CONFIG: CONFIG,
  init: init,
  sendVerificationCode: sendVerificationCode,
  verifyCode: verifyCode,
  sendWelcome: sendWelcome,
  sendOrderConfirmation: sendOrderConfirmation,
  sendStatusUpdate: sendStatusUpdate,
  sendContactForm: sendContactForm,
  sendCareerApplication: sendCareerApplication,
  sendNewsletterWelcome: sendNewsletterWelcome,
  sendPrimeWelcome: sendPrimeWelcome,
  sendPasswordChanged: sendPasswordChanged,
  sendPasswordReset: sendPasswordReset,
  verifyResetCode: verifyResetCode
};

/* Auto-init */
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
