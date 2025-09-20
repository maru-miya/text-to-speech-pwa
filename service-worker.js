// Service Worker for Text-to-Speech PWA
// オフライン機能とキャッシュ管理を提供

const CACHE_NAME = 'maru-tts-v1.0.0';
const STATIC_CACHE_NAME = 'maru-tts-static-v1.0.0';

// キャッシュするリソース
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-144.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// 重要でないリソース（失敗してもアプリが動作する）
const OPTIONAL_RESOURCES = [
  '/screenshots/desktop.png',
  '/screenshots/mobile.png'
];

// Service Worker インストール
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // 静的リソースのキャッシュ
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Caching static resources...');
        return cache.addAll(STATIC_RESOURCES);
      }),

      // オプショナルリソースのキャッシュ（失敗を無視）
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching optional resources...');
        return Promise.allSettled(
          OPTIONAL_RESOURCES.map(url => cache.add(url))
        );
      })
    ]).then(() => {
      console.log('Service Worker installation completed');
      // 新しいService Workerを即座に有効化
      return self.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker installation failed:', error);
    })
  );
});

// Service Worker アクティベーション
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    Promise.all([
      // 古いキャッシュの削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // 新しいService Workerがすべてのクライアントを制御
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activation completed');
    }).catch((error) => {
      console.error('Service Worker activation failed:', error);
    })
  );
});

// ネットワークリクエストの処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同一オリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // GETリクエストのみ処理
  if (request.method !== 'GET') {
    return;
  }

  // リクエストタイプに応じた戦略を適用
  if (isStaticResource(url.pathname)) {
    // 静的リソース: Cache First戦略
    event.respondWith(cacheFirst(request));
  } else if (isAppShell(url.pathname)) {
    // アプリシェル: Cache First + Network Fallback
    event.respondWith(cacheFirstWithNetworkFallback(request));
  } else {
    // その他: Network First戦略
    event.respondWith(networkFirst(request));
  }
});

// 静的リソースの判定
function isStaticResource(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// アプリシェルの判定
function isAppShell(pathname) {
  const appShellPaths = ['/', '/index.html', '/manifest.json'];
  return appShellPaths.includes(pathname);
}

// Cache First戦略
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    // 成功したレスポンスをキャッシュ
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    throw error;
  }
}

// Cache First + Network Fallback戦略
async function cacheFirstWithNetworkFallback(request) {
  try {
    // まずキャッシュを確認
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // キャッシュにない場合はネットワークから取得
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Cache first with network fallback failed:', error);

    // ネットワークエラーの場合、オフラインページまたはデフォルトレスポンスを返す
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/index.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    throw error;
  }
}

// Network First戦略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // 成功したレスポンスをキャッシュ
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Network first strategy failed, trying cache:', error);

    // ネットワークエラーの場合はキャッシュから返す
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// プッシュ通知処理（将来的な拡張用）
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'maru-text-to-speech';
  const options = {
    body: data.body || '新しい通知があります',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-144.png',
    tag: 'tts-pwa-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '開く'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 通知クリック処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // 既に開いているタブがあるかチェック
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }

        // 新しいタブで開く
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// バックグラウンド同期（将来的な拡張用）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // バックグラウンド同期処理
      console.log('Background sync triggered')
    );
  }
});

// Service Worker更新通知
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// エラーハンドリング
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');