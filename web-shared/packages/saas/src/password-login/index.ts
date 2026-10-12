/** 密码登录窄入口，供共享登录页及保留独立路由的客户端应用复用。 */
export { useLoginPasswordMode, type LoginPasswordMode } from './mode';
export { buildPwdLoginPayload } from './payload';
