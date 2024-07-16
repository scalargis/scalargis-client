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
    const vals = data.map(d => { 
      return { const: extractProperty(d, constField, null), title: extractProperty(d, titleField, null) } 
    });
    return vals;
  }
  
  export { checkDate, getAsOneOfObjects };