# Fetch Provider

> Vue 模块通过打包成 lib 的umd 脚本文件独立布置在任何远端服务器上，
> 主程序能过调用远程 umd 脚本文件动态渲染到前端页面

<br>
<br>

[Core](./packages/core/README.md)  
[axios adapter](./packages/axios/README.md)  
[cross-fetch adapter(开发中)](./packages/corss-fetch/README.md)  
[vue adapter](./packages/vue/README.md)

<br>
<br>

## 开发注意事项

### changelog
`lerna-changelog`基于`pr`来为项目生成`changelog`  

<strong>使用步骤</strong>

1、从`master`分支切换出`feature`/`bugfix`等分支。  
2、完成开发后进行`commit`，推荐使用`commitizen`来规范`commit msg`，同时有助于对后续子项目生成`changelog`。  
3、将新分支`push`到`remote`端。  
4、创建`pr`，并打上`label`，此处一定要打上`label`，`learn-changelog`就是根据label来确定该`pr`属于`feature`/`bugfix`/`document`等。  
5、切记要在`merge`之前打上`label`。  
6、进行`merge` `pr`操作。
7、本地切换到`master`分支并进行`pull操`作。  
8、执行`lerna-changelog`，既可得到一份`changeling`。  

<strong>注意</strong>

`pr`的`label`并不能随意设置，一定要在项目中声明对应才生效。   
官方默认支持`breaking`/`enhancement`/`bug`/`documentation`/`internal`，如果想用其他，则需要在package.json中进行相应的配置。  
``` json
{
  "changelog": {
    "labels": {
      "feat": ":rocket: New Feature",
      "bug": ":bug: Bug Fix",
      "doc": ":memo: Documentation",
      "internal": ":house: Internal",
      "breaking": ":boom: Breaking Change"
    }
  }
}
```

<br>

### 子项目的changelog
具体还需参考[README](https://github.com/lerna/lerna/blob/514bc57a53/commands/version/README.md#--conventional-commits)
