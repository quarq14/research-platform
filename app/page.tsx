'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart3, Brain, FileText, Users } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Araştırma Platformu</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => router.push('/auth/login')}>
              Giriş Yap
            </Button>
            <Button onClick={() => router.push('/auth/signup')}>
              Kayıt Ol
            </Button>
          </div>
        </nav>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          AI Destekli Araştırma Platformu
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Anket tasarlayın, veri toplayın, AI asistanla analiz edin ve profesyonel raporlar oluşturun.
          Araştırma sürecinizi hızlandırın.
        </p>
        <div className="space-x-4">
          <Button size="lg" onClick={() => router.push('/auth/signup')}>
            Ücretsiz Başla <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">
            Demo İzle
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Anket Tasarımı</CardTitle>
              <CardDescription>
                Sürükle-bırak arayüzü ile kolayca anketler oluşturun
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Katılımcı Yönetimi</CardTitle>
              <CardDescription>
                KVKK uyumlu katılımcı takibi ve veri güvenliği
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>AI Asistan</CardTitle>
              <CardDescription>
                MiniMax M2 ile analiz önerileri ve içgörüler
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>İstatistiksel Analiz</CardTitle>
              <CardDescription>
                R tabanlı gelişmiş istatistiksel analizler
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Fiyatlandırma</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Starter</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">99 TL</span> / ay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>3 Proje</li>
                <li>10 Anket</li>
                <li>500 Yanıt</li>
                <li>Temel özellikler</li>
                <li>Email desteği</li>
              </ul>
              <Button className="w-full mt-6">Başla</Button>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Professional</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">299 TL</span> / ay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>10 Proje</li>
                <li>50 Anket</li>
                <li>5,000 Yanıt</li>
                <li>Gelişmiş özellikler</li>
                <li>AI asistan</li>
                <li>Öncelikli destek</li>
              </ul>
              <Button className="w-full mt-6">Başla</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">999 TL</span> / ay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>Sınırsız Proje</li>
                <li>Sınırsız Anket</li>
                <li>Sınırsız Yanıt</li>
                <li>Tüm özellikler</li>
                <li>Özel entegrasyonlar</li>
                <li>VIP destek</li>
              </ul>
              <Button className="w-full mt-6">İletişime Geç</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 AI Destekli Araştırma Platformu. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
