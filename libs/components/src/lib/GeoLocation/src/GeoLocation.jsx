import React, { useState, useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { transform } from 'ol/proj'
import { Alert, Button, Checkbox, Group, Switch, Table } from '@mantine/core'

const StatusMessage = ({ color, icon, text }) => (
  <Alert color={color} py="xs">
    <Group justify="center" gap="xs" wrap="nowrap">
      <i className={icon} />
      <span>{text}</span>
    </Group>
  </Alert>
);

export default function GeoLocation({ config, actions, dispatch, record }) {

  const { viewer, mainMap, Models } = config;
  const { getProjectionSrid } = Models.MapModel;
  const { geolocation }  = viewer;

  const component_cfg = record.config_json;

  const geo_location_control = viewer.config_json.map_controls.find(c => c.id === 'GeoLocation');
  const geoLocationActive = geo_location_control ? geo_location_control.active : false;
  const geoLocationTracking = geo_location_control ? geo_location_control.tracking : false;
  const { viewer_update_mapcontrol, viewer_set_selectedmenu, map_set_extent, viewer_set_exclusive_mapcontrol } = actions;

  const { t } = useTranslation();

  const [results, setResults] = useState([]);

  function getErrorMessage(error, messages) {
    let message = error.message;

    switch(error.code) {
      case 1:
        //The acquisition of the geolocation information failed because the page did not have the permission to do it.
        message = t("locationNotAuthorized", "Não foi autorizada a obtenção da localização.");
        break;
      case 2:
        //The acquisition of the geolocation failed because one or several internal sources of position returned an internal error.
        message = t("myLocationError", "Ocorreu um erro interno ao obter-se a localização.");
        break;
      case 3:
        //The time allowed to acquire the geolocation, defined by PositionOptions.timeout information that was reached before the information was obtained.
        message = t("myLocationTimeout", "Ocorreu um timeout antes de ter sido possível obter a localização.");
        break;
      default:
        message = messages?.error?.text ? messages.error.text : t("myLocationNoInformation", "Não foi possível obter a localização.");
    }

    if (error.code && messages && messages['error' + error.code] && messages['error' + error.code].text) {
      message = messages['error' + error.code].text;
    }

    return message;
  }

  function buildResultsTable() {
    const results = [];

    const precision = 10000;

    if (geolocation && geolocation.coordinates) {
      results.push({ field: `${t("longitude", "Longitude")} (dd)`, value: (Math.round(geolocation.coordinates[0] * precision) / precision) });
      results.push({ field: `${t("latitude", "Latitude")} (dd)`, value: (Math.round(geolocation.coordinates[1] * precision) / precision) });

      if (viewer.config_json.display_crs && viewer.config_json.display_crs != 4326) {
        const display_coords = transform(geolocation.coordinates, 'EPSG:4326', 'EPSG:' + viewer.config_json.display_crs);
        results.push({ field: 'X [EPSG:' + viewer.config_json.display_crs + ']', value: (Math.round(display_coords[0] * 100) / 100) });
        results.push({ field: 'Y [EPSG:' + viewer.config_json.display_crs + ']', value: (Math.round(display_coords[1] * 100) / 100) });
      }

      geolocation.accuracy && results.push({ field: t("accuracy", "Precisão"), value: ((Math.round(geolocation.accuracy * 100) / 100) + ' m')});
      geolocation.altitude && results.push({ field: t("altitude", "Altitude"), value: ((Math.round(geolocation.altitude * 100) / 100) + ' m')});
      geolocation.altitudeAccuracy && results.push({ field: t("altitudeAccuracy", "Precisão da altitude"), value: ((Math.round(geolocation.altitudeAccuracy * 100) /100) + ' m')});
      geolocation.heading && results.push({ field: t("heading", "Direção"), value: ((Math.round(geolocation.heading * 100) / 100) + ' rad')});
      geolocation.speed && results.push({ field: t("speed", "Velocidade"), value: ((Math.round(geolocation.speed  * 100) / 100) + ' m/s')});
    }
    setResults(results);
  }

  function toggleGeoLocationControl(val) {
    const active = val;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, active }));
    /*
    const active = !geoLocationActive;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, active }));
    if (active && geo_location_component) dispatch(viewer_set_selectedmenu('geolocation'));
    */
  }

  function trackingGeoLocationControl(val) {
    const tracking = val;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, tracking }));
    /*
    const active = !geoLocationActive;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, active }));
    if (active && geo_location_component) dispatch(viewer_set_selectedmenu('geolocation'));
    */
  }

  function zoomGeoLocation(position) {
    // Zoom to extent
    if (position && position.coordinates) {
        const coordinates = transform(position.coordinates, 'EPSG:4326', mainMap.getView().getProjection());
        const extent = [coordinates[0] - 500, coordinates[1] - 500,
                        coordinates[0] + 500, coordinates[1] + 500];
        const srid = getProjectionSrid(mainMap.getView().getProjection());
        dispatch(actions.map_set_extent(coordinates, extent, srid));
    }
  }

  useEffect(()=>{
    buildResultsTable();
  },[viewer.config_json.display_crs]);

  useEffect(()=>{
    buildResultsTable();
  }, [geolocation]);

  if (geolocation && geolocation.error) return (
    <StatusMessage
      color="warning"
      icon="pi pi-exclamation-triangle"
      text={getErrorMessage(geolocation.error, component_cfg?.messages)}
    />
  )

  return (
    <div>
      <StatusMessage
        color="informative"
        icon="pi pi-info-circle"
        text={component_cfg?.messages?.intro?.text ? component_cfg.messages.intro.text : t("myLocationSelectOption","Selecione a opção 'Ver Posição' para ativar a visualização da sua posição.")}
      />

      <div className="mt-3 pt-3 pr-2 pl-2 pb-2" style={{"border": "1px solid rgb(111 57 57 / 12%)"}}>
        <div className="grid">
          <div className="col flex align-items-center">
            <Switch
              size="md"
              checked={geoLocationActive}
              onChange={(e) => toggleGeoLocationControl(e.currentTarget.checked)}
              label={<span className="font-bold">{t("myLocationViewPosition", "Ver Posição")}</span>}
            />
          </div>
        </div>
        <div className="grid mt-2">
          <div className="col flex align-items-center">
            <Checkbox
              size="md"
              checked={geoLocationTracking}
              disabled={!geoLocationActive}
              onChange={e => trackingGeoLocationControl(e.currentTarget.checked)}
              label={t("myLocationUpdate", "Atualizar")}
            />
          </div>
          <div className="col text-right">
            <Button
              size="xs"
              leftSection={<i className="pi pi-search" aria-hidden="true" />}
              onClick={e => { zoomGeoLocation(geolocation); }}
              disabled={!geoLocationActive}
            >
              {t("locate", "Localizar")}
            </Button>
          </div>
        </div>
      </div>

      { geolocation &&
      <div className="card pt-2 p-0">
          <Table>
            <Table.Tbody>
              {results.map(r => (
                <Table.Tr key={r.field}>
                  <Table.Td>{r.field}</Table.Td>
                  <Table.Td>{r.value}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
      </div> }
  </div>
  )

}
