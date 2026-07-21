import React from 'react';
import { UnstyledButton } from '@mantine/core';
import { CollapsiblePanel } from '@scalargis/ui';

export const Contact = (props) => {

    const {core, name, email, icon} = props;

    const CLIENT_URL = core.CLIENT_URL;

    return (
      <UnstyledButton>
        <img src={icon ? CLIENT_URL + icon : CLIENT_URL + "assets/layout/images/avatar_4.png"} width="35" alt="avatar4" />
        <span className="name">{name}</span>
        <span className="email">{email}</span>
      </UnstyledButton>
    );
}

export const ContactList = (props) => {

  const { core, contacts} = props;

  return (
    <CollapsiblePanel header="Contactos (suporte)" toggleable={false}>
      <ul>
          { contacts.map((item, i) =>
              <li key={i}>
                  <Contact core={core} {...item} />
              </li>
          )}
      </ul>
    </CollapsiblePanel>
  );
}
