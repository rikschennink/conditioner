var gulp = require('gulp');
var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var reporter = require('jshint-stylish');
var sass = require('gulp-sass');
var sequence = require('run-sequence');
var doctrine = require('doctrine');
var fs = require('fs');
var spawn = require('child_process').spawn;
var swig = require('swig');
var marked = require('marked');
var hljs = require('highlight.js');
var glob = require('glob');


marked.setOptions({
    highlight:function(code,lang) {
        return hljs.highlight(lang,code).value;
    }
});

swig.setDefaults({ cache: false });

var markdown = function(value){
    return marked(value);
};
markdown.safe = true;

swig.setFilter('markdown',markdown);

swig.setFilter('id',function(value) {
    return value.toLowerCase().replace(/\s+/g, '-');
});

swig.setFilter('params',function(value) {
    return value.map(function(item){
       return item.optional ? '[' + item.name + ']' : item.name;
    }).join(', ');
});

swig.setFilter('returns',function(value) {
    if (!value) {return '';}
    return '\u00a0\u2192\u00a0' + value.type.join(' | ');
});

gulp.task('_api',function(cb){

    var out = {
        objects:[]
    };

    var addType = function(obj,type) {

        var expression = type;
        if (expression.type === 'OptionalType') {
            obj.optional = true;
            expression = expression.expression;
        }

        if (expression.type === 'NameExpression') {
            obj.type = [expression.name];
        }

        if (expression.type === 'UnionType') {
            obj.type = [];
            expression.elements.forEach(function(element){
                obj.type.push(element.name || 'null');
            });
        }

    };

    var isEventOnlyComment = function(comment) {

        var state = true;
        comment.tags.forEach(function(item) {
            if (item.title === 'method') {
                state = false;
                return state;
            }
        });
        return state;
    };

    var getDataFromComment = function(comment){

        var data = {
            description:comment.description,
            params:[],
            events:[]
        };

        comment.tags.forEach(function(item){

            if (item.title==='exports') {

                obj = getObjectByName(item.description);

                // main title
                if (!obj) {
                    obj = {
                        name:item.description,
                        methods:[],
                        events:[]
                    };
                    out.objects.push(obj);
                }

                // set description
                obj.memberof = item.description;
                obj.description = comment.description;

                }
            if (item.title==='fires') {

                if (isEventOnlyComment(comment)) {

                    data.events.push({
                        name:item.description,
                        description:comment.description
                    });

                }
                else {

                    data.events.push({
                        name:item.name,
                        description:item.description
                    });

                }

            }
            else if (item.title==='memberof') {
                data.memberof = item.description;
            }
            else if (item.title==='method') {
                data.name = item.name;
            }
            else if (item.title==='returns') {
                data.returns = {
                    name:item.name,
                    type:item.type,
                    description:item.description
                };

                addType(data.returns,item.type);

            }
            else if (item.title==='param') {

                var obj = {
                    name:item.name,
                    description:item.description,
                    optional:false
                };

                addType(obj,item.type);

                data.params.push(obj)
            }
        });

        return data;

    };

    var getObjectByName = function(name) {
        var found = null;
        out.objects.forEach(function(obj){
            if (obj.name === name) {
                found = obj;
                return false;
            }
        });
        return found;
    };

    var parseComment = function(comment){

        var obj,data = getDataFromComment(comment);

        if (!data.memberof) {
            return;
        }

        obj = getObjectByName(data.memberof);

        if (!obj) {
            obj = {
                name:data.memberof,
                methods:[],
                events:[]
            };
            out.objects.push(obj);
        }

        if (data.name) {
            obj.methods.push(data);
        }

        if (data.events.length) {
            obj.events = obj.events.concat(data.events);
        }

    };


    var i=0,files = glob.sync('./js/lib/rikschennink/**/*.js'),l=files.length,data,comment,comments;
    for(;i<l;i++) {

        // read the file
        data = fs.readFileSync(files[i]).toString();

        // get all comments and add them to output object
        comments = data.match(/(\/\*\*\*([\s\S]*?)\*\/)/gm);

        if (!comments) {
            continue;
        }

        comments.forEach(function(item){

            comment = doctrine.parse(item,{
                unwrap:true
            });

            parseComment(comment);

        });

    }

    // reorder objects
    out.objects.sort(function(a,b){
        return a.name.charCodeAt(0) - b.name.charCodeAt(0);
    });

    // render the api file
    swig.renderFile(__dirname + '/swig/docs-api.swig', out, function (err, output) {

        if (err) {
            throw err;
        }

        fs.writeFile('./_includes/docs-api.html',output,function (err) {
            if (err) {
                throw err;
            }
            cb();
        });


    });

});


gulp.task('_connect', function() {

    connect.server({
        root:'./_site',
        port:4000
    });

});

gulp.task('_rjs',function(cb){

    var ls = spawn('node_modules/requirejs/bin/r.js',['-o','./build.js']);

    ls.stdout.on('data', function (data) {
        console.log('r.js: ' + data);
    });

    ls.stderr.on('data', function (data) {
        console.log('r.js: ' + data);
    });

    ls.on('close', function (code) {
        console.log('r.js: finished ' + code);

        cb();
    });

});

gulp.task('_jekyll',function(cb){

    var ls = spawn('jekyll',['build','--config','_config-local.yml']);

    ls.stdout.on('data', function (data) {
        console.log('jekyll: ' + data);
    });

    ls.stderr.on('data', function (data) {
        console.log('jekyll: ' + data);
    });

    ls.on('close', function (code) {
        console.log('jekyll: finished ' + code);

        cb();
    });

});

gulp.task('_scss',function(){

    return gulp.src('./scss/styles.scss')
        .pipe(sass())
        .pipe(gulp.dest('./css'));

});

gulp.task('_jshint',function(){

    return gulp.src(['./js/security/*.js','./js/ui/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(reporter));

});

gulp.task('build',function(cb){

    sequence('_jshint',['_rjs','_scss'],'_api','_jekyll',cb);

});

gulp.task('dev',['build','_connect'],function(){

    gulp.watch([
        './scss/**/*',
        './js/**/*',
        './swig/**/*',
        './_includes/**/*',

        // all html files
        './**/*.html',

        // exclude these folders
        '!./_includes/docs-api.html',
        '!./_site/**/*',
        '!./node_modules/**/*'

    ],['build']);

});