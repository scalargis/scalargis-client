import React from 'react';
import { withTranslation, useTranslation} from "react-i18next";
import { Alert, Badge, Button, Group, TextInput } from '@mantine/core';
import { CollapsiblePanel, notify, IconList, IconCheck, IconFolderOpen, IconSave, IconX, IconInfoCircle } from '@scalargis/ui';

import { MainMenuButton } from '../../components';
import { translateValue } from '../../utils/i18n';
import { foldDiacritics } from '../../utils/common';
import Tree from './TOC/Tree';
import { traverseTree, findAllParents, findAllChildren } from './TOC/Model';

import './TOC/style.css';


/**
 * Actions
 */
export const actions = {
  toc_action1: () => console.log('Called toc_helper')
}

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { t } = useTranslation();

  const title = record.title || t("themes", "Temas");

  return (
    <MainMenuButton
      title={title}
      className={className}
      icon={<IconList />}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

class Main extends React.Component {

  constructor(props) {
    super(props);

    const { core } = props;
    const { opened } = props.config.viewer.config_json;

    const API_URL = core.API_URL;

    this.state = {
      isDraggable: true,
      dragging: false,
      config: props.config,
      filter: '',
      opened: opened || [],
      API_URL: API_URL
    }
  }

  traverseTree = (items, cb, parent = {}) => {
    items = items || [];
    items.map((child, i) => {
      cb(child, i, items, parent);
      traverseTree(child.children, cb, child);
      return child;
    });
  };

  openTheme(e, id) {
    const { opened } = this.state;
    const index = opened.indexOf(id);
    if (index === -1) opened.push(id);
    else opened.splice(index, 1);
    this.setState({ ...this.state, opened });

    if (this.props.actions.layers_set_opened && this.props.config.dispatch) {
      this.props.config.dispatch(this.props.actions.layers_set_opened(opened));
    }
  }

  toggle(id, layer_data, items) {
    const { activate_parents, deactivate_children, open_children, viewer } = this.props.config;
    const { layers } = viewer.config_json;
    const checked = Object.assign([], viewer.config_json.checked);

    // Toggle selected
    const index = checked.indexOf(id);
    if (index === -1) checked.push(id);
    else checked.splice(index, 1);

    //Uncheck other nodes (parent with exclusive == true)
    if (items && items.length) {
      items.forEach(child => {
        const index = checked.indexOf(child.id);
        if (child.id !== id && index > -1) checked.splice(index, 1);
      });
    }

    // If checked, activate all parents
    if (index === -1 && ((activate_parents && layer_data?.activate_parents !== false)
      || layer_data?.activate_parents === true)) {
      const parents = findAllParents(layers, id).filter(i => !!i);
      parents.forEach(p => {
        const index = checked.indexOf(p);
        if (index === -1) checked.push(p);
      });
    }

    // If unchecked deactivate all children
    if (index > -1 && ((deactivate_children && layer_data?.deactivate_children !== false)
      || layer_data?.deactivate_children === true)) {
      const children = findAllChildren(layers, [id]);
      children.forEach(p => {
        const index = checked.indexOf(p);
        if (p !== id && index > -1) checked.splice(index, 1);
      });
    }

    // Update all changes
    this.setState({ ...this.state, checked });
    if (this.props.actions.layers_set_checked && this.props.config.dispatch) {
      this.props.config.dispatch(this.props.actions.layers_set_checked(checked));
    }

    // Open direct children if checked
    if ((open_children && layer_data?.open_children !== false) || layer_data?.open_children) {
      if (checked.includes(id) && layer_data.type === 'GROUP') {
        const { opened } = this.state;
        const index = opened.indexOf(id);
        if (index === -1) {
          opened.push(id);
          this.setState({ ...this.state, opened });

          if (this.props.actions.layers_set_opened && this.props.config.dispatch) {
            this.props.config.dispatch(this.props.actions.layers_set_opened(opened));
          }
        }
      }
    }
  }

  opacity(e, theme, value) {
    const { layers } = this.props.config.viewer.config_json;
    const index = layers.findIndex(i => i.id === theme.id);
    const update = Object.assign({}, theme);
    update.opacity = value / 100;
    layers.splice(index, 1, update);
    this.setState({ ...this.state, layers });
    if (this.props.actions.layers_update_theme && this.props.config.dispatch) {
      this.props.config.dispatch(this.props.actions.layers_update_theme(update));
    }
  }

  removeThemes(themes) {
    this.setState({ ...this.state, confirmDeleteTheme: false });
    if (this.props.actions.viewer_remove_themes && this.props.config.dispatch) {
      this.props.config.dispatch(this.props.actions.viewer_remove_themes(themes));
    }
  }

  applyThemeChanges(theme) {
    const { layers } = this.props.config.viewer.config_json;
    const index = layers.findIndex(i => i.id === theme.id);
    const update = Object.assign({}, theme);
    layers.splice(index, 1, update);
    this.setState({ ...this.state, layers });
    if (this.props.actions.layers_update_theme && this.props.config.dispatch) {
      this.props.config.dispatch(this.props.actions.layers_update_theme(update));
    }
  }

  moveTheme(fromIndex, fromParent, toIndex, toParent) {
    const { layers } = this.props.config.viewer.config_json;
    const updated = Object.assign([], layers);

    const parentIndex = updated.findIndex(i => i.id === fromParent);
    const targetIndex = updated.findIndex(i => i.id === toParent);
    const idIndex = updated[parentIndex].children.indexOf(fromIndex);
    const target = Object.assign({}, updated[targetIndex]);

    // Disallow drag into children
    if (target.children.includes(toParent)) {
      return this.setState({ ...this.state, dragging: false });
    }

    // Fix index when drag n drop in the same parent and drag lesser index
    if (fromParent === toParent && idIndex < toIndex) toIndex--;

    // Update themes
    updated[parentIndex].children.splice(idIndex, 1);
    target.children.splice(toIndex, 0, fromIndex);
    updated.splice(targetIndex, 1, target);
    this.setState({ ...this.state, layers: updated, dragging: false });

    // Dispatch update global store
    if (this.props.actions.layers_update_theme && this.props.config.dispatch) {
      this.props.config.dispatch(this.props.actions.layers_update_theme(updated[parentIndex]));
      this.props.config.dispatch(this.props.actions.layers_update_theme(target));
      //if (checked.includes(fromIndex)) this.toggle(fromIndex);
    }
  };

  onZoomTheme(theme) {
    const { dispatch } = this.props.config;
    const { transform_extent, map_set_extent } = this.props.actions;

    // Dispatch zoom to theme action
    if (theme.crs && theme.bbox && transform_extent && map_set_extent && dispatch) {
      try {
        const target_proj = this.props.config.mainMap.getView().getProjection().getCode();
        const extent = transform_extent(theme.crs, target_proj, theme.bbox.split(' '));
        const center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2]
        dispatch(map_set_extent(center, extent));
      } catch (e) {
          console.log(e);
       }
    }
  }

  filterThemes(themes, filter) {
    const filterDone = [];
    // Accent- and case-insensitive substring match: fold both sides so
    // "analise" finds "Análise" (C-07). Fold (not regex) also sidesteps the
    // old raw-into-RegExp crash on regex metacharacters typed in the filter.
    const needle = foldDiacritics(filter);
    themes.forEach(n => {
      if (filterDone.includes(n.id)) return;
      if (!filter) {
        n.filtered = false
      } else {
        const hay = foldDiacritics(translateValue(n.title)) + ' ' + foldDiacritics(translateValue(n.description));
        n.filtered = hay.includes(needle) ? false : true;
      }
      filterDone.push(n.id);
      if (!n.filtered) {
        const parents = findAllParents(themes, n.id);
        themes.forEach(p => {
          if (filterDone.includes(p.id)) return;
          if (parents.includes(p.id)) {
            p.filtered = false;
            filterDone.push(p.id);
          }
        });
      }
    });
  }

  endDragging(e) {
    this.setState({ ...this.state, dragging: false })
  }


  changeFilter(e) {
    this.setState({ ...this.state, filter: e.target.value });
  }

  clearFilter(e) {
    this.setState({ ...this.state, filter: '' });
  }

  saveSession() {
    this.props.config.dispatch(this.props.actions.viewer_save_http_loading());

    //Get current session viewer config
    const { getViewerSessionConfig } = this.props.config.Models.MapModel;

    const { API_URL } = this.state;

    const viewer = this.props.config.viewer;
    const newconfig = getViewerSessionConfig(viewer);

    const record = {
      id: viewer.id,
      session_layers: Object.assign([], viewer?.session_layers),
      config_json: JSON.stringify(newconfig)
    }

    // Save request
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
    const logged = this.props.core.getLoggedUser();
    if (logged?.token) options.headers['X-API-KEY'] = logged.token;

    // Auth url. TODO: check for proxy
    let url = API_URL + '/app/viewer/session';
    url += '/' + record.id;
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          notify.success(
            this.props.t("saveSession", "Gravar sessão"),
            this.props.t("saveSessionSuccessMsg", "A sessão foi gravada com sucesso.")
          );
          this.props.config.dispatch(this.props.actions.viewer_session_saved(res.session));
        } else {
          throw new Error(this.props.t("saveSessionErrorMsg", "Não foi possível gravar a sessão."));
        }
      }).catch(error => {
        notify.error(
          this.props.t("unexpectedError", "Ocorreu um erro inesperado"),
          this.props.t("saveSessionErrorMsg", "Não foi possível gravar a sessão.")
        );
        this.props.config.dispatch(this.props.actions.viewer_save_http_error());
      });
  }

  loadSession() {
    const history= this.props.config.history;
    this.props.config.dispatch(this.props.actions.viewer_session_load(history));
    window.location.reload();
  }

  renderContent() {
    const {
      core,
      record,
      config,
      actions,
      withHeading
    } = this.props;

    const olmap = config.mainMap;
    const component_cfg = record.config_json || {};

    /*
    const { filter, opened, dragging } = this.state;
    const { layers, checked } = config.viewer.config_json;
    */
    const { filter, dragging } = this.state;
    const { layers, checked, opened } = config.viewer.config_json;

    if (!Array.isArray(layers)) return null;

    const main = layers.find(i => i.id === 'main');
    if (!main) return null;

    //User authentication
    const logged = core.getLoggedUser();

    // Filter themes
    this.filterThemes(layers, filter);

    // Get main items
    const tree = main.children.map(id => layers.find(l => l.id === id)).filter(i => !!i);

    // Compose actions
    const tocActions = {
      ...actions,
      open: this.openTheme.bind(this),
      toggle: this.toggle.bind(this),
      opacity: this.opacity.bind(this),
      moveTheme: this.moveTheme.bind(this),
      removeThemes: this.removeThemes.bind(this),
      onZoomTheme: this.onZoomTheme.bind(this),
      applyThemeChanges: this.applyThemeChanges.bind(this)
    }

    return (
      <div style={{ height: '100%' }}
        onMouseLeave={this.endDragging.bind(this)}
        onDrop={ev => {
          this.endDragging.bind(this)
        }}>

        <div id="layer-switcher" className={"plugin-main" + (dragging ? " dragging" : "")}>

          { !!withHeading && <h3>{this.props.t("themes","Temas")}</h3> }

          { (!!logged?.token && !!config.viewer.allow_user_session) &&
            <Group justify="space-between" wrap="nowrap" className="toc-session-toolbar mb-2">
              <div>
                {config.viewer.is_session &&
                  <Badge variant="light" color="informative" radius="xl"
                    leftSection={<IconCheck />}
                    title={this.props.t("sessionSaveInfo", `Gravada em ${config.viewer.session.date}`, {info: config.viewer.session.date} )}>
                    {this.props.t("session", "Sessão")}
                  </Badge>}
              </div>
              <Group gap={4} wrap="nowrap">
                {(config.viewer.session && !config.viewer.is_session) &&
                  <Button variant="subtle" size="compact-sm" type="button"
                    leftSection={<IconFolderOpen />}
                    onClick={e => this.loadSession()}
                    disabled={(config.viewer.save_loading)}
                    title={this.props.t("sessionSaveInfo", `Gravada em ${config.viewer.session.date}`, {info: config.viewer.session.date} )}>
                    {this.props.t("loadSession","Abrir sessão")}
                  </Button>}
                <Button variant="subtle" size="compact-sm" type="button"
                  leftSection={<IconSave />}
                  loading={config.viewer.save_loading}
                  onClick={e => this.saveSession()}>
                  {this.props.t("saveSession", "Gravar sessão")}
                </Button>
              </Group>
            </Group>
          }

          { tree.length ? (
            <>
            { component_cfg.show_filter !== false ? (
              <Group className="ads-input-group" gap={0} wrap="nowrap" align="stretch" mb="xs">
                <TextInput
                  size="sm"
                  placeholder={`${this.props.t('filter', "Filtro")}...`}
                  value={filter}
                  onChange={this.changeFilter.bind(this)}
                  style={{ flex: 1 }}
                />
                <Button
                  size="sm" type="button"
                  leftSection={<IconX />}
                  onClick={this.clearFilter.bind(this)}
                >
                  {this.props.t('clear', "Limpar")}
                </Button>
              </Group>
            ) : null }
            </>
          ) : (
            <Alert color="informative" py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                <IconInfoCircle />
                <span>{this.props.t("noTocThemesMsg", "Não existem temas. Clique no menu + para adicionar.")}</span>
              </Group>
            </Alert>
          ) }

          <Tree
            id="main"
            deep={0}
            core={core}
            record={record}
            items={tree}
            config={config}
            layers={layers}
            checked={checked}
            opened={opened}
            olmap={olmap}
            actions={tocActions}
            onDragStart={e => this.setState({ ...this.state, dragging: true })}
            isDraggable={this.state.isDraggable}
            setDraggable={(val) => this.setState({ ...this.state, isDraggable: val })}
          />

        </div>

      </div>
    );
  }

  render() {
    const { as } = this.props;

    if (as === 'panel') return (
      <CollapsiblePanel header={this.props.t("themes","Temas")} toggleable={false}>
        { this.renderContent() }
      </CollapsiblePanel>
    )

    if (as === 'button') return (
      <Button type="button">teste</Button>
    )

    // Render content
    return this.renderContent();
  }

}

export default withTranslation()(Main);
