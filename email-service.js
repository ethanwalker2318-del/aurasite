/* ═══════════════════════════════════════════════════════════════
   AURA GLOBAL MERCHANTS LTD. — Email Service v3.0
   ─────────────────────────────────────────────────────────────
   Client-side emails via EmailJS (1 universal template).
   3 Flows: Customers · Linguists · Ambassadors
   Luxury Tech · Sie-Form · Flat Design
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── CONFIG ────────────────────────────────────────── */
var C = {
  PK:   '6E1iefDAtX8goF9mt',
  SVC:  'service_6xbgj7m',
  TPL:  'template_gdaxgeg',
  TPL2: 'template_gdaxgeg',
  FROM_SUPPORT:    'support@auraglobal-merchants.com',
  FROM_ORDERS:     'orders@auraglobal-merchants.com',
  FROM_NOREPLY:    'noreply@auraglobal-merchants.com',
  FROM_HR:         'karriere@auraglobal-merchants.com',
  FROM_MARKETING:  'marketing@auraglobal-merchants.com',
  FROM_NEWSLETTER: 'newsletter@auraglobal-merchants.com',
  FROM_BILLING:    'billing@auraglobal-merchants.com',
  FROM_HELLO:      'hello@auraglobal-merchants.com',
  FROM_INFO:       'info@auraglobal-merchants.com'
};

var COMPANY = 'Aura Global Merchants Ltd.';
var REG_NO  = '15847293';
var ADDR    = '71-75 Shelton Street, London, WC2H 9JQ, United Kingdom';
var YR      = new Date().getFullYear();
var O       = window.location.origin;

/* ── INIT (with retry) ─────────────────────────────── */
var _ok = false, _q = [], _try = 0;

function init(){
  if(_ok) return;
  if(typeof emailjs === 'undefined'){
    if(++_try <= 25){ setTimeout(init, 250); } else { console.error('[AuraEmail] SDK timeout'); }
    return;
  }
  emailjs.init({ publicKey: C.PK });
  _ok = true;
  _q.forEach(function(m){ _send(m.to, m.subj, m.html, m.reply); });
  _q = [];
  console.log('[AuraEmail] Ready');
}

/* ── CORE SEND ─────────────────────────────────────── */
function _send(to, subj, html, reply){
  if(!to){ console.warn('[AuraEmail] SKIP — no recipient'); return; }
  if(!_ok){
    console.log('[AuraEmail] Queued (SDK loading) -> '+to);
    _q.push({to:to,subj:subj,html:html,reply:reply}); init(); return;
  }
  var p = { to_email:to, subject:subj, html_content:html, reply_to:reply||C.FROM_NOREPLY };
  console.log('[AuraEmail] Sending -> '+to+' | TPL: '+C.TPL);
  emailjs.send(C.SVC, C.TPL, p).then(function(r){
    console.log('[AuraEmail] OK -> '+to+' | '+subj, r.status);
    if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('E-Mail gesendet!','success');
  }).catch(function(e1){
    console.warn('[AuraEmail] TPL1 fail, trying fallback...', e1);
    emailjs.send(C.SVC, C.TPL2, p).then(function(r2){
      console.log('[AuraEmail] OK(fb) -> '+to, r2.status);
      if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('E-Mail gesendet!','success');
    }).catch(function(e2){
      console.error('[AuraEmail] FAIL -> '+to, e2);
      if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('E-Mail-Versand fehlgeschlagen','error');
    });
  });
}

/* ══════════════════════════════════════════════════════
   LUXURY HTML TEMPLATE SYSTEM
   Navy #001A3D · Gold #C5A059 · White #FFFFFF
   ══════════════════════════════════════════════════════ */

function H(subtitle){
  return '' +
  '<div style="background:#001A3D;padding:0">' +
    '<div style="max-width:600px;margin:0 auto;padding:40px 32px 30px;text-align:center">' +
      '<div style="display:inline-block;margin-bottom:16px">' +
        '<div style="font-family:Georgia,Times,serif;font-size:28px;font-weight:700;color:#C5A059;letter-spacing:3px">AURA GLOBAL</div>' +
        '<div style="font-family:Arial,sans-serif;font-size:9px;color:rgba(197,160,89,0.5);letter-spacing:5px;margin-top:2px">MERCHANTS LTD.</div>' +
      '</div>' +
      '<div style="width:40px;height:1px;background:#C5A059;margin:0 auto 14px"></div>' +
      (subtitle ? '<div style="font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">'+subtitle+'</div>' : '') +
    '</div>' +
  '</div>';
}

