var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    spritesmith = require('gulp.spritesmith'),
    //browser-sync 2.0+ 官方推荐使用方式.
    browserSync = require('browser-sync').create(),
    pngquant = require('imagemin-pngquant'),
    fileinclude = require('gulp-file-include'),
    replace = require("gulp-replace"),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    clean = require('gulp-clean');

var config = {
	//生成图片文件之后, 图片文件的路径
    image_http_path: "http://pic.fission.com"
};

//gulp 执行主方法 (命令行如果不指定执行方法, 则默认执行该方法)
gulp.task('default', function() {
    gulp.run('browser-sync', 'build-sass-and-html-include', 'watch');
});

gulp.task('watch', function() {
    gulp.watch('sass/**/*.scss', ['build-sass-and-html-include']);
    gulp.watch('html_src/**/*.html', ["html-include"]);
    gulp.watch('sprite/**/*.png', ['sprite']);
});

//因为生成css之后才能确定文件签名, 所以在watch的时候需要调用这个方法.
//这个方法的流程为先生成css, 确定文件签名, 再合并html, 最后根据签名的.json文件修改引用
gulp.task('build-sass-and-html-include', ['build-sass'], function() {
    return gulp.src(['sass/signature/*.json', "./html_src/*.html"])
        .pipe(fileinclude({
            prefix: "@@",
            basepath: "@file"
        }))
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest("./"));
});

//编译sass, 依赖删除生成的css文件
gulp.task('build-sass', ['remove-css'], function() {
    //设置需要编译的scss文件路径
    return gulp.src('sass/*.scss')
        //编译sass
        .pipe(sass())
        //编译发生错误时, 不停止cmd, 而是抛出异常
        .on('error', function(err) {
            console.log(err.message);
            this.emit('end');

        })
        .pipe(replace(/url\(.*\/images\//g, "url(" + config.image_http_path + "/"))
        //自动补齐兼容性css
        .pipe(autoprefixer({
            browsers: ['> 5%'],
            cascade: false
        }))
        //压缩css
        .pipe(minifycss())
        .pipe(rev())
        //输出css
        .pipe(gulp.dest('css_release'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('sass/signature'));
});

gulp.task("remove-css", function(){
	return gulp.src("css_release/**/*.css")
	.pipe(clean());
});

//合并html
gulp.task("html-include", function() {
    return gulp.src(['sass/signature/*.json', "./html_src/*.html"])
        .pipe(fileinclude({
            prefix: "@@",
            basepath: "@file"
        }))
        .pipe(revCollector({
            replaceReved: true
        }))
        .pipe(gulp.dest("./"));
});

//自动刷新网页
gulp.task('browser-sync', function() {
    //browser-sync 2.0+ 官方推荐使用方式.
    browserSync.init({
        //需要监听的文件, 一旦下列文件发生变化则刷新页面
        files: "./*.html,css_release/*.css,images/*",
        server: {
            //root目录位置 gulp中./代表gulpfile.js存在的文件夹
            baseDir: "./",
            //自动打开网页时, 默认显示的页面
            index: "detail.html"
        },
        //自定义端口,官方默认为3000
        port: 8080
    });
});

//雪碧图生成
gulp.task('sprite', ['imagemin'], function() {
    //设置雪碧图文件
    return spriteData = gulp.src('sprite.min/*.png')
        //设置生成的sass文件和雪碧图
        .pipe(spritesmith({
            imgName: 'images/sprite.png',
            cssName: 'sass/util/sprite.scss'
        }))
        //输出
        .pipe(gulp.dest(''));
});

//深度压缩
gulp.task('imagemin-deep', function() {
    return gulp.src('sprite/*.{png,jpg,gif,ico}')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }], //不要移除svg的viewbox属性
            use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
        }))
        .pipe(gulp.dest('sprite.min'));
});

//普通压缩
gulp.task('imagemin', function() {
    return gulp.src('sprite/*.{png,jpg,gif,ico}')
        .pipe(imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
        }))
        .pipe(gulp.dest('sprite.min'));
});
