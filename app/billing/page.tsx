'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, Brain, CreditCard } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        supabase.from('payment_plans').select('*').order('price', { ascending: true }),
        supabase.from('user_subscriptions').select('*, payment_plans(*)').eq('user_id', user?.id || '').eq('status', 'active').maybeSingle()
      ]);

      setPlans(plansRes.data || []);
      setSubscription(subRes.data);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, provider: 'paypal' | 'iyzico') => {
    try {
      // PayPal veya iyzico entegrasyonu burada yapılacak
      alert(`Ödeme sistemi entegrasyonu için ${provider.toUpperCase()} API anahtarları gerekli. Bu özellik yakında eklenecek.`);
      
      // Demo için subscription oluştur
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user?.id,
          plan_id: planId,
          status: 'active',
          provider: provider,
          provider_subscription_id: `demo-${Date.now()}`
        });

      if (error) throw error;
      
      alert('Abonelik başarıyla oluşturuldu (Demo)');
      loadData();
    } catch (error: any) {
      console.error('Abonelik oluşturulurken hata:', error);
      alert('Abonelik oluşturulamadı: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Faturalama ve Abonelik</h1>
                <p className="text-sm text-muted-foreground">
                  Planınızı yönetin ve ödeme bilgilerinizi güncelleyin
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscription">Abonelik</TabsTrigger>
            <TabsTrigger value="plans">Planlar</TabsTrigger>
            <TabsTrigger value="billing">Fatura Geçmişi</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            {subscription ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mevcut Planınız</CardTitle>
                      <CardDescription>
                        {subscription.payment_plans?.name} planı aktif
                      </CardDescription>
                    </div>
                    <Badge variant="default">Aktif</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Plan</div>
                      <div className="text-lg font-semibold">{subscription.payment_plans?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Fiyat</div>
                      <div className="text-lg font-semibold">
                        {subscription.payment_plans?.price} {subscription.payment_plans?.currency} / ay
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Ödeme Yöntemi</div>
                      <div className="text-lg font-semibold capitalize">{subscription.provider}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Plan Özellikleri</h3>
                    <ul className="space-y-1 text-sm">
                      <li>Maksimum {subscription.payment_plans?.max_projects === -1 ? 'Sınırsız' : subscription.payment_plans?.max_projects} Proje</li>
                      <li>Maksimum {subscription.payment_plans?.max_surveys === -1 ? 'Sınırsız' : subscription.payment_plans?.max_surveys} Anket</li>
                      <li>Maksimum {subscription.payment_plans?.max_responses === -1 ? 'Sınırsız' : subscription.payment_plans?.max_responses} Yanıt</li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Button variant="outline">Planı Değiştir</Button>
                    <Button variant="ghost" className="ml-2">İptal Et</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aktif abonelik yok</h3>
                  <p className="text-muted-foreground mb-4">
                    Platformun tüm özelliklerinden yararlanmak için bir plan seçin
                  </p>
                  <Button onClick={() => document.getElementById('plans-tab')?.click()}>
                    Planları Görüntüle
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plans">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.name === 'Professional' ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold">{plan.price} {plan.currency}</span> / ay
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      <li>{plan.max_projects === -1 ? 'Sınırsız' : plan.max_projects} Proje</li>
                      <li>{plan.max_surveys === -1 ? 'Sınırsız' : plan.max_surveys} Anket</li>
                      <li>{plan.max_responses === -1 ? 'Sınırsız' : plan.max_responses} Yanıt</li>
                      {plan.features && Array.isArray(plan.features) && plan.features.map((feature: string, i: number) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>

                    <div className="space-y-2 pt-4">
                      <Button 
                        className="w-full" 
                        variant={plan.name === 'Professional' ? 'default' : 'outline'}
                        onClick={() => handleSelectPlan(plan.id, 'paypal')}
                      >
                        PayPal ile Öde
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleSelectPlan(plan.id, 'iyzico')}
                      >
                        iyzico ile Öde
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-6">
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground text-center">
                  Not: PayPal ve iyzico entegrasyonu için API anahtarları gereklidir. 
                  Şu anda demo modda çalışmaktadır.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Fatura geçmişi yok</h3>
                <p className="text-muted-foreground">
                  Ödemeleriniz yapıldıkça burada görüntülenecek
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
