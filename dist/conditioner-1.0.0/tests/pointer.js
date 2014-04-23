/**
 * Tests if the user is using a pointer device
 * @module tests/pointer
 */
(function (doc, undefined) {

    'use strict';

    var _moves = 0;
    var _movesRequired = 2;

    var test = {

        /**
         * Setup events, detach events if no activity for 30 seconds
         * @param {Function} measure
         */
        setup: function (measure) {

            // start listening to mousemoves to deduce the availability of a pointer device
            doc.addEventListener('mousemove', measure, false);
            doc.addEventListener('mousedown', measure, false);

            // start timer, stop testing after 30 seconds
            setTimeout(function () {
                doc.removeEventListener('mousemove', measure, false);
                doc.removeEventListener('mousedown', measure, false);
            }, 30000);

        },

        /**
         * Custom measure function to count the amount of moves
         * @param {Event} e
         * @returns {Boolean} - Return true if a change has occurred
         */
        measure: function (e) {

            if (e.type === 'mousemove') {

                _moves++;

                if (_moves >= _movesRequired) {

                    // stop listening to events
                    doc.removeEventListener('mousemove', this, false);
                    doc.removeEventListener('mousedown', this, false);

                    return true;
                }
            }
            else {
                _moves = 0;
            }

            return false;
        },

        /**
         * test if matches expectations
         * @param {String} expected
         * @returns {Boolean}
         */
        assert: function (expected) {
            return expected === 'available' && _moves >= _movesRequired;
        }
    };

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = test;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return test;
        });
    }

}(document));