import { Client } from '@notionhq/client';

export interface NotionTokenResponse {
  access_token: string;
  bot_id: string;
  duplicated_template_id: string | null;
  owner?: any;
  workspace_icon: string | null;
  workspace_id: string;
  workspace_name: string | null;
}

/**
 * Generate Notion OAuth authorization URL
 */
export function getNotionAuthUrl(): string {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_NOTION_CALLBACK_URL;
  
  if (!clientId || !redirectUri) {
    throw new Error('Notion OAuth credentials are missing in environment variables');
  }

  // Notion OAuth URL format
  return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Exchange the authorization code for an access token
 */
export async function getNotionTokensFromCode(code: string): Promise<NotionTokenResponse> {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_NOTION_CALLBACK_URL;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Notion OAuth credentials are missing');
  }

  // Notion requires Basic Auth header with base64 encoded client_id:client_secret
  const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encodedCredentials}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Notion Token Error:', errorData);
    throw new Error(`Failed to get Notion token: ${errorData.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Get all databases the user has shared with our Notion integration
 */
export async function getUserNotionDatabases(accessToken: string) {
  const notion = new Client({ auth: accessToken });

  try {
    const response = await notion.search({
      filter: {
        value: 'database',
        property: 'object'
      },
    });

    return response.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || 'Untitled Database',
      url: db.url
    }));
  } catch (error) {
    console.error('Error fetching Notion databases:', error);
    throw new Error('Failed to fetch Notion databases');
  }
}

/**
 * Create a new task/page in a specific Notion database
 */
export async function createNotionTask(
  accessToken: string,
  databaseId: string,
  taskData: {
    title: string;
    description?: string;
    due_date?: string;
    task_type?: string;
  }
) {
  const notion = new Client({ auth: accessToken });

  try {
    // Construct the properties object for the new Notion page
    // Note: This assumes the database has standard columns like "Name" (title), "Status", and "Date"
    // In a real word app, you might need to map these dynamically based on the user's DB schema
    
    const properties: any = {
      // The default title property is usually called "Name" or "Title"
      "Name": {
        title: [
          {
            text: {
              content: taskData.title,
            },
          },
        ],
      },
    };

    // Add Date property if due_date is provided
    // Assumes there is a Date property named "Date" or "Due"
    if (taskData.due_date) {
      properties["Date"] = {
        date: {
          start: taskData.due_date,
        }
      };
    }

    // Add Tags/Type if provided
    if (taskData.task_type) {
        properties["Tags"] = {
            multi_select: [
                { name: taskData.task_type }
            ]
        }
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties,
      // Create block content for the description if it exists
      children: taskData.description ? [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: taskData.description,
                },
              },
            ],
          },
        },
      ] : [],
    });

    return {
        success: true,
        pageId: response.id,
        url: (response as any).url,
    };
  } catch (error: any) {
    console.error('Error creating Notion page:', error.body || error);
    return {
      success: false,
      error: error.message || 'Failed to create Notion task'
    }
  }
}
