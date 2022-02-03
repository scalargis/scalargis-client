import { useState, useRef, useEffect } from "react";

export default function useFormFields(initialState) {
  const [fields, setValues] = useState(initialState);
  const cbRef = useRef(null); // mutable ref to store current callback

  useEffect(() => {
    // cb.current is `null` on initial render, so we only execute cb on state *updates*
    if (cbRef.current) {
      const cb = cbRef.current;
      cbRef.current = null; // reset callback
      cb(fields);
    }
  }, [fields]);

  return [
    fields,
    function(event, cb) {
      cbRef.current = cb;
      setValues({
        ...fields,
        [event.target.id]: event.target.value
      });
    },
    function(values, cb) {
      cbRef.current = cb;
      setValues({
        ...values
      });
    }
  ];
}