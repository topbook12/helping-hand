'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Book, FileText, Bell, Download, Heart, Share2,
  User, LogIn, LogOut, Upload, Settings, Users, Plus, X, Eye,
  Menu, ChevronDown, ExternalLink, Gift, Phone, Facebook,
  Youtube, Globe, Linkedin, Twitter, Instagram, Sparkles,
  BookOpen, GraduationCap, TrendingUp, Clock, AlertCircle, Copy, Check, File
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAuthStore, User as UserType } from '@/store/auth-store'
import { toast } from 'sonner'

// Types
interface BookType {
  id: string
  title: string
  description?: string
  writerName: string
  publisher?: string
  year?: string
  session?: string
  semester?: string
  fileUrl: string
  thumbnailUrl?: string
  fileSize?: number
  downloadCount: number
  likeCount: number
  viewCount: number
  createdAt: string
  uploader?: { id: string; name: string }
}

interface NoteType {
  id: string
  title: string
  description?: string
  topic?: string
  session?: string
  semester?: string
  fileUrl: string
  thumbnailUrl?: string
  fileType: string
  fileSize?: number
  downloadCount: number
  likeCount: number
  viewCount: number
  createdAt: string
  uploader?: { id: string; name: string }
  teacher?: { id: string; name: string }
}

interface NoticeType {
  id: string
  title: string
  content: string
  imageUrl?: string
  priority: string
  createdAt: string
  creator?: { id: string; name: string }
}

interface DealType {
  id: string
  title: string
  description?: string
  imageUrl?: string
  affiliateUrl: string
  originalPrice?: number
  dealPrice?: number
  discount?: string
  category?: string
}

interface SocialLinkType {
  id: string
  platform: string
  url: string
  icon?: string
}

interface SettingsType {
  siteName?: string
  siteDescription?: string
  bkashNumber?: string
  departmentName?: string
}

// Writer filter options (will be populated from data)
const WRITER_FILTER_ALL = 'all'

const SEMESTERS = [
  { value: 'all', label: 'All Semesters' },
  { value: '1st', label: '1st Semester' },
  { value: '2nd', label: '2nd Semester' },
  { value: '3rd', label: '3rd Semester' },
  { value: '4th', label: '4th Semester' },
  { value: '5th', label: '5th Semester' },
  { value: '6th', label: '6th Semester' },
  { value: '7th', label: '7th Semester' },
  { value: '8th', label: '8th Semester' },
]

