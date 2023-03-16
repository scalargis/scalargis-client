/*
const searchlayersReducer = (state = {}, action) => {
  switch (action.type) {
    case 'SEARCHLAYERS_SET_LAYER':
      let l = {};
      if (state[action.control]) {
        l[action.control] = {...state[action.control], layers: [action.layer]};
      } else {
        l = {};
        l[action.control] = { layers: [action.layer] }        
      }
      return Object.assign({}, {...state}, l)
    default:
      return state
  }
}

export default {
  searchlayers: searchlayersReducer
}
*/

const reducer = {
  'SEARCHLAYERS_SET_LAYER': (state, action) => { 
    let l = {};
    if (state[action.control]) {
      l[action.control] = {...state[action.control], layers: [action.layer]};
    } else {
      l = {};
      l[action.control] = { layers: [action.layer] }        
    }
    return Object.assign({}, {...state}, l)
  }
}

export default {
  searchlayers: reducer
}