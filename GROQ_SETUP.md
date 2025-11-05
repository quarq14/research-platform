# Groq API Kurulum Rehberi

Bu rehber, AI asistan özelliği için Groq API entegrasyonunu kurmanızı sağlar.

## 🎯 Neden Groq?

- ✅ **Tamamen Ücretsiz:** Günlük 500K token limiti ile kullanım
- ⚡ **Ultra Hızlı:** Llama-3.1-8B-Instant modeli 840 token/saniye hızında
- 🔒 **Güvenli:** OpenAI-compatible API, hiçbir ödeme bilgisi gerekmez
- 🌍 **Global Erişim:** Dünyanın her yerinden erişilebilir

## 📝 Kurulum Adımları

### 1. Groq Hesabı Oluşturma

1. [Groq Console](https://console.groq.com) adresine gidin
2. **"Sign Up"** butonuna tıklayın
3. Email veya GitHub hesabı ile kayıt olun
4. Hesabınızı doğrulayın

### 2. API Key Oluşturma

1. Console'da **"API Keys"** bölümüne gidin
2. **"Create API Key"** butonuna tıklayın
3. Key'e bir isim verin (örn: "AI Research Platform")
4. Key'i kopyalayın ve güvenli bir yerde saklayın

### 3. Environment Variable Ayarlama

#### Research Platform (.env.local)

```bash
# /workspace/research-platform/.env.local dosyasına ekleyin:
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_BASE_URL=https://api.groq.com
GROQ_MODEL=llama-3.1-8b-instant
```

#### Analysis Worker (.env)

```bash
# /workspace/analysis-worker/.env dosyasına ekleyin:
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 4. Platform'u Yeniden Başlatın

```bash
# Platform'u yeniden başlatın
bash start-platform.sh

# Veya sadece Next.js'i yeniden başlatın
cd research-platform && npm run dev
```

## 🚀 Özellikler

### AI Asistan Özellikleri
- **Chat Interface:** WhatsApp tarzı kullanıcı deneyimi
- **Türkçe Destek:** Türkçe prompt ve yanıt desteği
- **Real-time:** Anlık yanıt gösterimi
- **Context Aware:** Sohbet geçmişini hatırlama

### Desteklenen Konular
- 📊 **Anket Tasarımı:** Soru tipleri, mantıksal akış
- 📈 **İstatistiksel Analiz:** Test seçimi, yorumlama
- 📋 **Rapor Yazımı:** Bulgular, öneriler
- 🔍 **Araştırma Metodolojisi:** En iyi uygulamalar

## 📊 Free Tier Limitleri

| Özellik | Limit | Açıklama |
|---------|-------|----------|
| **Günlük Token** | 500,000 | Input + Output toplamı |
| **Günlük İstek** | 14,400 | Chat completions |
| **Dakika Başına İstek** | 30 | Rate limiting |
| **Model** | Llama-3.1-8B-Instant | En hızlı model |

## 🔧 Troubleshooting

### API Key Çalışmıyor
1. API key'in doğru kopyalandığından emin olun
2. `demo-key` değil, gerçek key kullanın
3. Environment variable'ları kontrol edin

### Rate Limit Hatası
```
Error: 429 Too Many Requests
```
- Günlük limit dolmuş olabilir (24 saat bekleyin)
- Dakika başına 30 istek limitine uyun

### Model Hatası
```
Error: Model not found
```
- Model adının doğru olduğundan emin olun
- `llama-3.1-8b-instant` kullanın

## 💡 İpuçları

### Etkili Prompt Yazımı
- **Türkçe konuşun:** Türkçe sorular daha iyi yanıt alır
- **Spesifik olun:** Genel sorular yerine detay verin
- **Bağlam sağlayın:** Hangi proje/hangi veri seti

### Örnek Sorular
```
"Bu anketin soru tipleri uygun mu?"
"Hangi istatistiksel testi kullanmalıyım?"
"Bulgularımı nasıl rapor edebilirim?"
"Bu veri seti için hangi analizi önerirsin?"
```

## 🔒 Güvenlik

- API key'lerinizi asla kodda paylaşmayın
- `.env` dosyalarını git'e eklemeyin
- Production'da güvenli environment variable sistemi kullanın

## 📞 Destek

- **Groq Docs:** https://console.groq.com/docs
- **API Reference:** https://console.groq.com/docs/api-reference
- **Community:** https://community.groq.com

---

🎉 **Hazır!** Artık platformunuz AI asistan ile tam işlevsel!
