(function(){

    'use strict';

    describe('extendClass',function(){

        it('will inherit parent page level options',function() {

            var node,group,loader,results,syncedGroup,synced = false;

            // arrange
            runs(function(){

                node = document.createElement('div');
                node.setAttribute('data-module','mock/baz');

                group = document.createElement('div');
                group.appendChild(node);

                // act
                loader = new ModuleLoader();
                loader.setOptions({
                    'modules':{
                        'mock/foo':{
                            'options':{
                                'foo':2
                            }
                        },
                        'mock/bar':{
                            'options':{
                                'bar':2
                            }
                        },
                        'mock/baz':{
                            'options':{
                                'baz':2
                            }
                        }
                    }
                });

                // find modules
                results = loader.parse(group);

                // wait for load
                Observer.subscribe(results[0],'load',function() {
                    synced = true;
                });

            });

            // act
            waitsFor(function() {
                return synced;
            },'module group sync',100);

            // assert
            runs(function(){

                expect(node.getAttribute('data-foo')).toBe('2');
                expect(node.getAttribute('data-bar')).toBe('2');
                expect(node.getAttribute('data-baz')).toBe('2');

            });

        });

    });

}());