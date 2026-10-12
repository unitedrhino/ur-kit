const path = require('node:path');

const root = __dirname;

// Uni 官方自动化测试入口：https://uniapp.dcloud.net.cn/worktile/auto/quick-start.html
module.exports = {
  testEnvironment: '@dcloudio/uni-automator/dist/environment.js',
  globalTeardown: '@dcloudio/uni-automator/dist/teardown.js',
  testMatch: ['<rootDir>/tests/automator/**/*.spec.js'],
  testTimeout: 180000,
  maxWorkers: 1,
  verbose: true,
  testEnvironmentOptions: {
    platform: 'mp-weixin',
    projectPath: root,
    cliPath: root,
    compile: true,
    silent: false,
    timeout: 180000,
    'mp-weixin': {
      executablePath: process.env.WECHAT_DEVTOOLS_CLI || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      launch: true,
      teardown: 'disconnect',
    },
  },
};
