import mongoose from 'mongoose';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    // Check if mongoose is already connected
    if (mongoose.connection.readyState === 1) {
      this.isConnected = true;
      console.log('Database already connected');
      return;
    }

    // Check if mongoose is connecting
    if (mongoose.connection.readyState === 2) {
      console.log('Database is connecting, waiting...');
      await new Promise((resolve) => {
        mongoose.connection.on('connected', resolve);
        mongoose.connection.on('error', resolve);
      });
      this.isConnected = this.isConnectedToDatabase();
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      console.log('🔗 Connecting to MongoDB...');

      // Serverless-optimized connection options
      await mongoose.connect(mongoUri, {
        // Connection timeout settings
        serverSelectionTimeoutMS: 10000, // Increased for serverless
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        
        // Pool settings for serverless
        maxPoolSize: process.env.NODE_ENV === 'production' ? 5 : 10,
        minPoolSize: 0, // Allow connections to be closed when not needed
        maxIdleTimeMS: 30000,
        
        // Reliability settings
        retryWrites: true,
        w: 'majority',
        
        // Buffer settings for serverless
        bufferCommands: false,
      });

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Handle connection events (only register once)
      if (!mongoose.connection.listenerCount('error')) {
        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
          this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
          console.log('📤 MongoDB disconnected');
          this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
          console.log('🔄 MongoDB reconnected');
          this.isConnected = true;
        });
      }

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('📤 MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

export const database = Database.getInstance();
export default database;
