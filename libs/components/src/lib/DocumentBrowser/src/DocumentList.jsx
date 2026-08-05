import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";

import { Alert, Button, Group, TextInput } from '@mantine/core';
import { TreeView, useTree } from '@scalargis/ui';

import { i18n, utils, ProgressControl } from '../../components';


const buildTree = (items, parentKey = '') => {
  const tree = [];
  items.forEach((item, index) => {
    // Key must be unique across the whole tree: TreeView identifies nodes by
    // value=key, so a depth+index key collided between sibling folders and the
    // last folder's children won (C-15). Prefix the parent's key per level.
    const key = parentKey ? `${parentKey}-${index}` : `${index}`;
    const obj = {
      key,
      data: {
        name: item.name,
        url: item.resource_url,
        type: item.type
      }
    };
    if (item.type === 'folder') {
        // Recursively build the children of the current item
        const children = buildTree(item.children || [], key);
        obj.children = children;
    }
    tree.push(obj);
  });
  return tree;
}

// Lenient filter, the ThemesTree idiom: a node whose name matches keeps its
// whole subtree; a folder is kept when any descendant survives.
const pruneTree = (nodes, query) => {
  if (!query) return nodes;
  const q = utils.foldDiacritics(query);
  const prune = (items) => {
    const kept = [];
    items.forEach((item) => {
      if (utils.foldDiacritics(item?.data?.name || '').includes(q)) {
        kept.push(item);
        return;
      }
      if (item.children?.length) {
        const children = prune(item.children);
        if (children.length) kept.push({ ...item, children });
      }
    });
    return kept;
  };
  return prune(nodes);
}

export default function DocumentList({ core, documentList }) {

  const { buildUrlPath } = utils;

  // Force component update
  const { } = useTranslation();

  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState();
  const [filter, setFilter] = useState('');

  const tree = useTree();

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

  // The filtered documents mapped to the TreeView contract: the node label is
  // the file link (or folder name) with the external-link icon riding the row
  // end for files, what the old TreeTable's second column rendered.
  const treeData = useMemo(() => {
    const mapNode = (item) => ({
      value: item.key,
      label: item?.data?.type === "file" ? (
        <Group gap="xs" wrap="nowrap">
          <a target="_blank" rel="noreferrer" href={`${documentList.baseUrl || ''}${item.data.url}`}>{item.data.name}</a>
          <a target="_blank" rel="noreferrer" href={`${documentList.baseUrl || ''}${item.data.url}`} title={item.data.name} tabIndex={-1}>
            <i className="pi pi-external-link" aria-hidden="true"></i>
          </a>
        </Group>
      ) : (
        <span>{item?.data?.name}</span>
      ),
      children: item.children?.length ? item.children.map(mapNode) : undefined,
    });
    return pruneTree(data, filter).map(mapNode);
  }, [data, filter, documentList.baseUrl]);

  // Typing a filter expands the survivors so the matches are visible.
  useEffect(() => {
    if (filter) tree.expandAllNodes();
  }, [filter]);

  if (!loaded) {
    return (
      <div>
        <div className="mt-4 mb-4 text-center">
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
        <div className="mt-4 mb-4 text-left">
          <Alert color="danger" py="xs" className="col-12">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-times-circle" />
              <span>{translatedText.folderNotFound}</span>
            </Group>
          </Alert>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div>
        <div className="mt-4 mb-4 text-left">
          <Alert color="warning" py="xs" className="col-12">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-exclamation-triangle" />
              <span>{translatedText.emptyFolder}</span>
            </Group>
          </Alert>
        </div>
      </div>
    );
  }

  const header = (documentList?.showExpandButtons || documentList?.showFilter) &&
    <div className='grid'>
      {documentList?.showFilter && <div className="flex col-12">
        <TextInput
          w="100%"
          leftSection={<i className="pi pi-search" aria-hidden="true" />}
          value={filter || ''}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`${translatedText.filter}...`}
          aria-label={translatedText.filter}
        />
      </div>}
      {documentList?.showExpandButtons && <div className="col-12">
        <Button.Group style={{"display": "inline-flex"}}>
          <Button type="button" size="xs" variant="outline" leftSection={<i className="pi pi-plus-circle" aria-hidden="true" />}
            onClick={() => {
              tree.expandAllNodes();
            }}>
            {translatedText.expand}
          </Button>
          <Button type="button" size="xs" variant="outline" leftSection={<i className="pi pi-minus-circle" aria-hidden="true" />}
            onClick={() => {
              tree.collapseAllNodes();
            }}
          >
            {translatedText.collapse}
          </Button>
        </Button.Group>
      </div>}
    </div>;

  return (
    <React.Fragment>
      {header}
      <TreeView className="sg-document-list" data={treeData} tree={tree} />
    </React.Fragment>
  )

}
