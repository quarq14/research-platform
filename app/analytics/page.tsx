// Analytics Dashboard Page
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp, Activity } from 'lucide-react';

const AnalyticsDashboard = () => {
  // Demo verileri
  const projectData = [
    { month: 'Oca', projects: 12, surveys: 45, analyses: 23 },
    { month: 'Şub', projects: 15, surveys: 52, analyses: 31 },
    { month: 'Mar', projects: 18, surveys: 61, analyses: 38 },
    { month: 'Nis', projects: 22, surveys: 73, analyses: 42 },
    { month: 'May', projects: 25, surveys: 85, analyses: 48 },
    { month: 'Haz', projects: 28, surveys: 94, analyses: 52 },
  ];

  const responseData = [
    { name: 'Tamamlandı', value: 65, color: '#10B981' },
    { name: 'Devam Ediyor', value: 25, color: '#F59E0B' },
    { name: 'Başlamadı', value: 10, color: '#EF4444' },
  ];

  const analysisData = [
    { type: 't-test', count: 15, avgTime: '2.3 dk' },
    { type: 'ANOVA', count: 12, avgTime: '3.1 dk' },
    { type: 'Regression', count: 18, avgTime: '4.2 dk' },
    { type: 'Chi-Square', count: 8, avgTime: '1.8 dk' },
    { type: 'Mixed Models', count: 6, avgTime: '6.7 dk' },
  ];

  const stats = [
    {
      title: 'Toplam Proje',
      value: '127',
      change: '+12%',
      trend: 'up',
      icon: BarChart3,
      description: 'Bu ay'
    },
    {
      title: 'Aktif Anket',
      value: '45',
      change: '+8%',
      trend: 'up',
      icon: FileText,
      description: 'Devam eden'
    },
    {
      title: 'Toplam Katılımcı',
      value: '2,847',
      change: '+23%',
      trend: 'up',
      icon: Users,
      description: 'Kayıtlı'
    },
    {
      title: 'Analiz Tamamlandı',
      value: '1,234',
      change: '+15%',
      trend: 'up',
      icon: CheckCircle,
      description: 'Başarılı'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform İstatistikleri</h1>
            <p className="text-gray-600 mt-1">AI Araştırma Platformu analiz ve performans metrikleri</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button>
              <TrendingUp className="h-4 w-4 mr-2" />
              Detaylı Rapor
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Badge variant={stat.trend === 'up' ? 'default' : 'secondary'}>
                    {stat.change}
                  </Badge>
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Proje Büyüme Trendi</CardTitle>
              <CardDescription>Aylık proje ve anket aktivitesi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projects" stroke="#8884d8" strokeWidth={2} name="Projeler" />
                  <Line type="monotone" dataKey="surveys" stroke="#82ca9d" strokeWidth={2} name="Anketler" />
                  <Line type="monotone" dataKey="analyses" stroke="#ffc658" strokeWidth={2} name="Analizler" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Response Status */}
          <Card>
            <CardHeader>
              <CardTitle>Anket Yanıt Durumu</CardTitle>
              <CardDescription>Toplam yanıt durumu dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={responseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {responseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Analiz Türü Performansı</CardTitle>
            <CardDescription>En çok kullanılan istatistiksel analiz türleri</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Analiz Sayısı" />
                <Bar yAxisId="right" dataKey="avgTime" fill="#82ca9d" name="Ortalama Süre (dk)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Son Aktiviteler
            </CardTitle>
            <CardDescription>Platform üzerindeki son işlemler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '2 dakika önce', action: 'Yeni proje oluşturuldu', status: 'success', user: 'Dr. Ahmet Yılmaz' },
                { time: '5 dakika önce', action: 'ANOVA analizi tamamlandı', status: 'success', user: 'Dr. Fatma Kaya' },
                { time: '10 dakika önce', action: 'Anket yanıtı alındı', status: 'info', user: 'Anket Katılımcısı #1245' },
                { time: '15 dakika önce', action: 'AI asistan kullanımı', status: 'info', user: 'Dr. Mehmet Özkan' },
                { time: '20 dakika önce', action: 'Rapor oluşturuldu', status: 'success', user: 'Dr. Elif Demir' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    {activity.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
