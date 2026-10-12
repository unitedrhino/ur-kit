import { createSSRApp } from 'vue';
import App from './App.vue';
import './app.scss';
import { config } from './config';
import { configureLogger, installConsoleErrorCapture, logger, reportGlobalError } from './utils/logger';
import { clientDebugService } from './services/client-debug.service';

// 全局组件注册（替代 app.json 的 usingComponents）
import NavigationBar from './components/app-navigation-bar/app-navigation-bar.vue';
import AppIcon from './components/app-icon/app-icon.vue';
import DeviceCard from './components/device-card/device-card.vue';
import PropertyControl from './components/property-control/property-control.vue';
import EmptyState from './components/empty-state/empty-state.vue';
import LoadingComp from './components/loading/loading.vue';
import AlarmBadge from './components/alarm-badge/alarm-badge.vue';
import SafeArea from './components/safe-area/safe-area.vue';

// 本地日志保持脱敏；远端仅在 Agent 会话有效时临时转发。
configureLogger({ persistHistory: config.persistLocalLogs, historyLimit: config.localLogHistoryLimit });
installConsoleErrorCapture();
clientDebugService.init();

export function createApp() {
  const app = createSSRApp(App);
  app.config.errorHandler = (error, _instance, info) => {
    reportGlobalError(error, 'vue.error');
    logger.info('vue.error.context', info);
  };
  app.component('app-navigation-bar', NavigationBar);
  app.component('app-icon', AppIcon);
  app.component('device-card', DeviceCard);
  app.component('property-control', PropertyControl);
  app.component('empty-state', EmptyState);
  app.component('loading', LoadingComp);
  app.component('alarm-badge', AlarmBadge);
  app.component('safe-area', SafeArea);
  return { app };
}
