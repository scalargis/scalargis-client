import React from "react";
import Tree from "./Tree";
import {Checkbox} from 'primereact/checkbox';
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
          id={data.id}>
          <table style={{width: '100%'}}>
            <tbody>
              <tr>
                <td className="activate">

                  { isGroup && (
                    <Button
                      className="p-button-sm p-button-text" 
                      title="Mostrar/esconder subtemas"
                      size="mini"
                      icon={this.isOpen() ? "pi pi-chevron-down" : "pi pi-chevron-right" }
                      onClick={e => actions.open(e, data.id)}
                    />
                  )}
                  
                  {!radioName ? (
                    <Checkbox
                      toggle
                      title="Ligar/desligar tema"
                      size="mini"
                      id={data.id}
                      checked={this.isChecked()}
                      onChange={e => actions.toggle(data.id)}
                      className={!isGroup ? "toc-leaf" : "" }
                    />
                  ) : (
                    <Checkbox
                      radio
                      title="Ligar/desligar tema"
                      size="mini"
                      id={data.id}
                      name={radioName}
                      checked={this.isChecked()}
                      onChange={e => actions.toggle(data.id)}
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
                  <Button
                    className={"p-button-sm" + (detailsOpen ? "" : " p-button-text") } 
                    title="Mostrar/esconder detalhes"
                    size="mini"
                    icon={this.isOpen() ? "pi pi-cog" : "pi pi-cog" }
                    onClick={e => this.setState({ ...this.state, detailsOpen: !detailsOpen })}
                  />{' '}
                  { data.bbox ? (
                    <Button
                      className="p-button-sm p-button-text"
                      title="Zoom à extensão do tema"
                      icon="pi pi-search"
                      size='mini'
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
                    <Legend data={data} actions={actions} />
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
