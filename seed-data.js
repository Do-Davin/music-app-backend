/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('dotenv').config();

// Set DNS servers to Google's public DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is missing in .env file');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();
    console.log('Connected to MongoDB');

    // 1. Seed Users
    const usersCollection = db.collection('users');
    const userLikedSongsCollection = db.collection('userlikedsongs');
    const recentlyPlayedCollection = db.collection('recentlyplayeds');
    const friendshipsCollection = db.collection('friendships');
    await usersCollection.deleteMany({});
    await userLikedSongsCollection.deleteMany({});
    await recentlyPlayedCollection.deleteMany({});
    await friendshipsCollection.deleteMany({});
    console.log('Cleared users collection');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: hashedPassword,
        practiceGoals: { dailyMinutes: 30, weeklyDays: 5 },
        practiceStreak: {
          currentStreak: 5,
          longestStreak: 10,
          lastPracticeDate: new Date(),
        },
        preferences: { defaultBpm: 120, tuningHz: 440, instrument: 'Guitar' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'janedoe',
        email: 'jane@example.com',
        password: hashedPassword,
        practiceGoals: { dailyMinutes: 45, weeklyDays: 7 },
        practiceStreak: {
          currentStreak: 12,
          longestStreak: 15,
          lastPracticeDate: new Date(),
        },
        preferences: { defaultBpm: 100, tuningHz: 440, instrument: 'Piano' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const userResult = await usersCollection.insertMany(users);
    console.log(`Inserted ${userResult.insertedCount} users`);
    const seededUsers = await usersCollection.find().toArray();

    // 2. Seed Songs
    const songsCollection = db.collection('songs');
    await songsCollection.deleteMany({});
    console.log('Cleared songs collection');

    const songs = [
      {
        title: 'Wonderwall',
        artist: 'Oasis',
        albumName: "(What's the Story) Morning Glory?",
        duration: 258,
        key: 'F#m',
        tempo: 87,
        difficulty: 'beginner',
        tags: ['acoustic', 'classic rock'],
        videoUrl: 'https://www.youtube.com/watch?v=6hzrDeceEKc',
        lyrics: 'Today is gonna be the day...',
        chordNotationStyle: 'standard',
        isPublic: true,
        playCount: 150,
        userId: seededUsers[0]._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Hotel California',
        artist: 'Eagles',
        albumName: 'Hotel California',
        duration: 391,
        key: 'Bm',
        tempo: 74,
        difficulty: 'intermediate',
        tags: ['classic rock', 'guitar solo'],
        videoUrl: 'https://www.youtube.com/watch?v=09839DpTctU',
        lyrics: 'On a dark desert highway...',
        chordNotationStyle: 'standard',
        isPublic: true,
        playCount: 300,
        userId: seededUsers[0]._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        albumName: '÷',
        duration: 233,
        key: 'C#m',
        tempo: 96,
        difficulty: 'beginner',
        tags: ['pop', 'acoustic'],
        videoUrl: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
        lyrics: "The club isn't the best place to find a lover...",
        chordNotationStyle: 'standard',
        isPublic: true,
        playCount: 1200,
        userId: seededUsers[1]._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        albumName: 'A Night at the Opera',
        duration: 354,
        key: 'Bb',
        tempo: 72,
        difficulty: 'advanced',
        tags: ['rock', 'opera'],
        videoUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        lyrics: 'Is this the real life? Is this just fantasy?',
        chordNotationStyle: 'standard',
        isPublic: true,
        playCount: 500,
        userId: seededUsers[1]._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const songResult = await songsCollection.insertMany(songs);
    console.log(`Inserted ${songResult.insertedCount} songs`);
    const seededSongs = await songsCollection.find().toArray();

    // 3. Seed user relationship collections
    await userLikedSongsCollection.insertMany([
      {
        userId: seededUsers[0]._id,
        songId: seededSongs[0]._id,
        createdAt: new Date(),
      },
      {
        userId: seededUsers[0]._id,
        songId: seededSongs[1]._id,
        createdAt: new Date(),
      },
    ]);
    await recentlyPlayedCollection.insertMany([
      {
        userId: seededUsers[0]._id,
        songId: seededSongs[0]._id,
        playedAt: new Date(),
      },
      {
        userId: seededUsers[0]._id,
        songId: seededSongs[1]._id,
        playedAt: new Date(Date.now() - 86400000),
      },
    ]);
    await friendshipsCollection.insertOne({
      requesterId: seededUsers[0]._id,
      receiverId: seededUsers[1]._id,
      status: 'ACCEPTED',
      pairKey: [String(seededUsers[0]._id), String(seededUsers[1]._id)]
        .sort()
        .join(':'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Seed Playlists
    const playlistsCollection = db.collection('playlists');
    await playlistsCollection.deleteMany({});
    console.log('Cleared playlists collection');

    const playlists = [
      {
        name: 'Rock Classics',
        ownerId: seededUsers[0]._id,
        userId: seededUsers[0]._id,
        description: 'The best rock songs of all time',
        songIds: [seededSongs[0]._id, seededSongs[1]._id, seededSongs[3]._id],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Acoustic Vibes',
        ownerId: seededUsers[1]._id,
        userId: seededUsers[1]._id,
        description: 'Chilled acoustic tunes',
        songIds: [seededSongs[0]._id, seededSongs[2]._id],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const playlistResult = await playlistsCollection.insertMany(playlists);
    console.log(`Inserted ${playlistResult.insertedCount} playlists`);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.close();
  }
}

seed();
