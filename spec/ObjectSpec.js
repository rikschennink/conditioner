define(['lib/conditioner','lib/utils/Observer'],function(conditioner,Observer){

    'use strict';

    describe('Objects',function(){

        beforeEach(function(){

            // clean up any initialized nodes
            var nodes = conditioner.getNodes(),el;
            nodes.forEach(function(node){
                el = node.getElement();
                conditioner.destroyNode(node);
                el.parentNode.removeChild(el);
            });

        });

        describe('NodeController',function(){

            var node,element;

            beforeEach(function(done){

                // setup new module
                element = document.createElement('div');
                element.setAttribute('data-module', '[{"path":"mock/Foo"},{"path":"mock/Bar"}]');
                element.setAttribute('data-priority','10');
                document.body.appendChild(element);

                // initialize
                var results = conditioner.init();
                node = results[0];

                // ready
                done();

            });

            describe('getPriority()',function(){

                it('will return the correct node priority',function(){

                    expect(node.getPriority()).to.equal(10);

                });

            });

            describe('getElement()',function(){

                it('will return the correct element',function(){

                    expect(node.getElement()).to.equal(element);

                });

            });

            describe('areAllModuleActive()',function(){

                // immediately
                it('will return false when asking direct after init',function() {

                    expect(node.areAllModulesActive()).to.not.be.ok;

                });

                // on load
                it('will return true when asking after load',function(done) {

                    var counter = 0;

                    Observer.subscribe(node,'load',function(){

                        if (++counter<2){return;}

                        expect(node.areAllModulesActive()).to.be.ok;
                        done();

                    });

                });

            });

            describe('areAllModuleActive()',function(){

                // immediately
                it('will return no active module controllers when asking direct after init',function() {

                    expect(node.getActiveModuleControllers()).to.be.empty;

                });

                // immediately
                it('will return active module controllers when asking after load',function() {

                    Observer.subscribe(node,'load',function(){

                        expect(node.getActiveModuleControllers()).to.not.be.empty;
                        done();

                    });

                });

            });

            describe('getModuleController([path])',function(){

                it('will return the first module controller if no path supplied',function(){

                    var mc = node.getModuleController();
                    expect(mc).to.be.defined;

                });

                it('will return the first matched module controller when a path is supplied',function(){

                    var mc = node.getModuleController('mock/Foo');
                    expect(mc).to.be.defined;

                });

            });

            describe('getModuleControllers([path])',function(){

                it('will return the all module controllers if no path supplied',function(){

                    var mcs = node.getModuleControllers();
                    expect(mcs).to.be.an('array');
                    expect(mcs.length).to.equal(2);

                });

                it('will return the matched module controllers when a path is supplied',function(){

                    var mcs = node.getModuleControllers('mock/Bar');
                    expect(mcs).to.be.an('array');
                    expect(mcs[0].getModulePath()).to.equal('mock/Bar');

                });

            });

            describe('execute(method,[params])',function(){

                it('will return an array with a response for each module controller',function(){

                    var results = node.execute('ping');
                    expect(results).to.be.an('array');

                });

                it('will return a result object for each module controller in the array',function(){

                    var results = node.execute('ping');

                    expect(results[0].result).to.be.an('object');

                });

                it('will return 404 status when a module is not available',function(){

                    var results = node.execute('ping');

                    expect(results[0].result.status).to.equal(404);

                });

                it('will return 200 status when a module is available',function(done){

                    var counter=0;

                    Observer.subscribe(node,'load',function() {

                        if (++counter<2){return;}

                        var results = node.execute('ping');
                        expect(results[0].result.status).to.equal(200);

                        done();
                    });

                });

                it('will return the executed method\'s response when the module is available',function(done){

                    var counter=0;

                    Observer.subscribe(node,'load',function() {

                        if (++counter<2){return;}

                        var results = node.execute('ping');
                        expect(results[0].result.response).to.be.ok;

                        done();
                    });

                });

            });

        });

        describe('SyncedControllerGroup',function(){

            // 'load', 'unload'

            // destroy

        });

        describe('ModuleController',function(){

            // 'init', 'available', 'load', 'unload'

            // hasInitialized

            // getModulePath

            // isModuleAvailable

            // isModuleActive

            // wrapsModuleWithPath

            // execute

            // destroy


            var mc;

            beforeEach(function(done){

                // setup new module
                var element = document.createElement('div');
                element.setAttribute('data-module', 'IFoo');
                element.setAttribute('data-options',JSON.stringify({
                    'a':1,
                    'b':0,
                    'c':{
                        'foo':'baz'
                    },
                    'd':'bar',
                    'e':['d','e'],
                    'f':false
                }));
                document.body.appendChild(element);

                // act
                var results = conditioner.init({
                    'modules':{
                        'mock/Foo':{
                            'alias':'IFoo',
                            'options':{
                                'a':0,
                                'b':1,
                                'c':{
                                    'foo':'bar'
                                },
                                'd':'foo',
                                'e':['a','b','c'],
                                'f':true
                            }
                        }
                    }
                });

                // wait for module ready state
                Observer.subscribe(results[0],'load',function(moduleController){
                    mc = moduleController;
                    done();
                });

            });

            it ('will contain the correct options object after merging option levels',function() {

                // assert
                expect(mc._module._options.a).to.equal(1);
                expect(mc._module._options.b).to.equal(0);
                expect(mc._module._options.c.foo).to.equal('baz');
                expect(mc._module._options.d).to.equal('bar');
                expect(mc._module._options.e.length).to.equal(2);
                expect(mc._module._options.f).to.not.be.ok;

            });

            it ('will not contain an active module immidiately',function() {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'mock/foo');
                document.body.appendChild(element);

                // act
                var results = conditioner.init();

                // assert
                expect(results[0].areAllModulesActive()).to.not.be.ok;

            });

            describe('getModulePath()',function(){

                it('will return the correct path',function(){

                    expect(mc.getModulePath()).to.equal('mock/Foo');

                });

            });

            describe('wrapsModuleWithPath(path)',function(){

                it('will return the correct state when asked if it\'s module matches a given path',function(){

                    expect(mc.wrapsModuleWithPath('mock/Foo')).to.be.ok;

                });

                it('will return the correct state when asked if it\'s module matches a given alias',function(){

                    expect(mc.wrapsModuleWithPath('IFoo')).to.be.ok;

                });

            });

        });

    });

});