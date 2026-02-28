/* ═══════════════════════════════════════════════════════════════
   AURA GLOBAL MERCHANTS LTD. — Transactional Email System v4.0
   ─────────────────────────────────────────────────────────────
   British Business Formal · Sie-Form · Hochdeutsch
   Client-side via EmailJS · Single Universal Template
   RFC 5322 Compliant · GDPR/DSGVO Konform
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── CONFIGURATION ─────────────────────────────────── */
var C  = { PK:'6E1iefDAtX8goF9mt', SVC:'service_6xbgl7m', TPL:'template_slxey9g' };
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
  NAME:'Aura Global Merchants Ltd.',
  CRN:'15847293',
  ADDR:'71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
  COUNTRY:'United Kingdom',
  JUR:'England and Wales'
};
var YR = new Date().getFullYear();
var O  = window.location.origin;

/* ── INIT ──────────────────────────────────────────── */
var _ok=false, _q=[], _n=0;
function init(){
  if(_ok) return;
  if(typeof emailjs==='undefined'){
    if(++_n<=30) setTimeout(init,200);
    else console.error('[AuraEmail] EmailJS SDK nicht geladen.');
    return;
  }
  emailjs.init({publicKey:C.PK});
  _ok=true;
  console.log('[AuraEmail] v4.0 Initialisiert. SVC='+C.SVC+' TPL='+C.TPL);
  _q.forEach(function(m){_send(m.to,m.subj,m.html,m.reply);});
  _q=[];
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
  var addr = to||'ethanwalker2318@gmail.com';
  console.log('=== AuraEmail v4.0 TEST ===');
  if(!_ok){
    if(typeof emailjs!=='undefined'){emailjs.init({publicKey:C.PK});_ok=true;}
    else{console.error('SDK not loaded');return;}
  }
  emailjs.send(C.SVC,C.TPL,{
    to_email:addr,
    subject:'AuraEmail v4.0 Test — '+new Date().toLocaleTimeString(),
    html_content:'<h2>Transactional Email System v4.0</h2><p>Status: Operational.</p>',
    reply_to:FM.NOREPLY
  }).then(function(r){console.log('TEST OK',r.status);})
    .catch(function(e){console.error('TEST FAIL',e);});
}


/* ══════════════════════════════════════════════════════
   TEMPLATE ENGINE
   Graphite #2c2c2c · Black #0a0a0a · Gold #C5A059
   max-width: 600px · Inter / Helvetica / sans-serif
   ══════════════════════════════════════════════════════ */

var _f  = "'Inter',Helvetica,Arial,sans-serif";
var _fs = "Georgia,'Times New Roman',serif";

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function genCode(){return Math.floor(100000+Math.random()*900000).toString();}
function fD(d){return new Date(d||Date.now()).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});}
function fP(n){return(n||0).toFixed(2).replace('.',',');}
function fT(d){return new Date(d||Date.now()).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}

/* Hidden pre-header for inbox preview */
function PH(t){
  return '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:0;color:#2c2c2c;line-height:0">'+
    esc(t)+'</div>';
}

/* HEADER — Logo left, Reference right */
function HDR(subtitle,refId){
  return '<div style="background:#0a0a0a;padding:0">'+
    '<div style="max-width:600px;margin:0 auto;padding:32px 32px 24px">'+
      '<table style="width:100%;border-collapse:collapse"><tr>'+
        '<td style="vertical-align:middle">'+
          '<div style="font-family:'+_fs+';font-size:22px;font-weight:700;color:#C5A059;letter-spacing:3px">AURA GLOBAL</div>'+
          '<div style="font-family:'+_f+';font-size:7px;color:rgba(197,160,89,0.35);letter-spacing:5px;margin-top:1px">MERCHANTS LTD.</div>'+
        '</td>'+
        (refId?'<td style="vertical-align:middle;text-align:right">'+
          '<div style="font-family:monospace;font-size:12px;color:#C5A059;font-weight:700">'+esc(refId)+'</div>'+
          '<div style="font-family:'+_f+';font-size:8px;color:#666;margin-top:2px">'+fD()+'</div>'+
        '</td>':'<td></td>')+
      '</tr></table>'+
      (subtitle?'<div style="margin-top:14px;padding-top:10px;border-top:1px solid rgba(197,160,89,0.12)">'+
        '<div style="font-family:'+_f+';font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:2.5px;text-transform:uppercase">'+subtitle+'</div>'+
      '</div>':'')+
    '</div>'+
  '</div>';
}

/* LEGAL FOOTER — 20% of email */
function FTR(){
  return '<div style="background:#0a0a0a;padding:0;border-top:3px solid #C5A059">'+
    '<div style="max-width:600px;margin:0 auto;padding:32px 32px 24px;font-family:'+_f+'">'+

      /* Company identity */
      '<div style="text-align:center;margin-bottom:16px">'+
        '<div style="font-family:'+_fs+';font-size:13px;color:#C5A059;letter-spacing:2px;font-weight:700">AURA GLOBAL</div>'+
        '<div style="font-size:6px;color:rgba(197,160,89,0.35);letter-spacing:4px;margin-top:1px">MERCHANTS LTD.</div>'+
      '</div>'+

      /* Registration */
      '<div style="text-align:center;font-size:10px;color:#777;line-height:1.9">'+
        'Registered in '+LE.JUR+' &nbsp;|&nbsp; Company No. (CRN): '+LE.CRN+'<br>'+
        'Registered Office: '+LE.ADDR+', '+LE.COUNTRY+
      '</div>'+

      /* Links */
      '<div style="text-align:center;margin:14px 0;font-size:10px">'+
        '<a href="'+O+'/impressum.html" style="color:#C5A059;text-decoration:none;letter-spacing:0.5px">Impressum</a>'+
        ' &nbsp;&middot;&nbsp; '+
        '<a href="'+O+'/privacy.html" style="color:#C5A059;text-decoration:none;letter-spacing:0.5px">Datenschutz</a>'+
        ' &nbsp;&middot;&nbsp; '+
        '<a href="'+O+'/agb.html" style="color:#C5A059;text-decoration:none;letter-spacing:0.5px">AGB</a>'+
        ' &nbsp;&middot;&nbsp; '+
        '<a href="'+O+'/contact.html" style="color:#C5A059;text-decoration:none;letter-spacing:0.5px">Kontakt</a>'+
      '</div>'+

      '<div style="width:50px;height:1px;background:rgba(197,160,89,0.15);margin:18px auto"></div>'+

      /* Confidentiality Notice */
      '<div style="font-size:9px;color:#666;line-height:1.7;margin:14px 0;text-align:left">'+
        '<strong style="color:#888;letter-spacing:0.5px;text-transform:uppercase;font-size:8px">Confidentiality Notice</strong><br>'+
        'This email and any attachments are confidential and intended solely for the named addressee. '+
        'If you have received this message in error, please notify the sender immediately and delete all copies. '+
        'Unauthorised use, disclosure, copying or distribution is strictly prohibited.'+
      '</div>'+

      /* GDPR / DSGVO */
      '<div style="font-size:9px;color:#666;line-height:1.7;margin:14px 0;text-align:left">'+
        '<strong style="color:#888;letter-spacing:0.5px;text-transform:uppercase;font-size:8px">Datenschutzhinweis (DSGVO / GDPR)</strong><br>'+
        'Diese Nachricht wird gem&auml;&szlig; der EU-Datenschutz-Grundverordnung (DSGVO) und dem UK Data Protection Act 2018 verarbeitet. '+
        'Informationen zur Verarbeitung Ihrer personenbezogenen Daten: '+
        '<a href="'+O+'/privacy.html" style="color:#C5A059;text-decoration:none">Datenschutzerkl&auml;rung</a>.'+
      '</div>'+

      /* Auto-generated disclaimer */
      '<div style="font-size:9px;color:#555;line-height:1.6;margin:16px 0;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:2px;text-align:center">'+
        'Dies ist eine automatisch generierte Nachricht. Bitte antworten Sie nicht direkt auf diese E-Mail.<br>'+
        'F&uuml;r R&uuml;ckfragen: <a href="mailto:'+FM.SUPPORT+'" style="color:#C5A059;text-decoration:none">'+FM.SUPPORT+'</a>'+
      '</div>'+

      /* Copyright */
      '<div style="text-align:center;font-size:8px;color:#555;margin-top:14px">'+
        '&copy; '+YR+' Aura Global Group. All rights reserved.'+
      '</div>'+

    '</div>'+
  '</div>';
}

