import React, { useEffect, useState, useRef } from 'react';

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import { Message } from 'primereact/message';

import './style.css';


function parseTimeValues (data) {

  let values = [];

  if (data.includes("/")) {
    const parts = data.split("/");
  } else {
    values = data?.split ? data.split(',') : [];
  }

  return values; 
}


function isoDateWithoutTimeZone(date) {
  if (date == null) return date;
  var timestamp = date.getTime() - date.getTimezoneOffset() * 60000;
  var correctDate = new Date(timestamp);
  // correctDate.setUTCHours(0, 0, 0, 0); // uncomment this if you want to remove the time
  return correctDate.toISOString();
}

function addDurationToDate(date, duration) {
  // Regular expression pattern for ISO 8601 duration
  const durationPattern = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?/;
  
  const match = duration.match(durationPattern);
  
  if (!match) {
      throw new Error("Invalid duration format");
  }
  
  const [
      , // full match
      years = 0,
      months = 0,
      weeks = 0,
      days = 0,
      hours = 0,
      minutes = 0,
      seconds = 0
  ] = match.map(num => parseFloat(num) || 0);

  // Create a new Date instance from the input date to avoid mutating the original date
  let resultDate = new Date(date);

  // Add duration components to the date
  resultDate.setFullYear(resultDate.getFullYear() + years);
  resultDate.setMonth(resultDate.getMonth() + months);
  resultDate.setDate(resultDate.getDate() + weeks * 7 + days);
  resultDate.setHours(resultDate.getHours() + hours);
  resultDate.setMinutes(resultDate.getMinutes() + minutes);
  resultDate.setSeconds(resultDate.getSeconds() + seconds);

  return resultDate;
}

