// src/pages/AdminDashboard.tsx
import { motion } from 'framer-motion';
import {
  Activity,
  Database,
  Download,
  FileText,
  RefreshCw,
  Send,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import Header from '@/components/Header';
import PMProjectManager from '@/components/PMProjectManager';
import { useAuth } from '@/hooks/useAuth';
import { quickBackendDiagnostic } from '@/utils/backendDiagnostic';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeUsers: 0,
    completedActas: 0,
    pendingApprovals: 0,
  });

  // Check if user has admin access
  const isAdmin =
    user?.email?.includes('admin') ||
    user?.email?.includes('valencia94') ||
    user?.email?.endsWith('@ikusi.com') ||
    user?.email?.endsWith('@company.com');

  // Debug admin access
  console.log('AdminDashboard - Debug info:', {
    user: user?.email,
    authLoading,
    isAdmin,
    userObj: user,
  });

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;

    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      window.location.href = '/dashboard';
      return;
    }

    // Run backend diagnostic on load
    const runDiagnostic = async () => {
      const isBackendWorking = await quickBackendDiagnostic();
      if (!isBackendWorking) {
        toast.error(
          'Backend API connectivity issues detected. Check system status.',
          { duration: 8000 }
        );
      }
    };

    runDiagnostic();
  }, [isAdmin, authLoading]);

  // Mock stats - in real implementation, fetch from API
  useEffect(() => {
    setStats({
      totalProjects: 156,
      activeUsers: 12,
      completedActas: 89,
      pendingApprovals: 23,
    });
  }, []);

  const handleSystemAction = (action: string) => {
    toast.success(`${action} initiated - Check console for details`);
    console.log(`Admin action: ${action}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-indigo-600 font-medium">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                System administration and project management
              </p>
            </div>
          </div>

          <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
            <Shield className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-indigo-800">
              Admin Access: {user?.email}
            </span>
          </div>
        </motion.div>

        {/* System Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Database className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Projects
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.totalProjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.activeUsers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Completed Actas
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedActas}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Send className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pendingApprovals}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 mb-8"
        >
          <div className="flex items-center mb-6">
            <Settings className="h-7 w-7 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 ml-3">
              System Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => handleSystemAction('Backend Diagnostic')}
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
            >
              <Activity className="h-5 w-5 text-blue-600 mr-3" />
              <span className="font-medium text-blue-800">Run Diagnostic</span>
            </button>

            <button
              onClick={() => handleSystemAction('Refresh Cache')}
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200"
            >
              <RefreshCw className="h-5 w-5 text-green-600 mr-3" />
              <span className="font-medium text-green-800">Refresh Cache</span>
            </button>

            <button
              onClick={() => handleSystemAction('Export Logs')}
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200"
            >
              <Download className="h-5 w-5 text-purple-600 mr-3" />
              <span className="font-medium text-purple-800">Export Logs</span>
            </button>
          </div>
        </motion.div>

        {/* PM Project Manager - Full Admin Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200"
        >
          <div className="flex items-center mb-6">
            <Database className="h-7 w-7 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 ml-3">
              All Projects Management
            </h2>
          </div>

          <PMProjectManager isAdminView={true} />
        </motion.div>
      </main>
    </div>
  );
}
