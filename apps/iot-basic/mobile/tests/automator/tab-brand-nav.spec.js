const TAB_PAGES = [
  '/pages/device/index',
  '/pages/scene/index',
  '/pages/mine/index',
];

async function openTabPage(url) {
  await program.reLaunch('/pages/home/index');
  const page = await program.switchTab(url);
  await page.waitFor('app-navigation-bar', 10000);
  return page;
}

async function expectBrandNav(page) {
  const nav = await page.$('app-navigation-bar');
  expect(nav).not.toBeNull();

  const brandName = await nav.$('.nav-bar__brand-name');
  expect(brandName).not.toBeNull();
  await expect(brandName.text()).resolves.toBe('联犀');

  const brandLogo = await nav.$('.nav-bar__brand-logo');
  expect(brandLogo).not.toBeNull();

  const back = await nav.$('.nav-bar__back');
  expect(back).toBeNull();
}

describe('一级 Tab 页品牌导航', () => {
  for (const url of TAB_PAGES) {
    test(`${url} 左上角显示品牌，不显示返回箭头`, async () => {
      const page = await openTabPage(url);
      await expectBrandNav(page);
    });
  }
});
