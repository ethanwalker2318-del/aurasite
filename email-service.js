/* ═══════════════════════════════════════════════════════════════
   AURA GLOBAL MERCHANTS LTD. — Transactional Email System v4.1
   ─────────────────────────────────────────────────────────────
   British Business Formal · Sie-Form · Hochdeutsch
   Client-side via EmailJS · Single Universal Template
   RFC 5322 · GDPR/DSGVO · UK Companies Act 2006
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── CONFIG ────────────────────────────────────────── */
var C = { PK:'6E1iefDAtX8goF9mt', SVC:'service_6xbgl7m', TPL:'template_slxey9g' };

/* INBOX — real mailbox for all incoming admin notifications */
var INBOX = 'ethanwalker2318@gmail.com';

/* Display "From" addresses (shown in Reply-To) */
var FM = {
  SUPPORT:   'support@auraglobal-merchants.com',
  ORDERS:    'orders@auraglobal-merchants.com',
  NOREPLY:   'noreply@auraglobal-merchants.com',
  HR:        'karriere@auraglobal-merchants.com',
  MARKETING: 'marketing@auraglobal-merchants.com',
  NEWSLETTER:'newsletter@auraglobal-merchants.com',
  BILLING:   'billing@auraglobal-merchants.com',
  INSPECT:   'inspection@auraglobal-merchants.com',
  LOGISTICS: 'logistics@auraglobal-merchants.com'
};

var LE = {
  NAME:    'Aura Global Merchants Ltd.',
  CRN:     '15847293',
  ADDR:    '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
  COUNTRY: 'United Kingdom',
  JUR:     'England and Wales'
};

var YR = new Date().getFullYear();
var O  = window.location.origin;

/* ── INIT ──────────────────────────────────────────── */
var _ok=false, _q=[], _n=0;
function init(){
  if(_ok) return;
  if(typeof emailjs==='undefined'){
    if(++_n<=30) setTimeout(init,200);
    else console.error('[AuraEmail] EmailJS SDK timeout.');
    return;
  }
  emailjs.init({publicKey:C.PK});
  _ok=true;
  console.log('[AuraEmail] v4.1 Ready. SVC='+C.SVC+' TPL='+C.TPL+' INBOX='+INBOX);
  _q.forEach(function(m){_send(m.to,m.subj,m.html,m.reply);}); _q=[];
}

/* ── CORE SEND ─────────────────────────────────────── */
function _send(to,subj,html,reply){
  if(!to) return;
  if(!_ok){_q.push({to:to,subj:subj,html:html,reply:reply}); init(); return;}
  emailjs.send(C.SVC,C.TPL,{
    to_email:to, subject:subj, html_content:html, reply_to:reply||FM.NOREPLY
  }).then(function(r){
    console.log('[AuraEmail] OK -> '+to+' | '+subj);
    if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('E-Mail gesendet!','success');
  }).catch(function(e){
    console.error('[AuraEmail] Fehler -> '+to,e);
    if(typeof Aura!=='undefined'&&Aura.showToast) Aura.showToast('E-Mail-Versand fehlgeschlagen.','error');
  });
}

/* ── TEST ──────────────────────────────────────────── */
function testEmail(to){
  var a=to||INBOX;
  if(!_ok){if(typeof emailjs!=='undefined'){emailjs.init({publicKey:C.PK});_ok=true;}else{console.error('SDK missing');return;}}
  console.log('=== AuraEmail v4.1 TEST -> '+a+' ===');
  emailjs.send(C.SVC,C.TPL,{
    to_email:a,
    subject:'AuraEmail v4.1 Test — '+new Date().toLocaleTimeString(),
    html_content:'<h2 style="font-family:Georgia,serif;color:#C5A059">Email System v4.1 — Operational</h2><p>Timestamp: '+new Date().toISOString()+'</p>',
    reply_to:FM.NOREPLY
  }).then(function(r){console.log('TEST OK',r.status);}).catch(function(e){console.error('TEST FAIL',e);});
}


/* ══════════════════════════════════════════════════════
   DESIGN SYSTEM — Boutique Luxury
   ──────────────────────────────────────────────────────
   Deep Navy #0B1D33 · Warm Gold #C9A84C · Ivory #FAFAF7
   Charcoal body #2D2D2D · Warm Gray text #4A4A4A
   ══════════════════════════════════════════════════════ */

/* Typography */
var _serif = "Georgia,'Palatino Linotype','Book Antiqua',Palatino,serif";
var _sans  = "'Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
var _mono  = "'SF Mono','Cascadia Code','Fira Code',Consolas,monospace";

/* Colors */
var _navy  = '#0B1D33';
var _gold  = '#C9A84C';
var _goldL = '#D4B76A';
var _ivory = '#FAFAF7';
var _charcoal = '#2D2D2D';
var _warm  = '#4A4A4A';
var _muted = '#8E8E8E';
var _light = '#F2F0EC';

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function genCode(){return Math.floor(100000+Math.random()*900000).toString();}
function fD(d){return new Date(d||Date.now()).toLocaleDateString('de-DE',{day:'2-digit',month:'long',year:'numeric'});}
function fDs(d){return new Date(d||Date.now()).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});}
function fP(n){return(n||0).toFixed(2).replace('.',',');}
function fT(d){return new Date(d||Date.now()).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}

/* Pre-header (inbox preview snippet) */
function PH(t){
  return '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:0;color:#fafaf7;line-height:0">'+esc(t)+'</div>';
}

/* ── HEADER ────────────────────────────────────────── */
function HDR(subtitle,refId){
  return ''+
  '<div style="background:'+_navy+';padding:0">'+
    '<div style="max-width:600px;margin:0 auto;padding:36px 40px 28px">'+
      '<table style="width:100%;border-collapse:collapse"><tr>'+
        /* Logo */
        '<td style="vertical-align:middle">'+
          '<div style="font-family:'+_serif+';font-size:20px;font-weight:700;color:'+_gold+';letter-spacing:4px;line-height:1">AURA GLOBAL</div>'+
          '<div style="font-family:'+_sans+';font-size:7px;color:rgba(201,168,76,0.3);letter-spacing:6px;margin-top:3px;font-weight:400">MERCHANTS LTD.</div>'+
        '</td>'+
        /* Reference & Date */
        (refId?'<td style="vertical-align:middle;text-align:right">'+
          '<div style="font-family:'+_mono+';font-size:11px;color:'+_gold+';font-weight:600;letter-spacing:0.5px">'+esc(refId)+'</div>'+
          '<div style="font-family:'+_sans+';font-size:9px;color:rgba(255,255,255,0.25);margin-top:3px">'+fD()+'</div>'+
        '</td>':'<td></td>')+
      '</tr></table>'+
      /* Subtitle */
      (subtitle?'<div style="margin-top:18px;padding-top:12px;border-top:1px solid rgba(201,168,76,0.08)">'+
        '<div style="font-family:'+_serif+';font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:3px;text-transform:uppercase;font-style:italic">'+subtitle+'</div>'+
      '</div>':'')+
    '</div>'+
  '</div>';
}

