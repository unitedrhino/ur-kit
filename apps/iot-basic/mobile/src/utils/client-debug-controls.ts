// 文件说明：页面显式注册可见控件，远程操控复用本地事件处理器，不执行任意脚本。
/** DebugControl 描述可安全回读的控件以及本地点击或输入回调；输入值不进入快照。 */
export interface DebugControl {
  id: string;
  label: string;
  role: 'button' | 'input';
  enabled: boolean;
  tap?: () => void | Promise<unknown>;
  input?: (value: string) => void | Promise<unknown>;
}
/** DebugPage 保存当前页面的可见控件工厂，避免远程命令越过业务权限。 */
interface DebugPage { route: string; controls: () => DebugControl[]; state: () => Record<string, string | boolean>; }
/** ClientDebugControls 以页面代次与快照票据隔离迟到命令，同时拒绝并行操作。 */
export class ClientDebugControls {
  /** page 是当前前台页面；隐藏后立即注销。 */
  private page: DebugPage | null = null;
  /** serial 为当前进程内单调递增票据，避免返回上一页后复用旧命令。 */
  private serial = 0;
  /** ticket 是最近一次读取的控件票据；一次操作后失效。 */
  private ticket = '';
  /** fingerprint 绑定快照中的控件顺序与状态，列表重排后禁止点击旧索引。 */
  private fingerprint = '';
  /** busy 防止连续点击发起并行业务请求。 */
  private busy = false;
  /** activate 注册前台页面，返回只释放本页面的注销函数。 */
  activate(route: string, controls: () => DebugControl[], state: () => Record<string, string | boolean> = () => ({})): () => void {
    const page = { route, controls, state };
    this.page = page;
    this.invalidate();
    return () => { if (this.page === page) { this.page = null; this.invalidate(); } };
  }
  /** invalidate 撤销旧快照，不影响已经由本地事件发起的业务事务。 */
  invalidate(): void { this.ticket = ''; this.serial += 1; }
  /** status 只回读页面注册与路由匹配状态，用于区分生命周期失效与控件工厂异常，不读取表单。 */
  status(route: string): { registered: boolean; routeMatches: boolean } {
    return { registered: this.page !== null, routeMatches: this.page?.route === route };
  }
  /** visible 只读取路由一致的页面控件；重复标识拒绝整个快照。 */
  private visible(route: string): DebugControl[] {
    if (!this.page || this.page.route !== route) throw new Error('当前页面尚未开放控件');
    const controls = this.page.controls();
    if (new Set(controls.map((control) => control.id)).size !== controls.length) throw new Error('控件标识重复');
    return controls;
  }
  /** inspect 返回控件描述与单次票据，不包含回调、表单值或认证信息。 */
  inspect(route: string): Record<string, unknown> {
    const controls = this.visible(route);
    this.ticket = String(++this.serial);
    this.fingerprint = JSON.stringify(controls.map(({ id, label, role, enabled }) => ({ id, label, role, enabled })));
    return { page: route, ticket: this.ticket, busy: this.busy, state: this.page!.state(),
      controls: controls.map(({ id, label, role, enabled }) => ({ id, label, role, enabled })) };
  }
  /** execute 验证票据、可见性和授权后复用真实事件；错误信息不透传输入正文。 */
  async execute(action: string, args: Record<string, unknown>, route: string, authorized: () => boolean): Promise<Record<string, unknown>> {
    if (!authorized() || this.busy || !this.ticket || args.ticket !== this.ticket) throw new Error('控件快照已失效或操作忙碌');
    const visible = this.visible(route);
    if (JSON.stringify(visible.map(({ id, label, role, enabled }) => ({ id, label, role, enabled }))) !== this.fingerprint) throw new Error('页面控件已变化，请重新读取');
    const control = visible.find((item) => item.id === args.targetID);
    if (!control?.enabled) throw new Error('控件不可操作');
    if (action === 'ui.input' && (control.role !== 'input' || !control.input || typeof args.value !== 'string' || args.value.length > 1024)) throw new Error('输入指令无效');
    if (action === 'ui.tap' && (control.role !== 'button' || !control.tap)) throw new Error('点击指令无效');
    if (!['ui.tap', 'ui.input'].includes(action)) throw new Error('控件指令不支持');
    this.invalidate();
    this.busy = true;
    try {
      if (!authorized()) throw new Error('操控授权已撤销');
      if (action === 'ui.input') await control.input!(args.value as string);
      else await control.tap!();
      return { performed: true };
    } catch { throw new Error('页面操作失败，请读取当前页面状态'); }
    finally { this.busy = false; this.invalidate(); }
  }
}
/** clientDebugControls 是前台页面和调试桥之间唯一的控件注册入口。 */
export const clientDebugControls = new ClientDebugControls();
