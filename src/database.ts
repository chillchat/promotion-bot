import * as low from 'lowdb';
import * as FileAdapter from 'lowdb/adapters/FileSync';

interface Promotions {
  uid: string;
  name: string;
  description: string;
  url: string;
  image: string;
  mid: string;
}

interface Server {
  channel: string;
  promotions: Promotions[];
}

interface Database {
  [id: string]: Server;
}

export default low(new FileAdapter<Database>('./db.json'));