/* ── FOOTER — Legal Shield (20%+ of email) ────────── */
function FTR(){
  return ''+
  /* Gold accent line */
  '<div style="height:3px;background:linear-gradient(90deg,'+_gold+','+_goldL+','+_gold+')"></div>'+
  '<div style="background:'+_navy+';padding:0">'+
    '<div style="max-width:600px;margin:0 auto;padding:36px 40px 28px;font-family:'+_sans+'">'+

      /* Logo mark */
      '<div style="text-align:center;margin-bottom:20px">'+
        '<div style="font-family:'+_serif+';font-size:14px;color:'+_gold+';letter-spacing:3px;font-weight:700">AURA GLOBAL</div>'+
        '<div style="font-size:6px;color:rgba(201,168,76,0.25);letter-spacing:5px;margin-top:2px">MERCHANTS LTD.</div>'+
      '</div>'+

      /* Company registration */
      '<div style="text-align:center;font-size:10px;color:rgba(255,255,255,0.35);line-height:2">'+
        'Registered in '+LE.JUR+' &nbsp;&bull;&nbsp; Company No. (CRN): '+LE.CRN+'<br>'+
        'Registered Office: '+LE.ADDR+'<br>'+LE.COUNTRY+
      '</div>'+

      /* Nav links */
      '<div style="text-align:center;margin:18px 0;font-size:10px">'+
        '<a href="'+O+'/impressum.html" style="color:'+_gold+';text-decoration:none;letter-spacing:0.5px">Impressum</a>'+
        ' &nbsp;&nbsp;&bull;&nbsp;&nbsp; '+
        '<a href="'+O+'/privacy.html" style="color:'+_gold+';text-decoration:none;letter-spacing:0.5px">Datenschutz</a>'+
        ' &nbsp;&nbsp;&bull;&nbsp;&nbsp; '+
        '<a href="'+O+'/agb.html" style="color:'+_gold+';text-decoration:none;letter-spacing:0.5px">AGB</a>'+
        ' &nbsp;&nbsp;&bull;&nbsp;&nbsp; '+
        '<a href="'+O+'/contact.html" style="color:'+_gold+';text-decoration:none;letter-spacing:0.5px">Kontakt</a>'+
      '</div>'+

      '<div style="width:60px;height:1px;background:rgba(201,168,76,0.1);margin:20px auto"></div>'+

      /* Confidentiality Notice */
      '<div style="font-size:9px;color:rgba(255,255,255,0.3);line-height:1.8;margin:16px 0;text-align:left">'+
        '<span style="color:rgba(255,255,255,0.45);letter-spacing:1px;text-transform:uppercase;font-size:8px">Confidentiality Notice</span><br>'+
        'This email and any attachments are confidential and intended solely for the named addressee. '+
        'If you have received this message in error, please notify the sender immediately and delete all copies. '+
        'Unauthorised use, disclosure, copying or distribution is strictly prohibited.'+
      '</div>'+

      /* GDPR */
      '<div style="font-size:9px;color:rgba(255,255,255,0.3);line-height:1.8;margin:16px 0;text-align:left">'+
        '<span style="color:rgba(255,255,255,0.45);letter-spacing:1px;text-transform:uppercase;font-size:8px">Datenschutzhinweis (DSGVO / GDPR)</span><br>'+
        'Verarbeitung gem&auml;&szlig; EU-DSGVO und UK Data Protection Act 2018. '+
        'Details: <a href="'+O+'/privacy.html" style="color:'+_gold+';text-decoration:none">Datenschutzerkl&auml;rung</a>.'+
      '</div>'+

      /* Auto-generated */
      '<div style="font-size:9px;color:rgba(255,255,255,0.2);line-height:1.7;margin:20px 0 0;padding:12px 16px;border:1px solid rgba(255,255,255,0.05);border-radius:3px;text-align:center">'+
        'Automatisch generierte Nachricht. Bitte nicht direkt antworten.<br>'+
        'R&uuml;ckfragen: <a href="mailto:'+FM.SUPPORT+'" style="color:'+_gold+';text-decoration:none">'+FM.SUPPORT+'</a>'+
      '</div>'+

      /* Copyright */
      '<div style="text-align:center;font-size:8px;color:rgba(255,255,255,0.15);margin-top:16px">'+
        '&copy; '+YR+' Aura Global Group. All rights reserved.'+
      '</div>'+

    '</div>'+
  '</div>';
}

/* ── WRAPPER ───────────────────────────────────────── */
function W(body,subtitle,refId,preheader){
  return '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">'+
    '<title>'+LE.NAME+'</title></head>'+
    '<body style="margin:0;padding:0;background:'+_charcoal+';-webkit-font-smoothing:antialiased">'+
    (preheader?PH(preheader):'')+
    '<div style="max-width:600px;margin:0 auto;background:'+_ivory+';font-family:'+_sans+';color:'+_warm+';overflow:hidden">'+
      HDR(subtitle,refId)+body+FTR()+
    '</div></body></html>';
}

/* ── COMPONENTS ────────────────────────────────────── */

/* Body padding */
function BD(html){
  return '<div style="padding:40px 40px 36px;font-family:'+_sans+';font-size:14px;line-height:1.85;color:'+_warm+'">'+html+'</div>';
}

/* Primary CTA — Matte Gold with subtle shadow */
function BTN(text,href){
  return '<div style="text-align:center;margin:32px 0">'+
    '<a href="'+href+'" style="display:inline-block;background:'+_gold+';color:'+_navy+';padding:15px 42px;text-decoration:none;font-family:'+_sans+';font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:3px;box-shadow:0 2px 12px rgba(201,168,76,0.25)">'+
    text+'</a></div>';
}

/* Secondary — elegant outline */
function BTN_O(text,href){
  return '<div style="text-align:center;margin:28px 0">'+
    '<a href="'+href+'" style="display:inline-block;border:1.5px solid '+_navy+';color:'+_navy+';padding:13px 36px;text-decoration:none;font-family:'+_sans+';font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:3px">'+
    text+'</a></div>';
}

/* Verification code */
function CODE(c){
  return '<div style="text-align:center;margin:32px 0">'+
    '<div style="display:inline-block;background:'+_navy+';color:'+_gold+';font-size:34px;letter-spacing:14px;padding:20px 40px;font-weight:700;font-family:'+_mono+';border-radius:4px;box-shadow:0 4px 20px rgba(11,29,51,0.15)">'+c+'</div></div>';
}

/* Section heading — elegant serif */
function SEC(t){
  return '<div style="margin:32px 0 14px">'+
    '<div style="font-family:'+_serif+';font-size:13px;color:'+_navy+';font-weight:700;letter-spacing:1px;padding-bottom:10px;border-bottom:1.5px solid '+_gold+'">'+t+'</div></div>';
}

/* Card with gold left accent */
function CARD(html){
  return '<div style="background:#fff;border:1px solid #E8E5DF;border-left:3px solid '+_gold+';border-radius:0 3px 3px 0;padding:20px 22px;margin:18px 0">'+html+'</div>';
}

/* Subtle info card (no accent) */
function CARD_S(html){
  return '<div style="background:'+_light+';border-radius:4px;padding:20px 22px;margin:18px 0">'+html+'</div>';
}

/* Status badge — refined pill */
function BDG(text,bg,fg){
  return '<span style="display:inline-block;background:'+(bg||_navy)+';color:'+(fg||'#fff')+';padding:5px 16px;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;border-radius:3px;font-family:'+_sans+'">'+text+'</span>';
}

/* Gold divider */
function DIV(){
  return '<div style="width:48px;height:2px;background:'+_gold+';margin:28px auto"></div>';
}

/* Key-value table row — warm, readable */
function TR(label,value,opts){
  var o=opts||{};
  return '<tr>'+
    '<td style="padding:7px 0;font-size:12px;color:'+_muted+';vertical-align:top;width:'+(o.w||'150')+'px;font-family:'+_sans+'">'+label+'</td>'+
    '<td style="padding:7px 0;font-size:13px;color:'+_warm+';font-family:'+(o.mono?_mono:_sans)+';'+(o.bold?'font-weight:700;color:'+_navy+';':'')+'">'+value+'</td></tr>';
}

/* Page title block */
function TITLE(h1,sub){
  return '<h1 style="font-family:'+_serif+';font-size:24px;color:'+_navy+';margin:0 0 6px;font-weight:700;line-height:1.3">'+h1+'</h1>'+
    (sub?'<p style="color:'+_muted+';font-size:12px;margin:0 0 24px;font-family:'+_sans+'">'+sub+'</p>':'');
}

/* Greeting */
function GREET(name){
  return '<p style="font-size:14px;line-height:1.8">Sehr geehrte/r '+esc(name)+',</p>';
}

/* Sign-off */
function SIGN(dept){
  return '<p style="font-size:13px;color:'+_warm+';margin-top:28px;line-height:1.6">Mit freundlichen Gr&uuml;&szlig;en,<br>'+
    '<strong style="color:'+_navy+'">'+dept+'</strong><br>'+
    '<span style="font-size:11px;color:'+_muted+'">'+LE.NAME+'</span></p>';
}


/* ══════════════════════════════════════════════════════
   1 · SALES & TRUST — Kundenkorrespondenz
   ══════════════════════════════════════════════════════ */


/* ── 1.1 Kontoregistrierung ───────────────────────── */
function sendWelcome(email,name){
  var n=esc(name||email.split('@')[0]);

  /* → Customer */
  var html=W(BD(
    TITLE('Willkommen bei Aura Global','Ihr Kundenkonto wurde eingerichtet.')+
    DIV()+
    GREET(n)+
    '<p>Ihr Konto ist ab sofort aktiv. Nachfolgend finden Sie Ihre Kontodaten und eine &Uuml;bersicht der verf&uuml;gbaren Leistungen.</p>'+

    SEC('Kontodaten')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('E-Mail-Adresse',esc(email),{mono:true})+
      TR('Registrierung',fD())+
      TR('Kontostatus',BDG('Aktiv','#059669'))+
    '</table>'+

    SEC('Leistungsumfang')+
    CARD_S(
      '<table style="width:100%;font-size:13px;color:'+_warm+'">'+
        '<tr><td style="padding:8px 0;border-bottom:1px solid #E8E5DF">&bull; &nbsp;Vollst&auml;ndiger Katalogzugang — verifizierte Markenware</td></tr>'+
        '<tr><td style="padding:8px 0;border-bottom:1px solid #E8E5DF">&bull; &nbsp;24-Punkt Aura Inspection Protocol pro Artikel</td></tr>'+
        '<tr><td style="padding:8px 0;border-bottom:1px solid #E8E5DF">&bull; &nbsp;14 Tage Widerrufsrecht gem&auml;&szlig; Fernabsatzgesetz</td></tr>'+
        '<tr><td style="padding:8px 0">&bull; &nbsp;Pers&ouml;nlicher Video-Inspektionsbericht</td></tr>'+
      '</table>'
    )+
    BTN('Katalog ansehen &rarr;',O+'/catalog.html')+
    SIGN('Kundendienst')
  ),'Kontoregistrierung',null,
    'Ihr Kundenkonto bei Aura Global ist aktiv.');
  _send(email,'Willkommen bei Aura Global \u2014 Kontozugang best\u00e4tigt',html,FM.SUPPORT);

  /* → Admin (INBOX) */
  var aHtml=W(BD(
    TITLE('Neue Registrierung','Kundenkonto erstellt')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Kunde',n)+
      TR('E-Mail',esc(email),{mono:true})+
      TR('Registriert',fD()+' '+fT())+
    '</table>'
  ),'Admin \u2014 Registrierung');
  _send(INBOX,'Neue Registrierung: '+n+' ('+email+')',aHtml,email);
}


