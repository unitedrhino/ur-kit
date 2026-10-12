/**
 * 首页顶栏菜单（家庭下拉 + 添加菜单 + 扫一扫）自动化测试。
 * 仅验证 UI 层渲染与事件，绑定/请求不实际触发。
 */

async function openHome() {
  const page = await program.reLaunch('/pages/home/index');
  await page.waitFor('app-navigation-bar', 10000);
  return page;
}

describe('首页顶栏菜单', () => {
  test('右上 + 图标点击后弹出三项菜单：扫一扫 / 添加设备 / 刷新', async () => {
    const page = await openHome();
    const addBtn = await page.$('.home-nav-add');
    expect(addBtn).not.toBeNull();
    await addBtn.tap();
    await page.waitFor(300);

    const items = await page.$$('.home-popover--right .home-popover__item-text');
    expect(items.length).toBe(3);
    const texts = [];
    for (const it of items) texts.push(await it.text());
    expect(texts).toEqual(['扫一扫', '添加设备', '刷新']);
  });

  test('点击 mask 后菜单关闭', async () => {
    const page = await openHome();
    const addBtn = await page.$('.home-nav-add');
    await addBtn.tap();
    await page.waitFor(300);
    let popover = await page.$('.home-popover--right');
    expect(popover).not.toBeNull();

    const mask = await page.$('.home-popover-mask');
    await mask.tap();
    await page.waitFor(300);
    popover = await page.$('.home-popover--right');
    expect(popover).toBeNull();
  });

  test('左上家庭名点击后弹出菜单，包含家庭管理入口', async () => {
    const page = await openHome();
    const navLeft = await page.$('.home-nav-left');
    expect(navLeft).not.toBeNull();
    await navLeft.tap();
    await page.waitFor(300);

    const popover = await page.$('.home-popover--left');
    expect(popover).not.toBeNull();

    const footerItems = await page.$$('.home-popover--left .home-popover__item--footer .home-popover__item-text');
    expect(footerItems.length).toBeGreaterThanOrEqual(1);
    const footerText = await footerItems[0].text();
    expect(typeof footerText).toBe('string');
    expect(footerText.length).toBeGreaterThan(0);
  });

  test('点击扫一扫后关闭添加菜单并保持首页可用', async () => {
    const page = await openHome();
    await program.mockUniMethod('scanCode', { errMsg: 'scanCode:fail cancel' });
    try {
      const addBtn = await page.$('.home-nav-add');
      await addBtn.tap();
      await page.waitFor(300);
      const items = await page.$$('.home-popover--right .home-popover__item');
      await items[0].tap();
      await page.waitFor(500);

      const popover = await page.$('.home-popover--right');
      const nav = await page.$('app-navigation-bar');
      expect(popover).toBeNull();
      expect(nav).not.toBeNull();
    } finally {
      await program.restoreUniMethod('scanCode');
    }
  });
});
