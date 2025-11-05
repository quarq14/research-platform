# AI Destekli Araştırma Platformu

Araştırmacıların anket tasarlayıp yönetebileceği, AI asistanla çalışabileceği, istatistiksel analizler yapabileceği ve raporlar oluşturabileceği tam stack web uygulaması.

## Teknoloji Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **UI Components:** Lucide React, Recharts, shadcn/ui
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage

## Kurulum

### Gereksinimler
- Node.js 20.9.0 veya üzeri (önerilir)
- npm veya yarn
- Supabase hesabı

### Adımlar

1. Proje dizinine gidin:
```bash
cd research-platform
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment variables'ları ayarlayın (`.env.local` dosyası zaten mevcut):
```env
NEXT_PUBLIC_SUPABASE_URL=https://cipvujkpzrbrloqvtotr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Development server'ı başlatın:
```bash
npm run dev
```

5. Tarayıcınızda açın: `http://localhost:3000`

## Tamamlanan Özellikler

### Backend (100% Tamamlandı)
- ✅ 15 Veritabanı tablosu
- ✅ Row Level Security (RLS) politikaları
- ✅ 4 Storage bucket'ı
- ✅ 3 Edge Function
- ✅ KVKK uyumlu veri yapısı
- ✅ Organizasyon bazlı veri izolasyonu

### Frontend (40% Tamamlandı)
- ✅ Ana sayfa (Landing page)
- ✅ Kullanıcı Authentication (Giriş/Kayıt)
- ✅ Dashboard
- ✅ Proje yönetimi (Liste, Oluşturma, Detay)
- ❌ Anket tasarımcısı (Planlanmış)
- ❌ Anket çalıştırıcı (Planlanmış)
- ❌ Analiz wizard (Planlanmış)
- ❌ Rapor görüntüleme (Planlanmış)
- ❌ Ayarlar sayfası (Planlanmış)
- ❌ Faturalama/Abonelik (Planlanmış)

## Sayfa Yapısı

### Mevcut Sayfalar
- `/` - Ana sayfa (landing page)
- `/auth/login` - Giriş
- `/auth/signup` - Kayıt
- `/dashboard` - Dashboard (korumalı)
- `/projects` - Proje listesi (korumalı)
- `/projects/[id]` - Proje detayı (korumalı)

### Planlanmış Sayfalar
- `/surveys` - Anket listesi
- `/surveys/[id]/design` - Anket tasarımcısı
- `/surveys/[id]/run` - Anket çalıştırıcı
- `/analyses` - Analiz listesi
- `/analyses/[id]` - Analiz detayı
- `/reports` - Rapor listesi
- `/settings` - Ayarlar
- `/billing` - Faturalama

## Supabase Yapısı

### Edge Functions
1. **analyze-survey-response** - Anket yanıtlarını işleme
   - URL: `https://cipvujkpzrbrloqvtotr.supabase.co/functions/v1/analyze-survey-response`
   
2. **generate-report** - Rapor oluşturma
   - URL: `https://cipvujkpzrbrloqvtotr.supabase.co/functions/v1/generate-report`
   
3. **process-payment** - Ödeme webhook işleme
   - URL: `https://cipvujkpzrbrloqvtotr.supabase.co/functions/v1/process-payment`

### Storage Buckets
- `consent-files` - Onay formu PDF'leri (10 MB)
- `dataset-uploads` - Veri dosyaları (50 MB)
- `reports` - Raporlar (50 MB)
- `survey-assets` - Anket görselleri (5 MB)

### Veritabanı Tabloları
- `organizations` - Organizasyonlar
- `org_members` - Organizasyon üyeleri
- `projects` - Projeler
- `participants` - Katılımcılar
- `consents` - Rıza formları
- `surveys` - Anketler
- `survey_versions` - Anket sürümleri
- `survey_responses` - Anket yanıtları
- `datasets` - Veri setleri
- `analyses` - Analizler
- `jobs` - Arka plan işleri
- `reports` - Raporlar
- `audit_logs` - Denetim kayıtları
- `payment_plans` - Abonelik planları
- `user_subscriptions` - Kullanıcı abonelikleri

## Abonelik Planları

| Plan | Fiyat | Projeler | Anketler | Yanıtlar |
|------|-------|----------|----------|----------|
| Starter | 99 TL/ay | 3 | 10 | 500 |
| Professional | 299 TL/ay | 10 | 50 | 5,000 |
| Enterprise | 999 TL/ay | Sınırsız | Sınırsız | Sınırsız |

## Geliştirme Notları

### Bilinen Sorunlar
- Node.js sürüm uyarısı (18.19.0 çalışıyor, 20.9.0+ önerilir)
- Next.js 16 bazı özellikler için Node.js 20+ gerektirir

### Sonraki Adımlar

#### Kısa Vadeli
1. [ ] Anket oluşturma formu (basit)
2. [ ] Katılımcı yönetimi sayfası
3. [ ] Anket yanıtlama sayfası
4. [ ] Basit rapor görüntüleme

#### Orta Vadeli
1. [ ] SurveyJS entegrasyonu
2. [ ] Analiz wizard UI
3. [ ] Veri görselleştirme (Recharts)
4. [ ] AI asistan entegrasyonu (MiniMax M2)

#### Uzun Vadeli
1. [ ] PayPal/iyzico ödeme entegrasyonu
2. [ ] Abonelik yönetimi
3. [ ] Kullanıcı rolleri ve izinler detaylandırma
4. [ ] R servis entegrasyonu (istatistiksel analiz)

## Eksik Entegrasyonlar

Bu entegrasyonlar için API key'leri gerekli:

- **Groq AI API** - AI asistan için
- **PayPal** - Uluslararası ödemeler için
- **iyzico** - Türkiye ödemeleri için

Environment variables'a eklenmelidir:
```env
GROQ_API_KEY=your_groq_api_key_here
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
```

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'feat: Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje özel bir projedir.

## Ekstra Notlar

- Tüm backend altyapısı production-ready durumda
- RLS politikaları güvenli veri izolasyonu sağlıyor
- KVKK uyumlu veri yapısı mevcut
- Frontend temel yapısı hazır, özellik geliştirmesi devam ediyor
"# research-platform " 
