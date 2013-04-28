
/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.1.5 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.5',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && navigator && document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
    //PS3 indicates loaded and complete, but need to wait for complete
    //specifically. Sequence is 'loading', 'loaded', execution,
    // then 'complete'. The UA check is unfortunate, but not sure how
    //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
            /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
    //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value !== 'string') {
                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    //Allow getting a global that expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite and existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                pkgs: {},
                shim: {},
                config: {}
            },
            registry = {},
        //registry of just enabled modules, to speed
        //cycle breaking code when lots of modules
        //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; ary[i]; i += 1) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                        //End of the line. Keep at least one non-dot
                        //path segment at the front so it can be mapped
                        //correctly to disk. Otherwise, there is likely
                        //no path mapping for a path starting with '..'.
                        //This can still fail, but catches the most reasonable
                        //uses of ..
                        break;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgName, pkgConfig, mapValue, nameParts, i, j, nameSegment,
                foundMap, foundI, foundStarMap, starI,
                baseParts = baseName && baseName.split('/'),
                normalizedBaseParts = baseParts,
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name && name.charAt(0) === '.') {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    if (getOwn(config.pkgs, baseName)) {
                        //If the baseName is a package name, then just treat it as one
                        //name to concat the name with.
                        normalizedBaseParts = baseParts = [baseName];
                    } else {
                        //Convert baseName to array, and lop off the last part,
                        //so that . matches that 'directory' and not name of the baseName's
                        //module. For instance, baseName of 'one/two/three', maps to
                        //'one/two/three.js', but we want the directory, 'one/two' for
                        //this normalization.
                        normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    }

                    name = normalizedBaseParts.concat(name.split('/'));
                    trimDots(name);

                    //Some use of packages may use a . path to reference the
                    //'main' module name, so normalize for that.
                    pkgConfig = getOwn(config.pkgs, (pkgName = name[0]));
                    name = name.join('/');
                    if (pkgConfig && name === pkgName + '/' + pkgConfig.main) {
                        name = pkgName;
                    }
                } else if (name.indexOf('./') === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                }
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break;
                                }
                            }
                        }
                    }

                    if (foundMap) {
                        break;
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            return name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                        scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                removeScript(id);
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);
                context.require([id]);
                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        normalizedName = normalize(name, parentName, applyMap);
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                '_unnormalized' + (unnormalizedCounter += 1) :
                '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                    prefix + '!' + normalizedName :
                    normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                getModule(depMap).on(name, fn);
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue,
                    [defQueue.length - 1, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return mod.exports;
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            return (config.config && getOwn(config.config, mod.map.id)) || {};
                        },
                        exports: defined[mod.map.id]
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var map, modId, err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
            //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                map = mod.map;
                modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
             this.depMaps = [],
             this.enabled, this.fetched
             */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                            return map.prefix ? this.callPlugin() : this.load();
                        }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error.
                            if (this.events.error) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            if (this.map.isDefine) {
                                //If setting exports via 'module' is in play,
                                //favor that over return value and exports. After that,
                                //favor a non-undefined return value over exports use.
                                cjsModule = this.module;
                                if (cjsModule &&
                                    cjsModule.exports !== undefined &&
                                    //Make sure it is not already the exports value
                                    cjsModule.exports !== this.exports) {
                                    exports = cjsModule.exports;
                                } else if (exports === undefined && this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = [this.map.id];
                                err.requireType = 'define';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                            this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                'fromText eval for ' + id +
                                    ' failed: ' + e,
                                e,
                                [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                            (this.map.isDefine ? this.map : this.map.parentMap),
                            false,
                            !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', this.errback);
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths and packages since they require special processing,
                //they are additive.
                var pkgs = config.pkgs,
                    shim = config.shim,
                    objs = {
                        paths: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (prop === 'map') {
                            if (!config.map) {
                                config.map = {};
                            }
                            mixin(config[prop], value, true, true);
                        } else {
                            mixin(config[prop], value, true);
                        }
                    } else {
                        config[prop] = value;
                    }
                });

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location;

                        pkgObj = typeof pkgObj === 'string' ? { name: pkgObj } : pkgObj;
                        location = pkgObj.location;

                        //Create a brand new object on pkgs, since currentPackages can
                        //be passed in again, and config.pkgs is the internal transformed
                        //state for all package configs.
                        pkgs[pkgObj.name] = {
                            name: pkgObj.name,
                            location: location || pkgObj.name,
                            //Remove leading dot in main, so main paths are normalized,
                            //and remove any trailing .js, since different package
                            //envs have different conventions: some use a module name,
                            //some use a file name.
                            main: (pkgObj.main || 'main')
                                .replace(currDirRegExp, '')
                                .replace(jsSuffixRegExp, '')
                        };
                    });

                    //Done with modifications, assing packages back to context config
                    config.pkgs = pkgs;
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                id +
                                '" has not been loaded yet for context: ' +
                                contextName +
                                (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                            relMap && relMap.id, true), ext,  true);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overriden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                'No define call for ' + moduleName,
                                null,
                                [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext, skipExt) {
                var paths, pkgs, pkg, pkgPath, syms, i, parentModule, url,
                    parentPath;

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;
                    pkgs = config.pkgs;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');
                        pkg = getOwn(pkgs, parentModule);
                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        } else if (pkg) {
                            //If module name is just the package name, then looking
                            //for the main module.
                            if (moduleName === pkg.name) {
                                pkgPath = pkg.location + '/' + pkg.main;
                            } else {
                                pkgPath = pkg.location;
                            }
                            syms.splice(0, i, pkgPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                    ((url.indexOf('?') === -1 ? '?' : '&') +
                        config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callack function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                    (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error', evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = function (err) {
        throw err;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
            node.type = config.scriptType || 'text/javascript';
            node.charset = 'utf-8';
            node.async = true;

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                //Check if node.attachEvent is artificially added by custom script or
                //natively supported by browser
                //read https://github.com/jrburke/requirejs/issues/187
                //if we can NOT find [native code] then it must NOT natively supported.
                //in IE8, node.attachEvent does not have toString()
                //Note the test for "[native code" with no closing brace, see:
                //https://github.com/jrburke/requirejs/issues/273
                !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation that a build has been done so that
                //only one script needs to be loaded anyway. This may need to be
                //reevaluated if other use cases become common.
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                    'importScripts failed for ' +
                        moduleName + ' at ' + url,
                    e,
                    [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Set final baseUrl if there is not already an explicit one.
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = dataMain.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                    dataMain = mainScript;
                }

                //Strip off any trailing .js since dataMain is now
                //like a module name.
                dataMain = dataMain.replace(jsSuffixRegExp, '');

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(dataMain) : [dataMain];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = [];
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps.length && isFunction(callback)) {
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, '')
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    define.amd = {
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));
define("lib/jrburke/require", function(){});

// conditioner v0.8.1 - A JavaScript framework for conditionally loading UI classes
// Copyright (c) 2013 Rik Schennink - https://github.com/rikschennink/conditioner
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

define('Conditioner',['require'],function(require) {

    

    /**
     * @module conditioner
     */
/**
 * @namespace Utils
 */
var Utils = (function(){


    // define method used for matchesSelector
    var _method = null;
    var el = document.body;
    if (el.matches) {
        _method = 'matches';
    }
    else if (el.webkitMatchesSelector) {
        _method = 'webkitMatchesSelector';
    }
    else if (el.mozMatchesSelector) {
        _method = 'mozMatchesSelector';
    }
    else if (el.msMatchesSelector) {
        _method = 'msMatchesSelector';
    }
    else if (el.oMatchesSelector) {
        _method = 'oMatchesSelector';
    }


    var exports = {

        /**
         * Based on https://github.com/nrf110/deepmerge/blob/master/index.js
         * @memberof Utils
         * @param target {object}
         * @param src {object}
         * @returns {object}
         * @static
         */
        mergeObjects:function(target, src) {

            var array = Array.isArray(src);
            var dst = array && [] || {};

            src = src || {};

            if (array) {

                target = target || [];
                dst = dst.concat(target);

                src.forEach(function(e, i) {

                    if (typeof e === 'object') {
                        dst[i] = mergeObjects(target[i], e);
                    }
                    else {
                        if (target.indexOf(e) === -1) {
                            dst.push(e);
                        }
                    }
                });
            }
            else {

                if (target && typeof target === 'object') {

                    Object.keys(target).forEach(function (key) {
                        dst[key] = target[key];
                    });

                }

                Object.keys(src).forEach(function (key) {

                    if (typeof src[key] !== 'object' || !src[key]) {
                        dst[key] = src[key];
                    }
                    else {
                        if (!target[key]) {
                            dst[key] = src[key];
                        }
                        else {
                            dst[key] = exports.mergeObjects(target[key], src[key]);
                        }
                    }

                });
            }

            return dst;
        },


        /**
         * matches an element to a selector
         * @memberof Utils
         * @param {element} element
         * @param {string} selector
         * @return {Boolean}
         * @static
         */
        matchesSelector:function(element,selector) {
            if (!element || !_method) {
                return false;
            }
            return element[_method](selector);
        }

    };

    return exports;

}());


/**
 * @namespace Observer
 */
var Observer = {

    /**
     * Subscribe to an event
     * @memberof Observer
     * @param {object} obj - Object to subscribe to
     * @param {string} type - Event type to listen for
     * @param {Function} fn - Function to call when event fires
     * @static
     */
    subscribe:function(obj,type,fn) {

        if (!obj._subscriptions) {
            obj._subscriptions = [];
        }

        // check if already added
        var test,i=0,l = obj._subscriptions;
        for (; i<l; i++) {
            test = obj._subscriptions[i];
            if (test.type == type && test.fn == fn) {
                return;
            }
        }

        // add event
        obj._subscriptions.push({'type':type,'fn':fn});
    },

    /**
     * Unsubscribe from further notifications
     * @memberof Observer
     * @param {object} obj - Object to unsubscribe from
     * @param {string} type - Event type to match
     * @param {Function} fn - Function to match
     * @static
     */
    unsubscribe:function(obj,type,fn) {

        if (!obj._subscriptions) {
            return;
        }

        // find and remove
        var test,i;
        for (i = obj._subscriptions.length-1; i >= 0; i--) {
            test = obj._subscriptions[i];
            if (test.type == type && test.fn == fn) {
                obj._subscriptions.splice(i,1);
                break;
            }
        }
    },

    /**
     * Publish an event
     * @memberof Observer
     * @param {object} obj - Object to fire the event on
     * @param {string} type - Event type to fire
     * @param {object} data - Any type of data
     * @static
     */
    publish:function(obj,type,data) {

        if (!obj._subscriptions) {
            obj._subscriptions = [];
        }

        // find and execute callback
        var subscriptions=[],subscription,i=0,l = obj._subscriptions.length;
        for (;i<l; i++) {
            subscription = obj._subscriptions[i];
            if (subscription.type == type) {
                subscriptions.push(subscription);
            }
        }

        // call callbacks
        l = subscriptions.length;
        for (i=0;i<l;i++) {
            subscriptions[i].fn(data)
        }

        // see if should be propagated
        if (obj._eventPropagationTarget) {
            this.publish(obj._eventPropagationTarget,type,data);
        }

    },

    /**
     * Setup propagation target for events so they can bubble up the object tree
     * @memberof Observer
     * @param {object} obj - Object to set as origin
     * @param {object} target - Object to set as target
     * @return {Boolean} if setup was successful
     * @static
     */
    setupPropagationTarget:function(obj,target) {
        if (!obj || !target) {
            return false;
        }
        obj._eventPropagationTarget = target;
        return true;
    },

    /**
     * Remove propagation target
     * @memberof Observer
     * @param {object} obj - Object set as origin
     * @param {object} target - Object set as target
     * @return {Boolean} if removed successful
     * @static
     */
    removePropagationTarget:function(obj,target) {

        if (!obj || !target) {
            return false;
        }

        if (obj._eventPropagationTarget === target) {
            obj._eventPropagationTarget = null;
            return true;
        }

        return false;
    }

};


/**
 * @exports ModuleBase
 * @class
 * @constructor
 * @param {element} element - DOM Element to apply this behavior to
 * @param {object} [options] - Custom options to pass to this behavior
 * @abstract
 */
var ModuleBase = function(element,options) {

    // if no element, throw error
    if (!element) {
        throw new Error('BehaviorBase(element,options): "element" is a required parameter.');
    }

    /**
     * Reference to the element this module is active on
     * @type {element}
     * @protected
     */
    this._element = element;
    this._element.setAttribute('data-initialized','true');

    /**
     * Options in place for this module
     * @type {object}
     * @protected
     */
    this._options = this._options || {};
    this._options = options ? Utils.mergeObjects(this._options,options) : this._options;

};


/**
 * Unloads behaviour by removing data initialized property
 * Override to clean up your control, remove event listeners, restore original state, etc.
 * @public
 */
ModuleBase.prototype.unload = function() {
    this._element.removeAttribute('data-initialized');
};


/**
 * @exports TestBase
 * @constructor
 * @param {string} expected - expected conditions to be met
 * @param {element} element - optional element to measure these conditions on
 * @abstract
 */
var TestBase = function(expected,element) {

    /**
     * Expected conditions to match
     * @type {string}
     * @protected
     */
    this._expected = expected;

    /**
     * Reference to element
     * @type {element}
     * @protected
     */
    this._element = element;

    /**
     * Contains current test state
     * @type {boolean}
     * @private
     */
    this._state = true;

};

TestBase.inherit = function() {
    var T = function(expected,element) {
        TestBase.call(this,expected,element);
    };
    T.prototype = Object.create(TestBase.prototype);
    return T;
};


/**
 * Called to setup the test
 * @abstract
 */
TestBase.prototype.arrange = function() {

    // override in subclass

};


/**
 * @fires change
 * @public
 */
TestBase.prototype.assert = function() {

    // call test
    var state = this._onAssert(this._expected);

    // check if result changed
    if (this._state !== state) {
        this._state = state;
        Observer.publish(this,'change',state);
    }

};


/**
 * Called when asserting the test
 * @param {string} expected - expected value
 * @return {boolean}
 * @abstract
 */
TestBase.prototype._onAssert = function(expected) {
    return false;
};


/**
 * @returns {boolean}
 * @public
 */
TestBase.prototype.succeeds = function() {
    return this._state;
};



/**
 * @namespace ModuleRegister
 */
var ModuleRegister = {

    _modules:{},

    /**
     * Register a module
     * @param {string} path - path to module
     * @param {object} config - configuration to setupe for module
     * @param {string} alias - alias name for module
     * @static
     */
    registerModule:function(path,config,alias) {

        var key=alias||path,map,conf;

        // setup module entry
        this._modules[key] = {};

        // check if has config defined
        if (config) {

            // set config entry
            this._modules[key].config = config;

            // update requirejs
            conf = {};
            conf[path] = config;
            requirejs.config({
                config:conf
            });

        }

        // check if has alias defined
        if (alias) {

            // set alias entry
            this._modules[key].alias = alias;

            // update requirejs
            map = {};
            map[alias] = path;
            requirejs.config({
                map:{
                    '*':map
                }
            });
        }

    },

    /**
     * Get a registered module by path
     * @param {string} path - path to module
     * @return {object} - module specification object
     * @static
     */
    getModuleByPath:function(path) {

        // if no id supplied throw error
        if (!path) {
            throw new Error('ModuleRegister.getModuleById(path): "path" is a required parameter.');
        }

        return this._modules[path];

    }

};

var ExpressionBase = {

    /**
     * @abstract
     */
    succeeds:function() {
        // override in subclass
    }

};



/**
 * @class
 * @constructor
 * @augments ExpressionBase
 * @param {Test|null} test
 */
var UnaryExpression = function(test) {

    /**
     * @type {Test|null}
     * @private
     */
    this._test = test;

};

UnaryExpression.prototype = Object.create(ExpressionBase);

/**
 * Sets test reference
 * @param {Test} test
 */
UnaryExpression.prototype.setTest = function(test) {
    this._test = test;
};

/**
 * Tests if valid expression
 * @returns {Boolean}
 */
UnaryExpression.prototype.succeeds = function() {
    if (!this._test) {
        return false;
    }
    return this._test.succeeds();
};


/**
 * @class
 * @constructor
 * @augments ExpressionBase
 * @param {UnaryExpression} a
 * @param {string} o
 * @param {UnaryExpression} b
 */
var BinaryExpression = function(a,o,b) {

    /**
     * @type {UnaryExpression}
     * @private
     */
    this._a = a;

    /**
     * @type {string}
     * @private
     */
    this._o = o;

    /**
     * @type {UnaryExpression}
     * @private
     */
    this._b = b;
};

BinaryExpression.prototype = Object.create(ExpressionBase);

/**
 * Tests if valid expression
 * @returns {boolean}
 */
BinaryExpression.prototype.succeeds = function() {

    return this._o==='and' ?

        // is 'and' operator
        this._a.succeeds() && this._b.succeeds() :

        // is 'or' operator
        this._a.succeeds() || this._b.succeeds();

};


/**
 * @exports ConditionsManager
 * @class
 * @constructor
 * @param {string} conditions - conditions to be met
 * @param {element} [element] - optional element to measure these conditions on
 */
var ConditionsManager = function(conditions,element) {

    // if the conditions are suitable, by default they are
    this._suitable = true;

    // if no conditions, conditions will always be suitable
    if (typeof conditions !== 'string') {
        return;
    }

    // conditions supplied, conditions are now unsuitable by default
    this._suitable = false;

    // set element reference
    this._element = element;

    // load tests
    this._tests = [];

    // change event bind
    this._onResultsChangedBind = this._onTestResultsChanged.bind(this);

    // read test count
    this._count = conditions.match(/(\:\{)/g).length;

    // derive plain expression
    var expression = this._parseCondition(conditions);

    // load to expression tree
    this._expression = this._loadExpression(expression);

};



// prototype shortcut
ConditionsManager.prototype = {

    /**
     * Returns true if the current conditions are suitable
     * @return {Boolean}
     * @public
     */
    getSuitability:function() {
        return this._suitable;
    },


    /**
     * Parses condition and returns an expression array
     * @param condition {string}
     * @returns {Array}
     * @private
     */
    _parseCondition:function(condition) {

        var i=0,
            c,
            k,
            n,
            operator,
            path = '',
            tree = [],
            value = '',
            isValue = false,
            target = null,
            flattened = null,
            parent = null,
            parents = [],
            l=condition.length;


        if (!target) {
            target = tree;
        }

        // read explicit expressions
        for (;i<l;i++) {

            c = condition.charAt(i);

            // check if an expression
            if (c === '{') {

                // now reading the expression
                isValue = true;

                // reset name var
                path = '';

                // fetch name
                k = i-2;
                while(k>=0) {
                    n = condition.charAt(k);
                    if (n === ' ' || n === '(') {
                        break;
                    }
                    path = n + path;
                    k--;
                }

                // on to the next character
                continue;

            }
            else if (c === '}') {

                // add value and
                target.push({'path':path,'value':value});

                // reset vars
                path = '';
                value = '';

                // no longer a value
                isValue = false;

                // on to the next character
                continue;
            }

            // if we are reading an expression add characters to expression
            if (isValue) {
                value += c;
                continue;
            }

            // if not in expression
            if (c === ' ') {

                // get operator
                operator = condition.substr(i,4).match(/and|or/g);

                // if operator found
                if (operator) {

                    // add operator
                    target.push(operator[0]);

                    // skip over operator
                    i+=operator[0].length+1;
                }

                continue;
            }

            // check if goes up a level
            if (c === '(') {

                // create new empty array in target
                target.push([]);

                // remember current target (is parent)
                parents.push(target);

                // set new child slot as new target
                target = target[target.length-1];

            }
            else if (c === ')' || i === l-1) {

                // reset flattened data
                flattened = null;

                // get parent
                parent = parents.pop();

                // if only contains single element flatten array
                if (target.length === 1 || (parent && parent.length===1 && i===l-1)) {
                    flattened = target.concat();
                }

                // restore parent
                target = parent;

                // if data defined
                if (flattened && target) {

                    target.pop();

                    for (k=0;k<flattened.length;k++) {
                        target.push(flattened[k]);
                    }

                }

            }
        }

        // derive implicit expressions
        this._makeExplicit(tree);

        // return final expression tree
        return tree.length === 1 ? tree[0] : tree;
    },


    /**
     * Turns an implicit array of expressions into an explicit array of expressions
     * @param {Array} level
     * @private
     */
    _makeExplicit:function(level) {

        var i=0,l=level.length;

        for (;i<l;i++) {

            if (l>3) {

                // binary expression found merge into new level
                level.splice(i,3,level.slice(i,i+3));

                // set new length
                l = level.length;

                // move back to start
                i=-1;

            }
            else if (typeof level[i] !== 'string') {

                // level okay, check lower level
                this._makeExplicit(level[i]);

            }

        }

    },


    /**
     * Turns an expression array into an actual expression tree
     * @param expression {Array}
     * @return {ExpressionBase}
     * @private
     */
    _loadExpression:function(expression) {

        // if expression is array
        if (expression.length === 3) {

            // is binary expression, create test
            return new BinaryExpression(
                this._loadExpression(expression[0]),
                expression[1],
                this._loadExpression(expression[2])
            );

        }
        else {
            return this._createUnaryExpressionFromTest(expression);
        }

    },


    /**
     * Called to create a UnaryExpression from a test and loads the test
     * @param {object} test
     * @return {UnaryExpression}
     * @private
     */
    _createUnaryExpressionFromTest:function(test) {

        var unaryExpression = new UnaryExpression(null);
        var instance = null;
        var self = this;

        require(['tests/' + test.path],function(Test){

            // create test instance
            instance = new Test(test.value,self._element);

            // add instance to test set
            self._tests.push(instance);

            // set test to unary expression
            unaryExpression.setTest(instance);

            // lower test count
            self._count--;
            if (self._count===0) {
                self._onReady();
            }
        });

        return unaryExpression;
    },


    /**
     * Called when all tests are ready
     * @fires ready
     * @private
     */
    _onReady:function() {

        // setup
        var l = this._tests.length,test,i;
        for (i=0;i<l;i++) {

            test = this._tests[i];

            // arrange test (tests will assert themselves)
            test.arrange();

            // assert test to determine initial state
            test.assert();

            // listen to changes
            Observer.subscribe(test,'change',this._onResultsChangedBind);
        }

        // test current state
        this.test();

        // we are now ready to start testing
        Observer.publish(this,'ready',this._suitable);

    },


    /**
     * Called when a condition has changed
     * @private
     */
    _onTestResultsChanged:function() {
        this.test();
    },


    /**
     * Tests if conditions are suitable
     * @fires change
     * @public
    */
    test:function() {

        // test expression success state
        var suitable = this._expression.succeeds();

        // fire changed event if environment suitability changed
        if (suitable != this._suitable) {
            this._suitable = suitable;
            Observer.publish(this,'change');
        }

    }

};


/**
 * @exports ModuleController
 * @class
 * @constructor
 * @param {string} path - reference to module
 * @param {object} options - options for this behavior controller
 */
var ModuleController = function(path,options) {

    // if no element, throw error
    if (!path) {
        throw new Error('ModuleController(path,options): "path" is a required parameter.');
    }

    // options for class behavior controller should load
    this._path = path;

    // options for behavior controller
    this._options = options || {};

    // module reference
    this._Module = null;

    // module instance reference
    this._moduleInstance = null;

    // check if conditions specified
    this._conditionsManager = new ConditionsManager(
        this._options.conditions,
        this._options.target
    );

    // listen to ready event on condition manager
    Observer.subscribe(this._conditionsManager,'ready',this._onReady.bind(this));

    // by default module is not ready and not available unless it's not conditioned or conditions are already suitable
    this._ready = !this.isConditioned() || this._conditionsManager.getSuitability();
    this._available = false;


};


/**
 * Returns true if the module is available for initialisation, this is true when conditions have been met
 * @return {boolean}
 * @public
 */
ModuleController.prototype.isAvailable = function() {
    this._available = this._conditionsManager.getSuitability();
    return this._available;
};


/**
 * Returns true if module is currently active and loaded
 * @returns {boolean}
 * @public
 */
ModuleController.prototype.isActive = function() {
    return this._moduleInstance !== null;
};


/**
 * Returns true if the module is dependent on certain conditions
 * @return {boolean}
 * @public
 */
ModuleController.prototype.isConditioned = function() {
    return typeof this._options.conditions !== 'undefined';
};


/**
 * Returns true if the module is ready, this is true when conditions have been read for the first time
 * @return {boolean}
 * @public
 */
ModuleController.prototype.isReady = function() {
    return this._ready;
};


/**
 * Checks if the module matches the path
 * @param {string} path - path of module to test for
 * @return {boolean} if matched
 * @public
 */
ModuleController.prototype.matchesPath = function(path) {
    return this._path === path;
};


/**
 * @private
 * @fires ready
 */
ModuleController.prototype._onReady = function(suitable) {

    // module is now ready (this does not mean it's available)
    this._ready = true;

    // listen to changes in conditions
    Observer.subscribe(this._conditionsManager,'change',this._onConditionsChange.bind(this));

    // let others know we are ready
    Observer.publish(this,'ready');

    // are we available
    if (suitable) {
        this._onAvailable();
    }

};

/**
 * @private
 * @fires available
 */
ModuleController.prototype._onAvailable = function() {

    // module is now available
    this._available = true;

    // let other know we are available
    Observer.publish(this,'available',this);

};


/**
 * Called when the conditions change
 * @private
 */
ModuleController.prototype._onConditionsChange = function() {

    var suitable = this._conditionsManager.getSuitability();

    if (this._moduleInstance && !suitable) {
        this.unload();
    }

    if (!this._moduleInstance && suitable) {
        this._onAvailable();
    }

};




/**
 * Load the module set in the referenced in the path property
 * @public
 */
ModuleController.prototype.load = function() {

    // if module available no need to require it
    if (this._Module) {
        this._onLoad();
        return;
    }

    // load module, and remember reference
    var self = this;
    require([this._path],function(Module){

        // set reference to Module
        self._Module = Module;

        // module is now ready to be loaded
        self._onLoad();

    });

};

/**
 * Method called when module loaded
 * @fires load
 * @private
 */
ModuleController.prototype._onLoad = function() {

    // if no longer available
    if (!this.isAvailable()) {
        return;
    }

    // get module specification
    var specification = ModuleRegister.getModuleByPath(this._path),
        moduleOptions = specification ? specification.config : {},
        elementOptions = {},
        options;

    // parse element options
    if (typeof this._options.options == 'string') {
        try {
            elementOptions = JSON.parse(this._options.options);
        }
        catch(e) {
            throw new Error('ModuleController.loadModule(): "options" is not a valid JSON string.');
        }
    }
    else {
        elementOptions = this._options.options;
    }

    // merge module default options with element options if found
    options = moduleOptions ? Utils.mergeObjects(moduleOptions,elementOptions) : elementOptions;

    // create instance
    this._moduleInstance = new this._Module(this._options.target,options);

    // propagate events from actual module to module controller
    // this way it is possible to listen to events on the controller which is always there
    Observer.setupPropagationTarget(this._moduleInstance,this);

    // publish load event
    Observer.publish(this,'load',this);

};


/**
 * Unloads the module
 * @fires unload
 * @return {boolean}
 * @public
 */
ModuleController.prototype.unload = function() {

    // module is now no longer ready to be loaded
    this._available = false;

    // if no module, module has already been unloaded or was never loaded
    if (!this._moduleInstance) {
        return false;
    }

    // clean propagation target
    Observer.removePropagationTarget(this._moduleInstance,this);

    // unload behavior if possible
    if (this._moduleInstance.unload) {
        this._moduleInstance.unload();
    }

    // reset property
    this._moduleInstance = null;

    // publish unload event
    Observer.publish(this,'unload',this);

    return true;
};


/**
 * Executes a methods on the loaded module
 * @param {string} method - method key
 * @param {Array} params - optional array containing the method parameters
 * @return {object} containing response of executed method and a status code
 * @public
 */
ModuleController.prototype.execute = function(method,params) {

    // todo: always return object containing status code and response

    // if behavior not loaded
    if (!this._moduleInstance) {
        return {
            'status':404,
            'response':null
        };
    }

    // get function reference
    var F = this._moduleInstance[method];
    if (!F) {
        throw new Error('ModuleController.execute(method,params): function specified in "method" not found on module.');
    }

    // once loaded call method and pass parameters
    return {
        'status':200,
        'response':F.apply(this._moduleInstance,params)
    };

};


/**
 * @exports Node
 * @class
 * @constructor
 * @param {element} element
 */
var Node = function(element) {

    // set element reference
    this._element = element;

    // has been processed
    this._element.setAttribute('data-processed','true');

    // set priority
    this._priority = this._element.getAttribute('data-priority');

    // contains references to all module controllers
    this._moduleControllers = [];

    // contains reference to currently active module controller
    this._activeModuleController = null;

    // method to unbind
    this._activeModuleUnloadBind = this._onActiveModuleUnload.bind(this);

};


/**
 * Static method testing if the current element has been processed already
 * @param {element} element
 * @static
 */
Node.hasProcessed = function(element) {
    return element.getAttribute('data-processed') === 'true';
};


/**
 * Returns the set priority for this node
 * @public
 */
Node.prototype.getPriority = function() {
    return this._priority;
};


/**
 * Initializes the node
 * @public
 */
Node.prototype.init = function() {

    // parse element module attributes
    this._moduleControllers = this._createModuleControllers();

    var i=0,l=this._moduleControllers.length,mc;

    // listen to ready events on module controllers
    for (;i<l;i++) {

        mc = this._moduleControllers[i];

        // if module already ready, jump to onready method and don't bind listener
        if (mc.isReady()) {
            this._onModuleReady();
            continue;
        }

        // otherwise, listen to ready event
        Observer.subscribe(mc,'ready',this._onModuleReady.bind(this));

    }

};


/**
 * Called when a module has indicated it is ready
 * @private
 */
Node.prototype._onModuleReady = function() {

    var i=0,l=this._moduleControllers.length,mc;

    // check if all modules ready, if so, call on modules ready
    for (;i<l;i++) {

        mc = this._moduleControllers[i];

        // if module controller is no tready, stop here, we wait for all module controllers to be ready
        if (!mc.isReady()) {
            return;
        }
    }

    // all modules ready
    this._onModulesReady();

};


/**
 * Called when all modules are ready
 * @private
 */
Node.prototype._onModulesReady = function() {

    // find suitable active module controller
    var moduleController = this._getSuitableActiveModuleController();
    if (moduleController) {
        this._setActiveModuleController(moduleController);
    }

    // listen to available events on controllers
    var i=0,l=this._moduleControllers.length;
    for (;i<l;i++) {
        Observer.subscribe(this._moduleControllers[i],'available',this._onModuleAvailable.bind(this));
    }

};


/**
 * Called when a module controller has indicated it is ready to be loaded
 * @param moduleController
 * @private
 */
Node.prototype._onModuleAvailable = function(moduleController) {

    // setup vars
    var i=0,l=this._moduleControllers.length,mc;

    for (;i<l;i++) {

        mc = this._moduleControllers[i];

        if (mc !== moduleController &&
            mc.isAvailable() &&
            mc.isConditioned()) {

            // earlier or conditioned module is ready, therefor cannot load this module

            return;
        }
    }

    // load supplied module controller as active module
    this._setActiveModuleController(moduleController);

};

/**
 * Sets the active module controller
 * @param moduleController
 * @private
 */
Node.prototype._setActiveModuleController = function(moduleController) {

    // if not already loaded
    if (moduleController === this._activeModuleController) {
        return;
    }

    // clean up active module controller reference
    this._cleanActiveModuleController();

    // set new active module controller
    this._activeModuleController = moduleController;
    Observer.subscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);
    this._activeModuleController.load();

};

/**
 * Removes the active module controller
 * @private
 */
Node.prototype._cleanActiveModuleController = function() {

    // if no module controller defined do nothing
    if (!this._activeModuleController) {
        return;
    }

    // stop listening to unload
    Observer.unsubscribe(this._activeModuleController,'unload',this._activeModuleUnloadBind);

    // unload controller
    this._activeModuleController.unload();

    // remove reference
    this._activeModuleController = null;
};

/**
 * Called when active module unloaded
 * @private
 */
Node.prototype._onActiveModuleUnload = function() {

    // clean up active module controller reference
    this._cleanActiveModuleController();

    // active module was unloaded, find another active module
    var moduleController = this._getSuitableActiveModuleController();
    if(!moduleController) {
        return;
    }

    // set found module controller as new active module controller
    this._setActiveModuleController(moduleController);
};

/**
 * Returns a suitable module controller
 * @returns {null|ModuleController}
 * @private
 */
Node.prototype._getSuitableActiveModuleController = function() {

    // test if other module is ready, if so load first module to be fitting
    var i=0,l=this._moduleControllers.length,mc;
    for (;i<l;i++) {

        mc = this._moduleControllers[i];

        // if not ready, skip to next controller
        if (!mc.isAvailable()) {
            continue;
        }

        return mc;
    }

    return null;
};


/**
 * Returns an array of module controllers found specified on the element
 * @returns {Array}
 * @private
 */
Node.prototype._createModuleControllers = function() {

    var result = [];
    var config = this._element.getAttribute('data-module');
    var advanced = config.charAt(0) == '[';

    if (advanced) {

        var specs;

        // add multiple module controllers
        try {
            specs = JSON.parse(config);
        }
        catch(e) {
            // failed parsing spec
        }

        // no specification found or specification parsing failed
        if (!specs) {
            return [];
        }

        // setup vars
        var l=specs.length,i=0,spec;

        // create specs
        for (;i<l;i++) {

            spec = specs[i];

            result.push(
                new ModuleController(spec.path,{
                    'conditions':spec.conditions,
                    'options':spec.options,
                    'target':this._element
                })
            );

        }


    }
    else {

        // add default module controller
        result.push(
            new ModuleController(config,{
                'conditions':this._element.getAttribute('data-conditions'),
                'options':this._element.getAttribute('data-options'),
                'target':this._element
            })
        );

    }

    return result;

};


/**
 * Public method to check if the module matches the given query
 * @param {string} selector
 * @return {boolean}
 * @public
 */
Node.prototype.matchesSelector = function(selector) {
    return Utils.matchesSelector(this._element,selector);
};


/**
 * Returns a reference to the currently active module controller
 * @return {ModuleController}
 * @public
 */
Node.prototype.getActiveModuleController = function() {
    return this._activeModuleController;
};


/**
 * Returns the first module controller matching the given path
 * @param path {string} path to module
 * @return {ModuleController}
 * @public
 */
Node.prototype.getModuleControllerByPath = function(path) {
    return this._filterModuleControllers(path,true);
};


/**
 * Returns the first module controller matching the given path
 * @param path {string} path to module
 * @return {Array}
 * @public
 */
Node.prototype.getModuleControllerAllByPath = function(path) {
    return this._filterModuleControllers(path,false);
};


/**
 * Returns a single or multiple module controllers depending on input
 * @param path {string}
 * @param single {boolean}
 * @returns {Array|ModuleController}
 * @private
 */
Node.prototype._filterModuleControllers = function(path,single) {
    var i=0,l=this._moduleControllers.length,result=[],mc;
    for (;i<l;i++) {
        mc = this._moduleControllers[i];
        if (mc.matchesPath(path)) {
            if (single) {
                return mc;
            }
            result.push(mc);
        }
    }
    return single ? null : result;
};


/**
 * Public method for safely executing methods on the loaded module
 * @param {string} method - method key
 * @param {Array} params - array containing the method parameters
 * @return {object} returns object containing status code and possible response data
 * @public
 */
Node.prototype.execute = function(method,params) {

    // if active module controller defined
    if (this._activeModuleController) {
        return this._activeModuleController.execute(method,params);
    }

    // no active module
    return {
        'status':404,
        'response':null
    };
};


/**
 * @exports Conditioner
 * @class
 * @constructor
 * @private
 */
var Conditioner = function() {

    // options for conditioner
    this._options = {
        'attribute':{
            'module':'data-module'
        },
        'modules':{}
    };

    // array of all parsed nodes
    this._nodes = [];

};

Conditioner.prototype = {

    /**
     * Set custom options
     * @param {object} options - options to override
     * @public
     */
    setOptions:function(options) {

        // update options
        this._options = Utils.mergeObjects(this._options,options);

        // loop over modules
        var config,path,mod,alias;
        for (path in this._options.modules) {

            if (!this._options.modules.hasOwnProperty(path)){continue;}

            // get module reference
            mod = this._options.modules[path];

            // get alias
            alias = typeof mod === 'string' ? mod : mod.alias;

            // get config
            config = typeof mod === 'string' ? null : mod.options || {};

            // register this module
            ModuleRegister.registerModule(path,config,alias);

        }
    },

    /**
     * Loads modules within the given context
     * @param {element} context - Context to find modules in
     * @return {Array} - Array of initialized ModuleControllers
     */
    loadModules:function(context) {

        // if no context supplied throw error
        if (!context) {
            throw new Error('Conditioner.loadModules(context): "context" is a required parameter.');
        }

        // register vars and get elements
        var elements = context.querySelectorAll('[' + this._options.attribute.module + ']'),
            l = elements.length,
            i = 0,
            nodes = [],
            element;

        // if no elements do nothing
        if (!elements) {
            return [];
        }

        // process elements
        for (; i<l; i++) {

            // set element reference
            element = elements[i];

            // test if already processed
            if (Node.hasProcessed(element)) {
                continue;
            }

            // create new node
            nodes.push(new Node(element));
        }

        // sort nodes by priority:
        // higher numbers go first,
        // then 0 (or no priority assigned),
        // then negative numbers
        nodes.sort(function(a,b){
            return b.getPriority() - a.getPriority();
        });

        // initialize modules depending on assigned priority
        l = nodes.length;
        for (i=0; i<l; i++) {
            nodes[i].init();
        }

        // merge new nodes with currently active nodes list
        this._nodes = this._nodes.concat(nodes);

        // returns nodes so it is possible to later unload nodes manually if necessary
        return nodes;
    },


    /**
     * Returns ModuleControllers matching the selector
     * @param {string} selector - Selector to match the nodes to
     * @return {Node} First matched node
     */
    getNode:function(selector) {
        return this._filterNodes(selector,true);
    },


    /**
     * Returns all ModuleControllers matching the selector
     * @param {string} selector - Optional selector to match the nodes to
     * @return {Array} Array containing matched nodes
     */
    getNodesAll:function(selector) {
        return this._filterNodes(selector,false);
    },


    /**
     * Returns a single or multiple module controllers matching the given selector
     * @param selector {string}
     * @param single {boolean}
     * @returns {Array|Node}
     * @private
     */
    _filterNodes:function(selector,single) {

        // if no query supplied
        if (typeof selector === 'undefined') {
            return single ? null : [];
        }

        // find matches
        var i=0,l = this._nodes.length,results=[],node;
        for (;i<l;i++) {
            node = this._nodes[i];
            if (node.matchesSelector(selector)) {
                if (single) {
                    return node;
                }
                results.push(node);
            }
        }

        return single ? null : results;

    }

};

    // singleton reference
    var _instance;

    // expose
    return {

        /**
         * Reference to Observer class
         * @type {Observer}
         */
        Observer:Observer,

        /**
         * Reference to TestBase Class
         * @memberof module:conditioner
         */
        TestBase:TestBase,

        /**
         * Reference to ModuleBase Class
         * @memberof module:conditioner
         */
        ModuleBase:ModuleBase,

        /**
         * Reference to mergeObject method
         * @memberof module:conditioner
         */
        mergeObjects:Utils.mergeObjects,

        /**
         * Returns an instance of the Conditioner
         * @return {Conditioner}
         */
        getInstance:function() {
            if (!_instance) {_instance = new Conditioner();}
            return _instance;
        }

    };

});


/**
 * Tests if an active network connection is available and monitors this connection
 * @module tests/connection
 */
define('tests/connection',['Conditioner'],function(Conditioner){

    

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        if (navigator.connection) {
            navigator.connection.addEventListener('change', this, false);
        }
    };

    p._onAssert = function(expected) {
        return expected === 'any' && navigator.onLine;
    };

    return Test;

});

define('security/StorageConsentGuard',['Conditioner','module'],function(Conditioner,module){

    

    // StorageConsentGuard
    var StorageConsentGuard = function() {

        // current level
        this._level = null;

        // default options
        this._options = {
            'initial':'all',
            'levels':['all','none']
        };

        // set options
        this.setOptions(module.config());

        // set default level
        this._setDefaultLevel();
    };

    var p = StorageConsentGuard.prototype;

    p.setOptions = function(options) {

        if (!options) {
            return;
        }

        // sets initial options
        this._options = Conditioner.mergeObjects(this._options,options);

        this._setDefaultLevel();
    };

    p._setDefaultLevel = function() {
        this.setActiveLevel(this._options.initial);
    };

    p.getLevels = function() {
        return this._options.levels;
    };

    p.getActiveLevel = function() {
        return this._level;
    };

    p.setActiveLevel = function(level) {

        if (level == this._level) {
            return;
        }

        this._level = level;

        Conditioner.Observer.publish(this,'change',this._level);
    };


    // reference to singleton
    var _instance;

    return {
        getInstance:function() {
            if (!_instance) { _instance = new StorageConsentGuard(); }
            return _instance;
        }
    };

});
/**
 * Tests if what consent the user has given concerning cookie storage
 * @module tests/cookie
 */
define('tests/cookies',['Conditioner','security/StorageConsentGuard'],function(Conditioner,StorageConsentGuard){

    var Test = Conditioner.TestBase.inherit(),
        p = Test.prototype;

    p.arrange = function() {

        var guard = StorageConsentGuard.getInstance(),self = this;
        Conditioner.Observer.subscribe(guard,'change',function() {
            self.assert();
        });

    };

    p._onAssert = function(expected) {

        var guard = StorageConsentGuard.getInstance(),
            level = guard.getActiveLevel(),
            result = expected.match(new RegExp(level,'g'));

        return result ? true : false;
    };

    return Test;

});

/**
 * Tests if an elements dimensions match certain expectations
 * @module tests/element
 */
define('tests/element',['Conditioner'],function(Conditioner){

    

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        window.addEventListener('resize',this,false);
        window.addEventListener('scroll',this,false);
    };

    p._onAssert = function(expected) {

        var parts = expected.split(':'),key,value;
        if (parts) {
            key = parts[0];
            value = parseInt(parts[1],10);
        }
        else {
            key = expected;
        }

        if (key==='min-width') {
            return this._element.offsetWidth >= value;
        }
        else if (key==='max-width') {
            return this._element.offsetWidth <= value;
        }
        else if (key==='seen' || key ==='visible') {

            // measure if element is visible
            var viewHeight = window.innerHeight,
                bounds = this._element.getBoundingClientRect(),
                visible = (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);

            if (key === 'seen') {

                // remember if seen
                if (typeof this._seen === 'undefined' && visible) {
                    this._seen = true;
                }

                // if seen
                return this._seen === true;
            }

            if (key === 'visible') {
                return visible;
            }
        }

        return false;
    };

    return Test;

});


