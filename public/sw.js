// Service Worker for Glance AVOC
const CACHE_NAME = 'glance-avoc-v2';
const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
const PANOPTO_CHECK_EXPIRY = 30 * 60 * 1000; // 30 minutes expiry

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // Activate updated SW immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css'
        ]);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message || 'You have a new notification',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: data.tag || 'glance-notification',
      data: data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Glance AVOC', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action) {
    // Handle specific actions
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle notification actions
function handleNotificationAction(action, data) {
  switch (action) {
    case 'complete_panopto_check':
      // Mark Panopto check as completed
      completePanoptoCheck(data.checkId);
      break;
    case 'view_panopto_checks':
      // Open Panopto checks page
      clients.openWindow('/panopto');
      break;
    default:
      // Default action
      clients.openWindow('/');
  }
}

// Complete Panopto check
async function completePanoptoCheck(checkId) {
  try {
    // Store completion in IndexedDB for offline sync
    const db = await openDB('glance-avoc', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('panopto-checks')) {
          db.createObjectStore('panopto-checks', { keyPath: 'id' });
        }
      }
    });
    
    await db.put('panopto-checks', {
      id: checkId,
      completed: true,
      completedAt: new Date().toISOString()
    });
    
    console.log('Panopto check completed:', checkId);
  } catch (error) {
    console.error('Error completing Panopto check:', error);
  }
}

// Background sync for Panopto checks
self.addEventListener('sync', (event) => {
  if (event.tag === 'panopto-check-sync') {
    event.waitUntil(syncPanoptoChecks());
  }
});

// Sync Panopto checks with server
async function syncPanoptoChecks() {
  try {
    const db = await openDB('glance-avoc', 1);
    const tx = db.transaction('panopto-checks', 'readonly');
    const store = tx.objectStore('panopto-checks');
    const getAllRequest = store.getAll();
    const completedChecks = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    
    // Send completed checks to server
    for (const check of completedChecks) {
      if (check.completed) {
        // TODO: Send to Supabase when online
        console.log('Syncing completed check:', check.id);
      }
    }
  } catch (error) {
    console.error('Error syncing Panopto checks:', error);
  }
}

// IndexedDB helper
function openDB(name, version, upgradeOrCallback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      try {
        const db = event.target.result;
        // Support both a direct function argument and an object with an `upgrade` function
        if (typeof upgradeOrCallback === 'function') {
          upgradeOrCallback(db);
        } else if (
          upgradeOrCallback &&
          typeof upgradeOrCallback.upgrade === 'function'
        ) {
          upgradeOrCallback.upgrade(db);
        }
      } catch (err) {
        // Log and rethrow so callers see the failure
        console.error('openDB onupgradeneeded error:', err);
        throw err;
      }
    };
  });
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  switch (event.data.type) {
    case 'REGISTER_PANOPTO_CHECKS':
      registerPanoptoChecks(event.data.events);
      break;
    case 'CLEAR_PANOPTO_CHECKS':
      clearPanoptoChecks();
      break;
    case 'COMPLETE_PANOPTO_CHECK':
      completePanoptoCheck(event.data.checkId);
      break;
    case 'GET_PANOPTO_CHECKS':
      getPanoptoChecks(event.source);
      break;
    case 'TEST_PANOPTO_CHECK':
      sendPanoptoCheckNotification(event.data.event, event.data.checkNumber);
      break;
  }
});

// Register Panopto checks for events
async function registerPanoptoChecks(events) {
  try {
    const db = await openDB('glance-avoc', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('panopto-events')) {
          db.createObjectStore('panopto-events', { keyPath: 'eventId' });
        }
      }
    });
    
    // Clear existing checks (use a transaction and object store API)
    const clearTx = db.transaction('panopto-events', 'readwrite');
    const eventsStore = clearTx.objectStore('panopto-events');
    eventsStore.clear();
    await new Promise((resolve, reject) => {
      clearTx.oncomplete = resolve;
      clearTx.onerror = () => reject(clearTx.error);
      clearTx.onabort = () => reject(clearTx.error);
    });
    
    // Register new events with recording resources
    for (const event of events) {
      if (hasRecordingResource(event)) {
        const tx = db.transaction('panopto-events', 'readwrite');
        const store = tx.objectStore('panopto-events');
        store.put({
          eventId: event.id,
          eventName: event.event_name,
          startTime: event.start_time,
          endTime: event.end_time,
          date: event.date,
          roomName: event.room_name,
          instructorName: event.instructor_name,
          registeredAt: new Date().toISOString()
        });
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
      }
    }
    
    // Start checking for Panopto checks
    schedulePanoptoChecks();
    
  } catch (error) {
    console.error('Error registering Panopto checks:', error);
  }
}

// Check if event has recording resource
function hasRecordingResource(event) {
  if (!event.resources) return false;
  
  try {
    const resources = typeof event.resources === 'string' 
      ? JSON.parse(event.resources) 
      : event.resources;
    
    return resources.some(resource => 
      resource.itemName && 
      resource.itemName.toLowerCase().includes('recording')
    );
  } catch (error) {
    console.error('Error parsing event resources:', error);
    return false;
  }
}

// Schedule Panopto checks
function schedulePanoptoChecks() {
  // Check every minute for events that need Panopto checks
  setInterval(async () => {
    await checkForPanoptoChecks();
  }, 60000); // Check every minute
}

