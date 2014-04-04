(function(){

	'use strict';

	describe('ModuleController',function(){

		it('will throw error when not passed a "path" or "element" in constructor',function(){

			// act, assert
			expect(function(){new ModuleController();}).toThrow(
                new Error('ModuleController(path,element,agent,options): "path" and "element" are required parameters.')
			);

		});

		it ('will return correct state when asked if the module matches a certain path',function() {

			// arrange
			var element = document.createElement('div');
			var path = '../spec/mock/foo';

			// act
			var mc = new ModuleController(path,element);

			// assert
			expect(mc.wrapsModuleWithPath('../spec/mock/foo')).toBeTruthy();
		});

        it ('will return the correct path when requesting path',function() {

            // arrange
            var element = document.createElement('div');
            var path = '../spec/mock/foo';

            // act
            var mc = new ModuleController(path,element);

            // assert
            expect(mc.getModulePath()).toEqual('../spec/mock/foo');
        });

        it ('will return the correct path when requesting path from aliased module',function() {

            // arrange
            var node = document.createElement('div');
            node.setAttribute('data-module','IFoo');

            // act
            var loader = new ModuleLoader();
            loader.setOptions({
                'modules':{
                    '../spec/mock/foo':'IFoo'
                }
            });
            var mc = new ModuleController('IFoo',node);

            // assert
            expect(mc.getModulePath()).toEqual('../spec/mock/foo');
        });

        it ('will return the correct options object after merging option levels',function() {

            // arrange
            var caught = false,node,loader,mc;

            loader = new ModuleLoader();
            loader.setOptions({
                'modules':{
                    '../spec/mock/foo':{
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

            runs(function(){

                // arrange
                node = document.createElement('div');
                mc = new ModuleController('../spec/mock/foo',node,{
                    'a':1,
                    'b':0,
                    'c':{
                        'foo':'baz'
                    },
                    'd':'bar',
                    'e':['d','e'],
                    'f':false
                });

                Observer.subscribe(mc,'load',function(){
                    caught = true;
                });

            });

            // act
            waitsFor(function(){
                return caught;
            },'event should have been caught',500);

            // assert
            runs(function(){
                expect(mc._module._options.a).toEqual(1);
                expect(mc._module._options.b).toEqual(0);
                expect(mc._module._options.c.foo).toMatch('baz');
                expect(mc._module._options.d).toMatch('bar');
                expect(mc._module._options.e.length).toEqual(2);
                expect(mc._module._options.f).toBe(false);
            });


        });

        /*
         it ('will return correct state when asked the module readiness',function(){

         // arrange
         var element = document.createElement('div');
         var path = '../spec/mock/foo';

         // act
         var mc = new ModuleController(path,element);

         // assert
         expect(mc.hasInitialized()).toBeTruthy();

         });

         it ('will return correct state when asked if the module is conditioned',function(){

         // arrange
         var element = document.createElement('div');
         var path = '../spec/mock/foo';

         // act
         var mc = new ModuleController(path,element);

         // assert
         expect(mc.isModuleConditioned()).toBeFalsy();

         });

         it ('will return correct state when asked if the wrapped module is suitable',function(){

         // arrange
         var element = document.createElement('div');
         var path = '../spec/mock/foo';

         // act
         var mc = new ModuleController(path,element);

         // assert
         expect(mc.isModuleAvailable()).toBeTruthy();

         });
         */

	});

}());