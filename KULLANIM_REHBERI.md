# AI Destekli Araştırma Platformu - Kullanım Rehberi

## Hızlı Başlangıç

### 1. Kayıt Olma ve Giriş

1. Ana sayfada "Kayıt Ol" butonuna tıklayın
2. Email ve şifrenizi girin
3. Otomatik olarak dashboard'a yönlendirileceksiniz

### 2. İlk Projenizi Oluşturun

1. Dashboard'dan "Projeler" kartına tıklayın
2. "Yeni Proje" butonuna tıklayın
3. Proje adı ve açıklama girin
4. "Oluştur" butonuna tıklayın

### 3. Anket Tasarlama

#### Anket Oluşturma
1. Dashboard'dan "Anket Oluştur" kartına tıklayın
2. Anket adını girin
3. Soru eklemek için soru tiplerinden birini seçin:
   - **Kısa Metin:** Tek satır metin cevabı
   - **Uzun Metin:** Çok satırlı metin cevabı
   - **Çoktan Seçmeli:** Tek seçenek seçimi
   - **Çoklu Seçim:** Birden fazla seçenek
   - **Derecelendirme:** 1-5 yıldız

#### Soru Düzenleme
- Soru metnini girin
- Çoktan seçmeli ve çoklu seçim için seçenekler ekleyin
- Zorunlu soru yapmak için checkbox'ı işaretleyin
- Soruyu silmek için çöp kutusu ikonuna tıklayın

#### Kaydetme
- "Kaydet" butonuna tıklayın
- Anket otomatik olarak versiyonlanır

### 4. Anket Çalıştırma

1. Anket tasarım sayfasında "Önizle" butonuna tıklayın
2. Anket formu açılır
3. Soruları cevaplayın
4. "Anketi Gönder" butonuna tıklayın
5. Yanıtlar veritabanına kaydedilir

**Not:** Anket çalıştırma sayfası public'tir, kimlik doğrulama gerektirmez.

### 5. AI Asistan Kullanımı

1. Dashboard'dan "AI Asistan" kartına tıklayın
2. Chat kutusuna sorunuzu yazın
3. Enter veya "Gönder" butonuna tıklayın
4. AI asistan size yardımcı olacaktır

**Not:** Demo modda çalışır. MiniMax API key eklendiğinde gerçek yanıtlar verecektir.

### 6. Abonelik Yönetimi

1. "Faturalama" sayfasına gidin
2. "Planlar" tab'ına tıklayın
3. Size uygun planı seçin:
   - **Starter:** 99 TL/ay (3 proje, 10 anket, 500 yanıt)
   - **Professional:** 299 TL/ay (10 proje, 50 anket, 5K yanıt)
   - **Enterprise:** 999 TL/ay (Sınırsız)
4. PayPal veya iyzico ile ödeyin

**Not:** Demo modda çalışır. API keyler eklendiğinde gerçek ödemeler yapılabilir.

## Özellik Detayları

### Proje Yönetimi
- Proje oluşturma, düzenleme, silme
- Proje durumu takibi
- Anket, katılımcı, analiz sayıları
- Organizasyon bazlı izolasyon

### Anket Tasarımcısı
- 5 farklı soru tipi
- Sınırsız soru ekleme
- Zorunlu soru işaretleme
- Seçenek yönetimi
- Versiyon kontrolü

### Güvenlik
- Row Level Security (RLS)
- KVKK uyumlu veri saklama
- Şifreli hassas veriler
- Audit logging

## Sık Sorulan Sorular

### API anahtarları nasıl eklenir?
1. "Ayarlar" sayfasına gidin
2. "API Anahtarları" bölümünü bulun
3. İlgili alanları doldurun
4. "Kaydet" butonuna tıklayın

### Anket yanıtlarını nasıl görürüm?
Şu anda anket yanıtları veritabanına kaydedilmektedir. Rapor görüntüleme özelliği yakında eklenecektir.

### Demo mod nedir?
Demo mod, API anahtarları olmadan platformun çalışmasını sağlar. Tüm özellikler kullanılabilir ancak:
- AI asistan demo yanıtlar verir
- Ödemeler simüle edilir
- Diğer tüm özellikler tam çalışır

### Veritabanı nasıl yedeklenir?
Supabase otomatik yedekleme yapar. Manuel yedekleme için Supabase dashboard'unu kullanın.

## Destek

Sorularınız için:
- Email: [destek email adresi]
- Dokümantasyon: README.md
- API Rehberi: API_KEYS_NEEDED.md

## Güncellemeler

Platform aktif olarak geliştirilmektedir. Yeni özellikler:
- R servis entegrasyonu
- Gelişmiş raporlama
- Email bildirimleri
- Takım işbirliği

takip edilecektir.
