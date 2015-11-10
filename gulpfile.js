var gulp = require('gulp'),
	sass = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	imagemin = require('gulp-imagemin'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	notify = require('gulp-notify'),
	spritesmith = require('gulp.spritesmith'),
	clean = require('gulp-clean'),
	browserSync = require('browser-sync'),
	pngquant = require('imagemin-pngquant');
//gulp 执行主方法 (命令行如果不指定执行方法, 则默认执行该方法)
gulp.task('default', function() {
	gulp.run('browser-sync', 'sass', 'watch');
});

gulp.task('watch', function() {
	// Watch .scss files
	gulp.watch('sass/**/*.scss', ['sass']);
	// Watch .js files
	//gulp.watch('javascripts/*.js', ['scripts']);
	// Watch image files
	//gulp.watch('sprite/*', ['imagemin']);

	//gulp.watch('sprite.min/*', ['sprite']);
	// Create LiveReload server
	//livereload.listen();
	// Watch any files in assets/, reload on change
	//gulp.watch(['assets/*']).on('change', livereload.changed);
});


//自动刷新网页
gulp.task('browser-sync', function() {
	browserSync({
		files: "**/*.html,**/*.css,images/*",
		server: {
			baseDir: "./"
		}
	});
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

//编译sass, 依赖删除生成的css文件
gulp.task('sass', function() {
	//设置需要编译的scss文件路径
	return gulp.src('sass/*.scss')
		//编译sass
		.pipe(sass())
		.on('error', function(err) {
			console.log(err.message);
			this.emit('end');

		})
		//自动补齐兼容性css
		.pipe(autoprefixer({
			browsers: ['> 5%'],
			cascade: false
		}))
		.pipe(minifycss())
		//输出css
		.pipe(gulp.dest('css_release'))
		//完成后再状态栏提示成功
		.pipe(notify({
			message: 'sass build is success'
		}));
});

//清除已经生成的css文件
// gulp.task('cleanSass', function() {
// 	// return gulp.src('css_release/*.css')
// 	// 	.pipe(clean());
// });



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