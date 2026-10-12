import { BRAND_CONFIG } from '../config/brand';
import { logger } from '../utils/logger';

/** 微信隐私授权同意按钮 ID，resolve 时必须与真实点击过的按钮一致。 */
export const PRIVACY_AGREE_BUTTON_ID = 'agree-privacy-btn';

export interface PrivacyPopupState {
  visible: boolean;
  contractName: string;
  referrer?: string;
}

type PrivacyResolvePayload = { event: 'exposureAuthorization' | 'agree' | 'disagree'; buttonId?: string };
type PrivacyResolver = (payload: PrivacyResolvePayload) => void;

/** WxPrivacyRuntime 声明隐私授权链路依赖的微信小程序运行时 API。 */
interface WxPrivacyRuntime {
  onNeedPrivacyAuthorization?: (
    listener: (resolve: PrivacyResolver, eventInfo: { referrer?: string }) => void
  ) => void;
  getPrivacySetting?: (options: {
    success?: (result: { needAuthorization: boolean; privacyContractName?: string }) => void;
    fail?: () => void;
  }) => void;
  requirePrivacyAuthorize?: (options: {
    success?: () => void;
    fail?: (err: unknown) => void;
  }) => void;
  openPrivacyContract?: (options: {
    success?: () => void;
    fail?: () => void;
  }) => void;
}

/** getWxPrivacyRuntime 在非微信端安全返回空，避免跨端构建后访问未定义 wx。 */
function getWxPrivacyRuntime(): WxPrivacyRuntime | null {
  if (typeof wx === 'undefined') {
    return null;
  }
  return wx as unknown as WxPrivacyRuntime;
}

class PrivacyConsentService {
  private state: PrivacyPopupState = {
    visible: false,
    contractName: BRAND_CONFIG.privacyPopup.fallbackContractName,
  };

  private listeners: Set<(state: PrivacyPopupState) => void> = new Set();
  private initialized = false;
  private pendingResolver: PrivacyResolver | null = null;
  private pendingRequest: Promise<boolean> | null = null;

  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const runtime = getWxPrivacyRuntime();
    const api = runtime?.onNeedPrivacyAuthorization;
    if (typeof api !== 'function') {
      return;
    }
    api.call(runtime, (resolve, eventInfo) => {
      this.pendingResolver = resolve;
      const referrer = eventInfo?.referrer || '';
      this.reportAuthorizationExposure(resolve, referrer);
      this.update(referrer ? { visible: true, referrer } : { visible: true });
    });
  }

  subscribe(listener: (state: PrivacyPopupState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): PrivacyPopupState {
    return this.state;
  }

  private update(partial: Partial<PrivacyPopupState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  /** reportAuthorizationExposure 告诉微信平台本次隐私授权弹窗已经曝光，避免 pending 能力等待超时。 */
  private reportAuthorizationExposure(resolve: PrivacyResolver, referrer: string): void {
    try {
      resolve({ event: 'exposureAuthorization' });
      logger.info('privacy', 'authorization:exposure', { referrer });
    } catch (error) {
      logger.warn('privacy', 'authorization:exposure-failed', {
        referrer,
        error,
      });
    }
  }

  async loadPopupState(): Promise<PrivacyPopupState> {
    const runtime = getWxPrivacyRuntime();
    const api = runtime?.getPrivacySetting;

    if (typeof api !== 'function') {
      const fallbackState: PrivacyPopupState = {
        visible: false,
        contractName: BRAND_CONFIG.privacyPopup.fallbackContractName,
      };
      this.update(fallbackState);
      return fallbackState;
    }

    return new Promise((resolve) => {
      api.call(runtime, {
        success: (result) => {
          const nextState: PrivacyPopupState = {
            visible: this.pendingResolver ? true : !!result.needAuthorization,
            contractName: result.privacyContractName || BRAND_CONFIG.privacyPopup.fallbackContractName,
          };
          this.update(nextState);
          resolve(nextState);
        },
        fail: () => {
          const fallbackState: PrivacyPopupState = {
            visible: this.pendingResolver ? true : false,
            contractName: BRAND_CONFIG.privacyPopup.fallbackContractName,
          };
          this.update(fallbackState);
          resolve(fallbackState);
        },
      });
    });
  }

  async requestAuthorization(): Promise<boolean> {
    this.init();
    await this.loadPopupState();
    const runtime = getWxPrivacyRuntime();
    const api = runtime?.requirePrivacyAuthorize;

    if (typeof api !== 'function') {
      return !this.state.visible;
    }
    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    this.pendingRequest = new Promise((resolve) => {
      api.call(runtime, {
        success: async () => {
          this.pendingResolver = null;
          this.pendingRequest = null;
          await this.loadPopupState();
          this.update({
            visible: false,
            referrer: '',
          });
          resolve(true);
        },
        fail: () => {
          this.pendingResolver = null;
          this.pendingRequest = null;
          this.update({
            visible: false,
            referrer: '',
          });
          resolve(false);
        },
      });
    });

    return this.pendingRequest;
  }

  handleAgree(buttonId = PRIVACY_AGREE_BUTTON_ID): void {
    if (this.pendingResolver) {
      const resolve = this.pendingResolver;
      this.pendingResolver = null;
      logger.info('privacy', 'authorization:agree', { buttonId });
      resolve({ event: 'agree', buttonId: buttonId || PRIVACY_AGREE_BUTTON_ID });
    }
    this.update({
      visible: false,
      referrer: '',
    });
  }

  handleDisagree(): void {
    if (this.pendingResolver) {
      const resolve = this.pendingResolver;
      this.pendingResolver = null;
      logger.info('privacy', 'authorization:disagree', {
        referrer: this.state.referrer || '',
      });
      resolve({ event: 'disagree' });
    }
    this.update({
      visible: false,
      referrer: '',
    });
  }

  async openPrivacyContract(): Promise<boolean> {
    const runtime = getWxPrivacyRuntime();
    const api = runtime?.openPrivacyContract;

    if (typeof api !== 'function') {
      return false;
    }

    return new Promise((resolve) => {
      api.call(runtime, {
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    });
  }
}

export const privacyConsentService = new PrivacyConsentService();
