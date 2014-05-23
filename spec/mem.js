require.config({
    urlArgs:'bust=' + (new Date()).getTime(),
    map:{
        '*':{
            'conditioner':'../dist/dev/conditioner',
            'utils/Observer':'../dist/dev/utils/Observer',
            'utils/mergeObjects':'../dist/dev/utils/mergeObjects'
        }
    }
});

require(['conditioner','utils/Observer'],function(conditioner,Observer){

    var count = 1,till=Number.NaN,el,btn,start,stop,test,node,nodes,sg,load;

    stop = function(e) {
        till = count;

        e.target.removeEventListener('click',this);
        e.target.parentNode.removeChild(e.target);
    };

    start = function(e) {

        e.target.setAttribute('disabled','disabled');
        test();
        e.target.removeEventListener('click',this);

        btn = document.createElement('button');
        btn.setAttribute('type','button');
        btn.textContent = 'stop tests';
        btn.addEventListener('click',stop);
        document.body.appendChild(btn);

        btn = e.target;
    };


    btn = document.createElement('button');
    btn.setAttribute('type','button');
    btn.textContent = 'start tests';
    btn.addEventListener('click',start);
    document.body.appendChild(btn);

    load = function(){

        Observer.unsubscribe(sg,'load',load);

        // remove dom nodes
        nodes.forEach(function(node){
            el = node.getElement();
            el.parentNode.removeChild(el);
        });

        // destroy controllers
        conditioner.destroy(nodes);

        // clear nodes array
        nodes = null;

        // destroy sg
        sg.destroy();

        // remove sg
        sg = null;

        if (isNaN(count) || count++ >= till) {
            btn.textContent = 'ran ' + count + ' tests';
            return;
        }

        setTimeout(function(){
            test();
        },10);

    };

    test = function() {

        btn.textContent = 'running test ' + count;

        node = document.createElement('div');
        node.textContent = 'foo ' + count;
        node.setAttribute('data-module','mock/modules/mem');
        document.body.appendChild(node);

        nodes = conditioner.parse(document.body);
        sg = conditioner.sync(nodes);

        Observer.subscribe(sg,'load',load);

    };


});