// 主域名请求
import { StatusHandlers, AxiosWrapper } from '../src';

const statusHandlers: StatusHandlers = {
  200: (res, data, customConfig) => {
    return customConfig.returnRes ? res : data;
  },
};
export default class Primary extends AxiosWrapper {
  static readonly ins = new Primary();
  static readonly get = AxiosWrapper.methodFactory('get', Primary.ins);
  static readonly post = AxiosWrapper.methodFactory('post', Primary.ins);

  private constructor() {
    super({ baseURL: 'http://test.test' }, { statusHandlers });
  }

  protected setInterceptors() {
    this.interceptors.request.use((config) => {
      if (!config.headers) config.headers = {};
      const headers = config.headers;
      // Token.exists() && (headers.authorization = `Bearer ${Token.get()}`);
      headers.authorization = `Bearer 123123123123123123`;
      // headers.uuid = getUUID();
    });
  }
}
