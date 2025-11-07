"use client"

import type React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, Sparkles, Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react"
import { SetupRequired } from "@/components/setup-required"
import { useLocale } from "@/contexts/LocaleContext"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t, locale, setLocale } = useLocale()

  if (!isSupabaseConfigured()) {
    return <SetupRequired />
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    if (!supabase) {
      setError("Supabase not configured")
      return
    }

    setIsLoading(true)
    setError(null)

    // Validation
    if (password.length < 8) {
      setError(t('auth.passwordMinLength'))
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMustMatch'))
      setIsLoading(false)
      return
    }

    if (!agreeToTerms) {
      setError(locale === 'en' ? 'You must agree to the terms and conditions' : 'Şartları ve koşulları kabul etmelisiniz')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
      router.push("/auth/verify-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-2 group">
            <div className="relative">
              <BookOpen className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-purple-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('common.appName')}
            </h1>
          </Link>

          {/* Language Toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
            >
              {locale === 'en' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </button>
          </div>

          <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-800">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">{t('auth.createAccount')}</CardTitle>
              <CardDescription className="text-base">
                {locale === 'en'
                  ? 'Create your account to get started'
                  : 'Başlamak için hesabınızı oluşturun'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  {/* Name Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      {t('settings.name')}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={locale === 'en' ? 'Your Full Name' : 'Adınız Soyadınız'}
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11"
                      autoComplete="name"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      {t('auth.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={locale === 'en' ? 'you@example.com' : 'ornek@eposta.com'}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      autoComplete="email"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-500" />
                      {t('auth.password')}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11"
                      autoComplete="new-password"
                      placeholder={locale === 'en' ? 'At least 8 characters' : 'En az 8 karakter'}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('auth.passwordMinLength')}
                    </p>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-500" />
                      {t('auth.confirmPassword')}
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11"
                      autoComplete="new-password"
                      placeholder={locale === 'en' ? 'Confirm your password' : 'Şifrenizi onaylayın'}
                    />
                  </div>

                  {/* Terms and Conditions Checkbox */}
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {locale === 'en' ? (
                          <>
                            I agree to the{" "}
                            <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                              Privacy Policy
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                              Hizmet Şartlarını
                            </Link>{" "}
                            ve{" "}
                            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                              Gizlilik Politikasını
                            </Link>{" "}
                            kabul ediyorum
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {locale === 'en' ? 'Creating account...' : 'Hesap oluşturuluyor...'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {t('auth.createAccount')}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              {/* Benefits Section */}
              <div className="mt-6 space-y-2 border-t pt-6">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-3">
                  {locale === 'en' ? 'What you get:' : 'Neler kazanıyorsunuz:'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {locale === 'en' ? '50,000 free tokens per month' : 'Ayda 50.000 ücretsiz token'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {locale === 'en' ? 'Access to all AI providers' : 'Tüm yapay zeka sağlayıcılarına erişim'}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {locale === 'en' ? 'No credit card required' : 'Kredi kartı gerekmez'}
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    {locale === 'en' ? 'or' : 'veya'}
                  </span>
                </div>
              </div>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('auth.alreadyHaveAccount')}{" "}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition"
                  >
                    {t('auth.signIn')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition"
            >
              ← {locale === 'en' ? 'Back to Home' : 'Ana Sayfaya Dön'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
