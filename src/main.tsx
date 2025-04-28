import '@ant-design/v5-patch-for-react-19';
import { App as AntdApp, ConfigProvider } from 'antd';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ConfigProvider theme={{ cssVar: true }}>
    <AntdApp>
      <App />
    </AntdApp>
  </ConfigProvider>
);
