import extractProperty from 'object-property-extractor';

const checkDate = (date) => {
    const selected = new Date(date);
    const current = new Date();
    selected.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
  
    const selectedTime = selected.getTime();
    const currentTime = current.getTime();
  
    if (selectedTime === currentTime) return 0;
  
    return selectedTime > currentTime ? 1 : -1;
  };

  const getAsOneOfObjects = (data, constField, titleField) => {
    function formatData(data, elem) {
      if (typeof(elem) === 'object') {
        const retVal = {...elem};
        for (const [key, value] of Object.entries(retVal)) {
          if (typeof(value) === 'object') {
            retVal[key] = formatData(data, retVal[key]);
          } else {
            retVal[key] = extractProperty(data, retVal[key], null);
          }
        }
        return retVal;
      } else {
        return extractProperty(data, elem, null);
      }
    }

    const _constField = typeof(constField) === 'object' ? {...constField} : constField;

    return data.map(item => {
      const val = formatData(item, _constField);
      return { const: val, title: extractProperty(item, titleField, null) }
    });
  }
  
  export { checkDate, getAsOneOfObjects };