/**
 * @summary - FBX model loader class
 * @autor - Patrik Schiller, 2020
 */
class ModelLoader{
    /**
     * @param {HTMLElement} _canvasContainer - HTML container used for rendering WebGL
     */
    constructor(_canvasContainer){
        /* Struct with THREE.js geometry objects */
        this.Geometry = {
            Scene : null,
            Camera : null,
            Models : []
        }
        /* Struct with properties used for rendering and interacting with the scene (THREE.js) */
        this.Props = {
            canvas : null,
            canvasContainer : _canvasContainer,
            fpsCounter : null,
            Renderer : null,
            Controls : null,
            lockSupported : false // MouseLock API supported (true/false)

        }
        /* Rendering state */
        this.State = {
            running : false,
            focused : false,
            lastTime : 0
        }

        this.init();
    }

    /**
     * @summary - Initializes the ModelLoader context
     */
    init(){
        /* Init renderer */
        this.Props.Renderer = new THREE.WebGLRenderer();
        this.Props.Renderer.setSize(this.Props.canvasContainer.clientWidth, this.Props.canvasContainer.clientHeight);
        this.Props.Renderer.setPixelRatio(window.devicePixelRatio);
        this.Props.Renderer.shadowMap.enabled = true;

        /* Init scene */
        this.Geometry.Scene = new THREE.Scene();
        this.Geometry.Scene.background = new THREE.Color( 'rgb(140, 180, 195)' );

        /* Init camera */
        const [near, far] = [0.01, 100];
        this.Geometry.Camera = new THREE.PerspectiveCamera(60, this.Props.canvasContainer.clientWidth / this.Props.canvasContainer.clientHeight, near, far);
        this.Geometry.Camera.position.set(10.0, 8.0, 0.0);

        /* Append renderer into page */
        this.Props.canvas = this.Props.Renderer.domElement;
        this.Props.canvasContainer.appendChild(this.Props.canvas);

        /* Init controls */
        this.Props.Controls = new THREE.FirstPersonControls(this.Geometry.Camera, this.Props.canvasContainer);
        //this.Props.Controls = new THREE.OrbitControls(this.Geometry.Camera);
        this.Props.Controls.activeLook = false;
        this.Props.Controls.freeze = true;
        this.Props.Controls.lon = 180;
        this.Props.Controls.lat = -18;   

        /* Add lights */
        const light = new THREE.DirectionalLight(new THREE.Color('rgb(230,230,230)'));
        light.position.set(5.5,20,-10);
        const ambient = new THREE.AmbientLight(new THREE.Color('rgb(46,43,40)'));
        this.Geometry.Scene.add(light);
        this.Geometry.Scene.add(ambient);

        /* Access to fps counter */
        this.Props.fpsCounter = document.querySelector('#fbxLoader .render .fpsCounter');

        this.setEventListeners();
        this.mouseLockInit();

        this.State.running = true;
        /* Static frame pre-render (background init etc...) */
        this.Props.Renderer.render(this.Geometry.Scene, this.Geometry.Camera);

        /* Start of the render loop */
        this.timerCallback();
    }

    /**
     * @summary - Loads given model into scene
     * @param {URI} modelData - link to data location (URI blob...)
     * @param {String} name - model name (for later identification)
     */
    loadModel(modelData, name){
        const loader = new THREE.FBXLoader();
        const loading = document.querySelector('#fbxLoader div.loading');
        Helper.initLoading(loading).then(
            ()=>{
                loader.load(
                    modelData.source,                               // Source
                    (model) => {this.modelLoadHandler(model, name)},// Result hander 
                    (progress)=>{Helper.loadingProgressHandler(
                        progress, 
                        this.Props.canvasContainer, 
                        loading, 
                        this.Props.fpsCounter
                    )},                                             // Loading progress handler
                    (error) => {console.error(error)}               // Error handler
                );
            }
        )
    }

    /**
     * @summary - Ads texture to last loaded fbx model (as new Phong material)
     * @param {URI} src - link to texture location (in FILE array) via URI blob: 
     */
    loadTexture(src){
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(src);
        const material = new THREE.MeshPhongMaterial(
            {map : texture}
        );
        material.transparent = true;
        material.alphaTest = 0.5;
        let model = this.Geometry.Models[this.Geometry.Models.length - 1];
        model.traverse((child)=>{
            if ( child instanceof THREE.Mesh ) {
                child.material = material;
            }
        });
    }

