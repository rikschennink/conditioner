function mergeObjects(obj1,obj2){
    var obj3 = {},attr;
    for (attr in obj1) { obj3[attr] = obj1[attr]; }
    for (attr in obj2) { obj3[attr] = obj2[attr]; }
    return obj3;
}