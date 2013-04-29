
/**
 * @namespace ExpressionFormatter
 */
var ExpressionFormatter = {

    /**
     * Returns the amount of sub expressions contained in the supplied expression
     * @memberof ExpressionFormatter
     * @param expression {string}
     * @returns {Number}
     * @public
     */
    getExpressionsCount:function(expression) {
        return expression.match(/(\:\{)/g).length;
    },

    /**
     * Parses an expression in string format and returns the same expression formatted as an expression tree
     * @memberof ExpressionFormatter
     * @param expression {string}
     * @returns {Array}
     * @public
     */
    toExpressionTree:function(expression) {

        var i=0,
            c,
            k,
            n,
            op,
            ol,
            operator,
            path = '',
            tree = [],
            value = '',
            isValue = false,
            target = null,
            flattened = null,
            parent = null,
            parents = [],
            l=expression.length;


        if (!target) {
            target = tree;
        }

        // read explicit expressions
        for (;i<l;i++) {

            c = expression.charAt(i);

            // check if an expression
            if (c === '{') {

                // now reading the expression
                isValue = true;

                // reset path var
                path = '';

                // fetch path
                k = i-2;
                while(k>=0) {
                    n = expression.charAt(k);
                    if (n === ' ' || n === '(') {
                        break;
                    }
                    path = n + path;
                    k--;
                }

                // on to the next character
                continue;

            }
            else if (c === '}') {

                // add value and
                target.push({'path':path,'value':value});

                // reset vars
                path = '';
                value = '';

                // no longer a value
                isValue = false;

                // on to the next character
                continue;
            }

            // if we are reading an expression add characters to expression
            if (isValue) {
                value += c;
                continue;
            }

            // if not in expression
            if (c === ' ' || i===0) {

                // get operator
                operator = expression.substr(i,5).match(/and |or |not /g);

                // if operator found
                if (operator) {

                    // get reference and calculate length
                    op = operator[0];
                    ol = op.length-1;

                    // add operator
                    target.push(op.substring(0,ol));

                    // skip over operator
                    i+=ol;

                }
            }

            // check if goes up a level
            if (c === '(') {

                // create new empty array in target
                target.push([]);

                // remember current target (is parent)
                parents.push(target);

                // set new child slot as new target
                target = target[target.length-1];

            }
            else if (c === ')' || i === l-1) {

                // reset flattened data
                flattened = null;

                // get parent
                parent = parents.pop();

                // if only contains single element flatten array
                if (target.length === 1 || (parent && parent.length===1 && i===l-1)) {
                    flattened = target.concat();
                }

                // restore parent
                target = parent;

                // if data defined
                if (flattened && target) {

                    target.pop();

                    for (k=0;k<flattened.length;k++) {
                        target.push(flattened[k]);
                    }

                }

            }
        }

        // turn into explicit expression
        ExpressionFormatter._makeExplicit(tree);

        console.log(JSON.stringify(tree));

        // return final expression tree
        return tree.length === 1 ? tree[0] : tree;

    },

    /**
     * Turns an implicit array of expressions into an explicit array of expressions
     * @memberof ExpressionFormatter
     * @param {Array} level
     * @private
     */
    _makeExplicit:function(level) {

        var i=0,l=level.length,groupSize=0;

        for (;i<l;i++) {

            // count amount of objects at this level
            if (typeof level[i] === 'object') {
                groupSize++;
            }

            // if has two objects and not end of level
            if (groupSize === 2 && i+1<l) {

                level.splice(0,i+1,level.slice(0,i+1));

                // set new length
                l = level.length;

                // move back to start
                i=-1;
                groupSize = 0;

            }

            if (level[i] instanceof Array) {
                ExpressionFormatter._makeExplicit(level[i]);
            }

        }

    }

};

window.ExpressionFormatter = ExpressionFormatter;