    /**
     * @summary - Callback that processes loaded model and includes it to the THREE scene
     * @param {THREE.model} model 
     * @param {String} name - model name (for later identification)
     */
    modelLoadHandler(model, name = null){
        model.name = (name) ? name : `model${Math.random()*100}`;
        const material = new THREE.MeshPhongMaterial({
            color: 'rgb(66,68,63)',
            flatShading: true,
        });
        model.traverse((child)=>{
            if ( child instanceof THREE.Mesh ) {
                child.material = material;
            }
        });
        this.Geometry.Models.push(model);
        this.Geometry.Scene.add(model);

        /* Initial update */
        this.Props.Controls.update();
        this.Props.Controls.updateMouse(0);
    }

    /**
     * @summary - Clears all objects from the scene
     */
    clearScene(){
        this.Geometry.Scene.children.forEach((child)=>{
            console.log(`Deleting object: ${child.name}`);
            this.Geometry.Scene.remove(child);
        });
    }

    /**
     * @summary - Removes given object from the scene
     * @param {String} name 
     */
    remove(name){
        console.log(`Deleting object: ${name}`);
        const obj = this.Geometry.scene.getObjectByName(name);
        this.Geometry.Scene.remove(obj);
    }

    /**
     * @summary - Renders new frame 
     * @param {Float} tDelta 
     */
    draw(tDelta){
        this.Props.Controls.update(tDelta * 2);
        this.Props.Renderer.render(this.Geometry.Scene, this.Geometry.Camera);
    }

    /**
     * @summary - Toggles fullscreen of the scene
     */
    initFullscreen(){
        const container = document.querySelector('#fbxLoader .render .canvasContainer');
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
     * @summary - Function that handles one render loop iteration
     * @param {Float} timeElapsed 
     */
    timerCallback(timeElapsed){
        if(this.State.running && this.Geometry.Models.length > 0){
            const timeDelta = timeElapsed - this.State.lastTime; // ms
            this.State.lastTime = timeElapsed;

            this.Props.fpsCounter.children[0].innerText = Math.round(1000 / timeDelta);
            this.Props.fpsCounter.children[1].innerText = Math.round(timeDelta);

            this.draw(timeDelta / 1000); // Seconds
        }
        window.requestAnimationFrame(this.timerCallback.bind(this));
    }

    /**
     * @summary - Callback that handles mouse click into the canvas (scene..)
     */
    mouseClickCallback(){
        if(!this.State.focused){
            this.State.focused = true;
            this.Props.Renderer.domElement.requestPointerLock = this.Props.canvas.requestPointerLock || this.Props.canvas.mozRequestPointerLock || this.Props.canvas.webkitRequestPointerLock;
            this.Props.Renderer.domElement.requestPointerLock();
        }else{
            // Click in the scene process
        }
    }

    /**
     * @summary - Lock state callback - handles switching between pointer lock states (locked / unlocked)
     * @param {MouseLock Event} event 
     */
    lockChangeCallback(event){
        if (document.pointerLockElement === this.Props.canvas || document.mozPointerLockElement === this.Props.canvas || document.webkitPointerLockElement === this.Props.canvas) {
            this.State.focused = true;
            this.Props.Controls.freeze = false;
            this.Props.Controls.activeLook = true;
        }else{
            this.State.focused = false;
            this.Props.Controls.freeze = true;
            this.Props.Controls.activeLook = false;
        }
    }

    /**
     * @summary - Handles window resizing (resizes the rendering context - canvas and its container)
     */
    resizeCallback(){
        this.Props.canvasContainer.style.height = `${this.Props.canvasContainer.clientWidth * (9/16)}px`;
        this.Props.Renderer.setSize( this.Props.canvasContainer.clientWidth, this.Props.canvasContainer.clientHeight);
    }

    /**
     * @summary - Sets event listeners
     */
    setEventListeners(){
        this.Props.canvasContainer.addEventListener('click', (e)=>{this.mouseClickCallback();});
    }
}