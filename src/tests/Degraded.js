define(['../conditioner/TestManager'],function(TestManager){

    var _baseFontSize = null;

    // override mediaquery test
    TestManager.defineTest(
        'media',
        function(handler,conditions) {

            if (!_baseFontSize) {
                var node = document.createElement('div');
                node.style.cssText = 'font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;';
                node.innerHTML = '&nbsp;';
                document.body.appendChild(node);
                _baseFontSize = node.offsetHeight;
                node.parentNode.removeChild(node);
            }

            window.addEventListener('resize',function(e){
                handler(conditions.value);
            });

            handler(conditions.value);

        },
        function(query) {

            var subs = query.split('and'),
                i=0,
                l=subs.length,
                width = (window.innerWidth || document.documentElement.clientWidth),
                sub,value,unit;

            for (;i<l;i++) {

                sub = subs[i];
                value = sub.replace(/[^\d]/g, '');
                unit = sub.split(value)[1];

                // convert from em to pixels
                if (unit.indexOf('em') > -1) {
                    value *= _baseFontSize;
                }

                // if is min width query
                if (sub.indexOf('min-width') > -1 && width < value) {
                    return false;
                }

                // if is max width query
                if (sub.indexOf('max-width') > -1 && width > value) {
                    return false;
                }

            }

            return true;

        }
    );

});