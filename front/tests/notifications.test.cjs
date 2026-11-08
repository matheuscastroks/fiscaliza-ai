const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('notifications: service and store modules exist and export expected APIs', () => {
  const serviceFile = path.join(ROOT_DIR, 'features', 'notifications', 'notificationService.ts');
  assert.ok(fs.existsSync(serviceFile), 'notificationService.ts must exist');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  assert.ok(
    serviceContent.includes('setupNotificationChannels') &&
      serviceContent.includes('registerForPushNotificationsAsync') &&
      serviceContent.includes('followCallForNotifications') &&
      serviceContent.includes('unfollowCallForNotifications') &&
      serviceContent.includes('sendTestPushNotification'),
    'notificationService must export setup, registration, follow, unfollow and test notification functions',
  );
  assert.ok(
    serviceContent.includes('fiscaliza-calls'),
    'notificationService must configure the fiscaliza-calls notification channel',
  );

  const storeFile = path.join(ROOT_DIR, 'stores', 'notificationStore.ts');
  assert.ok(fs.existsSync(storeFile), 'notificationStore.ts must exist');

  const storeContent = fs.readFileSync(storeFile, 'utf8');
  assert.ok(
    storeContent.includes('useNotificationStore') &&
      storeContent.includes('pushToken') &&
      storeContent.includes('permissionGranted') &&
      storeContent.includes('sendTestPush'),
    'notificationStore must manage pushToken, permissionGranted and sendTestPush',
  );
});

test('notifications: followStore synchronizes followed calls with notification service', () => {
  const followStoreFile = path.join(ROOT_DIR, 'stores', 'followStore.ts');
  const notificationStoreFile = path.join(ROOT_DIR, 'stores', 'notificationStore.ts');
  const followContent = fs.readFileSync(followStoreFile, 'utf8');
  const notifContent = fs.readFileSync(notificationStoreFile, 'utf8');

  assert.ok(
    followContent.includes('setFollowNotificationListener') &&
      notifContent.includes('followCallForNotifications') &&
      notifContent.includes('unfollowCallForNotifications'),
    'followStore and notificationStore must trigger follow/unfollow notification sync when calls are toggled',
  );
});

test('notifications: root layout initializes notifications and registers response listener', () => {
  const layoutFile = path.join(ROOT_DIR, 'app', '_layout.tsx');
  const content = fs.readFileSync(layoutFile, 'utf8');

  assert.ok(
    content.includes('useNotificationStore') &&
      content.includes('addNotificationResponseReceivedListener'),
    'RootLayout must mount notification store initialization and tap response listener for deep linking',
  );
});

test('notifications: settings screen provides notification controls and test trigger', () => {
  const settingsFile = path.join(ROOT_DIR, 'app', 'SettingsScreen.tsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  assert.ok(
    content.includes('useNotificationStore') &&
      content.includes('Notificações e alertas') &&
      content.includes('Testar notificação no aparelho'),
    'SettingsScreen must render notifications status and test push button',
  );
});
