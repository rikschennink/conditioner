
'use strict';

describe('ExpressionFormatter.toExpressionTree',function(){

    var parse = function(str) {
        return JSON.stringify(ExpressionFormatter.toExpressionTree(str));
    };

    // setup expressions
    var expressions = [],key,result;

    // add expressions and their expected output
    expressions['foo:{bar:1}']     = '{"path":"foo","value":"bar:1"}';
    expressions['(foo:{bar:1})']   = '{"path":"foo","value":"bar:1"}';
    expressions['((foo:{bar:1}))'] = '{"path":"foo","value":"bar:1"}';

    expressions['foo:{bar:1} and foo:{bar:2}']     = '[{"path":"foo","value":"bar:1"},"and",{"path":"foo","value":"bar:2"}]';
    expressions['(foo:{bar:1} and foo:{bar:2})']   = '[{"path":"foo","value":"bar:1"},"and",{"path":"foo","value":"bar:2"}]';
    expressions['(foo:{bar:1}) and (foo:{bar:2})'] = '[{"path":"foo","value":"bar:1"},"and",{"path":"foo","value":"bar:2"}]';

    expressions['foo:{bar:1} and (foo:{bar:2_1} or foo:{bar:2_2})']    = '[{"path":"foo","value":"bar:1"},"and",[{"path":"foo","value":"bar:2_1"},"or",{"path":"foo","value":"bar:2_2"}]]';
    expressions['(foo:{bar:1}) and (foo:{bar:2_1} or foo:{bar:2_2})']  = '[{"path":"foo","value":"bar:1"},"and",[{"path":"foo","value":"bar:2_1"},"or",{"path":"foo","value":"bar:2_2"}]]';
    expressions['(foo:{bar:1} and (foo:{bar:2_1} or foo:{bar:2_2}))']  = '[{"path":"foo","value":"bar:1"},"and",[{"path":"foo","value":"bar:2_1"},"or",{"path":"foo","value":"bar:2_2"}]]';

    expressions['foo:{bar:1} or foo:{bar:2} and foo:{bar:3} or foo:{bar:4}'] = '[[[{"path":"foo","value":"bar:1"},"or",{"path":"foo","value":"bar:2"}],"and",{"path":"foo","value":"bar:3"}],"or",{"path":"foo","value":"bar:4"}]';
    expressions['foo:{bar:1} or foo:{bar:2} and (foo:{bar:3_1} or foo:{bar:3_2})'] = '[[{"path":"foo","value":"bar:1"},"or",{"path":"foo","value":"bar:2"}],"and",[{"path":"foo","value":"bar:3_1"},"or",{"path":"foo","value":"bar:3_2"}]]';
    expressions['foo:{bar:1} or (foo:{bar:2_1} and foo:{bar:2_2} or foo:{bar:2_3})'] = '[{"path":"foo","value":"bar:1"},"or",[[{"path":"foo","value":"bar:2_1"},"and",{"path":"foo","value":"bar:2_2"}],"or",{"path":"foo","value":"bar:2_3"}]]';

    expressions['foo:{bar:1} or foo:{bar:2} and foo:{bar:3} or foo:{bar:4} and foo:{bar:4}'] = '[[[[{"path":"foo","value":"bar:1"},"or",{"path":"foo","value":"bar:2"}],"and",{"path":"foo","value":"bar:3"}],"or",{"path":"foo","value":"bar:4"}],"and",{"path":"foo","value":"bar:4"}]';

    // test
    for (key in expressions) {

        if (!expressions.hasOwnProperty(key)){continue;}

        it('will parse an expression like "' + key + '"',function(){

            // act
            result = parse(key);

            // assert
            expect(result).toBe(expressions[key]);

        });

    }


});
