define(function(){

    'use strict';

    describe('Utils',function(){

        describe('extendClass',function(){

            it('will inherit parent page level options',function(done) {

                var node,group,results;
                node = document.createElement('div');
                node.setAttribute('data-module','mock/modules/baz');

                group = document.createElement('div');
                group.appendChild(node);


                ModuleRegistry.registerModule('mock/modules/foo',{
                    'foo':2
                });

                ModuleRegistry.registerModule('mock/modules/bar',{
                    'bar':2
                });

                ModuleRegistry.registerModule('mock/modules/baz',{
                    'baz':2
                });

                // find modules
                var loader = new ModuleLoader();
                results = loader.parse(group);

                // wait for load event to fire
                Observer.subscribe(results[0],'load',function() {

                    expect(node.getAttribute('data-foo')).to.equal('2');
                    expect(node.getAttribute('data-bar')).to.equal('2');
                    expect(node.getAttribute('data-baz')).to.equal('2');

                    done();
                });

            });

        });

    });

});