function F(){
  return '' +
  '<div style="background:#f8f8f8;padding:0;border-top:1px solid #eee">' +
    '<div style="max-width:600px;margin:0 auto;padding:28px 32px;text-align:center;font-family:Arial,sans-serif">' +
      '<div style="margin-bottom:16px">' +
        '<a href="'+O+'" style="color:#001A3D;font-size:11px;text-decoration:none;font-weight:600;letter-spacing:1px">AURA GLOBAL MERCHANTS</a>' +
      '</div>' +
      '<div style="font-size:10px;color:#999;line-height:1.8">' +
        COMPANY + '<br>' +
        'Company No. ' + REG_NO + '<br>' +
        ADDR + '<br>' +
        '<a href="'+O+'/impressum.html" style="color:#C5A059;text-decoration:none">Impressum</a>' +
        ' &nbsp;&middot;&nbsp; ' +
        '<a href="'+O+'/privacy.html" style="color:#C5A059;text-decoration:none">Datenschutz</a>' +
        ' &nbsp;&middot;&nbsp; ' +
        '<a href="'+O+'/agb.html" style="color:#C5A059;text-decoration:none">AGB</a>' +
      '</div>' +
      '<div style="margin-top:14px;font-size:9px;color:#bbb">&copy; ' + YR + ' ' + COMPANY + '. Alle Rechte vorbehalten.</div>' +
    '</div>' +
  '</div>';
}

function W(body, headerSub){
  return '' +
  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>' +
  '<body style="margin:0;padding:0;background:#f0f0f0;-webkit-font-smoothing:antialiased">' +
  '<div style="max-width:600px;margin:0 auto;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#333;overflow:hidden;border:1px solid #e5e5e5">' +
    H(headerSub) + body + F() +
  '</div></body></html>';
}

function BTN(text, href){
  return '<div style="text-align:center;margin:32px 0"><a href="'+href+'" style="display:inline-block;background:linear-gradient(135deg,#C5A059,#D4B476);color:#001A3D;padding:16px 40px;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;box-shadow:0 2px 8px rgba(197,160,89,0.3)">'+text+'</a></div>';
}

function BTN2(text, href){
  return '<div style="text-align:center;margin:24px 0"><a href="'+href+'" style="display:inline-block;border:2px solid #001A3D;color:#001A3D;padding:12px 32px;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:2px">'+text+'</a></div>';
}

function CODE(c){
  return '<div style="text-align:center;margin:28px 0">' +
    '<div style="display:inline-block;background:#001A3D;color:#C5A059;font-size:32px;letter-spacing:12px;padding:18px 36px;font-weight:700;font-family:monospace;border-radius:4px;box-shadow:0 4px 16px rgba(0,26,61,0.15)">' + c + '</div>' +
  '</div>';
}

function SEC(t){
  return '<div style="margin:28px 0 16px;padding-bottom:10px;border-bottom:2px solid #C5A059">' +
    '<h3 style="margin:0;font-family:Georgia,Times,serif;font-size:16px;color:#001A3D;font-weight:600">'+t+'</h3></div>';
}

function CARD(html){
  return '<div style="background:#f7f7f7;border:1px solid #eee;border-radius:4px;padding:20px;margin:16px 0">'+html+'</div>';
}

function BADGE(text, bg, fg){
  return '<div style="text-align:center;margin:24px 0"><span style="display:inline-block;background:'+(bg||'#001A3D')+';color:'+(fg||'#fff')+';padding:10px 28px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:2px">'+text+'</span></div>';
}

function B(inner){
  return '<div style="padding:36px 32px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#444">'+inner+'</div>';
}

function DIV(){
  return '<div style="width:40px;height:2px;background:#C5A059;margin:24px auto"></div>';
}

function genCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }


/* ══════════════════════════════════════════════════════
   FLOW 1: CUSTOMERS (Conversion & Trust)
   ══════════════════════════════════════════════════════ */

