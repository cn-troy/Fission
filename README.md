#Fission
fission是一个前端集成解决方案, 主要使用gulp作为工作流程管理工具.

##功能概述

 - 可自动编译sass文件
 - 支持html模块化开发
 - 采用gulp作为底层, [插件](http://gulpjs.com/)丰富, 方便熟悉gulp的同学进行二次开发满足自己团队的需求
 - 对css资源自动添加MD5版本戳
 - 对css,html中图片自动添加域名前缀
 - 内置css中sprite图生成器, 简单易用
 - 内置png图片压缩
 - 支持浏览器自动刷新, 配合文件监听功能可实现保存即刷新
 - 支持文件保存即发布


##安装说明

 - 所有模块项都已经加入package.json中, 使用命令npm install --save-dev即可安装所有模块.
 - 安装所有模块快慢决定于你的网络质量, 建议使用cnpm进行安装.
 - 安装完成后如果执行命令gulp出现某模块错误, 则先使用删除该模块, 重新安装出错模块
 - 删除模块命令为: npm remove 模块名
 - 安装单个模块命令为: npm install 模块名 --save-dev



