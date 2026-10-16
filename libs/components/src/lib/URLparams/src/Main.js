import React, { useEffect } from 'react';
import { useLocation } from "react-router"
import { transform, transformExtent } from 'ol/proj'
import { boundingExtent } from 'ol/extent';

/** The ids of the url layers that the viewer has, with each group above them. */
function urlLayersChecked(param, layers) {
    const ids = (param || '').split(',').map(id => id.trim()).filter(id => id);
    const parents = {};
    (layers || []).forEach(layer => (layer.children || []).forEach(child => { parents[child] = layer.id; }));
    const known = new Set((layers || []).map(layer => layer.id));
    const out = [];
    ids.filter(id => known.has(id)).forEach(id => {
        let current = id;
        while (current && !out.includes(current)) {
            out.push(current);
            current = parents[current];
        }
    });
    return out;
}

export default function Main({ config, actions }) {

    const url_parameters = useLocation().search;
    const { dispatch, mainMap, viewer, Models } = config;

    useEffect(() => {
        if (!viewer?.config_json?.layers) return;

        const urlLayers = new URLSearchParams(url_parameters).get('layers');
        if (!urlLayers) return;

        const ids = urlLayersChecked(urlLayers, viewer.config_json.layers);
        if (!ids.length) return;

        const checked = viewer.config_json.checked || [];
        dispatch(actions.layers_set_checked([...checked, ...ids.filter(id => !checked.includes(id))]));
    }, [viewer?.loaded])

    useEffect(() => {

        const mapCRS = mainMap.getView().getProjection().getCode()
        const isURLparams = new URLSearchParams(url_parameters).get('urlparams');

        if (isURLparams !== "true") { // need urlparams=true to parse
            return
        }

        const urlExtent = new URLSearchParams(url_parameters).get('extent');
        const urlExtentSRID = new URLSearchParams(url_parameters).get('extent_srid');
        let isValidParam = true;

        if (urlExtent) {
            const extent = urlExtent.split(",").map(Number);

            let olExtent = boundingExtent([[extent[0], extent[1]], [extent[2], extent[3]]])

            if (urlExtentSRID) {
                const extentEPSG = 'EPSG:' + urlExtentSRID.toString()

                try {
                    olExtent = transformExtent(olExtent, extentEPSG, mapCRS)
                } catch (error) {
                    console.log("bad url params")
                    isValidParam = false;
                }
            }

            if (isValidParam) {
                const center = [extent[0] + (extent[2] - extent[0]) / 2, extent[1] + (extent[3] - extent[1]) / 2]
                dispatch(actions.map_set_extent(center, olExtent));
            }

        }

    }, [])


    return null
}
