'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LogIn, Mail, Lock, User, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Logo from '@/components/Logo'

// Helper function to extract domain from email
const extractDomain = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/
  const match = email.match(emailRegex)
  return match ? match[1].toLowerCase() : null
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')

  const { register } = useAuthStore()

  // Extract domain from email for preview
  const extractedDomain = useMemo(() => {
    if (!email || isLogin) return null
    return extractDomain(email)
  }, [email, isLogin])

  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Use replace to avoid adding to history and prevent back button issues
      router.replace('/')
    }
  }, [isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await login(email, password)
        // The useEffect will handle the redirect after state is updated
        // No need for hard redirect - let React handle it naturally
      } else {
        await register(name, email, password)
        // After successful registration, user is auto-logged in
        // The useEffect will handle the redirect
      }
    } catch (error) {
      // Error handled by toast
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardDescription>
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
              {!isLogin && extractedDomain && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                  <Globe className="w-4 h-4" />
                  <span>Company domain: <span className="font-medium text-foreground">{extractedDomain}</span></span>
                  {extractedDomain && (
                    <span className="ml-auto text-xs">
                      {extractedDomain === 'gmail.com' || extractedDomain === 'yahoo.com' || extractedDomain === 'outlook.com' 
                        ? '(Personal email - new company will be created)'
                        : '(Company will be auto-created or matched)'}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin)
                setName('')
                setEmail('')
                setPassword('')
              }}
              className="text-sm text-foreground"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

