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
        return expression.match(/(:\{)/g).length;
    },

    /**
     * Parses an expression in string format and returns the same expression formatted as an expression tree
     * @memberof ExpressionFormatter
     * @param expression {string}
     * @returns {Array}
     * @public
     */
    fromString:function(expression) {

        var i=0,
            path = '',
            tree = [],
            value = '',
            negate = false,
            isValue = false,
            target = null,
            parent = null,
            parents = [],
            l=expression.length,
            lastIndex,
            index,
            operator,
            j,
            c,
            k,
            n,
            op,
            ol,
            tl;

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

                lastIndex = target.length-1;
                index = lastIndex+1;

                // negate if last index contains not operator
                negate = target[lastIndex] === 'not';

                // if negate overwrite not operator location in array
                index = negate ? lastIndex : lastIndex+1;

                // add expression
                target[index] = new UnaryExpression({'path':path,'value':value},negate);

                // reset vars
                path = '';
                value = '';

                negate = false;

                // no longer a value
                isValue = false;
            }

            // if we are reading an expression add characters to expression
            if (isValue) {
                value += c;
                continue;
            }

            // if not in expression
            // check if goes up a level
            if (c === '(') {

                // create new empty array in target
                target.push([]);

                // remember current target (is parent)
                parents.push(target);

                // set new child slot as new target
                target = target[target.length-1];

            }

            // find out if next set of characters is a logical operator
            if (c === ' ' || i===0 || c === '(') {

                operator = expression.substr(i,5).match(/and |or |not /g);
                if (!operator) {
                    continue;
                }

                // get reference and calculate length
                op = operator[0];
                ol = op.length-1;

                // add operator
                target.push(op.substring(0,ol));

                // skip over operator
                i+=ol;
            }

            // expression or level finished, time to clean up
            if (c === ')' || i === l-1) {

                do {

                    // get parent reference
                    parent = parents.pop();

                    // if contains zero elements = ()
                    if (target.length === 0) {

                        // zero elements added revert to parent
                        target = parent;

                        continue;
                    }

                    // if more elements start the grouping process
                    j=0;
                    tl=target.length;

                    for (;j<tl;j++) {

                        if (typeof target[j] !== 'string') {
                            continue;
                        }

                        // handle not expressions first
                        if (target[j] === 'not') {
                            target.splice(j,2,new UnaryExpression(target[j+1],true));

                            // rewind
                            j = -1;
                            tl = target.length;
                        }
                        // handle binary expression
                        else if (target[j+1] !== 'not') {
                            target.splice(j-1,3,new BinaryExpression(target[j-1],target[j],target[j+1]));

                            // rewind
                            j = -1;
                            tl = target.length;
                        }

                    }

                    // if contains only one element
                    if (target.length === 1 && parent) {

                        // overwrite target index with target content
                        parent[parent.length-1] = target[0];

                        // set target to parent array
                        target = parent;

                    }


                }
                while(i === l-1 && parent);




            }
            // end of ')' character or last index

        }

        // return final expression tree
        return tree.length === 1 ? tree[0] : tree;

    }

};