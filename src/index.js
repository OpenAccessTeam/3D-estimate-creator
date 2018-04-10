import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';

import reducer from './reducers';
import { initSaga } from './sagas';

const initstate = localStorage["store"] || {
    objects: {
        item: {name: "item"},
        item2: {name: "item2"}
    },
    objectsDisplayed: [
        {
            name: "tente",
            position: "",
            rotation: "",
            settings: [{
                type: 'color',
                value: 'default'
            }]
        }
    ]
};
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, initstate,  composeEnhancers(applyMiddleware(sagaMiddleware)));
sagaMiddleware.run(initSaga);
