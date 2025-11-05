# Gerekli API Anahtarları

Bu platformun tam çalışması için aşağıdaki API anahtarları gereklidir:

## 1. Groq API (AI Asistan için)

AI asistan özelliği için Groq API anahtarı gereklidir.

**Neden Groq:**
- ✅ Tamamen ücretsiz (günlük 500K token)
- ✅ Ultra hızlı (840 token/saniye)
- ✅ Llama-3.1-8B-Instant modeli
- ✅ Kredi kartı gerektirmez

**Nasıl alınır:**
- https://console.groq.com adresine gidin
- Ücretsiz hesap oluşturun
- API Keys bölümünden yeni anahtar oluşturun

**Ekleme:**
`.env.local` dosyasına ekleyin:
```
GROQ_API_KEY=your_groq_api_key_here
```

## 2. PayPal API (Uluslararası ödemeler için)

**Nasıl alınır:**
- PayPal Developer hesabı oluşturun (developer.paypal.com)
- Sandbox/Production credentials alın

**Ekleme:**
```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

## 3. iyzico API (Türkiye ödemeleri için)

**Nasıl alınır:**
- iyzico'ya üye olun
- Test/Canlı API anahtarlarını alın

**Ekleme:**
```
IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key
```

## Mevcut Durum

Tüm özellikler **demo modda** çalışmaktadır. API anahtarları eklendikten sonra:
- AI asistan gerçek yanıtlar verecek
- Ödeme sistemleri gerçek işlem yapacak
- Platform tam fonksiyonel olacak

## Not

API anahtarları olmadan da platform kullanılabilir ancak:
- AI asistan demo yanıtlar verir
- Ödemeler demo modda çalışır
- Tüm diğer özellikler tam çalışır
