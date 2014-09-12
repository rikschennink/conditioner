define(function(){

	'use strict';

    describe('ExpressionParser',function(){

		describe('.validate(expression)',function(){

			it ('will correctly catch missing semicolons',function(){

				expect(ExpressionParser.validate('foo{bar:1}')).to.not.be.ok;

			});

			it ('will correctly catch missing curly braces',function(){

				expect(ExpressionParser.validate('foo:{bar:1')).to.not.be.ok;

			});

			it ('will correctly catch invalid operators',function(){

				expect(ExpressionParser.validate('foo:{bar:1} andr bar:{baz:2}')).to.not.be.ok;

			});

		});

        describe('.parse(expression)',function(){

            // setup expressions
            var expressions = [],key,result;

            // add expressions and their expected output
            expressions['foo:{bar:1}']     = 'foo:{bar:1}';
            expressions['(foo:{bar:1})']   = 'foo:{bar:1}';
            expressions['((foo:{bar:1}))'] = 'foo:{bar:1}';

            expressions['foo:{bar:1} and foo:{bar:2}']          = '(foo:{bar:1} and foo:{bar:2})';
            expressions['(foo:{bar:1} and foo:{bar:2})']        = '(foo:{bar:1} and foo:{bar:2})';
            expressions['(foo:{bar:1}) and (foo:{bar:2})']      = '(foo:{bar:1} and foo:{bar:2})';
            expressions['((foo:{bar:1}) and (foo:{bar:2}))']    = '(foo:{bar:1} and foo:{bar:2})';

            expressions['foo:{bar:1} and (foo:{bar:2_1} or foo:{bar:2_2})']    = '(foo:{bar:1} and (foo:{bar:2_1} or foo:{bar:2_2}))';
            expressions['(foo:{bar:1}) and (foo:{bar:2_1} or foo:{bar:2_2})']  = '(foo:{bar:1} and (foo:{bar:2_1} or foo:{bar:2_2}))';
            expressions['(foo:{bar:1} and (foo:{bar:2_1} or foo:{bar:2_2}))']  = '(foo:{bar:1} and (foo:{bar:2_1} or foo:{bar:2_2}))';

            expressions['foo:{bar:1} and foo:{bar:2} and foo:{bar:3}']                  = '((foo:{bar:1} and foo:{bar:2}) and foo:{bar:3})';
            expressions['foo:{bar:1} and foo:{bar:2} and foo:{bar:3} and foo:{bar:4}']  = '(((foo:{bar:1} and foo:{bar:2}) and foo:{bar:3}) and foo:{bar:4})';

            expressions['foo:{bar:1} or foo:{bar:2} and (foo:{bar:3_1} or foo:{bar:3_2})'] = '((foo:{bar:1} or foo:{bar:2}) and (foo:{bar:3_1} or foo:{bar:3_2}))';
            expressions['foo:{bar:1} or (foo:{bar:2_1} and foo:{bar:2_2} or foo:{bar:2_3})'] = '(foo:{bar:1} or ((foo:{bar:2_1} and foo:{bar:2_2}) or foo:{bar:2_3}))';

            expressions['not foo:{bar:1}'] = 'not foo:{bar:1}';
            expressions['(not foo:{bar:1})'] = 'not foo:{bar:1}';
            expressions['not (foo:{bar:1})'] = 'not foo:{bar:1}';

            expressions['not foo:{bar:1} and not foo:{bar:2}'] = '(not foo:{bar:1} and not foo:{bar:2})';

            expressions['not (foo:{bar:1} and foo:{bar:2})'] = 'not (foo:{bar:1} and foo:{bar:2})';

            expressions['foo:{bar:1} and not (foo:{bar:2_1} and foo:{bar:2_2})'] = '(foo:{bar:1} and not (foo:{bar:2_1} and foo:{bar:2_2}))';


            // test
            for (key in expressions) {

                if (!expressions.hasOwnProperty(key)){continue;}

                (function(key){

                    it('will parse "' + key + '"',function(){

                        // act
                        result = ExpressionParser.parse(key).toString();

                        // assert
                        expect(result).to.equal(expressions[key]);

                    });

                }(key));

            }

        });

    });

});