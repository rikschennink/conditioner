
(function(){

    var Script = function(url) {

        this.url = url;

    };

    Script.prototype.load = function() {
        if (document.readyState === 'complete') {
            this._load();
        }
        else {
            window.addEventListener('load',this);
        }
    };

    Script.prototype.handleEvent = function(e) {

        switch(e.type) {
            case 'load':{
                this._load();
            }
                break;
            default: {}
                break;
        }
    };

    Script.prototype._load = function() {

        var self = this;
        var done = false;

        var h = document.getElementsByTagName('head')[0];
        var s = document.createElement('script');
        s.async = true;
        s.src = this.url;
        s.onload = s.onreadystatechange = function()
        {
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
    };

    Script.prototype._ready = function() {
        bc.helper.Observer.fire(this,'load');
    };




    // reference to first instance
    var _instance;

    // callback uid
    var _callbackIndex = 0;

    var ScriptLoader = function() {

        if (!_instance) {_instance = this;}
        else {return _instance;}

        this._scripts = [];
    };

    var p = ScriptLoader.prototype;

    p.loadJSONP = function(url,callback) {
        var uniqueCallback = 'JSONPCallback_' + _callbackIndex++;
        window[uniqueCallback] = callback;
        var seperator = url.indexOf('?')===-1 ? '?' : '&';
        url += seperator + 'callback=' + uniqueCallback;
        var s = new Script(url);
        s.load();
        return s;
    };

    p.load = function(url,callback) {

        // check if script already loading
        for (var i=this._scripts.length-1;i>=0;i--) {
            if (url === this._scripts[i].url) {
                bc.helper.Observer.subscribe(this._scripts[i],'load',callback);
                return this._scripts[i];
            }
        }

        // if not already loading start loading
        var s = new Script(url);
        bc.helper.Observer.subscribe(s,'load',callback);
        this._scripts.push(s);
        s.load();
        return s;

    };

    Namespace.register('bc.helper').ScriptLoader = ScriptLoader;

})();