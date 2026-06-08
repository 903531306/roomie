# 提醒功能分期设计

## 目标

给生日、日程增加可靠提醒能力。第一期先做小程序内可见、可测试、可闭环的提醒；后续再扩展手机日历、微信订阅消息、邮件、短信等外部渠道。

当前项目已有：

- 生日/日程创建入口：`components/common/ScheduleCreateModal.vue`
- 生日/日程列表展示：`components/dashboard/DashboardSchedule.vue`
- 通知中心接口与页面：`common/api/index.ts`、`pages/notifications/notifications.vue`
- 通知数量入口：首页已有未读数逻辑

所以第一期应该复用现有通知中心，不先引入复杂外部推送。

## 第一期：站内提醒

### 一期范围

第一期只实现“小程序内提醒”，不做微信订阅消息、手机系统日历、邮件、短信。

必须支持：

- 创建生日时设置提醒规则
- 创建日程时设置提醒规则
- 支持提前提醒：当天、提前 1 天、提前 3 天、提前 7 天
- 支持提醒时间：默认 `09:00`，允许用户选择
- 到提醒时间后，在通知中心生成未读消息
- 首页/通知中心已有入口能看到提醒数量
- 生日每年重复提醒
- 普通日程只提醒一次

暂不支持：

- 微信订阅消息
- 写入手机日历
- 邮件提醒
- 短信提醒
- 多次复杂自定义规则，如每月、每周重复
- 后台静默调用用户手机能力

### 前端改动清单

#### 1. 创建弹窗增加提醒设置

文件：`components/common/ScheduleCreateModal.vue`

新增字段：

```js
remindEnabled: true,
remindTime: '09:00',
remindOffsets: [0, -1]
```

### 创建弹窗 UI 布局方案

提醒设置放在日期/时间下面、保存按钮上面。用户先确定“这是什么事、哪一天”，再决定“什么时候提醒我”，逻辑会更顺。

#### 整体排列

弹窗内容从上到下：

```text
1. 标题输入
   - 日程：日程内容
   - 生日：家人称呼

2. 日期/历法区域
   - 日程：执行日期 + 日程时间
   - 生日：公历/农历切换 + 生日日期

3. 提醒设置区域
   - 提醒总开关
   - 提醒时间选择
   - 提前提醒多选
   - 提醒效果预览

4. 保存按钮
```

#### 提醒设置区域视觉

用一块独立浅色区域，不要再做大弹窗套小弹窗。建议样式和现有 `picker-card-option`、`m-config-card` 保持一致：

```text
┌────────────────────────────┐
│ 🔔 提醒设置            [开关] │
│ 开启后会在通知中心提醒你       │
│                            │
│ 提醒时间                    │
│ [ 09:00              > ]    │
│                            │
│ 提前提醒                    │
│ [当天] [提前1天]             │
│ [提前3天] [提前7天]           │
│                            │
│ 将在：5月29日 09:00、5月30日 09:00 提醒 │
└────────────────────────────┘
```

#### 控件选择

提醒总开关：

- 使用 `switch`
- 默认开启
- 关闭后隐藏或置灰下面的提醒时间、提前提醒、预览文案

提醒时间：

- 使用 `picker mode="time"`
- 不要用输入框，避免用户输入非法时间
- 展示为一行卡片：左侧 `提醒时间`，右侧当前值 `09:00`

提前提醒：

- 使用多选胶囊按钮
- 一行放不下时自动换行
- 选中态用主题色背景，未选中态用浅灰底
- 至少保留一个选项；如果用户取消到 0 个，自动保留 `当天`

推荐选项：

```js
[
  { label: '当天', value: 0 },
  { label: '提前1天', value: -1 },
  { label: '提前3天', value: -3 },
  { label: '提前7天', value: -7 }
]
```

提醒效果预览：

- 根据当前日期、提醒时间、提前选项即时生成
- 只展示最多 2 条，超过时显示 `等 3 次提醒`
- 用浅色小字，不要抢主操作

示例：

```text
将在：5月29日 09:00、5月30日 09:00 提醒
```

#### 生日弹窗布局

生日表单建议：

```text
家人称呼
[ 妈妈 ]

历法选择                    生日日期
[公历/农历 switch]          [2026-05-30 >]

提醒设置                  [开启]
提醒时间
[09:00 >]

提前提醒
[当天] [提前1天] [提前3天] [提前7天]

将在：每年生日当天 09:00、提前1天 09:00 提醒

[确认保存记录]
```

