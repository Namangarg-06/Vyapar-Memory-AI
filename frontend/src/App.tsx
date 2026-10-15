import React, { useCallback, useEffect, useState } from 'react';
import { Layout, NavTab } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiscrepanciesPage } from './pages/DiscrepanciesPage';
import { OrdersCommitmentsPage } from './pages/OrdersCommitmentsPage';
import { AssistantPage } from './pages/AssistantPage';
import { api, getStoredToken, setStoredToken } from './services/api';
import { DashboardSummary, User, Workspace } from './types';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch {
      // Ignore if not logged in
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .getMe()
      .then((res) => {
        setUser(res.user);
        setWorkspace(res.workspace);
        loadSummary();
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => setAuthChecking(false));
  }, [loadSummary]);

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setWorkspace(null);
    setSummary(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm font-semibold">
        Loading Vyapar Memory AI Workspace...
      </div>
    );
  }

  if (!user || !workspace) {
    return (
      <AuthPage
        onAuthenticated={(auth) => {
          setUser(auth.user);
          setWorkspace(auth.workspace);
          loadSummary();
        }}
      />
    );
  }

  return (
    <Layout
      user={user}
      workspace={workspace}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      hasDemoData={summary?.has_demo_data ?? false}
      openDiscrepanciesCount={summary?.kpis.open_discrepancies_count ?? 0}
      pendingReviewsCount={summary?.kpis.pending_reviews_count ?? 0}
      onDataMutated={loadSummary}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <DashboardPage
          summary={summary}
          loading={summaryLoading}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === 'discrepancies' && (
        <DiscrepanciesPage
          onNavigate={setActiveTab}
          onDataMutated={loadSummary}
        />
      )}
      {activeTab === 'orders' && (
        <OrdersCommitmentsPage onDataMutated={loadSummary} />
      )}
      {activeTab === 'assistant' && <AssistantPage />}
    </Layout>
  );
}

export default App;