function sendWelcome(email, name){
  var n = esc(name || email.split('@')[0]);
  var html = W(B(
    '<div style="text-align:center;margin-bottom:28px">' +
      '<div style="font-size:42px;margin-bottom:12px">&#128142;</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:26px;color:#001A3D;margin:0 0 6px;font-weight:700">Willkommen, ' + n + '.</h1>' +
      '<p style="color:#999;font-size:13px;margin:0">Ihr Zugang wurde soeben freigeschaltet.</p>' +
    '</div>' +
    DIV() +
    '<p>Sehr geehrte/r ' + n + ',</p>' +
    '<p>vielen Dank f&uuml;r Ihre Registrierung bei <strong style="color:#001A3D">Aura Global Merchants</strong>. ' +
    'Sie haben nun Zugang zu unserem exklusiven Sortiment verifizierter Markenprodukte zu Direktpreisen.</p>' +
    CARD(
      '<div style="text-align:center">' +
        '<div style="font-size:11px;color:#C5A059;font-weight:700;letter-spacing:2px;margin-bottom:10px">IHR ZUGANG UMFASST</div>' +
        '<table style="width:100%;text-align:left;font-size:13px;color:#555"><tr>' +
          '<td style="padding:8px 12px;border-bottom:1px solid #eee">&#9745; Verifizierte Apple, Dyson, Sony &amp; mehr</td></tr><tr>' +
          '<td style="padding:8px 12px;border-bottom:1px solid #eee">&#9745; Bis zu 40% unter UVP</td></tr><tr>' +
          '<td style="padding:8px 12px;border-bottom:1px solid #eee">&#9745; 24-Punkt Aura Inspection Protocol</td></tr><tr>' +
          '<td style="padding:8px 12px">&#9745; 30 Tage R&uuml;ckgaberecht</td></tr>' +
        '</table>' +
      '</div>'
    ) +
    BTN('JETZT ENTDECKEN &#8594;', O + '/catalog.html') +
    '<p style="color:#999;font-size:12px;text-align:center">Bei Fragen erreichen Sie uns jederzeit unter ' +
    '<a href="mailto:'+C.FROM_SUPPORT+'" style="color:#C5A059">'+C.FROM_SUPPORT+'</a></p>'
  ), 'Willkommen');
  _send(email, 'Willkommen bei Aura Global Merchants, '+name+' \u2014 Ihr Zugang ist aktiv', html, C.FROM_SUPPORT);
}

function sendPrimeWelcome(email){
  var html = W(B(
    '<div style="text-align:center;margin-bottom:28px">' +
      '<div style="width:64px;height:64px;margin:0 auto 16px;border-radius:50%"><span style="font-size:40px">&#128142;</span></div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:24px;color:#C5A059;margin:0 0 6px">Aura Prime Mitglied</h1>' +
      '<p style="color:#999;font-size:12px;margin:0">Exklusiver Zugang best&auml;tigt</p>' +
    '</div>' +
    DIV() +
    '<p>Sie sind nun Teil der <strong style="color:#C5A059">Aura Prime</strong> Community und erhalten ab sofort:</p>' +
    '<table style="width:100%;font-size:13px;color:#555;margin:16px 0"><tr>' +
      '<td style="padding:10px 0;border-bottom:1px solid #f0f0f0">&#10024; Exklusive Vorab-Deals vor allen anderen</td></tr><tr>' +
      '<td style="padding:10px 0;border-bottom:1px solid #f0f0f0">&#128666; Kostenfreier Express-Versand (ab &euro;99)</td></tr><tr>' +
      '<td style="padding:10px 0;border-bottom:1px solid #f0f0f0">&#128276; Early Access zu neuen Produkten</td></tr><tr>' +
      '<td style="padding:10px 0">&#127873; Prime-exklusive Sonderangebote</td></tr>' +
    '</table>' +
    BTN('PRIME DEALS ANSEHEN &#8594;', O + '/catalog.html') +
    '<p style="text-align:center;font-size:11px;color:#bbb">Kein Spam. Jederzeit abmeldbar.</p>'
  ), 'Aura Prime');
  _send(email, '\u{1F48E} Willkommen bei Aura Prime \u2014 Ihr exklusiver Zugang', html, C.FROM_MARKETING);
}

