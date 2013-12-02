/*


## Inheritance / Composites problems with passing / inheriting options.

Map.options = {
    'zoom':2
};


require('conditioner/extends','ui/Map',function(_extends,_super){

    var QuickMap = _extends(_super,function(){
        // constructor
    });

    QuickMap.options.add({
        'foo':'bar'
    });

    return QuickMap;

});
*/


define(['utils/mergeObjects'],function(mergeObjects){

    return function(parent,child) {

        // copy options
        child.options = parent.options ? mergeObjects(parent.options,{}) : {};

        // copy prototype
        child.prototype = Object.create(parent.prototype);

        // return the constructor
        return child;

    }

});
