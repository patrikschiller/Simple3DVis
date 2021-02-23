/**
 * Helper class
 * @author - Patrik Schiller, 2020
 */
class Helper{
    /**
     * @summary - Updates the loading bar
     * @param {THREE.progress} progress - Loading progress
     * @param {HTMLElement} container - Main rendering container
     * @param {HTMLElement} loading - Loading HTML element
     */
    static loadingProgressHandler(progress, container, loading, fpsCounter = null){
        const loadBar = loading.querySelector('div[progressBar] div.bar');
        const perc = Math.round(progress.loaded / progress.total * 100);
        console.log(`Loaded ${perc}%`);
        loadBar.style.width = `${perc}%`;
        loadBar.offsetWidth;
        /* Loaded */
        if(perc >= 100){
            loadBar.addEventListener('transitionend', ()=>{
                container.style.filter = 'blur(0px)';
                container.style.webkitFilter = 'blur(0px)';
                loading.style.opacity = 0;
                loading.offsetHeight;
                loading.ontransitionend = function(){
                    loading.ontransitionend = null;
                    loading.classList.add('hidden');
                    loading.querySelector('div[progressBar]').innerHTML = "";
                    (fpsCounter) ? fpsCounter.classList.remove('hidden') : null;
                }
            });
        }
    }

    /**
     * @summary - Initializes new loading bar and loading sequence
     * @param {HTMLElement} loading - Loading HTML element
     * @returns {Promise} - Returns promise waiting for transition end
     */
    static initLoading(loading){
        let promise = new Promise((resolve)=>{
            const bar = document.createElement('div');
            bar.classList.add('bar');
            loading.querySelector('div[progressBar]').appendChild(bar);
            loading.classList.remove('hidden');
            loading.style.opacity = 100;
            loading.offsetHeight;
            //loading.ontransitionend = function(){
            //setTimeout(()=>{
               // loading.ontransitionend = null;
            resolve();
            //}, 1000);
           //}
        });
        return promise;
    }
}