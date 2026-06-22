const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://rith_db_user:Ex6p0fyrXdJH3gr7@musicapp.el8kask.mongodb.net/music_db?appName=MusicApp';

async function checkKaraoke() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const docs = await db.collection('karaoke_songs').find({}).toArray();
    console.log(`Found ${docs.length} documents in karaoke_songs:`);
    for (const d of docs) {
      console.log(`- Title: "${d.title}", Artist: "${d.artist}", isPublic: ${d.isPublic}, userId: ${d.userId}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkKaraoke();