/* Full email wrapper */
function W(body,subtitle,refId,preheader){
  return '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">'+
    '<title>Aura Global Merchants</title></head>'+
    '<body style="margin:0;padding:0;background:#2c2c2c;-webkit-font-smoothing:antialiased">'+
    (preheader?PH(preheader):'')+
    '<div style="max-width:600px;margin:0 auto;background:#ffffff;font-family:'+_f+';color:#1a1a1a;overflow:hidden">'+
      HDR(subtitle,refId)+body+FTR()+
    '</div></body></html>';
}

/* Body content wrapper */
function BD(html){
  return '<div style="padding:36px 32px;font-family:'+_f+';font-size:13px;line-height:1.8;color:#1a1a1a">'+html+'</div>';
}

/* Matte Gold button */
function BTN(text,href){
  return '<div style="text-align:center;margin:28px 0">'+
    '<a href="'+href+'" style="display:inline-block;background:#C5A059;color:#0a0a0a;padding:14px 36px;text-decoration:none;font-family:'+_f+';font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px">'+
    text+'</a></div>';
}

/* Outline button */
function BTN_O(text,href){
  return '<div style="text-align:center;margin:24px 0">'+
    '<a href="'+href+'" style="display:inline-block;border:2px solid #1a1a1a;color:#1a1a1a;padding:12px 32px;text-decoration:none;font-family:'+_f+';font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:2px">'+
    text+'</a></div>';
}

/* Verification code display */
function CODE(c){
  return '<div style="text-align:center;margin:28px 0">'+
    '<div style="display:inline-block;background:#0a0a0a;color:#C5A059;font-size:32px;letter-spacing:12px;padding:18px 36px;font-weight:700;font-family:monospace;border-radius:2px">'+c+'</div></div>';
}

/* Section title */
function SEC(t){
  return '<div style="margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #C5A059">'+
    '<span style="font-family:'+_f+';font-size:10px;font-weight:700;color:#1a1a1a;letter-spacing:1.5px;text-transform:uppercase">'+t+'</span></div>';
}

/* Info card */
function CARD(html){
  return '<div style="background:#f8f8f8;border:1px solid #e5e5e5;border-radius:2px;padding:20px;margin:16px 0">'+html+'</div>';
}

/* Status badge */
function BDG(text,bg,fg){
  return '<span style="display:inline-block;background:'+(bg||'#0a0a0a')+';color:'+(fg||'#fff')+';padding:4px 14px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:2px;font-family:'+_f+'">'+text+'</span>';
}

/* Gold divider */
function DIV(){
  return '<div style="width:40px;height:2px;background:#C5A059;margin:24px auto"></div>';
}

/* Key-value table row */
function TR(label,value,opts){
  var o=opts||{};
  return '<tr><td style="padding:5px 0;font-size:11px;color:#888;vertical-align:top;width:'+(o.w||'140')+'px;font-family:'+_f+'">'+label+'</td>'+
    '<td style="padding:5px 0;font-size:12px;color:#1a1a1a;font-family:'+(o.mono?'monospace':_f)+';'+(o.bold?'font-weight:700;':'')+'">'+value+'</td></tr>';
}


/* ══════════════════════════════════════════════════════
   CATEGORY 1: SALES & TRUST — Kundenkorrespondenz
   ══════════════════════════════════════════════════════ */


/* ── 1.1 Kontoregistrierung ───────────────────────── */
function sendWelcome(email,name){
  var n=esc(name||email.split('@')[0]);
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px;font-weight:700">Kontozugang best&auml;tigt</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 20px">Registrierung abgeschlossen f&uuml;r '+esc(email)+'</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+n+',</p>'+
    '<p>Ihr Kundenkonto bei '+LE.NAME+' wurde eingerichtet. S&auml;mtliche Funktionen stehen Ihnen ab sofort zur Verf&uuml;gung.</p>'+
    SEC('KONTODATEN')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('E-Mail',esc(email),{mono:true})+
      TR('Registriert am',fD())+
      TR('Kundenstatus',BDG('Aktiv','#059669'))+
    '</table>'+
    SEC('LEISTUNGSUMFANG')+
    '<table style="width:100%;font-size:12px;color:#444">'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0">Zugang zum vollst&auml;ndigen Produktkatalog (verifizierte Markenware)</td></tr>'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0">24-Punkt Aura Inspection Protocol f&uuml;r jeden Artikel</td></tr>'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0">14 Tage Widerrufsrecht gem. Fernabsatzgesetz</td></tr>'+
      '<tr><td style="padding:6px 0">Pers&ouml;nlicher Video-Inspektionsbericht pro Bestellung</td></tr>'+
    '</table>'+
    BTN('ZUM KATALOG &rarr;',O+'/catalog.html')+
    '<p style="font-size:11px;color:#888;text-align:center;margin-top:24px">Fragen zum Konto: <a href="mailto:'+FM.SUPPORT+'" style="color:#C5A059;text-decoration:none">'+FM.SUPPORT+'</a></p>'
  ),'Kontoregistrierung',null,
    'Ihr Kundenkonto bei Aura Global Merchants ist aktiv.');
  _send(email,'Kontozugang best\u00e4tigt \u2014 '+LE.NAME,html,FM.SUPPORT);
}


