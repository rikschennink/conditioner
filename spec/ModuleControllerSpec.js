define(function(){

    'use strict';

    describe('ModuleController',function(){

        var element,path,mc;

        beforeEach(function(){

            element = document.createElement('div');
            path = 'mock/modules/foo';

        });

        describe('(path,element,[options,[agent]])',function(){

            it('will throw error when not passed a "path" or "element" in constructor',function(){

                // act, assert
                var createInstance = function(){new ModuleController();};
                expect(createInstance).to.throw(Error);

            });

        });

        describe('(path,element,[options,[agent]])',function(){

            it('will publish load event when ready',function(cb){

                mc = new ModuleController(path,element);

                Observer.subscribe(mc,'load',function(){
                    cb();
                });

            });

        });

        describe('.hasInitialized()',function(){

            it ('will return true after correct module instantiation',function(){

                // assert
                mc = new ModuleController(path,element);
                expect(mc.hasInitialized()).to.be.ok;

            });

        });

        describe('.isModuleAvailable()',function(){

            it ('will return true for a default module',function(){

                // assert
                mc = new ModuleController(path,element);
                expect(mc.isModuleAvailable()).to.be.ok;

            });

        });

        describe('.getModulePath()',function(){

            it('will return the correct path',function(){

                mc = new ModuleController(path,element);
                expect(mc.getModulePath()).to.equal('mock/modules/foo');

            });

        });

        describe('.wrapsModuleWithPath(path)',function(){

            it('will return the correct state when asked if it\'s module matches a given path',function(){

                mc = new ModuleController(path,element);
                expect(mc.wrapsModuleWithPath('mock/modules/foo')).to.be.ok;

            });

        });

        describe('(path,element,options,[agent])',function(){

            it('will parse options object',function(cb){

                mc = new ModuleController(path,element,{foo:2,level:{a:'test',b:[0,3],c:'alt',d:2.2}});

                Observer.subscribe(mc,'load',function(){

                    expect(mc._module._options.foo).to.equal(2);
                    expect(mc._module._options.level.a).to.equal('test');
                    expect(mc._module._options.level.b).to.eql([0,3]);
                    expect(mc._module._options.level.c).to.equal('alt');
                    expect(mc._module._options.level.d).to.equal(2.2);

                    cb();
                });

            });

            it('will parse options json string',function(cb){

                mc = new ModuleController(path,element,'{"foo":2,"level":{"a":"test","b":[0,3],"c":"alt","d":2.2}}');

                Observer.subscribe(mc,'load',function(){

                    expect(mc._module._options.foo).to.equal(2);
                    expect(mc._module._options.level.a).to.equal('test');
                    expect(mc._module._options.level.b).to.eql([0,3]);
                    expect(mc._module._options.level.c).to.equal('alt');
                    expect(mc._module._options.level.d).to.equal(2.2);

                    cb();
                });

            });

            it('will parse options string',function(cb){

                mc = new ModuleController(path,element,'foo:2, level.a:test, level.b:0,3, level.c:\'alt\', level.d:2.2');

                Observer.subscribe(mc,'load',function(){

                    expect(mc._module._options.foo).to.equal(2);
                    expect(mc._module._options.level.a).to.equal('test');
                    expect(mc._module._options.level.b).to.eql([0,3]);
                    expect(mc._module._options.level.c).to.equal('alt');
                    expect(mc._module._options.level.d).to.equal(2.2);

                    cb();
                });

            });

        });

    });

});