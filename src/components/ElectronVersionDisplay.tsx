'use client';

import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

// Electron API için tip tanımlaması
declare global {
  interface Window {
    electronAPI?: {
      ping: () => Promise<string>;
      getAppVersion: () => Promise<string>;
      saveFile: (data: any, filename: string) => Promise<{
        success: boolean;
        message: string;
        filePath?: string;
      }>;
      openFile: () => Promise<{
        success: boolean;
        message: string;
        data?: any;
      }>;
      print: (content: string) => Promise<{
        success: boolean;
        message: string;
      }>;
    };
  }
}

export default function ElectronVersionDisplay() {
  const [appVersion, setAppVersion] = useState('2.0.0');
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Electron ortamı kontrolü
    if (typeof window !== 'undefined') {
      setIsElectron(window.electronAPI !== undefined);
      
      // Versiyon bilgisini al
      if (window.electronAPI) {
        window.electronAPI.getAppVersion()
          .then(version => {
            setAppVersion(version);
          })
          .catch(error => {
            console.error('Versiyon alma hatası:', error);
          });
      }
    }
  }, []);

  return (
    <Typography variant="body2" fontWeight="medium">
      Versiyon: {appVersion} {isElectron ? '(Electron)' : ''}
    </Typography>
  );
} 