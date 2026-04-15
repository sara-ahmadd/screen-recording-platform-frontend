const NOTIFICATIONS_UPDATED_EVENT = "notifications:updated";

type NotificationsUpdatedDetail = {
  notifications?: any[];
  unreadCount?: number;
};

export function emitNotificationsUpdated(detail?: NotificationsUpdatedDetail) {
  window.dispatchEvent(new CustomEvent<NotificationsUpdatedDetail>(NOTIFICATIONS_UPDATED_EVENT, { detail }));
}

export function subscribeNotificationsUpdated(
  onUpdated: (detail?: NotificationsUpdatedDetail) => void,
) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<NotificationsUpdatedDetail>;
    onUpdated(customEvent.detail);
  };
  window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
}
