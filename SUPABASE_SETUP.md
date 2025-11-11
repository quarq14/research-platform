# 🔧 Supabase Kurulum Rehberi

Bu rehber, Research Platform için Supabase bağlantılarının nasıl kurulacağını adım adım açıklar.

## 📋 Gereksinimler

- Supabase hesabı (ücretsiz tier yeterli)
- Node.js 18+ kurulu
- Git kurulu

## 🚀 Adım 1: Supabase Projesi Oluşturma

1. [Supabase](https://supabase.com) sitesine gidin ve giriş yapın
2. "New Project" butonuna tıklayın
3. Proje bilgilerini doldurun:
   - **Project Name**: research-platform (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin
   - **Pricing Plan**: Free (ücretsiz tier yeterli)
4. "Create New Project" butonuna tıklayın
5. Projenin oluşturulmasını bekleyin (2-3 dakika sürebilir)

## 🔑 Adım 2: API Anahtarlarını Alma

1. Supabase projeniz oluştuktan sonra sol menüden **"Settings"** (Ayarlar) seçeneğine tıklayın
2. **"API"** sekmesine gidin
3. Aşağıdaki bilgileri not edin:
   - **Project URL**: `https://xxxxx.supabase.co` formatında
   - **anon/public key**: `eyJhbGciOi...` ile başlayan uzun anahtar
   - **service_role key**: (Opsiyonel - admin işlemler için)

## ⚙️ Adım 3: Environment Değişkenlerini Ayarlama

1. Proje klasöründe `.env.local` dosyasını açın (yoksa oluşturuldu)
2. Aşağıdaki değerleri Supabase'den aldığınız bilgilerle değiştirin:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Opsiyonel - Admin işlemler için
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

3. Dosyayı kaydedin

## 🗄️ Adım 4: Database Migration'larını Çalıştırma

### Yöntem 1: Supabase SQL Editor (Önerilen)

1. Supabase dashboard'unuzda sol menüden **"SQL Editor"** seçeneğine tıklayın
2. **"New Query"** butonuna tıklayın
3. Aşağıdaki migration dosyalarını **sırasıyla** kopyalayıp çalıştırın:

#### Migration 1: Profil Tablosu
```bash
# Dosya: supabase/migrations/1762427868_create_profiles_table.sql
```
- Dosya içeriğini kopyalayın
- SQL Editor'e yapıştırın
- **"Run"** butonuna tıklayın
- ✅ "Success" mesajı göründüğünü onaylayın

#### Migration 2: AI Ayarları Tabloları
```bash
# Dosya: supabase/migrations/20250106000000_add_ai_settings_tables.sql
```
- Dosya içeriğini kopyalayın
- SQL Editor'e yapıştırın
- **"Run"** butonuna tıklayın
- ✅ "Success" mesajı göründüğünü onaylayın

#### Migration 3: Kapsamlı Şema
```bash
# Dosya: supabase/migrations/20250107000000_comprehensive_schema.sql
```
- Dosya içeriğini kopyalayın
- SQL Editor'e yapıştırın
- **"Run"** butonuna tıklayın
- ✅ "Success" mesajı göründüğünü onaylayın

#### Migration 4: Kimi K2 Provider Ekleme (YENİ!)
```sql
-- Kimi K2 provider'ı ekle
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_ai_provider_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_ai_provider_check
    CHECK (ai_provider IN ('groq', 'openrouter', 'claude', 'openai', 'gemini', 'minimax', 'kimi'));

ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_provider_check;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_provider_check
    CHECK (provider IN ('groq', 'openrouter', 'claude', 'openai', 'gemini', 'minimax', 'kimi', 'copyleaks', 'serpapi'));
```
- Yukarıdaki SQL'i kopyalayın
- SQL Editor'e yapıştırın
- **"Run"** butonuna tıklayın

### Yöntem 2: Supabase CLI (İleri Seviye)

```bash
# Supabase CLI'yi yükleyin (sadece bir kez)
npm install -g supabase

# Supabase'e giriş yapın
supabase login

# Projenizi bağlayın
supabase link --project-ref xxxxx

# Migration'ları çalıştırın
supabase db push
```

## 📦 Adım 5: Storage Bucket Oluşturma

1. Supabase dashboard'unuzda sol menüden **"Storage"** seçeneğine tıklayın
2. **"Create a new bucket"** butonuna tıklayın
3. Bucket ayarları:
   - **Name**: `pdfs`
   - **Public bucket**: ❌ (Kapalı - Private olmalı)
4. **"Create bucket"** butonuna tıklayın
5. Bucket oluşturulduğunda **"Policies"** sekmesine gidin
6. Aşağıdaki RLS politikalarını ekleyin:

```sql
-- Kullanıcılar kendi dosyalarını yükleyebilir
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Kullanıcılar kendi dosyalarını görebilir
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Kullanıcılar kendi dosyalarını silebilir
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## ✅ Adım 6: Bağlantıyı Test Etme

1. Terminalden projeyi çalıştırın:
```bash
npm run dev
```

2. Tarayıcıda `http://localhost:3000` adresini açın

3. **"Sign Up"** ile yeni bir hesap oluşturun

4. Hesap oluşturulursa ✅ Supabase bağlantısı başarılı!

## 🔍 Sorun Giderme

### Bağlantı Hatası
```
Error: Invalid Supabase URL or key
```
**Çözüm**: `.env.local` dosyasındaki `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini kontrol edin.

### Migration Hatası
```
Error: relation "profiles" already exists
```
**Çözüm**: Migration zaten çalıştırılmış. Bir sonraki migration'a geçin.

### Storage Hatası
```
Error: Bucket "pdfs" does not exist
```
**Çözüm**: Adım 5'teki talimatları izleyerek `pdfs` bucket'ını oluşturun.

### RLS Hatası
```
Error: new row violates row-level security policy
```
**Çözüm**: RLS politikalarının doğru kurulduğundan emin olun. SQL Editor'de tabloları kontrol edin.

## 📊 Veritabanı Yapısı

Kurulumdan sonra aşağıdaki tablolar oluşturulacak:

### Kullanıcı Tabloları
- `profiles` - Kullanıcı profilleri
- `user_settings` - AI provider tercihleri
- `api_keys` - Kullanıcı API anahtarları

### Doküman Tabloları
- `projects` - Proje organizasyonu
- `documents` - Akademik dokümanlar
- `document_chunks` - RAG için doküman parçaları
- `sources` - Akademik kaynaklar
- `citations` - Atıf yönetimi

### Dosya Tabloları
- `files` - Yüklenen PDF'ler
- `chunks` - PDF text parçaları

### Analiz Tabloları
- `plagiarism_reports` -표절 검사 결과
- `ai_detection_reports` - AI içerik tespiti

## 🎯 Sonraki Adımlar

1. ✅ AI Provider API anahtarlarınızı ekleyin (Settings > AI Settings)
2. ✅ İlk dokümanınızı oluşturun
3. ✅ PDF yükleyin ve ChatPDF özelliğini deneyin
4. ✅ Academic Search ile kaynak arayın

## 🆘 Yardım

Sorun yaşıyorsanız:
1. [GitHub Issues](https://github.com/quarq14/research-platform/issues) sayfasından yeni bir issue açın
2. Supabase Dashboard > Logs kısmından hata loglarını kontrol edin
3. Browser console'da hata mesajlarına bakın (F12)

## 🔒 Güvenlik Notları

- ⚠️ `.env.local` dosyasını **asla** Git'e commit etmeyin
- ⚠️ Service role key'i sadece backend'de kullanın
- ⚠️ Anon key'i frontend'de kullanılabilir (güvenlidir)
- ⚠️ RLS politikalarını her zaman aktif tutun
