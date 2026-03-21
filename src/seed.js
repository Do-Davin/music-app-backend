/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017/music_db';

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
    const collection = db.collection('songs');

    // Clear existing songs
    await collection.deleteMany({});
    console.log('Cleared existing songs');

    // Insert seed data
    const result = await collection.insertMany(songs);
    console.log(`Inserted ${result.insertedCount} songs`);

    // Print inserted songs
    const allSongs = await collection.find({}).toArray();
    allSongs.forEach((song) => {
      console.log(`  - ${song.title} by ${song.artist} (ID: ${song._id})`);
    });
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await client.close();
    console.log('Done!');
  }
}

seed();
