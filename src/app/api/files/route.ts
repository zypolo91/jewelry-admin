import { NextRequest } from 'next/server';
import {
  errorResponse,
  forbiddenResponse,
  successResponse,
  unauthorizedResponse
} from '@/service/response';
import { getUserFromRequest, hasPermission } from '@/lib/server-permissions';
import {
  applyStoragePrefix,
  buildObjectPath,
  fromStorageKey,
  getSupabaseAdmin,
  getSupabaseStorageBucket,
  normalizeStoragePath
} from '@/lib/supabase';

export const runtime = 'nodejs';

const PERM_READ = 'system.file.read';
const PERM_UPLOAD = 'system.file.upload';
const PERM_DELETE = 'system.file.delete';

function isFolderItem(item: any): boolean {
  return item?.id == null && item?.metadata == null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest();
    if (!userId) return unauthorizedResponse('未授权');

    const canRead = await hasPermission(PERM_READ, userId);
    if (!canRead) return forbiddenResponse('权限不足');

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 获取签名 URL
    if (action === 'signedUrl') {
      const rawPath = searchParams.get('path') || '';
      const path = normalizeStoragePath(rawPath);
      const expiresIn = Math.min(
        Math.max(Number(searchParams.get('expiresIn')) || 3600, 60),
        60 * 60 * 24
      );

      const supabase = getSupabaseAdmin();
      const bucket = getSupabaseStorageBucket();

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(applyStoragePrefix(path), expiresIn);

      if (error) return errorResponse(error.message);
      return successResponse({ url: data?.signedUrl, expiresIn });
    }

    // 列表
    const rawDir = searchParams.get('path') || '';
    const dir = rawDir ? normalizeStoragePath(rawDir) : '';
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 1000);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseStorageBucket();

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(applyStoragePrefix(dir), {
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) return errorResponse(error.message);

    const items = (data || [])
      .filter((item: any) => item?.name !== '.keep')
      .map((item: any) => ({
        name: fromStorageKey(item.name),
        path: buildObjectPath(dir, fromStorageKey(item.name)),
        isFolder: isFolderItem(item),
        size: item?.metadata?.size ?? null,
        mimeType: item?.metadata?.mimetype ?? null,
        updatedAt: item?.updated_at ?? null,
        createdAt: item?.created_at ?? null,
        lastAccessedAt: item?.last_accessed_at ?? null
      }));

    return successResponse({
      path: dir,
      items
    });
  } catch (error) {
    console.error('Files GET failed:', error);
    return errorResponse('获取文件列表失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest();
    if (!userId) return unauthorizedResponse('未授权');

    const canUpload = await hasPermission(PERM_UPLOAD, userId);
    if (!canUpload) return forbiddenResponse('权限不足');

    const formData = await request.formData();
    const rawDir = String(formData.get('path') || '');
    const dir = rawDir ? normalizeStoragePath(rawDir) : '';
    const upsert =
      String(formData.get('upsert') || '0') === '1' ||
      String(formData.get('upsert') || 'false') === 'true';

    const files = formData.getAll('files');
    if (!files.length) return errorResponse('请上传文件');

    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseStorageBucket();

    const results = [];

    for (const f of files) {
      if (!(f instanceof File)) continue;
      const arrayBuffer = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const objectPath = buildObjectPath(dir, f.name);
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(applyStoragePrefix(objectPath), buffer, {
          contentType: f.type || 'application/octet-stream',
          upsert
        });

      if (error) return errorResponse(error.message);
      results.push({ path: objectPath, key: data?.path });
    }

    return successResponse({ uploaded: results });
  } catch (error) {
    console.error('Files POST failed:', error);
    return errorResponse('上传失败');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromRequest();
    if (!userId) return unauthorizedResponse('未授权');

    const canDelete = await hasPermission(PERM_DELETE, userId);
    if (!canDelete) return forbiddenResponse('权限不足');

    const body = await request.json().catch(() => ({}));
    const rawPaths: unknown = body?.paths ?? body?.path;

    const paths = Array.isArray(rawPaths)
      ? rawPaths.map(String)
      : rawPaths
        ? [String(rawPaths)]
        : [];

    if (!paths.length) return errorResponse('缺少 path');

    const safePaths = paths.map((p) => normalizeStoragePath(p));

    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseStorageBucket();

    const { error } = await supabase.storage
      .from(bucket)
      .remove(safePaths.map(applyStoragePrefix));

    if (error) return errorResponse(error.message);

    return successResponse({ deleted: safePaths });
  } catch (error) {
    console.error('Files DELETE failed:', error);
    return errorResponse('删除失败');
  }
}
