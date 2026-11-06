import './style.css';
import './refinements.css';
import './about.css';
import './contact.css';
import { companyContacts, contactPage } from './contact.js';
import { aboutPage as renderAboutPage } from './about.js';
import './cms-site.css';
let categories=[],industries=[],pages={};
const escapeTree=value=>Array.isArray(value)?value.map(escapeTree):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,escapeTree(v)])):typeof value==='string'?escapeContent(value):value;
const multiline=value=>String(value||'').replaceAll('\n','<br>');
import { getContent, loadContent, api, publicRecords, onContentChange, html as escapeContent } from './content-store.js';
let content = getContent();
let products = [];
let services = [];
let contentReady=false,contentChanged=false,refreshPromise,refreshPending=false;
function footerContact() { return `<section class="container footer-contact" aria-label="公司联系方式"><div class="footer-contact-heading"><h2>联系我们</h2><a href="#/contact">查看联系方式 ${arrow}</a></div>${companyContacts(content.settings)}</section>`; }

const paths = { arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', chevron: '<path d="m9 5 7 7-7 7"/>', server: '<rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/><path d="M6 6.5h.01M6 17.5h.01M10 6.5h8M10 17.5h8"/>', chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v5m6-5v5M9 18v5m6-5v5M1 9h5m-5 6h5M18 9h5m-5 6h5"/><path d="M10 10h4v4h-4z"/>', layers: '<path d="m12 2 10 6-10 6L2 8zM2 12l10 6 10-6M2 16l10 6 10-6"/>', shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m8 12 3 3 5-6"/>', activity: '<path d="M2 12h5l3-9 4 18 3-9h5"/>', network: '<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4M5.5 16v-4h13v4"/>', tool: '<path d="M14 6a5 5 0 0 0-6 6L2 18l4 4 6-6a5 5 0 0 0 6-6l-4 3-3-3z"/>', building: '<path d="M4 22V4h10v18m0-14h6v14M2 22h20M7 8h4M7 12h4M7 16h4"/>', check: '<path d="m5 12 4 4L19 6"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>', globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>', home: '<path d="m3 10 9-8 9 8v11H3zM9 21v-8h6v8"/>', file: '<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', plus: '<path d="M12 4v16M4 12h16"/>' };
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.chip}</svg>`;
const arrow = icon('arrow');
const app = document.querySelector('#app');
let currentFilter = 'all';
let miniTab = 'home';
let lastFocus;
const storageKey = 'xgsz-inquiry-receipts-v1';
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function readRequests() {
  try { const data = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(data) ? data.filter(x => x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.intent === 'string' && typeof x.date === 'string') : []; }
  catch { return []; }
}
function brand(light=false) {const g=pages.global;return `<a class="brand ${light?'brand-light':''}" href="#/" aria-label="${g.name}首页"><span class="brand-symbol">${g.logo?`<img src="${g.logo}" alt=""/>`:''}</span><span class="brand-words"><b>${g.name}</b><small>${g.englishName}</small></span></a>`;}
let navItems=[];
function header(route) { return `<a class="skip-link" href="#main">跳至主要内容</a><header class="site-header"><div class="header-inner">${brand()}<nav class="main-nav" aria-label="主导航">${navItems.map(([path, name]) => `<a href="#${path}" ${route === path ? 'aria-current="page"' : ''}>${name}</a>`).join('')}</nav><div class="header-actions"><a class="mini-link" href="#/mini">${icon('phone')}<span>小程序体验</span></a><button class="button button-small" data-inquiry="业务咨询">业务咨询 ${arrow}</button><button class="menu-toggle" aria-label="打开导航" aria-expanded="false">${icon('menu')}</button></div></div></header>`; }
function footer(){const g=pages.global;const basics=publicRecords(content.basicInformation||[]);const basic=basics.find(x=>x.copyright)||{};return `<footer class="site-footer"><div class="container footer-main"><div class="footer-brand">${brand(true)}<p>${multiline(g.footerSlogan)}</p><span class="footer-note">${g.footerNote}</span></div><div><h3>${g.productsNav}</h3>${categories.filter(c=>c.id!=='all').map(c=>`<a href="#/products?category=${c.id}">${c.name}</a>`).join('')}</div><div><h3>${g.servicesNav}</h3>${services.map(x=>`<a href="#/services?service=${x.id}">${x.name}</a>`).join('')}<a href="#/partners">${g.partnersNav}</a><a href="#/about">${g.aboutNav}</a></div><div class="footer-mobile"><span class="mobile-outline">${icon('phone')}</span><h3>${g.mobileTitle}</h3><p>${g.mobileDesc}</p><a href="#/mini">体验小程序原型 ${arrow}</a></div></div>${footerContact()}<div class="container footer-bottom"><span>${basic.copyright||`© ${new Date().getFullYear()} ${g.name}`}</span><span>${g.footerDisclaimer}</span>${basics.map(item=>`${item.icp?`<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">${item.icp}</a>`:''}${item.publicSecurity?`<span>${item.publicSecurity}</span>`:''}${item.beianImage?`<img src="${item.beianImage}" width="20" height="20" alt="备案标志">`:''}`).join('')}<a href="#/about">${g.aboutNav} ${icon('arrow')}</a></div></footer>`;}
function sectionHead(eyebrow, title, desc = '', link = '') { return `<div class="section-head"><div><h2>${title}</h2>${desc ? `<p>${desc}</p>` : ''}</div>${link}</div>`; }
function productArt(kind,label='') {
  return `<div class="product-art art-${kind}" aria-hidden="true"><div class="art-grid"></div><div class="server-stack">${[0, 1, 2].map(i => `<div class="server-unit"><span class="server-grille"></span><span class="server-grille"></span><span class="server-disks"><i></i><i></i><i></i><i></i></span><span class="server-led"></span></div>`).join('')}</div><span class="art-label">${label}</span><span class="art-orbit"></span></div>`;
}
function productCard(p){return `<article class="product-card">${p.coverImage?`<img class="cms-product-cover" src="${p.coverImage}" alt="${p.name}" loading="lazy">`:productArt(p.kind,p.en||p.name)}<div class="product-body"><span class="product-tag">${p.tag}</span><h3>${p.name}</h3><p>${p.desc}</p><div class="product-bottom"><span>${p.brand||p.uses}</span><button data-product="${p.id}" aria-label="了解配置">了解配置 ${arrow}</button></div></div></article>`;}
function categoryTabs() { return `<div class="category-tabs" role="tablist" aria-label="产品类别">${categories.map(c => `<button role="tab" aria-selected="${c.id === currentFilter}" data-filter="${c.id}">${c.name}</button>`).join('')}</div>`; }
function cta(){const g=pages.global;return `<section class="cta-section"><div class="container cta-inner"><div><h2>${g.ctaTitle}</h2><p>${g.ctaDesc}</p></div><div class="cta-actions"><button class="button" data-inquiry="方案咨询">${g.ctaButton} ${arrow}</button><a class="text-link" href="#/contact">直接联系我们 ${arrow}</a></div></div></section>`;}
function homePage(){const x=pages.home;const slides=publicRecords(content.carousels||[]);const image=slides[0]?.imageUrl||x.heroImage;const recommended=(content.productCarousels||[]).flatMap(group=>group.products||[]);const picks=products.filter(p=>recommended.includes(p.productId));return `<main id="main"><section class="hero">${image?`<img id="hero-image" class="cms-hero-image" src="${image}" alt="">`:''}<div class="container hero-inner"><div class="hero-copy"><div class="hero-eyebrow"><span></span>${x.heroEyebrow}</div><h1>${multiline(x.heroTitle)}</h1><p>${multiline(x.heroDesc)}</p><div class="hero-buttons"><a class="button" href="#/products">${x.heroButton} ${arrow}</a><button class="button button-outline" data-inquiry="技术咨询">${x.heroConsult} ${arrow}</button></div></div><div class="hero-bottom"><div><b>${x.heroNote}</b>${slides.length?`<a id="hero-slide-link" href="${slides[0].redirectUrl||'#/'}">${slides[0].title}</a><div class="cms-slide-controls" role="group" aria-label="首页轮播">${slides.map((slide,i)=>`<button type="button" data-slide="${i}" aria-label="查看轮播：${slide.title}" aria-pressed="${i===0}">${i+1}</button>`).join('')}</div>`:''}</div><a href="#home-products">向下探索 <span>↓</span></a></div></div></section><section class="capability-strip"><div class="container">${x.capabilities.map(item=>`<a href="${item.link}">${icon(item.icon)}<div><h2>${item.title}</h2><p>${item.desc}</p></div>${icon('chevron')}</a>`).join('')}</div></section><section class="section products-section" id="home-products"><div class="container">${sectionHead('',x.productsTitle,x.productsDesc,`<a class="text-link" href="#/products">全部产品 ${arrow}</a>`)}${categoryTabs()}<div class="product-grid" id="product-grid">${products.map(productCard).join('')}</div><p class="caption">${pages.global.productDisclaimer}</p></div></section>${picks.length?`<section class="section soft-section"><div class="container">${sectionHead('',pages.global.recommendTitle)}<div class="product-grid">${picks.map(productCard).join('')}</div></div></section>`:''}<section class="section services-home"><div class="container services-layout"><div class="service-visual"><h2>${multiline(x.servicesVisualTitle)}</h2><p>${x.servicesVisualDesc}</p><div class="core-diagram" aria-hidden="true"><div class="core-ring ring-one"></div><div class="core-ring ring-two"></div><div class="core-chip">${icon('chip')}<span>${pages.global.englishName}</span></div></div><a href="#/services">了解技术服务 ${arrow}</a></div><div class="service-list">${sectionHead('',x.servicesTitle,x.servicesDesc)}${services.map(item=>`<a class="service-row" href="#/services?service=${item.id}"><div><h3>${item.name}</h3><p>${item.desc}</p></div>${icon(item.icon)}${arrow}</a>`).join('')}</div></div></section>${industries.length?`<section class="section industry-section"><div class="container">${sectionHead('',x.industriesTitle,x.industriesDesc)}<div class="industry-tabs" role="tablist" aria-label="应用场景">${industries.map((item,i)=>`<button role="tab" data-industry="${i}" aria-selected="${i===0}">${icon(item.icon)}${item.name}</button>`).join('')}</div><div id="industry-panel">${industryPanel(0)}</div></div></section>`:''}${brandSections()}${cta()}</main>`;}
function industryPanel(index){const x=industries[index];if(!x)return '';return `<div class="industry-panel"><div class="industry-art" aria-hidden="true">${icon(x.icon)}<div class="industry-cross"></div></div><div class="industry-copy"><h3>${x.title}</h3><p>${x.desc}</p><div class="tags">${x.tags.split('/').filter(Boolean).map(t=>`<span>${t.trim()}</span>`).join('')}</div><button class="text-link" data-inquiry="${x.name}方案咨询">交流场景需求 ${arrow}</button></div></div>`;}
function subhero(en,title,desc){return `<section class="subhero"><div class="container"><a class="page-crumb" href="#/">首页</a><span class="crumb-separator"> / </span><span class="page-crumb">${pages.global.name}</span><h1>${multiline(title)}</h1><p>${multiline(desc)}</p></div><div class="subhero-orbit" aria-hidden="true"></div></section>`;}
function productsPage(){const x=pages.products;return `<main id="main">${subhero('',x.heroTitle,x.heroDesc)}<section class="section"><div class="container">${categoryTabs()}<div class="product-grid" id="product-grid">${products.filter(p=>currentFilter==='all'||p.category===currentFilter).map(productCard).join('')}</div><p class="caption">${x.disclaimer}</p></div></section><section class="section soft-section"><div class="container">${sectionHead('',x.deliveryTitle)}<div class="steps">${x.steps.map((item,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><h3>${item.title}</h3><p>${item.desc}</p></div>`).join('')}</div></div></section>${brandSections()}${cta()}</main>`;}
function servicesPage(query){const x=pages.services;const selected=query.get('service')||services[0]?.id;return `<main id="main">${subhero('',x.heroTitle,x.heroDesc)}<section class="section"><div class="container service-detail-list">${services.map(item=>`<details class="service-detail" id="service-${item.id}" ${selected===item.id?'open':''}><summary><span class="detail-icon">${icon(item.icon)}</span><div><h2>${item.name}</h2></div>${icon('plus')}</summary><div class="service-detail-content"><p>${item.desc}</p><div class="service-items">${item.items.map(line=>`<div>${icon('check')}${line}</div>`).join('')}</div><p class="detail-note">${item.note}</p><button class="text-link" data-inquiry="${item.name}">咨询这项服务 ${arrow}</button></div></details>`).join('')}</div></section><section class="service-assurance"><div class="container"><div>${icon('shield')}<h2>${x.assuranceTitle}</h2></div><p>${multiline(x.assuranceDesc)}</p></div></section>${cta()}</main>`;}
function partnersPage(){const x=pages.partners;return `<main id="main">${subhero('',x.heroTitle,x.heroDesc)}<section class="section"><div class="container">${sectionHead('',x.sectionTitle,x.sectionDesc)}<div class="partner-grid">${publicRecords(content.businesses||[]).map(item=>`<div class="partner-card">${icon('network')}<h3>${item.name}</h3><p>${item.description}</p><span>${item.contactInfo}</span></div>`).join('')}</div></div></section><section class="section partner-invite"><div class="container"><h2>${x.inviteTitle}</h2><p>${multiline(x.inviteDesc)}</p><button class="button" data-inquiry="合作伙伴申请">${x.inviteButton} ${arrow}</button><small>${x.disclaimer}</small></div></section></main>`;}
function aboutPage(){return renderAboutPage({page:pages.about,global:pages.global,images:publicRecords(content.abouts||[]),subhero,icon,arrow,cta});}
function miniPage(){const x=pages.mini;return `<main class="mini-stage" id="main"><div class="mini-intro"><a class="text-link" href="#/">← 返回官网</a><h1>${multiline(x.heroTitle)}</h1><p>${multiline(x.heroDesc)}</p><span class="prototype-note">浏览器交互原型 · 非已上线微信小程序</span></div><div class="mini-device"><div class="mini-status"><span>${pages.global.name}</span><span>● ··· ◯</span></div><div class="mini-screen">${miniContent()}</div><nav class="mini-nav" aria-label="小程序导航">${[['home','home','首页'],['services','shield','服务'],['requests','file','我的需求']].map(([tab,i,name])=>`<button data-mini-tab="${tab}" aria-current="${miniTab===tab?'page':'false'}">${icon(i)}${name}</button>`).join('')}</nav></div></main>`;}
function miniContent() { if (miniTab === 'requests') { const requests = readRequests(); return `<div class="mini-page"><span class="eyebrow">MY REQUESTS</span><h2>我的需求单</h2><p>此处显示当前浏览器保存的提交回执；处理情况由工作人员联系确认。</p>${requests.length ? requests.map(x => `<div class="mini-request"><span>${escapeHTML(x.date)}</span><h3>${escapeHTML(x.intent)}</h3><p>${escapeHTML(x.company || x.name)}</p><button class="text-link" data-export="${escapeHTML(x.id)}">导出需求单 ${icon('download')}</button></div>`).join('') : `<div class="mini-empty">${icon('file')}<h3>还没有提交回执</h3><p>可以先浏览产品，再整理需求。</p></div>`}<button class="button" data-inquiry="移动端业务咨询">新增需求 ${icon('plus')}</button></div>`; }
  if (miniTab === 'services') return `<div class="mini-page"><span class="eyebrow">TECHNOLOGY & SERVICES</span><h2>${pages.mini.servicesTitle}</h2><p>${pages.mini.servicesDesc}</p>${services.map(s => `<button class="mini-service" data-service="${s.id}">${icon(s.icon)}<span><b>${s.name}</b><small>${s.items[0] || s.desc}</small></span>${icon('chevron')}</button>`).join('')}</div>`;
  return `<div class="mini-hero"><span class="eyebrow">${pages.global.englishName}</span><h2>${multiline(pages.mini.homeTitle)}</h2><p>${pages.mini.homeDesc}</p><button class="button button-small" data-inquiry="移动端方案咨询">获取方案 ${arrow}</button></div><div class="mini-page"><h3>发现算力产品 <span>PRODUCTS</span></h3>${products.map(p => `<button class="mini-product" data-product="${p.id}"><span class="mini-product-icon">${icon(p.icon)}</span><span><b>${p.name}</b><small>${p.tag}</small></span>${icon('chevron')}</button>`).join('')}<div class="mini-info">${icon('shield')}${pages.mini.homeNote}</div></div>`;
}
function render({preserveView=false}={}) {
  const [route, search = ''] = (location.hash.slice(1) || '/').split('?'); const query = new URLSearchParams(search);
  const previousScroll=window.scrollY;
  const selected=preserveView?currentFilter:query.get('category');
  currentFilter = categories.some(c => c.id === selected) ? selected : 'all';
  closeDialog();
  document.body.classList.toggle('is-mini', route === '/mini');
  const pageRenderers = { '/': homePage, '/products': productsPage, '/services': () => servicesPage(query), '/partners': partnersPage, '/about': aboutPage, '/contact': () => contactPage({settings:content.settings,page:pages.contact,global:pages.global,subhero,arrow}), '/mini': miniPage };
  app.innerHTML = route === '/mini' ? miniPage() : `${header(route)}${(pageRenderers[route] || homePage)()}${footer()}`;
  const title = navItems.find(([path]) => path === route)?.[1] || (route === '/mini' ? '小程序体验' : '首页');
  document.title = `${title} · ${content.pages.global.name}`;
  window.scrollTo({ top: preserveView?previousScroll:0, behavior: 'instant' });
}
function showDialog(title, content, cls = '') {
  closeDialog(); lastFocus = document.activeElement;
  const dialog = document.createElement('dialog'); dialog.className = `modal ${cls}`;
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.innerHTML = `<button class="modal-close" aria-label="关闭弹窗">${icon('close')}</button><div class="modal-inner"><h2 id="dialog-title">${title}</h2>${content}</div>`;
  document.body.append(dialog); dialog.showModal(); document.body.classList.add('modal-open');
  dialog.addEventListener('cancel', () => { document.body.classList.remove('modal-open'); });
  dialog.addEventListener('click', e => { if (e.target === dialog && (e.clientX < dialog.getBoundingClientRect().left || e.clientX > dialog.getBoundingClientRect().right || e.clientY < dialog.getBoundingClientRect().top || e.clientY > dialog.getBoundingClientRect().bottom)) closeDialog(); });
  dialog.addEventListener('close', () => { dialog.remove(); if (!document.querySelector('dialog[open]')) { document.body.classList.remove('modal-open');renderUpdatedContent();restoreFocus(lastFocus); } });
}
function restoreFocus(previous){
  if(!previous)return;
  if(previous.isConnected){previous.focus({preventScroll:true});return;}
  const key=['data-inquiry','data-product','data-service','data-mini-tab','data-filter','href','aria-label'].find(key=>previous.hasAttribute(key));
  const replacement=key?[...app.querySelectorAll(previous.tagName)].find(element=>element.getAttribute(key)===previous.getAttribute(key)):null;
  const target=replacement||document.querySelector('#main');if(target){if(!replacement)target.tabIndex=-1;target.focus({preventScroll:true});}
}
function closeDialog() { const dialog = document.querySelector('dialog'); if (dialog) { dialog.close(); dialog.remove(); } document.body.classList.remove('modal-open'); }
function showProduct(id) { const p = products.find(x => x.id === id); if (!p) return; showDialog(p.name, `${p.coverImage?`<img class="cms-detail-image" src="${p.coverImage}" alt="${p.name}">`:productArt(p.kind,p.en||p.name)}<p>${p.desc}</p>${p.detailImages.map(url=>`<img class="cms-detail-image" src="${url}" alt="${p.name}详情" loading="lazy">`).join('')}<ul class="feature-list">${p.features.map(x => `<li>${icon('check')}${x}</li>`).join('')}</ul><div class="detail-note">适用方向：${p.uses}<br>${pages.global.detailDisclaimer}</div><button class="button" data-inquiry="${p.name}">咨询整机方案 ${arrow}</button>`); }
function showService(id) { const s = services.find(x => x.id === id); if (!s) return; showDialog(s.name, `<p>${s.desc}</p><ul class="feature-list">${s.items.map(x => `<li>${icon('check')}${x}</li>`).join('')}</ul><p class="detail-note">${s.note}</p><button class="button" data-inquiry="${s.name}">整理服务需求 ${arrow}</button>`); }
function showInquiry(intent) { showDialog('聊聊您的需求', `<section class="direct-contact-panel" aria-label="直接联系企业">${companyContacts(content.settings,{compact:true})}</section><p class="modal-lead">也可以留下需求，方便我们进一步沟通。</p><div class="demo-notice">提交后，您的联系信息与需求将保存到${pages.global.name}业务后台，用于本次业务沟通。</div><form id="inquiry-form"><div class="form-grid"><label>您的称呼<input name="name" required maxlength="40" autocomplete="name" placeholder="怎么称呼您" /></label><label>联系电话<input name="phone" required maxlength="24" type="tel" pattern="[+]?[0-9]{7,20}" title="请输入7至20位数字，可在开头添加国际区号加号" autocomplete="tel" placeholder="方便后续联系的号码" /></label></div><label>公司名称<input name="company" required maxlength="100" autocomplete="organization" placeholder="您的公司或团队" /></label><label>咨询方向<select name="intent">${[...new Set([intent, ...content.products.filter(x => x.published !== false).map(x => x.name), ...content.services.filter(x => x.published !== false).map(x => x.name), '合作伙伴申请', '其他业务咨询'])].map(x => `<option>${escapeHTML(x)}</option>`).join('')}</select></label><label>需求描述<textarea name="message" required maxlength="2000" rows="3" placeholder="例如：应用场景、算力规模、部署计划或合作方向"></textarea></label><label class="check-label"><input type="checkbox" required name="consent" />我同意将填写的信息用于本次业务联系</label><p id="form-error" class="form-error" role="alert"></p><button class="button full-width" type="submit">提交需求 ${arrow}</button></form>`, 'inquiry-modal'); }
function exportRequest(id) { const req = readRequests().find(x => x.id === id); if (!req) return; const blob = new Blob([JSON.stringify(req, null, 2)], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${content.pages.global.name}-需求单-${req.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
document.addEventListener('click', e => {
  const trigger = e.target.closest('button, a'); if (!trigger) return;
  if (trigger.matches('.skip-link')) { e.preventDefault(); const main = document.querySelector('#main'); main.tabIndex = -1; main.focus({ preventScroll: true }); main.scrollIntoView({ behavior: 'instant' }); return; }
  if (trigger.getAttribute('href') === '#home-products') { e.preventDefault(); document.querySelector('#home-products')?.scrollIntoView({ behavior: 'smooth' }); return; }
  if (trigger.hasAttribute('data-view-requests')) { closeDialog(); miniTab = 'requests'; if (location.hash === '#/mini') { e.preventDefault(); render(); } }
  if (trigger.matches('.menu-toggle')) { const open = trigger.getAttribute('aria-expanded') !== 'true'; trigger.setAttribute('aria-expanded', String(open)); trigger.setAttribute('aria-label', open ? '关闭导航' : '打开导航'); document.querySelector('.main-nav').classList.toggle('nav-open', open); trigger.innerHTML = icon(open ? 'close' : 'menu'); }
  if (trigger.matches('.modal-close')) closeDialog();
  if (trigger.hasAttribute('data-contact-details')) { closeDialog(); if (location.hash.split('?')[0] === '#/contact') { e.preventDefault(); document.querySelector('.contact-surface')?.scrollIntoView({ behavior: 'smooth' }); } return; }
  if (trigger.dataset.inquiry) showInquiry(trigger.dataset.inquiry);
  if (trigger.dataset.product) showProduct(trigger.dataset.product);
  if (trigger.dataset.service) showService(trigger.dataset.service);
  if (trigger.dataset.filter) { currentFilter = trigger.dataset.filter; document.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.filter === currentFilter))); document.querySelector('#product-grid').innerHTML = products.filter(x => currentFilter === 'all' || x.category === currentFilter).map(productCard).join(''); }
  if(trigger.dataset.slide!==undefined){const slide=content.carousels[Number(trigger.dataset.slide)];const image=document.querySelector('#hero-image'),link=document.querySelector('#hero-slide-link');if(slide&&image&&link){image.src=slide.imageUrl;link.textContent=slide.title;link.href=slide.redirectUrl||'#/';document.querySelectorAll('[data-slide]').forEach(x=>x.setAttribute('aria-pressed',String(x===trigger)));}}
  if (trigger.dataset.industry !== undefined) { document.querySelectorAll('[data-industry]').forEach(x => x.setAttribute('aria-selected', String(x === trigger))); document.querySelector('#industry-panel').innerHTML = industryPanel(trigger.dataset.industry); }
  if (trigger.dataset.miniTab) { miniTab = trigger.dataset.miniTab; app.innerHTML = miniPage(); }
  if (trigger.dataset.export) exportRequest(trigger.dataset.export);
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'inquiry-form') return; e.preventDefault();
  const data = new FormData(e.target);
  if (!String(data.get('name')).trim() || !String(data.get('company')).trim() || !String(data.get('message')).trim()) { document.querySelector('#form-error').textContent = '请填写称呼、公司名称和需求描述，不能仅输入空格。'; return; }
  const button = e.target.querySelector('button[type="submit"]');
  button.disabled = true; button.textContent = '正在提交…';
  document.querySelector('#form-error').textContent = '';
  try {
    const payload = { name:String(data.get('name')).trim(), phone:String(data.get('phone')).trim(), company:String(data.get('company')).trim(), intent:String(data.get('intent')), message:String(data.get('message')).trim(), consent:data.get('consent') === 'on' };
    const receipt = await api('/public/inquiries',{method:'POST',body:JSON.stringify(payload)});
    const request = {...receipt,name:payload.name,company:payload.company,intent:payload.intent};
    try { localStorage.setItem(storageKey,JSON.stringify([request,...readRequests()].slice(0,50))); } catch { /* Server persistence succeeded; local receipt storage is optional. */ }
    showDialog('需求已提交', `<div class="success-icon">${icon('check')}</div><p>需求已保存到业务后台。请保留回执编号，工作人员可在后台查看并处理本次需求。</p><div class="request-summary"><b>${escapeHTML(request.intent)}</b><span>${escapeHTML(request.company)}</span><small>回执编号：${escapeHTML(request.id)}</small></div><button class="button full-width" id="download-receipt">导出提交回执 ${icon('download')}</button><a class="success-link" href="#/mini" data-view-requests>查看我的需求 ${arrow}</a>`);
    document.querySelector('#download-receipt')?.addEventListener('click',() => downloadReceipt(request));
  } catch(error) { const errorNode=document.querySelector('#form-error'); if(errorNode)errorNode.textContent=error.message; }
  finally { if(button.isConnected) { button.disabled=false;button.innerHTML=`提交需求 ${arrow}`; } }
  miniTab = 'requests';
});
document.addEventListener('keydown', e => {
  const tab = e.target.closest('[role="tab"]');
  if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault(); const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')]; const index = tabs.indexOf(tab); const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].focus(); tabs[next].click();
});
window.addEventListener('hashchange', () => { if (location.hash === '#home-products') { document.querySelector('#home-products')?.scrollIntoView({ behavior: 'smooth' }); return; } if(contentReady){render();refreshPublicContent();} });
function applyContent(next){
  const nextProducts=publicRecords(next.products),nextServices=publicRecords(next.services),nextPages=escapeTree(next.pages);
  const nextCategories=[{id:'all',name:'全部产品'},...publicRecords(next.categories).map(category=>({id:category.key,name:category.name}))];
  const nextNavigation=[['/','首页'],['/products',nextPages.global.productsNav],['/services',nextPages.global.servicesNav],['/partners',nextPages.global.partnersNav],['/about',nextPages.global.aboutNav],['/contact',nextPages.global.contactNav]];
  document.querySelector('meta[name="description"]').content=next.pages.home.heroDesc.replaceAll('\n',' ');
  let favicon=document.querySelector('link[rel="icon"]');
  if(next.pages.global.logo){if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.append(favicon);}favicon.href=next.pages.global.logo;favicon.removeAttribute('type');}else favicon?.remove();
  content=next;products=nextProducts;services=nextServices;pages=nextPages;categories=nextCategories;industries=nextPages.home.industries;navItems=nextNavigation;
}
function renderUpdatedContent(){if(contentChanged&&!document.querySelector('dialog[open]')){render({preserveView:true});contentChanged=false;}}
function refreshPublicContent(){
  if(!contentReady||document.hidden)return;
  if(refreshPromise){refreshPending=true;return refreshPromise;}
  refreshPromise=(async()=>{
    do{
      refreshPending=false;
      try{const next=await loadContent();if(JSON.stringify(next)!==JSON.stringify(content)){applyContent(next);contentChanged=true;}renderUpdatedContent();}
      catch(error){console.warn('官网内容暂未更新，将自动重试。',error);}
    }while(refreshPending&&!document.hidden);
  })().finally(()=>{refreshPromise=null;});
  return refreshPromise;
}
window.addEventListener('focus',refreshPublicContent);
document.addEventListener('visibilitychange',refreshPublicContent);
onContentChange(refreshPublicContent);
setInterval(refreshPublicContent,30000);
async function boot() {
  app.innerHTML = '<div class="loading-screen" role="status">正在加载官网…</div>';
  try {applyContent(await loadContent());contentReady=true;render();}
  catch(error) { app.innerHTML = `<main class="connection-error"><h1>暂时无法加载官网</h1><p role="alert">${escapeHTML(error.message)}</p><button class="button" id="retry-connection">重新加载</button></main>`; document.querySelector('#retry-connection').addEventListener('click',boot); }
}
function downloadReceipt(request) { const url=URL.createObjectURL(new Blob([JSON.stringify(request,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${content.pages.global.name}-提交回执-${request.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
boot();

function brandSections(){const g=pages.global;const brands=publicRecords(content.brands||[]),certificates=publicRecords(content.certificates||[]);return `${brands.length?`<section class="section cms-brands"><div class="container">${sectionHead('',g.brandsTitle)}<div class="cms-brand-grid">${brands.map(item=>`<article>${item.logo?`<img src="${item.logo}" alt="${item.name}" loading="lazy">`:''}<h3>${item.name}</h3><p>${item.description}</p></article>`).join('')}</div></div></section>`:''}${certificates.length?`<section class="section"><div class="container">${sectionHead('',g.certificatesTitle)}<div class="cms-brand-grid">${certificates.map(item=>`<article>${item.imageUrl?`<a href="${item.imageUrl}" target="_blank" rel="noopener"><img src="${item.imageUrl}" alt="${item.name}" loading="lazy"></a>`:''}<h3>${item.name}</h3><p>${item.description}</p></article>`).join('')}</div></div></section>`:''}`;}
