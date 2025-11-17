const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parkeasy');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create geospatial index
const createGeoIndex = async () => {
    try {
        // Connect to database
        await connectDB();
        
        // Get the collection
        const collection = mongoose.connection.db.collection('parkinglots');
        
        // Check existing indexes
        const existingIndexes = await collection.indexes();
        console.log('📋 Existing indexes:', existingIndexes.map(idx => idx.name).join(', '));
        
        // Create 2dsphere index on location field
        const indexResult = await collection.createIndex({ "location": "2dsphere" });
        console.log('✅ Created geospatial index:', indexResult);
        
        // Also create index on coordinates specifically for better performance
        const coordIndexResult = await collection.createIndex({ "location.coordinates": "2dsphere" });
        console.log('✅ Created coordinates index:', coordIndexResult);
        
        // Verify indexes were created
        const newIndexes = await collection.indexes();
        console.log('📋 Updated indexes:', newIndexes.map(idx => idx.name).join(', '));
        
        console.log('🎉 Geospatial indexes created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating geospatial index:', error);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('🔒 Database connection closed');
    }
};

// Run the index creation
createGeoIndex();