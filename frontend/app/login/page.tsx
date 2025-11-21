'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LogIn, Mail, Lock, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Logo from '@/components/Logo'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState<Array<{ _id: string; name: string }>>([])
  const [companyMode, setCompanyMode] = useState<'new' | 'existing'>('new')

  const { register } = useAuthStore()

  useEffect(() => {
    if (!isLogin) {
      // Fetch companies when in registration mode
      authAPI.getAllCompanies()
        .then((response) => {
          setCompanies(response.data)
        })
        .catch(() => {
          // Ignore errors, user can still create new company
        })
    }
  }, [isLogin])

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
        await register(
          name, 
          email, 
          password, 
          companyMode === 'new' ? companyName : undefined,
          companyMode === 'existing' ? companyId : undefined
        )
        // After successful registration, switch to login mode
        setIsLogin(true)
        setPassword('') // Clear password field
        setName('') // Clear name field
        setCompanyName('') // Clear company name
        setCompanyId('') // Clear company ID
        setCompanyMode('new') // Reset company mode
        // Keep email filled in for convenience
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
              <>
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
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={companyMode === 'new' ? 'default' : 'outline'}
                      onClick={() => {
                        setCompanyMode('new')
                        setCompanyId('')
                      }}
                      className="flex-1"
                    >
                      New Company
                    </Button>
                    <Button
                      type="button"
                      variant={companyMode === 'existing' ? 'default' : 'outline'}
                      onClick={() => {
                        setCompanyMode('existing')
                        setCompanyName('')
                      }}
                      className="flex-1"
                    >
                      Join Existing
                    </Button>
                  </div>
                </div>

                {companyMode === 'new' ? (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="pl-10"
                        placeholder="Your company name"
                        required={!isLogin && companyMode === 'new'}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="companyId">Select Company</Label>
                    <Select
                      value={companyId}
                      onValueChange={setCompanyId}
                    >
                      <SelectTrigger id="companyId">
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
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
                setCompanyName('')
                setCompanyId('')
                setCompanyMode('new')
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