生日日期的核心原则：

- 用户选的是“生日规则”，不是只选一次性的日程日期。
- 公历生日：保存公历月日，每年直接按这个月日生成提醒。
- 农历生日：保存农历月日和是否闰月，每年先换算出当年的公历日期，再生成提醒。
- 不要只保存“换算出来的下一次公历日期”，否则下一年农历生日会丢失原始规则。

生日默认值：

- `remindEnabled = true`
- `remindTime = '09:00'`
- `remindOffsets = [0, -1, -7]`
- `repeatType = 'yearly'`

生日提醒文案偏“人情味”：

```text
明天是妈妈的生日
今天是妈妈的生日
7天后是妈妈的生日
```

#### 日程弹窗布局

日程表单建议：

```text
日程内容
[ 交房租 ]

提醒时间
[20:00 >]

执行日期
[2026-05-30 >]

提醒设置                  [开启]
提醒时间
[20:00 >]

提前提醒
[当天] [提前1天] [提前3天] [提前7天]

将在：5月30日 20:00 提醒

[确认保存记录]
```

注意：当前日程表单已有一个 `提醒时间`，第一期可以把它直接视为 `remindTime`，不要再重复出现两个时间选择。也就是说日程弹窗最终应调整为：

```text
日程内容
[ 交房租 ]

执行日期
[2026-05-30 >]

提醒设置                  [开启]
提醒时间
[20:00 >]
提前提醒
[当天] [提前1天] [提前3天] [提前7天]
```

日程默认值：

- `remindEnabled = true`
- `remindTime = 当前时间向后取整，或默认 '09:00'`
- `remindOffsets = [0]`
- `repeatType = 'none'`

日程提醒文案偏“事项提醒”：

```text
今天 20:00 记得：交房租
明天 20:00 记得：交房租
```

#### 交互规则

- 关闭提醒开关时：`remindEnabled = false`，保存时仍传 `remindTime` 和 `remindOffsets`，方便用户下次打开保留选择。
- 打开提醒开关时：如果 `remindOffsets` 为空，自动设置为 `[0]`。
- 点击提前提醒按钮：多选切换。
- 所有提前提醒都取消时：自动恢复 `当天`。
- 生日允许选择过去日期，因为生日需要记录真实出生日期；后端生成提醒时计算下一次生日。
- 普通日程不允许选择过去日期。
- 农历生日的预览文案可以先写成“按农历生日计算”，具体公历日期由后端或农历工具换算。

#### UI 输出到后端字段

弹窗提交前统一整理成：

```js
const payload = {
  title: form.title,
  date: form.date,
  time: form.type === 'daily' ? form.remindTime : undefined,
  scheduleType: form.type === 'daily' ? 'schedule' : 'birthday',
  lunar: form.type === 'birthday' ? form.isLunar : false,
  birthdayCalendar: form.type === 'birthday'
    ? (form.isLunar ? 'lunar' : 'solar')
    : undefined,
  birthdayOriginalDate: form.type === 'birthday' ? form.date : undefined,
  birthdayMonth: form.type === 'birthday' ? getMonth(form.date) : undefined,
  birthdayDay: form.type === 'birthday' ? getDay(form.date) : undefined,
  birthdayLeapMonth: form.type === 'birthday' ? !!form.isLeapMonth : false,
  remindEnabled: form.remindEnabled,
  remindTime: form.remindTime,
  remindOffsets: form.remindEnabled ? form.remindOffsets : [],
  repeatType: form.type === 'birthday' ? 'yearly' : 'none'
}
```

字段说明：

- `date`：普通日程的执行日期；生日场景下可继续传用户选择的原始日期，兼容旧接口。
- `birthdayCalendar`：生日历法，`solar` 表示公历，`lunar` 表示农历。
- `birthdayOriginalDate`：用户在 picker 中选中的原始日期，用于展示和兼容。
- `birthdayMonth` / `birthdayDay`：生日规则的月日，后端用它每年生成下一次生日。
- `birthdayLeapMonth`：农历闰月标记。第一期如果 UI 暂不支持闰月选择，可以固定传 `false`，后续再补。

如果第一期想降低改造量，也可以先只传：

```js
{
  date: form.date,
  lunar: form.isLunar,
  remindEnabled,
  remindTime,
  remindOffsets
}
```

