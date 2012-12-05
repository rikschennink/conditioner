
/**
 * BehaviourController singleton.
 * @class BehaviourController
 */
Namespace.register('bc.core').BehaviourController =(function() {

    "use strict";

    /**
     * @class BehaviourController
     * @constructor
     */
    var BehaviourController = {};


    /**
     * Loads options into BehaviourController
     *
     * @class _BehaviourController
     * @method domReady
     * @param {Object} global options for OptionsController
     */
    BehaviourController.applyDefault = function(options) {

        // create the initial options controller
        if (options) {
            bc.core.OptionsController.getInstance().load(options);
        }

        // start adding behaviour
        document.addEventListener('DOMContentLoaded',function() {
            BehaviourController.applyBehaviour(document);
        });
    };


    /**
     * Applies behaviour on object within given context.
     *
     * @class _BehaviourController
     * @method applyBehaviour
     */
    BehaviourController.applyBehaviour = function(context) {

        // if no context supplied use document
        if (!context) {
            console.warn('bc.core.BehaviourController.applyBehaviour(context): Requires a context');
        }

        // register vars and get elements
        var i,l,loaders,elements = context.querySelectorAll('[data-behaviour]:not([data-processed])',context);

        // if no elements do nothing
        if (!elements) {
            return;
        }

        // init loaders array
        loaders = new Array();

        l = elements.length;
        for (i=0; i<l; i++) {

            // has been processed
            elements[i].setAttribute('data-processed','true');

            // wrap in loader
            loaders.push(new bc.core.BehaviourLoader(elements[i]));
        }

        // returns copy of loaders so it is possible to later unload them if necessary
        return loaders;

    };

    // Register class
    return BehaviourController;

}());
