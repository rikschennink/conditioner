
'use strict';

describe('Node',function(){

	it('will throw error when not passed and "element" in constructor',function(){

		// arrange, oops forgot element
		// var element = document.createElement('div');

		// act, assert
		expect(function(){new Node();}).toThrow(
			new Error('Node: "element" is a required parameter.')
		);

	});

	it('will cause the passed element to have a "data-processed" attribute after instance has been created',function(){

		// arrange
		var element = document.createElement('div');

		// act
		var node = new Node(element);

		// assert
		expect(Node.hasProcessed(element)).toEqual(true);

	});

	it('will return the node priority in number format',function(){

		// arrange
		var element = document.createElement('div');
			element.setAttribute('data-priority','5');

		// act
		var node = new Node(element);

		// assert
		expect(node.getPriority()).toEqual(5);

	});

	it('will throw an error when no "data-module" attribute defined',function(){

		// arrange
		var element = document.createElement('div');

		// act
		var node = new Node(element);

		// assert
		expect(function(){node.init();}).toThrow(
			new Error('Node: "element" has to have a "data-module" attribute containing a reference to a Module.')
		);

	});

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
		var result = node.getModuleControllerAll('mock/jasmine');

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

});