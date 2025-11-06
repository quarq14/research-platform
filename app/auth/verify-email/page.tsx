import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">E-postanızı Kontrol Edin</CardTitle>
            <CardDescription>
              Hesabınızı doğrulamak için e-posta adresinize bir doğrulama linki gönderdik.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              E-postanızdaki linke tıklayarak hesabınızı aktif edebilirsiniz.
            </p>
            <Link href="/auth/login" className="text-sm text-blue-600 underline underline-offset-4">
              Giriş sayfasına dön
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
