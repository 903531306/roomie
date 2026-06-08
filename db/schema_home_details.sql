-- db/schema_home_details.sql
-- 首页与房间详情相关表（MySQL 5.7+/8.0），包含表与字段备注
SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- rooms
-- 房间表（系统的核心业务实体）
-- 说明：
-- 1. 一个房间代表一个协作空间（家庭 / 同屋 / 项目组）
-- 2. 所有业务数据（记账 / 清单 / 日程 / 组合）都必须归属某个房间
-- 3. 与用户是【多对多】关系，通过 room_members 关联
-- 典型用法：
-- - 首页展示房间列表
-- - 作为所有子功能的根节点
-- -room_type  标记房间类别，可以是 'family'（家庭）、'workspace'（工作空间）、'study'（学习房间）等。前端可以根据类型显示不同图标、功能组合或者访问权限。
-- -room_type = 'family' → 家庭房，可能显示 记账 + 清单 + 日程
-- -room_type = 'workspace' → 工作房，可能显示 组合/任务/项目管理功能
-- -room_type = 'guest' → 来宾房，可能功能受限，只能查看或者参与部分功能

-- =====================================================
DROP TABLE IF EXISTS rooms;

CREATE TABLE rooms (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '房间ID（主键）',
  name VARCHAR(128) NOT NULL COMMENT '房间名称',
  icon VARCHAR(128) NOT NULL COMMENT '房间图标',
  owner_id INT NOT NULL COMMENT '房主用户ID（emote_users.user_id）',
  invite_code VARCHAR(32) UNIQUE COMMENT '房间邀请码（用于分享加入）',
  room_type VARCHAR(64) NULL COMMENT '房间类型（family/workspace/etc）',
  created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '创建时间（秒级时间戳）',
  CONSTRAINT fk_rooms_owner FOREIGN KEY (owner_id) REFERENCES emote_users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间表（协作空间核心）';



-- =====================================================
-- room_members
-- 房间成员关系表
-- 说明：
-- 1. 用于表示【用户 ↔ 房间】的多对多关系
-- 2. 同一个用户可以加入多个房间
-- 3. 同一个房间可以有多个成员
-- 4. role 用于权限控制（房主 / 管理员 / 普通成员）
-- 典型用法：
-- - 查询房间成员列表
-- - 判断用户是否有权限操作某房间
-- =====================================================
DROP TABLE IF EXISTS room_members;

CREATE TABLE room_members (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '成员关系ID',
  room_id BIGINT NOT NULL COMMENT '房间ID（rooms.id）',
  user_id INT NOT NULL COMMENT '用户ID（emote_users.user_id）',
  role ENUM('owner','admin','member') NOT NULL DEFAULT 'member' COMMENT '成员角色',
  joined_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '加入时间',
  is_active TINYINT  NOT NULL DEFAULT 1 COMMENT '是否有效成员',
  UNIQUE KEY uq_room_user (room_id, user_id),
  CONSTRAINT fk_rm_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_rm_user FOREIGN KEY (user_id) REFERENCES emote_users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间成员表（用户-房间多对多）';



-- =====================================================
-- features
-- 功能字典表（系统级）
-- 说明：
-- 1. 定义系统中“有哪些功能模块”
-- 2. 只描述功能本身，不绑定任何房间
-- 3. 新增功能时只需要往这张表插数据
-- 典型功能：
-- - ledger（记账）
-- - task（清单）
-- - schedule（日程）
-- - combo（组合）
-- =====================================================
DROP TABLE IF EXISTS features;
CREATE TABLE features (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '功能ID',
  code VARCHAR(64) NOT NULL UNIQUE COMMENT '功能编码（ledger/task/schedule/combo）',
  name VARCHAR(128) NOT NULL COMMENT '功能名称',
  icon VARCHAR(128) NOT NULL COMMENT '功能图标',
  is_active TINYINT  NOT NULL DEFAULT 1 COMMENT '是否有效 就是是否显示 1.显示 2不显示',
  default_config JSON NULL COMMENT '功能默认配置（系统级）',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000)  COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统功能字典表';


-- =====================================================
-- room_features
-- 房间功能配置表（非常核心）
-- 说明：
-- 1. rooms 与 features 的【多对多关系表】
-- 2. 用于控制某个房间启用了哪些功能
-- 3. enabled 控制功能是否启用
-- 4. sort_order 控制功能在房间内的显示顺序（值越小越靠前）
-- 5. config 用于覆盖功能在该房间下的个性化配置
-- 典型用法：
-- - 首页决定显示哪些 Tab
-- - 首页推荐默认功能（排序第一）
-- - 后端判断功能是否可用
-- - 支持用户自定义功能顺序
-- =====================================================
DROP TABLE IF EXISTS room_features;
CREATE TABLE room_features (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  room_id BIGINT NOT NULL COMMENT '房间ID（rooms.id）',
  feature_id BIGINT NOT NULL COMMENT '功能ID（features.id）',

  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用该功能',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '功能在房间内的排序顺序，值越小越靠前',
  config JSON NULL COMMENT '房间级功能配置（JSON，可覆盖默认配置）',

  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '创建时间',

  UNIQUE KEY uq_room_feature (room_id, feature_id),
  KEY idx_rf_room_sort (room_id, sort_order),

  CONSTRAINT fk_rf_room
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,

  CONSTRAINT fk_rf_feature
    FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COMMENT='房间功能开关、排序与配置表';



-- =====================================================
-- room_accounts
-- 房间账本表
-- 说明：
-- 1. 一个房间可以有多个账本
-- 2. 账本下有多条流水（ledger_entries）
-- 3. balance 为缓存字段，用于首页快速展示
-- =====================================================
DROP TABLE IF EXISTS room_accounts;
CREATE TABLE room_accounts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '账本ID',
  room_id BIGINT NOT NULL COMMENT '所属房间ID',
  name VARCHAR(128) NOT NULL COMMENT '账本名称',
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY' COMMENT '币种',
  balance DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '账本余额缓存',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '创建时间',
  CONSTRAINT fk_ra_accounts_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间账本表';


-- =====================================================
-- ledger_entries
-- 账本流水表
-- 说明：
-- 1. 每一条记录代表一次收支
-- 2. 必须隶属于某个账本和房间
-- 3. 是记账功能的核心数据表
-- =====================================================
DROP TABLE IF EXISTS ledger_entries;
CREATE TABLE ledger_entries (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '流水ID',
  account_id BIGINT NOT NULL COMMENT '账本ID',
  room_id BIGINT NOT NULL COMMENT '房间ID（冗余，方便查询）',
  created_by BIGINT NULL COMMENT '创建人用户ID',
  type ENUM('income','expense','transfer') NOT NULL COMMENT '流水类型',
  amount DECIMAL(14,2) NOT NULL COMMENT '金额',
  category VARCHAR(64) NULL COMMENT '分类',
  note TEXT NULL COMMENT '备注',
  entry_time  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '发生时间',
  CONSTRAINT fk_le_account FOREIGN KEY (account_id) REFERENCES room_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账本流水记录表';


-- =====================================================
-- tasks
-- 房间清单 / 任务表
-- 说明：
-- 1. 用于待办事项、购物清单、分工任务
-- 2. 每条任务归属一个房间
-- 3. 可选归属到某个清单（task_lists）
-- =====================================================
DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
  room_id BIGINT NOT NULL COMMENT '所属房间',
  list_id BIGINT NULL COMMENT '所属清单ID（task_lists.id）',
  title VARCHAR(255) NOT NULL COMMENT '任务标题',
  description TEXT NULL COMMENT '任务描述',
  assignee_id BIGINT NULL COMMENT '负责人用户ID',
  status ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  due_date DATE NULL COMMENT '截止日期',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '创建时间',
  CONSTRAINT fk_task_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_list FOREIGN KEY (list_id) REFERENCES task_lists(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间任务/清单表';



-- =====================================================
-- task_lists
-- 房间清单集合表（支持一个房间多个清单）
-- 说明：
-- 1. 一个房间可以创建多个清单（如：购物清单 / 待办清单 / 装修清单）
-- 2. tasks 通过 list_id 归属到某个清单
-- 3. 不影响原有“一个房间直接有任务”的用法
-- =====================================================
DROP TABLE IF EXISTS task_lists;
CREATE TABLE task_lists (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '清单ID',
  room_id BIGINT NOT NULL COMMENT '所属房间ID（rooms.id）',
  name VARCHAR(128) NOT NULL COMMENT '清单名称',
  description TEXT NULL COMMENT '清单说明',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '创建时间',
  CONSTRAINT fk_tl_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间清单集合表';




-- =====================================================
-- schedules
-- 房间日程表
-- 说明：
-- 1. 用于事件、提醒、家庭日程
-- 2. 时间维度数据，支持全天事件
-- =====================================================
DROP TABLE IF EXISTS schedules;
CREATE TABLE schedules (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '日程ID',
  room_id BIGINT NOT NULL COMMENT '所属房间',
  title VARCHAR(255) NOT NULL COMMENT '日程标题',
  description TEXT NULL COMMENT '日程描述',
  start_time DATETIME NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '开始时间',
  end_time DATETIME NULL COMMENT '结束时间',
  is_all_day TINYINT NOT NULL DEFAULT 0 COMMENT '是否全天',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '创建时间',
  CONSTRAINT fk_sch_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间日程表';


-- =====================================================
-- combos
-- 功能组合表
-- 说明：
-- 1. 组合 = 多个功能的聚合入口或模板
-- 2. 用于“装修模式 / 旅行模式 / 宝宝模式”等
-- =====================================================
DROP TABLE IF EXISTS combos;
CREATE TABLE combos (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '组合ID',
  room_id BIGINT NOT NULL COMMENT '所属房间',
  name VARCHAR(128) NOT NULL COMMENT '组合名称',
  description TEXT NULL COMMENT '组合说明',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '创建时间',
  CONSTRAINT fk_combo_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='功能组合表';


DROP TABLE IF EXISTS combo_items;
CREATE TABLE combo_items (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '组合项ID',
  combo_id BIGINT NOT NULL COMMENT '组合ID',
  feature_id BIGINT NOT NULL COMMENT '功能ID',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '显示顺序',
  CONSTRAINT fk_ci_combo FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_feature FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组合包含的功能明细表';


-- =====================================================
-- room_activity
-- 房间活动日志
-- 说明：
-- 1. 用于首页时间线
-- 2. 记录成员在房间内的关键行为
-- =====================================================
DROP TABLE IF EXISTS room_activity;
CREATE TABLE room_activity (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '活动ID',
  room_id BIGINT NOT NULL COMMENT '房间ID',
  activity_type VARCHAR(64) NOT NULL COMMENT '活动类型',
  actor_id BIGINT NULL COMMENT '操作人用户ID',
  metadata JSON NULL COMMENT '活动附加数据',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '活动时间',
  CONSTRAINT fk_ra_activity_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间活动日志表';


-- =====================================================
-- room_stats
-- 房间统计缓存表
-- 说明：
-- 1. 首页快速读取用
-- 2. 所有字段都可通过异步或定时任务更新
-- =====================================================
DROP TABLE IF EXISTS room_stats;
CREATE TABLE room_stats (
  room_id BIGINT NOT NULL PRIMARY KEY COMMENT '房间ID',
  member_count INT NOT NULL DEFAULT 0 COMMENT '成员数量缓存',
  pending_tasks INT NOT NULL DEFAULT 0 COMMENT '待办数量缓存',
  account_balance DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT '总余额缓存',
  last_activity_at TIMESTAMP NULL COMMENT '最近活动时间',
  CONSTRAINT fk_rs_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='房间首页统计缓存表';


-- =====================================================
-- ledger_stats_daily
-- 账本每日统计缓存表
-- 说明：
-- 1. 用于趋势图、统计图
-- 2. 每天每房间一行
-- 3. 通过定时任务或写入时同步更新
-- =====================================================
DROP TABLE IF EXISTS ledger_stats_daily;
CREATE TABLE ledger_stats_daily (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  room_id BIGINT NOT NULL COMMENT '房间ID',
  stat_date DATE NOT NULL COMMENT '统计日期',
  total_income DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '当日总收入',
  total_expense DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '当日总支出',
  net_amount DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '当日净额',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '生成时间',
  UNIQUE KEY uq_room_date (room_id, stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账本每日统计缓存表';

-- =====================================================
-- ledger_stats_monthly_category
-- 账本按「月份 + 分类」统计缓存表
-- 说明：
-- 1. 用于按分类展示月度支出/收入占比（饼图、柱状图）
-- 2. 每个房间、每个月、每个分类只有一条记录
-- 3. 数据来源于 ledger_entries 表的聚合结果
-- 4. 适合高频读取，避免实时 GROUP BY 大表
-- 典型用法：
-- - 月度分类支出占比图
-- - 查看某月各分类消费分布
-- =====================================================
DROP TABLE IF EXISTS ledger_stats_monthly_category;
CREATE TABLE ledger_stats_monthly_category (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  room_id BIGINT NOT NULL COMMENT '房间ID（rooms.id）',
  stat_month CHAR(7) NOT NULL COMMENT '统计月份（YYYY-MM）',
  category VARCHAR(64) NOT NULL COMMENT '账目分类',
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '该分类当月总金额',
  created_at  BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) COMMENT '生成时间',
  UNIQUE KEY uq_room_month_category (room_id, stat_month, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账本按月分类统计缓存表';


INSERT INTO rooms ( name, icon, invite_code,owner_id) VALUES
( '我们家', '🏠', 'family',103),
( '周末采购计划', '🛒', 'family'),
( '爸妈养老空间', '❤️', 'family',103);


-- -ledger/task/schedule/combo
INSERT INTO features ( code,icon, name) VALUES
( 'ledger', '💰', '记账'),
( 'task', '📝', '清单'),
( 'schedule', '📅', '日程'),
( 'combo', '🏠', '组合');




SET FOREIGN_KEY_CHECKS = 1;






COMMIT;

-- 说明：
-- - 建议在应用写操作（添加流水/任务/成员变更）时同步更新 room_stats 以保证首页读取性能。
-- - JSON 字段用于灵活配置（room_settings.metadata、room_activity.metadata 等）。


