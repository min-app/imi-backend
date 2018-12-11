### 命名规范(<font style='color: red;'>驼峰命名</font>)

##### 文件命名
```
除类和model首字母大写，其他小写开头
```
###### 函数，方法
```
方法
const getUser = () => {}
实例方法
instanceFunc: () => {}
静态方法
StaticFunc: () => {}
```
###### 常量
```
const USER_MESSAGE = 'USER_MESSAGE'
```
###### 变量
```
// 标识状态，类型等的值要语义化且首字母大写，不能用数值
const orderStatus = ['Waiting', 'Finished']
// model的查询尽量用首字母小写的model名作为变量名
const clinicConfig = await ClinicConfig.findByPk(1)
// 单数
const user = await User.findByPk(1)
// 复数
const users = await User.findAll()
// 驼峰命名
const clinicConfig = {}
```

###### 可变值用let，不可变用const, 对象健值变化可用const
```
let a = 1
a = 2
const user = {
  status: false
}
user.status = true
user.count = 3
```
###### 展开取值
```
let [a, b] = [1, 2]	// a=1, b=2
[a, b] = [3, 4]	// a = 3, b = 4
const {x, y, z = 3} = {x: 1, y: 2}	// x = 1, y = 2, z = 3
```
###### 对象的操作
```
import _ from 'lodash'
const defualtConfig = {
  log: false,
  debug: false
}
const config = {
  log: true
}
// 取默认值
// defaults不覆盖重复值
_.defaults(config, defualtConfig) => config = { log: true, debug: false }
// assign覆盖重复值
_.assign(config, defualtConfig) => config = { log: false, debug: false }
```
