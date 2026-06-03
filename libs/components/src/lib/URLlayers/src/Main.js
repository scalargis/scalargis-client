import React, { useEffect } from 'react';
import { useLocation } from "react-router";
import { v4 as uuid } from 'uuid';


const addLayer = (data, dispatch, actions, viewer) => {

    const { viewer_add_themes, layers_set_checked } = actions;

    let theme = {...data};

    const themeId = data?.themeId || uuid();

    const layerType = theme?.type || '';

    if (layerType.toLowerCase() === 'wms') {
      theme = {
        ...theme,
        id: themeId,
        type: "WMS",
        title: data?.title || data.layers,
        description: "",
        active: false,
        open: false,
        opacity: 1,
        url: data.url, //"https://demo.scalargis.wkt.pt/geoserver/wms",
        layers: data.layers || "", //"cm_castro_verde:cadastralparcel",
        children: [],
        servertype: data.servertype || "geoserver",
        tiled: true,
        version: data.version || "1.3.0",
        get_map_format: data.format || "image/png",
        get_feature_info_format: theme.info_format ||"application/json",
        wms_style: theme?.styles || "",
        legend_url: data.legend_url || `${theme.url}?service=WMS&version=1.3.0&request=GetLegendGraphic&format=${theme.format || "image/png"}&layer=${theme.layers}&styles=${theme.styles || ""}`,
      }
    } else {
      return;
    }

    dispatch(viewer_add_themes(null, [theme], true));

    let checked = viewer?.config_json?.checked?.length ? [...viewer.config_json.checked] : [];
    checked = checked.concat([themeId]);
    dispatch(layers_set_checked(checked));
}


export default function Main({ config, actions }) {

    const location = useLocation();
    const { dispatch, mainMap, viewer, Models } = config;
    const { map_set_extent } = actions;
    const {MapModel} = Models;
    const  { transformExtent } = MapModel;

    /*
    console.log(MapModel);
    console.log(config);
    console.log(viewer);
    */

    useEffect(() => {
        if (!mainMap) return;
        
        if (!viewer?.loaded) return;  

        const query = new URLSearchParams(location.search);

        const obj = Object.fromEntries(query);
        const data = Object.keys(obj).reduce((acc, key) => {
            acc[key.toLowerCase()] = obj[key];
            return acc;
        }, {});

        //console.log(data);

        addLayer(data, dispatch, actions, viewer);

        setTimeout(() => {
            if (data?.extent) {
                // Dispatch zoom
                let crs = data?.crs || "4326";

                if (crs.includes(":")) {
                    crs = crs.split(":")[1];
                }

                console.log(crs);

                try {
                    const target_proj = mainMap.getView().getProjection().getCode();
                    const extent = transformExtent(crs, target_proj, data.extent.split(' '));
                    const center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2]
                    dispatch(map_set_extent(center, extent));
                } catch (e) {
                    console.log(e);
                }
            }
        }, 1000);

    }, [mainMap, viewer?.loaded]);


    return null
}