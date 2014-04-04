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

            // act
            var node = new NodeController(element,5);

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
            node.load(new ModuleController('../spec/mock/foo',element));

            // act
            var mc = node.getModuleController();

            // assert
            expect(mc).toBeDefined();

        });

        it('will return two module controllers when multiple controllers are passed to the load method',function(){

            // arrange
            var element = document.createElement('div');
            var node = new NodeController(element);
            node.load(
                new ModuleController('../spec/mock/foo',element),
                new ModuleController('../spec/mock/foo',element)
            );

            // act
            var mcs = node.getModuleControllers();

            // assert
            expect(mcs).toBeDefined();
            expect(mcs.length).toEqual(2);

        });

        it('will load all module controllers when multiple module controllers are passed to the load method',function(){

            var caught = false,node,element;

            runs(function(){

                // arrange
                var element = document.createElement('div');
                var a = new ModuleController('../spec/mock/foo',element),
                    b = new ModuleController('../spec/mock/bar',element),
                    c = new ModuleController('../spec/mock/baz',element);

                node = new NodeController(element);
                node.load(a,b,c);

                setTimeout(function(){
                    caught = true;
                },50);

            });

            waitsFor(function(){

                return caught;

            },'modules should load',100);

            // assert
            runs(function(){

                var mcs = node.getActiveModuleControllers();

                // assert
                expect(mcs).toBeDefined();
                expect(mcs.length).toEqual(3);

            });

        });

        it('will receive load event fired by an active module controller',function(){

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
                node.load(
                    new ModuleController('../spec/mock/foo',element)
                );

            });

            // act
            waitsFor(function(){
                return caught;
            },'event should have been caught',500);

            // assert
            runs(function(){
                expect(caught).toBe(true);
            });

        });

        it ('will load multiple modules simultaneously',function(){

            // arrange
            var caught = false,node,element;

            runs(function(){

                element = document.createElement('div');
                node = new NodeController(element);

                Observer.subscribe(node,'load',function(){
                    caught = true;
                });

                // act
                node.load(
                    new ModuleController('../spec/mock/foo',element),
                    new ModuleController('../spec/mock/bar',element),
                    new ModuleController('../spec/mock/baz',element)
                );

            });

            // act
            waitsFor(function(){
                return caught;
            },'event should have been caught',500);

            // assert
            runs(function(){
                expect(element.getAttribute('data-initialized')).toEqual('../spec/mock/foo,../spec/mock/bar,../spec/mock/baz');
            });

        });

        /*
         it ('will not contain an active module after unloading the module',function() {

         // arrange
         var element = document.createElement('div');
         var path = '../spec/mock/foo';

         // act
         var mc = new ModuleController(path,element);
         mc.unload();

         // assert
         expect(mc.isModuleActive()).toBeFalsy();
         });
         */


        /*

        - configuratie uit data-module="..." trekken, nu totaal onleesbaar

        - pass prio to module, modules will be initialized in order of array


         [
             {
                "path":"ui/Clock"
             },
             {
                "path":"ui/Clock"
             }
         ]




         [
            {
                "path":"ui/Clock",
                "conditions":"element:{max-width:200}",
                "options":{"time":false}
            },
            {
                "conditions":"element:{min-width:201}",
                "path":"ui/Clock"
            }
        ]

        */


	});

}());