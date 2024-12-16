import mongoose from "mongoose";

// const url = "mongodb://localhost:27017/finedinemenu";
// const url ="mongodb+srv://alimalikgamer:AliMalik646@cluster0.qbwmf.mongodb.net/finedinemenu?retryWrites=true&w=majority&appName=Cluster0"
const url = "mongodb://alimalikgamer:AliMalik646@cluster0-shard-00-00.qbwmf.mongodb.net:27017,cluster0-shard-00-01.qbwmf.mongodb.net:27017,cluster0-shard-00-02.qbwmf.mongodb.net:27017/finedinemenu?ssl=true&replicaSet=atlas-10h8ht-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
// var url = "mongodb://alimalikgamer:AliMalik646@cluster0-shard-00-00.qbwmf.mongodb.net:27017,cluster0-shard-00-01.qbwmf.mongodb.net:27017,cluster0-shard-00-02.qbwmf.mongodb.net:27017/?ssl=true&replicaSet=atlas-10h8ht-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const connectDatabase = async () => {
  try {
    const instance = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
        console.log(`Database Connected `);
  } catch (e) {
    console.log(`Error connecting to data base ${e}`);
  }
};

export default connectDatabase;