// Check for Panopto checks that are due
async function checkForPanoptoChecks() {
  try {
    const db = await openDB('glance-avoc', 1);
    const tx = db.transaction('panopto-events', 'readonly');
    const store = tx.objectStore('panopto-events');
    const getAllRequest = store.getAll();
    const events = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    const now = new Date();
    
    for (const event of events) {
      const eventStart = new Date(`${event.date}T${event.startTime}`);
      const eventEnd = new Date(`${event.date}T${event.endTime}`);
      
      // Check if event is currently happening
      if (now >= eventStart && now <= eventEnd) {
        const timeSinceStart = now.getTime() - eventStart.getTime();
        const checkNumber = Math.floor(timeSinceStart / PANOPTO_CHECK_INTERVAL) + 1;
        
        // Check if this check number is due
        const checkDueTime = eventStart.getTime() + (checkNumber - 1) * PANOPTO_CHECK_INTERVAL;
        const timeUntilCheck = checkDueTime - now.getTime();
        
        if (timeUntilCheck <= 0 && timeUntilCheck > -PANOPTO_CHECK_EXPIRY) {
          // Check is due - send notification
          await sendPanoptoCheckNotification(event, checkNumber);
        }
      }
    }
    
    // Clean up expired checks
    await cleanupExpiredChecks();
    
  } catch (error) {
    console.error('Error checking for Panopto checks:', error);
  }
}

// Send Panopto check notification
async function sendPanoptoCheckNotification(event, checkNumber) {
  const checkId = `${event.eventId}-check-${checkNumber}`;
  
  // Check if this check has already been sent
  const db = await openDB('glance-avoc', 1);
  let existingCheck = null;
  {
    const tx = db.transaction('panopto-checks', 'readonly');
    const store = tx.objectStore('panopto-checks');
    const getReq = store.get(checkId);
    existingCheck = await new Promise((resolve, reject) => {
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  
  if (existingCheck) {
    return; // Already sent
  }
  
  // Store the check
  {
    const tx = db.transaction('panopto-checks', 'readwrite');
    tx.objectStore('panopto-checks').put({
      id: checkId,
      eventId: event.eventId,
      eventName: event.eventName,
      checkNumber,
      createdAt: new Date().toISOString(),
      completed: false
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  
  // Send push notification
  const title = `Panopto Check #${checkNumber}`;
  const message = `Time to check Panopto for ${event.eventName} in ${event.roomName}`;
  
  const options = {
    body: message,
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: checkId,
    data: {
      type: 'panopto_check',
      checkId,
      eventId: event.eventId,
      eventName: event.eventName,
      checkNumber
    },
    actions: [
      {
        action: 'complete_panopto_check',
        title: 'Complete Check',
        icon: '/logo192.png'
      },
      {
        action: 'view_panopto_checks',
        title: 'View All Checks',
        icon: '/logo192.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };
  
  await self.registration.showNotification(title, options);
  
  // Notify the main app about the new check
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PANOPTO_CHECK_CREATED',
        check: {
          id: checkId,
          eventId: event.eventId,
          eventName: event.eventName,
          checkNumber,
          createdAt: new Date().toISOString(),
          completed: false,
          roomName: event.roomName,
          instructorName: event.instructorName
        }
      });
    });
  });
}

// Clean up expired checks
async function cleanupExpiredChecks() {
  try {
    const db = await openDB('glance-avoc', 1);
    const txRead = db.transaction('panopto-checks', 'readonly');
    const readStore = txRead.objectStore('panopto-checks');
    const getAllReq = readStore.getAll();
    const checks = await new Promise((resolve, reject) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
    await new Promise((resolve, reject) => {
      txRead.oncomplete = resolve;
      txRead.onerror = () => reject(txRead.error);
      txRead.onabort = () => reject(txRead.error);
    });
    const now = new Date();
    
    for (const check of checks) {
      const checkTime = new Date(check.createdAt);
      const age = now.getTime() - checkTime.getTime();
      
      if (age > PANOPTO_CHECK_EXPIRY && !check.completed) {
        // Remove expired check
        const txDel = db.transaction('panopto-checks', 'readwrite');
        txDel.objectStore('panopto-checks').delete(check.id);
        await new Promise((resolve, reject) => {
          txDel.oncomplete = resolve;
          txDel.onerror = () => reject(txDel.error);
          txDel.onabort = () => reject(txDel.error);
        });
        console.log('Removed expired check:', check.id);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired checks:', error);
  }
}

// Get Panopto checks and send to main app
async function getPanoptoChecks(source) {
  try {
    const db = await openDB('glance-avoc', 1);
    const tx = db.transaction('panopto-checks', 'readonly');
    const store = tx.objectStore('panopto-checks');
    const getAllReq = store.getAll();
    const checks = await new Promise((resolve, reject) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    
    // Send checks to main app
    source.postMessage({
      type: 'PANOPTO_CHECKS_UPDATED',
      checks: checks
    });
  } catch (error) {
    console.error('Error getting Panopto checks:', error);
  }
}

// Clear all Panopto checks
async function clearPanoptoChecks() {
  try {
    const db = await openDB('glance-avoc', 1);
    // Clear panopto-events
    const tx1 = db.transaction('panopto-events', 'readwrite');
    tx1.objectStore('panopto-events').clear();
    await new Promise((resolve, reject) => {
      tx1.oncomplete = resolve;
      tx1.onerror = () => reject(tx1.error);
      tx1.onabort = () => reject(tx1.error);
    });

    // Clear panopto-checks
    const tx2 = db.transaction('panopto-checks', 'readwrite');
    tx2.objectStore('panopto-checks').clear();
    await new Promise((resolve, reject) => {
      tx2.oncomplete = resolve;
      tx2.onerror = () => reject(tx2.error);
      tx2.onabort = () => reject(tx2.error);
    });

    console.log('Cleared all Panopto checks');
  } catch (error) {
    console.error('Error clearing Panopto checks:', error);
  }
} 