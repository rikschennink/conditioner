
'use strict';

describe('Node',function(){

    it('will throw error when not passed and "element" in constructor',function(){

        // arrange, oops forgot element
        // var element = document.createElement('div');

        // act, assert
        expect(function(){new Node();}).toThrow(
            new Error('Node(element): "element" is a required parameter.')
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

    it('will return the node priority in string format',function(){

        // arrange
        var element = document.createElement('div');
            element.setAttribute('data-priority',5);

        // act
        var node = new Node(element);

        // assert
        expect(node.getPriority()).toEqual('5');

    });

    it('will throw an error when no "data-module" attribute defined',function(){

        // arrange
        var element = document.createElement('div');

        // act
        var node = new Node(element);

        // assert
        expect(function(){node.init();}).toThrow(
            new Error('Node.init(): "element" has to have a "data-module" attribute containing a reference to a Module.')
        );

    });



});