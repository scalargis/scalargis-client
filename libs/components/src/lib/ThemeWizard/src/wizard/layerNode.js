export default function layerNode(layer, selected) {
  let node = {
    key: layer.id,
    label: layer.title,
    data: layer,
    selectable: true,
    children: []
  };
  if (layer.children) {
    node.children = layer.children.map(l => layerNode(l, selected));
  } else node['leaf'] = true;
  return node;
}