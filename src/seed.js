/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const karaokeSongs = [
  {
    userId: 'demo-user-karaoke',
    title: 'Morning Light',
    artist: 'Demo Band',
    source: 'youtube',
    sourcePath: 'https://www.youtube.com/watch?v=demo-morning-light',
    duration: 142,
    lyrics: [
      { timestamp: 0, text: 'Morning light is on the window' },
      { timestamp: 12, text: 'Coffee steam begins to rise' },
      { timestamp: 24, text: 'Every street is waking slowly' },
      { timestamp: 36, text: 'I can see the open skies' },
      { timestamp: 50, text: 'Step by step we find the rhythm' },
      { timestamp: 64, text: 'Every heartbeat keeps the time' },
      { timestamp: 82, text: 'Sing it out and start the day' },
    ],
  },
  {
    userId: 'demo-user-karaoke',
    title: 'City Rain',
    artist: 'Prototype Voices',
    source: 'local',
    sourcePath: '/uploads/karaoke/city-rain.mp3',
    duration: 168,
    lyrics: [
      { timestamp: 0, text: 'City rain taps on the pavement' },
      { timestamp: 14, text: 'Neon colors blur and shine' },
      { timestamp: 28, text: 'Every corner holds a story' },
      { timestamp: 42, text: 'Every shadow crosses mine' },
      { timestamp: 58, text: 'Hold the note and let it wander' },
      { timestamp: 74, text: 'Through the station and the square' },
      { timestamp: 92, text: 'We keep singing through the weather' },
      { timestamp: 112, text: 'There is music everywhere' },
    ],
  },
  {
    userId: 'demo-user-karaoke',
    title: 'Open Road Tonight',
    artist: 'Sample Session',
    source: 'youtube',
    sourcePath: 'https://www.youtube.com/watch?v=demo-open-road-tonight',
    duration: 186,
    lyrics: [
      { timestamp: 0, text: 'Pack a bag and close the doorway' },
      { timestamp: 16, text: 'Leave the porch light burning low' },
      { timestamp: 32, text: 'Maps are folded on the dashboard' },
      { timestamp: 48, text: 'There is nowhere we cannot go' },
      { timestamp: 66, text: 'Turn the wheel toward the moonlight' },
      { timestamp: 84, text: 'Let the chorus meet the breeze' },
      { timestamp: 104, text: 'On the open road tonight' },
    ],
  },
  {
    userId: 'demo-user-karaoke',
    title: 'Small Stage Smile',
    artist: 'Demo Choir',
    source: 'local',
    sourcePath: '/uploads/karaoke/small-stage-smile.mp3',
    duration: 154,
    lyrics: [
      { timestamp: 0, text: 'A tiny stage and paper lanterns' },
      { timestamp: 13, text: 'Friends are gathered near the door' },
      { timestamp: 26, text: 'Someone laughs before the intro' },
      { timestamp: 39, text: 'Then we ask for one song more' },
      { timestamp: 54, text: 'Raise your voice above the speakers' },
      { timestamp: 70, text: 'Clap along and keep the beat' },
      { timestamp: 88, text: 'Every smile becomes the spotlight' },
      { timestamp: 106, text: 'Every chorus feels complete' },
    ],
  },
];

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

    // --- Seed Karaoke Songs ---
    const karaokeSongsCollection = db.collection('karaokesongs');
    console.log('\nUpserting karaoke demo songs');

    const karaokeNow = new Date();
    const karaokeResults = await Promise.all(
      karaokeSongs.map((song) =>
        karaokeSongsCollection.updateOne(
          { sourcePath: song.sourcePath },
          {
            $set: {
              ...song,
              updatedAt: karaokeNow,
            },
            $setOnInsert: {
              createdAt: karaokeNow,
            },
          },
          { upsert: true },
        ),
      ),
    );

    const insertedKaraokeCount = karaokeResults.filter(
      (result) => result.upsertedCount > 0,
    ).length;
    const updatedKaraokeCount = karaokeResults.length - insertedKaraokeCount;
    console.log(
      `Upserted ${karaokeResults.length} karaoke songs (${insertedKaraokeCount} inserted, ${updatedKaraokeCount} updated)`,
    );

    const allKaraokeSongs = await karaokeSongsCollection
      .find({ userId: 'demo-user-karaoke' })
      .sort({ createdAt: -1 })
      .toArray();
    allKaraokeSongs.forEach((song) => {
      console.log(`  - ${song.title} by ${song.artist} (ID: ${song._id})`);
    });
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await client.close();
    console.log('\nDone!');
  }
}

seed();