/* ── 1.2 Aura Prime Mitgliedschaft ───────────────── */
function sendPrimeWelcome(email){
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#C5A059;margin:0 0 4px;font-weight:700">Aura Prime — Mitgliedschaft aktiv</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 20px">Zugang freigeschaltet f&uuml;r '+esc(email)+'</p>'+
    DIV()+
    '<p>Ihre Aura Prime Mitgliedschaft ist ab sofort aktiv. Folgende Leistungen sind in Ihrem Konto hinterlegt:</p>'+
    SEC('PRIME-LEISTUNGEN')+
    '<table style="width:100%;font-size:12px;color:#444">'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0"><strong>Vorab-Zugang</strong> — Neue Produkte 48h vor &ouml;ffentlichem Verkaufsstart</td></tr>'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0"><strong>Express-Versand</strong> — Kostenfrei ab &euro;99 Bestellwert (DHL Express)</td></tr>'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0"><strong>Priority Inspection</strong> — Bevorzugte Bearbeitung im Aura Hub</td></tr>'+
      '<tr><td style="padding:6px 0"><strong>Exklusive Konditionen</strong> — Sonderpreise auf ausgew&auml;hlte Artikel</td></tr>'+
    '</table>'+
    BTN('PRIME-ANGEBOTE ANSEHEN &rarr;',O+'/catalog.html')+
    '<p style="font-size:10px;color:#999;text-align:center">K&uuml;ndigung jederzeit m&ouml;glich. Keine Mindestlaufzeit.</p>'
  ),'Aura Prime',null,
    'Ihre Aura Prime Mitgliedschaft ist aktiv.');
  _send(email,'Aura Prime Mitgliedschaft best\u00e4tigt \u2014 '+LE.NAME,html,FM.MARKETING);
}


/* ── 1.3 Newsletter-Anmeldung ─────────────────────── */
function sendNewsletterWelcome(email){
  var subs=JSON.parse(localStorage.getItem('aura_newsletter_subs')||'[]');
  if(!subs.some(function(s){return s.email===email;})){
    subs.push({email:email,date:new Date().toISOString()});
    localStorage.setItem('aura_newsletter_subs',JSON.stringify(subs));
  }
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Newsletter-Anmeldung best&auml;tigt</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 20px">Empf&auml;nger: '+esc(email)+'</p>'+
    DIV()+
    '<p>Ihre E-Mail-Adresse wurde in unseren Verteiler aufgenommen. Sie erhalten k&uuml;nftig:</p>'+
    '<table style="width:100%;font-size:12px;color:#444;margin:16px 0">'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0">Produktank&uuml;ndigungen und Verf&uuml;gbarkeitshinweise</td></tr>'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid #f0f0f0">Preis&auml;nderungen und zeitlich begrenzte Angebote</td></tr>'+
      '<tr><td style="padding:6px 0">Marktberichte und technische Analysen</td></tr>'+
    '</table>'+
    '<p style="font-size:11px;color:#888">Abmeldung jederzeit m&ouml;glich &uuml;ber den Link am Ende jeder Nachricht. '+
    'Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). '+
    'Weitere Informationen: <a href="'+O+'/privacy.html" style="color:#C5A059;text-decoration:none">Datenschutzerkl&auml;rung</a>.</p>'+
    BTN('ZUM KATALOG &rarr;',O+'/catalog.html')
  ),'Newsletter',null,
    'Newsletter-Anmeldung best\u00e4tigt.');
  _send(email,'Newsletter-Anmeldung best\u00e4tigt \u2014 '+LE.NAME,html,FM.NEWSLETTER);
}


/* ══════════════════════════════════════════════════════
   CATEGORY 2: FINANZIELLE DOKUMENTATION
   ══════════════════════════════════════════════════════ */


