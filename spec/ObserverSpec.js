define(function() {

    'use strict';

    describe('Utils',function() {

        // setup mock object
        var Mock = function (async) {
            if (async) {
                Observer.publishAsync(this, 'load');
            }
            else {
                Observer.publish(this, 'load')
            }
        };

        Mock.prototype = {
            ping: function () {
                Observer.publish(this, 'ping');
            }
        };


        describe('Observer', function () {

            describe('.subscribe(object,event,callback)', function () {

                it('will attach events', function () {

                    // arrange
                    var caught = false;
                    var mock = new Mock();
                    Observer.subscribe(mock, 'ping', function () {
                        caught = true;
                    });

                    // act
                    mock.ping();

                    // assert
                    expect(caught).to.equal(true);
                });

                it('will miss sync events', function () {

                    // arrange
                    var caught = false;
                    var mock = new Mock();

                    // act
                    Observer.subscribe(mock, 'load', function () {
                        caught = true;
                    });

                    // assert
                    expect(caught).to.equal(false);
                });

                it('will catch async events', function (done) {

                    var mock = new Mock(true);
                    Observer.subscribe(mock, 'load', function () {
                        done();
                    });

                });

            });

            describe('.unsubscribe(object,event)', function () {

                it('will detach events', function () {

                    // arrange
                    var caught = false;
                    var mock = new Mock();
                    Observer.subscribe(mock, 'ping', function () {
                        caught = true;
                    });

                    // act
                    Observer.unsubscribe(mock, 'ping');
                    mock.ping();

                    // assert
                    expect(caught).to.equal(false);
                });

            });

            describe('.inform(informer,receiver)', function () {

                it('will pass events to receiver', function () {

                    // arrange
                    var caught = false;
                    var mock = new Mock();
                    Observer.subscribe(mock, 'ping', function () {
                        caught = true;
                    });

                    var superMock = new Mock();
                    Observer.inform(superMock, mock);

                    // act
                    superMock.ping();

                    // assert
                    expect(caught).to.equal(true);

                });

            });

            describe('.conceal(informer,receiver)', function () {

                it('will stop events from being passed to receiver', function () {

                    // arrange
                    var caught = false;
                    var mock = new Mock();
                    Observer.subscribe(mock, 'ping', function () {
                        caught = true;
                    });

                    var superMock = new Mock();
                    Observer.inform(superMock, mock);

                    // act
                    Observer.conceal(superMock, mock);
                    superMock.ping();

                    // assert
                    expect(caught).to.equal(false);

                });

            });

        });

    });

});