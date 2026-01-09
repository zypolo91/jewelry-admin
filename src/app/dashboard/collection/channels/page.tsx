'use client';

import { useEffect, useState } from 'react';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PurchaseChannelAPI } from '@/service/request';

type Channel = {
  id: number;
  name: string;
  icon?: string | null;
  sortOrder?: number | null;
  remark?: string | null;
  isSystem?: boolean;
};

const emptyForm = { name: '', icon: '', sortOrder: '', remark: '' };

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
        remark: item.remark || ''
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
      icon: form.icon || undefined,
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

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          title='渠道管理'
          description='配置购入渠道，便于统计与筛选'
          action={{
            label: '新增渠道',
            onClick: () => handleOpen(),
            icon: <Plus className='mr-2 h-4 w-4' />
          }}
        />

        {loading ? (
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className='h-32 rounded-xl' />
            ))}
          </div>
        ) : (
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {list.map((item) => (
              <Card
                key={item.id}
                className='border-border/60 bg-card/70 backdrop-blur transition-all duration-150 hover:-translate-y-1 hover:shadow-lg'
              >
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-base font-semibold'>
                    {item.name}
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    {item.isSystem ? (
                      <Badge variant='outline'>系统</Badge>
                    ) : null}
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpen(item)}
                      aria-label='编辑'
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDelete(item.id, item.isSystem)}
                      aria-label='删除'
                    >
                      <Trash2 className='text-destructive h-4 w-4' />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='text-muted-foreground text-sm'>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='secondary'>
                      排序 {item.sortOrder ?? 0}
                    </Badge>
                    {item.icon ? (
                      <Badge variant='outline'>{item.icon}</Badge>
                    ) : null}
                  </div>
                  {item.remark ? (
                    <p className='text-muted-foreground mt-2 line-clamp-2 text-xs'>
                      {item.remark}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑渠道' : '新增渠道'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>名称</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>图标/标识</Label>
              <Input
                placeholder='可选'
                value={form.icon}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, icon: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>排序</Label>
              <Input
                type='number'
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sortOrder: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>备注</Label>
              <Input
                placeholder='可记录商家评价、渠道说明'
                value={form.remark}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, remark: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
