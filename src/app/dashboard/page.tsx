'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { FloatingNav } from '@/components/FloatingNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Copy,
  NotebookText,
  Clock,
  BadgeCheck,
  ArrowUpDown,
} from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

type SortField = 'title' | 'status' | 'created_at' | 'updated_at';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogCounts, setBlogCounts] = useState({ all: 0, drafts: 0, published: 0 });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 10;
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * blogsPerPage,
    currentPage * blogsPerPage
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter and sort blogs
  useEffect(() => {
    let result = [...blogs];
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(blog => blog.status === statusFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'updated_at') {
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredBlogs(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [blogs, statusFilter, sortField, sortOrder]);

  const fetchData = async () => {
    try {
      // Fetch blogs
      const blogsData = await db.get<Blog>('blogs', {
        select: 'id, title, excerpt, status, created_at, updated_at',
        filters: { user_id: user!.id },
        order: 'updated_at:desc',
      });
      
      if (blogsData) {
        setBlogs(blogsData);
        setBlogCounts({
          all: blogsData.length,
          drafts: blogsData.filter((b) => b.status === 'draft').length,
          published: blogsData.filter((b) => b.status === 'published').length,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredBlogs.map(b => b.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (blog: Blog) => {
    try {
      await db.delete('blogs', blog.id);
      
      setBlogs(blogs.filter(b => b.id !== blog.id));
      setBlogCounts(prev => ({
        all: prev.all - 1,
        drafts: blog.status === 'draft' ? prev.drafts - 1 : prev.drafts,
        published: blog.status === 'published' ? prev.published - 1 : prev.published,
      }));
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Delete each blog individually via proxy
      const deletePromises = Array.from(selectedIds).map(id => 
        db.delete('blogs', id)
      );
      await Promise.all(deletePromises);
      
      const deletedBlogs = blogs.filter(b => selectedIds.has(b.id));
      const deletedDrafts = deletedBlogs.filter(b => b.status === 'draft').length;
      const deletedPublished = deletedBlogs.filter(b => b.status === 'published').length;
      
      setBlogs(blogs.filter(b => !selectedIds.has(b.id)));
      setBlogCounts(prev => ({
        all: prev.all - selectedIds.size,
        drafts: prev.drafts - deletedDrafts,
        published: prev.published - deletedPublished,
      }));
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting blogs:', error);
    }
  };

  const handleStatusChange = async (blog: Blog, newStatus: 'draft' | 'published') => {
    try {
      await db.update('blogs', blog.id, { status: newStatus, updated_at: new Date().toISOString() });
      
      setBlogs(blogs.map(b => 
        b.id === blog.id ? { ...b, status: newStatus, updated_at: new Date().toISOString() } : b
      ));
      
      // Update counts
      if (blog.status !== newStatus) {
        setBlogCounts(prev => ({
          all: prev.all,
          drafts: newStatus === 'draft' ? prev.drafts + 1 : prev.drafts - 1,
          published: newStatus === 'published' ? prev.published + 1 : prev.published - 1,
        }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDuplicate = async (blog: Blog) => {
    try {
      // Fetch full blog content
      interface FullBlog {
        id: string;
        created_at: string;
        updated_at: string;
        slug: string;
        title: string;
        [key: string]: unknown;
      }
      
      const fullBlogData = await db.get<FullBlog>('blogs', {
        select: '*',
        filters: { id: blog.id },
      });
      
      if (!fullBlogData || fullBlogData.length === 0) throw new Error('Blog not found');
      
      const fullBlog = fullBlogData[0];
      
      // Only copy fields that exist - exclude id, created_at, updated_at, slug
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, created_at: _createdAt, updated_at: _updatedAt, slug: _slug, ...blogData } = fullBlog;
      
      // Generate new slug from title
      const newTitle = `${fullBlog.title} (Copy)`;
      const newSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();
      
      await db.insert('blogs', {
        ...blogData,
        user_id: user!.id,
        title: newTitle,
        slug: newSlug,
        status: 'draft',
      });
      
      fetchData(); // Refresh the list
    } catch (error: unknown) {
      const supabaseError = error as { message?: string; code?: string; details?: string };
      console.error('Error duplicating blog:', supabaseError.message || supabaseError.code || error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
            <Button onClick={() => router.push('/blog/new')} size="sm" className="bg-[#8345dd] hover:bg-[#7b77e0]">
              New Blog
            </Button>
          </div>
          <p className="text-sm text-slate-500">Welcome back! Manage your blogs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className="bg-white rounded-xl p-4 sm:p-5 transition-all hover:bg-slate-50/50"
            style={{ border: statusFilter === 'all' ? '1px solid rgba(145, 141, 246, 0.5)' : '0.5px solid rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#8345dd]/10 flex items-center justify-center">
                  <NotebookText className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#8345dd]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-600">All Blogs</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-slate-900">{blogCounts.all}</p>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className="bg-white rounded-xl p-4 sm:p-5 transition-all hover:bg-slate-50/50"
            style={{ border: statusFilter === 'draft' ? '1px solid rgba(145, 141, 246, 0.5)' : '0.5px solid rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-600">Drafts</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-slate-900">{blogCounts.drafts}</p>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className="bg-white rounded-xl p-4 sm:p-5 transition-all hover:bg-slate-50/50"
            style={{ border: statusFilter === 'published' ? '1px solid rgba(145, 141, 246, 0.5)' : '0.5px solid rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-green-500" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-600">Published</span>
              </div>
              <p className="text-3xl font-semibold text-slate-900">{blogCounts.published}</p>
            </div>
          </button>
        </div>

        {/* Table */}
        <div 
          className="bg-white rounded-xl overflow-hidden"
          style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
        >
          {filteredBlogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <NotebookText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">
                {statusFilter !== 'all' ? 'No blogs found' : 'No blogs yet'}
              </h3>
              <p className="text-xs text-muted-foreground mb-4 text-center max-w-70">
                {statusFilter !== 'all' 
                  ? `No ${statusFilter} blogs found.`
                  : 'Create your first blog to get started with AI-powered content generation.'
                }
              </p>
              {statusFilter !== 'all' ? (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                  View All Blogs
                </Button>
              ) : (
                <Button size="sm" onClick={() => router.push('/blog/new')}>
                  Create Blog
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-160">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selectedIds.size === filteredBlogs.length && filteredBlogs.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <button 
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Title
                        {sortField === 'title' && (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[15%]">
                      <button 
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Status
                        {sortField === 'status' && (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[15%] hidden sm:table-cell">
                      <button 
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Created
                        {sortField === 'created_at' && (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[15%] hidden md:table-cell">
                      <button 
                        onClick={() => handleSort('updated_at')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Updated
                        {sortField === 'updated_at' && (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-12.5"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBlogs.map((blog) => (
                    <TableRow 
                      key={blog.id} 
                      className="cursor-pointer"
                      onClick={() => router.push(`/blog/editor/${blog.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(blog.id)}
                          onCheckedChange={(checked) => handleSelectOne(blog.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{blog.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{blog.excerpt}</p>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="focus:outline-none">
                              <Badge 
                                variant={blog.status === 'published' ? 'default' : 'secondary'}
                                className={`cursor-pointer ${blog.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                              >
                                {blog.status === 'published' ? (
                                  <BadgeCheck className="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock className="w-3 h-3 mr-1" />
                                )}
                                <span className="hidden xs:inline">{blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}</span>
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(blog, 'draft')}
                              className={blog.status === 'draft' ? 'bg-accent' : ''}
                            >
                              <Clock className="w-3.5 h-3.5 mr-2" />
                              Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(blog, 'published')}
                              className={blog.status === 'published' ? 'bg-accent' : ''}
                            >
                              <BadgeCheck className="w-3.5 h-3.5 mr-2" />
                              Published
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                        {formatDate(blog.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                        {formatDate(blog.updated_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/blog/editor/${blog.id}`)}>
                              <Pencil className="w-3.5 h-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/blog/editor/${blog.id}`)}>
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(blog)}>
                              <Copy className="w-3.5 h-3.5 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setBlogToDelete(blog);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredBlogs.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </Button>
              )}
            </div>
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and pages around current
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => (
                      <PaginationItem key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Blog</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{blogToDelete?.title}&rdquo;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => blogToDelete && handleDelete(blogToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {selectedIds.size} Blogs</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedIds.size} selected blogs? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
