/**
 * MedNavbat — In-App Notification Service
 * ──────────────────────────────────────────
 * Manages in-app notifications for patients, doctors, and admins.
 * Supports:
 * - 'rate_doctor': Prompt patient to rate doctor after "Tekshirildi"
 * - 'complaint_reply': Admin responded to patient's complaint
 * - 'system': General system notifications
 */

const NOTIFICATIONS_KEY = 'mednavbat_notifications';

function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(data) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(data));
    // Trigger custom event so any component in same window updates immediately
    window.dispatchEvent(new CustomEvent('mednavbat_notifications_changed', { detail: data }));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}

function uid() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Get all notifications for a specific user (by ID or Phone)
 */
export function getUserNotifications(userId, userPhone) {
  const all = loadNotifications();
  return all.filter(n => {
    if (!n.user_id) return true;
    if (n.user_id === 'all') return true;
    if (userId && n.user_id === userId) return true;
    if (userPhone && n.user_phone && n.user_phone.replace(/\s+/g, '') === userPhone.replace(/\s+/g, '')) return true;
    return false;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Add a new notification
 */
export function addNotification({
  userId,
  userPhone,
  type = 'rate_doctor',
  appointmentId,
  doctorId,
  doctorName,
  title,
  message
}) {
  const notification = {
    id: uid(),
    user_id: userId || 'all',
    user_phone: userPhone || '',
    type, // 'rate_doctor' | 'complaint_reply' | 'system'
    appointment_id: appointmentId || null,
    doctor_id: doctorId || null,
    doctor_name: doctorName || '',
    title: title || 'Yangi bildirishnoma',
    message: message || '',
    is_read: false,
    created_at: new Date().toISOString()
  };

  const all = loadNotifications();
  all.unshift(notification);
  saveNotifications(all);

  // Attempt browser push notification if supported & permitted
  sendPushNotificationIfSupported(notification.title, {
    body: notification.message,
    icon: '/favicon.ico',
    tag: notification.id
  });

  return notification;
}

/**
 * Mark a single notification as read
 */
export function markNotificationAsRead(notificationId) {
  const all = loadNotifications();
  const idx = all.findIndex(n => n.id === notificationId);
  if (idx !== -1) {
    all[idx].is_read = true;
    saveNotifications(all);
    return all[idx];
  }
  return null;
}

/**
 * Mark all notifications for a user as read
 */
export function markAllNotificationsAsRead(userId, userPhone) {
  const all = loadNotifications();
  all.forEach(n => {
    const isMatch = (userId && n.user_id === userId) || 
                    (userPhone && n.user_phone && n.user_phone.replace(/\s+/g, '') === userPhone.replace(/\s+/g, '')) ||
                    n.user_id === 'all';
    if (isMatch) {
      n.is_read = true;
    }
  });
  saveNotifications(all);
}

/**
 * Get count of unread notifications for a user
 */
export function getUnreadNotificationCount(userId, userPhone) {
  const list = getUserNotifications(userId, userPhone);
  return list.filter(n => !n.is_read).length;
}

/**
 * Helper for browser / mobile push notifications
 */
export function sendPushNotificationIfSupported(title, options = {}) {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, options);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, options);
          }
        });
      }
    }
  } catch {
    // Ignore in non-supporting environments (e.g. some webviews)
  }
}