/* ── 1.2 Aura Prime ──────────────────────────────── */
function sendPrimeWelcome(email){
  var html=W(BD(
    TITLE('Aura Prime Mitgliedschaft','Ihr exklusiver Zugang ist freigeschaltet.')+
    DIV()+
    '<p>Ihre Aura Prime Mitgliedschaft ist ab sofort aktiv. Folgende Leistungen sind in Ihrem Konto hinterlegt:</p>'+
    SEC('Prime-Leistungen')+
    CARD_S(
      '<table style="width:100%;font-size:13px;color:'+_warm+'">'+
        '<tr><td style="padding:8px 0;border-bottom:1px solid #E8E5DF"><strong style="color:'+_navy+'">Vorab-Zugang</strong> &mdash; 48 Stunden vor &ouml;ffentlichem Verkaufsstart</td></tr>'+
        '<tr><td style="padding:8px 0;border-bottom:1px solid #E8E5DF"><strong style="color:'+_navy+'">Express-Versand</strong> &mdash; Kostenfrei ab &euro;99 (DHL Express)</td></tr>'+
        '<tr><td style="padding:8px 0;border-bottom:1px solid #E8E5DF"><strong style="color:'+_navy+'">Priority Inspection</strong> &mdash; Bevorzugte Bearbeitung im Aura Hub</td></tr>'+
        '<tr><td style="padding:8px 0"><strong style="color:'+_navy+'">Exklusive Konditionen</strong> &mdash; Sonderpreise auf ausgew&auml;hlte Artikel</td></tr>'+
      '</table>'
    )+
    BTN('Prime-Angebote ansehen &rarr;',O+'/catalog.html')+
    '<p style="font-size:11px;color:'+_muted+';text-align:center">K&uuml;ndigung jederzeit. Keine Mindestlaufzeit.</p>'
  ),'Aura Prime',null,
    'Ihre Aura Prime Mitgliedschaft ist aktiv.');
  _send(email,'Aura Prime Mitgliedschaft best\u00e4tigt \u2014 '+LE.NAME,html,FM.MARKETING);

  /* → Admin */
  _send(INBOX,'Neues Prime-Mitglied: '+email,
    W(BD(TITLE('Neues Prime-Mitglied','')+'<table style="width:100%;border-collapse:collapse">'+TR('E-Mail',esc(email),{mono:true})+TR('Datum',fD()+' '+fT())+'</table>'),'Admin \u2014 Prime'),email);
}


/* ── 1.3 Newsletter ───────────────────────────────── */
function sendNewsletterWelcome(email){
  var subs=JSON.parse(localStorage.getItem('aura_newsletter_subs')||'[]');
  if(!subs.some(function(s){return s.email===email;})){
    subs.push({email:email,date:new Date().toISOString()});
    localStorage.setItem('aura_newsletter_subs',JSON.stringify(subs));
  }

  var html=W(BD(
    TITLE('Newsletter-Anmeldung best\u00e4tigt','Empf\u00e4nger: '+esc(email))+
    DIV()+
    '<p>Ihre E-Mail-Adresse wurde in den Verteiler aufgenommen. Sie erhalten k&uuml;nftig:</p>'+
    CARD_S(
      '<table style="width:100%;font-size:13px;color:'+_warm+'">'+
        '<tr><td style="padding:7px 0;border-bottom:1px solid #E8E5DF">&bull; &nbsp;Produktank&uuml;ndigungen und Verf&uuml;gbarkeitshinweise</td></tr>'+
        '<tr><td style="padding:7px 0;border-bottom:1px solid #E8E5DF">&bull; &nbsp;Preis&auml;nderungen und zeitlich begrenzte Angebote</td></tr>'+
        '<tr><td style="padding:7px 0">&bull; &nbsp;Marktberichte und technische Analysen</td></tr>'+
      '</table>'
    )+
    '<p style="font-size:11px;color:'+_muted+'">Abmeldung jederzeit. Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO. '+
    '<a href="'+O+'/privacy.html" style="color:'+_gold+';text-decoration:none">Datenschutzerkl&auml;rung</a>.</p>'+
    BTN('Katalog ansehen &rarr;',O+'/catalog.html')
  ),'Newsletter',null,
    'Newsletter-Anmeldung best\u00e4tigt.');
  _send(email,'Newsletter-Anmeldung best\u00e4tigt \u2014 '+LE.NAME,html,FM.NEWSLETTER);

  /* → Admin */
  _send(INBOX,'Newsletter-Abo: '+email,
    W(BD(TITLE('Neuer Newsletter-Abonnent','')+
      '<table style="width:100%;border-collapse:collapse">'+TR('E-Mail',esc(email),{mono:true})+TR('Datum',fD()+' '+fT())+'</table>'
    ),'Admin \u2014 Newsletter'),email);
}


/* ══════════════════════════════════════════════════════
   2 · FINANZIELLE DOKUMENTATION
   ══════════════════════════════════════════════════════ */


