import React, { useEffect, useState, useRef, useCallback } from 'react';

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import { Message } from 'primereact/message';

import { Legend } from '@scalargis/components';

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

function subtractDurationToDate(date, duration) {
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
  resultDate.setFullYear(resultDate.getFullYear() - years);
  resultDate.setMonth(resultDate.getMonth() - months);
  resultDate.setDate(resultDate.getDate() - (weeks * 7 + days));
  resultDate.setHours(resultDate.getHours() - hours);
  resultDate.setMinutes(resultDate.getMinutes() - minutes);
  resultDate.setSeconds(resultDate.getSeconds() - seconds);

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
  
  return parsedValues.map(d => d.indexOf(".") > -1  ? d.split('.')[0]+"Z" : d);
}

function formatDate(val, format) { 
  let day, month, year, hour, minute, second;

  const inputDate = new Date(val);

  day = inputDate.getDate();
  month = inputDate.getMonth() + 1;
  year = inputDate.getFullYear();
  day = day.toString().padStart(2, '0');
  month = month.toString().padStart(2, '0');

  hour = inputDate.getHours().toString().padStart(2, '0');
  minute = inputDate.getMinutes().toString().padStart(2, '0');
  second = inputDate.getSeconds().toString().padStart(2, '0');

  if (format) {
    const val = format.replace("{dd}", day).replace("{mm}", month).replace("{yyyy}", year).replace("{h}", hour).replace("{m}", minute).replace("{s}", second);
    return val;
  }

  return(inputDate.toISOString());
}


const calculateSelectedDate = (value, defaultValue = new Date()) => {
  let calculatedDate = defaultValue;

  // With default
  if (value == 'now') {
    calculatedDate = new Date();
  } else if (value == 'today') {
    calculatedDate = new Date();
    calculatedDate.setUTCHours(0, 0, 0, 0);
  } else if (value == 'tomorrow') {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setUTCHours(0, 0, 0, 0);
    calculatedDate = date;
  } else if (value == 'yesterday') {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setUTCHours(0, 0, 0, 0);
    calculatedDate = date;
  } else if (value) {
    if (value.startsWith("-")) {
      calculatedDate = subtractDurationToDate(new Date(), value.substring(value.indexOf("-")));
    } else {
      calculatedDate = addDurationToDate(new Date(), value);
    }
  }

  return calculatedDate;
}


const calculateDates = (config, data) => {

  let values = [];
  let defaultPos = 0;

  if (data) {
    values = parseDateTimeList(data);

    const refDate = formatDate(calculateSelectedDate(config.value));

    if (config?.interval?.length > 1) {
      const minDate = new Date(config.interval[0]);
      const maxDate = new Date(config.interval[1]);

      values = values.filter(d => {
        const dt = new Date(d);
        return dt >= minDate && dt <= maxDate;
      });
      defaultPos = values.findIndex(d => formatDate(d) == refDate);
    } else {
      values.forEach((val, idx) => {
        const dt = formatDate(val);
        if (refDate == dt) defaultPos = idx;
      });

      if (config?.steps != null) {
        // With steps
        let leftSteps = 0; 
        let rightSteps = 0;
        if (Array.isArray(config.steps)) {
          if (config.steps.length > 1) {
            leftSteps = defaultPos - config.steps[0];
            rightSteps = defaultPos + config.steps[1] + 1;
          }
        } else if (Number.isInteger(config.steps)) {
          leftSteps = defaultPos - config.steps;
          rightSteps = defaultPos + config.steps + 1;
        }
        values = values.slice(leftSteps, rightSteps);
        defaultPos = values.findIndex(d => formatDate(d) == refDate);
      } else if (config?.delta) {
        // With delta
        let minDate = refDate;
        let maxDate = refDate;
        if (Array.isArray(config?.delta)) {
           if (config.delta.length > 1) {
            minDate = subtractDurationToDate(refDate, config.delta[0]);
            maxDate = addDurationToDate(refDate, config.delta[1]);
           }
        } else {
          minDate = subtractDurationToDate(refDate, config.delta);
          maxDate = addDurationToDate(refDate, config.delta);
        }

        values = values.filter(d => {
          const dt = new Date(d);
          return dt.setHours(0, 0, 0, 0) >= minDate.setHours(0, 0, 0, 0) && dt <= maxDate.setHours(0, 0, 0, 0);
        });
        defaultPos = values.findIndex(d => {  
          return formatDate(d) == refDate
        });
      }
    }
  }

  if (config?.selectedIndex != null) {
    if (Number.isInteger(config.selectedIndex)) {
      if (config.selectedIndex > (values.length)) {
        defaultPos = values.length - 1;
      } else {
        defaultPos = config.selectedIndex - 1;
      }
    } else {
      if (config.selectedIndex === "first") {
        defaultPos = 0
      } else if (config.selectedIndex === "last") {
        defaultPos = values.length - 1;
      }
    }
  }

  if (defaultPos < 0) defaultPos = 0;
  
  return [values, defaultPos];

}