但后端保存时仍建议拆出 `birthday_calendar`、`birthday_month`、`birthday_day`，不要只存一个换算后的公历日期。

默认值建议：

- 生日：`[0, -1, -7]`
- 日程：`[0]`
- 提醒时间：`09:00`

保存时把提醒字段一起传给后端：

```js
{
  title,
  date,
  time,
  type,
  isLunar,
  remindEnabled,
  remindTime,
  remindOffsets
}
```

#### 2. 生日/日程卡片展示提醒状态

文件：`components/dashboard/DashboardSchedule.vue`

在卡片上展示简短状态：

```text
已提醒：当天、提前1天
```

如果未开启：

```text
未开启提醒
```

#### 3. 通知中心展示提醒类型

文件：`pages/notifications/notifications.vue`

当前通知卡片不要只显示：

```text
提醒
今天 17:20 记得：22223
```

这种文案太像系统日志，用户很难一眼判断是什么、要不要处理。提醒消息应该按类型做成更有场景感的卡片。

#### 通知卡片 UI 建议

卡片从上到下分 4 层：

```text
┌────────────────────────────┐
│ [图标] 生日提醒        今天 09:00 │
│                            │
│ 今天是妈妈的生日             │
│ 记得准备祝福或礼物             │
│                            │
│ [查看生日]        [稍后提醒]   │
└────────────────────────────┘
```

日程提醒：

```text
┌────────────────────────────┐
│ [图标] 日程提醒        今天 17:20 │
│                            │
│ 17:20 记得：交房租            │
│ 来自：我的家 · 日程            │
│                            │
│ [查看日程]        [标为已读]   │
└────────────────────────────┘
```

#### 卡片信息层级

第一行：

- 左侧：类型图标 + 类型标题
- 右侧：触发时间，如 `今天 09:00`、`明天 20:00`

第二行：

- 主提醒文案，字号最大、颜色最深
- 生日强调“谁的生日”
- 日程强调“几点做什么”

第三行：

- 辅助信息，字号小一点
- 可以显示房间名、来源模块、提前几天提醒

第四行：

- 操作按钮
- 生日：`查看生日`、`稍后提醒`
- 日程：`查看日程`、`标为已读`

#### 视觉样式建议

生日提醒：

- 图标：蛋糕或礼物
- 主色：紫色/粉色点缀
- 背景：白色卡片 + 极浅暖色标签
- 标题：`生日提醒`

日程提醒：

- 图标：铃铛或日历
- 主色：蓝色/靛蓝点缀
- 背景：白色卡片 + 极浅蓝色标签
- 标题：`日程提醒`

过期未读提醒：

- 右上角显示 `已过期`
- 主按钮变成 `查看`
- 不再显示 `稍后提醒`

#### 文案模板

生日当天：

```text
今天是妈妈的生日
记得准备祝福或礼物
```

生日前一天：

```text
明天是妈妈的生日
提前准备一下，别到当天才想起来
```

生日提前 7 天：

```text
7天后是妈妈的生日
现在准备礼物刚刚好
```

日程当天：

```text
17:20 记得：交房租
来自：我的家 · 日程
```

日程提前一天：

```text
明天 17:20：交房租
提前安排一下时间
```

#### 当前截图的优化示例

原文案：

```text
提醒
今天 17:20 记得：22223
```

优化后：

```text
日程提醒                         今天 17:19
17:20 记得：22223
来自：生日 · 日程

[查看日程] [标为已读]
```

如果这是生日提醒，则应该是：

```text
生日提醒                         今天 17:19
今天是 22223 的生日
记得准备祝福或礼物

[查看生日] [稍后提醒]
```

#### 通知数据建议

通知接口最好返回足够前端渲染卡片的信息：

```json
{
  "id": 1,
  "type": "schedule_reminder",
  "targetId": 100,
  "targetType": "schedule",
  "title": "日程提醒",
  "content": "17:20 记得：交房租",
  "subtitle": "来自：我的家 · 日程",
  "triggerTime": "2026-05-26 17:19:00",
  "eventTime": "2026-05-26 17:20:00",
  "roomName": "我的家",
  "status": "unread",
  "actions": ["view", "mark_read"]
}
```

生日提醒：

```json
{
  "type": "birthday_reminder",
  "targetType": "birthday",
  "title": "生日提醒",
  "content": "明天是妈妈的生日",
  "subtitle": "提前准备一下，别到当天才想起来",
  "actions": ["view", "snooze"]
}
```

通知点击后跳转：

