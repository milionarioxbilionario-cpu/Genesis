import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('Genesis app ready for offline use.');
  }
});
