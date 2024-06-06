import React, { useState, useEffect, useRef } from 'react'
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import { getRenderPixel } from 'ol/render';
import LayerCompare from './LayerCompare.js';

//import { findOlLayer } from '../../../core/utils'  // ? can t access Models from config ?

import './style.css';
import './control.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const title = record.title || 'LayerCompare';

  return (
    <Button
      title={title}
      className={className}
      icon="pi pi-pause"
      // style={mystyle}
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    >
    </Button>
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
  const title = record.title || 'TimeLine...';
  const header = component_cfg.header || title;

  const [toolUIposition, setToolUIposition] = useState()


  // map layers ref
  const leftMapSide = useRef()
  const leftMapSideEvent_pre = useRef()
  const leftMapSideEvent_post = useRef()

  const rightMapSide = useRef()
  const rightMapSideEvent_pre = useRef()
  const rightMapSideEvent_post = useRef()


  //compare tool
  const sliderValue = useRef()
  const layoutOptionRef = useRef('vertical') // horizontal: works but need devs on ui & css (slider, etc..)

  const compareToolOptions = [
    { name: 'Dividir tela', value: 1, icon: 'pi  pi-pause' },
    { name: 'Transparência', value: 2, icon: 'pi  pi-clone' }
  ]
  const [compareTool, setCompareTool] = useState(1);
  const [opacitySliderValue, setOpacitySliderValue] = useState(50)


  //----------------------------------------------------------------------
  const [opened, setOpened] = useState(true)
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
    console.log("ScalarGIS LayerCompare plugin. Welcome.")

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


  // load events funcs (mapslider)
  useEffect(() => {

    leftMapSideEvent_pre.current = (event) => {
      const ctx = event.context
      const mapSize = mainMap.getSize()
      const width = mapSize[0] * (sliderValue.current / 100)
      const height = mapSize[1] * ((100 - sliderValue.current) / 100)

      let tl, tr, bl, br
      if (layoutOptionRef.current === 'vertical') {
        tl = getRenderPixel(event, [0, 0])
        tr = getRenderPixel(event, [width - 1, 0])
        bl = getRenderPixel(event, [0, mapSize[1]])
        br = getRenderPixel(event, [width - 1, mapSize[1]])
      } else { // horizontal
        tl = getRenderPixel(event, [0, 0])
        tr = getRenderPixel(event, [mapSize[0], 0])
        bl = getRenderPixel(event, [0, height])
        br = getRenderPixel(event, [mapSize[0], height])
      }

      clipContext(ctx, tl, tr, bl, br)
    }

    rightMapSideEvent_pre.current = (event) => {
      const ctx = event.context
      const mapSize = mainMap.getSize()
      const width = mapSize[0] * (sliderValue.current / 100)
      const height = mapSize[1] * ((100 - sliderValue.current) / 100)

      let tl, tr, bl, br
      if (layoutOptionRef.current === 'vertical') {
        tl = getRenderPixel(event, [width + 1, 0])
        tr = getRenderPixel(event, [mapSize[0], 0])
        bl = getRenderPixel(event, [width + 1, mapSize[1]])
        br = getRenderPixel(event, mapSize)
      } else { // horizontal
        tl = getRenderPixel(event, [0, height])
        tr = getRenderPixel(event, [mapSize[0], height])
        bl = getRenderPixel(event, [0, mapSize[1]])
        br = getRenderPixel(event, mapSize)
      }

      clipContext(ctx, tl, tr, bl, br)
    }

    leftMapSideEvent_post.current = (event) => {
      const ctx = event.context;
      ctx.restore();
    }

    rightMapSideEvent_post.current = (event) => {
      const ctx = event.context;
      ctx.restore();
    }
  }, [])


  // main layer selection
  useEffect(() => {

    if (leftMapSide.current) {
      leftMapSide.current.setOpacity(1)
    }

    if (leftMapSideEvent_pre.current && leftMapSide.current) {
      leftMapSide.current.un('postrender', leftMapSideEvent_post.current)
      leftMapSide.current.un('prerender', leftMapSideEvent_pre.current)
    }


    if (mainMap && layers) { // set layer visible for all subcomponents
      const layersIds = layers.map(e => e.code)
      let checked = config.viewer.config_json.checked.filter(c => { return !layersIds.includes(c); });
      if (selectedLayer) {
        checked.push(selectedLayer.code)
        leftMapSide.current = findOlLayer(mainMap, selectedLayer.code)

        if (selectedSliderLayer) {
          if (selectedSliderLayer.code === selectedLayer.code) {
            setSelectedSliderLayer(null) // need to clean when not compare, if same layer
          }
        }

      } else {
        leftMapSide.current = null
      }


      if (selectedSliderLayer) { //mapslider active
        checked.push(selectedSliderLayer.code);
      }

      dispatch(actions.layers_set_checked(checked));
    } else {
      return // wait for model....
    }


    if (selectedLayer && compareTool == 1 && leftMapSide.current) { //mapslider active
      // ------  LEFT / TOP
      leftMapSide.current.on('prerender', leftMapSideEvent_pre.current)
      leftMapSide.current.on('postrender', leftMapSideEvent_post.current)
    }

    if (selectedLayer && compareTool == 2 && leftMapSide.current) { //opacity
      leftMapSide.current.setOpacity(opacitySliderValue / 100)  // NO DISPATCH 
    }

  }, [selectedLayer, compareTool])


  // right layer selection
  useEffect(() => {

    if (rightMapSide.current) {
      rightMapSide.current.setOpacity(1)
    }

    if (rightMapSideEvent_pre.current && rightMapSide.current) {
      rightMapSide.current.un('postrender', rightMapSideEvent_post.current)
      rightMapSide.current.un('prerender', rightMapSideEvent_pre.current)
    }

    if (mainMap && layers) {
      const layersIds = layers.map(e => e.code)
      let checked = config.viewer.config_json.checked.filter(c => { return !layersIds.includes(c); });
      if (selectedSliderLayer) {
        checked.push(selectedSliderLayer.code)
        rightMapSide.current = findOlLayer(mainMap, selectedSliderLayer.code)
      } else {
        rightMapSide.current = null
      }


      if (selectedLayer) {
        checked.push(selectedLayer.code);
      }
      dispatch(actions.layers_set_checked(checked));
    } else {
      return
    }

    if (selectedSliderLayer && compareTool == 1 && rightMapSide.current) { //mapslider
      // ------  RIGHT / BOTTOM
      rightMapSide.current.on('prerender', rightMapSideEvent_pre.current)
      rightMapSide.current.on('postrender', rightMapSideEvent_post.current)
    }

    if (selectedSliderLayer && compareTool == 2 && rightMapSide.current) { //opacity
      rightMapSide.current.setOpacity(1 - opacitySliderValue / 100)
    }

  }, [selectedSliderLayer, compareTool])


  // opacity change
  useEffect(() => {
    if (leftMapSide.current) {
      leftMapSide.current.setOpacity(opacitySliderValue / 100)  // TODO DISPATCH :
    }
    if (rightMapSide.current) {
      rightMapSide.current.setOpacity(1 - opacitySliderValue / 100)  // TODO DISPATCH
    }


  }, [opacitySliderValue])



  function clipContext(ctx, tl, tr, bl, br) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.closePath();
    ctx.clip()
  }

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
                className="p-button-rounded p-button-warning"
                label="Layer Compare"
                iconPos="right"
                icon="pi pi-angle-down"
                title="Abrir"
                onClick={e => setOpened(true)} />
            </div>
            <div className='card layercompare-control-content layercompare-control-content-opened'
              style={!opened ? { opacity: '0', visibility: 'hidden' } : { opacity: '1', visibility: 'visible' }}
            >

              <Button
                style={{ width: '100%' }}
                className="p-button-warning"
                label="Layer Compare"
                iconPos="right"
                icon="pi pi-angle-up"
                title="Fechar"
                onClick={e => setOpened(false)} />


              <LayerCompare
                layers={layers}
                config={config}
                actions={actions}
                selectedLayer={selectedLayer}
                setSelectedLayer={setSelectedLayer}
                selectedSliderLayer={selectedSliderLayer}
                setSelectedSliderLayer={setSelectedSliderLayer}
                sliderValue={sliderValue}
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
          layers={layers}
          config={config}
          actions={actions}
          selectedLayer={selectedLayer}
          setSelectedLayer={setSelectedLayer}
          selectedSliderLayer={selectedSliderLayer}
          setSelectedSliderLayer={setSelectedSliderLayer}
          sliderValue={sliderValue}
          compareToolOptions={compareToolOptions}
          compareTool={compareTool}
          setCompareTool={setCompareTool}
          opacitySliderValue={opacitySliderValue}
          setOpacitySliderValue={setOpacitySliderValue}
          utils={utils}
        />






    )
  }

  // Render as primereact Panel
  if (as === 'panel') return (
    <Panel header={header}>
      {renderContent()}
    </Panel>
  )

  // Default render
  return renderContent();
}