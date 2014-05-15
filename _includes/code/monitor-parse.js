parse:function(value){

    var parts = value.split('_');

    return {
        test:parts[0],
        expected:parts[1]
    }
}