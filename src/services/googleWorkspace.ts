/**
 * Google Workspace client-side API integrations
 * Follows least privilege and mandatory confirmation guidelines
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface ChatSpace {
  name: string;
  displayName: string;
  type: string;
  spaceThreadingState?: string;
}

export interface ChatMessage {
  name: string;
  text: string;
  createTime: string;
  sender?: {
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
}

// -------------------------------------------------------------
// Google Drive API
// -------------------------------------------------------------
export async function listDriveFiles(accessToken: string): Promise<DriveFile[]> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=15&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)&orderBy=modifiedTime desc',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Drive list error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Failed to list drive files:', err);
    throw err;
  }
}

export async function uploadDriveFile(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<DriveFile> {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: mimeType }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    throw new Error(`Drive upload failed: ${res.statusText}`);
  }

  return await res.json();
}

// -------------------------------------------------------------
// Google Chat API
// -------------------------------------------------------------
export async function listChatSpaces(accessToken: string): Promise<ChatSpace[]> {
  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=20', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Chat spaces error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.spaces || [];
  } catch (err) {
    console.error('Failed to list Google Chat spaces:', err);
    throw err;
  }
}

export async function listSpaceMessages(
  accessToken: string,
  spaceName: string
): Promise<ChatMessage[]> {
  try {
    const res = await fetch(
      `https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Messages fetch error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error('Failed to fetch messages for space:', err);
    throw err;
  }
}

export async function sendGoogleChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<ChatMessage> {
  const res = await fetch(
    `https://chat.googleapis.com/v1/${spaceName}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to send message: ${res.statusText}`);
  }
  return await res.json();
}

// -------------------------------------------------------------
// Gmail API
// -------------------------------------------------------------
export async function sendGmail(
  accessToken: string,
  options: {
    to: string;
    subject: string;
    body: string;
  }
): Promise<{ id: string }> {
  // Construct RFC 2822 email
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`;
  const messageParts = [
    `To: ${options.to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    options.body,
  ];
  const message = messageParts.join('\r\n');

  // Base64url encode
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.statusText}`);
  }

  return await res.json();
}

export async function listRecentEmails(
  accessToken: string
): Promise<GmailMessageItem[]> {
  try {
    const res = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Gmail list failed: ${res.statusText}`);
    }
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.error('Failed to list emails:', err);
    throw err;
  }
}
