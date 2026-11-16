const topics = {};

export function subscribe(topic, fn, override=true) {
  if (!topics[topic] || override) {
    topics[topic] = fn;
  }

  return () => {
    if (topics[topic] === fn) {
      delete topics[topic];
    }
  }
}

export function publish(topic, args) {
  if (!topics[topic]) return;
  const fn = topics[topic];
  if (fn) fn(args);
}