define(['lib/conditioner','lib/utils/Observer'],function(conditioner,Observer){

    'use strict';

    var toArray = function(nodeList){
        return Array.prototype.slice.call(nodeList);
    };

    describe('API',function() {

        beforeEach(function(){

            // clean up any initialized nodes
            var nodes = conditioner.getNodes(),el;
            nodes.forEach(function(node){
                el = node.getElement();
                conditioner.destroyNode(node);
                el.parentNode.removeChild(el);
            });

        });

        describe('init([options])', function () {

            it('will process elements attached to the DOM', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'mock/foo');
                document.body.appendChild(element);

                // act
                conditioner.init();

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

            it('will set options when passing an options object', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module','IFoo');
                document.body.appendChild(element);

                // act
                conditioner.init({
                    'modules': {
                        'mock/foo': {
                            'alias':'IFoo'
                        }
                    }
                });

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

        });

        describe('setOptions(options)', function () {

            it('will throw an error when not passed an options object',function(){

                // arrange
                var attemptToSetOptions = function(){conditioner.setOptions()};

                // act, assert
                expect(attemptToSetOptions).to.throw(Error);

            });

            it('will set options when passing an options object', function (done) {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'IFoo');
                document.body.appendChild(element);

                // act
                conditioner.setOptions({
                    'modules': {
                        'mock/foo':{
                            'options':{
                                'foo':10
                            }
                        }
                    }
                });

                var results = conditioner.init();

                // assert
                expect(results).to.be.an('array');

                Observer.subscribe(results[0],'load',function(){

                    expect(element.getAttribute('data-foo')).to.equal('10');

                    done();
                });

            });

            it('will set correct options when passing a module alias', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'IFoo');
                document.body.appendChild(element);

                // act
                conditioner.setOptions({
                    'modules': {
                        'mock/foo': {
                            'alias':'IFoo'
                        }
                    }
                });
                conditioner.init();

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

            it('will set correct options when passing a shortcut module alias', function () {

                // arrange
                var element = document.createElement('div');
                element.setAttribute('data-module', 'IFoo');
                document.body.appendChild(element);

                // act
                conditioner.setOptions({
                    'modules': {
                        'mock/foo':'IFoo'
                    }
                });
                conditioner.init();

                // assert
                expect(element.getAttribute('data-processed')).to.equal('true');

            });

        });

        describe('parse(context)',function(){

            it('will throw an error on malformed "data-module" attributes',function(){

                // arrange
                var a = document.createElement('div');
                a.setAttribute('data-module','mock/foo');

                var b = document.createElement('div');
                b.setAttribute('data-module','[{"mock/foo"},{]');

                var group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(b);

                // act, assert
                var attemptToParseNodes = function(){conditioner.parse(group)};
                expect(attemptToParseNodes).to.throw(Error);

            });

            it('will return exactly two nodes when asked to parse two nodes',function(){

                // arrange
                var a = document.createElement('div');
                a.setAttribute('data-module','mock/foo');

                var b = document.createElement('div');
                b.setAttribute('data-module','mock/foo');

                var group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(b);

                // act
                var results = conditioner.parse(group);

                // assert
                expect(results).to.be.an('array');
                expect(results.length).to.equal(2);

            });

            it('will return the right order of nodes when using the "data-priority" attribute',function(){

                // arrange
                var a = document.createElement('div');
                a.setAttribute('data-module','mock/foo');
                a.setAttribute('data-priority','-1');

                var b = document.createElement('div');
                b.setAttribute('data-priority','1');
                b.setAttribute('data-module','mock/foo');

                var c = document.createElement('div');
                c.setAttribute('data-module','mock/foo');

                var group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(b);
                group.appendChild(c);

                // act
                var results = conditioner.parse(group);

                // assert
                expect(results).to.be.an('array');
                expect(results[2].getPriority()).to.equal(1);
                expect(results[1].getPriority()).to.equal(0);
                expect(results[0].getPriority()).to.equal(-1);

            });

            it('will ignore an empty "data-conditions" attribute',function(){

                // arrange
                var a = document.createElement('div');
                a.setAttribute('data-module','mock/foo');
                a.setAttribute('data-conditions','');

                var group = document.createElement('div');
                group.appendChild(a);

                // act
                var results = conditioner.parse(group);

                // act, assert
                expect(results).to.be.an('array');
                expect(results.length).to.equal(1);

            });

            it('will instantiate correct node on module when using aliases',function(){

                // arrange
                var a = document.createElement('div');
                a.setAttribute('data-module','IFoo');

                var group = document.createElement('div');
                group.appendChild(a);

                // act
                conditioner.setOptions({
                    'modules':{
                        'mock/foo':'IFoo'
                    }
                });
                var results = conditioner.parse(group);

                // assert
                expect(results).to.be.an('array');
                expect(results.length).to.equal(1);

            });

            it('will load multiple modules simultaneously',function(done){

                // arrange
                var counter = 0;
                var a = document.createElement('div');
                a.setAttribute('data-module','[{"path":"mock/foo"},{"path":"mock/bar"},{"path":"mock/baz"}]');

                var group = document.createElement('div');
                group.appendChild(a);

                // act
                var results = conditioner.parse(group);

                Observer.subscribe(results[0],'load',function() {

                    // test if all modules loaded
                    if (++counter<3) {return;}

                    // assert
                    expect(results).to.be.an('array');
                    expect(results.length).to.equal(1);
                    expect(a.getAttribute('data-foo')).to.equal('1');
                    expect(a.getAttribute('data-bar')).to.equal('2');
                    expect(a.getAttribute('data-baz')).to.equal('2');

                    // now done
                    done();

                });

            });

        });

        describe('Node Queries',function() {

            var a, b, c, d, group, results;

            beforeEach(function(){

                // arrange
                a = document.createElement('div');
                a.id = 'a';
                a.className = 'alpha';
                a.setAttribute('data-module','mock/foo');

                b = document.createElement('div');
                b.id = 'b';
                b.className = 'beta';
                b.setAttribute('data-module','mock/foo');

                c = document.createElement('div');
                c.id = 'c';
                c.className = 'beta';
                c.setAttribute('data-module','mock/foo');

                d = document.createElement('div');
                d.id = 'd';
                d.className = 'beta';
                d.setAttribute('data-module','mock/foo');

                d.appendChild(b);
                d.appendChild(c);

                group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(d);

                // act
                results = conditioner.parse(group);

            });

            describe('getNode([selector,[context]])',function(){

                it('will return first node when given no parameters',function(){

                    // assert
                    expect(conditioner.getNode().getElement().id).to.equal(a.id);

                });

                it('will return the correct node when passing selector',function(){

                    // assert
                    expect(conditioner.getNode('.beta').getElement().id).to.equal(d.id);

                });

                it('will return the correct node when passing a selector within a context',function(){

                    // assert
                    expect(conditioner.getNode('.beta',d).getElement().id).to.equal(b.id);

                });

            });

            describe('getNodes([selector,[context]])',function() {

                it('will return all nodes when given no parameters', function () {

                    // assert
                    expect(conditioner.getNodes().length).to.equal(4);

                });

                it('will return specific nodes when matches on selector', function () {

                    // assert
                    expect(conditioner.getNodes('.beta').length).to.equal(3);

                });

                it('will return specific nodes when matches on selector within a context', function () {

                    // assert
                    expect(conditioner.getNodes('.beta',d).length).to.equal(2);

                });

            });


        });


    });

});