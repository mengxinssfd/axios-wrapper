import type { CustomConfig } from './types';
import type { AxiosInstance, AxiosStatic } from 'axios';
import { Context, RetryContext } from './types';
import { RequestTemplate } from './RequestTemplate';

/**
 * @public
 * 使用模板方法模式处理axios请求, 具体类可实现protected的方法替换掉原有方法
 * 自定义配置可继承CustomConfig实现
 */
export class AxiosRequestTemplate<
  CC extends CustomConfig = CustomConfig,
> extends RequestTemplate<CC> {
  protected static axios: AxiosStatic;

  /**
   * 用axios作为请求工具时必须调用该方法
   */
  static useAxios(axios: AxiosStatic) {
    AxiosRequestTemplate.axios = axios;
  }

  /**
   * axios实例
   */
  protected axiosIns!: AxiosInstance;

  protected init() {
    // 1、保存基础配置
    this.axiosIns = AxiosRequestTemplate.axios.create(this.globalConfigs.requestConfig);
    super.init();
    this.setInterceptors();
  }

  /**
   * 获取拦截器
   */
  protected get interceptors() {
    return this.axiosIns?.interceptors;
  }

  /**
   * 设置拦截器
   */
  protected setInterceptors() {
    // 重写此函数会在Request中调用
    // example
    // this.interceptors.request.use(() => {
    //   /* do something */
    // });
  }

  /**
   * 请求
   */
  protected fetch(ctx: RetryContext<CC>) {
    return this.axiosIns(ctx.requestConfig);
  }

  /**
   * 使isCancel支持子类覆盖
   */
  protected isCancel(value: any) {
    return AxiosRequestTemplate.axios.isCancel(value);
  }

  /**
   * 设置取消handler
   */
  protected handleCanceler(ctx: Context<CC>) {
    // 专属axios的取消功能
    const { requestConfig } = ctx;
    const { cancel, token } = AxiosRequestTemplate.axios.CancelToken.source();
    requestConfig.cancelToken = token;
    this.registerCanceler(ctx, cancel);
  }
}