export default function HomePage() {
  // Auth state
  const { user, setUser, logout } = useAuthStore()
  
  // Data states
  const [books, setBooks] = useState<BookType[]>([])
  const [notes, setNotes] = useState<NoteType[]>([])
  const [notices, setNotices] = useState<NoticeType[]>([])
  const [deals, setDeals] = useState<DealType[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([])
  const [settings, setSettings] = useState<SettingsType>({})
  
  // UI states
  const [activeTab, setActiveTab] = useState('books')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWriter, setSelectedWriter] = useState('all')
  const [selectedTeacher, setSelectedTeacher] = useState('all')
  const [availableWriters, setAvailableWriters] = useState<string[]>([])
  const [availableTeachers, setAvailableTeachers] = useState<string[]>([])
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Modal states
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  
  // Selected item for detail
  const [selectedItem, setSelectedItem] = useState<BookType | NoteType | null>(null)
  const [selectedType, setSelectedType] = useState<'book' | 'note'>('book')
  
  // Dashboard states
  const [dashboardTab, setDashboardTab] = useState('overview')
  const [allUsers, setAllUsers] = useState<UserType[]>([])
  const [myUploads, setMyUploads] = useState<{ books: BookType[]; notes: NoteType[]; notices: NoticeType[] }>({
    books: [], notes: [], notices: []
  })

  // Upload form state
  const [uploadType, setUploadType] = useState<'book' | 'note' | 'notice' | 'deal'>('book')
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    writerName: '',
    semester: '',
    fileUrl: '',
    thumbnailUrl: '',
    content: '',
    priority: 'NORMAL',
    teacherId: '', // For notes: teacher selection (admin only)
    // Deal fields
    affiliateUrl: '',
    originalPrice: '',
    dealPrice: '',
    discount: '',
    category: '',
    imageUrl: '',
  })
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [bkashCopied, setBkashCopied] = useState(false)
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())

  // Fetch initial data
  useEffect(() => {
    fetchAllData()
    checkAuth()
  }, [])

  // Fetch data when filters change
  useEffect(() => {
    fetchBooksAndNotes()
  }, [selectedWriter, selectedTeacher, selectedSemester, searchQuery])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchBooksAndNotes(),
        fetchNotices(),
        fetchDeals(),
        fetchSocialLinks(),
        fetchSettings(),
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBooksAndNotes = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedSemester !== 'all') params.set('semester', selectedSemester)
      if (searchQuery) params.set('search', searchQuery)

      const [booksRes, notesRes] = await Promise.all([
        fetch(`/api/books?${params.toString()}`),
        fetch(`/api/notes?${params.toString()}`),
      ])

      const booksData = await booksRes.json()
      const notesData = await notesRes.json()

      const allBooks = booksData.books || []
      const allNotes = notesData.notes || []

      // Extract unique writers and teachers
      const writers = [...new Set(allBooks.map((b: BookType) => b.writerName).filter(Boolean))]
      const teachers = [...new Set([...allBooks, ...allNotes].map((item: BookType | NoteType) => item.uploader?.name).filter(Boolean))]
      
      setAvailableWriters(writers)
      setAvailableTeachers(teachers)

      // Apply client-side filters for writer and teacher
      let filteredBooks = allBooks
      let filteredNotes = allNotes

      if (selectedWriter !== 'all') {
        filteredBooks = filteredBooks.filter((b: BookType) => b.writerName === selectedWriter)
      }

      if (selectedTeacher !== 'all') {
        filteredBooks = filteredBooks.filter((b: BookType) => b.uploader?.name === selectedTeacher)
        filteredNotes = filteredNotes.filter((n: NoteType) => n.uploader?.name === selectedTeacher)
      }

      setBooks(filteredBooks)
      setNotes(filteredNotes)
    } catch (error) {
      console.error('Error fetching books/notes:', error)
    }
  }

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/notices?limit=5')
      const data = await res.json()
      setNotices(data.notices || [])
    } catch (error) {
      console.error('Error fetching notices:', error)
    }
  }

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals')
      const data = await res.json()
      setDeals(data.deals || [])
    } catch (error) {
      console.error('Error fetching deals:', error)
    }
  }

  const fetchSocialLinks = async () => {
    try {
      const res = await fetch('/api/social-links')
      const data = await res.json()
      setSocialLinks(data.links || [])
    } catch (error) {
      console.error('Error fetching social links:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data.settings || {})
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setUser(data.user)
      setLoginModalOpen(false)
      setLoginEmail('')
      setLoginPassword('')
      toast.success('Login successful!')
      
      // Open dashboard after login
      setDashboardModalOpen(true)
      fetchDashboardData()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    setDashboardModalOpen(false)
    toast.success('Logged out successfully')
  }

  const fetchDashboardData = async () => {
    if (!user) return
    
    try {
      if (user.role === 'ADMIN') {
        const usersRes = await fetch('/api/users')
        const usersData = await usersRes.json()
        setAllUsers(usersData.users || [])
      }
      
      // Fetch user's uploads
      const booksRes = await fetch('/api/books')
      const notesRes = await fetch('/api/notes')
      const noticesRes = await fetch('/api/notices')
      
      const booksData = await booksRes.json()
      const notesData = await notesRes.json()
      const noticesData = await noticesRes.json()
      
      const myBooks = (booksData.books || []).filter((b: BookType) => b.uploader?.id === user.id)
      const myNotes = (notesData.notes || []).filter((n: NoteType) => n.uploader?.id === user.id)
      const myNotices = (noticesData.notices || []).filter((n: NoticeType) => n.creator?.id === user.id)
      
      setMyUploads({ books: myBooks, notes: myNotes, notices: myNotices })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadLoading(true)
    setUploadProgress(0)
    
    try {
      let endpoint = '/api/books'
      let body: Record<string, unknown> = {}
      
      if (uploadType === 'book') {
        endpoint = '/api/books'
        body = {
          title: uploadForm.title,
          description: uploadForm.description,
          writerName: uploadForm.writerName,
          semester: uploadForm.semester,
          fileUrl: uploadForm.fileUrl,
          thumbnailUrl: uploadForm.thumbnailUrl,
        }
      } else if (uploadType === 'note') {
        endpoint = '/api/notes'
        body = {
          title: uploadForm.title,
          description: uploadForm.description,
          semester: uploadForm.semester,
          fileUrl: uploadForm.fileUrl,
          thumbnailUrl: uploadForm.thumbnailUrl,
          teacherId: uploadForm.teacherId || null, // Admin can assign teacher
        }
      } else if (uploadType === 'notice') {
        endpoint = '/api/notices'
        body = {
          title: uploadForm.title,
          content: uploadForm.content,
          priority: uploadForm.priority,
          imageUrl: uploadForm.imageUrl,
        }
      } else if (uploadType === 'deal') {
        endpoint = '/api/deals'
        body = {
          title: uploadForm.title,
          description: uploadForm.description,
          affiliateUrl: uploadForm.affiliateUrl,
          imageUrl: uploadForm.imageUrl,
          originalPrice: uploadForm.originalPrice ? parseFloat(uploadForm.originalPrice) : null,
          dealPrice: uploadForm.dealPrice ? parseFloat(uploadForm.dealPrice) : null,
          discount: uploadForm.discount,
          category: uploadForm.category,
        }
      }
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success(`${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} uploaded successfully!`)
      setUploadModalOpen(false)
      setUploadForm({
        title: '',
        description: '',
        writerName: '',
        semester: '',
        fileUrl: '',
        thumbnailUrl: '',
        content: '',
        priority: 'NORMAL',
        teacherId: '',
        affiliateUrl: '',
        originalPrice: '',
        dealPrice: '',
        discount: '',
        category: '',
        imageUrl: '',
      })
      fetchDashboardData()
      fetchBooksAndNotes()
      fetchNotices()
      fetchDeals()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploadLoading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (type: 'book' | 'note' | 'notice' | 'deal', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const endpoint = type === 'book' ? `/api/books/${id}` : type === 'note' ? `/api/notes/${id}` : type === 'deal' ? `/api/deals/${id}` : `/api/notices/${id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      
      if (!res.ok) throw new Error('Failed to delete')
      
      toast.success('Deleted successfully')
      fetchDashboardData()
      fetchBooksAndNotes()
      fetchNotices()
      fetchDeals()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleDownload = async (type: 'book' | 'note', id: string) => {
    try {
      const endpoint = type === 'book' ? `/api/books/download/${id}` : `/api/notes/download/${id}`
      const res = await fetch(endpoint)
      const data = await res.json()
      
      // Create download link
      const link = window.document.createElement('a')
      link.href = data.downloadUrl
      link.download = data.title || 'download'
      link.target = '_blank'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      
      toast.success('Download started!')
      fetchBooksAndNotes()
    } catch {
      toast.error('Failed to download')
    }
  }

  const handleLike = async (type: 'book' | 'note', id: string) => {
    // Check if already liked (stored in localStorage)
    const likedKey = `${type}_${id}`
    const storedLikes = JSON.parse(localStorage.getItem('likedItems') || '[]')

    if (storedLikes.includes(likedKey)) {
      toast.info('You already liked this! ❤️')
      return
    }

    try {
      const endpoint = type === 'book' ? `/api/books/like/${id}` : `/api/notes/like/${id}`
      const res = await fetch(endpoint, { method: 'POST' })

      if (res.ok) {
        // Save to localStorage
        storedLikes.push(likedKey)
        localStorage.setItem('likedItems', JSON.stringify(storedLikes))

        // Update state
        setLikedItems(prev => new Set([...prev, likedKey]))

        toast.success('Liked! ❤️')
        fetchBooksAndNotes()
      }
    } catch {
      toast.error('Failed to like')
    }
  }

  const handleView = (type: 'book' | 'note', item: BookType | NoteType) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank')
    } else {
      toast.error('No file available to view')
    }
  }

  const copyBkashNumber = () => {
    const number = settings.bkashNumber || '01521706294'
    navigator.clipboard.writeText(number)
    setBkashCopied(true)
    toast.success('bKash number copied!')
    setTimeout(() => setBkashCopied(false), 2000)
  }

  const handleShare = (item: BookType | NoteType, type: 'book' | 'note') => {
    setSelectedItem(item)
    setSelectedType(type)
    setShareModalOpen(true)
  }

  const shareToSocial = (platform: string) => {
    const url = window.location.href
    const text = `Check out this ${selectedType}: ${selectedItem?.title}`
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    }
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank')
    }
    setShareModalOpen(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setUploadForm(prev => ({ ...prev, fileUrl: data.url }))
      toast.success('File uploaded successfully!')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload file')
    }
  }

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      Facebook: <Facebook className="w-5 h-5" />,
      YouTube: <Youtube className="w-5 h-5" />,
      Website: <Globe className="w-5 h-5" />,
      LinkedIn: <Linkedin className="w-5 h-5" />,
      Twitter: <Twitter className="w-5 h-5" />,
      Instagram: <Instagram className="w-5 h-5" />,
    }
    return icons[platform] || <Globe className="w-5 h-5" />
  }

  const openDetail = (item: BookType | NoteType, type: 'book' | 'note') => {
    setSelectedItem(item)
    setSelectedType(type)
    setDetailModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <GraduationCap className="w-6 h-6 text-white relative z-10 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent transition-all duration-300 group-hover:from-emerald-300 group-hover:to-teal-300 group-hover:drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                  {settings.siteName || 'Helping Hand'}
                </h1>
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{settings.departmentName || 'ICE Department'}</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="text-slate-300 hover:text-emerald-400 relative overflow-hidden group hover:bg-emerald-500/10 transition-all duration-300" 
                onClick={() => setActiveTab('books')}
              >
                <Book className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                <span className="relative z-10">Books</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-300" />
              </Button>
              <Button 
                variant="ghost" 
                className="text-slate-300 hover:text-teal-400 relative overflow-hidden group hover:bg-teal-500/10 transition-all duration-300" 
                onClick={() => setActiveTab('notes')}
              >
                <FileText className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                <span className="relative z-10">Notes</span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 to-cyan-500/0 group-hover:from-teal-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />
              </Button>
              <Button 
                variant="ghost" 
                className="text-slate-300 hover:text-amber-400 relative overflow-hidden group hover:bg-amber-500/10 transition-all duration-300" 
                onClick={() => setActiveTab('deals')}
              >
                <Gift className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <span className="relative z-10">Deals</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all duration-300" />
              </Button>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    className="hidden sm:flex border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 relative overflow-hidden group transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    onClick={() => { setDashboardModalOpen(true); fetchDashboardData(); }}
                  >
                    <Settings className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-slate-300 hover:text-red-400 relative overflow-hidden group hover:bg-red-500/10 transition-all duration-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 relative overflow-hidden group transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105"
                  onClick={() => setLoginModalOpen(true)}
                >
                  <LogIn className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                  <span className="relative z-10">Login</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-teal-300 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-20" />
                </Button>
              )}
              
              {/* Mobile Menu */}
              <Button
                variant="ghost"
                className="md:hidden text-slate-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-slate-900 border-t border-slate-800"
            >
              <div className="p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setActiveTab('books'); setMobileMenuOpen(false); }}>
                  <Book className="w-4 h-4 mr-2" /> Books
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setActiveTab('notes'); setMobileMenuOpen(false); }}>
                  <FileText className="w-4 h-4 mr-2" /> Notes
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setActiveTab('deals'); setMobileMenuOpen(false); }}>
                  <Gift className="w-4 h-4 mr-2" /> Deals
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-8 md:p-12 mb-8 group transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_0_60px_rgba(16,185,129,0.1)]"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-2 h-2 bg-emerald-400/30 rounded-full top-20 left-10 animate-float-1" />
            <div className="absolute w-1.5 h-1.5 bg-teal-400/30 rounded-full bottom-32 right-20 animate-float-2" />
            <div className="absolute w-1 h-1 bg-amber-400/30 rounded-full top-40 right-40 animate-float-3" />
            <div className="absolute w-2 h-2 bg-cyan-400/20 rounded-full bottom-20 left-1/3 animate-float-1" style={{ animationDelay: '0.5s' }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 group/label">
              <Sparkles className="w-5 h-5 text-amber-400 transition-transform duration-300 group-hover/label:rotate-12 group-hover/label:scale-125" />
              <span className="text-amber-400 font-medium transition-colors duration-300 group-hover/label:text-amber-300">ICE Department</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Your Ultimate Resource Hub for
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto]"> Academic Excellence</span>
            </h2>
            <p className="text-slate-400 text-lg mb-6 max-w-2xl transition-colors duration-300 group-hover:text-slate-300">
              Access ebooks, class notes, and important notices all in one place. 
              Download, share, and stay updated with the latest from ICE Department.
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search books, notes, writers..."
                  className="pl-10 h-12 bg-slate-800/50 border-slate-600 focus:border-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={selectedWriter} onValueChange={setSelectedWriter}>
                  <SelectTrigger className="w-36 h-12 bg-slate-800/50 border-slate-600">
                    <SelectValue placeholder="Writer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Writers</SelectItem>
                    {availableWriters.map(writer => (
                      <SelectItem key={writer} value={writer}>{writer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger className="w-36 h-12 bg-slate-800/50 border-slate-600">
                    <SelectValue placeholder="Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {availableTeachers.map(teacher => (
                      <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-32 h-12 bg-slate-800/50 border-slate-600">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Notice Board */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group/card transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover/card:from-amber-500/3 group-hover/card:to-orange-500/3 transition-all duration-500" />
                <CardHeader className="flex flex-row items-center justify-between relative">
                  <div className="flex items-center gap-2 group/title">
                    <Bell className="w-5 h-5 text-amber-400 transition-transform duration-300 group-hover/title:rotate-12 group-hover/title:scale-110" />
                    <CardTitle className="text-lg transition-colors duration-300 group-hover/title:text-amber-300">Notice Board</CardTitle>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 animate-pulse transition-all duration-300 hover:bg-red-500/30 hover:scale-105">
                    {notices.length} Active
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    {notices.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No notices available</p>
                    ) : (
                      <div className="space-y-3">
                        {notices.map((notice, index) => (
                          <motion.div
                            key={notice.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ x: 5, scale: 1.01 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                          >
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-transparent transition-all duration-300" />
                            
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                              notice.priority === 'HIGH' ? 'bg-red-500 group-hover:animate-pulse shadow-lg shadow-red-500/50' : 
                              notice.priority === 'LOW' ? 'bg-slate-500' : 'bg-amber-500 group-hover:animate-pulse shadow-lg shadow-amber-500/50'
                            } transition-all`} />
                            <div className="flex-1 relative z-10">
                              <h4 className="font-medium text-slate-100 group-hover:text-amber-400 transition-colors">{notice.title}</h4>
                              <p className="text-sm text-slate-400 line-clamp-2 group-hover:text-slate-300 transition-colors">{notice.content}</p>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(notice.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.section>

            {/* Tabs for Books/Notes/Deals */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-900 border border-slate-800 mb-6 p-1 gap-1">
                  <TabsTrigger 
                    value="books" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    <Book className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                    Books ({books.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-cyan-600 data-[state=active]:shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all duration-300 hover:bg-teal-500/10 hover:text-teal-400"
                  >
                    <FileText className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                    Notes ({notes.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="deals" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all duration-300 hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    <Gift className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    Hot Deals ({deals.length})
                  </TabsTrigger>
                </TabsList>

                {/* Books Tab */}
                <TabsContent value="books">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
                          <div className="h-40 bg-slate-800 rounded-t-lg" />
                          <CardContent className="p-4">
                            <div className="h-4 bg-slate-800 rounded mb-2" />
                            <div className="h-3 bg-slate-800 rounded w-2/3" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : books.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">No books found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {books.map((book, index) => (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -12, scale: 1.03, rotateY: 5, rotateX: 5 }}
                          className="group [perspective:1000px]"
                        >
                          <Card className="relative bg-slate-900/80 border-slate-800 cursor-pointer overflow-hidden transition-all duration-700 group-hover:border-emerald-500/70 group-hover:shadow-[0_0_60px_rgba(16,185,129,0.3),0_25px_50px_-12px_rgba(0,0,0,0.5)] transform-gpu preserve-3d"
                            onClick={() => openDetail(book, 'book')}>
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-cyan-500/0 group-hover:from-emerald-500/15 group-hover:via-teal-500/10 group-hover:to-cyan-500/15 transition-all duration-700" />

                            {/* Pulsing glow orb */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/0 rounded-full blur-3xl group-hover:bg-emerald-500/30 group-hover:scale-150 transition-all duration-700 animate-pulse" />

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>

                            {/* Animated neon border */}
                            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute inset-[-3px] rounded-lg bg-gradient-to-r from-emerald-500 via-teal-400 via-cyan-400 to-emerald-500 animate-gradient-x opacity-70 blur-[2px]" />
                              <div className="absolute inset-[-1px] rounded-lg bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 animate-gradient-x opacity-50" />
                            </div>

                            {/* Floating sparkles */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute w-1 h-1 bg-emerald-300 rounded-full top-6 left-8 animate-float-1 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                              <div className="absolute w-1.5 h-1.5 bg-teal-300 rounded-full top-12 right-10 animate-float-2 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                              <div className="absolute w-1 h-1 bg-cyan-300 rounded-full bottom-20 left-12 animate-float-3 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                              <div className="absolute w-2 h-2 bg-emerald-200/50 rounded-full bottom-32 right-8 animate-float-1 shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
                            </div>

                            {/* Thumbnail */}
                            <div className="relative h-44 bg-gradient-to-br from-slate-800 via-slate-800/90 to-slate-700 rounded-t-lg overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent group-hover:from-slate-900/90 group-hover:via-transparent transition-all duration-500" />
                              {book.thumbnailUrl ? (
                                <img src={book.thumbnailUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                                    <Book className="w-16 h-16 text-slate-600 group-hover:text-emerald-400 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10" />
                                  </div>
                                </div>
                              )}
                              {book.downloadCount > 50 && (
                                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 border-0 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse">
                                  <TrendingUp className="w-3 h-3 mr-1" /> Popular
                                </Badge>
                              )}
                            </div>

                            <CardContent className="p-5 relative">
                              <h3 className="font-bold text-lg text-slate-100 line-clamp-1 group-hover:text-emerald-300 transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(52,211,153,0.8)] group-hover:tracking-wide">
                                {book.title}
                              </h3>
                              <p className="text-sm text-slate-400 mt-2 group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300">by {book.writerName}</p>
                              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300">
                                  <Eye className="w-3.5 h-3.5" /> {book.viewCount}
                                </span>
                                <span className="flex items-center gap-1.5 group-hover:text-teal-400 group-hover:scale-110 transition-all duration-300">
                                  <Download className="w-3.5 h-3.5" /> {book.downloadCount}
                                </span>
                                <span className="flex items-center gap-1.5 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300">
                                  <Heart className="w-3.5 h-3.5" /> {book.likeCount}
                                </span>
                              </div>
                            </CardContent>

                            <CardFooter className="p-5 pt-0 flex gap-2 relative">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300"
                                onClick={(e) => { e.stopPropagation(); handleView('book', book); }}
                              >
                                <Eye className="w-4 h-4 mr-1.5" /> View
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 relative overflow-hidden group/btn shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
                                onClick={(e) => { e.stopPropagation(); handleDownload('book', book.id); }}
                              >
                                <span className="relative z-10 flex items-center gap-1.5">
                                  <Download className="w-4 h-4 group-hover/btn:animate-bounce" /> Download
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-teal-300 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:scale-110 transition-all duration-300"
                                onClick={(e) => { e.stopPropagation(); handleLike('book', book.id); }}
                              >
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-600 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-110 transition-all duration-300"
                                onClick={(e) => { e.stopPropagation(); handleShare(book, 'book'); }}
                              >
                                <Share2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-4 bg-slate-800 rounded mb-2" />
                            <div className="h-3 bg-slate-800 rounded w-2/3" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">No notes found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {notes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -12, scale: 1.03, rotateY: -5, rotateX: 5 }}
                          className="group [perspective:1000px]"
                        >
                          <Card className="relative bg-slate-900/80 border-slate-800 cursor-pointer overflow-hidden transition-all duration-700 group-hover:border-teal-500/70 group-hover:shadow-[0_0_60px_rgba(20,184,166,0.3),0_25px_50px_-12px_rgba(0,0,0,0.5)] transform-gpu preserve-3d"
                            onClick={() => openDetail(note, 'note')}>
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-cyan-500/0 to-emerald-500/0 group-hover:from-teal-500/15 group-hover:via-cyan-500/10 group-hover:to-emerald-500/15 transition-all duration-700" />

                            {/* Pulsing glow orb */}
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-teal-500/0 rounded-full blur-3xl group-hover:bg-teal-500/30 group-hover:scale-150 transition-all duration-700 animate-pulse" />

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>

                            {/* Animated neon border */}
                            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute inset-[-3px] rounded-lg bg-gradient-to-r from-teal-500 via-cyan-400 via-emerald-400 to-teal-500 animate-gradient-x opacity-70 blur-[2px]" />
                              <div className="absolute inset-[-1px] rounded-lg bg-gradient-to-r from-teal-400 via-cyan-300 to-teal-400 animate-gradient-x opacity-50" />
                            </div>

                            {/* Floating sparkles */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute w-1 h-1 bg-teal-300 rounded-full top-6 right-8 animate-float-1 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                              <div className="absolute w-1.5 h-1.5 bg-cyan-300 rounded-full top-16 left-10 animate-float-2 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                              <div className="absolute w-1 h-1 bg-emerald-300 rounded-full bottom-16 right-12 animate-float-3 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                            </div>

                            <CardContent className="p-5 relative">
                              <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-teal-600 via-cyan-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-115 group-hover:rotate-12 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] transition-all duration-500 relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  <FileText className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300 relative z-10" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-slate-100 line-clamp-1 group-hover:text-teal-300 transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(45,212,191,0.8)] group-hover:tracking-wide">
                                    {note.title}
                                  </h3>
                                  <p className="text-sm text-slate-400 mt-1 group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300">{note.topic || 'Class Note'}</p>
                                  <div className="flex items-center gap-2 mt-3">
                                    {note.semester && (
                                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 group-hover:border-teal-500 group-hover:text-teal-300 group-hover:shadow-[0_0_10px_rgba(45,212,191,0.3)] transition-all duration-300">{note.semester}</Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 group-hover:border-cyan-500 group-hover:text-cyan-300 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all duration-300">{note.fileType}</Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800 group-hover:border-teal-500/30 transition-colors duration-300">
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1.5 group-hover:text-teal-400 group-hover:scale-110 transition-all duration-300">
                                    <Eye className="w-3.5 h-3.5" /> {note.viewCount}
                                  </span>
                                  <span className="flex items-center gap-1.5 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300">
                                    <Download className="w-3.5 h-3.5" /> {note.downloadCount}
                                  </span>
                                  <span className="flex items-center gap-1.5 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300">
                                    <Heart className="w-3.5 h-3.5" /> {note.likeCount}
                                  </span>
                                </div>
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 w-9 p-0 hover:text-teal-400 hover:bg-teal-500/10 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-125 transition-all duration-300"
                                    onClick={(e) => { e.stopPropagation(); handleView('note', note); }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 w-9 p-0 hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-125 transition-all duration-300"
                                    onClick={(e) => { e.stopPropagation(); handleLike('note', note.id); }}
                                  >
                                    <Heart className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-9 w-9 p-0 hover:text-teal-400 hover:bg-teal-500/10 hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:scale-125 transition-all duration-300"
                                    onClick={(e) => { e.stopPropagation(); handleShare(note, 'note'); }}
                                  >
                                    <Share2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-9 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 relative overflow-hidden group/btn shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-all duration-300"
                                    onClick={(e) => { e.stopPropagation(); handleDownload('note', note.id); }}
                                  >
                                    <Download className="w-4 h-4 relative z-10 group-hover/btn:animate-bounce" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-teal-300 to-cyan-300 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Deals Tab */}
                <TabsContent value="deals">
                  {deals.length === 0 ? (
                    <div className="text-center py-12">
                      <Gift className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">No deals available at the moment</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deals.map((deal, index) => (
                        <motion.div
                          key={deal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -12, scale: 1.02, rotateY: 3 }}
                          className="group [perspective:1000px]"
                        >
                          <Card className="relative bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 border-amber-600/30 overflow-hidden transition-all duration-700 group-hover:border-amber-500/80 group-hover:shadow-[0_0_80px_rgba(245,158,11,0.3),0_25px_50px_-12px_rgba(0,0,0,0.5)] transform-gpu preserve-3d">
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-orange-500/0 to-red-500/0 group-hover:from-amber-500/20 group-hover:via-orange-500/10 group-hover:to-red-500/15 transition-all duration-700" />

                            {/* Pulsing glow orb */}
                            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/0 rounded-full blur-3xl group-hover:bg-amber-500/25 group-hover:scale-125 transition-all duration-700 animate-pulse" />

                            {/* Animated neon border */}
                            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute inset-[-3px] rounded-lg bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 animate-gradient-x opacity-70 blur-[2px]" />
                              <div className="absolute inset-[-1px] rounded-lg bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 animate-gradient-x opacity-50" />
                            </div>

                            {/* Floating sparkles */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute w-1.5 h-1.5 bg-amber-300 rounded-full top-8 left-6 animate-float-1 shadow-[0_0_10px_rgba(252,211,77,0.8)]" />
                              <div className="absolute w-1 h-1 bg-orange-300 rounded-full top-16 right-20 animate-float-2 shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
                              <div className="absolute w-2 h-2 bg-yellow-300/50 rounded-full bottom-24 left-16 animate-float-3 shadow-[0_0_15px_rgba(253,224,71,0.6)]" />
                            </div>

                            {/* Sparkle badge */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125">
                              <div className="relative">
                                <div className="absolute inset-0 bg-amber-400 blur-md rounded-full" />
                                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse relative z-10" />
                              </div>
                            </div>

                            <div className="flex relative">
                              {/* Image */}
                              <div className="w-36 h-36 bg-gradient-to-br from-slate-800 to-slate-700 flex-shrink-0 relative overflow-hidden rounded-l-lg">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {deal.imageUrl ? (
                                  <img src={deal.imageUrl} alt={deal.title} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-amber-500/30 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                                      <Gift className="w-12 h-12 text-amber-500/50 group-hover:text-amber-400 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative z-10" />
                                    </div>
                                  </div>
                                )}
                                {deal.discount && (
                                  <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-md animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-white/20">
                                    {deal.discount}
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <CardContent className="flex-1 p-5 relative">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-amber-400/50 blur-sm rounded-full" />
                                    <Sparkles className="w-4 h-4 text-amber-400 group-hover:animate-spin relative z-10" />
                                  </div>
                                  <span className="text-xs text-amber-400 font-bold tracking-wider group-hover:tracking-widest transition-all duration-300">HOT DEAL</span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-100 line-clamp-1 group-hover:text-amber-200 transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(252,211,77,0.8)] group-hover:tracking-wide">{deal.title}</h3>
                                {deal.description && (
                                  <p className="text-sm text-slate-400 line-clamp-2 mt-1.5 group-hover:text-slate-300 group-hover:translate-x-1 transition-all duration-300">{deal.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-3">
                                  {deal.originalPrice && (
                                    <span className="text-sm text-slate-500 line-through">৳{deal.originalPrice}</span>
                                  )}
                                  {deal.dealPrice && (
                                    <span className="text-xl font-bold text-emerald-400 group-hover:scale-110 group-hover:text-emerald-300 transition-all origin-left drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">৳{deal.dealPrice}</span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  className="mt-4 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 relative overflow-hidden group/btn shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 bg-size-200 animate-gradient-x"
                                  onClick={() => window.open(deal.affiliateUrl, '_blank')}
                                >
                                  <span className="relative z-10 flex items-center justify-center font-semibold">
                                    Grab Deal <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-125 transition-all duration-300" />
                                  </span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                </Button>
                              </CardContent>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Support Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="relative bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-600/30 overflow-hidden transition-all duration-500 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] group">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-teal-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-teal-500/5 group-hover:to-emerald-500/5 transition-all duration-500" />

                <CardHeader className="relative">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />
                    Support the Creator
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center relative">
                  <p className="text-slate-400 text-sm mb-4 group-hover:text-slate-300 transition-colors">
                    Help us keep this platform running by supporting with a small donation
                  </p>
                  <div className="relative bg-emerald-600/20 rounded-lg p-4 border border-emerald-600/30 group-hover:border-emerald-500/50 group-hover:bg-emerald-600/30 transition-all duration-300 overflow-hidden">
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <p className="text-emerald-400 font-medium mb-2">bKash Number</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-2xl font-bold text-white tracking-widest">
                        {'•••••••••••'}
                      </p>
                      <Button
                        size="sm"
                        onClick={copyBkashNumber}
                        className="bg-emerald-600 hover:bg-emerald-500 relative overflow-hidden group/btn"
                      >
                        {bkashCopied ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <Copy className="w-4 h-4 text-white group-hover/btn:scale-110 transition-transform" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Click to copy the number</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    Connect With Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {socialLinks.map((link, idx) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full justify-start border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300 group relative overflow-hidden"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <span className="relative z-10 flex items-center w-full">
                            <span className="group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                              {getSocialIcon(link.platform)}
                            </span>
                            <span className="ml-2">{link.platform}</span>
                            <ExternalLink className="w-4 h-4 ml-auto group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-300" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group transition-all duration-500 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500" />
                <CardHeader className="relative">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                    Platform Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg group/stat transition-all duration-300 hover:bg-emerald-500/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
                      <p className="text-2xl font-bold text-emerald-400 group-hover/stat:scale-110 transition-transform duration-300 inline-block">{books.length}</p>
                      <p className="text-xs text-slate-400 group-hover/stat:text-emerald-300 transition-colors">Books</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg group/stat transition-all duration-300 hover:bg-teal-500/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)] cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
                      <p className="text-2xl font-bold text-teal-400 group-hover/stat:scale-110 transition-transform duration-300 inline-block">{notes.length}</p>
                      <p className="text-xs text-slate-400 group-hover/stat:text-teal-300 transition-colors">Notes</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg group/stat transition-all duration-300 hover:bg-amber-500/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
                      <p className="text-2xl font-bold text-amber-400 group-hover/stat:scale-110 transition-transform duration-300 inline-block">{notices.length}</p>
                      <p className="text-xs text-slate-400 group-hover/stat:text-amber-300 transition-colors">Notices</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg group/stat transition-all duration-300 hover:bg-pink-500/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] cursor-pointer relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
                      <p className="text-2xl font-bold text-pink-400 group-hover/stat:scale-110 transition-transform duration-300 inline-block">{deals.length}</p>
                      <p className="text-xs text-slate-400 group-hover/stat:text-pink-300 transition-colors">Deals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-teal-500/0 to-emerald-500/0" />
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <GraduationCap className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <p className="font-semibold transition-colors duration-300 group-hover:text-emerald-400">{settings.siteName || 'Helping Hand'}</p>
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{settings.departmentName || 'ICE Department'}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1 transition-colors hover:text-slate-300 cursor-default">
              © {new Date().getFullYear()} All rights reserved. Made with 
              <Heart className="w-4 h-4 text-red-400 inline animate-pulse" /> 
              for ICE students.
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {loginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={() => setLoginModalOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setLoginModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Login</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Login as Teacher or Admin to manage content
                </p>
              </div>
              
              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="mt-1 bg-slate-800 border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="mt-1 bg-slate-800 border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-300"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Default Credentials Hint */}
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-medium mb-1">🔑 Default Admin Credentials:</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                    <span>Email: <code className="bg-slate-800 px-1.5 py-0.5 rounded">admin@ice.edu</code></span>
                    <span>Password: <code className="bg-slate-800 px-1.5 py-0.5 rounded">admin123</code></span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 relative overflow-hidden group transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  disabled={loginLoading}
                >
                  <span className="relative z-10">{loginLoading ? 'Logging in...' : 'Login'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-teal-300 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-20" />
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Modal */}
      <Dialog open={dashboardModalOpen} onOpenChange={setDashboardModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900 border-slate-800 overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Dashboard</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Welcome back, {user?.name} ({user?.role})
                </DialogDescription>
              </div>
              <Button size="sm" onClick={() => setUploadModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Upload
              </Button>
            </div>
          </DialogHeader>
          
          <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="mt-4">
            <TabsList className="bg-slate-800 w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
              {user?.role === 'ADMIN' && <TabsTrigger value="users">Users</TabsTrigger>}
              {user?.role === 'ADMIN' && <TabsTrigger value="all-content">All Content</TabsTrigger>}
              {user?.role === 'ADMIN' && <TabsTrigger value="deals">Deals</TabsTrigger>}
              {user?.role === 'ADMIN' && <TabsTrigger value="settings">Settings</TabsTrigger>}
            </TabsList>
            
            <ScrollArea className="h-[60vh] mt-4">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <Book className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                      <p className="text-2xl font-bold">{myUploads.books.length}</p>
                      <p className="text-sm text-slate-400">My Books</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-teal-400" />
                      <p className="text-2xl font-bold">{myUploads.notes.length}</p>
                      <p className="text-sm text-slate-400">My Notes</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-4 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                      <p className="text-2xl font-bold">{myUploads.notices.length}</p>
                      <p className="text-sm text-slate-400">My Notices</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="my-uploads" className="space-y-4">
                <h3 className="font-semibold text-lg">My Books</h3>
                {myUploads.books.length === 0 ? (
                  <p className="text-slate-500">No books uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {myUploads.books.map(book => (
                      <div key={book.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-slate-400">by {book.writerName}</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('book', book.id)}>
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <h3 className="font-semibold text-lg">My Notes</h3>
                {myUploads.notes.length === 0 ? (
                  <p className="text-slate-500">No notes uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {myUploads.notes.map(note => (
                      <div key={note.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{note.title}</p>
                          <p className="text-sm text-slate-400">{note.fileType}</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('note', note.id)}>
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <h3 className="font-semibold text-lg">My Notices</h3>
                {myUploads.notices.length === 0 ? (
                  <p className="text-slate-500">No notices posted yet</p>
                ) : (
                  <div className="space-y-2">
                    {myUploads.notices.map(notice => (
                      <div key={notice.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{notice.title}</p>
                          <p className="text-sm text-slate-400 line-clamp-1">{notice.content}</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('notice', notice.id)}>
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {user?.role === 'ADMIN' && (
                <TabsContent value="users" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">All Users</h3>
                    <Button size="sm" onClick={() => {
                      const email = prompt('Enter email:')
                      const name = prompt('Enter name:')
                      const password = prompt('Enter password:')
                      if (email && name && password) {
                        fetch('/api/users', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, name, password, role: 'TEACHER' }),
                        }).then(() => {
                          toast.success('User created')
                          fetchDashboardData()
                        }).catch(() => toast.error('Failed to create user'))
                      }
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Teacher
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {allUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-sm text-slate-400">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {u.role}
                          </Badge>
                          {u.id !== user?.id && (
                            <Button variant="destructive" size="sm" onClick={() => {
                              if (confirm('Delete this user?')) {
                                fetch(`/api/users/${u.id}`, { method: 'DELETE' })
                                  .then(() => {
                                    toast.success('User deleted')
                                    fetchDashboardData()
                                  }).catch(() => toast.error('Failed to delete'))
                              }
                            }}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
              
              {user?.role === 'ADMIN' && (
                <TabsContent value="all-content" className="space-y-4">
                  <h3 className="font-semibold text-lg">All Books</h3>
                  <div className="space-y-2">
                    {books.map(book => (
                      <div key={book.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-slate-400">by {book.writerName} | Uploaded by: {book.uploader?.name}</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete('book', book.id)}>
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
              
              {user?.role === 'ADMIN' && (
                <TabsContent value="deals" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Gift className="w-5 h-5 text-pink-400" />
                      Affiliate Deals & Hot Promotions
                    </h3>
                    <Button size="sm" onClick={() => { setUploadType('deal'); setUploadModalOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Deal
                    </Button>
                  </div>
                  
                  {deals.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">No deals yet. Add your first affiliate deal!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deals.map(deal => (
                        <div key={deal.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-start gap-3">
                            {deal.imageUrl ? (
                              <img src={deal.imageUrl} alt={deal.title} className="w-20 h-20 object-cover rounded-lg" />
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Gift className="w-8 h-8 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium line-clamp-1">{deal.title}</h4>
                              <p className="text-sm text-slate-400 line-clamp-2">{deal.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {deal.discount && (
                                  <Badge className="bg-green-500/20 text-green-400">{deal.discount}</Badge>
                                )}
                                {deal.category && (
                                  <Badge variant="outline" className="border-slate-600">{deal.category}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {deal.originalPrice && (
                                  <span className="text-sm text-slate-500 line-through">৳{deal.originalPrice}</span>
                                )}
                                {deal.dealPrice && (
                                  <span className="text-lg font-bold text-emerald-400">৳{deal.dealPrice}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-emerald-600 text-emerald-400"
                              onClick={() => window.open(deal.affiliateUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" /> Visit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete('deal', deal.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
              
              {user?.role === 'ADMIN' && (
                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Site Name</Label>
                      <Input
                        className="mt-1 bg-slate-800 border-slate-700"
                        defaultValue={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Department Name</Label>
                      <Input
                        className="mt-1 bg-slate-800 border-slate-700"
                        defaultValue={settings.departmentName}
                        onChange={(e) => setSettings({ ...settings, departmentName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>bKash Number</Label>
                      <Input
                        className="mt-1 bg-slate-800 border-slate-700"
                        defaultValue={settings.bkashNumber}
                        onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                      />
                    </div>
                    <Button onClick={() => {
                      fetch('/api/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ settings }),
                      }).then(() => toast.success('Settings saved'))
                        .catch(() => toast.error('Failed to save'))
                    }}>
                      Save Settings
                    </Button>
                  </div>
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Upload Content</DialogTitle>
            <DialogDescription>Add new books, notes, or notices</DialogDescription>
          </DialogHeader>
          
          <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'book' | 'note' | 'notice' | 'deal')} className="mt-4">
            <TabsList className="w-full bg-slate-800">
              <TabsTrigger value="book" className="flex-1">Book</TabsTrigger>
              <TabsTrigger value="note" className="flex-1">Note</TabsTrigger>
              <TabsTrigger value="notice" className="flex-1">Notice</TabsTrigger>
              {user?.role === 'ADMIN' && (
                <TabsTrigger value="deal" className="flex-1">Deal</TabsTrigger>
              )}
            </TabsList>
          </Tabs>
          
          <form onSubmit={handleUpload} className="space-y-4 mt-4">
            <div>
              <Label>Title *</Label>
              <Input
                className="mt-1 bg-slate-800 border-slate-700"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                required
              />
            </div>
            
            {uploadType !== 'notice' && uploadType !== 'deal' && (
              <>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-1 bg-slate-800 border-slate-700"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  />
                </div>
                
                {uploadType === 'book' && (
                  <div>
                    <Label>Writer Name *</Label>
                    <Input
                      className="mt-1 bg-slate-800 border-slate-700"
                      value={uploadForm.writerName}
                      onChange={(e) => setUploadForm({ ...uploadForm, writerName: e.target.value })}
                      required
                    />
                  </div>
                )}
                
                {uploadType === 'note' && user?.role === 'ADMIN' && (
                  <div>
                    <Label>Assign to Teacher (Optional)</Label>
                    <Select value={uploadForm.teacherId} onValueChange={(v) => setUploadForm({ ...uploadForm, teacherId: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select Teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None (Uploaded by me)</SelectItem>
                        {allUsers.filter(u => u.role === 'TEACHER').map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                    <Label>Semester</Label>
                    <Select value={uploadForm.semester} onValueChange={(v) => setUploadForm({ ...uploadForm, semester: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTERS.filter(s => s.value !== 'all').map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              </>
            )}
            
            {uploadType === 'notice' && (
              <>
                <div>
                  <Label>Content *</Label>
                  <Textarea
                    className="mt-1 bg-slate-800 border-slate-700"
                    value={uploadForm.content}
                    onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                    required
                    placeholder="Enter notice content..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={uploadForm.priority} onValueChange={(v) => setUploadForm({ ...uploadForm, priority: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image URL (Optional)</Label>
                  <Input
                    className="mt-1 bg-slate-800 border-slate-700"
                    placeholder="https://example.com/image.jpg"
                    value={uploadForm.imageUrl}
                    onChange={(e) => setUploadForm({ ...uploadForm, imageUrl: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">Add an image to make your notice more visible</p>
                </div>
              </>
            )}
            
            {uploadType === 'deal' && (
              <>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-1 bg-slate-800 border-slate-700"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Affiliate URL *</Label>
                  <Input
                    className="mt-1 bg-slate-800 border-slate-700"
                    placeholder="https://..."
                    value={uploadForm.affiliateUrl}
                    onChange={(e) => setUploadForm({ ...uploadForm, affiliateUrl: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Original Price</Label>
                    <Input
                      className="mt-1 bg-slate-800 border-slate-700"
                      type="number"
                      placeholder="৳ 0"
                      value={uploadForm.originalPrice}
                      onChange={(e) => setUploadForm({ ...uploadForm, originalPrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Deal Price</Label>
                    <Input
                      className="mt-1 bg-slate-800 border-slate-700"
                      type="number"
                      placeholder="৳ 0"
                      value={uploadForm.dealPrice}
                      onChange={(e) => setUploadForm({ ...uploadForm, dealPrice: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount</Label>
                    <Input
                      className="mt-1 bg-slate-800 border-slate-700"
                      placeholder="e.g., 20% OFF"
                      value={uploadForm.discount}
                      onChange={(e) => setUploadForm({ ...uploadForm, discount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={uploadForm.category} onValueChange={(v) => setUploadForm({ ...uploadForm, category: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Courses">Courses</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    className="mt-1 bg-slate-800 border-slate-700"
                    placeholder="https://..."
                    value={uploadForm.imageUrl}
                    onChange={(e) => setUploadForm({ ...uploadForm, imageUrl: e.target.value })}
                  />
                </div>
              </>
            )}
            
            {uploadType !== 'deal' && uploadType !== 'notice' && (
              <div>
                <Label>File *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    className="bg-slate-800 border-slate-700"
                    onChange={handleFileUpload}
                  />
                </div>
                {uploadForm.fileUrl && (
                  <p className="text-sm text-emerald-400 mt-1">File uploaded successfully!</p>
                )}
              </div>
            )}
            
            {uploadLoading && (
              <Progress value={uploadProgress} className="h-2" />
            )}
            
            <DialogFooter>
              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600" disabled={uploadLoading}>
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedType === 'book' && selectedItem && 'writerName' in selectedItem && (
              <div>
                <p className="text-slate-400">Author</p>
                <p className="font-medium">{(selectedItem as BookType).writerName}</p>
              </div>
            )}
            {selectedItem?.description && (
              <div>
                <p className="text-slate-400">Description</p>
                <p>{selectedItem.description}</p>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span><Eye className="w-4 h-4 inline mr-1" /> {selectedItem?.viewCount} views</span>
              <span><Download className="w-4 h-4 inline mr-1" /> {selectedItem?.downloadCount} downloads</span>
              <span><Heart className="w-4 h-4 inline mr-1" /> {selectedItem?.likeCount} likes</span>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                onClick={() => { handleDownload(selectedType, selectedItem?.id || ''); setDetailModalOpen(false); }}
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
              <Button
                variant="outline"
                className="border-slate-600"
                onClick={() => { handleLike(selectedType, selectedItem?.id || ''); }}
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="border-slate-600"
                onClick={() => { handleShare(selectedItem as BookType, selectedType); setDetailModalOpen(false); }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-sm bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Share {selectedType === 'book' ? 'Book' : 'Note'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-blue-600 hover:bg-blue-600/10" onClick={() => shareToSocial('facebook')}>
              <Facebook className="w-5 h-5 mr-2 text-blue-500" /> Facebook
            </Button>
            <Button variant="outline" className="border-sky-600 hover:bg-sky-600/10" onClick={() => shareToSocial('twitter')}>
              <Twitter className="w-5 h-5 mr-2 text-sky-500" /> Twitter
            </Button>
            <Button variant="outline" className="border-green-600 hover:bg-green-600/10" onClick={() => shareToSocial('whatsapp')}>
              <Phone className="w-5 h-5 mr-2 text-green-500" /> WhatsApp
            </Button>
            <Button variant="outline" className="border-blue-600 hover:bg-blue-600/10" onClick={() => shareToSocial('linkedin')}>
              <Linkedin className="w-5 h-5 mr-2 text-blue-600" /> LinkedIn
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seed Button (only show if no data) */}
      {books.length === 0 && notes.length === 0 && !isLoading && (
        <div className="fixed bottom-4 right-4">
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={async () => {
              try {
                const res = await fetch('/api/seed', { method: 'POST' })
                const data = await res.json()
                toast.success(data.message)
                if (data.credentials) {
                  toast.info(`Login: ${data.credentials.email} / ${data.credentials.password}`)
                }
                fetchAllData()
              } catch {
                toast.error('Failed to seed database')
              }
            }}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Initialize Data
          </Button>
        </div>
      )}
    </div>
  )
}
