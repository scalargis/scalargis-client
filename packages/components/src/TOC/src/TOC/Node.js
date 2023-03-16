import React from "react";
import Tree from "./Tree";
import {Checkbox} from 'primereact/checkbox';
import { RadioButton } from 'primereact/radiobutton';
import { Button } from 'primereact/button';
import DraggableItem from './DraggableItem';
import Legend from "./Legend";

class Node extends React.Component {

  state = { detailsOpen: false }

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

    // Render theme node
    return (
      <React.Fragment>
        <DraggableItem i={i}
          parent={parent}
          action={actions.moveTheme}
          models={config.Models}
          onDragStart={this.props.onDragStart}
          id={data.id}
          draggable={config.draggable}>
          <table style={{width: '100%'}}>
            <tbody>
              <tr>
                <td className="activate">

                  { isGroup && (
                    <Button
                      className="p-button-sm p-button-text" 
                      title="Mostrar/esconder subtemas"
                      icon={this.isOpen() ? "pi pi-chevron-down" : "pi pi-chevron-right" }
                      onClick={e => actions.open(e, data.id)}
                    />
                  )}
                  
                  {!radioName ? (
                    <Checkbox
                      title="Ligar/desligar tema"
                      id={data.id}
                      checked={this.isChecked()}
                      onChange={e => actions.toggle(data.id, data)}
                      className={!isGroup ? "toc-leaf" : "" }
                    />
                  ) : (
                    <RadioButton 
                      title="Ligar/desligar tema" 
                      id={data.id}
                      name={radioName}
                      checked={this.isChecked()}
                      onChange={e => actions.toggle(data.id, data, items)}
                      className={!isGroup ? "toc-leaf" : "" }
                    />
                  )}
                </td>
                <td className={(onScale ? "title" : "title outofscale") + (isGroup ? " title-grp" : "")}>
                  { data.style_color ? <i className='pi pi-square' style={{color: `rgba(${data.style_color})` }} /> : null }
                  <label htmlFor={data.id} className={"label" + (isGroup ? " label-grp" : "") }>
                    {data.title}
                  </label>
                  { !data.system && (
                    <div className={"theme-tools" + (detailsOpen ? "" : " hidden") }>

                      { core.renderComponents({
                        region: 'layer_tools',
                        props: { layer: data, actions, viewer: config.viewer, dispatch: config.dispatch, models: config.Models, mainMap: config.mainMap },
                        separator: " ",
                        parent: record
                      })}

                    </div>
                  )}
                </td>
                <td className="buttons">
                  { data.show_details !== false ?
                  <Button
                    className={"p-button-sm" + (detailsOpen ? "" : " p-button-text") } 
                    title="Mostrar/esconder detalhes"
                    icon={this.isOpen() ? "pi pi-cog" : "pi pi-cog" }
                    onClick={e => this.setState({ ...this.state, detailsOpen: !detailsOpen })}
                  /> : null }
                  {' '}
                  { data.bbox && data.show_zoom_extent !== false ? (
                    <Button
                      className="p-button-sm p-button-text"
                      title="Zoom à extensão do tema"
                      icon="pi pi-search"
                      onClick={e => this.onClickZoom(e, data)}
                    />
                ) : null }
                </td>
              </tr>

              { detailsOpen ? (
                <tr>
                  <td colSpan="3">
                    { core.renderComponents({
                      region: 'layer_tools_block',
                      props: { layer: data, actions, viewer: config.viewer, dispatch: config.dispatch, models: config.Models, mainMap: config.mainMap },
                      separator: " ",
                      parent: record
                    })}
                  </td>
                </tr>
              ) : null }

              {detailsOpen ? (
                <tr className="detail-container">
                  <td colSpan="3">                    
                    { !!data.description && 
                      <div className="theme-description" dangerouslySetInnerHTML={{__html: data.description }}></div>
                    }
                    <Legend data={data} core={core} actions={actions} models={config.Models}/>
                  </td>
                </tr>
              ) : null}

              {isGroup && this.isOpen() ? (
                <tr>
                  <td colSpan="3">
                    <Tree
                      id={data.id}
                      record={record}
                      items={nodeChildren}
                      layers={layers}
                      config={config}
                      core={core}
                      deep={deep+1}
                      opened={opened}
                      exclusive={data.exclusive}
                      checked={checked}
                      actions={actions}
                      disabled={!this.isChecked() || disabled}
                      editNode={editNode}
                      olmap={olmap}
                      onDragStart={this.props.onDragStart}
                    />
                  </td>
                </tr>
              ) : null}

              </tbody>
          </table>
        </DraggableItem>
      </React.Fragment>
    );
  }
}

export default Node;
