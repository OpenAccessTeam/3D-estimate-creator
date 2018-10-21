import * as THREE from 'three';
import { all, call, put, select } from 'redux-saga/effects';
import setBoxCenter from './util/setBoxCenter';
import { getSpansState } from '../selectors';

import loadModel from './util/colladaLoader';
import { actionCreator, DELETE_LAST_SPAN_ADDED, DELETE_SPAN, LAST_SPAN_ADDED } from "../actions";

export function* addSpan(scene, action) {
    const generateUid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

    const {uid, itemName, item} = action.payload;

    const base = scene.getObjectByName(uid);

    // Pour avoir le spansNumber et mettre les travées a la bonne distance
    const spanState = yield select(getSpansState);
    const currentSpan = spanState.filter(span => span.uid === uid);

    // Position de la tente mere + le nombre de travees * 3m + la future travees
    // TODO Le 25 a changer quand on mettra une taille dynamique de la grille
    if (base.position.x + 3 * currentSpan[0].spansNumber + 3 > 25) {
        alert("La travée va sortir de la grille, impossible de l'ajouter");

        yield put(actionCreator(DELETE_SPAN, {
            uid: item.uid,
            itemName: itemName,
            item: item,
            shouldIDeleteIt: false
        }));

        return null;
    }

    const baseToAdd = yield call(loadModel, itemName, itemName);
    baseToAdd.name = generateUid();
    baseToAdd.position.set((3 * currentSpan[0].spansNumber), 0, 0); // y:0 et z:0 car placement par rapport a la tente mere
    base.add(baseToAdd);

    // Delete rideaux pour les remettre mieux après
    let apparelToDelete = scene.getObjectByName(uid).getObjectByName("Rideau Largeur");
    while (apparelToDelete != null) {
        apparelToDelete.parent.remove(apparelToDelete);
        apparelToDelete = scene.getObjectByName(uid).getObjectByName("Rideau Largeur");
    }

    const calls = {};

    item.apparels.forEach((appareal) => {
        calls[appareal.type] = call(addApparealSpan, scene, itemName, baseToAdd, appareal.type, appareal.value || appareal.values[0].name, item.settings);
        if (appareal.type === "Rideau Largeur")
            calls["Rideau Largeur Start"] = call(addApparealSpan, scene, itemName, base, "Rideau Largeur Start", appareal.value || appareal.values[0].name, item.settings);
    });

    yield all(calls);

    yield put(actionCreator(LAST_SPAN_ADDED, {
        uid: uid,
        lastSpansAdded: baseToAdd.name
    }));

    return base;
}

export function* addApparealSpan(scene, itemName, parentObj, apparealType, apparealValue, settings) {
    if (apparealValue.name === "aucun") return null;

    const obj = new THREE.Group();
    const parentBox = parentObj.userData.bb;
    const model = yield call(loadModel, itemName, apparealValue.name);
    let bb;

    model.name = apparealType;

    switch (apparealType) {
        case "Pignon":
            model.position.set(2.45, 0, parentBox.max.z - 1);
            break;
        case "Croix de saint andre":
            model.position.set(0, 5.1, parentBox.max.z - 3.40);

            let copy = model.clone();
            copy.rotateZ(Math.PI);
            copy.position.set(0, -5.1, parentBox.max.z - 3.40);

            obj.add(copy);
            break;
        case "Barre de pignon":
            model.position.set(2.45, 0, parentBox.max.z - 2.48);
            break;
        case "Toit pagode":
            model.position.set(0, 0,
                settings.find((e) => e.type === "hmin" && e.value['Toit pagode']).value['Toit pagode']);
            break;
        case "Toit travee":
            model.position.set(0, 0, parentBox.max.z - 1.03);
            break;
        case "Plancher":
            break;
        case "Rideau Longueur":
            bb = model.userData.bb;
            model.traverse((o) => {
                if (o.material) o.material.side = THREE.DoubleSide;
            });
            model.position.set(0, (parentBox.min.y - parentBox.max.y) / 2, 0);

            let rideauLongueur = model.clone();
            rideauLongueur.rotateZ(Math.PI);
            rideauLongueur.position.set(0, (parentBox.max.y - parentBox.min.y) / 2, 0);
            obj.add(rideauLongueur);
            break;
        case "Rideau Largeur Start":
            bb = model.userData.bb;
            model.traverse((o) => {
                if (o.material) o.material.side = THREE.DoubleSide;
            });
            model.position.set((parentBox.min.x - parentBox.max.x) / 2, 0, 0);
            break;
        case "Rideau Largeur":
            bb = model.userData.bb;
            model.traverse((o) => {
                if (o.material) o.material.side = THREE.DoubleSide;
            });
            model.position.set((parentBox.max.x - parentBox.min.x) / 2, 0, 0);
            break;
        case "Lestage":
            bb = model.userData.bb;
            model.position.set((parentBox.min.x - parentBox.max.x) / 2 - .5, (parentBox.min.y - parentBox.max.y) / 2 - .5, 0);

            let lestage = model.clone();
            lestage.position.set((parentBox.max.x - parentBox.min.x) / 2 + .5, (parentBox.min.y - parentBox.max.y) / 2 - .5, 0);
            obj.add(lestage);

            lestage = lestage.clone();
            lestage.position.set((parentBox.max.x - parentBox.min.x) / 2 + .5, (parentBox.max.y - parentBox.min.y) / 2 + .5, 0);
            obj.add(lestage);

            lestage = lestage.clone();
            lestage.position.set((parentBox.min.x - parentBox.max.x) / 2 - .5, (parentBox.max.y - parentBox.min.y) / 2 + .5, 0);
            obj.add(lestage);
            break;
        default:
            yield call(setBoxCenter, obj, obj);
    }

    obj.add(model);
    parentObj.add(obj);
}

export function* deleteSpan(scene, action) {
    const {uid, itemName, item, shouldIDeleteIt} = action.payload;

    // Si on ajoute une travee mais qu'elle sort de la grille cette sage est quand meme appellee
    if (!shouldIDeleteIt) return null;

    const base = scene.getObjectByName(uid);

    const spanState = yield select(getSpansState);

    const currentSpanItem = spanState.filter(span => span.uid === uid);
    const itemSpans = currentSpanItem[0].lastSpansAdded;

    let spanToDelete = base.getObjectByName(itemSpans[itemSpans.length - 1]);
    const uidToDelete = spanToDelete.name;

    if (spanToDelete) {
        spanToDelete.parent.remove(spanToDelete);

        // Pour placer le rideau lageur de la fin, on l'ajoute a l'avant dernière travées (celle qui deviendra la dernière après que la dernière soit delete)
        const calls = {};
        item.apparels.forEach((appareal) => {
            if (appareal.type === "Rideau Largeur") {
                if (itemSpans.length === 1) {
                    calls[appareal.type] = call(addApparealSpan, scene, itemName, base, appareal.type, appareal.value || appareal.values[0].name, item.settings);
                } else
                    calls[appareal.type] = call(addApparealSpan, scene, itemName, base.getObjectByName(itemSpans[itemSpans.length - 2]), appareal.type, appareal.value || appareal.values[0].name, item.settings);
            }
        });

        yield all(calls);

        yield put(actionCreator(DELETE_LAST_SPAN_ADDED, {
            uid: uid,
            uidToDelete
        }));
    }
}