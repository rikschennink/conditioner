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