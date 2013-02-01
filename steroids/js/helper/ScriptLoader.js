/**
 * @module ScriptLoader
 */
var ScriptLoader = (function(window){

    'use strict';

    /**
     * @class Script
     * @constructor
     * @param {string} url - URL location of script
     */
    var Script = function(url) {
        this.url = url;
    };

    Script.prototype = {

        /**
         * Public load method
         * @method load
         */
        load:function() {
            if (document.readyState == 'complete') {
                this._load();
            }
            else {
                window.addEventListener('load',this);
            }
        },

        /**
         * private method to handle events
         * @method handleEvent
         * @param {Event} e - Event to handle
         */
        handleEvent:function(e) {

            switch(e.type) {
                case 'load':{
                    this._load();
                }
                    break;
                default: {}
                    break;
            }
        },

        /**
         * Private load method
         * @method _load
         */
        _load:function() {

            var self = this,
                done = false,
                head = document.getElementsByTagName('head')[0],
                script = document.createElement('script');

            script.async = true;
            script.src = this.url;
            script.onload = script.onreadystatechange = function() {

                if (!done && (!this.readyState ||
                    this.readyState == 'loaded' ||
                    this.readyState == 'complete')) {

                    done = true;
                    self._ready(script);

                    // handle memory leak in IE
                    script.onload = script.onreadystatechange = null;
                    if (head && script.parentNode) {
                        head.removeChild(s);
                    }
                }
            };

            head.insertBefore(script,head.firstChild);
        },

        /**
         * Private ready method
         * @method _ready
         */
        _ready:function() {
            Observer.publish(this,'load');
        }
    };



    // ScriptLoader
    return {

        _scripts:[],

        load:function(url,callback) {

            if (!url || !callback) {
                throw new Error('ScriptLoader.load(url,callback): "url" and "callback" are required parameters.');
            }

            var i=this._scripts.length-1, script;

            // check if script already loading, if so, bind to this scripts load event
            for (;i>=0;i--) {
                if (this._scripts[i].url == url) {
                    Observer.subscribe(this._scripts[i],'load',callback);
                    return this._scripts[i];
                }
            }

            // if not already loading start loading
            script = new Script(url);
            Observer.subscribe(script,'load',callback);
            this._scripts.push(script);
            script.load();
            return script;

        }
    };

})(window);