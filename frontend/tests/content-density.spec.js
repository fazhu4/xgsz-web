import {test,expect} from '@playwright/test';

test('产品中心不重复展示业务目录，保留完整业务内容和直达定位',async({page})=>{
  await page.goto('/#/products');
  await expect(page.getByRole('navigation',{name:'业务方向'})).toHaveCount(0);
  await expect(page.locator('.offering-section')).toHaveCount(4);
  await expect(page.locator('.offering-heading h2')).toHaveText(['服务器整机','本地化部署','推理优化','集群交付运维维保']);
  await page.goto('/#/products?solution=inference');
  await expect(page.locator('#offering-inference')).toBeInViewport();
});

test('关于我们在首屏展示最新动态并保留完整时间线',async({page})=>{
  await page.goto('/#/about');
  const announcer=page.locator('.hero-milestone-announcer');
  await expect(announcer).toBeVisible();
  await expect(announcer).toBeInViewport();
  await expect(announcer.locator('.hero-announcer-slide')).toHaveCount(4);
  await expect(announcer.locator('.hero-announcer-slide.is-active')).toContainText('官网品牌与浏览体验升级');
  await expect(announcer.getByRole('button',{name:'暂停自动播报'})).toBeVisible();
  await announcer.getByRole('button',{name:'下一条动态'}).click();
  await expect(announcer.locator('.hero-announcer-slide.is-active')).toContainText('四大业务方向完成上线');
  await announcer.getByRole('button',{name:'暂停自动播报'}).click();
  await expect(announcer.getByRole('button',{name:'继续自动播报'})).toBeVisible();
  await expect(page.locator('.company-intro')).toBeVisible();
  await expect(page.locator('.company-principles')).toBeVisible();
  await expect(page.locator('.company-business-list,.company-support,.company-industries')).toHaveCount(0);
  await expect(page.locator('.company-milestones')).toBeVisible();
  await expect(page.locator('.milestone-broadcast')).toHaveCount(0);
  await expect(page.locator('.project-timeline > li')).toHaveCount(4);
  await announcer.getByRole('link',{name:'查看全部'}).click();
  await expect(page.locator('#company-milestones')).toBeInViewport();
});

test('关于我们最新动态在手机首屏可见且不横向溢出',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#/about');
  await expect(page.locator('.hero-milestone-announcer')).toBeInViewport({ratio:.8});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('常规页脚不重复展示完整联系卡片，联系页面保持完整信息',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.footer-contact')).toHaveCount(0);
  await expect(page.locator('.footer-bottom')).toBeVisible();
  await page.goto('/#/contact');
  await expect(page.locator('.contact-surface')).toBeVisible();
});
