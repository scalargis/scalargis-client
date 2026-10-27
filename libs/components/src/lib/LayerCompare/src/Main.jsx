import React, { useState, useEffect } from 'react';
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CollapsiblePanel, IconPause, IconAngleDown, IconAngleUp } from '@scalargis/ui';

import { i18n as i18nUtils, MainMenuButton } from '../../components';

import LayerCompare from './LayerCompare';
import useLayerSwipe from './useLayerSwipe';

import './style.css';
import './control.css';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  
  const title = record?.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("layerCompare", "LayerCompare");

  return (
    <MainMenuButton
      title={title}
      className={className}
      icon={<IconPause />}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

/**
 * Manager component
 */
// export function Manager({ className, config, actions, record }) {

//   const title = record?.title;

//   return (
//     <ManagerComponent
//       title={title}
//       className={className}
//       config={config}
//       actions={actions}
//       record={record} />
//   )
// }


/**
 * Main component
 */
export default function Main({ as, config, actions, core, record, utils }) {


  const { viewer, dispatch, mainMap } = config;
  const component_cfg = record.config_json || {};

  const active = viewer?.config_json?.selected_menu === record?.id;

  const title = record?.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("layerCompare", "LayerCompare");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const [toolUIposition, setToolUIposition] = useState()


  //compare tool
  const [sliderValue, setSliderValue] = useState(50)

  const compareToolOptions = [
    { name: i18nUtils.translateValue("splitMap", "Dividir mapa"), value: 1, icon: 'pi  pi-pause' },
    { name: i18nUtils.translateValue("transparency", "Transparência"), value: 2, icon: 'pi  pi-clone' }
  ]
  const [compareTool, setCompareTool] = useState(1);
  const [opacitySliderValue, setOpacitySliderValue] = useState(50)


  //----------------------------------------------------------------------
  const [opened, { open, close }] = useDisclosure(true)
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState();
  const [selectedSliderLayer, setSelectedSliderLayer] = useState();

  // const layoutOptions = [
  //   { label: 'Vertical', value: 'vertical' },
  //   { label: 'Horizontal', value: 'horizontal' }]

  // const [layoutOption, setLayoutOption] = useState('vertical')
  // const layoutOptionRef = useRef('vertical')

  //----------------------------------------------------------- load model
  useEffect(() => {
    //    get layers from component config
    if (viewer && viewer.config_json && component_cfg.layers) {
      const config_layers = viewer.config_json.layers.filter(
        j => { return component_cfg.layers.some(e => { return e === j.id }) }
      )

      const model = config_layers.map(i => {
        return ({ id: i.id, code: i.id, item_name: i.title })
      })

      if (viewer && viewer.config_json && record.target === "map_controls_top_right") {
        setToolUIposition("map_controls_top_right")
      }

      setLayers(model)
    }
  }, [])


  // checked layers
  useEffect(() => {
    if (!mainMap || !layers) return
    const layersIds = layers.map(e => e.code)
    const checked = config.viewer.config_json.checked.filter(c => { return !layersIds.includes(c); });
    if (selectedLayer) checked.push(selectedLayer.code)
    if (selectedSliderLayer) checked.push(selectedSliderLayer.code)
    dispatch(actions.layers_set_checked(checked));
  }, [selectedLayer, selectedSliderLayer])

  useEffect(() => {
    if (selectedLayer && selectedSliderLayer && selectedSliderLayer.code === selectedLayer.code) {
      setSelectedSliderLayer(null)
    }
  }, [selectedLayer])

  useLayerSwipe({
    map: mainMap,
    leftLayer: mainMap && selectedLayer ? utils.findOlLayer(mainMap, selectedLayer.code) : null,
    rightLayer: mainMap && selectedSliderLayer ? utils.findOlLayer(mainMap, selectedSliderLayer.code) : null,
    mode: compareTool === 2 ? 'opacity' : 'swipe',
    swipe: sliderValue,
    opacity: opacitySliderValue,
    active
  })

  // function changeLayoutOption(e) {
  //   setLayoutOption(e.value)
  //   layoutOptionRef.current = e.value
  //   mainMap.render();
  // }

  // ----------------------------------------Render full content---------------------------------------------
  function renderContent() {
    return (


      toolUIposition === "map_controls_top_right" ?
        // TOOL ON MAP TOP RIGHT
        <div
          className="layercompare-control"
        >
          <div >
            <div
              className="card layercompare-main-control"
              style={opened ? { opacity: '0', visibility: 'hidden' } : { opacity: '1', visibility: 'visible' }}>
              <Button
                type="button"
                radius="xl"
                color="warning"
                rightSection={<IconAngleDown />}
                title="Abrir"
                aria-expanded={opened}
                onClick={e => open()}>
                Layer Compare
              </Button>
            </div>
            <div className='card layercompare-control-content layercompare-control-content-opened'
              style={!opened ? { opacity: '0', visibility: 'hidden' } : { opacity: '1', visibility: 'visible' }}
            >

              <Button
                type="button"
                fullWidth
                color="warning"
                rightSection={<IconAngleUp />}
                title="Fechar"
                aria-expanded={opened}
                onClick={e => close()}>
                Layer Compare
              </Button>


              <LayerCompare
                active={active}
                layers={layers}
                config={config}
                actions={actions}
                selectedLayer={selectedLayer}
                setSelectedLayer={setSelectedLayer}
                selectedSliderLayer={selectedSliderLayer}
                setSelectedSliderLayer={setSelectedSliderLayer}
                sliderValue={sliderValue}
                setSliderValue={setSliderValue}
                compareToolOptions={compareToolOptions}
                compareTool={compareTool}
                setCompareTool={setCompareTool}
                opacitySliderValue={opacitySliderValue}
                setOpacitySliderValue={setOpacitySliderValue}
                utils={utils}
              />
            </div>
          </div>
        </div >

        :

        <LayerCompare
          active={active}
          layers={layers}
          config={config}
          actions={actions}
          selectedLayer={selectedLayer}
          setSelectedLayer={setSelectedLayer}
          selectedSliderLayer={selectedSliderLayer}
          setSelectedSliderLayer={setSelectedSliderLayer}
          sliderValue={sliderValue}
          setSliderValue={setSliderValue}
          compareToolOptions={compareToolOptions}
          compareTool={compareTool}
          setCompareTool={setCompareTool}
          opacitySliderValue={opacitySliderValue}
          setOpacitySliderValue={setOpacitySliderValue}
          utils={utils}
        />
    )
  }

  // Render as panel
  if (as === 'panel') return (
    <CollapsiblePanel header={header} toggleable={false}>
      {renderContent()}
    </CollapsiblePanel>
  )

  // Default render
  return renderContent();
}