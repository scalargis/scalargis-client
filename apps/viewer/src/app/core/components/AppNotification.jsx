import { useEffect } from "react";

import { notify } from '@scalargis/ui';

// Bridges the redux notifications list to the notify recipe (the Prime Toast
// this component mounted is gone; Notifications is app-wide via AdsProviders,
// so there is nothing to render). `life` maps to autoClose; without it each
// severity keeps the recipe default.
const AppNotification = (props) => {

    useEffect(() => {
        if (!props?.notifications?.length) return;

        const notification = props.notifications.slice(-1)[0];
        const message = notification.message;

        if (props?.filterGroups?.length && !props.filterGroups.includes(notification.group)) return;

        const show = notify[message.severity] || notify.info;
        show(message.summary, message.detail, message.life != null ? { autoClose: message.life } : undefined);
    }, [props?.notifications]);

    return null;
};

export default AppNotification;