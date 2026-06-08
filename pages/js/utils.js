import dataJson from '/data.json';
/**
 * 邮箱正则
 * @param {Object} email
 */
export function isEmailValid(email) {
	const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
	return emailPattern.test(email);
}

//除法保留两位小数
export function countDay(dividend, divisor) {
	const quotient = dividend / divisor;
	return quotient.toFixed(2); // 保留两位小数
}
/**
 * 格式化时间戳为：今日 14:30 / 昨日 18:20 / 11月15日
 * @param {number} timestamp 毫秒时间戳
 */
export function formatSmartTime(timestamp) {
  if (!timestamp) return ''

  const now = new Date()
  const date = new Date(timestamp)

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()

  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000

  const pad = n => String(n).padStart(2, '0')

  // 今天
  if (date.getTime() >= startOfToday) {
    return `今日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // 昨天
  if (date.getTime() >= startOfYesterday) {
    return `昨日`
  }

  // 今年内
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 非今年
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}



// 图片转64
export function base64(url, type){
	
	   return new Promise((resolve, reject) => {
	     wx.getFileSystemManager().readFile({
	       filePath: url, //选择图片返回的相对路径
	       encoding: 'base64', //编码格式
	       success: res => {
	         // resolve('data:image/' + type.toLocaleLowerCase() + ';base64,' + res.data)
	         resolve(res.data)
	       },
	       fail: res => reject(res.errMsg)
	     })
	   })
}

export function compareTimestamp(timestamp) {
	const currentTime = new Date().getTime();
	const timeDiff = currentTime - timestamp;

	if (timeDiff < 60000) {
		return '1分钟内';
	} else if (timeDiff < 3600000) {
		return Math.floor(timeDiff / 60000) + '分钟';
	} else if (timeDiff < 86400000) {
		return Math.floor(timeDiff / 3600000) + '小时';
	} else if (timeDiff < 2592000000) {
		return Math.floor(timeDiff / 86400000) + '天';
	} else if (timeDiff < 7776000000) {
		return Math.floor(timeDiff / 2592000000) + '月';
	} else {
		return null;
	}
}

export function formattedNumber(value) {
	if (value >= 100000) {
		return Math.floor(value / 1000) + 'K+';
	} else if (value >= 1000) {
		return Math.floor(value / 1000) + 'K';
	} else {
		return value.toString();
	}
}


/**
 * 判断字符串为null
 * @param {Object} value
 */
export function isEmpty(value) {
	if (value === null || value === undefined) {
		// 如果值为null或undefined，视为空
		return true;
	} else if (typeof value === 'object' && value !== null) {
		// 检查对象是否为空
		return Object.keys(value).length === 0;
	} else if (typeof value === 'string') {
		// 检查字符串是否为空
		return value.trim() === '';
	} else {
		// 其他情况，例如数字等，都视为空
		return !value;
	}
}

/**
 * 格式化日期 yyyy-HH-dd
 * @param {Object} ts
 */

export function getDateStr(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

/** 首页顶部日期：5月18日 · 星期一 */
export function getHomeHeaderDateLabel(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${WEEKDAY_LABELS[d.getDay()]}`
}

/**
 * 日期格式化 HH:ss
 * @param {Object} ts
 */
export function getTimeStr(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 字符串转时间戳
 * @param {Object} dateStr
 * @param {Object} timeStr
 */
export function toTimestamp(dateStr, timeStr) {
	console.log("打印时间",dateStr);
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)

  return new Date(year, month - 1, day, hour, minute).getTime()
}




//获取文件类型
export function getFileExtension(url) {
	// 使用JavaScript获取文件后缀
	// 通过最后一个斜杠 '/' 将链接分割为路径和文件名
	const parts = url.split("/");
	const fileName = parts[parts.length - 1];

	// 使用点 '.' 将文件名分割为文件名和后缀
	const fileNameParts = fileName.split(".");

	// 获取最后一个部分作为文件后缀
	const fileExtension = fileNameParts[fileNameParts.length - 1];

	return fileExtension.toLowerCase(); // 返回小写的文件后缀
}

/**
 * 格式化日期
 */
export function formatDate(timestamp, format = 'yyyy-MM-dd') {
  if (timestamp === null || timestamp === undefined || timestamp === '') {
    return '';
  }

  let date;

  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    const ts = Number(timestamp);
    date = new Date(ts < 1e12 ? ts * 1000 : ts);
  }

  if (isNaN(date.getTime())) return '';

  const map = {
    yyyy: date.getFullYear().toString(),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    dd: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  };

  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, k => map[k]);
}


/**
 * 价格格式化
 */
export const formatPrice = (val) => {
  if (val === undefined || val === null || val === '') return '0.00'

  const num = Number(val)
  if (isNaN(num)) return '0.00'

  // 保留两位小数（字符串）
  const fixed = num.toFixed(2)

  // 千分位
  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return parts.join('.')
}




