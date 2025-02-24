import React, { useRef } from 'react';
import { withTranslation, useTranslation} from "react-i18next";
import Cookies from 'universal-cookie';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import Tree from './TOC/Tree';
import { traverseTree, traverseTreeRecursive, traverseTreeUpRecursiveById, findAllParents, findAllChildren } from './TOC/Model';
import './TOC/style.css';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { translateValue } from '../../utils/i18n';


const diffArray = (arr1, arr2) => arr1.concat(arr2)
    .filter(val => !(arr1.includes(val) && arr2.includes(val)));

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

  const component_cfg = record.config_json || {};
  const title = record.title || t("themes", "Temas");
  const header = component_cfg.header || title;

  return (
    <Button
      title={title}
      className={className}
      icon="pi pi-list"
      /*style={{ margin: '0.5em 1em' }}*/
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

class Main extends React.Component {

  constructor(props) {
    super(props);
    
    const { core } = props;
    const { opened } = props.config.viewer.config_json;

    const cookieAuthName = core.COOKIE_AUTH_NAME;
    const API_URL = core.API_URL;

    this.state = {
      isDraggable: true,
      dragging: false,
      config: props.config,
      filter: '',
      opened: opened || [],
      cookieAuthName: cookieAuthName,
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
    let { opened } = this.state;
    let index = opened.indexOf(id);
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
    let index = checked.indexOf(id);
    if (index === -1) checked.push(id);
    else checked.splice(index, 1);

    //Uncheck other nodes (parent with exclusive == true)
    if (items && items.length) {
      items.forEach(child => {
        let index = checked.indexOf(child.id);
        if (child.id !== id && index > -1) checked.splice(index, 1);
      });
    }
    
    // If checked, activate all parents
    if (index === -1 && ((activate_parents && layer_data?.activate_parents !== false)
      || layer_data?.activate_parents === true)) {
      let parents = findAllParents(layers, id).filter(i => !!i);
      parents.forEach(p => {
        let index = checked.indexOf(p);
        if (index === -1) checked.push(p);
      });
    }
    
    // If unchecked deactivate all children
    if (index > -1 && ((deactivate_children && layer_data?.deactivate_children !== false) 
      || layer_data?.deactivate_children === true)) {
      let children = findAllChildren(layers, [id]);
      children.forEach(p => {
        let index = checked.indexOf(p);
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
        let { opened } = this.state;
        let index = opened.indexOf(id);
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
    let { layers } = this.props.config.viewer.config_json;
    const index = layers.indexOf(theme);
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
    let { layers } = this.props.config.viewer.config_json;
    const index = layers.findIndex(i => i.id === theme.id);
    const update = Object.assign({}, theme);
    layers.splice(index, 1, update);
    this.setState({ ...this.state, layers });
    if (this.props.actions.layers_update_theme && this.props.config.dispatch) {
      this.props.config.dispatch(this.props.actions.layers_update_theme(update));
    }
  }

  moveTheme(fromIndex, fromParent, toIndex, toParent) {
    let { layers } = this.props.config.viewer.config_json;
    let updated = Object.assign([], layers);
    
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
        let target_proj = this.props.config.mainMap.getView().getProjection().getCode();
        let extent = transform_extent(theme.crs, target_proj, theme.bbox.split(' '));
        let center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2]
        dispatch(map_set_extent(center, extent));
      } catch (e) {
          console.log(e);
       }
    }
  }

  filterThemes(themes, filter) {
    const filterDone = [];
    let filterRegEx = new RegExp(filter, "i");
    themes.forEach(n => {
      if (filterDone.includes(n.id)) return;
      if (!filter) {
        n.filtered = false
      } else {
        n.filtered = filterRegEx.test(translateValue(n.title)) || filterRegEx.test(translateValue(n.description)) ? false : true;
      }
      filterDone.push(n.id);
      if (!n.filtered) {
        let parents = findAllParents(themes, n.id);
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

  saveSession(toastEl) {
    this.props.config.dispatch(this.props.actions.viewer_save_http_loading());

    //Get current session viewer config
    const { getViewerSessionConfig } = this.props.config.Models.MapModel;

    let { cookieAuthName, API_URL } = this.state;

    const viewer = this.props.config.viewer;
    const newconfig = getViewerSessionConfig(viewer);

    let record = {
      id: viewer.id,
      session_layers: Object.assign([], viewer?.session_layers),
      config_json: JSON.stringify(newconfig)
    }

    // Save request
    let options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'        
      },
      method: 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(cookieAuthName);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    // Auth url. TODO: check for proxy
    let url = API_URL + '/app/viewer/session';
    url += '/' + record.id;
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          toastEl.show({
            severity: 'success',
            summary: this.props.t("saveSession", "Gravar sessão"),
            detail: this.props.t("saveSessionSuccessMsg", "A sessão foi gravada com sucesso."),
            sticky: false
          });
          this.props.config.dispatch(this.props.actions.viewer_session_saved(res.session));       
        } else {
          throw new Error(this.props.t("saveSessionErrorMsg", "Não foi possível gravar a sessão."));        
        }
      }).catch(error => {
        toastEl.show({
          severity: 'error',
          summary: this.props.t("unexpectedError", "Ocorreu um erro inesperado"),
          detail: this.props.t("saveSessionErrorMsg", "Não foi possível gravar a sessão."),
          sticky: false
        });
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
    const { showOnPortal } = config.Models.Utils;

    if (!Array.isArray(layers)) return null;
    
    const main = layers.find(i => i.id === 'main');
    if (!main) return null;

    //User authentication
    const cookies = new Cookies();
    const cookieAuthName = core.COOKIE_AUTH_NAME;
    const cookieData = cookies.get(cookieAuthName);
    
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

    let toastEl = null;

    return (
      <div style={{ height: '100%' }} 
        onMouseLeave={this.endDragging.bind(this)}
        onDrop={ev => {
          this.endDragging.bind(this)
        }}>
        
        {showOnPortal(<Toast ref={(el) => toastEl = el} />)}

        <div id="layer-switcher" className={"plugin-main" + (dragging ? " dragging" : "")}>

          { !!withHeading && <h3>{this.props.t("themes","Temas")}</h3> }

          { (!!cookieData && !!config.viewer.allow_user_session) && 
            <Toolbar className="p-mb-2"
              left={(config.viewer.is_session && 
                <Button label={this.props.t("session", "Sessão")} className="p-button-sm p-button-rounded p-button-info" 
                  icon="pi pi-check" tooltip={this.props.t("sessionSaveInfo", `Gravada em ${config.viewer.session.date}`, {info: config.viewer.session.date} )}  />)} 
              right={ 
              <React.Fragment>
                {(config.viewer.session && !config.viewer.is_session) && <Button label={this.props.t("loadSession","Abrir sessão")} 
                  icon="pi pi-folder-open" 
                  className="p-button-text p-button-sm"
                  onClick={e => this.loadSession()}
                  disabled={(config.viewer.save_loading)}
                  tooltip={this.props.t("sessionSaveInfo", `Gravada em ${config.viewer.session.date}`, {info: config.viewer.session.date} )} />}
                <Button label={this.props.t("saveSession", "Gravar sessão")}
                  icon={config.viewer.save_loading ? "pi pi-spin pi-spinner": "pi pi-save"}
                  className="p-button-text p-button-sm"
                  onClick={e => this.saveSession(toastEl)} 
                  disabled={(config.viewer.save_loading)} />                                    
              </React.Fragment> } />
          }

          { !!tree.length ? (
            <>
            { component_cfg.show_filter !== false ? (
              <div className="p-inputgroup">
                <InputText 
                  placeholder={`${this.props.t('filter', "Filtro")}...`}
                  className="p-inputtext-sm p-mb-2"
                  value={filter}
                  onChange={this.changeFilter.bind(this)}
                />
                <Button
                  icon="pi pi-times"
                  label={this.props.t('clear', "Limpar")}
                  className="p-button-sm p-mb-2"
                  onClick={this.clearFilter.bind(this)}
                />
              </div>
            ) : null }
            </>
          ) : (
            <Message
              severity="info"
              text={this.props.t("noTocThemesMsg", "Não existem temas. Clique no menu + para adicionar.")}
            />
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
      <Panel header={this.props.t("themes","Temas")}>
        { this.renderContent() }
      </Panel>
    )

    if (as === 'button') return (
      <Button label="teste" />
    )

    // Render content
    return this.renderContent();
  }

}

export default withTranslation()(Main);