import React from "react";

import { Button, Group } from '@mantine/core';
import { Dialog } from '@scalargis/ui';

import { utils, i18n } from '@scalargis/components';


// Producers (events glue, DocumentBrowser, IntersectLayers, plugin
// components) dispatch Prime-Dialog-shaped configs: header, maximizable,
// style {width, height}, className, modal. Translate that surface onto the
// Dialog recipe here so no producer has to change.
const DialogWindows = (props) => {

    const { core } = props;
    const { actions } = core;
    const { viewer_remove_dialog_window } = actions;

    const dialogs =  Object.assign([], props?.dialogWindows);

    const isMobile = utils.isMobile();

    const onDialogClose = (evt) => {
        if (evt.onClose && evt.onClose(evt) === false) {
            return;
        }
        core.store.dispatch(viewer_remove_dialog_window(evt.key));
    }

    return (
        <React.Fragment>
            {dialogs.map( item => {
                const { key, config, child } = item;
                const { header, maximizable, style, className, modal } = config || {};

                const closeLabel = item.closeLabel ? i18n.translateValue(item.closeLabel) : i18n.translateValue("close", "Fechar");
                const title = i18n.translateValue(header, header);

                return <Dialog
                    key={key}
                    opened={!!item.visible}
                    onClose={e => onDialogClose(item)}
                    title={title}
                    maximizable={!!maximizable}
                    size={style?.width || (isMobile ? '90%' : '35vw')}
                    height={style?.height}
                    withOverlay={modal !== false}
                    className={className}
                    footer={(
                        <Group justify="flex-end">
                            <Button type="button" onClick={e => onDialogClose(item)}>{closeLabel}</Button>
                        </Group>
                    )}>

                    {child}

                </Dialog>
            })}
        </React.Fragment>
    );
};

export default DialogWindows;