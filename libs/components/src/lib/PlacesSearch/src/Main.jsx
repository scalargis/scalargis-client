import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { Paper, TextInput, UnstyledButton } from '@mantine/core';
import { IconX, IconSearch, IconSpinner } from '@scalargis/ui';
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import Feature from 'ol/Feature';
import { getCenter } from 'ol/extent';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import parse from 'html-react-parser';

import './style.css'
import useOutsideClick from './useOutsideClick';


const featureStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 0, 0, 0.5)',
    width: 4,
  }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.5)',
    }),
    stroke: new Stroke({
      //color: '#fff',
      color: 'rgba(255, 255, 255, 0.5)',
      width: 2,
    })
  })
});

/** Keeps the first row of each place that two sources give with the same name, type, and admin code. */
export function uniquePlaces(rows) {
  const seen = new Set();
  return (rows || []).filter((row) => {
    const name = row.name ?? row.designacao;
    if (name == null) return true;
    const key = [name, row.type, row.admin_code ?? row.dicofre].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Lowers the case, drops the accents, and splits the text into words. */
function words(text) {
  return (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Orders the rows by the count of query words that start a word of the row label, and keeps the given order on a tie. */
export function rankByWords(rows, query) {
  const terms = words(query).filter((word) => word.length > 2 || /^\d+$/.test(word));
  if (!terms.length) return rows;
  const score = (row) => {
    const label = words([row.name ?? row.designacao, row.admin_level1, row.admin_level2, row.admin_level3,
      row.admin_level4, row.concelho].join(' '));
    return terms.filter((term) => label.some((word) => word.startsWith(term))).length;
  };
  return rows
    .map((row, i) => ({ row, i, score: score(row) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((item) => item.row);
}

export default function Main({ core, config, actions, utils, record }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { MapModel } = Models;
  const { getGeometryFromWKT } = MapModel;
  const { findOlLayer } = utils;

  const { t } = useTranslation(["common", "custom"]);

  const [filter, setFilter] = useState("");
  const [activeSources, setActiveSources] = useState([]);
  const [showPlaces, setShowPlaces]= useState(false);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [attributions, setAttributions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const ref = useRef();
  const picked = useRef(false);

  const featuresLayer = useRef();

  const pendingSearch = useRef(null);
  const searchTimer = useRef(null);

  const component_cfg = record.config_json || {};

  useOutsideClick(ref, () => {
    setShowPlaces(false);
  });

  function cancelSearch() {
    clearTimeout(searchTimer.current);
    searchTimer.current = null;
    pendingSearch.current?.abort();
    pendingSearch.current = null;
  }

  function changeFilterFunc(e) {
    setSelectedPlace(null);
    setFilter(e.target.value);
    cancelSearch();
    if (e.target.value.length < 3) {
        setPlaces([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setShowPlaces(true);

    const value = e.target.value;
    searchTimer.current = setTimeout(() => {
      searchTimer.current = null;
      runSearch(value);
    }, config.delay ?? 300);
  }

  /** Sends the filter to the configured url, or to every provider when the config has providers. */
  function runSearch(value) {
    if (config.providers?.length) {
      searchProviders(value);
      return;
    }

    // Fetch filter
    let url = core.API_URL + '/geographical_names/search?_min_similarity=0.5&_maxrows=10&_filter={filter}';
    if (config.url) {
      url = config.url;
    }
    if (config.max_rows) {
      url = url.replace('{max_rows}', config.max_rows);
    }
    if (config.min_similarity) {
      url = url.replace('{min_similarity}', config.min_similarity);
    }
    url = url.replace('{filter}', encodeURIComponent(value));
    const search = new AbortController();
    pendingSearch.current = search;
    fetch(url, { signal: search.signal }).then(res => {
        // TODO: Validate response
        return res.json();
    }).then(result => {
        if (pendingSearch.current !== search) return;
        pendingSearch.current = null;
        const rows = activeSources?.length ? result.filter((item) => activeSources.includes(item.source)) : result;
        setPlaces(uniquePlaces(rows));
        setIsLoading(false);
    }).catch(error => {
        //console.log('error', error);
        if (pendingSearch.current !== search) return;
        pendingSearch.current = null;
        setIsLoading(false);
    })
  }

  /** Sends the filter to every configured provider in parallel and lists the rows of the providers that answer. */
  function searchProviders(value) {
    const providers = config.providers;
    const search = new AbortController();
    pendingSearch.current = search;
    const requests = providers.map((provider) => {
      let url = provider.url;
      if (config.max_rows) {
        url = url.replace('{max_rows}', config.max_rows);
      }
      if (config.min_similarity) {
        url = url.replace('{min_similarity}', config.min_similarity);
      }
      url = url.replace('{filter}', encodeURIComponent(value));
      return fetch(url, { signal: search.signal }).then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      });
    });
    Promise.allSettled(requests).then(answers => {
      if (pendingSearch.current !== search) return;
      pendingSearch.current = null;
      const origin = new Map();
      const rows = [];
      answers.forEach((answer, i) => {
        if (answer.status !== 'fulfilled' || !Array.isArray(answer.value)) return;
        answer.value.forEach((row) => {
          if (activeSources?.length && !activeSources.includes(row.source)) return;
          origin.set(row, providers[i]);
          rows.push(row);
        });
      });
      const list = uniquePlaces(rankByWords(rows, value));
      const texts = [];
      list.forEach((row) => {
        const text = origin.get(row)?.attribution;
        if (text && !texts.includes(text)) texts.push(text);
      });
      setPlaces(list);
      setAttributions(texts);
      setIsLoading(false);
    });
  }

  function selectPlace(item) {
    if (item?.geom_wkt) {
      const geom = MapModel.getGeometryFromWKT(item.geom_wkt);
      const srid = component_cfg?.geometrySRID || item?.geom_srid || 4326;

      geom.transform(`EPSG:${srid}`, mainMap.getView().getProjection());

      let buffer = config.buffer || 1000;
      if (config?.sources?.length) {
        config.sources.forEach((src) => {
          if(item.source == src.id && src.buffer != null) {
              buffer = src.buffer;
          }
        });
      }

      const geom_ext = geom.getExtent();
      const extent = [geom_ext[0] - buffer, geom_ext[1] - buffer, geom_ext[2] + buffer, geom_ext[3] + buffer];

      dispatch(actions.map_set_extent(getCenter(extent), extent));

      //setFilter(item.name || filter);
      picked.current = true;
      setSelectedPlace(item);
      setShowPlaces(false);
    }
  }

  function clearFilter() {
    cancelSearch();
    setIsLoading(false);
    setFilter("");
    setPlaces([]);
    setAttributions([]);
    setSelectedPlace(null);
  }

  // Legacy code. To be removed
  function buildLegacyDefaultItem(option, iconClass) {
    let elem = null;

    if (iconClass) {
      elem = <div className="place-list-item"><i className={`pi ${iconClass || ''} mr-2`}></i> <span>{option.designacao} ({option.concelho})</span></div>;
      if (option.designacao === option.concelho) {
        elem = <div>{option.concelho}</div>
      }
    } else {
      elem = <div>{option.designacao} ({option.concelho})</div>;
      if (option.designacao === option.concelho) {
        elem = <div>{option.concelho}</div>
      }
    }

    return elem;
  }

  function buildDefaultItem(option, iconClass) {
    let elem = null;

    const admin_level = option.admin_level4 || option.admin_level3 || option.admin_level2 || option.admin_level1 || '';

    if (iconClass) {
      elem = <div className="place-list-item"><i className={`pi ${iconClass || ''} mr-2`}></i> <span>{option.name} {admin_level ? `(${admin_level})` : ''}</span></div>;
      if (option.name === admin_level) {
        elem = <div>{admin_level}</div>
      }
    } else {
      elem = <div>{option.name} {admin_level ? `(${admin_level})` : ''}</div>;
      if (option.name=== option.admin_level) {
        elem = <div>{admin_level}</div>
      }
    }

    return elem;
  }

  function itemTemplate(option) {
    const types = component_cfg?.types;
    let elem = null;

    if (types) {
      elem = buildDefaultItem(option, types?.default?.iconClass);
    } else {
      elem = buildLegacyDefaultItem(option, null);
    }

    if (types?.default) {
      if (types?.default?.html) {
        let html = types?.default?.html;
        const rf = (html && html.match) ? html.match(/[^{}]+(?=})/g) : null;
        if (rf) {
          rf.forEach(fld => {
            html = html.replace(`{${fld}}`, option[fld] || '');
          });
        }
        elem = <div>{parse(html)}</div>;
      }
    }

    if (types?.field && option[types?.field] && types?.templates?.length) {
      const tpl = types.templates.find( item => item.id === option[types.field]);
      if (tpl) {
        if (tpl?.html) {
          let html = tpl.html;
          const rf = (html && html.match) ? html.match(/[^{}]+(?=})/g) : null;
          if (rf) {
            rf.forEach(fld => {
              html = html.replace(`{${fld}}`, option[fld] || '');
            });
          }
          elem = <div>{parse(html)}</div>;
        } else if (tpl.iconClass) {
          elem = buildDefaultItem(option, tpl.iconClass);
        }
      }
    }

    return elem;
  }

  useEffect(() => {
    const sources_ids = [];
    if (config.sources && config.sources.length > 0) {
      config.sources.forEach(src => {
        if (src.active) {
          sources_ids.push(src.id);
        }
      });
    }
    setActiveSources([...sources_ids]);
  }, []);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  useEffect(() => {
    if (!mainMap) return;

    const layerId = 'places-search';

    const savedLayer = utils.findOlLayer(mainMap, layerId);
    if (savedLayer) {
      featuresLayer.current = savedLayer;
      return;
    }


    featuresLayer.current = new VectorLayer({
      id: layerId,
      renderMode: 'vector',
      source: new Vector({}),
      style: featureStyle,
      selectable: false
    });

    const parentLayer = utils.findOlLayer(mainMap, 'overlays');

    if (parentLayer) {
      parentLayer.getLayers().getArray().push(featuresLayer.current);
    } else {
      mainMap.addLayer(featuresLayer.current);
    }
  }, [mainMap]);

  useEffect(() => {
    if (picked.current) {
      picked.current = false;
      return;
    }
    if (selectedPlace && component_cfg.unselectOnHide === true) {
      setSelectedPlace(null);
    }
  },[showPlaces]);

  useEffect(() => {
    if (!featuresLayer.current) return;

    featuresLayer.current.getSource().clear();

    if (!selectedPlace) return;

    let drawGeometry = true;

    if (component_cfg.drawGeometry=== false) return;

    const types = component_cfg?.types || {};
    if (types.templates?.length) {
      let template;
      if (selectedPlace.type) {
        template = types.templates.find(t => t.id === selectedPlace.type);
      }
      if (!template && types?.default) {
        template = types?.default;
      }

      if (template?.drawGeometry != null) {
        drawGeometry = template.drawGeometry;
      }
    }

    if (!drawGeometry) return;

    if (!selectedPlace?.geom_wkt && !selectedPlace?.geom_ext) return;

    if (selectedPlace?.geom_wkt) {
      const geom = getGeometryFromWKT(selectedPlace.geom_wkt);
      const srid = component_cfg?.geometrySRID || selectedPlace?.geom_srid || 4326;

      geom.transform(`EPSG:${srid}`, mainMap.getView().getProjection());

      const feature = new Feature();
      feature.setGeometry(geom);
      feature.setStyle(featureStyle);
      featuresLayer.current.getSource().addFeatures([feature]);
    }
  }, [selectedPlace]);



  return (
    <div ref={ref} className="layout-topbar-search-container">
      <span className="layout-topbar-search">
          <TextInput type="text" variant="unstyled"
            classNames={{
              root: 'places-search-input-root',
              wrapper: 'places-search-input-wrapper',
              input: 'places-search-input'
            }}
            placeholder={ config.placeholder ? t(config.placeholder, config.placeholder, {"ns": "custom"}) : `${t("search", "Pesquisar")}...`}
            aria-label={t("search", "Pesquisar")}
            value={filter}
            onFocus={(e) => setShowPlaces(true)}
            onChange={(e) => changeFilterFunc(e)} />
          { isLoading ?
            <IconSpinner className='layout-topbar-search-icon' spin aria-hidden="true" />
            : filter ? <UnstyledButton type="button" className='layout-topbar-search-icon'
              aria-label={t('clear', 'Limpar')}
              title={t('clear', 'Limpar')}
              onClick={e=>clearFilter()}><IconX /></UnstyledButton>
            : <IconSearch className='layout-topbar-search-icon' />
          }
      </span>
      {(showPlaces && places && places.length > 0 ?
        <div className="layout-topbar-search-results">
          <Paper withBorder shadow="md" className="places-search-list">
            <ul>
              {places.map((place, i) => (
                <li key={i}>
                  <UnstyledButton type="button"
                    className={"places-search-option" + (place === selectedPlace ? " selected" : "")}
                    aria-current={place === selectedPlace || undefined}
                    onClick={() => selectPlace(place)}>
                    {itemTemplate(place)}
                  </UnstyledButton>
                </li>
              ))}
            </ul>
            {attributions.length > 0 ?
              <div className="places-search-attribution">
                {attributions.map(text => t(text, text, {"ns": "custom"})).join(' · ')}
              </div> : null
            }
          </Paper>
        </div> : null
      )}
    </div>
  );
}
