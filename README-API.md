# Roomie API 使用指南

## 概述

Roomie 项目使用统一的 API 调用方式，所有接口都通过 `common/api/index.ts` 模块导出，支持 TypeScript 类型安全。

## API 结构

```
common/api/
├── index.ts       # API 统一导出
└── utils/request.ts  # HTTP 请求工具
```

## 基础用法

### 1. 导入 API 模块

```typescript
// 导入特定模块
import { userApi, roomApi } from '@/common/api';

// 或者导入全部 API
import { api } from '@/common/api';
```

### 2. 调用 API

```typescript
// 方式1：直接使用模块
const userInfo = await userApi.getUserInfo();

// 方式2：使用统一API对象
const userInfo = await api.user.getUserInfo();
```

## 完整示例

### 用户登录 (login.vue 中的实现)

```typescript
import { userApi } from '@/common/api';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const handleWechatLogin = async () => {
  try {
    // 显示加载状态
    uni.showLoading({ title: '安全连接中' });

    // 获取微信登录code
    const loginRes = await uni.login({
      provider: 'weixin',
      onlyAuthorize: true
    });

    // 调用登录API
    const loginResult = await userApi.login(loginRes.code);

    // 处理登录结果
    if (loginResult.code === 0) {
      // 登录成功
      const userData = loginResult.data.user;

      // 保存到store
      userStore.state.currentUser = userData;
      userStore.state.isLoggedIn = true;
      uni.setStorageSync('userInfo', userData);

      // 保存token
      uni.setStorageSync('token', loginResult.data.token);

      uni.showToast({ title: '登录成功', icon: 'success' });

      // 跳转页面
      uni.reLaunch({ url: '/pages/index/index' });

    } else if (loginResult.code === 333) {
      // 需要完善信息
      showEditModal.value = true;
    } else {
      throw new Error(loginResult.message);
    }

  } catch (error) {
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    });
  } finally {
    uni.hideLoading();
  }
};
```

### 获取用户信息

```typescript
import { userApi } from '@/common/api';

const loadUserInfo = async () => {
  try {
    const result = await userApi.getUserInfo();
    if (result.code === 0) {
      console.log('用户信息:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};
```

### 创建同屋

```typescript
import { roomApi } from '@/common/api';

const createNewRoom = async (roomData) => {
  try {
    uni.showLoading({ title: '创建中...' });

    const result = await roomApi.createRoom({
      name: roomData.name,
      description: roomData.description,
      avatar: roomData.avatar
    });

    if (result.code === 0) {
      uni.showToast({ title: '创建成功', icon: 'success' });
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    uni.showToast({ title: error.message || '创建失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};
```

### 获取任务列表

```typescript
import { taskApi } from '@/common/api';

const loadTasks = async (roomId, page = 1) => {
  try {
    const result = await taskApi.getTaskList({
      roomId: roomId,
      page: page,
      pageSize: 20,
      status: 'pending' // 可选：筛选状态
    });

    if (result.code === 0) {
      return {
        tasks: result.data.list,
        total: result.data.total,
        hasMore: result.data.list.length === 20
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return { tasks: [], total: 0, hasMore: false };
  }
};
```

## API 模块列表

### 用户相关 API (`userApi`)

- `login(code: string)` - 微信登录
- `getUserInfo()` - 获取用户信息
- `updateUserInfo(data: Partial<User>)` - 更新用户信息

### 同屋相关 API (`roomApi`)

- `createRoom(data)` - 创建同屋
- `joinRoom(inviteCode)` - 加入同屋
- `getRoomInfo(roomId)` - 获取同屋信息
- `updateRoom(roomId, data)` - 更新同屋信息
- `getRoomMembers(roomId)` - 获取同屋成员
- `generateInviteCode(roomId)` - 生成邀请码

### 任务相关 API (`taskApi`)

- `getTaskList(params?)` - 获取任务列表
- `createTask(data)` - 创建任务
- `updateTask(taskId, data)` - 更新任务
- `deleteTask(taskId)` - 删除任务
- `assignTask(taskId, assigneeId)` - 分配任务

### 日程相关 API (`scheduleApi`)

- `getScheduleList(params?)` - 获取日程列表
- `createSchedule(data)` - 创建日程
- `updateSchedule(scheduleId, data)` - 更新日程
- `deleteSchedule(scheduleId)` - 删除日程

### 动态相关 API (`feedApi`)

- `getFeedList(params?)` - 获取动态列表
- `createFeed(data)` - 发布动态
- `likeFeed(feedId)` - 点赞动态

### 文件上传 API (`uploadApi`)

