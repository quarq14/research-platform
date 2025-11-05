'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Ayarlar</h1>
              <p className="text-sm text-muted-foreground">
                Hesap ayarlarınızı yönetin
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>
              Hesap bilgilerinizi görüntüleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Kullanıcı ID</Label>
              <Input value={user?.id || ''} disabled />
            </div>
            <Button variant="outline">Şifre Değiştir</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API Anahtarları</CardTitle>
            <CardDescription>
              Entegrasyon ayarlarınızı yapılandırın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>MiniMax API Key</Label>
              <Input placeholder="API anahtarınızı girin" type="password" />
            </div>
            <div className="space-y-2">
              <Label>PayPal Client ID</Label>
              <Input placeholder="PayPal Client ID" type="password" />
            </div>
            <div className="space-y-2">
              <Label>iyzico API Key</Label>
              <Input placeholder="iyzico API Key" type="password" />
            </div>
            <Button>Kaydet</Button>
            <p className="text-xs text-muted-foreground">
              Not: API anahtarları şu anda demo modda çalışmaktadır. Gerçek entegrasyon için lütfen gerekli anahtarları ekleyin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
