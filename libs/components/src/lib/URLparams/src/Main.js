import React, { useEffect } from 'react';
import { useLocation } from "react-router-dom"
import { transform, transformExtent } from 'ol/proj'
import { boundingExtent } from 'ol/extent';

export default function Main({ config, actions }) {

    const url_parameters = useLocation().search;
    const { dispatch, mainMap, Models } = config;
 
    useEffect(() => {

        const mapCRS = mainMap.getView().getProjection().getCode()
        const isURLparams = new URLSearchParams(url_parameters).get('urlparams');

        if (isURLparams !== "true") { // need urlparams=true to parse
            return null
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