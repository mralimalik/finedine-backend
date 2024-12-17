import mongoose from "mongoose";

// const url = "mongodb://localhost:27017/finedinemenu";
// const url =
//   "mongodb+srv://sevun:sevun24@cluster0.qbwmf.mongodb.net/finedinemenu";
// const url = "mongodb+srv://sevun:sevun24@cluster0.qbwmf.mongodb.net/finedinemenu?ssl=true&retryWrites=true&w=majority";

// const url ="mongodb+srv://alimalikgamer:AliMalik646@cluster0.qbwmf.mongodb.net/finedinemenu?retryWrites=true&w=majority&appName=Cluster0"
// const url = "mongodb://alimalikgamer:AliMalik646@cluster0-shard-00-00.qbwmf.mongodb.net:27017,cluster0-shard-00-01.qbwmf.mongodb.net:27017,cluster0-shard-00-02.qbwmf.mongodb.net:27017/finedinemenu?ssl=true&replicaSet=atlas-10h8ht-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const connectDatabase = async () => {
  try {
    const url =  "mongodb+srv://sevun:sevun24@cluster0.qbwmf.mongodb.net/finedinemenu";
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 4500,
    };
    const instance = await mongoose.connect(url, options);
    console.log(`Database Connected `);
  } catch (e) {
    console.log(`Error connecting to data base ${e}`);
    process.exit(1);
  }
};

export default connectDatabase;
