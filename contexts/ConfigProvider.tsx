import React, { PropsWithChildren } from 'react';

export interface ConfigProviderProps {
  baseUrl: string,
}

const ConfigContext = React.createContext({ baseUrl: 'https://localhost:3001' });

export function ConfigProvider(props: PropsWithChildren<ConfigProviderProps>) {
  return (
    <ConfigContext.Provider value={{ baseUrl: props.baseUrl }}>
      {props.children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return React.useContext(ConfigContext);
}
