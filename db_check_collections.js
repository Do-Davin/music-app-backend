const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://rith_db_user:Ex6p0fyrXdJH3gr7@musicapp.el8kask.mongodb.net/music_db?appName=MusicApp';

async function checkCollections() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`- ${coll.name} (${count} documents)`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkCollections();
