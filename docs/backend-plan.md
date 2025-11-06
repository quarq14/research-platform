# Backend Geliştirme Planı

## Database Schema

### Core Tables
1. **users** - Supabase Auth tarafından yönetiliyor
2. **profiles** - Kullanıcı profil bilgileri
3. **documents** - Akademik dökümanlar (makale, literatür taraması, vb.)
4. **files** - Yüklenen PDF dosyaları
5. **chunks** - PDF'lerden çıkarılan metin parçaları (RAG için)
6. **sources** - Akademik kaynaklar (papers)
7. **citations** - Atıflar
8. **projects** - Araştırma projeleri
9. **chats** - Sohbet oturumları
10. **messages** - Sohbet mesajları
11. **usage_events** - Kullanım tracking
12. **api_keys** - Kullanıcı API anahtarları
13. **subscriptions** - Abonelik bilgileri

### Storage Buckets
1. **pdfs** - PDF dosyaları için
2. **exports** - Export edilen dosyalar için

## Edge Functions

### Core Functions
1. **pdf-upload** - PDF yükleme ve text extraction
2. **generate-embeddings** - Vector embeddings oluşturma
3. **chat-rag** - RAG pipeline ile sohbet
4. **search-papers** - Akademik kaynak arama (Semantic Scholar, OpenAlex)
5. **check-plagiarism** - Orijinallik kontrolü
6. **detect-ai-content** - AI içerik tespiti
7. **manage-citations** - Atıf yönetimi
8. **export-document** - Döküman export (DOCX, PDF, Markdown)
9. **process-payment-paypal** - PayPal ödeme işleme
10. **process-payment-iyzico** - iyzico ödeme işleme
11. **webhook-paypal** - PayPal webhook
12. **webhook-iyzico** - iyzico webhook

## Implementation Order
1. Database schema + RLS policies
2. Storage buckets
3. PDF processing functions
4. Chat/RAG functions
5. Academic search functions
6. Payment functions
7. Export functions
