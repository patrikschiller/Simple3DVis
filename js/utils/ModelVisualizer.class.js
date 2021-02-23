/**
 * @summary - FBX model interactive visualization (movement, reflector)
 * @autor - Patrik Schiller, 2020
 * @todo - WORK IN PROGRESS - code is mess, will be done like ModelLoader.class
 */
class ModelVisualizer {

    constructor(_canvasContainer){
        this.scene;
        this.camera;
        this.renderer;
        this.model;
        this.controls;
        this.State;
        this.canvas;

        this.canvasContainer = _canvasContainer;

        this.Props = {
            lockSupported : false,
            fpsCounter : null
        };

        this.State = {
            focused : false,
            running : false,
            lastTime : 0
        };

        this.PL = null;
        this.spotlight = null;
        this.lookDir = null;

        this.mouseLockInit();
        this.init();
    }

    /**
     * @summary - Initializes the ModelLoader context
     */
    init(){
        this.scene = new THREE.Scene();
        const [near, far] = [0.01, 100];
        this.camera = new THREE.PerspectiveCamera(60, this.canvasContainer.clientWidth / this.canvasContainer.clientHeight, near, far);
        this.camera.position.set(10.86, 1.275, 0.014);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        this.canvas = this.renderer.domElement
        this.canvasContainer.appendChild(this.canvas);

        //this.controls = new THREE.OrbitControls(this.camera);
        //this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.controls = new THREE.FirstPersonControls(this.camera, this.canvasContainer);
        this.controls.activeLook = false;
        this.controls.freeze = true;
        this.controls.lon = 140;

        //this.controls.enabled = true;
        AppData.ModelVisualizer.render = true;

        this.Props.fpsCounter = document.querySelector('#visualizer .render .fpsCounter');

        this.setListeners();
        this.initGeometry();
    }

    /**
     * @summary - Initializes scene geometry (model, lights..)
     */
    initGeometry(){
        const light = new THREE.DirectionalLight(new THREE.Color('rgb(95,95,97)'));
        light.position.set(0,20,-10);
        const ambient = new THREE.AmbientLight(new THREE.Color('rgb(47,47,50)'));

        this.PL = new THREE.PointLight(new THREE.Color('rgb(230,200,150)'), 1, 1);
        this.PL.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);

        this.spotlight = new THREE.SpotLight(new THREE.Color('rgb(230,200,180)'));
        this.spotlight.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        this.spotlight.distance = 8;
        this.spotlight.penumbra = 0.4;
        this.spotlight.angle = 15 * Math.PI / 180;
        this.lookDir = new THREE.Vector3();
        let spotlightDir = this.camera.getWorldDirection(this.lookDir);

        this.scene.add(light);
        this.scene.add(ambient);
        //this.scene.add(this.PL);
        this.scene.add(this.spotlight);
        this.scene.add(this.spotlight.target);
        //this.spotlight.target = spotlightDir;

        this.camera.position.z = 0;

        /* FBX model loader init */
        const loader = new THREE.FBXLoader();
        const src = 'hrad/hrad_v1.fbx';

