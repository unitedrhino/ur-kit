import { getMenuList } from '../system/menu';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  const menus = await getMenuList();

  // console.log('menus ===================== ', menus);
  return menus;
}