export default function TimelineConstrol({ core, viewer, mainMap, dispatch, actions, record, utils, Models, theme, dimension, opened }) {

  const { exclusive_mapcontrol, checked } = viewer;

  const [timeData, setTimeData] = useState();

  const [frameRate, setFrameRate] = useState(record?.config_json?.speed ? record?.config_json?.speed : 0.5);

  const controlLayer = useRef();
  
  const [currentPos, setCurrentPos] = useState(0);
  const [intervalId, setIntervalId] = useState(0);

  // Start the interval
  const startIntervalHandler = () => {
    //Start interval condition
    if (currentPos >= timeData?.length - 1) {
      setCurrentPos(0);
    }

    let newIntervalId = setInterval(() => {
      setCurrentPos((val) => {
        if (val + 1 >= timeData.length) {
          if (record?.config_json?.loop === true) {
            setCurrentPos(0);
          } else {
            clearInterval(newIntervalId);
            setIntervalId(0);
          }

          return val;
        }
        return val + 1;
      });
    }, 1000 / frameRate);

    setIntervalId(newIntervalId);
  };

  // Stopping the interval
  const stopIntervalHandler = () => {
    clearInterval(intervalId);
    setIntervalId(0);
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

    const [values, defaultPos] = calculateDates(record?.config_json, dimension?.values);;

    setTimeData(values);
    setCurrentPos(defaultPos);
  }, [dimension]);

  useEffect(() => {
    if (!intervalId) return;

    if (theme?.id && viewer?.config_json?.checked?.length && !viewer.config_json.checked.includes(theme.id)) {
      stop();
    }
  }, [viewer?.config_json?.checked]);


  useEffect(()=> {
    if (intervalId === 0) {
      //setCurrentPos(0);
    }

    //Clear interval on unmount
    return () => { if (intervalId) clearInterval(intervalId); }
  }, [intervalId])

  useEffect(() => {
    if (timeData?.length && controlLayer != null) {
      controlLayer.current.getSource().updateParams({'TIME': timeData[currentPos]});
    }
  }, [currentPos]);

  const options = (timeData || []).map((v, idx) => { 
    const format = record?.config_json?.displayFormat;
    return { value: idx, label: formatDate(v, format) }
  });

  if(!opened) return <React.Fragment></React.Fragment>

  if (theme?.id && viewer?.config_json?.checked?.length && !viewer.config_json.checked.includes(theme.id)) {
    return (
      <div style={{width: "100%"}}> 
        <Message severity="info" text={`O tema "${theme?.title}" não está visível`} className="p-mt-2" style={{width: "100%" }} />
      </div>
    )
  }

  const showLegend = theme && record?.config_json?.showLegend === true;

  return (
    <div style={{padding: "10px 10px"}}>
      { showLegend && <div className="p-mb-2"><Legend data={theme} core={core} actions={actions} models={Models}/></div> }
      <div className="p-text-center p-mb-3">
        <Dropdown value={currentPos} options={options} filter={options?.length > 20}
          onChange={(e) => { setCurrentPos(e.value) }} optionLabel="label" showClear filterBy="label" placeholder="Escolha uma data" />
      </div>
      <Slider className="p-mb-3" value={currentPos} onChange={(e) => { setCurrentPos(e.value) }} max={timeData?.length ? timeData?.length - 1 : 100} disabled={!timeData?.length} />
      <div className="scalargis-timeline p-text-center">
        <div className="p-inputgroup scalargis-timeline">
          <Button icon="pi pi-angle-double-left" onClick={(e) => { setCurrentPos(0); }}></Button>
          <Button icon="pi pi-angle-left" 
            onClick={(e) => { 
              if (currentPos) setCurrentPos(currentPos - 1);
            }}
          />
          { intervalId ? 
            <Button icon="pi pi-pause" onClick={(e) => { stopIntervalHandler(); }}></Button> :
            <Button icon="pi pi-play" onClick={(e) => { startIntervalHandler(); }}></Button>
          }
          <Button icon="pi pi-angle-right" 
            onClick={(e) => { 
              if (timeData?.length) {
                if (currentPos + 1 < timeData.length) {
                  setCurrentPos(currentPos + 1);
                } else if (record?.config_json?.loop === true) {
                  setCurrentPos(0);
                }
              }
            }}
          />
          <Button icon="pi pi-angle-double-right" onClick={(e) => { setCurrentPos(timeData.length - 1) }}></Button>
        </div>
      </div>
    </div>
  )
}