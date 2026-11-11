import {test,expect} from '@playwright/test';
import {manager} from './support.js';

async function client(page){
  const state=(await (await page.request.get('/api/auth/session')).json()).data;
  return async(path,method='GET',data)=>{
    const response=await page.request.fetch(`/api${path}`,{method,headers:{'X-CSRF-TOKEN':state.csrf},...(data?{data}:{})});
    expect(response.ok(),`${method} ${path}: ${await response.text()}`).toBe(true);
    return (await response.json()).data;
  };
}

test('后台新增修改和上下架自动更新已打开的官网，保留筛选和咨询输入',async({page,context})=>{
  await manager(page);const call=await client(page);const visitor=await context.newPage();
  await visitor.goto('/#/products');await visitor.getByRole('tab',{name:'GPU 服务器',exact:true}).click();
  let product;
  try{
    await page.goto('/admin.html#/products');await page.getByRole('button',{name:'新增产品',exact:true}).click();
    await page.getByLabel('产品名称').fill('后台同步验收整机');await page.getByLabel('产品简介').fill('后台新增后在已打开官网展示');
    await page.getByRole('combobox',{name:'产品分类',exact:true}).selectOption({label:'GPU 服务器'});
    await page.getByRole('button',{name:'保存产品',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
    product=(await call('/admin/content')).products.find(row=>row.name==='后台同步验收整机');
    await expect(visitor.getByRole('heading',{name:product.name,exact:true})).toBeVisible();
    await expect(visitor.getByRole('tab',{name:'GPU 服务器',exact:true})).toHaveAttribute('aria-selected','true');
    await visitor.getByRole('button',{name:'业务咨询',exact:true}).click();await visitor.getByLabel('您的称呼').fill('保留未提交称呼');
    const row=page.getByRole('row').filter({hasText:product.name});await row.getByRole('button',{name:'编辑',exact:true}).click();
    await page.getByLabel('产品名称').fill('后台同步更新后的整机');await page.getByRole('button',{name:'保存产品',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(visitor.getByLabel('您的称呼')).toHaveValue('保留未提交称呼');
    await visitor.getByRole('button',{name:'关闭弹窗',exact:true}).click();
    await expect(visitor.getByRole('heading',{name:'后台同步更新后的整机',exact:true})).toBeVisible();
    await expect(visitor.getByRole('button',{name:'业务咨询',exact:true})).toBeFocused();
    const updated=page.getByRole('row').filter({hasText:'后台同步更新后的整机'});await updated.getByRole('button',{name:'下架',exact:true}).click();
    await expect(visitor.getByRole('heading',{name:'后台同步更新后的整机',exact:true})).toHaveCount(0);
    await updated.getByRole('button',{name:'上架',exact:true}).click();
    await expect(visitor.getByRole('heading',{name:'后台同步更新后的整机',exact:true})).toBeVisible();
    await updated.getByRole('button',{name:'删除',exact:true}).click();await page.getByRole('button',{name:'确认删除',exact:true}).click();
    await expect(visitor.getByRole('heading',{name:'后台同步更新后的整机',exact:true})).toHaveCount(0);
    product=null;
  }finally{
    if(product){const current=(await call('/admin/content')).products.find(row=>row.id===product.id);if(current)await call(`/admin/products/${current.id}?version=${current.version}`,'DELETE');}
    await visitor.close();
  }
});

test('另一浏览器保存页面后，官网切回和定时更新能读取新内容',async({page,browser})=>{
  await manager(page);const call=await client(page);const original=await call('/admin/pages/services');
  const visitorContext=await browser.newContext();const visitor=await visitorContext.newPage();
  try{
    await visitor.clock.install();
    await visitor.goto('http://127.0.0.1:18080/#/services');await expect(visitor.locator('h1')).toBeVisible();
    await call('/admin/pages/services','PUT',{...original,heroTitle:'切回页面读取后台新标题'});
    await visitor.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await expect(visitor.locator('h1')).toHaveText('切回页面读取后台新标题');
    const current=await call('/admin/pages/services');await call('/admin/pages/services','PUT',{...current,heroTitle:'定时读取后台最新标题'});
    await visitor.evaluate(()=>{
      const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
      Object.defineProperty(Element.prototype,'innerHTML',{...descriptor,set(value){if(this.id==='app'){Object.defineProperty(Element.prototype,'innerHTML',descriptor);throw Error('模拟一次渲染中断');}descriptor.set.call(this,value);}});
    });
    await visitor.clock.runFor(61000);
    await expect(visitor.locator('h1')).toHaveText('定时读取后台最新标题');
  }finally{
    const current=await call('/admin/pages/services');await call('/admin/pages/services','PUT',{...original,version:current.version});
    await visitorContext.close();
  }
});

test('后台批量添加长文案与横竖图片后，官网各栏目自适应且页首内容不重叠',async({page,context},testInfo)=>{
  test.setTimeout(240000);await manager(page);const call=await client(page);const cleanup=[];
  const home=await call('/admin/pages/home');const global=await call('/admin/pages/global');const about=await call('/admin/pages/about');
  const visitor=await context.newPage();const errors=[];visitor.on('pageerror',error=>errors.push(error.message));
  const token='EnterpriseComputingPlatform'.repeat(3),description='详细介绍与交付范围，结合实际业务沟通确认。'.repeat(15);
  async function catalog(kind,data){const row=await call(`/admin/catalog/${kind}`,'POST',data);cleanup.push(async()=>{const latest=(await call(`/admin/catalog/${kind}`)).find(item=>item.id===row.id);if(latest)await call(`/admin/catalog/${kind}/${row.id}?version=${latest.version}`,'DELETE');});return row;}
  async function content(kind,data){const row=await call(`/admin/${kind}`,'POST',data);cleanup.push(async()=>{const latest=(await call('/admin/content'))[kind].find(item=>item.id===row.id);if(latest)await call(`/admin/${kind}/${row.id}?version=${latest.version}`,'DELETE');});return kind==='products'?(await call('/admin/content')).products.find(item=>item.id===row.id):row;}
  try{
    const image=Buffer.from(await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=80;canvas.height=1200;return canvas.toDataURL('image/png').split(',')[1];}),'base64');
    const state=(await(await page.request.get('/api/auth/session')).json()).data;
    const response=await page.request.post('/api/admin/media',{headers:{'X-CSRF-TOKEN':state.csrf},multipart:{file:{name:'portrait.png',mimeType:'image/png',buffer:image}}});expect(response.status()).toBe(201);const portrait=(await response.json()).data.url;
    const category=await catalog('categories',{name:token,description,enabled:true});
    const products=[];
    for(let index=0;index<7;index++)products.push(await content('products',{name:`产品${index}${token}`,desc:description,category:category.key,tag:token,features:[token,description],uses:token,brand:token,coverImage:index%2?portrait:'/assets/datacenter-hero.webp',published:true}));
    for(let index=0;index<3;index++){
      await content('services',{name:`服务${index}${token}`,desc:description,items:[token,description],note:description,icon:'shield',published:true});
      await catalog('brands',{name:`品牌${index}${token}`,description,logo:portrait});
      await catalog('certificates',{name:`证书${index}${token}`,description,imageUrl:portrait});
      await catalog('businesses',{name:`合作${index}${token}`,description,contactInfo:token});
      const slide=await page.request.post('/api/admin/media',{headers:{'X-CSRF-TOKEN':state.csrf},multipart:{file:{name:`slide-${index}.png`,mimeType:'image/png',buffer:image}}});expect(slide.status()).toBe(201);
      await catalog('carousels',{title:`轮播${index}${token}`,order:index,imageUrl:(await slide.json()).data.url,redirectUrl:'#/products',enabled:true});
      await catalog('abouts',{description,imageUrl:portrait});
    }
    await catalog('productCarousels',{products:products.map(product=>product.productId)});
    await call('/admin/pages/home','PUT',{...home,heroTitle:Array(5).fill('根据业务需求提供适配的服务器与算力方案').join('\n'),heroDesc:description,heroNote:token,industries:[...home.industries,{name:token,title:token,desc:description,tags:token,icon:'chip'}]});
    await call('/admin/pages/global','PUT',{...global,name:'芯光智数企业算力技术服务有限公司',englishName:token,ctaTitle:token,ctaDesc:description,productsNav:'产品与算力解决方案展示中心',servicesNav:'部署优化与运维技术服务'});
    await call('/admin/pages/about','PUT',{...about,businessAreas:[...about.businessAreas,{title:token,desc:description,icon:'chip',link:'#/services',button:token}],principles:[...about.principles,{title:token,desc:description}]});
    const publicContent=await call('/public/content');const failures=[];
    for(const width of [320,360,768,1024,1440]){
      await visitor.setViewportSize({width,height:900});
      for(const route of ['/','/#/products','/#/services','/#/partners','/#/about','/#/contact']){
        await visitor.goto(route);await expect(visitor.locator('#main')).toBeAttached();
        const key=route==='/'?'home':route.split('/').pop();
        await expect.poll(async()=>(await visitor.locator('h1').textContent()).replace(/\s/g,'')).toBe(publicContent.pages[key].heroTitle.replace(/\s/g,''));
        const problems=await visitor.evaluate(()=>{
          const problems=[];if(document.documentElement.scrollWidth>innerWidth+1)problems.push('page overflow');
          for(const element of document.querySelectorAll('main h1,main h2,main h3,main p,.brand-words,.main-nav a,.footer-main a,.service-items>div,.steps>div')){
            if(!element.getClientRects().length)continue;const bounds=element.getBoundingClientRect();if(bounds.left< -1||bounds.right>innerWidth+1)problems.push(`${element.className||element.tagName}: outside viewport`);
          }
          const copy=document.querySelector('.hero-copy'),bottom=document.querySelector('.hero-bottom');
          if(copy&&bottom&&copy.getBoundingClientRect().bottom>bottom.getBoundingClientRect().top-8)problems.push('hero text overlaps footer controls');
          const chip=document.querySelector('.core-chip');
          if(chip&&(chip.scrollWidth>chip.clientWidth+1||chip.scrollHeight>chip.clientHeight+1))problems.push('decorative chip label overflows its frame');
          return [...new Set(problems)];
        });
        if(problems.length)failures.push({route,width,problems});
        if(route==='/'&&[360,1440].includes(width))await visitor.screenshot({path:testInfo.outputPath(`long-content-${width}.png`),fullPage:false,animations:'disabled'});
      }
    }
    expect(errors).toEqual([]);expect(failures).toEqual([]);
    await visitor.goto('/#/products');await expect(visitor.locator('#product-grid .server-category-panel')).toHaveCount(1);
  }finally{
    for(const[key,original]of [['home',home],['global',global],['about',about]]){const latest=await call(`/admin/pages/${key}`);await call(`/admin/pages/${key}`,'PUT',{...original,version:latest.version});}
    for(const remove of cleanup.reverse())await remove();await visitor.close();
  }
});
