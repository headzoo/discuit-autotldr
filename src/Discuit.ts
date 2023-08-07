export type PostSort = 'hot' | 'latest' | 'activity' | 'day' | 'week' | 'month' | 'year';

export interface Link {
  url: string;
  hostname: string;
  image: {
    mimetype: string;
    width: number;
    height: number;
    size: number;
    averageColor: string;
    url: string;
  };
}

export interface Post {
  id: string;
  type: string;
  publicId: string;
  userId: string;
  username: string;
  userGroup: string;
  userDeleted: boolean;
  isPinned: boolean;
  communityId: string;
  communityName: string;
  communityProPic: any;
  communityBannerImage: any;
  title: string;
  body: string | null;
  link: Link | null;
  locked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
  upvotes: number;
  downvotes: number;
  hotness: number;
  createdAt: string;
  editedAt: string | null;
  lastActivityAt: string;
  deleted: boolean;
  deletedAt: string | null;
  deletedContent: boolean;
  noComments: number;
  commentsNext: string;
  userVoted: boolean;
  userVotedUp: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  emailConfirmedAt: string | null;
  aboutMe: string | null;
  points: number;
  isAdmin: boolean;
  noPosts: number;
  noComments: number;
  createdAt: string;
  deletedAt: string | null;
  bannedAt: string | null;
  isBan: boolean;
  notificationsNewCount: number;
  moddingList: null;
}

/**
 * Represents a Discuit client.
 */
export class Discuit {
  public user: User | null;
  private csrfToken: string | null = null;
  private cookie: string | null = null;

  /**
   * Fetches a csrf token from the server.
   *
   * Also stores the token internally for future requests.
   */
  public getToken = async (): Promise<string | null> => {
    return await fetch('https://discuit.net/api/_initial').then((res) => {
      this.cookie = res.headers.get('set-cookie');
      this.csrfToken = res.headers.get('csrf-token');

      return this.csrfToken;
    });
  };

  /**
   * Logs into the server.
   *
   * @param username The username.
   * @param password The password.
   */
  public login = async (username: string, password: string): Promise<User | null> => {
    if (!this.csrfToken || !this.cookie) {
      await this.getToken();
    }

    return await this.request('POST', '/api/_login', {
      username,
      password,
    })
      .then((res) => {
        if (res.status === 429) {
          throw new Error('Too many requests');
        } else if (res.status === 401) {
          throw new Error('Invalid username or password');
        }

        return res.json();
      })
      .then((res) => {
        if (!res.id) {
          return null;
        }

        this.user = res;

        return this.user;
      });
  };

  /**
   * Submits a comment.
   *
   * @param publicId The public id of the post.
   * @param body The comment body.
   * @param parentCommentId The id of the parent comment.
   */
  public postComment = async (
    publicId: string,
    body: string,
    parentCommentId: string | null = null,
  ): Promise<any> => {
    return await this.request('POST', `/api/posts/${publicId}/comments?userGroup=normal`, {
      body,
      parentCommentId,
    })
      .then((res) => res.json())
      .then((res) => {
        return res;
      });
  };

  /**
   * Fetches the latest posts.
   *
   * @param sort How to sort the posts.
   * @param limit The number of posts to fetch
   */
  public getPosts = async (sort: PostSort = 'latest', limit: number = 10): Promise<Post[]> => {
    return await this.request('GET', `/api/posts?sort=${sort}&limit=${limit}`)
      .then((res) => res.json())
      .then((res) => {
        return res.posts;
      });
  };

  /**
   *
   * @param method
   * @param url
   * @param body
   */
  private request = async (method: 'GET' | 'POST', url: string, body: any = null): Promise<any> => {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/',
      Referer: 'https://discuit.net/',
      'X-Csrf-Token': this.csrfToken || '',
      Cookie: this.cookie || '',
    };
    const config: any = {
      method,
      headers,
    };
    if (method === 'POST' && body) {
      config.body = JSON.stringify(body);
    }

    return await fetch(`https://discuit.net${url}`, config);
  };
}
