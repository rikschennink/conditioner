define(function() {

    'use strict';

    describe('MonitorFactory',function(){

        describe('create(test,element)',function(){

            var factory;

            beforeEach(function(){

                factory = new MonitorFactory();

            });

            it('will return the correct watches for a single value',function(done){

                factory.create(new Test('/single','true')).then(
                    function(watches){

                        expect(watches.length).to.equal(1);
                        expect(watches[0].data.expected).to.equal('true');

                        done();
                    }
                );

            });

            it('will return the correct watches when using comma separated values',function(done){

                factory.create(new Test('/single','a,b,c')).then(
                    function(watches){

                        expect(watches.length).to.equal(3);
                        expect(watches[0].data.expected).to.equal('a');
                        expect(watches[1].data.expected).to.equal('b');
                        expect(watches[2].data.expected).to.equal('c');

                        done();
                    }
                );

            });

            it('will return the correct watches when using custom "parse" method',function(done){

                factory.create(new Test('/custom','a,b,c')).then(
                    function(watches){

                        expect(watches.length).to.equal(1);
                        expect(watches[0].data.expected).to.be.instanceof(Array);
                        expect(watches[0].data.expected).to.have.members(['a','b','c']);

                        done();
                    }
                );

            });

            it('will return the correct watches for a split value',function(done){

                factory.create(new Test('/multiple','foo:1')).then(
                    function(watches){

                        expect(watches.length).to.equal(1);
                        expect(watches[0].data.expected).to.equal('1');

                        done();
                    }
                );

            });



        });

    });

});