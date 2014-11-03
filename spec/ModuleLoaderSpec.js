define(function() {

    'use strict';

    describe('ModuleLoader', function() {

        describe('.parse(context)',function(){

            var a, b, c,results;

            beforeEach(function(){

                // arrange
                a = document.createElement('div');
                a.setAttribute('data-module','mock/modules/foo');
                a.setAttribute('data-priority','-1');

                b = document.createElement('div');
                b.setAttribute('data-priority','1');
                b.setAttribute('data-module','mock/modules/foo');

                c = document.createElement('div');
                c.setAttribute('data-module','mock/modules/foo');

                var group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(b);
                group.appendChild(c);

                // act
                var moduleLoader = new ModuleLoader();
                results = moduleLoader.parse(group);

            });

            it('will throw an error on malformed "data-module" attributes',function(){

                // arrange
                var a = document.createElement('div');
                a.setAttribute('data-module','["mock/modules/foo",]');

                var group = document.createElement('div');
                group.appendChild(a);

                // act, assert
                var attemptToParseNodes = function(){
                    var moduleLoader = new ModuleLoader();
                    moduleLoader.parse(group);
                };
                expect(attemptToParseNodes).to.throw(Error);

            });

			it('will not accept spaces in JSON within "data-module" attributes',function(){

				// arrange
				var a = document.createElement('div');
				a.setAttribute('data-module','[ {"path":"mock/modules/foo"}, {"path":"mock/modules/foo"}]');
				var group = document.createElement('div');
				group.appendChild(a);

				// act
				var moduleLoader = new ModuleLoader();
				results = moduleLoader.parse(group);

				// assert
				expect(results).to.be.an('array');

			});

            it('will always return an array',function(){

                // assert
                expect(results).to.be.an('array');
            });

            it('will return the right amount of node controllers',function(){

                // assert
                expect(results.length).to.equal(3);

            });

            it('will return the right order of nodes when using the "data-priority" attribute',function(){

                // assert
                expect(results[2].getPriority()).to.equal(1);
                expect(results[1].getPriority()).to.equal(0);
                expect(results[0].getPriority()).to.equal(-1);

            });

            it('will ignore an empty "data-conditions" attribute',function(){

                // arrange
                var a = document.createElement('div');
                a.setAttribute('data-module','mock/modules/foo');
                a.setAttribute('data-conditions','');

                var group = document.createElement('div');
                group.appendChild(a);

                // act
                var moduleLoader = new ModuleLoader();
                var results = moduleLoader.parse(group);

                // assert
                expect(results.length).to.equal(1);

            });

        });

        describe('.getNodes([selector,[context,[single]]])',function() {

            var a, b, c, d, group, results, moduleLoader;

            beforeEach(function(){

                // arrange
                a = document.createElement('div');
                a.id = 'a';
                a.className = 'alpha';
                a.setAttribute('data-module','mock/modules/foo');

                b = document.createElement('div');
                b.id = 'b';
                b.className = 'beta';
                b.setAttribute('data-module','mock/modules/foo');

                c = document.createElement('div');
                c.id = 'c';
                c.className = 'beta';
                c.setAttribute('data-module','mock/modules/foo');

                d = document.createElement('div');
                d.id = 'd';
                d.className = 'beta';
                d.setAttribute('data-module','mock/modules/foo');

                d.appendChild(b);
                d.appendChild(c);

                group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(d);

                // act
                moduleLoader = new ModuleLoader();
                results = moduleLoader.parse(group);

            });

            it('will return first node when given no parameters',function(){

                // assert
                expect(moduleLoader.getNodes(undefined,undefined,true).getElement().id).to.equal(a.id);

            });

            it('will return the correct node when passing selector',function(){

                // assert
                expect(moduleLoader.getNodes('.beta',undefined,true).getElement().id).to.equal(d.id);

            });

            it('will return the correct node when passing a selector within a context',function(){

                // assert
                expect(moduleLoader.getNodes('.beta',d,true).getElement().id).to.equal(b.id);

            });

            it('will return all nodes when given no parameters', function () {

                // assert
                expect(moduleLoader.getNodes(undefined,undefined,false).length).to.equal(4);

            });

            it('will return specific nodes when matches on selector', function () {

                // assert
                expect(moduleLoader.getNodes('.beta',undefined,false).length).to.equal(3);

            });

            it('will return specific nodes when matches on selector within a context', function () {

                // assert
                expect(moduleLoader.getNodes('.beta',d,false).length).to.equal(2);

            });

        });



    });



});