import React from 'react'
//import MapModel from '../model/MapModel';
//import OWSModel from '../model/OWSModel';
import * as Utils from '../utils';
import dataProvider from '../../service/DataProvider';

export default function ModuleManager(props) {

  const { history, core, backoffice, dispatch, module } = props;

  return (
    <div>
      { core.renderComponentManager({
        id: module || 'cadastro',
        props: { history, backoffice, dispatch, Models: { Utils }, dataProvider },
        dataProvider: { dataProvider },
        //props: { history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } },
        as: 'panel'
      })}
    </div>
  )

  /*
  return (
    <div style={{display: 'flex', flexDirection: 'row', width: '100%', height: 'calc(100% - 50px)'}}>
      <div id="mainmenu" style={{ width: '58px' }}>
        
        { core.renderMainMenu({
          selected_menu,
          props: { history, viewer, dispatch, mainMap, Models: { Utils } }
          //props: { history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } }
        })}

      </div>

      <div id="content" style={{ backgroundColor: 'white', color: '#303030', overflowY: 'auto', flex: '1', width: '100%', padding: '5px' }}>
      
        { core.renderComponents({
          id: selected_menu,
          region: 'mainmenu',
          props: { history, viewer, dispatch, mainMap, Models: { Utils } },
          //props: { history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } },
          as: 'panel',
          style: getStyle
        })}

        { core.renderComponents({
          region: 'popup',
          props: { history, viewer, dispatch, mainMap, Models: { Utils } },
          //props: { history, viewer, dispatch, mainMap, Models: { MapModel, OWSModel, Utils } },
          as: 'popup'
        })}
        
      </div>
    </div>
  )
  */
}