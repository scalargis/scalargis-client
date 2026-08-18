import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import * as Utils from '../utils';
import dataProvider from '../../service/DataProvider';


export default function ModuleManager(props) {

  const { history, core, backoffice, dispatch } = props;

  const { module, submodule, action } = useParams();

  // Plugin managers are registered via async import in Core.addComponent; the registry
  // can also be wiped + rebuilt mid-flight (StrictMode double-invokes Backoffice's
  // mount effect, dispatching backoffice_load twice). Tick for ~30s after mount so we
  // re-render when the registry becomes populated.
  const [, tick] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      if (Date.now() - start > 30000) clearInterval(id);
      tick(t => t + 1);
    }, 200);
    return () => clearInterval(id);
  }, [module]);

  const c = core?.config?.config_json?.components?.find(x => x.id === module);
  if (!c || !core?.__managers?.[c.type]) return <div />;

  return (
    <div>
      { core.renderComponentManager({
        id: module,
        submodule: submodule,
        action: action,
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

      <div id="content" style={{ backgroundColor: 'var(--mantine-color-body)', color: 'var(--mantine-color-text)', overflowY: 'auto', flex: '1', width: '100%', padding: '5px' }}>
      
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