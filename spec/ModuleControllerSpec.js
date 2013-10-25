(function(){

	'use strict';

	describe('ModuleController',function(){

		it('will throw error when not passed a "path" or "element" in constructor',function(){

			// act, assert
			expect(function(){new ModuleController();}).toThrow(
				new Error('ModuleController(path,element,options): "path" and "element" are required parameters.')
			);

		});

		it ('will return correct state when asked the module readiness',function(){

			// arrange
			var element = document.createElement('div');
			var path = '../spec/mock/jasmine';

			// act
			var mc = new ModuleController(path,element);

			// assert
			expect(mc.hasInitialized()).toBeTruthy();

		});

		it ('will return correct state when asked if the module is conditioned',function(){

			// arrange
			var element = document.createElement('div');
			var path = '../spec/mock/jasmine';

			// act
			var mc = new ModuleController(path,element);

			// assert
			expect(mc.isModuleConditioned()).toBeFalsy();

		});

		it ('will return correct state when asked if the wrapped module is available',function(){

			// arrange
			var element = document.createElement('div');
			var path = '../spec/mock/jasmine';

			// act
			var mc = new ModuleController(path,element);

			// assert
			expect(mc.isModuleAvailable()).toBeTruthy();

		});

		it ('will return correct state when asked if the module matches a certain path',function() {

			// arrange
			var element = document.createElement('div');
			var path = '../spec/mock/jasmine';

			// act
			var mc = new ModuleController(path,element);

			// assert
			expect(mc.matchesPath('../spec/mock/jasmine')).toBeTruthy();
		});

		it ('will not contain an active module after unloading the module',function() {

			// arrange
			var element = document.createElement('div');
			var path = '../spec/mock/jasmine';

			// act
			var mc = new ModuleController(path,element);
			mc.unload();

			// assert
			expect(mc.isModuleActive()).toBeFalsy();
		});

	});

}());