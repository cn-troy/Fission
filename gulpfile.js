/*
 * Fission 前端集成开发环境 v0.0.5
 * Copyright 2015, Troy
 * Create: 2015-11-3
 * Update: 2015年12月3日16:44:26
 * Remark: 1. 加入js模块合并的支持
 *         2. 修改静态文件文件摘要后戳生成, 将gulp-rev改为gulp-rev-append, 并小幅修改gulp-rev-append插件详情参见github
 *         3. 加入生成html时修改js,css后戳
 *         4. 加入fission-config.js文件, 主要用于配置fission中各项功能参数
 ***************************v0.0.4***************************************
 *         1. 大幅修改文件结构, 这样构建有助于更清晰的对前端进行开发
 *            wwwroot文件夹为发布后的文件存放地, 可以直接映射IIS进行访问
 *            src为开发资源文件夹,存放各种原始文件
 *            bat中存放的为windows系统快捷操作, 如一键生成package.json, 一键安装依赖等
 *         2. 加入fissionConfig配置,详细说明查看定义处
 *         3. 加入对html中图片路径的替换
 *
 * PS: 对下一个版本的想法:
 *   1. 由于前面版本中没有对js的支持, 下一版本加入.
 */

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    spritesmith = require('gulp.spritesmith'),
    //browser-sync 2.0+ 官方推荐使用方式.
    browserSync = require('browser-sync').create(),
    pngquant = require('imagemin-pngquant'),
    fileinclude = require('gulp-file-include'),
    replace = require("gulp-replace"),
    rev = require('gulp-rev-append'),
    clean = require('gulp-clean'),
    concat = require("gulp-concat");

var fissionConfig = require('./fission-config');

var task_function = {
    html_include: function() {
        return gulp.src(["src/html/*.html"])
            .pipe(fileinclude({
                prefix: "@@@",
                basepath: "@file"
            }))
            .pipe(replace(RegExp('src=\".*' + fissionConfig.replace_image_folder_name + '/', "g"), "src=\"" + fissionConfig.replace_image_http_path + "/"))
            .pipe(replace(RegExp('src=\".*' + fissionConfig.replace_js_folder_name + '/', "g"), "src=\"" + fissionConfig.replace_js_http_path + "/"))
            .pipe(replace(RegExp('href=\".*' + fissionConfig.replace_css_folder_name + '/', "g"), "href=\"" + fissionConfig.replace_css_http_path + "/"))
            .pipe(gulp.dest("./wwwroot")).pipe(rev()).pipe(gulp.dest("./wwwroot"));

    }
};

//gulp 执行主方法 (命令行如果不指定执行方法, 则默认执行该方法)
gulp.task('default', function() {
    gulp.run('browser-sync', 'build-sass-and-html-include', 'build-script-and-html-include', 'watch');
});

gulp.task('watch', function() {
    gulp.watch(['src/sass/**/*.scss'], ['build-sass-and-html-include']);
    gulp.watch(['src/script/**/*.js'], ['build-script-and-html-include']);
    gulp.watch('src/html/**/*.html', ["html-include"]);
    gulp.watch('src/sprite/**/*.png', ['sprite']);
});

/*****************************************************************************************
************************************html生成**********************************************
******************************************************************************************/
//合并html
gulp.task("html-include", task_function.html_include);


/*****************************************************************************************
************************************css生成***********************************************
******************************************************************************************/
//因为生成css之后才能确定文件签名, 所以在watch的时候需要调用这个方法.
//这个方法的流程为先生成css, 确定文件签名, 再合并html, 最后根据发布后的文件摘要算法修改引用
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
        //输出css
        .pipe(gulp.dest('wwwroot/css'))
});

gulp.task("remove-css", function() {
    return gulp.src("wwwroot/css/**/*.css")
        .pipe(clean());
});

/*****************************************************************************************
*************************************js生成***********************************************
******************************************************************************************/
gulp.task('build-script-and-html-include', ["script"], task_function.html_include);

gulp.task("script", ['remove-js'], function() {

    var js_modules = fissionConfig.js_modules;
    js_modules.forEach(function(obj) { //合并压缩package.json里指定的文件
        if (!obj.build) {
            return;
        }
        var module_array = [];
        obj.modules.forEach(function(module) {
            module_array.push("src/script/" + module + ".js");
        });

        gulp.src(module_array)
            .pipe(concat(obj.name + ".js"))
            .pipe(gulp.dest('wwwroot/js/'))
    });
    return;
});

gulp.task("remove-js", function() {
    return gulp.src("wwwroot/js/**/*.js")
        .pipe(clean());
});



/*****************************************************************************************
*************************************刷新浏览器*********************************************
******************************************************************************************/
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
            index: fissionConfig.local_default_page
        },
        //自定义端口,官方默认为3000
        port: fissionConfig.local_port
    });
});

/*****************************************************************************************
*************************************图片生成*********************************************
******************************************************************************************/
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

gulp.task('test', function() {
    console.log(require('./fission-config'));
})
