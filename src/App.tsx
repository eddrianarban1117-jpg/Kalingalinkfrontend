import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './auth/AuthProvider';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_APP_BASE_PATH || '/'}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
