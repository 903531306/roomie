/**
 * 兼容微信小程序：替代 ES2020 的 ?? 链式取值
 * 返回第一个不为 null / undefined 的参数
 */
export function coalesce() {
  for (let i = 0; i < arguments.length; i++) {
    const v = arguments[i];
    if (v != null) return v;
  }
  return arguments.length ? arguments[arguments.length - 1] : undefined;
}

/** 兼容接口返回 { pending: { list: [] } } 或 { pending: [] } */
export function pickApiList(data, key) {
  if (!data || !key) return [];
  const block = data[key];
  if (block && Array.isArray(block.list)) return block.list;
  if (Array.isArray(block)) return block;
  return [];
}
