import { test, expect } from '@playwright/test';
import { manager } from './support.js';
test.beforeEach(async ({page}) => manager(page));

test('普通 HTTP 环境可打开产品和页面编辑表单',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true}));
  await page.goto('/admin.html#/products');
  await page.getByRole('button',{name:'新增产品',exact:true}).click();
  await expect(page.getByLabel('产品名称')).toBeVisible();
  await page.getByRole('button',{name:'取消',exact:true}).click();
  await page.goto('/admin.html#/page-home');
  await expect(page.getByLabel('首页主标题',{exact:true})).toBeVisible();
});

test('含特殊字符的产品名称保持原文，新增服务在官网技术服务页展示', async ({ page }) => {
  await page.goto('/admin.html#/products');
  await page.getByRole('button', { name: '新增产品' }).click();
  await page.getByLabel('产品名称').fill('AT&T GPU');
  await page.getByLabel('产品简介').fill('含特殊字符的产品');
  await page.getByRole('button', { name: '保存产品' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/');
  await page.getByRole('button', { name: '业务咨询', exact: true }).click();
  await expect(page.getByRole('option', { name: 'AT&T GPU', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: '关闭弹窗' }).click();
  await page.goto('/admin.html#/services');
  await page.getByRole('button', { name: '新增服务' }).click();
  await page.getByLabel('服务名称').fill('新增演示服务');
  await page.getByLabel('服务简介').fill('这是一段服务简介');
  await page.getByRole('button', { name: '保存服务' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/');
  const service = page.locator('.service-row').filter({ hasText: '新增演示服务' }).first();
  await expect(service).toBeVisible();
  await expect(service).toContainText('这是一段服务简介');
});

test('删除产品先确认，并在刷新后保留结果', async ({ page }) => {
  await page.goto('/admin.html#/products');
  await page.getByRole('button',{name:'新增产品'}).click();
  await page.getByLabel('产品名称').fill('待删除测试产品');
  await page.getByLabel('产品简介').fill('删除流程验证');
  await page.getByRole('button',{name:'保存产品'}).click();
  const row = page.getByRole('row').filter({ hasText: '待删除测试产品' });
  await row.getByRole('button', { name: '删除' }).click();
  await expect(row).toHaveCount(1);
  await page.getByRole('button', { name: '确认删除' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: '待删除测试产品' })).toHaveCount(0);
  await page.goto('/#/products');
  await expect(page.getByRole('heading', { name: '待删除测试产品' })).toHaveCount(0);
});

test('同时打开两个后台编辑不同产品，保存不会覆盖另一页的改动', async ({ page, context }) => {
  await page.goto('/admin.html#/products');
  await page.getByRole('row').filter({ hasText: '通用服务器整机' }).getByRole('button', { name:'编辑' }).click();
  const other = await context.newPage();
  await other.goto('/admin.html#/products');
  await other.getByRole('row').filter({ hasText: 'GPU 服务器整机' }).getByRole('button', { name:'编辑' }).click();
  await other.getByLabel('产品简介').fill('另一页已保存的 GPU 简介');
  await other.getByRole('button', { name:'保存产品' }).click();
  await expect(other.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('产品简介').fill('当前页已保存的通用简介');
  await page.getByRole('button', { name:'保存产品' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('另一页已保存的 GPU 简介')).toBeVisible();
  await expect(page.getByText('当前页已保存的通用简介')).toBeVisible();
});