/* ── 2.1 Bestellbestätigung / Rechnung ────────────── */
function sendOrderConfirmation(order,email,name){
  var a=order.address||{};
  var ba=order.billingAddress||a;
  var cn=esc(name||a.name||'');
  var oid=esc(order.id);
  var subtotal=0;

  var items=(order.items||[]).map(function(it,idx){
    var p=it.product||(typeof Aura!=='undefined'?Aura.getProductById(it.productId):null)||{};
    var price=((p.price||0)+(it.priceOffset||0))*(it.qty||1);
    subtotal+=price;
    var sku=it.sku||p.sku||it.productId||'N/A';
    var sn=it.serialNumber||'Nach Aura Inspection';
    return '<tr>'+
      '<td style="padding:12px 10px;border-bottom:1px solid #E8E5DF;font-size:11px;color:'+_muted+';text-align:center">'+(idx+1)+'</td>'+
      '<td style="padding:12px 10px;border-bottom:1px solid #E8E5DF;font-size:13px">'+
        '<strong style="color:'+_navy+'">'+esc(p.name||it.productId)+'</strong>'+
        (it.variant?'<br><span style="color:'+_muted+';font-size:12px">'+esc(it.variant)+'</span>':'')+
        '<br><span style="font-family:'+_mono+';color:'+_muted+';font-size:10px">SKU: '+esc(sku)+' &nbsp;|&nbsp; S/N (vorl.): '+esc(sn)+'</span>'+
      '</td>'+
      '<td style="padding:12px 10px;border-bottom:1px solid #E8E5DF;text-align:center;font-size:13px">'+(it.qty||1)+'</td>'+
      '<td style="padding:12px 10px;border-bottom:1px solid #E8E5DF;text-align:right;font-size:13px;font-family:'+_mono+';font-weight:700;color:'+_navy+'">&euro;'+fP(price)+'</td>'+
    '</tr>';
  }).join('');

  var shipping=order.shippingCost||0;
  var total=order.total||subtotal+shipping;

  var html=W(BD(
    TITLE('Bestellbest&auml;tigung &amp; Rechnung','Finanzdokument zur Bestellung #'+oid)+
    DIV()+
    GREET(cn)+
    '<p>Nachfolgend die Best&auml;tigung Ihrer Bestellung. Dieses Dokument dient gleichzeitig als Rechnung.</p>'+

    SEC('Bestelldaten')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Bestelldatum',fD(order.date||order.created))+
      TR('Status',BDG('Eingegangen','#D97706','#fff'))+
      TR('Zahlungsstatus',BDG('Ausstehend','#DC2626','#fff'))+
    '</table>'+

    /* Addresses */
    '<table style="width:100%;border-collapse:collapse;margin:24px 0"><tr>'+
      '<td style="width:50%;vertical-align:top;padding-right:16px">'+
        SEC('Rechnungsadresse')+
        '<div style="font-size:13px;line-height:1.7">'+esc(ba.name||cn)+'<br>'+esc(ba.street||'')+'<br>'+esc(ba.zip||'')+' '+esc(ba.city||'')+'<br>'+esc(ba.country||'Deutschland')+'</div>'+
      '</td>'+
      '<td style="width:50%;vertical-align:top;padding-left:16px">'+
        SEC('Lieferadresse')+
        '<div style="font-size:13px;line-height:1.7">'+esc(a.name||cn)+'<br>'+esc(a.street||'')+'<br>'+esc(a.zip||'')+' '+esc(a.city||'')+'<br>'+esc(a.country||'Deutschland')+'</div>'+
      '</td>'+
    '</tr></table>'+

    /* Items */
    SEC('Bestellte Artikel')+
    '<table style="width:100%;border-collapse:collapse">'+
      '<tr style="background:'+_navy+'">'+
        '<th style="padding:11px 10px;text-align:center;font-size:9px;color:'+_gold+';font-weight:600;letter-spacing:1px;width:30px">Nr.</th>'+
        '<th style="padding:11px 10px;text-align:left;font-size:9px;color:'+_gold+';font-weight:600;letter-spacing:1px">Artikel / SKU</th>'+
        '<th style="padding:11px 10px;text-align:center;font-size:9px;color:'+_gold+';font-weight:600;letter-spacing:1px;width:50px">Menge</th>'+
        '<th style="padding:11px 10px;text-align:right;font-size:9px;color:'+_gold+';font-weight:600;letter-spacing:1px;width:80px">Betrag</th>'+
      '</tr>'+
      items+
    '</table>'+

    /* Totals */
    '<table style="width:100%;max-width:280px;margin:6px 0 0 auto;border-collapse:collapse">'+
      '<tr><td style="padding:5px 0;font-size:12px;color:'+_muted+'">Zwischensumme (netto)</td><td style="padding:5px 0;text-align:right;font-size:12px;font-family:'+_mono+'">&euro;'+fP(subtotal)+'</td></tr>'+
      '<tr><td style="padding:5px 0;font-size:12px;color:'+_muted+'">MwSt. (0% \u2014 Ausfuhr UK)</td><td style="padding:5px 0;text-align:right;font-size:12px;font-family:'+_mono+'">&euro;0,00</td></tr>'+
      '<tr><td style="padding:5px 0;font-size:12px;color:'+_muted+'">Versandkosten</td><td style="padding:5px 0;text-align:right;font-size:12px;font-family:'+_mono+'">'+(shipping?'&euro;'+fP(shipping):'inkl.')+'</td></tr>'+
      '<tr style="border-top:2px solid '+_gold+'"><td style="padding:12px 0;font-size:14px;font-weight:700;color:'+_navy+'">Gesamtbetrag</td><td style="padding:12px 0;text-align:right;font-size:18px;font-weight:700;font-family:'+_mono+';color:'+_gold+'">&euro;'+fP(total)+'</td></tr>'+
    '</table>'+

    /* VAT export */
    CARD(
      '<div style="font-family:'+_serif+';font-size:11px;color:'+_muted+';font-weight:700;letter-spacing:0.5px;margin-bottom:8px">Steuerhinweis &mdash; VAT Export Notice</div>'+
      '<div style="font-size:12px;color:'+_warm+';line-height:1.75">'+
        'Ausfuhrlieferung aus dem Vereinigten K&ouml;nigreich. Gem&auml;&szlig; UK Value Added Tax Act 1994 von der britischen Umsatzsteuer befreit (0&nbsp;%). '+
        'Registrierung im HMRC Export Registry best&auml;tigt. Etwaige Einfuhrabgaben im Bestimmungsland gehen zu Lasten des Empf&auml;ngers.'+
      '</div>'
    )+

    /* Widerrufsrecht */
    CARD(
      '<div style="font-family:'+_serif+';font-size:11px;color:'+_muted+';font-weight:700;letter-spacing:0.5px;margin-bottom:8px">Widerrufsbelehrung</div>'+
      '<div style="font-size:12px;color:'+_warm+';line-height:1.75">'+
        'Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gr&uuml;nden diesen Vertrag zu widerrufen (&sect;&nbsp;355 BGB). '+
        'Vollst&auml;ndige Widerrufsbelehrung: <a href="'+O+'/agb.html" style="color:'+_gold+';text-decoration:none;font-weight:600">AGB</a>.'+
      '</div>'
    )+

    SIGN('Auftragsverwaltung')+
    BTN_O('Bestellung verfolgen &rarr;',O+'/dashboard.html')
  ),'Bestellbest\u00e4tigung / Rechnung','#'+oid,
    'Rechnung zu Bestellung #'+oid);

  _send(email,'Bestellbest\u00e4tigung / Rechnung #'+order.id+' \u2014 '+LE.NAME,html,FM.ORDERS);

  /* → Admin (INBOX) */
  var aHtml=W(BD(
    TITLE('Neue Bestellung eingegangen','#'+oid+' \u2014 &euro;'+fP(total))+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Kunde',cn+' ('+esc(email)+')')+
      TR('Artikel',(order.items||[]).length+' Position(en)')+
      TR('Gesamtbetrag','&euro;'+fP(total),{bold:true})+
      TR('Eingang',fD()+' '+fT())+
    '</table>'+
    '<table style="width:100%;border-collapse:collapse;margin:16px 0">'+items+'</table>'+
    BTN('Admin Panel &ouml;ffnen &rarr;',O+'/admin-hub.html')
  ),'Admin \u2014 Neue Bestellung','#'+oid);
  _send(INBOX,'Neue Bestellung #'+order.id+' \u2014 \u20AC'+fP(total)+' \u2014 '+cn,aHtml,email);
}


/* ── 2.2 Zahlungsbestätigung ──────────────────────── */
function sendPaymentConfirmation(order,email,name){
  var cn=esc(name||(order.address&&order.address.name)||'');
  var oid=esc(order.id);
  var txId=esc(order.stripeTransactionId||order.transactionId||'TX-'+Date.now());

  var html=W(BD(
    TITLE('Zahlungsbest&auml;tigung','Transaktion erfolgreich autorisiert')+
    DIV()+
    GREET(cn)+
    '<p>Ihre Zahlung f&uuml;r Bestellung <strong style="color:'+_navy+'">#'+oid+'</strong> wurde erfolgreich verarbeitet und autorisiert.</p>'+
    SEC('Transaktionsdetails')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Transaktions-ID',txId,{mono:true})+
      TR('Betrag','&euro;'+fP(order.total),{bold:true})+
      TR('Zahlungsart',esc(order.paymentMethod||'Kreditkarte / Stripe'))+
      TR('Datum',fD()+', '+fT()+' Uhr')+
      TR('Status',BDG('Autorisiert','#059669'))+
    '</table>'+
    CARD(
      '<div style="font-size:13px;color:'+_warm+';line-height:1.75">'+
        'Ihr Artikel ist reserviert und wird dem n&auml;chsten verf&uuml;gbaren Aura Hub zur 24-Punkt-Inspektion zugewiesen. '+
        'Gesonderte Benachrichtigung folgt bei Inspektionsbeginn.'+
      '</div>'
    )+
    SIGN('Finanzbuchhaltung')+
    BTN_O('Bestellung verfolgen &rarr;',O+'/dashboard.html')
  ),'Zahlungsbest\u00e4tigung','#'+oid,
    'Zahlung f\u00fcr #'+oid+' autorisiert.');
  _send(email,'Zahlungsbest\u00e4tigung #'+order.id+' \u2014 '+LE.NAME,html,FM.BILLING);

  /* → Admin */
  _send(INBOX,'Zahlung eingegangen: #'+order.id+' \u2014 \u20AC'+fP(order.total),
    W(BD(TITLE('Zahlung eingegangen','#'+oid)+
      '<table style="width:100%;border-collapse:collapse">'+TR('TX-ID',txId,{mono:true})+TR('Betrag','&euro;'+fP(order.total),{bold:true})+TR('Kunde',cn+' ('+esc(email)+')')+'</table>'
    ),'Admin \u2014 Zahlung','#'+oid),email);
}


/* ══════════════════════════════════════════════════════
   3 · VERIFIKATION & TRUST
   ══════════════════════════════════════════════════════ */


