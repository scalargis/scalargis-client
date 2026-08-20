import React, { useState } from 'react'
import { Tabs } from '@mantine/core';
import { IconCog } from '@scalargis/ui';

/* Define manager components in ManagerComponents folder and import here */


/**
 * Manager component
 */
export default function Manager({ className, config, actions, record }) {

  const title = record?.title || 'Layer compare'

  const [activeTab, setActiveTab] = useState('settings')

  return (
    <React.Fragment>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="settings" leftSection={<IconCog fixedWidth />}>
            Configurações
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {activeTab === 'settings' ?
        <div className="card dashboard">TODO</div>
        : null}

    </React.Fragment>

  )
}