/**
 * Tests if a media query is matched or not and listens to changes
 * @module tests/media
 */
define('tests/media',['Conditioner'],function(Conditioner){

    

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype;

    p.arrange = function() {

        if (!window.matchMedia) {
            return;
        }

        var self = this;
        this._mql = window.matchMedia(this._expected);
        this._mql.addListener(function(){
            self.assert();
        });

    };

    p._onAssert = function(expected) {

        // see if checking if supported
        if (expected === 'supported') {
            return typeof this._mql !== 'undefined';
        }

        // if no media query list defined, no support
        if (typeof this._mql === 'undefined') {
            return false;
        }

        // test media query
        return this._mql.matches;
    };

    return Test;

});

/**
 * Tests if the user is using a pointer device
 * @module tests/pointer
 */
define('tests/pointer',['Conditioner'],function(Conditioner){

    

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype,
    MOUSE_MOVES_REQUIRED = 2;

    p._totalMouseMoves = 0;

    p.handleEvent = function(e) {
        if (e.type == 'mousemove') {
            this._totalMouseMoves++;
            if (this._totalMouseMoves >= MOUSE_MOVES_REQUIRED) {
                document.removeEventListener('mousemove',this,false);
                document.removeEventListener('mousedown',this,false);
            }
        }
        else {
            this._totalMouseMoves = 0;
        }
        this.assert();
    };

    p.arrange = function() {

        // start listening to mousemoves to deduct the availability of a pointer device
        document.addEventListener('mousemove',this,false);
        document.addEventListener('mousedown',this,false);

        // start timer, stop testing after 10 seconds
        var self = this;
        setTimeout(function(){
            document.removeEventListener('mousemove',self,false);
            document.removeEventListener('mousedown',self,false);
        },10000);
    };

    p._onAssert = function(expected) {
        var result = '';
        if (this._totalMouseMoves >= MOUSE_MOVES_REQUIRED) {
            result = 'available';
        }
        return result === expected;
    };

    return Test;

});

