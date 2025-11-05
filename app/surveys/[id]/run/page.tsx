'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain } from 'lucide-react';

interface Question {
  id: string;
  type: 'text' | 'radio' | 'checkbox' | 'rating' | 'textarea';
  title: string;
  required: boolean;
  options?: string[];
}

export default function SurveyRunPage() {
  const params = useParams();
  const surveyId = params.id as string;
  
  const [surveyName, setSurveyName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      const { data: surveyData } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .maybeSingle();

      if (surveyData) {
        setSurveyName(surveyData.name);

        const { data: versions } = await supabase
          .from('survey_versions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('version', { ascending: false })
          .limit(1);

        if (versions && versions[0]) {
          setQuestions(versions[0].json_def.questions || []);
        }
      }
    } catch (error) {
      console.error('Anket yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingRequired = questions
      .filter(q => q.required && !answers[q.id])
      .map(q => q.title);

    if (missingRequired.length > 0) {
      alert(`Lütfen zorunlu soruları yanıtlayın: ${missingRequired.join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      // Participant code oluştur
      const participantCode = `P-${Date.now()}`;

      // Get survey version
      const { data: versions } = await supabase
        .from('survey_versions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('version', { ascending: false })
        .limit(1);

      if (!versions || !versions[0]) {
        throw new Error('Anket versiyonu bulunamadı');
      }

      // Save response using Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-survey-response', {
        body: {
          surveyId,
          responseData: {
            answers,
            completionTime: 0
          },
          participantId: null
        }
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (error: any) {
      console.error('Anket gönderilirken hata:', error);
      alert('Anket gönderilemedi: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Teşekkürler!</h2>
            <p className="text-muted-foreground">
              Anket yanıtınız başarıyla kaydedildi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{surveyName || 'Anket'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <Label>
                    {index + 1}. {question.title}
                    {question.required && <span className="text-destructive ml-1">*</span>}
                  </Label>

                  {question.type === 'text' && (
                    <Input
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      required={question.required}
                    />
                  )}

                  {question.type === 'textarea' && (
                    <Textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                      required={question.required}
                      rows={4}
                    />
                  )}

                  {question.type === 'radio' && (
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`${question.id}-${optIndex}`}
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                            required={question.required}
                          />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkbox' && (
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${question.id}-${optIndex}`}
                            value={option}
                            checked={(answers[question.id] || []).includes(option)}
                            onChange={(e) => {
                              const current = answers[question.id] || [];
                              const newValue = e.target.checked
                                ? [...current, option]
                                : current.filter((v: string) => v !== option);
                              setAnswers({ ...answers, [question.id]: newValue });
                            }}
                          />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'rating' && (
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [question.id]: rating })}
                          className={`w-12 h-12 rounded-full border-2 transition-colors ${
                            answers[question.id] === rating
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted hover:border-primary'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Gönderiliyor...' : 'Anketi Gönder'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
