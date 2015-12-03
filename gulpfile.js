/*
* Fission 前端集成开发环境 v0.0.4
* Copyright 2015, Troy
* Create: 2015-11-3
* Update: 2015年12月3日16:44:26
* Remark: 1. 大幅修改文件结构, 这样构建有助于更清晰的对前端进行开发
*            wwwroot文件夹为发布后的文件存放地, 可以直接映射IIS进行访问
*            src为开发资源文件夹,存放各种原始文件
*         2. 加入fissionConfig配置,详细说明查看定义处
*         3. 加入对html中图片路径的替换
*
* PS: 对下一个版本的想法:
*   1. 对多网站的支持, PC站与WebAPP站或更多站, 主要问题在图片,js,css可能都在同一域下
*   2. 加入css, js等路径配置
*   3. 优化生成算法
*/

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

var fissionConfig = {
    //css与html源文件中写的文件夹名字, 注意html与css访问图片的文件夹要相同
    //如: css代码background: url(../image/a.png)中image请写到下面的配置中
    //如: html代码中<img src="../image/b.jpg"/>中image写在下面配置中
    //说了这些,其实你只要按照我的文件结构,其他都不用管.
    replace_image_folder_name: "image",
    //生成css文件之后, 图片文件的路径
    //可以为http://pic.fission.com/image
    replace_image_http_path: "/image"
};

var task_function = {
    html_include: function() {
        return gulp.src(['src/sass/signature/*.json', "src/html/*.html", "!src/html/partial/*.html"])
            .pipe(fileinclude({
                prefix: "@@@",
                basepath: "@file"
            }))
            .pipe(revCollector({
                replaceReved: true
            }))
            .pipe(replace(RegExp('src=\".*' + fissionConfig.replace_image_folder_name + '/', "g"), "src=\""+fissionConfig.replace_image_http_path + "/"))
            .pipe(gulp.dest("./wwwroot"));
    }
};

//gulp 执行主方法 (命令行如果不指定执行方法, 则默认执行该方法)
gulp.task('default', function() {
    gulp.run('browser-sync', 'build-sass-and-html-include', 'watch');
});

gulp.task('watch', function() {
    gulp.watch('src/sass/**/*.scss', ['build-sass-and-html-include']);
    gulp.watch('src/html/**/*.html', ["html-include"]);
    gulp.watch('src/sprite/**/*.png', ['sprite']);
});

//因为生成css之后才能确定文件签名, 所以在watch的时候需要调用这个方法.
//这个方法的流程为先生成css, 确定文件签名, 再合并html, 最后根据签名的.json文件修改引用
gulp.task('build-sass-and-html-include', ['build-sass'], task_function.html_include);

//编译sass, 依赖删除生成的css文件
gulp.task('build-sass', ['remove-css'], function() {
    //设置需要编译的scss文件路径
    return gulp.src('src/sass/*.scss')
        //编译sass
        .pipe(sass())
        //编译发生错误时, 不停止cmd, 而是抛出异常
        .on('error', function(err) {
            console.log(err.message);
            this.emit('end');

        })
        .pipe(replace(RegExp("url\\(.*/" + fissionConfig.replace_image_folder_name + "/", "g"), "url(" + fissionConfig.replace_image_http_path + "/"))
        //自动补齐兼容性css
        .pipe(autoprefixer({
            browsers: ['> 5%'],
            cascade: false
        }))
        //压缩css
        .pipe(minifycss())
        .pipe(rev())
        //输出css
        .pipe(gulp.dest('wwwroot/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('src/sass/signature'));
});

gulp.task("remove-css", function() {
    return gulp.src("wwwroot/css/**/*.css")
        .pipe(clean());
});

//合并html
gulp.task("html-include", task_function.html_include);

//自动刷新网页
gulp.task('browser-sync', function() {
    //browser-sync 2.0+ 官方推荐使用方式.
    browserSync.init({
        //需要监听的文件, 一旦下列文件发生变化则刷新页面
        files: "wwwroot/*.html,wwwroot/css/*.css,wwwroot/images/*",
        server: {
            //root目录位置 gulp中./代表gulpfile.js存在的文件夹
            baseDir: "./wwwroot",
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
    return spriteData = gulp.src('src/sprite.min/*.png')
        //设置生成的sass文件和雪碧图
        .pipe(spritesmith({
            imgName: 'wwwroot/image/sprite.png',
            cssName: 'src/sass/util/sprite.scss'
        }))
        //输出
        .pipe(gulp.dest(''));
});

//深度压缩
gulp.task('imagemin-deep', function() {
    return gulp.src('src/sprite/*.{png,jpg,gif,ico}')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }], //不要移除svg的viewbox属性
            use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
        }))
        .pipe(gulp.dest('src/sprite.min'));
});

//普通压缩
gulp.task('imagemin', function() {
    return gulp.src('src/sprite/*.{png,jpg,gif,ico}')
        .pipe(imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
        }))
        .pipe(gulp.dest('src/sprite.min'));
});
