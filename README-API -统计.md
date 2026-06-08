-- =====================================================
-- 账本统计 SQL 汇总（共 4 条）
-- 统计表：
-- 1. ledger_stats_daily
-- 2. ledger_stats_monthly_category
--
-- 数据来源：
-- - ledger_entries（账本流水事实表）
--
-- 设计目标：
-- - 避免高频 GROUP BY 大表
-- - 支持趋势图、分类图、统计面板
-- =====================================================



-- =====================================================
-- 【SQL 1】
-- ledger_stats_daily：单日统计（增量 / 推荐日常使用）
-- -----------------------------------------------------
-- 用途：
-- 1. 统计“某一天”每个房间的收入、支出、净额
-- 2. 适合：
--    - 新增流水后同步更新
--    - 每天凌晨统计“昨天”
--
-- 参数：
-- ? = 统计日期（DATE 类型，如 '2026-01-15'）
-- =====================================================
INSERT INTO ledger_stats_daily (
  room_id,
  stat_date,
  total_income,
  total_expense,
  net_amount
)
SELECT
  room_id,
  DATE(entry_time) AS stat_date,
  SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
  SUM(
    CASE
      WHEN type = 'income'  THEN amount
      WHEN type = 'expense' THEN -amount
      ELSE 0
    END
  ) AS net_amount
FROM ledger_entries
WHERE DATE(entry_time) = ?
GROUP BY room_id, DATE(entry_time)
ON DUPLICATE KEY UPDATE
  total_income  = VALUES(total_income),
  total_expense = VALUES(total_expense),
  net_amount    = VALUES(net_amount);



-- =====================================================
-- 【SQL 2】
-- ledger_stats_daily：全量初始化（只跑一次）
-- -----------------------------------------------------
-- 用途：
-- 1. 系统上线后，首次生成所有历史的“每日统计”
-- 2. 或用于数据修复
--
-- 注意：
-- - 不带 WHERE
-- - 正常情况下只执行一次
-- =====================================================
INSERT INTO ledger_stats_daily (
  room_id,
  stat_date,
  total_income,
  total_expense,
  net_amount
)
SELECT
  room_id,
  DATE(entry_time) AS stat_date,
  SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END),
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END),
  SUM(
    CASE
      WHEN type = 'income'  THEN amount
      WHEN type = 'expense' THEN -amount
      ELSE 0
    END
  )
FROM ledger_entries
GROUP BY room_id, DATE(entry_time);



-- =====================================================
-- 【SQL 3】
-- ledger_stats_monthly_category：单月分类统计（增量 / 推荐）
-- -----------------------------------------------------
-- 用途：
-- 1. 统计“某一个月”下，各分类的金额汇总
-- 2. 用于：
--    - 饼图
--    - 分类柱状图
--    - 月度消费分布
--
-- 参数：
-- ? = 统计月份（CHAR(7)，如 '2026-01'）
-- =====================================================
INSERT INTO ledger_stats_monthly_category (
  room_id,
  stat_month,
  category,
  total_amount
)
SELECT
  room_id,
  DATE_FORMAT(entry_time, '%Y-%m') AS stat_month,
  IFNULL(category, '未分类') AS category,
  SUM(
    CASE
      WHEN type = 'expense' THEN amount
      WHEN type = 'income'  THEN amount
      ELSE 0
    END
  ) AS total_amount
FROM ledger_entries
WHERE DATE_FORMAT(entry_time, '%Y-%m') = ?
GROUP BY room_id, stat_month, category
ON DUPLICATE KEY UPDATE
  total_amount = VALUES(total_amount);



-- =====================================================
-- 【SQL 4】
-- ledger_stats_monthly_category：全量初始化（月 + 分类）
-- -----------------------------------------------------
-- 用途：
-- 1. 系统首次上线时，生成所有历史月份的分类统计
-- 2. 或用于统计表数据重建
--
-- 注意：
-- - 不带 WHERE
-- - 执行前可先 TRUNCATE 统计表
-- =====================================================
INSERT INTO ledger_stats_monthly_category (
  room_id,
  stat_month,
  category,
  total_amount
)
SELECT
  room_id,
  DATE_FORMAT(entry_time, '%Y-%m') AS stat_month,
  IFNULL(category, '未分类') AS category,
  SUM(
    CASE
      WHEN type = 'expense' THEN amount
      WHEN type = 'income'  THEN amount
      ELSE 0
    END
  )
FROM ledger_entries
GROUP BY room_id, stat_month, category;



-- =====================================================
-- 使用总结（非常重要）
-- -----------------------------------------------------
-- 1. 日常线上：
--    - 用 SQL 1（daily 单日）
--    - 用 SQL 3（月度分类）
--
-- 2. 初始化 / 修复：
--    - 用 SQL 2（daily 全量）
--    - 用 SQL 4（月度分类全量）
--
-- 3. 这 4 条 SQL 都是“幂等的”
--    - 可重复执行
--    - 不会产生脏数据
-- =====================================================
