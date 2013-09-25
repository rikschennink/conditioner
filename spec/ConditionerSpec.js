(function(){

	'use strict';

	describe('Conditioner',function(){

		it('will throw error when passing no value to setOptions()',function(){

			// arrange, oops forgot to set options
			// var options = {}

			// act
			var conditioner = new Conditioner();

			// assert
			expect(function(){conditioner.setOptions();}).toThrow(
				new Error('Conditioner.setOptions(options): "options" is a required parameter.')
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
			var conditioner = new Conditioner();
			var results = conditioner.loadModules(group);

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
			var conditioner = new Conditioner();
			var results = conditioner.loadModules(group);

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
			var conditioner = new Conditioner();
			conditioner.loadModules(group);

			// assert
			//expect(conditioner.getNode('#b')).toBeDefined();

		});

	});

}());
