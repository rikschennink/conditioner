(function(){

    'use strict';

    describe('extendClass',function(){

        it('will inherit parent page level options',function() {

            // arrange
            var node = document.createElement('div');
            node.setAttribute('data-module','../spec/mock/baz');

            var group = document.createElement('div');
            group.appendChild(node);

            // act
            var loader = new ModuleLoader();
            loader.setOptions({
                'modules':{
                    '../spec/mock/foo':{
                        'options':{
                            'foo':'2'
                        }
                    },
                    '../spec/mock/bar':{
                        'options':{
                            'bar':'2'
                        }
                    },
                    '../spec/mock/baz':{
                        'options':{
                            'baz':'2',
                            'bar':'4'
                        }
                    }
                }
            });

            // find modules
            var results = loader.parse(group);

            // sync load event of modules
            var syncedGroup = loader.sync(results);
            Observer.subscribe(syncedGroup,'load',function() {

                //console.info('result:',results[0]._activeModuleController._module._options);

                //console.info('child:',results[1]._activeModuleController._module._options);

            });

            // assert
            expect(results).toBeDefined();

        });

    });

}());