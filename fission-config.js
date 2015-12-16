module.exports = {
    //css与html源文件中写的文件夹名字, 注意html与css访问图片的文件夹要相同
    //如: css代码background: url(image/a.png)中image请写到下面的配置中
    //如: html代码中<img src="image/b.jpg"/>中image写在下面配置中
    //说了这些,其实你只要按照我的文件结构,其他都不用管.
    replace_image_folder_name: "image",
    //生成css文件之后, 图片文件的路径
    //可以为http://pic.fission.com
    replace_image_http_path: "/image",

    //同上, css的文件配置
    replace_css_folder_name: "css",
    replace_css_http_path: "/css",

    //同上, js的文件配置
    replace_js_folder_name: "js",
    replace_js_http_path: "/js",

    //browser-sync访问页面的端口
    local_port: 8080,
    //browser-sync访问的默认页面
    local_default_page: "index.html",

    //js模块合并配置
    //其中name为合并modules配置模块后生成的js文件名.
    //bulid为是否对当前配置模块对象进行合并
    //modules是当前需要哪些模块进行合并
    js_modules: [{
        "name": "index",
        "build": true,
        "modules": ["a", "b", "c"]
    }, {
        "name": "index2",
        "build": true,
        "modules": ["c", "d"]
    }, {
        "name": "index3",
        "build": true,
        "modules": ["b", "d"]
    }]
}
