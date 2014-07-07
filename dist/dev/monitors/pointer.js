/**
 * Tests if the user is using a pointer device
 * @module monitors/pointer
 */
(function (win, undefined) {

    'use strict';

    var doc = win.document;
    var docEl = doc.documentElement || doc.body.parentNode || doc.body;

    var scrollX = function () {
        return win.pageXOffset !== undefined ? win.pageXOffset : docEl.scrollLeft;
    };
    var scrollY = function () {
        return win.pageYOffset !== undefined ? win.pageYOffset : docEl.scrollTop;
    };

    var distanceSquared = function (element, event) {

        if (!event) {
            return;
        }

        var dim = element.getBoundingClientRect();
        var evx = event.pageX - scrollX();
        var evy = event.pageY - scrollY();
        var px;
        var py;

        if (evx < dim.left) { // to the left of the element
            px = dim.left;
        }
        else if (evx > dim.right) { // to the right of the element
            px = dim.right;
        }
        else { // aligned with element or in element
            px = evx;
        }

        if (evy < dim.top) { // above element
            py = dim.top;
        }
        else if (evy > dim.bottom) { // below element
            py = dim.bottom;
        }
        else { // aligned with element or in element
            py = evy;
        }

        if (px === evx && py === evy) { // located in element
            return 0;
        }

        return Math.pow(evx - px, 2) + Math.pow(evy - py, 2);
    };

    var pointerEventSupport = win.PointerEvent || win.MSPointerEvent;
    var pointerEventName = win.PointerEvent ? 'pointermove' : 'MSPointerMove';
    var shared = {
        available: false,
        moves: 0,
        movesRequired: 2
    };

    var exports = {
        trigger: function (bubble) {

            // filter events
            var filter = function filter(e) {

                // handle pointer events
                if (pointerEventSupport) {

                    // only available if is mouse or pen
                    shared.available = e.pointerType === 4 || e.pointerType === 3;

                    // if not yet found, stop here, support could be found later
                    if (!shared.available) {
                        return;
                    }

                    // clean up the mess
                    doc.removeEventListener(pointerEventName, filter, false);

                    // handle the change
                    bubble();

                    // no more!
                    return;
                }

                // stop here if no mouse move event
                if (e.type !== 'mousemove') {
                    shared.moves = 0;
                    return;
                }

                // test if the user has fired enough mouse move events
                if (++shared.moves >= shared.movesRequired) {

                    // stop listening to events
                    doc.removeEventListener('mousemove', filter, false);
                    doc.removeEventListener('mousedown', filter, false);

                    // trigger
                    shared.available = true;

                    // handle the change
                    bubble();
                }
            };

            // if pointer events supported use those as they offer more granularity
            if (pointerEventSupport) {
                doc.addEventListener(pointerEventName, filter, false);
            }
            else {
                // start listening to mousemoves to deduce the availability of a pointer device
                doc.addEventListener('mousemove', filter, false);
                doc.addEventListener('mousedown', filter, false);
            }

            // near
            doc.addEventListener('mousemove', function (e) {
                bubble(e);
            }, false);

        },
        test: {
            'near': function (data, event) {
                if (!shared.available) {
                    return false;
                }
                var expected = data.expected === true ? 50 : parseInt(data.expected, 10);
                return expected * expected >= distanceSquared(data.element, event);
            },
            'fine': function (data) {
                return shared.available === data.expected;
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

}(this));