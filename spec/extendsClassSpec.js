(function(){

    'use strict';

    /*

    [v] - Inherit options from parent class.
    [x] - When constructing modules, use page level options and parent level options to create child options set.

    */

    describe('extendClass',function(){

        it('will copy parent class options to child',function(){

            // arrange
            var Foo = function() {};
            Foo.options = {'foo':'bar'};

            // act
            var Bar = extendClass(Foo,function() {
                // Bar constructor
            });

            // assert
            expect(Bar.options).toBeDefined();
            expect(Bar.options.foo).toBe('bar');

        });

    });

    it('will inherit parent page level options',function() {

        // arrange
        var Foo = function() {};
        Foo.options = {'foo':'bar'};

        var Bar = extendClass(Foo,function() {
            // Bar constructor
        });

        // create dom nodes
        var a = document.createElement('div');
        a.setAttribute('data-module','../spec/mock/foo');

        var b = document.createElement('div');
        b.setAttribute('data-module','../spec/mock/bar');

        var group = document.createElement('div');
        group.appendChild(a);
        group.appendChild(b);

        // act
        var loader = new ModuleLoader();
        loader.parse(group);

        // assert


    });

}());