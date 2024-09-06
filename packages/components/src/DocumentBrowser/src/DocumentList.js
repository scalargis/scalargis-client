import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";

import { TreeTable } from 'primereact/treetable';
import { Message } from 'primereact/message';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { i18n } from '@scalargis/components';
import { utils } from '@scalargis/components';
import { ProgressControl } from '@scalargis/components';

import './style.css';


const buildTree = (items, level = 0) => {
  let tree = [];
  items.forEach((item, index) => {
    const obj = {
      key: `${level}-${index}`,
      data: {
        name: item.name,
        url: item.resource_url,
        type: item.type
      }
    };
    if (item.type === 'folder') {
        // Recursively build the children of the current item
        let children = buildTree(item.children || [], level + 1);
        obj.children = children;
    }
    tree.push(obj);
  });
  return tree;
}

export default function DocumentList({ core, documentList }) {

  const { buildUrlPath } = utils;

  // Force component update
  const { } = useTranslation();

  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState();
  const [expandedKeys, setExpandedKeys] = useState({});
  const [filter, setFilter] = useState(null);

  const allKeys = useMemo(() => {
    const getKeys = (items, keys = []) => {
      const _keys = keys || [];
      items.forEach((item, index) => {
        if (item?.data?.type === "folder") {
          _keys.push(item.key);
          getKeys(item.children, _keys);
        }
      });
      return _keys;
    }

    const keys = getKeys(data);
    return keys;
  }, [data]);

  useEffect(() => {
    let url;

    if (documentList?.folder) {
      url = `${buildUrlPath("documents/list", core.API_URL)}/${documentList.folder}`;
      if (documentList.path) {
        url = url + '/' + documentList.path;
      }
    }

    if (documentList?.url) {
      url = buildUrlPath(documentList.url, core.API_URL);
    }

    if (url) {
      fetch(url).then(res => {
        if (res.status == 404) {
          throw Error({status: res.status, message: res?.statusText});
        }  
        return res.json();
      }).then(result => {
        const tree = buildTree(result.children || []);
        setData(tree);
      }).catch(error => {
        setError(error);
      }).finally(()=> {
        setLoaded(true);
      })
    }  
  }, []);

  const translatedText = useMemo(() => {
    return {
      "filter": i18n.translateValue("filter", "Filtro"),
      "expand": i18n.translateValue("expand", "Expandir"),
      "collapse": i18n.translateValue("collapse", "Recolher"),
      "folderNotFound": i18n.translateValue("folderNotFound", "Pasta não encontrada"),
      "emptyFolder": i18n.translateValue("emptyFolder", "Pasta vazia")
    }
  }, [i18n.getResolvedLanguage()]);

  if (!loaded) {
    return (
      <div>
        <div className="p-mt-4 p-mb-4 p-text-center">
          <ProgressControl>
            <div>{i18n.translateValue("loading", "A carregar ...")}</div>
          </ProgressControl>
        </div>
      </div>
    )
  }

  if (error) {
    console.log(error);
    return (
      <div>
        <div className="p-mt-4 p-mb-4 p-text-left">
          <Message severity="error" text={translatedText.folderNotFound} className="p-col-12" />
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div>
        <div className="p-mt-4 p-mb-4 p-text-left">
          <Message severity="warn" text={translatedText.emptyFolder}  className="p-col-12" />
        </div>
      </div>
    );
  }

  const header = (documentList?.showExpandButtons || documentList?.showFilter) &&
    <div className='p-grid'>
      {documentList?.showFilter && <div className="p-col-12 p-text-right">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText type="search" onInput={(e) => setFilter(e.target.value)} placeholder={`${translatedText.filter}...`} 
            className="sg-document-list p-inputtext-sm" />
        </span>
      </div>}
      {documentList?.showExpandButtons && <div className="p-col-12 p-text-left">
        <div className="p-buttonset" style={{"display": "inline-flex"}}>
          <Button label={translatedText.expand} icon="pi pi-plus-circle" className="p-button-outlined p-button-sm"
            onClick={() => {
              const _expandedKeys = {};
              allKeys.forEach(v => _expandedKeys[v] = true);
              setExpandedKeys(_expandedKeys);    
            }} />
          <Button label={translatedText.collapse} icon="pi pi-minus-circle" className="p-button-outlined p-button-sm"
            onClick={() => {
              setExpandedKeys({});
            }}
          />
        </div>
      </div>}
    </div>;

  return (
    <React.Fragment>
      {header}
      <TreeTable value={data} globalFilter={filter} expandedKeys={expandedKeys}
        onToggle={e => setExpandedKeys(e.value)} className="sg-document-list" >
        <Column
          field="name"
          body={(d) => {
            if (d?.data?.type === "file") {
              return <a target="_blank" href={`${documentList.baseUrl || ''}${d.data.url}`}>{d.data.name}</a>
            }
            return <span>{d?.data?.name}</span>
          }}
          expander
        />
        <Column 
          body={(d) => {
            if (d?.data?.type === "file") {
              return <a target="_blank" href={`${documentList.baseUrl || ''}${d.data.url}`} title={d.data.name}><i className="pi pi-external-link"></i></a>
            }
            return null;
          }}
          style={{textAlign:'center', width: '4em'}}
        />
      </TreeTable>
    </React.Fragment>
  )

}