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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Landmark, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PurchaseChannelAPI, UploadAPI } from '@/service/request';

type Channel = {
  id: number;
  name: string;
  icon?: string | null;
  sortOrder?: number | null;
  remark?: string | null;
  isSystem?: boolean;
};

const emptyForm = { name: '', icon: '', sortOrder: '', remark: '', image: '' };

export default function ChannelsPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Channel[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await PurchaseChannelAPI.getList();
      if ((res as any)?.code === 0) {
        setList((res as any).data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('加载渠道失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (item?: Channel) => {
    if (item) {
      setEditingId(item.id);
      setForm({
        name: item.name,
        icon: item.icon || '',
        sortOrder: item.sortOrder?.toString() || '',
        remark: item.remark || '',
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
      sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
      remark: form.remark || undefined
    };
    try {
      const res = editingId
        ? await PurchaseChannelAPI.update(editingId, payload)
        : await PurchaseChannelAPI.create(payload);
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
      toast.error('系统预设渠道不可删除');
      return;
    }
    try {
      const res = await PurchaseChannelAPI.delete(id);
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
      type: 'channel',
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
          title='渠道管理'
          description='记录珠宝来源，完善供应链档案'
          action={{
            label: '新增渠道',
            onClick: () => handleOpen(),
            icon: <Plus className='mr-2 h-4 w-4' />
          }}
        >
          <div className='text-muted-foreground hidden gap-3 text-sm md:flex'>
            <div className='border-border/60 bg-card flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm'>
              <Landmark className='text-primary h-4 w-4' />
              <span>上传渠道 LOGO，方便识别品牌</span>
            </div>
            <div className='border-border/60 bg-card flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm'>
              <ShieldCheck className='text-primary h-4 w-4' />
              <span>备注渠道信誉与合作细节</span>
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
                          <AlertDialogTitle>确认删除渠道？</AlertDialogTitle>
                          <AlertDialogDescription>
                            {item.isSystem
                              ? '系统预设渠道不可删除'
                              : '删除后无法恢复，且关联的珠宝需要重新选择渠道。'}
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
                    <Badge variant='secondary'>
                      排序 {item.sortOrder ?? 0}
                    </Badge>
                    <Badge variant='outline' className='border-dashed'>
                      ID {item.id}
                    </Badge>
                    <Badge
                      variant='outline'
                      className='border-primary/30 bg-primary/5 text-primary'
                    >
                      {item.isSystem ? '系统渠道' : '自定义渠道'}
                    </Badge>
                  </div>
                  {item.remark ? (
                    <p className='text-muted-foreground mt-3 line-clamp-3 text-sm leading-relaxed'>
                      {item.remark}
                    </p>
                  ) : (
                    <p className='text-muted-foreground/60 mt-3 text-xs'>
                      暂无备注信息
                    </p>
                  )}
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
              {editingId ? '编辑渠道' : '新增渠道'}
            </DialogTitle>
          </DialogHeader>
          <div className='grid gap-8 px-8 pb-8 lg:grid-cols-[1.35fr_1fr]'>
            <div className='space-y-6'>
              <div className='space-y-3'>
                <Label className='text-foreground text-sm font-semibold'>
                  名称
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder='如：周大福官方旗舰店'
                  className='border-border/40 bg-background/80 focus-visible:ring-primary/40 h-11 rounded-2xl text-base shadow-inner focus-visible:ring-2'
                />
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

              <div className='space-y-3'>
                <Label className='text-foreground text-sm font-semibold'>
                  备注
                </Label>
                <Textarea
                  placeholder='可记录商家评价、渠道说明、沟通记录等'
                  value={form.remark}
                  rows={6}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, remark: e.target.value }))
                  }
                  className='border-border/40 bg-background/80 focus-visible:ring-primary/40 rounded-2xl shadow-inner focus-visible:ring-2'
                />
                <p className='text-muted-foreground text-xs'>
                  备注将显示在卡片上，帮助快速了解渠道特点。
                </p>
              </div>
            </div>

            <div className='space-y-6'>
              <ImageUploadField
                label='渠道标识'
                value={form.image}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, image: value }))
                }
                uploadAction={uploadIcon}
                description='上传渠道 LOGO 或凭证图，推荐 300x300 像素以上'
                placeholder='https://image.cdn/logo.png'
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
