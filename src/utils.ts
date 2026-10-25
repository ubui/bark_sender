import type { SyncStore, LocalStore, ContentToPush } from './types';

type Store = SyncStore | LocalStore;

interface SetStore<T extends Store> {
  (newStorage: Partial<T>): void;
  (newStorage: Partial<T>, asPromise: true): Promise<void>;
}
interface GetStore<T extends Store> {
  <K extends keyof T>(keys: K[]): Promise<Pick<T, K>>; // K[] 要放在上面，否则 TS 语法提示会有点问题
  <K extends keyof T>(key: K): Promise<T[K]>;
}

interface StoreFunc<T extends Store> {
  set: SetStore<T>;
  get: GetStore<T>;
}

interface StoreFuncFactory {
  (type: 'local'): StoreFunc<LocalStore>;
  (type: 'sync'): StoreFunc<SyncStore>;
}
const storeFuncFactory: StoreFuncFactory = (type: 'local' | 'sync'): any => {
  const set: SetStore<Store> = (newStore: Partial<Store>, asPromise?: true): any => {
    if (!asPromise) {
      return chrome.storage[type].set(newStore);
    }
    return new Promise<void>((resolve) => {
      chrome.storage[type].set(newStore, () => {
        resolve();
      });
    });
  };

  const get: GetStore<Store> = <K extends keyof Store>(key: K | K[]): any =>
    new Promise((resolve) => {
      chrome.storage[type].get(key, (store) => {
        if (Array.isArray(key)) {
          resolve(store);
          return;
        }
        resolve((store as Store)[key]);
      });
    });

  return { get, set };
};

export const localStore = storeFuncFactory('local');
export const syncStore = storeFuncFactory('sync');

export const EMPTY_GROUP = '';

export const pushContent = async (
  { text, url }: ContentToPush,
  target?: string,
  group?: string
): Promise<boolean> => {
  try {
    // 推送链路只保留一轮存储往返：sync 六键一次批量读 + local 一次并行读
    const [
      { defaultDevice, rememberGroup, archiveOption, pushSound, isAutoCopy, shouldNotify },
      currentGroup,
    ] = await Promise.all([
      syncStore.get([
        'defaultDevice',
        'rememberGroup',
        'archiveOption',
        'pushSound',
        'isAutoCopy',
        'shouldNotify',
      ]),
      localStore.get('currentGroup'),
    ]);

    // 没有写成 `if (!(target = target || defaultDevice))`
    // 是为了 target === '' 时能报错而非获取默认值
    if (target === undefined) {
      target = defaultDevice;
    }

    if (!target) {
      throw '没有目标设备，请先在设置中添加！';
    }

    if (group === undefined) {
      group = rememberGroup ? currentGroup || EMPTY_GROUP : EMPTY_GROUP;
    }

    url = url || '';

    const paramsValidator: { [paramStr: string]: boolean } = {
      [`url=${encodeURIComponent(url)}`]: Boolean(url),
      ['automaticallyCopy=1']: !url && isAutoCopy,
      ['isArchive=1']: archiveOption === 'always',
      ['isArchive=0']: archiveOption === 'never',
      [`sound=${pushSound}`]: Boolean(pushSound),
      [`group=${encodeURIComponent(group)}`]: Boolean(group),
    };

    const validParams = Object.keys(paramsValidator)
      .filter((param) => paramsValidator[param])
      .join('&');
    const paramStr = validParams ? `?${validParams}` : '';

    // keepalive：点击发送后立刻切走页面导致 popup 关闭时，请求仍会完成，避免推送丢失
    return fetch(`${target}${encodeURIComponent(text)}${paramStr}`, { keepalive: true })
      .then((response) => {
        if (response.ok && shouldNotify) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/icon.png',
            title: '已推送至 Bark',
            message: text,
          });
        }
        return response.ok;
      })
      .catch((e) => {
        console.error(e);
        return false;
      });
  } catch (e) {
    // MV3 service worker 中没有 alert，且 popup 中 alert 会阻塞界面，统一改用 console
    console.error(e);
    return false;
  }
};
