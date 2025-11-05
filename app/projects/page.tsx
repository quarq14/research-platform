'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, FolderKanban, Plus, Users } from 'lucide-react';
import { Project } from '@/types/database';

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Projeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      // İlk önce bir organizasyon oluştur (veya mevcut olanı kullan)
      let orgId;
      
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .maybeSingle();

      if (orgs) {
        orgId = orgs.id;
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({ name: 'Varsayılan Organizasyon', owner: user.id })
          .select()
          .maybeSingle();

        if (orgError) throw orgError;
        orgId = newOrg?.id;

        // Kullanıcıyı org_members'a ekle
        await supabase
          .from('org_members')
          .insert({ org_id: orgId, user_id: user.id, role: 'owner' });
      }

      // Projeyi oluştur
      const { error } = await supabase
        .from('projects')
        .insert({
          org_id: orgId,
          name: newProject.name,
          description: newProject.description,
          created_by: user.id,
          status: 'active'
        });

      if (error) throw error;

      setNewProject({ name: '', description: '' });
      setCreateDialogOpen(false);
      loadProjects();
    } catch (error: any) {
      console.error('Proje oluşturulurken hata:', error);
      alert('Proje oluşturulamadı: ' + error.message);
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
                <h1 className="text-2xl font-bold">Projeler</h1>
                <p className="text-sm text-muted-foreground">
                  Araştırma projelerinizi yönetin
                </p>
              </div>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Proje
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Proje Oluştur</DialogTitle>
                  <DialogDescription>
                    Araştırma projeniz için temel bilgileri girin
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Proje Adı</Label>
                    <Input
                      id="name"
                      placeholder="Örn: Kullanıcı Memnuniyet Araştırması"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Input
                      id="description"
                      placeholder="Proje hakkında kısa açıklama"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Oluştur</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderKanban className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Henüz proje yok</h3>
              <p className="text-muted-foreground mb-4">
                İlk projenizi oluşturarak başlayın
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                İlk Projeyi Oluştur
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:border-primary cursor-pointer transition-colors"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FolderKanban className="h-10 w-10 text-primary" />
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status === 'active' ? 'Aktif' : project.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription>
                    {project.description || 'Açıklama yok'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>0 Anket</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>0 Yanıt</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
