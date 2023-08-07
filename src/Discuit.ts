export type PostSort = 'hot' | 'latest' | 'activity' | 'day' | 'week' | 'month' | 'year';
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

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
  public debugging = true;
  public readonly userAgent = 'Autotldr Bot (v1.0.0)';
  public readonly baseUrl = 'https://discuit.net/api';
  public user: User | null;
  private csrfToken: string | null = null;
  private cookie: string | null = null;

  /**
   * Fetches a csrf token from the server.
   *
   * Also stores the token internally for future requests.
   */
  public getToken = async (): Promise<string | null> => {
    return await fetch(`${this.baseUrl}/_initial`).then((res) => {
      this.cookie = res.headers.get('set-cookie');
      if (this.debugging) {
        console.log(`Got cookies: "${this.cookie}"`);
      }
      this.csrfToken = this.formatToken(res.headers.get('csrf-token'));
      if (this.debugging) {
        console.log(`Got csrf token: "${this.csrfToken}"`);
      }

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
      if (!(await this.getToken())) {
        console.warn('Failed to get csrf token');
        return null;
      }
    }

    return await this.request('POST', '/_login', {
      username,
      password,
    })
      .then((res) => {
        if (res.status === 429) {
          throw new Error('Too many requests');
        } else if (res.status === 401) {
          throw new Error('Invalid username or password');
        } else if (res.status > 299) {
          throw new Error('Unknown error');
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
    return await this.request('POST', `/posts/${publicId}/comments?userGroup=normal`, {
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
    return await this.request('GET', `/posts?sort=${sort}&limit=${limit}`)
      .then((res) => res.json())
      .then((res) => {
        return res.posts;
      });
  };

  /**
   * Makes a request to the API.
   *
   * Automatically adds the csrf token and cookie to the request.
   *
   * @param method The request method.
   * @param path The request path.
   * @param body The request body.
   */
  private request = async (method: RequestMethod, path: string, body: any = null): Promise<any> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
      Referer: 'https://discuit.net/',
    };
    if (this.csrfToken) {
      headers['X-Csrf-Token'] = this.csrfToken;
    }
    if (this.cookie) {
      headers.Cookie = this.cookie;
    }

    const config: RequestInit = {
      method,
      headers,
    };
    if (method === 'POST' && body) {
      config.body = JSON.stringify(body);
    }

    if (this.debugging) {
      console.log(`Making ${method} request to ${this.baseUrl}${path}`, config);
    }

    return await fetch(`${this.baseUrl}${path}`, config).then((res) => {
      if (res.headers.get('set-cookie')) {
        this.cookie = res.headers.get('set-cookie');
        if (this.debugging) {
          console.log(`Got cookies: "${this.cookie}"`);
        }
      }
      if (res.headers.get('csrf-token')) {
        this.csrfToken = this.formatToken(res.headers.get('csrf-token'));
        if (this.debugging) {
          console.log(`Got csrf token: "${this.csrfToken}"`);
        }
      }

      return res;
    });
  };

  /**
   * Formats a csrf token.
   *
   * @param token The token to format.
   */
  private formatToken = (token: string | null): string => {
    if (!token) {
      return '';
    }

    return (
      token
        .split(',')
        .filter((v) => v.trim())
        .shift()
        ?.trim() || ''
    );
  };
}
