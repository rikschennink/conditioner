/**
 * Tests if the user is using a pointer device
 * @module monitors/pointer
 */
(function (win, doc, undefined) {

    'use strict';

    var _pointerEventSupport = win.PointerEvent || win.MSPointerEvent;
    var _pointerEventName = win.PointerEvent ? 'pointermove' : 'MSPointerMove';
    var _shared = {
        available: false,
        moves: 0,
        movesRequired: 2
    };

    var exports = {
        trigger: function (bubble) {

            // filter events
            var filter = function filter(e) {

                // handle pointer events
                if (_pointerEventSupport) {

                    // only available if is mouse or pen
                    _shared.available = e.pointerType === 4 || e.pointerType === 3;

                    // if not yet found, stop here, support could be found later
                    if (!_shared.available) {
                        return;
                    }

                    // clean up the mess
                    doc.removeEventListener(_pointerEventName, filter, false);

                    // handle the change
                    bubble();

                    // no more!
                    return;
                }

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

            // if pointer events supported use those as they offer more granularity
            if (_pointerEventSupport) {
                doc.addEventListener(_pointerEventName, filter, false);
            }
            else {
                // start listening to mousemoves to deduce the availability of a pointer device
                doc.addEventListener('mousemove', filter, false);
                doc.addEventListener('mousedown', filter, false);
            }

        },
        test: {
            'hovers': function (data) {
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
        define(function () {
            return exports;
        });
    }

}(window, document));