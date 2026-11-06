const multiline=value=>String(value||'').replaceAll('\n','<br>');

// Values arrive escaped by the public content renderer; only layout belongs here.
export function aboutPage({page:x,global:g,images,subhero,icon,arrow,cta}) {
  return `<main id="main" class="about-page">
    ${subhero('',x.heroTitle,x.heroDesc)}
    <section class="section" aria-labelledby="company-intro"><div class="container company-overview">
      <div class="company-intro"><span class="about-label">公司简介</span><h2 id="company-intro">${multiline(x.introTitle)}</h2><p class="company-lead">${x.introLead}</p>${x.introBody.split('\n').filter(Boolean).map(text=>`<p>${text}</p>`).join('')}<a class="text-link" href="#/contact">与我们建立联系 ${arrow}</a></div>
      <aside class="company-visual" aria-label="业务方向">${x.introImage?`<img src="${x.introImage}" alt="公司业务概念示意">`:''}<div><span>${g.name}</span><p>${multiline(x.visualTitle)}</p><small>${x.visualNote}</small></div></aside>
    </div></section>
    <section class="section company-principles"><div class="container"><div class="about-section-heading"><h2>${x.principlesTitle}</h2><p>${x.principlesDesc}</p></div><div class="principle-list">${x.principles.map(item=>`<div><h3>${item.title}</h3><p>${item.desc}</p></div>`).join('')}</div></div></section>
    <section class="section"><div class="container"><div class="about-section-heading"><h2>${x.businessTitle}</h2><p>${x.businessDesc}</p></div><div class="company-business-list">${x.businessAreas.map(item=>`<article>${icon(item.icon)}<div><h3>${item.title}</h3><p>${item.desc}</p><a href="${item.link}" class="text-link">${item.button} ${arrow}</a></div></article>`).join('')}</div></div></section>
    <section class="section company-support"><div class="container company-support-layout"><div class="about-section-heading"><span class="about-label">服务体系</span><h2>${multiline(x.supportTitle)}</h2><p>${x.supportDesc}</p><a class="text-link" href="#/services">查看技术服务 ${arrow}</a></div><div class="support-list">${x.supportAreas.map(item=>`<article><span>${item.label}</span><div><h3>${item.title}</h3><p>${item.desc}</p></div></article>`).join('')}</div></div></section>
    <section class="section company-industries"><div class="container"><div class="about-section-heading"><h2>${x.industryTitle}</h2><p>${x.industryDesc}</p></div><ul aria-label="应用行业">${x.industryNames.split('\n').filter(Boolean).map(name=>`<li>${name}</li>`).join('')}</ul></div></section>
    ${images.length?`<section class="section"><div class="container cms-brand-grid">${images.map(item=>`<figure><img class="cms-detail-image" src="${item.imageUrl}" alt="${item.description}" loading="lazy"><figcaption>${item.description}</figcaption></figure>`).join('')}</div></section>`:''}
    ${cta()}
  </main>`;
}