        /* Load FBX model */
        const loading = document.querySelector('#visualizer div.loading');
        loading.classList.remove('hidden');
        Helper.initLoading(loading).then(()=>{
            loader.load(
                src,                                        // Source
                (model) => {this.modelLoadHandler(model)},  // Result hander      
                (progress)=>{Helper.loadingProgressHandler(progress, this.canvasContainer, loading, this.Props.fpsCounter)}, // Loading progress handler
                (er) => {console.error(er)}                 // Error handler
            );
        });
    }

    /**
     * @summary - Callback that processes loaded model and includes it to the THREE scene
     * @param {THREE.model} model 
     */
    modelLoadHandler(model){
        /* Load model into scene */
        this.model = model;
        model.position.set(5, -3, 1.8);
        this.scene.add(this.model);
        //this.controls.target = this.model.position.clone();

        /* Initial update */
        this.controls.update();
        this.controls.updateMouse(0);

        /* SkyBox init */
        const textureLoader = new THREE.CubeTextureLoader();
        const path = 'js/assets/images/';
        const path2 = 'js/assets/images/Skybox_Space/';
        textureLoader.setPath(path2);
       /* var cubemap = textureLoader.load([
            'px.jpg', 'nx.jpg',
            'py.jpg', 'ny.jpg',
            'pz.jpg', 'nz.jpg'
        ]);*/
        var cubemap2 = textureLoader.load([
            'px.png', 'nx.png',
            'py.png', 'ny.png',
            'pz.png', 'nz.png'
        ]);
        this.scene.background = cubemap2;

        /* Shadows */
        this.model.traverse((child)=>{
            if(child.isMesh){
                //child.castShadow = child.recieveShadow = true;
            }
        });

        this.drawScene();
    }

    /**
     * @summary - One render loop iteration - scene processing and frame rendering
     * @param {Float} elapsedTime 
     */
    drawScene(elapsedTime){
        /*console.log(render);*/
        if(AppData.ModelVisualizer.render){
            const timeDelta = elapsedTime - this.State.lastTime;
            this.State.lastTime = elapsedTime;
            this.Props.fpsCounter.children[0].innerText = Math.round(1000 / timeDelta);
            this.Props.fpsCounter.children[1].innerText = Math.round(timeDelta);

            this.PL.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
            this.spotlight.position.set(this.camera.position.x, this.camera.position.y - 0.1, this.camera.position.z);
            let spotlightDir = this.camera.getWorldDirection(this.lookDir);
            this.spotlight.target.position.set(
                this.camera.position.x + spotlightDir.x,
                this.camera.position.y + spotlightDir.y,
                this.camera.position.z + spotlightDir.z
            );
            this.spotlight.target.updateMatrixWorld();

            this.controls.update(0.04);
            this.renderer.render(this.scene, this.camera);
        }

        window.requestAnimationFrame(this.drawScene.bind(this));
    }

    /**
     * @summary - Handles window resizing (resizes the rendering context - canvas and its container)
     */
    resizeCallback(){
        this.canvasContainer.style.height = `${this.canvasContainer.clientWidth * (9/16)}px`;
        this.renderer.setSize( this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);
    }

    /**
     * @summary - Handles keyboard press events
     * @param {Event} e 
     */
    keyboardCallback(e){
        if(e.key == 'p'){
            console.log(this.camera.position);
        }
    }

    /**
     * @summary - Callback that handles mouse click into the canvas (scene..)
     */
    mouseClickCallback(){
        if(!this.State.focused){
            this.State.focused = true;
            this.renderer.domElement.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
            this.renderer.domElement.requestPointerLock();
        }else{
            // Click in the scene process
        }
    }

    /**
     * @summary - Lock state callback - handles switching between pointer lock states (locked / unlocked)
     * @param {MouseLock Event} event 
     */
    lockChangeCallback(event){
        if (document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas || document.webkitPointerLockElement === this.canvas) {
            this.State.focused = true;
            this.controls.freeze = false;
            this.controls.activeLook = true;
        }else{
            this.State.focused = false;
            this.controls.freeze = true;
            this.controls.activeLook = false;
        }
    }

    /**
     * @summary - Toggles fullscreen of the scene
     */
    initFullscreen(){
        const container = document.querySelector('#visualizer .render .canvasContainer');
        if(!document.fullscreenElement){
            container.requestFullscreen();
        }else if(document.fullscreenElement){
            document.exitFullscreen();
        }
    }

    /**
     * @summary - Initializes pointer lock API
     */
    mouseLockInit(){
        if('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document){
            this.Props.lockSupported = true;
            document.addEventListener('pointerlockchange', this.lockChangeCallback.bind(this), false);
            document.addEventListener('mozpointerlockchange', this.lockChangeCallback.bind(this), false);
            document.addEventListener('webkitpointerlockchange', this.lockChangeCallback.bind(this), false);
        }else{
            alert("Mouse pointer lock is not supported by your Browser (try to upgrade your Browser)");
        }
    }
    
    /**
     * @summary - Sets event listeners
     */
    setListeners(){
        document.addEventListener('keydown', this.keyboardCallback.bind(this));
        this.canvasContainer.addEventListener('click', (e)=>{this.mouseClickCallback();});
    }
}