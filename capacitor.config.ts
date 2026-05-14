import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nuvision.ai',
  appName: 'NuVision AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