- 生日提醒：跳到生日/日程页并定位日期
- 日程提醒：跳到日程详情或当前日程列表

### 后端改动清单

#### 1. 日程表增加提醒字段

如果后端当前直接使用 `schedules` 表，可以加：

```sql
ALTER TABLE schedules
  ADD COLUMN remind_enabled TINYINT NOT NULL DEFAULT 1 COMMENT '是否开启提醒',
  ADD COLUMN remind_time VARCHAR(5) NOT NULL DEFAULT '09:00' COMMENT '提醒时间 HH:mm',
  ADD COLUMN remind_offsets JSON NULL COMMENT '提醒偏移天数，如 [0,-1,-7]',
  ADD COLUMN repeat_type VARCHAR(32) NOT NULL DEFAULT 'none' COMMENT 'none/yearly',
  ADD COLUMN birthday_calendar VARCHAR(16) NULL COMMENT '生日历法：solar/lunar',
  ADD COLUMN birthday_original_date DATE NULL COMMENT '用户选择的原始生日日期',
  ADD COLUMN birthday_month INT NULL COMMENT '生日月份，公历或农历月',
  ADD COLUMN birthday_day INT NULL COMMENT '生日日期，公历或农历日',
  ADD COLUMN birthday_leap_month TINYINT NOT NULL DEFAULT 0 COMMENT '农历生日是否闰月',
  ADD COLUMN next_occurrence_date DATE NULL COMMENT '下一次实际发生的公历日期，用于列表排序和展示';
```

生日数据：

- `repeat_type = 'yearly'`
- `remind_offsets = [0, -1, -7]`
- `birthday_calendar = 'solar' | 'lunar'`
- `birthday_month` / `birthday_day` 永久保存用户选择的生日规则
- `next_occurrence_date` 保存下一次生日对应的公历日期，可随年份重新计算

普通日程：

- `repeat_type = 'none'`
- `remind_offsets = [0]`
- `birthday_*` 字段为空

生日不要只存两个“固定日期”。建议分清两类数据：

```text
生日规则，长期保存：
- birthday_calendar
- birthday_month
- birthday_day
- birthday_leap_month
- birthday_original_date

下一次发生日期，可重新计算：
- next_occurrence_date
- reminder_jobs.remind_at
```

也就是说：农历生日创建时，后端可以立刻换算出今年或下一年的公历生日，写入 `next_occurrence_date` 和 `reminder_jobs`；但生日本体仍然以农历月日为准。

#### 2. 新增提醒任务表

建议新增一张提醒任务表，避免每次扫描所有生日和日程：

```sql
CREATE TABLE reminder_jobs (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  user_id BIGINT NULL,
  remind_at DATETIME NOT NULL,
  title VARCHAR(255) NOT NULL,
  content VARCHAR(500) NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'in_app',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  sent_at DATETIME NULL,
  retry_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_schedule_channel_time (schedule_id, channel, remind_at),
  KEY idx_status_remind_at (status, remind_at),
  KEY idx_room_remind_at (room_id, remind_at)
);
```

第一期只使用：

```text
channel = in_app
status = pending/sent/failed/cancelled
```

#### 3. 创建日程时生成提醒任务

接口：`/schedule/add`

保存日程后，根据 `remind_offsets` 生成 `reminder_jobs`。

普通日程：

- 使用用户选择的 `date + remindTime` 作为基准时间。
- 根据 `remindOffsets` 往前推，生成一次性提醒任务。

公历生日：

- 使用 `birthday_month + birthday_day` 计算今年生日。
- 如果今年生日已经过去，使用下一年生日。
- 得到实际公历日期后，再根据 `remindOffsets` 生成提醒任务。

农历生日：

- 保存用户选择的农历 `birthday_month + birthday_day + birthday_leap_month`。
- 后端用农历换算工具计算目标年份对应的公历日期。
- 如果目标年份生日已过，换算下一年。
- 换算结果只写入 `next_occurrence_date` 和 `reminder_jobs.remind_at`，不要覆盖农历生日规则。

示例：

```text
公历生日日期：2026-05-30
提醒时间：09:00
偏移：[0, -1, -7]

生成：
2026-05-30 09:00
2026-05-29 09:00
2026-05-23 09:00
```

如果是生日：

- 生成今年或下一次生日的提醒任务
- 当今年生日已过时，生成下一年的任务
- 发送完今年的生日提醒后，再补生成下一年的提醒任务

