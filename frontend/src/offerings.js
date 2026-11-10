import {html} from './content-store.js';

export function platformLinks(page){
  const links=[['淘宝入口',page.taobaoUrl],['抖音入口',page.douyinUrl]].flatMap(([label,value])=>{
    try{
      const url=new URL(value);
      if(url.protocol!=='https:'||url.username||url.password)return [];
      return [`<a href="${html(url.href)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true">↗</span></a>`];
    }catch{return [];}
  });
  return links.length?`<nav class="platform-links" aria-label="线上平台">${links.join('')}</nav>`:'';
}

export function offeringsPage({page,identifiers,platforms,subhero,icon,arrow,hardware,brands,cta}){
  const solutions=(page.solutionGroups||[]).map((solution,index)=>({...solution,identifier:encodeURIComponent(String(identifiers[index]??''))}));
  return `<main id="main" class="offerings-page">${subhero('',page.heroTitle,page.heroDesc,platforms)}
    ${solutions.map(solution=>`<section class="section offering-section" id="offering-${solution.identifier}"><div class="container">
      <div class="offering-heading"><div>${icon(solution.icon)}<h2>${solution.title}</h2><p>${solution.desc}</p></div><button class="text-link" data-inquiry="${solution.title}">咨询这项业务 ${arrow}</button></div>
      ${solution.key==='servers'?'':`<div class="offering-group-grid">${(solution.groups||[]).map(group=>`<article><h3>${group.title}</h3><ul class="offering-items">${String(group.items||'').split('\n').map(item=>item.trim()).filter(Boolean).map(item=>`<li>${item}</li>`).join('')}</ul></article>`).join('')}</div>`}
      ${solution.key==='servers'?hardware:''}
    </div></section>`).join('')}
    <section class="section soft-section"><div class="container"><h2>${page.deliveryTitle}</h2><div class="steps">${page.steps.map((step,index)=>`<div><span>${String(index+1).padStart(2,'0')}</span><h3>${step.title}</h3><p>${step.desc}</p></div>`).join('')}</div></div></section>
    ${brands}${cta}
  </main>`;
}
