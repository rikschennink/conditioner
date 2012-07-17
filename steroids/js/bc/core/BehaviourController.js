
/**
 * BehaviourController singleton.
 *
 * @class BehaviourController
 */
(function() {

    /**
     * Private static variables
     */
    var _singleton;


    /**
     * Constructs BehaviourController singleton objects.
     *
     * @class BehaviourController
     * @constructor
     */
    var BehaviourController = function(options) {

        // do singleton check
        if (!_singleton) {_singleton = this;}
        else {return _singleton;}

        // create the options controller
        if (options) {
            new bc.core.OptionsController(options);
        }

        // start adding behaviour
        document.addEventListener('DOMContentLoaded',function() {
            _singleton.applyBehaviour(document);
        });
    };


    /**
     * Applies behaviour on object within given context.
     *
     * @method applyBehaviour
     * @param {Node} context The DOM piece to apply behaviours to
     */
    BehaviourController.prototype.applyBehaviour = function(context) {

        // if no context supplied use document
        if (!context) {
            console.warn('mira.core.BehaviourController.applyBehaviour(context): Requires a context');
        }

        // register vars and get elements
        var i,l,loaders,elements = context.querySelectorAll('[data-behaviour]:not([data-processed])',context);

        // init loaders array
        loaders = new Array();

        // if no elements do nothing
        if (!elements) {
            return;
        }

        l = elements.length;
        for (i=0; i<l; i++) {

            // has been processed
            elements[i].setAttribute('data-processed','true');

            // wrap in loader
            loaders.push(new bc.core.BehaviourLoader(elements[i]));
        }

        // returns copy of loaders so it is possible to later unload them if necessary
        return loaders.concat();
    };

    // Register class
    Namespace.register('bc.core').BehaviourController = BehaviourController;

}());
