import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supabase Kurulumu Gerekli</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>Bu özelliği kullanmak için Supabase entegrasyonunu yapılandırmanız gerekiyor.</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Kurulum Adımları:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Sol taraftaki sidebar'dan "Connect" bölümüne gidin</li>
                <li>Supabase entegrasyonunu ekleyin</li>
                <li>Environment variable'ları yapılandırın</li>
                <li>Veritabanı şemasını çalıştırın (scripts/01-setup-database.sql)</li>
              </ol>
            </div>
            <Button className="w-full bg-transparent" variant="outline" asChild>
              <a href="/">Ana Sayfaya Dön</a>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