/**
 * 时间格式化
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const d = new Date(Number(timestamp));
  if (isNaN(d.getTime())) return '';
  const diff = now - d;

  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;

  const pad = (n) => n.toString().padStart(2, '0');
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  if (d.toDateString() === now.toDateString()) return `今天 ${hours}:${minutes}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `昨日`;

  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日 ${hours}:${minutes}`;

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * 判断是否登录,弹出对话框
 */
export function isLoginDialog(){
	if(dataJson.isLogin){
		return true;
	}
	uni.showModal({
	    title: '温馨提示',
	    content: '登录后体验更好的内容',
	    success: function (res) {
	        if (res.confirm) {
	           uni.navigateTo({
	           	url:"/pageLogin/login/login"
				  	// url:"/pageMine/step/step"
	           })
	        } 
	    }
	});
	
	return false;
}

export function goToLogin() {
  if (dataJson.isLogin) {
    return true
  }

  // 可选：把邀请码继续带到登录页
  const inviteCode = uni.getStorageSync('inviteCode')
  
  console.log("打印登录跳转",inviteCode);

  uni.navigateTo({
    url: inviteCode
      ? `/pages/login/login?inviteCode=${inviteCode}`
      : '/pages/login/login'
  })

  return false
}


/**
 * 数字格式化成 w+
 * @param {Object} num
 */
export function formatNumber(num) {
	if (num >= 10000) {
		const result = Math.floor(num / 100) / 100; // 保留一位小数，不四舍五入
		return result;
	} else {
		return num.toString();
	}
}

/**
 * 判断是否大于10000
 * @param {Object} num
 */
export function isFormatNumber(num) {
	if (num >= 10000) {
		return true;
	} else {
		return false;
	}
}

/**
 * 判断是什么平台
 */
export function isPlatfrom() {
	if (dataJson.platfrom == 'weixin') {
		return 1;
	} else if (dataJson.platfrom == "qq") {
		return 2;
	}else if(dataJson.platfrom=='toutiao'){
		return 3;
	} else {
		return 0;
	}
}

export function settitle(title){
	if(dataJson.platfrom=='toutiao'){
		if (uni.canIUse('setNavigationBarTitle')) {
			uni.setNavigationBarTitle({
				title: title
			});
		}
	}
}


export function jump(path) {
	var json = JSON.parse(path);
	let url = "";
	if (json.type == 0) { //webView
		url = "/pageLogin/webview/webView?path=" + json.url;
	} else if (json.type == 1) { //壁纸
		url = "/pages/classlist/classlist?emoteWallpaperId=" + json.url + "&name=" + json.title;
	} else if (json.type == 2) { //
		url = '/pageLogin/emoteDetail/emoteDetail?categoryEmoteId=' +json.url;
	}else {
		url=json.url;
	}
	uni.navigateTo({
		url: url
	})
}


/**
 * 时间格式化
 * @param {Object} timestamp
 */
export function timestampToDateFormat(timestamp) {
	const dateObj = new Date(timestamp); // 创建Date对象
	const options = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}; // 设置日期格式选项
	const formattedDate = dateObj.toISOString().slice(0, 10); // 使用toISOString()方法获取ISO格式的日期字符串，再截取前10个字符
	const [year, month, day] = formattedDate.split("-"); // 拆分年、月、日

	return `${year}-${month}-${day}`; // 返回转换后的日期格式
}

/**
 * 数字格式化，保留两位小数
 * @param {number|string|null|undefined} value
 * @returns {string} 如 0.00 / 12.30 / 99.99
 */
export function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return '0.00'
  }

  const num = Number(value)

  if (isNaN(num)) {
    return '0.00'
  }

  return num.toFixed(2)
}

export function dateToTimestamp(dateStr) {
  // dateStr: '2026-02-05'
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}

/** 任务 dueDate 统一转为 YYYY-MM-DD，兼容时间戳/字符串 */
export function normalizeTaskDueDate(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'number') {
    return formatDate(value, 'yyyy-MM-dd')
  }
  if (typeof value === 'string') {
    if (value.includes('今天')) return getDateStr(Date.now())
    if (/^\d+$/.test(value.trim())) {
      return formatDate(Number(value), 'yyyy-MM-dd')
    }
    const matched = value.match(/(\d{4}-\d{2}-\d{2})/)
    return matched ? matched[1] : value.length >= 10 ? value.slice(0, 10) : ''
  }
  return ''
}

/** 任务 dueDate 提交给接口时使用当天 0 点时间戳 */
export function toTaskDueDateTimestamp(dateStr) {
  const normalized = normalizeTaskDueDate(dateStr)
  if (!normalized) return undefined
  return dateToTimestamp(normalized)
}

