// Service Worker for Glance AVOC
const CACHE_NAME = 'glance-avoc-v2';
const PANOPTO_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
const PANOPTO_CHECK_EXPIRY = 29 * 60 * 1000; // 29 minutes expiry

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
  
  // Always just open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Handle notification actions (simplified - no auto-complete)
function handleNotificationAction(action, data) {
  // Default action - just open the app
  clients.openWindow('/');
}

// Initialize the database with all required object stores
function getDBUpgradeConfig() {
  return {
    upgrade(db) {
      console.log('Upgrading IndexedDB, existing stores:', Array.from(db.objectStoreNames));
      
      if (!db.objectStoreNames.contains('panopto-checks')) {
        console.log('Creating panopto-checks object store');
        db.createObjectStore('panopto-checks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('panopto-events')) {
        console.log('Creating panopto-events object store');
        db.createObjectStore('panopto-events', { keyPath: 'eventId' });
      }
      
      console.log('IndexedDB upgrade complete, stores:', Array.from(db.objectStoreNames));
    }
  };
}

// Note: Panopto check completion is now handled by the main app only
// This function is kept for backward compatibility but does nothing
async function completePanoptoCheck(checkId) {
  console.log('Panopto check completion should be handled by the main app:', checkId);
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
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig());
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
      sendPanoptoCheckNotification(event.data.event, event.data.checkNumber, true); // Force test notifications
      break;
    case 'CLEAR_TEST_CHECKS':
      clearTestChecks();
      break;
  }
});

// Register Panopto checks for events
async function registerPanoptoChecks(events) {
  try {
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig());
    
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
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig());
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
          await sendPanoptoCheckNotification(event, checkNumber, false);
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
async function sendPanoptoCheckNotification(event, checkNumber, forceTest = false) {
  const checkId = `${event.eventId}-check-${checkNumber}`;
  
  try {
    // Ensure database is properly initialized
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig()); // Increment version to force upgrade
    
    // Check if this check has already been sent (skip for test notifications)
    let existingCheck = null;
    if (!forceTest) {
      try {
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
      } catch (error) {
        console.error('Error checking existing check:', error);
        // Continue anyway - the check might not exist
      }
      
      if (existingCheck) {
        console.log('Check already exists:', checkId);
        return; // Already sent
      }
    } else {
      console.log('Forcing test notification for:', checkId);
    }
    
    // Store the check
    try {
      const tx = db.transaction('panopto-checks', 'readwrite');
      tx.objectStore('panopto-checks').put({
        id: checkId,
        eventId: event.eventId,
        eventName: event.eventName,
        checkNumber,
        createdAt: new Date().toISOString(),
        completed: false,
        roomName: event.roomName,
        instructorName: event.instructorName
      });
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      console.log('Stored Panopto check:', checkId);
    } catch (error) {
      console.error('Error storing check:', error);
      // Continue anyway - we can still send the notification
    }
  } catch (error) {
    console.error('Error with IndexedDB in sendPanoptoCheckNotification:', error);
    // Continue with notification even if storage fails
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
    requireInteraction: true,
    silent: false
  };
  
  await self.registration.showNotification(title, options);
  
  // Remove the message sending to main app - we only want the main app to handle notifications
  console.log('Push notification sent for Panopto check:', checkId);
}

// Clean up expired checks
async function cleanupExpiredChecks() {
  try {
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig());
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
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig());
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
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig());
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

// Clear test checks only (for better testing experience)
async function clearTestChecks() {
  try {
    const db = await openDB('glance-avoc', 2, getDBUpgradeConfig());
    
    // Get all checks and remove test ones (those with eventId > 999000)
    const tx = db.transaction('panopto-checks', 'readwrite');
    const store = tx.objectStore('panopto-checks');
    const getAllReq = store.getAll();
    const checks = await new Promise((resolve, reject) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
    
    // Delete test checks
    for (const check of checks) {
      if (check.eventId >= 999000) {
        store.delete(check.id);
      }
    }
    
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    console.log('Cleared test Panopto checks');
  } catch (error) {
    console.error('Error clearing test Panopto checks:', error);
  }
} 