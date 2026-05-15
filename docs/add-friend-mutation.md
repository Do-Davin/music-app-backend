# Manual GraphQL Tests: User Relationships Refactor

Use these examples in GraphQL Playground at the backend GraphQL endpoint.

Protected operations require an Authorization header:

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

Use **User A token** when User A is performing the action. Use **User B token** when User B is performing the action.

## 1. Register Test Users

Register User A:

```graphql
mutation RegisterUserA {
  register(input: {
    username: "user_a_test"
    email: "user.a.test@example.com"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      _id
      username
      email
    }
  }
}
```

Register User B:

```graphql
mutation RegisterUserB {
  register(input: {
    username: "user_b_test"
    email: "user.b.test@example.com"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      _id
      username
      email
    }
  }
}
```

## 2. Login Test Users

Login User A:

```graphql
mutation LoginUserA {
  login(input: {
    email: "user.a.test@example.com"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      _id
      username
      email
    }
  }
}
```

Login User B:

```graphql
mutation LoginUserB {
  login(input: {
    email: "user.b.test@example.com"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      _id
      username
      email
    }
  }
}
```

## 3. Copy Access Token

After login, copy each returned `accessToken`.

For User A requests, set this header:

```json
{
  "Authorization": "Bearer USER_A_ACCESS_TOKEN"
}
```

For User B requests, set this header:

```json
{
  "Authorization": "Bearer USER_B_ACCESS_TOKEN"
}
```

## 4. Search Users

Use **User A token**. Search for User B and copy User B `_id`.

```graphql
query SearchUsers {
  searchUsers(search: "user_b_test") {
    _id
    username
    email
    profileImageUrl
  }
}
```

## 5. Send Friend Request

Use **User A token**. Replace `USER_B_ID` with User B `_id`.

```graphql
mutation SendFriendRequest {
  sendFriendRequest(userId: "USER_B_ID")
}
```

## 6. Check Outgoing Friend Requests

Use **User A token**.

```graphql
query OutgoingFriendRequests {
  outgoingFriendRequests(limit: 20, offset: 0) {
    _id
    username
    email
    profileImageUrl
  }
}
```

## 7. Check Incoming Friend Requests

Use **User B token**.

```graphql
query IncomingFriendRequests {
  incomingFriendRequests(limit: 20, offset: 0) {
    _id
    username
    email
    profileImageUrl
  }
}
```

## 8. Accept Friend Request

Use **User B token**. Replace `USER_A_ID` with User A `_id`.

```graphql
mutation AcceptFriendRequest {
  acceptFriendRequest(userId: "USER_A_ID")
}
```

## 9. Check My Friends

Use **User A token** or **User B token**. Both should now see the other user.

```graphql
query MyFriends {
  myFriends(limit: 20, offset: 0) {
    _id
    username
    email
    profileImageUrl
  }
}
```

## 10. Like Song

Use **User A token**. Replace `SONG_ID` with an existing song `_id`.

```graphql
mutation LikeSong {
  likeSong(songId: "SONG_ID")
}
```

## 11. Unlike Song

Use **User A token**. Replace `SONG_ID` with an existing song `_id`.

```graphql
mutation UnlikeSong {
  unlikeSong(songId: "SONG_ID")
}
```

## 12. Toggle Like Song

Use **User A token**. Running this once likes the song if it is not liked; running it again unlikes it.

```graphql
mutation ToggleLikeSong {
  toggleLikeSong(songId: "SONG_ID")
}
```

## 13. Get Liked Songs

Use **User A token**.

```graphql
query LikedSongs {
  likedSongs(limit: 20, offset: 0) {
    _id
    title
    artist
    albumName
    coverImageUrl
  }
}
```

## 14. Add Recently Played Song

Use **User A token**. Replace `SONG_ID` with an existing song `_id`.

```graphql
mutation AddRecentlyPlayed {
  addRecentlyPlayed(songId: "SONG_ID")
}
```

## 15. Get Recently Played Songs

Use **User A token**. The backend caps the maximum limit at 20.

```graphql
query RecentlyPlayed {
  recentlyPlayed(limit: 20) {
    songId
    playedAt
    song {
      _id
      title
      artist
      albumName
      coverImageUrl
    }
  }
}
```
