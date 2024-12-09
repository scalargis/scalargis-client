import React from "react";

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

import { utils, i18n } from '@scalargis/components';


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

                const closeLabel = item.closeLabel ? i18n.translateValue(item.closeLabel) : i18n.translateValue("close", "Fechar");
                const header = i18n.translateValue(config.header, config.header);

                return <Dialog
                    visible={item.visible}
                    style={{width: isMobile ? '90%' : '35vw' }}
                    {...{...config, header}}
                    key={item.key}
                    footer={(
                    <div className="grid">
                        <div className="col">
                            <Button label={closeLabel} onClick={e => onDialogClose(item)} />
                        </div>
                    </div>
                    )}
                    onHide={e => onDialogClose(item)}>

                    {child}

                </Dialog>
            })}
        </React.Fragment>
    );
};

export default DialogWindows;