import type { App as VueApp } from 'vue';

let activeGoviewApp: null | VueApp = null;
let waiters: Array<{
  reject: (reason?: any) => void;
  resolve: (app: VueApp) => void;
  timer: ReturnType<typeof setTimeout>;
}> = [];

export function setGoviewApp(app: null | VueApp) {
  activeGoviewApp = app;

  if (!app || waiters.length === 0) return;

  for (const waiter of waiters) {
    clearTimeout(waiter.timer);
    waiter.resolve(app);
  }
  waiters = [];
}

export function getGoviewApp() {
  return activeGoviewApp;
}

export function waitForGoviewApp(timeout = 2000): Promise<VueApp> {
  if (activeGoviewApp) {
    return Promise.resolve(activeGoviewApp);
  }

  return new Promise((resolve, reject) => {
    const waiter = {
      resolve,
      reject,
      timer: setTimeout(() => {
        waiters = waiters.filter((item) => item !== waiter);
        reject(new Error('Goview app is not ready'));
      }, timeout),
    };

    waiters.push(waiter);
  });
}
