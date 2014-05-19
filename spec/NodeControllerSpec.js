define(function() {

    'use strict';

    describe('NodeController', function() {

        var el,nc;

        beforeEach(function() {

            // arrange
            el = document.createElement('div');

            // act
            nc = new NodeController(el,5);
            nc.load(
                [new ModuleController('mock/modules/foo',el),
                new ModuleController('mock/modules/bar',el),
                new ModuleController('mock/modules/baz',el)]
            );

        });

        describe('(element,[priority])', function () {

            it('will throw error when not passing all arguments', function () {

                // act, assert
                var createInstance = function () {new NodeController();};
                expect(createInstance).to.throw(Error);

            });

            it('will cause the passed element to have a "data-processed" attribute', function () {

                // assert
                expect(NodeController.hasProcessed(el)).to.be.ok;

            });

        });

        describe('.getPriority()', function () {

            it('will return the correct node priority',function(){

                // assert
                expect(nc.getPriority()).to.equal(5);

            });

        });

        describe('.load(controller)',function(){

            it('will throw an error when no controllers supplied',function(){

                // act, assert
                var loadControllers = function(){nc.load();};
                expect(loadControllers).to.throw(Error);

            });

        });

        describe('.getModule([path])',function(){

            it('will return the first module controller if no path supplied',function(){

                var mc = nc.getModule();
                expect(mc).to.be.defined;

            });

            it('will return the first matched module controller when a path is supplied',function(){

                var mc = nc.getModule('mock/modules/foo');
                expect(mc).to.be.defined;

            });

            it('will return null if no matches found',function(){

                var mc = nc.getModule('mock/modules/trololo');
                expect(mc).to.not.be.defined;

            });

        });

        describe('.getModules([path])',function(){

            it('will always return an array',function(){

                var mcs = nc.getModules();
                expect(mcs).to.be.an('array');

            });

            it('will return the all module controllers if no path supplied',function(){

                var mcs = nc.getModules();
                expect(mcs.length).to.equal(3);

            });

            it('will return the matched module controllers when a path is supplied',function(){

                var mcs = nc.getModules('mock/modules/bar');
                expect(mcs[0].getModulePath()).to.equal('mock/modules/bar');

            });

        });

        describe('.execute(method,[params])',function() {

            it('will return an array with a response for each module controller', function () {

                var results = nc.execute('ping');
                expect(results).to.be.an('array');

            });

            it('will return a result object for each module controller in the array', function () {

                var results = nc.execute('ping');
                expect(results[0].result).to.be.an('object');

            });

            it('will return 404 status when a module is not available', function () {

                var results = nc.execute('ping');

                expect(results[0].result.status).to.equal(404);

            });

            it('will return 200 status when a module is available', function (done) {

                var counter = 0;

                Observer.subscribe(nc,'load',function () {

                    if (++counter<3) {return;}

                    var results = nc.execute('ping');
                    expect(results[0].result.status).to.equal(200);

                    done();
                });

            });

            it('will return the executed method\'s response when the module is available', function (done) {

                var counter = 0;

                Observer.subscribe(nc, 'load', function () {

                    if (++counter<3) {return;}

                    var results = nc.execute('ping');
                    expect(results[0].result.response).to.be.ok;

                    done();
                });

            });

        });

        describe('"events"',function(){

            it('will receive "load" events from module controllers',function(done){

                var counter=0;
                Observer.subscribe(nc,'load',function(){
                    if(++counter<3){return;}
                    done();
                });

            });

            it('will receive "unload" events from module controllers',function(done){

                var counter=0;
                Observer.subscribe(nc,'load',function(){
                    if(++counter<3){return;}

                    Observer.subscribe(nc,'unload',function(){
                        done();
                    });

                    Observer.publish(nc.getModule(),'unload',this);
                });

            });

        });

    });

});