/* ── 2.1 Bestellbestätigung / Rechnung ────────────── */
function sendOrderConfirmation(order,email,name){
  var a  = order.address||{};
  var ba = order.billingAddress||a;
  var cn = esc(name||a.name||'');
  var oid= esc(order.id);

  /* Items table */
  var subtotal=0;
  var items=(order.items||[]).map(function(it,idx){
    var p=it.product||(typeof Aura!=='undefined'?Aura.getProductById(it.productId):null)||{};
    var price=((p.price||0)+(it.priceOffset||0))*(it.qty||1);
    subtotal+=price;
    var sku=it.sku||p.sku||it.productId||'N/A';
    var sn=it.serialNumber||'Nach Aura Inspection';
    return '<tr>'+
      '<td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:10px;color:#888;text-align:center">'+(idx+1)+'</td>'+
      '<td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:12px">'+
        '<strong>'+esc(p.name||it.productId)+'</strong>'+
        (it.variant?'<br><span style="color:#888;font-size:11px">'+esc(it.variant)+'</span>':'')+
        '<br><span style="color:#999;font-size:10px">SKU: '+esc(sku)+' &nbsp;|&nbsp; S/N (vorl.): '+esc(sn)+'</span>'+
      '</td>'+
      '<td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px">'+(it.qty||1)+'</td>'+
      '<td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-size:12px;font-family:monospace;font-weight:600">&euro;'+fP(price)+'</td>'+
    '</tr>';
  }).join('');

  var shipping=order.shippingCost||0;
  var total=order.total||subtotal+shipping;

  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Bestellbest&auml;tigung / Rechnung</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Finanzdokument zur Bestellung #'+oid+'</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+cn+',</p>'+
    '<p>nachfolgend die Best&auml;tigung Ihrer Bestellung. Dieses Dokument dient gleichzeitig als Rechnung.</p>'+

    /* Order metadata */
    SEC('BESTELLDATEN')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Bestelldatum',fD(order.date||order.created))+
      TR('Status',BDG('Eingegangen','#D97706','#fff'))+
      TR('Zahlungsstatus',BDG('Ausstehend','#DC2626','#fff'))+
    '</table>'+

    /* Addresses side by side */
    '<table style="width:100%;border-collapse:collapse;margin:20px 0"><tr>'+
      '<td style="width:50%;vertical-align:top;padding-right:12px">'+
        '<div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">RECHNUNGSADRESSE</div>'+
        '<div style="font-size:12px;line-height:1.6">'+
          esc(ba.name||cn)+'<br>'+esc(ba.street||'')+'<br>'+esc(ba.zip||'')+' '+esc(ba.city||'')+'<br>'+esc(ba.country||'Deutschland')+
        '</div>'+
      '</td>'+
      '<td style="width:50%;vertical-align:top;padding-left:12px">'+
        '<div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px">LIEFERADRESSE</div>'+
        '<div style="font-size:12px;line-height:1.6">'+
          esc(a.name||cn)+'<br>'+esc(a.street||'')+'<br>'+esc(a.zip||'')+' '+esc(a.city||'')+'<br>'+esc(a.country||'Deutschland')+
        '</div>'+
      '</td>'+
    '</tr></table>'+

    /* Items table */
    SEC('BESTELLTE ARTIKEL')+
    '<table style="width:100%;border-collapse:collapse">'+
      '<tr style="background:#0a0a0a">'+
        '<th style="padding:10px 8px;text-align:center;font-size:8px;color:#C5A059;font-weight:700;letter-spacing:1px;width:30px">NR.</th>'+
        '<th style="padding:10px 8px;text-align:left;font-size:8px;color:#C5A059;font-weight:700;letter-spacing:1px">ARTIKEL / SKU</th>'+
        '<th style="padding:10px 8px;text-align:center;font-size:8px;color:#C5A059;font-weight:700;letter-spacing:1px;width:50px">MENGE</th>'+
        '<th style="padding:10px 8px;text-align:right;font-size:8px;color:#C5A059;font-weight:700;letter-spacing:1px;width:80px">BETRAG</th>'+
      '</tr>'+
      items+
    '</table>'+

    /* Totals */
    '<table style="width:100%;max-width:260px;margin:4px 0 0 auto;border-collapse:collapse">'+
      '<tr><td style="padding:4px 0;font-size:11px;color:#888">Zwischensumme (netto)</td><td style="padding:4px 0;text-align:right;font-size:11px;font-family:monospace">&euro;'+fP(subtotal)+'</td></tr>'+
      '<tr><td style="padding:4px 0;font-size:11px;color:#888">MwSt. (0% — Ausfuhr UK)</td><td style="padding:4px 0;text-align:right;font-size:11px;font-family:monospace">&euro;0,00</td></tr>'+
      '<tr><td style="padding:4px 0;font-size:11px;color:#888">Versandkosten</td><td style="padding:4px 0;text-align:right;font-size:11px;font-family:monospace">'+(shipping?'&euro;'+fP(shipping):'inkl.')+'</td></tr>'+
      '<tr style="border-top:2px solid #C5A059"><td style="padding:10px 0;font-size:12px;font-weight:700">Gesamtbetrag</td><td style="padding:10px 0;text-align:right;font-size:15px;font-weight:700;font-family:monospace;color:#C5A059">&euro;'+fP(total)+'</td></tr>'+
    '</table>'+

    /* VAT export notice */
    CARD(
      '<div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">STEUERHINWEIS — VAT EXPORT NOTICE</div>'+
      '<div style="font-size:11px;color:#666;line-height:1.7">'+
        'Diese Lieferung erfolgt als Ausfuhrlieferung aus dem Vereinigten K&ouml;nigreich und ist gem&auml;&szlig; UK Value Added Tax Act 1994 '+
        'von der britischen Umsatzsteuer (VAT) befreit (0%). Der Artikel ist im britischen Steuerregister (HMRC Export Registry) '+
        'f&uuml;r den Export reserviert. Etwaige Einfuhrabgaben im Bestimmungsland gehen zu Lasten des Empf&auml;ngers, sofern nicht anders vereinbart.'+
      '</div>'
    )+

    /* Widerrufsrecht */
    CARD(
      '<div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">WIDERRUFSBELEHRUNG</div>'+
      '<div style="font-size:11px;color:#666;line-height:1.7">'+
        'Sie haben das Recht, binnen 14 Tagen ohne Angabe von Gr&uuml;nden diesen Vertrag zu widerrufen (Widerrufsrecht gem. &sect; 355 BGB). '+
        'Die Widerrufsfrist betr&auml;gt 14 Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter die Ware in Empfang genommen haben. '+
        'Die vollst&auml;ndige Widerrufsbelehrung entnehmen Sie bitte unseren '+
        '<a href="'+O+'/agb.html" style="color:#C5A059;text-decoration:none;font-weight:600">Allgemeinen Gesch&auml;ftsbedingungen (AGB)</a>.'+
      '</div>'
    )+

    '<p style="font-size:11px;color:#888;margin-top:20px">Sie erhalten eine gesonderte Benachrichtigung, sobald Ihre Zahlung verarbeitet wurde.</p>'+
    BTN_O('BESTELLUNG VERFOLGEN &rarr;',O+'/dashboard.html')
  ),'Bestellbest\u00e4tigung / Rechnung','#'+oid,
    'Rechnung zu Bestellung #'+oid+' — '+LE.NAME);

  _send(email,'Bestellbest\u00e4tigung / Rechnung #'+order.id+' \u2014 '+LE.NAME,html,FM.ORDERS);

  /* Admin notification */
  var aHtml=W(BD(
    '<h2 style="font-family:'+_fs+';font-size:18px;color:#1a1a1a;margin:0 0 16px">Neue Bestellung eingegangen</h2>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Kunde',cn+' ('+esc(email)+')')+
      TR('Artikel',(order.items||[]).length+' Position(en)')+
      TR('Gesamtbetrag','&euro;'+fP(total),{bold:true})+
    '</table>'+
    '<table style="width:100%;border-collapse:collapse;margin:16px 0">'+items+'</table>'+
    BTN('ADMIN PANEL &Ouml;FFNEN &rarr;',O+'/admin-hub.html')
  ),'Neue Bestellung','#'+oid);
  _send(FM.ORDERS,'Neue Bestellung #'+order.id+' \u2014 \u20AC'+fP(total),aHtml,email);
}


/* ── 2.2 Zahlungsbestätigung ──────────────────────── */
function sendPaymentConfirmation(order,email,name){
  var cn=esc(name||(order.address&&order.address.name)||'');
  var oid=esc(order.id);
  var txId=esc(order.stripeTransactionId||order.transactionId||'TX-'+Date.now());
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Zahlungsbest&auml;tigung</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Transaktion erfolgreich autorisiert</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+cn+',</p>'+
    '<p>Ihre Zahlung f&uuml;r Bestellung <strong>#'+oid+'</strong> wurde erfolgreich verarbeitet und autorisiert.</p>'+
    SEC('TRANSAKTIONSDETAILS')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Transaktions-ID',txId,{mono:true})+
      TR('Betrag','&euro;'+fP(order.total),{bold:true})+
      TR('Zahlungsart',esc(order.paymentMethod||'Kreditkarte / Stripe'))+
      TR('Datum / Uhrzeit',fD()+' '+fT())+
      TR('Status',BDG('Autorisiert','#059669'))+
    '</table>'+
    CARD(
      '<div style="font-size:11px;color:#666;line-height:1.7">'+
        'Ihr Artikel ist ab sofort reserviert und wird dem n&auml;chsten verf&uuml;gbaren Aura Hub zur 24-Punkt-Inspektion zugeteilt. '+
        'Sie erhalten eine gesonderte Benachrichtigung, sobald die Inspektion beginnt.'+
      '</div>'
    )+
    BTN_O('BESTELLUNG VERFOLGEN &rarr;',O+'/dashboard.html')
  ),'Zahlungsbest\u00e4tigung','#'+oid,
    'Zahlung f\u00fcr #'+oid+' erfolgreich autorisiert.');
  _send(email,'Zahlungsbest\u00e4tigung #'+order.id+' \u2014 Transaktion autorisiert',html,FM.BILLING);
}


/* ══════════════════════════════════════════════════════
   CATEGORY 3: VERIFIKATION & TRUST
   ══════════════════════════════════════════════════════ */


