import { useEffect, useState, useRef } from "react";

import { Toast } from 'primereact/toast';

const AppNotification = (props) => {

    const toast = useRef(null);

    const position = props?.position || "top-right";

    useEffect(() => {
        if (!props?.notifications?.length) return;

        const notification = props.notifications.slice(-1)[0];
        const message = notification.message;

        const life = message.life != null ? message.life : 3000;

        if (props?.filterGroups?.length) {
            if (props.filterGroups.includes(notification.group)) {
                toast.current.show({severity: message.severity, summary: message.summary, detail:message.detail, life: life});
            }
        } else {
            toast.current.show({severity: message.severity, summary: message.summary, detail:message.detail, life: life});
        }
    }, [props?.notifications]);

    return (
        <><Toast ref={toast} position={position} /></>
    );
};

export default AppNotification;