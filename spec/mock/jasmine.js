define(function(){
    var exports = function(){};
    exports.protoype = {
        ping:function() {
            Observer.publish(this,'ping');
        },
        unload:function() {

        }
    };
    return exports;
});