// src/context/ConfigContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { suscribirConfig, CONFIG_DEFAULT } from '../services/config'

const ConfigContext = createContext(CONFIG_DEFAULT)

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(CONFIG_DEFAULT)

  useEffect(() => {
    return suscribirConfig(setConfig)
  }, [])

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => useContext(ConfigContext)
