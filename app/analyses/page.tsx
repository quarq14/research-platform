'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Merhaba! AI araştırma asistanınızım. Araştırma planlaması, güç analizi, anket tasarımı ve istatistiksel analizler konusunda size yardımcı olabilirim. Size nasıl yardımcı olabilirim?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // MiniMax M2 API entegrasyonu burada yapılacak
      // Şimdilik demo response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'AI asistan entegrasyonu için MiniMax M2 API anahtarı gereklidir. Bu özellik yakında eklenecektir. Demo modda çalışıyorsunuz.\n\nSorunuz: "' + input + '" için gerçek bir AI yanıtı alabilmek için API anahtarı eklemeniz gerekmektedir.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI yanıtı alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Araştırma Asistanı</CardTitle>
              <CardDescription>
                MiniMax M2 destekli araştırma asistanınız
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm">Düşünüyor...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Araştırma hakkında bir soru sorun..."
              className="flex-1"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Not: AI asistan entegrasyonu için MiniMax M2 API anahtarı gereklidir. Enter tuşu ile mesaj gönderebilirsiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
