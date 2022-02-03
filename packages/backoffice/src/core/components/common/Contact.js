import React from 'react';
import { Panel } from 'primereact/panel';

export const Contact = (props) => {

    const {name, email, icon} = props;

    const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || '';

    return (
      <button className="p-link">
        <img src={icon ? CLIENT_URL + icon : CLIENT_URL + "assets/layout/images/avatar_4.png"} width="35" alt="avatar4" />
        <span className="name">{name}</span>
        <span className="email">{email}</span>
      </button>
    );
}

export const ContactList = (props) => {

  const {contacts} = props;

  return (
    <Panel header="Contactos (suporte)">
      <ul>
          { contacts.map((item, i) =>
              <li key={i}>
                  <Contact {...item} />
              </li>
          )}
      </ul>
    </Panel>
  );
}
