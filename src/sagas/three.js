import * as THREE from 'three';
import { all, call, fork, put, select, takeEvery } from 'redux-saga/effects';
import OrbitControls from 'three-orbitcontrols';
import { addAppareal, addObject, reloadObjects } from './addObject';
import { addApparealSpan, addSpan, deleteSpan } from './handleSpan';
import {
    actionCreator,
    ADD_OBJECT_DISPLAYED,
    ADD_SPAN,
    ADDED_OBJECT_DISPLAYED,
    APPAREL_CHANGED,
    DBCLICKED_CANVAS,
    DELETE_OBJECT_DISPLAYED,
    DELETE_SPAN,
    HIDE_DETAILS_PANEL,
    MOUSE_CLICK,
    MOUSE_MOVE,
    MOUSE_UP,
    OBJECT_DISPLAYED_LOADED,
    RENDERER_CREATED,
    SEND_ESTIMATION,
    SET_RENDERER_SIZE,
    SETTING_CHANGED,
    SHOW_DETAILS_PANEL_FROM_SCENE,
    TOGGLE_CLICK_FROM_OBJECT,
    TOGGLE_RECAP_PANEL_MAIN
} from '../actions';
import moveObject from './moveObject';
import initShowObjectBox from './showObjectBox';
import { getSpansState, objectsDisplayed } from "../selectors";

const cameraFrustum = 70;

