
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

// conditioner v0.9.0 - ConditionerJS - Frizz free, environment-aware, javascript modules.
// Copyright (c) 2013 Rik Schennink - http://conditionerjs.com
// License: MIT (http://www.opensource.org/licenses/mit-license.php)
define("conditioner/Observer",{subscribe:function(t,e,i){t._subscriptions||(t._subscriptions=[]);for(var n,o=0,s=t._subscriptions;s>o;o++)if(n=t._subscriptions[o],n.type===e&&n.fn===i)return;t._subscriptions.push({type:e,fn:i})},unsubscribe:function(t,e,i){if(t._subscriptions)for(var n,o=t._subscriptions.length;--o>=0;)if(n=t._subscriptions[o],n.type===e&&n.fn===i){t._subscriptions.splice(o,1);break}},publish:function(t,e,i){t._subscriptions||(t._subscriptions=[]);for(var n,o=[],s=0,r=t._subscriptions.length;r>s;s++)n=t._subscriptions[s],n.type===e&&o.push(n);for(r=o.length,s=0;r>s;s++)o[s].fn(i);if(t._receivers)for(r=t._receivers.length,s=0;r>s;s++)this.publish(t._receivers[s],e,i)},inform:function(t,e){return t&&e?(t._receivers||(t._receivers=[]),t._receivers.push(e),!0):!1},conceal:function(t,e){if(!t||!e||!t._receivers)return!1;for(var i,n=t._receivers.length;--n>=0;)if(i=t._receivers[n],i===e)return t._receivers.splice(n,1),!0;return!1}}),define("conditioner/contains",[],function(){var t=document?document.body:null;return t&&t.compareDocumentPosition?function(t,e){return!!(16&t.compareDocumentPosition(e))}:t&&t.contains?function(t,e){return t!=e&&t.contains(e)}:function(t,e){for(var i=e.parentNode;i;){if(i===t)return!0;i=i.parentNode}return!1}}),define("conditioner/matchesSelector",[],function(){var t=null,e=document?document.body:null;return!e||e.matches?t="matches":e.webkitMatchesSelector?t="webkitMatchesSelector":e.mozMatchesSelector?t="mozMatchesSelector":e.msMatchesSelector?t="msMatchesSelector":e.oMatchesSelector&&(t="oMatchesSelector"),t?function(e,i){return e[t](i)}:function(t,e){for(var i=(t.parentNode||document).querySelectorAll(e)||[],n=i.length;n--;)if(i[n]==t)return!0;return!1}}),define("conditioner/mergeObjects",[],function(){var t=function(e,i){var n=Array.isArray(i),o=n&&[]||{};return i=i||{},n?(e=e||[],o=o.concat(e),i.forEach(function(i,n){"object"==typeof i?o[n]=t(e[n],i):-1===e.indexOf(i)&&o.push(i)})):(e&&"object"==typeof e&&Object.keys(e).forEach(function(t){o[t]=e[t]}),Object.keys(i).forEach(function(n){o[n]="object"==typeof i[n]&&i[n]?e[n]?t(e[n],i[n]):i[n]:i[n]})),o};return t}),define("conditioner",["require","conditioner/Observer","conditioner/contains","conditioner/matchesSelector","conditioner/mergeObjects"],function(t,e,i,n,o){var s=function(){};s.prototype={succeeds:function(){},getConfig:function(){}};var r=function(t,e){this._expression=t instanceof u||t instanceof r?t:null,this._config=this._expression?null:t,this._negate=e===void 0?!1:e};r.prototype=Object.create(s),r.prototype.assignTester=function(t){this._expression=t},r.prototype.getConfig=function(){return this._config?[{expression:this,config:this._config}]:this._expression.getConfig()},r.prototype.succeeds=function(){return this._expression.succeeds?this._expression.succeeds()!==this._negate:!1},r.prototype.toString=function(){return(this._negate?"not ":"")+(this._expression?""+this._expression:this._config.path+":{"+this._config.value+"}")};var u=function(t,e,i){this._a=t,this._operator=e,this._b=i};u.prototype=Object.create(s),u.prototype.succeeds=function(){return"and"===this._operator?this._a.succeeds()&&this._b.succeeds():this._a.succeeds()||this._b.succeeds()},u.prototype.toString=function(){return"("+(""+this._a)+" "+this._operator+" "+(""+this._b)+")"},u.prototype.getConfig=function(){return[this._a.getConfig(),this._b.getConfig()]};var l={getExpressionsCount:function(t){return t.match(/(:\{)/g).length},fromString:function(t){var e,i,n,o,s,l,a,c,h,d,_=0,f="",p=[],m="",g=!1,v=!1,b=null,M=null,C=[],y=t.length;for(b||(b=p);y>_;_++)if(s=t.charAt(_),"{"!==s)if("}"===s&&(e=b.length-1,i=e+1,g="not"===b[e],i=g?e:e+1,b[i]=new r({path:f,value:m},g),f="",m="",g=!1,v=!1),v)m+=s;else{if("("===s&&(b.push([]),C.push(b),b=b[b.length-1])," "===s||0===_||"("===s){if(n=t.substr(_,5).match(/and |or |not /g),!n)continue;c=n[0],h=c.length-1,b.push(c.substring(0,h)),_+=h}if(")"===s||_===y-1)do if(M=C.pop(),0!==b.length){for(o=0,d=b.length;d>o;o++)"string"==typeof b[o]&&("not"===b[o]?(b.splice(o,2,new r(b[o+1],!0)),o=-1,d=b.length):"not"!==b[o+1]&&(b.splice(o-1,3,new u(b[o-1],b[o],b[o+1])),o=-1,d=b.length));1===b.length&&M&&(M[M.length-1]=b[0],b=M)}else b=M;while(_===y-1&&M)}else for(v=!0,f="",l=_-2;l>=0&&(a=t.charAt(l)," "!==a&&"("!==a);)f=a+f,l--;return 1===p.length?p[0]:p}},a={_tests:{},_createTest:function(t,i){if(!i.assert)throw Error('TestRegister._addTest(path,config): "config.assert" is a required parameter.');var n=function(){};return n.supported="support"in i?i.support():!0,n._callbacks=[],n._ready=!1,n._setup=function(t){n.supported&&(n._callbacks.push(t.onchange.bind(t)),n._ready||(n._ready=!0,i.setup.call(n,n._measure)))},n._measure=function(t){var e="measure"in i?i.measure.call(n._measure,t):!0;if(e)for(var o=0,s=n._callbacks.length;s>o;o++)n._callbacks[o](t)},n.prototype.supported=function(){return n.supported},n.prototype.onchange=function(){e.publish(this,"change")},n.prototype.arrange=i.arrange?function(t,e){n.supported&&i.arrange.call(this,t,e)}:function(){n._setup(this)},i.measure&&(n.prototype.measure=i.measure),n.prototype.assert=i.assert,n},_findTest:function(t){return this._tests[t]},_storeTest:function(t,e){this._tests[t]=e},getTest:function(e,i){e="tests/"+e,t([e],function(t){var n=a._findTest(e);n||(n=a._createTest(e,t),a._storeTest(e,n)),i(new n)})}},c=function(t,i,n){this._test=t,this._expected=i,this._element=n,this._result=!1,this._changed=!0;var o=this;e.subscribe(this._test,"change",function(){o._changed=!0}),this._test.arrange(this._expected,this._element)};c.prototype.succeeds=function(){return this._changed&&(this._changed=!1,this._result=this._test.assert(this._expected,this._element)),this._result};var h={_modules:{},registerModule:function(t,e,i){var n,o,s=i||t;this._modules[s]={},e&&(this._modules[s].config=e,o={},o[t]=e,requirejs.config({config:o})),i&&(this._modules[s].alias=i,n={},n[i]=t,requirejs.config({map:{"*":n}}))},getModuleByPath:function(t){if(!t)throw Error('ModuleRegister.getModuleById(path): "path" is a required parameter.');return this._modules[t]}},d=function(t,e){this._suitable=!0,"string"==typeof t&&(this._suitable=!1,this._element=e,this._onResultsChangedBind=this._onTestResultsChanged.bind(this),this._count=l.getExpressionsCount(t),this._expression=l.fromString(t),this._loadExpressionTests(this._expression.getConfig()))};d.prototype={getSuitability:function(){return this._suitable},test:function(){var t=this._expression.succeeds();t!=this._suitable&&(this._suitable=t,e.publish(this,"change"))},_loadExpressionTests:function(t){for(var e=0,i=t.length;i>e;e++)Array.isArray(t[e])?this._loadExpressionTests(t[e]):this._loadTesterToExpression(t[e].config,t[e].expression)},_loadTesterToExpression:function(t,i){var n=this;a.getTest(t.path,function(o){i.assignTester(new c(o,t.value,n._element)),e.subscribe(o,"change",n._onResultsChangedBind),n._count--,0===n._count&&n._onReady()})},_onReady:function(){this.test(),e.publish(this,"ready",this._suitable)},_onTestResultsChanged:function(){this.test()}};var _=function(t,i,n){if(!t||!i)throw Error('ModuleController(path,element,options): "path" and "element" are required parameters.');this._path=t,this._element=i,this._options=n||{},this._Module=null,this._module=null,this._conditionsManager=new d(this._options.conditions,this._element),e.subscribe(this._conditionsManager,"ready",this._onInitialized.bind(this)),this._initialized=!this.isModuleConditioned()||this._conditionsManager.getSuitability(),this._available=!1};_.prototype={isModuleAvailable:function(){return this._available=this._conditionsManager.getSuitability(),this._available},isModuleActive:function(){return null!==this._module},isModuleConditioned:function(){return this._options.conditions!==void 0},hasInitialized:function(){return this._initialized},matchesPath:function(t){return this._path===t},_onInitialized:function(t){this._initialized=!0,e.subscribe(this._conditionsManager,"change",this._onConditionsChange.bind(this)),e.publish(this,"init",this),t&&this._onBecameAvailable()},_onBecameAvailable:function(){this._available=!0,e.publish(this,"available",this)},_onConditionsChange:function(){var t=this._conditionsManager.getSuitability();this._module&&!t&&this.unload(),!this._module&&t&&this._onBecameAvailable()},load:function(){if(this._Module)return this._onLoad(),void 0;var e=this;t([this._path],function(t){e._Module=t,e._onLoad()})},_onLoad:function(){if(this.isModuleAvailable()){var t,i=h.getModuleByPath(this._path),n=i?i.config:{},s={};if("string"==typeof this._options.options)try{s=JSON.parse(this._options.options)}catch(r){throw Error('ModuleController.load(): "options" is not a valid JSON string.')}else s=this._options.options;if(t=n?o(n,s):s,t=this._Module.options?o(this._Module.options,t):t,"function"==typeof this._Module?this._module=new this._Module(this._element,t):(this._module=this._Module.load?this._Module.load(this._element,t):null,this._module===void 0&&(this._module=this._Module)),!this._module)throw Error('ModuleController.load(): could not initialize module, missing constructor or "load" method.');this._element.setAttribute("data-initialized",this._path),e.inform(this._module,this),e.publish(this,"load",this)}},unload:function(){return this._available=!1,this._module?(e.conceal(this._module,this),this._module.unload&&this._module.unload(),this._element.removeAttribute("data-initialized"),this._module=null,e.publish(this,"unload",this),!0):!1},execute:function(t,e){if(!this._module)return{status:404,response:null};var i=this._module[t];if(!i)throw Error('ModuleController.execute(method,params): function specified in "method" not found on module.');return e=e||[],{status:200,response:i.apply(this._module,e)}}};var f=function(t){if(!t)throw Error('Node: "element" is a required parameter.');this._element=t,this._element.setAttribute("data-processed","true");var e=this._element.getAttribute("data-priority");this._priority=e?parseInt(e,10):0,this._moduleControllers=[],this._activeModuleController=null,this._activeModuleUnloadBind=this._onActiveModuleUnload.bind(this)};f.hasProcessed=function(t){return"true"===t.getAttribute("data-processed")},f.prototype={init:function(){this._moduleControllers=this._wrapModuleControllers();var t,i=0,n=this._moduleControllers.length;if(!n)throw Error('Node: "element" has to have a "data-module" attribute containing a reference to a Module.');for(;n>i;i++)t=this._moduleControllers[i],t.hasInitialized()?this._onModuleInitialized():e.subscribe(t,"init",this._onModuleInitialized.bind(this))},getPriority:function(){return this._priority},getElement:function(){return this._element},matchesSelector:function(t,e){return e&&!i(e,this._element)?!1:n(this._element,t,e)},hasLoadedModule:function(){return this._activeModuleController?this._activeModuleController.isModuleActive():!1},getActiveModuleController:function(){return this._activeModuleController},getModuleController:function(t){return this._getModuleControllers(t,!0)},getModuleControllers:function(t){return this._getModuleControllers(t)},_getModuleControllers:function(t,e){if(t===void 0)return e?this._moduleControllers[0]:this._moduleControllers.concat();for(var i,n=0,o=this._moduleControllers.length,s=[];o>n;n++)if(i=this._moduleControllers[n],i.matchesPath(t)){if(e)return i;s.push(i)}return e?null:s},execute:function(t,e){return this._activeModuleController?this._activeModuleController.execute(t,e):{status:404,response:null}},_onModuleInitialized:function(){for(var t=this._moduleControllers.length;--t>=0;)if(!this._moduleControllers[t].hasInitialized())return;this._onModulesInitialized()},_onModulesInitialized:function(){var t=this._getSuitableActiveModuleController();t&&this._setActiveModuleController(t);for(var i=0,n=this._moduleControllers.length;n>i;i++)e.subscribe(this._moduleControllers[i],"available",this._onModuleAvailable.bind(this))},_onModuleAvailable:function(t){for(var e,i=0,n=this._moduleControllers.length;n>i;i++)if(e=this._moduleControllers[i],e!==t&&e.isModuleAvailable()&&e.isModuleConditioned())return;this._setActiveModuleController(t)},_setActiveModuleController:function(t){t!==this._activeModuleController&&(this._cleanActiveModuleController(),this._activeModuleController=t,e.subscribe(this._activeModuleController,"unload",this._activeModuleUnloadBind),e.inform(this._activeModuleController,this),this._activeModuleController.load())},_cleanActiveModuleController:function(){this._activeModuleController&&(e.unsubscribe(this._activeModuleController,"unload",this._activeModuleUnloadBind),e.conceal(this._activeModuleController,this),this._activeModuleController.unload(),this._activeModuleController=null)},_onActiveModuleUnload:function(){this._cleanActiveModuleController();var t=this._getSuitableActiveModuleController();t&&this._setActiveModuleController(t)},_getSuitableActiveModuleController:function(){for(var t,e=0,i=this._moduleControllers.length;i>e;e++)if(t=this._moduleControllers[e],t.isModuleAvailable())return t;return null},_wrapModuleControllers:function(){var t=[],e=this._element.getAttribute("data-module")||"",i="["===e.charAt(0);if(i){var n;try{n=JSON.parse(e)}catch(o){throw Error('Node: "data-module" attribute containing a malformed JSON string.')}if(!n)return[];for(var s,r=n.length,u=0;r>u;u++)s=n[u],t.push(new _(s.path,this._element,{conditions:s.conditions,options:s.options}))}else e.length&&t.push(new _(e,this._element,{conditions:this._element.getAttribute("data-conditions"),options:this._element.getAttribute("data-options")}));return t}};var p=function(){this._options={modules:{}},this._nodes=[]};return p.prototype={setOptions:function(t){if(!t)throw Error('Conditioner.setOptions(options): "options" is a required parameter.');this._options=o(this._options,t);var e,i,n,s;for(i in this._options.modules)this._options.modules.hasOwnProperty(i)&&(n=this._options.modules[i],s="string"==typeof n?n:n.alias,e="string"==typeof n?null:n.options||{},h.registerModule(i,e,s))},loadModules:function(t){if(!t)throw Error('Conditioner.loadModules(context): "context" is a required parameter.');var e,i=t.querySelectorAll("[data-module]"),n=i.length,o=0,s=[];if(!i)return[];for(;n>o;o++)e=i[o],f.hasProcessed(e)||s.push(new f(e));for(s.sort(function(t,e){return t.getPriority()-e.getPriority()}),o=s.length;--o>=0;)s[o].init();return this._nodes=this._nodes.concat(s),s},getNode:function(t,e){return this._getNodes(t,e,!0)},getNodes:function(t,e){return this._getNodes(t,e)},_getNodes:function(t,e,i){if(t===void 0&&e===void 0)return i?this._nodes[0]:this._nodes.concat();for(var n,o=0,s=this._nodes.length,r=[];s>o;o++)if(n=this._nodes[o],n.matchesSelector(t,e)){if(i)return n;r.push(n)}return i?null:r}},new p});
define('security/StorageConsentGuard',['conditioner/Observer','conditioner/mergeObjects','module'],function(Observer,mergeObjects,module){

    

    // StorageConsentGuard
    var StorageConsentGuard = function() {

        // current level
        this._level = null;

        // set options
        this.setOptions(module.config());

        // set default level
        this._setDefaultLevel();
    };

    var p = StorageConsentGuard.prototype;

    p.setOptions = function(options) {

        if (!options) {
            options = {};
        }

        // sets initial options
        this._options = mergeObjects({
            'initial':'all',
            'levels':['all','none']
        },options);

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

        Observer.publish(this,'change',this._level);
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
define('tests/cookies',['conditioner/Observer','security/StorageConsentGuard'],function(Observer,StorageConsentGuard){

    

    var _level = '';

    return {

        /**
         * Listen to change even from storage consent guard
         * @param {function} measure
         */
        setup:function(measure) {

            // listen to changes on storage guard
            var guard = StorageConsentGuard.getInstance();
            Observer.subscribe(guard,'change',function() {
                measure();
            });

            // get active level
            _level = guard.getActiveLevel();
        },

        /**
         * Custom measure function to test if level changed
         * @returns {boolean} - Returns true if change occurred
         */
        measure:function() {

            // get guard reference
            var guard = StorageConsentGuard.getInstance();

            // get active level now it has changed
            var newLevel = guard.getActiveLevel();

            // if changed
            if (newLevel !== _level) {
                _level = newLevel;
                return true;
            }

            return false;
        },

        /**
         * test if expected level
         * @param {string} expected
         * @returns {boolean}
         */
        assert:function(expected) {
            return !!(expected.match(new RegExp(_level,'g')));
        }
    };

});


/**
 * Tests if an active network connection is available and monitors this connection
 * @module tests/connection
 */
define('tests/connection',[],function(){

    

    return {

        /**
         * Does this browser support the onLine property
         * @returns {boolean}
         */
        support:function() {
            return 'onLine' in navigator;
        },

        /**
         * setup events to listen for connection changes
         * @param {function} measure
         */
        setup:function(measure) {
            window.addEventListener('online',measure,false);
            window.addEventListener('offline',measure,false);
        },

        /**
         * Assert if the connection is the same as the expected value of the connection
         * @param {string} expected
         * @returns {boolean}
         */
        assert:function(expected) {
            return expected === 'any' && navigator.onLine;
        }
    };

});

/**
 * Tests if an elements dimensions match certain expectations
 * @module tests/element
 */
define('tests/element',[],function(){

    

    var _isVisible = function(element) {
        var viewHeight = window.innerHeight,
        bounds = element.getBoundingClientRect();
        return (bounds.top > 0 && bounds.top < viewHeight) || (bounds.bottom > 0 && bounds.bottom < viewHeight);
    };

    return {

        /**
         * Setup events that trigger reassertion of element
         * @param {function} measure
         */
        setup:function(measure) {
            window.addEventListener('resize',measure,false);
            window.addEventListener('scroll',measure,false);
        },

        /**
         * Assert if matches expected value
         * @param {string} expected
         * @param {Element} element
         * @returns {boolean}
         */
        assert:function(expected,element) {

            if (expected === 'seen') {
                if (!this._seen) {
                    this._seen = _isVisible(element);
                }
                return this._seen;
            }
            else {

                var parts = expected.split(':'),key,value;

                if (!parts) {
                    return false;
                }

                key = parts[0];
                value = parseInt(parts[1],10);

                if (key === 'min-width') {
                    return element.offsetWidth >= value;
                }
                else if (key === 'max-width') {
                    return element.offsetWidth <= value;
                }

            }

            return false;

        }
    };

});

/**
 * Tests if a media query is matched or not and listens to changes
 * @module tests/media
 */
define('tests/media',[],function(){

    

    return {

        /**
         * Does this browser support matchMedia
         * @returns {boolean}
         */
        support:function() {
            return 'matchMedia' in window;
        },

        /**
         * Custom arrange method to setup matchMedia listener for each test instance
         * @param {string} expected
         */
        arrange:function(expected) {

            // if testing for support
            if (expected === 'supported') {
                return;
            }

            // if is media query
            var self = this;
            this._mql = window.matchMedia(expected);
            this._mql.addListener(function(){
                self.onchange();
            });

        },

        /**
         * Tests if the assert succeeds
         * @param expected
         * @returns {boolean}
         */
        assert:function(expected) {

            // no support
            if (!this.supported()) {
                return false;
            }

            // test if supported
            if (expected === 'supported') {
                return this.supported();
            }

            // test media query
            return this._mql.matches;
        }

    };

});

/**
 * Tests if the user is using a pointer device
 * @module tests/pointer
 */
define('tests/pointer',[],function(){

    

    var _moves = 0;
    var _movesRequired = 2;

    return {

        /**
         * Setup events, detach events if no activity for 30 seconds
         * @param {function} measure
         */
        setup:function(measure){

            // start listening to mousemoves to deduce the availability of a pointer device
            document.addEventListener('mousemove',measure,false);
            document.addEventListener('mousedown',measure,false);

            // start timer, stop testing after 30 seconds
            setTimeout(function(){
                document.removeEventListener('mousemove',measure,false);
                document.removeEventListener('mousedown',measure,false);
            },30000);

        },

        /**
         * Custom measure function to count the amount of moves
         * @param {Event} e
         * @returns {boolean} - Return true if a change has occurred
         */
        measure:function(e) {

            if (e.type === 'mousemove') {

                _moves++;

                if (_moves >= _movesRequired) {

                    // stop listening to events
                    document.removeEventListener('mousemove',this,false);
                    document.removeEventListener('mousedown',this,false);

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
         * @param {string} expected
         * @returns {boolean}
         */
        assert:function(expected) {
            return expected === 'available' && _moves>=_movesRequired;
        }
    };

});

/**
 * Tests if the window dimensions match certain expectations
 * @module tests/window
 */
define('tests/window',[],function() {

    

    var _width = 0;

    return {

        /**
         * Listen to resize event to measure new window width
         * @param {function} measure
         */
        setup:function(measure) {
            window.addEventListener('resize',measure,false);
        },

        /**
         * Custom measure function to store window width before calling change
         * @returns {boolean}
         */
        measure:function() {

            _width = window.innerWidth || document.documentElement.clientWidth;

            return true;
        },

        /**
         * test if matches expected value
         * @param {string} expected
         * @returns {boolean}
         */
        assert:function(expected) {

            var parts = expected.split(':'),
                key = parts[0],
                value = parseInt(parts[1],10);

            if (key === 'min-width') {
                return _width >= value;
            }
            else if (key === 'max-width') {
                return _width <= value;
            }

            return false;

        }
    };

});

define('ui/Clock',[],function(){

    

    var _pad = function(n){return n<10 ? '0'+n : n;};

    // Clock Class
    var exports = function(element,options) {

        // set default options
        this._element = element;
        this._options = options;

        // backup content
        this._inner = this._element.innerHTML;

        // start ticking
        this._tick();
    };

    // default options
    exports.options = {
        'time':true
    };

    // update time
    exports.prototype._tick = function() {

        var self = this,
            now = new Date(),
            date = _pad(now.getDate()) + '/' + (now.getMonth()+1) + '/'+ now.getFullYear(),
            time = _pad(now.getHours()) + ':' + _pad(now.getMinutes()) + ':' + _pad(now.getSeconds());

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

    // unload clock
    exports.prototype.unload = function() {

        // stop ticking
        clearTimeout(this._timer);

        // restore content
        this._element.innerHTML = this._inner;

    };

    return exports;

});
define('ui/StorageConsentSelect',['security/StorageConsentGuard'],function(StorageConsentGuard){

    

    // StorageConsentSelect Class
    var exports = function(element,options) {

        // default options for this class
        this._element = element;
        this._options = options;

        // set reference to storage guard
        this._storageGuard = StorageConsentGuard.getInstance();

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

    // default module options
    exports.options = {
        'label':{
            'select':'Cookies',
            'level':{
                'all':'All',
                'none':'None'
            }
        }
    };

    // Handle events
    exports.prototype.handleEvent = function(e) {
        if (e.type === 'change') {
            var select = this._element.querySelector('select'),
                value = select.options[select.selectedIndex].value;

            // set active level
            this._storageGuard.setActiveLevel(value);
        }
    };

    // Unload StorageConsentSelect module
    exports.prototype.unload = function() {

        // remove event listener
        this._element.querySelector('select').removeEventListener('change',this);

        // restore original content
        this._element.innerHTML = this._inner;

    };

    return exports;

});
define('ui/StarGazers',[],function(){

    

    // StarGazers Class
    var exports = function(element,options) {

        // set element and options reference
        this._element = element;
        this._options = options;

        // backup content
        this._inner = this._element.innerHTML;

        // load stargazer
        this._load();
    };

    // default options
    exports.options = {
        'user':'mdo',
        'repo':'github-buttons',
        'width':80,
        'height':20,
        'count':true,
        'type':'watch'
    };

    // load component
    exports.prototype._load = function() {
        this._element.innerHTML = '<iframe src="http://ghbtns.com/github-btn.html?user=' + this._options.user + '&repo=' + this._options.repo + '&type=' + this._options.type + '&count=' + this._options.count + '"' +
            'allowtransparency="true" ' +
            'frameborder="0" ' +
            'scrolling="0" ' +
            'width="' + this._options.width + '" ' +
            'height="' + this._options.height + '"></iframe>';
    };

    // unload stargazers
    exports.prototype.unload = function() {

        // restore content
        this._element.innerHTML = this._inner;

    };

    return exports;

});