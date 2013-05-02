
'use strict';

describe('Node',function(){

    it('will throw error when not passed "element" to constructor',function(){

        // arrange, oops forgot element
        // var element = document.createElement('div');

        // act, assert
        expect(function(){new Node();}).toThrow(
            new Error('Node(element): "element" is a required parameter.')
        );

    });




});