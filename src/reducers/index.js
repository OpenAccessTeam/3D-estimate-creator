import { combineReducers } from 'redux';
import { collapsiblesStatus } from './drawerReducer';
import { deleteAll, details, helper, objectsDisplayed, recapOrder, renderer, settings, spans } from './3dReducer';

const rootReducer = combineReducers({
    collapsiblesStatus,
    objectsDisplayed,
    details,
    helper,
    settings,
    deleteAll,
    renderer,
    spans,
    recapOrder,
});

export default rootReducer;