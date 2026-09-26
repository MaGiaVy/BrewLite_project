'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import AuthHydration from '@/components/AuthHydration';
import { useAuth } from '@/hooks/useAuth';

interface HealthResponse {
  statusCode: number;
  status: string;
  message: string;
  timestamp: string;
  service: string;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/health`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to connect to backend'
        );
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <AuthHydration>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        {/* Thanh điều hướng */}
        <Navbar />

        <main className="flex flex-col items-center justify-center px-6 py-20">
          <div className="text-center">
            {/* Logo / Title */}
            <h1 className="text-5xl font-bold text-emerald-700 mb-2">
              🍵 BrewLite
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Premium Beverage Delivery App
            </p>

            {/* Thông tin đăng nhập */}
            {isAuthenticated && user && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 max-w-md mx-auto">
                <p className="text-emerald-700 font-semibold">
                  🎉 Chào mừng, {user.email}!
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Bạn đã đăng nhập thành công vào hệ thống BrewLite.
                </p>
              </div>
            )}

            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              {loading ? (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
                  <p className="mt-4 text-gray-600">Đang kiểm tra Backend...</p>
                </div>
              ) : error ? (
                <div className="text-red-600">
                  <p className="text-2xl mb-2">❌</p>
                  <p className="font-bold">Connection Error</p>
                  <p className="text-sm mt-2">{error}</p>
                  <p className="text-xs text-gray-500 mt-4">
                    Hãy chắc chắn Backend đang chạy trên http://localhost:3001
                  </p>
                </div>
              ) : health ? (
                <div className="text-left">
                  <p className="text-green-600 font-bold text-lg mb-4">
                    ✅ Backend Connected!
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono space-y-1">
                    <p>
                      <span className="text-gray-500">Status:</span> {health.status}
                    </p>
                    <p>
                      <span className="text-gray-500">Message:</span>{' '}
                      {health.message}
                    </p>
                    <p>
                      <span className="text-gray-500">Service:</span>{' '}
                      {health.service}
                    </p>
                    <p>
                      <span className="text-gray-500">Time:</span>{' '}
                      {health.timestamp}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer Info */}
            <div className="mt-12 text-gray-400 text-sm space-y-1">
              <p>Frontend: Next.js → http://localhost:3000</p>
              <p>Backend: NestJS → http://localhost:3001</p>
            </div>
          </div>
        </main>
      </div>
    </AuthHydration>
  );
}
