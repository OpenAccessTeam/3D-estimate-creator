export const rootselector = (state) => state;
export const getSectionCollapsibleState = (store, section) => store.collapsiblesStatus[section] || {self: false};
export const getCategoryCollapsibleState = (store, section, category) => getSectionCollapsibleState(store, section)[category] || false;
export const rendererSelector = (store) => store.renderer;
export const getDetailsState = store => store.details || {};
export const objectsDisplayed = (store) => store.objectsDisplayed;
export const totalSelector = (store, objectsAvailable) => objectsDisplayed(store).map(e => objectsAvailable[e.name].price).reduce((acc, val) => acc + val["ILE DE FRANCE"], 0);