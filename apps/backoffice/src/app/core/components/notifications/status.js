import dataProvider from '../../../service/DataProvider';
import { backoffice_set_notifications_total } from '../../actions';

/** Notification status values that the server derives from the checked and closed flags. */
export const NOTIFICATION_STATUS = Object.freeze({ OPEN: 0, READ: 1, CLOSED: 2 });

export const NOTIFICATION_STATUS_OPTIONS = [
  { value: NOTIFICATION_STATUS.OPEN, name: 'Por abrir' },
  { value: NOTIFICATION_STATUS.READ, name: 'Lida' },
  { value: NOTIFICATION_STATUS.CLOSED, name: 'Encerrado' }
];

/** Reads the count of open notifications and stores it for the menu badges. */
export const refreshNotificationsTotal = (apiUrl, dispatch) => {
  const params = {
    pagination: { page: 1, perPage: 5 },
    sort: { field: 'id', order: 'Asc' },
    filter: { status: [NOTIFICATION_STATUS.OPEN] }
  };
  return dataProvider(apiUrl + '/portal').getList('notifications', params)
    .then(d => dispatch(backoffice_set_notifications_total(d.total || 0)))
    .catch(() => null);
};
