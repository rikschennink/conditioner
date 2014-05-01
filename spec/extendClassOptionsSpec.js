define(['lib/conditioner','lib/utils/Observer'],function(conditioner,Observer){

    'use strict';

    describe('Utils',function(){

        describe('extendClass',function(){

            it('will inherit parent page level options',function(done) {

                var node,group,results;
                node = document.createElement('div');
                node.setAttribute('data-module','mock/modules/baz');

                group = document.createElement('div');
                group.appendChild(node);

                // act
                conditioner.setOptions({
                    'modules':{
                        'mock/modules/foo':{
                            'options':{
                                'foo':2
                            }
                        },
                        'mock/modules/bar':{
                            'options':{
                                'bar':2
                            }
                        },
                        'mock/modules/baz':{
                            'options':{
                                'baz':2
                            }
                        }
                    }
                });

                // find modules
                results = conditioner.parse(group);

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