/* ── 3.1 Aura Inspection gestartet ───────────────── */
function sendInspectionStarted(order,email,name){
  var cn=esc(name||(order.address&&order.address.name)||'');
  var oid=esc(order.id);
  var hub=esc(order.hubId||'London-Central / 001');
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Aura Inspection gestartet</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">24-Punkt-Pr&uuml;fprotokoll eingeleitet</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+cn+',</p>'+
    '<p>Ihr Ger&auml;t aus Bestellung <strong>#'+oid+'</strong> wurde einem technischen Spezialisten im Aura Hub zugewiesen. '+
    'Die Pr&uuml;fung nach dem 24-Punkt Aura Inspection Standard hat begonnen.</p>'+
    SEC('INSPEKTIONSDATEN')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Hub-ID',hub,{mono:true})+
      TR('Inspektionsbeginn',fD()+' '+fT())+
      TR('Pr\u00fcfstandard','24-Punkt Aura Inspection Protocol')+
      TR('Status',BDG('In Pr\u00fcfung','#7C3AED'))+
    '</table>'+
    CARD(
      '<div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">PR&Uuml;FUMFANG</div>'+
      '<div style="font-size:11px;color:#666;line-height:1.8">'+
        'Display Integrity &middot; Touch-Responsivit&auml;t &middot; Akkuzustand &middot; Logic Board Diagnostik &middot; '+
        'Kameramodule (Front/Rear) &middot; Lautsprecher &amp; Mikrofon &middot; Konnektivit&auml;t (WiFi/BT/NFC) &middot; '+
        'Biometrische Sensoren &middot; Ladeanschluss &amp; Wireless Charging &middot; Wasserschaden-Indikatoren &middot; '+
        'Kosmetische Bewertung &middot; IMEI/Seriennummer-Verifikation'+
      '</div>'
    )+
    '<p style="font-size:11px;color:#888">Nach Abschluss der Pr&uuml;fung erhalten Sie einen pers&ouml;nlichen Video-Inspektionsbericht (Aura Verified&trade;).</p>'+
    BTN_O('BESTELLUNG VERFOLGEN &rarr;',O+'/dashboard.html')
  ),'Aura Inspection','#'+oid,
    'Inspection f\u00fcr Bestellung #'+oid+' gestartet.');
  _send(email,'Aura Inspection gestartet \u2014 Bestellung #'+order.id,html,FM.INSPECT);
}


/* ── 3.2 Aura Verified™ — Video-Inspektionsbericht ─ */
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

  /* 12-point checklist */
  var checks=[
    {nr:'01',name:'Display Integrity',key:'display'},
    {nr:'02',name:'Touch-Responsivit&auml;t',key:'touch'},
    {nr:'03',name:'Akkuzustand (Battery Health)',key:'battery'},
    {nr:'04',name:'Logic Board Diagnostik',key:'logicBoard'},
    {nr:'05',name:'Kamera &mdash; Front',key:'cameraFront'},
    {nr:'06',name:'Kamera &mdash; Rear / Teleobjektiv',key:'cameraRear'},
    {nr:'07',name:'Lautsprecher &amp; Mikrofon',key:'speakers'},
    {nr:'08',name:'Konnektivit&auml;t (WiFi / BT / NFC)',key:'connectivity'},
    {nr:'09',name:'Biometrische Sensoren (Face ID / Touch ID)',key:'biometrics'},
    {nr:'10',name:'Ladeanschluss &amp; Wireless Charging',key:'charging'},
    {nr:'11',name:'Wasserschaden-Indikatoren',key:'waterDamage'},
    {nr:'12',name:'Kosmetischer Zustand',key:'cosmetic'}
  ];
  var checkRows=checks.map(function(c){
    var v=cl[c.key]||'BESTANDEN';
    var clr=(v==='KEINE'||v.indexOf('PASS')>-1||v.indexOf('BESTANDEN')>-1||v.indexOf('Grade')>-1)?'#059669':'#C5A059';
    return '<tr>'+
      '<td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:10px;color:#888;text-align:center">'+c.nr+'</td>'+
      '<td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">'+c.name+'</td>'+
      '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:10px;color:'+clr+';font-weight:700;letter-spacing:0.5px">'+esc(v)+'</td>'+
    '</tr>';
  }).join('');

  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Aura Verified&trade; &mdash; Inspektionsbericht</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Technischer Audit abgeschlossen. Ger&auml;t verifiziert.</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+cn+',</p>'+
    '<p>der technische Audit f&uuml;r Ihr Ger&auml;t aus Bestellung <strong>#'+oid+'</strong> ist abgeschlossen. '+
    'Die Seriennummer <strong style="font-family:monospace">'+sn+'</strong> wurde best&auml;tigt. '+
    'Das Ger&auml;t entspricht der Kategorie <strong style="color:#C5A059">'+grade+'</strong>.</p>'+

    SEC('INSPEKTIONSDATEN')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Pr&uuml;fbericht-Nr.',reportId,{mono:true,bold:true})+
      TR('Seriennummer',sn,{mono:true})+
      TR('Ger&auml;tekategorie',BDG(grade,'#059669'))+
      TR('Inspector',inspName+' ('+inspId+')')+
      TR('Hub-ID',hubId,{mono:true})+
      TR('Pr&uuml;fdatum',fD())+
    '</table>'+

    SEC('12-PUNKT-PR&Uuml;FPROTOKOLL')+
    '<table style="width:100%;border-collapse:collapse">'+
      '<tr style="background:#0a0a0a">'+
        '<th style="padding:8px;text-align:center;font-size:8px;color:#C5A059;letter-spacing:1px;width:30px">NR.</th>'+
        '<th style="padding:8px;text-align:left;font-size:8px;color:#C5A059;letter-spacing:1px">PR&Uuml;FPUNKT</th>'+
        '<th style="padding:8px;text-align:center;font-size:8px;color:#C5A059;letter-spacing:1px;width:90px">ERGEBNIS</th>'+
      '</tr>'+
      checkRows+
      '<tr style="background:#0a0a0a">'+
        '<td colspan="2" style="padding:10px 8px;font-size:10px;color:#C5A059;font-weight:700;letter-spacing:1px">GESAMTERGEBNIS</td>'+
        '<td style="padding:10px 8px;text-align:center;font-size:10px;color:#059669;font-weight:700;letter-spacing:1px">AURA VERIFIED &#10003;</td>'+
      '</tr>'+
    '</table>'+

    BTN('ZUM INSPEKTIONSVIDEO &#9654;',videoUrl)+

    CARD(
      '<div style="font-size:11px;color:#666;line-height:1.7">'+
        '<strong style="color:#1a1a1a">Digitale Signatur:</strong> '+inspName+' &nbsp;|&nbsp; Inspector ID: '+inspId+'<br>'+
        '<strong style="color:#1a1a1a">Hub-ID:</strong> '+hubId+' &nbsp;|&nbsp; Pr&uuml;fprotokoll-Nr.: '+reportId+
      '</div>'
    )
  ),'Aura Verified\u2122','#'+oid,
    'Aura Verified\u2122 \u2014 Ger\u00e4t verifiziert. Bericht verf\u00fcgbar.');
  _send(email,'Aura Verified\u2122 \u2014 Inspektionsbericht #'+order.id,html,FM.INSPECT);
}


/* ══════════════════════════════════════════════════════
   CATEGORY 4: VERSAND & LOGISTIK
   ══════════════════════════════════════════════════════ */


