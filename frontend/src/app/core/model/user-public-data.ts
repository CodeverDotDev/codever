import { Profile } from './user-data';
import { UsedTag } from './used-tag';

export interface UserPublicData {
  userId: string,
  publicProfile?: Profile,
  followers?: string[],
  topUsedPublicTags?:  UsedTag[]
}