农历生日示例：

```text
用户选择：农历三月十七
保存生日规则：
birthday_calendar = lunar
birthday_month = 3
birthday_day = 17
birthday_leap_month = 0

后端计算 2026 年农历三月十七对应的公历日期
假设结果：2026-05-03

生成提醒：
2026-05-03 09:00
2026-05-02 09:00
2026-04-26 09:00
```

#### 4. 定时任务发送站内提醒

后端增加定时任务，每分钟或每 5 分钟执行一次：

```text
查询 reminder_jobs
where status = 'pending'
and remind_at <= now()
limit 100
```

对每条任务：

1. 写入现有 `notifications` 表
2. 把 `reminder_jobs.status` 改成 `sent`
3. 记录 `sent_at`
4. 如果失败，记录 `failed` 或增加 `retry_count`

#### 5. 修改/删除日程时同步提醒任务

修改日程：

- 取消未发送的旧任务：`status = cancelled`
- 按新规则重新生成任务

删除日程：

- 取消未发送任务：`status = cancelled`

### API 改动清单

#### 创建日程/生日

接口：`POST /schedule/add`

新增参数：

```json
{
  "remindEnabled": true,
  "remindTime": "09:00",
  "remindOffsets": [0, -1, -7]
}
```

#### 日程列表

接口：`GET /schedule/list`

返回新增字段：

```json
{
  "remindEnabled": true,
  "remindTime": "09:00",
  "remindOffsets": [0, -1, -7],
  "repeatType": "yearly"
}
```

### 一期验收标准

- 创建生日时可以开启/关闭提醒
- 创建生日时可以选择当天、提前 1 天、提前 3 天、提前 7 天
- 创建普通日程时可以设置提醒时间
- 到提醒时间后通知中心出现未读提醒
- 首页未读数量增加
- 点击提醒后能进入相关页面
- 删除日程后不会继续提醒
- 修改日期/提醒时间后按新时间提醒
- 同一提醒不会重复生成多条通知
- 生日可以在下一年继续提醒

## 第二期：手机日历

目标：让用户主动把生日或日程加入手机系统日历。

实现方式：

- 前端增加 `加入手机日历` 按钮
- 使用微信小程序日历 API
- 生日使用每年重复
- 日程使用单次事件
- 成功后记录 `calendar_synced = 1`

适合入口：

- 创建成功弹窗
- 生日卡片更多菜单
- 日程详情页

注意点：

- 不能默认静默写入，需要用户主动触发
- 写入后用户可能在系统日历里删除，小程序不一定能感知
- 农历生日写入系统日历时要先换算成下一次公历日期

## 第三期：微信订阅消息

目标：用户授权后，到期通过微信服务通知提醒。

实现方式：

- 前端在开启微信提醒时调用 `wx.requestSubscribeMessage`
- 后端保存用户授权结果和模板 ID
- 定时任务到点后调用微信订阅消息发送接口
- 发送成功/失败都记录日志

需要新增：

- 订阅消息模板
- 用户订阅授权记录表
- 微信 access_token 管理
- 发送失败重试策略

注意点：

- 用户必须主动授权
- 一次性订阅和长期订阅能力要按小程序类目确认
- 文案必须匹配微信模板字段

## 第四期：邮件提醒

目标：给不常打开微信的用户提供补充提醒。

实现方式：

- 用户中心增加邮箱绑定和验证
- 提醒设置里增加 `邮件提醒`
- 后端定时任务发送邮件
- 邮件里提供关闭入口

适合提醒：

- 生日提前 7 天
- 重要日程提前 1 天
- 每日提醒摘要

注意点：

- 必须做邮箱验证
- 必须支持退订或关闭
- 需要控制频率，避免被判定为垃圾邮件

## 第五期：短信或 App 推送

短信适合高优先级提醒，但有成本。

可以作为会员功能或重要提醒：

- 生日当天短信
- 账单/房租/合同到期
- 多人房间的重要事项

如果未来做原生 App，可以增加：

- iOS APNs
- Android 厂商推送
- 本地通知

## 推荐优先级

1. 第一期：站内提醒
2. 第二期：手机日历
3. 第三期：微信订阅消息
4. 第四期：邮件提醒
5. 第五期：短信/App 推送

这个顺序的好处是：第一期不依赖外部授权，最容易闭环；后面每增加一种渠道，只需要扩展提醒任务的 `channel`，不用重写生日和日程逻辑。
