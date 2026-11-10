const multiline=value=>String(value||'').replaceAll('\n','<br>');
const milestoneTag=item=>item.tag||'项目动态';

// Values arrive escaped by the public content renderer; only layout belongs here.
export function aboutPage({page:x,global:g,images,subhero,icon,arrow,cta}) {
  const milestones=x.milestones||[];
  const milestoneAnnouncer=milestones.length?`<aside class="hero-milestone-announcer" data-milestone-announcer aria-label="项目动态">
    <div class="hero-announcer-head"><div><span class="hero-announcer-label"><i></i>项目动态</span><small>交付 · 优化 · 服务</small></div><a href="#/about" data-scroll-milestones>查看全部 ${icon('arrow')}</a></div>
    <div class="hero-announcer-window">${milestones.map((item,index)=>`<article class="hero-announcer-slide ${index===0?'is-active':''}" aria-hidden="${index===0?'false':'true'}"><div class="hero-announcer-meta"><time datetime="${item.date}">${item.date}</time><span>${milestoneTag(item)}</span></div><h2>${item.title}</h2><p>${multiline(item.desc)}</p></article>`).join('')}</div>
    <div class="hero-announcer-foot"><span class="hero-announcer-count"><b data-announcer-current>01</b> / ${String(milestones.length).padStart(2,'0')}</span>${milestones.length>1?`<div class="hero-announcer-controls"><button type="button" data-announcer-toggle aria-label="暂停自动播报" title="暂停自动播报">${icon('pause','announcer-pause')}${icon('play','announcer-play')}</button><button type="button" data-announcer-prev aria-label="上一条动态">${icon('chevron')}</button><button type="button" data-announcer-next aria-label="下一条动态">${icon('chevron')}</button></div>`:''}</div>
  </aside>`:'';
  return `<main id="main" class="about-page">
    ${subhero('',x.heroTitle,x.heroDesc,milestoneAnnouncer,'about-subhero')}
    <section class="section" aria-labelledby="company-intro"><div class="container company-overview">
      <div class="company-intro"><span class="about-label">公司简介</span><h2 id="company-intro">${multiline(x.introTitle)}</h2><p class="company-lead">${x.introLead}</p>${x.introBody.split('\n').filter(Boolean).map(text=>`<p>${text}</p>`).join('')}<a class="text-link" href="#/contact">与我们建立联系 ${arrow}</a></div>
      <aside class="company-visual" aria-label="业务方向">${x.introImage?`<img src="${x.introImage}" alt="公司业务概念示意">`:''}<div><span>${g.name}</span><p>${multiline(x.visualTitle)}</p><small>${x.visualNote}</small></div></aside>
    </div></section>
    ${milestones.length?`<section class="section company-milestones" id="company-milestones" aria-labelledby="milestones-title"><div class="container"><div class="about-section-heading"><h2 id="milestones-title">${x.milestonesTitle}</h2><p>${x.milestonesDesc}</p></div>
      <div class="milestone-history"><div class="milestone-history-head"><span>完整动态</span><small>按时间倒序更新</small></div><ol class="project-timeline">${milestones.map((item,index)=>`<li><div class="milestone-when"><time datetime="${item.date}">${item.date}</time><span>${milestoneTag(item)}</span></div><div><h3>${item.title}${index===0?'<em>最新</em>':''}</h3><p>${multiline(item.desc)}</p></div></li>`).join('')}</ol></div>
    </div></section>`:''}
    <section class="section company-principles"><div class="container"><div class="about-section-heading"><h2>${x.principlesTitle}</h2><p>${x.principlesDesc}</p></div><div class="principle-list">${x.principles.map(item=>`<div><h3>${item.title}</h3><p>${item.desc}</p></div>`).join('')}</div></div></section>
    ${images.length?`<section class="section"><div class="container cms-brand-grid">${images.map(item=>`<figure><img class="cms-detail-image" src="${item.imageUrl}" alt="${item.description}" loading="lazy"><figcaption>${item.description}</figcaption></figure>`).join('')}</div></section>`:''}
    ${cta()}
  </main>`;
}
