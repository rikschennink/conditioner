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

    var count=0,done=false,el,btnStart,btnStop,start,stop,test,node,nodes,sg,load;

    stop = function(e) {

        done = true;

        btnStop.removeEventListener('click',this);
        btnStop.parentNode.removeChild(btnStop);
        btnStop = null;

        btnStart.parentNode.removeChild(btnStart);
        btnStart = null;

    };

    start = function(e) {

        btnStart.setAttribute('disabled','disabled');
        test();
        btnStart.removeEventListener('click',this);

        btnStop = document.createElement('button');
        btnStop.setAttribute('type','button');
        btnStop.textContent = 'stop tests';
        btnStop.addEventListener('click',stop);
        document.body.appendChild(btnStop);

    };


    btnStart = document.createElement('button');
    btnStart.setAttribute('type','button');
    btnStart.textContent = 'start tests';
    btnStart.addEventListener('click',start);
    document.body.appendChild(btnStart);

    load = function(){

        Observer.unsubscribe(sg,'load',load);

        // remove dom nodes
        nodes.forEach(function(node){
            el = node.getElement();
            el.parentNode.removeChild(el);
        });

        // destroy controllers
        conditioner.destroy(nodes);

        // destroy sg
        sg.destroy();

        // clear nodes array
        nodes = null;
        node = null;
        el = null;
        sg = null;

        if (done) {
            document.body.innerHTML += 'ran ' + count + ' tests.';
            return;
        }

        setTimeout(function(){
            test();
        },10);

    };

    test = function() {

        count++;

        btnStart.textContent = 'running test #' + count;

        node = document.createElement('div');
        node.textContent = 'test #' + count;
        node.setAttribute('data-module','mock/modules/mem');
        node.setAttribute('data-options','frame:' + count % 50);
        node.setAttribute('data-conditions','element:{min-width:0} and media:{(min-width:0em)}');
        document.body.appendChild(node);

        nodes = conditioner.parse(document.body);
        sg = conditioner.sync(nodes);

        Observer.subscribe(sg,'load',load);

    };


});