import { getOrRefreshToken, invalidateToken } from './token-manager.js';
import { FileMetadata } from './types.js';
import { resolveImageUrl } from './patch-engine.js';

async function makeRestRequest(method: string, url: string, body?: any, retried = false): Promise<any> {
  const token = await getOrRefreshToken();
  const options: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  if (body !== undefined) {
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (response.status === 401 && !retried) {
    console.log('Token unauthorized (401). Invalidating and retrying...');
    invalidateToken();
    return makeRestRequest(method, url, body, true);
  }

  const text = await response.text();

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Google API request failed (${response.status}): ${text}`);
  }

  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { text };
  }
}

export async function docsApiGetDocument(documentId: string, includeTabsContent = true): Promise<any> {
  const query = includeTabsContent ? '?includeTabsContent=true' : '';
  const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}${query}`;
  return makeRestRequest('GET', url);
}

export async function docsApiBatchUpdate(documentId: string, requests: any[]): Promise<any> {
  const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`;
  return makeRestRequest('POST', url, { requests });
}

export async function getFiles(limit = 10): Promise<FileMetadata[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q=mimeType%20%3D%20%27application%2Fvnd.google-apps.document%27%20and%20trashed%20%3D%20false&orderBy=modifiedTime%20desc&pageSize=${limit}&fields=files(id%2Cname%2CwebViewLink%2CmodifiedTime)`;
  const data = await makeRestRequest('GET', url);
  return (data.files || []).map((f: any) => {
    const updated = new Date(f.modifiedTime);
    return {
      id: f.id,
      name: f.name,
      url: f.webViewLink,
      lastUpdatedMs: updated.getTime(),
      lastUpdatedIso: f.modifiedTime
    };
  });
}

export async function searchFiles(queryStr: string, limit = 10): Promise<FileMetadata[]> {
  const escaped = queryStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const q = `name contains "${escaped}" and trashed = false and mimeType = 'application/vnd.google-apps.document'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${limit}&fields=files(id%2Cname%2CwebViewLink%2CmodifiedTime)`;
  const data = await makeRestRequest('GET', url);
  return (data.files || []).map((f: any) => {
    const updated = new Date(f.modifiedTime);
    return {
      id: f.id,
      name: f.name,
      url: f.webViewLink,
      lastUpdatedMs: updated.getTime(),
      lastUpdatedIso: f.modifiedTime
    };
  });
}

export async function renameDoc(id: string, title: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${id}`;
  const data = await makeRestRequest('PATCH', url, { name: title });
  const updated = new Date(data.modifiedTime || Date.now());
  return {
    id: id,
    title: data.name || title,
    url: `https://docs.google.com/document/d/${id}/edit`,
    lastEditedMs: updated.getTime(),
    lastEditedIso: data.modifiedTime || new Date().toISOString()
  };
}

export async function makeCopy(id: string, title?: string): Promise<any> {
  const name = title ? title.trim() : undefined;
  const url = `https://www.googleapis.com/drive/v3/files/${id}/copy`;
  const data = await makeRestRequest('POST', url, name ? { name } : {});
  const updated = new Date(data.modifiedTime || Date.now());
  return {
    id: data.id,
    title: data.name,
    url: `https://docs.google.com/document/d/${data.id}/edit`,
    lastEditedMs: updated.getTime(),
    lastEditedIso: data.modifiedTime || new Date().toISOString()
  };
}

export async function getFileMetadata(id: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${id}?fields=id%2Cname%2CwebViewLink%2CmodifiedTime`;
  return makeRestRequest('GET', url);
}

export async function newDoc(title: string): Promise<any> {
  const url = 'https://docs.googleapis.com/v1/documents';
  const docData = await makeRestRequest('POST', url, { title });
  
  // Retrieve additional metadata
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${docData.documentId}?fields=id%2Cname%2CwebViewLink%2CmodifiedTime`;
  const driveData = await makeRestRequest('GET', driveUrl);
  const updated = new Date(driveData.modifiedTime || Date.now());
  
  return {
    id: docData.documentId,
    title: driveData.name || title,
    url: driveData.webViewLink || `https://docs.google.com/document/d/${docData.documentId}/edit`,
    lastEditedMs: updated.getTime(),
    lastEditedIso: driveData.modifiedTime || new Date().toISOString()
  };
}