/* ── 3.1 Inspection gestartet ─────────────────────── */
function sendInspectionStarted(order,email,name){
  var cn=esc(name||(order.address&&order.address.name)||'');
  var oid=esc(order.id);
  var hub=esc(order.hubId||'London-Central / 001');

  var html=W(BD(
    TITLE('Aura Inspection gestartet','24-Punkt-Pr&uuml;fprotokoll eingeleitet')+
    DIV()+
    GREET(cn)+
    '<p>Ihr Ger&auml;t aus Bestellung <strong style="color:'+_navy+'">#'+oid+'</strong> wurde einem technischen Spezialisten &uuml;bergeben. '+
    'Die Pr&uuml;fung nach dem 24-Punkt Aura Inspection Standard hat begonnen.</p>'+

    SEC('Inspektionsdaten')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Hub-ID',hub,{mono:true})+
      TR('Inspektionsbeginn',fD()+', '+fT()+' Uhr')+
      TR('Pr&uuml;fstandard','24-Punkt Aura Inspection Protocol')+
      TR('Status',BDG('In Pr\u00fcfung','#7C3AED'))+
    '</table>'+

    CARD(
      '<div style="font-family:'+_serif+';font-size:11px;color:'+_muted+';font-weight:700;letter-spacing:0.5px;margin-bottom:10px">Pr&uuml;fumfang (12 Kernpunkte)</div>'+
      '<div style="font-size:12px;color:'+_warm+';line-height:2">'+
        'Display Integrity &nbsp;&bull;&nbsp; Touch-Responsivit&auml;t &nbsp;&bull;&nbsp; Akkuzustand &nbsp;&bull;&nbsp; Logic Board &nbsp;&bull;&nbsp; '+
        'Kamera Front/Rear &nbsp;&bull;&nbsp; Lautsprecher &amp; Mikrofon &nbsp;&bull;&nbsp; WiFi/BT/NFC &nbsp;&bull;&nbsp; '+
        'Biometrie &nbsp;&bull;&nbsp; Ladeanschluss &nbsp;&bull;&nbsp; Wasserschaden &nbsp;&bull;&nbsp; Kosmetik &nbsp;&bull;&nbsp; IMEI/S/N'+
      '</div>'
    )+

    '<p style="font-size:12px;color:'+_muted+'">Nach Abschluss erhalten Sie einen pers&ouml;nlichen Video-Inspektionsbericht (Aura Verified&trade;).</p>'+
    SIGN('Aura Inspection Team')+
    BTN_O('Bestellung verfolgen &rarr;',O+'/dashboard.html')
  ),'Aura Inspection','#'+oid,
    'Inspection f\u00fcr #'+oid+' gestartet.');
  _send(email,'Aura Inspection gestartet \u2014 Bestellung #'+order.id,html,FM.INSPECT);
}


/* ── 3.2 Aura Verified™ ──────────────────────────── */
function sendAuraVerified(order,email,name,ins){
  var cn=esc(name||(order.address&&order.address.name)||'');
  var oid=esc(order.id);
  var i=ins||{};
  var cl=i.checklist||{};
  var inspName=esc(i.inspectorName||'Aura Technical Team');
  var inspId=esc(i.inspectorId||'INS-0000');
  var hubId=esc(i.hubId||'London-Central / 001');
  var sn=esc(i.serialNumber||'Siehe Bericht');
  var grade=esc(i.grade||'Aura Premium');
  var videoUrl=i.videoUrl||O+'/dashboard.html';
  var reportId='AV-'+YR+'-'+oid.replace('#','');

  var checks=[
    {nr:'01',name:'Display Integrity',key:'display'},
    {nr:'02',name:'Touch-Responsivit&auml;t',key:'touch'},
    {nr:'03',name:'Akkuzustand (Battery Health)',key:'battery'},
    {nr:'04',name:'Logic Board Diagnostik',key:'logicBoard'},
    {nr:'05',name:'Kamera \u2014 Front',key:'cameraFront'},
    {nr:'06',name:'Kamera \u2014 Rear / Teleobjektiv',key:'cameraRear'},
    {nr:'07',name:'Lautsprecher &amp; Mikrofon',key:'speakers'},
    {nr:'08',name:'Konnektivit&auml;t (WiFi/BT/NFC)',key:'connectivity'},
    {nr:'09',name:'Biometrie (Face ID / Touch ID)',key:'biometrics'},
    {nr:'10',name:'Ladeanschluss &amp; Wireless Charging',key:'charging'},
    {nr:'11',name:'Wasserschaden-Indikatoren',key:'waterDamage'},
    {nr:'12',name:'Kosmetischer Zustand',key:'cosmetic'}
  ];
  var checkRows=checks.map(function(c){
    var v=cl[c.key]||'BESTANDEN';
    var clr=(v==='KEINE'||v.indexOf('PASS')>-1||v.indexOf('BESTANDEN')>-1||v.indexOf('Grade')>-1)?'#059669':_gold;
    return '<tr>'+
      '<td style="padding:8px 10px;border-bottom:1px solid #E8E5DF;font-size:11px;color:'+_muted+';text-align:center;font-family:'+_mono+'">'+c.nr+'</td>'+
      '<td style="padding:8px 10px;border-bottom:1px solid #E8E5DF;font-size:13px;color:'+_warm+'">'+c.name+'</td>'+
      '<td style="padding:8px 10px;border-bottom:1px solid #E8E5DF;text-align:center;font-size:10px;color:'+clr+';font-weight:700;letter-spacing:0.5px">'+esc(v)+'</td>'+
    '</tr>';
  }).join('');

  var html=W(BD(
    TITLE('Aura Verified&trade; \u2014 Inspektionsbericht','Technischer Audit abgeschlossen. Ger&auml;t verifiziert.')+
    DIV()+
    GREET(cn)+
    '<p>Der technische Audit f&uuml;r Ihr Ger&auml;t ist abgeschlossen. '+
    'Seriennummer <strong style="font-family:'+_mono+'">'+sn+'</strong> best&auml;tigt. '+
    'Kategorie: <strong style="color:'+_gold+'">'+grade+'</strong>.</p>'+

    SEC('Inspektionsdaten')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Pr&uuml;fbericht-Nr.',reportId,{mono:true,bold:true})+
      TR('Seriennummer',sn,{mono:true})+
      TR('Ger&auml;tekategorie',BDG(grade,'#059669'))+
      TR('Inspector',inspName+' ('+inspId+')')+
      TR('Hub-ID',hubId,{mono:true})+
      TR('Pr&uuml;fdatum',fD())+
    '</table>'+

    SEC('12-Punkt-Pr&uuml;fprotokoll')+
    '<table style="width:100%;border-collapse:collapse">'+
      '<tr style="background:'+_navy+'">'+
        '<th style="padding:10px;text-align:center;font-size:9px;color:'+_gold+';letter-spacing:1px;width:36px">Nr.</th>'+
        '<th style="padding:10px;text-align:left;font-size:9px;color:'+_gold+';letter-spacing:1px">Pr&uuml;fpunkt</th>'+
        '<th style="padding:10px;text-align:center;font-size:9px;color:'+_gold+';letter-spacing:1px;width:100px">Ergebnis</th>'+
      '</tr>'+
      checkRows+
      '<tr style="background:'+_navy+'">'+
        '<td colspan="2" style="padding:12px 10px;font-size:10px;color:'+_gold+';font-weight:700;letter-spacing:1px">Gesamtergebnis</td>'+
        '<td style="padding:12px 10px;text-align:center;font-size:10px;color:#059669;font-weight:700;letter-spacing:1px">VERIFIED &#10003;</td>'+
      '</tr>'+
    '</table>'+

    BTN('Inspektionsvideo ansehen &#9654;',videoUrl)+

    CARD(
      '<div style="font-size:12px;color:'+_warm+';line-height:1.75">'+
        '<strong style="color:'+_navy+'">Digitale Signatur:</strong> '+inspName+' &nbsp;|&nbsp; ID: '+inspId+'<br>'+
        '<strong style="color:'+_navy+'">Hub:</strong> '+hubId+' &nbsp;|&nbsp; Bericht: '+reportId+
      '</div>'
    )+
    SIGN('Aura Inspection Team')
  ),'Aura Verified\u2122','#'+oid,
    'Aura Verified\u2122 \u2014 Bericht verf\u00fcgbar.');
  _send(email,'Aura Verified\u2122 \u2014 Inspektionsbericht #'+order.id,html,FM.INSPECT);
}


/* ══════════════════════════════════════════════════════
   4 · VERSAND & LOGISTIK
   ══════════════════════════════════════════════════════ */


