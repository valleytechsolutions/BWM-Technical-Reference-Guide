// Release-only configuration for the pinned electron-builder 26.x API.
const config = structuredClone(require('./package.json').build);
if (process.platform === 'win32') {
  const offline = require('./electron-builder.windows.cjs');
  Object.assign(config, offline, { nsis: { ...config.nsis, ...offline.nsis } });
}
if (!process.env.CSC_LINK || !process.env.CSC_KEY_PASSWORD) {
  throw new Error('Signed release requires CSC_LINK and CSC_KEY_PASSWORD. Use the explicitly unsigned preview configuration for local builds.');
}
config.forceCodeSigning = true;
config.win.signExecutable = true;
delete config.mac.identity;
config.mac.hardenedRuntime = true;
config.mac.notarize = true;
if (process.platform === 'darwin' && !(process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER)) {
  throw new Error('Mac release requires APPLE_API_KEY, APPLE_API_KEY_ID and APPLE_API_ISSUER for notarization.');
}
module.exports = config;