function sendOrderConfirmation(order, email, name){
  var items = (order.items||[]).map(function(it){
    var p = it.product || (typeof Aura!=='undefined' ? Aura.getProductById(it.productId) : null) || {};
    var pr = ((p.price||0) + (it.priceOffset||0));
    return '<tr>' +
      '<td style="padding:12px;border-bottom:1px solid #f0f0f0;font-size:13px">' + esc(p.name||it.productId) + (it.variant?' <span style="color:#999">('+esc(it.variant)+')</span>':'') + '</td>' +
      '<td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;color:#666">' + (it.qty||1) + '</td>' +
      '<td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:600;color:#001A3D">&euro;'+pr.toFixed(2)+'</td></tr>';
  }).join('');
  var a = order.address||{};
  var cn = esc(name || a.name || '');
  var html = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:42px;margin-bottom:8px">&#9989;</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:24px;color:#001A3D;margin:0 0 6px">Bestellung eingegangen</h1>' +
      '<p style="color:#999;font-size:12px;margin:0">Vielen Dank f&uuml;r Ihr Vertrauen, '+cn+'.</p>' +
    '</div>' +
    CARD(
      '<table style="width:100%;font-size:13px;border-collapse:collapse">' +
        '<tr><td style="padding:6px 0;color:#999">Bestellnummer</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#001A3D;font-family:monospace">#'+esc(order.id)+'</td></tr>' +
        '<tr><td style="padding:6px 0;color:#999">Datum</td><td style="padding:6px 0;text-align:right;color:#001A3D">'+new Date(order.date||order.created).toLocaleDateString('de-DE')+'</td></tr>' +
        '<tr><td style="padding:6px 0;color:#999">Status</td><td style="padding:6px 0;text-align:right"><span style="background:#FFF3CD;color:#856404;padding:2px 10px;font-size:11px;font-weight:700;border-radius:2px">WARTEN AUF ZAHLUNG</span></td></tr>' +
      '</table>'
    ) +
    SEC('Bestellte Artikel') +
    '<table style="width:100%;border-collapse:collapse">' +
      '<tr style="background:#f8f8f8"><th style="padding:10px 12px;text-align:left;font-size:11px;color:#999;font-weight:600;letter-spacing:0.5px">ARTIKEL</th>' +
      '<th style="padding:10px 12px;text-align:center;font-size:11px;color:#999;font-weight:600">MENGE</th>' +
      '<th style="padding:10px 12px;text-align:right;font-size:11px;color:#999;font-weight:600">PREIS</th></tr>' +
      items +
      '<tr style="background:#001A3D"><td colspan="2" style="padding:14px 12px;color:#C5A059;font-size:12px;font-weight:700;letter-spacing:1px">GESAMTBETRAG</td>' +
      '<td style="padding:14px 12px;text-align:right;color:#C5A059;font-size:16px;font-weight:700">&euro;'+order.total.toFixed(2)+'</td></tr>' +
    '</table>' +
    SEC('Lieferadresse') +
    '<p style="font-size:13px;line-height:1.8;color:#555">' +
      esc(a.name||'') + '<br>' + esc(a.street||'') + '<br>' + esc(a.zip||'') + ' ' + esc(a.city||'') + '<br>' + esc(a.country||'Deutschland') +
    '</p>' +
    DIV() +
    '<p style="text-align:center;font-size:12px;color:#999">Sie erhalten eine Benachrichtigung, sobald die Zahlung best&auml;tigt und ' +
    'Ihr Artikel in die <strong>Aura Inspection</strong> &uuml;bergeben wurde.</p>' +
    BTN2('BESTELLUNG VERFOLGEN &#8594;', O + '/dashboard.html')
  ), 'Bestellbest\u00e4tigung');
  _send(email, 'Bestellbest\u00e4tigung #'+order.id+' \u2014 Aura Global Merchants', html, C.FROM_ORDERS);
  var aHtml = W(B(
    '<h2 style="font-family:Georgia,Times,serif;font-size:20px;color:#001A3D;margin:0 0 16px">Neue Bestellung</h2>' +
    CARD(
      '<table style="width:100%;font-size:13px"><tr><td style="padding:4px 0;color:#999">ID</td><td style="text-align:right;font-weight:700;font-family:monospace">#'+esc(order.id)+'</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Kunde</td><td style="text-align:right">'+cn+' ('+esc(email)+')</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Betrag</td><td style="text-align:right;font-weight:700;color:#C5A059">&euro;'+order.total.toFixed(2)+'</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Artikel</td><td style="text-align:right">'+(order.items||[]).length+'</td></tr></table>'
    ) +
    '<table style="width:100%;border-collapse:collapse;margin:16px 0">' + items + '</table>' +
    BTN('ADMIN PANEL \u00d6FFNEN &#8594;', O + '/admin-hub.html')
  ), 'Neue Bestellung');
  _send(C.FROM_ORDERS, '\u{1F6D2} Neue Bestellung #'+order.id+' \u2014 \u20AC'+order.total.toFixed(2), aHtml, email);
}

