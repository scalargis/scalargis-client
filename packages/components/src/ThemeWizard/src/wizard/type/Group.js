import React, {Component} from 'react';
import { InputText } from 'primereact/inputtext';
import { v4 as uuidV4 } from 'uuid'

class Group extends Component {

  componentDidMount() {
    let { data, setData, setSelected } = this.props;
    
    // Create theme
    let theme = {
      "type": "GROUP",
      "active": true,
      "id": String(uuidV4()),
      "_title": "Grupo",
      "opacity": 1,
      "open": true,
      "children": [],
      "selectable": false
    };

    // Add if not exists
    if (data.dataitems.length === 0) data.dataitems.push(theme);
    else if (data.dataitems[0].type !== 'GROUP') data.dataitems = [theme];
    else theme = data.dataitems[0];

    setData(data);
  }

  changeName(value) {
    let { data, editField, setSelected } = this.props;
    if (value.trim()) {
      const title = value;
      let theme = data.dataitems[0];
      if (theme) {
        theme.title = title;
        editField('dataitems', Object.assign([], data.dataitems));
      } else {
        theme = {
          "type": "GROUP",
          "active": true,
          "id": String(uuidV4()),
          "title": title,
          "opacity": 1,
          "open": true,
          "children": [],
          "selectable": false
        };
        editField('dataitems', Object.assign([], [theme]));      
      }
      let selection = {};
      selection[theme.id] = { checked: true, partialChecked: false };
      setSelected(selection);
    } else {
      editField('dataitems', []);
      setSelected([]);
    }
  }

  /**
   * Render WMS wizard
   */
  render() {
    const { data } = this.props;
    const theme = data.dataitems.length ? data.dataitems[0] : null;

    return (
      <React.Fragment>
        <InputText placeholder='Nome do grupo...'
          value={theme ? theme.title : ''}
          onChange={e => this.changeName(e.target.value)}
          style={{ width: '100%' }}
        />
      </React.Fragment>
    )
  }
}

export default Group;
