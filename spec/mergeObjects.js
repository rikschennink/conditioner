
'use strict';

describe('mergeObjects',function(){

    it('will try to merge two simple objects',function(){

        var obj = mergeObjects({'foo':0},{'bar':1});

        expect(obj.foo).toBe(0);
        expect(obj.bar).toBe(1);

    });

    it('will try to merge two complex objects',function(){

        var obj = mergeObjects({'foo':{'bar':0}},{'bar':1});

        expect(obj.foo).toBeDefined();
        expect(obj.foo.bar).toBe(0);
        expect(obj.bar).toBe(1);

    });

});
