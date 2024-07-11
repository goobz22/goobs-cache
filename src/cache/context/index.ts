import { Context, AsyncContext, ContextProvider, AsyncContextProvider } from '../../types';

export function createContext<T>(
  key: string,
  defaultValue: T,
  getValue: (key: string) => T | undefined,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): Context<T> {
  const context: Context<T> = {
    key,
    Provider: createContextProvider(key, defaultValue, setValue),
    Consumer: (props) => props.children(getValue(key) ?? defaultValue),
  };
  return context;
}

export function createAsyncContext<T>(
  key: string,
  defaultValue: T,
  getValue: (key: string) => Promise<T | undefined>,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): AsyncContext<T> {
  const context: AsyncContext<T> = {
    key,
    Provider: createAsyncContextProvider(key, defaultValue, setValue),
    Consumer: (props) => {
      getValue(key).then((value) => props.children(value ?? defaultValue));
      return null;
    },
  };
  return context;
}

function createContextProvider<T>(
  key: string,
  defaultValue: T,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): ContextProvider<T> {
  return (props) => {
    const value = props.value !== undefined ? props.value : defaultValue;
    setValue(key, value, new Date(8640000000000000));
    return props.children;
  };
}

function createAsyncContextProvider<T>(
  key: string,
  defaultValue: T,
  setValue: (key: string, value: T, expirationDate: Date) => void,
): AsyncContextProvider<T> {
  return async (props) => {
    const value = await (props.value !== undefined ? props.value : Promise.resolve(defaultValue));
    setValue(key, value, new Date(8640000000000000));
    return props.children;
  };
}

export function useContext<T>(
  key: string,
  getValue: (key: string) => T | undefined,
): T | undefined {
  return getValue(key);
}

export function useAsyncContext<T>(
  key: string,
  getValue: (key: string) => Promise<T | undefined>,
): Promise<T | undefined> {
  return getValue(key);
}
