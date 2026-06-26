import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { Song } from '../../songs/schemas/song.schema';
import { ProfileType, VisibilityType } from './user.schema';

@ObjectType()
export class PublicPlaylist {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field()
  isPublic: boolean;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export enum LockedReason {
  PRIVATE = 'PRIVATE',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  LOGIN_REQUIRED = 'LOGIN_REQUIRED',
}

registerEnumType(LockedReason, {
  name: 'LockedReason',
  description: 'Why a profile section is not accessible to the viewer',
});

@ObjectType()
export class ProfileSectionAccess {
  @Field()
  key: string;

  @Field(() => VisibilityType)
  visibility: VisibilityType;

  @Field()
  canView: boolean;

  @Field(() => LockedReason, { nullable: true })
  lockedReason: LockedReason | null;
}

@ObjectType()
export class PublicUserProfile {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field({ nullable: true })
  username?: string;

  @Field(() => ProfileType)
  profileType: ProfileType;

  @Field({ nullable: true })
  profileImageUrl?: string;

  @Field({ nullable: true })
  profileImageThumbnailUrl?: string;

  @Field()
  isSelf: boolean;

  @Field()
  isFriend: boolean;

  @Field()
  isFollowing: boolean;

  @Field(() => ProfileSectionAccess)
  songs: ProfileSectionAccess;

  @Field(() => ProfileSectionAccess)
  playlists: ProfileSectionAccess;

  @Field(() => ProfileSectionAccess)
  likedSongs: ProfileSectionAccess;

  @Field(() => [Song])
  visibleSongs: Song[];

  @Field(() => [PublicPlaylist])
  visiblePlaylists: PublicPlaylist[];

  @Field(() => [Song])
  visibleLikedSongs: Song[];
}
