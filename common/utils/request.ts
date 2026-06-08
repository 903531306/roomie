import type { ApiResponse } from '@/types'
import { appConfig, CONSTANTS, STORAGE_KEYS } from '@/common/config'
import dataJson from '@/data.json'
import {goToLogin} from '@/pages/js/utils.js';

// 请求配置接口
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  showError?: boolean
}

// 网络请求类
class HttpRequest {
  private baseURL: string
  private timeout: number

constructor() {
  let baseURL = appConfig.apiBaseUrl; // 默认生产

  // 只在微信小程序环境下才有 __wxConfig
  if (typeof __wxConfig !== 'undefined') {
    const envVersion = __wxConfig.envVersion;
    console.log('envVersion:', envVersion);

    if (envVersion === 'develop') {
      // 开发版 → 测试环境
      baseURL = 'http://127.0.0.1:8889/QuestionBank-test/';
	    // baseURL = 'http://127.0.0.1:8888/QuestionBank1/';
	    // baseURL = appConfig.apiBaseUrl;
    } else if (envVersion === 'trial') {
      // 体验版 → 一般也走生产（可按需改）
      baseURL = appConfig.apiBaseUrl;
    } else if (envVersion === 'release') {
      // 正式版 → 生产
      baseURL = appConfig.apiBaseUrl;
    }
  }

  this.baseURL = baseURL;
  this.timeout = CONSTANTS.REQUEST_TIMEOUT;

  console.log('[Request baseURL]', this.baseURL);
}



  // 获取存储的token
private getToken(): string | null {
  const userInfo = dataJson && (dataJson as { userInfo?: { token?: string } }).userInfo
  return (userInfo && userInfo.token) || null
}


  // 设置token
  public setToken(token: string): void {
    try {
      uni.setStorageSync(STORAGE_KEYS.TOKEN, token)
    } catch (error) {
      console.error('设置token失败:', error)
    }
  }

  // 清除token
  public clearToken(): void {
    try {
      uni.removeStorageSync(STORAGE_KEYS.TOKEN)
    } catch (error) {
      console.error('清除token失败:', error)
    }
  }

  // 显示loading
  private showLoading(title: string = '加载中...'): void {
    uni.showLoading({
      title,
      mask: true
    })
  }

  // 隐藏loading
  private hideLoading(): void {
    uni.hideLoading()
  }

  // 显示错误提示
  private showError(message: string): void {
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  }

  // 处理响应
  private handleResponse<T>(response: UniApp.RequestSuccessCallbackResult): ApiResponse<T> {
    const { statusCode, data } = response

    if (statusCode === 200) {
      const apiResponse = data as ApiResponse<T>

      // 根据业务状态码处理
      if (apiResponse.code === 0 || apiResponse.code === 333) {
        return apiResponse
      } else if (apiResponse.code === 401) {
        // token过期，跳转登录
        this.handleAuthError()
        throw new Error(apiResponse.message || '登录已过期')
      } else if (apiResponse.code === 403) {
        throw new Error('权限不足')
      } else {
        throw new Error(apiResponse.message || '请求失败')
      }
    } else {
      throw new Error(`网络错误: ${statusCode}`)
    }
  }

  // 处理认证错误
  private handleAuthError(): void {
    this.clearToken()
    uni.showModal({
      title: '提示',
      content: '登录已过期，请重新登录',
      showCancel: false,
      success: () => {
        // 跳转到登录页
        goToLogin();
      }
    })
  }

  // 发送请求
  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { url, method = 'GET', data, header = {}, timeout, showLoading = false, showError = true } = config

    // 显示loading
    if (showLoading) {
      this.showLoading()
    }

console.log(url);
    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`

    // 构建请求头
    const requestHeader = {
      'Content-Type': 'application/json',
	  "wxType":"0",
      ...header
    }

    // 添加token
    const token = this.getToken()
    if (token) {
      requestHeader['token'] = `${token}`
    }

    try {
      const response = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
        uni.request({
          url: fullUrl,
          method,
          data,
          header: requestHeader,
          timeout: timeout || this.timeout,
          success: resolve,
          fail: reject
        })
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      console.error('网络请求失败:', error)

      let errorMessage = '网络连接失败，请检查网络设置'

      if (error instanceof Error) {
        errorMessage = error.message
      }

      if (showError) {
        this.showError(errorMessage)
      }

      throw new Error(errorMessage)
    } finally {
      // 隐藏loading
      if (showLoading) {
        this.hideLoading()
      }
    }
  }

  // GET请求
  public get<T>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    const queryString = params ? Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&') : ''

    const fullUrl = queryString ? `${url}?${queryString}` : url
	
	// console.log(fullUrl)

    return this.request<T>({
      url: fullUrl,
      method: 'GET',
      ...config
    })
  }

  // POST请求
  public post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config
    })
  }

  // PUT请求
  public put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config
    })
  }

  // DELETE请求
  public delete<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config
    })
  }

  // PATCH请求
  public patch<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config
    })
  }

  // 上传文件
  public upload<T>(
    url: string,
    filePath: string,
    formData?: Record<string, any>,
    config?: {
      name?: string
      header?: Record<string, string>
      showLoading?: boolean
      showError?: boolean
    }
  ): Promise<ApiResponse<T>> {
    const { name = 'file', header = {}, showLoading = true, showError = true } = config || {}

    if (showLoading) {
      this.showLoading('上传中...')
    }

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`

    // 构建请求头
    const requestHeader = { ...header }

    // 添加token
    const token = this.getToken()
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`
    }

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: fullUrl,
        filePath,
        name,
        formData,
        header: requestHeader,
        success: (response) => {
          try {
            const data = JSON.parse(response.data)
            resolve(data as ApiResponse<T>)
          } catch (error) {
            reject(new Error('上传响应解析失败'))
          }
        },
        fail: (error) => {
          console.error('文件上传失败:', error)
          const errorMessage = '文件上传失败'
          if (showError) {
            this.showError(errorMessage)
          }
          reject(new Error(errorMessage))
        },
        complete: () => {
          if (showLoading) {
            this.hideLoading()
          }
        }
      })
    })
  }
}

// 创建请求实例
const http = new HttpRequest()

export default http
export { HttpRequest }
