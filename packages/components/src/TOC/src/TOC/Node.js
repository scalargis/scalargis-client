import React from "react";
import { withTranslation } from "react-i18next";
import Tree from "./Tree";
import { Checkbox } from 'primereact/checkbox';
import { RadioButton } from 'primereact/radiobutton';
import { Button } from 'primereact/button';
import DraggableItem from './DraggableItem';
import Legend from "./Legend";

import { i18n } from '@scalargis/components';

class Node extends React.Component {

  state = { detailsOpen: this?.props?.data?.details_opened || false }

  isChecked() {
    const { data, checked } = this.props;
    return checked.indexOf(data.id) > -1;
  }

  isOpen() {
    const { data, opened } = this.props;
    return opened.indexOf(data.id) > -1;
  }

  onClickZoom(e, theme) {
    e.preventDefault();
    this.props.actions.onZoomTheme(theme);
  }

  render() {
    const {
      i,
      parent,
      record,
      data,
      layers,
      config,
      deep,
      opened,
      checked,
      radioName,
      items,
      disabled,
      olmap,
      editNode,
      actions,
      core
    } = this.props;
    const { detailsOpen } = this.state;

    if (data.filtered) return null;

    // Check theme min/max scale visibility
    const onScale = actions.isThemeOnScale(olmap, data);

    // Check if is group
    const isGroup = data.type === 'GROUP';

    // Find node children
    const nodeChildren = (data.children || [])
      .map(id => layers.find(l => l.id === id))
      .filter(i => !!i);

    // Check if is hidden
    const isHidden = data.hidden === true;

    // Check if has visible childrens
    const isChildrenVisible = isGroup && (!nodeChildren.length || nodeChildren.filter(child => !child.hidden).length > 0);

    // Is dragabble
    //const draggable = (config.draggable === false ? false : true) && this.state.isDraggable;
    const draggable = (config.draggable === false ? false : true) && this.props.isDraggable;

    // TOC item style (ie tr element)
    const configItemTocStyle = data.toc_style?.item_style
    let tocItemStyle = {}
    if (configItemTocStyle) {
      tocItemStyle = configItemTocStyle.reduce((o, key) => ({ ...o, [key.style]: key.value }), {})
    }

    // TOC group style (ie table element) Not the same of Group of themes
    const configGroupTocStyle = data.toc_style?.group_style
    let tocGroupStyle = { width: '100%' }
    if (configGroupTocStyle) {
      tocGroupStyle = configGroupTocStyle.reduce((o, key) => ({ ...o, [key.style]: key.value }), { width: '100%' })
    }

   // TOC text style ( label element)
   const configTextTocStyle = data.toc_style?.text_style
   let tocTextStyle = {}
   if (configTextTocStyle) {
    tocTextStyle = configTextTocStyle.reduce((o, key) => ({ ...o, [key.style]: key.value }), { width: '100%' })
   }

    // Render theme node
    return (
      <React.Fragment>
        <DraggableItem i={i}
          hidden={isHidden}
          parent={parent}
          action={actions.moveTheme}
          models={config.Models}
          onDragStart={this.props.onDragStart}
          id={data.id}
          draggable={draggable}>

          <div style={tocGroupStyle}>
            <div className="p-d-flex p-flex-row p-jc-between p-flex-wrap">
    
              <div className="p-d-flex p-flex-row p-col-12 p-pl-0 p-pr-0" style={tocItemStyle}>

                {isGroup && (
                  <div className="group-button">
                    <Button
                      className="p-button-sm p-button-text"
                      style={!isChildrenVisible ? { visibility: "hidden" } : null}
                      title={this.props.t("showHideChildThemes", "Mostrar/esconder subtemas")}
                      icon={this.isOpen() ? "pi pi-chevron-down" : "pi pi-chevron-right"}
                      onClick={e => actions.open(e, data.id)}
                    />
                  </div>
                )}

                <div>
                  {!radioName ? (
                    <Checkbox
                      title={this.props.t("switchOnOffTheme", "Ligar/desligar tema")}
                      id={data.id}
                      checked={this.isChecked()}
                      onChange={e => actions.toggle(data.id, data)}
                      className={!isGroup ? "toc-leaf" : ""}
                    />
                  ) : (
                    <RadioButton
                      title={this.props.t("switchOnOffTheme", "Ligar/desligar tema")}
                      id={data.id}
                      name={radioName}
                      checked={this.isChecked()}
                      onChange={e => actions.toggle(data.id, data, items)}
                      className={!isGroup ? "toc-leaf" : ""}
                    />
                  )}
                </div>

                <div className={(onScale ? "title" : "title outofscale") + (isGroup ? " title-grp" : "") + " p-col p-pt-0 p-pb-0 p-pl-2 p-pr-0"}>

                  <div className="p-d-flex p-flex-row p-jc-between">
                    <div>
                      {data.style_color ? <i className='pi pi-square' style={{ color: `rgba(${data.style_color})` }} /> : null}
                      <label style={tocTextStyle} htmlFor={data.id} className={"label" + (isGroup ? " label-grp" : "") }>
                        {i18n.translateValue(data.title)}
                      </label>
                    </div>
                    <div>
                      <div className="buttons">
                        {data.show_details !== false ?
                          <Button
                            className={"p-button-sm" + (detailsOpen ? "" : " p-button-text")}
                            title={this.props.t("showHideDetails", "Mostrar/esconder detalhes")}
                            icon={this.isOpen() ? "pi pi-cog" : "pi pi-cog"}
                            onClick={e => this.setState({ ...this.state, detailsOpen: !detailsOpen })}
                          /> : null}
                        {' '}
                        {data.bbox && data.show_zoom_extent !== false ? (
                          <Button
                            className="p-button-sm p-button-text"
                            title={this.props.t("zoomTheme", "Enquadrar extensão do tema")}
                            icon="pi pi-search"
                            onClick={e => this.onClickZoom(e, data)}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {!data.system && (
                <div className={"theme-tools" + (detailsOpen ? "" : " hidden")}
                  onMouseEnter={(e) => this.props.setDraggable(false)}
                  onMouseLeave={(e) => this.props.setDraggable(true)} >

                  {core.renderComponents({
                    region: 'layer_tools',
                    props: { layer: data, actions, viewer: config.viewer, dispatch: config.dispatch, models: config.Models, mainMap: config.mainMap },
                    separator: " ",
                    parent: record
                  })}

                </div>
              )}

              {detailsOpen ? (
                <React.Fragment>
                  <div className="detail-container">
                    {core.renderComponents({
                      region: 'layer_tools_block',
                      props: { layer: data, actions, viewer: config.viewer, dispatch: config.dispatch, models: config.Models, mainMap: config.mainMap },
                      separator: " ",
                      parent: record
                    })}
                  </div>

                  <div className="detail-container">
                    {!!data.description &&
                      <div className="theme-description" dangerouslySetInnerHTML={{ __html: data.description }}></div>
                    }
                    <Legend data={data} core={core} actions={actions} models={config.Models} />
                  </div>
                </React.Fragment>
              ) : null}

              {isGroup && this.isOpen() ? (
                <div class="p-col-12 p-p-0">
                    <Tree
                      id={data.id}
                      record={record}
                      items={nodeChildren}
                      layers={layers}
                      config={config}
                      core={core}
                      deep={deep + 1}
                      opened={opened}
                      exclusive={data.exclusive}
                      checked={checked}
                      actions={actions}
                      disabled={!this.isChecked() || disabled}
                      editNode={editNode}
                      olmap={olmap}
                      onDragStart={this.props.onDragStart}
                      isDraggable={this.props.isDraggable}
                      setDraggable={this.props.setDraggable}
                    />
                </div>
              ) : null}

            </div>

          </div>

        </DraggableItem>
      </React.Fragment>
    );
  }
}

export default withTranslation()(Node);
