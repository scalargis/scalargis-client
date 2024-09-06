import { confirmDialog } from 'primereact/confirmdialog';
import { v4 as uuid } from 'uuid';

import defaults from '../components/Layers/defaults';
import { DocumentList } from '@scalargis/components';


export const VIEWER_ADD_THEME = 'Viewer/AddTheme';
export const VIEWER_REMOVE_THEME = 'Viewer/RemoveTheme';

export const VIEWER_SHOW_DOCUMENTS = 'Viewer/ShowDocuments';


export const viewer_add_theme = ({data, mainMap, viewer, core, dispatch, t}) => {
    const { actions } = core;
    const { viewer_add_themes, layers_set_checked, transform_extent, map_set_extent, viewer_add_notification } = actions;

    const themeId = data.themeId || uuid();

    const layer = viewer.config_json.layers.find( l => l.id === themeId);
    if (layer) {
        if (data.showError) {
            const msg = {
                severity: "warn",
                summary: t("addTheme","Adicionar Tema"),
                detail: t("warnThemeExists", "O tema já foi adicionado ao mapa.")
            }
            dispatch(viewer_add_notification({group: "viewer", message: msg}));
        }
        return;
    }

    let theme = {
        ...defaults[data.type],
        "id": themeId,
        "title": data.title,
        "description": data.description,
        "url": data.url
    }

    if (data.theme) {
        theme = {
            ...theme, 
            ...data.theme
        }
    }

    const doAction = () => {
        if (data.parentId) {
            const parent = viewer.config_json.layers.find( l => l.id === data.parentId);
            if (parent) dispatch(viewer_add_themes(parent.id, [theme], true));
            else dispatch(viewer_add_themes(null, [theme], true));
        } else {
            dispatch(viewer_add_themes(null, [theme], true));
        }

        if (data.checked !== false) {
            let checked = [...viewer.config_json.checked];
            checked = checked.concat([themeId]);
            dispatch(layers_set_checked(checked));
        }

        if (data.zoomExtent) {
            // Dispatch zoom to theme action
            if (theme.crs && theme.bbox && transform_extent && map_set_extent && dispatch) {
                try {
                let target_proj = mainMap.getView().getProjection().getCode();
                let extent = transform_extent(theme.crs, target_proj, theme.bbox.split(' '));
                let center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2]
                dispatch(map_set_extent(center, extent));
                } catch (e) {
                    console.log(e);
                }
            }
        }

        if (data.showSuccess) {
            const msg = {
                severity: "success",
                summary: t("addTheme", "Adicionar Tema"),
                detail: t("successActionMsg", "Operação realizada com sucesso.")
            }
            dispatch(viewer_add_notification({group: "viewer", message: msg}));
        }
    }

    if (data?.showConfirm) {
        confirmDialog({
            message: t("confirmAction", "Tem a certeza que deseja continuar?"),
            header: t("addTheme", "Adicionar Tema"),
            acceptLabel: t("yes", "Sim"),
            rejectLabel: t("no", "Não"),
            icon: 'pi pi-exclamation-triangle',
            accept: () => doAction()
        });
    } else {
        doAction();
    }
};

export const viewer_remove_theme = ({data, mainMap, viewer, core, dispatch, t}) => {
    const { actions } = core;
    const { viewer_remove_themes, viewer_add_notification } = actions;
    const { themeId } = data;

    const doAction = () => {
        const layer = viewer.config_json.layers.find( l => l.id === themeId);
        if (!layer) {
            if (data.showError) {
                const msg = {
                    severity: "warn",
                    summary: t("removeTheme", "Remover Tema"),
                    detail: t("warnThemeNotFound", "Não foi possível encontrar o tema na lista de temas do mapa")
                }
                dispatch(viewer_add_notification({group: "viewer", message: msg}));
            }
            return;
        }

        dispatch(viewer_remove_themes([data.themeId]));

        if (data.showSuccess) {
            const msg = {
                severity: "success",
                summary: t("removeTheme", "Remover Tema"),
                detail: t("successActionMsg", "Operação realizada com sucesso.")
            }
            dispatch(viewer_add_notification({group: "viewer", message: msg}));
        }
    }

    if (data?.showConfirm) {    
        confirmDialog({
            message: t("confirmAction", "Tem a certeza que deseja continuar?"),
            header: t("removeTheme", "Remover Tema"),
            acceptLabel: t("yes", "Sim"),
            rejectLabel: t("no", "Não"),
            icon: 'pi pi-exclamation-triangle',
            accept: () => doAction()
        });
    } else {
        doAction();
    }
}

export const viewer_show_documents = ({data, mainMap, viewer, core, dispatch, t}) => {
    const { actions } = core;
    const { viewer_add_dialog_window, viewer_update_dialog_window } = actions;

    const key = data.dialogKey || new Date().getTime();

    if (viewer?.dialogWindows?.length > 0) {
        const dw = viewer.dialogWindows.find(w => w.key === key);
        if (dw) {           
            const config = { 
                ...dw.config,
                header: data?.dialogOptions?.header || data.title
            }
            
            const childKey = new Date().getTime();
            const child = <DocumentList key={childKey} core={core} documentList={data} />

            dispatch(viewer_update_dialog_window({config: config, child: child, visible: true }));
            return;
        }
    }

    const config = Object.assign({}, data?.dialogOptions);
    config.key = key ;
    config.header = data?.dialogOptions?.header || data.title; 

    const childKey = new Date().getTime();
    const child = <DocumentList key={childKey} core={core} documentList={data} />

    dispatch(viewer_add_dialog_window({config, child}));
}

export const EventList = {
    VIEWER_ADD_THEME: { topic: VIEWER_ADD_THEME, fn: viewer_add_theme},
    VIEWER_REMOVE_THEME: { topic: VIEWER_REMOVE_THEME, fn: viewer_remove_theme},

    VIEWER_SHOW_DOCUMENTS: { topic: VIEWER_SHOW_DOCUMENTS, fn: viewer_show_documents}
}