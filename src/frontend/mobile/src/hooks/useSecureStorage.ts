import { secureDeleteItem, secureGetItem, secureSetItem } from '@/src/lib/secureStorage';

export const useSecureStorage = () => {
  const save = async (key: string, value: string) => {
    await secureSetItem(key, value);
  };

  const getValue = async (key: string) => {
    return secureGetItem(key);
  };

  const remove = async (key: string) => {
    await secureDeleteItem(key);
  };

  return { save, getValue, remove };
};
