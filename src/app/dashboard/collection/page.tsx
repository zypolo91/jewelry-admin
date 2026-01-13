'use client';

import { useEffect, useMemo, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/table/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart3,
  Calendar,
  Filter,
  Gem,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  JewelryAPI,
  JewelryCategoryAPI,
  PurchaseChannelAPI
} from '@/service/request';

type JewelryItem = {
  id: number;
  name: string;
  coverImage?: string | null;
  categoryId?: number;
  categoryName?: string | null;
  channelId?: number;
  channelName?: string | null;
  purchasePrice: number;
  currentValue?: number | null;
  purchaseDate: string;
  status: string;
  sellerName?: string | null;
  remark?: string | null;
};

type MetaOption = { id: number; name: string };

type StatPayload = {
  overview: {
    totalCount: number;
    collectedCount: number;
    soldCount: number;
    totalInvestment: string;
    totalValue: string;
    profitLoss: string;
    profitRate: string;
  };
  byCategory: Array<{
    categoryId: number;
    name: string;
    count: number;
    value: number;
  }>;
};

const statusOptions = [
  { value: 'collected', label: '收藏中' },
  { value: 'sold', label: '已出库' },
  { value: 'gifted', label: '已赠送' },
  { value: 'lost', label: '已遗失' }
];

const gradeOptions = [
  { value: 'excellent', label: '极品' },
  { value: 'good', label: '精品' },
  { value: 'normal', label: '普通' }
];

const initialForm = {
  name: '',
  categoryId: '',
  channelId: '',
  purchasePrice: '',
  purchaseDate: '',
  status: 'collected',
  sellerName: '',
  currentValue: '',
  qualityGrade: 'unset',
  certificateNo: '',
  images: '',
  certificateImages: '',
  coverImage: '',
  remark: ''
};