function sendStatusUpdate(order, status){
  var email = order.address && order.address.email;
  if(!email){
    var users = typeof Aura!=='undefined' ? Aura.getUsers() : [];
    var u = users.find(function(x){return x.id===order.userId;});
    if(u) email = u.email;
  }
  if(!email) return;
  var map = {
    'paid':       {de:'Zahlung best\u00e4tigt',         icon:'&#128179;', desc:'Ihre Zahlung wurde erfolgreich verarbeitet. Ihr Artikel wird nun f\u00fcr die Aura Inspection vorbereitet.', color:'#059669'},
    'sourcing':   {de:'Sourcing gestartet',              icon:'&#128270;', desc:'Unser Sourcing-Team hat Ihren Artikel lokalisiert und der Beschaffungsprozess wurde eingeleitet.', color:'#D97706'},
    'inspection': {de:'Aura Inspection l\u00e4uft',      icon:'&#128300;', desc:'Ihr Artikel befindet sich in der 24-Punkt Aura Inspection. Sie erhalten in K\u00fcrze einen pers\u00f6nlichen Video-Bericht.', color:'#7C3AED'},
    'verified':   {de:'Aura Verified \u2713',            icon:'&#9989;',   desc:'Fantastisch! Ihr Artikel hat die vollst\u00e4ndige Aura Inspection bestanden. Sehen Sie sich Ihren pers\u00f6nlichen Video-Bericht an.', color:'#059669'},
    'shipped':    {de:'Versendet',                        icon:'&#128230;', desc:'Ihr Paket hat unser Lager verlassen und ist unterwegs zu Ihnen.', color:'#2563EB'},
    'delivered':  {de:'Zugestellt',                       icon:'&#9989;',   desc:'Ihr Paket wurde erfolgreich zugestellt. Wir hoffen, Sie sind begeistert!', color:'#059669'},
    'cancelled':  {de:'Storniert',                        icon:'&#10060;',  desc:'Ihre Bestellung wurde storniert. Die R\u00fcckerstattung wird innerhalb von 3\u20135 Werktagen verarbeitet.', color:'#DC2626'},
    'returned':   {de:'Retoure eingeleitet',              icon:'&#8617;',   desc:'Ihre Retoure wurde registriert. Bitte senden Sie den Artikel mit dem beigef\u00fcgten Label zur\u00fcck.', color:'#6B7280'}
  };
  var s = map[status] || {de:status, icon:'&#128203;', desc:'Der Status Ihrer Bestellung wurde aktualisiert.', color:'#001A3D'};
  var customerName = esc((order.address&&order.address.name) || '');
  var tracking = '';
  if(order.trackingNumber){
    tracking = CARD(
      '<div style="text-align:center">' +
        '<div style="font-size:10px;color:#999;font-weight:600;letter-spacing:2px;margin-bottom:8px">SENDUNGSVERFOLGUNG</div>' +
        '<a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode='+esc(order.trackingNumber)+'" style="color:#C5A059;font-size:16px;font-weight:700;letter-spacing:1px;text-decoration:none;font-family:monospace">'+esc(order.trackingNumber)+'</a>' +
      '</div>'
    );
  }
  var videoBtn = '';
  if(status === 'verified'){
    videoBtn = BTN('VIDEO-BERICHT ANSEHEN &#9654;', O + '/dashboard.html');
  }
  var reviewBlock = '';
  if(status === 'delivered'){
    reviewBlock = DIV() +
      '<div style="text-align:center;margin-top:16px">' +
        '<p style="font-size:13px;color:#666">Wie zufrieden sind Sie? Teilen Sie Ihre Erfahrung und erhalten Sie einen <strong style="color:#C5A059">&euro;30 Gutschein</strong> f&uuml;r Ihren n&auml;chsten Einkauf.</p>' +
      '</div>' +
      BTN('BEWERTUNG ABGEBEN &#11088;', O + '/product.html?id=' + ((order.items&&order.items[0]) ? (order.items[0].productId||'') : ''));
  }
  var html = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:48px;line-height:1;margin-bottom:12px">'+s.icon+'</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:22px;color:#001A3D;margin:0 0 12px">Bestellung #' + esc(order.id) + '</h1>' +
    '</div>' +
    BADGE(s.de, s.color, '#fff') +
    '<p>Sehr geehrte/r ' + customerName + ',</p>' +
    '<p>'+s.desc+'</p>' +
    tracking +
    videoBtn +
    reviewBlock +
    (!videoBtn && !reviewBlock ? BTN2('BESTELLUNG ANSEHEN &#8594;', O + '/dashboard.html') : '')
  ), 'Status Update');
  _send(email, s.icon.replace(/&#\d+;/g,'') + ' Bestellung #'+order.id+' \u2014 '+s.de, html, C.FROM_ORDERS);
}

function sendContactForm(data){
  var aHtml = W(B(
    '<h2 style="font-family:Georgia,Times,serif;font-size:20px;color:#001A3D;margin:0 0 20px">Kontaktanfrage</h2>' +
    CARD(
      '<table style="width:100%;font-size:13px"><tr><td style="padding:4px 0;color:#999;width:100px">Von</td><td>'+esc(data.name)+' ('+esc(data.email)+')</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Betreff</td><td style="font-weight:600">'+esc(data.subject)+'</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Bestellung</td><td>'+(data.orderNumber?esc(data.orderNumber):'&mdash;')+'</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Referenz</td><td style="font-family:monospace">'+esc(data.refId||'')+'</td></tr></table>'
    ) +
    SEC('Nachricht') +
    '<div style="background:#f7f7f7;padding:20px;border-radius:4px;white-space:pre-wrap;font-size:13px;color:#333;line-height:1.6">'+esc(data.message)+'</div>' +
    '<p style="font-size:11px;color:#999;margin-top:16px">Antworten Sie direkt auf diese E-Mail, um dem Kunden zu antworten.</p>'
  ), 'Kontaktanfrage');
  _send(C.FROM_SUPPORT, '\u{1F4E9} Kontaktanfrage: '+data.subject+' ['+esc(data.refId||'')+']', aHtml, data.email);
  var rHtml = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:36px;margin-bottom:8px">&#128172;</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:22px;color:#001A3D;margin:0">Anfrage erhalten</h1>' +
    '</div>' +
    '<p>Sehr geehrte/r '+esc(data.name)+',</p>' +
    '<p>vielen Dank f&uuml;r Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns schnellstm&ouml;glich bei Ihnen melden.</p>' +
    CARD(
      '<table style="width:100%;font-size:13px"><tr><td style="color:#999;width:100px">Referenz</td><td style="font-family:monospace;font-weight:600">'+esc(data.refId||'')+'</td></tr>' +
      '<tr><td style="color:#999">Antwortzeit</td><td>24&ndash;48 Stunden</td></tr></table>'
    ) +
    '<p style="font-size:13px">Mit freundlichen Gr&uuml;&szlig;en,<br><strong style="color:#001A3D">Aura Global Merchants Support Team</strong></p>'
  ), 'Ihre Anfrage');
  _send(data.email, 'Ihre Anfrage wurde empfangen ['+esc(data.refId||'')+'] \u2014 Aura Global Merchants', rHtml, C.FROM_SUPPORT);
}