export function* initThreeSaga() {
    const camera = new THREE.PerspectiveCamera(cameraFrustum, window.innerWidth / window.innerHeight, 0.01, 10000);
    camera.position.set(0, -15, 15);
    camera.up = new THREE.Vector3(0, 0, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    window.THREE = THREE;//debug
    window.scene = scene;//debug

    const grassGeometry = new THREE.BoxGeometry(50, 50, 0);
    const grassMaterial = new THREE.MeshBasicMaterial({color: 0x008000});
    const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
    grassMesh.position.z = -0.51;
    grassMesh.userData.unclickable = true;
    scene.add(grassMesh);

    const axes = new THREE.AxesHelper(2);
    scene.add(axes);

    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.rotateX(Math.PI / 2);
    scene.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.castShadow = true;
    directionalLight.position.set(4, -10, 10);
    scene.add(directionalLight);

    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth * 0.65, window.innerHeight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2.1;

    yield put(actionCreator(RENDERER_CREATED, renderer));
    yield fork(drawFrame, scene, camera, renderer);
    yield takeEvery(ADD_OBJECT_DISPLAYED, addObject, scene);
    yield takeEvery(SET_RENDERER_SIZE, setRendererSize);
    yield takeEvery(SETTING_CHANGED, compareSetting, scene);
    yield takeEvery(APPAREL_CHANGED, compareApparel, scene);
    yield takeEvery(MOUSE_CLICK, mouseClick, scene, camera, renderer);
    yield takeEvery(DBCLICKED_CANVAS, doubleClickSelection, camera, scene);
    yield takeEvery(MOUSE_MOVE, moveObject, scene, camera, renderer, controls);
    yield takeEvery(MOUSE_UP, reactivateControls, controls);
    yield takeEvery(DELETE_OBJECT_DISPLAYED, deleteObjectFromScene, scene);
    yield takeEvery(ADDED_OBJECT_DISPLAYED, objectLoaded);
    yield takeEvery(SEND_ESTIMATION, sendEstimation);
    yield takeEvery(ADD_SPAN, addSpan, scene);
    yield takeEvery(DELETE_SPAN, deleteSpan, scene);
    yield call(reloadObjects, scene);
    yield fork(initShowObjectBox, scene);
}

export function* reactivateControls(controls) {
    controls.enableRotate = true;
}

export function* deleteObjectFromScene(scene, action) {
    const objectToDelete = scene.getObjectByName(action.payload.uid);

    if (objectToDelete) {
        objectToDelete.parent.remove(objectToDelete);
    }

    yield put(actionCreator(HIDE_DETAILS_PANEL));
}

export function* objectLoaded() {
    yield put(actionCreator(OBJECT_DISPLAYED_LOADED));
}


export function* drawFrame(scene, camera, renderer) {
    while (1) {
        yield new Promise((resolve) => requestAnimationFrame(resolve));
        renderer.render(scene, camera);
    }
}

export function* setRendererSize(action) {
    action.payload.renderer.setSize(action.payload.width, action.payload.height);
}

export function* mouseClick(scene, camera, renderer, action) {
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    mouse.x = (action.payload.event.layerX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(action.payload.event.layerY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true).filter(obj => obj.object instanceof THREE.Mesh && !obj.object.userData.unclickable);

    // Pour empecher le clic si un objet qui vient d'être ajouté n'a pas été validé
    const objDisplay = yield select(objectsDisplayed);

    if (intersects.length > 0 && isAllItemsValidated(objDisplay)) {
        //Object before scene
        let objectToFind;
        intersects[0].object.traverseAncestors(obj => {
            if (obj.parent && obj.parent.type === 'Scene') objectToFind = obj;
        });

        yield put(actionCreator(SHOW_DETAILS_PANEL_FROM_SCENE, {
            uid: objectToFind.name,
            objectsDisplayed: action.payload.objectsDisplayed
        }));
    } else {
        if (isAllItemsValidated(objDisplay))
            yield put(actionCreator(HIDE_DETAILS_PANEL));

        yield put(actionCreator(TOGGLE_CLICK_FROM_OBJECT));
    }
}

function isAllItemsValidated(objDisplay) {
    let isOneNotValidated = false;
    objDisplay.forEach(obj => {
        if (obj.isValidated === false)
            isOneNotValidated = true;
    });

    return !isOneNotValidated;
}

export function* compareSetting(scene, action) {
    if (action.payload != null) {

    }
}

export function* compareApparel(scene, action) {
    if (action.payload != null) {
        const {apparel, itemName, uid, settings} = action.payload;
        const object = scene.getObjectByName(uid);

        let apparelToDelete = scene.getObjectByName(uid).getObjectByName(apparel.type);
        while (apparelToDelete != null) {
            apparelToDelete.parent.remove(apparelToDelete);
            apparelToDelete = scene.getObjectByName(uid).getObjectByName(apparel.type);
        }

        // Pour récupérer la dernière travées et mettre un rideau largeur au bout
        const spanState = yield select(getSpansState);
        const lastSpansItem = spanState.filter(span => span.uid === uid);
        let lastSpan = null;

        if (lastSpansItem.length !== 0) {
            const lastSpanTab = lastSpansItem[0].lastSpansAdded;
            lastSpan = lastSpanTab[lastSpanTab.length - 1];
        }

        const calls = {};

        object.children.forEach(c => {
            if (c.type === "Object3D" && apparel.type !== "Rideau Largeur")
                calls[c.name] = call(addAppareal, scene, itemName, c, apparel.type, apparel.value, settings);
        });

        // Pour gestion des rideau largeur pour ne pas en mettre à l'intérieur des travées
        if (apparel.type === "Rideau Largeur") {

            //TODO [Rideau start] peut être pas opti, a voir pour changer ça
            let rideauStartToDelete = scene.getObjectByName(uid).getObjectByName("Rideau Largeur Start");
            rideauStartToDelete.parent.remove(rideauStartToDelete);

            if (lastSpan !== null) {
                calls["Rideau Largeur"] = call(addApparealSpan, scene, itemName, object.getObjectByName(lastSpan), apparel.type, apparel.value, settings);
            } else {
                calls["Rideau Largeur"] = call(addApparealSpan, scene, itemName, object, apparel.type, apparel.value, settings);
            }
            calls["Rideau Largeur Start"] = call(addApparealSpan, scene, itemName, object, "Rideau Largeur Start", apparel.value, settings);
        } else {
            calls[object.name] = call(addAppareal, scene, itemName, object, apparel.type, apparel.value, settings);
        }
        yield all(calls);
    }
}

export function* doubleClickSelection(camera, scene, renderer, action) {
    /*console.log("welcome to saga doubleClickSelection");

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    mouse.x = (action.payload.event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(action.payload.event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    console.log("touched me");
    console.log(scene.children);
    console.log(intersects);*/
    // intersects[ 0 ].object.material.color.set( 0xff0000 );

}

export function* sendEstimation(action) {
    //body
    let detailContent = "";
    action.payload.objects.forEach(obj => {
        detailContent += obj.name + "\t (qte : " + obj.qte + ")\n" +
            obj.apparels.map(ap => {
                return "\t" + ap.value.name || ap.value + "\n";
            }) + "\n\n";
    });

    const clientName = action.payload.firstname + " " + action.payload.lastname;
    const clientEmail = action.payload.email

    const content = "Demande d'estimation : " + clientName + "\n\n"
        + detailContent + "\n\n"
        + "Commentaire client : " + action.payload.commentary;

    fetch('admin/sendMail.php', {
        method: 'POST',
        body: JSON.stringify({content, clientName, clientEmail}),
        headers: {'Content-Type': 'application/json'}
    })
        .then(r => r.json(), () => alert("Une erreur s'est produite :/"))
        .then(r => {
            if (r === true) {
                alert("Demande d'estimation envoyée !");
            }
            else alert("Une erreur s'est produite, verifiez votre addresse mail.");
        });

    yield put(actionCreator(TOGGLE_RECAP_PANEL_MAIN));
}