/* ── 4.1 Versandbestätigung (Shipping) ────────────── */
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
  var insValue=esc(s.insuranceValue||'Gem. Warenwert');

  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Versandbest&auml;tigung</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Ihr Paket ist unterwegs.</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+cn+',</p>'+
    '<p>Ihre Bestellung <strong>#'+oid+'</strong> hat unser Lager verlassen und befindet sich im Versand.</p>'+

    SEC('SENDUNGSDATEN')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Versanddienstleister',carrier)+
      TR('Sendungsnummer','<a href="'+trackUrl+'" style="color:#C5A059;text-decoration:none;font-family:monospace;font-weight:700">'+trackNum+'</a>')+
      TR('Voraussichtliche Zustellung',eta)+
      TR('Status',BDG('Versendet','#2563EB'))+
    '</table>'+

    SEC('PAKETDETAILS')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Gewicht',weight)+
      TR('Abmessungen',dims)+
      TR('Verpackungstyp',packType)+
      TR('Versicherung',insProvider)+
      TR('Versicherungswert',insValue)+
    '</table>'+

    BTN('AURA SENDUNGSVERFOLGUNG &rarr;',intUrl)+
    '<div style="text-align:center;margin-top:-16px;margin-bottom:20px">'+
      '<a href="'+trackUrl+'" style="font-size:10px;color:#888;text-decoration:none">Alternativ: Direkt bei '+carrier+' verfolgen &rarr;</a>'+
    '</div>'+

    CARD(
      '<div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">ANNAHMEHINWEIS</div>'+
      '<div style="font-size:11px;color:#666;line-height:1.7">'+
        'Bitte pr&uuml;fen Sie bei Annahme des Pakets die Unversehrtheit der Sicherheitspflomben und der Verpackung. '+
        'Dokumentieren Sie etwaige Besch&auml;digungen vor dem &Ouml;ffnen fotografisch und melden Sie diese innerhalb von 24 Stunden an '+
        '<a href="mailto:'+FM.SUPPORT+'" style="color:#C5A059;text-decoration:none">'+FM.SUPPORT+'</a>. '+
        'Die Originalverpackung ist f&uuml;r eine etwaige R&uuml;cksendung aufzubewahren.'+
      '</div>'
    )
  ),'Versand &amp; Logistik','#'+oid,
    'Bestellung #'+oid+' versendet \u2014 Sendungsnummer: '+trackNum);
  _send(email,'Versandbest\u00e4tigung #'+order.id+' \u2014 Sendungsnr. '+trackNum,html,FM.LOGISTICS);
}


/* ── 4.2 Generischer Status-Update ────────────────── */
function sendStatusUpdate(order,status){
  var email=order.address&&order.address.email;
  if(!email){
    var users=typeof Aura!=='undefined'?Aura.getUsers():[];
    var u=users.find(function(x){return x.id===order.userId;});
    if(u) email=u.email;
  }
  if(!email) return;
  var cn=esc((order.address&&order.address.name)||'');
  var oid=esc(order.id);

  var map={
    'paid':       {de:'Zahlung best\u00e4tigt',     color:'#059669', desc:'Ihre Zahlung wurde erfolgreich verarbeitet. Der Artikel ist reserviert und wird dem n&auml;chsten verf&uuml;gbaren Aura Hub zugewiesen.'},
    'sourcing':   {de:'Sourcing eingeleitet',        color:'#D97706', desc:'Unser Sourcing-Team hat Ihren Artikel lokalisiert. Der Beschaffungsprozess wurde eingeleitet.'},
    'inspection': {de:'Aura Inspection gestartet',   color:'#7C3AED', desc:'Ihr Ger&auml;t wurde einem technischen Spezialisten &uuml;bergeben. Die 24-Punkt-Pr&uuml;fung l&auml;uft.'},
    'verified':   {de:'Aura Verified',               color:'#059669', desc:'Der technische Audit ist abgeschlossen. Ihr Ger&auml;t hat das 24-Punkt-Pr&uuml;fprotokoll bestanden.'},
    'shipped':    {de:'Versendet',                   color:'#2563EB', desc:'Ihr Paket hat unser Lager verlassen und befindet sich im Versand.'},
    'delivered':  {de:'Zugestellt',                  color:'#059669', desc:'Ihr Paket wurde zugestellt. Bitte pr&uuml;fen Sie die Unversehrtheit der Sicherheitspflomben bei Annahme.'},
    'cancelled':  {de:'Storniert',                   color:'#DC2626', desc:'Ihre Bestellung wurde storniert. Die R&uuml;ckerstattung wird innerhalb von 3\u20135 Werktagen auf das urspr&uuml;ngliche Zahlungsmittel veranlasst.'},
    'returned':   {de:'Retoure registriert',         color:'#6B7280', desc:'Ihre Retoure wurde erfasst. Bitte senden Sie den Artikel in der Originalverpackung an die angegebene Retouradresse zur&uuml;ck.'}
  };
  var s=map[status]||{de:status,color:'#1a1a1a',desc:'Der Status Ihrer Bestellung wurde aktualisiert.'};

  var tracking='';
  if(order.trackingNumber&&(status==='shipped'||status==='delivered')){
    tracking=SEC('SENDUNGSVERFOLGUNG')+
      '<table style="width:100%;border-collapse:collapse">'+
        TR('Sendungsnummer','<a href="https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode='+esc(order.trackingNumber)+'" style="color:#C5A059;text-decoration:none;font-family:monospace;font-weight:700">'+esc(order.trackingNumber)+'</a>')+
      '</table>';
  }

  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Status-Aktualisierung</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Bestellung #'+oid+'</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+cn+',</p>'+

    '<div style="text-align:center;margin:20px 0">'+BDG(s.de,s.color)+'</div>'+

    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bestellnummer','#'+oid,{mono:true,bold:true})+
      TR('Neuer Status',s.de)+
      TR('Aktualisiert am',fD()+' '+fT())+
    '</table>'+

    CARD('<div style="font-size:12px;color:#444;line-height:1.7">'+s.desc+'</div>')+
    tracking+
    BTN_O('BESTELLUNG ANSEHEN &rarr;',O+'/dashboard.html')
  ),'Status-Update','#'+oid,
    'Bestellung #'+oid+' \u2014 '+s.de);
  _send(email,'Bestellung #'+order.id+' \u2014 '+s.de,html,FM.ORDERS);
}


/* ══════════════════════════════════════════════════════
   CATEGORY 5: KUNDENKOMMUNIKATION
   ══════════════════════════════════════════════════════ */


