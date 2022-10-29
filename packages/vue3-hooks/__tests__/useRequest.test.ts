import { useRequest } from '../src';
import { sleep } from '@mxssfd/core';
import { isRef, reactive, ref, isReactive, computed } from 'vue';

// 模拟请求api
function requestFn<T extends { a: number; b: string }>(data: T): Promise<{ data: T }> {
  return new Promise<any>((resolve) => {
    setTimeout(resolve, 5, { data });
  });
}
const mockRequest = jest.fn(requestFn);
const mockRequestFail = jest.fn((data: { a: number; b: string }) => {
  return Promise.reject('error:' + JSON.stringify(data));
});

describe('useRequest', function () {
  afterEach(() => {
    mockRequest.mock.calls.length = 0;
    mockRequestFail.mock.calls.length = 0;
  });
  test('isRef/isReactive', () => {
    expect(isRef(reactive({}))).toBeFalsy();
    expect(isReactive(reactive({}))).toBeTruthy();
    const r = ref({});
    expect(isRef(r)).toBeTruthy();
    expect(isRef([ref({})][0])).toBeTruthy();
    expect(isRef([...[ref({})]][0])).toBeTruthy();

    const c = computed(() => ({ a: 1 }));
    expect(isRef(c)).toBeTruthy();
  });
  test('手动调用', async () => {
    const { data, loading, requestFn } = useRequest(mockRequest, { requestAlias: 'requestFn' });

    expect(typeof requestFn === 'function').toBeTruthy();

    // 初始时data值为null，loading还是false，请求也没调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeFalsy();
    expect(mockRequest).not.toBeCalled();

    const _data = { a: 1, b: '2' };
    requestFn(_data);
    // 请求手动调用后，data为null，loading是true，请求被调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeTruthy();
    expect(mockRequest.mock.calls.length).toBe(1);
    expect(mockRequest.mock.calls[0][0]).toBe(_data);

    await sleep(20);

    // 请求完成后，data为_data，loading是false
    expect(data.value).toEqual(_data);
    expect(loading.value).toBeFalsy();
    expect(mockRequest.mock.calls.length).toBe(1);
  });
  test('手动调用:请求失败', async () => {
    const mockFn = mockRequestFail;
    const { data, loading, request, error } = useRequest(mockFn);

    expect(typeof request === 'function').toBeTruthy();

    // 初始时data值为null，loading还是false，请求也没调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeFalsy();
    expect(mockFn).not.toBeCalled();
    expect(error.value).toBe(null);

    const params = { a: 1, b: '2' };
    request(params);
    // 请求手动调用后，data为null，error是null，loading是true，请求被调用过
    expect(error.value).toBe(null);
    expect(data.value).toBe(null);
    expect(loading.value).toBeTruthy();
    expect(mockFn.mock.calls.length).toBe(1);
    expect(mockFn.mock.calls[0][0]).toBe(params);

    await sleep(20);

    // 请求完成后，data为_data，loading是false，error是string
    expect(data.value).toBe(null);
    expect(loading.value).toBeFalsy();
    expect(mockFn.mock.calls.length).toBe(1);
    expect(error.value).toBe('error:' + JSON.stringify(params));

    // 第二次请求
    const params2 = { a: 2, b: '2' };
    request(params2);
    // 请求手动调用后，data为null，error是null，loading是true，请求被调用过
    expect(error.value).toBe(null);
    expect(data.value).toBe(null);
    expect(loading.value).toBeTruthy();
    expect(mockFn.mock.calls.length).toBe(2);
    expect(mockFn.mock.calls[1][0]).toBe(params2);

    await sleep(20);
    // 请求完成后，data为_data，loading是false，error是string
    expect(data.value).toBe(null);
    expect(loading.value).toBeFalsy();
    expect(mockFn.mock.calls.length).toBe(2);
    expect(error.value).toBe('error:' + JSON.stringify(params2));
  });
  test('数据驱动:数据变动启动', async () => {
    const params = reactive({ a: 1, b: '2' });
    const { data, loading, error } = useRequest(requestFn, { data: params });

    // 初始时data值为null，loading还是false，请求也没调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBe(null);

    // 数据变动：触发请求
    params.a = 2;
    await sleep(0);
    // 请求手动调用后，data为null，loading是true，请求被调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeTruthy();
    expect(error.value).toBe(null);

    await sleep(15);

    // 请求完成后，data为_data，loading是false
    expect(data.value?.a).toEqual(params.a);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBe(null);

    // 赋值但是数据没有变动，不会触发第二次请求
    params.a = 2;
    await sleep(0);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBe(null);

    // 数据变动，触发第二次请求
    params.a = 3;
    // data不会自动重置，需要手动设置
    data.value = null;
    await sleep(2);
    // 请求手动调用后，data为null，loading是true，请求被调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeTruthy();
    expect(error.value).toBe(null);

    await sleep(15);

    // 请求完成后，data为_data，loading是false
    expect(data.value).toEqual(params);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBe(null);
  });
  test('数据驱动:立即启动', async () => {
    const params = ref({ a: 1, b: '2' });
    const { data, loading, error } = useRequest(mockRequest, { data: params, immediate: true });

    // 立即启动 初始时data值为null，loading是true，请求已经调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeTruthy();
    expect(mockRequest.mock.calls.length).toBe(1);
    expect(mockRequest.mock.calls[0][0]).toBe(params.value);
    expect(error.value).toBe(null);

    await sleep(15);

    // 请求完成后，data为_data，loading是false
    expect(data.value).toEqual(params.value);
    expect(data.value.a).toBe(params.value.a);
    expect(loading.value).toBeFalsy();
    expect(mockRequest.mock.calls.length).toBe(1);
    expect(error.value).toBe(null);

    // 数据变动，触发第二次请求
    params.value.a = 2;
    // data不会自动重置，需要手动设置
    data.value = null;
    await sleep(0);
    // 请求手动调用后，data为null，loading是true，请求被调用过
    expect(data.value).toBe(null);
    expect(loading.value).toBeTruthy();
    expect(mockRequest.mock.calls.length).toBe(2);
    expect(mockRequest.mock.calls[1][0]).toBe(params.value);
    expect(error.value).toBe(null);

    await sleep(15);

    // 请求完成后，data为_data，loading是false
    expect(data.value).toEqual(params.value);
    expect(loading.value).toBeFalsy();
    expect(mockRequest.mock.calls.length).toBe(2);
    expect(error.value).toBe(null);
  });

  test('数据驱动:data非响应式', async () => {
    const params = { a: 1, b: '2' };
    expect(() => useRequest(mockRequest, { data: params })).toThrowError();
  });
  test('默认值', async () => {
    const params = { a: 1, b: '2' };

    // 有默认Data
    const res = useRequest(requestFn, { immediate: false }, params);
    expect(res.loading.value).toBeFalsy();
    expect(res.error.value).toBe(null);
    expect(res.data.value.a).toBe(1);

    // 无默认Data
    const res2 = useRequest(requestFn, { immediate: false });
    expect(res2.loading.value).toBeFalsy();
    expect(res2.error.value).toBe(null);
    // 未传默认data时，data.value可能是null，所以要加可选连
    expect(res2.data.value?.a).toBe(undefined);

    // 数据驱动也可以手动请求，request还是要传参的
    const params2 = reactive(params);
    const res3 = useRequest(requestFn, { data: params2 });
    expect(typeof (res3 as any).request === 'function').toBeTruthy();
  });
});