function sendNewsletterWelcome(email){
  var subs = JSON.parse(localStorage.getItem('aura_newsletter_subs')||'[]');
  if(!subs.some(function(s){return s.email===email;})){
    subs.push({email:email,date:new Date().toISOString()});
    localStorage.setItem('aura_newsletter_subs',JSON.stringify(subs));
  }
  var html = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:36px;margin-bottom:8px">&#128140;</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:22px;color:#001A3D;margin:0 0 6px">Newsletter aktiviert</h1>' +
      '<p style="color:#999;font-size:12px;margin:0">Sie verpassen ab jetzt nichts mehr.</p>' +
    '</div>' +
    DIV() +
    '<p>Sie erhalten ab sofort unsere exklusiven Updates:</p>' +
    '<table style="width:100%;font-size:13px;color:#555;margin:16px 0"><tr>' +
      '<td style="padding:8px 0;border-bottom:1px solid #f0f0f0">&#127873; Exklusive Angebote &amp; Flash Sales</td></tr><tr>' +
      '<td style="padding:8px 0;border-bottom:1px solid #f0f0f0">&#128225; Neue Produktank&uuml;ndigungen</td></tr><tr>' +
      '<td style="padding:8px 0">&#128161; Insider-Tipps &amp; Trend-Reports</td></tr>' +
    '</table>' +
    BTN('JETZT SHOPPEN &#8594;', O + '/catalog.html') +
    '<p style="text-align:center;font-size:10px;color:#bbb">Jederzeit abmeldbar. <a href="'+O+'/privacy.html" style="color:#C5A059;text-decoration:none">Datenschutz</a></p>'
  ), 'Newsletter');
  _send(email, 'Willkommen im Aura Global Newsletter \u{1F48E}', html, C.FROM_NEWSLETTER);
}