/* ── 5.1 Kontaktformular ─────────────────────────── */
function sendContactForm(data){
  var refId=data.refId||'KA-'+Date.now().toString(36).toUpperCase();

  /* Admin notification */
  var aHtml=W(BD(
    '<h2 style="font-family:'+_fs+';font-size:18px;color:#1a1a1a;margin:0 0 16px">Kontaktanfrage eingegangen</h2>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Absender',esc(data.name)+' (<a href="mailto:'+esc(data.email)+'" style="color:#C5A059;text-decoration:none">'+esc(data.email)+'</a>)')+
      TR('Betreff',esc(data.subject),{bold:true})+
      TR('Bestellnummer',data.orderNumber?esc(data.orderNumber):'&mdash;')+
      TR('Referenz',refId,{mono:true})+
      TR('Eingang',fD()+' '+fT())+
    '</table>'+
    SEC('NACHRICHT')+
    '<div style="background:#f8f8f8;padding:16px;border-radius:2px;white-space:pre-wrap;font-size:12px;color:#333;line-height:1.7;border-left:3px solid #C5A059">'+esc(data.message)+'</div>'
  ),'Kontaktanfrage',refId);
  _send(FM.SUPPORT,'Kontaktanfrage: '+data.subject+' ['+refId+']',aHtml,data.email);

  /* Customer auto-reply */
  var rHtml=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Anfrage erhalten</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Referenz: '+refId+'</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+esc(data.name)+',</p>'+
    '<p>Ihre Anfrage wurde erfasst und an die zust&auml;ndige Abteilung weitergeleitet.</p>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Referenznummer',refId,{mono:true,bold:true})+
      TR('Bearbeitungszeit','24\u201348 Stunden (Werktage)')+
    '</table>'+
    '<p style="font-size:12px;color:#666;margin-top:20px">Mit freundlichen Gr&uuml;&szlig;en,<br><strong style="color:#1a1a1a">Kundendienst &mdash; '+LE.NAME+'</strong></p>'
  ),'Ihre Anfrage',refId,
    'Ihre Kontaktanfrage ['+refId+'] wurde erfasst.');
  _send(data.email,'Anfrage erhalten ['+refId+'] \u2014 '+LE.NAME,rHtml,FM.SUPPORT);
}


/* ══════════════════════════════════════════════════════
   CATEGORY 6: SICHERHEIT & AUTHENTIFIZIERUNG
   ══════════════════════════════════════════════════════ */


/* ── 6.1 Passwort zurücksetzen ────────────────────── */
function sendPasswordReset(email){
  var code=genCode();
  localStorage.setItem('aura_reset_code',JSON.stringify({
    code:code,email:email,expires:Date.now()+15*60*1000,type:'reset'
  }));
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Passwort zur&uuml;cksetzen</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Sicherheitsbenachrichtigung</p>'+
    DIV()+
    '<p>F&uuml;r Ihr Konto ('+esc(email)+') wurde das Zur&uuml;cksetzen des Passworts angefordert. Verwenden Sie den folgenden Code:</p>'+
    CODE(code)+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('G&uuml;ltigkeit','15 Minuten ab Ausstellung')+
      TR('Ausgestellt am',fD()+' '+fT())+
    '</table>'+
    '<p style="font-size:11px;color:#888;margin-top:20px">Falls Sie diese Anforderung nicht veranlasst haben, ignorieren Sie diese Nachricht. Ihr Konto bleibt gesch&uuml;tzt.</p>'
  ),'Sicherheit',null,
    'Ihr Passwort-Reset-Code: '+code);
  _send(email,'Passwort zur\u00fccksetzen \u2014 Code: '+code,html,FM.NOREPLY);
  return code;
}

function verifyResetCode(inputCode){
  var raw=localStorage.getItem('aura_reset_code');
  if(!raw) return{ok:false,error:'Kein Code angefordert'};
  var d=JSON.parse(raw);
  if(Date.now()>d.expires){localStorage.removeItem('aura_reset_code');return{ok:false,error:'Code abgelaufen'};}
  if(d.code!==inputCode) return{ok:false,error:'Ung\u00fcltiger Code'};
  localStorage.removeItem('aura_reset_code');
  return{ok:true,email:d.email};
}


/* ── 6.2 Passwort geändert ────────────────────────── */
function sendPasswordChanged(email,name){
  var n=esc(name||email.split('@')[0]);
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Passwort ge&auml;ndert</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Sicherheitsbenachrichtigung f&uuml;r Ihr Konto</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+n+',</p>'+
    '<p>das Passwort f&uuml;r Ihr Konto bei '+LE.NAME+' wurde soeben ge&auml;ndert.</p>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Konto',esc(email),{mono:true})+
      TR('&Auml;nderung am',fD()+' '+fT())+
      TR('IP-Adresse','Protokolliert')+
    '</table>'+
    CARD(
      '<div style="font-size:12px;color:#856404;line-height:1.7">'+
        '<strong>Nicht von Ihnen veranlasst?</strong> Kontaktieren Sie umgehend unseren Sicherheitsdienst: '+
        '<a href="mailto:'+FM.SUPPORT+'" style="color:#C5A059;text-decoration:none">'+FM.SUPPORT+'</a>'+
      '</div>'
    )
  ),'Sicherheit',null,
    'Passwort f\u00fcr '+email+' wurde ge\u00e4ndert.');
  _send(email,'Passwort ge\u00e4ndert \u2014 '+LE.NAME,html,FM.SUPPORT);
}


/* ── 6.3 E-Mail-Bestätigungscode ─────────────────── */
function sendVerificationCode(email,name){
  var code=genCode();
  localStorage.setItem('aura_verify_code',JSON.stringify({
    code:code,email:email,expires:Date.now()+5*60*1000
  }));
  var n=esc(name||email.split('@')[0]);
  var html=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Best&auml;tigungscode</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">E-Mail-Verifizierung f&uuml;r '+esc(email)+'</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+n+', hier ist Ihr Best&auml;tigungscode:</p>'+
    CODE(code)+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('G&uuml;ltigkeit','5 Minuten ab Ausstellung')+
      TR('Ausgestellt am',fD()+' '+fT())+
    '</table>'+
    '<p style="font-size:11px;color:#888;margin-top:16px">Geben Sie diesen Code niemals an Dritte weiter.</p>'
  ),'Verifizierung',null,
    'Ihr Best\u00e4tigungscode: '+code);
  _send(email,'Best\u00e4tigungscode: '+code+' \u2014 '+LE.NAME,html,FM.NOREPLY);
  return code;
}

function verifyCode(inputCode){
  var raw=localStorage.getItem('aura_verify_code');
  if(!raw) return{ok:false,error:'Kein Code angefordert'};
  var d=JSON.parse(raw);
  if(Date.now()>d.expires){localStorage.removeItem('aura_verify_code');return{ok:false,error:'Code abgelaufen. Bitte erneut anfordern.'};}
  if(d.code!==inputCode) return{ok:false,error:'Ung\u00fcltiger Code'};
  localStorage.removeItem('aura_verify_code');
  return{ok:true,email:d.email};
}


/* ══════════════════════════════════════════════════════
   CATEGORY 7: HR & OPERATIONS
   ══════════════════════════════════════════════════════ */


