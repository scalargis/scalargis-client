export const translateMsg = (elem, fallbackElem, defaultMsg, props) => {
  const {t, schema, uischema, path} = props;
  if (fallbackElem) {
    return t(elem, 
      t(fallbackElem, defaultMsg, { schema, uischema, path }),
      { schema, uischema, path }
    );
  } else {
    return t(elem,  defaultMsg, { schema, uischema, path });
  }
}