```
// write log
import logs form 'logs'
const ext = {
  // 用于快速查找分类日志
  tag: 'tagName'
  // 自定义附加的信息
}
logs.error('error log', ext)
logs.warn('warn log', ext)
logs.info('info log', ext)
```