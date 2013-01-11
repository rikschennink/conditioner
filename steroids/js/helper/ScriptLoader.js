
var ScriptLoader = (function(){

    'use strict';

    var Script = function(url) {
        this.url = url;
    };

    Script.prototype = {

        load:function() {
            if (document.readyState === 'complete') {
                this._load();
            }
            else {
                window.addEventListener('load',this);
            }
        },

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

        _load:function() {

            var self = this,
            done = false,
            h = document.getElementsByTagName('head')[0],
            s = document.createElement('script');

            s.async = true;
            s.src = this.url;
            s.onload = s.onreadystatechange = function() {

                if (!done && (!this.readyState ||
                    this.readyState === 'loaded' ||
                    this.readyState === 'complete')) {

                    done = true;
                    self._ready(s);

                    // handle memory leak in IE
                    s.onload = s.onreadystatechange = null;
                    if (h && s.parentNode) {
                        h.removeChild(s);
                    }
                }
            };

            h.insertBefore(s,h.firstChild);
        },

        _ready:function() {
            Observer.fire(this,'load');
        }

    };




    // callback uid
    var _callbackIndex = 0;

    // ScriptLoader
    return {

        _scripts:[],

        loadJSONP:function(url,callback) {

            var uniqueCallback,seperator,s;

            uniqueCallback = 'JSONPCallback_' + _callbackIndex++;
            window[uniqueCallback] = callback;

            seperator = url.indexOf('?')===-1 ? '?' : '&';
            url += seperator + 'callback=' + uniqueCallback;

            s = new Script(url);
            s.load();
            return s;
        },

        load:function(url,callback) {

            var i,s;

            // check if script already loading
            for (i=this._scripts.length-1;i>=0;i--) {
                if (url === this._scripts[i].url) {
                    Observer.subscribe(this._scripts[i],'load',callback);
                    return this._scripts[i];
                }
            }

            // if not already loading start loading
            s = new Script(url);
            Observer.subscribe(s,'load',callback);
            this._scripts.push(s);
            s.load();
            return s;

        }
    };

})();