/* ── 4.1 Versandbestätigung ───────────────────────── */
function sendShippingConfirmation(order,email,name,ship){
  var cn=esc(name||(order.address&&order.address.name)||'');
  var oid=esc(order.id);
  var s=ship||{};
  var carrier=esc(s.carrier||'DHL Express');
  var trackNum=esc(s.trackingNumber||order.trackingNumber||'');
  var trackUrl=s.trackingUrl||('https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode='+trackNum);
  var intUrl=s.internalTrackingUrl||O+'/dashboard.html';
  var eta=s.estimatedDelivery?fD(s.estimatedDelivery):'3\u20135 Werktage';
  var weight=esc(s.weight||'wird ermittelt');
  var dims=esc(s.dimensions||'wird ermittelt');
  var packType=esc(s.packagingType||'Secure Seal');
  var insProvider=esc(s.insuranceProvider||"Lloyd's of London");
  var insValue=esc(s.insuranceValue||'Gem\u00e4\u00df Warenwert');

  var html=W(BD(
    TITLE('Versandbest&auml;tigung','Ihr Paket ist unterwegs.')+
    DIV()+
    GREET(cn)+
    '<p>Bestellung <strong style="color:'+_navy+'">#'+oid+'</strong> hat unser Lager verlassen.</p>'+

    SEC('Sendungsdaten')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Versanddienstleister',carrier)+
      TR('Sendungsnummer','<a href="'+trackUrl+'" style="color:'+_gold+';text-decoration:none;font-family:'+_mono+';font-weight:700">'+trackNum+'</a>')+
      TR('Voraussichtl. Zustellung',eta)+
      TR('Status',BDG('Versendet','#2563EB'))+
    '</table>'+

    SEC('Paketdetails')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Gewicht',weight)+
      TR('Abmessungen',dims)+
      TR('Verpackungstyp',packType)+
      TR('Transportversicherung',insProvider)+
      TR('Versicherungswert',insValue)+
    '</table>'+

    BTN('Sendungsverfolgung &rarr;',intUrl)+
    '<div style="text-align:center;margin-top:-20px;margin-bottom:24px">'+
      '<a href="'+trackUrl+'" style="font-size:11px;color:'+_muted+';text-decoration:none">Alternativ: Direkt bei '+carrier+' verfolgen &rarr;</a>'+
    '</div>'+

    CARD(
      '<div style="font-family:'+_serif+';font-size:11px;color:'+_muted+';font-weight:700;letter-spacing:0.5px;margin-bottom:8px">Annahmehinweis</div>'+
      '<div style="font-size:12px;color:'+_warm+';line-height:1.75">'+
        'Pr&uuml;fen Sie bei Annahme die Unversehrtheit der Sicherheitspflomben und Verpackung. '+
        'Besch&auml;digungen vor dem &Ouml;ffnen fotografisch dokumentieren und innerhalb von 24&nbsp;Stunden an '+
        '<a href="mailto:'+FM.SUPPORT+'" style="color:'+_gold+';text-decoration:none">'+FM.SUPPORT+'</a> melden. '+
        'Originalverpackung f&uuml;r etwaige R&uuml;cksendung aufbewahren.'+
      '</div>'
    )+
    SIGN('Logistikabteilung')
  ),'Versand &amp; Logistik','#'+oid,
    '#'+oid+' versendet \u2014 Sendungsnr. '+trackNum);
  _send(email,'Versandbest\u00e4tigung #'+order.id+' \u2014 '+trackNum,html,FM.LOGISTICS);
}


/* ── 4.2 Status-Update (generic) ──────────────────── */
function sendStatusUpdate(order,status){
  var email=order.address&&order.address.email;
  if(!email){var users=typeof Aura!=='undefined'?Aura.getUsers():[];var u=users.find(function(x){return x.id===order.userId;});if(u)email=u.email;}
  if(!email) return;
  var cn=esc((order.address&&order.address.name)||'');
  var oid=esc(order.id);

  var map={
    'paid':       {de:'Zahlung best\u00e4tigt',   color:'#059669',desc:'Zahlung verarbeitet. Artikel reserviert. Zuweisung an Aura Hub erfolgt.'},
    'sourcing':   {de:'Sourcing eingeleitet',      color:'#D97706',desc:'Artikel lokalisiert. Beschaffungsprozess eingeleitet.'},
    'inspection': {de:'Inspection gestartet',      color:'#7C3AED',desc:'Ger\u00e4t dem technischen Spezialisten \u00fcbergeben. 24-Punkt-Pr\u00fcfung l\u00e4uft.'},
    'verified':   {de:'Aura Verified',             color:'#059669',desc:'Technischer Audit abgeschlossen. Ger\u00e4t hat das Pr\u00fcfprotokoll bestanden.'},
    'shipped':    {de:'Versendet',                 color:'#2563EB',desc:'Paket hat das Lager verlassen.'},
    'delivered':  {de:'Zugestellt',                color:'#059669',desc:'Paket zugestellt. Sicherheitspflomben bei Annahme pr\u00fcfen.'},
    'cancelled':  {de:'Storniert',                 color:'#DC2626',desc:'Bestellung storniert. R\u00fcckerstattung innerhalb von 3\u20135 Werktagen.'},
    'returned':   {de:'Retoure registriert',       color:'#6B7280',desc:'Retoure erfasst. Artikel in Originalverpackung zur\u00fccksenden.'}
  };
  var s=map[status]||{de:status,color:_navy,desc:'Status aktualisiert.'};

  var tracking='';
  if(order.trackingNumber&&(status==='shipped'||status==='delivered')){
    tracking=SEC('Sendungsverfolgung')+
      '<table style="width:100%;border-collapse:collapse">'+
      TR('Sendungsnummer','<a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode='+esc(order.trackingNumber)+'" style="color:'+_gold+';text-decoration:none;font-family:'+_mono+';font-weight:700">'+esc(order.trackingNumber)+'</a>')+'</table>';
  }

  var html=W(BD(
    TITLE('Status-Aktualisierung','Bestellung #'+oid)+
    DIV()+
    GREET(cn)+
    '<div style="text-align:center;margin:24px 0">'+BDG(s.de,s.color)+'</div>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Neuer Status',s.de)+
      TR('Aktualisiert',fD()+', '+fT()+' Uhr')+
    '</table>'+
    CARD('<div style="font-size:13px;color:'+_warm+';line-height:1.75">'+s.desc+'</div>')+
    tracking+
    SIGN('Auftragsverwaltung')+
    BTN_O('Bestellung ansehen &rarr;',O+'/dashboard.html')
  ),'Status-Update','#'+oid,
    '#'+oid+' \u2014 '+s.de);
  _send(email,'Bestellung #'+order.id+' \u2014 '+s.de,html,FM.ORDERS);
}


/* ══════════════════════════════════════════════════════
   INBOX — Cloud (Firebase) + localStorage fallback
   ══════════════════════════════════════════════════════
   ↓↓↓ FIREBASE REALTIME DATABASE URL ↓↓↓
   1. https://console.firebase.google.com → Create project
   2. Realtime Database → Create Database → Test mode
   3. Copy URL and paste below (without trailing slash)        */
var FB_DB='';
var INBOX_KEY='aura_inbox';

function _storeMsg(msg){
  msg.id=msg.id||('MSG-'+Date.now().toString(36).toUpperCase());
  msg.date=msg.date||new Date().toISOString();
  msg.status=msg.status||'new';
  msg.replies=msg.replies||[];
  if(FB_DB){
    fetch(FB_DB+'/inbox/'+msg.id+'.json',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(msg)
    }).catch(function(e){console.warn('[AuraInbox] store error:',e);});
  }else{
    var inbox=JSON.parse(localStorage.getItem(INBOX_KEY)||'[]');
    inbox.unshift(msg);
    localStorage.setItem(INBOX_KEY,JSON.stringify(inbox));
  }
  return msg;
}

function getInbox(){
  if(FB_DB){
    return fetch(FB_DB+'/inbox.json')
      .then(function(r){return r.json();})
      .then(function(data){
        if(!data) return [];
        return Object.keys(data).map(function(k){return data[k];})
          .sort(function(a,b){return new Date(b.date)-new Date(a.date);});
      })
      .catch(function(e){console.warn('[AuraInbox] fetch error:',e);return [];});
  }
  return Promise.resolve(JSON.parse(localStorage.getItem(INBOX_KEY)||'[]'));
}

function getInboxMsg(id){
  if(FB_DB){
    return fetch(FB_DB+'/inbox/'+id+'.json')
      .then(function(r){return r.json();})
      .catch(function(e){console.warn('[AuraInbox] get error:',e);return null;});
  }
  var inbox=JSON.parse(localStorage.getItem(INBOX_KEY)||'[]');
  return Promise.resolve(inbox.find(function(m){return m.id===id;})||null);
}

function updateInboxMsg(id,updates){
  if(FB_DB){
    return fetch(FB_DB+'/inbox/'+id+'.json',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(updates)
    }).catch(function(e){console.warn('[AuraInbox] update error:',e);});
  }
  var inbox=JSON.parse(localStorage.getItem(INBOX_KEY)||'[]');
  for(var i=0;i<inbox.length;i++){
    if(inbox[i].id===id){for(var k in updates)inbox[i][k]=updates[k];break;}
  }
  localStorage.setItem(INBOX_KEY,JSON.stringify(inbox));
  return Promise.resolve();
}

function deleteInboxMsg(id){
  if(FB_DB){
    return fetch(FB_DB+'/inbox/'+id+'.json',{method:'DELETE'})
      .catch(function(e){console.warn('[AuraInbox] delete error:',e);});
  }
  var inbox=JSON.parse(localStorage.getItem(INBOX_KEY)||'[]')
    .filter(function(m){return m.id!==id;});
  localStorage.setItem(INBOX_KEY,JSON.stringify(inbox));
  return Promise.resolve();
}

