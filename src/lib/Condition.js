var Condition = function(expression,callback){

    // get expression
    this._expression = expression;

    // on detect change callback
    this._change = callback;

    // default state is false
    this._currentState = false;

};

Condition.prototype = {

    evaluate:function(){

        var state = this._expression.isTrue();
        if (state!=this._currentState) {
            this._currentState = state;
            this._change(state);
        }

    }

};