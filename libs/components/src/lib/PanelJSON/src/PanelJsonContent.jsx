import React, { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';
import './style.css';

import RenderComponent from './components/RenderComponent';


export default function PanelJsonContent({ core, config }) {

  const [componentConfig, setComponentConfig ] = useState([]);

  useEffect(() => {    
    if (config.url) {
      // Set request headers
      let options = {
        headers: {
          'Accept': 'application/json'       
        },
        method: 'GET'
      }

      // Get logged user
      const cookies = new Cookies();
      const logged = cookies.get(core.COOKIE_AUTH_NAME);
      if (logged) options.headers['X-API-KEY'] = logged.token;

      const url = config.url;

      fetch(url, options).then(res => {
        if (res.status != 200) return null;          
        return res.json();
      }).then(result => {
        if (result) {
          setComponentConfig(Array.isArray(result) ? result : [result]);
        }
      }).catch(error => {        
        console.log('error', error);
      })
    } else {
      setComponentConfig(config.data || []);
    }    
  }, []);

  return (
    <div>
      { (componentConfig || []).map(cfg => RenderComponent(cfg)) }
    </div>
  );

}