/* ── Admin Reply — sends professional email from corporate address ── */
function sendReply(msgId,replyText,fromAlias){
  return getInboxMsg(msgId).then(function(msg){
    if(!msg) return;
    var from=fromAlias||FM.SUPPORT;
    var dept='Kundendienst';
    if(msg.type==='career'){from=FM.HR;dept='Personalabteilung';}
    else if(msg.type==='order'){from=FM.ORDERS;dept='Auftragsverwaltung';}

    var replyHtml=W(BD(
      TITLE('Antwort auf Ihre Anfrage','Referenz: '+esc(msg.refId||msg.id))+
      DIV()+
      GREET(msg.senderName||msg.email)+
      '<div style="white-space:pre-wrap;font-size:14px;color:'+_warm+';line-height:1.85">'+esc(replyText)+'</div>'+
      SIGN(dept)+
      SEC('Ihre urspr\u00fcngliche Nachricht')+
      '<div style="background:'+_light+';padding:16px;border-radius:4px;font-size:12px;color:'+_muted+';line-height:1.7;white-space:pre-wrap">'+esc(msg.message||'')+'</div>'
    ),'Antwort \u2014 '+esc(msg.refId||msg.id),msg.refId||msg.id,
      'Antwort auf Ihre Anfrage ['+esc(msg.refId||msg.id)+']');

    _send(msg.email,'Re: '+(msg.subject||msg.position||'Ihre Anfrage')+' ['+esc(msg.refId||msg.id)+'] \u2014 '+LE.NAME,replyHtml,from);

    var replies=(msg.replies||[]);
    replies.push({text:replyText,from:from,date:new Date().toISOString()});
    return updateInboxMsg(msgId,{replies:replies,status:'replied'});
  });
}


/* ══════════════════════════════════════════════════════
   5 · KUNDENKOMMUNIKATION
   ══════════════════════════════════════════════════════ */

function sendContactForm(data){
  var refId=data.refId||'KA-'+Date.now().toString(36).toUpperCase();

  /* Store in local inbox */
  _storeMsg({
    type:'contact',
    refId:refId,
    senderName:data.name,
    email:data.email,
    subject:data.subject,
    message:data.message,
    orderNumber:data.orderNumber||null
  });

  /* → Admin (INBOX) — incoming customer request */
  var aHtml=W(BD(
    TITLE('Kontaktanfrage eingegangen','Von: '+esc(data.name))+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Absender',esc(data.name)+' &lt;'+esc(data.email)+'&gt;')+
      TR('Betreff',esc(data.subject),{bold:true})+
      TR('Bestellnr.',data.orderNumber?esc(data.orderNumber):'&mdash;')+
      TR('Referenz',refId,{mono:true})+
      TR('Eingang',fD()+', '+fT()+' Uhr')+
    '</table>'+
    SEC('Nachricht')+
    '<div style="background:#fff;padding:18px;border-radius:3px;white-space:pre-wrap;font-size:13px;color:'+_warm+';line-height:1.8;border-left:3px solid '+_gold+'">'+esc(data.message)+'</div>'+
    '<p style="font-size:12px;color:'+_muted+';margin-top:16px">Antwort direkt an: <a href="mailto:'+esc(data.email)+'" style="color:'+_gold+';text-decoration:none">'+esc(data.email)+'</a></p>'
  ),'Eingehend \u2014 Kontaktanfrage',refId);
  _send(INBOX,'Kontaktanfrage: '+data.subject+' \u2014 '+data.name+' ['+refId+']',aHtml,data.email);

  /* → Customer auto-reply */
  var rHtml=W(BD(
    TITLE('Ihre Anfrage wurde erfasst','Referenz: '+refId)+
    DIV()+
    GREET(data.name)+
    '<p>Ihre Nachricht wurde empfangen und an die zust&auml;ndige Abteilung weitergeleitet.</p>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Referenznummer',refId,{mono:true,bold:true})+
      TR('Bearbeitungszeit','24\u201348 Stunden (Werktage)')+
    '</table>'+
    SIGN('Kundendienst')
  ),'Ihre Anfrage',refId,
    'Kontaktanfrage ['+refId+'] erfasst.');
  _send(data.email,'Anfrage erhalten ['+refId+'] \u2014 '+LE.NAME,rHtml,FM.SUPPORT);
}


/* ══════════════════════════════════════════════════════
   6 · SICHERHEIT & AUTHENTIFIZIERUNG
   ══════════════════════════════════════════════════════ */

function sendPasswordReset(email){
  var code=genCode();
  localStorage.setItem('aura_reset_code',JSON.stringify({code:code,email:email,expires:Date.now()+15*60*1000,type:'reset'}));
  var html=W(BD(
    TITLE('Passwort zur&uuml;cksetzen','Sicherheitsbenachrichtigung')+
    DIV()+
    '<p>F&uuml;r das Konto <strong style="font-family:'+_mono+'">'+esc(email)+'</strong> wurde ein Zur&uuml;cksetzen angefordert.</p>'+
    CODE(code)+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('G&uuml;ltigkeit','15 Minuten')+
      TR('Ausgestellt',fD()+', '+fT()+' Uhr')+
    '</table>'+
    '<p style="font-size:12px;color:'+_muted+';margin-top:20px">Nicht angefordert? Ignorieren Sie diese Nachricht. Ihr Konto bleibt gesch&uuml;tzt.</p>'
  ),'Sicherheit',null,'Passwort-Reset-Code: '+code);
  _send(email,'Passwort zur\u00fccksetzen \u2014 Code: '+code,html,FM.NOREPLY);
  return code;
}

function verifyResetCode(c){
  var r=localStorage.getItem('aura_reset_code');if(!r)return{ok:false,error:'Kein Code angefordert'};
  var d=JSON.parse(r);
  if(Date.now()>d.expires){localStorage.removeItem('aura_reset_code');return{ok:false,error:'Code abgelaufen'};}
  if(d.code!==c)return{ok:false,error:'Ung\u00fcltiger Code'};
  localStorage.removeItem('aura_reset_code');return{ok:true,email:d.email};
}

function sendPasswordChanged(email,name){
  var n=esc(name||email.split('@')[0]);
  var html=W(BD(
    TITLE('Passwort ge&auml;ndert','Sicherheitsbenachrichtigung')+
    DIV()+
    GREET(n)+
    '<p>Das Passwort f&uuml;r Ihr Konto wurde ge&auml;ndert.</p>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Konto',esc(email),{mono:true})+
      TR('Ge&auml;ndert am',fD()+', '+fT()+' Uhr')+
    '</table>'+
    CARD(
      '<div style="font-size:13px;color:#856404;line-height:1.75">'+
        '<strong>Nicht von Ihnen veranlasst?</strong> Kontaktieren Sie umgehend: '+
        '<a href="mailto:'+FM.SUPPORT+'" style="color:'+_gold+';text-decoration:none">'+FM.SUPPORT+'</a>'+
      '</div>'
    )+
    SIGN('Sicherheitsteam')
  ),'Sicherheit',null,'Passwort f\u00fcr '+email+' ge\u00e4ndert.');
  _send(email,'Passwort ge\u00e4ndert \u2014 '+LE.NAME,html,FM.SUPPORT);
}

function sendVerificationCode(email,name){
  var code=genCode();
  localStorage.setItem('aura_verify_code',JSON.stringify({code:code,email:email,expires:Date.now()+5*60*1000}));
  var n=esc(name||email.split('@')[0]);
  var html=W(BD(
    TITLE('Best&auml;tigungscode','E-Mail-Verifizierung')+
    DIV()+
    '<p>Sehr geehrte/r '+n+', hier ist Ihr Code:</p>'+
    CODE(code)+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('G&uuml;ltigkeit','5 Minuten')+
      TR('Ausgestellt',fD()+', '+fT()+' Uhr')+
    '</table>'+
    '<p style="font-size:12px;color:'+_muted+'">Diesen Code niemals an Dritte weitergeben.</p>'
  ),'Verifizierung',null,'Code: '+code);
  _send(email,'Best\u00e4tigungscode: '+code+' \u2014 '+LE.NAME,html,FM.NOREPLY);
  return code;
}

function verifyCode(c){
  var r=localStorage.getItem('aura_verify_code');if(!r)return{ok:false,error:'Kein Code angefordert'};
  var d=JSON.parse(r);
  if(Date.now()>d.expires){localStorage.removeItem('aura_verify_code');return{ok:false,error:'Code abgelaufen'};}
  if(d.code!==c)return{ok:false,error:'Ung\u00fcltiger Code'};
  localStorage.removeItem('aura_verify_code');return{ok:true,email:d.email};
}


/* ══════════════════════════════════════════════════════
   7 · HR & OPERATIONS
   ══════════════════════════════════════════════════════ */

