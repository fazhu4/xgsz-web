import {test,expect} from '@playwright/test';
import {manager} from './support.js';

async function client(page){
  const state=(await(await page.request.get('/api/auth/session')).json()).data;
  return async(path,method='GET',data)=>{
    const response=await page.request.fetch('/api'+path,{method,headers:{'X-CSRF-TOKEN':state.csrf},...(data?{data}:{})});
    expect(response.ok()).toBe(true);return (await response.json()).data;
  };
}

test('首页与产品中心完整展示四个业务方向及细分能力，入口可以直达',async({page})=>{
  await page.goto('/');
  const capabilities=page.locator('.capability-strip');
  for(const title of ['服务器整机','本地化部署','推理优化','集群交付运维维保'])await expect(capabilities.getByRole('link').filter({hasText:title})).toBeVisible();
  await page.getByRole('link',{name:'探索产品与方案'}).click();
  await expect(page.getByRole('navigation',{name:'业务方向'})).toHaveCount(0);
  for(const title of ['服务器整机','本地化部署','推理优化','集群交付运维维保'])await expect(page.locator('.offering-section').getByRole('heading',{name:title,exact:true})).toBeVisible();
  const servers=page.locator('#offering-servers');
  await expect(servers.locator('.offering-group-grid')).toHaveCount(0);
  const serverTabs=servers.getByRole('tablist',{name:'服务器产品类别'});
  await expect(serverTabs.getByRole('tab',{name:'全部产品'})).toHaveAttribute('aria-selected','true');
  await expect(servers.locator('.product-card')).toHaveCount(3);
  for(const [tab,image,models] of [
    ['通用服务器','/assets/server-general.webp',['存储型服务器','通算型服务器']],
    ['GPU 服务器','/assets/server-gpu.webp',['5090','4090','5080','5060 16G','V100','PRO 6000D','PRO 5000','PRO 6000']],
    ['国产算力','/assets/server-domestic.webp',['中昊芯英','昆仑芯','曦望','沐曦']]
  ]){
    await serverTabs.getByRole('tab',{name:tab}).click();
    await expect(servers.locator('.server-category-panel h3')).toHaveText(tab);
    await expect(servers.locator('.server-category-panel img')).toHaveAttribute('src',image);
    for(const model of models)await expect(servers.locator('.server-model-list').getByText(model,{exact:true})).toBeVisible();
    await expect(servers.locator('.product-card')).toHaveCount(1);
  }
  for(const text of ['裸金属交付','整体 Token 输出方案','专业 Agent 工具','Token 平台优化','推理产出优化','集群性能优化','集群交付','集群运维','集群 GPU 维保','液冷维保'])await expect(page.locator('.offering-items').getByText(text,{exact:true})).toBeVisible();
  await page.goto('/#/products?solution=inference');
  await expect(page.locator('#offering-inference')).toBeInViewport();
  for(const [name,href] of [['淘宝入口','https://www.taobao.com/'],['抖音入口','https://www.douyin.com/']])await expect(page.getByRole('link',{name,exact:true})).toHaveAttribute('href',href);
  await page.goto('/#/products');
  await page.locator('.subhero').screenshot({path:'../.runtime/optimization-20261109/products-desktop.png'});
  await page.locator('#offering-servers').screenshot({path:'../.runtime/optimization-20261109/server-directory-desktop.png'});
  await serverTabs.getByRole('tab',{name:'GPU 服务器'}).click();
  await page.locator('#offering-servers').screenshot({path:'../.runtime/server-tabs-gpu-desktop.png'});
  await page.setViewportSize({width:360,height:900});await page.goto('/');
  await page.locator('.capability-strip').screenshot({path:'../.runtime/optimization-20261109/home-capabilities-mobile.png'});
  await page.locator('.products-section .section-head').screenshot({path:'../.runtime/optimization-20261109/home-products-heading-mobile.png'});
  await page.goto('/#/products');await page.screenshot({path:'../.runtime/optimization-20261109/products-mobile.png',fullPage:true});
});

test('控制台可维护嵌套业务分类、线上链接和项目时间线并同步官网',async({page,context})=>{
  await manager(page);const call=await client(page);
  const originalProducts=await call('/admin/pages/products'),originalAbout=await call('/admin/pages/about');
  const visitor=await context.newPage();
  try{
    await page.goto('/admin.html#/page-products');
    await page.getByLabel('淘宝链接',{exact:true}).fill('https://www.taobao.com/?from=company');
    const solutions=page.locator('[data-repeater][data-path="solutionGroups"]');
  await solutions.locator(':scope > .cms-repeater-rows > [data-repeat-row]').last().locator(':scope > summary').click();
    await solutions.locator(':scope > .cms-repeater-rows > [data-repeat-row]').last().getByLabel('入口标识（英文）',{exact:true}).fill('R&D');
    const deployment=solutions.locator(':scope > .cms-repeater-rows > [data-repeat-row]').nth(1);
  await deployment.locator(':scope > summary').click();
    await deployment.getByRole('button',{name:'添加细分分类',exact:true}).click();
    const group=deployment.locator('[data-repeater] > .cms-repeater-rows > [data-repeat-row]').last();
    await group.getByLabel('分类名称',{exact:true}).fill('后台新增部署分类');
    await group.getByLabel('内容项目（每行一项）',{exact:true}).fill('后台新增能力\n中文与英文 Agent');
    await page.getByRole('button',{name:'保存页面',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('页面已保存');
    await visitor.goto('/#/products?solution=deployment');
    await expect(visitor.getByRole('heading',{name:'后台新增部署分类',exact:true})).toBeVisible();
    await expect(visitor.getByText('后台新增能力',{exact:true})).toBeVisible();
    await expect(visitor.getByRole('link',{name:'淘宝入口',exact:true})).toHaveAttribute('href','https://www.taobao.com/?from=company');
    await visitor.goto('/#/products?solution=R%26D');
    await expect(visitor.locator('[id="offering-R%26D"]')).toBeInViewport();
    await page.goto('/admin.html#/page-about');
    await page.getByRole('button',{name:'添加项目动态',exact:true}).click();
    const milestone=page.locator('[data-repeater][data-path="milestones"] [data-repeat-row]').last();
    await milestone.getByLabel('时间',{exact:true}).fill('2026-11');
    await milestone.getByLabel('动态标题',{exact:true}).fill('测试环境交付记录');
    await milestone.getByLabel('动态内容',{exact:true}).fill('用于验证后台动态同步的测试内容，不作为实际交付案例。');
    await page.getByRole('button',{name:'保存页面',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('页面已保存');
    await visitor.goto('/#/about');
    await expect(visitor.locator('.project-timeline').getByText('2026-11',{exact:true})).toBeVisible();
    await expect(visitor.locator('.project-timeline').getByRole('heading',{name:'测试环境交付记录',exact:true})).toBeVisible();
    await visitor.locator('.company-milestones').screenshot({path:'../.runtime/optimization-20261109/project-timeline-desktop.png'});
    for(const width of [320,768,1440]){
      await visitor.setViewportSize({width,height:900});
      for(const route of ['/products','/about']){
        await visitor.goto('/#'+route);await expect(visitor.locator('h1')).toBeVisible();
        expect(await visitor.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      }
    }
  }finally{
    const currentProducts=await call('/admin/pages/products');await call('/admin/pages/products','PUT',{...originalProducts,version:currentProducts.version});
    const currentAbout=await call('/admin/pages/about');await call('/admin/pages/about','PUT',{...originalAbout,version:currentAbout.version});
    await visitor.close();
  }
});
