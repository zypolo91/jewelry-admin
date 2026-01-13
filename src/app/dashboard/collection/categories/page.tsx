'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/table/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ImageUploadField } from '@/components/shared/image-upload-field';
import { Plus, Pencil, Trash2, Sparkles, Layers3 } from 'lucide-react';
import { toast } from 'sonner';
import { JewelryCategoryAPI, UploadAPI } from '@/service/request';

type Category = {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  isSystem?: boolean;
};

const emptyForm = { name: '', icon: '', color: '', sortOrder: '', image: '' };

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await JewelryCategoryAPI.getList();
      if ((res as any)?.code === 0) {
        setList((res as any).data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (item?: Category) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name,
        icon: item.icon || '',
        color: item.color || '',
        sortOrder: item.sortOrder?.toString() || '',
        image: item.icon || ''
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('请输入名称');
      return;
    }
    const payload: any = {
      name: form.name.trim(),
      icon: form.image || form.icon || undefined,
      color: form.color || undefined,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : 0
    };
    try {
      const res = editingId
        ? await JewelryCategoryAPI.update(editingId, payload)
        : await JewelryCategoryAPI.create(payload);
      if ((res as any)?.code === 0) {
        toast.success('保存成功');
        setDialogOpen(false);
        load();
      } else {
        toast.error((res as any)?.message || '保存失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('保存失败');
    }
  };

  const handleDelete = async (id: number, isSystem?: boolean) => {
    if (isSystem) {
      toast.error('系统预设分类不可删除');
      return;
    }
    try {
      const res = await JewelryCategoryAPI.delete(id);
      if ((res as any)?.code === 0) {
        toast.success('删除成功');
        load();
      } else {
        toast.error((res as any)?.message || '删除失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('删除失败');
    }
  };

  const uploadIcon = async (file: File) => {
    const res = await UploadAPI.uploadImage(file, {
      type: 'category',
      folder: 'meta'
    });
    if (res?.code === 0) {
      return res.data.url as string;
    }
    throw new Error(res?.message || '上传失败');
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex h-[calc(100vh-8rem)] flex-col space-y-6 overflow-y-auto pb-6'>
        <PageHeader
          title='分类管理'
          description='为珠宝收藏定义清晰的品类标签'
          action={{
            label: '新增分类',
            onClick: () => handleOpen(),
            icon: <Plus className='mr-2 h-4 w-4' />
          }}
        >
          <div className='text-muted-foreground hidden gap-3 text-sm md:flex'>
            <div className='border-border/60 bg-card flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm'>
              <Sparkles className='text-primary h-4 w-4' />
              <span>上传分类图标，打造识别度</span>
            </div>
            <div className='border-border/60 bg-card flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm'>
              <Layers3 className='text-primary h-4 w-4' />
              <span>颜色标签帮助快速区分</span>
            </div>
          </div>
        </PageHeader>

        {loading ? (
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className='h-32 rounded-xl' />
            ))}
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {list.map((item) => (
              <Card
                key={item.id}
                className='group border-border/50 from-card via-card/95 to-card/80 bg-gradient-to-br backdrop-blur-xl transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl'
              >
                <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
                  <div className='flex items-center gap-3'>
                    <div className='border-border/50 bg-background/60 relative h-12 w-12 overflow-hidden rounded-xl border shadow-inner'>
                      {item.icon ? (
                        <Image
                          src={item.icon}
                          alt={item.name}
                          fill
                          className='object-cover'
                        />
                      ) : (
                        <div className='text-muted-foreground flex h-full w-full items-center justify-center text-xs'>
                          无图
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className='text-lg font-semibold tracking-tight'>
                        {item.name}
                      </CardTitle>
                      <p className='text-muted-foreground text-xs'>
                        排序权重 {item.sortOrder ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {item.isSystem ? (
                      <Badge variant='outline'>系统</Badge>
                    ) : null}
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpen(item)}
                      aria-label='编辑'
                      className='hover:bg-primary/10 hover:text-primary'
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='hover:bg-destructive/10 hover:text-destructive'
                          aria-label='删除'
                          disabled={item.isSystem}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除分类？</AlertDialogTitle>
                          <AlertDialogDescription>
                            {item.isSystem
                              ? '系统预设分类不可删除'
                              : '删除后无法恢复，且关联的珠宝需要重新分类。'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className='cursor-pointer'>
                            取消
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className='bg-destructive hover:bg-destructive/90 cursor-pointer'
                            onClick={() => handleDelete(item.id, item.isSystem)}
                          >
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className='text-muted-foreground text-sm'>
                  <div className='flex flex-wrap items-center gap-3 text-xs'>
                    {item.color ? (
                      <span className='border-border/50 bg-background/50 flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm'>
                        <span
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: item.color }}
                        />
                        <span className='text-foreground font-medium'>
                          {item.color}
                        </span>
                      </span>
                    ) : (
                      <Badge variant='secondary'>无主题色</Badge>
                    )}
                    <Badge variant='outline' className='border-dashed'>
                      ID {item.id}
                    </Badge>
                    <Badge
                      variant='outline'
                      className='border-primary/30 bg-primary/5 text-primary'
                    >
                      {item.isSystem ? '系统预设' : '自定义分类'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='border-border/60 bg-background/95 max-w-3xl overflow-hidden rounded-3xl border p-0 shadow-2xl backdrop-blur-xl'>
          <DialogHeader className='border-border/50 border-b px-8 pt-8 pb-6'>
            <DialogTitle className='text-2xl font-semibold tracking-tight'>
              {editingId ? '编辑分类' : '新增分类'}
            </DialogTitle>
          </DialogHeader>
          <div className='grid gap-8 px-8 pb-8 lg:grid-cols-[1.35fr_1fr]'>
            <div className='space-y-6'>
              <div className='space-y-3'>
                <Label className='text-foreground text-sm font-semibold'>
                  名称
                </Label>
                <Input
                  className='border-border/40 bg-background/80 focus-visible:ring-primary/40 h-11 rounded-2xl text-base shadow-inner focus-visible:ring-2'
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='如：翡翠挂坠'
                />
              </div>

              <div className='border-border/50 bg-card/70 space-y-4 rounded-2xl border p-5 shadow-sm'>
                <div className='flex items-center justify-between gap-3'>
                  <Label className='text-foreground text-sm font-semibold'>
                    主题色
                  </Label>
                  <span className='text-muted-foreground/70 text-xs'>
                    建议与图标主色呼应
                  </span>
                </div>
                <div className='flex flex-wrap gap-3'>
                  <Input
                    placeholder='#CA8A04'
                    value={form.color}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className='border-border/50 bg-background/80 focus-visible:ring-primary/40 h-11 min-w-[140px] flex-1 rounded-xl text-sm uppercase shadow-inner focus-visible:ring-2'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='border-border/60 bg-background/60 text-muted-foreground hover:border-primary/60 hover:text-primary rounded-full border px-4 text-sm font-medium transition-colors'
                    onClick={() =>
                      setForm((prev) => ({ ...prev, color: '#B78A28' }))
                    }
                  >
                    奢华金
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='border-border/60 bg-background/60 text-muted-foreground hover:border-primary/60 hover:text-primary rounded-full border px-4 text-sm font-medium transition-colors'
                    onClick={() =>
                      setForm((prev) => ({ ...prev, color: '#4C1D95' }))
                    }
                  >
                    深夜紫
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='border-border/60 bg-background/60 text-muted-foreground hover:border-primary/60 hover:text-primary rounded-full border px-4 text-sm font-medium transition-colors'
                    onClick={() =>
                      setForm((prev) => ({ ...prev, color: '#0F172A' }))
                    }
                  >
                    极夜蓝
                  </Button>
                </div>
              </div>

              <div className='space-y-3'>
                <Label className='text-foreground text-sm font-semibold'>
                  排序
                </Label>
                <Input
                  type='number'
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sortOrder: e.target.value }))
                  }
                  className='border-border/40 bg-background/80 focus-visible:ring-primary/40 h-11 rounded-2xl shadow-inner focus-visible:ring-2'
                  placeholder='0'
                />
                <p className='text-muted-foreground text-xs'>
                  数值越大越靠前，默认 0。
                </p>
              </div>
            </div>

            <div className='space-y-6'>
              <ImageUploadField
                label='分类图标'
                value={form.image}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, image: value }))
                }
                uploadAction={uploadIcon}
                description='支持上传方形品牌图或符号，推荐 300x300 像素以上'
                placeholder='https://image.cdn/icon.png'
                className='h-full'
              />
            </div>
          </div>
          <DialogFooter className='border-border/50 bg-background/80 border-t px-8 py-6'>
            <Button
              variant='ghost'
              className='border-border/60 bg-background/60 rounded-full border px-6 text-sm font-medium'
              onClick={() => setDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              className='rounded-full px-6 text-sm font-semibold'
              onClick={handleSave}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
