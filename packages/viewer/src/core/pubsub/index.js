import { v4 as uuid } from 'uuid';
const topics = {};

export function subscribe(topic, fn, override=true) {
  let id = uuid();

  if (!topics[topic]) {
    topics[topic] = fn;
  } else {
    if (override) {
      topics[topic] = null;
      delete topics[topic];

      topics[topic] = fn;
    }
  }


  return () => {
    if (!topics[topic]) {
      topics[topic] = null;
      delete topics[topic];
    }
  }

}

export function publish(topic, args) {
  if (!topics[topic]) return;
  const fn = topics[topic];
  if (fn) fn(args);
}