function sendPasswordReset(email){
  var code = genCode();
  localStorage.setItem('aura_reset_code', JSON.stringify({
    code:code, email:email, expires:Date.now()+15*60*1000, type:'reset'
  }));
  var html = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:36px;margin-bottom:8px">&#128273;</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:22px;color:#001A3D;margin:0 0 6px">Passwort zur&uuml;cksetzen</h1>' +
    '</div>' +
    '<p>Sie haben das Zur&uuml;cksetzen Ihres Passworts angefordert. Verwenden Sie den folgenden Code:</p>' +
    CODE(code) +
    '<p style="text-align:center;font-size:12px;color:#999">Dieser Code ist <strong>15 Minuten</strong> g&uuml;ltig.</p>' +
    DIV() +
    '<p style="font-size:12px;color:#999">Falls Sie kein Zur&uuml;cksetzen angefordert haben, k&ouml;nnen Sie diese E-Mail ignorieren. Ihr Konto bleibt sicher.</p>'
  ), 'Sicherheit');
  _send(email, '\u{1F511} Passwort zur\u00fccksetzen \u2014 Code: '+code, html, C.FROM_NOREPLY);
  return code;
}

function verifyResetCode(inputCode){
  var raw = localStorage.getItem('aura_reset_code');
  if(!raw) return {ok:false, error:'Kein Code angefordert'};
  var d = JSON.parse(raw);
  if(Date.now()>d.expires){localStorage.removeItem('aura_reset_code'); return {ok:false,error:'Code abgelaufen'};}
  if(d.code!==inputCode) return {ok:false,error:'Ung\u00fcltiger Code'};
  localStorage.removeItem('aura_reset_code');
  return {ok:true,email:d.email};
}

function sendPasswordChanged(email, name){
  var n = esc(name || email.split('@')[0]);
  var html = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:36px;margin-bottom:8px">&#128274;</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:22px;color:#001A3D;margin:0">Passwort ge&auml;ndert</h1>' +
    '</div>' +
    '<p>Sehr geehrte/r '+n+',</p>' +
    '<p>Ihr Passwort f&uuml;r Aura Global Merchants wurde soeben erfolgreich ge&auml;ndert.</p>' +
    CARD(
      '<div>' +
        '<span style="font-size:24px">&#9888;&#65039;</span>' +
        ' <strong style="color:#856404">Nicht Sie?</strong><br><span style="font-size:12px;color:#666">Falls Sie diese &Auml;nderung nicht vorgenommen haben, kontaktieren Sie uns sofort.</span>' +
      '</div>'
    ) +
    BTN2('SUPPORT KONTAKTIEREN &#8594;', 'mailto:'+C.FROM_SUPPORT)
  ), 'Sicherheit');
  _send(email, '\u{1F512} Ihr Passwort wurde ge\u00e4ndert \u2014 Aura Global Merchants', html, C.FROM_SUPPORT);
}

function sendVerificationCode(email, name){
  var code = genCode();
  localStorage.setItem('aura_verify_code', JSON.stringify({
    code:code, email:email, expires:Date.now()+5*60*1000
  }));
  var n = esc(name || email.split('@')[0]);
  var html = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:36px;margin-bottom:8px">&#128272;</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:22px;color:#001A3D;margin:0 0 6px">Best&auml;tigungscode</h1>' +
    '</div>' +
    '<p>Hallo '+n+', hier ist Ihr Best&auml;tigungscode:</p>' +
    CODE(code) +
    '<p style="text-align:center;font-size:12px;color:#999">G&uuml;ltig f&uuml;r <strong>5 Minuten</strong>. Teilen Sie diesen Code mit niemandem.</p>'
  ), 'Verifizierung');
  _send(email, 'Ihr Best\u00e4tigungscode: '+code+' \u2014 Aura Global Merchants', html, C.FROM_NOREPLY);
  return code;
}

function verifyCode(inputCode){
  var raw = localStorage.getItem('aura_verify_code');
  if(!raw) return {ok:false,error:'Kein Code angefordert'};
  var d = JSON.parse(raw);
  if(Date.now()>d.expires){localStorage.removeItem('aura_verify_code'); return {ok:false,error:'Code abgelaufen. Bitte erneut anfordern.'};}
  if(d.code!==inputCode) return {ok:false,error:'Ung\u00fcltiger Code'};
  localStorage.removeItem('aura_verify_code');
  return {ok:true,email:d.email};
}


/* ══════════════════════════════════════════════════════
   FLOW 2: LINGUISTS & AMBASSADORS (Operations & HR)
   ══════════════════════════════════════════════════════ */

