(function(conditioner){

    var _mqlReferences = [];

    // add mediaquery condition
    conditioner.registerTest(
        'media',
        function(handler,conditions) {

            // IE 9 and lower don't support matchmedia
            if (!window.matchMedia) {
                return;
            }

            // get list
            var mql = window.matchMedia(conditions.value);
            mql.addListener(handler);
            handler(mql);

            // A Firefox quirk requires us to retain a reference to the mql, so store in array (otherwise addListener acts weird).
            // http://www.nczonline.net/blog/2012/01/19/css-media-queries-in-javascript-part-2/
            _mqlReferences.push(mql);
        },
        function(matchMedia) {
            return matchMedia.matches;
        }
    );

    // add element conditions
    conditioner.registerTest(
        'element',
        function(handler,conditions,element) {
            window.addEventListener('resize',function(){handler(element);},false);
            handler(element);
        },
        {
            'minWidth':function(element,expected) {return element.offsetWidth >= expected;},
            'maxWidth':function(element,expected) {return element.offsetWidth <= expected;}
        }
    );

    // add window conditions
    conditioner.registerTest(
        'window',
        function(handler) {
            window.addEventListener('resize',function(){handler();},false);
            handler();
        },
        {
            'minWidth':function(expected){return window.innerWidth >= expected;},
            'maxWidth':function(expected){return window.innerWidth <= expected;}
        }
    );

    // add geolocation conditions
    conditioner.registerTest(
        'geolocation',
        null,
        function(expected){return Boolean(navigator.geolocation)===expected;}
    );

    // todo: fix geolocation test

}(Conditioner.getInstance()));