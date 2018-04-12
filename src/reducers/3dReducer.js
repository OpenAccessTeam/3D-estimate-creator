import { APPAREL_CHANGED, DELETE_ALL, SETTING_CHANGED, TOGGLE_HELPER_PANEL } from "../actions";

const defaultObjectsDisplayedState = [
    {
        name: "Tente de réception - 10m x [3]m",
        position: "",
        rotation: "",
        settings: [{
            name: 'longueur',
            value: 'default'
        }],
        apparels: [
            {
                type: 'rideau',
                name: 'rideau 3x3',
                value: 'blanc'
            },
            {
                type: 'rideau',
                name: 'rideau 3x3',
                value: 'blanc'
            },
            {
                type: 'pignon',
                name: 'pignon 3x3',
                value: 'cristal'
            },

            {
                type: 'toit',
                name: 'toit 3x3',
                value: 'toit'
            }
        ]
    }
];

const defaultHelperState = {
    isDisplay: false
};

export const objectsDisplayed = (state = defaultObjectsDisplayedState, action) => {
    switch (action.type) {
        case SETTING_CHANGED:
            return state.map(object => {
                if (object.name === action.payload.itemName) {
                    return {
                        ...object,
                        settings: object.settings.map(setting => {
                            if (setting.name === action.payload.setting.name) {
                                return {
                                    ...setting,
                                    value: action.payload.setting.value
                                }
                            }

                            return setting;
                        })
                    }
                }

                return object;
            });
        case APPAREL_CHANGED:
            return state.map(object => {
                if (object.name === action.payload.itemName) {
                    return {
                        ...object,
                        apparels: object.apparels.map(apparel => {
                            if (apparel.type === action.payload.apparel.type) {
                                return {
                                    ...apparel,
                                    value: action.payload.apparel.value
                                }
                            }

                            return apparel;
                        })
                    }
                }
            });
        default:
            return state;
    }
};

export const helper = (state = defaultHelperState, action) => {
    switch (action.type) {
        case TOGGLE_HELPER_PANEL:
            return Object.assign(state, {['isDisplay']: !state['isDisplay']});
        default:
            return state;
    }
};

export const deleteAll = (state = {}, action) => {
    switch (action.type) {
        case DELETE_ALL:
            localStorage.clear();
            location.reload(true);
            return state;
        default:
            return state;
    }
};