function sendCareerApplication(data){
  var hrHtml = W(B(
    '<h2 style="font-family:Georgia,Times,serif;font-size:20px;color:#001A3D;margin:0 0 20px">Neue Bewerbung</h2>' +
    CARD(
      '<table style="width:100%;font-size:13px"><tr><td style="padding:4px 0;color:#999;width:100px">Bewerber</td><td style="font-weight:600">'+esc(data.firstname)+'</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">E-Mail</td><td><a href="mailto:'+esc(data.email)+'" style="color:#C5A059">'+esc(data.email)+'</a></td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Messenger</td><td>'+(data.messenger?esc(data.messenger):'&mdash;')+'</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Position</td><td style="font-weight:600;color:#001A3D">'+esc(data.position)+'</td></tr>' +
      '<tr><td style="padding:4px 0;color:#999">Referenz</td><td style="font-family:monospace">'+esc(data.refId||'')+'</td></tr></table>'
    ) +
    SEC('Anschreiben') +
    '<div style="background:#f7f7f7;padding:20px;border-radius:4px;white-space:pre-wrap;font-size:13px;line-height:1.6;color:#333">'+ esc(data.message||'\u2014') +'</div>' +
    BTN('IM ADMIN PANEL PR\u00dcFEN &#8594;', O + '/admin-hub.html')
  ), 'HR \u2014 Bewerbung');
  _send(C.FROM_HR, '\u{1F4BC} Bewerbung: '+data.position+' \u2014 '+data.firstname+' ['+esc(data.refId||'')+']', hrHtml, data.email);
  var isLinguist = (data.position||'').toLowerCase().indexOf('koordinator') > -1 || (data.position||'').toLowerCase().indexOf('linguist') > -1;
  var replyHtml = W(B(
    '<div style="text-align:center;margin-bottom:24px">' +
      '<div style="font-size:36px;margin-bottom:8px">'+(isLinguist?'&#128188;':'&#127942;')+'</div>' +
      '<h1 style="font-family:Georgia,Times,serif;font-size:22px;color:#001A3D;margin:0 0 6px">Bewerbung eingegangen</h1>' +
    '</div>' +
    '<p>Sehr geehrte/r '+esc(data.firstname)+',</p>' +
    '<p>vielen Dank f&uuml;r Ihre Bewerbung f&uuml;r die Position <strong style="color:#001A3D">'+esc(data.position)+'</strong> ' +
    'bei Aura Global Merchants.</p>' +
    CARD(
      '<table style="width:100%;font-size:13px"><tr><td style="color:#999;width:100px">Referenz</td><td style="font-family:monospace;font-weight:600">'+esc(data.refId||'')+'</td></tr>' +
      '<tr><td style="color:#999">Status</td><td><span style="background:#EBF5FF;color:#2563EB;padding:2px 10px;font-size:11px;font-weight:700;border-radius:2px">IN PR\u00dcFUNG</span></td></tr>' +
      '<tr><td style="color:#999">N&auml;chster Schritt</td><td>Pr&uuml;fung Ihrer Unterlagen (5\u20137 Werktage)</td></tr></table>'
    ) +
    (isLinguist ?
      '<p style="font-size:13px;color:#555">Nach positiver Pr&uuml;fung erhalten Sie Zugang zu unserem Koordinations-Panel und eine Einladung zum Onboarding-Test.</p>' :
      '<p style="font-size:13px;color:#555">Nach positiver Pr&uuml;fung erhalten Sie Ihr Ambassador Welcome Kit mit allen Details zu Verg&uuml;tung und Arbeitsabl&auml;ufen.</p>'
    ) +
    '<p style="font-size:13px">Mit freundlichen Gr&uuml;&szlig;en,<br><strong style="color:#001A3D">Aura Global Merchants HR Team</strong></p>'
  ), 'Ihre Bewerbung');
  _send(data.email, 'Bewerbung eingegangen \u2014 '+data.position+' ['+esc(data.refId||'')+']', replyHtml, C.FROM_HR);
}


/* ══════════════════════════════════════════════════════
   EXPORT
   ══════════════════════════════════════════════════════ */
window.AuraEmail = {
  CONFIG: C,
  init: init,
  sendWelcome: sendWelcome,
  sendPrimeWelcome: sendPrimeWelcome,
  sendOrderConfirmation: sendOrderConfirmation,
  sendStatusUpdate: sendStatusUpdate,
  sendContactForm: sendContactForm,
  sendNewsletterWelcome: sendNewsletterWelcome,
  sendPasswordReset: sendPasswordReset,
  verifyResetCode: verifyResetCode,
  sendPasswordChanged: sendPasswordChanged,
  sendVerificationCode: sendVerificationCode,
  verifyCode: verifyCode,
  sendCareerApplication: sendCareerApplication
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
