import { test,expect } from '@playwright/test';
import { manager } from './support.js';

test('后台修改首页和公司介绍后刷新官网显示数据库内容',async({page})=>{
  await manager(page);
  await page.goto('/admin.html#/page-home');
  await page.getByLabel('首页主标题',{exact:true}).fill('从后台更新的首页\n内容保存在数据库');
  await page.getByRole('button',{name:'保存页面',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('页面已保存');
  await page.reload();await expect(page.getByLabel('首页主标题',{exact:true})).toHaveValue('从后台更新的首页\n内容保存在数据库');
  await page.goto('/');await expect(page.getByRole('heading',{name:'从后台更新的首页 内容保存在数据库'})).toBeVisible();
  await page.goto('/admin.html#/page-about');await page.getByLabel('公司简介导语',{exact:true}).fill('这是从管理后台保存的公司介绍。');
  await page.getByRole('button',{name:'保存页面',exact:true}).click();await expect(page.getByRole('status')).toContainText('页面已保存');
  await page.goto('/#/about');await expect(page.getByText('这是从管理后台保存的公司介绍。',{exact:true})).toBeVisible();
  // Restore shared seeded text for the existing navigation suite.
  await page.goto('/admin.html#/page-home');await page.getByLabel('首页主标题',{exact:true}).fill('让每一份算力\n释放更大价值');await page.getByRole('button',{name:'保存页面',exact:true}).click();await expect(page.getByRole('status')).toContainText('页面已保存');
});

test('新增分类可用于产品并在官网筛选，图片上传后真实展示',async({page})=>{
  await manager(page);await page.goto('/admin.html#/catalog-categories');
  await page.getByRole('button',{name:'新增产品分类',exact:true}).click();
  await page.getByLabel('分类名称',{exact:true}).fill('边缘服务器');await page.getByRole('button',{name:'保存记录',exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:'边缘服务器'})).toBeVisible();
  await page.goto('/admin.html#/products');await page.getByRole('button',{name:'新增产品',exact:true}).click();
  await page.getByLabel('产品名称').fill('动态分类测试整机');await page.getByLabel('产品简介').fill('数据库分类与上传图片');
  await page.getByRole('dialog').getByRole('combobox',{name:/产品分类/}).selectOption({label:'边缘服务器'});
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=8;c.height=8;return c.toDataURL('image/png').split(',')[1];});
  await page.getByLabel('上传产品封面',{exact:true}).setInputFiles({name:'server.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await expect(page.getByAltText('产品封面预览')).toBeVisible();
  await page.getByRole('button',{name:'保存产品',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/products');await page.getByRole('tab',{name:'边缘服务器',exact:true}).click();
  await expect(page.getByRole('heading',{name:'动态分类测试整机',exact:true})).toBeVisible();
  await expect(page.getByAltText('动态分类测试整机',{exact:true})).toBeVisible();
});

test('招商内容和品牌证书从原后端模块保存并在官网显示',async({page})=>{
  await manager(page);await page.goto('/admin.html#/catalog-businesses');
  await page.getByRole('button',{name:'新增招商合作',exact:true}).click();
  await page.getByLabel('合作方向',{exact:true}).fill('区域技术合作');await page.getByLabel('合作介绍',{exact:true}).fill('在控制台维护的合作政策');
  await page.getByRole('button',{name:'保存记录',exact:true}).click();await expect(page.getByRole('status')).toContainText('内容已保存');
  await page.goto('/#/partners');await expect(page.getByRole('heading',{name:'区域技术合作',exact:true})).toBeVisible();
  await page.goto('/admin.html#/catalog-brands');await page.getByRole('button',{name:'新增品牌管理',exact:true}).click();
  await page.getByLabel('品牌名称',{exact:true}).fill('数据库测试品牌');await page.getByRole('button',{name:'保存记录',exact:true}).click();await expect(page.getByRole('status')).toContainText('内容已保存');
  await page.goto('/');await expect(page.getByText('数据库测试品牌',{exact:true})).toBeVisible();
});

test('快速切换栏目不混入旧响应，页面保存冲突保留输入',async({page,context})=>{
  await manager(page);await page.goto('/admin.html#/page-services');
  let release;const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/admin/pages/home',async route=>{await pending;await route.continue();});
  await page.getByRole('link',{name:'首页内容',exact:true}).click();
  await page.getByRole('link',{name:'公司介绍',exact:true}).click();
  await expect(page.getByLabel('公司简介标题',{exact:true})).toBeVisible();release();
  await expect(page.getByLabel('公司简介标题',{exact:true})).toHaveValue('连接算力建设\n与持续运行');
  const other=await context.newPage();await other.goto('/admin.html#/page-about');
  await other.getByLabel('公司简介标题',{exact:true}).fill('另一页面先保存');await other.getByRole('button',{name:'保存页面',exact:true}).click();
  await expect(other.getByRole('status')).toContainText('页面已保存');
  await page.getByLabel('公司简介标题',{exact:true}).fill('保留我的旧版本输入');await page.getByRole('button',{name:'保存页面',exact:true}).click();
  await expect(page.locator('.cms-save-bar').getByRole('alert')).toContainText('已被其他页面修改');
  await expect(page.getByLabel('公司简介标题',{exact:true})).toHaveValue('保留我的旧版本输入');
});

test('分类名称按文本显示，产品金额支持小数',async({page})=>{
  await manager(page);await page.goto('/admin.html#/catalog-categories');await page.getByRole('button',{name:'新增产品分类',exact:true}).click();
  await page.getByLabel('分类名称',{exact:true}).fill('</option></select><img src=x onerror=alert(1)>');
  await page.getByRole('button',{name:'保存记录',exact:true}).click();await expect(page.getByRole('status')).toContainText('内容已保存');
  await page.goto('/admin.html#/products');await page.getByRole('button',{name:'新增产品',exact:true}).click();
  expect(await page.locator('dialog img[src=x]').count()).toBe(0);
  await page.getByLabel('产品名称').fill('小数金额测试');await page.getByLabel('产品简介').fill('小数金额可正常保存');
  await page.getByLabel('销售价格').fill('12.50');await page.getByLabel('成本价格').fill('8.25');
  await page.getByRole('button',{name:'保存产品',exact:true}).click();await expect(page.getByRole('row').filter({hasText:'小数金额测试'})).toBeVisible();
  await page.getByRole('row').filter({hasText:'小数金额测试'}).getByRole('button',{name:'编辑',exact:true}).click();
  await expect(page.getByLabel('销售价格')).toHaveValue('12.5');
});
