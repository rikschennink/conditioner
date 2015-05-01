define(function(){

    'use strict';

    describe('API',function() {

        afterEach(function(cb){

            var nodes = conditioner.getNodes(),el,clean,sg;
            if (!nodes.length) {
                cb();
                return;
            }

            clean = function() {

                nodes.forEach(function(node){
                    el = node.getElement();
                    conditioner.destroy(node);
                    el.parentNode.removeChild(el);
                });

                sg.destroy();

                cb();

            };

            sg = conditioner.sync(nodes);

            if(sg.areAllModulesActive()) {

                clean();

                return;
            }

            Observer.subscribe(sg,'load',function(){

                clean();

            });

        });

        describe('init([options])', function () {

            it('will process elements attached to the DOM', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'mock/modules/foo');
                document.body.appendChild(element);

                // act
                conditioner.init();

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

            it('will set options when passing an options object', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module','IFoo');
                document.body.appendChild(element);

                // act
                conditioner.init({
                    'modules': {
                        'mock/modules/foo': {
                            'alias':'IFoo'
                        }
                    }
                });

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

        });

        describe('setOptions(options)', function () {

            it('will throw an error when not passed an options object',function(){

                // arrange
                var attemptToSetOptions = function(){conditioner.setOptions()};

                // act, assert
                expect(attemptToSetOptions).to.throw(Error);

            });

            it('will set options when passing an options object', function (done) {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module','mock/modules/foo');
                document.body.appendChild(element);

                // act
                conditioner.setOptions({
                    'modules':{
                        'mock/modules/foo':{
                            'options':{
                                'foo':10
                            }
                        }
                    }
                });

                var results = conditioner.init();

                expect(results).to.be.an('array');

                Observer.subscribe(results[0],'load',function(){

                    // assert
                    expect(element.getAttribute('data-foo')).to.equal('10');

                    done();
                });

            });

            it('will set correct options when passing a module alias', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'IFoo');
                document.body.appendChild(element);

                // act
                conditioner.setOptions({
                    'modules': {
                        'mock/modules/foo': {
                            'alias':'IFoo'
                        }
                    }
                });
                conditioner.init();

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

            it('will set correct options when passing a shortcut module alias', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'IFoo');
                document.body.appendChild(element);

                // act
                conditioner.setOptions({
                    'modules': {
                        'mock/modules/foo':'IFoo'
                    }
                });
                conditioner.init();

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

            it('will not load module module if requirements resolves to false',function(){

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'mock/modules/unsupported');
                document.body.appendChild(element);

                // act
                conditioner.setOptions({
                    'modules': {
                        'mock/modules/unsupported':{

                            // a feature test should result in this boolean
                            'enabled':false //

                        }
                    }
                });
                conditioner.init();

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');
                expect(element.getAttribute('data-initialized')).to.not.contain('mock/modules/unsupported');

            });

            afterEach(function(){
                conditioner.setOptions({
                    'modules': {
                        'mock/modules/unsupported':{
                            'enabled':true
                        }
                    }
                });
            });
        });

        describe('parse(context)',function(){

            it('will throw an error when no context supplied',function(){

                // act, assert
                var attemptToParseNodes = function(){conditioner.parse()};
                expect(attemptToParseNodes).to.throw(Error);

            });

        });

        describe('load()',function(){

            it('will throw an error when no controllers supplied',function(){

                var attemptToLoadNode = function(){conditioner.load(document.createElement('div'))};
                expect(attemptToLoadNode).to.throw(Error);

            });

        });

        describe('sync()',function(){

            var a, b, c, group, results;

            beforeEach(function(){

                // arrange
                a = document.createElement('div');
                a.id = 'a';
                a.className = 'alpha';
                a.setAttribute('data-module','mock/modules/foo');

                b = document.createElement('div');
                b.id = 'b';
                b.className = 'beta';
                b.setAttribute('data-module','mock/modules/bar');

                c = document.createElement('div');
                c.id = 'c';
                c.className = 'beta';
                c.setAttribute('data-module','mock/modules/baz');

                group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(b);
                group.appendChild(c);

                // act
                results = conditioner.parse(group);

            });

            it('will return a sync group object when passing Array',function(){

                var syncGroup = conditioner.sync(results);
                expect(syncGroup).to.be.an('object');

            });

            it('will return a sync group object when passing Arguments',function(){

                var syncGroup = conditioner.sync(results[0],results[1],results[2]);
                expect(syncGroup).to.be.an('object');

            });

            it('will throw an error when passing undefined',function(){

                var syncIt = function(){
                    conditioner.sync(results[0],undefined,results[1],results[2]);
                };
                expect(syncIt).to.throw(Error);

            });
        });

        describe('getModule(...)',function(){

            var a, b, c, group, results, wrapper;

            beforeEach(function(){

                // arrange
                a = document.createElement('div');
                a.id = 'a';
                a.className = 'alpha';
                a.setAttribute('data-module','mock/modules/foo');

                b = document.createElement('div');
                b.id = 'b';
                b.className = 'beta';
                b.setAttribute('data-module','mock/modules/bar');

                c = document.createElement('div');
                c.id = 'c';
                c.className = 'beta';
                c.setAttribute('data-module','mock/modules/baz');

                group = document.createElement('div');
				group.className = 'alpha';
				group.setAttribute('data-module','["mock/modules/foo","mock/modules/bar"]');
                group.appendChild(a);
                group.appendChild(b);
                group.appendChild(c);

				wrapper = document.createElement('div');
				wrapper.appendChild(group);

                // act
                results = conditioner.parse(wrapper);

            });

            it('will return the first module controller',function(){

                var mc = conditioner.getModule();
                expect(mc.getElement()).to.equal(group);

            });

			it('will return the module controller on the given element',function(){

				var mc = conditioner.getModule(c);
				expect(mc.getElement()).to.equal(c);

			});

			it('will return the module controller with the supplied path on the given element',function(){

				var mc = conditioner.getModule(group,'mock/modules/bar');
				expect(mc.getElement()).to.equal(group);
				expect(mc.getModulePath()).to.equal('mock/modules/bar');

			});

            it('will return the first matched module controller if only a path is supplied',function(){

                var mc = conditioner.getModule('mock/modules/bar');
                expect(mc.getElement()).to.equal(group);

            });

			it('will return the correct module controller if path and context is supplied',function(){

				var mc = conditioner.getModule('mock/modules/bar',group);
				expect(mc.getElement()).to.equal(b);

			});

			it('will return the correct module controller if path and filter are supplied',function(){

				var mc = conditioner.getModule('mock/modules/bar','.beta');
				expect(mc.getElement()).to.equal(b);

			});

			it('will return the correct module controller if path, filter and context is supplied',function(){

				var mc = conditioner.getModule('mock/modules/bar','.beta',group);
				expect(mc.getElement()).to.equal(b);

			});

			it('will return null if no matches found',function(){

				var mc = conditioner.getModule('mock/modules/trololo');
				expect(mc).to.not.be.defined;

			});

        });

        describe('getModules(...)',function(){

			var a, b, c, group, results, wrapper;

			beforeEach(function(){

				// arrange
				a = document.createElement('div');
				a.id = 'a';
				a.className = 'alpha';
				a.setAttribute('data-module','mock/modules/foo');

				b = document.createElement('div');
				b.id = 'b';
				b.className = 'beta';
				b.setAttribute('data-module','mock/modules/bar');

				c = document.createElement('div');
				c.id = 'c';
				c.className = 'beta';
				c.setAttribute('data-module','mock/modules/baz');

				group = document.createElement('div');
				group.className = 'alpha';
				group.setAttribute('data-module','["mock/modules/foo","mock/modules/bar"]');
				group.appendChild(a);
				group.appendChild(b);
				group.appendChild(c);

				wrapper = document.createElement('div');
				wrapper.appendChild(group);

				// act
				results = conditioner.parse(wrapper);

			});

            it('will return all module controllers if no path supplied',function(){

                var mcs = conditioner.getModules();
                expect(mcs.length).to.equal(5);

            });

			it('will return the module controllers on the given element',function(){

				var mcs = conditioner.getModules(group);
				expect(mcs.length).to.equal(2);

			});

			it('will return the correct module controllers on the element with given path',function(){

				var mcs = conditioner.getModules(group,'mock/modules/foo');
				expect(mcs.length).to.equal(1);

			});

			it('will return the first matched module controller when a path is supplied',function(){

                var mcs = conditioner.getModules('mock/modules/foo','.alpha');
                expect(mcs[0].getElement()).to.equal(group);
				expect(mcs[1].getElement()).to.equal(a);

            });

            it('will return empty array if no matches found',function(){

                var mcs = conditioner.getModules('mock/modules/trololo');
                expect(mcs.length).to.equal(0);

            });

        });


		describe('getNode(...)',function(){

			var a, b, c, group, results, wrapper;

			beforeEach(function(){

				// arrange
				a = document.createElement('div');
				a.id = 'a';
				a.className = 'alpha';
				a.setAttribute('data-module','mock/modules/foo');

				b = document.createElement('div');
				b.id = 'b';
				b.className = 'beta';
				b.setAttribute('data-module','mock/modules/bar');

				c = document.createElement('div');
				c.id = 'c';
				c.className = 'beta';
				c.setAttribute('data-module','mock/modules/baz');

				group = document.createElement('div');
				group.className = 'alpha';
				group.setAttribute('data-module','["mock/modules/foo","mock/modules/bar"]');
				group.appendChild(a);
				group.appendChild(b);
				group.appendChild(c);

				wrapper = document.createElement('div');
				wrapper.appendChild(group);

				// act
				results = conditioner.parse(wrapper);

			});

			it('will return node controller attached to the element if element supplied',function(){

				var nc = conditioner.getNode(c);
				expect(nc.getElement()).to.equal(c);

			});

			it('will return node controller on the element matched with the given query',function(){

				var nc = conditioner.getNode('.alpha');
				expect(nc.getElement()).to.equal(group);

			});

            it('will return node controller on the element matched with the given query and context',function(){

                var nc = conditioner.getNode('.beta',group);
                expect(nc.getElement()).to.equal(b);

            });

		});

        describe('destroy()',function(){

            var a, b, c, d, group, results;

            beforeEach(function(){

                // arrange
                a = document.createElement('div');
                a.id = 'a';
                a.className = 'alpha';
                a.setAttribute('data-module','mock/modules/foo');

                b = document.createElement('div');
                b.id = 'b';
                b.className = 'beta';
                b.setAttribute('data-module','mock/modules/foo');

                c = document.createElement('div');
                c.id = 'c';
                c.className = 'beta';
                c.setAttribute('data-module','mock/modules/foo');

                d = document.createElement('div');
                d.id = 'd';
                d.className = 'beta';
                d.setAttribute('data-module','mock/modules/foo');

                d.appendChild(b);
                d.appendChild(c);

                group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(d);

                // act
                results = conditioner.parse(group);

            });

            it('will throw an error when no parameters passed',function(){

                var destroyIt = function(){conditioner.destroy();};
                expect(destroyIt).to.throw(Error);

            });

            it('will destroy a single NodeController',function(){

                var success = conditioner.destroy(results[0]);

                expect(success).to.be.ok;
                expect(a.getAttribute('data-processed')).to.be.a('null');
                expect(b.getAttribute('data-processed')).to.equal('true');
                expect(c.getAttribute('data-processed')).to.equal('true');
                expect(d.getAttribute('data-processed')).to.equal('true');

            });

            it('will destroy an Array of NodeControllers',function(){

                var success = conditioner.destroy(results);

                expect(success).to.be.ok;
                expect(a.getAttribute('data-processed')).to.be.a('null');
                expect(b.getAttribute('data-processed')).to.be.a('null');
                expect(c.getAttribute('data-processed')).to.be.a('null');
                expect(d.getAttribute('data-processed')).to.be.a('null');

            });

            it('will destroy an NodeControllers found in a given context',function(){

                var success = conditioner.destroy(d);

                expect(success).to.be.ok;
                expect(a.getAttribute('data-processed')).to.be.equal('true');
                expect(b.getAttribute('data-processed')).to.be.a('null');
                expect(c.getAttribute('data-processed')).to.be.a('null');
                expect(d.getAttribute('data-processed')).to.be.equal('true');

            });

            it('will destroy an NodeControllers found with a given selector',function(){

                var success = conditioner.destroy('.beta');

                expect(success).to.be.ok;
                expect(a.getAttribute('data-processed')).to.equal('true');
                expect(b.getAttribute('data-processed')).to.be.a('null');
                expect(c.getAttribute('data-processed')).to.be.a('null');
                expect(d.getAttribute('data-processed')).to.be.a('null');

            });




        });

        describe('is(conditions)',function(){

            it('will throw an error when no test passed',function(){

                var testIt = function(){conditioner.is();};
                expect(testIt).to.throw(Error);

            });

            it('will return a promise',function(){

                expect(conditioner.is('single:{true}').then).to.be.defined;

            });

            it('will call resolve method on test assertion success',function(done){

                conditioner.is('single:{true}').then(
                    function(state){
                        expect(state).to.be.ok;
                        done();
                    }
                );

            });

            it('will call reject method on test assertion failure',function(done){

                conditioner.is('single:{false}').then(
                    function(state){
                        expect(state).to.not.be.ok;
                        done();
                    }
                );

            });

        });

    });

});