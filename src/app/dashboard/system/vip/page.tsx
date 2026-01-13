'use client';

import React, { useEffect, useState, useCallback } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Crown, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface VipLevel {
  id: number;
  name: string;
  level: number;
  price: string;
  duration: number;
  maxJewelries: number;
  maxCategories: number;
  maxChannels: number;
  features: string[];
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface VipFormData {
  name: string;
  level: number;
  price: string;
  duration: number;
  maxJewelries: number;
  maxCategories: number;
  maxChannels: number;
  features: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultFormData: VipFormData = {
  name: '',
  level: 1,
  price: '0',
  duration: 30,
  maxJewelries: 100,
  maxCategories: 20,
  maxChannels: 20,
  features: '',
  icon: '',
  color: '#D4AF37',
  sortOrder: 0,
  isActive: true
};

export default function VipManagementPage() {
  const [vipLevels, setVipLevels] = useState<VipLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingVip, setEditingVip] = useState<VipLevel | null>(null);
  const [deletingVip, setDeletingVip] = useState<VipLevel | null>(null);
  const [formData, setFormData] = useState<VipFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchVipLevels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vip/levels');
      const data = await res.json();
      if (data.code === 0) {
        setVipLevels(data.data || []);
      }
    } catch (error) {
      toast.error('获取VIP等级列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVipLevels();
  }, [fetchVipLevels]);

  const handleOpenCreate = () => {
    setEditingVip(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (vip: VipLevel) => {
    setEditingVip(vip);
    setFormData({
      name: vip.name,
      level: vip.level,
      price: vip.price,
      duration: vip.duration,
      maxJewelries: vip.maxJewelries,
      maxCategories: vip.maxCategories,
      maxChannels: vip.maxChannels,
      features: vip.features?.join('\n') || '',
      icon: vip.icon || '',
      color: vip.color || '#D4AF37',
      sortOrder: vip.sortOrder,
      isActive: vip.isActive
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (vip: VipLevel) => {
    setDeletingVip(vip);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入VIP等级名称');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        features: formData.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean)
      };

      const url = editingVip
        ? `/api/vip/levels/${editingVip.id}`
        : '/api/vip/levels';
      const method = editingVip ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.code === 0) {
        toast.success(editingVip ? 'VIP等级更新成功' : 'VIP等级创建成功');
        setDialogOpen(false);
        fetchVipLevels();
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVip) return;

    try {
      const res = await fetch(`/api/vip/levels/${deletingVip.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.code === 0) {
        toast.success('VIP等级删除成功');
        setDeleteDialogOpen(false);
        fetchVipLevels();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <PageContainer scrollable={false}>
      <div className='flex h-[calc(100vh-8rem)] w-full flex-col space-y-4'>
        {/* 页面头部 */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100'>
              <Crown className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <h1 className='text-xl font-semibold'>VIP等级管理</h1>
              <p className='text-muted-foreground text-sm'>
                管理VIP会员等级和权益配置
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className='mr-2 h-4 w-4' />
            新增VIP等级
          </Button>
        </div>

        {/* 数据表格 */}
        <Card className='flex-1'>
          <CardHeader>
            <CardTitle className='text-base'>VIP等级列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[80px]'>等级</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>珠宝上限</TableHead>
                  <TableHead>分类上限</TableHead>
                  <TableHead>渠道上限</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className='w-[120px]'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className='py-8 text-center'>
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : vipLevels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className='py-8 text-center'>
                      <div className='flex flex-col items-center gap-2'>
                        <Crown className='text-muted-foreground h-8 w-8' />
                        <p className='text-muted-foreground'>暂无VIP等级</p>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleOpenCreate}
                        >
                          <Plus className='mr-2 h-4 w-4' />
                          添加VIP等级
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  vipLevels.map((vip) => (
                    <TableRow key={vip.id}>
                      <TableCell>
                        <Badge
                          variant='outline'
                          style={{
                            borderColor: vip.color || '#D4AF37',
                            color: vip.color || '#D4AF37'
                          }}
                        >
                          Lv.{vip.level}
                        </Badge>
                      </TableCell>
                      <TableCell className='font-medium'>{vip.name}</TableCell>
                      <TableCell>¥{vip.price}</TableCell>
                      <TableCell>{vip.duration}天</TableCell>
                      <TableCell>{vip.maxJewelries}</TableCell>
                      <TableCell>{vip.maxCategories}</TableCell>
                      <TableCell>{vip.maxChannels}</TableCell>
                      <TableCell>
                        {vip.isActive ? (
                          <Badge className='bg-green-100 text-green-700'>
                            <Check className='mr-1 h-3 w-3' />
                            启用
                          </Badge>
                        ) : (
                          <Badge variant='secondary'>
                            <X className='mr-1 h-3 w-3' />
                            禁用
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenEdit(vip)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleOpenDelete(vip)}
                          >
                            <Trash2 className='h-4 w-4 text-red-500' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 创建/编辑对话框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>
                {editingVip ? '编辑VIP等级' : '新增VIP等级'}
              </DialogTitle>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>等级名称 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder='如：黄金会员'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>等级数值</Label>
                  <Input
                    type='number'
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: parseInt(e.target.value) || 0
                      })
                    }
                    placeholder='1'
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>价格（元）</Label>
                  <Input
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder='0'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>有效期（天）</Label>
                  <Input
                    type='number'
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 30
                      })
                    }
                    placeholder='30'
                  />
                </div>
              </div>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label>珠宝上限</Label>
                  <Input
                    type='number'
                    value={formData.maxJewelries}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxJewelries: parseInt(e.target.value) || 50
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>分类上限</Label>
                  <Input
                    type='number'
                    value={formData.maxCategories}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxCategories: parseInt(e.target.value) || 10
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>渠道上限</Label>
                  <Input
                    type='number'
                    value={formData.maxChannels}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxChannels: parseInt(e.target.value) || 10
                      })
                    }
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>主题颜色</Label>
                  <div className='flex gap-2'>
                    <Input
                      type='color'
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className='h-10 w-12 p-1'
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder='#D4AF37'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>排序</Label>
                  <Input
                    type='number'
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: parseInt(e.target.value) || 0
                      })
                    }
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>VIP特权（每行一个）</Label>
                <Textarea
                  value={formData.features}
                  onChange={(e) =>
                    setFormData({ ...formData, features: e.target.value })
                  }
                  placeholder='无限珠宝收藏&#10;高级数据统计&#10;专属客服支持'
                  rows={4}
                />
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label>启用此VIP等级</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除VIP等级「{deletingVip?.name}」吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className='bg-red-500 hover:bg-red-600'
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageContainer>
  );
}
