define(['lib/utils/Observer'],function(Observer){

    'use strict';

    describe('ModuleController',function(){

        var element,path,mc;

        beforeEach(function(){

            element = document.createElement('div');
            path = 'mock/foo';
            mc = new ModuleController(path,element);

        });

        describe('(path,element,[options,[agent]])',function(){

            it('will throw error when not passed a "path" or "element" in constructor',function(){

                // act, assert
                var createInstance = function(){new ModuleController();};
                expect(createInstance).to.throw(Error);

            });

        });

        describe('.hasInitialized()',function(){

            it ('will return true after correct module instantiation',function(){

                // assert
                expect(mc.hasInitialized()).to.be.ok;

            });

        });

        describe('.isModuleAvailable()',function(){

            it ('will return true for a default module',function(){

                // assert
                expect(mc.isModuleAvailable()).to.be.ok;

            });

        });

        describe('.getModulePath()',function(){

            it('will return the correct path',function(){

                expect(mc.getModulePath()).to.equal('mock/foo');

            });

        });

        describe('.wrapsModuleWithPath(path)',function(){

            it('will return the correct state when asked if it\'s module matches a given path',function(){

                expect(mc.wrapsModuleWithPath('mock/foo')).to.be.ok;

            });

        });

    });

});