/**
 * Tests if the window dimensions match certain expectations
 * @module tests/window
 */
define('tests/window',['Conditioner'],function(Conditioner){

    

    var Test = Conditioner.TestBase.inherit(),
    p = Test.prototype;

    p.handleEvent = function(e) {
        this.assert();
    };

    p.arrange = function() {
        window.addEventListener('resize',this,false);
    };

    p._onAssert = function(expected) {

        var innerWidth = window.innerWidth || document.documentElement.clientWidth,
            parts = expected.split(':'),
            key = parts[0],
            value = parseInt(parts[1],10);

        switch(key) {
            case 'min-width':{
                return innerWidth >= value;
            }
            case 'max-width':{
                return innerWidth <= value;
            }
        }

        return false;
    };

    return Test;

});

define('ui/Clock',['Conditioner'],function(Conditioner){

    

    // reference to parent class
    var _parent = Conditioner.ModuleBase;

    // Clock Class
    var exports = function(element,options) {

        // set default options
        this._options = {
            'time':true
        };

        // call BehaviourBase constructor
        _parent.call(this,element,options);

        // backup content
        this._inner = this._element.innerHTML;

        // start ticking
        this._tick();
    };

    // Extend from BehaviourBase
    var p = exports.prototype = Object.create(_parent.prototype);

    // Update time
    p._tick = function() {

        var self = this,
            pad = function(n){return n<10 ? '0'+n : n},
            now = new Date(),
            date = pad(now.getDate()) + '/' + (now.getMonth()+1) + '/'+ now.getFullYear(),
            time = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

        // write inner html
        this._element.innerHTML = date + (this._options.time ? ' - ' + time : '');

        // if time is not enabled, don't start ticking
        if (!this._options.time) {
            return;
        }

        // wait timeout milliseconds till next clock tick
        this._timer = setTimeout(function(){
            self._tick();
        },900);

    };

    // Unload Clock behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        _parent.prototype._unload.call(this);

        // stop ticking
        clearTimeout(this._timer);

        // restore content
        this._element.innerHTML = this._inner;
    };

    return exports;

});
define('ui/StorageConsentSelect',['Conditioner','security/StorageConsentGuard'],function(Conditioner,IStorageGuard){

    

    // reference to parent class
    var _parent = Conditioner.ModuleBase;

    // StorageConsentSelect Class
    var exports = function(element,options) {

        // default options for this class
        this._options = {
            'label':{
                'select':'Cookies',
                'level':{
                    'all':'All',
                    'none':'None'
                }
            }
        };

        // Call BehaviourBase constructor
        _parent.call(this,element,options);

        // set reference to storage guard
        this._storageGuard = IStorageGuard.getInstance();

        // store inner HTML
        this._inner = this._element.innerHTML;

        // options
        var level,levels = this._options.label.level,html = '';
        for (level in levels) {
            if (!levels.hasOwnProperty(level)) {
                continue;
            }
            html += '<option' + (level == this._storageGuard.getActiveLevel() ? ' selected="selected"': '') + ' value="' + level + '">' + this._options.label.level[level] + '</option>';
        }

        // setup select
        this._element.innerHTML = '<label for="storage-consent">' + this._options.label.select + '</label>' +
                                  '<select id="storage-consent">' + html + '</select>';

        // listen to changes on select
        this._element.querySelector('select').addEventListener('change',this);

    };

    // Extend from BehaviourBase
    var p = exports.prototype = Object.create(_parent.prototype);

    // Handle events
    p.handleEvent = function(e) {
        if (e.type === 'change') {
            var select = this._element.querySelector('select'),
                value = select.options[select.selectedIndex].value;

            // set active level
            this._storageGuard.setActiveLevel(value);
        }
    };

    // Unload StorageConsentSelect behaviour
    p._unload = function() {

        // call BehaviourBase unload method
        _parent.prototype._unload.call(this);

        // remove event listener
        this._element.querySelector('select').removeEventListener('change',this);

        // restore original content
        this._element.innerHTML = this._inner;

    };

    return exports;

});