/* ── 7.1 Bewerbungseingang ────────────────────────── */
function sendCareerApplication(data){
  var refId=data.refId||'BW-'+Date.now().toString(36).toUpperCase();

  /* HR notification */
  var hrHtml=W(BD(
    '<h2 style="font-family:'+_fs+';font-size:18px;color:#1a1a1a;margin:0 0 16px">Bewerbungseingang</h2>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Bewerber/in',esc(data.firstname)+' '+esc(data.lastname||''))+
      TR('E-Mail','<a href="mailto:'+esc(data.email)+'" style="color:#C5A059;text-decoration:none">'+esc(data.email)+'</a>')+
      TR('Messenger',data.messenger?esc(data.messenger):'&mdash;')+
      TR('Position',esc(data.position),{bold:true})+
      TR('Referenz',refId,{mono:true})+
      TR('Eingang',fD()+' '+fT())+
    '</table>'+
    SEC('ANSCHREIBEN')+
    '<div style="background:#f8f8f8;padding:16px;border-radius:2px;white-space:pre-wrap;font-size:12px;color:#333;line-height:1.7;border-left:3px solid #C5A059">'+esc(data.message||'\u2014')+'</div>'+
    BTN('IM ADMIN PANEL PR\u00dcFEN &rarr;',O+'/admin-hub.html')
  ),'HR \u2014 Bewerbung',refId);
  _send(FM.HR,'Bewerbung: '+data.position+' \u2014 '+data.firstname+' ['+refId+']',hrHtml,data.email);

  /* Applicant confirmation */
  var rHtml=W(BD(
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:0 0 4px">Bewerbung eingegangen</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px">Referenz: '+refId+'</p>'+
    DIV()+
    '<p>Sehr geehrte/r '+esc(data.firstname)+',</p>'+
    '<p>Ihre Bewerbung f&uuml;r die Position <strong>'+esc(data.position)+'</strong> bei '+LE.NAME+' wurde erfasst und an die Personalabteilung weitergeleitet.</p>'+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Referenznummer',refId,{mono:true,bold:true})+
      TR('Position',esc(data.position))+
      TR('Status',BDG('In Pr\u00fcfung','#D97706','#fff'))+
      TR('Bearbeitungszeit','5\u20137 Werktage')+
    '</table>'+
    '<p style="font-size:12px;color:#666;margin-top:20px">Mit freundlichen Gr&uuml;&szlig;en,<br><strong style="color:#1a1a1a">Personalabteilung &mdash; '+LE.NAME+'</strong></p>'
  ),'Ihre Bewerbung',refId,
    'Bewerbung f\u00fcr '+data.position+' eingegangen ['+refId+'].');
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
    '<div style="text-align:center;margin-bottom:8px">'+BDG('OFFICIAL APPOINTMENT','#0a0a0a','#C5A059')+'</div>'+
    '<h1 style="font-family:'+_fs+';font-size:22px;color:#1a1a1a;margin:8px 0 4px;text-align:center">Offizielle Ernennung</h1>'+
    '<p style="color:#888;font-size:11px;margin:0 0 24px;text-align:center">Personal-ID: '+empId+'</p>'+
    DIV()+

    '<p>Sehr geehrte/r '+fullName+',</p>'+
    '<p>hiermit best&auml;tigen wir Ihre offizielle Ernennung als <strong style="color:#1a1a1a">'+pos+'</strong> bei '+LE.NAME+'.</p>'+

    SEC('PERSONALDATEN')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Personalnummer',empId,{mono:true,bold:true})+
      TR('Position',pos,{bold:true})+
      TR('Dienstantritt',startDate)+
      TR('Standort',esc(data.location||'Remote'))+
      TR('Vorgesetzter',supName+' (<a href="mailto:'+supEmail+'" style="color:#C5A059;text-decoration:none">'+supEmail+'</a>)')+
    '</table>'+

    SEC('ZUGANGSDATEN')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Aura Hub Portal','<a href="'+hubUrl+'" style="color:#C5A059;text-decoration:none;font-weight:700">'+hubUrl+'</a>')+
      TR('SOP-Handbuch','<a href="'+sopUrl+'" style="color:#C5A059;text-decoration:none">Standard Operating Procedures</a>')+
    '</table>'+

    SEC('COMPLIANCE-DOKUMENTE')+
    '<p style="font-size:12px;color:#444;margin-bottom:12px">Die folgenden Dokumente sind <strong>vor Dienstantritt</strong> zu pr&uuml;fen und digital zu unterzeichnen:</p>'+
    '<table style="width:100%;font-size:12px;color:#444">'+
      '<tr><td style="padding:8px 0;border-bottom:1px solid #eee">&#9744; <a href="'+ndaUrl+'" style="color:#C5A059;text-decoration:none;font-weight:600">Geheimhaltungsvereinbarung (NDA)</a></td></tr>'+
      '<tr><td style="padding:8px 0">&#9744; <a href="'+cocUrl+'" style="color:#C5A059;text-decoration:none;font-weight:600">Verhaltenskodex (Code of Conduct)</a></td></tr>'+
    '</table>'+

    SEC('SICHERHEITSKONTAKT')+
    '<table style="width:100%;border-collapse:collapse">'+
      TR('Security Officer',secName)+
      TR('E-Mail','<a href="mailto:'+secEmail+'" style="color:#C5A059;text-decoration:none">'+secEmail+'</a>')+
      TR('Meldefrist','Sofortige Meldung innerhalb von 4 Stunden bei Sicherheitsvorf&auml;llen')+
    '</table>'+

    CARD(
      '<div style="font-size:11px;color:#DC2626;line-height:1.7;font-weight:600">'+
        'HINWEIS: Jeder Versto&szlig; gegen die Geheimhaltungsvereinbarung oder den Verhaltenskodex f&uuml;hrt zur sofortigen '+
        'Beendigung des Vertragsverh&auml;ltnisses und gegebenenfalls zur zivil- und strafrechtlichen Verfolgung.'+
      '</div>'
    )+

    '<p style="font-size:12px;color:#666;margin-top:24px">Mit vorz&uuml;glicher Hochachtung,<br><strong style="color:#1a1a1a">Personalabteilung &mdash; '+LE.NAME+'</strong></p>'
  ),'Official Appointment',empId,
    'Offizielle Ernennung \u2014 '+pos+' | '+LE.NAME);
  _send(data.email,'Offizielle Ernennung als '+data.position+' \u2014 '+LE.NAME+' ['+empId+']',html,FM.HR);
}


/* ══════════════════════════════════════════════════════
   EXPORT
   ══════════════════════════════════════════════════════ */

window.AuraEmail = {
  CONFIG:  C,
  LEGAL:   LE,
  init:    init,
  test:    testEmail,

  /* Customer */
  sendWelcome:              sendWelcome,
  sendPrimeWelcome:         sendPrimeWelcome,
  sendNewsletterWelcome:    sendNewsletterWelcome,

  /* Finance */
  sendOrderConfirmation:    sendOrderConfirmation,
  sendPaymentConfirmation:  sendPaymentConfirmation,

  /* Verification & Trust */
  sendInspectionStarted:    sendInspectionStarted,
  sendAuraVerified:         sendAuraVerified,

  /* Logistics */
  sendShippingConfirmation: sendShippingConfirmation,
  sendStatusUpdate:         sendStatusUpdate,

  /* Communication */
  sendContactForm:          sendContactForm,

  /* Security */
  sendPasswordReset:        sendPasswordReset,
  verifyResetCode:          verifyResetCode,
  sendPasswordChanged:      sendPasswordChanged,
  sendVerificationCode:     sendVerificationCode,
  verifyCode:               verifyCode,

  /* HR */
  sendCareerApplication:    sendCareerApplication,
  sendOnboarding:           sendOnboarding
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();

})();