function parseDateTimeList(inputString) {
  // Regular expression patterns for datetime and duration
  const dateTimePattern = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b/;
  const durationPattern = /\bP(?=\d|T\d)(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?\b/;
  
  // Split the input string by commas to get individual values
  let values = [];
  
  if (inputString.includes("/")) {
    values = inputString.split('/');
  } else {
    values = inputString.split(',');
  }

  let parsedValues = values.map(value => {
      // Trim whitespace
      value = value.trim();
      
      if (dateTimePattern.test(value)) {
          return { type: "datetime", value };
      } else if (durationPattern.test(value)) {
          return { type: "duration", value };
      } else {
          return { type: "unknown", value };
      }
  });

  if (parsedValues.length === 2 && parsedValues[1].type === 'duration') {
    const beginDate = new Date(parsedValues[0].value);
    const endDate = new Date();
    const duration = parsedValues[1].value;

    let calcDate = beginDate;

    parsedValues = [parsedValues[0].value];

    while (calcDate < endDate) {
      calcDate = addDurationToDate(calcDate, duration);

      if (calcDate > endDate) {
        break;
      } else {
        parsedValues.push(calcDate.toISOString());
        //parsedValues.push(isoDateWithoutTimeZone(calcDate));
      }
    }
  } else if (parsedValues.length === 3 && parsedValues[2].type === 'duration') {
    const beginDate = new Date(parsedValues[0].value);
    const endDate = new Date(parsedValues[1].value);
    const duration = parsedValues[2].value;
    
    let calcDate = beginDate;

    parsedValues = [parsedValues[0].value];

    while (calcDate < endDate) {
      calcDate = addDurationToDate(calcDate, duration);

      if (calcDate > endDate) {
        break;
      } else {
        parsedValues.push(calcDate.toISOString());
        //parsedValues.push(isoDateWithoutTimeZone(calcDate));
      }
    }
  } else {
    parsedValues = parsedValues.map(v => v.value);
  }
  
  return parsedValues;
}

function formatDate(val) { 
  let date, month, year;

  const inputDate = new Date(val);

  date = inputDate.getDate();
  month = inputDate.getMonth() + 1;
  year = inputDate.getFullYear();
  date = date.toString().padStart(2, '0');
  month = month.toString().padStart(2, '0');
  return `${date}-${month}-${year}`;
}


export default function TimelineConstrol({ core, viewer, mainMap, dispatch, actions, record, utils, Models, theme, dimension, opened }) {

  const { exclusive_mapcontrol, checked } = viewer;

  const [timeData, setTimeData] = useState();

  const [currentDatePos, setCurrentDatePos] = useState();
  const [frameRate, setFrameRate] = useState(0.5);

  const controlLayer = useRef();
  const currentPos = useRef();
  const animationId = useRef();
    
  function setTime() {
    if (currentPos.current >= timeData.length) {
     setCurrentDatePos(0);
    } else {
     setCurrentDatePos(currentPos.current + 1);
    }
  }
    
  const stop = function () {
    if (animationId?.current !== null) {
      window.clearInterval(animationId.current);
      animationId.current = null;
    }
  };
    
  const play = function () {
    stop();
    animationId.current = window.setInterval(setTime, 1000 / frameRate);
  };

  useEffect(() => {

    if (!mainMap) return;
    if (!theme) return;
    if (controlLayer.current) return;

    const layerId = theme?.id;

    let layer;
    
    if (layerId) layer = utils.findOlLayer(mainMap, layerId);
    if (layer) controlLayer.current = layer;
  }, [theme]);

  useEffect(() => {
    if (!mainMap) return;
    if (!dimension) return;

    let values = []
    if (dimension?.values) {
      values = parseDateTimeList(dimension.values);
      //console.log(parseDateTimeList(dimension.values));
      //console.log(parseDateTimeList("2024-06-01T00:00:00Z/2024-06-03T00:00:00Z/PT24H"));
      //console.log(parseDateTimeList("2024-06-01T00:00:00Z/PT12H"));

      setTimeData(values);
      setCurrentDatePos(0);
    }
  }, [dimension]);

  useEffect(() => {
    if (!animationId.current) return;

    if (theme?.id && viewer?.config_json?.checked?.length && !viewer.config_json.checked.includes(theme.id)) {
      stop();
    }
  }, [viewer?.config_json?.checked]);

  useEffect(() => {
    currentPos.current = currentDatePos;
    if (timeData?.length && controlLayer != null) {
      controlLayer.current.getSource().updateParams({'TIME': timeData[currentDatePos]});
    }
  }, [currentDatePos]);

  const options = (timeData || []).map((v, idx) => {return { value: idx, label: formatDate(v) }});

  if(!opened) return <React.Fragment></React.Fragment>

  if (theme?.id && viewer?.config_json?.checked?.length && !viewer.config_json.checked.includes(theme.id)) {
    return (
      <div style={{width: "100%"}}> 
        <Message severity="info" text={`O tema "${theme?.id}" não está visível`} className="p-mt-2" style={{width: "100%" }} />
      </div>
    )
  }

  return (
    <div style={{width: "200px", padding: "10px 10px"}}>
      <div className="p-text-center p-mb-3">
      <Dropdown value={currentDatePos} options={options} filter={options?.length > 20}
          onChange={(e) => {setCurrentDatePos(e.value)}} optionLabel="label" showClear filterBy="label" placeholder="Escolha uma data" />
      </div>
      <Slider className="p-mb-3" value={currentDatePos} onChange={(e) => setCurrentDatePos(e.value)} max={timeData?.length ? timeData?.length - 1 : 100} disabled={!timeData?.length} />
      <div className="scalargis-timeline p-text-center">
        <div className="p-inputgroup scalargis-timeline">
          <Button icon="pi pi-angle-double-left" onClick={(e) => { setCurrentDatePos(0); }}></Button>
          <Button icon="pi pi-angle-left" onClick={(e) => { currentDatePos && setCurrentDatePos(currentDatePos - 1); }}></Button>
          { animationId.current ? 
            <Button icon="pi pi-pause" onClick={(e) => { stop(); }}></Button> :
            <Button icon="pi pi-play" onClick={(e) => { play(); }}></Button>
          }
          <Button icon="pi pi-angle-right" onClick={(e) => { setCurrentDatePos(currentDatePos + 1); }}></Button>
          <Button icon="pi pi-angle-double-right" onClick={(e) => { setCurrentDatePos(timeData.length - 1); }}></Button>
        </div>
      </div>
    </div>
  )
}