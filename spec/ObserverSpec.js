(function(){

    'use strict';

    var Mock = function(async){
        if (async) {
            Observer.publishAsync(this,'load');
        }
        else {
            Observer.publish(this,'load')
        }
    };

    Mock.prototype = {
        ping:function() {
            Observer.publish(this,'ping');
        }
    };


    describe('Observer',function(){

        it('will catch events',function(){

            // arrange
            var caught = false;
            var mock = new Mock();
            Observer.subscribe(mock,'ping',function(){
                caught = true;
            });

            // act
            mock.ping();

            // assert
            expect(caught).toBe(true);
        });

        it('will not catch events after having unsubscribed',function(){

            // arrange
            var caught = false;
            var mock = new Mock();
            Observer.subscribe(mock,'ping',function(){
                caught = true;
            });

            // act
            Observer.unsubscribe(mock,'ping');
            mock.ping();

            // assert
            expect(caught).toBe(false);
        });

        it('will allow catching events on secondary objects when using inform',function(){

            // arrange
            var caught = false;
            var mock = new Mock();
            Observer.subscribe(mock,'ping',function(){
                caught = true;
            });

            var superMock = new Mock();
            Observer.inform(superMock,mock);

            // act
            superMock.ping();

            // assert
            expect(caught).toBe(true);

        });

        it('will allow concealing of events when used inform',function(){

            // arrange
            var caught = false;
            var mock = new Mock();
            Observer.subscribe(mock,'ping',function(){
                caught = true;
            });

            var superMock = new Mock();
            Observer.inform(superMock,mock);

            // act
            Observer.conceal(superMock,mock);
            superMock.ping();

            // assert
            expect(caught).toBe(false);

        });


        it('will not catch sync events published in constructor',function(){

            // arrange
            var caught = false;
            var mock = new Mock();

            // act
            Observer.subscribe(mock,'load',function(){
                caught = true;
            });

            // assert
            expect(caught).toBe(false);
        });

        it('will catch async events published in constructor',function(){

            // arrange
            var caught = false;

            runs(function(){

                var mock = new Mock(true);
                Observer.subscribe(mock,'load',function(){
                    caught = true;
                });

            });

            // act
            waitsFor(function(){
                return caught;
            },'event should have been caught',50);

            // assert
            runs(function(){
                expect(caught).toBe(true);
            });
        });


    });

}());