/**
 * @summary - Main JS module (handles events, renders content, calls WebGL rendering contexts)
 * @author - Patrik Schiller
 */

/**
 * Appliacation state structure
 */
var AppData = {
    ModelVisualizer : {
        hash : 'visualizer',
        render : false,
        instance : null
    },
    ModelLoader : {
        hash : 'fbxLoader',
        render : false,
        instance : null
    }
}

/**
 * @summary - Changes the rendered content
 */
function menuChangeHandler(){
    let id = window.location.hash.substr(2);
    id = (id != "") ? id : "visualizer";
    document.querySelector("#content-nav ul").childNodes.forEach((el)=>{
        if(el.id == `${id}Opt`){
            el.classList.add('active');
        }else if(el.id && el.id != `${id}Opt`){
            el.classList.remove('active');
        }
    });

    switch(id){
        case 'visualizer':
            if(!AppData.ModelVisualizer.instance){
                initModelVisualizer(id);
            }else{
                render(id, AppData.ModelVisualizer.instance);
            }
            break;
        case 'fbxLoader':
            if(!AppData.ModelLoader.instance){
                initModelLoader(id);
            }else{
                render(id, AppData.ModelLoader.instance);
            }
            break;
        case 'contact':
            render(id);
            AppData.ModelVisualizer.render = false;
            AppData.ModelLoader.render = true;
            break;
        default:
            if(!AppData.ModelVisualizer.instance){
                initModelVisualizer(id);
            }else{
                render('visualizer', AppData.ModelVisualizer.instance);
            }
            break;
    }
}

/**
 * 
 * @param {String} id - page identificator based on URL hash # value
 * @param {ModelLoader / ModelVisualizer} context - rendering context class 
 */
function render(id = 'visualizer', context = null){
    const articles = document.querySelectorAll('.main article');
    articles.forEach((child)=>{
        const container = child.querySelector('.render .canvasContainer');
        if(child.id == id){
            child.classList.remove('hidden');          
            if(container){
                container.classList.remove('hidden');
                container.offsetHeight;
            }
            child.offsetHeight;
        }else{
            child.classList.add('hidden');
            if(container){container.classList.add('hidden');}
        }
    });

    if(context && context instanceof ModelVisualizer){
        if(AppData.ModelVisualizer.instance){
            AppData.ModelVisualizer.instance.State.running = true;
            AppData.ModelVisualizer.instance.resizeCallback();
        }
        if(AppData.ModelLoader.instance){
            AppData.ModelLoader.instance.State.running = false;
        }
    }else if(context && context instanceof ModelLoader){
        if(AppData.ModelVisualizer.instance){
            AppData.ModelVisualizer.instance.State.running = false;
        }
        if(AppData.ModelLoader.instance){
            AppData.ModelLoader.instance.State.running = true;
            AppData.ModelLoader.instance.resizeCallback();
        }
    }
}

/**
 * @summary - Handles popstate event after navigation
 * @param {PopstateEvent} e 
 */
function urlStateHandler(e){
    e.preventDefault();
    const hashId = window.location.hash.substr(2);
    console.log(hashId);
    menuChangeHandler(hashId);
}

/**
 * @summary - Initializes Drag&Drop API listeners
 */
function initDragNDrop(){
    document.querySelectorAll('div.articleData fieldset').forEach((el)=>{
        
        el.addEventListener('dragleave', function(e){
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('focus');
            //console.log("Drag leave");
        }.bind(el), false);

        el.addEventListener('dragover', function(e){
            e.preventDefault();
            //console.log("Drag over");
            this.classList.add('focus');
        });

        el.addEventListener('drop', processFileDrop, false);
    });
}

/**
 * @summary - Handles file drop event (or file input change event) & loads given data into the THREE scene via ModelLoader class
 * @param {DropEvent} event 
 * @param {FILE Array} data 
 */
function processFileDrop(event, data = null){
    event.preventDefault();
    if(!data){
        data = event.dataTransfer.files;
        this.classList.remove('focus');
    }
    //console.log(data);

    let src = "";
    for(let key = 0; key < data.length; key++){
        let file = data[key];
        console.log(`KEY: ${key} | Name: ${file.name} | Size: ${file.size} | Mime ${file.type}`);
        if(file.type == "image/png"){
            let url = URL.createObjectURL(file);
            AppData.ModelLoader.instance.loadTexture(url);
        }else{
            src = URL.createObjectURL(file);
            if(src != ""){
                AppData.ModelLoader.instance.loadModel({source : src});
            }else{
                break;
            }
        }
    }
}

/**
 * @summary - Initializes rendering container, initializes rendering class ModelVisualizer, renders page content
 * @param {String} id - page identificator based on URL hash # value 
 */
function initModelVisualizer(id){
    const canvasContainer = document.querySelector('#visualizer .canvasContainer');
    document.getElementById('visualizer').classList.remove('hidden');
    canvasContainer.classList.remove('hidden');
    canvasContainer.innerHTML = "";
    if(window.devicePixelRatio <= 1.0 || true){
        canvasContainer.style.height = `${canvasContainer.clientWidth * (9/16)}px`;
    }else{

    }
    AppData.ModelVisualizer.instance = new ModelVisualizer(canvasContainer);
    window.addEventListener('resize', AppData.ModelVisualizer.instance.resizeCallback.bind(AppData.ModelVisualizer.instance));

    render(id, AppData.ModelVisualizer.instance);
}

/**
 * @summary - Initializes rendering container, initializes rendering class ModelLoader, renders page content
 * @param {String} id - page identificator based on URL hash # value 
 */
function initModelLoader(id){
    const canvasContainer = document.querySelector('#fbxLoader .canvasContainer');
    document.getElementById('fbxLoader').classList.remove('hidden');
    canvasContainer.classList.remove('hidden');
    canvasContainer.innerHTML = "";
    if(window.devicePixelRatio <= 1.0 || true){
        canvasContainer.style.height = `${canvasContainer.clientWidth * (9/16)}px`;
    }else{

    }
    AppData.ModelLoader.instance = new ModelLoader(canvasContainer);
    window.addEventListener('resize', AppData.ModelLoader.instance.resizeCallback.bind(AppData.ModelLoader.instance));

    document.querySelector("input[name='objectSrc']").addEventListener(
        'change',
        (e)=>{
            processFileDrop(e, document.querySelector("input[name='objectSrc']").files);
        }
    );
    document.querySelector("input[name='texturesSrc']").addEventListener(
        'change',
        (e)=>{
            processFileDrop(e, document.querySelector("input[name='texturesSrc']").files);
        }
    );

    render(id, AppData.ModelLoader.instance);
}

/**
 * @summary - Handles fullscreen API connected to rendering contexts in ModelLoader and ModelVisualizer classes
 */
function fullScreenCallback(){
    const hashId = window.location.hash.substr(2);
    switch(hashId){
        case 'visualizer':
            AppData.ModelVisualizer.instance.initFullscreen();
            break;
        case 'fbxLoader':
            AppData.ModelLoader.instance.initFullscreen();
            break;
        case 'contact':
            break;
        default:
            AppData.ModelVisualizer.instance.initFullscreen();
            break;
    }
}

/* Event listeners */
window.addEventListener('popstate', urlStateHandler, true);
window.addEventListener('load', ()=>{menuChangeHandler()});
document.addEventListener('keydown', (e)=>{if(e.key == 'f'){fullScreenCallback()}});
initDragNDrop();