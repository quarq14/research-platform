'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { Survey } from '@/types/database';

interface Question {
  id: string;
  type: 'text' | 'radio' | 'checkbox' | 'rating' | 'textarea';
  title: string;
  required: boolean;
  options?: string[];
}

export default function SurveyDesignPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [surveyName, setSurveyName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && surveyId) {
      if (surveyId === 'new') {
        setLoading(false);
      } else {
        loadSurvey();
      }
    }
  }, [user, surveyId]);

  const loadSurvey = async () => {
    try {
      const { data: surveyData, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .maybeSingle();

      if (error) throw error;
      
      if (surveyData) {
        setSurvey(surveyData);
        setSurveyName(surveyData.name);

        // Load latest version
        const { data: versions } = await supabase
          .from('survey_versions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('version', { ascending: false })
          .limit(1);

        if (versions && versions[0]) {
          const jsonDef = versions[0].json_def;
          if (jsonDef.questions) {
            setQuestions(jsonDef.questions);
          }
        }
      }
    } catch (error) {
      console.error('Anket yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: '',
      required: false,
      options: type === 'radio' || type === 'checkbox' ? ['Seçenek 1', 'Seçenek 2'] : undefined
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSave = async () => {
    if (!user || !surveyName.trim()) {
      alert('Lütfen anket adını girin');
      return;
    }

    setSaving(true);
    try {
      let currentSurveyId = surveyId;

      // Önce organizasyon ID'sini al
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .maybeSingle();

      if (!orgs) {
        throw new Error('Organizasyon bulunamadı');
      }

      // Varsayılan proje ID'si al veya oluştur
      let projectId;
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('org_id', orgs.id)
        .limit(1)
        .maybeSingle();

      if (projects) {
        projectId = projects.id;
      } else {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            org_id: orgs.id,
            name: 'Varsayılan Proje',
            created_by: user.id,
            status: 'active'
          })
          .select()
          .maybeSingle();

        if (projectError) throw projectError;
        projectId = newProject?.id;
      }

      // Eğer yeni anket ise oluştur
      if (surveyId === 'new') {
        const { data: newSurvey, error: surveyError } = await supabase
          .from('surveys')
          .insert({
            project_id: projectId,
            name: surveyName,
            status: 'draft'
          })
          .select()
          .maybeSingle();

        if (surveyError) throw surveyError;
        currentSurveyId = newSurvey?.id || '';
      } else {
        // Mevcut anketi güncelle
        await supabase
          .from('surveys')
          .update({ name: surveyName })
          .eq('id', surveyId);
      }

      // Anket versiyonu kaydet
      const { data: existingVersions } = await supabase
        .from('survey_versions')
        .select('version')
        .eq('survey_id', currentSurveyId)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingVersions && existingVersions[0] ? existingVersions[0].version + 1 : 1;

      await supabase
        .from('survey_versions')
        .insert({
          survey_id: currentSurveyId,
          version: nextVersion,
          json_def: { questions }
        });

      alert('Anket başarıyla kaydedildi');
      if (surveyId === 'new') {
        router.push(`/surveys/${currentSurveyId}/design`);
      }
    } catch (error: any) {
      console.error('Anket kaydedilirken hata:', error);
      alert('Anket kaydedilemedi: ' + error.message);
    } finally {
      setSaving(false);
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
                <h1 className="text-2xl font-bold">Anket Tasarımcısı</h1>
                <p className="text-sm text-muted-foreground">
                  Anketinizi oluşturun ve özelleştirin
                </p>
              </div>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => router.push(`/surveys/${surveyId}/run`)}>
                Önizle
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Survey Name */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Anket Adı</Label>
              <Input
                placeholder="Örn: Kullanıcı Memnuniyet Anketi"
                value={surveyName}
                onChange={(e) => setSurveyName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Types */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label className="mb-2 block">Soru Ekle</Label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => addQuestion('text')}>
                Kısa Metin
              </Button>
              <Button size="sm" variant="outline" onClick={() => addQuestion('textarea')}>
                Uzun Metin
              </Button>
              <Button size="sm" variant="outline" onClick={() => addQuestion('radio')}>
                Çoktan Seçmeli
              </Button>
              <Button size="sm" variant="outline" onClick={() => addQuestion('checkbox')}>
                Çoklu Seçim
              </Button>
              <Button size="sm" variant="outline" onClick={() => addQuestion('rating')}>
                Derecelendirme
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Henüz soru eklenmedi. Yukarıdaki butonlardan soru ekleyin.
              </CardContent>
            </Card>
          ) : (
            questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Label>Soru {index + 1} - {question.type === 'text' ? 'Kısa Metin' : 
                          question.type === 'textarea' ? 'Uzun Metin' :
                          question.type === 'radio' ? 'Çoktan Seçmeli' :
                          question.type === 'checkbox' ? 'Çoklu Seçim' : 'Derecelendirme'}</Label>
                        <Input
                          placeholder="Soru metnini girin"
                          value={question.title}
                          onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={() => deleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {(question.type === 'radio' || question.type === 'checkbox') && (
                      <div className="space-y-2">
                        <Label className="text-sm">Seçenekler</Label>
                        {question.options?.map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optIndex] = e.target.value;
                                updateQuestion(question.id, { options: newOptions });
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newOptions = question.options?.filter((_, i) => i !== optIndex);
                                updateQuestion(question.id, { options: newOptions });
                              }}
                            >
                              Sil
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newOptions = [...(question.options || []), `Seçenek ${(question.options?.length || 0) + 1}`];
                            updateQuestion(question.id, { options: newOptions });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Seçenek Ekle
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`required-${question.id}`}
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor={`required-${question.id}`} className="text-sm font-normal cursor-pointer">
                        Zorunlu soru
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
