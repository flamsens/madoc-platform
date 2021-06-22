import { stringify } from 'query-string';
import { ApiClient } from '../../gateway/api';
import { NotificationList, NotificationRequest } from '../../types/notifications';
import { BaseExtension } from '../extension-manager';

export class NotificationExtension implements BaseExtension {
  api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  getAllNotifications(page = 0) {
    return this.api.request<NotificationList>(`/api/madoc/notifications?${stringify({ page })}`);
  }

  getNotificationCount() {
    return this.api.request<{ unread: number }>(`/api/madoc/notifications/count`);
  }

  readNotification(id: string) {
    return this.api.request(`/api/madoc/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  createNotification(req: NotificationRequest) {
    return this.api.request(`/api/madoc/notifications`, {
      method: 'POST',
      body: req,
    });
  }

  clearNotification(id: string) {
    return this.api.request(`/api/madoc/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  readAllNotifications() {
    return this.api.request(`/api/madoc/notifications/read-all`, {
      method: 'POST',
    });
  }

  clearAllNotifications() {
    return this.api.request(`/api/madoc/notifications/clear-all`, {
      method: 'POST',
    });
  }
}