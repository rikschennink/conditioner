(function(){

	'use strict';

	describe('ModuleLoader',function(){

		it('will throw error when passing no value to setOptions()',function(){

			// arrange, oops forgot to set options
			// var options = {}

			// act
			var loader = new ModuleLoader();

			// assert
			expect(function(){loader.setOptions();}).toThrow(
				new Error('ModuleLoader.setOptions(options): "options" is a required parameter.')
			);

		});

		it('will return exactly two nodes when asked to parse a certain part of the DOM',function(){

			// arrange
			var a = document.createElement('div');
			a.setAttribute('data-module','mock/jasmine');

			var b = document.createElement('div');
			b.setAttribute('data-module','mock/jasmine');

			var group = document.createElement('div');
			group.appendChild(a);
			group.appendChild(b);

			// act
			var loader = new ModuleLoader();
			var results = loader.parse(group);

			// assert
			expect(function(){return typeof results !== 'undefined'}).toBeTruthy();
			expect(results.length).toEqual(2);

		});

		it('will return the right order of nodes when using the data-priority attribute',function(){

			// arrange
			var a = document.createElement('div');
			a.setAttribute('data-module','mock/jasmine');
			a.setAttribute('data-priority','-1');

			var b = document.createElement('div');
			b.setAttribute('data-priority','1');
			b.setAttribute('data-module','mock/jasmine');

			var c = document.createElement('div');
			c.setAttribute('data-module','mock/jasmine');

			var group = document.createElement('div');
			group.appendChild(a);
			group.appendChild(b);
			group.appendChild(c);

			// act
			var loader = new ModuleLoader();
			var results = loader.parse(group);

			// assert
			expect(function(){return typeof results !== 'undefined'}).toBeTruthy();
			expect(results[2].getPriority()).toEqual(1);
			expect(results[1].getPriority()).toEqual(0);
			expect(results[0].getPriority()).toEqual(-1);

		});

		it('will return the correct node when calling "getNode()"',function(){

			// arrange
			var a = document.createElement('div');
			a.id = 'a';
			a.setAttribute('data-module','mock/jasmine');

			var b = document.createElement('div');
			b.id = 'b';
			b.setAttribute('data-module','mock/jasmine');

			var group = document.createElement('div');
			group.appendChild(a);
			group.appendChild(b);

			// act
			var loader = new ModuleLoader();
			loader.parse(group);

			// assert
			expect(loader.getNode('#b')).toBeDefined();

		});

        it('will throw an error on malformed "data-module" attributes',function(){

            // arrange
            var a = document.createElement('div');
            a.id = 'a';
            a.setAttribute('data-module','mock/jasmine');

            var b = document.createElement('div');
            b.id = 'b';
            b.setAttribute('data-module','[{"mock/jasmine"},{]');

            var group = document.createElement('div');
            group.appendChild(a);
            group.appendChild(b);

            // act
            var loader = new ModuleLoader();

            // assert
            expect(function(){loader.parse(group);}).toThrow(
                new Error('ModuleLoader.load(context): "data-module" attribute contains a malformed JSON string.')
            );

        });

        /*

         it('will return a module controller reference when "data-module" attribute defined',function(){

         // arrange
         var element = document.createElement('div');
         element.setAttribute('data-module','mock/jasmine');

         // act
         var node = new Node(element);
         node.init();
         var result = node.getModuleController('mock/jasmine');

         // assert
         expect(function(){return typeof result !== 'undefined'}).toBeTruthy();

         });

         it('will return a multiple module controllers when "data-module" attribute contains JSON config',function(){

         // arrange
         var element = document.createElement('div');
         element.setAttribute('data-module','[{"path":"mock/jasmine"},{"path":"mock/jasmine"}]');

         // act
         var node = new Node(element);
         node.init();
         var result = node.getModuleControllers('mock/jasmine');

         // assert
         expect(function(){return typeof result !== 'undefined'}).toBeTruthy();
         expect(result instanceof Array).toBeTruthy();

         });

         it('will throw an error on malformed "data-module" attributes',function(){

         // arrange
         var element = document.createElement('div');
         element.setAttribute('data-module','[{"mock/jasmine"},{]');

         // act
         var node = new Node(element);

         // assert
         expect(function(){node.init();}).toThrow(
         new Error('Node: "data-module" attribute containing a malformed JSON string.')
         );

         });

         */

	});

}());