export default function CollectionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [categories, setCategories] = useState<MetaOption[]>([]);
  const [channels, setChannels] = useState<MetaOption[]>([]);
  const [stats, setStats] = useState<StatPayload | null>(null);
  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: 'all',
    channelId: 'all',
    status: 'all'
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadMeta = async () => {
    try {
      const [cats, chans] = await Promise.all([
        JewelryCategoryAPI.getList(),
        PurchaseChannelAPI.getList()
      ]);
      setCategories((cats as any)?.data || []);
      setChannels((chans as any)?.data || []);
    } catch (error) {
      console.error(error);
      toast.error('加载基础数据失败');
    }
  };

  const loadStats = async () => {
    try {
      const res = await JewelryAPI.statistics();
      if ((res as any)?.code === 0) {
        setStats((res as any).data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await JewelryAPI.getList({
        keyword: filters.keyword || undefined,
        categoryId:
          filters.categoryId && filters.categoryId !== 'all'
            ? filters.categoryId
            : undefined,
        channelId:
          filters.channelId && filters.channelId !== 'all'
            ? filters.channelId
            : undefined,
        status:
          filters.status && filters.status !== 'all'
            ? filters.status
            : undefined,
        limit: 50
      });
      if ((res as any)?.code === 0) {
        setItems((res as any).data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('加载珠宝列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    loadStats();
  }, []);

  useEffect(() => {
    loadList();
  }, [filters]);

  const handleOpenDialog = (item?: JewelryItem) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name,
        categoryId: item.categoryId?.toString() || '',
        channelId: item.channelId?.toString() || '',
        purchasePrice: item.purchasePrice?.toString() || '',
        purchaseDate: item.purchaseDate?.slice(0, 10) || '',
        status: item.status,
        sellerName: item.sellerName || '',
        currentValue: item.currentValue?.toString() || '',
        qualityGrade: item.qualityGrade ?? 'unset',
        certificateNo: '',
        images: '',
        certificateImages: '',
        coverImage: item.coverImage || '',
        remark: item.remark || ''
      });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.name ||
      !form.categoryId ||
      !form.channelId ||
      !form.purchasePrice
    ) {
      toast.error('请完善必填信息');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        channelId: Number(form.channelId),
        purchasePrice: Number(form.purchasePrice),
        purchaseDate:
          form.purchaseDate || new Date().toISOString().slice(0, 10),
        status: form.status,
        sellerName: form.sellerName || undefined,
        currentValue: form.currentValue ? Number(form.currentValue) : undefined,
        qualityGrade:
          form.qualityGrade && form.qualityGrade !== 'unset'
            ? form.qualityGrade
            : undefined,
        certificateNo: form.certificateNo || undefined,
        images: form.images
          ? form.images
              .split('\n')
              .map((v) => v.trim())
              .filter(Boolean)
          : undefined,
        certificateImages: form.certificateImages
          ? form.certificateImages
              .split('\n')
              .map((v) => v.trim())
              .filter(Boolean)
          : undefined,
        coverImage: form.coverImage || undefined,
        remark: form.remark || undefined
      };

      const res = editingId
        ? await JewelryAPI.update(editingId, payload)
        : await JewelryAPI.create(payload);

      if ((res as any)?.code === 0) {
        toast.success(editingId ? '更新成功' : '创建成功');
        setDialogOpen(false);
        setForm(initialForm);
        loadList();
        loadStats();
      } else {
        toast.error((res as any)?.message || '保存失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await JewelryAPI.delete(id);
      if ((res as any)?.code === 0) {
        toast.success('删除成功');
        loadList();
        loadStats();
      } else {
        toast.error((res as any)?.message || '删除失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('删除失败');
    }
  };

  const handleUploadCover = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await JewelryAPI.upload(formData);
      if ((res as any)?.code === 0) {
        const url = (res as any).data.url;
        setForm((prev) => ({ ...prev, coverImage: url }));
        toast.success('封面上传成功');
      } else {
        toast.error((res as any)?.message || '上传失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const summaryCards = useMemo(() => {
    if (!stats) return null;
    const { overview } = stats;
    return [
      {
        title: '珠宝总数',
        value: overview.totalCount,
        description: '包含所有状态',
        icon: Gem
      },
      {
        title: '收藏中',
        value: overview.collectedCount,
        description: '仍在仓的藏品',
        icon: Sparkles
      },
      {
        title: '累计投入',
        value: `¥${overview.totalInvestment}`,
        description: '购入成本',
        icon: Filter
      },
      {
        title: '当前估值',
        value: `¥${overview.totalValue}`,
        description: `盈亏 ${overview.profitLoss} / ${overview.profitRate}%`,
        icon: BarChart3
      }
    ];
  }, [stats]);

  return (
    <PageContainer scrollable={false}>
      <div className='flex h-[calc(100vh-8rem)] flex-col space-y-6 overflow-y-auto pb-6'>
        <PageHeader
          title='珠宝收藏'
          description='管理你的收藏、估值与渠道'
          action={{
            label: '新增珠宝',
            onClick: () => handleOpenDialog(),
            icon: <Plus className='mr-2 h-4 w-4' />
          }}
        />

        {/* Summary */}
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {summaryCards
            ? summaryCards.map((card, idx) => (
                <Card
                  key={card.title}
                  className='border-border/50 bg-card/80 relative overflow-hidden backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl'
                >
                  <div className='to-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent opacity-75' />
                  <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
                    <div>
                      <CardTitle className='text-muted-foreground text-sm font-semibold tracking-wide'>
                        {card.title}
                      </CardTitle>
                      <p className='text-muted-foreground/70 text-xs'>
                        {card.description}
                      </p>
                    </div>
                    <div className='rounded-full border border-white/20 bg-white/80 p-2 shadow-sm backdrop-blur'>
                      <card.icon className='text-primary h-4 w-4' />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-baseline justify-between gap-2'>
                      <span className='text-foreground text-3xl font-bold tracking-tight'>
                        {card.value}
                      </span>
                      <Badge
                        variant='secondary'
                        className='text-muted-foreground border-transparent bg-white/70 text-xs'
                      >
                        TOP {idx + 1}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            : Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className='h-24 rounded-xl' />
              ))}
        </div>

        {/* Filters */}
        <Card className='border-border/60 bg-card/70 backdrop-blur'>
          <CardHeader className='pb-2'>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-2'>
                <Filter className='text-muted-foreground h-4 w-4' />
                <CardTitle className='text-base'>筛选</CardTitle>
              </div>
              <CardDescription className='text-xs'>
                搜索、分类、渠道、状态筛选收藏
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='grid gap-3 md:grid-cols-5'>
            <div className='col-span-2 flex items-center gap-2 md:col-span-2'>
              <Search className='text-muted-foreground h-4 w-4' />
              <Input
                placeholder='名称 / 备注 关键字'
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keyword: e.target.value }))
                }
              />
            </div>
            <Select
              value={filters.categoryId}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, categoryId: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='按分类' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部分类</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.channelId}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, channelId: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='按渠道' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部渠道</SelectItem>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(val) =>
                setFilters((prev) => ({ ...prev, status: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='按状态' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部状态</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant='ghost'
              className='justify-start'
              onClick={() =>
                setFilters({
                  keyword: '',
                  categoryId: 'all',
                  channelId: 'all',
                  status: 'all'
                })
              }
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              重置
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className='h-64 rounded-2xl' />
              ))
            : items.map((item) => (
                <Card
                  key={item.id}
                  className='group border-border/60 bg-card/70 overflow-hidden backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-xl'
                >
                  <div className='from-muted/60 to-muted relative h-40 w-full bg-gradient-to-br'>
                    {item.coverImage ? (
                      <div
                        className='absolute inset-0 bg-cover bg-center'
                        style={{ backgroundImage: `url(${item.coverImage})` }}
                      />
                    ) : (
                      <div className='text-muted-foreground absolute inset-0 flex items-center justify-center'>
                        <Gem className='h-8 w-8' />
                      </div>
                    )}
                    <div className='absolute top-3 right-3 flex gap-2'>
                      <Badge variant='secondary'>
                        {item.categoryName || '未分类'}
                      </Badge>
                      <Badge variant='outline'>
                        {item.channelName || '渠道'}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <span className='text-lg font-semibold'>
                          {item.name}
                        </span>
                        <Badge
                          variant='outline'
                          className={cn(
                            'rounded-full',
                            item.status === 'sold'
                              ? 'border-amber-500 text-amber-700'
                              : item.status === 'gifted'
                                ? 'border-purple-400 text-purple-600'
                                : item.status === 'lost'
                                  ? 'border-red-400 text-red-600'
                                  : 'border-emerald-400 text-emerald-600'
                          )}
                        >
                          {statusOptions.find((s) => s.value === item.status)
                            ?.label || item.status}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => handleOpenDialog(item)}
                          aria-label='编辑'
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => handleDelete(item.id)}
                          aria-label='删除'
                        >
                          <Trash2 className='text-destructive h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className='flex flex-wrap gap-3 text-xs'>
                      <span className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {item.purchaseDate?.slice(0, 10)}
                      </span>
                      <span>购入 ¥{item.purchasePrice}</span>
                      {item.currentValue !== null &&
                      item.currentValue !== undefined ? (
                        <span>当前 ¥{item.currentValue}</span>
                      ) : null}
                      {item.sellerName ? (
                        <span>来源：{item.sellerName}</span>
                      ) : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='flex items-center justify-between'>
                    <div className='text-muted-foreground line-clamp-2 text-sm'>
                      {item.remark || '暂无备注'}
                    </div>
                    <Badge variant='secondary'>ID #{item.id}</Badge>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑珠宝' : '新增珠宝'}</DialogTitle>
            <DialogDescription>
              完善藏品信息，支持上传封面图。
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>名称</Label>
              <Input
                placeholder='天青蓝松石手串'
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>分类</Label>
              <Select
                value={form.categoryId}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, categoryId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择分类' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>购买渠道</Label>
              <Select
                value={form.channelId}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, channelId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='选择渠道' />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>购买价格 (¥)</Label>
              <Input
                type='number'
                inputMode='decimal'
                placeholder='2800'
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value
                  }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>购买日期</Label>
              <Input
                type='date'
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>当前估值 (¥)</Label>
              <Input
                type='number'
                inputMode='decimal'
                placeholder='3500'
                value={form.currentValue}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currentValue: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>状态</Label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>品质等级</Label>
              <Select
                value={form.qualityGrade}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, qualityGrade: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='可选' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='unset'>未标记</SelectItem>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>商家/来源</Label>
              <Input
                placeholder='XX珠宝直播间'
                value={form.sellerName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sellerName: e.target.value
                  }))
                }
              />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>封面图</Label>
              <div className='flex items-center gap-3'>
                <Input
                  placeholder='https://...'
                  value={form.coverImage}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, coverImage: e.target.value }))
                  }
                />
                <Button
                  variant='outline'
                  size='icon'
                  disabled={uploading}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (event: any) => {
                      const file = event.target.files?.[0];
                      if (file) handleUploadCover(file);
                    };
                    input.click();
                  }}
                >
                  {uploading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Upload className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>图片列表 (每行一条 URL)</Label>
              <Textarea
                rows={3}
                placeholder='https://image-1\nhttps://image-2'
                value={form.images}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, images: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>证书图片 (每行一条 URL)</Label>
              <Textarea
                rows={3}
                placeholder='https://cert-image'
                value={form.certificateImages}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    certificateImages: e.target.value
                  }))
                }
              />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>证书编号</Label>
              <Input
                placeholder='GTC-2024-XXXX'
                value={form.certificateNo}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    certificateNo: e.target.value
                  }))
                }
              />
            </div>
            <div className='space-y-2 md:col-span-2'>
              <Label>备注</Label>
              <Textarea
                rows={3}
                placeholder='质地、纹理、适合穿搭等备注'
                value={form.remark}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, remark: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter className='pt-2'>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
