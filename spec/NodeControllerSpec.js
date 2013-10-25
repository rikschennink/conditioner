(function(){

	'use strict';

	describe('NodeController',function(){

		it('will throw error when not passed and "element" in constructor',function(){

			// arrange, oops forgot element
			// var element = document.createElement('div');

			// act, assert
			expect(function(){new NodeController();}).toThrow(
				new Error('NodeController(element): "element" is a required parameter.')
			);

		});

		it('will cause the passed element to have a "data-processed" attribute after instance has been created',function(){

			// arrange
			var element = document.createElement('div');

			// act
			var node = new NodeController(element);

			// assert
			expect(NodeController.hasProcessed(element)).toEqual(true);

		});

		it('will return the node priority in number format',function(){

			// arrange
			var element = document.createElement('div');
			element.setAttribute('data-priority','5');

			// act
			var node = new NodeController(element);

			// assert
			expect(node.getPriority()).toEqual(5);

		});

		it('will throw an error when no controllers supplied to load method.',function(){

			// arrange
			var element = document.createElement('div');

			// act
			var node = new NodeController(element);

			// assert
			expect(function(){node.load();}).toThrow(
				new Error('NodeController.load(controllers): Expects an array of module controllers as parameters.')
			);

		});

        it('will return a module controller reference when "data-module" attribute defined',function(){

            // arrange
            var element = document.createElement('div');
            var node = new NodeController(element);
            node.load([new ModuleController('../spec/mock/jasmine',element)]);

            // act
            var mc = node.getModuleController();

            // assert
            expect(mc).toBeDefined();

        });

        it('will return two module controllers when multiple controllers are passed to the load method',function(){

            // arrange
            var element = document.createElement('div');
            var node = new NodeController(element);
            node.load([
                new ModuleController('../spec/mock/jasmine',element),
                new ModuleController('../spec/mock/jasmine',element)
            ]);

            // act
            var mcs = node.getModuleControllers();

            // assert
            expect(mcs).toBeDefined();
            expect(mcs.length).toEqual(2);

        });

        it('will receive load event fired by the active module controller',function(){

            // arrange
            var caught = false,node,element;

            runs(function(){

                // arrange
                element = document.createElement('div');
                node = new NodeController(element);

                Observer.subscribe(node,'load',function(){
                    caught = true;
                });

                // act
                node.load([
                    new ModuleController('../spec/mock/jasmine',element)
                ]);

            });

            // act
            waitsFor(function(){
                return caught;
            },'event should have been caught',50);

            // assert
            runs(function(){
                expect(caught).toBe(true);
            });

        });





	});

}());