export async function uploadTemporaryImage(imgUrl: string): Promise<string> {
  const token = await getOrRefreshToken();
  const imgResp = await fetch(imgUrl);
  if (imgResp.status !== 200) {
    throw new Error(`Failed to download image from ${imgUrl}`);
  }
  const blob = await imgResp.blob();
  
  // Construct multipart upload
  const metadata = {
    name: `tmp_mcp_image_${Date.now()}`,
    mimeType: blob.type || 'image/png'
  };
  
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);
  
  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const uploadResp = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  
  if (uploadResp.status < 200 || uploadResp.status >= 300) {
    const text = await uploadResp.text();
    throw new Error(`Failed to upload temporary image to Drive: ${text}`);
  }
  
  const fileData = await uploadResp.json() as any;
  const fileId = fileData.id;
  
  // Set sharing permissions so it can be accessed by the Docs service to embed it
  const permUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
  const permResp = await fetch(permUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });
  
  if (permResp.status < 200 || permResp.status >= 300) {
    const text = await permResp.text();
    // try deleting before throwing
    try { await deleteDriveFile(fileId); } catch (_) {}
    throw new Error(`Failed to set public permissions on temporary image: ${text}`);
  }
  
  return fileId;
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getOrRefreshToken();
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function applyDocOpsToDocument(
  documentId: string,
  tabContext: any,
  docOps: any[]
): Promise<number> {
  // Sort descending (Right-to-Left)
  docOps.sort((a, b) => {
    const idxA = a.type === 'delete' ? a.startIndex : a.index;
    const idxB = b.type === 'delete' ? b.startIndex : b.index;
    if (idxB !== idxA) {
      return idxB - idxA;
    }
    if (a.type !== b.type) {
      return a.type === 'delete' ? -1 : 1;
    }
    return 0;
  });

  const requests: any[] = [];
  const tempFileIds: string[] = [];

  try {
    for (let i = 0; i < docOps.length; i++) {
      const op = docOps[i];
      if (op.type === 'delete') {
        const range: any = { startIndex: op.startIndex, endIndex: op.endIndex };
        if (tabContext.tabId) range.tabId = tabContext.tabId;
        requests.push({ deleteContentRange: { range } });
      } else if (op.type === 'insert_text') {
        const location: any = { index: op.index };
        if (tabContext.tabId) location.tabId = tabContext.tabId;
        requests.push({ insertText: { location, text: op.text } });
      } else if (op.type === 'insert_image') {
        let url = '';
        if (op.src) {
          url = op.src;
        } else {
          url = resolveImageUrl({ id: op.objectId }, tabContext.inlineObjects);
        }

        if (url) {
          // If it is googleusercontent, upload to temp public Drive file
          if (/googleusercontent\.com/i.test(url)) {
            try {
              const fileId = await uploadTemporaryImage(url);
              tempFileIds.push(fileId);
              url = `https://drive.google.com/uc?export=download&id=${fileId}`;
            } catch (err) {
              console.error('Failed to resolve image to public Drive url:', err);
              url = '';
            }
          }
          
          if (url) {
            const location: any = { index: op.index };
            if (tabContext.tabId) location.tabId = tabContext.tabId;
            requests.push({
              insertInlineImage: {
                location,
                uri: url
              }
            });
          }
        }
      }
    }

    if (requests.length > 0) {
      await docsApiBatchUpdate(documentId, requests);
    }

    return requests.length;
  } finally {
    for (const fileId of tempFileIds) {
      try {
        await deleteDriveFile(fileId);
      } catch (err) {
        console.error(`Failed to clean up temporary file ${fileId}:`, err);
      }
    }
  }
}