- `uploadImage(filePath, type)` - 上传图片
- `uploadFile(filePath, type)` - 上传文件

## 错误处理

所有 API 调用都会返回统一格式的响应：

```typescript
interface ApiResponse<T = any> {
  code: number;     // 0表示成功，其他为错误码
  message: string;  // 错误信息或成功提示
  data: T;         // 响应数据
}
```

推荐的错误处理模式：

```typescript
try {
  const result = await someApi.call(params);

  if (result.code === 0) {
    // 处理成功
    handleSuccess(result.data);
  } else {
    // 处理业务错误
    handleBusinessError(result.message);
  }
} catch (error) {
  // 处理网络错误或其他异常
  handleNetworkError(error);
}
```

## 最佳实践

1. **统一错误处理**: 在组件中统一处理 API 错误，避免重复代码
2. **Loading 状态**: 调用 API 前显示加载状态，提升用户体验
3. **数据缓存**: 对于不常变的数据，可以考虑本地缓存
4. **类型安全**: 充分利用 TypeScript 类型提示，提高开发效率
5. **异常捕获**: 始终使用 try-catch 包装 API 调用

## 调试技巧

1. **查看请求日志**: 在浏览器开发者工具的 Network 面板查看请求
2. **API 响应**: 在 Console 中查看 API 返回的数据结构
3. **错误排查**: 使用 `console.log` 输出关键变量的值
4. **模拟数据**: 在开发阶段可以使用 mock 数据进行测试

## 首页的接口查询
SELECT
  r.id   AS room_id,
  r.name AS room_name,
  r.icon AS room_icon,
  r.room_type,

  ANY_VALUE(mem.members)         AS members,

  GROUP_CONCAT(DISTINCT f.code ORDER BY rf.sort_order) AS enabled_features,

  ANY_VALUE(led.month_expense)   AS month_expense,

  ANY_VALUE(task.recent_tasks)   AS recent_tasks,

  ANY_VALUE(sch.next_schedule)   AS next_schedule

FROM rooms r

JOIN room_members myrm
  ON myrm.room_id = r.id
 AND myrm.user_id = 103
 AND myrm.is_active = 1

/* ---------- 成员列表 ---------- */
LEFT JOIN (
  SELECT
    rm.room_id,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'user_id', u.user_id,
        'nickname', u.user_nickname,
        'avatar', u.user_head
      )
    ) AS members
  FROM room_members rm
  JOIN emote_users u ON u.user_id = rm.user_id
  WHERE rm.is_active = 1
  GROUP BY rm.room_id
) AS mem ON mem.room_id = r.id

/* ---------- 功能 ---------- */
LEFT JOIN room_features rf
  ON rf.room_id = r.id AND rf.enabled = 1
LEFT JOIN features f
  ON f.id = rf.feature_id

/* ---------- 记账 ---------- */
LEFT JOIN (
  SELECT
    room_id,
    SUM(total_expense) AS month_expense
  FROM ledger_stats_daily
  WHERE stat_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  GROUP BY room_id
) AS led ON led.room_id = r.id

/* ---------- 清单（最近 2 条） ---------- */
LEFT JOIN (
  SELECT
    room_id,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', id,
        'title', title,
        'status', status
      )
    ) AS recent_tasks
  FROM (
    SELECT
      t.*,
      ROW_NUMBER() OVER (
        PARTITION BY t.room_id
        ORDER BY t.created_at DESC
      ) AS rn
    FROM tasks t
    WHERE t.status IN ('pending','in_progress')
  ) AS x
  WHERE rn <= 2
  GROUP BY room_id
) AS task ON task.room_id = r.id

/* ---------- 日程（最近 1 条） ---------- */
LEFT JOIN (
  SELECT
    room_id,
    JSON_OBJECT(
      'start_time', start_time,
      'title', title
    ) AS next_schedule
  FROM (
    SELECT
      s.*,
      ROW_NUMBER() OVER (
        PARTITION BY s.room_id
        ORDER BY s.start_time ASC
      ) AS rn
    FROM schedules s
    WHERE s.start_time >= NOW()
  ) AS x
  WHERE rn = 1
) AS sch ON sch.room_id = r.id

GROUP BY r.id
ORDER BY r.created_at DESC
LIMIT 20;



{
  room_id,
  room_name,
  room_icon,
  room_type,

  members: [
    { user_id, nickname, avatar, role }
  ],

  enabled_features: ["ledger","task","schedule"],

  month_expense: 1234.56,

  recent_tasks: [
    { id, title, status },
    { id, title, status }
  ],

  next_schedule: {
    start_time,
    title
  }
}




