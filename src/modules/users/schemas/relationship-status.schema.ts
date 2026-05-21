import { Field, ObjectType } from '@nestjs/graphql';
import { ProfileType } from './user.schema';

@ObjectType()
export class RelationshipStatus {
  @Field(() => ProfileType)
  profileType: ProfileType;

  @Field()
  isFriend: boolean;

  @Field()
  hasIncomingFriendRequest: boolean;

  @Field()
  hasOutgoingFriendRequest: boolean;

  @Field()
  isFollowing: boolean;

  @Field()
  canAddFriend: boolean;

  @Field()
  canFollow: boolean;
}
