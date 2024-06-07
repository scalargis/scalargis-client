import React, { useState } from 'react'
import { TabMenu } from 'primereact/tabmenu';

/* Define manager components in ManagerComponents folder and import here */


/**
 * Manager component
 */
export default function Manager({ className, config, actions, record }) {

  const title = record?.title || 'Layer compare'

  const [activeIndex, set_activeIndex] = useState(0)

  const items = [
    { label: 'Configurações', icon: 'pi pi-fw pi-cog' }
  ];



  return (
    <React.Fragment>
      <TabMenu model={items} activeIndex={activeIndex} onTabChange={(e) => set_activeIndex(e.index)} />

      {activeIndex === 0 ?
        <div className="card dashboard">TODO</div>
        : null}

    </React.Fragment>

  )
}