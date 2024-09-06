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

    return (
        <React.Fragment>
            {dialogs.map( item => {
                const { key, config, child } = item;

                const closeLabel = item.closeLabel ? i18n.translateValue(item.closeLabel) : i18n.translateValue("close", "Fechar");
                const header = i18n.translateValue(config.header, config.header);

                return <Dialog
                    key={item.key}
                    visible={item.visible}
                    style={{width: isMobile ? '90%' : '35vw' }}
                    {...{...config, header}}
                    footer={(
                    <div className="p-grid">
                        <div className="p-col" style={{ textAlign: 'right'}}>
                        <Button label={closeLabel} onClick={e => {
                            core.store.dispatch(viewer_remove_dialog_window(key));
                        }} />
                        </div>
                    </div>
                    )}
                    onHide={e => core.store.dispatch(viewer_remove_dialog_window(key))}>

                    {child}

                </Dialog>
            })}
        </React.Fragment>
    );
};

export default DialogWindows;