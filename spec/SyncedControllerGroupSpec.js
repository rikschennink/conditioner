define(['lib/utils/Observer'],function(Observer){

    describe('SyncedControllerGroup',function(){

        var a, b, c, syncGroup, group, results;

        beforeEach(function(){

            // arrange
            a = document.createElement('div');
            a.id = 'a';
            a.className = 'alpha';
            a.setAttribute('data-module','mock/foo');

            b = document.createElement('div');
            b.id = 'b';
            b.className = 'beta';
            b.setAttribute('data-module','mock/bar');

            c = document.createElement('div');
            c.id = 'c';
            c.className = 'beta';
            c.setAttribute('data-module','mock/baz');

            group = document.createElement('div');
            group.appendChild(a);
            group.appendChild(b);
            group.appendChild(c);

            // act
            var moduleLoader = new ModuleLoader();
            results = moduleLoader.parse(group);

            // group
            syncGroup = new SyncedControllerGroup(results);

        });

        describe('destroy()',function(){

            it('will clean up after calling the destroy method',function(done){

                Observer.subscribe(syncGroup,'load',function(){

                    var block = false;
                    Observer.subscribe(syncGroup,'unload',function(){
                        block = true;
                    });

                    // destroy group
                    syncGroup.destroy();

                    // publish fake unload event
                    Observer.publish(results[0],'unload');

                    // should reach this point
                    if (!block) {
                        done();
                    }

                });

            });

        });

        describe('areAllModulesActive()',function(){

            it('will return true if all modules are in sync',function(done){

                Observer.subscribe(syncGroup,'load',function(){

                    expect(syncGroup.areAllModulesActive()).to.be.ok;
                    done();

                });

            });

        });

        describe('"events"',function(){

            it('will fire a \'load\' event once all modules in the group have loaded',function(done){

                Observer.subscribe(syncGroup,'load',function(){
                    done();
                });

            });

            it('will fire an \'unload\' event once a module in the group unloads',function(done){

                Observer.subscribe(syncGroup,'load',function(){

                    Observer.subscribe(syncGroup,'unload',function(){
                        done();
                    });

                    // publish fake unload event
                    Observer.publish(results[0],'unload');

                });


            });

        });

    });


});