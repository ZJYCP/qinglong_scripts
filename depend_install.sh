#!/usr/bin/env bash
#依赖安装，运行一次就好
#0 8 5 5 * depend_install.sh
#new Env('依赖安装')
#

# node 依赖
npm install 

# python 依赖

echo -e "\n所需依赖安装完成，请检查有没有报错，可尝试再次运行"