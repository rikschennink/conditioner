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

            it('will throw an error when no context supplied',function(){

                // act, assert
                var attemptToParseNodes = function(){conditioner.parse()};
                expect(attemptToParseNodes).to.throw(Error);

            });

        });

        describe('sync()',function(){

            var a, b, c, group, results;

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
                results = conditioner.parse(group);

            });

            it('will throw an error when passing undefined',function(){

                var syncIt = function(){
                    conditioner.sync(results[0],undefined,results[1],results[2]);
                };
                expect(syncIt).to.throw(Error);

            });

            it('will return a sync group object when passing Arguments',function(){

                var syncGroup = conditioner.sync(results[0],results[1],results[2]);
                expect(syncGroup).to.be.an('object');

            });

            it('will return a sync group object when passing Array',function(){

                var syncGroup = conditioner.sync(results);
                expect(syncGroup).to.be.an('object');

            });

        });

        describe('getModule(path,selector,context)',function(){

            var a, b, c, group, results;

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
                results = conditioner.parse(group);

            });

            it('will return the first module controller if no path supplied',function(){

                var mc = conditioner.getModule();
                expect(mc.getModulePath()).to.equal(a.getAttribute('data-module'));

            });

            it('will return the first matched module controller when a path is supplied',function(){

                var mc = conditioner.getModule('mock/bar');
                expect(mc.getModulePath()).to.equal(b.getAttribute('data-module'));

            });

            it('will return null if no matches found',function(){

                var mc = conditioner.getModule('mock/trololo');
                expect(mc).to.not.be.defined;

            });

        });

        describe('getModules(path,selector,context)',function(){

            var a, b, c, group, results;

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
                c.setAttribute('data-module','mock/baz');

                group = document.createElement('div');
                group.appendChild(a);
                group.appendChild(b);
                group.appendChild(c);

                // act
                results = conditioner.parse(group);

            });

            it('will return all module controllers if no path supplied',function(){

                var mcs = conditioner.getModules();
                expect(mcs.length).to.equal(results.length);

            });

            it('will return the first matched module controller when a path is supplied',function(){

                var mcs = conditioner.getModules('mock/foo','.beta');
                expect(mcs.length).to.equal(1);

            });

            it('will return empty array if no matches found',function(){

                var mcs = conditioner.getModules('mock/trololo');
                expect(mcs.length).to.equal(0);

            });

        });

        describe('test(expression)',function(){

            it('will return a promise',function(done){

                conditioner.test('media:{(min-width:40em)}').then(function(result){

                    expect(result).to.be.ok;

                    done();

                });

            });

        });

    });

});