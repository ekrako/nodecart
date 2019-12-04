const mongodb = require('mongodb');

const MongodbClient = mongodb.MongoClient;

let _db;

const mongoConnect = callback => {
  MongodbClient.connect(
    'mongodb+srv://ekrako:9K6wGtsVy5qqjIH@cluster0-ucojy.azure.mongodb.net/shop?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
    .then(client => {
      _db = client.db();
      console.log('MongoDb Connected');
      callback();
    })
    .catch(err => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No DB conncetion';
};
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
