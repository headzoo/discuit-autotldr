import { ISeenChecker } from '@headz/discuit';
import { Redis } from './redis';

/**
 * Seen checker that uses Redis to keep track of which posts have been already been seen by the watch command.
 */
export class RedisSeenChecker implements ISeenChecker {
  /**
   * Constructor
   *
   * @param redis Redis client.
   */
  constructor(protected redis: Redis) {}

  /**
   * @inheritdoc
   */
  public add = async (id: string): Promise<void> => {
    await this.redis.set(`discuit-seen-checker-${id}`, '1');
  };

  /**
   * @inheritdoc
   */
  public isSeen = async (id: string): Promise<boolean> => {
    return (await this.redis.get(`discuit-seen-checker-${id}`)) === '1';
  };
}
