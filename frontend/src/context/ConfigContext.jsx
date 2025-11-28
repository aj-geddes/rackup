import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ConfigContext = createContext(null);

const defaultConfig = {
  league: {
    name: 'Pool League',
    shortName: 'League',
    description: 'Pool/Billiards League Management',
    contactEmail: null,
    contactPhone: null,
    location: null,
    website: null,
    rules: null
  },
  features: {
    smsEnabled: false,
    googleDriveEnabled: false
  }
};

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await api.getConfig();
        setConfig(data);
      } catch (err) {
        console.error('Failed to load config:', err);
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Update document title with league name
  useEffect(() => {
    if (config.league.name) {
      document.title = config.league.name;
    }
  }, [config.league.name]);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

export default ConfigContext;
