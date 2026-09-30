// src/App.jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import Layout from './components/Layout/Layout.jsx';
import Loading from './components/common/Loading.jsx';
import Home from './pages/Home.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';

// Dashboard and Analyzer pull in Chart.js, by far the heaviest dependency
// in the app — code-split them so the initial bundle (and every other
// route) doesn't pay for that weight until one of these is actually visited.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Analyzer = lazy(() => import('./pages/Analyzer.jsx'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<Loading />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route
              path="/analyzer"
              element={
                <Suspense fallback={<Loading />}>
                  <Analyzer />
                </Suspense>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
