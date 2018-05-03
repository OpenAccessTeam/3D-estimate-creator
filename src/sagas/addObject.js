import * as THREE from 'three';
import { all, call } from 'redux-saga/effects';
import loadModel from './util/colladaLoader';
import setBoxCenter from './util/setBoxCenter';

export default function* addObject(scene, action) {
    const {itemName, item, uid} = action.payload;

    const obj = new THREE.Group();
    const base = yield call(loadModel, itemName, itemName);
    obj.name = uid;
    
    const bb = new THREE.Box3();
    bb.setFromObject(base);
    yield call(setBoxCenter, base, new THREE.Vector3(0, 0, (bb.max.z - bb.min.z) / 2));

    obj.add(base);
    scene.add(obj);
    
    const calls = {};

    item.apparels.forEach((appareal) => {
        calls[appareal.type] = call(addAppareal, scene, itemName, base, appareal.type, appareal.value || appareal.values[0]);
    });

    const apparealsIds = yield all(calls);
}

export function* addAppareal(scene, itemName, parentObj, apparealType, apparealValue) {
    if (apparealValue === "aucun") return null;

    let obj = new THREE.Group(), 
        parentBox = new THREE.Box3(), 
        bb = new THREE.Box3();

    parentBox = parentBox.setFromObject(parentObj);

    switch (apparealType) {
        case "toit":
            let toit = yield call(loadModel, itemName, apparealValue);
            yield call(setBoxCenter, toit, new THREE.Vector3(0, 0, -.75 + parentBox.max.z));

            obj.add(toit);
            break;
        case "plancher":
            let plancher = yield call(loadModel, itemName, apparealValue);
            yield call(setBoxCenter, plancher);
            
            obj.add(plancher);
            break;
        case "rideau":
            let rideau = yield call(loadModel, itemName, apparealValue);
            bb.setFromObject(rideau);
            rideau.traverse((o) => {if(o.material) o.material.side = THREE.DoubleSide;});
            
            yield call(setBoxCenter, rideau, new THREE.Vector3(parentBox.min.x, 0, ((bb.max.z - bb.min.z)/2) + .1));
            obj.add(rideau);

            rideau = rideau.clone();
            rideau.rotateZ(Math.PI/2);
            yield call(setBoxCenter, rideau, new THREE.Vector3(0, parentBox.min.y, ((bb.max.z - bb.min.z)/2) + .1));
            obj.add(rideau);

            rideau = rideau.clone();
            rideau.rotateZ(Math.PI/2);
            yield call(setBoxCenter, rideau, new THREE.Vector3(parentBox.max.x, 0, ((bb.max.z - bb.min.z)/2) + .1));
            obj.add(rideau);

            rideau = rideau.clone();
            rideau.rotateZ(Math.PI/2);
            yield call(setBoxCenter, rideau, new THREE.Vector3(0, parentBox.max.y, ((bb.max.z - bb.min.z)/2) + .1));
            obj.add(rideau);
            break;
        case "lestage":
            let lestage = yield call(loadModel, itemName, apparealValue);
            bb = new THREE.Box3();
            bb.setFromObject(lestage);

            yield call(setBoxCenter, lestage, new THREE.Vector3(parentBox.min.x - .5, parentBox.min.y - .5, (bb.max.z - bb.min.z)/2));
            obj.add(lestage);

            lestage = lestage.clone();
            yield call(setBoxCenter, lestage, new THREE.Vector3(parentBox.max.x + .5, parentBox.max.y + .5, (bb.max.z - bb.min.z)/2));
            obj.add(lestage);
            
            lestage = lestage.clone();
            yield call(setBoxCenter, lestage, new THREE.Vector3(parentBox.min.x - .5, parentBox.max.y + .5, (bb.max.z - bb.min.z)/2));
            obj.add(lestage);
            
            lestage = lestage.clone();
            yield call(setBoxCenter, lestage, new THREE.Vector3(parentBox.max.x + .5, parentBox.min.y - .5, (bb.max.z - bb.min.z)/2));
            obj.add(lestage);
            break;
        default:
            yield call(setBoxCenter, obj);
    }

    obj.applyMatrix(new THREE.Matrix4().getInverse(parentObj.matrixWorld));
    parentObj.add(obj);

    return obj.id;
}