import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { EventList } from './index';


export default function EventManager(props) {
    const { t } = useTranslation();

    const propsRef = useRef(props);

    useEffect(() => {
        propsRef.current = props;
    }, [props]); 

    useEffect(() => {
        if (!props?.core?.pubsub?.subscribe) return;

        const events = [];

        const list = EventList; 
        Object.keys(list).forEach(k => {
            const topic = list[k].topic;
            const unsubscribe = props.core.pubsub.subscribe(topic, (data) => {
                const { mainMap, viewer, core, dispatch } = propsRef.current;
                const fn = list[k].fn;

                fn({data, mainMap, viewer, core, dispatch, t});
            });
            events.push(unsubscribe);
        });

        return () => {
            (events || []).forEach(ev => ev());
        };
    }, []);

    return null;
}
