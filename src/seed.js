/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const songs = [
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    albumName: '(What\'s the Story) Morning Glory?',
    duration: 258,
    key: 'F#m',
    tempo: 87,
    difficulty: 'beginner',
    tags: ['acoustic', 'classic rock'],
    fileUrl: null,
    videoUrl: 'https://www.youtube.com/watch?v=6hzrDeceEKc',
    coverImageUrl: null,
    lyrics: 'Today is gonna be the day...',
    chordNotationStyle: 'standard',
    isPublic: true,
    playCount: 0,
    lastPlayedAt: null,
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
    fileUrl: null,
    videoUrl: null,
    coverImageUrl: null,
    lyrics: 'On a dark desert highway...',
    chordNotationStyle: 'standard',
    isPublic: true,
    playCount: 0,
    lastPlayedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Blackbird',
    artist: 'The Beatles',
    albumName: 'The White Album',
    duration: 138,
    key: 'G',
    tempo: 96,
    difficulty: 'intermediate',
    tags: ['fingerpicking', 'acoustic'],
    fileUrl: null,
    videoUrl: null,
    coverImageUrl: null,
    lyrics: 'Blackbird singing in the dead of night...',
    chordNotationStyle: 'standard',
    isPublic: true,
    playCount: 0,
    lastPlayedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();

    // --- Seed Songs ---
    const songsCollection = db.collection('songs');
    await songsCollection.deleteMany({});
    console.log('Cleared existing songs');

    const songResult = await songsCollection.insertMany(songs);
    console.log(`Inserted ${songResult.insertedCount} songs`);

    const allSongs = await songsCollection.find({}).toArray();
    allSongs.forEach((song) => {
      console.log(`  - ${song.title} by ${song.artist} (ID: ${song._id})`);
    });

    // --- Seed Playlists ---
    const playlistsCollection = db.collection('playlists');
    await playlistsCollection.deleteMany({});
    console.log('\nCleared existing playlists');

    const songIdList = allSongs.map((s) => s._id);

    const playlists = [
      {
        name: 'Classic Rock Essentials',
        description: 'Best classic rock songs for practice',
        coverImageUrl: null,
        songIds: [songIdList[0], songIdList[1]],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Acoustic Practice',
        description: 'Songs for acoustic guitar practice',
        coverImageUrl: null,
        songIds: [songIdList[0], songIdList[2]],
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const playlistResult = await playlistsCollection.insertMany(playlists);
    console.log(`Inserted ${playlistResult.insertedCount} playlists`);

    const allPlaylists = await playlistsCollection.find({}).toArray();
    allPlaylists.forEach((pl) => {
      console.log(`  - ${pl.name} (${pl.songIds.length} songs) (ID: ${pl._id})`);
    });
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await client.close();
    console.log('\nDone!');
  }
}

seed();

