define(['conditioner'],function(conditioner){

    'use strict';

    describe('Conditioner',function(){

        it('will cause a processed element to have a "data-processed"',function(){

            // arrange
            var element = document.createElement('div');
            element.setAttribute('data-module','mock/foo');
            document.body.appendChild(element);

            // act
            conditioner.init();

            // assert
            expect(element.getAttribute('data-processed')).toEqual('true');

        });

    });

});