function sendCareerApplication(data){
  var refId=data.refId||'BW-'+Date.now().toString(36).toUpperCase();

  /* Store in local inbox */
  _storeMsg({
    type:'career',
    refId:refId,
    senderName:(data.firstname||'')+' '+(data.lastname||''),
    email:data.email,
    subject:'Bewerbung: '+data.position,
    position:data.position,
    message:data.message||'',
    messenger:data.messenger||null
  });

  /* → Admin (INBOX) — incoming application */
  var hrHtml=W(BD(
    TITLE('Bewerbungseingang','Position: '+esc(data.position))+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bewerber/in',esc(data.firstname)+' '+esc(data.lastname||''))+
      TR('E-Mail','<a href="mailto:'+esc(data.email)+'" style="color:'+_gold+';text-decoration:none">'+esc(data.email)+'</a>')+
      TR('Messenger',data.messenger?esc(data.messenger):'&mdash;')+
      TR('Position',esc(data.position),{bold:true})+
      TR('Referenz',refId,{mono:true})+
      TR('Eingang',fD()+', '+fT()+' Uhr')+
    '</table>'+
    SEC('Anschreiben')+
    '<div style="background:#fff;padding:18px;border-radius:3px;white-space:pre-wrap;font-size:13px;color:'+_warm+';line-height:1.8;border-left:3px solid '+_gold+'">'+esc(data.message||'\u2014')+'</div>'+
    BTN('Im Admin Panel pr&uuml;fen &rarr;',O+'/admin-hub.html')
  ),'Eingehend \u2014 Bewerbung',refId);
  _send(INBOX,'Bewerbung: '+data.position+' \u2014 '+data.firstname+' ['+refId+']',hrHtml,data.email);

  /* → Applicant confirmation */
  var rHtml=W(BD(
    TITLE('Bewerbung eingegangen','Referenz: '+refId)+
    DIV()+
    GREET(data.firstname)+
    '<p>Ihre Bewerbung f&uuml;r die Position <strong style="color:'+_navy+'">'+esc(data.position)+'</strong> wurde erfasst.</p>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Referenznummer',refId,{mono:true,bold:true})+
      TR('Position',esc(data.position))+
      TR('Status',BDG('In Pr\u00fcfung','#D97706','#fff'))+
      TR('Bearbeitungszeit','5\u20137 Werktage')+
    '</table>'+
    SIGN('Personalabteilung')
  ),'Ihre Bewerbung',refId,
    'Bewerbung f\u00fcr '+data.position+' ['+refId+'] eingegangen.');
  _send(data.email,'Bewerbung eingegangen \u2014 '+data.position+' ['+refId+']',rHtml,FM.HR);
}


/* ── 7.2 Onboarding — Official Appointment ────────── */
function sendOnboarding(data){
  var empId=esc(data.employeeId||'AGM-0000');
  var pos=esc(data.position||'Mitarbeiter');
  var fn=esc(data.firstname||'');
  var ln=esc(data.lastname||'');
  var fullName=fn+(ln?' '+ln:'');
  var startDate=data.startDate?fD(data.startDate):'Nach Vereinbarung';
  var hubUrl=esc(data.hubAccess||O+'/admin-hub.html');
  var sopUrl=esc(data.sopUrl||O+'/sop');
  var ndaUrl=esc(data.ndaUrl||O+'/nda');
  var cocUrl=esc(data.codeOfConductUrl||O+'/code-of-conduct');
  var supName=esc(data.supervisorName||'Aura Operations Team');
  var supEmail=esc(data.supervisorEmail||FM.HR);
  var secName=esc(data.securityOfficer||'Security Department');
  var secEmail=esc(data.securityOfficerEmail||'security@auraglobal-merchants.com');

  var html=W(BD(
    '<div style="text-align:center;margin-bottom:12px">'+BDG('Official Appointment',_navy,_gold)+'</div>'+
    TITLE('Offizielle Ernennung','Personal-ID: '+empId)+
    DIV()+
    GREET(fullName)+
    '<p>Hiermit best&auml;tigen wir Ihre Ernennung als <strong style="color:'+_navy+'">'+pos+'</strong> bei '+LE.NAME+'.</p>'+

    SEC('Personaldaten')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Personalnummer',empId,{mono:true,bold:true})+
      TR('Position',pos,{bold:true})+
      TR('Dienstantritt',startDate)+
      TR('Standort',esc(data.location||'Remote'))+
      TR('Vorgesetzter',supName+' (<a href="mailto:'+supEmail+'" style="color:'+_gold+';text-decoration:none">'+supEmail+'</a>)')+
    '</table>'+

    SEC('Zugangsdaten')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Aura Hub Portal','<a href="'+hubUrl+'" style="color:'+_gold+';text-decoration:none;font-weight:700">Portal &ouml;ffnen</a>')+
      TR('SOP-Handbuch','<a href="'+sopUrl+'" style="color:'+_gold+';text-decoration:none">Standard Operating Procedures</a>')+
    '</table>'+

    SEC('Compliance-Dokumente')+
    '<p style="font-size:13px;color:'+_warm+'"><strong>Vor Dienstantritt</strong> zu pr&uuml;fen und digital zu unterzeichnen:</p>'+
    CARD_S(
      '<table style="width:100%;font-size:13px;color:'+_warm+'">'+
        '<tr><td style="padding:10px 0;border-bottom:1px solid #E8E5DF">&#9744; &nbsp;<a href="'+ndaUrl+'" style="color:'+_gold+';text-decoration:none;font-weight:600">Geheimhaltungsvereinbarung (NDA)</a></td></tr>'+
        '<tr><td style="padding:10px 0">&#9744; &nbsp;<a href="'+cocUrl+'" style="color:'+_gold+';text-decoration:none;font-weight:600">Verhaltenskodex (Code of Conduct)</a></td></tr>'+
      '</table>'
    )+

    SEC('Sicherheitskontakt')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Security Officer',secName)+
      TR('E-Mail','<a href="mailto:'+secEmail+'" style="color:'+_gold+';text-decoration:none">'+secEmail+'</a>')+
      TR('Meldefrist','4 Stunden bei Sicherheitsvorf&auml;llen')+
    '</table>'+

    CARD(
      '<div style="font-size:12px;color:#DC2626;line-height:1.75;font-weight:600">'+
        'Hinweis: Verst&ouml;&szlig;e gegen NDA oder Verhaltenskodex f&uuml;hren zur sofortigen Beendigung des Vertragsverh&auml;ltnisses '+
        'und gegebenenfalls zivil- und strafrechtlicher Verfolgung.'+
      '</div>'
    )+
    '<p style="font-size:13px;color:'+_warm+';margin-top:28px;line-height:1.6">Mit vorz&uuml;glicher Hochachtung,<br>'+
      '<strong style="color:'+_navy+'">Personalabteilung</strong><br>'+
      '<span style="font-size:11px;color:'+_muted+'">'+LE.NAME+'</span></p>'
  ),'Official Appointment',empId,
    'Ernennung als '+pos+' \u2014 '+LE.NAME);
  _send(data.email,'Offizielle Ernennung: '+data.position+' \u2014 '+LE.NAME+' ['+empId+']',html,FM.HR);
}


/* ══════════════════════════════════════════════════════
   EXPORT
   ══════════════════════════════════════════════════════ */

window.AuraEmail = {
  CONFIG: C,
  LEGAL:  LE,
  INBOX:  INBOX,
  FM:     FM,
  init:   init,
  test:   testEmail,

  /* 1 · Customer */
  sendWelcome:              sendWelcome,
  sendPrimeWelcome:         sendPrimeWelcome,
  sendNewsletterWelcome:    sendNewsletterWelcome,

  /* 2 · Finance */
  sendOrderConfirmation:    sendOrderConfirmation,
  sendPaymentConfirmation:  sendPaymentConfirmation,

  /* 3 · Verification */
  sendInspectionStarted:    sendInspectionStarted,
  sendAuraVerified:         sendAuraVerified,

  /* 4 · Logistics */
  sendShippingConfirmation: sendShippingConfirmation,
  sendStatusUpdate:         sendStatusUpdate,

  /* 5 · Communication */
  sendContactForm:          sendContactForm,

  /* 6 · Security */
  sendPasswordReset:        sendPasswordReset,
  verifyResetCode:          verifyResetCode,
  sendPasswordChanged:      sendPasswordChanged,
  sendVerificationCode:     sendVerificationCode,
  verifyCode:               verifyCode,

  /* 7 · HR */
  sendCareerApplication:    sendCareerApplication,
  sendOnboarding:           sendOnboarding,

  /* 8 · Inbox & Reply */
  getInbox:                 getInbox,
  getInboxMsg:              getInboxMsg,
  updateInboxMsg:           updateInboxMsg,
  deleteInboxMsg:           deleteInboxMsg,
  sendReply:                sendReply
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
