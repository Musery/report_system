## 全量节点测试文档

#### blockquote(区块)

> blockquote blockquote blockquote blockquote blockquote blockquote blockquote blockquote
> 区块 区块 区块 区块 区块 区块 区块 区块 区块 区块

###### 多级区块 && 区块 多样性文字测试

> > blockquote blockquote blockquote blockquote blockquote blockquote blockquote blockquote
> > `区块` *区块* **区块** ~~区块~~ [区块](区块) `blockquote` *blockquote* **blockquote** ~~blockquote~~ [blockquote](blockquote) blockquote[^1]
> >
> > > blockquote blockquote blockquote

[^1]: blockquote

#### break (强制换行)

break break break break\
break break break break break break break break

###### 多样文字测试

`break` *break* **break** ~~break~~ [break](break) break
`行内代码` *斜体* **加粗** ~~删除线~~ [超链接](超链接) 脚注[^2] ![图片](https://www.dbappsecurity.com.cn/Upload/image/20211008/20211008102715_5530.png)

[^2]: break

#### code (代码块)

    code code code code code code code code code
    code code code code code code code code code
    code code code code code code code code code

#### list (列表)

*   list `list` *list* **list** ~~list~~ [list](list) list

*   list `list` *list* **list** ~~list~~ [list](list) list

    *   list `list` *list* **list** ~~list~~ [list](list) list

    *   list `list` *list* **list** ~~list~~ [list](list) list

        *   list `list` *list* **list** ~~list~~ [list](list) list

        *   list `list` *list* **list** ~~list~~ [list](list) list

1.  list `list` *list* **list** ~~list~~ [list](list) list

2.  list `list` *list* **list** ~~list~~ [list](list) list

    1.  list `list` *list* **list** ~~list~~ [list](list) list

    2.  list `list` *list* **list** ~~list~~ [list](list) list

        1.  list `list` *list* **list** ~~list~~ [list](list) list

        2.  list `list` *list* **list** ~~list~~ [list](list) list[^3]

[^3]: 脚注

#### thematicBreak (下划线)

***

#### table (表格)

| 标题 1 | 标题 2 | 标题 3 |
| ---- | ---: | :--- |
| 1    |   内容 | 内容   |
| 2    |   内容 | 内容   |

#### graph (动态图表)

###### \_data (统计值)

这是一个统计值![\_data](<select count(*) as eventCount from event>)

###### \_echarts (动态图)

###### \_table (动态表)

```_table
SELECT
  formatDateTime (
    toStartOfInterval(collectorReceiptTime,
    INTERVAL 1 hour),
    '%Y-%m-%d %H:%M:%S'
  ) AS times,
  count(1) AS eventCount
FROM
  event
GROUP BY
  times
ORDER BY
  times asc
LIMIT 10
```
