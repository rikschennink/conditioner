(function(conditioner){



    var _mqlReferences = [];

    // add mediaquery test
    conditioner.registerTest(
        'media',
        function(handler,conditions) {

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



    // add element test
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




    // add window test
    conditioner.registerTest(
        'window',
        function(handler) {
            window.addEventListener('resize',function(){handler();},false);
            handler();
        },
        {
            'minWidth':function(expected){return (window.innerWidth || document.documentElement.clientWidth) >= expected;},
            'maxWidth':function(expected){return (window.innerWidth || document.documentElement.clientWidth) <= expected;}
        }
    );




    // add geolocation test
    conditioner.registerTest(
        'geolocation',
        null,
        function(expected){return Boolean(navigator.geolocation)===expected;}
    );




    // add mouse test
    var _consecutiveMouseMoves = 0;
    var _consecutiveMouseMovesRequired = 2;
    conditioner.registerTest(
        'mouse',
        function(handler) {

            var cleanEvents = function() {
                document.removeEventListener('mousemove',onMouseMoved,false);
                document.removeEventListener('mousedown',onMouseEvent,false);
            };

            var onMouseMoved = function() {
                _consecutiveMouseMoves++;
                if (_consecutiveMouseMoves>=_consecutiveMouseMovesRequired) {
                    cleanEvents();
                }
                handler(_consecutiveMouseMoves);
            };

            var onMouseEvent = function() {
                _consecutiveMouseMoves=0;
            };

            document.addEventListener('mousemove',onMouseMoved,false);
            document.addEventListener('mousedown',onMouseEvent,false);

            handler(_consecutiveMouseMoves);
        },
        function(moves,expected) {
            return (moves >= _consecutiveMouseMovesRequired) === expected;
        }
    );


}(Conditioner.getInstance()));