/**
 * Tests if the user is using a pointer device
 * @module monitors/pointer
 */
(function(doc,undefined){

    'use strict';

    var _shared = {
        available:false,
        moves:0,
        movesRequired:2
    };

    var exports = {
        trigger:function(bubble){

            // filter events
            var filter = function filter(e){

                // stop here if no mouse move event
                if (e.type !== 'mousemove') {
                    _shared.moves = 0;
                    return;
                }

                // test if the user has fired enough mouse move events
                if (++_shared.moves >= _shared.movesRequired) {

                    // stop listening to events
                    doc.removeEventListener('mousemove', filter, false);
                    doc.removeEventListener('mousedown', filter, false);

                    // trigger
                    _shared.available = true;

                    // handle the change
                    bubble();
                }
            };

            // start listening to mousemoves to deduce the availability of a pointer device
            doc.addEventListener('mousemove', filter, false);
            doc.addEventListener('mousedown', filter, false);

        },
        test: {
            'available': function (data) {
                return _shared.available === data.expected;
            }
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function(){return exports;});
    }

}(document));