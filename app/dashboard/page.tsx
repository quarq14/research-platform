'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/utils/supabase/client';
import { 
  BarChart3, 
  Brain, 
  FileText, 
  FolderKanban, 
  LogOut, 
  Plus, 
  Settings, 
  Users 
} from 'lucide-react';

interface Stats {
  projects: number;
  surveys: number;
  responses: number;
  analyses: number;
}

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ projects: 0, surveys: 0, responses: 0, analyses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [projectsRes, surveysRes, responsesRes, analysesRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('surveys').select('id', { count: 'exact', head: true }),
        supabase.from('survey_responses').select('id', { count: 'exact', head: true }),
        supabase.from('analyses').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        projects: projectsRes.count || 0,
        surveys: surveysRes.count || 0,
        responses: responsesRes.count || 0,
        analyses: analysesRes.count || 0,
      });
    } catch (error) {
      console.error('Stats yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Araştırma Platformu</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hoş Geldiniz</h1>
          <p className="text-muted-foreground">
            Araştırma projelerinizi yönetin, anketler oluşturun ve verileri analiz edin
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projeler
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anketler
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.surveys}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yanıtlar
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Analizler
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.analyses}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:border-primary cursor-pointer transition-colors" onClick={() => router.push('/projects')}>
            <CardHeader>
              <FolderKanban className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Projeler</CardTitle>
              <CardDescription>
                Araştırma projelerinizi görüntüleyin ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Projeler
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary cursor-pointer transition-colors" onClick={() => router.push('/surveys/new/design')}>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Yeni Anket</CardTitle>
              <CardDescription>
                Anket tasarlayın ve katılımcılardan veri toplayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Anket Oluştur
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary cursor-pointer transition-colors" onClick={() => router.push('/analyses')}>
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI Asistan</CardTitle>
              <CardDescription>
                AI destekli araştırma asistanı ile çalışın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Brain className="mr-2 h-4 w-4" />
                AI Asistan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>
              Son yapılan işlemler ve güncellemeler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Henüz aktivite bulunmuyor. Projelere başlamak için yukarıdaki kartları kullanın.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
